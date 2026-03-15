// Run with: node generate-icons.mjs
import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0D0D0F";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22);
  ctx.fill();

  // Grid of squares (4x4)
  const padding = size * 0.18;
  const gap = size * 0.045;
  const cols = 4;
  const rows = 4;
  const cellSize = (size - padding * 2 - gap * (cols - 1)) / cols;

  const colors = [
    "#8B5CF6", "#8B5CF6", "#3B82F6", "#3B82F6",
    "#8B5CF6", "#10B981", "#3B82F6", "#8B5CF6",
    "#10B981", "#10B981", "#8B5CF6", "#3B82F6",
    "#3B82F6", "#10B981", "#10B981", "#8B5CF6",
  ];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = padding + col * (cellSize + gap);
      const y = padding + row * (cellSize + gap);
      const idx = row * cols + col;
      const filled = idx % 3 !== 0;

      ctx.fillStyle = filled ? colors[idx] : `${colors[idx]}30`;
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.2);
      ctx.fill();
    }
  }

  return canvas.toBuffer("image/png");
}

writeFileSync("public/icon-192.png", generateIcon(192));
writeFileSync("public/icon-512.png", generateIcon(512));
console.log("Icons generated!");
