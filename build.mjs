// Builds the playable page by inlining the scripts into src/page.html.
//   node build.mjs
// Outputs:
//   dist/index.html     full page, open it in any browser (double-click works)
//   dist/artifact.html  same page without <html>/<head>/<body>, for publishing as a Claude artifact
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const page = readFileSync('src/page.html', 'utf8');
const fragment = page.replace(/<!-- inline:(\S+) -->/g, (_, file) => {
  const code = readFileSync(file, 'utf8');
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

mkdirSync('dist', { recursive: true });
writeFileSync('dist/artifact.html', fragment);
writeFileSync('dist/index.html', full);
console.log('Built dist/index.html and dist/artifact.html');
