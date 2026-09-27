// Builds site/assets/img/logo-icon.svg (icon only) and site/assets/img/logo.svg
// (icon + outlined "Scuterescu." wordmark) from the owner's logo design (images-src/design/1.jpg).
//
// The wordmark is outlined to real vector paths with opentype.js reading the Inter
// 800 (ExtraBold) WOFF shipped by @fontsource/inter, so logo.svg renders identically
// everywhere it is used as an <img> (which cannot load the page's web fonts).
import opentypeModule from 'opentype.js';
import { readFileSync, writeFileSync } from 'node:fs';

const opentype = opentypeModule.default ?? opentypeModule;

// Scooter icon, single-stroke line art, drawn to match the owner's logo (images-src/design/1.jpg):
// small wheels, a bulbous rear fender/cowl flowing into a flat seat, an S-curve body down to a low
// floorboard, a front leg-shield/fork rising to the handlebar, a headlight, and a front fender.
const ICON_VIEWBOX = { minX: 8, minY: 36, width: 166, height: 82 };
const ICON_PATHS = [
  // rear wheel
  '<circle cx="37" cy="126" r="17"/>',
  // front wheel + hub
  '<circle cx="151" cy="126" r="17"/>',
  '<circle cx="151" cy="126" r="7"/>',
  // rear fender strut detail
  '<path d="M33,112 C31,118 31,124 33,130"/>',
  // spine: rear fender dome -> seat -> body S-curve -> floorboard
  '<path d="M14,112 C9,95 13,76 29,71 C34,69.5 37,71 39,75 L94,75 C97,75.5 99,78 100,83 C101,90 99,97 101,104 C103,111 106,113 108,115 L136,113"/>',
  // front fork
  '<path d="M136,113 C137,100 137,87 136,74 C135,64 133,56 130,50"/>',
  // handlebar
  '<path d="M112,50 L130,50"/>',
  // headlight
  '<circle cx="124" cy="80" r="2.3" fill="#F5F5F4" stroke="none"/>',
  // front fender
  '<path d="M134,112 C134,99 142,92 151,92 C160,92 168,99 168,112"/>',
];
const ICON_GROUP_OPEN = '<g fill="none" stroke="#F5F5F4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">';
const ICON_GROUP_CLOSE = '</g>';

writeFileSync(
  'site/assets/img/logo-icon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_VIEWBOX.minX} ${ICON_VIEWBOX.minY} ${ICON_VIEWBOX.width} ${ICON_VIEWBOX.height}" role="img" aria-label="Scuterescu">
  <title>Scuterescu</title>
  ${ICON_GROUP_OPEN}
    ${ICON_PATHS.join('\n    ')}
  ${ICON_GROUP_CLOSE}
</svg>
`
);
console.log('site/assets/img/logo-icon.svg');

// --- Outlined wordmark for logo.svg ---
const FONT_PATH = 'node_modules/@fontsource/inter/files/inter-latin-800-normal.woff';
const buf = readFileSync(FONT_PATH);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

const FONT_SIZE = 34;
const TEXT = 'Scuterescu.';
const TEXT_X = 190; // icon (0-176 local, scaled 1x within the 190x150 icon box below) + gap
const BASELINE_Y = 114;
const TRACKING = -0.02 * FONT_SIZE; // letter-spacing: -0.02em, applied between glyphs

let cursor = TEXT_X;
const glyphSpans = [];
for (const ch of TEXT) {
  const glyph = font.charToGlyph(ch);
  const glyphPath = glyph.getPath(cursor, BASELINE_Y, FONT_SIZE);
  const color = ch === 'S' || ch === '.' ? '#F97316' : '#F5F5F4';
  glyphSpans.push({ d: glyphPath.toPathData(2), fill: color });
  cursor += glyph.advanceWidth * (FONT_SIZE / font.unitsPerEm) + TRACKING;
}
const wordmarkPaths = glyphSpans.map((g) => `<path fill="${g.fill}" d="${g.d}"/>`).join('\n    ');

// Full icon (translated/scaled into the combined viewBox) + outlined wordmark.
const ICON_SCALE = 0.68; // scales the icon's local 166x82 bounding box down to sit next to the wordmark
const ICON_LEFT = 4; // final x of the icon's left edge
const ICON_TOP = 42; // final y of the icon's top edge
const ICON_TX = ICON_LEFT - ICON_VIEWBOX.minX * ICON_SCALE;
const ICON_TY = ICON_TOP - ICON_VIEWBOX.minY * ICON_SCALE;

writeFileSync(
  'site/assets/img/logo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(cursor) + 4} 150" role="img" aria-label="Scuterescu">
  <title>Scuterescu</title>
  <g transform="translate(${ICON_TX.toFixed(2)},${ICON_TY.toFixed(2)}) scale(${ICON_SCALE})">
    ${ICON_GROUP_OPEN}
      ${ICON_PATHS.join('\n      ')}
    ${ICON_GROUP_CLOSE}
  </g>
  <g>
    ${wordmarkPaths}
  </g>
</svg>
`
);
console.log('site/assets/img/logo.svg');
