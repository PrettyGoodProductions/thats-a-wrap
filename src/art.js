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
      (loader() ? loader().floorShadow() : `<ellipse cx="0" cy="0" rx="12" ry="3.2" fill="#000" opacity=".2"/>`) +
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
  // Batch 7: delivered held props, hung by their grip point from the hand. Code-drawn items stay where art is missing
  const HELD_ART = { tool: { grip: 'hammer', lighting: 'gel-frame', camera: 'lens-case', art: 'tweezers' },
                     carry: { grip: 'sandbag', lighting: 'light-head', camera: 'lens-case', art: 'burger-plate' } };
  const GRIP_AT = { tool: { x: 19, y: -27 }, carry: { x: 12, y: -14 } }; // tool: where the reaching hand is mid-pump
  function heldItem(dept, kind) {
    const st = HELD_ART[kind] && HELD_ART[kind][dept];
    if (st && loader() && loader().has('crew.held', st)) return loader().use('crew.held', st, GRIP_AT[kind]);
    return (kind === 'carry' ? CARRY : kind === 'tool' ? TOOL : {})[dept] || '';
  }

  function puffMarkup(word) {
    const art = loader() && loader().has('fx.puff', 'default') ? loader().use('fx.puff', 'default', { x: 0, y: -1, k: 0.8 }) : '';
    return `<g class="puff">${art || `<g fill="#fff" stroke="${INK}" stroke-width="1.2"><circle r="9"/><circle cx="-10" cy="4" r="7"/><circle cx="10" cy="5" r="7"/><circle cx="2" cy="-8" r="6"/></g>`}
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
  // Station badge face: the delivered paper disc with a dept-colored rim and the delivered icon, or the drawn badge
  function badgeFace(dept) {
    const L = loader();
    const icon = L && L.has('ui.dept-icons', dept) && L.src('ui.dept-icons', dept);
    if (L && L.has('ui.station-badge', 'default') && icon) {
      return `<circle r="9.6" fill="${DEPT_COLOR[dept]}" stroke="${INK}" stroke-width="1.2"/>${L.use('ui.station-badge', 'default', { x: 0, y: 0, k: 0.82 })}` +
        `<image href="${icon}" x="-5.6" y="-5.6" width="11.2" height="11.2" preserveAspectRatio="xMidYMid meet"/>`;
    }
    return `<circle r="8.6" fill="${DEPT_COLOR[dept]}" stroke="${INK}" stroke-width="1.4"/>
      <g transform="translate(-6 -6) scale(.5)" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${DEPT_ICON[dept]}</g>`;
  }
  function stationBadge(id, dept, x, y) {
    return `<g class="sbadge" id="badge-${id}" transform="translate(${x} ${y})" pointer-events="none">
      <circle class="bring" r="11.5" fill="none" stroke="#4E8A62" stroke-width="3.4" stroke-dasharray="0 73" transform="rotate(-90)"/>
      ${badgeFace(dept)}
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
  ${hasArt('fx.spotlight') ? `<g id="spotGlow" opacity="0" pointer-events="none" style="mix-blend-mode:screen">${loader().use('fx.spotlight', 'default', { x: h.x, y: h.y - 16, k: 0.85 })}</g>` : ''}

  <!-- Clapper for ACTION -->
  <g id="clap" class="clap" transform="translate(146 30)">
    <rect x="0" y="12" width="68" height="40" rx="2" fill="${INK}" stroke="#fff" stroke-width="1.5"/>
    <text x="34" y="37" text-anchor="middle" ${HAND} font-size="8.5" fill="#fff" id="clapText">TAKE 1</text>
    <g class="stick"><rect x="0" y="2" width="68" height="10" fill="#fff" stroke="${INK}" stroke-width="1.5"/>
      <g fill="${INK}"><path d="M6 2 h8 l-6 10 h-8z"/><path d="M22 2 h8 l-6 10 h-8z"/><path d="M38 2 h8 l-6 10 h-8z"/><path d="M54 2 h8 l-6 10 h-8z"/></g></g>
  </g>
</svg>`;
  }

  /* ---------- Production HQ: a landscape cutaway diorama (HQ-Redesign.md, Nov 5) ----------
    HQ units. The building front (hq.shell) is 452 x 228 at (40, 56): two floors of four bays, each room an open box
    you look into. Delivered room art fills a cavity exactly; rooms without art are drawn here as a greybox cavity in
    the same geometry (back wall, side walls and ceiling receding to the center), so art can arrive room by room.
    Backdrop layers run far past the building so a screen of any shape shows more city, never empty bands.
  */
  const HQ = { x: 40, y: 56, w: 452, h: 228, floorY: { 2: 72, 1: 184 }, bayX: [54, 162, 270, 378], roomH: 96 };
  const HQ_VIEW = { x: 30, y: 14, w: 472, h: 302 };
  const esc = (t) => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
  const hqBox = (room) => {
    const b = room.bay;
    return { x: HQ.bayX[b.at - 1], y: HQ.floorY[b.floor], w: b.span === 2 ? 208 : 100, h: HQ.roomH };
  };
  const ROOM_PAINT = {
    office: { wall: '#E9D3A6', side: '#D9BC86', lit: '#F2E3C2' },
    edit:   { wall: '#46546B', side: '#3A465A', lit: '#56647B' },
    lobby:  { wall: '#E6DDC8', side: '#D2C5A8', lit: '#F1EADB' },
    art:    { wall: '#9DB7A6', side: '#88A291', lit: '#E8DDC5' },
    gear:   { wall: '#BDB6A6', side: '#A69E8C', lit: '#CFC9BB' },
    garage: { wall: '#8F969C', side: '#7B8288', lit: '#A3A9AE' },
    slot:   { wall: '#6E655A', side: '#5E564C', lit: '#7A7166' },
  };

  // An empty cavity: ceiling with beams, two side walls, back wall, wood floor and a hanging lamp, in local units
  function cavity(id, w, dark) {
    const p = ROOM_PAINT[id] || ROOM_PAINT.office;
    const s = S(1);
    const lamps = w > 150 ? [w * 0.3, w * 0.7] : [w / 2];
    const beams = Array.from({ length: Math.round(w / 18) }, (_, i) => 14 + (i + 0.5) * (w - 28) / Math.round(w / 18));
    return `<g class="cav${dark ? ' dark' : ''}">
      <rect width="${w}" height="96" fill="${p.wall}"/>
      <polygon points="0,0 ${w},0 ${w - 14},12 14,12" fill="#8A5A33"/>
      ${beams.map(x => `<path d="M${x} 12 L${(x - w / 2) * 1.16 + w / 2} 0" stroke="#6E4527" stroke-width="2.4"/>`).join('')}
      <polygon points="0,0 14,12 14,80 0,96" fill="${p.lit}"/>
      <polygon points="${w},0 ${w - 14},12 ${w - 14},80 ${w},96" fill="${p.side}"/>
      <polygon points="0,96 14,80 ${w - 14},80 ${w},96" fill="#C9955E"/>
      <path d="M14 12 V80 H${w - 14} V12" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1"/>
      ${lamps.map(x => `<path d="M${x} 12 V19" stroke="${INK}" stroke-width=".8"/><path d="M${x - 5} 23 q5 -6 10 0z" fill="#2E3238" ${s}/>
        ${dark ? '' : `<ellipse cx="${x}" cy="40" rx="${Math.min(30, w / 4)}" ry="24" fill="#FFE7A3" opacity=".22"/><circle cx="${x}" cy="23.5" r="1.6" fill="#FFE7A3"/>`}`).join('')}
      ${dark ? `<rect width="${w}" height="96" fill="#1E1B18" opacity=".55"/>` : ''}
    </g>`;
  }

  // Furniture for the rooms that have no art yet, one layer per level so upgrades add to what is there
  function greyFurniture(id, level, w) {
    const s = S(1);
    const out = [];
    if (id === 'office') {
      out.push(`<rect x="22" y="60" width="44" height="6" fill="#B98552" ${s}/><path d="M26 66 V80 M62 66 V80" ${s}/>
        <rect x="30" y="50" width="16" height="10" rx="1" fill="#2E3238"/><rect x="74" y="60" width="40" height="6" fill="#B98552" ${s}/><path d="M78 66 V80 M110 66 V80" ${s}/>
        <rect x="140" y="62" width="44" height="14" rx="4" fill="#D86B56" ${s}/><rect x="138" y="56" width="48" height="8" rx="4" fill="#C4644D" ${s}/>
        <path d="M188 80 q4 -24 0 -36 q-6 10 -2 36z" fill="#7FB069" ${s}/><rect x="184" y="72" width="10" height="8" fill="#D86B56" ${s}/>`);
      if (level >= 2) out.push(`<rect x="118" y="58" width="16" height="22" fill="#7D9E91" ${s}/><rect x="120" y="48" width="8" height="10" rx="2" fill="#9AA0A8" ${s}/><circle cx="131" cy="55" r="2.2" fill="#E7B84F" ${s}/>`);
      if (level >= 3) out.push(`<ellipse cx="96" cy="76" rx="20" ry="4" fill="#8B6A43" ${s}/>`);
    }
    if (id === 'edit') {
      out.push(`<rect x="22" y="60" width="56" height="6" fill="#8B6A43" ${s}/><path d="M26 66 V80 M74 66 V80" ${s}/>
        <rect x="26" y="44" width="22" height="15" rx="1" fill="#22262B" ${s}/><rect x="50" y="44" width="22" height="15" rx="1" fill="#22262B" ${s}/>
        <rect x="28" y="46" width="18" height="11" fill="#D86B56" opacity=".7"/><rect x="52" y="46" width="18" height="11" fill="#7FB0C9" opacity=".7"/>`);
      if (level >= 2) out.push(`<rect x="72" y="50" width="12" height="10" fill="#2E3238" ${s}/><g fill="#E7B84F"><circle cx="75" cy="55" r="1.4"/><circle cx="80" cy="55" r="1.4"/></g>`);
      if (level >= 3) out.push(`<rect x="16" y="62" width="6" height="18" fill="#22262B" ${s}/><rect x="78" y="62" width="6" height="18" fill="#22262B" ${s}/>`);
    }
    if (id === 'gear') {
      out.push(`<rect x="14" y="12" width="${w - 28}" height="68" fill="url(#mesh)" opacity=".7"/>
        <path d="M18 40 H82 M18 62 H82" stroke="#5E5A52" stroke-width="2"/>
        <g fill="#F4EEDF" ${s}><polygon points="22,30 34,30 36,40 20,40"/><polygon points="42,30 54,30 56,40 40,40"/></g>
        <g fill="#22262B"><rect x="60" y="30" width="16" height="10" rx="1.5"/><rect x="24" y="52" width="20" height="10" rx="1.5"/></g>
        <g fill="#E7B84F" ${s}><ellipse cx="58" cy="78" rx="7" ry="3"/><ellipse cx="70" cy="78" rx="7" ry="3"/></g>`);
      if (level >= 2) out.push(`<path d="M84 80 V44 M78 80 l6 -6 l6 6" stroke="${INK}" stroke-width="1.4" fill="none"/>`);
    }
    if (id === 'art') {
      out.push(`<rect x="34" y="60" width="40" height="6" fill="#B98552" ${s}/><path d="M38 66 V80 M70 66 V80" ${s}/>
        <rect x="18" y="30" width="20" height="40" fill="#C79A64" ${s}/><path d="M18 43 H38 M18 56 H38" ${s}/>`);
      if (level >= 2) out.push(`<rect x="76" y="34" width="12" height="40" rx="2" fill="#F2E9D8" ${s}/><rect x="60" y="52" width="14" height="4" fill="#2E3238"/>`);
      if (level >= 3) out.push(`<path d="M42 60 l6 -10 l6 10z" fill="#E6E9EE" ${s}/>`);
    }
    if (id === 'lobby') {
      out.push(`<rect x="18" y="26" width="24" height="54" fill="#344F70" ${s}/><circle cx="38" cy="54" r="1.6" fill="#E7B84F"/>
        <rect x="21" y="30" width="18" height="14" fill="#A9C6C0" opacity=".6"/>
        <path d="M88 80 q2 -22 -4 -30 q-6 12 0 30z" fill="#7FB069" ${s}/><rect x="82" y="72" width="10" height="8" fill="#D86B56" ${s}/>`);
    }
    if (id === 'garage') {
      out.push(`<rect x="14" y="12" width="72" height="34" fill="#C9CDD1" ${s}/><path d="${Array.from({ length: 6 }, (_, i) => `M14 ${17 + i * 5.5} H86`).join(' ')}" stroke="#9AA0A8" stroke-width="1"/>
        <rect x="18" y="52" width="30" height="20" fill="#B98552" ${s}/><path d="M22 56 h22 M22 62 h22 M22 68 h22" stroke="${INK}" stroke-width=".8"/>
        <rect x="60" y="64" width="18" height="16" fill="#E7B84F" ${s}/>`);
    }
    return out.join('');
  }
  // Furniture that stands in front of the crew (desk fronts), from the art or drawn
  function greyFront(id, level) {
    const s = S(1);
    if (id === 'lobby') return `<rect x="50" y="70" width="34" height="18" fill="#7D9E91" ${s}/><rect x="47" y="66" width="40" height="5" fill="#F2E9D8" ${s}/>`;
    if (id === 'art' && level >= 1) return `<rect x="34" y="60" width="40" height="6" fill="#B98552" ${s}/>`;
    return '';
  }

  // One room's picture inside its cavity: delivered art (hq.room.<id>) or the greybox, with crew standing inside
  function hqRoomPicture(room, level, building, crew) {
    const L = loader();
    const box = hqBox(room);
    const id = room.id;
    const fixed = !!room.fixed;
    const rented = !fixed && level < 1;
    const state = building ? 'building' : rented ? 'for-rent' : 'l' + Math.max(1, level);
    const art = hasArt(`hq.room.${id}`, state) ? L.use(`hq.room.${id}`, state, { x: 0, y: 0 }) : '';
    let pic;
    if (room.boarded) pic = cavity('slot', box.w, true);
    else if (art) pic = art;
    else if (building) pic = cavity(id, box.w) + `<g filter="url(#cut)"><path d="M20 80 L34 40 L48 80 M24 70 H44 M27 60 H41" stroke="#D86B56" stroke-width="2" fill="none"/>
      <path d="M52 56 h30 l6 24 h-42z" fill="#E6E9EE" stroke="${INK}" stroke-width="1"/></g>`;
    else pic = cavity(id, box.w, rented) + (rented ? `<path d="M30 80 q4 -18 20 -18 q16 0 18 18z" fill="#D8D2C4" opacity=".55"/>` : `<g filter="url(#cut)">${greyFurniture(id, level, box.w)}</g>`);
    const people = (crew || []).map(p => `<g transform="translate(${p.x} ${p.y || 90}) scale(${p.flip ? -0.62 : 0.62} 0.62)">${puppet(p.c)}</g>`).join('');
    const showFront = !building && !rented && !room.boarded;
    const front = showFront ? (hasArt(`hq.room.${id}`, 'front') ? L.use(`hq.room.${id}`, 'front', { x: 0, y: 0 }) : `<g filter="url(#cut)">${greyFront(id, level)}</g>`) : '';
    return `<g transform="translate(${box.x} ${box.y})"><svg width="${box.w}" height="${box.h}" overflow="hidden">${pic}${people}${front}</svg></g>`;
  }

  // What sits in front of the building: the room name tags, FOR RENT cards, planks on the empty slot, tap targets
  function hqRoomOverlay(room, level, upgrade, bank) {
    const L = loader();
    const box = hqBox(room);
    const s = S(1.2);
    const rented = !room.fixed && level < 1;
    const tagW = room.name.length * 4.6 + 12;
    let out = room.boarded ? '' : `<g transform="translate(${box.x + box.w / 2 - tagW / 2} ${box.y + 14}) rotate(-1.5)"><rect width="${tagW}" height="11" fill="${rented ? '#CDBFA5' : '#F2E9D8'}" ${S(.8)}/>
      <text x="${tagW / 2}" y="8" text-anchor="middle" ${UI} font-weight="700" font-size="7" fill="${INK}">${room.name.toUpperCase()}</text></g>`;
    if (room.boarded) {
      out += `<g filter="url(#cut)" transform="translate(${box.x} ${box.y})">
        <path d="M6 30 L94 70" stroke="#B98552" stroke-width="11"/><path d="M6 70 L94 30" stroke="#C79A64" stroke-width="11"/>
        <g transform="translate(50 52) rotate(-4)"><rect x="-26" y="-7" width="52" height="14" fill="#F2E9D8" ${S(.8)}/><text y="3.5" text-anchor="middle" ${HAND} font-size="9" fill="#D86B56">COMING SOON</text></g></g>`;
    }
    if (rented && upgrade) {
      const price = `$${upgrade.cost.toLocaleString('en-US')}`;
      const cx = box.x + box.w / 2, cy = box.y + 32;
      out += hasArt('hq.for-rent') ? `<g transform="rotate(-3 ${cx} ${cy})">${L.use('hq.for-rent', 'default', { x: cx, y: cy, k: .62 })}
          <text x="${cx}" y="${cy + 21}" text-anchor="middle" ${UI} font-weight="700" font-size="8" fill="${INK}">${price}</text></g>` :
        `<g transform="rotate(-4 ${cx} ${cy + 12})"><rect x="${cx - 30}" y="${cy}" width="60" height="28" fill="#F2E9D8" ${s}/>
          <text x="${cx}" y="${cy + 12}" text-anchor="middle" ${HAND} font-size="10" fill="#D86B56">FOR RENT</text>
          <text x="${cx}" y="${cy + 23}" text-anchor="middle" ${UI} font-weight="700" font-size="7.5" fill="${INK}">${price}</text></g>`;
    }
    if (upgrade && !upgrade.soon && bank >= upgrade.cost) {
      out += `<g class="ready-mark"><circle cx="${box.x + box.w - 12}" cy="${box.y + 30}" r="7" fill="#E7B84F" ${s}/><text x="${box.x + box.w - 12}" y="${box.y + 33.5}" text-anchor="middle" ${HAND} font-size="9" fill="${INK}">${rented ? '!' : '+'}</text></g>`;
    }
    return out + `<rect class="room-hit" data-room="${room.id}" x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="transparent"/>`;
  }

  // The building front, from hq.shell or drawn: roof cap, slab, piers and end walls with the openings left open
  function hqShell() {
    const L = loader();
    if (hasArt('hq.shell')) return L.use('hq.shell', 'default', { x: HQ.x, y: HQ.y });
    const s = S(1.2);
    const piers = [154, 262, 370].map(x => `<rect x="${x}" y="72" width="8" height="96" fill="url(#brick)"/>`).join('') +
      [154, 262, 370].map(x => `<rect x="${x}" y="184" width="8" height="96" fill="url(#brick)"/>`).join('');
    return `<g filter="url(#cut)"><rect x="40" y="56" width="452" height="16" fill="#C79A64" ${s}/><rect x="40" y="168" width="452" height="16" fill="#D8C29A" ${s}/>
      <rect x="40" y="72" width="14" height="208" fill="url(#brick)" ${s}/><rect x="478" y="72" width="14" height="208" fill="url(#brick)" ${s}/>${piers.replace(/<rect x="(154|262)" y="72"[^>]*>/g, (m, x) => x === '154' ? '' : m)}
      <rect x="40" y="280" width="452" height="4" fill="#B98552"/></g>`;
  }

  // Sky, city, trees, roof dressing and the marquee sign. The sign shows lit and does not blink: its off and on
  // drawings are not one master (Art-Batch-7-Validation), so a blink would make the board jump
  function hqBackdrop(name) {
    const L = loader();
    const s = S(1.2);
    const sky = `<rect x="-600" y="-300" width="1800" height="600" fill="#9CC3D3"/>` +
      (hasArt('hq.sky') ? L.use('hq.sky', 'default', { x: 60, y: -6, k: 1.6 }) : `<circle cx="452" cy="34" r="18" fill="#E7B84F" filter="url(#cut)"/>`) +
      (hasArt('hq.cloud-wide') && hasArt('hq.cloud-small') ? `<g filter="url(#cut)">${L.use('hq.cloud-wide', 'default', { x: -40, y: 24, k: 1.3 })}${L.use('hq.cloud-small', 'default', { x: 520, y: 30, k: 1.2 })}</g>` : '');
    const far = [[-420, 120], [-330, 80], [-250, 140], [-170, 96], [-100, 60], [500, 70], [560, 120], [640, 90], [720, 140], [800, 100], [880, 70]]
      .map(([x, h], i) => `<rect x="${x}" y="${170 - h}" width="${46 + (i % 3) * 14}" height="${h + 140}" fill="${i % 2 ? '#B7C9C7' : '#C7D3CC'}"/>`).join('');
    const near = [[-340, 70, '#D7A98A'], [-240, 96, '#C9B79B'], [-120, 54, '#B9C7A8'], [-30, 40, '#D9B28C'], [500, 60, '#C9B79B'], [600, 86, '#D7A98A'], [700, 50, '#B9C7A8'], [790, 74, '#D9B28C']]
      .map(([x, h, c]) => `<g filter="url(#cut)"><rect x="${x}" y="${232 - h}" width="84" height="${h + 60}" fill="${c}" ${S(.8)}/>
        ${Array.from({ length: 3 }, (_, r) => Array.from({ length: 3 }, (_, k) => `<rect x="${x + 12 + k * 24}" y="${244 - h + r * 20}" width="10" height="12" fill="#F2E9D8" opacity=".7"/>`).join('')).join('')}</g>`).join('');
    const trees = [-80, -10, 520, 590, 660].map((x, i) => `<g filter="url(#cut)"><rect x="${x + 16}" y="206" width="5" height="76" fill="#7A5634"/>
      <circle cx="${x + 18}" cy="${196 - (i % 2) * 10}" r="${26 - (i % 2) * 4}" fill="${i % 2 ? '#8DB06A' : '#A3BE72'}" ${S(.8)}/><circle cx="${x + 2}" cy="${214 - (i % 2) * 8}" r="16" fill="#97B66C" ${S(.8)}/></g>`).join('');
    const roof = `<g filter="url(#cut)">
      <rect x="62" y="22" width="30" height="30" rx="3" fill="#B98552" ${s}/><path d="M60 22 q17 -12 34 0z" fill="#8B6A43" ${s}/><path d="M66 52 V56 M88 52 V56" ${s}/>
      <path d="M446 54 l8 -14 M462 54 l-8 -14" ${s}/><ellipse cx="452" cy="36" rx="16" ry="8" transform="rotate(-25 452 36)" fill="#E6E9EE" ${s}/>
      <rect x="410" y="44" width="14" height="12" fill="#9AA0A8" ${s}/></g>`;
    const sign = hasArt('hq.sign', 'on') ? `<g class="hq-sign" data-rename="1" filter="url(#cut)"><path d="M196 52 V57 M336 52 V57" ${s}/>${L.use('hq.sign', 'on', { x: 266, y: 37, k: .82 })}</g>
      <text x="266" y="${name.length > 18 ? 40 : 41.5}" text-anchor="middle" ${HAND} font-size="${name.length > 18 ? 10 : 12}" fill="${INK}">${name}</text>` :
      `<g class="hq-sign" data-rename="1" filter="url(#cut)"><rect x="176" y="22" width="180" height="30" fill="#22262B" ${s}/><text x="266" y="42" text-anchor="middle" ${HAND} font-size="${name.length > 18 ? 11 : 13}" fill="#E7B84F">${name}</text></g>`;
    return { back: sky + far + near + trees, roof: roof + sign };
  }

  function hqStreet() {
    return `<rect x="-600" y="280" width="1800" height="20" fill="#D8CDB8"/><path d="M-600 280 H1200" stroke="${INK}" stroke-opacity=".35" stroke-width="1"/>
      <rect x="-600" y="298" width="1800" height="4" fill="#B5AA94"/><rect x="-600" y="302" width="1800" height="200" fill="#5E5A52"/>
      <path d="M-600 344 H1200" stroke="#F2E9D8" stroke-width="3" stroke-dasharray="18 14"/>`;
  }

  /*
    The whole office. o = { company, levels: { roomId: level }, bank, name, building (room id showing its building
    state), crew: [{ c, room, x, flip }] } with x in the room's own units.
  */
  function hqMarkup(o) {
    const L = loader();
    const { company, levels, bank } = o;
    const name = (o.name || company.name).toUpperCase();
    const bd = hqBackdrop(name);
    const nextUp = (room) => company.upgrades.find(u => u.room === room.id && u.level === (levels[room.id] || 0) + 1);
    const pics = company.rooms.map(r => hqRoomPicture(r, levels[r.id] || 0, o.building === r.id, (o.crew || []).filter(p => p.room === r.id))).join('');
    const overlays = company.rooms.map(r => hqRoomOverlay(r, levels[r.id] || 0, nextUp(r), bank)).join('');
    const officeBox = hqBox(company.rooms.find(r => r.id === 'office'));
    const BK = .5, BX = officeBox.x + 20, BY = officeBox.y + 22;
    const board = hasArt('hq.jobboard') ? `<g class="jobboard" data-jobs="1" filter="url(#cut)">${L.use('hq.jobboard', 'default', { x: BX, y: BY, k: BK })}
        ${hasArt('hq.flyer') ? `<g transform="rotate(-5 ${BX + 16} ${BY + 4})">${L.use('hq.flyer', 'default', { x: BX + 16, y: BY + 3, k: .55 })}<g transform="translate(${BX + 9} ${BY + 8}) scale(.15)">${burger(0)}</g></g>
        <g transform="rotate(4 ${BX + 42} ${BY + 4})">${L.use('hq.flyer', 'default', { x: BX + 42, y: BY + 3, k: .55 })}</g>` : ''}
        <rect x="${BX - 3}" y="${BY - 3}" width="${116 * BK + 6}" height="${57 * BK + 6}" fill="transparent"/></g>` :
      `<g class="jobboard" data-jobs="1" filter="url(#cut)"><rect x="${BX}" y="${BY}" width="58" height="30" fill="#B98552" ${S(1)}/><rect x="${BX + 6}" y="${BY + 4}" width="20" height="20" fill="#fff" ${S(.6)}/><rect x="${BX + 31}" y="${BY + 5}" width="20" height="20" fill="#F2E9D8" ${S(.6)}/></g>`;
    const van = hasArt('hq.van') ? `<g class="van" filter="url(#cut)">${L.use('hq.van', 'default', { x: 432, y: 318 })}</g>` : '';
    return `<svg class="hq-svg" viewBox="${HQ_VIEW.x} ${HQ_VIEW.y} ${HQ_VIEW.w} ${HQ_VIEW.h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(o.name || company.name)} office">
      ${bd.back}${hqStreet()}
      <rect x="40" y="56" width="452" height="228" fill="#3A3330"/>
      ${pics}
      <g filter="url(#shadow)">${hqShell()}</g>
      ${bd.roof}${overlays}${board}${van}
    </svg>`;
  }

  // A room on its own at a given level, for the room card
  function hqRoomPreview(company, roomId, level) {
    const r = company.rooms.find(x => x.id === roomId);
    const box = hqBox(r);
    return `<svg viewBox="${box.x - 2} ${box.y - 2} ${box.w + 4} ${box.h + 4}" aria-hidden="true">${hqRoomPicture(r, level, false, [])}
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="none" stroke="${INK}" stroke-width="2"/></svg>`;
  }

  /* ---------- Icons ---------- */

  const DEPT_ICON = {
    grip: '<path d="M4 20l9-9M14 4l6 6-3 3-6-6z"/>',
    lighting: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
    camera: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3z"/>',
    art: '<path d="M4 20c4 0 6-2 6-5l7-7a2 2 0 0 0-3-3l-7 7c-3 0-3 4-3 8z"/>',
    fix: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  };
  // Delivered icons are shown as images fitted to the box (each was drawn on its own canvas), drawn ones otherwise
  function iconImg(id, state, size, cls) {
    const L = loader();
    const src = L && L.src && L.has(id, state) && L.src(id, state);
    return src ? `<img class="${cls || 'aicon'}" src="${src}" width="${size}" height="${size}" alt="" style="object-fit:contain">` : '';
  }
  function deptIcon(key, size) {
    const art = iconImg('ui.dept-icons', key, size || 16);
    if (art) return art;
    return `<svg width="${size || 16}" height="${size || 16}" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DEPT_ICON[key] || ''}</svg>`;
  }

  const ICON = {
    fix: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DEPT_ICON.fix}</svg>`,
    rent: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 16V7h12v9M14 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="2"/><circle cx="17.5" cy="17.5" r="2"/></svg>`,
    bounce: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>`,
  };

  const CHAOS_ART = { fix: 'wrench', rent: 'van', bounce: 'lightning' };
  function chaosIcon(id) { return iconImg('ui.chaos-icons', CHAOS_ART[id], 34) || ICON[id] || ''; }

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
    const L = loader();
    if (L && ['muted', 'ready', 'rolling', 'stick'].every(st => L.has('ui.action', st))) {
      // Batch 5 ACTION art: the body in three states swapped by CSS, the stick hinged at its left end on top of the body
      const body = st => `<g class="ab ab-${st}">${L.use('ui.action', st, { x: 0, y: 0 })}</g>`;
      return `<svg class="art" viewBox="-73 -110 146 112" aria-hidden="true">${body('muted')}${body('ready')}${body('rolling')}
        <g class="clap-stick">${L.use('ui.action', 'stick', { x: -60.5, y: -99.2 })}</g>
        <text x="0" y="-36" text-anchor="middle" ${HAND} font-size="25" fill="#F2E9D8">ACTION</text></svg>`;
    }
    return `<svg viewBox="0 0 100 70" aria-hidden="true">
      <rect x="4" y="22" width="92" height="44" rx="3" fill="#22262B" stroke="#F2E9D8" stroke-width="2"/>
      <g class="clap-stick"><rect x="4" y="8" width="92" height="13" fill="#F2E9D8" stroke="#22262B" stroke-width="2"/>
      <g fill="#22262B"><path d="M12 8h10l-7 13H5z"/><path d="M34 8h10l-7 13H27z"/><path d="M56 8h10l-7 13H49z"/><path d="M78 8h10l-7 13H71z"/></g></g>
      <text x="50" y="50" text-anchor="middle" ${HAND} font-size="17" fill="#F2E9D8">ACTION</text>
    </svg>`;
  }

  root.WrapArt = {
    DEPT_COLOR, heroSpot, keyLens, wedgeTransform, BEAM_LEN, WIDE_VIEW, IDLE_WIDE, STATIONS, IDLE, CLIENT, AGENCY,
    globalDefs, puppet, faceSVG, propInner, propSVG, setMarkup, hqMarkup, hqRoomPreview, HQ, cartBurger, carryStart, heldItem, puffMarkup,
    deptIcon, ICON, chaosIcon, starSVG, pauseSVG, shotMark, clapperSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
