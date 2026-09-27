// Builds site/assets/img/logo-icon.svg (icon only) and site/assets/img/logo.svg
// (icon + outlined "Scuterescu." wordmark) from the owner's logo design (images-src/design/1.jpg).
//
// The icon is TRACED from the owner's actual artwork (not hand-drawn): sharp crops the icon region,
// upscales and thresholds it to a clean black-on-white line drawing, then potrace vectorizes it into
// one filled path (the ink of the strokes becomes the fill, so evenodd keeps the strokes' interiors
// transparent).
//
// The wordmark is outlined to real vector paths with opentype.js reading the Inter 800 (ExtraBold)
// WOFF shipped by @fontsource/inter, so logo.svg renders identically everywhere it is used as an
// <img> (which cannot load the page's web fonts).
import sharp from 'sharp';
import potraceModule from 'potrace';
import opentypeModule from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';

const potrace = potraceModule.default ?? potraceModule;
const opentype = opentypeModule.default ?? opentypeModule;

function traceToSvgPath(buffer, options) {
  return new Promise((resolve, reject) => {
    potrace.trace(buffer, options, (err, svg) => {
      if (err) return reject(err);
      resolve(svg);
    });
  });
}

// --- 1. Trace the owner's scooter icon out of images-src/design/1.jpg ---
const DESIGN_SRC = 'images-src/design/1.jpg';
// Tight crop around the icon (left of the "Scuterescu." wordmark), verified by viewing the crop.
const ICON_CROP = { left: 58, top: 218, width: 180, height: 135 };
const UPSCALE = 6;

const preprocessed = await sharp(DESIGN_SRC)
  .extract(ICON_CROP)
  .greyscale()
  .resize(ICON_CROP.width * UPSCALE, ICON_CROP.height * UPSCALE, { kernel: 'lanczos3' })
  .blur(0.8)
  .threshold(160)
  .png()
  .toBuffer();

// Trim the white margin so the traced path's own viewBox is already a tight box around the ink.
const trimmed = await sharp(preprocessed).trim().png().toBuffer({ resolveWithObject: true });
const iconPxWidth = trimmed.info.width;
const iconPxHeight = trimmed.info.height;

const tracedSvg = await traceToSvgPath(trimmed.data, { threshold: 128, turdSize: 20, optTolerance: 0.4 });
const pathMatch = tracedSvg.match(/<path[^>]*\sd="([^"]+)"/);
if (!pathMatch) {
  throw new Error('potrace produced no <path> element — inspect the preprocessed PNG and re-tune threshold/blur.');
}
const ICON_PATH_D = pathMatch[1];

// logo-icon.svg: the traced icon alone, tight viewBox in the upscaled-pixel coordinate system.
writeFileSync(
  'site/assets/img/logo-icon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconPxWidth} ${iconPxHeight}" role="img" aria-label="Scuterescu">
  <title>Scuterescu</title>
  <path fill="#F5F5F4" fill-rule="evenodd" d="${ICON_PATH_D}"/>
</svg>
`
);
console.log('site/assets/img/logo-icon.svg');

// --- 2. Outline the "Scuterescu." wordmark with opentype.js ---
const FONT_PATH = 'node_modules/@fontsource/inter/files/inter-latin-800-normal.woff';
const fontBuf = readFileSync(FONT_PATH);
const font = opentype.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));

const FONT_SIZE = 34;
const TEXT = 'Scuterescu.';
const TRACKING = -0.02 * FONT_SIZE; // letter-spacing: -0.02em, applied between glyphs
const BASELINE_Y = 100;

// opentype.js's shaper throws on this font's ccmp/ligature GSUB lookup format when asked to shape a
// whole string (font.getPath(text, ...)), so glyphs are laid out one at a time — this bypasses the
// unsupported feature entirely and still produces correct per-letter outlines and advances.
let cursor = 0; // will be shifted right by (icon width + gap) once known
const glyphs = [];
for (const ch of TEXT) {
  const glyph = font.charToGlyph(ch);
  const advance = glyph.advanceWidth * (FONT_SIZE / font.unitsPerEm);
  glyphs.push({ ch, glyph, x: cursor, advance });
  cursor += advance + TRACKING;
}
const wordmarkWidth = cursor - TRACKING; // drop the trailing tracking after the last glyph

const capHeightUnits = font.tables.os2?.sCapHeight || font.charToGlyph('S').getPath(0, 0, font.unitsPerEm).getBoundingBox().y2 * -1;
const capHeightPx = capHeightUnits * (FONT_SIZE / font.unitsPerEm);

// --- 3. Lay out icon + wordmark: icon height ~= 1.1x cap height, gap ~= 0.25x icon height,
//        both vertically centred on the wordmark's cap height. ---
const ICON_HEIGHT_PX = capHeightPx * 1.1;
const ICON_SCALE = ICON_HEIGHT_PX / iconPxHeight;
const ICON_WIDTH_PX = iconPxWidth * ICON_SCALE;
const GAP_PX = ICON_HEIGHT_PX * 0.25;

const capTopY = BASELINE_Y - capHeightPx;
const capMidY = BASELINE_Y - capHeightPx / 2;
const iconTopY = capMidY - ICON_HEIGHT_PX / 2;
const iconLeftX = 0;
const textStartX = ICON_WIDTH_PX + GAP_PX;

const wordmarkPaths = glyphs
  .map(({ ch, glyph, x }) => {
    const d = glyph.getPath(textStartX + x, BASELINE_Y, FONT_SIZE).toPathData(2);
    const fill = ch === 'S' || ch === '.' ? '#F97316' : '#F5F5F4';
    return `<path fill="${fill}" d="${d}"/>`;
  })
  .join('\n    ');

const PAD = 4;
const contentLeft = 0;
const contentRight = textStartX + wordmarkWidth;
const contentTop = Math.min(iconTopY, capTopY);
const contentBottom = Math.max(iconTopY + ICON_HEIGHT_PX, BASELINE_Y + capHeightPx * 0.2); // small allowance below baseline
const viewBox = {
  minX: contentLeft - PAD,
  minY: contentTop - PAD,
  width: contentRight - contentLeft + PAD * 2,
  height: contentBottom - contentTop + PAD * 2,
};

writeFileSync(
  'site/assets/img/logo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.minX.toFixed(2)} ${viewBox.minY.toFixed(2)} ${viewBox.width.toFixed(2)} ${viewBox.height.toFixed(2)}" role="img" aria-label="Scuterescu">
  <title>Scuterescu</title>
  <g transform="translate(${iconLeftX},${iconTopY.toFixed(2)}) scale(${ICON_SCALE.toFixed(4)})">
    <path fill="#F5F5F4" fill-rule="evenodd" d="${ICON_PATH_D}"/>
  </g>
  <g>
    ${wordmarkPaths}
  </g>
</svg>
`
);
console.log('site/assets/img/logo.svg');
