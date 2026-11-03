/*
  That's a Wrap! simulation core.
  Pure game logic with no DOM, so it runs the same in the browser and in Node tests.

  Time runs in fixed ticks (10 per second). Same level + same crew + same seed + same commands
  at the same ticks always gives the same result.

  Each tick:
    1. Assignment: every crew member keeps their task, follows a manual override,
       or picks their next task according to their autonomy level:
         0 Newbie   waits for orders once a task is finished
         1 Solid    keeps going with eligible tasks at the station they are already working at
         2 Veteran  picks the best eligible task in their own department (the original auto crew)
       Autonomy never touches strategy: shot order, spending, risky perishables and ACTION stay with the player.
    2. Stage claim: the first stage task started locks the stage to that shot. Chaos events can fire here.
    3. Work: tasks gain progress from everyone on them (speed x 1 in their dept, x crossDeptRate outside).
       A finished task can be botched by an unreliable crew member: half of it is redone, once per task.
    4. Perishables: finished perishable tasks go bad after freshFor seconds.
    5. Waits: rentals on the way count down.
    6. Capture: a running ACTION counts down and wraps the shot.
    7. Money and clock: overtime costs money; the client pulls the plug at hardStop.
  While a chaos decision is pending, the clock is frozen.
*/
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapSim = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TPS = 10;                 // ticks per second
  const EPS = 1e-6;
  const DEFAULT_WEIGHT = 20;

  /* ---------- Level validation ---------- */

  function validateLevel(level) {
    const errors = [];
    if (!level || !Array.isArray(level.shots) || !Array.isArray(level.crew)) return ['Level needs shots and crew arrays'];
    const seen = new Set();
    const crewDepts = new Set(level.crew.map(c => c.dept));
    for (const shot of level.shots) {
      const local = new Map(shot.tasks.map(t => [t.id, t]));
      for (const t of shot.tasks) {
        if (seen.has(t.id)) errors.push(`Duplicate task id "${t.id}"`);
        seen.add(t.id);
        if (!(t.dur > 0)) errors.push(`Task "${t.id}" needs a positive dur`);
        if (!crewDepts.has(t.dept)) errors.push(`Task "${t.id}" is ${t.dept} work, but no crew member is in ${t.dept}`);
        for (const d of t.needs || []) {
          if (!local.has(d)) errors.push(`Task "${t.id}" needs "${d}", which is not a task in shot "${shot.id}"`);
        }
        if (t.perishable && !(t.freshFor > 0)) errors.push(`Perishable task "${t.id}" needs a positive freshFor`);
      }
      if (!shot.tasks.some(t => t.stage && !t.optional)) {
        errors.push(`Shot "${shot.id}" needs at least one required stage task, or ACTION could fire with nothing on stage`);
      }
      const mark = {};
      const visit = (id, path) => {
        if (mark[id] === 2) return;
        if (mark[id] === 1) { errors.push(`Dependency cycle in shot "${shot.id}": ${path.concat(id).join(' -> ')}`); return; }
        mark[id] = 1;
        for (const d of local.get(id).needs || []) if (local.has(d)) visit(d, path.concat(id));
        mark[id] = 2;
      };
      for (const t of shot.tasks) visit(t.id, []);
    }
    for (const ev of level.events || []) {
      for (const b of ev.blocks || []) if (!seen.has(b)) errors.push(`Event "${ev.id}" blocks unknown task "${b}"`);
      if (!ev.options || !ev.options.length) errors.push(`Event "${ev.id}" needs at least one option`);
    }
    return errors;
  }

  /* ---------- Hiring ---------- */

  // picks: { dept: candidate } -> cost and what's missing
  function hireCheck(level, picks) {
    const roles = level.hiring || [];
    const missing = roles.filter(r => !picks[r.dept]).map(r => r.role);
    const cost = Object.values(picks).reduce((a, c) => a + (c ? c.rate : 0), 0);
    return { cost, left: level.budget - cost, missing, ok: !missing.length && cost <= level.budget };
  }

  /* ---------- Company upgrades ---------- */

  const BASE_MODS = { speed: 1, artSpeed: 1, fresh: 1, backupLight: false, post: 0 };

  // How much a crew member does on their own. Experience sets it, Assist Mode lifts the floor to 1.
  const TIER_AUTONOMY = { Veteran: 2, Solid: 1, Vouched: 1, Newbie: 0, Unknown: 0 };
  const tierAutonomy = tier => (tier in TIER_AUTONOMY ? TIER_AUTONOMY[tier] : 2);

  // Combine the effects of owned office rooms into shoot-day modifiers.
  function companyMods(rooms, owned) {
    const m = Object.assign({}, BASE_MODS);
    for (const r of rooms || []) {
      if (!owned || !owned.includes(r.id)) continue;
      const e = r.effect || {};
      if (e.speed) m.speed *= e.speed;
      if (e.artSpeed) m.artSpeed *= e.artSpeed;
      if (e.fresh) m.fresh *= e.fresh;
      if (e.backupLight) m.backupLight = true;
      if (e.post) m.post += e.post;
    }
    return m;
  }

  /* ---------- Setup ---------- */

  function createGame(level, opts) {
    opts = opts || {};
    const errors = validateLevel(level);
    if (errors.length) throw new Error('Invalid level:\n' + errors.join('\n'));
    const src = opts.crew || level.crew;
    // opts.autonomy: a number for everyone, 'tier' to derive it from experience, or leave out for 2 (the original auto crew)
    const autonomyOf = c => {
      let a = c.autonomy != null ? c.autonomy : 2;
      if (typeof opts.autonomy === 'number') a = opts.autonomy;
      else if (opts.autonomy === 'tier') a = tierAutonomy(c.tier);
      return opts.assist ? Math.max(a, 1) : a;
    };
    const crew = src.map((c, i) => ({
      id: opts.crew ? c.dept : c.id, name: c.name, role: c.role, dept: c.dept,
      speed: c.speed || 1, reliability: c.reliability != null ? c.reliability : 1,
      perks: (c.perks || []).slice(), rate: c.rate || 0, look: c.look || null, tier: c.tier || '',
      autonomy: autonomyOf(c), lastStation: null,
      task: null, override: null, order: i,
    }));
    const tasks = {};
    const shots = {};
    let order = 0;
    for (const s of level.shots) {
      shots[s.id] = { id: s.id, name: s.name, taskIds: s.tasks.map(t => t.id), captured: false, capturedAt: null, quality: null, skipped: [], penalty: 0 };
      for (const t of s.tasks) {
        if (!crew.some(c => c.dept === t.dept)) throw new Error(`No crew member for ${t.dept}`);
        tasks[t.id] = makeTask(t, s.id, order++);
      }
    }
    const crewCost = crew.reduce((a, c) => a + c.rate, 0);
    return {
      level, seed: (opts.seed >>> 0) || 1,
      mods: Object.assign({}, BASE_MODS, opts.mods || {}),
      ticks: 0, acc: 0, paused: false, over: false, endReason: null,
      priority: level.shots.map(s => s.id),
      stageShot: null, capture: null,
      tasks, shots, crew,
      budget: level.budget - crewCost, crewCost, extraCost: 0, overtimeCost: 0,
      pending: null, fired: {}, chosen: {}, blocks: {}, blockText: {}, waits: [], flubbed: {},
      log: [],
    };
  }

  function makeTask(t, shot, order) {
    return {
      id: t.id, shot, dept: t.dept, label: t.label,
      dur: t.dur, needs: (t.needs || []).slice(),
      stage: !!t.stage, optional: !!t.optional, weight: t.weight != null ? t.weight : DEFAULT_WEIGHT,
      perishable: !!t.perishable, freshFor: t.freshFor || 0, redoDur: t.redoDur || t.dur,
      order,
      need: Math.round(t.dur * TPS), progress: 0, done: false, doneAt: null, spoiled: 0,
    };
  }

  /* ---------- Helpers ---------- */

  const seconds = st => st.ticks / TPS;
  const shotIndex = (st, id) => st.priority.indexOf(id);
  const crewById = (st, id) => st.crew.find(c => c.id === id);
  const taskList = st => Object.values(st.tasks);
  const eventById = (st, id) => (st.level.events || []).find(e => e.id === id);
  const hasPerk = (st, perk) => st.crew.some(c => c.perks.includes(perk));
  const workRate = (st, c, t) => (c.dept === t.dept ? 1 : st.level.crossDeptRate) * c.speed * st.mods.speed * (c.dept === 'art' ? st.mods.artSpeed : 1);

  function log(st, type, text, extra) {
    st.log.push(Object.assign({ tick: st.ticks, type, text }, extra || {}));
  }

  // Deterministic 0..1 roll from the run seed and a key.
  function roll(st, key) {
    let h = 2166136261 ^ st.seed;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    h += 0x6D2B79F5;
    let x = h;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }

  function freshFor(st, t) {
    return t.freshFor * (hasPerk(st, 'foodWhisperer') ? 1.6 : 1) * st.mods.fresh;
  }

  function actionTicks(st) {
    return Math.round((hasPerk(st, 'quickRoll') ? 3 : st.level.actionDuration) * TPS);
  }

  function stageCandidate(st) {
    if (st.stageShot) return st.stageShot;
    for (const id of st.priority) if (!st.shots[id].captured) return id;
    return null;
  }

  function shotLocked(st, t) {
    const s = st.shots[t.shot];
    return s.captured || (!!st.capture && st.capture.shot === t.shot);
  }

  function workersOn(st, taskId, except) {
    return st.crew.filter(c => c !== except && c.task === taskId);
  }

  // Why this task can't be worked right now, or null if it can.
  // manual = a player override, which may start perishables early.
  function blockReason(st, t, manual) {
    if (t.done) return 'Already done';
    if (shotLocked(st, t)) return `${st.shots[t.shot].name} is already shot`;
    if (st.blocks[t.id]) return st.blockText[st.blocks[t.id]] || eventById(st, st.blocks[t.id]).blockText;
    const missing = t.needs.filter(d => !st.tasks[d].done);
    if (missing.length) return `Needs ${st.tasks[missing[0]].label}`;
    const cand = stageCandidate(st);
    if (t.stage && cand !== t.shot) {
      if (st.capture) return `Rolling on ${st.shots[st.capture.shot].name}. The stage clears after the cut`;
      return st.stageShot ? `Stage busy with ${st.shots[st.stageShot].name}` : `${st.shots[cand].name} goes first`;
    }
    if (t.perishable && !manual && cand !== t.shot) return `Holding until ${st.shots[t.shot].name} is on stage`;
    return null;
  }

  function chainLen(st, t, memo) {
    memo = memo || {};
    if (memo[t.id] != null) return memo[t.id];
    const own = t.done ? 0 : t.need - t.progress;
    let tail = 0;
    for (const id of st.shots[t.shot].taskIds) {
      const d = st.tasks[id];
      if (!d.done && d.needs.includes(t.id)) tail = Math.max(tail, chainLen(st, d, memo));
    }
    return (memo[t.id] = own + tail);
  }

  function lexLess(a, b) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i];
    return false;
  }

  // station: optionally limit the pick to tasks at one workstation (autonomy 1)
  function pickAuto(st, c, station) {
    let best = null, bestKey = null;
    const memo = {};
    for (const t of taskList(st)) {
      if (t.dept !== c.dept) continue;
      if (station && stationOf(t) !== station) continue;
      if (blockReason(st, t, false)) continue;
      if (workersOn(st, t.id, c).length) continue;
      const key = [shotIndex(st, t.shot), -chainLen(st, t, memo), t.order];
      if (!best || lexLess(key, bestKey)) { best = t; bestKey = key; }
    }
    return best ? best.id : null;
  }

  // The next task someone takes on their own, by autonomy level. Level 0 never picks.
  function pickFor(st, c) {
    if (c.autonomy <= 0) return null;
    if (c.autonomy === 1) return pickAuto(st, c, c.lastStation || '__none__');
    return pickAuto(st, c);
  }

  function spend(st, amount, kind) {
    st.budget -= amount;
    if (kind === 'overtime') st.overtimeCost += amount;
    else st.extraCost += amount;
  }

  /* ---------- Chaos ---------- */

  function fireEvents(st) {
    for (const ev of st.level.events || []) {
      if (st.fired[ev.id]) continue;
      if (ev.trigger.type === 'stageClaim' && st.stageShot === ev.trigger.shot) {
        st.fired[ev.id] = true;
        st.pending = ev.id;
        for (const tid of ev.blocks) st.blocks[tid] = ev.id;
        for (const c of st.crew) if (c.task && st.blocks[c.task]) { c.task = null; if (c.override && st.blocks[c.override]) c.override = null; }
        log(st, 'chaos', ev.title, { event: ev.id });
        return;
      }
    }
  }

  // An option as it plays out with this company (owning backup lights changes renting into a free swap).
  function resolveOption(st, o) {
    if (o.kind === 'wait' && st.mods.backupLight) {
      return Object.assign({}, o, { label: 'Grab our backup light', cost: 0, secs: 2, waitText: 'Grabbing the backup from the cage', owned: true });
    }
    return o;
  }

  function unblock(st, evId) {
    for (const tid of Object.keys(st.blocks)) if (st.blocks[tid] === evId) delete st.blocks[tid];
  }

  // What each option will cost with this crew, for the choice card.
  function eventOptions(st, evId) {
    const ev = eventById(st, evId);
    return ev.options.map(o0 => {
      const o = resolveOption(st, o0);
      const out = { id: o.id, label: o.label, kind: o.kind, cost: o.cost || 0, owned: !!o.owned };
      if (o.kind === 'task') {
        const perk = o.perk && hasPerk(st, o.perk);
        const fixer = st.crew.find(c => c.dept === o.dept);
        const dur = perk ? o.perkDur : o.dur;
        out.secs = Math.ceil(dur / (fixer ? fixer.speed * st.mods.speed : 1));
        out.who = fixer ? fixer.name : '';
        out.perk = perk;
      } else if (o.kind === 'wait') out.secs = o.secs;
      else if (o.kind === 'penalty') out.penalty = o.penalty;
      return out;
    });
  }

  /* ---------- Simulation ---------- */

  function tick(st) {
    if (st.over || st.pending) return;
    st.ticks++;

    // 1. Assignment
    for (const c of st.crew) {
      const before = c.task;
      if (c.override) {
        if (blockReason(st, st.tasks[c.override], true)) { c.override = null; c.task = null; }
        else { c.task = c.override; continue; }
      }
      if (c.task && !blockReason(st, st.tasks[c.task], false)) continue;
      c.task = pickFor(st, c);
      if (c.task && c.task !== before) log(st, 'start', `${c.name} starts ${st.tasks[c.task].label}`, { crew: c.id, task: c.task });
    }
    // Remember where each person is working, so autonomy 1 knows which station to stay at
    for (const c of st.crew) if (c.task) c.lastStation = stationOf(st.tasks[c.task]);

    // 2. Stage claim + chaos triggers
    if (!st.stageShot) {
      for (const c of st.crew) {
        const t = c.task && st.tasks[c.task];
        if (t && t.stage) { st.stageShot = t.shot; log(st, 'stage', `${st.shots[t.shot].name} takes the stage`, { shot: t.shot }); break; }
      }
    }
    fireEvents(st);
    if (st.pending) return;

    // 3. Work
    const rates = {};
    for (const c of st.crew) {
      if (!c.task) continue;
      const t = st.tasks[c.task];
      rates[t.id] = (rates[t.id] || 0) + workRate(st, c, t);
    }
    for (const id of Object.keys(rates)) {
      const t = st.tasks[id];
      t.progress += rates[id];
      if (t.progress < t.need - EPS) continue;
      const workers = workersOn(st, id);
      const weakest = workers.reduce((a, c) => (!a || c.reliability < a.reliability ? c : a), null);
      if (weakest && !st.flubbed[id] && roll(st, id) > weakest.reliability) {
        st.flubbed[id] = weakest.id;
        t.progress = Math.round(t.need * 0.5);
        log(st, 'flub', `${weakest.name} botched ${t.label}. Half of it needs redoing`, { crew: weakest.id, task: id });
        continue;
      }
      t.progress = t.need; t.done = true; t.doneAt = st.ticks;
      log(st, 'done', `${t.label} done`, { task: t.id });
      for (const c of st.crew) {
        if (c.task === id) c.task = null;
        if (c.override === id) c.override = null;
      }
    }

    // 4. Perishables
    for (const t of taskList(st)) {
      if (t.perishable && t.done && !shotLocked(st, t) && st.ticks - t.doneAt >= freshFor(st, t) * TPS) {
        t.done = false; t.doneAt = null; t.progress = 0; t.need = Math.round(t.redoDur * TPS); t.spoiled++;
        log(st, 'spoiled', `${t.label} went bad. Redo needed`, { task: t.id });
      }
    }

    // 5. Waits
    for (const w of st.waits.slice()) {
      if (--w.left <= 0) {
        st.waits.splice(st.waits.indexOf(w), 1);
        unblock(st, w.event);
        log(st, 'arrived', w.doneText || 'Delivery arrived', { event: w.event });
      }
    }

    // 6. Capture
    if (st.capture) {
      st.capture.left--;
      if (st.capture.left <= 0) {
        const s = st.shots[st.capture.shot];
        s.captured = true; s.capturedAt = st.ticks;
        st.capture = null; st.stageShot = null;
        log(st, 'captured', `${s.name} is in the can`, { shot: s.id, quality: s.quality });
        if (Object.values(st.shots).every(x => x.captured)) {
          st.over = true; st.endReason = 'wrap';
          log(st, 'wrap', "That's a wrap");
          return;
        }
      }
    }

    // 7. Money and clock
    if (st.ticks > st.level.timeLimit * TPS) spend(st, st.level.overtimeRate / TPS, 'overtime');
    if (st.level.hardStop && st.ticks >= st.level.hardStop * TPS) {
      st.over = true; st.endReason = 'pulled';
      log(st, 'pulled', 'The client pulled the plug');
    }
  }

  function stepTicks(st, n) { for (let i = 0; i < n && !st.over && !st.pending; i++) tick(st); }

  function advance(st, secs) {
    if (st.paused || st.over || st.pending) return;
    st.acc += secs * TPS;
    while (st.acc >= 1 && !st.over && !st.pending) { tick(st); st.acc -= 1; }
    if (st.pending) st.acc = 0;
  }

  /* ---------- Queries ---------- */

  function readiness(st, shotId) {
    const s = st.shots[shotId];
    const tasks = s.taskIds.map(i => st.tasks[i]);
    const missingRequired = tasks.filter(t => !t.done && !t.optional);
    const missingOptional = tasks.filter(t => !t.done && t.optional);
    const quality = Math.min(100, Math.max(0, 100 - s.penalty - missingOptional.reduce((a, t) => a + t.weight, 0)) + st.mods.post);
    let reason = null;
    if (s.captured) reason = 'Wrapped';
    else if (st.capture) reason = st.capture.shot === shotId ? 'Rolling' : `Rolling on ${st.shots[st.capture.shot].name}`;
    else if (stageCandidate(st) !== shotId) reason = st.stageShot ? `Stage busy with ${st.shots[st.stageShot].name}` : `${st.shots[stageCandidate(st)].name} goes first`;
    else if (missingRequired.length) reason = 'Needs ' + missingRequired.map(t => t.label).join(', ');
    return {
      ready: !reason, reason,
      quality: s.captured ? s.quality : quality,
      missingRequired, missingOptional,
      done: tasks.filter(t => t.done).length, total: tasks.length,
    };
  }

  function crewStatus(st, c) {
    if (typeof c === 'string') c = crewById(st, c);
    if (c.task) {
      const t = st.tasks[c.task];
      return {
        state: 'WORKING', task: t.id, text: t.label, shot: st.shots[t.shot].name,
        pct: t.progress / t.need, manual: !!c.override, cross: c.dept !== t.dept,
      };
    }
    if (st.over) return { state: 'WAITING', text: 'Wrapped' };
    if (st.capture) return { state: 'WAITING', text: 'Quiet on set. Rolling' };
    const own = taskList(st)
      .filter(t => t.dept === c.dept && !t.done && !shotLocked(st, t))
      .sort((a, b) => shotIndex(st, a.shot) - shotIndex(st, b.shot) || a.order - b.order);
    if (!own.length) return { state: 'WAITING', text: `No ${c.role} work left` };
    const blocked = own.find(t => st.blocks[t.id] && stageCandidate(st) === t.shot);
    if (blocked) return { state: 'BLOCKED', task: blocked.id, text: blockReason(st, blocked, false) };
    const t = own[0];
    const others = workersOn(st, t.id, c);
    const why = blockReason(st, t, false) || (others.length ? `${others[0].name} has ${t.label}` : null);
    const cand = stageCandidate(st);
    if (cand && t.shot !== cand && readiness(st, cand).ready) return { state: 'WAITING', task: t.id, text: 'Shot is ready. Call ACTION' };
    return { state: 'WAITING', task: t.id, text: why || 'Finding work' };
  }

  function taskStatus(st, id) {
    const t = st.tasks[id];
    const s = st.shots[t.shot];
    const workers = workersOn(st, id);
    const pct = t.progress / t.need;
    if (t.done) {
      if (t.perishable && !shotLocked(st, t)) {
        const ff = freshFor(st, t);
        const left = Math.max(0, ff - (st.ticks - t.doneAt) / TPS);
        return { state: 'done', text: `Fresh ${Math.ceil(left)}s`, pct: 1, fresh: left / ff };
      }
      return { state: 'done', text: 'Done', pct: 1 };
    }
    if (s.captured || (st.capture && st.capture.shot === t.shot)) return { state: 'skipped', text: 'Skipped', pct };
    if (st.blocks[id]) return { state: 'blocked', text: blockReason(st, t, false), pct };
    if (workers.length) {
      const rate = workers.reduce((a, c) => a + workRate(st, c, t), 0);
      const left = (t.need - t.progress) / TPS / rate;
      return { state: 'working', text: workers.map(c => c.name).join(' + ') + ` · ${Math.ceil(left)}s`, pct, workers: workers.map(c => c.id) };
    }
    const why = blockReason(st, t, false);
    if (why) return { state: 'waiting', text: t.spoiled && !why.startsWith('Needs') ? `Went bad. ${why}` : why, pct };
    return { state: 'open', text: st.flubbed[id] ? 'Botched. Redo' : (t.spoiled ? 'Went bad. Redo' : 'Up next'), pct };
  }

  /* ---------- Workstations ---------- */

  const STATION_NAMES = { light: 'Key light', table: 'Hero platform', camera: 'Camera', cart: 'Art table' };

  function stationOf(t) {
    if (t.dept === 'lighting') return 'light';
    if (t.dept === 'camera') return 'camera';
    if (t.dept === 'art' && !t.stage) return 'cart';
    return 'table';
  }

  // What a workstation is doing right now: the task in progress there, or the next one waiting.
  function stationInfo(st, station) {
    const cand = stageCandidate(st);
    const here = taskList(st).filter(t => stationOf(t) === station && !st.shots[t.shot].captured);
    const open = here.filter(t => !t.done)
      .sort((a, b) => (a.shot === cand ? 0 : 1) - (b.shot === cand ? 0 : 1) || shotIndex(st, a.shot) - shotIndex(st, b.shot) || a.order - b.order);
    const active = open.filter(t => workersOn(st, t.id).length);
    const t = active[0] || open[0];
    const name = STATION_NAMES[station] || station;
    if (!t) return { station, name, state: 'idle', text: 'Nothing left to do here', crew: [], pct: 0, next: [] };
    const ts = taskStatus(st, t.id);
    return {
      station, name, task: t.id, label: t.label, shot: st.shots[t.shot].name,
      crew: workersOn(st, t.id).map(c => c.name),
      pct: ts.pct, state: ts.state, text: ts.text,
      blocker: ts.state === 'waiting' || ts.state === 'blocked' ? ts.text : null,
      next: open.filter(x => x !== t).map(x => x.label),
    };
  }

  // Open tasks at a workstation, best first: the shot on stage, then shot priority, then data order.
  function stationTasks(st, station) {
    const cand = stageCandidate(st);
    return taskList(st)
      .filter(t => !t.done && stationOf(t) === station && !st.shots[t.shot].captured)
      .sort((a, b) => (a.shot === cand ? 0 : 1) - (b.shot === cand ? 0 : 1) || shotIndex(st, a.shot) - shotIndex(st, b.shot) || a.order - b.order);
  }

  // What happens if this crew member is sent to this workstation: 'go' (full speed), 'slow' (outside their
  // department, half speed), 'busy' (already on it) or 'no' (with the reason). Drives the green/amber/red highlights.
  function canAssign(st, crew, station) {
    const c = typeof crew === 'string' ? crewById(st, crew) : crew;
    if (st.over) return { state: 'no', why: 'The shoot is wrapped' };
    if (st.pending) return { state: 'no', why: 'Deal with the problem first' };
    const list = stationTasks(st, station);
    if (!list.length) return { state: 'no', why: 'Nothing left to do there' };
    const t = list.find(x => !blockReason(st, x, true));
    if (!t) return { state: 'no', task: list[0].id, label: list[0].label, why: blockReason(st, list[0], true) };
    if (c.override === t.id || c.task === t.id) return { state: 'busy', task: t.id, label: t.label, why: 'Already on it' };
    if (c.dept !== t.dept) return { state: 'slow', task: t.id, label: t.label, why: 'Half speed outside their department' };
    return { state: 'go', task: t.id, label: t.label, why: '' };
  }

  // The next thing the player should do for the shot on stage: the first required task that someone could start right
  // now and nobody is on, with the crew member best suited to it. null when the shot is ready, rolling or waiting.
  function nextStep(st) {
    const cand = stageCandidate(st);
    if (!cand || st.capture || st.pending) return null;
    const memo = {};
    const open = st.shots[cand].taskIds.map(id => st.tasks[id])
      .filter(t => !t.done && !t.optional && !workersOn(st, t.id).length && !blockReason(st, t, true))
      .sort((a, b) => chainLen(st, b, memo) - chainLen(st, a, memo) || a.order - b.order);
    const t = open[0];
    if (!t) return null;
    const who = st.crew.find(c => c.dept === t.dept && !c.task) || st.crew.find(c => c.dept === t.dept);
    return { task: t.id, label: t.label, station: stationOf(t), crew: who ? who.id : null, name: who ? who.name : '' };
  }

  // Who a blocked crew member is waiting on: the first unfinished dependency of their next task, and who does it.
  function waitingOn(st, crew) {
    const c = typeof crew === 'string' ? crewById(st, crew) : crew;
    const cand = stageCandidate(st);
    const mine = taskList(st).filter(t => t.dept === c.dept && !t.done && !shotLocked(st, t))
      .sort((a, b) => (a.shot === cand ? 0 : 1) - (b.shot === cand ? 0 : 1) || shotIndex(st, a.shot) - shotIndex(st, b.shot) || a.order - b.order)[0];
    if (!mine) return null;
    const dep = mine.needs.map(id => st.tasks[id]).find(d => !d.done);
    if (!dep) return null;
    const who = workersOn(st, dep.id)[0] || st.crew.find(x => x.dept === dep.dept);
    return { task: mine.id, label: mine.label, dep: dep.id, depLabel: dep.label, name: who ? who.name : '', working: !!workersOn(st, dep.id).length };
  }

  // The task an idle crew member would take if they were on auto, or null. Used to tell "waiting for orders"
  // (work exists) from "nothing for them to do" (no work exists).
  function idleWork(st, crew) {
    const c = typeof crew === 'string' ? crewById(st, crew) : crew;
    if (st.over || st.capture || st.pending || c.task) return null;
    return pickAuto(st, c);
  }

  function score(st) {
    const lv = st.level;
    const shots = Object.values(st.shots);
    const wrapped = shots.filter(s => s.captured);
    const avg = Math.round(wrapped.reduce((a, s) => a + s.quality, 0) / shots.length);
    const time = st.ticks / TPS;
    const allShots = wrapped.length === shots.length;
    const onTime = allShots && time <= lv.timeLimit;
    const quality = allShots && avg >= lv.qualityTarget;
    const profit = Math.round(st.budget);
    const inBudget = profit >= 0;
    const third = quality && inBudget;
    return {
      stars: allShots ? 1 + (onTime ? 1 : 0) + (third ? 1 : 0) : 0,
      allShots, onTime, quality, inBudget, third,
      shotsDone: wrapped.length, shotsTotal: shots.length,
      avgQuality: avg, time, profit,
      crewCost: st.crewCost, extraCost: st.extraCost, overtimeCost: Math.round(st.overtimeCost),
    };
  }

  /* ---------- Commands ---------- */

  const ok = (message) => ({ ok: true, message: message || '' });
  const fail = (message) => ({ ok: false, message });

  function command(st, cmd) {
    switch (cmd.type) {
      case 'assign': {
        if (st.over) return fail('The shoot is wrapped');
        if (st.pending) return fail('Deal with the problem first');
        const c = crewById(st, cmd.crew);
        const t = st.tasks[cmd.task];
        if (!c || !t) return fail('Unknown crew member or task');
        if (c.override === t.id) return ok(`${c.name} is already on ${t.label}`);
        const why = blockReason(st, t, true);
        if (why) return fail(why);
        c.override = t.id;
        c.task = t.id;
        if (t.stage && !st.stageShot) { st.stageShot = t.shot; log(st, 'stage', `${st.shots[t.shot].name} takes the stage`, { shot: t.shot }); }
        const msg = `${c.name} on ${t.label}` + (c.dept !== t.dept ? ' at half speed' : '');
        log(st, 'assign', msg, { crew: c.id, task: t.id });
        return ok(msg);
      }
      case 'release': {
        const c = crewById(st, cmd.crew);
        if (!c) return fail('Unknown crew member');
        if (!c.override) return ok(`${c.name} is already on auto`);
        c.override = null; c.task = null;
        log(st, 'release', `${c.name} back on auto`, { crew: c.id });
        return ok(`${c.name} back on auto`);
      }
      case 'move': {
        const i = st.priority.indexOf(cmd.shot);
        const j = i + cmd.dir;
        if (i < 0 || j < 0 || j >= st.priority.length) return fail('Cannot move that shot');
        const p = st.priority.slice();
        [p[i], p[j]] = [p[j], p[i]];
        st.priority = p;
        log(st, 'priority', `Shot order: ${p.map(id => st.shots[id].name).join(', ')}`);
        return ok(st.stageShot ? `Order changed. ${st.shots[st.stageShot].name} stays on stage until it's shot` : 'Shot order changed');
      }
      case 'setPriority': {
        const order = cmd.order || [];
        const ids = Object.keys(st.shots);
        if (order.length !== ids.length || !ids.every(id => order.includes(id))) return fail('Priority must list every shot once');
        st.priority = order.slice();
        return ok('Shot order changed');
      }
      case 'action': {
        if (st.over) return fail('The shoot is wrapped');
        if (st.pending) return fail('Deal with the problem first');
        if (st.capture) return fail('Already rolling');
        const id = stageCandidate(st);
        if (!id) return fail('Nothing left to shoot');
        const r = readiness(st, id);
        if (!r.ready) return fail(r.reason);
        const s = st.shots[id];
        s.quality = r.quality;
        s.skipped = r.missingOptional.map(t => t.id);
        st.capture = { shot: id, left: actionTicks(st), total: actionTicks(st) };
        for (const c of st.crew) {
          if (c.task && st.tasks[c.task].shot === id) c.task = null;
          if (c.override && st.tasks[c.override].shot === id) c.override = null;
        }
        log(st, 'action', `ACTION on ${s.name}` + (s.skipped.length ? ` without ${s.skipped.map(x => st.tasks[x].label).join(', ')}` : ''), { shot: id, quality: s.quality });
        return ok(`Rolling on ${s.name}`);
      }
      case 'choose': {
        if (!st.pending) return fail('Nothing to decide');
        const ev = eventById(st, st.pending);
        const o0 = ev.options.find(x => x.id === cmd.option);
        if (!o0) return fail('Unknown option');
        const o = resolveOption(st, o0);
        const shot = ev.trigger.shot;
        if (o.cost) spend(st, o.cost, 'extra');
        if (o.kind === 'task') {
          const dur = o.perk && hasPerk(st, o.perk) ? o.perkDur : o.dur;
          const id = `${ev.id}.fix`;
          st.tasks[id] = makeTask({ id, dept: o.dept, label: o.taskLabel, dur, stage: true }, shot, 1000);
          st.shots[shot].taskIds.push(id);
          for (const tid of ev.blocks) st.tasks[tid].needs.push(id);
          unblock(st, ev.id);
          // Choosing the repair is the order. Crew who would not pick it up on their own start it now.
          const fixer = st.crew.find(c => c.dept === o.dept);
          if (fixer && fixer.autonomy < 2 && !fixer.override) { fixer.override = id; fixer.task = id; }
        } else if (o.kind === 'wait') {
          st.blockText[ev.id] = o.waitText;
          st.waits.push({ event: ev.id, left: Math.round(o.secs * TPS), total: Math.round(o.secs * TPS), doneText: o.owned ? 'Backup light is up' : 'Backup light arrived' });
        } else if (o.kind === 'penalty') {
          st.shots[shot].penalty += o.penalty;
          unblock(st, ev.id);
        }
        st.pending = null;
        st.chosen[ev.id] = o.id;
        log(st, 'choice', `${o.label}` + (o.cost ? ` (-$${o.cost})` : ''), { event: ev.id, option: o.id });
        return ok(o.label);
      }
      case 'pause': {
        st.paused = cmd.value != null ? !!cmd.value : !st.paused;
        return ok(st.paused ? 'Paused' : 'Resumed');
      }
      default:
        return fail(`Unknown command "${cmd.type}"`);
    }
  }

  /* ---------- Debug ---------- */

  function snapshot(st) {
    return JSON.stringify({
      ticks: st.ticks, over: st.over, priority: st.priority, stageShot: st.stageShot, capture: st.capture,
      tasks: st.tasks, shots: st.shots, crew: st.crew, budget: st.budget, blocks: st.blocks, waits: st.waits, flubbed: st.flubbed,
    });
  }

  function anyAvailableWork(st) {
    return st.crew.some(c => !c.task && pickAuto(st, c));
  }

  function fmtTime(secs) {
    const s = Math.max(0, Math.floor(secs));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function fmtMoney(n) {
    const v = Math.round(n);
    return (v < 0 ? '-' : '') + '$' + Math.abs(v).toLocaleString('en-US');
  }

  return {
    TPS, validateLevel, hireCheck, companyMods, createGame, tick, stepTicks, advance, command,
    readiness, crewStatus, taskStatus, stageCandidate, chainLen, blockReason, eventOptions, score, stationOf, stationInfo,
    stationTasks, canAssign, idleWork, tierAutonomy, nextStep, waitingOn,
    snapshot, anyAvailableWork, seconds, fmtTime, fmtMoney, actionTicks, freshFor, hasPerk,
  };
});
