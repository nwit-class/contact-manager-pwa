// generate-icons.js
import sharp from "sharp";
import fs from "fs";
import toIco from "to-ico";

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = "icon.png"; // Base image (must be square, at least 512x512)
const outputDir = "public/icons";
const faviconFile = "public/favicon.ico";

(async () => {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PNG icons
    for (const size of sizes) {
      await sharp(inputFile)
        .resize(size, size)
        .toFile(`${outputDir}/icon-${size}x${size}.png`);
      console.log(`✅ Generated icon-${size}x${size}.png`);
    }

    // Generate favicon.ico (multiple sizes inside one .ico file)
    const bufferArray = await Promise.all(
      [16, 32, 48].map(size =>
        sharp(inputFile).resize(size, size).png().toBuffer()
      )
    );
    const icoBuffer = await toIco(bufferArray);
    fs.writeFileSync(faviconFile, icoBuffer);
    console.log(`✅ Generated favicon.ico`);

    console.log("🎉 All icons & favicon generated successfully!");
  } catch (err) {
    console.error("❌ Error generating icons:", err);
  }
})();


