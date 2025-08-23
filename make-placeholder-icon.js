// make-placeholder-icon.js
import { createCanvas } from "canvas";
import fs from "fs";

const size = 512;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = "#4CAF50"; // green
ctx.fillRect(0, 0, size, size);

// Circle
ctx.beginPath();
ctx.arc(size / 2, size / 2, size / 3, 0, Math.PI * 2);
ctx.fillStyle = "#ffffff";
ctx.fill();

// Text
ctx.fillStyle = "#000000";
ctx.font = "bold 80px Arial";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("CM", size / 2, size / 2); // CM = Contact Manager

// Save as PNG
const buffer = canvas.toBuffer("image/png");
fs.writeFileSync("icon.png", buffer);
console.log("✅ Created placeholder icon.png (512x512)");
