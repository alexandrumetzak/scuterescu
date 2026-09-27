import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, exists, text, jsonLd, imgTags, hrefs } from './helpers.mjs';

test('helpers parse html', () => {
  const html = '<p>Tel&nbsp;1</p><script type="application/ld+json">{"a":1}</script>'
    + '<img src="/a.webp" alt="x" width="1" height="2"><a href="/b?x=1&amp;y=2">b</a>';
  assert.equal(text(html), 'Tel 1 b');
  assert.deepEqual(jsonLd(html), [{ a: 1 }]);
  assert.deepEqual(imgTags(html), [{ src: '/a.webp', alt: 'x', width: '1', height: '2' }]);
  assert.deepEqual(hrefs(html), ['/b?x=1&y=2']);
});

test('facts use comma-below diacritics', () => {
  assert.ok(FACTS.city.includes('ș'));
  assert.ok(!FACTS.city.includes('ş'));
});

test('css defines color tokens and no external imports', () => {
  const css = read('site/assets/css/style.css');
  for (const token of ['--color-btn: #C2410C', '--color-accent: #F97316', '--color-muted: #A8A29E', '--color-text: #F5F5F4', '--color-bg: #111113']) {
    assert.ok(css.includes(token), `missing ${token}`);
  }
  assert.ok(!/@import|https?:\/\//.test(css), 'css must not load external resources');
});

test('self-hosted Inter fonts exist', () => {
  assert.ok(exists('site/assets/fonts/inter-latin-wght-normal.woff2'));
  assert.ok(exists('site/assets/fonts/inter-latin-ext-wght-normal.woff2'));
});

test('main.js is valid JS and handles menu, map and year', () => {
  execFileSync(process.execPath, ['--check', 'site/assets/js/main.js']);
  const js = read('site/assets/js/main.js');
  for (const s of ['.nav-toggle', 'nav-main', '.map-facade', 'data-year']) {
    assert.ok(js.includes(s), `main.js missing ${s}`);
  }
});
