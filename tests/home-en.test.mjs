import { test } from 'node:test';
import { FACTS } from './facts.mjs';
import { checkHomePage } from './page-checks.mjs';

test('EN home page', (t) => checkHomePage(t, {
  file: 'site/en/index.html',
  lang: 'en',
  canonical: FACTS.enUrl,
  alternate: '../',
  faqCount: 10,
  waLinks: [
    'https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20scooter.%20Period%3A%20',
    'https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%2050cc%20scooter%20(SYM%20Jet%204%20RX).%20Period%3A%20',
    'https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20125cc%20scooter.%20Period%3A%20',
  ],
}));
