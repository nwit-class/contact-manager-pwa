// copy-public-meta.js
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const pub = path.join(root, 'public');
const out = path.join(root, 'dist');

const files = ['_redirects', '_headers'];

if (!fs.existsSync(out)) {
  console.error('❌ dist/ does not exist. Run "npm run build" first.');
  process.exit(1);
}

for (const name of files) {
  const src = path.join(pub, name);
  const dst = path.join(out, name);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log(`✅ copied ${name} -> dist/${name}`);
  } else {
    console.warn(`⚠️  ${name} not found in public/ (skipping)`);
  }
}
