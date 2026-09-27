import path from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, imgTags } from './helpers.mjs';

const PAGES = ['site/index.html', 'site/en/index.html'];

test('every <img> exists and has alt, width, height', () => {
  for (const page of PAGES) {
    const dir = path.dirname(page);
    for (const img of imgTags(read(page))) {
      assert.ok(img.src && !img.src.startsWith('/'), `${page}: src must be relative, not root-relative: ${img.src}`);
      const resolved = path.normalize(path.join(dir, img.src));
      assert.ok(exists(resolved), `${page}: missing file ${resolved}`);
      assert.ok(img.alt && img.alt.length > 5, `${page}: alt missing for ${img.src}`);
      assert.ok(Number(img.width) > 0 && Number(img.height) > 0, `${page}: size missing for ${img.src}`);
    }
  }
});

test('design assets exist', () => {
  for (const f of ['site/assets/img/hero.webp', 'site/assets/img/hero-800.webp', 'site/assets/img/fleet-50.webp',
    'site/assets/img/fleet-125.webp', 'site/assets/img/logo.svg', 'site/assets/img/logo-icon.svg', 'site/og-image.jpg',
    'site/favicon.svg', 'site/apple-touch-icon.png']) {
    assert.ok(exists(f), `missing ${f}`);
  }
});

test('logo is an accessible SVG without external references', () => {
  const svg = read('site/assets/img/logo.svg');
  assert.match(svg, /^<svg[^>]*viewBox="/);
  assert.ok(svg.includes('<title>Scuterescu</title>'));
  assert.ok(svg.includes('#F97316'));
  assert.ok(!svg.includes('<text'), 'wordmark must be outlined paths, not <text>');
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(svg), 'no external references');
});

test('image credits describe every image source', () => {
  const credits = read('site/assets/img/CREDITS.md');
  for (const f of ['hero.webp', 'fleet-50.webp', 'fleet-125.webp', 'logo.svg']) {
    assert.ok(credits.includes(f), `CREDITS.md missing ${f}`);
  }
  assert.ok(credits.includes('proprietar'), 'credits must state the images come from the owner');
});
