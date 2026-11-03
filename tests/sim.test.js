// Run with: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/sim.js');
const { burgerJob, company } = require('../data/burger-job.js');

const TPS = S.TPS;
const fresh = () => S.createGame(burgerJob);
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
    S.tick(st);
    if (onTick) onTick(st);
    const c = S.stageCandidate(st);
    if (c && S.readiness(st, c).ready && !st.capture) S.command(st, { type: 'action' });
  }
  return st;
}

// Soft-lock guard: if nobody is working and nobody can pick work, the shot must be ready (or rolling, or wrapped).
function assertNoSoftLock(st) {
  if (st.over || st.capture || st.pending || st.waits.length) return;
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

test('hiring check totals rates and flags missing roles and overspend', () => {
  let r = S.hireCheck(burgerJob, pickMap(pick('mika', 'ro', 'dani')));
  assert.deepEqual(r.missing, ['Art']);
  assert.equal(r.ok, false);
  r = S.hireCheck(burgerJob, pickMap(pick('mika', 'ro', 'dani', 'paz')));
  assert.equal(r.cost, 1700 + 1500 + 1300 + 1600);
  assert.equal(r.left, burgerJob.budget - r.cost);
  assert.ok(r.ok);
  r = S.hireCheck(burgerJob, pickMap(pick('ines', 'ro', 'max', 'paz')));
  assert.equal(r.cost, 7600);
  assert.equal(r.ok, false, 'the best crew you can get costs more than the budget');
});

test('hired crew rates come out of the budget', () => {
  const st = S.createGame(burgerJob, { crew: pick('mika', 'ro', 'dani', 'theo') });
  assert.equal(st.budget, burgerJob.budget - (1700 + 1500 + 1300 + 1100));
});

test('faster crew finish sooner', () => {
  const vets = autoPlay(S.createGame(burgerJob, { crew: pick('ines', 'ro', 'max', 'jules').map(c => Object.assign({}, c, { reliability: 1 })) }));
  const newbies = autoPlay(S.createGame(burgerJob, { crew: pick('sam', 'lee', 'chuy', 'kit').map(c => Object.assign({}, c, { reliability: 1 })) }));
  assert.ok(vets.over && newbies.over);
  assert.ok(S.seconds(vets) < S.seconds(newbies) - 20, `vets ${S.seconds(vets)}s vs newbies ${S.seconds(newbies)}s`);
});

test('an unreliable crew member botches each task at most once, and the same seed botches the same tasks', () => {
  const crew = pick('mika', 'ro', 'dani', 'kit').map(c => c.id === 'kit' ? Object.assign({}, c, { reliability: 0 }) : Object.assign({}, c, { reliability: 1 }));
  const a = autoPlay(S.createGame(burgerJob, { crew, seed: 7 }));
  const b = autoPlay(S.createGame(burgerJob, { crew, seed: 7 }));
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
    const st = S.createGame(burgerJob, crew ? { crew: crew.map(c => Object.assign({}, c, { reliability: 1, speed: 1 })) } : {});
    playUntil(st, s => !!s.pending);
    assert.ok(S.command(st, { type: 'choose', option: 'fix' }).ok);
    assert.equal(st.tasks['keylight.fix'].need, secs(secsExpected));
    assert.ok(st.tasks['cheese.frame'].needs.includes('keylight.fix'));
    autoPlay(st);
    assert.ok(st.over);
    assert.equal(st.shots.cheese.penalty, 0);
  }
});

test('rent: costs $400 and unblocks when the backup arrives', () => {
  const st = fresh();
  playUntil(st, s => !!s.pending);
  const before = st.budget;
  S.command(st, { type: 'choose', option: 'rent' });
  assert.equal(st.budget, before - 400);
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

test('overtime costs money and the client pulls the plug at the hard stop', () => {
  const lv = Object.assign({}, burgerJob, { timeLimit: 10, hardStop: 30 });
  const st = S.createGame(lv);
  const start = st.budget;
  S.stepTicks(st, secs(20));
  assert.equal(Math.round(start - st.budget), 10 * lv.overtimeRate);
  S.stepTicks(st, secs(20));
  assert.ok(st.over);
  assert.equal(st.endReason, 'pulled');
  assert.equal(S.score(st).stars, 0);
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
  assert.deepEqual(S.companyMods(company.rooms, []), { speed: 1, artSpeed: 1, fresh: 1, backupLight: false, post: 0 });
});

test('craft services makes the whole day faster', () => {
  const base = autoPlay(fresh());
  const craft = autoPlay(S.createGame(burgerJob, { mods: S.companyMods(company.rooms, ['craft']) }));
  assert.ok(S.seconds(craft) < S.seconds(base));
});

test('gear cage turns renting a light into a free 2-second swap', () => {
  const st = S.createGame(burgerJob, { mods: S.companyMods(company.rooms, ['gear']) });
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
  const st = S.createGame(burgerJob, { mods: S.companyMods(company.rooms, ['edit']) });
  S.stepTicks(st, secs(14) + 1);
  S.command(st, { type: 'assign', crew: 'gaffer', task: 'hero.style' });
  runUntil(st, s => S.readiness(s, 'hero').ready);
  assert.equal(S.readiness(st, 'hero').quality, 80, '100 - 30 skipped light + 10 post');
  const full = autoPlay(S.createGame(burgerJob, { mods: S.companyMods(company.rooms, ['edit']) }));
  assert.ok(Object.values(full.shots).every(s => s.quality <= 100));
});

/* ---------- Workstations ---------- */

test('station info reports the task, the crew on it, progress and what blocks it', () => {
  const st = fresh();
  S.stepTicks(st, secs(5));
  const table = S.stationInfo(st, 'table');
  assert.equal(table.name, 'Hero platform');
  assert.equal(table.label, 'Build tabletop');
  assert.deepEqual(table.crew, ['Dani']);
  assert.ok(table.pct > 0.3 && table.pct < 0.4);
  const light = S.stationInfo(st, 'light');
  assert.equal(light.label, 'Light the burger');
  assert.equal(light.blocker, 'Needs Build tabletop');
  assert.equal(S.stationInfo(st, 'cart').label, 'Style burger');
  // When the key light dies, the light station says so
  playUntil(st, s => !!s.pending);
  assert.equal(S.stationInfo(st, 'light').state, 'blocked');
  assert.match(S.stationInfo(st, 'light').text, /Key light is dead/);
});

test('every task maps to one of the four stations', () => {
  const st = fresh();
  for (const t of Object.values(st.tasks)) assert.ok(['light', 'table', 'camera', 'cart'].includes(S.stationOf(t)), t.id);
});

/* ---------- Autonomy (Milestone B1 slice) ---------- */

const withAutonomy = (autonomy, opts) => S.createGame(burgerJob, Object.assign({ autonomy }, opts || {}));
// A scripted player: every tick, gives each idle crew member the best workable task for them, calls ACTION when
// ready and answers chaos with a fix. reactTicks is how long a person waits before reacting to an idle crew member.
function directedPlay(st, reactTicks, onTick) {
  const waitingSince = {};
  let guard = 0;
  while (!st.over && guard++ < 10000) {
    if (st.pending) S.command(st, { type: 'choose', option: 'fix' });
    for (const c of st.crew) {
      if (S.idleWork(st, c)) {
        waitingSince[c.id] = waitingSince[c.id] == null ? st.ticks : waitingSince[c.id];
        if (st.ticks - waitingSince[c.id] >= reactTicks) { S.command(st, { type: 'assign', crew: c.id, task: S.idleWork(st, c) }); waitingSince[c.id] = null; }
      } else waitingSince[c.id] = null;
    }
    S.tick(st);
    if (onTick) onTick(st);
    const cand = S.stageCandidate(st);
    if (cand && !st.capture && S.readiness(st, cand).ready) S.command(st, { type: 'action' });
  }
  return st;
}

test('crew default to autonomy 2, the original auto crew', () => {
  assert.ok(fresh().crew.every(c => c.autonomy === 2));
});

test('autonomy 0 crew do nothing until told', () => {
  const st = withAutonomy(0);
  S.stepTicks(st, secs(30));
  assert.ok(st.crew.every(c => !c.task), 'nobody started anything');
  assert.ok(Object.values(st.tasks).every(t => t.progress === 0));
  assert.equal(st.log.filter(e => e.type === 'start').length, 0);
});

test('autonomy 0 crew finish what they are given, then wait for the next order', () => {
  const st = withAutonomy(0);
  S.command(st, { type: 'assign', crew: 'grip', task: 'hero.set' });
  assert.ok(runUntil(st, s => s.tasks['hero.set'].done));
  S.stepTicks(st, secs(5));
  const grip = st.crew.find(c => c.id === 'grip');
  assert.equal(grip.task, null);
  assert.ok(S.idleWork(st, 'art') === 'hero.style', 'art has work available but nobody told them');
  assert.equal(st.tasks['hero.style'].progress, 0);
});

test('autonomy 1 keeps going at its own station but does not walk to another one', () => {
  const st = withAutonomy(1);
  S.command(st, { type: 'assign', crew: 'art', task: 'hero.style' });
  S.command(st, { type: 'assign', crew: 'grip', task: 'hero.set' });
  assert.ok(runUntil(st, s => s.tasks['hero.set'].done && s.tasks['hero.style'].done));
  S.stepTicks(st, 3);
  const art = st.crew.find(c => c.id === 'art');
  assert.equal(art.task, 'sauce.prep', 'carries on at the art table with the next art-table job');
  assert.notEqual(art.task, 'hero.place', 'hero.place is at the platform, a different station');
  const grip = st.crew.find(c => c.id === 'grip');
  assert.equal(grip.task, null, 'nothing else eligible at the platform yet, so the grip waits');
});

test('autonomy 1 crew who have never worked anywhere wait for a first order', () => {
  const st = withAutonomy(1);
  S.stepTicks(st, secs(5));
  assert.ok(st.crew.every(c => !c.task));
});

test('autonomy 2 still walks to the platform for the next job (original behavior)', () => {
  const st = withAutonomy(2);
  assert.ok(runUntil(st, s => s.tasks['hero.place'].progress > 0));
  assert.equal(st.crew.find(c => c.id === 'art').task, 'hero.place');
});

test('tier sets autonomy and Assist Mode lifts the floor without lowering veterans', () => {
  const all = burgerJob.hiring.flatMap(r => r.candidates.map(c => Object.assign({ role: r.role, dept: r.dept }, c)));
  const crew = [all.find(c => c.id === 'ines'), all.find(c => c.id === 'sam'), all.find(c => c.id === 'dani'), all.find(c => c.id === 'kit')];
  crew[0].dept = 'camera'; crew[1].dept = 'lighting'; crew[2].dept = 'grip'; crew[3].dept = 'art';
  const plain = S.createGame(burgerJob, { crew, autonomy: 'tier' });
  assert.deepEqual(plain.crew.map(c => c.autonomy), [2, 0, 1, 0], 'Veteran 2, Newbie 0, Solid 1, Unknown 0');
  const assist = S.createGame(burgerJob, { crew, autonomy: 'tier', assist: true });
  assert.deepEqual(assist.crew.map(c => c.autonomy), [2, 1, 1, 1]);
  assert.equal(S.tierAutonomy('Veteran'), 2);
});

test('canAssign says go, slow, busy or no, with the reason', () => {
  const st = withAutonomy(0);
  assert.equal(S.canAssign(st, 'grip', 'table').state, 'go');
  assert.equal(S.canAssign(st, 'art', 'table').state, 'slow', 'art on a grip job runs at half speed');
  const gaffer = S.canAssign(st, 'gaffer', 'light');
  assert.equal(gaffer.state, 'no');
  assert.match(gaffer.why, /Needs Build tabletop/);
  S.command(st, { type: 'assign', crew: 'grip', task: 'hero.set' });
  assert.equal(S.canAssign(st, 'grip', 'table').state, 'busy');
  assert.equal(S.canAssign(st, 'dp', 'camera').state, 'no');
});

test('canAssign refuses everything while a chaos decision is pending', () => {
  const st = withAutonomy(0);
  S.command(st, { type: 'assign', crew: 'grip', task: 'hero.set' });
  st.pending = 'keylight';
  assert.equal(S.canAssign(st, 'grip', 'table').state, 'no');
});

test('choosing the repair is the order: an autonomy 0 gaffer starts the fix on their own', () => {
  const st = withAutonomy(0);
  st.pending = 'keylight';
  st.fired.keylight = true;
  for (const tid of burgerJob.events[0].blocks) st.blocks[tid] = 'keylight';
  st.stageShot = 'cheese';
  S.command(st, { type: 'choose', option: 'fix' });
  const gaffer = st.crew.find(c => c.id === 'gaffer');
  assert.equal(gaffer.task, 'keylight.fix');
});

test('a scripted player with every crew member at autonomy 0 finishes the shoot', () => {
  const st = directedPlay(withAutonomy(0), 10, assertNoSoftLock);
  assert.ok(st.over);
  assert.equal(st.endReason, 'wrap');
  assert.ok(Object.values(st.shots).every(s => s.captured));
  assert.equal(st.log.filter(e => e.type === 'start').length, 0, 'every task was ordered, none picked');
  assert.ok(S.seconds(st) < burgerJob.hardStop);
});

test('the scripted player finishes in every shot order, even with a slow 2 second reaction', () => {
  const ids = ['hero', 'cheese', 'sauce'];
  const perms = [];
  const permute = (a, rest) => rest.length ? rest.forEach((x, i) => permute(a.concat(x), rest.filter((_, j) => j !== i))) : perms.push(a);
  permute([], ids);
  for (const order of perms) {
    const st = withAutonomy(0);
    S.command(st, { type: 'setPriority', order });
    directedPlay(st, 20, assertNoSoftLock);
    assert.equal(st.endReason, 'wrap', `order ${order} wrapped before the client pulled the plug`);
  }
});

test('directed play is deterministic', () => {
  const a = directedPlay(withAutonomy(0, { seed: 7 }), 10);
  const b = directedPlay(withAutonomy(0, { seed: 7 }), 10);
  assert.equal(S.snapshot(a), S.snapshot(b));
});

test('every autonomy level finishes the shoot with the scripted player', () => {
  for (const level of [0, 1, 2]) {
    const st = directedPlay(withAutonomy(level), 10, assertNoSoftLock);
    assert.equal(st.endReason, 'wrap', `autonomy ${level} wrapped`);
  }
});

test('while rolling, the next shot is refused with "the stage clears after the cut", then opens', () => {
  const st = withAutonomy(0);
  const order = [['grip', 'hero.set'], ['art', 'hero.style']];
  for (const [c, t] of order) S.command(st, { type: 'assign', crew: c, task: t });
  runUntil(st, s => s.tasks['hero.set'].done && s.tasks['hero.style'].done);
  S.command(st, { type: 'assign', crew: 'art', task: 'hero.place' });
  runUntil(st, s => s.tasks['hero.place'].done);
  S.command(st, { type: 'assign', crew: 'dp', task: 'hero.frame' });
  runUntil(st, s => s.tasks['hero.frame'].done);
  assert.ok(S.command(st, { type: 'action' }).ok);
  const r = S.command(st, { type: 'assign', crew: 'grip', task: 'cheese.rig' });
  assert.equal(r.ok, false);
  assert.match(r.message, /Rolling on Hero Burger\. The stage clears after the cut/);
  runUntil(st, s => s.shots.hero.captured);
  assert.equal(st.stageShot, null, 'the stage is clear after the cut');
  assert.equal(S.canAssign(st, 'grip', 'table').state, 'go');
});

test('nextStep names the first order for the shot on stage, and waitingOn names who blocks a crew member', () => {
  const st = withAutonomy(0);
  const n = S.nextStep(st);
  assert.ok(['hero.set', 'hero.style'].includes(n.task), `first step is a root task, got ${n.task}`);
  assert.equal(n.task, 'hero.style', 'the longest chain goes first (style 18 + place 4 + frame 8)');
  assert.equal(n.name, 'Lu');
  assert.equal(n.station, 'cart');
  const w = S.waitingOn(st, 'gaffer');
  assert.equal(w.depLabel, 'Build tabletop');
  assert.equal(w.name, 'Dani');
  // After the hero wraps, the gaffer and DP wait for the grip to rig the pull
  const done = directedPlay(withAutonomy(0), 0, s => {
    if (s.shots.hero.captured && !s.stageShot && !s.__checked) {
      s.__checked = true;
      const n2 = S.nextStep(s);
      assert.ok(['cheese.rig', 'cheese.melt'].includes(n2.task), `next step is a required Cheese Pull task, got ${n2.task}`);
      assert.equal(S.blockReason(s, s.tasks[n2.task], true), null, 'and it can be started right now');
      assert.equal(S.waitingOn(s, 'gaffer').depLabel, 'Rig the pull');
    }
  });
  assert.ok(done.__checked, 'checked the moment between shots');
});
