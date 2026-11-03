/*
  Screens: title -> office -> (job board) -> hire -> shoot -> take review -> wrap -> office.
  All game rules live in sim.js and all drawing in art.js. This file builds screens, saves progress and forwards taps.
*/
(function () {
  'use strict';
  const S = window.WrapSim;
  const A = window.WrapArt;
  const LEVEL = window.LEVELS.burgerJob;
  const CO = window.LEVELS.company;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = S.fmtMoney;
  const MIN_PER_SEC = (LEVEL.dayHours || 10) * 60 / LEVEL.timeLimit;

  const SPEC = {
    quickRoll: 'One-take: rolls in 3s, not 5',
    spareBulb: 'Spare bulb: fixes dead lights fast',
    foodWhisperer: 'Food whisperer: food stays fresh longer',
    macro: 'Macro specialist: +8 quality on close-ups',
    rigging: 'Rigger: rig work 40% faster',
    cheese: 'Cheese wrangler: melts 40% faster',
  };
  const SHOT_COLOR = { hero: '#E7B84F', cheese: '#D86B56', sauce: '#7D9E91' };
  const KEY_AIM = { hero: [6, 20], cheese: [20, 32], sauce: [32, 14] };
  const CAM_SHIFT = { hero: [0, 0], cheese: [-30, 6], sauce: [-16, -8] };
  const CLIENT_LINES = ['Can it pop more?', 'Is that the hero burger?', 'Love it. One tiny note...', 'More cheese?', 'Legal wants the bun moved.', 'Can we see it bigger?'];

  /* ================= Save (this device only) ================= */

  const SAVE_KEY = 'thats-a-wrap-save-v1';
  function freshSave() { return { bank: 0, owned: [], best: {}, runs: 0 }; }
  function loadSave() {
    try { const v = JSON.parse(localStorage.getItem(SAVE_KEY)); if (v && typeof v.bank === 'number') return Object.assign(freshSave(), v); } catch (e) { /* storage blocked */ }
    return freshSave();
  }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* storage blocked */ } }
  let save = loadSave();

  /* ================= State ================= */

  let screen = 'title';
  const picks = {};
  const revealed = {};
  let st = null;
  let selected = null;
  let speed = 1;
  let last = 0;
  let toast = null;
  let tipUntil = 0;
  let modal = null;
  let lastCapture = null;
  let banked = false;
  let logSeen = 0;
  let clientLine = { text: '', until: 0, next: 0, i: 0 };
  const view = {};

  function resetView() {
    Object.assign(view, { pups: {}, cb: {}, icons: {}, rowsKey: '', depth: '', propKey: '', monKey: '', cartN: -1, pos: {}, cam: '' });
  }

  /* ================= Helpers ================= */

  const allCands = () => LEVEL.hiring.flatMap(r => r.candidates.map(c => Object.assign({ role: r.role, dept: r.dept }, c)));
  function candidate(dept, id) {
    const role = LEVEL.hiring.find(r => r.dept === dept);
    const c = role.candidates.find(x => x.id === id);
    return c && Object.assign({ role: role.role, dept }, c);
  }
  function chosenMap() {
    const m = {};
    for (const d in picks) if (picks[d]) m[d] = candidate(d, picks[d]);
    return m;
  }
  const mods = () => S.companyMods(CO.rooms, save.owned);
  function show(name) {
    screen = name;
    for (const n of ['title', 'office', 'hire', 'shoot']) $('screen-' + n).hidden = n !== name;
    window.scrollTo(0, 0);
  }
  function openModal(kind, html) { modal = kind; $('modal').innerHTML = html; $('overlay').hidden = false; }
  function closeModal() { modal = null; $('overlay').hidden = true; }
  function say(text, bad) { toast = { text, bad: !!bad, until: performance.now() + 2600 }; }
  const setText = (el, t) => { if (el && el._t !== t) { el._t = t; el.textContent = t; } };
  const setW = (el, p) => { const v = (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%'; if (el._w !== v) { el._w = v; el.style.width = v; } };
  const setAttr = (el, k, v) => { if (el && el.getAttribute(k) !== String(v)) el.setAttribute(k, v); };
  const pct = id => { const t = st.tasks[id]; return !t ? 0 : t.done ? 1 : t.progress / t.need; };
  const isDone = id => !!(st.tasks[id] && st.tasks[id].done);
  const starsRow = n => [0, 1, 2].map(i => A.starSVG(i < n)).join('');
  const gameMinutes = secs => Math.round(secs * MIN_PER_SEC);

  /* ================= Title ================= */

  function renderTitle() {
    const lineup = LEVEL.hiring.map((r, i) => {
      const c = r.candidates.find(x => x.tier === 'Solid') || r.candidates[0];
      return `<g transform="translate(${34 + i * 44} 74) scale(1.15)">${A.puppet({ dept: r.dept, look: c.look })}</g>`;
    }).join('');
    $('screen-title').innerHTML = `
      <h1>That's<span>a wrap!</span></h1>
      <p class="tagline">Build the crew. Run the shoot. Get the shot.</p>
      <svg class="title-art" viewBox="0 0 200 84" aria-hidden="true">${lineup}</svg>
      <button class="btn go" type="button" data-go="office">${save.runs ? 'Back to the office' : 'Open your production company'}</button>
      <p class="hint">Prototype 0.2 with placeholder art. Progress saves on this device.</p>`;
  }

  /* ================= Office ================= */

  function renderOffice() {
    $('screen-office').innerHTML = `
      <div class="topbar">
        <div class="pill paper grow"><span>YOUR COMPANY</span><b class="hand">${esc(CO.name)}</b></div>
        <div class="pill paper"><span>BANK</span><b class="${save.bank < 0 ? 'neg' : ''}">${money(save.bank)}</b></div>
        <button class="sq" type="button" data-officemenu aria-label="Office menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      </div>
      <div class="scene">${A.officeMarkup(CO, save.owned, save.bank)}</div>
      <button class="btn go" type="button" data-jobs>Check the job board</button>
      <p class="hint">Tap a room to build it. Every room changes how your shoots go. Profit from each job lands in the bank.</p>`;
  }

  function showRoom(id) {
    const r = CO.rooms.find(x => x.id === id);
    const owned = save.owned.includes(id);
    const short = r.cost - save.bank;
    openModal('room', `
      <div class="chaos-h" style="background:var(--slate)"><b>${esc(r.name)}</b></div>
      <div class="room-prev">${A.roomPreview(r)}</div>
      <p>${esc(r.blurb)}</p>
      ${owned ? '<p class="note"><b>Built.</b> It helps on every shoot.</p>' :
        `<button class="btn go" type="button" data-build="${id}" ${short > 0 ? 'disabled' : ''}>${short > 0 ? `Need ${money(short)} more` : `Build for ${money(r.cost)}`}</button>`}
      <button class="btn" type="button" data-close>Back to the office</button>`);
  }

  function showJobs() {
    const jobs = CO.jobs.map(j => {
      const best = save.best[j.id] || 0;
      return `<button class="job" type="button" ${j.playable ? `data-book="${j.id}"` : 'disabled'}>
        <span class="jpic">${j.id === 'burger-job' ? A.propSVG('hero') : A.deptIcon('camera', 28)}</span>
        <b>${esc(j.title)}</b>
        <span>${esc(j.client)} · ${esc(j.kind)}${j.playable ? ` · pays ${money(LEVEL.budget)}` : ''}</span>
        <span>${j.playable ? `<span class="jstars">${starsRow(best)}</span>` : esc(j.note)}</span>
      </button>`;
    }).join('');
    openModal('jobs', `<span class="label">Job board</span>${jobs}<button class="btn" type="button" data-close>Back to the office</button>`);
  }

  function showBrief() {
    openModal('brief', `
      <div class="chaos-h" style="background:var(--mustard); color:var(--ink)"><b>${esc(LEVEL.title)}</b></div>
      <span class="eyebrow">${esc(LEVEL.client)} · tabletop · one shoot day</span>
      <p>${esc(LEVEL.brief)}</p>
      <div class="facts"><span>3 shots</span><span>Client pays ${money(LEVEL.budget)}</span><span>Call 8:00 AM</span><span>Wrap 6:00 PM</span><span>Overtime 1.5x after 10 hrs</span></div>
      <p class="note">Crew day rates, the gear package and food prep come out of what the client pays. Rentals and overtime too. Whatever's left is profit for the bank.</p>
      <button class="btn go" type="button" data-hire-screen>Book the crew</button>
      <button class="btn" type="button" data-close>Not yet</button>`);
  }

  function showOfficeMenu() {
    openModal('menu', `
      <span class="label">Office</span>
      <p>${save.runs} job${save.runs === 1 ? '' : 's'} wrapped. ${save.owned.length} of ${CO.rooms.length} rooms built.</p>
      <button class="btn" type="button" data-go="title">Title screen</button>
      <button class="btn" type="button" data-resetask>Start the company over</button>
      <button class="btn go" type="button" data-close>Back to the office</button>`);
  }

  /* ================= Hire ================= */

  function word(kind, v) {
    if (kind === 'speed') return v >= 1.2 ? 'very fast' : v >= 1.05 ? 'quick' : v >= 0.95 ? 'steady' : v >= 0.8 ? 'a bit slow' : 'slow';
    if (kind === 'rel') return v >= 0.95 ? 'rock solid' : v >= 0.88 ? 'dependable' : v >= 0.8 ? 'mostly fine' : 'messy';
    if (kind === 'skill') return v >= 0.9 ? 'top notch' : v >= 0.78 ? 'good eye' : v >= 0.65 ? 'learning' : 'green';
    return v >= 0.85 ? 'very organized' : v >= 0.7 ? 'organized' : v >= 0.55 ? 'loose' : 'scattered';
  }

  function statRow(label, v, w) {
    return v != null
      ? `<span class="stat"><span>${label}</span><b style="--v:${Math.min(1, v).toFixed(2)}"></b></span>`
      : `<span class="stat"><span>${label}</span><em>${esc(w)}</em></span>`;
  }

  function chemLines(c) {
    const names = Object.fromEntries(allCands().map(x => [x.id, x.name]));
    return (LEVEL.chemistry || []).filter(p => p.a === c.id || p.b === c.id).map(p => {
      const other = p.a === c.id ? p.b : p.a;
      return `<span class="chem ${p.kind}" data-chem="${other}">${p.kind === 'good' ? 'Works well with' : 'Clashes with'} ${esc(names[other])}</span>`;
    }).join('');
  }

  function candCard(r, c) {
    const net = c.network;
    const known = net === 'yours';
    const fuzzy = net === 'fof';
    const row = (label, val, kind) => known ? statRow(label, val) : fuzzy ? statRow(label, null, `"${word(kind, val)}"`) : statRow(label, null, '?');
    const stats = row('Skill', c.skill, 'skill') + row('Speed', c.speed / 1.3, 'speed') + row('Organized', c.org, 'org') + row('Reliable', c.reliability, 'rel') +
      (r.dept === 'camera' ? row('Leads', c.leadership, 'org') : '');
    const spec = c.specialty && net !== 'board' ? `<span class="perk">${esc(SPEC[c.specialty])}</span>` : '';
    const tag = net === 'fof' ? ` via ${esc(c.via)}` : net === 'board' ? ' · crew board' : '';
    return `<button class="cand" type="button" data-hire="${r.dept}:${c.id}" aria-pressed="${picks[r.dept] === c.id}" ${c.booked ? 'disabled' : ''}>
      ${A.faceSVG({ dept: r.dept, look: c.look }, 'face')}
      <span class="cand-name">${esc(c.name)}<span class="rate">${money(c.rate)}</span></span>
      <span class="tier ${c.tier}">${c.tier}${tag}</span>
      ${stats}${spec}
      ${net !== 'board' ? chemLines(c) : ''}
      <span class="blurb">${esc(c.blurb)}</span>
      ${c.booked ? '<span class="stamp">BOOKED</span>' : ''}
      <span class="cta">${c.booked ? 'On another job' : picks[r.dept] === c.id ? 'Hired' : 'Hire'}</span>
    </button>`;
  }

  function renderHire() {
    let html = `<div class="hire-h"><span class="label">Assemble crew</span><h2>Who's on the call sheet?</h2>
      <p class="note">Skill sets shot quality. Organized people lose less time between tasks. A DP who leads well speeds up every handoff and catches mistakes. People who've worked together hand off instantly.</p></div>`;
    for (const r of LEVEL.hiring) {
      const rev = revealed[r.dept] || {};
      const dry = r.candidates.filter(c => c.network === 'yours').every(c => c.booked);
      const list = r.candidates.filter(c => c.network === 'yours' || rev[c.network]);
      html += `<section class="role"><div class="role-h"><span class="tab" style="background:${A.DEPT_COLOR[r.dept]}"></span><h3>${esc(r.role)}</h3><span class="picked" data-picked="${r.dept}"></span></div>`;
      if (dry) {
        const btns = (!rev.fof ? `<button class="btn small" type="button" data-net="${r.dept}:fof">Ask your crew for a referral</button>` : '') +
          (!rev.board ? `<button class="btn small" type="button" data-net="${r.dept}:board">Post on the crew board</button>` : '');
        html += `<div class="dry"><b>${esc(r.dryNote)}</b><span>Referrals come vouched for by people you trust. The crew board is cheaper, but you won't know what you got until the shoot.</span>${btns ? `<div class="dry-actions">${btns}</div>` : ''}</div>`;
      }
      html += `<div class="cands" data-cands="${r.dept}">${list.map(c => candCard(r, c)).join('')}</div></section>`;
    }
    html += `<div class="hire-foot">
      <div class="money"><span>Client pays<b>${money(LEVEL.budget)}</b></span><span>Costs<b id="mCrew">$0</b></span><span>Margin<b id="mLeft">$0</b></span></div>
      <div class="mbar" id="mBar"><i></i></div>
      <div class="foot-note" id="mNote"></div>
      <button class="btn go" type="button" id="startBtn">Start the shoot</button>
    </div>`;
    const keep = {};
    document.querySelectorAll('[data-cands]').forEach(el => { keep[el.dataset.cands] = el.scrollLeft; });
    $('screen-hire').innerHTML = html;
    document.querySelectorAll('[data-cands]').forEach(el => { if (keep[el.dataset.cands]) el.scrollLeft = keep[el.dataset.cands]; });
    updateHire();
  }

  function updateHire() {
    const hiredIds = Object.values(picks).filter(Boolean);
    document.querySelectorAll('[data-hire]').forEach(b => {
      const [dept, id] = b.dataset.hire.split(':');
      const on = picks[dept] === id;
      b.setAttribute('aria-pressed', String(on));
      if (!b.disabled) b.querySelector('.cta').textContent = on ? 'Hired' : 'Hire';
    });
    document.querySelectorAll('[data-chem]').forEach(el => el.classList.toggle('on', hiredIds.includes(el.dataset.chem)));
    document.querySelectorAll('[data-picked]').forEach(el => {
      const c = picks[el.dataset.picked] && candidate(el.dataset.picked, picks[el.dataset.picked]);
      el.textContent = c ? `${c.name} · ${money(c.rate)}` : 'nobody yet';
    });
    const est = S.estimate(LEVEL, chosenMap(), mods());
    $('mCrew').textContent = money(est.total);
    $('mLeft').textContent = money(est.margin);
    $('mLeft').classList.toggle('neg', est.margin < 0);
    $('mBar').classList.toggle('over', est.margin < 0);
    $('mBar').firstElementChild.style.width = Math.min(100, est.total / LEVEL.budget * 100) + '%';
    const pairs = S.chemistryFor(LEVEL, hiredIds);
    const names = Object.fromEntries(allCands().map(x => [x.id, x.name]));
    const chem = pairs.map(p => `${p.kind === 'good' ? 'Chemistry' : 'Clash'}: ${names[p.a]} and ${names[p.b]}`).join('. ');
    let note;
    if (est.missing.length) note = `Still need: ${est.missing.join(', ')}.`;
    else note = `Crew ${money(est.crew)} · gear ${money(est.gear)} · prep ${money(est.prep)}. Overtime runs ${money(est.overtimePerHour)} an hour.`;
    if (chem) note += ` ${chem}.`;
    $('mNote').textContent = note;
    $('startBtn').disabled = !est.ok;
  }

  /* ================= Shoot: build ================= */

  function startShoot() {
    const map = chosenMap();
    const crew = LEVEL.hiring.map(r => map[r.dept]);
    st = S.createGame(LEVEL, { crew, seed: (Date.now() % 1000003) + 1, mods: mods() });
    selected = null; lastCapture = null; toast = null; banked = false; logSeen = 0;
    clientLine = { text: '', until: 0, next: performance.now() + 9000, i: Math.floor(Math.random() * CLIENT_LINES.length) };
    tipUntil = performance.now() + 7000;
    buildShoot();
    closeModal();
    show('shoot');
  }

  function buildShoot() {
    resetView();
    const perks = save.owned.map(id => CO.rooms.find(r => r.id === id).name);
    $('screen-shoot').innerHTML = `
      <div class="topbar">
        <div class="pill paper grow"><b class="hand">${esc(LEVEL.title)}</b><span><span id="shotCount">0/3 SHOTS</span> · <span class="clock" id="clock">8:00 AM</span></span></div>
        <div class="pill paper"><span>MARGIN</span><b id="budget">$0</b></div>
        <button class="sq" type="button" id="pauseBtn" aria-label="Pause"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg></button>
      </div>
      <div class="daybar" id="daybar"><i id="dayFill"></i><span class="wm" style="left:${(LEVEL.timeLimit / LEVEL.hardStop * 100).toFixed(1)}%"><span>WRAP 6 PM</span></span></div>
      <div class="set-wrap" id="setWrap">
        ${A.setMarkup()}
        <div class="onstage"><small>ON STAGE</small><span id="onstage"></span></div>
        <button class="clapbtn" type="button" id="actionBtn" aria-label="Call action">${A.clapperSVG()}<span class="cap" id="actionCap">not ready</span></button>
        <div class="cut" id="cutStamp" hidden>CUT!</div>
        <div class="flash" id="flash"></div>
      </div>
      <div class="ribbon" id="ribbon"><span id="ribbonText"></span><button class="btn small" type="button" id="autoBtn" hidden>Back to auto</button></div>
      <div class="shotcard paper" id="shotcard"></div>
      <div class="crewbar" id="crewbar"></div>
      ${perks.length ? `<p class="hint">Office perks today: ${esc(perks.join(', '))}</p>` : ''}`;

    const layer = $('crewLayer');
    const bar = $('crewbar');
    for (const c of st.crew) {
      const idle = A.IDLE[c.dept];
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'pup');
      g.setAttribute('data-crew', c.id);
      g.style.transform = `translate(${idle.x}px, ${idle.y}px)`;
      g.innerHTML =
        `<ellipse class="selring" cx="0" cy="0" rx="19" ry="6" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 2"/>` +
        `<g class="flip"><g transform="scale(1.25)" filter="url(#shadow)">${A.puppet(c)}<g class="held"></g></g></g>` +
        `<g class="ring" transform="translate(0 -74)" opacity="0"><circle r="7" fill="#fff" stroke="#22262B" stroke-width="1.3"/><circle class="rp" r="7" fill="none" stroke="#4E8A62" stroke-width="3.6" stroke-dasharray="0 44" transform="rotate(-90)"/></g>` +
        `<g class="bub" transform="translate(0 -77)" opacity="0"><rect class="bb" x="-22" y="-10" width="44" height="15" rx="4" fill="#fff" stroke="#22262B" stroke-width="1.3"/><text class="bt" y="1.6" text-anchor="middle" font-size="8.5" font-weight="700" font-family="Atkinson Hyperlegible, system-ui, sans-serif" fill="#22262B"></text></g>` +
        `<rect x="-18" y="-66" width="36" height="72" fill="transparent"/>`;
      layer.appendChild(g);
      view.pups[c.id] = { g, flip: g.querySelector('.flip'), held: g.querySelector('.held'), ring: g.querySelector('.ring'), rp: g.querySelector('.rp'), bub: g.querySelector('.bub'), bb: g.querySelector('.bb'), bt: g.querySelector('.bt'), heldKey: '' };
      view.pos[c.id] = { x: idle.x, y: idle.y };

      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cb';
      b.dataset.crew = c.id;
      b.innerHTML = `<span class="dotst"></span>${A.faceSVG(c)}<span class="nm">${esc(c.name)}</span><span class="tx"></span><span class="bar"><i></i></span><span class="man" hidden>MANUAL</span>`;
      bar.appendChild(b);
      view.cb[c.id] = { el: b, dot: b.querySelector('.dotst'), tx: b.querySelector('.tx'), bar: b.querySelector('.bar i'), man: b.querySelector('.man') };
    }
  }

  /* ================= Shoot: input ================= */

  function selectCrew(id) {
    if (st.over || modal) return;
    const other = st.crew.find(c => c.id === id);
    if (selected && selected !== id && other.task) {
      const helper = st.crew.find(c => c.id === selected);
      const r = S.command(st, { type: 'assign', crew: selected, task: other.task });
      say(r.ok ? `${helper.name} helps ${other.name}: ${r.message}` : r.message, !r.ok);
      if (r.ok) selected = null;
      return;
    }
    selected = selected === id ? null : id;
  }

  function assignTo(taskId) {
    if (!selected) {
      const ts = S.taskStatus(st, taskId);
      say(`${st.tasks[taskId].label}: ${ts.text}. Tap a crew member first to reassign.`);
      return;
    }
    const r = S.command(st, { type: 'assign', crew: selected, task: taskId });
    say(r.message, !r.ok);
    if (r.ok) selected = null;
  }

  function assignStation(station) {
    if (!selected) { say('Tap a crew member first, then a spot on the set.'); return; }
    const cand = S.stageCandidate(st);
    const list = Object.values(st.tasks)
      .filter(t => !t.done && S.stationOf(t) === station && !st.shots[t.shot].captured)
      .sort((a, b) => (a.shot === cand ? 0 : 1) - (b.shot === cand ? 0 : 1) || st.priority.indexOf(a.shot) - st.priority.indexOf(b.shot) || a.order - b.order);
    if (!list.length) { say('Nothing left to do there.', true); return; }
    const workable = list.find(t => !S.blockReason(st, t, true));
    assignTo((workable || list[0]).id);
  }

  function clapAnim(text) {
    setText($('clapText'), text);
    const clap = $('clap');
    clap.classList.remove('go'); void clap.getBBox(); clap.classList.add('go');
  }

  function pressAction() {
    const r = S.command(st, { type: 'action' });
    if (!r.ok) { say(r.message, true); return; }
    clapAnim(`SCENE ${st.priority.indexOf(st.capture.shot) + 1} · TAKE 1`);
    clientLine = Object.assign(clientLine, { text: 'Ooooh.', until: performance.now() + 3000 });
    say(r.message);
  }

  function flyPolaroid(shotId) {
    const from = $('setWrap').getBoundingClientRect();
    const row = document.querySelector(`[data-row="${shotId}"]`);
    if (!row) return;
    const to = row.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'flypola';
    el.innerHTML = `${A.propSVG(shotId)}<span>${st.shots[shotId].quality}%</span>`;
    const w = 120;
    el.style.left = `${from.left + from.width / 2 - w / 2}px`;
    el.style.top = `${from.top + from.height * 0.32}px`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      const dx = to.left + to.width - 60 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height * 0.32 + 50);
      el.style.transform = `translate(${dx}px, ${dy}px) scale(.35) rotate(8deg)`;
      el.style.opacity = '0.2';
    });
    setTimeout(() => el.remove(), 1100);
    const cut = $('cutStamp');
    cut.hidden = false;
    setTimeout(() => { cut.hidden = true; }, 900);
  }

  /* ================= Shoot: render ================= */

  function displayShot() {
    if (st.capture) return st.capture.shot;
    if (st.review) return st.review.shot;
    if (st.stageShot) return st.stageShot;
    return lastCapture || S.stageCandidate(st) || st.priority[0];
  }

  function camShift() {
    const disp = displayShot();
    const s = st.shots[disp];
    if (s && (s.captured || pct(`${disp}.frame`) > 0 || st.capture || st.review)) return CAM_SHIFT[disp] || [0, 0];
    return CAM_SHIFT[lastCapture] || [0, 0];
  }

  function renderSet(now) {
    const disp = displayShot();
    const showEl = (id, on) => setAttr($(id), 'display', on ? 'inline' : 'none');
    const s = st.shots[disp];
    const captured = s && s.captured;
    const rolling = st.capture && st.capture.shot === disp;
    const reviewing = st.review && st.review.shot === disp;

    const n = isDone('hero.set') ? 4 : Math.floor(pct('hero.set') * 4);
    showEl('pc-legs', n >= 1); showEl('pc-top', n >= 2); showEl('pc-sweep', n >= 3); showEl('pc-flag', n >= 4);
    setAttr($('sweep'), 'fill', SHOT_COLOR[disp] || '#E7B84F');

    const rigTask = disp === 'cheese' ? 'cheese.rig' : disp === 'sauce' ? 'sauce.mount' : null;
    const rn = !rigTask ? 0 : (isDone(rigTask) || captured) ? 3 : Math.floor(pct(rigTask) * 3);
    showEl('rig-pole', rn >= 1); showEl('rig-arm', rn >= 2);
    showEl('rig-fork', disp === 'cheese' && rn >= 3); showEl('rig-bottle', disp === 'sauce' && rn >= 3);

    // Key light swings to its mark as the gaffer works; fill light goes up during the hero setup
    const dead = !!st.pending || Object.values(st.blocks).includes('keylight');
    const lp = captured || rolling || reviewing ? 1 : pct(`${disp}.light`);
    const aim = KEY_AIM[disp] || [20, 20];
    setAttr($('keyHead'), 'transform', `rotate(${(aim[0] + (aim[1] - aim[0]) * lp).toFixed(1)} 72 76)`);
    setAttr($('beam'), 'opacity', dead ? 0 : (0.5 * lp).toFixed(2));
    setAttr($('lightFace'), 'fill', dead ? '#3A3631' : lp > 0 ? '#FFE7A3' : '#7A7468');
    setAttr($('dead'), 'opacity', dead ? 1 : 0);
    const fillUp = isDone('hero.light') || st.shots.hero.captured || pct('hero.light') > 0.5;
    setAttr($('fillLight'), 'opacity', fillUp ? 1 : 0);
    setAttr($('fillBeam'), 'opacity', fillUp && !dead ? 0.35 : 0);
    const bl = disp === 'sauce' ? (captured || rolling || reviewing ? 1 : pct('sauce.light')) : 0;
    setAttr($('backLight'), 'opacity', bl > 0 ? (0.4 + 0.6 * bl).toFixed(2) : 0);

    // Prop on the table
    let key = 'none', inner = '';
    if (disp === 'hero' && (isDone('hero.place') || captured || rolling || reviewing)) { key = 'hero'; inner = A.propInner('hero'); }
    else if (disp === 'cheese' && (st.stageShot === 'cheese' || captured || rolling || reviewing)) {
      const ready = (isDone('cheese.melt') && isDone('cheese.rig')) || captured || rolling || reviewing;
      const lift = rolling ? 10 + Math.round((1 - st.capture.left / st.capture.total) * 12) : ready ? (reviewing || captured ? 22 : 10) : 0;
      key = 'cheese' + lift; inner = ready ? A.propInner('cheese', { lift }) : A.propInner('hero');
    } else if (disp === 'sauce' && (st.stageShot === 'sauce' || captured || rolling || reviewing)) {
      const sauced = rolling ? st.capture.left < st.capture.total * 0.6 : (captured || reviewing);
      key = 'sauce' + sauced; inner = sauced ? A.propInner('sauce') : A.propInner('hero');
    }
    if (key !== view.propKey) { view.propKey = key; $('prop').innerHTML = inner; }
    setAttr($('pour'), 'opacity', disp === 'sauce' && rolling ? 1 : 0);
    setAttr($('sparkle'), 'opacity', (disp === 'hero' && (rolling || reviewing)) ? 1 : 0);

    // Camera moves on its dolly for each setup; framing marks and the live monitor
    const cs0 = camShift();
    const camKey = cs0.join();
    if (camKey !== view.cam) { view.cam = camKey; $('camRig').style.transform = `translate(${cs0[0]}px, ${cs0[1]}px)`; }
    const fp = captured || rolling || reviewing ? 1 : pct(`${disp}.frame`);
    setAttr($('frameMarks'), 'opacity', (fp * 0.95).toFixed(2));
    setAttr($('recDot'), 'fill', st.capture ? '#FF4B3A' : '#5A2A24');
    const monKey = fp > 0 ? key + ':' + (fp >= 1 ? 'f' : 'p') : 'bars';
    if (monKey !== view.monKey) {
      view.monKey = monKey;
      $('monView').innerHTML = fp > 0 && inner
        ? `<rect x="-4" y="-6" width="98" height="60" fill="${SHOT_COLOR[disp]}"/><g transform="translate(16 8)">${inner}</g>`
        : `<g opacity=".7"><rect x="-4" y="-6" width="14" height="60" fill="#E6E6E6"/><rect x="10" y="-6" width="14" height="60" fill="#E7B84F"/><rect x="24" y="-6" width="14" height="60" fill="#7FB0C9"/><rect x="38" y="-6" width="14" height="60" fill="#7FB069"/><rect x="52" y="-6" width="14" height="60" fill="#C77FC0"/><rect x="66" y="-6" width="14" height="60" fill="#D86B56"/><rect x="80" y="-6" width="14" height="60" fill="#344F70"/></g>`;
    }
    setAttr($('monRec'), 'opacity', st.capture ? 1 : 0);

    // Rolling: lights down, spotlight on the burger, camera pushes in
    setAttr($('dim'), 'opacity', st.capture ? 0.55 : 0);
    $('setWrap').classList.toggle('pushin', !!st.capture);

    // Art cart
    const cn = isDone('hero.place') || st.shots.hero.captured ? 0 : isDone('hero.style') ? 5 : Math.floor(pct('hero.style') * 5);
    if (cn !== view.cartN) { view.cartN = cn; $('cartBurger').innerHTML = A.cartBurger(cn); }
    const melt = st.tasks['cheese.melt'];
    const mp = st.shots.cheese.captured ? 0 : pct('cheese.melt');
    setAttr($('potCheese'), 'height', (12 * mp).toFixed(1));
    setAttr($('potCheese'), 'y', (14 - 12 * mp).toFixed(1));
    setAttr($('potCheese'), 'fill', melt.spoiled && !melt.done ? '#B9A15A' : '#F2C14E');
    setAttr($('steam'), 'opacity', melt.done && !st.shots.cheese.captured ? 1 : 0);
    setAttr($('bowlSauce'), 'opacity', st.shots.sauce.captured ? 0 : pct('sauce.prep').toFixed(2));

    // Client notes from video village
    if (!modal && !st.over && now > clientLine.next && now > clientLine.until) {
      clientLine.text = CLIENT_LINES[clientLine.i++ % CLIENT_LINES.length];
      clientLine.until = now + 3500;
      clientLine.next = now + 14000;
    }
    const talking = now < clientLine.until;
    setAttr($('clientBub'), 'opacity', talking ? 1 : 0);
    if (talking) setText($('clientText'), clientLine.text);

    // Crew puppets: walk in game time, carry gear, hold tools while working
    const at = {};
    const targets = {};
    for (const c of st.crew) {
      const cs = S.crewStatus(st, c);
      let p;
      if (c.task) {
        const stn = S.stationOf(st.tasks[c.task]);
        at[stn] = (at[stn] || 0) + 1;
        const base = A.STATIONS[stn];
        const shift = stn === 'camera' ? cs0 : [0, 0];
        p = { x: base.x + shift[0] - (at[stn] - 1) * 28, y: base.y + shift[1] + (at[stn] - 1) * 5 };
      } else if (cs.state === 'IDLE' || cs.state === 'RECOVERING') {
        p = view.pos[c.id];
      } else p = A.IDLE[c.dept];
      targets[c.id] = p;
      const v = view.pups[c.id];
      const prev = view.pos[c.id];
      if (prev.x !== p.x || prev.y !== p.y) {
        if (p.x !== prev.x) setAttr(v.flip, 'transform', p.x < prev.x ? 'scale(-1 1)' : '');
        const secs = cs.state === 'MOVING' && c.moveTotal ? c.moveTotal / S.TPS / speed : 0.9;
        v.g.style.transitionDuration = `${Math.max(0.3, secs).toFixed(2)}s`;
        v.g.style.transform = `translate(${p.x}px, ${p.y}px)`;
        view.pos[c.id] = { x: p.x, y: p.y };
      }
      v.g.classList.toggle('working', cs.state === 'WORKING');
      v.g.classList.toggle('walking', cs.state === 'MOVING');
      v.g.classList.toggle('sel', selected === c.id);
      const hk = cs.state === 'MOVING' ? 'carry' : cs.state === 'WORKING' ? 'tool' : '';
      if (hk !== v.heldKey) { v.heldKey = hk; v.held.innerHTML = A.heldItem(c.dept, hk); }
      if (cs.state === 'WORKING') {
        setAttr(v.ring, 'opacity', 1);
        setAttr(v.rp, 'stroke-dasharray', `${(cs.pct * 44).toFixed(1)} 44`);
        setAttr(v.bub, 'opacity', 0);
      } else {
        setAttr(v.ring, 'opacity', 0);
        let txt = '', fill = '#fff', col = '#22262B';
        if (cs.state === 'BLOCKED') { txt = '!'; fill = '#D86B56'; col = '#fff'; }
        else if (cs.state === 'RECOVERING') { txt = 'oops!'; fill = '#D86B56'; col = '#fff'; }
        else if (cs.state === 'IDLE') txt = 'call sheet?';
        else if (/ACTION/.test(cs.text)) txt = 'ACTION?';
        else if (cs.handoff) txt = `${cs.text.replace('Handoff from ', '')}...`;
        setAttr(v.bub, 'opacity', txt ? 1 : 0);
        setAttr(v.bb, 'fill', fill);
        setAttr(v.bt, 'fill', col);
        setText(v.bt, txt);
      }
    }
    const order = st.crew.slice().sort((a, b) => targets[a.id].y - targets[b.id].y).map(c => c.id);
    const depth = order.join();
    if (depth !== view.depth) { view.depth = depth; for (const id of order) $('crewLayer').appendChild(view.pups[id].g); }

    // Botches: a puff of paper over the person who slipped
    for (; logSeen < st.log.length; logSeen++) {
      const e = st.log[logSeen];
      if (e.type !== 'flub') continue;
      const p = view.pos[e.crew] || { x: 180, y: 200 };
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(${p.x} ${p.y - 50})`);
      g.innerHTML = A.puffMarkup('oops');
      $('fxLayer').appendChild(g);
      setTimeout(() => g.remove(), 1300);
      say(e.text, true);
    }
  }

  function renderHud(now) {
    setText($('clock'), S.clockText(st));
    const late = S.seconds(st) > LEVEL.timeLimit;
    $('clock').classList.toggle('warn', late);
    setText($('budget'), money(st.budget));
    $('budget').classList.toggle('neg', st.budget < 0);
    const wrapped = Object.values(st.shots).filter(s => s.captured).length;
    setText($('shotCount'), `${wrapped}/3 SHOTS`);
    setW($('dayFill'), S.seconds(st) / LEVEL.hardStop);
    $('daybar').classList.toggle('ot', late);

    const cand = S.stageCandidate(st);
    setText($('onstage'), st.capture ? st.shots[st.capture.shot].name : st.stageShot ? st.shots[st.stageShot].name : (cand ? st.shots[cand].name : 'Wrapped'));

    const r = cand && S.readiness(st, cand);
    const ab = $('actionBtn');
    const ready = !!(r && r.ready && !st.capture && !st.pending && !st.review);
    ab.classList.toggle('on', ready);
    ab.classList.toggle('rolling', !!st.capture);
    let cap;
    if (st.capture) cap = `ROLLING · TAKE ${st.capture.take}`;
    else if (ready) cap = `READY · ${r.quality}%`;
    else if (r) cap = `${r.missingRequired.length} to go · ${r.quality}%`;
    else cap = 'wrapped';
    setText($('actionCap'), cap);

    for (const c of st.crew) {
      const v = view.cb[c.id];
      const cs = S.crewStatus(st, c);
      v.dot.className = 'dotst ' + cs.state;
      setText(v.tx, cs.state === 'WORKING' ? cs.text + (cs.cross ? ' (half speed)' : '') : cs.text);
      setW(v.bar, cs.state === 'WORKING' ? cs.pct : 0);
      v.man.hidden = !c.override;
      v.el.classList.toggle('sel', selected === c.id);
    }
    document.body.classList.toggle('picking', !!selected);

    const rb = $('ribbon');
    let text = '', bad = false;
    if (toast && now < toast.until) { text = toast.text; bad = toast.bad; }
    else if (selected) { const c = st.crew.find(x => x.id === selected); text = `${c.name} selected. Tap a task icon, a spot on the set, or a busy coworker.`; }
    else if (now < tipUntil) text = 'Your crew start on their own. Tap a person to give them a different job.';
    else if (st.capture) text = `Rolling on ${st.shots[st.capture.shot].name}. Quiet on set.`;
    else if (r && r.ready) text = r.missingOptional.length ? `Ready! Call ACTION now, or wait for ${r.missingOptional.map(x => x.label.toLowerCase()).join(', ')}.` : 'Ready! Everything is done. Call ACTION.';
    else if (r) text = `${st.shots[cand].name} needs: ${r.missingRequired.map(x => x.label.toLowerCase()).join(', ')}.`;
    else text = "That's a wrap.";
    rb.classList.toggle('bad', bad);
    setText($('ribbonText'), text);
    const sc = selected && st.crew.find(x => x.id === selected);
    $('autoBtn').hidden = !(sc && sc.override);

    renderShotCard(cand);
  }

  function iconKey(t) { return t.fix ? 'fix' : t.dept; }

  function renderShotCard(cand) {
    const rowsKey = st.priority.map(id => id + (st.shots[id].captured ? 'c' + st.shots[id].quality : '') + (st.stageShot === id ? 's' : '') + st.shots[id].taskIds.length).join() + '|' + cand;
    if (rowsKey !== view.rowsKey) {
      view.rowsKey = rowsKey;
      $('shotcard').innerHTML = st.priority.map((id, i) => {
        const s = st.shots[id];
        const canMove = !s.captured && st.stageShot !== id && i > 0 && !st.shots[st.priority[i - 1]].captured && st.stageShot !== st.priority[i - 1] && !(st.capture && st.capture.shot === st.priority[i - 1]);
        const cls = s.captured ? 'done' : (cand === id ? 'stage' : '');
        const right = s.captured
          ? `<span class="stamp-q">${s.quality}%${s.takes > 1 ? ` · ${s.takes} takes` : ''}</span>`
          : `<span class="icons">${s.taskIds.map(tid => {
              const t = st.tasks[tid];
              return `<button class="ti dept-${t.dept}${t.optional ? ' optl' : ''}" type="button" data-task="${tid}" aria-label="${esc(t.label)}">${A.deptIcon(iconKey(t))}<i class="bd"></i></button>`;
            }).join('')}</span>`;
        return `<div class="srow ${cls}" data-row="${id}"><span class="sg">${s.captured ? '✓' : i + 1}</span>
          <span class="sn">${esc(s.name)}${canMove ? ` <button class="mvup" type="button" data-move="${id}">shoot earlier</button>` : ''}</span>${right}</div>`;
      }).join('');
      view.icons = {};
      document.querySelectorAll('#shotcard [data-task]').forEach(el => { view.icons[el.dataset.task] = el; });
    }
    for (const id in view.icons) {
      const el = view.icons[id];
      const t = st.tasks[id];
      const ts = S.taskStatus(st, id);
      const p = ts.fresh != null ? 1 : ts.pct;
      const v = p.toFixed(3);
      if (el._p !== v) { el._p = v; el.style.setProperty('--p', v); }
      const cls = `ti dept-${t.dept}${t.optional ? ' optl' : ''} ${ts.state}${ts.fresh != null ? ' fresh' : ''}`;
      if (el.className !== cls) el.className = cls;
      const label = `${t.label}: ${ts.text}`;
      if (el._l !== label) { el._l = label; el.setAttribute('aria-label', label); el.title = label; }
    }
  }

  /* ================= Modals ================= */

  function showChaos() {
    const ev = LEVEL.events.find(e => e.id === st.pending);
    const opts = S.eventOptions(st, ev.id);
    const line = o => {
      if (o.kind === 'task') return `${esc(o.who)} fixes it, about ${gameMinutes(o.secs)} min. Free.` + (o.perk ? ' <strong>Spare bulb in the truck!</strong>' : '');
      if (o.kind === 'wait') return o.owned ? `Free from your gear cage. Up in ${gameMinutes(o.secs)} min. <strong>Owned!</strong>` : `${money(o.cost)}. Arrives in ${gameMinutes(o.secs)} min. Nobody stops working.`;
      return `No wait, no cost. This shot loses ${o.penalty} quality.`;
    };
    openModal('chaos', `
      <div class="chaos-h"><span class="bang">!</span><b>Chaos!</b></div>
      <p class="chaos-t">${esc(ev.title)}</p>
      <p class="note">Re-aiming the lights and framing the macro are on hold until it's sorted.</p>
      ${opts.map(o => `<button class="opt" type="button" data-choose="${o.id}">${A.ICON[o.id] || ''}<b>${esc(o.label)}</b><span>${line(o)}</span></button>`).join('')}`);
  }

  function showReview() {
    const id = st.review.shot;
    const s = st.shots[id];
    const gain = s.exec - Math.floor(s.exec / 2);
    const retakeMin = gameMinutes(S.actionTicks(st) / S.TPS + (LEVEL.retakeReset || 0));
    const skipped = s.skipped.map(t => st.tasks[t].label.toLowerCase());
    const dp = st.crew.find(c => c.dept === 'camera');
    let verdict;
    if (s.quality >= 95) verdict = `${dp.name}: "That's the one."`;
    else if (s.exec > 6) verdict = `${dp.name}: "The crew was a little rough on that one. Another?"`;
    else if (skipped.length) verdict = `${dp.name}: "It'd look better with the ${skipped.join(' and ')}, but it works."`;
    else verdict = `${dp.name}: "Solid. Your call."`;
    openModal('review', `
      <div class="chaos-h" style="background:var(--ink)"><b>Take ${s.takes}: ${esc(s.name)}</b></div>
      <div class="bigpola"><div class="pic" style="background:${SHOT_COLOR[id]}">${A.propSVG(id)}</div><span class="qs">${s.quality}%</span></div>
      <div class="report">
        <span></span><span>Setup${skipped.length ? ` (no ${esc(skipped.join(', '))})` : ''}</span><b>${s.setup}</b>
        <span></span><span>Crew execution</span><b>${s.exec ? '-' + s.exec : '0'}</b>
        ${s.bonus ? `<span></span><span>Specialty and post</span><b>+${s.bonus}</b>` : ''}
      </div>
      <p class="quote">${esc(verdict)}</p>
      <div class="row2">
        <button class="btn go" type="button" data-accept style="font-size:19px">Print it!</button>
        <button class="btn" type="button" data-retake>One more take<br><small>${gain > 0 ? `+${gain}%` : 'safety take, +0%'} · about ${retakeMin} min</small></button>
      </div>`);
  }

  function showPause() {
    st.paused = true;
    openModal('pause', `
      <span class="label">Paused</span>
      <p>${S.clockText(st)} on set. ${Object.values(st.shots).filter(s => s.captured).length} of 3 shots in the can.</p>
      <div class="seg" role="group" aria-label="Game speed">
        <button type="button" data-speed="1" aria-pressed="${speed === 1}">1x</button>
        <button type="button" data-speed="2" aria-pressed="${speed === 2}">2x</button>
      </div>
      <button class="btn go" type="button" data-resume>Back to set</button>
      <div class="row2"><button class="btn" type="button" data-again>Restart shoot</button><button class="btn" type="button" data-quit>Quit to office</button></div>`);
  }

  function showWrap() {
    const sc = S.score(st);
    if (!banked) {
      banked = true;
      save.bank += sc.profit;
      save.runs += 1;
      save.best[LEVEL.id] = Math.max(save.best[LEVEL.id] || 0, sc.stars);
      persist();
    }
    const ck = ok => `<span class="ck ${ok ? 'y' : 'n'}">${ok ? '✓' : '✕'}</span>`;
    const pulled = st.endReason === 'pulled';
    let quote;
    if (pulled) quote = '"We\'ll fix it in post." (They will not fix it in post.)';
    else if (sc.stars === 3) quote = '"Looks great! Can we do one more take... just in case?"';
    else if (!sc.onTime) quote = '"Overtime? Huh. Anyway, can the burger pop more?"';
    else if (!sc.quality) quote = '"Love it. Can we fix the lighting in post?"';
    else quote = '"Great work. Wait, why is the invoice so high?"';
    const hired = chosenMap();
    const reveals = st.crew.filter(c => hired[c.dept] && hired[c.dept].network !== 'yours').map(c => {
      const flubs = st.log.filter(e => e.type === 'flub' && e.crew === c.id).length;
      return `<span><b>${esc(c.name)}</b> turned out ${word('skill', c.skill)}, ${word('speed', c.speed)} and ${word('org', c.org)}${flubs ? `, botched ${flubs} task${flubs > 1 ? 's' : ''}` : ''}.</span>`;
    });
    const chem = st.crew.flatMap(c => c.chem.filter(x => x.kind === 'good' && c.id < x.with).map(x => `${c.name} and ${x.name}`));
    const flubsAll = st.log.filter(e => e.type === 'flub').length;
    const nextRoom = CO.rooms.filter(r => !save.owned.includes(r.id)).sort((a, b) => a.cost - b.cost)[0];
    const roomNote = nextRoom ? (save.bank >= nextRoom.cost ? `You can afford the ${nextRoom.name} now.` : `${money(nextRoom.cost - save.bank)} more for the ${nextRoom.name}.`) : 'Every room is built.';
    const otNote = sc.overtimeMinutes ? ` (${Math.floor(sc.overtimeMinutes / 60)}h ${sc.overtimeMinutes % 60}m)` : '';
    openModal('wrap', `
      <div class="chaos-h" style="background:var(--slate)"><b>${pulled ? 'Plug pulled' : 'Wrap report'}</b></div>
      <div class="stars" role="img" aria-label="${sc.stars} of 3 stars">${starsRow(sc.stars)}</div>
      <div class="report">
        ${ck(sc.allShots)}<span>Shots completed</span><b>${sc.shotsDone}/${sc.shotsTotal}</b>
        ${ck(sc.onTime)}<span>Wrapped by 6:00 PM</span><b>${sc.wrapClock}</b>
        ${ck(sc.quality)}<span>Quality (need ${LEVEL.qualityTarget}%)</span><b>${sc.avgQuality}%</b>
        ${ck(sc.inBudget)}<span>Profit to the bank</span><b>${money(sc.profit)}</b>
      </div>
      <p class="note">Client paid ${money(LEVEL.budget - sc.lostRevenue)}${sc.lostRevenue ? ' (half kill fee)' : ''}. Crew ${money(sc.crewCost)} · gear ${money(sc.gearCost)} · prep ${money(sc.prepCost)} · rentals ${money(sc.extraCost)} · overtime ${money(sc.overtimeCost)}${otNote}${flubsAll ? ` · ${flubsAll} botched task${flubsAll > 1 ? 's' : ''}` : ''}${sc.takes > 3 ? ` · ${sc.takes} takes` : ''}</p>
      ${chem.length ? `<p class="note">Chemistry paid off: ${esc(chem.join(', '))}.</p>` : ''}
      ${reveals.length ? `<div class="reveal">${reveals.join('')}</div>` : ''}
      <p class="quote">${esc(quote)}</p>
      <p class="note"><b>Bank: ${money(save.bank)}.</b> ${esc(roomNote)}</p>
      <div class="row2"><button class="btn go" type="button" data-go="office" style="font-size:18px">To the office</button><button class="btn" type="button" data-again>Same crew again</button></div>`);
  }

  /* ================= Events ================= */

  document.addEventListener('click', e => {
    const t = e.target;
    const go = t.closest('[data-go]');
    if (go) {
      closeModal();
      if (go.dataset.go === 'office') { renderOffice(); show('office'); }
      else { renderTitle(); show('title'); }
      return;
    }
    if (t.closest('[data-close]')) { closeModal(); return; }
    if (t.closest('[data-jobs]')) { showJobs(); return; }
    if (t.closest('[data-book]')) { showBrief(); return; }
    if (t.closest('[data-hire-screen]')) { closeModal(); renderHire(); show('hire'); return; }
    if (t.closest('[data-officemenu]')) { showOfficeMenu(); return; }
    if (t.closest('[data-resetask]')) {
      openModal('reset', `<span class="label">Start over?</span><p>This empties the bank and tears down every room. It can't be undone.</p>
        <div class="row2"><button class="btn" type="button" data-close>Keep my company</button><button class="btn go" type="button" data-reset style="font-size:18px">Start over</button></div>`);
      return;
    }
    if (t.closest('[data-reset]')) { save = freshSave(); persist(); closeModal(); renderOffice(); return; }
    const roomEl = t.closest('[data-room]');
    if (roomEl && screen === 'office' && !modal) { showRoom(roomEl.dataset.room); return; }
    const build = t.closest('[data-build]');
    if (build && !build.disabled) {
      const r = CO.rooms.find(x => x.id === build.dataset.build);
      if (save.bank >= r.cost && !save.owned.includes(r.id)) {
        save.bank -= r.cost;
        save.owned.push(r.id);
        persist();
      }
      closeModal(); renderOffice();
      return;
    }

    const net = t.closest('[data-net]');
    if (net) {
      const [dept, n] = net.dataset.net.split(':');
      revealed[dept] = Object.assign({}, revealed[dept], { [n]: true });
      renderHire();
      return;
    }
    const hire = t.closest('[data-hire]');
    if (hire && !hire.disabled) {
      const [dept, id] = hire.dataset.hire.split(':');
      picks[dept] = picks[dept] === id ? null : id;
      updateHire();
      return;
    }
    if (t.closest('#startBtn')) { startShoot(); return; }

    if (t.closest('[data-choose]')) {
      const r = S.command(st, { type: 'choose', option: t.closest('[data-choose]').dataset.choose });
      closeModal();
      say(r.message);
      return;
    }
    if (t.closest('[data-accept]')) {
      const id = st.review && st.review.shot;
      const r = S.command(st, { type: 'accept' });
      closeModal();
      if (r.ok) { lastCapture = id; view.rowsKey = ''; renderHud(performance.now()); flyPolaroid(id); say(r.message); }
      return;
    }
    if (t.closest('[data-retake]')) {
      const r = S.command(st, { type: 'retake' });
      closeModal();
      if (r.ok) { clapAnim(`SCENE ${st.priority.indexOf(st.capture.shot) + 1} · TAKE ${st.capture.take}`); say(r.message); }
      return;
    }
    if (t.closest('[data-speed]')) {
      speed = +t.closest('[data-speed]').dataset.speed;
      document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === speed)));
      return;
    }
    if (t.closest('[data-resume]')) { st.paused = false; closeModal(); return; }
    if (t.closest('[data-again]')) { startShoot(); return; }
    if (t.closest('[data-quit]')) { closeModal(); renderOffice(); show('office'); return; }

    if (screen !== 'shoot' || !st || modal) return;
    if (t.closest('#pauseBtn')) { showPause(); return; }
    if (t.closest('#actionBtn')) { pressAction(); return; }
    if (t.closest('#autoBtn')) { const r = S.command(st, { type: 'release', crew: selected }); say(r.message); selected = null; return; }
    const crew = t.closest('[data-crew]');
    if (crew) { selectCrew(crew.dataset.crew); return; }
    const task = t.closest('[data-task]');
    if (task) { assignTo(task.dataset.task); return; }
    const stn = t.closest('[data-station]');
    if (stn) { assignStation(stn.dataset.station); return; }
    const mv = t.closest('[data-move]');
    if (mv) { const r = S.command(st, { type: 'move', shot: mv.dataset.move, dir: -1 }); say(r.message, !r.ok); }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'shoot' && st && !st.over && !modal) showPause();
  });

  /* ================= Loop ================= */

  function frame(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (screen === 'shoot' && st) {
      if (!modal) {
        S.advance(st, dt * speed);
        if (st.pending) showChaos();
        else if (st.review) setTimeout(() => { if (st.review && !modal) showReview(); }, 0) || (modal = 'review-wait');
        else if (st.over) showWrap();
      }
      renderSet(now);
      renderHud(now);
    }
    requestAnimationFrame(frame);
  }

  $('defs').innerHTML = A.globalDefs();
  resetView();
  renderTitle();
  show('title');
  requestAnimationFrame(frame);
})();
