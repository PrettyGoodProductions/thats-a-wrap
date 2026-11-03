/*
  That's a Wrap! simulation core.
  Pure game logic with no DOM, so it runs the same in the browser and in Node tests.

  Time runs in fixed ticks (10 per second). Same level + same crew + same seed + same commands
  at the same ticks always gives the same result.

  Two clocks: game seconds drive the action; the fictional production day (8 AM to 6 PM by default)
  is derived from them, and day rates and overtime are priced on that fictional day.

  Each tick:
    1. Assignment: every crew member recovers from a botch, follows a manual override, keeps their task,
       finishes a pause between tasks (organization), or picks the best eligible task in their department.
       Starting a task at another station means walking there first.
    2. Stage claim: the first stage task started locks the stage to that shot. Chaos events can fire here.
    3. Work: crew who have arrived add progress (speed, specialties, chemistry). A finished task can be
       botched by an unreliable crew member: a short recovery and half of it redone, once per task.
       Finishing a task hands work to the next department, which costs a handoff delay shaped by the
       DP's leadership and the pair's chemistry.
    4. Perishables: finished perishable tasks go bad after freshFor seconds.
    5. Waits: rentals on the way count down.
    6. Capture: a running ACTION counts down. Then the take is reviewed: accept it or go again.
    7. Money and clock: overtime at 1.5x after the day's hours, 2x after 12; the client pulls the plug at hardStop.
  While a chaos decision or a take review is pending, the clock is frozen.
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
  const SKILL_SPREAD = 25;        // quality points lost by a crew with skill 0
  const MACRO_BONUS = 8;

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

  /* ---------- Company upgrades ---------- */

  const BASE_MODS = { speed: 1, artSpeed: 1, fresh: 1, backupLight: false, post: 0, gearPackage: null };

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
      if (e.gearPackage != null) m.gearPackage = m.gearPackage == null ? e.gearPackage : Math.min(m.gearPackage, e.gearPackage);
    }
    return m;
  }

  /* ---------- Hiring and the estimate ---------- */

  // Pairs among these candidate ids who work well together or clash
  function chemistryFor(level, ids) {
    return (level.chemistry || []).filter(p => ids.includes(p.a) && ids.includes(p.b));
  }

  // picks: { dept: candidate } -> the production estimate
  function estimate(level, picks, mods) {
    mods = Object.assign({}, BASE_MODS, mods || {});
    const roles = level.hiring || [];
    const missing = roles.filter(r => !picks[r.dept]).map(r => r.role);
    const crew = Object.values(picks).reduce((a, c) => a + (c ? c.rate : 0), 0);
    const costs = level.costs || {};
    const gear = mods.gearPackage != null ? mods.gearPackage : (costs.gear || 0);
    const prep = costs.prep || 0;
    const total = crew + gear + prep;
    const hours = level.dayHours || 10;
    return {
      crew, gear, prep, total,
      budget: level.budget, margin: level.budget - total,
      overtimePerHour: Math.round(crew / hours * 1.5),
      missing, ok: !missing.length,
      // older names
      cost: crew, left: level.budget - total,
    };
  }
  const hireCheck = estimate;

  /* ---------- Setup ---------- */

  function createGame(level, opts) {
    opts = opts || {};
    const errors = validateLevel(level);
    if (errors.length) throw new Error('Invalid level:\n' + errors.join('\n'));
    const mods = Object.assign({}, BASE_MODS, opts.mods || {});
    const src = opts.crew || level.crew;
    const crew = src.map((c, i) => ({
      id: opts.crew ? c.dept : c.id, cid: c.id, name: c.name, role: c.role, dept: c.dept,
      speed: c.speed || 1,
      skill: c.skill != null ? c.skill : 1,
      org: c.org != null ? c.org : 1,
      reliability: c.reliability != null ? c.reliability : 1,
      leadership: c.leadership || 0,
      specialty: c.specialty || null,
      perks: (c.perks || []).concat(c.specialty ? [c.specialty] : []),
      rate: c.rate || 0, look: c.look || null, tier: c.tier || '',
      chem: [],
      task: null, override: null, order: i,
      at: 'idle', move: 0, moveTotal: 0, pause: 0, recover: 0,
    }));
    for (const p of chemistryFor(level, crew.map(c => c.cid))) {
      const a = crew.find(c => c.cid === p.a), b = crew.find(c => c.cid === p.b);
      a.chem.push({ with: b.id, name: b.name, kind: p.kind, note: p.note });
      b.chem.push({ with: a.id, name: a.name, kind: p.kind, note: p.note });
      if (p.kind === 'good') { a.speed *= 1.08; b.speed *= 1.08; }
    }
    const tasks = {};
    const shots = {};
    let order = 0;
    for (const s of level.shots) {
      shots[s.id] = { id: s.id, name: s.name, macro: !!s.macro, taskIds: s.tasks.map(t => t.id), captured: false, capturedAt: null,
        quality: null, skipped: [], penalty: 0, takes: 0, setup: 0, exec: 0, bonus: 0 };
      for (const t of s.tasks) {
        if (!crew.some(c => c.dept === t.dept)) throw new Error(`No crew member for ${t.dept}`);
        tasks[t.id] = makeTask(t, s.id, order++);
      }
    }
    const crewCost = crew.reduce((a, c) => a + c.rate, 0);
    const costs = level.costs || {};
    const gear = mods.gearPackage != null ? mods.gearPackage : (costs.gear || 0);
    const prep = costs.prep || 0;
    const dp = crew.find(c => c.dept === 'camera');
    return {
      level, seed: (opts.seed >>> 0) || 1,
      physical: opts.physical !== false,
      reviewOn: opts.review !== false,
      mods,
      lead: dp ? dp.leadership : 0,
      ticks: 0, acc: 0, paused: false, over: false, endReason: null,
      priority: level.shots.map(s => s.id),
      stageShot: null, capture: null, review: null,
      tasks, shots, crew,
      budget: level.budget - crewCost - gear - prep,
      crewCost, gearCost: gear, prepCost: prep, extraCost: 0, overtimeCost: 0,
      pending: null, fired: {}, chosen: {}, blocks: {}, blockText: {}, waits: [], flubbed: {},
      log: [],
    };
  }

  function makeTask(t, shot, order) {
    return {
      id: t.id, shot, dept: t.dept, label: t.label,
      dur: t.dur, needs: (t.needs || []).slice(),
      stage: !!t.stage, optional: !!t.optional, weight: t.weight != null ? t.weight : DEFAULT_WEIGHT,
      rig: !!t.rig, fix: !!t.fix,
      perishable: !!t.perishable, freshFor: t.freshFor || 0, redoDur: t.redoDur || t.dur,
      order,
      need: Math.round(t.dur * TPS), progress: 0, done: false, doneAt: null, spoiled: 0,
      readyAt: 0, handoffFrom: null, skill: null, doneBy: null,
    };
  }

  /* ---------- Helpers ---------- */

  const seconds = st => st.ticks / TPS;
  const shotIndex = (st, id) => st.priority.indexOf(id);
  const crewById = (st, id) => st.crew.find(c => c.id === id);
  const taskList = st => Object.values(st.tasks);
  const eventById = (st, id) => (st.level.events || []).find(e => e.id === id);
  const hasPerk = (st, perk) => st.crew.some(c => c.perks.includes(perk));
  const has = (c, perk) => c.perks.includes(perk);

  function workRate(st, c, t) {
    let r = (c.dept === t.dept ? 1 : st.level.crossDeptRate) * c.speed * st.mods.speed;
    if (c.dept === 'art') r *= st.mods.artSpeed;
    if (t.rig && has(c, 'rigging')) r *= 1.4;
    if (t.id === 'cheese.melt' && has(c, 'cheese')) r *= 1.4;
    return r;
  }

  function log(st, type, text, extra) {
    st.log.push(Object.assign({ tick: st.ticks, type, text }, extra || {}));
  }

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
    return s.captured || (!!st.capture && st.capture.shot === t.shot) || (!!st.review && st.review.shot === t.shot);
  }

  function workersOn(st, taskId, except) {
    return st.crew.filter(c => c !== except && c.task === taskId);
  }

  /* ---------- Places and walking ---------- */

  function stationOf(t) {
    if (t.dept === 'lighting') return 'light';
    if (t.dept === 'camera') return 'camera';
    if (t.dept === 'art' && !t.stage) return 'cart';
    return 'table';
  }

  function placeOf(st, c, key) {
    const lv = st.level;
    if (key === 'idle') return (lv.idle && lv.idle[c.dept]) || { x: 180, y: 300 };
    return (lv.stations && lv.stations[key]) || { x: 180, y: 220 };
  }

  function walkTicks(st, c, to) {
    if (!st.physical || !st.level.stations) return 0;
    const a = placeOf(st, c, c.at), b = placeOf(st, c, to);
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (dist < 1) return 0;
    const pace = (st.level.walkSpeed || 120) * (0.7 + 0.3 * c.org);
    return Math.max(1, Math.round(dist / pace * TPS));
  }

  function startTask(st, c, id) {
    c.task = id;
    c.pause = 0;
    const to = stationOf(st.tasks[id]);
    if (to !== c.at) {
      c.move = c.moveTotal = walkTicks(st, c, to);
      c.from = c.at;
      c.at = to;
    }
    log(st, 'start', `${c.name} starts ${st.tasks[id].label}`, { crew: c.id, task: id });
  }

  // Seconds lost handing work from one crew member to another
  function handoffTicks(st, from, to) {
    if (!st.physical || !from || !to || from === to) return 0;
    const chem = from.chem.find(x => x.with === to.id);
    if (chem && chem.kind === 'good') return 0;
    const factor = chem && chem.kind === 'clash' ? 1.5 : 1;
    return Math.round((st.level.handoff || 0) * TPS * (1 - 0.6 * st.lead) * factor);
  }

  /* ---------- Blocks and picking ---------- */

  function blockReason(st, t, manual) {
    if (t.done) return 'Already done';
    if (shotLocked(st, t)) return `${st.shots[t.shot].name} is already shot`;
    if (st.blocks[t.id]) return st.blockText[st.blocks[t.id]] || eventById(st, st.blocks[t.id]).blockText;
    const missing = t.needs.filter(d => !st.tasks[d].done);
    if (missing.length) return `Needs ${st.tasks[missing[0]].label}`;
    if (t.readyAt && st.ticks < t.readyAt) return `Handoff from ${t.handoffFrom}`;
    const cand = stageCandidate(st);
    if (t.stage && cand !== t.shot) {
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

  function pickAuto(st, c) {
    let best = null, bestKey = null;
    const memo = {};
    for (const t of taskList(st)) {
      if (t.dept !== c.dept) continue;
      if (blockReason(st, t, false)) continue;
      if (workersOn(st, t.id, c).length) continue;
      const key = [shotIndex(st, t.shot), -chainLen(st, t, memo), t.order];
      if (!best || lexLess(key, bestKey)) { best = t; bestKey = key; }
    }
    return best ? best.id : null;
  }

  function spend(st, amount, kind) {
    st.budget -= amount;
    if (kind === 'overtime') st.overtimeCost += amount;
    else st.extraCost += amount;
  }

  /* ---------- Quality ---------- */

  // Setup (what was prepared), execution (crew skill) and bonuses make up a shot's quality.
  function shotQuality(st, s, execOverride) {
    const tasks = s.taskIds.map(i => st.tasks[i]);
    const missingOptional = tasks.filter(t => !t.done && t.optional);
    const setup = Math.max(0, 100 - s.penalty - missingOptional.reduce((a, t) => a + t.weight, 0));
    const done = tasks.filter(t => t.done && t.skill != null);
    const avgSkill = done.length ? done.reduce((a, t) => a + t.skill, 0) / done.length : 1;
    const exec = execOverride != null ? execOverride : Math.round((1 - avgSkill) * SKILL_SPREAD);
    const bonus = (s.macro && st.crew.some(c => c.dept === 'camera' && has(c, 'macro')) ? MACRO_BONUS : 0) + st.mods.post;
    return { setup, exec, bonus, avgSkill, quality: Math.min(100, Math.max(0, setup - exec + bonus)) };
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

  function resolveOption(st, o) {
    if (o.kind === 'wait' && st.mods.backupLight) {
      return Object.assign({}, o, { label: 'Grab our backup light', cost: 0, secs: 2, waitText: 'Grabbing the backup from the cage', owned: true });
    }
    return o;
  }

  function unblock(st, evId) {
    for (const tid of Object.keys(st.blocks)) if (st.blocks[tid] === evId) delete st.blocks[tid];
  }

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

  function finalizeShot(st, id) {
    const s = st.shots[id];
    s.captured = true; s.capturedAt = st.ticks;
    st.stageShot = null;
    log(st, 'captured', `${s.name} is in the can`, { shot: s.id, quality: s.quality });
    if (Object.values(st.shots).every(x => x.captured)) {
      st.over = true; st.endReason = 'wrap';
      log(st, 'wrap', "That's a wrap");
    }
  }

  function tick(st) {
    if (st.over || st.pending || st.review) return;
    st.ticks++;

    // 1. Assignment
    for (const c of st.crew) {
      if (c.recover > 0) { c.recover--; continue; }
      if (c.override) {
        if (blockReason(st, st.tasks[c.override], true)) { c.override = null; c.task = null; }
        else { if (c.task !== c.override) startTask(st, c, c.override); continue; }
      }
      if (c.task && !blockReason(st, st.tasks[c.task], false)) continue;
      c.task = null;
      if (c.pause > 0) { c.pause--; continue; }
      const pick = pickAuto(st, c);
      if (pick) startTask(st, c, pick);
    }

    // 2. Stage claim + chaos triggers
    if (!st.stageShot) {
      for (const c of st.crew) {
        const t = c.task && st.tasks[c.task];
        if (t && t.stage) { st.stageShot = t.shot; log(st, 'stage', `${st.shots[t.shot].name} takes the stage`, { shot: t.shot }); break; }
      }
    }
    fireEvents(st);
    if (st.pending) return;

    // 3. Work (walkers and recovering crew add nothing)
    const rates = {};
    for (const c of st.crew) {
      if (!c.task) continue;
      if (c.move > 0) { c.move--; continue; }
      if (c.recover > 0) continue;
      const t = st.tasks[c.task];
      rates[t.id] = (rates[t.id] || 0) + workRate(st, c, t);
    }
    for (const id of Object.keys(rates)) {
      const t = st.tasks[id];
      t.progress += rates[id];
      if (t.progress < t.need - EPS) continue;
      const workers = workersOn(st, id).filter(c => c.move === 0);
      const weakest = workers.reduce((a, c) => (!a || c.reliability < a.reliability ? c : a), null);
      const safety = weakest ? weakest.reliability + (1 - weakest.reliability) * 0.5 * st.lead : 1;
      if (weakest && !st.flubbed[id] && roll(st, id) > safety) {
        st.flubbed[id] = weakest.id;
        t.progress = Math.round(t.need * 0.5);
        if (st.physical) weakest.recover = 2 * TPS;
        log(st, 'flub', `${weakest.name} botched ${t.label}. Half of it needs redoing`, { crew: weakest.id, task: id });
        continue;
      }
      t.progress = t.need; t.done = true; t.doneAt = st.ticks;
      const owner = workers.find(c => c.dept === t.dept) || workers[0];
      t.doneBy = owner ? owner.id : null;
      t.skill = workers.length ? Math.max(...workers.map(c => c.skill * (c.dept === t.dept ? 1 : 0.8))) : 1;
      log(st, 'done', `${t.label} done`, { task: t.id, crew: t.doneBy });
      for (const c of st.crew) {
        if (c.task === id) {
          c.task = null;
          if (st.physical) c.pause = Math.round((1 - c.org) * 4 * TPS * (1 - 0.5 * st.lead));
        }
        if (c.override === id) c.override = null;
      }
      // Handoffs to the departments waiting on this task
      for (const did of st.shots[t.shot].taskIds) {
        const d = st.tasks[did];
        if (d.done || !d.needs.includes(id)) continue;
        const to = st.crew.find(c => c.dept === d.dept);
        const ht = handoffTicks(st, owner, to);
        if (ht > 0 && st.ticks + ht > d.readyAt) { d.readyAt = st.ticks + ht; d.handoffFrom = owner.name; }
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

    // 6. Capture, then review the take
    if (st.capture) {
      st.capture.left--;
      if (st.capture.left <= 0) {
        const id = st.capture.shot;
        st.capture = null;
        if (st.reviewOn) {
          st.review = { shot: id };
          log(st, 'review', `Checking the take on ${st.shots[id].name}`, { shot: id });
        } else {
          finalizeShot(st, id);
          if (st.over) return;
        }
      }
    }

    // 7. Money and clock on the fictional day
    const limit = st.level.timeLimit * TPS;
    if (st.ticks > limit) {
      const hoursPerTick = (st.level.dayHours || 10) / st.level.timeLimit / TPS;
      const mult = st.ticks > limit * 1.2 ? 2 : 1.5;
      spend(st, st.crewCost / (st.level.dayHours || 10) * mult * hoursPerTick, 'overtime');
    }
    if (st.level.hardStop && st.ticks >= st.level.hardStop * TPS && !st.over) {
      st.over = true; st.endReason = 'pulled';
      // Kill fee: the client only pays half for an unfinished job
      st.lostRevenue = Math.round(st.level.budget * 0.5);
      st.budget -= st.lostRevenue;
      log(st, 'pulled', 'The client pulled the plug and pays a half kill fee');
    }
  }

  function frozen(st) { return st.over || st.pending || st.review; }
  function stepTicks(st, n) { for (let i = 0; i < n && !frozen(st); i++) tick(st); }

  function advance(st, secs) {
    if (st.paused || frozen(st)) return;
    st.acc += secs * TPS;
    while (st.acc >= 1 && !frozen(st)) { tick(st); st.acc -= 1; }
    if (frozen(st)) st.acc = 0;
  }

  /* ---------- Queries ---------- */

  function dayMinutes(st) {
    const lv = st.level;
    return (lv.dayStart || 480) + st.ticks / TPS * ((lv.dayHours || 10) * 60 / lv.timeLimit);
  }

  function clockText(st) {
    const m = Math.floor(dayMinutes(st));
    const h = Math.floor(m / 60) % 24, mm = m % 60;
    return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  }

  function readiness(st, shotId) {
    const s = st.shots[shotId];
    const tasks = s.taskIds.map(i => st.tasks[i]);
    const missingRequired = tasks.filter(t => !t.done && !t.optional);
    const missingOptional = tasks.filter(t => !t.done && t.optional);
    const q = shotQuality(st, s);
    let reason = null;
    if (s.captured) reason = 'Wrapped';
    else if (st.review) reason = st.review.shot === shotId ? 'Reviewing the take' : `Reviewing ${st.shots[st.review.shot].name}`;
    else if (st.capture) reason = st.capture.shot === shotId ? 'Rolling' : `Rolling on ${st.shots[st.capture.shot].name}`;
    else if (stageCandidate(st) !== shotId) reason = st.stageShot ? `Stage busy with ${st.shots[st.stageShot].name}` : `${st.shots[stageCandidate(st)].name} goes first`;
    else if (missingRequired.length) reason = 'Needs ' + missingRequired.map(t => t.label).join(', ');
    return {
      ready: !reason, reason,
      quality: s.captured ? s.quality : q.quality,
      exec: q.exec, setup: q.setup, bonus: q.bonus,
      missingRequired, missingOptional,
      done: tasks.filter(t => t.done).length, total: tasks.length,
    };
  }

  function crewStatus(st, c) {
    if (typeof c === 'string') c = crewById(st, c);
    if (c.recover > 0) {
      const t = c.task && st.tasks[c.task];
      return { state: 'RECOVERING', task: t && t.id, text: t ? `Fixing the botched ${t.label.toLowerCase()}` : 'Shaking it off', pct: 0 };
    }
    if (c.task) {
      const t = st.tasks[c.task];
      if (c.move > 0) {
        const where = (st.level.stations && st.level.stations[c.at] && st.level.stations[c.at].label) || c.at;
        return { state: 'MOVING', task: t.id, text: `Walking to ${where}`, pct: 1 - c.move / Math.max(1, c.moveTotal), manual: !!c.override };
      }
      return {
        state: 'WORKING', task: t.id, text: t.label, shot: st.shots[t.shot].name,
        pct: t.progress / t.need, manual: !!c.override, cross: c.dept !== t.dept,
      };
    }
    if (st.over) return { state: 'WAITING', text: 'Wrapped' };
    if (st.review) return { state: 'WAITING', text: 'Watching playback' };
    if (st.capture) return { state: 'WAITING', text: 'Quiet on set. Rolling' };
    if (c.pause > 0) return { state: 'IDLE', text: 'Checking the call sheet' };
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
    return { state: 'WAITING', task: t.id, text: why || 'Finding work', handoff: !!(why && why.startsWith('Handoff')) };
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
    if (s.captured || shotLocked(st, t)) return { state: 'skipped', text: 'Skipped', pct };
    if (st.blocks[id]) return { state: 'blocked', text: blockReason(st, t, false), pct };
    if (workers.length) {
      const here = workers.filter(c => c.move === 0 && c.recover === 0);
      if (!here.length) {
        const w = workers[0];
        return { state: 'working', text: w.recover > 0 ? `${w.name} recovering` : `${w.name} walking over`, pct, workers: workers.map(c => c.id) };
      }
      const rate = here.reduce((a, c) => a + workRate(st, c, t), 0);
      const left = (t.need - t.progress) / TPS / rate;
      return { state: 'working', text: workers.map(c => c.name).join(' + ') + ` · ${Math.ceil(left)}s`, pct, workers: workers.map(c => c.id) };
    }
    const why = blockReason(st, t, false);
    if (why) return { state: 'waiting', text: t.spoiled && !why.startsWith('Needs') ? `Went bad. ${why}` : why, pct };
    return { state: 'open', text: st.flubbed[id] ? 'Botched. Redo' : (t.spoiled ? 'Went bad. Redo' : 'Up next'), pct };
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
    const overMin = Math.max(0, dayMinutes(st) - ((lv.dayStart || 480) + (lv.dayHours || 10) * 60));
    return {
      stars: allShots ? 1 + (onTime ? 1 : 0) + (third ? 1 : 0) : 0,
      allShots, onTime, quality, inBudget, third,
      shotsDone: wrapped.length, shotsTotal: shots.length,
      avgQuality: avg, time, profit, wrapClock: clockText(st), overtimeMinutes: Math.round(overMin),
      crewCost: st.crewCost, gearCost: st.gearCost, prepCost: st.prepCost, extraCost: st.extraCost, overtimeCost: Math.round(st.overtimeCost), lostRevenue: st.lostRevenue || 0,
      takes: shots.reduce((a, s) => a + s.takes, 0),
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
        if (st.review) return fail('Check the take first');
        const c = crewById(st, cmd.crew);
        const t = st.tasks[cmd.task];
        if (!c || !t) return fail('Unknown crew member or task');
        if (c.override === t.id) return ok(`${c.name} is already on ${t.label}`);
        const why = blockReason(st, t, true);
        if (why) return fail(why);
        c.override = t.id;
        if (c.task !== t.id) startTask(st, c, t.id);
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
        if (st.review) return fail('Check the take first');
        if (st.capture) return fail('Already rolling');
        const id = stageCandidate(st);
        if (!id) return fail('Nothing left to shoot');
        const r = readiness(st, id);
        if (!r.ready) return fail(r.reason);
        const s = st.shots[id];
        const q = shotQuality(st, s);
        s.setup = q.setup; s.exec = q.exec; s.bonus = q.bonus; s.quality = q.quality;
        s.takes = 1;
        s.skipped = r.missingOptional.map(t => t.id);
        st.capture = { shot: id, left: actionTicks(st), total: actionTicks(st), take: 1 };
        for (const c of st.crew) {
          if (c.task && st.tasks[c.task].shot === id) c.task = null;
          if (c.override && st.tasks[c.override].shot === id) c.override = null;
        }
        log(st, 'action', `ACTION on ${s.name}` + (s.skipped.length ? ` without ${s.skipped.map(x => st.tasks[x].label).join(', ')}` : ''), { shot: id, quality: s.quality });
        return ok(`Rolling on ${s.name}`);
      }
      case 'accept': {
        if (!st.review) return fail('No take to review');
        const id = st.review.shot;
        st.review = null;
        finalizeShot(st, id);
        return ok(`${st.shots[id].name} is in the can`);
      }
      case 'retake': {
        if (!st.review) return fail('No take to review');
        const id = st.review.shot;
        const s = st.shots[id];
        s.takes++;
        s.exec = Math.floor(s.exec / 2);
        s.quality = Math.min(100, Math.max(0, s.setup - s.exec + s.bonus));
        const t = actionTicks(st) + Math.round((st.level.retakeReset || 0) * TPS);
        st.capture = { shot: id, left: t, total: t, take: s.takes };
        st.review = null;
        log(st, 'retake', `Going again on ${s.name}, take ${s.takes}`, { shot: id });
        return ok(`Back to one. Take ${s.takes}`);
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
          st.tasks[id] = makeTask({ id, dept: o.dept, label: o.taskLabel, dur, stage: true, fix: true }, shot, 1000);
          st.shots[shot].taskIds.push(id);
          for (const tid of ev.blocks) st.tasks[tid].needs.push(id);
          unblock(st, ev.id);
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
      ticks: st.ticks, over: st.over, priority: st.priority, stageShot: st.stageShot, capture: st.capture, review: st.review,
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
    TPS, validateLevel, estimate, hireCheck, chemistryFor, companyMods, createGame, tick, stepTicks, advance, command,
    readiness, crewStatus, taskStatus, stageCandidate, chainLen, blockReason, eventOptions, score, shotQuality,
    stationOf, dayMinutes, clockText, handoffTicks,
    snapshot, anyAvailableWork, seconds, fmtTime, fmtMoney, actionTicks, freshFor, hasPerk,
  };
});
