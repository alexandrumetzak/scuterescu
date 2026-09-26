// Converts raw photos from images-src/ into optimized site images.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'images-src';
const OUT = 'site/assets/img';
mkdirSync(OUT, { recursive: true });

const jobs = [
  { input: 'hero.jpg', output: 'hero.webp', width: 1600, height: 900 },
  { input: 'hero.jpg', output: 'hero-800.webp', width: 800, height: 450 },
  { input: 'scuter-50.jpg', output: 'scuter-50.webp', width: 800, height: 600 },
  { input: 'scuter-125.jpg', output: 'scuter-125.webp', width: 800, height: 600 },
];

for (const job of jobs) {
  await sharp(`${SRC}/${job.input}`)
    .resize(job.width, job.height, { fit: 'cover' })
    .webp({ quality: 78 })
    .toFile(`${OUT}/${job.output}`);
  console.log(`${OUT}/${job.output}`);
}

await sharp(`${SRC}/hero.jpg`).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile('site/og-image.jpg');
await sharp('site/favicon.svg').resize(180, 180).png().toFile('site/apple-touch-icon.png');
console.log('site/og-image.jpg\nsite/apple-touch-icon.png');
