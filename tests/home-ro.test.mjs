import { test } from 'node:test';
import { FACTS } from './facts.mjs';
import { checkHomePage } from './page-checks.mjs';

test('RO home page', (t) => checkHomePage(t, {
  file: 'site/index.html',
  lang: 'ro',
  canonical: FACTS.baseUrl,
  alternate: 'en/',
  faqCount: 10,
  waLinks: [
    'https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter.%20Perioada%3A%20',
    'https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter%2050cc%20(SYM%20Jet%204%20RX).%20Perioada%3A%20',
    'https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter%20125cc.%20Perioada%3A%20',
  ],
}));
