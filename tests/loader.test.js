// Run with: node --test tests/
// The asset loader: real art where a file exists, code placeholders everywhere else, no code changes to swap.
// Stand-in images come from tools/make_standins.py (committed under tests/fixtures/art).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const Loader = require('../src/loader.js');
const { PUPPET } = require('../src/slots.js');
globalThis.WrapLoader = Loader; // art.js looks the loader up on the global, as the page does
const A = require('../src/art.js') && globalThis.WrapArt;

const FIXTURES = path.join(__dirname, 'fixtures', 'art');
let buildPack;
test.before(async () => { ({ buildPack } = await import('../tools/pack-art.mjs')); });
test.afterEach(() => Loader.configure(null));

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'wrap-art-'));
const copyFixtures = () => { const d = tmp(); fs.cpSync(FIXTURES, d, { recursive: true }); return d; };
const load = (dir) => { const r = buildPack(dir); Loader.configure(r.pack); return r; };
const crew = { dept: 'grip', color: '#8EA3C2', look: { skin: '#E1B48E', hair: '#2A1D14', top: 'cap', glasses: true, beard: true } };

// A very small stand-in for an SVG element, just enough for the loader's display toggling
function fakeEl(markup) {
  const kids = [];
  for (const m of markup.matchAll(/<use data-st="([^"]+)"[^>]*?(display="none")?\/>/g)) {
    kids.push({ a: { 'data-st': m[1], display: m[2] ? 'none' : 'inline' } });
  }
  const ph = /<g class="wl-ph" display="(\w+)">/.exec(markup);
  if (ph) kids.push({ a: { class: 'wl-ph', display: ph[1] } });
  for (const k of kids) {
    k.getAttribute = (n) => (n in k.a ? k.a[n] : null);
    k.setAttribute = (n, v) => { k.a[n] = v; };
  }
  return { children: kids, isConnected: true, shown: () => kids.filter(k => k.a['data-st'] && k.a.display === 'inline').map(k => k.a['data-st']), ph: () => (kids.find(k => k.a.class === 'wl-ph') || { a: {} }).a.display };
}

/* ---------- Nothing delivered ---------- */

test('with no art, slots hand back the placeholder untouched and the puppet falls back', () => {
  Loader.configure(null);
  assert.equal(Loader.slot('grip.platform', 'PLACEHOLDER'), 'PLACEHOLDER');
  assert.equal(Loader.slot('elec.keylight-head', 'PH'), 'PH');
  assert.equal(Loader.use('art.burger-build', 'patty'), '');
  assert.equal(Loader.puppet({}), null);
  assert.equal(Loader.defs(), '<defs id="wl-defs"></defs>');
  assert.match(A.puppet(crew), /class="arm"/, 'code-drawn puppet is used');
  assert.doesNotMatch(A.puppet(crew), /wl-pose/);
  assert.doesNotMatch(A.cartBurger(5), /<use/);
  assert.doesNotMatch(A.setMarkup(), /data-slot/);
});

test('a missing art folder is fine, not an error', () => {
  const r = buildPack(path.join(os.tmpdir(), 'wrap-art-does-not-exist'));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.pack.pieces, {});
});

/* ---------- Packing and file names ---------- */

test('the stand-in folder packs cleanly: states, subfolders, scale hints', () => {
  const r = buildPack(FIXTURES);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  const p = r.pack.pieces;
  assert.deepEqual(Object.keys(p['elec.keylight-head'].states), ['dead', 'off', 'on']);
  assert.deepEqual(Object.keys(p['grip.platform'].states), ['default']);
  assert.deepEqual(Object.keys(p['crew.arm-front'].states), ['default', 'work']); // crew/ is a subfolder
  assert.deepEqual(Object.keys(p['art.burger-build'].states), ['bottom-bun', 'cheese', 'lettuce', 'patty', 'top-bun']);
  assert.equal(p['grip.platform'].states.default.scaleHint, 3);
  assert.equal(p['grip.platform'].states.default.w, 336);
  assert.equal(p['grip.platform'].states.default.h, 180);
  assert.match(p['grip.platform'].states.default.src, /^data:image\/png;base64,/);
  assert.match(r.notes.join('\n'), /crew puppet: all required parts present/);
});

test('packing is deterministic', () => {
  assert.equal(JSON.stringify(buildPack(FIXTURES).pack), JSON.stringify(buildPack(FIXTURES).pack));
});

/* ---------- Pivot, scale, offset ---------- */

test('defaults: @3x gives 3 px per unit and the slot decides the pivot', () => {
  load(FIXTURES);
  const r = Loader.resolve('grip.platform', 'default');
  assert.equal(r.scale, 3);
  assert.deepEqual([r.w, r.h], [112, 60]);
  assert.deepEqual([r.px, r.py], [56, 60]); // bottom center of a 336 x 180 image
  assert.equal(r.shadow, true);
});

test('the settings file wins: pivot in image pixels, per-state offset', () => {
  load(FIXTURES);
  const off = Loader.resolve('elec.keylight-head', 'off');
  const dead = Loader.resolve('elec.keylight-head', 'dead');
  assert.deepEqual([off.px, off.py], [28, 17]); // [84, 51] px at 3 px/unit
  assert.deepEqual([off.ox, off.oy], [0, 0]);
  assert.deepEqual([dead.ox, dead.oy], [0, 1]);
});

test('scale beats size beats the file name beats the default', () => {
  const d = copyFixtures();
  const json = path.join(d, 'grip.platform.json');
  fs.writeFileSync(json, JSON.stringify({ size: [56, 30] }));
  load(d);
  assert.equal(Loader.resolve('grip.platform', 'default').scale, 6); // 336 px wide into 56 units
  fs.writeFileSync(json, JSON.stringify({ size: [56, 30], scale: 2 }));
  load(d);
  assert.equal(Loader.resolve('grip.platform', 'default').scale, 2);
  fs.unlinkSync(json);
  fs.renameSync(path.join(d, 'grip.platform@3x.png'), path.join(d, 'grip.platform.png'));
  load(d);
  assert.equal(Loader.resolve('grip.platform', 'default').scale, 3, 'no suffix: rasters default to 3x');
});

test('named pivots resolve against the image size', () => {
  const d = copyFixtures();
  fs.writeFileSync(path.join(d, 'grip.platform.json'), JSON.stringify({ pivot: 'top-left', offset: [5, -2] }));
  load(d);
  const r = Loader.resolve('grip.platform', 'default');
  assert.deepEqual([r.px, r.py, r.ox, r.oy], [0, 0, 5, -2]);
  assert.match(Loader.slot('grip.platform', 'PH'), /translate\(189 190\)/); // anchor 184,192 plus the offset
});

/* ---------- Swapping art needs no code ---------- */

test('swapping a file and its settings changes what is drawn, with no code change', () => {
  const before = copyFixtures();
  load(before);
  const a = Loader.slot('elec.keylight-head', 'PH');
  const after = copyFixtures();
  fs.writeFileSync(path.join(after, 'elec.keylight-head.json'), JSON.stringify({ pivot: [60, 40], scale: 4 }));
  load(after);
  const b = Loader.slot('elec.keylight-head', 'PH');
  assert.notEqual(a, b);
  assert.deepEqual([Loader.resolve('elec.keylight-head', 'on').px, Loader.resolve('elec.keylight-head', 'on').py], [15, 10]);
});

test('a mis-scaled delivery is flagged against the manifest size', () => {
  const d = copyFixtures();
  fs.renameSync(path.join(d, 'grip.platform@3x.png'), path.join(d, 'grip.platform@2x.png'));
  const r = buildPack(d);
  assert.match(r.warnings.join('\n'), /grip\.platform: draws 168\.0 x 90\.0 set units, the manifest says about 112 x 60/);
  assert.deepEqual(r.errors, []);
});

/* ---------- Slots and state ---------- */

test('slot markup keeps the placeholder underneath and shows the requested state', () => {
  load(FIXTURES);
  const platform = Loader.slot('grip.platform', 'PLATFORM-PH');
  assert.match(platform, /<g data-slot="grip\.platform"><g class="wl-ph" display="none">PLATFORM-PH<\/g>/);
  assert.match(platform, /<use data-st="default" href="#wl-grip-platform--default" transform="translate\(184 192\)" filter="url\(#shadow\)"\/>/);
  const head = Loader.slot('elec.keylight-head', 'HEAD-PH');
  assert.match(head, /data-st="off"[^>]*translate\(72 76\)"\/>/); // initial state, visible
  assert.match(head, /data-st="on"[^>]*display="none"/);
  assert.match(head, /data-st="dead"[^>]*translate\(72 77\)"[^>]*display="none"/); // per-state offset applied
});

test('state() swaps display only: on, dead, and the placeholder when a state has no image', () => {
  load(FIXTURES);
  const el = fakeEl(Loader.slot('elec.keylight-head', 'HEAD-PH'));
  assert.deepEqual(el.shown(), ['off']);
  Loader.state(el, 'on');
  assert.deepEqual(el.shown(), ['on']);
  Loader.state(el, 'dead');
  assert.deepEqual(el.shown(), ['dead']);
  assert.equal(el.ph(), 'none');
  Loader.state(el, 'melting'); // no such image and no default: the placeholder shows through
  assert.deepEqual(el.shown(), []);
  assert.equal(el.ph(), 'inline');
  Loader.state(el, 'off');
  assert.deepEqual(el.shown(), ['off']);
  assert.equal(el.ph(), 'none');
});

test('a piece with only some states mixes real art and the placeholder', () => {
  const d = copyFixtures();
  fs.unlinkSync(path.join(d, 'elec.keylight-head.dead@3x.png'));
  load(d);
  const el = fakeEl(Loader.slot('elec.keylight-head', 'HEAD-PH'));
  Loader.state(el, 'on');
  assert.deepEqual(el.shown(), ['on']);
  Loader.state(el, 'dead');
  assert.deepEqual(el.shown(), []);
  assert.equal(el.ph(), 'inline', 'the code-drawn head shows while the dead image is missing');
  assert.match(buildPack(d).notes.join('\n'), /no "dead" image yet, the placeholder shows for that state/);
});

test('each image is defined once with its pivot baked in, however many puppets use it', () => {
  load(FIXTURES);
  const defs = Loader.defs();
  const platform = /<image id="wl-grip-platform--default" x="-56" y="-60" width="112" height="60"[^>]*href="(data:[^"]+)"/.exec(defs);
  assert.ok(platform, 'platform image is placed so its pivot sits at the origin');
  for (let i = 0; i < 10; i++) A.puppet(crew);
  assert.equal(defs.split(platform[1]).length - 1, 1, 'the base64 appears once in the defs');
  const markup = Array.from({ length: 10 }, () => A.puppet(crew)).join('');
  assert.doesNotMatch(markup, /data:image/, 'puppets reference the defs, they never repeat image data');
});

/* ---------- Modular puppet ---------- */

test('the puppet is assembled from parts with skin and department tints', () => {
  load(FIXTURES);
  assert.equal(Loader.puppetReady(), true);
  const m = A.puppet(crew);
  assert.match(m, /<g class="bodyg">/);
  assert.match(m, /class="wl-pose arm" data-part="crew\.arm-front"/, 'front arm keeps the "arm" class the work animation targets');
  // z-order: legs, back arm, torso, head, face, hair, front arm
  const order = ['crew.leg-back', 'crew.leg-front', 'crew.arm-back', 'crew.torso', 'crew.head'].map(p => m.indexOf(`data-part="${p}"`));
  assert.deepEqual(order, order.slice().sort((x, y) => x - y));
  assert.ok(order.every(i => i > -1));
  assert.ok(m.indexOf('wl-crew-hair--cap') > m.indexOf('wl-crew-head--default'));
  assert.ok(m.indexOf('data-part="crew.arm-front"') > m.indexOf('wl-crew-hair--cap'));
  assert.match(m, /wl-crew-torso--default" transform="translate\(0 -13\)" filter="url\(#wl-tint-8ea3c2\)"/, 'torso tinted with the department color');
  assert.match(m, /wl-crew-head--default" transform="translate\(0 -26\.5\)" filter="url\(#wl-tint-e1b48e\)"/, 'head tinted with the skin tone');
  assert.match(Loader.defs(), /<filter id="wl-tint-8ea3c2"/);
});

test('hair and face extras follow the crew member look', () => {
  load(FIXTURES);
  const m = A.puppet(crew);
  assert.match(m, /wl-crew-hair--cap/);
  assert.match(m, /wl-crew-face--glasses/);
  assert.match(m, /wl-crew-face--beard/);
  assert.doesNotMatch(m, /wl-crew-face--mustache/);
  assert.match(m, /wl-crew-face--eyes/);
  const plain = A.puppet({ dept: 'art', look: {} });
  assert.match(plain, /wl-crew-hair--default/, 'no hat falls back to the default hair');
  assert.doesNotMatch(plain, /wl-crew-face--glasses/);
  const beanie = A.puppet({ dept: 'art', look: { top: 'beanie' } });
  assert.match(beanie, /wl-crew-hair--default/, 'a look with no art falls back to the default hair, not a missing part');
});

test('pose() swaps whole puppets between idle and work without rebuilding anything', () => {
  load(FIXTURES);
  const m = A.puppet(crew);
  const arm = fakeEl(/<g class="wl-pose arm" data-part="crew\.arm-front">.*?<\/g>/.exec(m)[0]);
  const root = { querySelectorAll: () => [arm] };
  assert.deepEqual(arm.shown(), ['default']);
  Loader.pose(root, 'work');
  assert.deepEqual(arm.shown(), ['work']);
  Loader.pose(root, 'idle');
  assert.deepEqual(arm.shown(), ['default'], 'idle falls back to the default look');
});

test('an incomplete puppet never replaces the complete code-drawn one', () => {
  const d = copyFixtures();
  fs.unlinkSync(path.join(d, 'crew', 'crew.leg-back@3x.png'));
  const r = load(d);
  assert.deepEqual(Loader.puppetMissing(), ['crew.leg-back']);
  assert.equal(Loader.puppet({}), null);
  assert.match(A.puppet(crew), /class="arm"/);
  assert.doesNotMatch(A.puppet(crew), /wl-pose/);
  assert.match(r.warnings.join('\n'), /crew puppet is incomplete \(missing crew\.leg-back\)/);
});

test('optional puppet parts can be left out', () => {
  const d = copyFixtures();
  for (const f of ['crew.arm-back@3x.png', 'crew.hair.cap@3x.png', 'crew.hair.default@3x.png', 'crew.face.glasses@3x.png']) fs.unlinkSync(path.join(d, 'crew', f));
  load(d);
  const m = A.puppet(crew);
  assert.match(m, /wl-pose/);
  assert.doesNotMatch(m, /crew-arm-back|crew-hair|face--glasses/);
});

/* ---------- Burger build stack ---------- */

test('burger layers stack bottom up in the cart group, scaled back to its units', () => {
  load(FIXTURES);
  const three = A.cartBurger(3);
  const uses = [...three.matchAll(/<use data-st="([^"]+)"[^>]*translate\(([\d.]+) ([\d.-]+)\) scale\(([\d.]+)\)/g)];
  assert.deepEqual(uses.map(u => u[1]), ['bottom-bun', 'patty', 'cheese']);
  const ys = uses.map(u => +u[3]);
  assert.ok(ys[0] > ys[1] && ys[1] > ys[2], 'each layer sits higher than the one below');
  assert.equal(uses[0][4], '2.38'); // 1 / 0.42, the cart group scale
  assert.equal([...A.cartBurger(5).matchAll(/<use /g)].length, 5);
  assert.equal([...A.cartBurger(0).matchAll(/<use /g)].length, 0);
});

test('a half-delivered burger stack mixes real layers with placeholder layers', () => {
  const d = copyFixtures();
  fs.unlinkSync(path.join(d, 'art.burger-build.patty@3x.png'));
  const r = load(d);
  const m = A.cartBurger(3);
  assert.equal([...m.matchAll(/<use /g)].length, 2);
  assert.match(m, /<g stroke="#22262B" stroke-width="1\.6"><rect x="6\.5" y="23\.5"/, 'the patty is still the code-drawn one');
  assert.match(r.notes.join('\n'), /layers still on placeholder art: patty/);
});

/* ---------- Bad input is reported, not swallowed ---------- */

test('bad settings and names come back as clear errors and warnings', () => {
  const d = copyFixtures();
  fs.writeFileSync(path.join(d, 'grip.platform.json'), '{ not json');
  fs.writeFileSync(path.join(d, 'elec.keylight-head.json'), JSON.stringify({ pivot: 'middle-ish', scale: -1, offset: [1], tint: 'purple', sparkle: true, states: { on: 'nope' } }));
  fs.writeFileSync(path.join(d, 'Grip Platform.png'), fs.readFileSync(path.join(d, 'grip.platform@3x.png')));
  fs.writeFileSync(path.join(d, 'mystery.thing@3x.png'), fs.readFileSync(path.join(d, 'grip.platform@3x.png')));
  fs.writeFileSync(path.join(d, 'grip.nothing.json'), '{}');
  fs.writeFileSync(path.join(d, 'bad.png.png'), 'not a png');
  const r = buildPack(d);
  const errs = r.errors.join('\n');
  assert.match(errs, /grip\.platform\.json: invalid JSON/);
  assert.match(errs, /elec\.keylight-head\.json: pivot must be/);
  assert.match(errs, /scale must be a number above 0/);
  assert.match(errs, /offset must be \[x, y\]/);
  assert.match(errs, /tint must be/);
  assert.match(errs, /states\.on must be an object/);
  assert.match(errs, /bad\.png\.png: not a valid PNG/);
  const warns = r.warnings.join('\n');
  assert.match(warns, /unknown setting "sparkle"/);
  assert.match(warns, /Grip Platform\.png: name does not match/);
  assert.match(warns, /mystery\.thing: no slot for this ID in src\/slots\.js/);
  assert.match(warns, /grip\.nothing\.json: settings for grip\.nothing but no images/);
});

test('a pivot outside the image is flagged', () => {
  const d = copyFixtures();
  fs.writeFileSync(path.join(d, 'grip.platform.json'), JSON.stringify({ pivot: [999, 10] }));
  assert.match(buildPack(d).warnings.join('\n'), /grip\.platform: pivot \[999, 10\] is outside the 336 x 180 image/);
});

/* ---------- Other formats ---------- */

test('SVG art uses its viewBox: 1 unit per unit by default, or the size setting', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'grip.platform.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 60"><rect width="112" height="60" fill="red"/></svg>');
  const r = load(d);
  assert.deepEqual(r.warnings, []);
  const a = Loader.resolve('grip.platform', 'default');
  assert.deepEqual([a.scale, a.w, a.h], [1, 112, 60]);
  assert.match(Loader.defs(), /href="data:image\/svg\+xml;base64,/);
  fs.writeFileSync(path.join(d, 'grip.platform.json'), JSON.stringify({ size: [224, 120] }));
  load(d);
  assert.equal(Loader.resolve('grip.platform', 'default').scale, 0.5);
});

test('SVG wins over a raster of the same look', () => {
  const d = copyFixtures();
  fs.writeFileSync(path.join(d, 'grip.platform.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="112" height="60"><rect width="112" height="60"/></svg>');
  const r = buildPack(d);
  assert.equal(r.pack.pieces['grip.platform'].states.default.format, 'svg');
  assert.match(r.warnings.join('\n'), /SVG preferred/);
});

test('WEBP sizes are read from the file header', () => {
  const d = tmp();
  // 1x1 lossy and lossless WEBP files
  fs.writeFileSync(path.join(d, 'grip.platform.webp'), Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA', 'base64'));
  fs.writeFileSync(path.join(d, 'grip.flag.webp'), Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64'));
  const r = buildPack(d);
  assert.deepEqual(r.errors, []);
  assert.deepEqual([r.pack.pieces['grip.platform'].states.default.w, r.pack.pieces['grip.platform'].states.default.h], [1, 1]);
  assert.deepEqual([r.pack.pieces['grip.flag'].states.default.w, r.pack.pieces['grip.flag'].states.default.h], [1, 1]);
});

/* ---------- The whole set markup ---------- */

test('the set draws the delivered pieces in place and nothing else changes', () => {
  Loader.configure(null);
  const plain = A.setMarkup();
  load(FIXTURES);
  const withArt = A.setMarkup();
  assert.match(withArt, /data-slot="grip\.platform"/);
  assert.match(withArt, /data-slot="elec\.keylight-head"/);
  assert.match(withArt, /id="lightFace"/, 'the placeholder is still in the DOM for the existing render code to address');
  assert.match(withArt, /<g id="platform"><g data-slot/);
  assert.doesNotMatch(plain, /<use /);
  // Every element the render code addresses by id is still there, and the placeholder shapes are kept verbatim
  const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]).sort();
  assert.deepEqual(ids(withArt), ids(plain));
  for (const shape of ['fill="url(#corrRed)"', 'points="52,58 92,58 100,92 44,92"', 'M128 140 L136 132 H240 L232 140Z']) {
    assert.ok(plain.includes(shape) && withArt.includes(shape), `placeholder kept: ${shape}`);
  }
  // The two wrapped slots, with every state of the key head and the one platform image
  assert.equal([...withArt.matchAll(/<g data-slot=/g)].length, 2);
  assert.equal([...withArt.matchAll(/<use data-st="(off|on|dead)" href="#wl-elec-keylight-head--/g)].length, 3);
  assert.equal([...withArt.matchAll(/<use data-st="default" href="#wl-grip-platform--default"/g)].length, 1);
  // The client and agency puppets on the set are real puppets too
  assert.ok([...withArt.matchAll(/class="wl-pose" data-part="crew\.torso"/g)].length >= 2);
});
