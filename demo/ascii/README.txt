8x8 ASCII PNG Generator

Files:
- index.html: browser demo
- ascii.js: Canvas PNG renderer
- glyphs.js: 8x8, 1-bit glyph data extracted from the supplied PNG archive

Usage:
1. Serve this directory from any static HTTP server.
2. Open index.html.
3. Enter text and click Generate PNG.

Module imports require HTTP(S); opening index.html directly with file:// may be blocked by browser module security.

API:
  import { renderAscii } from "./ascii.js";
  const pngDataUrl = renderAscii("HELLO", { scale: 4 });

Options:
- scale: integer pixel enlargement (default 1)
- foreground: CSS color (default "#fff")
- spacing: extra horizontal pixels between characters (default 0)

The supplied glyph images are black-background/white-glyph images. They were thresholded to 1-bit data: white pixels become set bits, unset pixels are rendered black.
Only glyphs present in the supplied archive are included.
