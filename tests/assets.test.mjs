import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { text, jsonLd, imgTags, hrefs } from './helpers.mjs';

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
