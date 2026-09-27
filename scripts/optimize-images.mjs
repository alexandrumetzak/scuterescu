// Builds site images from the owner's design files in images-src/design/.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'images-src/design';
const OUT = 'site/assets/img';
mkdirSync(OUT, { recursive: true });

// Hero: owner photo (scooters in front of the Palace of Culture), 1024×572 original — never upscale.
await sharp(`${SRC}/2.jpg`).webp({ quality: 80 }).toFile(`${OUT}/hero.webp`);
await sharp(`${SRC}/2.jpg`).resize(800).webp({ quality: 78 }).toFile(`${OUT}/hero-800.webp`);
await sharp(`${SRC}/2.jpg`).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile('site/og-image.jpg');

// Fleet: product shots cropped from the owner's fleet mockup (7.jpg, 1376×768).
const FLEET = {
  'fleet-50.webp': { left: 200, top: 248, width: 360, height: 236 },
  'fleet-125.webp': { left: 845, top: 248, width: 355, height: 236 },
};
for (const [file, region] of Object.entries(FLEET)) {
  await sharp(`${SRC}/7.jpg`).extract(region).resize(640, 440, { fit: 'cover' }).webp({ quality: 82 }).toFile(`${OUT}/${file}`);
}

await sharp('site/favicon.svg').resize(180, 180).png().toFile('site/apple-touch-icon.png');
console.log('images built');
