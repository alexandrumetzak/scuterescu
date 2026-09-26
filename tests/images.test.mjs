import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, imgTags } from './helpers.mjs';

const PAGES = ['site/index.html', 'site/en/index.html'];

test('every <img> exists and has alt, width, height', () => {
  for (const page of PAGES) {
    for (const img of imgTags(read(page))) {
      assert.ok(img.src?.startsWith('/'), `${page}: src must be root-relative: ${img.src}`);
      assert.ok(exists(`site${img.src}`), `${page}: missing file site${img.src}`);
      assert.ok(img.alt && img.alt.length > 5, `${page}: alt missing for ${img.src}`);
      assert.ok(Number(img.width) > 0 && Number(img.height) > 0, `${page}: size missing for ${img.src}`);
    }
  }
});

test('srcset, icons and og image exist', () => {
  for (const f of ['site/assets/img/hero.webp', 'site/assets/img/hero-800.webp', 'site/og-image.jpg', 'site/favicon.svg', 'site/apple-touch-icon.png']) {
    assert.ok(exists(f), `missing ${f}`);
  }
});

test('image credits list every photo', () => {
  const credits = read('site/assets/img/CREDITS.md');
  for (const f of ['hero.jpg', 'scuter-50.jpg', 'scuter-125.jpg']) {
    assert.ok(credits.includes(f), `CREDITS.md missing ${f}`);
  }
  assert.ok(/unsplash\.com|pexels\.com/.test(credits), 'credits must link the source');
});
