import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, text } from './helpers.mjs';

const pages = [
  {
    file: 'site/confidentialitate.html', lang: 'ro', canonical: FACTS.privacyRoUrl,
    words: ['cookie', 'ANSPDCP', 'WhatsApp', '27 septembrie 2026',
      'Site-ul are un formular de rezervare care funcționează doar în browserul tău'],
    mustNotInclude: ['nu folosește formulare'],
  },
  {
    file: 'site/en/privacy.html', lang: 'en', canonical: FACTS.privacyEnUrl,
    words: ['cookies', 'ANSPDCP', 'WhatsApp', '27 September 2026',
      'This website has a booking form that works only in your browser'],
    mustNotInclude: ['has no forms'],
  },
];

for (const p of pages) {
  test(`privacy page ${p.lang}`, () => {
    const html = read(p.file);
    const body = text(html);
    assert.match(html, new RegExp(`<html lang="${p.lang}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${p.canonical}">`));
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    for (const s of [FACTS.company, FACTS.cui, FACTS.phoneDisplay, FACTS.street, ...p.words]) {
      assert.ok(body.includes(s), `missing ${s}`);
    }
    for (const s of p.mustNotInclude) {
      assert.ok(!body.includes(s), `${p.file} still contains outdated claim "${s}"`);
    }
    assert.ok(!/ş|ţ|Ş|Ţ/.test(html), `${p.file} uses cedilla diacritics; use ș ț`);
    for (const attr of ['src="/', 'href="/', 'srcset="/', 'imagesrcset="/']) {
      assert.ok(!html.includes(attr), `${p.file}: root-relative reference found: ${attr}`);
    }
  });
}
