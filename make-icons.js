// make-icons.js (project root)
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const src = 'public/icon.png'; // supply a 512x512+ PNG here
const outDir = 'public/icons';
const sizes = [192, 256, 512];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const run = async () => {
  if (!fs.existsSync(src)) {
    console.error(`❌ ${src} not found. Put a 512x512 PNG at ${src} and re-run.`);
    process.exit(1);
  }
  for (const s of sizes) {
    const out = path.join(outDir, `icon-${s}x${s}.png`);
    await sharp(src).resize(s, s).png({ compressionLevel: 9 }).toFile(out);
    console.log(`✅ ${out}`);
  }
};
run();
