/*
  Crew walking: a paper puppet stepping across the set in deliberate stop-motion frames.

  How it works
    - Steps are fitted to the trip. A trip of D set units takes round(D / STEP) steps, each stretched a little so
      the last one lands exactly on the mark. Speed is fixed, so a long trip is more steps, never faster legs.
    - The legs are straight and turn at the hip, so the planted foot is solved from where the hip is: it stays on
      its spot on the floor for the whole step while the body passes over it. The hip rises and falls by exactly
      what keeps that sole on the floor, which is also the bob. The advancing foot swings through with a small lift.
    - A trip starts and ends at mid-stance with both feet under the hips, which is the idle pose, so starting and
      stopping never pop.
    - Everything (position and pose) changes only on stop-motion frames, four per step (contact, down, passing,
      up), so frame rate follows walking speed. Between frames the puppet holds still, like a puppet animated by hand.
    - The planted boot keeps its sole center on one spot and its lowest corner on the floor (it rolls heel to
      toe rather than sinking), using each leg's sole from its settings file.

  The engine still decides where everyone should be. This only draws the trip there.
*/
(function (root) {
  'use strict';

  const CFG = {
    speed: 46,      // set units per game second
    step: 12,       // set units per step (one foot), stretched per trip to land on the mark
    frames: 4,      // stop-motion poses per step: contact, down, passing, up
    lift: 1.3,      // how high the advancing foot clears the floor at passing, puppet units
    arm: 0.45,      // arm swing as a share of the opposite leg's swing
    lean: 2.5,      // forward lean of the upper body while walking, degrees
    scale: 1.25,    // puppet units to set units (the set draws puppets at scale 1.25)
    minTrip: 1.5,   // shorter moves just snap
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const DEG = 180 / Math.PI;
  const r2 = (n) => Math.round(n * 100) / 100;

  /*
    A leg: pts = points along the bottom of the boot relative to the hip joint (puppet units, y down), from the
    leg's settings. c is the middle of the sole, lg the hip joint's height above the floor when standing.
  */
  function makeLeg(pts) {
    const lg = Math.max(...pts.map(p => p[1]));
    const xs = pts.map(p => p[0]);
    return { pts, lg, c: (Math.min(...xs) + Math.max(...xs)) / 2 };
  }
  const DEFAULT_LEG = makeLeg([[-2.5, 21], [2.5, 21]]);

  // Turn a leg so its sole center sits dx (puppet units) ahead of where it stands at rest
  function legAngle(leg, dx) {
    const R = Math.hypot(leg.c, leg.lg);
    const phi = Math.atan2(leg.lg, leg.c);
    return (Math.acos(clamp((leg.c + dx) / R, -1, 1)) - phi) * DEG;
  }
  // How far below the hip the lowest point of the boot hangs at angle a (degrees)
  function soleLow(leg, a) {
    const r = a / DEG, sn = Math.sin(r), cs = Math.cos(r);
    let low = -Infinity;
    for (const [x, y] of leg.pts) low = Math.max(low, x * sn + y * cs);
    return low;
  }

  /*
    Pose after walking s of a trip of length D (both set units) with steps of length L (set units).
    legs: { front, back } as above. Angles in degrees, positive turns the foot backward (SVG clockwise, puppet
    facing right). The planted sole keeps its center on one spot of the floor and its lowest corner on the floor,
    so it rolls from heel to toe instead of sinking. The advancing foot always clears the floor.
  */
  function pose(s, D, L, legs) {
    legs = legs || {};
    const lf = legs.front || DEFAULT_LEG, lb = legs.back || DEFAULT_LEG;
    const u0 = (s + L / 2) / L;            // phase 0.5 at s = 0 and at s = D: feet together, the idle pose
    const k = Math.floor(u0 + 1e-9);
    const u = u0 - k;
    const half = L / 2 / CFG.scale;         // half a step, puppet units
    const stanceDx = half - u * 2 * half;   // planted foot relative to the hip: ahead, under, behind
    const e = u * u * (3 - 2 * u);
    const swingDx = -half + e * 2 * half;   // advancing foot: behind, under, ahead
    const ramp = clamp(Math.min(s, D - s) / (L / 2), 0, 1);
    const frontPlanted = k % 2 === 0;
    const stanceLeg = frontPlanted ? lf : lb, swingLeg = frontPlanted ? lb : lf;
    const aStance = legAngle(stanceLeg, stanceDx);
    const aSwing = legAngle(swingLeg, swingDx);
    const drop = stanceLeg.lg - soleLow(stanceLeg, aStance);
    const clear = soleLow(swingLeg, aSwing) + drop - swingLeg.lg;  // > 0 would put the swing foot in the floor
    const lift = Math.max(CFG.lift * Math.sin(Math.PI * u) * ramp, clear, 0);
    const front = frontPlanted ? { rot: aStance, lift: 0 } : { rot: aSwing, lift };
    const back = frontPlanted ? { rot: aSwing, lift } : { rot: aStance, lift: 0 };
    return {
      step: k, u, frontPlanted, drop,
      legFront: front, legBack: back,
      armFront: -back.rot * CFG.arm,        // arms swing with the opposite leg, relaxed
      armBack: -front.rot * CFG.arm,
      lean: CFG.lean * ramp,
      stanceDx, swingDx,
    };
  }

  // Fit steps to a trip: whole steps, each as close to CFG.step as possible
  function stepsFor(D) {
    const n = Math.max(1, Math.round(D / CFG.step));
    return { n, L: D / n };
  }

  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /*
    One walker per puppet group (.pup). goTo() sets a new mark, tick(dt) advances by dt game seconds.
    The puppet group keeps its translate in style.transform, as before.
  */
  function create(el, at) {
    const q = (sel) => el.querySelector(sel);
    const rig = q('.wl-rig');
    const parts = rig ? {
      legFront: q('.wl-r-leg-front'), legBack: q('.wl-r-leg-back'),
      armFront: q('.wl-r-arm-front'), armBack: q('.wl-r-arm-back'), upper: q('.wl-upper'),
    } : null;
    const legOf = (g) => {
      const v = g && g.getAttribute('data-sole');
      if (!v) { const lg = rig ? parseFloat(rig.getAttribute('data-leg')) || 21 : 21; return makeLeg([[-2.5, lg], [2.5, lg]]); }
      return makeLeg(v.split(' ').map(p => p.split(',').map(Number)));
    };
    const legs = parts ? { front: legOf(parts.legFront), back: legOf(parts.legBack) } : null;
    const body = q('.bodyg');
    const flip = q('.flip');
    const w = {
      x: at.x, y: at.y, from: null, to: null, D: 0, L: CFG.step, clock: 0, frame: -1, moving: false, facing: 1,
      goTo, tick, place, state: () => ({ x: w.x, y: w.y, moving: w.moving, facing: w.facing, frame: w.frame, D: w.D, L: w.L, step: w.lastPose ? w.lastPose.step : null, planted: w.lastPose ? (w.lastPose.frontPlanted ? 'front' : 'back') : null }),
    };

    function place() { el.style.transform = `translate(${r2(w.x)}px, ${r2(w.y)}px)`; }

    function apply(p) {
      w.lastPose = p;
      if (parts) {
        const leg = (n, v) => { if (parts[n]) parts[n].style.transform = `translate(0px, ${r2(-v.lift)}px) rotate(${r2(v.rot)}deg)`; };
        leg('legFront', p.legFront); leg('legBack', p.legBack);
        if (parts.armFront) parts.armFront.style.transform = `rotate(${r2(p.armFront)}deg)`;
        if (parts.armBack) parts.armBack.style.transform = `rotate(${r2(p.armBack)}deg)`;
        if (parts.upper) parts.upper.style.transform = `rotate(${r2(p.lean)}deg)`;
        rig.style.transform = `translate(0px, ${r2(p.drop)}px)`;
      } else if (body) {
        // code-drawn puppets have no legs to pose: a small hop on each step
        body.style.transform = `translate(0px, ${r2(-0.9 * Math.sin(Math.PI * p.u) * Math.min(1, p.lean / CFG.lean))}px)`;
      }
    }
    function rest() {
      w.lastPose = null;
      if (parts) { for (const k of Object.keys(parts)) if (parts[k]) parts[k].style.transform = ''; rig.style.transform = ''; }
      else if (body) body.style.transform = '';
    }

    function goTo(x, y) {
      if (w.to && w.to.x === x && w.to.y === y) return;
      if (!w.to && w.x === x && w.y === y) return;
      const D = Math.hypot(x - w.x, y - w.y);
      if (D < CFG.minTrip) { w.x = x; w.y = y; w.to = null; place(); return; }
      if (Math.abs(x - w.x) > 2) {
        w.facing = x < w.x ? -1 : 1;
        if (flip) flip.setAttribute('transform', w.facing < 0 ? 'scale(-1 1)' : '');
      }
      w.from = { x: w.x, y: w.y };
      w.to = { x, y };
      w.D = D;
      w.L = stepsFor(D).L;
      w.clock = 0;
      w.frame = -1;
      w.moving = true;
      el.classList.add('walking');
    }

    function tick(dt) {
      if (!w.moving) return false;
      w.clock += dt;
      // one stop-motion frame every quarter step, so each step shows the same four poses and the trip ends on one
      const per = w.L / CFG.frames;
      const frame = Math.min(Math.round(w.D / per), Math.floor((w.clock * CFG.speed) / per + 1e-9));
      if (frame === w.frame) return false;
      w.frame = frame;
      const s = Math.min(w.D, frame * per);
      const f = s / w.D;
      w.x = w.from.x + (w.to.x - w.from.x) * f;
      w.y = w.from.y + (w.to.y - w.from.y) * f;
      place();
      if (s >= w.D) {
        w.x = w.to.x; w.y = w.to.y; w.to = null; w.moving = false;
        place(); rest();
        el.classList.remove('walking');
        return true;
      }
      if (!reduced()) apply(pose(s, w.D, w.L, legs));
      return true;
    }

    place();
    return w;
  }

  const api = { CFG, pose, stepsFor, create, legAngle, soleLow, makeLeg };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapWalk = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
