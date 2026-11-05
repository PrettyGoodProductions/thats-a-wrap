/*
  Placeholder art, drawn in code: crew puppets, props, the tabletop set and the production office.
  Everything returns SVG markup strings. Swap these for real paper-cut art later.
  Shared filters and patterns live once in globalDefs(), injected at boot.
*/
(function (root) {
  'use strict';
  const INK = '#22262B';
  const DEPT_COLOR = { grip: '#8EA3C2', lighting: '#E7B84F', camera: '#8FB1A3', art: '#E59380' };
  const HAND = `font-family="Permanent Marker, Marker Felt, cursive"`;
  const UI = `font-family="Atkinson Hyperlegible, system-ui, sans-serif"`;
  const S = (w) => `stroke="${INK}" stroke-width="${w || 1.5}" stroke-linejoin="round"`;

  function globalDefs() {
    return `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
      <!-- "cut": the soft drop shadow that lifts each paper piece off the one behind it. No surface texture or edge
           wobble here: texture belongs inside each asset's own art (the noise wobble also warped delivered art) -->
      <filter id="cut" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="1.3" dy="1.9" stdDeviation="0.8" flood-color="#2A1E12" flood-opacity=".38"/>
      </filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1.2" dy="1.6" stdDeviation="0.7" flood-color="#2A1E12" flood-opacity=".35"/>
      </filter>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <pattern id="corr" width="4" height="10" patternUnits="userSpaceOnUse"><rect width="4" height="10" fill="#C79A64"/><rect width="1.8" height="10" fill="#B5864D"/></pattern>
      <pattern id="corrDark" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#2E4664"/><rect width="2" height="10" fill="#29405C"/></pattern>
      <pattern id="mesh" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#5C6470"/><path d="M0 0 L7 7 M7 0 L0 7" stroke="#8D95A1" stroke-width=".9"/></pattern>
      <pattern id="brick" width="26" height="14" patternUnits="userSpaceOnUse"><rect width="26" height="14" fill="#D9785F"/><path d="M0 7 H26 M0 14 H26 M13 0 V7 M0 7 V14 M26 7 V14" stroke="#C4644D" stroke-width="1.2"/></pattern>
      <pattern id="tile" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#F2E9D8"/><path d="M0 0 H12 V12" fill="none" stroke="#D8CBB0" stroke-width="1"/></pattern>
      ${loader() ? loader().defs() : ''}
    </defs></svg>`;
  }

  /* ---------- Delivered art ----------
     WrapLoader (src/loader.js) swaps in real art wherever a file was delivered. slot() wraps a placeholder so
     the real image can replace it, and hands the placeholder back untouched when there is no art for it. */
  const loader = () => root.WrapLoader;
  const slot = (id, placeholder) => (loader() ? loader().slot(id, placeholder) : placeholder);

  /* ---------- Puppets (feet at 0,0, about 48 units tall) ---------- */

  function puppet(c) {
    const L = c.look || {};
    const skin = L.skin || '#E1B48E';
    const hair = L.hair || '#2A1D14';
    const body = c.color || DEPT_COLOR[c.dept] || '#ccc';
    // A delivered modular puppet replaces the code-drawn one only when all its required parts exist
    if (loader()) {
      // A fixed character (Ro) is its own art end to end, so no tint, hair or face extras go with it
      const ch = loader().characterFor(c);
      const real = ch ? loader().puppet({ character: ch }) : loader().puppet({ skin, hair, body, top: L.top, face: ['beard', 'mustache', 'glasses', 'earring'].filter(k => L[k]) });
      if (real) return real;
    }
    const s = `stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"`;
    const hairCap = `<path d="M-8.6 -35 q0 -10.5 8.6 -10.5 q8.6 0 8.6 10.5 q-2.5 -5 -8.6 -5 q-6.1 0 -8.6 5z" fill="${hair}" ${s}/>`;
    let top = '';
    switch (L.top) {
      case 'cap': top = `<path d="M-9 -37.5 q0 -9.5 9 -9.5 q9 0 9 9.5z" fill="#9AA6D6" ${s}/><path d="M3 -38.6 h10.5 q1.6 .3 0 2 h-10.5z" fill="#7F8BC0" ${s}/>`; break;
      case 'beanie': top = `<path d="M-9.2 -36.5 q0 -12 9.2 -12 q9.2 0 9.2 12z" fill="#E7B84F" ${s}/><rect x="-9.8" y="-38.8" width="19.6" height="4" rx="1.5" fill="#D29C2E" ${s}/>`; break;
      case 'bun': top = hairCap + `<circle cx="1" cy="-46.5" r="4.3" fill="${hair}" ${s}/>`; break;
      case 'beret': top = hairCap + `<ellipse cx="-1.5" cy="-43.5" rx="9.8" ry="3.8" fill="#D86B56" ${s}/><circle cx="-1" cy="-47.6" r="1.2" fill="${INK}"/>`; break;
      case 'slick': top = `<path d="M-8.8 -35 q-1 -12 9.5 -11 q8 1 8 10 q-6 -6 -17.5 1z" fill="${hair}" ${s}/>`; break;
      default: top = hairCap + `<path d="M-6 -44 l2 -4 l2 3 l2 -4 l2 3 l2 -4 l1 5" fill="${hair}" ${s}/>`;
    }
    const face =
      `<circle cx="-3" cy="-35" r="1.15" fill="${INK}"/><circle cx="3.2" cy="-35" r="1.15" fill="${INK}"/>` +
      (L.beard ? `<path d="M-7.6 -33.5 q0 10 7.6 10 q7.6 0 7.6 -10 q-3 3.4 -7.6 3.4 q-4.6 0 -7.6 -3.4z" fill="${hair}" ${s}/>` : '') +
      `<circle cx="1.6" cy="-32.2" r="2" fill="#D86B56" ${s} stroke-width=".8"/>` +
      (L.mustache ? `<path d="M-4.5 -30.2 q2.2 -2.2 4.5 0 q2.3 -2.2 4.5 0 q-2.2 1.8 -4.5 .6 q-2.3 1.2 -4.5 -.6z" fill="${hair}"/>` : '') +
      (L.glasses ? `<g fill="none" stroke="${INK}" stroke-width="1"><circle cx="-3.1" cy="-35.3" r="2.7"/><circle cx="3.3" cy="-35.3" r="2.7"/><path d="M-.4 -35.5h1"/></g>` : '') +
      (L.earring ? `<circle cx="-8.7" cy="-30.6" r="1.5" fill="#E7B84F" stroke="${INK}" stroke-width=".7"/>` : '');
    const tie = L.tie ? `<path d="M0 -26 l-1.6 2 l1.6 9 l1.6 -9z" fill="${L.tie}" stroke="${INK}" stroke-width=".7"/>` : '';
    const prop = L.prop === 'latte' && loader() && loader().has('crafty.coffee') ? `<g transform="translate(11 -14)">${loader().use('crafty.coffee', 'default', { x: 0, y: 0 })}</g>`
      : L.prop === 'latte' ? `<g transform="translate(11 -15)"><rect x="-2.5" y="-5" width="5" height="6" rx="1" fill="#F2E9D8" ${s} stroke-width=".8"/><rect x="-2.6" y="-3" width="5.2" height="2" fill="#8B5A3C"/></g>`
      : L.prop === 'mug' ? `<g transform="translate(11 -15)"><rect x="-2.6" y="-4.5" width="5.2" height="5.5" rx="1" fill="#D86B56" ${s} stroke-width=".8"/></g>` : '';
    return (
      `<ellipse cx="0" cy="0" rx="12" ry="3.2" fill="#000" opacity=".2"/>` +
      `<g class="bodyg">` +
      `<rect x="-6.5" y="-13" width="5" height="13" rx="1.6" fill="#2F3440"/><rect x="1.5" y="-13" width="5" height="13" rx="1.6" fill="#2F3440"/>` +
      `<rect x="-9.4" y="-24.5" width="4.2" height="12" rx="2" fill="${body}" ${s} stroke-width="1"/>` +
      `<path d="M-9.5 -12 L-8.6 -25.5 Q0 -30.5 8.6 -25.5 L9.5 -12 Z" fill="${body}" ${s}/>` + tie +
      `<circle cx="0" cy="-35" r="8.6" fill="${skin}" ${s}/>` + top + face +
      `<rect class="arm" x="6.6" y="-25" width="4.2" height="12.5" rx="2" fill="${body}" ${s} stroke-width="1"/>` + prop +
      `</g>`
    );
  }

  function faceSVG(c, cls) {
    const ch = loader() && loader().characterFor(c);
    const box = (ch && loader().portraitOf(ch)) || [-13.5, -51, 27, 30];
    return `<svg class="${cls || ''}" viewBox="${box.join(' ')}" aria-hidden="true">${puppet(c)}</svg>`;
  }

  /* ---------- Held items (puppet coordinates, right hand near 10,-14) ---------- */

  const CARRY = {
    grip: `<ellipse cx="13" cy="-11" rx="7" ry="4" fill="#E7B84F" stroke="${INK}" stroke-width="1"/><path d="M9 -14 q4 -3 8 0" fill="none" stroke="${INK}" stroke-width="1"/>`,
    lighting: `<g transform="rotate(-10 13 -18)"><polygon points="7,-24 19,-24 22,-14 4,-14" fill="#F4EEDF" stroke="${INK}" stroke-width="1"/><rect x="5" y="-16" width="16" height="2" fill="#FFE7A3"/></g>`,
    camera: `<rect x="8" y="-19" width="11" height="8" rx="1.5" fill="${INK}"/><rect x="11" y="-21" width="5" height="2" fill="${INK}"/>`,
    art: `<ellipse cx="14" cy="-15" rx="8" ry="2.2" fill="#fff" stroke="${INK}" stroke-width="1"/><path d="M9 -16 q5 -7 10 0z" fill="#E3A85A" stroke="${INK}" stroke-width=".8"/>`,
  };
  const TOOL = {
    grip: `<path d="M10 -16 l8 -9" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><rect x="15" y="-30" width="8" height="5" rx="1" fill="#5E5A52" stroke="${INK}" stroke-width=".8" transform="rotate(40 19 -27)"/>`,
    lighting: `<rect x="11" y="-31" width="9" height="12" fill="#D86B56" opacity=".85" stroke="${INK}" stroke-width=".8"/>`,
    camera: `<rect x="9" y="-24" width="9" height="6" rx="1" fill="${INK}"/><circle cx="18.5" cy="-21" r="1.6" fill="#7FB0C9"/>`,
    art: `<path d="M10 -18 l9 -8 M11 -17 l9 -7" stroke="${INK}" stroke-width="1.1" stroke-linecap="round"/>`,
  };
  function heldItem(dept, kind) {
    return (kind === 'carry' ? CARRY : kind === 'tool' ? TOOL : {})[dept] || '';
  }

  function puffMarkup(word) {
    return `<g class="puff"><g fill="#fff" stroke="${INK}" stroke-width="1.2"><circle r="9"/><circle cx="-10" cy="4" r="7"/><circle cx="10" cy="5" r="7"/><circle cx="2" cy="-8" r="6"/></g>
      <text y="4" text-anchor="middle" ${HAND} font-size="9" fill="#D86B56">${word}</text></g>`;
  }

  /* ---------- Props (local box 0..60 x 0..40) ---------- */

  function burger(lift, opts) {
    lift = lift || 0;
    opts = opts || {};
    const s = `stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"`;
    const strands = opts.strands
      ? `<g stroke="#F2C14E" stroke-width="2.4" fill="none" stroke-linecap="round"><path d="M17 ${18 - lift} q3 ${lift / 2} 0 ${lift + 3}"/><path d="M29 ${18 - lift} q-3 ${lift / 2} 1 ${lift + 3}"/><path d="M41 ${18 - lift} q3 ${lift / 2} -1 ${lift + 3}"/></g>`
      : '';
    const sauce = opts.sauce ? `<path d="M18 9 q6 -5 14 -3 q8 1 9 6 q-3 3 -6 1 q-2 4 -5 1 q-4 3 -6 -1 q-4 1 -6 -4z" fill="#C8452F" ${s} stroke-width=".9"/>` : '';
    return (
      `<path d="M7 30 h46 l-2.5 4.5 q-1 1.5 -3 1.5 h-35 q-2 0 -3 -1.5z" fill="#D9963F" ${s}/>` +
      `<rect x="6.5" y="23.5" width="47" height="7" rx="3.5" fill="#5B3A29" ${s}/>` +
      `<path d="M5.5 21.5 h49 l-4 5.5 l-4 -3.3 l-5 5 l-4 -4.2 l-6 5 l-5 -5 l-5 4.4 l-5 -4.4 l-4 3.3z" fill="#F2C14E" ${s} stroke-width="1"/>` +
      `<path d="M5 21 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 v2.5 h-48z" fill="#7FB069" ${s} stroke-width="1"/>` +
      strands +
      `<g transform="translate(0 ${-lift})"><path d="M7.5 19 q0 -15 22.5 -15 q22.5 0 22.5 15 z" fill="#E3A85A" ${s}/>` +
      `<g fill="#FFF4D6"><ellipse cx="20" cy="10" rx="1.5" ry=".8"/><ellipse cx="28" cy="7.5" rx="1.5" ry=".8"/><ellipse cx="36" cy="9.5" rx="1.5" ry=".8"/><ellipse cx="43" cy="13" rx="1.5" ry=".8"/><ellipse cx="15" cy="14" rx="1.5" ry=".8"/></g>` +
      sauce + `</g>`
    );
  }

  /*
    Delivered props (prop.burger, prop.cheese, prop.sauce), drawn in the same box as the placeholder burger: base center
    at (30, 36). Returns null when the hero burger has no art, so the code-drawn burger is used. The cheese pull is the
    delivered base plus a top bun lifted by `lift` units and three strands stretched between them, so the engine's
    lift (10 to 20) still drives it. The sauce shot is the hero burger plus the drip on its dome.
  */
  const STRAND_H = 21.6;   // strand art height in units at its export scale (stretched in height by the lift)
  const STRAND_DX = [-10, 1, 11];
  function realProp(shotId, state) {
    const L = loader();
    if (!L || !L.has('prop.burger', 'default')) return null;
    const at = { x: 30, y: 34.8 };   // 1.2 above the code-drawn base so the art sits on the platform contact point
    const hero = () => L.use('prop.burger', 'default', at);
    if (shotId === 'cheese' && L.has('prop.cheese', 'base') && L.has('prop.cheese', 'top-bun')) {
      const lift = state.lift != null ? state.lift : 12;
      const top = L.point('prop.cheese', 'top', 'base') || { x: 30, y: 10 };
      const sy = ((lift + 6) / STRAND_H).toFixed(3);
      const strands = ['strand-01', 'strand-02', 'strand-03'].filter(n => L.has('prop.cheese', n))
        .map((n, i) => `<g transform="translate(${30 + STRAND_DX[i]} ${(top.y - lift - 1).toFixed(2)}) scale(1 ${sy})">${L.use('prop.cheese', n, { x: 0, y: 0 })}</g>`).join('');
      return L.use('prop.cheese', 'base', at) + strands + L.use('prop.cheese', 'top-bun', { x: 30, y: top.y - lift });
    }
    if (shotId === 'sauce' && L.has('prop.sauce', 'drip')) {
      const top = L.point('prop.burger', 'top') || { x: 30, y: -6 };
      return hero() + L.use('prop.sauce', 'drip', { x: 30, y: top.y + 2 });
    }
    return hero();
  }

  // The sauce pour: the delivered stream from the bottle nozzle, or the dashed code-drawn line
  function pourMarkup() {
    const L = loader();
    // The stream starts at the bottle's nozzle. #pour sits in the hero spot group, so the spot's shift is taken back out
    const nz = L && L.point('grip.rig-bottle', 'nozzle'), hs = heroSpot();
    const at = nz ? { x: nz.x - hs.dx, y: nz.y - hs.dy } : { x: 186, y: 100 };
    const real = L && L.has('prop.sauce', 'stream') ? L.use('prop.sauce', 'stream', at) : '';
    return `<g id="pour" opacity="0">${real || '<path class="pour" d="M186 100 q-3 6 -2 12" fill="none" stroke="#C8452F" stroke-width="3" stroke-linecap="round"/>'}</g>`;
  }

  // The cheese pot on the art cart. With art: the pot, a cheese fill that rises inside its opening (clipped to the
  // opening, so a low level shows as a crescent at the front), and the steam. Without: the code-drawn pot.
  function potMarkup() {
    const L = loader();
    const placeholder = `<g class="steam" id="steam" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0"><path d="M4 -2 q-2 -4 0 -7"/><path d="M10 -2 q2 -4 0 -7"/></g>
    <path d="M0 2 h16 l-1.5 13 h-13z" fill="#7A7F88" stroke="${INK}" stroke-width="1.3"/>
    <rect id="potCheese" x="1" y="2" width="14" height="0" fill="#F2C14E"/>
    <path d="M-2 2 h20" stroke="${INK}" stroke-width="1.6"/>`;
    if (!L || !L.has('art.cheese-pot', 'empty')) return placeholder;
    const at = L.slotDef('art.cheese-pot').anchor;
    const pt = (n) => L.point('art.cheese-pot', n, 'empty');
    const hl = pt('holeL'), hr = pt('holeR'), ht = pt('holeT'), hb = pt('holeB');
    let fill = '', steam = '';
    const cx = hl && hr ? (hl.x + hr.x) / 2 : at.x, cy = ht && hb ? (ht.y + hb.y) / 2 : at.y - 10;
    if (hl && hr && ht && hb && L.has('art.cheese-pot', 'fill')) {
      const rx = (hr.x - hl.x) / 2, ry = (hb.y - ht.y) / 2;
      fill = `<clipPath id="potClip"><ellipse cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}"/></clipPath>` +
        `<g clip-path="url(#potClip)"><g id="potFill" display="none" data-dy="${(ry * 2.3).toFixed(2)}">${L.use('art.cheese-pot', 'fill', { x: cx, y: cy })}</g></g>`;
    }
    if (L.has('art.cheese-pot', 'steam-1')) steam = `<g id="steam" opacity="0"><g class="steamf">${L.use('art.cheese-pot', 'steam-1', { x: cx, y: cy - 1 })}</g></g>`;
    return L.use('art.cheese-pot', 'empty', { x: at.x, y: at.y }) + fill + steam;
  }

  function propInner(shotId, state) {
    state = state || {};
    const real = realProp(shotId, state);
    if (real) return real;
    if (shotId === 'cheese') return burger(state.lift != null ? state.lift : 12, { strands: true });
    if (shotId === 'sauce') return burger(0, { sauce: true });
    return burger(0);
  }

  function propSVG(shotId) {
    return `<svg viewBox="0 -8 60 46" aria-hidden="true">${propInner(shotId)}</svg>`;
  }

  // Burger stack on the art cart: n of 5 layers, bottom up
  function cartBurger(n) {
    const layers = [
      '<path d="M7 30 h46 l-2.5 4.5 q-1 1.5 -3 1.5 h-35 q-2 0 -3 -1.5z" fill="#D9963F"/>',
      '<rect x="6.5" y="23.5" width="47" height="7" rx="3.5" fill="#5B3A29"/>',
      '<path d="M5.5 21.5 h49 l-4 5.5 l-4 -3.3 l-5 5 l-4 -4.2 l-6 5 l-5 -5 l-5 4.4 l-5 -4.4 l-4 3.3z" fill="#F2C14E"/>',
      '<path d="M5 21 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 q4 -4.5 8 0 v2.5 h-48z" fill="#7FB069"/>',
      '<path d="M7.5 19 q0 -15 22.5 -15 q22.5 0 22.5 15 z" fill="#E3A85A"/>',
    ];
    // Delivered layers are drawn per layer, so a half-delivered stack mixes real and placeholder layers.
    // The group this lands in is scaled by CART_SCALE, so delivered images are scaled back up by its inverse.
    const L = loader();
    const def = L && L.slotDef('art.burger-build');
    if (def && def.layers.some(name => L.has('art.burger-build', name))) {
      const k = 1 / CART_SCALE;
      return layers.slice(0, n).map((markup, i) => {
        const name = def.layers[i];
        const real = L.use('art.burger-build', name, { x: def.anchor.x, y: def.anchor.y + (def.stack[name] || 0) * k, k });
        return real || `<g stroke="${INK}" stroke-width="1.6">${markup}</g>`;
      }).join('');
    }
    return `<g stroke="${INK}" stroke-width="1.6">${layers.slice(0, n).join('')}</g>`;
  }
  const CART_SCALE = 0.42;
  // Where the carried burger starts: the cart stack's size and spot. The delivered stack is drawn at 0.6 of the hero
  // (batch 3), so the carry starts at 0.6 and the burger does not change size when it leaves the cart.
  const CART_REAL_SCALE = 0.6;
  function carryStart() {
    const L = loader();
    const real = !!(L && L.has('prop.burger', 'default') && L.slotDef('art.burger-build') && L.slotDef('art.burger-build').layers.some(n => L.has('art.burger-build', n)));
    const s = real ? CART_REAL_SCALE : CART_SCALE;
    const bx = 12 + 30 * CART_SCALE, by = 150 + 36 * CART_SCALE;   // the cart stack's base center, which does not move
    return { s, x: bx - 30 * s, y: by - 36 * s };
  }

  /*
    Hero spot: where the hero prop's base sits. With the code-drawn platform that is HERO_BASE. When the delivered
    platform names a "contact" point on its lid (grip.platform.json, "points"), the prop sits there instead, and
    everything aimed at the prop (frame marks, sparkle, sauce pour, the rig's fork and bottle, the light beams)
    moves with it. dx/dy is the shift from the placeholder layout.
  */
  const HERO_BASE = { x: 180, y: 128 };
  const PROP_ORIGIN = { x: 150, y: 92 };   // propInner draws the burger base center at (30, 36)
  function heroSpot() {
    const p = loader() && loader().point('grip.platform', 'contact');
    const at = p || HERO_BASE;
    const dx = Math.round((at.x - HERO_BASE.x) * 10) / 10, dy = Math.round((at.y - HERO_BASE.y) * 10) / 10;
    return { x: at.x, y: at.y, dx, dy, prop: { x: PROP_ORIGIN.x + dx, y: PROP_ORIGIN.y + dy } };
  }

  // The key light's lens, relative to where the head turns on its stand (set units, head not rotated). Delivered
  // head art names it with the points lensA and lensB; the code-drawn head shines from its bottom edge.
  function keyLens() {
    const L = loader();
    const a = L && L.point('elec.keylight-head', 'lensA'), b = L && L.point('elec.keylight-head', 'lensB');
    return a && b ? [[a.x - 72, a.y - 76], [b.x - 72, b.y - 76]] : [[24, 16], [-24, 16]];
  }

  /* ---------- Set scene: viewBox x 0..360, y -70..340 ---------- */

  const STATIONS = {
    table:  { x: 184, y: 216 },
    light:  { x: 104, y: 210 },
    camera: { x: 330, y: 214 },
    cart:   { x: 50,  y: 228 },
  };
  // Idle crew hang out at the craft table
  const IDLE = {
    grip:     { x: 136, y: 328 },
    lighting: { x: 28,  y: 330 },
    camera:   { x: 178, y: 332 },
    art:      { x: 80,  y: 334 },
  };

  const CLIENT = { name: 'Client', color: '#344F70', look: { skin: '#E8C2A0', hair: '#8A8A8A', top: 'slick', glasses: true, tie: '#D86B56' } };
  const AGENCY = { name: 'Agency', color: '#2F3440', look: { skin: '#C9946E', hair: '#151515', top: 'beret', prop: 'latte' } };

  // Small icon badge that names each workstation; the ring shows its current task's progress
  function stationBadge(id, dept, x, y) {
    return `<g class="sbadge" id="badge-${id}" transform="translate(${x} ${y})" pointer-events="none">
      <circle class="bring" r="11.5" fill="none" stroke="#4E8A62" stroke-width="3.4" stroke-dasharray="0 73" transform="rotate(-90)"/>
      <circle r="8.6" fill="${DEPT_COLOR[dept]}" stroke="${INK}" stroke-width="1.4"/>
      <g transform="translate(-6 -6) scale(.5)" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${DEPT_ICON[dept]}</g>
      <circle class="bmk" cx="9" cy="-9" r="4.2" stroke="#fff" stroke-width="1.4"/>
    </g>`;
  }

  /*
    The set is composed for a 360 x 410 portrait frame. setMarkup({ wide: true }) recomposes it for a landscape
    screen: the stage stays where it is, the walls and floor run on to both sides, video village moves to the left
    and the craft table (where idle crew wait) to the right, so the whole working area fits a wide, short frame.
    WIDE_VIEW is the area that is always shown; the paper flats and floor run well past it, so a screen of any
    shape shows more set instead of empty bands.
  */
  const WIDE_VIEW = [-150, -40, 660, 336];
  const IDLE_WIDE = {
    // spread along the craft table and staggered in depth, so people and their pop-ups do not pile up
    lighting: { x: 322, y: 282 },
    art:      { x: 364, y: 267 },
    grip:     { x: 406, y: 284 },
    camera:   { x: 448, y: 269 },
  };
  const WIDE_VILLAGE = 'translate(-300 -48)';
  const WIDE_CRAFTY = 'translate(300 -44)';

  // Seamless textures (batch 4): the wall and the floor are 200 x 200 unit tiles, the ceiling pipes a strip 200 units wide.
  // A tile becomes an SVG pattern, so the page carries one small image however far the set runs.
  function tileDef(id, patId, w, h, y0, ay) {
    const L = loader();
    if (!L || !L.has(id, 'default')) return '';
    return `<pattern id="${patId}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${y0 ? ` patternTransform="translate(0 ${y0})"` : ''}>${L.use(id, 'default', { x: 0, y: ay })}</pattern>`;
  }
  const hasArt = (id, st) => !!(loader() && loader().has(id, st || 'default'));

  /*
    Light beams (batch 5): the art is a wedge whose pivot is the narrow end (the light face) and whose natural length
    is BEAM_LEN. The engine turns it from the light face toward the burger and stretches it to the distance.
  */
  const BEAM_LEN = 150, FILL_BEAM_LEN = 50;
  function wedgeTransform(from, to, naturalLen) {
    const dx = to[0] - from[0], dy = to[1] - from[1];
    const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    return `translate(${from[0].toFixed(1)} ${from[1].toFixed(1)}) rotate(${ang.toFixed(1)}) scale(${(len / naturalLen).toFixed(3)} 1)`;
  }

  // Sauce bowl: the bowl, and the sauce as its own layer that fades in while the art crew preps it (#bowlSauce)
  function bowlMarkup() {
    const L = loader();
    if (!L || !L.has('art.sauce-bowl', 'empty')) {
      return `<g id="bowl" transform="translate(62 162)">
    <path d="M0 2 h16 q0 9 -8 9 q-8 0 -8 -9z" fill="#F2E9D8" stroke="${INK}" stroke-width="1.3"/>
    <path id="bowlSauce" d="M2 4 h12 q-1 4 -6 4 q-5 0 -6 -4z" fill="#C8452F" opacity="0"/>
  </g>`;
    }
    return `<g id="bowl">${L.use('art.sauce-bowl', 'empty')}<g id="bowlSauce" opacity="0">${L.has('art.sauce-bowl', 'fill') ? L.use('art.sauce-bowl', 'fill') : ''}</g></g>`;
  }

  // The monitor's screen inset: read off the delivered art (named points screen and screen2), else the code-drawn 52 x 32.
  // The live view is drawn in a 98 x 60 box that starts at (-4, -6), so it is scaled to the screen's width and centered.
  function monitorScreen() {
    const L = loader();
    const a = L && L.point('village.monitor', 'screen'), b = L && L.point('village.monitor', 'screen2');
    const box = a && b ? { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y } : { x: 198, y: 240, w: 52, h: 32 };
    const k = box.w / 98;
    const tx = box.x + 4 * k, ty = box.y + (box.h - 60 * k) / 2 + 6 * k;
    const r = (n) => Math.round(n * 100) / 100;
    return { x: r(box.x), y: r(box.y), w: r(box.w), h: r(box.h), view: `translate(${r(tx)} ${r(ty)}) scale(${k.toFixed(3)})`, rec: [r(box.x + box.w - 4.5), r(box.y + 4.5)] };
  }
  // Where the engine's own words sit on the delivered craft table's label plate and on the chair backs
  const CRAFTY_LABEL = { x: 89, y: 316 }; // Nov 5: table refit to the 150 x 60 footprint
  const CHAIR_TEXT_Y = 308;
  // Floor dressing drawn from delivered art: three tape marks, and scuffs scattered over the floor
  function floorDressing(wide) {
    const L = loader();
    const tape = hasArt('set.tape-mark')
      ? [[181, 233, -8], [326, 234, 12], [102, 228, -3]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">${L.use('set.tape-mark', 'default', { x: 0, y: 0 })}</g>`).join('')
      : `<g stroke="#E7B84F" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M176 230 l10 6 M186 230 l-10 6"/><path d="M322 232 l9 5 M331 232 l-9 5"/><path d="M98 226 l9 5 M107 226 l-9 5"/></g>`;
    const spots = wide ? [[60, 262], [430, 282], [-330, 292], [800, 268], [-20, 360], [520, 380]] : [[180, 262], [180, 310]];
    const scuffs = hasArt('set.floor-scuffs') ? spots.map(([x, y]) => L.use('set.floor-scuffs', 'default', { x, y })).join('') : '';
    return scuffs + tape;
  }

  function setMarkup(opts) {
    const wide = !!(opts && opts.wide);
    const s = S();
    const h = heroSpot();
    const moved = h.dx || h.dy;
    const MON = monitorScreen();
    const shiftPts = (pts) => pts.map(([x, y], i) => (i >= 2 ? [x + h.dx, y + h.dy] : [x, y]).join(',')).join(' ');
    const heroOpen = moved ? `<g id="heroSpot" transform="translate(${h.dx} ${h.dy})">` : '';
    const heroClose = moved ? '</g>' : '';
    return `
<svg class="set${wide ? ' wide' : ''}" id="setSvg" viewBox="${wide ? WIDE_VIEW.join(' ') : '0 -70 360 410'}"${wide ? ' preserveAspectRatio="xMidYMid meet" overflow="visible"' : ''} role="img" aria-label="The Burger Job set">
  <defs>
    <pattern id="corrRed" width="5" height="10" patternUnits="userSpaceOnUse"><rect width="5" height="10" fill="#D7705A"/><rect width="2" height="10" fill="#C2604B"/></pattern>
    <mask id="spotMask" maskUnits="userSpaceOnUse" x="${wide ? -600 : 0}" y="${wide ? -300 : -70}" width="${wide ? 1560 : 360}" height="${wide ? 900 : 410}">
      <rect x="${wide ? -600 : 0}" y="${wide ? -300 : -70}" width="${wide ? 1560 : 360}" height="${wide ? 900 : 410}" fill="#fff"/><ellipse cx="${h.x}" cy="${h.y - 16}" rx="52" ry="38" fill="url(#spotGrad)"/></mask>
    <radialGradient id="spotGrad"><stop offset="0" stop-color="#000"/><stop offset=".5" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
    <filter id="beamSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.5"/></filter>
    ${tileDef('set.wall', 'setWall', 200, 200, 0, 0)}${tileDef('set.floor', 'setFloor', 200, 200, 0, 0)}${tileDef('set.grid', 'setGrid', 200, 24, -58, 12)}
  </defs>

  <!-- Back wall: layered paper flats -->
  <rect x="${wide ? -600 : 0}" y="${wide ? -300 : -70}" width="${wide ? 1560 : 360}" height="${wide ? 900 : 410}" fill="${hasArt('set.wall') ? 'url(#setWall)' : '#344F70'}"/>
  ${wide ? `<g filter="url(#cut)">
    <path d="M-600 -60 L-236 -66 L-232 154 L-600 156Z" fill="#2E4664"/>
    ${slot('set.flat-6', '<path d="M-248 -36 L-150 -42 L-146 154 L-250 155Z" fill="#C79A64"/>')}
    ${slot('set.flat-7', '<path d="M-160 -14 L-74 -20 L-72 154 L-158 154Z" fill="#E1B14E"/>')}
    ${slot('set.flat-8', '<path d="M-86 -50 L-6 -46 L-10 153 L-84 153Z" fill="#7C5A7E"/>')}
    ${slot('set.flat-9', '<path d="M356 -46 L432 -50 L428 146 L354 146Z" fill="#C4644D"/>')}
    ${slot('set.flat-10', '<path d="M420 -24 L500 -28 L502 145 L418 145Z" fill="#E8D9B5"/>')}
    ${slot('set.flat-11', '<path d="M492 -56 L600 -52 L598 144 L490 145Z" fill="#6F8F83"/>')}
    <path d="M590 -60 L960 -66 L960 144 L588 144Z" fill="#2E4664"/>
  </g>
  ${slot('set.call-sheet', '<g filter="url(#cut)"><rect x="436" y="0" width="52" height="36" fill="#F2E9D8"/><path d="M444 10 h36 M444 18 h30 M444 26 h24" stroke="#5E5A52" stroke-width="2"/></g>')}` : ''}
  <g filter="url(#cut)">
    ${slot('set.flat-1', '<path d="M-8 -48 L74 -52 L70 152 L-8 152Z" fill="#3E5C80"/>')}
    ${slot('set.flat-2', '<path d="M62 -26 L134 -31 L131 152 L60 152Z" fill="#B95A48"/>')}
    ${slot('set.flat-3', '<path d="M144 -40 L216 -44 L214 40 L146 40Z" fill="#D9A04A"/>')}
    ${slot('set.flat-4', '<path d="M230 -34 L298 -30 L300 152 L228 152Z" fill="#6F8F83"/>')}
    ${slot('set.flat-5', '<rect x="290" y="-56" width="76" height="208" fill="#2E4664"/>')}
  </g>

  <!-- Ceiling grid with hanging practicals and a flag -->
  ${hasArt('set.grid') ? `<rect x="${wide ? -600 : -4}" y="-58" width="${wide ? 1560 : 368}" height="24" fill="url(#setGrid)"/>` : `<g stroke="#1C2C42" stroke-width="3.2" stroke-linecap="round"><path d="M${wide ? -600 : -4} -54 H${wide ? 960 : 364}"/><path d="M${wide ? -600 : -4} -36 H${wide ? 960 : 364}" opacity=".55"/></g>`}
  <g filter="url(#cut)">
    ${slot('set.practical-red', `<path d="M58 -54 V-28" ${s} stroke-width="1.6"/><path d="M46 -16 L52 -30 H64 L70 -16Z" fill="#D86B56" ${s}/>`)}
    ${slot('set.practical-sage', `<path d="M306 -54 V-26" ${s} stroke-width="1.6"/><path d="M294 -14 L300 -28 H312 L318 -14Z" fill="#7D9E91" ${s}/>`)}
    ${slot('set.overhead-flag', `<path d="M192 -54 V-46" ${s} stroke-width="1.6"/><rect x="170" y="-46" width="44" height="26" fill="#22262B"/>`)}
  </g>
  ${hasArt('set.practical-red') ? '' : `<ellipse cx="58" cy="-8" rx="16" ry="7" fill="#FFE7A3" opacity=".35" filter="url(#glow)"/>
  <ellipse cx="306" cy="-6" rx="16" ry="7" fill="#FFE7A3" opacity=".35" filter="url(#glow)"/>`}

  <g filter="url(#cut)" transform="rotate(-5 42 36)">
    ${slot('set.poster', '<rect x="18" y="16" width="44" height="34" fill="#F2E9D8"/>')}
    <text x="40" y="31" text-anchor="middle" ${HAND} font-size="10" fill="#D86B56">BIG</text>
    <text x="40" y="44" text-anchor="middle" ${HAND} font-size="10" fill="#D86B56">BUN</text>
  </g>
  <rect x="32" y="12" width="16" height="6" fill="#E7B84F" opacity=".85" transform="rotate(-8 40 15)"/>

  <!-- Potted plants -->
  <g filter="url(#cut)">
    ${slot('set.plant-1', `<path d="M8 152 l3 -22 h22 l3 22z" fill="#C4644D" ${s}/>
    <path d="M22 130 q-18 -20 -14 -46 q12 18 14 46z M22 130 q4 -30 22 -42 q-4 26 -22 42z M22 130 q-2 -26 6 -52 q8 26 -6 52z" fill="#7FB069" ${s} stroke-width="1.2"/>`)}
    ${slot('set.plant-2', `<path d="M318 152 l3 -18 h20 l3 18z" fill="#E7B84F" ${s}/>
    <path d="M331 134 q-14 -16 -10 -38 q10 14 10 38z M331 134 q4 -24 18 -34 q-2 22 -18 34z" fill="#6E9E5A" ${s} stroke-width="1.2"/>`)}
  </g>

  <!-- Floor -->
  ${(() => {
    const real = hasArt('set.floor'), fl = real ? 'url(#setFloor)' : '#D8C29C';
    return wide ? `<path d="M-600 158 L0 152 L360 145 L960 139 L960 600 L-600 600Z" fill="${fl}"/>
  <path d="M-600 158 L0 152 L360 145 L960 139" stroke="${INK}" stroke-width="1.5" opacity=".35"/>
  ${real ? '' : '<path d="M-600 236 q160 -8 330 2 t330 -2 t330 4 t300 -4 V600 H-600Z" fill="#CFB78F" opacity=".45"/>'}`
      : `<path d="M0 152 L360 145 L360 340 L0 340Z" fill="${fl}"/>
  <path d="M0 152 L360 145" stroke="${INK}" stroke-width="1.5" opacity=".35"/>
  ${real ? '' : `<path d="M0 196 q60 -6 130 2 t160 -4 t70 4 V260 H0Z" fill="#CFB78F" opacity=".55"/>
  <path d="M0 280 q90 -8 190 2 t170 -2 V340 H0Z" fill="#CDB48A" opacity=".5"/>`}`;
  })()}
  ${floorDressing(wide)}
  ${slot('set.cable', `<path d="M74 198 q30 16 70 8 t90 6 q30 4 60 -2 q20 30 -40 70" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".6"/>`)}

  <!-- Grip: sweep unrolls from its tube, the hero platform is carried in, a flag goes up -->
  <g id="pc-sweep">
    <g id="sweepRoll" filter="url(#cut)">${slot('grip.sweep', `<path id="sweep" d="M126 30 H234 V124 Q234 136 247 137.5 H113 Q126 136 126 124Z" fill="#E7B84F" ${s}/>`)}</g>
    ${slot('grip.sweep-tube', `<rect x="121" y="24" width="118" height="8" rx="4" fill="#8B6A43" ${s}/>`)}
  </g>
  <g id="pc-flag" filter="url(#cut)">${slot('grip.flag', `<path d="M262 200 V64" ${s} stroke-width="2"/><rect x="250" y="62" width="25" height="44" fill="${INK}"/><path d="M256 200 h12" ${s} stroke-width="3"/>`)}</g>
  <g id="platform">${slot('grip.platform', `<g filter="url(#cut)">
    <path d="M128 140 L136 132 H240 L232 140Z" fill="#E58A70" ${s}/>
    <rect x="128" y="140" width="104" height="52" fill="url(#corrRed)" ${s}/>
    <path d="M232 140 L240 132 V184 L232 192Z" fill="#B85846" ${s}/>
  </g>`)}</g>
  <g filter="url(#cut)">${slot('grip.gear-pile', `
    <rect x="246" y="186" width="26" height="16" fill="#C2915A" ${s}/><rect x="250" y="174" width="18" height="12" fill="#B5864D" ${s}/>
    <ellipse cx="282" cy="200" rx="10" ry="5" fill="#E7B84F" ${s}/>`)}
  </g>

  <!-- Rig for cheese pull / sauce pour -->
  <g id="rig" filter="url(#cut)">
    <g id="rig-pole">${slot('grip.rig-pole', `<path d="M292 202 V54" ${s} stroke-width="2.4"/><path d="M282 202 l10 -14 l10 14" fill="none" ${s} stroke-width="2"/>`)}</g>
    <g id="rig-arm">${slot('grip.rig-arm', `<path d="M292 58 H196" ${s} stroke-width="2.4"/><rect x="286" y="53" width="12" height="9" rx="2" fill="#5E5A52" ${s}/>`)}</g>
    <g id="rig-fork">${slot('grip.rig-fork', `<path d="M197 58 V${74 + h.dy}" ${s} stroke-width="2"/><path d="M191 ${74 + h.dy} h12 M193 ${74 + h.dy} v8 M197 ${74 + h.dy} v8 M201 ${74 + h.dy} v8" ${s} stroke-width="1.4"/>`)}</g>
    <g id="rig-bottle">${slot('grip.rig-bottle', `<path d="M197 58 V${66 + h.dy}" ${s} stroke-width="2"/><g transform="${moved ? `translate(0 ${h.dy}) ` : ''}rotate(28 196 82)"><rect x="189" y="66" width="14" height="26" rx="4" fill="#C8452F" ${s}/><rect x="193" y="92" width="6" height="6" fill="#F2E9D8" ${s}/><rect x="190" y="72" width="12" height="8" fill="#F2E9D8"/></g>`)}</g>
  </g>

  <polygon id="beam" points="${shiftPts([[96, 78], [76, 94], [154, 136], [222, 136]])}" fill="#FFE7A3" opacity="0" filter="url(#beamSoft)" style="mix-blend-mode:screen"${hasArt('elec.beam') ? ' display="none"' : ''}/>
  ${hasArt('elec.beam') ? `<g id="beamArt" opacity="0" style="mix-blend-mode:screen">${loader().use('elec.beam', 'default', { x: 0, y: 0 })}</g>` : ''}
  <g id="fillLight" opacity="0" filter="url(#cut)">${slot('elec.fill', `
    <path d="M240 206 V104 M230 206 l10 -12 l10 12" fill="none" ${s} stroke-width="2"/>
    <g transform="rotate(-16 240 100)"><rect x="226" y="88" width="28" height="20" rx="2" fill="#F4EEDF" ${s}/><rect id="fillFace" x="226" y="104" width="28" height="4" fill="#FFE7A3"/></g>`)}
  </g>
  <polygon id="fillBeam" points="${shiftPts([[228, 106], [236, 116], [206, 134], [190, 130]])}" fill="#FFF4D6" opacity="0" filter="url(#beamSoft)" style="mix-blend-mode:screen"${hasArt('elec.fill-beam') ? ' display="none"' : ''}/>
  ${hasArt('elec.fill-beam') ? `<g id="fillBeamArt" opacity="0" style="mix-blend-mode:screen" transform="${wedgeTransform([232, 111], [198 + h.dx, 132 + h.dy], FILL_BEAM_LEN)}">${loader().use('elec.fill-beam', 'default', { x: 0, y: 0 })}</g>` : ''}
  <g id="backLight" opacity="0">${slot('elec.backlight', `
    <path d="M214 -54 V-34" ${s} stroke-width="1.6"/><rect x="204" y="-34" width="20" height="12" rx="2" fill="#F4EEDF" ${s}/>
    <polygon points="206,-22 222,-22 214,24" fill="#FFF4D6" opacity=".55"/>`)}
  </g>
  ${heroOpen}<g id="sparkle" opacity="0" stroke="#fff" stroke-width="3" stroke-linecap="round">${hasArt('fx.sparkle', '01') && hasArt('fx.sparkle', '02')
    ? `<g class="sprk a" stroke="none">${loader().use('fx.sparkle', '01')}</g><g class="sprk b" stroke="none">${loader().use('fx.sparkle', '02')}</g>`
    : '<path d="M164 78 l-6 -11 M180 72 v-13 M196 78 l6 -11 M150 92 l-11 -4 M210 92 l11 -4"/>'}</g>
  <g id="prop" transform="translate(150 92)"></g>
  ${pourMarkup()}
  <g id="frameMarks" opacity="0">${slot('cam.frame-marks', `<g fill="none" stroke="#D86B56" stroke-width="2.6" stroke-linecap="round">
    <path d="M146 92 v-8 h10"/><path d="M214 92 v-8 h-10"/><path d="M146 132 v8 h10"/><path d="M214 132 v8 h-10"/>
  </g>`)}</g>${heroClose}

  <!-- Electric: key light on a rolling stand, wheeled to its mark, aimed, switched on -->
  <g id="keyRig"><g filter="url(#cut)">
    ${slot('elec.keylight-stand', `<path d="M58 200 L72 158 L86 200 M72 158 V200" fill="none" ${s} stroke-width="2"/>
    <circle cx="58" cy="202" r="2.6" fill="${INK}"/><circle cx="86" cy="202" r="2.6" fill="${INK}"/>
    <path d="M72 158 V76" ${s} stroke-width="2.4"/>`)}
    <g id="keyHead" transform="rotate(20 72 76)">${slot('elec.keylight-head', `
      <polygon points="52,58 92,58 100,92 44,92" fill="#F4EEDF" ${s}/>
      <rect id="lightFace" x="48" y="86" width="48" height="6" fill="#7A7468"/>`)}
    </g>
  </g></g>
  <g id="dead" opacity="0">${slot('elec.dead-fx', `
    <g stroke="#D86B56" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M98 64 l7 -4 l-2 6 l8 -3"/><path d="M48 60 l-6 -6 l1 6 l-7 -3"/></g>
    <circle cx="88" cy="48" r="9" fill="#D86B56" stroke="${INK}" stroke-width="1.5"/><text x="88" y="53" text-anchor="middle" ${HAND} font-size="13" fill="#fff">!</text>`)}
  </g>

  <!-- Camera: dolly track, camera on the dolly, lens swaps for close-ups -->
  ${slot('cam.track', `<g filter="url(#cut)" opacity=".9"><path d="M232 214 H358 M232 222 H358" stroke="${INK}" stroke-width="2.4"/><g fill="#5E5A52">${[240, 256, 272, 288, 304, 320, 336, 352].map(x => `<rect x="${x}" y="212" width="4" height="12"/>`).join('')}</g></g>`)}
  <g id="camRig" class="camrig"><g filter="url(#cut)">
    ${slot('cam.camera', `<path d="M290 204 L304 152 L318 204 M304 152 V204" fill="none" ${s} stroke-width="2"/>
    <rect x="288" y="126" width="36" height="24" rx="3" fill="#3B4048" ${s}/>
    <rect x="296" y="119" width="16" height="8" rx="2" fill="#3B4048" ${s}/>
    <circle id="recDot" cx="318" cy="132" r="2.6" fill="#5A2A24"/>
    <rect x="286" y="202" width="36" height="8" rx="2" fill="#5E5A52" ${s}/>`)}
    ${slot('cam.lens', `<rect id="lens" x="270" y="131" width="19" height="14" rx="2" fill="${INK}"/>`)}
  </g></g>

  <!-- Art: styling table with the burger build, cheese pot and sauce bowl -->
  <g filter="url(#cut)">${slot('art.table', `
    <rect x="10" y="172" width="70" height="8" fill="#F2E9D8" ${s}/>
    <path d="M16 180 V206 M74 180 V206 M16 196 H74" ${s} stroke-width="2"/>
    <circle cx="16" cy="209" r="3.5" fill="${INK}"/><circle cx="74" cy="209" r="3.5" fill="${INK}"/>
    <g ${s} stroke-width="1"><rect x="64" y="186" width="7" height="9" fill="#D86B56"/><rect x="54" y="186" width="7" height="9" fill="#7D9E91"/></g>`)}
  </g>
  <g id="cartBurger" transform="translate(12 150) scale(${CART_SCALE})"></g>
  <g id="pot" transform="translate(44 156)">${potMarkup()}</g>
  ${bowlMarkup()}

  <!-- Craft table (idle crew hang out here) -->
  ${wide ? `<g transform="${WIDE_CRAFTY}">` : ''}<g filter="url(#cut)">${slot('crafty.table', `
    <rect x="14" y="282" width="150" height="8" fill="#F2E9D8" ${s}/>
    <path d="M22 290 V318 M156 290 V318" ${s} stroke-width="2.2"/>
    <rect x="22" y="258" width="18" height="24" rx="3" fill="#9AA0A8" ${s}/><rect x="40" y="268" width="5" height="3" fill="${INK}"/>
    <path d="M58 276 h40 l-3 6 h-34z" fill="#F4B6C2" ${s}/><rect x="56" y="262" width="44" height="14" fill="#F4B6C2" ${s} transform="skewX(-10)"/>
    <g fill="#E3A85A" ${s} stroke-width="1"><circle cx="66" cy="274" r="4"/><circle cx="76" cy="274" r="4"/><circle cx="86" cy="274" r="4"/></g>
    <g ${s} stroke-width="1"><rect x="112" y="271" width="8" height="11" rx="1" fill="#E7B84F"/><rect x="123" y="271" width="8" height="11" rx="1" fill="#D86B56"/><rect x="134" y="271" width="8" height="11" rx="1" fill="#F2E9D8"/></g>`)}
  </g>
  <text x="${hasArt('crafty.table') ? CRAFTY_LABEL.x : 90}" y="${hasArt('crafty.table') ? CRAFTY_LABEL.y : 303}" text-anchor="middle" ${HAND} font-size="9" fill="${INK}" opacity=".7">CRAFTY</text>${wide ? '</g>' : ''}

  <!-- Video village: monitor, client and agency -->
  ${wide ? `<g transform="${WIDE_VILLAGE}">` : ''}<g filter="url(#cut)">${slot('village.monitor', `
    <path d="M224 334 V276 M212 334 h24" ${s} stroke-width="2.2"/>
    <rect x="194" y="236" width="60" height="40" rx="3" fill="#2F3440" ${s}/>
    <rect x="198" y="240" width="52" height="32" fill="#151820"/>`)}
  </g>
  <!-- The live view is 98 x 60 and is scaled to the screen inset (52 x 32 on the code-drawn monitor, read off the art when delivered); the clip keeps it inside -->
  <clipPath id="monClip"><rect x="${MON.x}" y="${MON.y}" width="${MON.w}" height="${MON.h}"/></clipPath>
  <g clip-path="url(#monClip)"><g id="monView" transform="${MON.view}"></g></g>
  <circle id="monRec" cx="${MON.rec[0]}" cy="${MON.rec[1]}" r="2.4" fill="#FF4B3A" opacity="0"/>
  <g transform="translate(286 318)"><g transform="scale(1.2)">${puppet(CLIENT)}</g></g>
  <g transform="translate(334 320)"><g transform="scale(1.2)">${puppet(AGENCY)}</g></g>
  ${hasArt('village.chair')
    ? `<g filter="url(#cut)">${loader().use('village.chair', 'default', { x: 286, y: 340 })}${loader().use('village.chair', 'default', { x: 334, y: 340 })}</g>
  <g ${UI} font-weight="700" font-size="7.5" fill="#fff" text-anchor="middle"><text x="286" y="${CHAIR_TEXT_Y}">CLIENT</text><text x="334" y="${CHAIR_TEXT_Y}">AGENCY</text></g>`
    : `<g filter="url(#cut)">
    <path d="M270 340 l8 -24 M302 340 l-8 -24 M318 340 l8 -24 M350 340 l-8 -24" ${s} stroke-width="2"/>
    <rect x="268" y="296" width="36" height="16" fill="#D86B56" ${s}/><text x="286" y="308" text-anchor="middle" ${UI} font-weight="700" font-size="7.5" fill="#fff">CLIENT</text>
    <rect x="316" y="298" width="36" height="16" fill="#22262B" ${s}/><text x="334" y="310" text-anchor="middle" ${UI} font-weight="700" font-size="7.5" fill="#fff">AGENCY</text>
  </g>`}
  <g id="clientBub" opacity="0">
    <path d="M232 228 h108 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-46 l-8 8 l-1 -8 h-53 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4z" fill="#fff" ${s} stroke-width="1.3"/>
    <text id="clientText" x="286" y="245" text-anchor="middle" ${UI} font-weight="700" font-size="8.5" fill="${INK}"></text>
  </g>${wide ? '</g>' : ''}

  <!-- Workstation badges, then tap targets -->
  ${stationBadge('light', 'lighting', 26, 68)}
  ${stationBadge('table', 'grip', 120, 44)}
  ${stationBadge('camera', 'camera', 340, 112)}
  ${stationBadge('cart', 'art', 14, 154)}
  <rect class="station-hit" data-station="light" x="36" y="44" width="78" height="168" rx="6"/>
  <rect class="station-hit" data-station="table" x="118" y="28" width="138" height="178" rx="6"/>
  <rect class="station-hit" data-station="camera" x="264" y="112" width="92" height="104" rx="6"/>
  <rect class="station-hit" data-station="cart" x="4" y="146" width="84" height="80" rx="6"/>

  <g id="crewLayer"></g>
  <g id="fxLayer"></g>

  <rect id="dim" x="${wide ? -600 : 0}" y="${wide ? -300 : -70}" width="${wide ? 1560 : 360}" height="${wide ? 900 : 410}" fill="#0B0F18" opacity="0" mask="url(#spotMask)" pointer-events="none"/>

  <!-- Clapper for ACTION -->
  <g id="clap" class="clap" transform="translate(146 30)">
    <rect x="0" y="12" width="68" height="40" rx="2" fill="${INK}" stroke="#fff" stroke-width="1.5"/>
    <text x="34" y="37" text-anchor="middle" ${HAND} font-size="8.5" fill="#fff" id="clapText">TAKE 1</text>
    <g class="stick"><rect x="0" y="2" width="68" height="10" fill="#fff" stroke="${INK}" stroke-width="1.5"/>
      <g fill="${INK}"><path d="M6 2 h8 l-6 10 h-8z"/><path d="M22 2 h8 l-6 10 h-8z"/><path d="M38 2 h8 l-6 10 h-8z"/><path d="M54 2 h8 l-6 10 h-8z"/></g></g>
  </g>
</svg>`;
  }

  /* ---------- Production office: viewBox 0 0 360 470 ---------- */

  const ROOMS = {
    edit:    { x: 24,  y: 56,  w: 152, h: 112 },
    craft:   { x: 184, y: 56,  w: 152, h: 112 },
    gear:    { x: 24,  y: 176, w: 152, h: 112 },
    kitchen: { x: 184, y: 176, w: 152, h: 112 },
  };

  function roomFurniture(id) {
    const s = S(1.3);
    if (id === 'edit') return `
      <rect x="20" y="62" width="112" height="8" fill="#8B6A43" ${s}/><path d="M28 70 V96 M124 70 V96" ${s} stroke-width="2"/>
      <rect x="30" y="30" width="44" height="30" rx="2" fill="#22262B" ${s}/><rect x="78" y="30" width="44" height="30" rx="2" fill="#22262B" ${s}/>
      <g><rect x="34" y="34" width="36" height="16" fill="#344F70"/><rect x="82" y="44" width="10" height="3" fill="#E7B84F"/><rect x="94" y="44" width="16" height="3" fill="#D86B56"/><rect x="84" y="49" width="20" height="3" fill="#7D9E91"/><rect x="104" y="49" width="12" height="3" fill="#8EA3C2"/><path d="M98 36 V58" stroke="#fff" stroke-width="1"/></g>
      <g transform="translate(76 96) scale(1.15)">${puppet({ color: '#5E5A52', look: { skin: '#E0B08A', hair: '#2A1D14', top: 'none', glasses: true } })}</g>
      <rect x="62" y="72" width="28" height="22" rx="3" fill="#2F3440" ${s}/>`;
    if (id === 'craft') return `
      <rect x="14" y="58" width="124" height="38" fill="#E59380" ${s}/><rect x="10" y="54" width="132" height="6" fill="#F2E9D8" ${s}/>
      <rect x="20" y="28" width="20" height="26" rx="3" fill="#9AA0A8" ${s}/><rect x="40" y="40" width="6" height="3" fill="#22262B"/>
      <path d="M56 54 h36 l-3 -10 h-30z" fill="#F4B6C2" ${s}/><g fill="#E3A85A" ${s} stroke-width="1"><circle cx="64" cy="48" r="4"/><circle cx="74" cy="48" r="4"/><circle cx="84" cy="48" r="4"/></g>
      <g fill="#D86B56" ${s} stroke-width="1"><rect x="100" y="44" width="8" height="10" rx="1.5"/><rect x="112" y="44" width="8" height="10" rx="1.5"/></g>
      <path d="M128 54 q0 -18 6 -26 q4 10 0 26z" fill="#7FB069" ${s}/>
      <text x="76" y="80" text-anchor="middle" ${HAND} font-size="10" fill="#fff">CRAFTY</text>`;
    if (id === 'gear') return `
      <rect x="8" y="8" width="136" height="88" fill="url(#mesh)"/>
      <path d="M12 44 H140 M12 74 H140" ${s} stroke-width="2.4"/>
      <g fill="#F4EEDF" ${s}><polygon points="20,26 40,26 44,42 16,42"/><polygon points="52,26 72,26 76,42 48,42"/></g>
      <g fill="#22262B"><rect x="88" y="28" width="22" height="16" rx="2"/><rect x="114" y="32" width="20" height="12" rx="2"/></g>
      <g fill="#E7B84F" ${s} stroke-width="1"><ellipse cx="26" cy="68" rx="10" ry="5"/><ellipse cx="46" cy="68" rx="10" ry="5"/></g>
      <path d="M100 96 V52 M90 96 l10 -10 l10 10 M100 54 H128" ${s} stroke-width="2"/>`;
    if (id === 'kitchen') return `
      <rect x="10" y="58" width="96" height="38" fill="#F2E9D8" ${s}/><rect x="10" y="54" width="96" height="6" fill="#8B6A43" ${s}/>
      <rect x="18" y="44" width="32" height="10" fill="#22262B"/><path d="M24 44 h20 l-2 -12 h-16z" fill="#7A7F88" ${s}/>
      <g class="steam" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"><path d="M30 28 q-2 -4 0 -8"/><path d="M38 28 q2 -4 0 -8"/></g>
      <g transform="translate(58 30) scale(.4)">${burger(0)}</g>
      <rect x="112" y="16" width="30" height="80" rx="3" fill="#E6E9EE" ${s}/><path d="M112 44 H142 M136 26 V36 M136 52 V64" ${s} stroke-width="1.6"/>`;
    return '';
  }

  // The room that was just built shows its "building" picture for a moment (the office sets it, then clears it)
  let BUILDING = null;
  const setBuilding = (id) => { BUILDING = id || null; };

  function room(id, def, owned, affordable, cost) {
    const r = ROOMS[id];
    const roomState = owned ? (BUILDING === id && hasArt(`hq.room.${id}`, 'building') ? 'building' : 'built') : 'for-rent';
    const roomArt = hasArt(`hq.room.${id}`, roomState) ? loader().use(`hq.room.${id}`, roomState) : '';
    const wall = owned ? { edit: '#3E4C63', craft: '#F2D7A6', gear: '#D8D2C4', kitchen: '#CFE0D6' }[id] : '#4A4743';
    const floor = owned ? '#B98552' : '#3A3734';
    const s = S(1.6);
    const cardArt = !owned && hasArt('hq.for-rent');
    const priceText = `$${cost.toLocaleString('en-US')}`;
    const body = owned ? (roomArt ? '' : roomFurniture(id)) :
      `${roomArt ? '' : '<path d="M30 30 h92 v40 h-92z" fill="#5E5A52" opacity=".5"/>'}
       ${cardArt ? `<g transform="rotate(-3 76 16)">${loader().use('hq.for-rent', 'default', { x: 76, y: 16 })}
         <text x="76" y="50" text-anchor="middle" ${UI} font-weight="700" font-size="10.5" fill="${INK}">${priceText}</text></g>` :
       `<g transform="rotate(-4 76 50)"><rect x="34" y="30" width="84" height="40" fill="#F2E9D8" ${s}/>
       <text x="76" y="48" text-anchor="middle" ${HAND} font-size="13" fill="#D86B56">FOR RENT</text>
       <text x="76" y="63" text-anchor="middle" ${UI} font-weight="700" font-size="9.5" fill="${INK}">${priceText}</text></g>`}
       ${affordable ? `<circle cx="132" cy="22" r="9" fill="#E7B84F" ${s}/><text x="132" y="26" text-anchor="middle" ${HAND} font-size="11" fill="${INK}">!</text>` : ''}`;
    return `<g class="room ${owned ? 'owned' : 'locked'}${affordable ? ' affordable' : ''}" data-room="${id}" transform="translate(${r.x} ${r.y})">
      ${roomArt ? `<rect width="${r.w}" height="${r.h}" fill="${wall}" ${s}/>${roomArt}` : `<rect width="${r.w}" height="${r.h}" fill="${wall}" ${s}/>
      ${owned ? `<ellipse cx="${r.w / 2}" cy="6" rx="34" ry="10" fill="#FFE7A3" opacity=".45" filter="url(#glow)"/>` : ''}
      <rect y="${r.h - 14}" width="${r.w}" height="14" fill="${floor}" ${s}/>`}
      <g filter="url(#cut)">${body}</g>
      <g transform="translate(6 -6) rotate(-2)"><rect width="${def.name.length * 5.6 + 14}" height="15" fill="${owned ? '#F2E9D8' : '#CDBFA5'}" ${s} stroke-width="1.2"/>
      <text x="7" y="11" ${UI} font-weight="700" font-size="9" fill="${INK}">${def.name.toUpperCase()}</text></g>
      <rect width="${r.w}" height="${r.h}" fill="transparent"/>
    </g>`;
  }

  // A built room on its own, for the room card
  function roomPreview(def) {
    const r = ROOMS[def.id];
    return `<svg viewBox="${r.x - 4} ${r.y - 12} ${r.w + 8} ${r.h + 16}" aria-hidden="true">${room(def.id, def, true, false, def.cost)}</svg>`;
  }

  // The lobby, job board, front desk and street from the batch 6 pictures
  function lobbyAndStreetArt() {
    const L = loader();
    const LX = 24, LY = 300;                 // the lobby picture is 312 x 60
    const BX = 88, BY = 311, BK = .55;       // the job board, drawn at 55% of its 116 x 57 so it fits the wall between the door and the desk
    const flyer = (x, y, rot, k, inner) => `<g transform="rotate(${rot} ${x} ${y})">${L.use('hq.flyer', 'default', { x, y, k })}${inner}</g>`;
    return `
  <!-- Lobby -->
  ${L.use('hq.lobby', 'default', { x: LX, y: LY })}
  <g class="jobboard" data-jobs="1" filter="url(#cut)">
    ${L.use('hq.jobboard', 'default', { x: BX, y: BY, k: BK })}
    ${flyer(BX + 15, BY + 3, -5, .6, `<g transform="translate(${BX + 6.5} ${BY + 9}) scale(.17)">${burger(0)}</g>`)}
    ${flyer(BX + 44, BY + 3, 4, .6, `<path d="M${BX + 38} ${BY + 11} h12 M${BX + 38} ${BY + 14} h9" stroke="${INK}" stroke-width=".8" stroke-linecap="round" opacity=".6"/>`)}
    <rect x="${BX - 4}" y="${BY - 4}" width="${116 * BK + 8}" height="${57 * BK + 8}" fill="transparent"/>
  </g>
  <defs><clipPath id="deskClip"><rect x="150" y="290" width="70" height="46"/></clipPath></defs>
  <g clip-path="url(#deskClip)"><g transform="translate(178 352) scale(.78)" filter="url(#shadow)">${puppet({ color: '#E7B84F', look: { skin: '#D7A27C', hair: '#2A1C14', top: 'bun', earring: true } })}</g></g>
  <!-- Street and van -->
  ${L.use('hq.street', 'default', { x: 0, y: 372 })}
  <rect x="0" y="435" width="360" height="11" fill="#39383C"/>
  <g filter="url(#cut)">${L.use('hq.van', 'default', { x: 250, y: 438 })}</g>
`;
  }

  function officeMarkup(company, owned, bank) {
    const s = S();
    const L = loader();
    // The batch 6 lobby and street are shorter than the first layout allowed (60 and 64 units against 84 and 86), so with
    // them the building ends at y 372 and the whole frame is 446 tall. Without them the first layout is drawn as before
    const NEWHQ = hasArt('hq.lobby') && hasArt('hq.street');
    const skyArt = NEWHQ && hasArt('hq.sky');
    const H = NEWHQ ? 446 : 470;
    const rooms = company.rooms.map(r => room(r.id, r, owned.includes(r.id), !owned.includes(r.id) && bank >= r.cost, r.cost)).join('');
    const name = company.name.toUpperCase();
    return `
<svg class="office" viewBox="0 0 360 ${H}" role="img" aria-label="${company.name} office">
  ${skyArt ? `<rect width="360" height="${H}" fill="#80AABF"/>${L.use('hq.sky', 'default', { x: 11, y: 0, k: 1.12 })}` : `<rect width="360" height="${H}" fill="#A9C6C0"/>
  <circle cx="318" cy="34" r="20" fill="#E7B84F" filter="url(#cut)"/>`}
  ${hasArt('hq.cloud-wide') && hasArt('hq.cloud-small') ? `<g filter="url(#cut)">${L.use('hq.cloud-wide', 'default', { x: 4, y: 12 })}${L.use('hq.cloud-small', 'default', { x: 300, y: 20 })}</g>` :
  `<g fill="#F2E9D8" filter="url(#cut)"><path d="M20 30 q8 -14 22 -6 q10 -10 22 0 q12 0 10 10 h-56z"/><path d="M250 70 q6 -10 16 -4 q8 -8 16 0 q8 0 8 8 h-42z" opacity=".8"/></g>`}

  <!-- Building -->
  <rect x="12" y="44" width="336" height="${NEWHQ ? 328 : 340}" fill="url(#brick)" ${s} filter="url(#cut)"/>
  <rect x="8" y="40" width="344" height="10" fill="#C4644D" ${s}/>
  ${hasArt('hq.sign', 'on') ? `<g filter="url(#cut)"><path d="M100 36 V44 M260 36 V44" ${s}/>${hasArt('hq.sign', 'off') ? `<g>${loader().use('hq.sign', 'off')}<g class="bulbs">${loader().use('hq.sign', 'on')}</g></g>` : loader().use('hq.sign', 'on')}</g>
  <text x="180" y="${name.length > 18 ? 28 : 29.5}" text-anchor="middle" ${HAND} font-size="${name.length > 18 ? 12 : 14.5}" fill="${INK}">${name}</text>` : `<g filter="url(#cut)">
    <rect x="70" y="6" width="220" height="34" fill="#22262B" ${s}/>
    <text x="180" y="29" text-anchor="middle" ${HAND} font-size="${name.length > 18 ? 12.5 : 15}" fill="#E7B84F">${name}</text>
    <g fill="#FFE7A3">${Array.from({ length: 12 }, (_, i) => `<circle cx="${78 + i * 18.6}" cy="10" r="1.7"/><circle cx="${78 + i * 18.6}" cy="36" r="1.7"/>`).join('')}</g>
    <path d="M100 40 V44 M260 40 V44" ${s}/>
  </g>`}
  ${rooms}

${NEWHQ ? lobbyAndStreetArt() : `  <!-- Lobby: job board, door, front desk -->
  <rect x="24" y="296" width="312" height="84" fill="#F2E9D8" ${S(1.6)}/>
  <rect x="24" y="366" width="312" height="14" fill="url(#tile)" ${S(1.2)}/>
  <g class="jobboard" data-jobs="1" filter="url(#cut)">
    <rect x="34" y="304" width="116" height="58" fill="#B98552" ${S(1.6)}/>
    <rect x="38" y="308" width="108" height="50" fill="#C79A64"/>
    <g transform="rotate(-4 64 332)"><rect x="44" y="312" width="44" height="40" fill="#fff" ${S(1)}/><text x="66" y="324" text-anchor="middle" ${UI} font-weight="700" font-size="6.5" fill="${INK}">BURGER JOB</text><g transform="translate(51 326) scale(.5)">${burger(0)}</g><circle cx="66" cy="313" r="2.2" fill="#D86B56"/></g>
    <g transform="rotate(5 118 332)"><rect x="96" y="312" width="44" height="40" fill="#F2E9D8" ${S(1)}/><text x="118" y="324" text-anchor="middle" ${UI} font-weight="700" font-size="6.5" fill="${INK}">TACO TRUCK</text><text x="118" y="340" text-anchor="middle" ${HAND} font-size="8" fill="#D86B56">SOON</text><circle cx="118" cy="313" r="2.2" fill="#7D9E91"/></g>
    <rect x="34" y="304" width="116" height="58" fill="transparent"/>
  </g>
  <text x="92" y="376" text-anchor="middle" ${UI} font-weight="700" font-size="8" fill="${INK}">JOB BOARD</text>
  <g filter="url(#cut)">
    <rect x="160" y="310" width="40" height="56" fill="#344F70" ${S(1.6)}/><circle cx="192" cy="340" r="2" fill="#E7B84F"/>
    <rect x="164" y="314" width="32" height="20" fill="#A9C6C0" opacity=".6"/>
  </g>
  <g filter="url(#cut)">
    <rect x="232" y="334" width="80" height="32" fill="#7D9E91" ${S(1.6)}/><rect x="228" y="330" width="88" height="6" fill="#F2E9D8" ${S(1.2)}/>
    <path d="M322 366 q0 -30 6 -42 q6 12 0 42z" fill="#7FB069" ${S(1.2)}/><rect x="316" y="356" width="14" height="10" fill="#D86B56" ${S(1.2)}/>
  </g>
  <g transform="translate(272 334) scale(1.1)" filter="url(#shadow)">${puppet({ color: '#E7B84F', look: { skin: '#D7A27C', hair: '#2A1C14', top: 'bun', earring: true } })}</g>

  <!-- Street and van -->
  <rect x="0" y="384" width="360" height="26" fill="#CFC4B0"/>
  <path d="M0 384 H360" ${S(1.2)}/>
  <rect x="0" y="410" width="360" height="60" fill="#5E5A52"/>
  <g stroke="#F2E9D8" stroke-width="3" stroke-dasharray="16 12"><path d="M0 446 H360"/></g>
  <g filter="url(#cut)">
    <path d="M190 432 V398 q0 -6 6 -6 h96 q8 0 14 8 l14 16 q4 4 4 10 v6z" fill="#F2E9D8" ${S(1.6)}/>
    <path d="M296 398 h8 l14 18 h-22z" fill="#A9C6C0" ${S(1.2)}/>
    <rect x="190" y="414" width="134" height="8" fill="#D86B56"/>
    <text x="242" y="410" text-anchor="middle" ${HAND} font-size="9" fill="${INK}">GRIP + ELECTRIC</text>
    <circle cx="216" cy="434" r="9" fill="${INK}"/><circle cx="216" cy="434" r="3.5" fill="#9AA0A8"/>
    <circle cx="300" cy="434" r="9" fill="${INK}"/><circle cx="300" cy="434" r="3.5" fill="#9AA0A8"/>
  </g>`}
</svg>`;
  }

  /* ---------- Icons ---------- */

  const DEPT_ICON = {
    grip: '<path d="M4 20l9-9M14 4l6 6-3 3-6-6z"/>',
    lighting: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
    camera: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3z"/>',
    art: '<path d="M4 20c4 0 6-2 6-5l7-7a2 2 0 0 0-3-3l-7 7c-3 0-3 4-3 8z"/>',
    fix: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  };
  function deptIcon(key, size) {
    return `<svg width="${size || 16}" height="${size || 16}" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DEPT_ICON[key] || ''}</svg>`;
  }

  const ICON = {
    fix: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DEPT_ICON.fix}</svg>`,
    rent: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 16V7h12v9M14 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>`,
    bounce: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>`,
  };

  // HUD pieces delivered as images, drawn inside a small SVG: the art is centered on 0,0 in CSS pixels
  function hudImg(id, state, half, w, h) {
    const L = loader();
    if (!L || !L.has(id, state)) return '';
    return `<svg${w ? ` width="${w}" height="${h || w}"` : ''} viewBox="${-half} ${-half} ${2 * half} ${2 * half}" aria-hidden="true">${L.use(id, state, { x: 0, y: 0 })}</svg>`;
  }
  function pauseSVG(px) {
    return hudImg('ui.icon-pause', 'default', 15, px) || `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>`;
  }
  // A shot's mark in the shot list: done (check) or pending (ring). Returns '' with no art, so the CSS circle stays.
  function shotMark(kind) { return hudImg('ui.shot-status', kind, 13); }
  function starSVG(on) {
    const art = hudImg('ui.star', on ? 'on' : 'off', 17);
    if (art) return art;
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.9 6.1 6.7.8-4.9 4.6 1.3 6.6L12 17.2l-6 3.3 1.3-6.6-4.9-4.6 6.7-.8z" fill="${on ? '#E7B84F' : '#E6D8BE'}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  }

  function clapperSVG() {
    return `<svg viewBox="0 0 100 70" aria-hidden="true">
      <rect x="4" y="22" width="92" height="44" rx="3" fill="#22262B" stroke="#F2E9D8" stroke-width="2"/>
      <g class="clap-stick"><rect x="4" y="8" width="92" height="13" fill="#F2E9D8" stroke="#22262B" stroke-width="2"/>
      <g fill="#22262B"><path d="M12 8h10l-7 13H5z"/><path d="M34 8h10l-7 13H27z"/><path d="M56 8h10l-7 13H49z"/><path d="M78 8h10l-7 13H71z"/></g></g>
      <text x="50" y="50" text-anchor="middle" ${HAND} font-size="17" fill="#F2E9D8">ACTION</text>
    </svg>`;
  }

  root.WrapArt = {
    DEPT_COLOR, heroSpot, keyLens, wedgeTransform, BEAM_LEN, WIDE_VIEW, IDLE_WIDE, STATIONS, IDLE, CLIENT, AGENCY,
    globalDefs, puppet, faceSVG, propInner, propSVG, setMarkup, officeMarkup, setBuilding, roomPreview, cartBurger, carryStart, heldItem, puffMarkup,
    deptIcon, ICON, starSVG, pauseSVG, shotMark, clapperSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
