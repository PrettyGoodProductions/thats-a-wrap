// Run with: node --test tests/
// Crew walk (src/walk.js): steps fitted to the trip, planted feet, stop-motion frames.
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../src/walk.js');
const { CFG, pose, stepsFor } = W;
// Ro's legs: the bottom outline of each boot from art/crew.ro.leg-*.json, relative to the hip joint inside the pelvis (puppet units)
const LEGS = {
  front: W.makeLeg([[-2.33, 18.11], [-1.2, 18.61], [-0.08, 18.61], [1.05, 18.61], [2.17, 18.86], [3.3, 18.86], [4.42, 18.86], [5.55, 18.74], [6.67, 18.49], [7.3, 18.11]]),
  back: W.makeLeg([[-5.92, 18.36], [-5.05, 18.86], [-4.17, 18.99], [-3.3, 19.11], [-2.42, 19.11], [-1.55, 19.11], [-0.67, 18.99], [0.2, 18.74], [1.08, 18.49], [1.45, 18.24]]),
};

test('steps are fitted to the trip: whole steps that land exactly on the mark', () => {
  for (const D of [5, 30, 77, 142, 260]) {
    const { n, L } = stepsFor(D);
    assert.equal(n, Math.max(1, Math.round(D / CFG.step)));
    assert.ok(Math.abs(n * L - D) < 1e-9);
    if (D > CFG.step) assert.ok(L > CFG.step * 0.75 && L < CFG.step * 1.34, `step ${L} for ${D}`);
  }
});

test('a trip starts and ends in the idle pose: feet under the hips, nothing lifted, no lean', () => {
  const D = 142; const { L } = stepsFor(D);
  for (const s of [0, D]) {
    const p = pose(s, D, L, LEGS);
    assert.ok(Math.abs(p.stanceDx) < 1e-9 && Math.abs(p.swingDx) < 1e-9);
    assert.ok(Math.abs(p.legFront.rot) < 1e-6 && Math.abs(p.legBack.rot) < 1e-6);
    assert.equal(p.legFront.lift + p.legBack.lift, 0);
    assert.ok(p.drop < 1e-9);
    assert.equal(p.lean, 0);
  }
});

test('the planted foot stays on its spot for the whole step while the body passes over it', () => {
  const D = 142; const { n, L } = stepsFor(D);
  const spots = {};
  for (let s = 0; s <= D; s += 0.25) {
    const p = pose(s, D, L, LEGS);
    const leg = p.frontPlanted ? LEGS.front : LEGS.back;
    const a = (p.frontPlanted ? p.legFront : p.legBack).rot * Math.PI / 180;
    const sole = leg.c * Math.cos(a) - leg.lg * Math.sin(a);       // sole center relative to the hip, puppet units
    (spots[p.step] = spots[p.step] || []).push(s + sole * CFG.scale); // set units along the trip
  }
  for (const [k, xs] of Object.entries(spots)) {
    const spread = Math.max(...xs) - Math.min(...xs);
    assert.ok(spread < 1e-6, `step ${k}: planted foot slid ${spread}`);
  }
  assert.equal(Object.keys(spots).length, n + 1); // half step in, n - 1 full steps, half step out
});

test('the planted leg alternates every step, its sole stays on the floor, and the other foot never goes through it', () => {
  const D = 96; const { L } = stepsFor(D);
  let last = null;
  for (let s = 0; s < D; s += L) {
    const p = pose(s + L * 0.3, D, L, LEGS);
    if (last !== null) assert.notEqual(p.frontPlanted, last);
    last = p.frontPlanted;
  }
  for (let s = 0; s <= D; s += 0.2) {
    const p = pose(s, D, L, LEGS);
    const st = p.frontPlanted ? [LEGS.front, p.legFront] : [LEGS.back, p.legBack];
    const sw = p.frontPlanted ? [LEGS.back, p.legBack] : [LEGS.front, p.legFront];
    // hip joint at 0, down is +; the floor is at each leg's lg
    assert.ok(Math.abs(p.drop + W.soleLow(st[0], st[1].rot) - st[0].lg) < 1e-9, 'planted sole on the floor');
    assert.ok(p.drop + W.soleLow(sw[0], sw[1].rot) - sw[1].lift <= sw[0].lg + 1e-9, 'advancing sole clears the floor');
  }
});

test('the swing is small, the advancing foot lifts a little, the bob stays subtle', () => {
  const D = 200; const { L } = stepsFor(D);
  let maxRot = 0, maxLift = 0, maxDrop = 0, maxArm = 0;
  for (let s = 0; s <= D; s += 0.5) {
    const p = pose(s, D, L, LEGS);
    maxRot = Math.max(maxRot, Math.abs(p.legFront.rot), Math.abs(p.legBack.rot));
    maxLift = Math.max(maxLift, p.legFront.lift, p.legBack.lift);
    maxDrop = Math.max(maxDrop, p.drop);
    maxArm = Math.max(maxArm, Math.abs(p.armFront), Math.abs(p.armBack));
  }
  assert.ok(maxRot > 8 && maxRot < 16, `leg swing ${maxRot.toFixed(1)} deg`);
  assert.ok(maxLift > 0.8 && maxLift <= CFG.lift + 0.6, `lift ${maxLift}`);
  assert.ok(Math.abs(maxDrop) < 1.2, `bob ${maxDrop}`);
  assert.ok(maxArm > 3 && maxArm < 8, `arm swing ${maxArm}`);
});

// A walker on a stand-in element: just enough DOM for style, classes and one flip group
function fakePup() {
  const cls = new Set();
  const flip = { a: {}, setAttribute(n, v) { this.a[n] = v; } };
  return { style: {}, flip, classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), has: (c) => cls.has(c) }, querySelector: (sel) => (sel === '.flip' ? flip : null) };
}

test('a walker moves at walking speed in stop-motion frames and stops exactly on the mark', () => {
  const el = fakePup();
  const w = W.create(el, { x: 28, y: 330 });
  w.goTo(104, 210);
  assert.ok(el.classList.has('walking'));
  const D = Math.hypot(76, 120);
  const positions = [];
  let t = 0;
  while (w.moving && t < 20) { if (w.tick(1 / 60)) positions.push([w.x, w.y]); t += 1 / 60; }
  assert.equal(w.x, 104); assert.equal(w.y, 210);
  assert.ok(!el.classList.has('walking'));
  assert.ok(Math.abs(t - D / CFG.speed) < 0.1, `took ${t.toFixed(2)} s for ${D.toFixed(0)} units`);
  // four stop-motion frames per step, evenly spaced, the last one on the mark
  const { n, L } = stepsFor(D);
  assert.equal(positions.length, n * CFG.frames + 1);
  const d = positions.slice(1).map((p, i) => Math.hypot(p[0] - positions[i][0], p[1] - positions[i][1]));
  for (const x of d) assert.ok(Math.abs(x - L / CFG.frames) < 1e-6);
  assert.equal(el.style.transform, 'translate(104px, 210px)');
});

test('walkers face where they go, hold still when paused, and snap tiny moves', () => {
  const el = fakePup();
  const w = W.create(el, { x: 200, y: 300 });
  w.goTo(60, 300);
  assert.equal(el.flip.a.transform, 'scale(-1 1)');
  w.tick(0.2); const x = w.x;
  w.tick(0); w.tick(0);
  assert.equal(w.x, x, 'no game time, no movement');
  while (w.moving) w.tick(0.05);
  w.goTo(250, 300);
  assert.equal(el.flip.a.transform, '');
  while (w.moving) w.tick(0.05);
  w.goTo(250.5, 300.5);
  assert.ok(!w.moving); assert.equal(w.x, 250.5);
});
