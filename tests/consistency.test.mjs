import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, text } from './helpers.mjs';

// Prices, hours and contact data must be identical everywhere they appear.
const FILES = ['site/index.html', 'site/en/index.html', 'site/llms.txt'];
const REQUIRED = [
  FACTS.phoneDisplay, FACTS.street, FACTS.company, FACTS.cui, FACTS.city, ...FACTS.models,
  ...Object.values(FACTS.tiers).flatMap((x) => [`${x['50']} RON`, `${x['125']} RON`]),
  `${FACTS.deposits['50']} RON`, `${FACTS.deposits['125']} RON`,
  `${FACTS.extras.helmet} RON`, `${FACTS.extras.phoneHolder} RON`,
  FACTS.hours.weekdays[0], FACTS.hours.weekend[0], FACTS.hours.weekdays[1],
];

for (const file of FILES) {
  test(`facts consistent in ${file}`, () => {
    const content = text(read(file));
    for (const s of REQUIRED) assert.ok(content.includes(s), `${file} missing "${s}"`);
    assert.ok(!/ş|ţ|Ş|Ţ/.test(content), `${file} uses cedilla diacritics`);
  });
}
