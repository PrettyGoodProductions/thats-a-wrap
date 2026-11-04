// The crew walk (src/walk.js): steps match distance, the planted foot does not slide, walks land on their mark.
const test = require('node:test');
const assert = require('node:assert/strict');
const W = require('../src/walk.js');

const RAD = Math.PI / 180;
// Ro's legs: the hip joints sit at different heights, and each foot reaches further one way than the other
const LEGS = { front: 21.56, back: 22, frontFoot: { heel: 3.96, toe: 7.79 }, backFoot: { heel: 6.87, toe: 3.13 } };
const HIPX = { front: 3.8, back: -4 };

// Where a foot centre is on the set at pose k
function footAt(w, k, side) {
  const p = W.pose(w, k), pos = W.position(w, k), leg = side === 'front' ? p.legFront : p.legBack, L = LEGS[side];
  const dir = w.dx < 0 ? -1 : 1;   // walking left, the puppet is mirrored
  return { x: pos.x + dir * W.WALK.scale * (HIPX[side] - L * Math.sin(leg.a * RAD)), planted: leg.planted };
}

test('a walk lands exactly on its mark and ends standing at the passing pose', () => {
  for (const to of [{ x: 104, y: 210 }, { x: -60, y: 330 }, { x: 28, y: 400 }, { x: 31, y: 330 }]) {
    const w = W.plan({ x: 28, y: 330 }, to, LEGS);
    assert.deepEqual(W.position(w, w.frames), { x: to.x, y: to.y });
    const last = W.pose(w, w.frames);
    assert.ok(Math.abs(last.legFront.a) < 1e-9 && Math.abs(last.legBack.a) < 1e-9, 'legs straight at the end');
  }
});

test('step count follows distance, so feet keep pace with travel', () => {
  const short = W.plan({ x: 0, y: 0 }, { x: 30, y: 0 }, LEGS), long = W.plan({ x: 0, y: 0 }, { x: 150, y: 0 }, LEGS);
  const per = w => w.D / w.n;
  assert.ok(long.n > short.n * 3, `${long.n} steps against ${short.n}`);
  assert.ok(Math.abs(per(short) - per(long)) < W.naturalStep(LEGS) * 0.35, 'stride stays near natural');
  assert.equal(W.plan({ x: 0, y: 0 }, { x: 0.5, y: 0 }, LEGS), null, 'no walk for a nudge');
});

test('the planted foot does not slide while it carries the body, either direction', () => {
  for (const dx of [80, -80]) {
    const w = W.plan({ x: 100, y: 300 }, { x: 100 + dx, y: 300 }, LEGS);
    for (let k = 0; k < w.frames; k++) for (const side of ['front', 'back']) {
      const a = footAt(w, k, side), b = footAt(w, k + 1, side);
      if (a.planted && b.planted) assert.ok(Math.abs(b.x - a.x) < 0.02, `pose ${k} ${side} slid ${Math.abs(b.x - a.x).toFixed(3)}`);
    }
  }
});

test('travel into the scene happens only when a foot lands', () => {
  const w = W.plan({ x: 28, y: 330 }, { x: 104, y: 210 }, LEGS);
  for (let k = 0; k < w.frames; k++) {
    const moved = W.position(w, k + 1).y !== W.position(w, k).y;
    assert.equal(moved, W.contactsAt(k + 1) !== W.contactsAt(k), `pose ${k + 1}`);
  }
});

test('swing is smaller than before, the advancing foot lifts a little, the hips dip a little', () => {
  const w = W.plan({ x: 0, y: 0 }, { x: 120, y: 0 }, LEGS);
  let maxA = 0, maxLift = 0, maxDrop = 0;
  for (let k = 0; k <= w.frames; k++) {
    const p = W.pose(w, k);
    maxA = Math.max(maxA, Math.abs(p.legFront.a), Math.abs(p.legBack.a));
    for (const l of [p.legFront, p.legBack]) if (!l.planted) maxLift = Math.max(maxLift, l.lift);
    maxDrop = Math.max(maxDrop, p.drop);
  }
  assert.ok(maxA <= 17 && maxA >= 10, `swing ${maxA.toFixed(1)} degrees`);
  assert.ok(maxLift > 0.8 && maxLift < 3, `lift ${maxLift.toFixed(2)}`);
  assert.ok(maxDrop > 0.2 && maxDrop < 1.2, `hip dip ${maxDrop.toFixed(2)}`);
});
