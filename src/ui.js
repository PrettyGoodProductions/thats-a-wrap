/*
  Screens: title -> office -> (job board) -> hire -> shoot -> wrap -> office.
  All game rules live in sim.js and all drawing in art.js. This file builds screens, saves progress and forwards taps.
*/
(function () {
  'use strict';
  const S = window.WrapSim;
  const A = window.WrapArt;
  const Ld = window.WrapLoader; // delivered art: state swaps only, the simulation still decides every state
  const Wk = window.WrapWalk;   // crew walk: steps fitted to the trip, stop-motion frames
  const LEVEL = window.LEVELS.burgerJob;
  const CO = window.LEVELS.company;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = S.fmtMoney;

  const PERKS = {
    quickRoll: 'Rolls in 3s, not 5',
    spareBulb: 'Spare bulb: fixes dead lights fast',
    foodWhisperer: 'Food stays fresh 60% longer',
  };
  const SHOT_COLOR = { hero: '#E7B84F', cheese: '#D86B56', sauce: '#7D9E91' };
  const CLIENT_LINES = ['Can it pop more?', 'Is that the hero burger?', 'Love it. One tiny note...', 'More cheese?', 'Legal wants the bun moved.', 'Can we see it bigger?'];

  /* ================= Save (this device only) ================= */

  const SAVE_KEY = 'thats-a-wrap-save-v1';
  function freshSave() { return { bank: 0, owned: [], best: {}, runs: 0, companyName: '', lab: {} }; }
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
  let clientLine = { text: '', until: 0, next: 0, i: 0 };
  let lab = null; // Layout Lab run (Milestone B experiment): same shoot, every crew member waits for orders, taps are measured
  let labFlip = false;
  const view = {};

  function resetView() {
    Object.assign(view, { pups: {}, cb: {}, icons: {}, rowsKey: '', depth: '', propKey: '', monKey: '', cartN: -1, pos: {}, stCard: null, hits: null, walkT: 0, beamKey: '', segKey: '', condKey: '', stars: -1 });
  }

  /* ================= Helpers ================= */

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
  function show(name) {
    screen = name;
    for (const n of ['title', 'office', 'hire', 'shoot']) $('screen-' + n).hidden = n !== name;
    syncRot();
    window.scrollTo(0, 0);
  }
  // A landscape lab shoot on a phone held upright (or locked to portrait): turn the whole shoot sideways ourselves
  function syncRot() {
    const rot = isLand() && screen === 'shoot' && window.innerHeight > window.innerWidth;
    document.body.classList.toggle('rot', rot);
    document.body.classList.toggle('lab-land', isLand() && screen === 'shoot');
    document.body.classList.toggle('flip', rot && labFlip);
  }
  function openModal(kind, html) { modal = kind; $('modal').dataset.kind = kind; $('modal').innerHTML = html; $('overlay').hidden = false; }
  function closeModal() { modal = null; $('overlay').hidden = true; }
  function say(text, bad, ms) { toast = { text, bad: !!bad, until: performance.now() + (ms || 2600) }; }
  // The shoot is played in landscape (Milestone B decision, Nov 3). The Layout Lab can still run a portrait shoot
  // for comparison. HQ screens stay portrait.
  const isLand = () => (lab ? lab.layout === 'land' : true);
  const idleSpot = (dept) => (isLand() ? A.IDLE_WIDE : A.IDLE)[dept];
  const ROLE_WORD = { camera: 'DP', lighting: 'Gaffer', art: 'Art', grip: 'Grip' };
  // The landscape HUD shows shoot time as a time of day: call at 8:00 AM, the wrap time is a 10 hour day
  const DAY_HOURS = 10, CALL_HOUR = 8;
  const COND = [['grip', 'Set built'], ['lighting', 'Lighting'], ['art', 'Prop styling'], ['camera', 'Camera ready']];
  const STATION_WORD = { light: 'key light', table: 'platform', camera: 'camera', cart: 'art table' };
  const nextLine = n => `${n.name} to the ${STATION_WORD[n.station]} to ${n.label.toLowerCase()}`;
  const setText = (el, t) => { if (el && el._t !== t) { el._t = t; el.textContent = t; } };
  const setW = (el, p) => { if (!el) return; const v = (Math.max(0, Math.min(1, p)) * 100).toFixed(1) + '%'; if (el._w !== v) { el._w = v; el.style.width = v; } };
  const setAttr = (el, k, v) => { if (el && el.getAttribute(k) !== String(v)) el.setAttribute(k, v); };
  const pct = id => { const t = st.tasks[id]; return !t ? 0 : t.done ? 1 : t.progress / t.need; };
  const isDone = id => !!(st.tasks[id] && st.tasks[id].done);
  const starsRow = n => [0, 1, 2].map(i => A.starSVG(i < n)).join('');
  // Shot thumbnails cut from the approved concept art (src/assets.js), with the drawn prop as a fallback
  const thumb = (shotId, cls) => window.WrapAssets && window.WrapAssets.thumbs[shotId]
    ? `<img class="${cls || 'thumb'}" src="${window.WrapAssets.thumbs[shotId]}" alt="">`
    : A.propSVG(shotId);

  /* ================= Title ================= */

  function renderTitle() {
    const lineup = LEVEL.hiring.map((r, i) => {
      const c = r.candidates.find(x => x.tier === 'Solid') || r.candidates[0];
      return `<g transform="translate(${34 + i * 44} 74) scale(1.15)">${A.puppet({ dept: r.dept, look: c.look, name: c.name })}</g>`;
    }).join('');
    $('screen-title').innerHTML = `
      ${window.WrapAssets ? `<img class="logo" src="${window.WrapAssets.logo}" alt="That's a Wrap!">` : `<h1>That's<span>a wrap!</span></h1>`}
      <p class="tagline">Build the crew. Run the shoot. Get the shot.</p>
      <svg class="title-art" viewBox="0 0 200 84" aria-hidden="true">${lineup}</svg>
      <button class="btn go" type="button" data-go="office">${save.runs ? 'Back to the office' : 'Open your production company'}</button>
      <p class="hint">Prototype build with placeholder art. Progress saves on this device.</p>`;
  }

  /* ================= Office ================= */

  const companyName = () => (save.companyName || CO.name);

  function renderOffice() {
    $('screen-office').innerHTML = `
      <div class="topbar">
        <button class="pill paper grow" type="button" data-rename><span>YOUR COMPANY · TAP TO RENAME</span><b class="hand">${esc(companyName())}</b></button>
        <div class="pill paper"><span>BANK</span><b class="${save.bank < 0 ? 'neg' : ''}">${money(save.bank)}</b></div>
        <button class="sq" type="button" data-officemenu aria-label="Office menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      </div>
      <div class="scene">${A.officeMarkup(Object.assign({}, CO, { name: companyName() }), save.owned, save.bank)}</div>
      <button class="btn go" type="button" data-jobs>Check the job board</button>
      <button class="btn" type="button" data-lab>Layout lab: portrait vs landscape shoot</button>
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
        <span class="jpic">${j.id === 'burger-job' ? thumb('hero') : A.deptIcon('camera', 28)}</span>
        <b>${esc(j.title)}</b>
        <span>${esc(j.client)} · ${esc(j.kind)}${j.playable ? ` · ${money(LEVEL.budget)}` : ''}</span>
        <span>${j.playable ? `<span class="jstars">${starsRow(best)}</span>` : esc(j.note)}</span>
      </button>`;
    }).join('');
    openModal('jobs', `<span class="label">Job board</span>${jobs}<button class="btn" type="button" data-close>Back to the office</button>`);
  }

  function showBrief() {
    openModal('brief', `
      <div class="chaos-h" style="background:var(--mustard); color:var(--ink)"><b>${esc(LEVEL.title)}</b></div>
      <span class="eyebrow">${esc(LEVEL.client)} · tabletop</span>
      <p>${esc(LEVEL.brief)}</p>
      <div class="facts"><span>3 shots</span><span>Budget ${money(LEVEL.budget)}</span><span>Wrap by ${S.fmtTime(LEVEL.timeLimit)}</span><span>Overtime ${money(LEVEL.overtimeRate)}/s</span></div>
      <p class="note">The budget pays your crew, rentals and overtime. Whatever's left is profit for the bank.</p>
      <button class="btn go" type="button" data-hire-screen>Book the crew</button>
      <button class="btn" type="button" data-close>Not yet</button>`);
  }

  function showRename() {
    openModal('rename', `
      <span class="label">Name your company</span>
      <form id="renameForm" class="rename">
        <label for="companyName">Company name</label>
        <input id="companyName" name="companyName" type="text" maxlength="28" autocomplete="off" value="${esc(companyName())}" placeholder="${esc(CO.name)}">
        <button class="btn go" type="submit">Hang the sign</button>
      </form>
      <button class="btn" type="button" data-close>Cancel</button>`);
    const input = $('companyName');
    input.focus(); input.select();
    $('renameForm').addEventListener('submit', e => {
      e.preventDefault();
      save.companyName = input.value.trim().slice(0, 28);
      persist();
      closeModal(); renderOffice();
    });
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

  function speedWord(v) { return v >= 1.25 ? 'very fast' : v >= 1.05 ? 'quick' : v >= 0.95 ? 'steady' : v >= 0.8 ? 'a bit slow' : 'slow'; }
  function relWord(v) { return v >= 0.95 ? 'rock solid' : v >= 0.88 ? 'dependable' : v >= 0.8 ? 'mostly fine' : 'messy'; }

  function statRow(label, v, word) {
    return v != null
      ? `<span class="stat"><span>${label}</span><b style="--v:${Math.min(1, v).toFixed(2)}"></b></span>`
      : `<span class="stat"><span>${label}</span><em>${esc(word)}</em></span>`;
  }

  function candCard(r, c) {
    const net = c.network;
    const known = net === 'yours';
    const sp = known ? statRow('Speed', c.speed / 1.4) : net === 'fof' ? statRow('Speed', null, `"${speedWord(c.speed)}"`) : statRow('Speed', null, '?');
    const rel = known ? statRow('Reliable', c.reliability) : net === 'fof' ? statRow('Reliable', null, `"${relWord(c.reliability)}"`) : statRow('Reliable', null, '?');
    const perk = (c.perks || []).length && net !== 'board' ? `<span class="perk">${esc(PERKS[c.perks[0]])}</span>` : '';
    const tag = net === 'fof' ? ` via ${esc(c.via)}` : net === 'board' ? ' · crew board' : '';
    return `<button class="cand" type="button" data-hire="${r.dept}:${c.id}" aria-pressed="${picks[r.dept] === c.id}" ${c.booked ? 'disabled' : ''}>
      ${A.faceSVG({ dept: r.dept, look: c.look, name: c.name }, 'face')}
      <span class="cand-name">${esc(c.name)}<span class="rate">${money(c.rate)}</span></span>
      <span class="tier ${c.tier}">${c.tier}${tag}</span>
      ${sp}${rel}${perk}
      <span class="blurb">${esc(c.blurb)}</span>
      ${c.booked ? '<span class="stamp">BOOKED</span>' : ''}
      <span class="cta">${c.booked ? 'On another job' : picks[r.dept] === c.id ? 'Hired' : 'Hire'}</span>
    </button>`;
  }

  function renderHire() {
    let html = `<div class="hire-h"><span class="label">Assemble crew</span><h2>Who's on the call sheet?</h2>
      <p class="note">Better people work faster and botch less, but cost more. What's left of ${money(LEVEL.budget)} covers surprises and overtime. The rest is profit.</p></div>`;
    for (const r of LEVEL.hiring) {
      const rev = revealed[r.dept] || {};
      const dry = r.candidates.filter(c => c.network === 'yours').every(c => c.booked);
      const list = r.candidates.filter(c => c.network === 'yours' || rev[c.network]);
      html += `<section class="role"><div class="role-h"><span class="tab" style="background:${A.DEPT_COLOR[r.dept]}"></span><h3>${esc(r.role)}</h3><span class="picked" data-picked="${r.dept}"></span></div>`;
      if (dry) {
        const btns = (!rev.fof ? `<button class="btn small" type="button" data-net="${r.dept}:fof">Ask a friend of a friend</button>` : '') +
          (!rev.board ? `<button class="btn small" type="button" data-net="${r.dept}:board">Post on the crew board</button>` : '');
        html += `<div class="dry"><b>${esc(r.dryNote)}</b><span>Friends of friends come vouched for. The crew board is cheaper, but you won't know what you got until the shoot.</span>${btns ? `<div class="dry-actions">${btns}</div>` : ''}</div>`;
      }
      html += `<div class="cands" data-cands="${r.dept}">${list.map(c => candCard(r, c)).join('')}</div></section>`;
    }
    html += `<div class="hire-foot">
      <div class="money"><span>Budget<b>${money(LEVEL.budget)}</b></span><span>Crew<b id="mCrew">$0</b></span><span>Left<b id="mLeft">$0</b></span></div>
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
    document.querySelectorAll('[data-hire]').forEach(b => {
      const [dept, id] = b.dataset.hire.split(':');
      const on = picks[dept] === id;
      b.setAttribute('aria-pressed', String(on));
      if (!b.disabled) b.querySelector('.cta').textContent = on ? 'Hired' : 'Hire';
    });
    document.querySelectorAll('[data-picked]').forEach(el => {
      const c = picks[el.dataset.picked] && candidate(el.dataset.picked, picks[el.dataset.picked]);
      el.textContent = c ? `${c.name} · ${money(c.rate)}` : 'nobody yet';
    });
    const chk = S.hireCheck(LEVEL, chosenMap());
    $('mCrew').textContent = money(chk.cost);
    $('mLeft').textContent = money(chk.left);
    $('mLeft').classList.toggle('neg', chk.left < 0);
    $('mBar').classList.toggle('over', chk.left < 0);
    $('mBar').firstElementChild.style.width = Math.min(100, chk.cost / LEVEL.budget * 100) + '%';
    let note;
    if (chk.missing.length) note = `Still need: ${chk.missing.join(', ')}`;
    else if (chk.left < 0) note = `Over budget by ${money(-chk.left)}. Swap someone cheaper.`;
    else if (chk.left < 800) note = `Only ${money(chk.left)} left for surprises and overtime. Tight.`;
    else note = `${money(chk.left)} left for surprises, overtime and profit.`;
    $('mNote').textContent = note;
    $('startBtn').disabled = !chk.ok;
  }

  /* ================= Shoot: build ================= */

  function startShoot() {
    lab = null;
    const map = chosenMap();
    const crew = LEVEL.hiring.map(r => map[r.dept]);
    st = S.createGame(LEVEL, { crew, seed: (Date.now() % 1000003) + 1, mods: S.companyMods(CO.rooms, save.owned) });
    selected = null; lastCapture = null; toast = null; banked = false;
    clientLine = { text: '', until: 0, next: performance.now() + 9000, i: Math.floor(Math.random() * CLIENT_LINES.length) };
    tipUntil = performance.now() + 7000;
    buildShoot();
    closeModal();
    show('shoot');
  }

  function buildShoot() {
    resetView();
    const land = isLand();
    $('screen-shoot').className = 'app' + (lab ? ' lab' : '') + (land ? ' land' : lab ? ' port' : '');
    const perks = lab ? [] : save.owned.map(id => CO.rooms.find(r => r.id === id).name);
    // The same pieces in both arrangements. Portrait stacks them; landscape puts the shot list left, the set in the
    // middle at full height and crew plus ACTION under the right thumb. Ids are the same, so rendering is shared.
    const top = `<div class="topbar">
        <div class="pill paper grow"><b class="hand">${esc(LEVEL.title)}</b><span><span id="shotCount">0/3 SHOTS</span> · <span class="clock" id="clock">0:00</span></span></div>
        <div class="pill paper"><span>CASH LEFT</span><b id="budget">$0</b></div>
        <button class="sq" type="button" id="pauseBtn" aria-label="Pause">${A.pauseSVG(18)}</button>
      </div>`;
    const daybar = `<div class="daybar" id="daybar"><i id="dayFill"></i><span class="wm" style="left:${(LEVEL.timeLimit / LEVEL.hardStop * 100).toFixed(1)}%"><span>WRAP</span></span></div>`;
    const actionBtn = `<button class="clapbtn" type="button" id="actionBtn" aria-label="Call action">${A.clapperSVG()}<span class="cap" id="actionCap">not ready</span></button>`;
    const setBox = `<div class="set-wrap" id="setWrap">
        ${A.setMarkup({ wide: land })}
        <div class="stcard" id="stcard" hidden></div>
        <div class="onstage"><small>ON STAGE</small><span id="onstage"></span></div>
        ${land ? '' : actionBtn}
        <div class="flash" id="flash"></div>
      </div>`;
    const ribbon = `<div class="ribbon" id="ribbon"><span id="ribbonText"></span><button class="btn small" type="button" id="autoBtn" hidden>Back to auto</button></div>`;
    const shotcard = `<div class="shotcard paper" id="shotcard"></div>`;
    const crewbar = `<div class="crewbar" id="crewbar"></div>`;
    // Landscape follows the concept HUD: a status bar across the top, crew and what's next on the left, the set in
    // the middle, the shot list and set conditions on the right
    const segs = Array.from({ length: DAY_HOURS }, () => '<i></i>').join('');
    const hudTop = `<div class="hud-top">
        ${window.WrapAssets ? `<img class="hud-logo" src="${window.WrapAssets.logo}" alt="That's a Wrap!">` : ''}
        <div class="hud-job"><b>${esc(LEVEL.title)}</b><small>Shoot day · ${esc(LEVEL.client || 'Big Bun Burgers')}</small></div>
        <div class="hud-dark hud-money">
          <div class="meter"><span>Budget</span><b id="hudBudget"></b><em><i id="budgetFill"></i></em></div>
          <div class="meter"><span>Spend</span><b id="hudSpend"></b><em><i id="spendFill"></i></em></div>
        </div>
        <div class="hud-dark hud-time" id="hudTime"><span>Time</span><b id="clock"></b><div class="segs" id="timeSegs">${segs}</div></div>
        <div class="hud-dark hud-stars" id="hudStars" role="img" aria-label="On track for stars"></div>
        <button class="hud-pause" type="button" id="pauseBtn" aria-label="Pause">${A.pauseSVG(20)}</button>
      </div>`;
    // Landscape: the set fills the screen and the HUD floats on it, mobile-game style. A thin status bar on top,
    // crew portraits down the left edge, the shot list folded into a tab that opens as a pop-up, the coaching line
    // as a small quest tracker, ACTION under the right thumb. Task prompts appear on the set over the crew.
    $('screen-shoot').innerHTML = land
      ? `<div class="land-stage">
          ${setBox}
          ${hudTop}
          <div class="crew-rail">${crewbar}</div>
          <button class="shots-tab" type="button" id="shotsTab" aria-expanded="false" aria-controls="shotsPop">
            <b>Shot list</b><span id="shotNum">0 / 3</span><small id="shotsNow"></small><em><i id="shotsNowBar"></i></em>
          </button>
          <section class="shots-pop" id="shotsPop" hidden>
            <div class="pop-h"><b>Shot list</b><button class="pop-x" type="button" data-shotsclose aria-label="Close">✕</button></div>
            ${shotcard}
            <h4>Set conditions</h4><ul class="conds" id="conds"></ul><div class="board" id="board"></div>
          </section>
          <div class="quest">${ribbon}</div>
          ${actionBtn}
        </div>`
      : `${top}${daybar}${setBox}${ribbon}${shotcard}${crewbar}${perks.length ? `<p class="hint">Office perks today: ${esc(perks.join(', '))}</p>` : ''}`;
    syncRot();
    if (land) { fitWideSet(); requestAnimationFrame(fitWideSet); setTimeout(fitWideSet, 400); }

    const layer = $('crewLayer');
    const bar = $('crewbar');
    const HIT_W = lab || isLand() ? 48 : 36; // the lab widens the tap area around each puppet so the layouts are compared on comfortable targets
    for (const c of st.crew) {
      const idle = idleSpot(c.dept);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'pup');
      g.setAttribute('data-crew', c.id);
      g.style.transform = `translate(${idle.x}px, ${idle.y}px)`;
      g.innerHTML =
        `<ellipse class="selring" cx="0" cy="0" rx="19" ry="6" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 2"/>` +
        `<g class="flip"><g transform="scale(1.25)">${A.puppet(c)}<g class="held"></g></g></g>` +
        `<g class="ring" transform="translate(0 -74)" opacity="0"><circle r="7" fill="#fff" stroke="#22262B" stroke-width="1.3"/><circle class="rp" r="7" fill="none" stroke="#4E8A62" stroke-width="3.6" stroke-dasharray="0 44" transform="rotate(-90)"/></g>` +
        `<g class="bub" transform="translate(0 -77)" opacity="0"><rect class="bb" x="-20" y="-10" width="40" height="15" rx="4" fill="#fff" stroke="#22262B" stroke-width="1.3"/><text class="bt" y="1.6" text-anchor="middle" font-size="9" font-weight="700" font-family="Atkinson Hyperlegible, system-ui, sans-serif" fill="#22262B"></text></g>` +
        `<rect x="${-HIT_W / 2}" y="-66" width="${HIT_W}" height="72" fill="transparent"/>`;
      layer.appendChild(g);
      view.pups[c.id] = { g, held: g.querySelector('.held'), heldKey: '', flip: g.querySelector('.flip'), ring: g.querySelector('.ring'), rp: g.querySelector('.rp'), bub: g.querySelector('.bub'), bb: g.querySelector('.bb'), bt: g.querySelector('.bt') };
      view.pos[c.id] = { x: idle.x, y: idle.y };
      view.pups[c.id].walker = Wk.create(g, idle);

      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cb dept-' + c.dept;
      b.dataset.crew = c.id;
      b.innerHTML = `<span class="dotst"></span>${A.faceSVG(c)}<span class="rl">${esc(ROLE_WORD[c.dept] || c.dept)}</span><span class="nm">${esc(c.name)}</span><span class="tx"></span><span class="bar"><i></i></span><span class="man" hidden>MANUAL</span>`;
      bar.appendChild(b);
      view.cb[c.id] = { el: b, dot: b.querySelector('.dotst'), tx: b.querySelector('.tx'), bar: b.querySelector('.bar i'), man: b.querySelector('.man') };
    }
  }

  /* ================= Shoot: input ================= */


  /*
    Landscape safe area: the set's working frame (A.WIDE_VIEW) is fitted between the crew portraits on the left,
    the status bar on top, the ACTION column on the right and a bottom margin, so no one you need to tap and no
    foreground character sits under a control or off the edge. The paper flats and floor still fill the whole screen.
  */
  function fitWideSet() {
    const svg = $('setSvg');
    if (!svg || !svg.classList.contains('wide')) return;
    const wrap = $('setWrap');
    const W = wrap.offsetWidth, H = wrap.offsetHeight;
    if (!W || !H) return;
    const rail = document.querySelector('.crew-rail .crewbar'), hud = document.querySelector('.hud-top'), act = $('actionBtn');
    const l = rail ? rail.parentElement.offsetLeft + rail.offsetWidth + 8 : 10;
    const t = hud ? hud.offsetTop + hud.offsetHeight + 4 : 10;
    const r = act ? W - act.offsetLeft + 8 : 10;
    const b = 10;
    const [vx, vy, vw, vh] = A.WIDE_VIEW;
    const sw = Math.max(60, W - l - r), sh = Math.max(60, H - t - b);
    const k = Math.min(sw / vw, sh / vh);
    const x0 = vx - (l + (sw - vw * k) / 2) / k, y0 = vy - (t + (sh - vh * k) / 2) / k;
    svg.setAttribute('viewBox', [x0, y0, W / k, H / k].map(n => n.toFixed(2)).join(' '));
    svg.setAttribute('preserveAspectRatio', 'none');
  }

  function setShots(open) {
    $('shotsPop').hidden = !open;
    $('shotsTab').setAttribute('aria-expanded', String(open));
    $('shotsTab').classList.toggle('open', open);
  }

  // Every order goes through here so the lab can time and count it
  function cmdAssign(crewId, taskId) {
    const r = S.command(st, { type: 'assign', crew: crewId, task: taskId });
    if (lab) labOrder(crewId, r);
    return r;
  }

  function selectCrew(id, via) {
    if (st.over || modal) return;
    const other = st.crew.find(c => c.id === id);
    if (selected && selected !== id && other.task) {
      const helper = st.crew.find(c => c.id === selected);
      const r = cmdAssign(selected, other.task);
      say(r.ok ? `${helper.name} helps ${other.name}: ${r.message}` : r.message, !r.ok);
      if (r.ok) selected = null;
      return;
    }
    selected = selected === id ? null : id;
    if (lab && selected) lab.selVia = via || 'set';
  }

  function assignTo(taskId) {
    if (!selected) {
      const ts = S.taskStatus(st, taskId);
      say(`${st.tasks[taskId].label}: ${ts.text}. Tap a crew member first to reassign.`);
      return;
    }
    const r = cmdAssign(selected, taskId);
    say(r.message, !r.ok);
    if (r.ok) selected = null;
  }

  function assignStation(station) {
    if (!selected) { view.stCard = view.stCard === station ? null : station; return; }
    view.stCard = null;
    // The engine decides what this person can do here (their own department only, on the Burger Job)
    const a = S.canAssign(st, selected, station);
    if (a.state === 'go' || a.state === 'slow') { assignTo(a.task); return; }
    say(a.why || 'Nothing for them there.', a.state !== 'busy');
  }

  /* ================= Layout lab (Milestone B experiment) ================= */

  // Same crew and seed for every lab run, so the only thing that changes between runs is the layout
  const LAB_PICKS = { camera: 'mika', lighting: 'ro', grip: 'dani', art: 'paz' };
  const LAB_SEED = 4242;
  const LAB_LAYOUTS = { port: 'Portrait', land: 'Landscape' };

  function newLab(layout) {
    return { layout, orders: 0, refused: 0, taps: 0, dropped: 0, kinds: {}, via: { set: 0, bar: 0 }, selVia: 'set', waits: [], idle: 0, waitStart: {}, lastTicks: 0 };
  }

  function startLab(layout) {
    lab = newLab(layout);
    const crew = LEVEL.hiring.map(r => candidate(r.dept, LAB_PICKS[r.dept]));
    st = S.createGame(LEVEL, { crew, seed: LAB_SEED, autonomy: 0 });
    selected = null; lastCapture = null; toast = null; banked = true;
    clientLine = { text: '', until: 0, next: performance.now() + 9000, i: 0 };
    tipUntil = performance.now() + 9000;
    buildShoot();
    closeModal();
    show('shoot');
  }

  function labOrder(crewId, r) {
    if (!r.ok) { lab.refused++; return; }
    if (/already/.test(r.message)) return;
    lab.orders++;
    lab.via[lab.selVia] = (lab.via[lab.selVia] || 0) + 1;
    const since = lab.waitStart[crewId];
    if (since != null) { lab.waits.push((st.ticks - since) / S.TPS); lab.waitStart[crewId] = null; }
  }

  // Called every frame while the shoot runs: who is standing around with work available, and for how long
  function labTick() {
    const d = st.ticks - lab.lastTicks;
    lab.lastTicks = st.ticks;
    if (d <= 0) return;
    if (!lab.geo && st.ticks >= 20) lab.geo = labGeometry(); // early, before the ACTION push-in zoom changes the set's size
    for (const c of st.crew) {
      if (S.idleWork(st, c)) {
        if (lab.waitStart[c.id] == null) lab.waitStart[c.id] = st.ticks - d;
        lab.idle += d / S.TPS;
      } else lab.waitStart[c.id] = null;
    }
  }

  function labTap(kind) {
    lab.taps++;
    lab.kinds[kind] = (lab.kinds[kind] || 0) + 1;
    if (kind === 'empty' && selected) lab.dropped++;
  }

  // What the layout actually gave the player on this device, in real pixels
  function labGeometry() {
    const rot = document.body.classList.contains('rot');
    const dims = el => { const r = el.getBoundingClientRect(); return rot ? [r.height, r.width] : [r.width, r.height]; };
    const [sw, sh] = dims($('setSvg'));
    const unit = Math.min(sw / 360, sh / 410);
    const tile = dims(document.querySelector('.cb'));
    const act = dims($('actionBtn'));
    return {
      unit: +unit.toFixed(2), puppetW: Math.round(48 * unit), puppetH: Math.round(72 * unit),
      tileW: Math.round(tile[0]), tileH: Math.round(tile[1]), actW: Math.round(act[0]), actH: Math.round(act[1]),
      icon: Math.round(dims(document.querySelector('.ti') || document.body)[0]),
      scroll: Math.max(0, Math.round(document.documentElement.scrollHeight - window.innerHeight)),
      viewport: `${window.innerWidth}x${window.innerHeight}${rot ? ' (rotated)' : ''}`,
    };
  }

  function labResult() {
    const secs = Math.max(1, S.seconds(st));
    const sc = S.score(st);
    return {
      layout: lab.layout, at: Date.now(),
      orders: lab.orders, perMin: +(lab.orders / (secs / 60)).toFixed(1),
      wait: lab.waits.length ? +(lab.waits.reduce((a, b) => a + b, 0) / lab.waits.length).toFixed(1) : 0,
      idlePct: Math.round(lab.idle / (st.crew.length * secs) * 100),
      tapsPerOrder: lab.orders ? +(lab.taps / lab.orders).toFixed(1) : 0,
      dropped: lab.dropped, refused: lab.refused, viaBar: lab.via.bar || 0, viaSet: lab.via.set || 0,
      time: Math.round(secs), shots: sc.shotsDone, quality: sc.avgQuality, stars: sc.stars,
      geo: lab.geo || labGeometry(),
    };
  }

  function labCompare() {
    const rows = [
      ['Orders per minute', r => r.perMin, 'higher is busier'],
      ['Wait for an order (s)', r => r.wait, 'lower is faster'],
      ['Crew standing idle', r => r.idlePct + '%', ''],
      ['Taps per order', r => r.tapsPerOrder, 'lower is smoother'],
      ['Dropped selections', r => r.dropped, ''],
      ['Refused orders', r => r.refused, ''],
      ['Picked crew from set / bar', r => `${r.viaSet} / ${r.viaBar}`, ''],
      ['Shoot time', r => S.fmtTime(r.time), ''],
      ['Scrolling needed to see it all (px)', r => r.geo.scroll, '0 is the goal'],
      ['Set scale (px per unit)', r => r.geo.unit, 'bigger reads better'],
      ['Crew tap target on set (px)', r => `${r.geo.puppetW}x${r.geo.puppetH}`, ''],
      ['Crew tile (px)', r => `${r.geo.tileW}x${r.geo.tileH}`, ''],
      ['Task icon (px)', r => r.geo.icon, ''],
      ['ACTION button (px)', r => `${r.geo.actW}x${r.geo.actH}`, ''],
      ['Screen', r => r.geo.viewport, ''],
    ];
    const last = k => (save.lab[k] || []).slice(-1)[0];
    const p = last('port'), l = last('land');
    const cell = (r, fn) => (r ? esc(String(fn(r))) : '<span class="dim">not played</span>');
    return `<div class="labcmp"><span></span><span class="h">Portrait</span><span class="h">Landscape</span>${rows.map(([name, fn]) => `<span>${name}</span><b>${cell(p, fn)}</b><b>${cell(l, fn)}</b>`).join('')}</div>`;
  }

  function showLab() {
    openModal('lab', `
      <span class="label">Layout lab</span>
      <p>The same shoot with the same crew and seed. Everyone waits for your orders, so you direct the whole shoot. Play it once in each layout and the numbers below fill in.</p>
      <div class="labrun">
        <button class="btn go" type="button" data-labstart="port" style="font-size:19px">Play portrait</button>
        <button class="btn go" type="button" data-labstart="land" style="font-size:19px;background:var(--slate)">Play landscape</button>
      </div>
      <p class="note">Landscape: turn the phone sideways. If it stays upright because rotation is locked, the game turns the shoot sideways for you (turn the phone counterclockwise). <button class="btn small" type="button" data-labflip>Turned the other way? Flip</button></p>
      ${labCompare()}
      <button class="btn" type="button" data-close>Back to the office</button>`);
  }

  function showLabWrap() {
    const res = labResult();
    save.lab[lab.layout] = (save.lab[lab.layout] || []).concat(res).slice(-5);
    persist();
    const other = lab.layout === 'port' ? 'land' : 'port';
    openModal('labwrap', `
      <div class="chaos-h" style="background:var(--slate)"><b>${LAB_LAYOUTS[lab.layout]} run done</b></div>
      <p>${res.shots}/3 shots in ${S.fmtTime(res.time)}. ${res.orders} orders, one every ${(res.time / Math.max(1, res.orders)).toFixed(1)}s.</p>
      ${labCompare()}
      <button class="btn go" type="button" data-labstart="${other}" style="font-size:19px">Now play ${LAB_LAYOUTS[other].toLowerCase()}</button>
      <div class="row2"><button class="btn" type="button" data-labstart="${lab.layout}">Replay this one</button><button class="btn" type="button" data-labback>Lab home</button></div>`);
  }

  function pressAction() {
    const r = S.command(st, { type: 'action' });
    if (!r.ok) { say(r.message, true); return; }
    setText($('clapText'), `SCENE ${st.priority.indexOf(st.capture.shot) + 1} · TAKE 1`);
    const clap = $('clap');
    clap.classList.remove('go'); void clap.getBBox(); clap.classList.add('go');
    const fl = $('flash');
    setTimeout(() => { fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go'); }, 420);
    clientLine = Object.assign(clientLine, { text: 'Ooooh.', until: performance.now() + 3000 });
    say(r.message);
  }

  /* ================= Shoot: render ================= */

  function displayShot() {
    if (st.capture) return st.capture.shot;
    if (st.stageShot) return st.stageShot;
    return S.stageCandidate(st) || lastCapture || st.priority[0];
  }

  // Progress inside a sub-range, and stepped so motion reads as stop-motion rather than a smooth slide
  const seg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  const steps = (p, n) => Math.floor(p * (n || 8) + 1e-9) / (n || 8);
  const lerp = (a, b, t) => a + (b - a) * t;
  const KEY_AIM = { hero: [-12, 20], cheese: [20, 34], sauce: [34, 12] };
  const CAM_SHIFT = { hero: [0, 0], cheese: [-30, 6], sauce: [-16, -8] };
  const MACRO = { hero: false, cheese: true, sauce: true };

  function camPlace() {
    const disp = displayShot();
    const fp = st.shots[disp].captured || (st.capture && st.capture.shot === disp) ? 1 : pct(`${disp}.frame`);
    const from = CAM_SHIFT[lastCapture] || [0, 0];
    const to = CAM_SHIFT[disp] || [0, 0];
    const move = steps(seg(fp, 0, 0.5), 6);
    const lensFrom = MACRO[lastCapture] ? 1 : 0;
    const lensTo = MACRO[disp] ? 1 : 0;
    return { x: lerp(from[0], to[0], move), y: lerp(from[1], to[1], move), lens: lerp(lensFrom, lensTo, steps(seg(fp, 0.5, 0.8), 4)), fp };
  }

  function renderSet(now) {
    const disp = displayShot();
    const showEl = (id, on) => setAttr($(id), 'display', on ? 'inline' : 'none');
    const captured = st.shots[disp] && st.shots[disp].captured;
    const rolling = st.capture && st.capture.shot === disp;

    // GRIP builds the hero setup: carries the platform in from the gear pile, unrolls the sweep, raises the flag
    const sp = st.shots.hero.captured || isDone('hero.set') ? 1 : pct('hero.set');
    const carry = steps(seg(sp, 0, 0.45), 6);
    showEl('platform', sp > 0);
    setAttr($('platform'), 'transform', carry < 1 ? `translate(${(80 * (1 - carry)).toFixed(1)} ${(-8 * Math.sin(carry * Math.PI)).toFixed(1)})` : '');
    showEl('pc-sweep', sp >= 0.4);
    setAttr($('sweepRoll'), 'transform', `translate(0 28) scale(1 ${Math.max(0.03, steps(seg(sp, 0.45, 0.85), 6)).toFixed(3)}) translate(0 -28)`);
    showEl('pc-flag', sp >= 0.92);
    setAttr($('sweep'), 'fill', SHOT_COLOR[disp] || '#E7B84F');
    Ld.tint('grip.sweep', SHOT_COLOR[disp] || null);

    const rigTask = disp === 'cheese' ? 'cheese.rig' : disp === 'sauce' ? 'sauce.mount' : null;
    const rn = !rigTask ? 0 : (isDone(rigTask) || captured) ? 3 : Math.floor(pct(rigTask) * 3);
    showEl('rig-pole', rn >= 1); showEl('rig-arm', rn >= 2);
    showEl('rig-fork', disp === 'cheese' && rn >= 3); showEl('rig-bottle', disp === 'sauce' && rn >= 3);

    // ELECTRIC wheels the key light to its mark, aims it, then switches it on; later shots re-aim it
    // The light stays dark until the fix, the rental or the bounce card actually resolves it
    const dead = !!st.pending || Object.values(st.blocks).includes('keylight') || (!!st.tasks['keylight.fix'] && !st.tasks['keylight.fix'].done);
    const hl = isDone('hero.light') ? 1 : pct('hero.light');
    const anyLight = Math.max(hl, pct('cheese.light'), pct('sauce.light'), st.tasks['keylight.fix'] ? pct('keylight.fix') : 0);
    const rollIn = (isDone('hero.light') || isDone('cheese.light') || isDone('sauce.light')) ? 1 : steps(seg(anyLight, 0, 0.4), 5);
    setAttr($('keyRig'), 'transform', rollIn < 1 ? `translate(${(-44 * (1 - rollIn)).toFixed(1)} 0)` : '');
    const aimRange = KEY_AIM[disp] || [20, 20];
    const dl = captured || rolling ? 1 : pct(`${disp}.light`);
    const aimP = disp === 'hero' ? steps(seg(dl, 0.4, 0.8), 5) : steps(dl, 5);
    const aim = lerp(aimRange[0], aimRange[1], aimP);
    setAttr($('keyHead'), 'transform', `rotate(${aim.toFixed(1)} 72 76)`);
    // The beam starts at the lens, wherever the head points, and ends on the hero prop
    const beamKey = `${aim.toFixed(1)}|${rollIn}`;
    if (view.beamKey !== beamKey) {
      view.beamKey = beamKey;
      const [la, lb] = A.keyLens();
      const r = aim * Math.PI / 180, c = Math.cos(r), sn = Math.sin(r), rx = -44 * (1 - rollIn);
      const turn = (p) => [72 + p[0] * c - p[1] * sn + rx, 76 + p[0] * sn + p[1] * c];
      const hs = A.heroSpot();
      const pts = [turn(la), turn(lb), [hs.x - 30, hs.y + 4], [hs.x + 30, hs.y + 2]];
      setAttr($('beam'), 'points', pts.map(p => p.map(n => n.toFixed(1)).join(',')).join(' '));
    }
    let beam = 0;
    if (!dead) beam = disp === 'hero' ? 0.4 * steps(seg(dl, 0.8, 1), 3) : (rollIn >= 1 ? 0.22 + 0.18 * dl : 0);
    setAttr($('beam'), 'opacity', beam.toFixed(2));
    setAttr($('lightFace'), 'fill', dead ? '#3A3631' : beam > 0 ? '#FFE7A3' : '#7A7468');
    Ld.state('elec.keylight-head', dead ? 'dead' : beam > 0 ? 'on' : 'off');
    setAttr($('dead'), 'opacity', dead ? 1 : 0);
    const fillUp = isDone('hero.light') || st.shots.hero.captured || hl > 0.5;
    setAttr($('fillLight'), 'opacity', fillUp ? 1 : 0);
    setAttr($('fillBeam'), 'opacity', fillUp && !dead ? 0.35 : 0);
    const bl = disp === 'sauce' ? (captured || rolling ? 1 : pct('sauce.light')) : 0;
    setAttr($('backLight'), 'opacity', bl > 0 ? 1 : 0);
    setAttr($('backLight'), 'transform', `translate(0 ${(-26 * (1 - steps(seg(bl, 0, 0.6), 4))).toFixed(1)})`);

    // ART carries the finished burger from the art table to the platform; later props change on the set
    const place = isDone('hero.place') ? 1 : pct('hero.place');
    let key = 'none', inner = '', propT = 'translate(150 92)';
    if (disp === 'hero' && (place > 0 || captured || rolling)) {
      key = 'hero'; inner = A.propInner('hero');
      if (place < 1 && !captured && !rolling) {
        const k = steps(place, 5);
        // #prop sits inside the hero spot group, so the art cart's position is taken back out of its shift
        const hs = A.heroSpot();
        const c0 = A.carryStart();
        propT = `translate(${lerp(c0.x - hs.dx, 150, k).toFixed(1)} ${(lerp(c0.y - hs.dy, 92, k) - 22 * Math.sin(k * Math.PI)).toFixed(1)}) scale(${lerp(c0.s, 1, k).toFixed(3)})`;
      }
    } else if (disp === 'cheese' && (st.stageShot === 'cheese' || captured || rolling)) {
      const ready = (isDone('cheese.melt') && isDone('cheese.rig')) || captured || rolling;
      const lift = rolling ? 10 + Math.round((1 - st.capture.left / st.capture.total) * 10) : ready ? 10 : 0;
      key = 'cheese' + lift; inner = ready ? A.propInner('cheese', { lift }) : A.propInner('hero');
    } else if (disp === 'sauce' && (st.stageShot === 'sauce' || captured || rolling)) {
      const sauced = rolling ? st.capture.left < st.capture.total * 0.6 : captured;
      key = 'sauce' + sauced; inner = sauced ? A.propInner('sauce') : A.propInner('hero');
    }
    if (key !== view.propKey) { view.propKey = key; $('prop').innerHTML = inner; }
    setAttr($('prop'), 'transform', propT);
    setAttr($('pour'), 'opacity', disp === 'sauce' && rolling ? 1 : 0);
    setAttr($('sparkle'), 'opacity', disp === 'hero' && rolling ? 1 : 0);

    // CAMERA dollies to each setup and swaps to a macro lens for the close-ups
    const cam = camPlace();
    setAttr($('camRig'), 'transform', `translate(${cam.x.toFixed(1)} ${cam.y.toFixed(1)})`);
    setAttr($('lens'), 'x', (270 - 12 * cam.lens).toFixed(1));
    setAttr($('lens'), 'width', (19 + 12 * cam.lens).toFixed(1));
    Ld.state('cam.lens', cam.lens > 0.5 ? 'macro' : 'standard');
    const fp = captured || rolling ? 1 : cam.fp;
    setAttr($('frameMarks'), 'opacity', (steps(seg(fp, 0.6, 1), 4) * 0.95).toFixed(2));
    setAttr($('recDot'), 'fill', st.capture ? '#FF4B3A' : '#5A2A24');
    const monKey = fp > 0.5 ? key + ':' + (fp >= 1 ? 'f' : 'p') : 'bars';
    if (monKey !== view.monKey) {
      view.monKey = monKey;
      $('monView').innerHTML = fp > 0.5 && inner
        ? `<rect x="-4" y="-6" width="98" height="60" fill="${SHOT_COLOR[disp]}"/><g transform="translate(16 8)">${inner}</g>`
        : `<g opacity=".7"><rect x="-4" y="-6" width="14" height="60" fill="#E6E6E6"/><rect x="10" y="-6" width="14" height="60" fill="#E7B84F"/><rect x="24" y="-6" width="14" height="60" fill="#7FB0C9"/><rect x="38" y="-6" width="14" height="60" fill="#7FB069"/><rect x="52" y="-6" width="14" height="60" fill="#C77FC0"/><rect x="66" y="-6" width="14" height="60" fill="#D86B56"/><rect x="80" y="-6" width="14" height="60" fill="#344F70"/></g>`;
    }
    setAttr($('monRec'), 'opacity', st.capture ? 1 : 0);

    // Rolling: house lights down, spotlight on the burger, camera pushes in
    setAttr($('dim'), 'opacity', st.capture ? 0.5 : 0);
    $('setWrap').classList.toggle('pushin', !!st.capture);

    // Art table: the burger stack builds up while styling, then leaves with the art crew
    const cn = place > 0 || st.shots.hero.captured ? 0 : isDone('hero.style') ? 5 : Math.floor(pct('hero.style') * 5);
    if (cn !== view.cartN) { view.cartN = cn; $('cartBurger').innerHTML = A.cartBurger(cn); }
    const melt = st.tasks['cheese.melt'];
    const mp = st.shots.cheese.captured ? 0 : pct('cheese.melt');
    setAttr($('potCheese'), 'height', (12 * mp).toFixed(1));
    setAttr($('potCheese'), 'y', (14 - 12 * mp).toFixed(1));
    setAttr($('potCheese'), 'fill', melt.spoiled && !melt.done ? '#B9A15A' : '#F2C14E');
    setAttr($('steam'), 'opacity', melt.done && !st.shots.cheese.captured ? 1 : 0);
    const pf = $('potFill');
    if (pf) {
      const dy = +pf.getAttribute('data-dy') || 0;
      pf.setAttribute('display', mp > 0 ? 'inline' : 'none');
      pf.setAttribute('transform', `translate(0 ${(dy * (1 - mp)).toFixed(2)})`);
      Ld.tint(pf, melt.spoiled && !melt.done ? '#B9A15A' : null);
    }
    setAttr($('bowlSauce'), 'opacity', st.shots.sauce.captured ? 0 : pct('sauce.prep').toFixed(2));

    // Workstation badges: the ring shows progress and turns red when the station is blocked
    for (const stn of ['light', 'table', 'camera', 'cart']) {
      const info = S.stationInfo(st, stn);
      const b = $('badge-' + stn);
      if (!b) continue;
      const ring = b.querySelector('.bring');
      const color = info.state === 'blocked' ? '#D86B56' : info.state === 'working' ? '#4E8A62' : info.state === 'done' ? '#4E8A62' : '#9AA0A8';
      const fill = info.state === 'blocked' || info.state === 'waiting' ? 1 : info.pct;
      setAttr(ring, 'stroke', color);
      setAttr(ring, 'stroke-dasharray', `${(fill * 73).toFixed(1)} 73`);
      setAttr(ring, 'stroke-opacity', info.state === 'waiting' ? 0.6 : 1);
      b.classList.toggle('blocked', info.state === 'blocked');
      b.classList.toggle('open', view.stCard === stn);
    }

    // While someone is selected, each station's badge gets a small marker for what it would do for them (green full
    // speed, amber half speed, red can't), and only the best spot gets a light outline, so the set stays readable
    if (!view.hits) view.hits = [...document.querySelectorAll('.station-hit')];
    const states = {};
    for (const el of view.hits) { const sn = el.getAttribute('data-station'); states[sn] = selected ? S.canAssign(st, selected, sn).state : ''; }
    let pick = null;
    if (selected) {
      const ns = S.nextStep(st);
      pick = ns && ns.crew === selected && states[ns.station] === 'go' ? ns.station : Object.keys(states).find(k => states[k] === 'go') || Object.keys(states).find(k => states[k] === 'slow') || null;
    }
    for (const el of view.hits) {
      const sn = el.getAttribute('data-station');
      const cls = 'station-hit' + (states[sn] ? ' hit-' + states[sn] : '') + (sn === pick ? ' hit-pick' : '');
      if (el.getAttribute('class') !== cls) el.setAttribute('class', cls);
      const b = $('badge-' + sn);
      if (b) for (const k of ['go', 'slow', 'no', 'busy']) b.classList.toggle('mk-' + k, states[sn] === k);
    }

    // Client notes from video village
    if (!modal && !st.over) {
      if (now > clientLine.next && now > clientLine.until) {
        clientLine.text = CLIENT_LINES[clientLine.i++ % CLIENT_LINES.length];
        clientLine.until = now + 3500;
        clientLine.next = now + 14000;
      }
    }
    const talking = now < clientLine.until;
    setAttr($('clientBub'), 'opacity', talking ? 1 : 0);
    if (talking) setText($('clientText'), clientLine.text);

    // Crew puppets go to their station (the camera station follows the dolly)
    const realDt = view.walkT ? Math.min(0.1, (now - view.walkT) / 1000) : 0;
    view.walkT = now;
    const walkDt = modal || st.paused ? 0 : realDt * speed;
    const qs = isLand() && S.nextStep(st);
    const questCrew = qs && qs.crew;
    const landHud = isLand();
    const at = {};
    const targets = {};
    for (const c of st.crew) {
      let p;
      if (c.task) {
        const stn = S.stationOf(st.tasks[c.task]);
        at[stn] = (at[stn] || 0) + 1;
        const base = A.STATIONS[stn];
        const shift = stn === 'camera' ? [cam.x, cam.y] : [0, 0];
        p = { x: Math.round(base.x + shift[0] - (at[stn] - 1) * 28), y: Math.round(base.y + shift[1] + (at[stn] - 1) * 5) };
      } else p = idleSpot(c.dept);
      targets[c.id] = p;
      const v = view.pups[c.id];
      // The walker steps the puppet to its spot at walking speed, in game time (pauses with the game, 2x walks faster)
      v.walker.goTo(p.x, p.y);
      v.walker.tick(walkDt);
      view.pos[c.id] = { x: v.walker.x, y: v.walker.y };
      v.walking = v.walker.moving;
      const cs = S.crewStatus(st, c);
      const asking = !!lab && !!S.idleWork(st, c); // standing around with work available, waiting for an order
      v.g.classList.toggle('working', cs.state === 'WORKING');
      v.g.classList.toggle('sel', selected === c.id);
      v.g.classList.toggle('ask', asking);
      v.g.classList.toggle('quest', !!questCrew && questCrew === c.id && selected !== c.id);
      Ld.pose(v.g, v.walking ? 'walk' : cs.state === 'WORKING' ? 'work' : 'idle');
      const hk = cs.state === 'WORKING' ? 'tool' : '';
      if (hk !== v.heldKey) { v.heldKey = hk; v.held.innerHTML = A.heldItem(c.dept, hk); }
      if (cs.state === 'WORKING') {
        setAttr(v.ring, 'opacity', 1);
        setAttr(v.rp, 'stroke-dasharray', `${(cs.pct * 44).toFixed(1)} 44`);
        setAttr(v.bub, 'opacity', 0);
      } else {
        setAttr(v.ring, 'opacity', 0);
        let txt = '...', fill = '#fff', col = '#22262B';
        let showBub = true;
        if (asking) { txt = '?'; fill = '#E7B84F'; }
        else if (cs.state === 'BLOCKED') { txt = '!'; fill = '#D86B56'; col = '#fff'; }
        else if (/ACTION/.test(cs.text)) txt = 'ACTION?';
        else if (/^No /.test(cs.text) || cs.text === 'Wrapped' || /Rolling/.test(cs.text) || /Holding|goes first|Stage busy/.test(cs.text)) showBub = false;
        // Landscape keeps the set quiet: one "?" for the person the next step needs, "!" for anyone blocked, no idle
        // chatter. Everyone else waiting still pulses on their crew card.
        if (landHud && showBub && !(cs.state === 'BLOCKED' || (asking && questCrew === c.id))) showBub = false;
        setAttr(v.bub, 'opacity', showBub ? 1 : 0);
        setAttr(v.bb, 'fill', fill);
        setAttr(v.bt, 'fill', col);
        setText(v.bt, txt);
      }
    }
    const order = st.crew.slice().sort((a, b) => view.pos[a.id].y - view.pos[b.id].y).map(c => c.id); // live depth while walking
    const depth = order.join();
    if (depth !== view.depth) { view.depth = depth; for (const id of order) $('crewLayer').appendChild(view.pups[id].g); }
  }

  // Station card: what a workstation is doing, read straight from the simulation
  function renderStationCard() {
    const el = $('stcard');
    if (!view.stCard) { el.hidden = true; return; }
    const info = S.stationInfo(st, view.stCard);
    el.hidden = false;
    const crew = info.crew.length ? info.crew.join(' + ') : 'Nobody yet';
    const status = info.blocker ? `<span class="stc-block">${esc(info.blocker)}</span>` : info.state === 'working' ? `<span class="stc-ok">${esc(info.text)}</span>` : `<span>${esc(info.text)}</span>`;
    const html = `<div class="stc-h"><b>${esc(info.name)}</b><button class="stc-x" type="button" data-stclose aria-label="Close">✕</button></div>
      ${info.label ? `<div class="stc-task">${esc(info.label)} <small>· ${esc(info.shot)}</small></div>
      <div class="stc-bar"><i style="width:${Math.round(info.pct * 100)}%"></i></div>
      <div class="stc-row"><span>Crew: <b>${esc(crew)}</b></span>${status}</div>
      ${info.next.length ? `<div class="stc-next">Then: ${esc(info.next.slice(0, 2).join(', '))}</div>` : ''}` : `<div class="stc-task">${esc(info.text)}</div>`}`;
    if (el._h !== html) { el._h = html; el.innerHTML = html; }
  }

  function renderHud(now) {
    const t = S.seconds(st);
    const landHud = isLand();
    if (!landHud) {
      setText($('clock'), S.fmtTime(t));
      $('clock').classList.toggle('warn', t > LEVEL.timeLimit);
      setText($('budget'), money(st.budget));
      $('budget').classList.toggle('neg', st.budget < 0);
      const wrapped = Object.values(st.shots).filter(s => s.captured).length;
      setText($('shotCount'), `${wrapped}/3 SHOTS`);
      setW($('dayFill'), t / LEVEL.hardStop);
      $('daybar').classList.toggle('ot', t > LEVEL.timeLimit);
    }

    const cand = S.stageCandidate(st);
    setText($('onstage'), st.capture ? st.shots[st.capture.shot].name : st.stageShot ? st.shots[st.stageShot].name : (cand ? st.shots[cand].name : 'Wrapped'));

    // Clapper ACTION button
    const r = cand && S.readiness(st, cand);
    const ab = $('actionBtn');
    const ready = !!(r && r.ready && !st.capture && !st.pending);
    ab.classList.toggle('on', ready);
    ab.classList.toggle('rolling', !!st.capture);
    let cap;
    if (st.capture) cap = 'ROLLING';
    else if (ready) cap = `READY · ${r.quality}%`;
    else if (r) cap = `${r.missingRequired.length} to go · ${r.quality}%`;
    else cap = 'wrapped';
    setText($('actionCap'), cap);

    // Crew bar
    for (const c of st.crew) {
      const v = view.cb[c.id];
      const cs = S.crewStatus(st, c);
      const asking = !!lab && !!S.idleWork(st, c);
      v.dot.className = 'dotst ' + cs.state;
      v.el.classList.toggle('ask', asking);
      let tx = asking ? 'Waiting for orders' : cs.state === 'WORKING' ? cs.text + (cs.cross ? ' (half speed)' : '') : cs.text;
      if (!asking && cs.state !== 'WORKING' && /^Needs /.test(cs.text)) {
        const w = S.waitingOn(st, c);
        if (w && w.name) { tx = `Waits for ${w.name}`; v.el.title = `${c.name} waits for ${w.name} to ${w.depLabel.toLowerCase()}`; }
      }
      if (!asking && st.capture && cs.state !== 'WORKING') tx = 'Quiet on set. Rolling';
      setText(v.tx, tx);
      setW(v.bar, cs.state === 'WORKING' ? cs.pct : 0);
      v.man.hidden = !c.override || !!lab;
      v.el.classList.toggle('sel', selected === c.id);
    }
    document.body.classList.toggle('picking', !!selected);

    // Ribbon
    const rb = $('ribbon');
    let text = '', bad = false;
    if (toast && now < toast.until) { text = toast.text; bad = toast.bad; }
    else if (selected) { const c = st.crew.find(x => x.id === selected); text = lab ? `${c.name}: tap a green spot on the set or a ${c.dept} task icon.` : `${c.name} selected. Tap a ${c.dept} task icon or a spot on the set.`; }
    else if (now < tipUntil) text = lab ? 'Everyone waits for your orders. Tap a person, then tap where they should work.' : 'Your crew start on their own. Tap a person to give them a different job.';
    else if (st.capture) text = `Rolling on ${st.shots[st.capture.shot].name}. Quiet on set. The stage clears after the cut.`;
    else if (lab && !(r && r.ready) && S.nextStep(st)) text = `Next: ${nextLine(S.nextStep(st))}.`;
    else if (r && r.ready) text = r.missingOptional.length ? `Ready! Call ACTION now, or wait for ${r.missingOptional.map(x => x.label.toLowerCase()).join(', ')}.` : 'Ready! Everything is done. Call ACTION.';
    else if (r) text = `${st.shots[cand].name} needs: ${r.missingRequired.map(x => x.label.toLowerCase()).join(', ')}.`;
    else text = "That's a wrap.";
    rb.classList.toggle('bad', bad);
    setText($('ribbonText'), text);
    const sc = selected && st.crew.find(x => x.id === selected);
    $('autoBtn').hidden = !!lab || !(sc && sc.override);

    renderShotCard(cand);
    if (isLand()) renderLandHud(t, cand, r);
  }

  // Time of day for the landscape HUD: shoot seconds scaled so the wrap time is DAY_HOURS after call
  function dayTime(t) {
    const mins = Math.round(CALL_HOUR * 60 + (t / LEVEL.timeLimit) * DAY_HOURS * 60);
    const h24 = Math.floor(mins / 60) % 24, m = mins % 60;
    return `${((h24 + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
  }
  // Stars the shoot is on track for right now, by the same rules as the wrap report
  function projectedStars(t) {
    const shots = Object.values(st.shots);
    const qs = shots.map(s => s.captured ? s.quality : S.readiness(st, s.id).quality);
    const avg = qs.reduce((a, q) => a + q, 0) / qs.length;
    return 1 + (t <= LEVEL.timeLimit ? 1 : 0) + (avg >= LEVEL.qualityTarget && st.budget >= 0 ? 1 : 0);
  }
  const STAR = (on) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.5.8-4.8 4.5 1.2 6.5L12 17.2l-5.8 3.2 1.2-6.5L2.6 9.4l6.5-.8z" fill="${on ? '#F2B630' : 'none'}" stroke="${on ? '#B5781A' : '#F2E9D8'}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

  function renderLandHud(t, cand, r) {
    const spent = LEVEL.budget - st.budget;
    setText($('hudBudget'), money(st.budget));
    $('hudBudget').classList.toggle('neg', st.budget < 0);
    setW($('budgetFill'), st.budget / LEVEL.budget);
    setText($('hudSpend'), money(spent));
    setW($('spendFill'), spent / LEVEL.budget);
    setText($('clock'), dayTime(t));
    const hours = (t / LEVEL.timeLimit) * DAY_HOURS;
    const segKey = Math.floor(hours) + (t > LEVEL.timeLimit ? 'ot' : '');
    if (view.segKey !== segKey) {
      view.segKey = segKey;
      $('hudTime').classList.toggle('ot', t > LEVEL.timeLimit);
      [...$('timeSegs').children].forEach((el, i) => el.classList.toggle('on', i < Math.floor(hours)));
    }
    const stars = st.over ? S.score(st).stars : projectedStars(t);
    if (view.stars !== stars) { view.stars = stars; $('hudStars').innerHTML = [0, 1, 2].map(i => STAR(i < stars)).join(''); $('hudStars').setAttribute('aria-label', `On track for ${stars} of 3 stars`); }
    const done = Object.values(st.shots).filter(s => s.captured).length;
    setText($('shotNum'), `${done} / 3`);
    if (cand) {
      const rr = S.readiness(st, cand);
      setText($('shotsNow'), `${st.shots[cand].name} · ${rr.done}/${rr.total}`);
      setW($('shotsNowBar'), rr.done / rr.total);
    } else { setText($('shotsNow'), 'All in the can'); setW($('shotsNowBar'), 1); }

    // Set conditions: how far each department is on the shot that is up next
    const shot = cand && st.shots[cand];
    const condKey = shot ? cand + COND.map(([d]) => {
      const ts = shot.taskIds.map(id => st.tasks[id]).filter(x => x.dept === d);
      if (!ts.length) return 'n';
      return Math.round(100 * ts.reduce((a, x) => a + (x.done ? 1 : x.progress / x.need), 0) / ts.length);
    }).join(',') : 'wrap';
    if (view.condKey !== condKey) {
      view.condKey = condKey;
      const pcts = condKey === 'wrap' ? [] : condKey.slice(cand.length).split(',');
      $('conds').innerHTML = shot ? COND.map(([d, label], i) => {
        const p = pcts[i];
        if (p === 'n') return '';
        const n = +p;
        const state = n >= 100 ? 'ok' : n > 0 ? 'part' : 'none';
        return `<li class="${state}" style="--p:${(n / 100).toFixed(2)}"><i></i><span>${label}${n > 0 && n < 100 ? ` ${n}%` : ''}</span></li>`;
      }).join('') : '<li class="ok"><i></i><span>Everything in the can</span></li>';
      $('board').innerHTML = shot ? `<span class="tape"></span>${A.propSVG(cand)}` : '';
    }
  }

  function iconKey(t) { return t.id === 'keylight.fix' ? 'fix' : t.dept; }

  // Landscape shot list row, as in the concept: polaroid, status, name, progress. Only the shot that is up next
  // shows its task icons, the others stay one line so the list fits a phone held sideways.
  function landShotRow(id, i, cand) {
    const s = st.shots[id];
    const up = !s.captured && cand === id;
    const canMove = !s.captured && st.stageShot !== id && i > 0 && !st.shots[st.priority[i - 1]].captured && st.stageShot !== st.priority[i - 1] && !(st.capture && st.capture.shot === st.priority[i - 1]);
    const mDone = A.shotMark('done'), mPend = A.shotMark('pending');
    const mark = s.captured ? (mDone ? `<span class="sk done art">${mDone}</span>` : '<span class="sk done">✓</span>')
      : up ? '<span class="sk up">▶</span>' : (mPend ? `<span class="sk art">${mPend}</span>` : '<span class="sk"></span>');
    const status = s.captured ? `<small class="ss done">Complete · ${s.quality}%</small>`
      : up ? `<small class="ss up">${st.capture && st.capture.shot === id ? 'Rolling' : 'In progress'}</small><span class="sbar"><i id="shotProg"></i></span>`
      : `<small class="ss">Pending${canMove ? ` <button class="mvup" type="button" data-move="${id}">shoot earlier</button>` : ''}</small>`;
    const icons = up ? `<span class="icons">${s.taskIds.map(tid => {
        const t = st.tasks[tid];
        return `<button class="ti dept-${t.dept}${t.optional ? ' optl' : ''}" type="button" data-task="${tid}" aria-label="${esc(t.label)}">${A.deptIcon(iconKey(t))}<i class="bd"></i></button>`;
      }).join('')}</span>` : '';
    return `<div class="lrow${s.captured ? ' done' : ''}${up ? ' up' : ''}">${thumb(id, 'lthumb')}${mark}
      <div class="lmain"><b>${String(i + 1).padStart(2, '0')} ${esc(s.name)}</b>${status}</div>${icons}</div>`;
  }

  function renderShotCard(cand) {
    const rowsKey = st.priority.map(id => id + (st.shots[id].captured ? 'c' + st.shots[id].quality : '') + (st.stageShot === id ? 's' : '') + st.shots[id].taskIds.length).join() + '|' + cand;
    if (rowsKey !== view.rowsKey) {
      view.rowsKey = rowsKey;
      const landRows = isLand();
      $('shotcard').innerHTML = st.priority.map((id, i) => {
        const s = st.shots[id];
        if (landRows) return landShotRow(id, i, cand);
        const canMove = !s.captured && st.stageShot !== id && i > 0 && !st.shots[st.priority[i - 1]].captured && st.stageShot !== st.priority[i - 1] && !(st.capture && st.capture.shot === st.priority[i - 1]);
        const cls = s.captured ? 'done' : (cand === id ? 'stage' : '');
        const right = s.captured
          ? `<span class="stamp-q">${s.quality}%</span>`
          : `<span class="icons">${s.taskIds.map(tid => {
              const t = st.tasks[tid];
              return `<button class="ti dept-${t.dept}${t.optional ? ' optl' : ''}" type="button" data-task="${tid}" aria-label="${esc(t.label)}">${A.deptIcon(iconKey(t))}<i class="bd"></i></button>`;
            }).join('')}</span>`;
        return `<div class="srow ${cls}"><span class="sg">${s.captured ? '✓' : i + 1}</span>
          <span class="sn">${thumb(id, 'sthumb')}${esc(s.name)}${canMove ? ` <button class="mvup" type="button" data-move="${id}">shoot earlier</button>` : ''}</span>${right}</div>`;
      }).join('');
      view.icons = {};
      document.querySelectorAll('#shotcard [data-task]').forEach(el => { view.icons[el.dataset.task] = el; });
    }
    const sp = $('shotProg');
    if (sp && cand) { const rr = S.readiness(st, cand); setW(sp, st.capture && st.capture.shot === cand ? 1 - st.capture.left / st.capture.total : rr.done / rr.total); }
    for (const id in view.icons) {
      const el = view.icons[id];
      const t = st.tasks[id];
      const ts = S.taskStatus(st, id);
      const p = ts.fresh != null ? 1 : ts.pct;
      const v = p.toFixed(3);
      if (el._p !== v) { el._p = v; el.style.setProperty('--p', v); }
      // While someone is picked, other departments' icons fade: on the Burger Job they can only take their own
      const sc = selected && st.crew.find(x => x.id === selected);
      const other = !!(sc && LEVEL.departmentsOnly && sc.dept !== t.dept);
      const cls = `ti dept-${t.dept}${t.optional ? ' optl' : ''} ${ts.state}${ts.fresh != null ? ' fresh' : ''}${other ? ' other' : ''}`;
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
      if (o.kind === 'task') return `${esc(o.who)} fixes it, about ${o.secs}s. Free.` + (o.perk ? ' <strong>Spare bulb in the truck!</strong>' : '');
      if (o.kind === 'wait') return o.owned ? `Free from your gear cage. Up in ${o.secs}s. <strong>Owned!</strong>` : `${money(o.cost)}. Arrives in ${o.secs}s. Nobody stops working.`;
      return `No wait, no cost. This shot loses ${o.penalty} quality.`;
    };
    openModal('chaos', `
      <div class="chaos-h"><span class="bang">!</span><b>Chaos!</b></div>
      <p class="chaos-t">${esc(ev.title)}</p>
      <p class="note">Re-aiming the lights and framing the macro are on hold until it's sorted.</p>
      ${opts.map(o => `<button class="opt" type="button" data-choose="${o.id}">${A.ICON[o.id] || ''}<b>${esc(o.label)}</b><span>${line(o)}</span></button>`).join('')}`);
  }

  function showPause() {
    st.paused = true;
    openModal('pause', `
      <span class="label">Paused</span>
      <p>${S.fmtTime(S.seconds(st))} on the clock. ${Object.values(st.shots).filter(s => s.captured).length} of 3 shots in the can.</p>
      <div class="seg" role="group" aria-label="Game speed">
        <button type="button" data-speed="1" aria-pressed="${speed === 1}">1x</button>
        <button type="button" data-speed="2" aria-pressed="${speed === 2}">2x</button>
      </div>
      <button class="btn go" type="button" data-resume>Back to set</button>
      ${document.body.classList.contains('rot') ? `<p class="note">Your phone is upright, so the shoot is turned sideways for you. <button class="btn small" type="button" data-rotflip>Upside down? Flip it</button></p>` : ''}
      <div class="row2"><button class="btn" type="button" data-again>Restart shoot</button><button class="btn" type="button" data-quit>Quit to office</button></div>`);
  }

  function showWrap() {
    if (lab) { showLabWrap(); return; } // lab runs measure the layout and never touch the bank
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
      return `<span><b>${esc(c.name)}</b> turned out ${speedWord(c.speed)} and ${relWord(c.reliability)}${flubs ? `, botched ${flubs} task${flubs > 1 ? 's' : ''}` : ''}.</span>`;
    });
    const flubsAll = st.log.filter(e => e.type === 'flub').length;
    const nextRoom = CO.rooms.filter(r => !save.owned.includes(r.id)).sort((a, b) => a.cost - b.cost)[0];
    const roomNote = nextRoom ? (save.bank >= nextRoom.cost ? `You can afford the ${nextRoom.name} now.` : `${money(nextRoom.cost - save.bank)} more for the ${nextRoom.name}.`) : 'Every room is built.';
    openModal('wrap', `
      <div class="chaos-h" style="background:var(--slate)"><b>${pulled ? 'Plug pulled' : 'Wrap report'}</b></div>
      <div class="stars" role="img" aria-label="${sc.stars} of 3 stars">${starsRow(sc.stars)}</div>
      <div class="report">
        ${ck(sc.allShots)}<span>Shots completed</span><b>${sc.shotsDone}/${sc.shotsTotal}</b>
        ${ck(sc.onTime)}<span>Time (wrap by ${S.fmtTime(LEVEL.timeLimit)})</span><b>${S.fmtTime(sc.time)}</b>
        ${ck(sc.quality)}<span>Quality (need ${LEVEL.qualityTarget}%)</span><b>${sc.avgQuality}%</b>
        ${ck(sc.inBudget)}<span>Profit to the bank</span><b>${money(sc.profit)}</b>
      </div>
      <p class="note">Crew ${money(sc.crewCost)} · Rentals ${money(sc.extraCost)} · Overtime ${money(sc.overtimeCost)}${flubsAll ? ` · ${flubsAll} botched task${flubsAll > 1 ? 's' : ''}` : ''}</p>
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
    if (t.closest('[data-lab]') || t.closest('[data-labback]')) { showLab(); return; }
    if (t.closest('[data-labstart]')) { startLab(t.closest('[data-labstart]').dataset.labstart); return; }
    if (t.closest('[data-rotflip]')) { labFlip = !labFlip; syncRot(); fitWideSet(); return; }
    if (t.closest('[data-labflip]')) { labFlip = !labFlip; showLab(); say(labFlip ? 'Rotating the other way' : 'Rotating the default way'); return; }
    if (t.closest('[data-book]')) { showBrief(); return; }
    if (t.closest('[data-hire-screen]')) { closeModal(); renderHire(); show('hire'); return; }
    if (t.closest('[data-officemenu]')) { showOfficeMenu(); return; }
    if (t.closest('[data-rename]')) { showRename(); return; }
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
    if (t.closest('[data-speed]')) {
      speed = +t.closest('[data-speed]').dataset.speed;
      document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.speed === speed)));
      return;
    }
    if (t.closest('[data-resume]')) { st.paused = false; closeModal(); return; }
    if (t.closest('[data-again]')) { if (lab) startLab(lab.layout); else startShoot(); return; }
    if (t.closest('[data-quit]')) { closeModal(); renderOffice(); show('office'); return; }

    if (screen !== 'shoot' || !st || modal) return;
    if (lab && !t.closest('#pauseBtn')) {
      labTap(t.closest('#actionBtn') ? 'action' : t.closest('.cb') ? 'bar' : t.closest('.pup') ? 'puppet' : t.closest('[data-station]') ? 'station' : t.closest('[data-task]') ? 'icon' : t.closest('button') ? 'other' : 'empty');
    }
    if (t.closest('#pauseBtn')) { showPause(); return; }
    // Landscape shot list pop-up: the tab opens and closes it, a tap anywhere outside it closes it
    const pop = $('shotsPop');
    if (pop) {
      if (t.closest('#shotsTab')) { setShots(pop.hidden); return; }
      if (t.closest('[data-shotsclose]')) { setShots(false); return; }
      if (!pop.hidden && !t.closest('#shotsPop')) setShots(false);
    }
    if (t.closest('#actionBtn')) { pressAction(); return; }
    if (t.closest('#autoBtn')) { const r = S.command(st, { type: 'release', crew: selected }); say(r.message); selected = null; return; }
    if (t.closest('[data-stclose]')) { view.stCard = null; return; }
    if (t.closest('#stcard')) return;
    const crew = t.closest('[data-crew]');
    if (crew) { view.stCard = null; selectCrew(crew.dataset.crew, crew.classList.contains('cb') ? 'bar' : 'set'); return; }
    const task = t.closest('[data-task]');
    if (task) { assignTo(task.dataset.task); return; }
    const stn = t.closest('[data-station]');
    if (stn) { assignStation(stn.dataset.station); return; }
    const mv = t.closest('[data-move]');
    if (mv) { const r = S.command(st, { type: 'move', shot: mv.dataset.move, dir: -1 }); say(r.message, !r.ok); return; }
    // Tapping empty space deselects and closes the station card
    if (t.closest('#setWrap') || !t.closest('button')) { selected = null; view.stCard = null; }
  });

  window.addEventListener('resize', () => { syncRot(); fitWideSet(); });
  window.addEventListener('orientationchange', syncRot);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === 'shoot' && st && !st.over && !modal) showPause();
  });

  /* ================= Loop ================= */

  function frame(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (screen === 'shoot' && st) {
      if (!modal) {
        const before = st.capture && st.capture.shot;
        S.advance(st, dt * speed);
        if (lab) labTick();
        if (before && !st.capture) {
          lastCapture = before;
          if (!st.over) {
            const n = S.nextStep(st);
            say(`${st.shots[before].name} is in the can. Stage is clear` + (n ? `. Next: ${nextLine(n)}.` : '.'), false, 5000);
          }
        }
        if (st.pending) showChaos();
        else if (st.over) showWrap();
      }
      renderSet(now);
      renderHud(now);
      renderStationCard();
    }
    requestAnimationFrame(frame);
  }

  $('defs').innerHTML = A.globalDefs();
  resetView();
  renderTitle();
  show('title');
  requestAnimationFrame(frame);
})();
