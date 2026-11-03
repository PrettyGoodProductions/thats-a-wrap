/*
  Hybrid asset loader. Real art is used wherever a file was delivered, and the code-drawn placeholder stays
  everywhere else. Nothing here knows about specific art: files, pivots and scales come from the art pack
  (built from art/ by tools/pack-art.mjs), and where a piece attaches comes from src/slots.js.

  Rules that keep it cheap and safe:
    - A slot with no art returns its placeholder markup untouched, so a game with an empty art/ folder
      draws exactly what it drew before the loader existed.
    - Every image is defined once in the global defs and drawn with <use>, so a crew of four never repeats a
      base64 string. Pivot and scale are baked into that one definition.
    - Changing state (key light off/on/dead, a puppet's idle/work pose) only toggles display on elements that
      already exist. Nothing is rebuilt per frame, and the simulation stays the only source of truth.
*/
(function (root) {
  'use strict';
  const slotsApi = (typeof require === 'function' && typeof module === 'object') ? require('./slots.js') : root.WrapSlots;
  const SLOTS = slotsApi.SLOTS;
  const PUPPET = slotsApi.PUPPET;

  const PIVOT_NAMES = {
    'top-left': [0, 0], 'top-center': [0.5, 0], 'top-right': [1, 0],
    'center-left': [0, 0.5], 'center': [0.5, 0.5], 'center-right': [1, 0.5],
    'bottom-left': [0, 1], 'bottom-center': [0.5, 1], 'bottom-right': [1, 1],
  };
  const DEFAULT_RASTER_SCALE = 3; // the manifest asks for PNGs at 3x
  const EMPTY = { version: 1, pieces: {} };

  let pack = null;
  const slotEls = {};
  const tints = new Set();

  const getPack = () => pack || (pack = root.WrapArtPack || EMPTY);
  const f = (n) => (Math.round(n * 100) / 100).toString();
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const keyFor = (id, state) => 'wl-' + id.replace(/[^a-z0-9]+/gi, '-') + '--' + state;

  function configure(next) {
    pack = next || EMPTY;
    for (const k of Object.keys(slotEls)) delete slotEls[k];
    tints.clear();
  }

  function statesOf(id) {
    const piece = getPack().pieces[id];
    return piece ? Object.keys(piece.states).sort() : [];
  }

  function has(id, state) {
    const piece = getPack().pieces[id];
    if (!piece) return false;
    return state === undefined ? Object.keys(piece.states).length > 0 : !!piece.states[state];
  }

  /*
    Turn one delivered image plus its settings into placement numbers, all in set units.
    Settings (per piece, with optional per-state overrides under "states"):
      pivot   [x, y] in the image's own pixels, or a name like "bottom-center"
      scale   image pixels per set unit            (wins over everything)
      size    [width, height] the image should be in set units (width decides the scale)
      offset  [x, y] nudge in set units, added to the slot anchor
      shadow  true or false, the soft paper shadow under the piece
      tint    "skin", "dept", "hair", a #hex color, or false for none
    With no scale or size the file name decides (@3x), then 3 for PNG/WEBP and 1 for SVG.
  */
  function resolve(id, state) {
    const piece = getPack().pieces[id];
    const img = piece && piece.states[state];
    if (!img) return null;
    const slot = SLOTS[id] || {};
    const base = piece.settings || {};
    const cfg = Object.assign({}, base, (base.states && base.states[state]) || {});

    let scale;
    if (isNum(cfg.scale) && cfg.scale > 0) scale = cfg.scale;
    else if (Array.isArray(cfg.size) && isNum(cfg.size[0]) && cfg.size[0] > 0) scale = img.w / cfg.size[0];
    else if (Array.isArray(cfg.size) && isNum(cfg.size[1]) && cfg.size[1] > 0) scale = img.h / cfg.size[1];
    else scale = img.scaleHint || (img.format === 'svg' ? 1 : DEFAULT_RASTER_SCALE);

    let pv = cfg.pivot !== undefined ? cfg.pivot : slot.pivot !== undefined ? slot.pivot : 'center';
    if (typeof pv === 'string') { const n = PIVOT_NAMES[pv] || PIVOT_NAMES.center; pv = [n[0] * img.w, n[1] * img.h]; }
    const off = Array.isArray(cfg.offset) ? cfg.offset : [0, 0];
    const shadow = cfg.shadow !== undefined ? !!cfg.shadow && cfg.shadow !== 'none' : !!slot.shadow;
    const tint = cfg.tint !== undefined ? (cfg.tint || null) : (slot.tint || null);

    return {
      id, state, key: keyFor(id, state), src: img.src, format: img.format,
      imgW: img.w, imgH: img.h, scale,
      w: img.w / scale, h: img.h / scale, px: pv[0] / scale, py: pv[1] / scale,
      ox: off[0] || 0, oy: off[1] || 0, shadow, tint, pivotPx: pv,
    };
  }

  /* ---------- Tinting (skin tone, department color) ---------- */

  function normColor(c) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim());
    if (!m) return null;
    let h = m[1].toLowerCase();
    if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
    return '#' + h;
  }
  const tintMarkup = (hex) =>
    `<filter id="wl-tint-${hex.slice(1)}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">` +
    `<feFlood flood-color="${hex}" result="c"/><feBlend in="SourceGraphic" in2="c" mode="multiply" result="m"/>` +
    `<feComposite in="m" in2="SourceGraphic" operator="in"/></filter>`;

  // A neutral light image times a color is how one part serves every skin tone and department.
  function tintRef(color) {
    const hex = normColor(color);
    if (!hex) return '';
    if (!tints.has(hex)) {
      tints.add(hex);
      const host = typeof document !== 'undefined' && document.getElementById('wl-defs');
      if (host) host.insertAdjacentHTML('beforeend', tintMarkup(hex));
    }
    return `url(#wl-tint-${hex.slice(1)})`;
  }

  /* ---------- Markup ---------- */

  // Image definitions for the global defs. Called once at boot.
  function defs() {
    const p = getPack();
    let out = '';
    for (const id of Object.keys(p.pieces)) {
      for (const st of Object.keys(p.pieces[id].states)) {
        const r = resolve(id, st);
        out += `<image id="${r.key}" x="${f(-r.px)}" y="${f(-r.py)}" width="${f(r.w)}" height="${f(r.h)}" preserveAspectRatio="none" href="${r.src}"/>`;
      }
    }
    return `<defs id="wl-defs">${out}${[...tints].map(tintMarkup).join('')}</defs>`;
  }

  // One <use> for one state. `k` converts set units to the parent's units (a scaled parent group).
  function useEl(id, state, anchor, visible, o) {
    const r = resolve(id, state);
    if (!r) return '';
    o = o || {};
    const k = o.k || 1;
    const x = anchor.x + r.ox * k;
    const y = anchor.y + r.oy * k;
    let tf = `translate(${f(x)} ${f(y)})`;
    if (k !== 1) tf += ` scale(${f(k)})`;
    let filter = '';
    const t = o.tint !== undefined ? o.tint : r.tint;
    if (t && o.tintColor) { const ref = tintRef(o.tintColor); if (ref) filter = ` filter="${ref}"`; }
    else if (r.shadow) filter = ' filter="url(#shadow)"';
    return `<use data-st="${state}" href="#${r.key}" transform="${tf}"${filter}${visible === false ? ' display="none"' : ''}/>`;
  }

  /*
    Wrap a placeholder so delivered art can replace it. With no art for the slot the placeholder comes back
    exactly as given. With art, both live in one group: the placeholder is hidden unless the requested state
    has no image (and no "default" to fall back on), in which case the placeholder shows through.
  */
  function slot(id, placeholder, opts) {
    const def = SLOTS[id];
    const states = statesOf(id);
    if (!def || !states.length) return placeholder;
    const want = (opts && opts.state) || def.initial || 'default';
    const show = states.includes(want) ? want : states.includes('default') ? 'default' : null;
    const kids = states.map(st => useEl(id, st, def.anchor, st === show)).join('');
    return `<g data-slot="${id}"><g class="wl-ph" display="${show ? 'none' : 'inline'}">${placeholder}</g>${kids}</g>`;
  }

  // A single delivered image at a spot of the caller's choosing, or '' when there is none.
  // Used for things the slot wrapper does not fit, like the burger stack layers.
  function use(id, state, o) {
    if (!has(id, state)) return '';
    o = o || {};
    const def = SLOTS[id] || {};
    const anchor = { x: o.x !== undefined ? o.x : def.anchor.x, y: o.y !== undefined ? o.y : def.anchor.y };
    return useEl(id, state, anchor, true, o);
  }

  /* ---------- Runtime state (display toggles only) ---------- */

  function findSlot(id) {
    const cached = slotEls[id];
    if (cached && cached.isConnected !== false) return cached;
    if (typeof document === 'undefined') return null;
    return (slotEls[id] = document.querySelector(`[data-slot="${id}"]`));
  }

  // Show the child for `state`, else its "default", else fall back to the placeholder.
  function state(target, st) {
    const el = typeof target === 'string' ? findSlot(target) : target;
    if (!el || el._wlState === st) return;
    el._wlState = st;
    const kids = Array.from(el.children);
    let hit = null;
    let def = null;
    for (const k of kids) {
      const s = k.getAttribute('data-st');
      if (s === st) hit = k;
      else if (s === 'default') def = k;
    }
    hit = hit || def;
    for (const k of kids) {
      if (k.getAttribute('data-st') !== null) k.setAttribute('display', k === hit ? 'inline' : 'none');
      else if (k.getAttribute('class') === 'wl-ph') k.setAttribute('display', hit ? 'none' : 'inline');
    }
  }

  // Put a whole puppet in a pose. Parts without art for that pose keep their default look.
  function pose(rootEl, name) {
    if (!rootEl || rootEl._wlPose === name) return;
    rootEl._wlPose = name;
    for (const part of rootEl.querySelectorAll('.wl-pose')) { part._wlState = undefined; state(part, name); }
  }

  /* ---------- Modular puppet ---------- */

  const puppetMissing = () => PUPPET.required.filter(id => !has(id));
  const puppetReady = () => puppetMissing().length === 0;

  /*
    Build a crew puppet from delivered parts. `o`: { skin, hair, body, top, face: ['glasses', ...] }.
    Returns null unless every required part has art, so a half-delivered puppet never replaces the
    complete code-drawn one.
  */
  function puppet(o) {
    if (!puppetReady()) return null;
    o = o || {};
    const tintOf = (id, st) => {
      const t = (resolve(id, st) || {}).tint;
      return t === 'skin' ? o.skin : t === 'dept' ? o.body : t === 'hair' ? o.hair : normColor(t) ? t : null;
    };
    const posed = (id, cls) => {
      const states = statesOf(id);
      if (!states.length) return '';
      const show = states.includes('idle') ? 'idle' : states.includes('default') ? 'default' : states[0];
      const inner = states.map(st => useEl(id, st, SLOTS[id].anchor, st === show, { tintColor: tintOf(id, st) })).join('');
      return `<g class="wl-pose${cls ? ' ' + cls : ''}" data-part="${id}">${inner}</g>`;
    };
    const variant = (id, st) => has(id, st) ? useEl(id, st, SLOTS[id].anchor, true, { tintColor: tintOf(id, st) }) : '';

    const wantFace = new Set(['eyes', 'nose'].concat(o.face || []));
    const face = PUPPET.faceOrder.filter(n => wantFace.has(n)).map(n => variant('crew.face', n)).join('');
    const hair = has('crew.hair', o.top || 'default') ? variant('crew.hair', o.top || 'default') : variant('crew.hair', 'default');

    return `<ellipse cx="0" cy="0" rx="12" ry="3.2" fill="#000" opacity=".2"/>` +
      `<g class="bodyg">` +
      posed('crew.leg-back') + posed('crew.leg-front') + posed('crew.arm-back') + posed('crew.torso') + posed('crew.head') +
      face + hair + posed('crew.arm-front', 'arm') +
      `</g>`;
  }

  /* ---------- Reporting ---------- */

  function report() {
    const p = getPack();
    const slots = {};
    for (const id of Object.keys(p.pieces)) slots[id] = { states: statesOf(id), wired: !!SLOTS[id] };
    return { pieces: slots, puppet: { ready: puppetReady(), missing: puppetMissing() } };
  }

  const slotDef = (id) => SLOTS[id];

  const api = { configure, has, statesOf, resolve, defs, slot, slotDef, use, state, pose, puppet, puppetReady, puppetMissing, report, tintRef, normColor, PIVOT_NAMES, DEFAULT_RASTER_SCALE };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapLoader = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
