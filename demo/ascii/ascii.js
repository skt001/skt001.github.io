import { glyphs } from "./glyphs.js";

/**
 * Render text as a PNG data URL using the bundled 8x8 glyph bitmap.
 * The output has an opaque black background and white foreground pixels.
 *
 * @param {string} text
 * @param {object} options
 * @param {number} options.scale Integer pixel scale (default: 1)
 * @param {string} options.foreground CSS color (default: "#fff")
 * @param {number} options.spacing Extra horizontal pixels between characters (default: 0)
 * @returns {string} PNG data URL
 */
export function renderAscii(text, {
  scale = 1,
  foreground = "#fff",
  spacing = 0
} = {}) {
  scale = Math.max(1, Math.floor(Number(scale) || 1));
  spacing = Math.max(0, Math.floor(Number(spacing) || 0));

  const chars = Array.from(String(text));
  const width = Math.max(1, chars.length * 8 + Math.max(0, chars.length - 1) * spacing);
  const height = 8;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Canvas 2D context is unavailable.");

  // The PNG background is always opaque black.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = foreground;
  for (let i = 0; i < chars.length; i++) {
    const code = chars[i].codePointAt(0);
    const bitmap = glyphs[code];
    if (!bitmap) continue;

    const offsetX = i * (8 + spacing);
    for (let y = 0; y < 8; y++) {
      const row = bitmap[y];
      for (let x = 0; x < 8; x++) {
        if ((row & (0x80 >> x)) !== 0) {
          ctx.fillRect((offsetX + x) * scale, y * scale, scale, scale);
        }
      }
    }
  }

  return canvas.toDataURL("image/png");
}
