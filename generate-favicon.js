// generate-favicon.js
import sharp from "sharp";
import fs from "fs";
import pngToIco from "png-to-ico";

const sizes = [16, 32, 48];
const input = "public/icons/icon-192x192.png"; // use your existing PWA icon
const tempFiles = [];

async function generateFavicon() {
  try {
    // Resize into multiple favicon sizes
    for (const size of sizes) {
      const output = `public/icons/icon-${size}x${size}.png`;
      await sharp(input)
        .resize(size, size)
        .toFile(output);
      tempFiles.push(output);
      console.log(`✅ Created ${output}`);
    }

    // Combine into a single favicon.ico
    const buf = await pngToIco(tempFiles);
    fs.writeFileSync("public/favicon.ico", buf);
    console.log("🎉 favicon.ico created successfully!");
  } catch (err) {
    console.error("❌ Error generating favicon:", err);
  }
}

generateFavicon();
// generate-icons.js
import sharp from "sharp";
import fs from "fs";

const sizes = [72, 96, 128, 144, 152, 192, 256, 384, 512];
const input = "public/icons/icon-512x512.png"; // your largest icon

async function generateIcons() {
  try {
    for (const size of sizes) {
      const output = `public/icons/icon-${size}x${size}.png`;
      await sharp(input).resize(size, size).toFile(output);
      console.log(`✅ Created ${output}`);
    }
    console.log("🎉 All PWA icons generated successfully!");
  } catch (err) {
    console.error("❌ Error generating icons:", err);
  }
}

generateIcons();

