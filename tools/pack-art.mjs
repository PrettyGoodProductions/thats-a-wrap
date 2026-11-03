// Scans an art folder and packs delivered art into one object the game loads (see src/loader.js).
//
//   import { buildPack, packModule } from './tools/pack-art.mjs'
//
// File names follow the Asset Manifest:  <dept>.<object>[.<state>][@3x].(png|webp|svg)
//   grip.platform@3x.png            one look
//   elec.keylight-head.on@3x.png    one of several states
// Settings sit next to the images, one small file per piece:  <dept>.<object>.json
//
// buildPack never throws on art problems. It returns { pack, errors, warnings, notes } so the build can
// print them all at once, fail on errors, and carry on past warnings.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, extname, basename } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Loader = require('../src/loader.js');
const { SLOTS, PUPPET } = require('../src/slots.js');

const IMAGE_EXT = new Set(['.png', '.webp', '.svg']);
const MIME = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const NAME = /^([a-z0-9]+\.[a-z0-9-]+)(?:\.([a-z0-9_-]+))?(?:@(\d+(?:\.\d+)?)x)?\.(png|webp|svg)$/;
const ID = /^[a-z0-9]+\.[a-z0-9-]+$/;
const SETTING_KEYS = ['pivot', 'scale', 'size', 'offset', 'shadow', 'tint', 'states', 'note'];
const STATE_KEYS = SETTING_KEYS.filter(k => k !== 'states');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.') || name.startsWith('_')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function imageSize(buf, ext, file) {
  if (ext === '.png') {
    if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: not a valid PNG`);
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (ext === '.webp') {
    if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`${file}: not a valid WEBP`);
    const kind = buf.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
    if (kind === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
    throw new Error(`${file}: unrecognised WEBP data`);
  }
  const tag = /<svg\b[^>]*>/i.exec(buf.toString('utf8', 0, Math.min(buf.length, 4096)));
  if (!tag) throw new Error(`${file}: not a valid SVG`);
  const attr = (n) => { const m = new RegExp(`\\b${n}\\s*=\\s*["']([^"']+)["']`, 'i').exec(tag[0]); return m ? m[1] : null; };
  const num = (v) => (v && /^[\d.]+(px)?$/.test(v.trim()) ? parseFloat(v) : null);
  let w = num(attr('width'));
  let h = num(attr('height'));
  const vb = attr('viewBox');
  if ((!w || !h) && vb) { const p = vb.trim().split(/[\s,]+/).map(Number); if (p.length === 4 && p[2] > 0 && p[3] > 0) { w = w || p[2]; h = h || p[3]; } }
  if (!w || !h) throw new Error(`${file}: SVG needs a width and height or a viewBox`);
  return { w, h };
}

const isPair = (v) => Array.isArray(v) && v.length === 2 && v.every(n => typeof n === 'number' && isFinite(n));

function checkSettings(id, cfg, where, errors, warnings) {
  const keys = where ? STATE_KEYS : SETTING_KEYS;
  for (const k of Object.keys(cfg)) if (!keys.includes(k)) warnings.push(`${id}.json: unknown setting "${k}"${where ? ` under states.${where}` : ''}, ignored`);
  const at = where ? `${id}.json states.${where}` : `${id}.json`;
  if (cfg.pivot !== undefined && !isPair(cfg.pivot) && !(typeof cfg.pivot === 'string' && Loader.PIVOT_NAMES[cfg.pivot])) {
    errors.push(`${at}: pivot must be [x, y] in image pixels or one of ${Object.keys(Loader.PIVOT_NAMES).join(', ')}`);
  }
  if (cfg.scale !== undefined && !(typeof cfg.scale === 'number' && cfg.scale > 0)) errors.push(`${at}: scale must be a number above 0 (image pixels per set unit)`);
  if (cfg.size !== undefined && !(Array.isArray(cfg.size) && cfg.size.length === 2 && cfg.size.some(n => typeof n === 'number' && n > 0))) errors.push(`${at}: size must be [width, height] in set units`);
  if (cfg.offset !== undefined && !isPair(cfg.offset)) errors.push(`${at}: offset must be [x, y] in set units`);
  if (cfg.tint !== undefined && cfg.tint !== false && !['skin', 'dept', 'hair'].includes(cfg.tint) && !Loader.normColor(cfg.tint)) errors.push(`${at}: tint must be "skin", "dept", "hair", a #hex color, or false`);
}

export function buildPack(dir) {
  const errors = [];
  const warnings = [];
  const notes = [];
  const pieces = {};
  let bytes = 0;
  let files = 0;

  if (!dir || !existsSync(dir)) return { pack: { version: 1, pieces }, errors, warnings, notes: [`no art folder at ${dir}, using placeholders everywhere`], bytes, files };

  const settingsFiles = [];
  for (const path of walk(dir)) {
    const rel = relative(dir, path);
    const ext = extname(path).toLowerCase();
    const name = basename(path);
    if (ext === '.json') { settingsFiles.push({ path, rel, name }); continue; }
    if (!IMAGE_EXT.has(ext)) continue; // README and friends
    const m = NAME.exec(name);
    if (!m) { warnings.push(`${rel}: name does not match <dept>.<object>[.<state>][@3x].png (lower case, no spaces), skipped`); continue; }
    const [, id, stateRaw, hint, fmt] = m;
    const state = stateRaw || 'default';
    let buf;
    let dims;
    try { buf = readFileSync(path); dims = imageSize(buf, '.' + fmt, rel); } catch (e) { errors.push(e.message); continue; }
    const piece = pieces[id] || (pieces[id] = { settings: {}, states: {} });
    if (piece.states[state]) {
      // The same look delivered twice: an SVG beats a raster, otherwise the first one wins
      const had = piece.states[state];
      if (fmt === 'svg' && had.format !== 'svg') warnings.push(`${rel}: replaces ${had.file} (SVG preferred)`);
      else if (had.format === 'svg' && fmt !== 'svg') { warnings.push(`${rel}: skipped, ${had.file} is used instead (SVG preferred)`); continue; }
      else { warnings.push(`${rel}: duplicate of ${had.file}, skipped`); continue; }
    }
    piece.states[state] = { src: `data:${MIME['.' + fmt]};base64,${buf.toString('base64')}`, w: dims.w, h: dims.h, format: fmt, file: rel, ...(hint ? { scaleHint: parseFloat(hint) } : {}) };
    bytes += buf.length;
    files++;
  }

  for (const { path, rel, name } of settingsFiles) {
    const id = name.slice(0, -5);
    if (!ID.test(id)) { warnings.push(`${rel}: settings files are named <dept>.<object>.json, skipped`); continue; }
    let cfg;
    try { cfg = JSON.parse(readFileSync(path, 'utf8')); } catch (e) { errors.push(`${rel}: invalid JSON (${e.message})`); continue; }
    if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) { errors.push(`${rel}: settings must be a JSON object`); continue; }
    checkSettings(id, cfg, null, errors, warnings);
    for (const [st, sc] of Object.entries(cfg.states || {})) {
      if (sc && typeof sc === 'object') checkSettings(id, sc, st, errors, warnings);
      else errors.push(`${rel}: states.${st} must be an object`);
    }
    if (!pieces[id]) { warnings.push(`${rel}: settings for ${id} but no images with that ID, ignored`); continue; }
    pieces[id].settings = cfg;
  }

  // Sort for a stable, diff-friendly pack
  const sorted = {};
  for (const id of Object.keys(pieces).sort()) {
    const p = pieces[id];
    sorted[id] = { settings: p.settings, states: Object.fromEntries(Object.keys(p.states).sort().map(s => [s, p.states[s]])) };
  }
  const pack = { version: 1, pieces: sorted };

  // Sanity checks run through the same resolver the game uses, so what is reported is what will be drawn
  Loader.configure(pack);
  for (const id of Object.keys(sorted)) {
    const slot = SLOTS[id];
    if (!slot) { warnings.push(`${id}: no slot for this ID in src/slots.js yet, so the game does not use it`); continue; }
    for (const st of Object.keys(sorted[id].states)) {
      const r = Loader.resolve(id, st);
      const label = `${id}${st === 'default' ? '' : '.' + st}`;
      const [px, py] = r.pivotPx;
      if (px < 0 || py < 0 || px > r.imgW || py > r.imgH) warnings.push(`${label}: pivot [${px}, ${py}] is outside the ${r.imgW} x ${r.imgH} image`);
      // Only resting looks are compared to the manifest size: a work or walk pose is allowed to be a different shape
      const resting = st === 'default' || st === 'idle' || (slot.states || []).includes(st);
      if (slot.size && !slot.variants && resting) {
        const rw = r.w / slot.size[0];
        const rh = r.h / slot.size[1];
        if (rw < 0.7 || rw > 1.4 || rh < 0.7 || rh > 1.4) warnings.push(`${label}: draws ${r.w.toFixed(1)} x ${r.h.toFixed(1)} set units, the manifest says about ${slot.size[0]} x ${slot.size[1]}. Check the @3x suffix or set "scale" in ${id}.json`);
      }
      notes.push(`${label}: ${r.imgW}x${r.imgH}px at ${r.scale}px/unit, ${r.w.toFixed(1)} x ${r.h.toFixed(1)} units, pivot ${px.toFixed(0)},${py.toFixed(0)}px`);
    }
    if (slot.states) for (const want of slot.states) if (!sorted[id].states[want] && !sorted[id].states.default) notes.push(`${id}: no "${want}" image yet, the placeholder shows for that state`);
    if (slot.layers) {
      const missing = slot.layers.filter(l => !sorted[id].states[l]);
      if (missing.length) notes.push(`${id}: layers still on placeholder art: ${missing.join(', ')}`);
    }
  }
  const crew = Object.keys(sorted).filter(id => id.startsWith('crew.'));
  if (crew.length) {
    const missing = PUPPET.required.filter(id => !sorted[id]);
    if (missing.length) warnings.push(`crew puppet is incomplete (missing ${missing.join(', ')}), so crew keep the code-drawn puppet until it is`);
    else notes.push('crew puppet: all required parts present, real puppet in use');
  }
  Loader.configure(null);

  return { pack, errors, warnings, notes, bytes, files };
}

// The file the page loads. Generated on every build, never edited by hand.
export function packModule(pack) {
  return `/* Generated by tools/pack-art.mjs from the art folder. Do not edit by hand. */\n(function (root) {\n  root.WrapArtPack = ${JSON.stringify(pack)};\n})(typeof globalThis !== 'undefined' ? globalThis : this);\n`;
}
