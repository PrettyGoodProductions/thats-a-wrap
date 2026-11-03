// Builds the playable page by inlining the scripts into src/page.html.
//   node build.mjs                          builds with the art in art/
//   node build.mjs --art some/folder        builds with art from another folder (tests use this)
//   node build.mjs --out some/folder        writes somewhere other than dist/
//   node build.mjs --lab                    also writes lab.html, the art test bench (tools/qa_pipeline.py)
// Outputs:
//   dist/index.html     full page, open it in any browser (double-click works)
//   dist/artifact.html  same page without <html>/<head>/<body>, for publishing as a Claude artifact
//
// Delivered art is packed from the art folder on every build (see art/README.md). Drop files in, rebuild,
// and the game uses them. No code changes.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildPack, packModule } from './tools/pack-art.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined; };
const artDir = arg('--art') || process.env.WRAP_ART_DIR || 'art';
const outDir = arg('--out') || 'dist';

const art = buildPack(artDir);
for (const e of art.errors) console.error(`art error: ${e}`);
for (const w of art.warnings) console.warn(`art warning: ${w}`);
if (art.errors.length) {
  console.error(`\n${art.errors.length} art error(s). Fix them and rebuild.`);
  process.exit(1);
}
const pieceCount = Object.keys(art.pack.pieces).length;
if (pieceCount) {
  console.log(`Art: ${art.files} image(s) in ${pieceCount} piece(s) from ${artDir}, ${(art.bytes / 1024).toFixed(0)} KB`);
  for (const n of art.notes) console.log(`  ${n}`);
  if (art.bytes > 6 * 1024 * 1024) console.warn('art warning: more than 6 MB of art. Phones will be slow to load it, consider smaller or SVG files');
} else {
  console.log('Art: none delivered, using code-drawn placeholders everywhere');
}

// Generated inline files live in memory, never in src/, so a build with test art cannot leak into a normal one
const generated = { 'src/art-pack.js': packModule(art.pack) };

const page = readFileSync('src/page.html', 'utf8');
const fragment = page.replace(/<!-- inline:(\S+) -->/g, (_, file) => {
  const code = generated[file] !== undefined ? generated[file] : readFileSync(file, 'utf8');
  return `<script>\n/* ${file} */\n${code}\n</script>`;
});

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
</head>
<body>
${fragment}
</body>
</html>
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'artifact.html'), fragment);
writeFileSync(join(outDir, 'index.html'), full);
console.log(`Built ${join(outDir, 'index.html')} and ${join(outDir, 'artifact.html')}`);

// --lab also writes lab.html: the art test bench driven by tools/qa_pipeline.py (not part of the game)
if (process.argv.includes('--lab')) {
  const style = /<style>[\s\S]*?<\/style>/.exec(page)[0];
  const lab = readFileSync('tools/lab.html', 'utf8')
    .replace('<!-- page-style -->', () => style)
    .replace(/<!-- inline:(\S+) -->/g, (_, file) => {
      const code = generated[file] !== undefined ? generated[file] : readFileSync(file, 'utf8');
      return `<script>\n/* ${file} */\n${code}\n</script>`;
    });
  writeFileSync(join(outDir, 'lab.html'), lab);
  console.log(`Built ${join(outDir, 'lab.html')}`);
}
