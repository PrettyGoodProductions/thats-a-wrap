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
  const { SLOTS, PUPPET, RIG, CHARACTERS, ROLES, RIG_ORDER, CHARACTER_REQUIRED } = slotsApi;

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

  /* ---------- Fixed characters (crew.<character>.<part>) ---------- */

  // 'crew.ro.head' -> { char: 'ro', role: 'head' }, or null for anything that is not a character part
  function charPart(id) {
    const m = /^crew\.([a-z0-9]+)\.([a-z0-9-]+)$/.exec(id || '');
    return m && CHARACTERS[m[1]] && ROLES[m[2]] ? { char: m[1], role: m[2] } : null;
  }
  // Character-level settings (art/crew.<character>.json): scale, tint, joints, portrait
  const charCfg = (ch) => (getPack().characters || {})[ch] || {};
  const jointOf = (ch, name) => {
    const j = (charCfg(ch).joints || {})[name];
    return Array.isArray(j) && isNum(j[0]) && isNum(j[1]) ? { x: j[0], y: j[1] } : RIG[name];
  };
  // Where a piece attaches. Character parts hang from their character's joints, everything else from the slot table.
  function slotOf(id) {
    if (SLOTS[id]) return SLOTS[id];
    const cp = charPart(id);
    if (!cp) return undefined;
    const r = ROLES[cp.role];
    return { anchor: jointOf(cp.char, r.joint), pivot: r.pivot, size: r.size, shadow: false, initial: 'default', character: cp.char, role: cp.role };
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
      flip    true mirrors the image left to right about its pivot
    With no scale or size the file name decides (@3x), then 3 for PNG/WEBP and 1 for SVG.
  */
  function resolve(id, state) {
    const piece = getPack().pieces[id];
    const img = piece && piece.states[state];
    if (!img) return null;
    const slot = slotOf(id) || {};
    const base = piece.settings || {};
    // A character's own file sets the defaults for all its parts (scale, tint), the part's file refines them
    const cp = charPart(id);
    const cc = cp ? charCfg(cp.char) : {};
    const inherit = {};
    for (const k of ['scale', 'tint', 'shadow']) if (cc[k] !== undefined) inherit[k] = cc[k];
    if (cp && cc.fixed !== false && inherit.tint === undefined) inherit.tint = false;
    const cfg = Object.assign({}, inherit, base, (base.states && base.states[state]) || {});

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
      ox: off[0] || 0, oy: off[1] || 0, shadow, tint, pivotPx: pv, flip: !!cfg.flip,
      // sole: points along the bottom of a boot (image px), turned into units around the pivot (for the walk)
      points: cfg.points && typeof cfg.points === 'object' ? cfg.points : {},
      nine: cfg.nine && Array.isArray(cfg.nine.slice) ? cfg.nine : null,
      sole: Array.isArray(cfg.sole) ? cfg.sole.map(([x, y]) => [(x - pv[0]) / scale, (y - pv[1]) / scale]) : null,
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
    // flip mirrors left to right about the pivot, so art drawn facing the wrong way needs no new export
    if (k !== 1 || r.flip) tf += r.flip ? ` scale(${f(-k)} ${f(k)})` : ` scale(${f(k)})`;
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
    const def = slotOf(id);
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
    const def = slotOf(id) || {};
    const anchor = { x: o.x !== undefined ? o.x : def.anchor.x, y: o.y !== undefined ? o.y : def.anchor.y };
    return useEl(id, state, anchor, true, o);
  }

  // Tint every image of a slot with a color (multiply), for art delivered in neutral paper that the game colors per
  // shot, like the sweep. Pass null to clear. Cheap: sets one attribute, and only when the color changed.
  // Nine-slice frame for HUD pieces drawn with CSS border-image. Returns { src, slice, width, fill }: slice in image px
  // (top, right, bottom, left), width in CSS px, or null when the piece has no art or no slice in its settings.
  function nine(id, state) {
    const r = resolve(id, state || 'default');
    if (!r || !r.nine) return null;
    return { src: r.src, slice: r.nine.slice, width: r.nine.width || r.nine.slice.map(v => v / (r.scale || 1)), fill: r.nine.fill !== false };
  }

  function tint(target, color) {
    const el = typeof target === 'string' ? findSlot(target) : target;
    if (!el || el._wlTint === (color || null)) return;
    el._wlTint = color || null;
    const ref = color ? tintRef(color) : '';
    for (const k of el.children) if (k.getAttribute('data-st') !== null) { if (ref) k.setAttribute('filter', ref); else k.removeAttribute('filter'); }
  }

  /*
    A named spot on a delivered piece, in the parent's coordinates (set units on the set): for example where the
    hero prop sits on the platform's lid. null when the piece has no art or no such point, so callers keep their
    placeholder position.
  */
  function point(id, name, state) {
    const def = slotOf(id);
    const st = state || (def && def.initial) || 'default';
    const r = resolve(id, has(id, st) ? st : statesOf(id)[0]);
    if (!def || !r || !r.points[name]) return null;
    const [px, py] = r.points[name];
    const dx = (px - r.pivotPx[0]) / r.scale, dy = (py - r.pivotPx[1]) / r.scale;
    return { x: def.anchor.x + r.ox + (r.flip ? -dx : dx), y: def.anchor.y + r.oy + dy };
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

  /* ---------- Fixed character puppet ---------- */

  const characterMissing = (ch) => CHARACTER_REQUIRED.map(r => `crew.${ch}.${r}`).filter(id => !has(id));
  const characterReady = (ch) => !!CHARACTERS[ch] && characterMissing(ch).length === 0;

  // Which delivered character plays this crew member: an explicit `character`, else the name. null means
  // the generic puppet (or the code-drawn one) is used.
  function characterFor(c) {
    if (!c) return null;
    const key = String(c.character || c.name || '').toLowerCase();
    return CHARACTERS[key] && characterReady(key) ? key : null;
  }

  // Head crop for the hire cards and the crew bar, in puppet units: [x, y, width, height]
  function portraitOf(ch) {
    const p = charCfg(ch).portrait;
    return Array.isArray(p) && p.length === 4 && p.every(isNum) ? p : null;
  }

  /*
    The art is the whole character: no tint, no face overlays, no hair swap. Parts hang from the character's
    joints and each is wrapped in a group whose transform-origin is its joint, so the shared animations
    (walk, work, lean) rotate every character about the right point. The upper body is one group so a lean
    carries the head and both arms with it.
  */
  function characterPuppet(ch) {
    const part = (role) => {
      const id = `crew.${ch}.${role}`;
      const states = statesOf(id);
      if (!states.length) return '';
      const def = slotOf(id);
      const show = states.includes('idle') ? 'idle' : states.includes('default') ? 'default' : states[0];
      const inner = states.map(st => useEl(id, st, def.anchor, st === show)).join('');
      const so = role.startsWith('leg-') && (resolve(id, show) || {}).sole;
      const soleAttr = so ? ` data-sole="${so.map(([x, y]) => f(x) + ',' + f(y)).join(' ')}"` : '';
      return `<g class="wl-pose wl-r-${role}" data-part="${id}"${soleAttr} style="transform-origin:${f(def.anchor.x)}px ${f(def.anchor.y)}px">${inner}</g>`;
    };
    const hips = jointOf(ch, 'hips');
    return `<ellipse cx="0" cy="0" rx="12" ry="3.2" fill="#000" opacity=".2"/>` +
      `<g class="bodyg wl-rig" data-character="${ch}" data-leg="${f(-jointOf(ch, 'hipFront').y)}">` +
      RIG_ORDER.legs.map(part).join('') +
      `<g class="wl-upper" style="transform-origin:${f(hips.x)}px ${f(hips.y)}px">` + RIG_ORDER.upper.map(part).join('') + `</g>` +
      `</g>`;
  }

  /*
    Build a crew puppet from delivered parts. `o`: { skin, hair, body, top, face: ['glasses', ...] }.
    Returns null unless every required part has art, so a half-delivered puppet never replaces the
    complete code-drawn one.
  */
  function puppet(o) {
    o = o || {};
    if (o.character && characterReady(o.character)) return characterPuppet(o.character);
    if (!puppetReady()) return null;
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
    for (const id of Object.keys(p.pieces)) slots[id] = { states: statesOf(id), wired: !!slotOf(id) };
    const characters = {};
    for (const ch of Object.keys(CHARACTERS)) if (statesOfCharacter(ch)) characters[ch] = { ready: characterReady(ch), missing: characterMissing(ch) };
    return { pieces: slots, puppet: { ready: puppetReady(), missing: puppetMissing() }, characters };
  }

  const slotDef = (id) => slotOf(id);
  const statesOfCharacter = (ch) => CHARACTER_REQUIRED.concat(['arm-back']).some(r => has(`crew.${ch}.${r}`));

  const api = { configure, has, statesOf, resolve, defs, slot, slotDef, use, state, tint, nine, pose, puppet, point, puppetReady, puppetMissing, characterFor, characterReady, characterMissing, portraitOf, report, tintRef, normColor, PIVOT_NAMES, DEFAULT_RASTER_SCALE };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WrapLoader = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
