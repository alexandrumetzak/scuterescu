import path from 'node:path';
import { statSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, imgTags, ROOT } from './helpers.mjs';

// EN page re-added in Task 4
const PAGES = ['site/index.html'];

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
  for (const f of ['hero.webp', 'fleet-50.webp', 'fleet-125.webp', 'logo.svg', 'logo-icon.svg']) {
    assert.ok(credits.includes(f), `CREDITS.md missing ${f}`);
  }
  assert.ok(credits.includes('proprietar'), 'credits must state the images come from the owner');
});

test('traced logo SVGs are small enough to inline in every page header', () => {
  const iconSize = statSync(path.join(ROOT, 'site/assets/img/logo-icon.svg')).size;
  const logoSize = statSync(path.join(ROOT, 'site/assets/img/logo.svg')).size;
  assert.ok(iconSize < 8000, `logo-icon.svg is ${iconSize} bytes, expected < 8000`);
  assert.ok(logoSize < 16000, `logo.svg is ${logoSize} bytes, expected < 16000`);
});
