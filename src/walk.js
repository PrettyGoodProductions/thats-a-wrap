/*
  Crew walking: one place for the gait, used by the game (src/ui.js), the art bench (tools/lab.html) and the tests.

  Steps are driven by distance, not by a timer. A walk is split into whole steps of about one natural stride, and each
  step is drawn as WALK.posesPerStep held poses (stop-motion, no tweening). The body moves only when the pose changes.

    Left-right travel is carried by the legs: the planted leg rotates exactly as far as the body moves, so the
    supporting foot stays on its spot on the floor while it carries the body.
    Travel up or down the set (into or out of the scene) happens only on the contact pose, as the new foot lands.
    A straight leg cannot carry depth, so the body steps into depth with each footfall instead of sliding.

  Each leg uses its own length (the hip joints sit at different heights). A rotated straight leg would push its heel or
  toe corner into the floor, so each leg is raised just enough to keep its lowest corner on the floor: the front foot
  lands on its heel, the back foot pushes off its toe. The advancing foot lifts a little at the passing pose. The hips
  dip at contact so the planted foot stays on the floor with straight legs. The arms swing gently against the legs, and the upper body leans slightly into the walk.
  A walk starts and ends on the passing pose, then the puppet settles into its idle stance.

  Puppet units: feet at y 0, facing right. Set units: the puppet is drawn at WALK.scale on the set.
*/
(function (root) {
  'use strict';

  const WALK = {
    speed: 66,         // set units per second at 1x game speed
    swing: 14,         // degrees each leg reaches forward or back at a natural stride
    posesPerStep: 2,   // contact, passing: about 10 held poses a second at this speed
    lift: 1.3,         // puppet units the advancing foot lifts at the passing pose
    arm: 7,            // degrees the arms swing at full stride, opposite the legs
    lean: 1.5,         // degrees the upper body leans into the walk
    scale: 1.25,       // puppet size on the set (the .pup scale)
    legDefault: 21.8,  // leg length in puppet units when a puppet has no hip joint to read it from
  };
  const RAD = Math.PI / 180;

  // A natural step on the set for a leg of this length, in set units
  const legOf = (legL) => (typeof legL === 'object' && legL ? Math.min(legL.front, legL.back) : legL || WALK.legDefault);
  const naturalStep = (legL) => 2 * legOf(legL) * Math.sin(WALK.swing * RAD) * WALK.scale;

  // Plan a walk from one mark to another (set units). null when there is nowhere to go.
  // legL: one length for both legs, or { front, back, ... } from parts(). Feet extents (heel, toe) come along with it.
  function plan(from, to, legL) {
    const legs = typeof legL === 'object' && legL ? legL : { front: legL || WALK.legDefault, back: legL || WALK.legDefault };
    const L = Math.min(legs.front, legs.back);
    const dx = to.x - from.x, dy = to.y - from.y;
    const D = Math.hypot(dx, dy);
    if (D < 1) return null;
    const n = Math.max(1, Math.round(D / naturalStep(L)));
    const Sp = Math.abs(dx) / n / WALK.scale;          // the left-right part of one step, in puppet units
    return {
      fx: from.x, fy: from.y, tx: to.x, ty: to.y, dx, dy, D, n, L, Sp, legs,
      S: D / n,                                          // one step along the path, in set units
      frames: n * WALK.posesPerStep,
      A: Math.asin(Math.min(0.95, Sp / (2 * L))),        // the widest leg angle in this walk, radians
      d: 0, k: -1,
    };
  }

  // Distance along the path at which pose k starts, and the body's position on the set at pose k
  const frameLen = (w) => w.S / WALK.posesPerStep;
  const contactsAt = (k) => Math.floor(k / WALK.posesPerStep + 0.5 + 1e-9);   // feet landed by pose k
  function position(w, k) {
    return { x: +(w.fx + w.dx * k / w.frames).toFixed(2), y: +(w.fy + w.dy * contactsAt(k) / w.n).toFixed(2) };
  }

  // Joint angles (degrees) and offsets (puppet units) for pose k, 0..frames. Pose 0 and the last pose are passing.
  function pose(w, k) {
    const phase = k / WALK.posesPerStep + 0.5;           // in steps: .5 is passing, whole numbers are contact
    const i = Math.floor(phase + 1e-9), f = phase - i;
    const lift = WALK.lift * Math.sin(Math.PI * f);     // the advancing foot, highest at passing
    const frontStance = i % 2 === 1;                     // the back leg plants first, the front leg steps out first
    const legs = w.legs || { front: w.L, back: w.L };
    // The planted leg's foot stays put while the body passes over it: its angle follows the body, for its own length
    const angle = (len, sign) => sign * Math.asin(Math.max(-0.99, Math.min(0.99, (f - 0.5) * w.Sp / len))) / RAD;
    // How far a rotated leg's lowest corner would go below its foot centre (heel when reaching forward, toe when behind)
    const dip = (side, a) => {
      const ft = legs[side + 'Foot'];
      if (!ft) return 0;
      return a > 0 ? ft.toe * Math.sin(a * RAD) : ft.heel * Math.sin(-a * RAD);
    };
    const leg = (side, stance) => {
      const a = angle(legs[side], stance ? 1 : -1);
      const len = legs[side];
      // Raise the leg so its lowest corner touches the floor, against the hip dip below (which uses the planted leg)
      return { a, lift: (stance ? 0 : lift) + dip(side, a), planted: stance, len };
    };
    const lf = leg('front', frontStance), lb = leg('back', !frontStance);
    const st = frontStance ? lf : lb;
    const aSt = st.a;
    // Arms swing against the legs. A walk straight up or down the set has no leg swing, so the arms follow the lift.
    const sway = (frontStance ? 1 : -1) * WALK.arm * 0.6 * Math.sin(Math.PI * f);
    const full = w.A / RAD;
    return legFix({
      legFront: lf, legBack: lb,
      armFront: full ? -lf.a / full * WALK.arm : sway,
      armBack: full ? lf.a / full * WALK.arm : -sway,
      lean: WALK.lean,
      drop: st.len * (1 - Math.cos(aSt * RAD)),         // hips dip at contact so the planted foot stays on the floor
    });
  }
  function legFix(ps) {
    for (const side of ['legFront', 'legBack']) {
      const l = ps[side];
      l.lift += l.len * (1 - Math.cos(l.a * RAD)) - ps.drop;   // 0 for the planted leg, a hair for the other
    }
    return ps;
  }

  /* ---------- Applying poses to a puppet's DOM (browser only) ---------- */

  // The parts of a puppet group (.pup) that the walk moves. rigged is false for code-drawn puppets.
  function parts(g) {
    const q = (sel) => g.querySelector(sel);
    const p = { rig: q('.wl-rig'), legF: q('.wl-r-leg-front'), legB: q('.wl-r-leg-back'), armF: q('.wl-r-arm-front'),
      armB: q('.wl-r-arm-back'), upper: q('.wl-upper'), body: q('.bodyg') };
    p.rigged = !!(p.rig && p.legF && p.legB);
    // Each leg's length is its hip joint's height (feet are at y 0 in puppet units). Its foot reaches `heel` behind and
    // `toe` in front of the joint, measured from the leg art's bounds.
    const leg = (el) => {
      const o = el && /(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(el.style.transformOrigin || '');
      if (!o) return null;
      const jx = parseFloat(o[1]);
      let foot = null;
      try { const b = el.getBBox(); if (b.width > 0) foot = { heel: Math.max(0, jx - b.x), toe: Math.max(0, b.x + b.width - jx) }; } catch (e) { /* not rendered yet */ }
      return { len: Math.abs(parseFloat(o[2])), foot };
    };
    const lf = leg(p.legF), lb = leg(p.legB);
    p.legL = lf && lb ? { front: lf.len, back: lb.len, frontFoot: lf.foot, backFoot: lb.foot } : 13;
    return p;
  }

  const tf = (el, t) => { if (el && el._tf !== t) { el._tf = t; el.style.transform = t; } };
  function apply(p, ps) {
    if (p.rigged) {
      tf(p.legF, `translateY(${(-ps.legFront.lift).toFixed(2)}px) rotate(${ps.legFront.a.toFixed(2)}deg)`);
      tf(p.legB, `translateY(${(-ps.legBack.lift).toFixed(2)}px) rotate(${ps.legBack.a.toFixed(2)}deg)`);
      tf(p.armF, `rotate(${ps.armFront.toFixed(2)}deg)`);
      tf(p.armB, `rotate(${ps.armBack.toFixed(2)}deg)`);
      tf(p.upper, `rotate(${ps.lean}deg)`);
      tf(p.rig, `translateY(${ps.drop.toFixed(2)}px)`);
    } else {
      // Code-drawn puppets have no joints: a small hop on each passing pose
      tf(p.body, `translateY(${(-0.9 * Math.max(ps.legFront.lift, ps.legBack.lift) / WALK.lift).toFixed(2)}px)`);
    }
  }
  function clear(p) { for (const el of [p.legF, p.legB, p.armF, p.armB, p.upper, p.rig, p.body]) tf(el, ''); }

  // Advance a walk by a distance (set units). Returns { pose, pos } when the pose changes, 'done' once the last pose
  // has been held for one pose's length, or null when nothing changed.
  function advance(w, dist) {
    w.d += dist;
    if (w.d >= w.D + frameLen(w)) return 'done';
    const k = Math.min(w.frames, Math.floor(w.d / frameLen(w) + 1e-9));
    if (k === w.k) return null;
    w.k = k;
    return { k, pose: pose(w, k), pos: position(w, k) };
  }

  const api = { WALK, plan, pose, position, advance, parts, apply, clear, naturalStep, contactsAt };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapWalk = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
