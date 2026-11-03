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
      <filter id="cut" x="-10%" y="-10%" width="120%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.07" numOctaves="2" seed="4" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feDropShadow in="d" dx="1.3" dy="1.9" stdDeviation="0.8" flood-color="#2A1E12" flood-opacity=".38"/>
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
    </defs></svg>`;
  }

  /* ---------- Puppets (feet at 0,0, about 48 units tall) ---------- */

  function puppet(c) {
    const L = c.look || {};
    const skin = L.skin || '#E1B48E';
    const hair = L.hair || '#2A1D14';
    const body = c.color || DEPT_COLOR[c.dept] || '#ccc';
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
    const prop = L.prop === 'latte' ? `<g transform="translate(11 -15)"><rect x="-2.5" y="-5" width="5" height="6" rx="1" fill="#F2E9D8" ${s} stroke-width=".8"/><rect x="-2.6" y="-3" width="5.2" height="2" fill="#8B5A3C"/></g>`
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
    return `<svg class="${cls || ''}" viewBox="-13.5 -51 27 30" aria-hidden="true">${puppet(c)}</svg>`;
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

  function propInner(shotId, state) {
    state = state || {};
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
    return `<g stroke="${INK}" stroke-width="1.6">${layers.slice(0, n).join('')}</g>`;
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

  function setMarkup() {
    const s = S();
    return `
<svg class="set" id="setSvg" viewBox="0 -70 360 410" role="img" aria-label="The tabletop set">
  <rect x="0" y="-70" width="360" height="410" fill="#344F70"/>
  <path d="M0 -70 H130 L122 150 H0Z" fill="#3B5878"/>

  <!-- Ceiling grid with hanging practicals and a flag -->
  <g stroke="#1C2C42" stroke-width="3.2" stroke-linecap="round"><path d="M-4 -54 H364"/><path d="M-4 -36 H364" opacity=".55"/></g>
  <g filter="url(#cut)">
    <path d="M58 -54 V-28" ${s} stroke-width="1.6"/><path d="M46 -16 L52 -30 H64 L70 -16Z" fill="#D86B56" ${s}/>
    <path d="M306 -54 V-26" ${s} stroke-width="1.6"/><path d="M294 -14 L300 -28 H312 L318 -14Z" fill="#7D9E91" ${s}/>
    <path d="M192 -54 V-46" ${s} stroke-width="1.6"/><rect x="170" y="-46" width="44" height="26" fill="#22262B"/>
  </g>
  <ellipse cx="58" cy="-8" rx="16" ry="7" fill="#FFE7A3" opacity=".35" filter="url(#glow)"/>
  <ellipse cx="306" cy="-6" rx="16" ry="7" fill="#FFE7A3" opacity=".35" filter="url(#glow)"/>

  <rect x="284" y="10" width="68" height="128" fill="url(#corrDark)" filter="url(#cut)"/>
  <g filter="url(#cut)" transform="rotate(-5 42 36)">
    <rect x="18" y="16" width="50" height="38" fill="#F2E9D8"/>
    <text x="43" y="32" text-anchor="middle" ${HAND} font-size="10" fill="#D86B56">BIG</text>
    <text x="43" y="46" text-anchor="middle" ${HAND} font-size="10" fill="#D86B56">BUN</text>
  </g>
  <rect x="35" y="12" width="16" height="6" fill="#E7B84F" opacity=".85" transform="rotate(-8 43 15)"/>

  <!-- Floor -->
  <path d="M0 152 L360 145 L360 340 L0 340Z" fill="#D8C29C"/>
  <path d="M0 152 L360 145" stroke="${INK}" stroke-width="1.5" opacity=".35"/>
  <path d="M0 196 q60 -6 130 2 t160 -4 t70 4 V260 H0Z" fill="#CFB78F" opacity=".55"/>
  <path d="M0 280 q90 -8 190 2 t170 -2 V340 H0Z" fill="#CDB48A" opacity=".5"/>
  <g stroke="#E7B84F" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M176 230 l10 6 M186 230 l-10 6"/><path d="M322 232 l9 5 M331 232 l-9 5"/><path d="M98 226 l9 5 M107 226 l-9 5"/></g>
  <path d="M74 198 q30 16 70 8 t90 6 q30 4 60 -2 q20 30 -40 70" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".6"/>

  <!-- Hero set build pieces: legs, tabletop, sweep, flag -->
  <g id="pc-sweep" filter="url(#cut)"><path id="sweep" d="M126 30 H234 V124 Q234 136 247 137.5 H113 Q126 136 126 124Z" fill="#E7B84F" ${s}/></g>
  <g id="pc-flag" filter="url(#cut)"><path d="M262 200 V64" ${s} stroke-width="2"/><rect x="250" y="62" width="25" height="44" fill="${INK}"/><path d="M256 200 h12" ${s} stroke-width="3"/></g>
  <g id="pc-legs" filter="url(#cut)"><rect x="120" y="150" width="7" height="48" fill="#8B6A43" ${s}/><rect x="233" y="150" width="7" height="48" fill="#8B6A43" ${s}/><rect x="150" y="150" width="6" height="42" fill="#7A5A35" ${s}/><rect x="205" y="150" width="6" height="42" fill="#7A5A35" ${s}/></g>
  <g id="pc-top" filter="url(#cut)"><rect x="112" y="137" width="136" height="7" fill="#C2915A" ${s}/><rect x="114" y="144" width="132" height="10" fill="url(#corr)" ${s}/></g>

  <!-- Rig for cheese pull / sauce pour -->
  <g id="rig" filter="url(#cut)">
    <g id="rig-pole"><path d="M292 202 V54" ${s} stroke-width="2.4"/><path d="M282 202 l10 -14 l10 14" fill="none" ${s} stroke-width="2"/></g>
    <g id="rig-arm"><path d="M292 58 H196" ${s} stroke-width="2.4"/><rect x="286" y="53" width="12" height="9" rx="2" fill="#5E5A52" ${s}/></g>
    <g id="rig-fork"><path d="M197 58 V74" ${s} stroke-width="2"/><path d="M191 74 h12 M193 74 v8 M197 74 v8 M201 74 v8" ${s} stroke-width="1.4"/></g>
    <g id="rig-bottle"><path d="M197 58 V66" ${s} stroke-width="2"/><g transform="rotate(28 196 82)"><rect x="189" y="66" width="14" height="26" rx="4" fill="#C8452F" ${s}/><rect x="193" y="92" width="6" height="6" fill="#F2E9D8" ${s}/><rect x="190" y="72" width="12" height="8" fill="#F2E9D8"/></g></g>
  </g>

  <polygon id="beam" points="96,78 76,94 154,136 222,136" fill="#FFE7A3" opacity="0"/>
  <g id="prop" transform="translate(150 94)" filter="url(#cut)"></g>
  <path id="pour" class="pour" d="M186 100 q-3 6 -2 12" fill="none" stroke="#C8452F" stroke-width="3" stroke-linecap="round" opacity="0"/>
  <g id="frameMarks" fill="none" stroke="#D86B56" stroke-width="2.6" stroke-linecap="round" opacity="0">
    <path d="M146 92 v-8 h10"/><path d="M214 92 v-8 h-10"/><path d="M146 132 v8 h10"/><path d="M214 132 v8 h-10"/>
  </g>

  <!-- Light stand -->
  <g filter="url(#cut)">
    <path d="M58 200 L72 158 L86 200 M72 158 V200" fill="none" ${s} stroke-width="2"/>
    <path d="M72 158 V76" ${s} stroke-width="2.4"/>
    <g transform="rotate(20 72 76)">
      <polygon points="52,58 92,58 100,92 44,92" fill="#F4EEDF" ${s}/>
      <rect id="lightFace" x="48" y="86" width="48" height="6" fill="#7A7468"/>
    </g>
  </g>
  <g id="dead" opacity="0">
    <g stroke="#D86B56" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M98 64 l7 -4 l-2 6 l8 -3"/><path d="M48 60 l-6 -6 l1 6 l-7 -3"/></g>
    <circle cx="88" cy="48" r="9" fill="#D86B56" stroke="${INK}" stroke-width="1.5"/><text x="88" y="53" text-anchor="middle" ${HAND} font-size="13" fill="#fff">!</text>
  </g>

  <!-- Camera on sticks -->
  <g filter="url(#cut)">
    <path d="M290 204 L304 152 L318 204 M304 152 V204" fill="none" ${s} stroke-width="2"/>
    <rect x="288" y="126" width="36" height="24" rx="3" fill="#3B4048" ${s}/>
    <rect x="270" y="131" width="19" height="14" rx="2" fill="${INK}"/>
    <rect x="296" y="119" width="16" height="8" rx="2" fill="#3B4048" ${s}/>
    <circle id="recDot" cx="318" cy="132" r="2.6" fill="#5A2A24"/>
  </g>

  <!-- Art cart -->
  <g filter="url(#cut)">
    <rect x="10" y="172" width="70" height="8" fill="#F2E9D8" ${s}/>
    <path d="M16 180 V206 M74 180 V206 M16 196 H74" ${s} stroke-width="2"/>
    <circle cx="16" cy="209" r="3.5" fill="${INK}"/><circle cx="74" cy="209" r="3.5" fill="${INK}"/>
  </g>
  <g id="cartBurger" transform="translate(12 150) scale(.42)"></g>
  <g id="pot" transform="translate(44 156)">
    <g class="steam" id="steam" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0"><path d="M4 -2 q-2 -4 0 -7"/><path d="M10 -2 q2 -4 0 -7"/></g>
    <path d="M0 2 h16 l-1.5 13 h-13z" fill="#7A7F88" stroke="${INK}" stroke-width="1.3"/>
    <rect id="potCheese" x="1" y="2" width="14" height="0" fill="#F2C14E"/>
    <path d="M-2 2 h20" stroke="${INK}" stroke-width="1.6"/>
  </g>
  <g id="bowl" transform="translate(62 162)">
    <path d="M0 2 h16 q0 9 -8 9 q-8 0 -8 -9z" fill="#F2E9D8" stroke="${INK}" stroke-width="1.3"/>
    <path id="bowlSauce" d="M2 4 h12 q-1 4 -6 4 q-5 0 -6 -4z" fill="#C8452F" opacity="0"/>
  </g>

  <!-- Craft table (idle crew hang out here) -->
  <g filter="url(#cut)">
    <rect x="14" y="282" width="150" height="8" fill="#F2E9D8" ${s}/>
    <path d="M22 290 V318 M156 290 V318" ${s} stroke-width="2.2"/>
    <rect x="22" y="258" width="18" height="24" rx="3" fill="#9AA0A8" ${s}/><rect x="40" y="268" width="5" height="3" fill="${INK}"/>
    <path d="M58 276 h40 l-3 6 h-34z" fill="#F4B6C2" ${s}/><rect x="56" y="262" width="44" height="14" fill="#F4B6C2" ${s} transform="skewX(-10)"/>
    <g fill="#E3A85A" ${s} stroke-width="1"><circle cx="66" cy="274" r="4"/><circle cx="76" cy="274" r="4"/><circle cx="86" cy="274" r="4"/></g>
    <g fill="#F2E9D8" ${s} stroke-width="1"><rect x="112" y="272" width="7" height="10" rx="1"/><rect x="122" y="272" width="7" height="10" rx="1"/><rect x="132" y="272" width="7" height="10" rx="1"/></g>
  </g>
  <text x="90" y="303" text-anchor="middle" ${HAND} font-size="9" fill="${INK}" opacity=".7">CRAFTY</text>

  <!-- Video village: monitor, client and agency -->
  <g filter="url(#cut)">
    <path d="M224 334 V276 M212 334 h24" ${s} stroke-width="2.2"/>
    <rect x="194" y="236" width="60" height="40" rx="3" fill="#2F3440" ${s}/>
    <rect x="198" y="240" width="52" height="32" fill="#151820"/>
  </g>
  <g id="monView" transform="translate(208 243) scale(.53)"></g>
  <circle id="monRec" cx="245" cy="245" r="2.4" fill="#FF4B3A" opacity="0"/>
  <g transform="translate(286 318)" filter="url(#shadow)"><g transform="scale(1.2)">${puppet(CLIENT)}</g></g>
  <g transform="translate(334 320)" filter="url(#shadow)"><g transform="scale(1.2)">${puppet(AGENCY)}</g></g>
  <g filter="url(#cut)">
    <path d="M270 340 l8 -24 M302 340 l-8 -24 M318 340 l8 -24 M350 340 l-8 -24" ${s} stroke-width="2"/>
    <rect x="268" y="296" width="36" height="16" fill="#D86B56" ${s}/><text x="286" y="308" text-anchor="middle" ${UI} font-weight="700" font-size="7.5" fill="#fff">CLIENT</text>
    <rect x="316" y="298" width="36" height="16" fill="#22262B" ${s}/><text x="334" y="310" text-anchor="middle" ${UI} font-weight="700" font-size="7.5" fill="#fff">AGENCY</text>
  </g>
  <g id="clientBub" opacity="0">
    <path d="M232 228 h108 a4 4 0 0 1 4 4 v20 a4 4 0 0 1 -4 4 h-46 l-8 8 l-1 -8 h-53 a4 4 0 0 1 -4 -4 v-20 a4 4 0 0 1 4 -4z" fill="#fff" ${s} stroke-width="1.3"/>
    <text id="clientText" x="286" y="245" text-anchor="middle" ${UI} font-weight="700" font-size="8.5" fill="${INK}"></text>
  </g>

  <!-- Tap targets for stations -->
  <rect class="station-hit" data-station="light" x="36" y="44" width="78" height="168" rx="6"/>
  <rect class="station-hit" data-station="table" x="118" y="28" width="138" height="178" rx="6"/>
  <rect class="station-hit" data-station="camera" x="264" y="112" width="92" height="104" rx="6"/>
  <rect class="station-hit" data-station="cart" x="4" y="146" width="84" height="80" rx="6"/>

  <g id="crewLayer"></g>

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

  function room(id, def, owned, affordable, cost) {
    const r = ROOMS[id];
    const wall = owned ? { edit: '#3E4C63', craft: '#F2D7A6', gear: '#D8D2C4', kitchen: '#CFE0D6' }[id] : '#4A4743';
    const floor = owned ? '#B98552' : '#3A3734';
    const s = S(1.6);
    const body = owned ? roomFurniture(id) :
      `<path d="M30 30 h92 v40 h-92z" fill="#5E5A52" opacity=".5"/>
       <g transform="rotate(-4 76 50)"><rect x="34" y="30" width="84" height="40" fill="#F2E9D8" ${s}/>
       <text x="76" y="48" text-anchor="middle" ${HAND} font-size="13" fill="#D86B56">FOR RENT</text>
       <text x="76" y="63" text-anchor="middle" ${UI} font-weight="700" font-size="9.5" fill="${INK}">$${cost.toLocaleString('en-US')}</text></g>
       ${affordable ? `<circle cx="132" cy="22" r="9" fill="#E7B84F" ${s}/><text x="132" y="26" text-anchor="middle" ${HAND} font-size="11" fill="${INK}">!</text>` : ''}`;
    return `<g class="room ${owned ? 'owned' : 'locked'}${affordable ? ' affordable' : ''}" data-room="${id}" transform="translate(${r.x} ${r.y})">
      <rect width="${r.w}" height="${r.h}" fill="${wall}" ${s}/>
      ${owned ? `<ellipse cx="${r.w / 2}" cy="6" rx="34" ry="10" fill="#FFE7A3" opacity=".45" filter="url(#glow)"/>` : ''}
      <rect y="${r.h - 14}" width="${r.w}" height="14" fill="${floor}" ${s}/>
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

  function officeMarkup(company, owned, bank) {
    const s = S();
    const rooms = company.rooms.map(r => room(r.id, r, owned.includes(r.id), !owned.includes(r.id) && bank >= r.cost, r.cost)).join('');
    const name = company.name.toUpperCase();
    return `
<svg class="office" viewBox="0 0 360 470" role="img" aria-label="${company.name} office">
  <rect width="360" height="470" fill="#A9C6C0"/>
  <circle cx="318" cy="34" r="20" fill="#E7B84F" filter="url(#cut)"/>
  <g fill="#F2E9D8" filter="url(#cut)"><path d="M20 30 q8 -14 22 -6 q10 -10 22 0 q12 0 10 10 h-56z"/><path d="M250 70 q6 -10 16 -4 q8 -8 16 0 q8 0 8 8 h-42z" opacity=".8"/></g>

  <!-- Building -->
  <rect x="12" y="44" width="336" height="340" fill="url(#brick)" ${s} filter="url(#cut)"/>
  <rect x="8" y="40" width="344" height="10" fill="#C4644D" ${s}/>
  <g filter="url(#cut)">
    <rect x="70" y="6" width="220" height="34" fill="#22262B" ${s}/>
    <text x="180" y="30" text-anchor="middle" ${HAND} font-size="15" fill="#E7B84F">${name}</text>
    <g fill="#FFE7A3">${Array.from({ length: 12 }, (_, i) => `<circle cx="${78 + i * 18.6}" cy="10" r="1.7"/><circle cx="${78 + i * 18.6}" cy="36" r="1.7"/>`).join('')}</g>
    <path d="M100 40 V44 M260 40 V44" ${s}/>
  </g>
  ${rooms}

  <!-- Lobby: job board, door, front desk -->
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
  </g>
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

  function starSVG(on) {
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
    DEPT_COLOR, STATIONS, IDLE, CLIENT, AGENCY,
    globalDefs, puppet, faceSVG, propInner, propSVG, setMarkup, officeMarkup, roomPreview, cartBurger,
    deptIcon, ICON, starSVG, clapperSVG,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
