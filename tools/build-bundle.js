// Preview artifact builder: inlines all local scripts into dist/index.html so the
// preview page needs a single request (some static raw hosts rate-limit multi-file pages).
// Source remains no-build; dist/ is generated for preview links only.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const files = [...html.matchAll(/'((?:scenes|engine|app)[^']*\.js)'/g)].map(m => m[1]);
if (files.length < 20) { console.error('expected the loader file list, got', files.length); process.exit(1); }
let out = html.replace(/<script>\n\(function \(\) \{[\s\S]*?<\/script>/, () => {
  return files.map(f => {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    return `<script>\n/* inlined: ${f} */\n${src}\n</script>`;
  }).join('\n');
});
fs.mkdirSync(path.join(__dirname, '..', 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'dist', 'index.html'), out);
console.log('dist/index.html written,', files.length, 'scripts inlined,', (out.length / 1024).toFixed(0), 'KB');
