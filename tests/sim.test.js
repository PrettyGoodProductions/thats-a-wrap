// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/sim.js');
const { burgerJob, company } = require('../data/burger-job.js');

const TPS = S.TPS;
// Exact-timing tests switch off walking, pauses, handoffs (physical) and take review
const make = (opts) => S.createGame(burgerJob, Object.assign({ physical: false, review: false }, opts || {}));
const fresh = () => make();
const secs = n => Math.round(n * TPS);
const runUntil = (st, pred, max = 5000) => { let i = 0; while (!pred(st) && !st.over && i++ < max) S.tick(st); return pred(st); };
const clone = obj => JSON.parse(JSON.stringify(obj));
// Ticks and calls ACTION when ready, but leaves chaos decisions alone. Stops when pred is true.
const playUntil = (st, pred, max = 5000) => {
  let i = 0;
  while (!pred(st) && !st.over && !st.pending && i++ < max) {
    S.tick(st);
    const c = S.stageCandidate(st);
    if (c && !st.capture && S.readiness(st, c).ready) S.command(st, { type: 'action' });
  }
  return pred(st);
};

// Plays the level like a patient player: calls ACTION the moment a shot is ready,
// and answers chaos with the given option (default: fix it).
function autoPlay(st, onTick, choice) {
  let guard = 0;
  while (!st.over && guard++ < 10000) {
    if (st.pending) S.command(st, { type: 'choose', option: choice || 'fix' });
    if (st.review) S.command(st, { type: 'accept' });
    S.tick(st);
    if (onTick) onTick(st);
    const c = S.stageCandidate(st);
    if (c && S.readiness(st, c).ready && !st.capture) S.command(st, { type: 'action' });
  }
  return st;
}

// Soft-lock guard: if nobody is working and nobody can pick work, the shot must be ready (or rolling, or wrapped).
function assertNoSoftLock(st) {
  if (st.over || st.capture || st.pending || st.review || st.waits.length) return;
  if (st.crew.some(c => c.move > 0 || c.pause > 0 || c.recover > 0)) return;
  if (Object.values(st.tasks).some(t => !t.done && t.readyAt > st.ticks)) return;
  if (st.crew.some(c => c.task)) return;
  if (S.anyAvailableWork(st)) return;
  const c = S.stageCandidate(st);
  assert.ok(c && S.readiness(st, c).ready, `Soft-lock at ${S.seconds(st)}s: nobody working and ${c} is not ready`);
}

/* ---------- Level data ---------- */

test('burger job data is valid', () => {
  assert.deepEqual(S.validateLevel(burgerJob), []);
});

test('validation catches cycles, unknown deps and missing departments', () => {
  const bad = clone(burgerJob);
  bad.shots[0].tasks[0].needs = ['hero.frame'];          // set -> frame -> place -> set
  bad.shots[1].tasks[0].needs = ['nope'];
  bad.shots[2].tasks[0].dept = 'catering';
  const errs = S.validateLevel(bad).join('\n');
  assert.match(errs, /cycle/i);
  assert.match(errs, /needs "nope"/);
  assert.match(errs, /catering/);
});

/* ---------- Dependencies and parallel work ---------- */

test('independent tasks run at the same time', () => {
  const st = fresh();
  S.tick(st);
  assert.equal(st.crew.find(c => c.id === 'grip').task, 'hero.set');
  assert.equal(st.crew.find(c => c.id === 'art').task, 'hero.style');
  assert.equal(st.tasks['hero.set'].progress, 1);
  assert.equal(st.tasks['hero.style'].progress, 1);
});

test('a task does not start until its dependencies are done', () => {
  const st = fresh();
  S.stepTicks(st, secs(13));
  assert.equal(st.tasks['hero.light'].progress, 0);
  assert.equal(S.crewStatus(st, 'gaffer').text, 'Needs Build tabletop');
  runUntil(st, s => s.tasks['hero.set'].done);
  S.stepTicks(st, 2);
  assert.equal(st.crew.find(c => c.id === 'gaffer').task, 'hero.light');
});

test('stage tasks for the next shot wait until the current shot is captured', () => {
  const st = fresh();
  runUntil(st, s => S.readiness(s, 'hero').ready);
  assert.equal(st.tasks['cheese.rig'].progress, 0);
  assert.match(S.taskStatus(st, 'cheese.rig').text, /Stage busy with Hero Burger/);
  // Off-stage prep for later shots is allowed
  assert.ok(st.tasks['sauce.prep'].progress > 0, 'art preps sauce early');
  S.command(st, { type: 'action' });
  runUntil(st, s => s.shots.hero.captured);
  S.stepTicks(st, 1);
  S.command(st, { type: 'choose', option: 'fix' });
  S.stepTicks(st, 2);
  assert.ok(st.tasks['cheese.rig'].progress > 0);
});

/* ---------- Overrides ---------- */

test('override keeps progress on the paused task and resumes it after', () => {
  const st = fresh();
  S.stepTicks(st, secs(5));
  const before = st.tasks['hero.set'].progress;
  assert.equal(before, secs(5));
  const r = S.command(st, { type: 'assign', crew: 'grip', task: 'hero.style' });
  assert.ok(r.ok, r.message);
  assert.match(r.message, /half speed/);
  S.stepTicks(st, 1);
  assert.equal(st.tasks['hero.set'].progress, before, 'set progress kept while grip helps art');
  runUntil(st, s => s.tasks['hero.style'].done);
  // style: 18s of work, 5s by art alone (50 ticks), then art 1x + grip 0.5x on the remaining 130 ticks
  assert.equal(st.tasks['hero.style'].doneAt, secs(5) + Math.ceil(130 / 1.5));
  S.stepTicks(st, 1);
  const grip = st.crew.find(c => c.id === 'grip');
  assert.equal(grip.override, null, 'override ends when the task is done');
  assert.equal(grip.task, 'hero.set', 'grip returns to the set');
  assert.ok(st.tasks['hero.set'].progress > before);
});

test('override is refused with a reason when a task is not workable', () => {
  const st = fresh();
  let r = S.command(st, { type: 'assign', crew: 'gaffer', task: 'hero.light' });
  assert.equal(r.ok, false);
  assert.equal(r.message, 'Needs Build tabletop');
  r = S.command(st, { type: 'assign', crew: 'grip', task: 'cheese.rig' });
  assert.equal(r.ok, false);
  assert.match(r.message, /Hero Burger/);
});

test('release returns a crew member to auto', () => {
  const st = fresh();
  S.command(st, { type: 'assign', crew: 'dp', task: 'hero.set' });
  S.stepTicks(st, 3);
  assert.equal(st.crew.find(c => c.id === 'dp').task, 'hero.set');
  S.command(st, { type: 'release', crew: 'dp' });
  S.stepTicks(st, 1);
  assert.equal(st.crew.find(c => c.id === 'dp').task, null, 'DP has no camera work yet');
});

/* ---------- Perishables ---------- */

test('perishable task waits for its shot, goes bad, and gets redone', () => {
  const st = fresh();
  S.stepTicks(st, secs(25));
  assert.equal(st.tasks['cheese.melt'].progress, 0, 'auto never pre-melts cheese');
  // Player forces an early melt
  assert.ok(S.command(st, { type: 'assign', crew: 'art', task: 'cheese.melt' }).ok);
  runUntil(st, s => s.tasks['cheese.melt'].done);
  const doneAt = st.tasks['cheese.melt'].doneAt;
  S.stepTicks(st, secs(25));
  assert.equal(st.tasks['cheese.melt'].spoiled, 1);
  assert.equal(st.tasks['cheese.melt'].need, secs(6), 'redo is shorter');
  assert.ok(st.ticks - doneAt >= secs(25));
  autoPlay(st);
  assert.ok(st.shots.cheese.captured);
  assert.ok(!st.shots.cheese.skipped.includes('cheese.melt'));
});

/* ---------- ACTION ---------- */

test('ACTION is refused until required tasks are done, then allowed without optional ones', () => {
  const st = fresh();
  let r = S.command(st, { type: 'action' });
  assert.equal(r.ok, false);
  assert.match(r.message, /Needs Build tabletop/);
  // Pull the gaffer off lighting so the shot is ready without light
  S.stepTicks(st, secs(14) + 1);
  S.command(st, { type: 'assign', crew: 'gaffer', task: 'hero.style' });
  runUntil(st, s => S.readiness(s, 'hero').ready);
  assert.equal(st.tasks['hero.light'].done, false);
  assert.equal(S.readiness(st, 'hero').quality, 70);
  r = S.command(st, { type: 'action' });
  assert.ok(r.ok);
  runUntil(st, s => s.shots.hero.captured);
  assert.equal(st.shots.hero.quality, 70);
  assert.deepEqual(st.shots.hero.skipped, ['hero.light']);
});

test('reordering shots changes which shot takes the stage next', () => {
  const st = fresh();
  S.command(st, { type: 'move', shot: 'sauce', dir: -1 });   // hero, sauce, cheese
  autoPlay(st);
  const stages = st.log.filter(e => e.type === 'stage').map(e => e.shot);
  assert.deepEqual(stages, ['hero', 'sauce', 'cheese']);
});

/* ---------- Whole runs ---------- */

test('a full run completes all three shots with no soft-locks', () => {
  const st = autoPlay(fresh(), assertNoSoftLock);
  assert.ok(st.over);
  assert.ok(Object.values(st.shots).every(s => s.captured));
});

test('every shot order completes', () => {
  const ids = ['hero', 'cheese', 'sauce'];
  const perms = [];
  const permute = (a, rest) => rest.length ? rest.forEach((x, i) => permute(a.concat(x), rest.filter((_, j) => j !== i))) : perms.push(a);
  permute([], ids);
  for (const order of perms) {
    const st = fresh();
    S.command(st, { type: 'setPriority', order });
    autoPlay(st, assertNoSoftLock);
    assert.ok(st.over, `order ${order} finished`);
  }
});

test('random player input never soft-locks (300 seeds)', () => {
  const taskIds = Object.keys(fresh().tasks);
  const crewIds = burgerJob.crew.map(c => c.id);
  for (let seed = 1; seed <= 300; seed++) {
    let x = seed;
    const rnd = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648);
    const st = fresh();
    autoPlay(st, s => {
      const roll = rnd();
      if (roll < 0.04) S.command(s, { type: 'assign', crew: crewIds[Math.floor(rnd() * 4)], task: taskIds[Math.floor(rnd() * taskIds.length)] });
      else if (roll < 0.05) S.command(s, { type: 'release', crew: crewIds[Math.floor(rnd() * 4)] });
      else if (roll < 0.055) S.command(s, { type: 'move', shot: ['hero', 'cheese', 'sauce'][Math.floor(rnd() * 3)], dir: rnd() < 0.5 ? -1 : 1 });
      assertNoSoftLock(s);
    });
    assert.ok(st.over, `seed ${seed} finished`);
  }
});

test('same inputs give the same result', () => {
  const script = st => {
    if (st.ticks === secs(3)) S.command(st, { type: 'assign', crew: 'dp', task: 'hero.style' });
    if (st.ticks === secs(20)) S.command(st, { type: 'move', shot: 'sauce', dir: -1 });
  };
  const a = autoPlay(fresh(), script);
  const b = autoPlay(fresh(), script);
  assert.equal(S.snapshot(a), S.snapshot(b));
});

test('advance() in uneven frame sizes matches fixed ticks', () => {
  const a = fresh();
  const b = fresh();
  S.stepTicks(a, 300);
  const frames = [0.016, 0.033, 0.05, 0.0167, 0.1];
  let i = 0;
  while (b.ticks < 300) S.advance(b, frames[i++ % frames.length]);
  S.stepTicks(b, 300 - b.ticks);
  assert.equal(S.snapshot(a), S.snapshot(b));
});

/* ---------- Hiring, reliability, chaos, money ---------- */

const pick = (...ids) => {
  const all = burgerJob.hiring.flatMap(r => r.candidates.map(c => Object.assign({ role: r.role, dept: r.dept }, c)));
  return ids.map(id => all.find(c => c.id === id));
};
const pickMap = list => Object.fromEntries(list.map(c => [c.dept, c]));

test('estimate adds crew, gear and prep, and flags missing roles', () => {
  let r = S.estimate(burgerJob, pickMap(pick('mika', 'ro', 'dani')));
  assert.deepEqual(r.missing, ['Art']);
  assert.equal(r.ok, false);
  r = S.estimate(burgerJob, pickMap(pick('mika', 'ro', 'dani', 'paz')));
  assert.equal(r.crew, 3800 + 3400 + 2900 + 3600);
  assert.equal(r.total, r.crew + 4500 + 2000);
  assert.equal(r.margin, 28000 - r.total);
  assert.equal(r.overtimePerHour, Math.round(r.crew / 10 * 1.5));
  assert.ok(r.ok);
  const owned = S.estimate(burgerJob, pickMap(pick('mika', 'ro', 'dani', 'paz')), S.companyMods(company.rooms, ['gear']));
  assert.equal(owned.gear, 1500);
});

test('crew, gear and prep come out of the budget', () => {
  const st = make({ crew: pick('mika', 'ro', 'dani', 'theo') });
  assert.equal(st.budget, 28000 - (3800 + 3400 + 2900 + 2400) - 4500 - 2000);
});

test('faster crew finish sooner', () => {
  const vets = autoPlay(make({ crew: pick('ines', 'ro', 'max', 'jules').map(c => Object.assign({}, c, { reliability: 1 })) }));
  const newbies = autoPlay(make({ crew: pick('sam', 'lee', 'chuy', 'kit').map(c => Object.assign({}, c, { reliability: 1 })) }));
  assert.ok(vets.over && newbies.over);
  assert.ok(S.seconds(vets) < S.seconds(newbies) - 20, `vets ${S.seconds(vets)}s vs newbies ${S.seconds(newbies)}s`);
});

test('an unreliable crew member botches each task at most once, and the same seed botches the same tasks', () => {
  const crew = pick('mika', 'ro', 'dani', 'kit').map(c => c.id === 'kit' ? Object.assign({}, c, { reliability: 0 }) : Object.assign({}, c, { reliability: 1, leadership: 0 }));
  const a = autoPlay(make({ crew, seed: 7 }));
  const b = autoPlay(make({ crew, seed: 7 }));
  const flubs = a.log.filter(e => e.type === 'flub');
  const artTasks = Object.values(a.tasks).filter(t => t.dept === 'art');
  assert.equal(flubs.length, artTasks.length, 'every art task botched exactly once');
  assert.ok(a.over);
  assert.equal(S.snapshot(a), S.snapshot(b));
});

test('reliable crew never botch', () => {
  const st = autoPlay(fresh());
  assert.equal(st.log.filter(e => e.type === 'flub').length, 0);
});

test('key light dies when Cheese Pull takes the stage and freezes the clock until you choose', () => {
  const st = fresh();
  playUntil(st, s => !!s.pending);
  assert.equal(st.pending, 'keylight');
  assert.equal(st.stageShot, 'cheese');
  const t = st.ticks;
  S.stepTicks(st, 50);
  assert.equal(st.ticks, t, 'frozen while deciding');
  assert.equal(S.command(st, { type: 'action' }).ok, false);
  assert.equal(S.crewStatus(st, 'gaffer').state, 'BLOCKED');
});

test('fix: the gaffer gets a repair task, and the spare bulb perk makes it short', () => {
  for (const [crew, secsExpected] of [[undefined, 12], [pick('mika', 'ro', 'dani', 'paz'), 5]]) {
    const st = make(crew ? { crew: crew.map(c => Object.assign({}, c, { reliability: 1, speed: 1 })) } : {});
    playUntil(st, s => !!s.pending);
    assert.ok(S.command(st, { type: 'choose', option: 'fix' }).ok);
    assert.equal(st.tasks['keylight.fix'].need, secs(secsExpected));
    assert.ok(st.tasks['cheese.frame'].needs.includes('keylight.fix'));
    autoPlay(st);
    assert.ok(st.over);
    assert.equal(st.shots.cheese.penalty, 0);
  }
});

test('rent: costs $1,000 and unblocks when the backup arrives', () => {
  const st = fresh();
  playUntil(st, s => !!s.pending);
  const before = st.budget;
  S.command(st, { type: 'choose', option: 'rent' });
  assert.equal(st.budget, before - 1000);
  assert.equal(S.taskStatus(st, 'cheese.light').text, 'Backup light on the way');
  S.stepTicks(st, secs(6));
  assert.equal(st.blocks['cheese.light'], undefined);
  autoPlay(st);
  assert.ok(st.over);
});

test('bounce card: no wait, but the shot loses 20 quality', () => {
  const st = autoPlay(fresh(), null, 'bounce');
  assert.ok(st.over);
  assert.ok(st.shots.cheese.quality <= 80);
});

test('overtime is priced on the fictional day: 1.5x day rates after 10 hours, 2x after 12', () => {
  const lv = Object.assign({}, burgerJob, { timeLimit: 10, hardStop: 30 });
  const st = S.createGame(lv, { physical: false, review: false, crew: pick('mika', 'ro', 'dani', 'paz') });
  const rates = 3800 + 3400 + 2900 + 3600;
  const start = st.budget;
  S.stepTicks(st, secs(12));     // 10s day + 2s = 2 hours at 1.5x (one game second = one hour here)
  assert.ok(Math.abs((start - st.budget) - rates / 10 * 1.5 * 2) < 1, `charged ${start - st.budget}`);
  const mid = st.budget;
  S.stepTicks(st, secs(2));      // past 12 hours: double time
  assert.ok(Math.abs((mid - st.budget) - rates / 10 * 2 * 2) < 1, `charged ${mid - st.budget}`);
  S.stepTicks(st, secs(20));
  assert.ok(st.over);
  assert.equal(st.endReason, 'pulled');
  assert.equal(S.score(st).stars, 0);
});

test('the day clock runs 8:00 AM to 6:00 PM over the time limit', () => {
  const st = fresh();
  assert.equal(S.clockText(st), '8:00 AM');
  S.stepTicks(st, secs(60));
  assert.equal(S.clockText(st), '1:00 PM');
  st.ticks = secs(120);
  assert.equal(S.clockText(st), '6:00 PM');
});

test('stars: all shots, on time, then quality plus budget', () => {
  const st = autoPlay(fresh());
  const sc = S.score(st);
  assert.equal(sc.allShots, true);
  assert.equal(sc.onTime, true);
  assert.equal(sc.stars, 1 + 1 + (sc.avgQuality >= burgerJob.qualityTarget && sc.profit >= 0 ? 1 : 0));
});

/* ---------- Office upgrades ---------- */

test('office rooms combine into shoot-day modifiers', () => {
  const m = S.companyMods(company.rooms, ['craft', 'kitchen', 'gear', 'edit']);
  assert.equal(m.speed, 1.08);
  assert.equal(m.artSpeed, 1.15);
  assert.equal(m.fresh, 1.4);
  assert.equal(m.backupLight, true);
  assert.equal(m.post, 10);
  assert.deepEqual(S.companyMods(company.rooms, []), { speed: 1, artSpeed: 1, fresh: 1, backupLight: false, post: 0, gearPackage: null });
});

test('craft services makes the whole day faster', () => {
  const base = autoPlay(fresh());
  const craft = autoPlay(make({ mods: S.companyMods(company.rooms, ['craft']) }));
  assert.ok(S.seconds(craft) < S.seconds(base));
});

test('gear cage turns renting a light into a free 2-second swap', () => {
  const st = make({ mods: S.companyMods(company.rooms, ['gear']) });
  playUntil(st, s => !!s.pending);
  const rent = S.eventOptions(st, 'keylight').find(o => o.id === 'rent');
  assert.equal(rent.cost, 0);
  assert.equal(rent.secs, 2);
  const before = st.budget;
  S.command(st, { type: 'choose', option: 'rent' });
  assert.equal(st.budget, before);
  S.stepTicks(st, secs(2));
  assert.equal(st.blocks['cheese.frame'], undefined);
});

test('edit bay adds quality, capped at 100', () => {
  const st = make({ mods: S.companyMods(company.rooms, ['edit']) });
  S.stepTicks(st, secs(14) + 1);
  S.command(st, { type: 'assign', crew: 'gaffer', task: 'hero.style' });
  runUntil(st, s => S.readiness(s, 'hero').ready);
  assert.equal(S.readiness(st, 'hero').quality, 80, '100 - 30 skipped light + 10 post');
  const full = autoPlay(make({ mods: S.companyMods(company.rooms, ['edit']) }));
  assert.ok(Object.values(full.shots).every(s => s.quality <= 100));
});

/* ---------- Physical shoot and crew depth ---------- */

const phys = (ids, opts) => S.createGame(burgerJob, Object.assign({ review: false, crew: pick(...ids) }, opts || {}));
const reliable = list => list.map(c => Object.assign({}, c, { reliability: 1 }));

test('crew walk to a station before work starts there', () => {
  const st = S.createGame(burgerJob, { review: false });
  S.tick(st);
  const grip = st.crew.find(c => c.id === 'grip');
  assert.equal(grip.task, 'hero.set');
  assert.ok(grip.move > 0, 'walking');
  assert.equal(S.crewStatus(st, grip).state, 'MOVING');
  assert.equal(st.tasks['hero.set'].progress, 0);
  runUntil(st, s => s.tasks['hero.set'].progress > 0);
  assert.equal(grip.move, 0);
});

test('low organization means a pause between tasks; the DP\'s leadership shortens it', () => {
  const crew = reliable(pick('sam', 'ro', 'chuy', 'paz'));
  const st = S.createGame(burgerJob, { review: false, crew });
  runUntil(st, s => s.tasks['hero.set'].done);
  const chuy = st.crew.find(c => c.id === 'grip');
  assert.ok(chuy.pause > 0);
  assert.equal(S.crewStatus(st, chuy).state, 'IDLE');
  const withInes = S.createGame(burgerJob, { review: false, crew: reliable(pick('ines', 'ro', 'chuy', 'paz')) });
  runUntil(withInes, s => s.tasks['hero.set'].done);
  assert.ok(withInes.crew.find(c => c.id === 'grip').pause < chuy.pause);
});

test('handoffs between departments cost time; chemistry removes it and leadership shrinks it', () => {
  // Dani (grip) hands the tabletop to Ro (gaffer): good chemistry, so no wait
  const chem = S.createGame(burgerJob, { review: false, crew: reliable(pick('sam', 'ro', 'dani', 'paz')) });
  runUntil(chem, s => s.tasks['hero.set'].done);
  assert.equal(chem.tasks['hero.light'].readyAt, 0);
  // Chuy has no chemistry with Ro: a handoff delay, shorter under a strong DP
  const weak = S.createGame(burgerJob, { review: false, crew: reliable(pick('sam', 'ro', 'chuy', 'paz')) });
  runUntil(weak, s => s.tasks['hero.set'].done);
  const lagWeak = weak.tasks['hero.light'].readyAt - weak.ticks;
  const strong = S.createGame(burgerJob, { review: false, crew: reliable(pick('ines', 'ro', 'chuy', 'paz')) });
  runUntil(strong, s => s.tasks['hero.set'].done);
  const lagStrong = strong.tasks['hero.light'].readyAt - strong.ticks;
  assert.ok(lagWeak > 0);
  assert.ok(lagStrong < lagWeak, `${lagStrong} vs ${lagWeak}`);
  assert.match(S.taskStatus(weak, 'hero.light').text, /Handoff from Chuy/);
});

test('clashing pairs hand off slower', () => {
  const a = S.createGame(burgerJob, { review: false, crew: reliable(pick('mika', 'lee', 'dani', 'paz')) });
  const b = S.createGame(burgerJob, { review: false, crew: reliable(pick('mika', 'lee', 'max', 'paz')) });
  const ha = S.handoffTicks(a, a.crew.find(c => c.id === 'grip'), a.crew.find(c => c.id === 'lighting'));
  const hb = S.handoffTicks(b, b.crew.find(c => c.id === 'grip'), b.crew.find(c => c.id === 'lighting'));
  assert.ok(hb > ha, `clash ${hb} vs normal ${ha}`);
});

test('a strong DP makes botches rarer across the whole crew', () => {
  let weak = 0, strong = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const base = pick('mika', 'lee', 'chuy', 'kit').map(c => Object.assign({}, c, { leadership: 0 }));
    weak += autoPlay(S.createGame(burgerJob, { seed, crew: base })).log.filter(e => e.type === 'flub').length;
    const led = base.map(c => c.dept === 'camera' ? Object.assign({}, c, { leadership: 1 }) : c);
    strong += autoPlay(S.createGame(burgerJob, { seed, crew: led })).log.filter(e => e.type === 'flub').length;
  }
  assert.ok(strong < weak, `${strong} botches with a leader vs ${weak}`);
});

test('skill sets shot quality, and the macro specialty lifts the macro shots', () => {
  const q = ids => { const st = autoPlay(phys(ids, { crew: reliable(pick(...ids)) })); return Object.values(st.shots).map(s => s.quality); };
  const vets = q(['ines', 'ro', 'max', 'paz']);
  const rookies = q(['sam', 'lee', 'chuy', 'kit']);
  assert.ok(vets.every((v, i) => v > rookies[i]), `${vets} vs ${rookies}`);
  const st = autoPlay(phys(['ines', 'ro', 'chuy', 'kit'], { crew: reliable(pick('ines', 'ro', 'chuy', 'kit')) }));
  assert.ok(st.shots.cheese.bonus >= 8);
  assert.equal(st.shots.hero.bonus, 0);
});

test('take review: the clock waits, a retake costs time and wins back half the skill loss', () => {
  const crew = reliable(pick('sam', 'lee', 'chuy', 'kit'));
  const st = S.createGame(burgerJob, { crew });
  let guard = 0;
  while (!st.review && guard++ < 5000) {
    S.tick(st);
    const c = S.stageCandidate(st);
    if (c && !st.capture && !st.review && S.readiness(st, c).ready) S.command(st, { type: 'action' });
  }
  assert.ok(st.review);
  const s = st.shots[st.review.shot];
  const t = st.ticks;
  S.stepTicks(st, 30);
  assert.equal(st.ticks, t, 'frozen while reviewing');
  const before = s.quality, exec = s.exec;
  assert.ok(exec > 0);
  assert.ok(S.command(st, { type: 'retake' }).ok);
  assert.equal(s.exec, Math.floor(exec / 2));
  assert.ok(s.quality > before);
  assert.equal(s.takes, 2);
  runUntil(st, x => !!x.review);
  assert.ok(st.ticks - t >= S.actionTicks(st) + secs(3));
  S.command(st, { type: 'accept' });
  assert.ok(s.captured);
});

test('good chemistry makes both partners faster', () => {
  const st = phys(['mika', 'ro', 'dani', 'paz']);
  const mika = st.crew.find(c => c.cid === 'mika');
  assert.ok(Math.abs(mika.speed - 1.0 * 1.08 * 1.08) < 1e-9, 'Mika has chemistry with Ro and Paz');
  assert.equal(mika.chem.length, 2);
});

test('physical runs with any crew never soft-lock', () => {
  const sets = [['ines', 'ro', 'max', 'paz'], ['sam', 'lee', 'chuy', 'kit'], ['mika', 'ro', 'dani', 'jules'], ['sam', 'ro', 'max', 'theo']];
  for (const ids of sets) for (let seed = 1; seed <= 15; seed++) {
    const st = autoPlay(S.createGame(burgerJob, { seed, crew: pick(...ids) }), assertNoSoftLock);
    assert.ok(st.over, `${ids} seed ${seed}`);
  }
});
