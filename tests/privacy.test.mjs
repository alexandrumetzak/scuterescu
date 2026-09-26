import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, text } from './helpers.mjs';

const pages = [
  { file: 'site/confidentialitate.html', lang: 'ro', canonical: 'https://scuterescu.ro/confidentialitate.html', words: ['cookie', 'ANSPDCP', 'WhatsApp'] },
  { file: 'site/en/privacy.html', lang: 'en', canonical: 'https://scuterescu.ro/en/privacy.html', words: ['cookies', 'ANSPDCP', 'WhatsApp'] },
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
  });
}
