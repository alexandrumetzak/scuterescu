# Scuterescu Redesign + WhatsApp Booking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle scuterescu.ro to the owner's dark design with the new logo and hero photo, switch to duration-tier pricing, and add a booking form that builds a WhatsApp message (no server).

**Architecture:** Static site in `site/` on GitHub Pages (relative paths only). Pricing and message logic live in a pure ES module `site/assets/js/pricing.js`, unit-tested in Node and imported by `site/assets/js/booking.js` (DOM wiring). Page content tests read the HTML and compare against `tests/facts.mjs` and against `pricing.js` itself, so prices can't drift.

**Tech Stack:** HTML5, CSS custom properties, vanilla ES modules, JSON-LD, Node 24 `node:test`, html-validate, sharp.

**Spec:** `docs/superpowers/specs/2026-09-27-scuterescu-redesign-design.md` (overrides the older spec where they differ). Owner design mockups: `images-src/design/1.jpg` (logo), `2.jpg` (hero photo), `3.jpg`/`6.jpg` (tariffs), `4.jpg` (why us), `5.jpg` (hero layout), `7.jpg` (fleet), `8.jpg` (booking). `images-src/` is git-ignored and exists only locally.

## Global Constraints

- Tariffs RON/day — 1–2 days: 50cc 90, 125cc 100; 3–6 days: 50cc 79, 125cc 89; 7+ days: 50cc 45, 125cc 50.
- Included in every tariff: helmet, RCA insurance, anti-theft system. 7+ days also includes phone holder.
- Extras for the whole rental: extra helmet 20 RON; phone holder 10 RON (free at 7+ days).
- Deposit (refundable, not in total): 50cc 300 RON, 125cc 350 RON.
- Total = days × tier rate + 20 (extra helmet) + 10 (phone holder, only if days < 7). Days = calendar-day difference between return and pickup date, minimum 1.
- 50cc: SYM Jet 4 RX — licence AM or B. 125cc: Voge SR125 ADV, also SYM Jet 4 RX 125 — licence A1, A or B (minimum 24 years + course).
- Confirmed claims only: 24/7 roadside assistance, unlimited km, anti-theft, 2024+ models. Never mention a dashcam / „cameră de bord”. Use „pleci rapid” (not „5 minute”), „Discounturi pentru perioade lungi” (not „Rezervare garantată”).
- Unchanged: phone `+40 756 205 206` (WhatsApp `40756205206`), address `Str. Al. O. Teodoreanu nr. 49`, `700154 Iași`, hours Mon–Fri 09:00–19:00, Sat–Sun 12:00–19:00, METZ CARS SRL, CUI RO42088025, min age 18, no delivery.
- Romanian diacritics with comma-below ș ț (U+0219/U+021B), never cedilla.
- All internal references relative (no `src="/`, `href="/`); no third-party requests on page load; map loads on click only.
- Colors: bg `#111113`, alt section `#18181B`, text `#F5F5F4`, muted `#A8A29E`, accent `#F97316`, filled buttons `#C2410C` with white text. WCAG AA contrast.
- Lighthouse mobile ≥ 95 in all categories.
- Commit messages end with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never commit `.superpowers/`, `.claude/`, `images-src/`.

---

## File Structure

```
site/assets/js/pricing.js      NEW  pure pricing + WhatsApp message logic (ES module)
site/assets/js/booking.js      NEW  booking form wiring (ES module, imports pricing.js)
site/assets/js/main.js         keep (menu, map, year)
site/assets/css/style.css      REWRITE dark theme
site/assets/img/logo.svg       NEW  logo for dark background
site/assets/img/hero.webp, hero-800.webp      REGENERATED from owner photo
site/assets/img/fleet-50.webp, fleet-125.webp NEW  crops from owner mockup
site/assets/img/scuter-50.webp, scuter-125.webp DELETE (Task 3)
site/assets/img/CREDITS.md     REWRITE
site/favicon.svg, apple-touch-icon.png, og-image.jpg  REGENERATED
site/index.html, site/en/index.html            REWRITE
site/confidentialitate.html, site/en/privacy.html  header logo only
site/llms.txt                  REWRITE prices
scripts/optimize-images.mjs    UPDATE sources/crops
tests/pricing.test.mjs         NEW
tests/facts.mjs, page-checks.mjs, home-ro/en.test.mjs, images.test.mjs, consistency.test.mjs  UPDATE
README.md                      UPDATE "change prices" section
```

---

### Task 1: Pricing and WhatsApp message module

**Files:**
- Create: `site/assets/js/pricing.js`, `tests/pricing.test.mjs`

**Interfaces:**
- Produces (ES module exports, used by Tasks 3–5):
  - `PHONE_WA: string` (`'40756205206'`)
  - `CATEGORIES: { '50': {label, models, deposit}, '125': {…} }`
  - `TIERS: Array<{ id: '1-2'|'3-6'|'7+', minDays, maxDays: number|null, rates: {'50': number, '125': number} }>`
  - `EXTRAS: { helmet: 20, phoneHolder: 10 }`, `PHONE_HOLDER_FREE_FROM_DAYS: 7`
  - `rentalDays(startIso, endIso): number|null`
  - `tierFor(days): Tier`
  - `quote({ category, days, extraHelmet, phoneHolder }): { tier, rate, days, rentalCost, extras, total, phoneHolderIncluded, deposit }`
  - `tierLabel(lang, tierId): string`
  - `buildBookingMessage(lang, { category, start, end, pickupTime, returnTime, extraHelmet, phoneHolder, name }): string`
  - `buildPackageMessage(lang, tierId): string`
  - `waLink(message): string`

- [ ] **Step 1: Write the failing tests `tests/pricing.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PHONE_WA, CATEGORIES, TIERS, EXTRAS, rentalDays, tierFor, quote, tierLabel,
  buildBookingMessage, buildPackageMessage, waLink,
} from '../site/assets/js/pricing.js';

test('tariff table matches the owner price list', () => {
  assert.deepEqual(TIERS.map((t) => [t.id, t.minDays, t.maxDays, t.rates['50'], t.rates['125']]), [
    ['1-2', 1, 2, 90, 100],
    ['3-6', 3, 6, 79, 89],
    ['7+', 7, null, 45, 50],
  ]);
  assert.deepEqual(EXTRAS, { helmet: 20, phoneHolder: 10 });
  assert.equal(CATEGORIES['50'].deposit, 300);
  assert.equal(CATEGORIES['125'].deposit, 350);
  assert.equal(PHONE_WA, '40756205206');
});

test('rentalDays counts calendar days, minimum 1, null when invalid', () => {
  assert.equal(rentalDays('2026-06-15', '2026-06-19'), 4);
  assert.equal(rentalDays('2026-06-15', '2026-06-15'), 1);
  assert.equal(rentalDays('2026-06-15', '2026-06-16'), 1);
  assert.equal(rentalDays('2026-03-28', '2026-03-30'), 2); // across DST change
  assert.equal(rentalDays('2026-06-19', '2026-06-15'), null);
  assert.equal(rentalDays('', '2026-06-15'), null);
});

test('tierFor picks the right tier at every boundary', () => {
  assert.deepEqual([1, 2, 3, 6, 7, 30].map((d) => tierFor(d).id), ['1-2', '1-2', '3-6', '3-6', '7+', '7+']);
});

test('quote computes total with extras; phone holder free from 7 days', () => {
  const q = quote({ category: '125', days: 4, extraHelmet: true, phoneHolder: true });
  assert.equal(q.rate, 89);
  assert.equal(q.rentalCost, 356);
  assert.equal(q.extras, 30);
  assert.equal(q.total, 386);
  assert.equal(q.deposit, 350);
  assert.equal(q.phoneHolderIncluded, false);

  const week = quote({ category: '50', days: 7, extraHelmet: false, phoneHolder: true });
  assert.equal(week.rate, 45);
  assert.equal(week.total, 315);
  assert.equal(week.phoneHolderIncluded, true);

  assert.equal(quote({ category: '50', days: 1 }).total, 90);
});

test('tier labels', () => {
  assert.equal(tierLabel('ro', '1-2'), '1–2 zile');
  assert.equal(tierLabel('ro', '7+'), '7+ zile');
  assert.equal(tierLabel('en', '3-6'), '3–6 days');
});

test('booking message RO contains every detail', () => {
  const msg = buildBookingMessage('ro', {
    category: '125', start: '2026-06-15', end: '2026-06-19', pickupTime: '10:00', returnTime: '18:00',
    extraHelmet: true, phoneHolder: true, name: 'Ana',
  });
  assert.equal(msg, [
    'Bună! Aș dori să rezerv un scuter.',
    'Scuter: 125cc (Voge SR125 ADV / SYM Jet 4 RX 125)',
    'Perioada: 15.06.2026 – 19.06.2026 (4 zile)',
    'Ora ridicare: 10:00',
    'Ora predare: 18:00',
    'Tarif: 89 RON/zi (3–6 zile)',
    'Opțiuni: cască suplimentară (20 RON), suport telefon (10 RON)',
    'Total estimat: 386 RON',
    'Garanție returnabilă: 350 RON',
    'Nume: Ana',
  ].join('\n'));
});

test('booking message omits empty optional lines and marks included phone holder', () => {
  const msg = buildBookingMessage('ro', {
    category: '50', start: '2026-07-01', end: '2026-07-08', pickupTime: '', returnTime: '',
    extraHelmet: false, phoneHolder: true, name: '  ',
  });
  assert.equal(msg, [
    'Bună! Aș dori să rezerv un scuter.',
    'Scuter: 50cc (SYM Jet 4 RX)',
    'Perioada: 01.07.2026 – 08.07.2026 (7 zile)',
    'Tarif: 45 RON/zi (7+ zile)',
    'Opțiuni: suport telefon (inclus)',
    'Total estimat: 315 RON',
    'Garanție returnabilă: 300 RON',
  ].join('\n'));

  const one = buildBookingMessage('ro', { category: '50', start: '2026-07-01', end: '2026-07-01' });
  assert.ok(one.includes('(1 zi)'));
  assert.ok(one.includes('Opțiuni: fără'));
});

test('booking message EN', () => {
  const msg = buildBookingMessage('en', {
    category: '50', start: '2026-06-15', end: '2026-06-16', extraHelmet: true, phoneHolder: false,
  });
  assert.equal(msg, [
    'Hi! I would like to book a scooter.',
    'Scooter: 50cc (SYM Jet 4 RX)',
    'Period: 15.06.2026 – 16.06.2026 (1 day)',
    'Rate: 90 RON/day (1–2 days)',
    'Extras: extra helmet (20 RON)',
    'Estimated total: 110 RON',
    'Refundable deposit: 300 RON',
  ].join('\n'));
});

test('package messages RO and EN', () => {
  assert.equal(buildPackageMessage('ro', '3-6'),
    'Bună! Aș dori să rezerv pachetul 3–6 zile (50cc: 79 RON/zi, 125cc: 89 RON/zi).\nScuter (50cc sau 125cc): \nPerioada: ');
  assert.equal(buildPackageMessage('en', '7+'),
    'Hi! I would like to book the 7+ days package (50cc: 45 RON/day, 125cc: 50 RON/day).\nScooter (50cc or 125cc): \nPeriod: ');
});

test('waLink encodes the message for wa.me', () => {
  assert.equal(waLink('Bună! a&b\nc'), 'https://wa.me/40756205206?text=Bun%C4%83!%20a%26b%0Ac');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/pricing.test.mjs`
Expected: FAIL — `Cannot find module '.../site/assets/js/pricing.js'`.

- [ ] **Step 3: Create `site/assets/js/pricing.js`**

```js
// Tariffs, totals and WhatsApp messages for Scuterescu. Pure functions, no DOM.
export const PHONE_WA = '40756205206';

export const CATEGORIES = {
  '50': { label: '50cc', models: 'SYM Jet 4 RX', deposit: 300 },
  '125': { label: '125cc', models: 'Voge SR125 ADV / SYM Jet 4 RX 125', deposit: 350 },
};

export const TIERS = [
  { id: '1-2', minDays: 1, maxDays: 2, rates: { '50': 90, '125': 100 } },
  { id: '3-6', minDays: 3, maxDays: 6, rates: { '50': 79, '125': 89 } },
  { id: '7+', minDays: 7, maxDays: null, rates: { '50': 45, '125': 50 } },
];

export const EXTRAS = { helmet: 20, phoneHolder: 10 };
export const PHONE_HOLDER_FREE_FROM_DAYS = 7;

const DAY_MS = 86_400_000;

const TEXT = {
  ro: {
    tiers: { '1-2': '1–2 zile', '3-6': '3–6 zile', '7+': '7+ zile' },
    days: (n) => (n === 1 ? '1 zi' : `${n} zile`),
    greeting: 'Bună! Aș dori să rezerv un scuter.',
    scooter: 'Scuter',
    period: 'Perioada',
    pickup: 'Ora ridicare',
    return: 'Ora predare',
    rate: (r, tier) => `Tarif: ${r} RON/zi (${tier})`,
    extras: 'Opțiuni',
    none: 'fără',
    helmet: 'cască suplimentară',
    phoneHolder: 'suport telefon',
    included: 'inclus',
    total: 'Total estimat',
    deposit: 'Garanție returnabilă',
    name: 'Nume',
    package: (tier, r50, r125) => `Bună! Aș dori să rezerv pachetul ${tier} (50cc: ${r50} RON/zi, 125cc: ${r125} RON/zi).\nScuter (50cc sau 125cc): \nPerioada: `,
  },
  en: {
    tiers: { '1-2': '1–2 days', '3-6': '3–6 days', '7+': '7+ days' },
    days: (n) => (n === 1 ? '1 day' : `${n} days`),
    greeting: 'Hi! I would like to book a scooter.',
    scooter: 'Scooter',
    period: 'Period',
    pickup: 'Pick-up time',
    return: 'Return time',
    rate: (r, tier) => `Rate: ${r} RON/day (${tier})`,
    extras: 'Extras',
    none: 'none',
    helmet: 'extra helmet',
    phoneHolder: 'phone holder',
    included: 'included',
    total: 'Estimated total',
    deposit: 'Refundable deposit',
    name: 'Name',
    package: (tier, r50, r125) => `Hi! I would like to book the ${tier} package (50cc: ${r50} RON/day, 125cc: ${r125} RON/day).\nScooter (50cc or 125cc): \nPeriod: `,
  },
};

// Calendar days between two ISO dates (YYYY-MM-DD); a same-day rental counts as 1.
export function rentalDays(startIso, endIso) {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return Math.max(1, Math.round((end - start) / DAY_MS));
}

export function tierFor(days) {
  return TIERS.find((t) => days >= t.minDays && (t.maxDays === null || days <= t.maxDays));
}

export function quote({ category, days, extraHelmet = false, phoneHolder = false }) {
  const tier = tierFor(days);
  const rate = tier.rates[category];
  const phoneHolderIncluded = days >= PHONE_HOLDER_FREE_FROM_DAYS;
  const extras = (extraHelmet ? EXTRAS.helmet : 0)
    + (phoneHolder && !phoneHolderIncluded ? EXTRAS.phoneHolder : 0);
  const rentalCost = days * rate;
  return {
    tier, rate, days, rentalCost, extras, total: rentalCost + extras,
    phoneHolderIncluded, deposit: CATEGORIES[category].deposit,
  };
}

export function tierLabel(lang, tierId) {
  return TEXT[lang].tiers[tierId];
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function buildBookingMessage(lang, {
  category, start, end, pickupTime = '', returnTime = '', extraHelmet = false, phoneHolder = false, name = '',
}) {
  const t = TEXT[lang];
  const days = rentalDays(start, end);
  const q = quote({ category, days, extraHelmet, phoneHolder });
  const cat = CATEGORIES[category];

  const extras = [];
  if (extraHelmet) extras.push(`${t.helmet} (${EXTRAS.helmet} RON)`);
  if (q.phoneHolderIncluded) extras.push(`${t.phoneHolder} (${t.included})`);
  else if (phoneHolder) extras.push(`${t.phoneHolder} (${EXTRAS.phoneHolder} RON)`);

  const lines = [
    t.greeting,
    `${t.scooter}: ${cat.label} (${cat.models})`,
    `${t.period}: ${formatDate(start)} – ${formatDate(end)} (${t.days(days)})`,
  ];
  if (pickupTime) lines.push(`${t.pickup}: ${pickupTime}`);
  if (returnTime) lines.push(`${t.return}: ${returnTime}`);
  lines.push(
    t.rate(q.rate, t.tiers[q.tier.id]),
    `${t.extras}: ${extras.length ? extras.join(', ') : t.none}`,
    `${t.total}: ${q.total} RON`,
    `${t.deposit}: ${q.deposit} RON`,
  );
  if (name.trim()) lines.push(`${t.name}: ${name.trim()}`);
  return lines.join('\n');
}

export function buildPackageMessage(lang, tierId) {
  const tier = TIERS.find((x) => x.id === tierId);
  return TEXT[lang].package(TEXT[lang].tiers[tierId], tier.rates['50'], tier.rates['125']);
}

export function waLink(message) {
  return `https://wa.me/${PHONE_WA}?text=${encodeURIComponent(message)}`;
}
```

Note: the test `buildBookingMessage('ro', { category: '50', start: '2026-07-01', end: '2026-07-08', …phoneHolder: true })` expects only `suport telefon (inclus)` — at 7+ days the phone holder is listed as included regardless of the checkbox. That is intended.

- [ ] **Step 4: Run tests**

Run: `node --test tests/pricing.test.mjs && npm test`
Expected: all pricing tests PASS; the rest of the suite still passes (old pages untouched).

- [ ] **Step 5: Commit**

```bash
git add site/assets/js/pricing.js tests/pricing.test.mjs
git commit -m "feat: add tier pricing and WhatsApp message module"
```

---

### Task 2: Logo, favicon and images from the owner's design

**Files:**
- Create: `site/assets/img/logo.svg`, `site/assets/img/fleet-50.webp`, `site/assets/img/fleet-125.webp`
- Modify: `scripts/optimize-images.mjs`, `site/favicon.svg`, `site/assets/img/CREDITS.md`, `tests/images.test.mjs`
- Regenerate: `site/assets/img/hero.webp`, `hero-800.webp`, `site/og-image.jpg`, `site/apple-touch-icon.png`

**Interfaces:**
- Produces files used by Tasks 3–5: `assets/img/logo.svg` (viewBox wide, text on transparent background, legible on `#111113`), `assets/img/hero.webp` (1024×572), `assets/img/hero-800.webp` (800×447), `assets/img/fleet-50.webp`, `assets/img/fleet-125.webp` (both 640×440, product shot on dark background).
- Old `scuter-50.webp`/`scuter-125.webp` stay until Task 3 removes them (pages still reference them).

- [ ] **Step 1: Update `tests/images.test.mjs` (failing)**

Replace the two last tests with:

```js
test('design assets exist', () => {
  for (const f of ['site/assets/img/hero.webp', 'site/assets/img/hero-800.webp', 'site/assets/img/fleet-50.webp',
    'site/assets/img/fleet-125.webp', 'site/assets/img/logo.svg', 'site/og-image.jpg', 'site/favicon.svg',
    'site/apple-touch-icon.png']) {
    assert.ok(exists(f), `missing ${f}`);
  }
});

test('logo is an accessible SVG without external references', () => {
  const svg = read('site/assets/img/logo.svg');
  assert.match(svg, /^<svg[^>]*viewBox="/);
  assert.ok(svg.includes('<title>Scuterescu</title>'));
  assert.ok(svg.includes('#F97316'));
  assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(svg), 'no external references');
});

test('image credits describe every image source', () => {
  const credits = read('site/assets/img/CREDITS.md');
  for (const f of ['hero.webp', 'fleet-50.webp', 'fleet-125.webp', 'logo.svg']) {
    assert.ok(credits.includes(f), `CREDITS.md missing ${f}`);
  }
  assert.ok(credits.includes('proprietar'), 'credits must state the images come from the owner');
});
```

Run: `node --test tests/images.test.mjs` — Expected: FAIL (fleet/logo missing).

- [ ] **Step 2: Create `site/assets/img/logo.svg`**

Recreate the owner's logo (`images-src/design/1.jpg`) as SVG for a dark background: on the left a line-art scooter icon (single-stroke paths, stroke `#F5F5F4`, `stroke-width` ≈ 2.5 at a 48px-high icon, round caps/joins, classic step-through scooter silhouette like the mockup); on the right the wordmark „Scuterescu.” — „S” and the final „.” in `#F97316`, „cuterescu” in `#F5F5F4`. Render the wordmark as `<text>` with `font-family="Inter, system-ui, sans-serif" font-weight="800"` (the page already loads Inter), `letter-spacing="-0.02em"`. Include `role="img"`, `aria-labelledby="logo-title"`, `<title id="logo-title">Scuterescu</title>`. Suggested `viewBox="0 0 300 56"`. View it (convert with sharp to PNG in `/tmp` and Read it) and adjust until the icon clearly reads as a scooter and the text fits without clipping.

- [ ] **Step 3: Replace `site/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#111113"/>
  <text x="32" y="46" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="#F97316">S</text>
</svg>
```

- [ ] **Step 4: Rewrite `scripts/optimize-images.mjs`**

```js
// Builds site images from the owner's design files in images-src/design/.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'images-src/design';
const OUT = 'site/assets/img';
mkdirSync(OUT, { recursive: true });

// Hero: owner photo (scooters in front of the Palace of Culture), 1024×572 original — never upscale.
await sharp(`${SRC}/2.jpg`).webp({ quality: 80 }).toFile(`${OUT}/hero.webp`);
await sharp(`${SRC}/2.jpg`).resize(800).webp({ quality: 78 }).toFile(`${OUT}/hero-800.webp`);
await sharp(`${SRC}/2.jpg`).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile('site/og-image.jpg');

// Fleet: product shots cropped from the owner's fleet mockup (7.jpg, 1376×768).
const FLEET = {
  'fleet-50.webp': { left: 190, top: 240, width: 340, height: 234 },
  'fleet-125.webp': { left: 840, top: 236, width: 340, height: 234 },
};
for (const [file, region] of Object.entries(FLEET)) {
  await sharp(`${SRC}/7.jpg`).extract(region).resize(640, 440, { fit: 'cover' }).webp({ quality: 82 }).toFile(`${OUT}/${file}`);
}

await sharp('site/favicon.svg').resize(180, 180).png().toFile('site/apple-touch-icon.png');
console.log('images built');
```

Run `npm run images`, then view `site/assets/img/fleet-50.webp` and `fleet-125.webp` with Read. The crop regions above are starting estimates: adjust `left/top/width/height` (keep the 340×234 ≈ 640×440 ratio) until each scooter is fully in frame, centred, with no card border, title text or checkmark text from the mockup visible. Re-run until clean.

- [ ] **Step 5: Rewrite `site/assets/img/CREDITS.md`**

```markdown
# Image credits

All images are provided by the owner (proprietar), METZ CARS SRL / Scuterescu, from the site design files.

- hero.webp, hero-800.webp, og-image.jpg — owner photo: scooters in front of the Palace of Culture, Iași (design file 2.jpg)
- fleet-50.webp — SYM Jet 4 RX, cropped from the owner's fleet mockup (design file 7.jpg)
- fleet-125.webp — Voge SR125 ADV, cropped from the owner's fleet mockup (design file 7.jpg)
- logo.svg, favicon.svg, apple-touch-icon.png — redrawn from the owner's logo (design file 1.jpg)

Replace the fleet crops with full-resolution photos of the real scooters when available.
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all PASS (old `scuter-*.webp` still exist for the current pages).

- [ ] **Step 7: Commit**

```bash
git add scripts/optimize-images.mjs site/assets/img site/favicon.svg site/apple-touch-icon.png site/og-image.jpg tests/images.test.mjs
git commit -m "feat: add owner logo, hero photo and fleet images"
```

---

### Task 3: Dark theme, Romanian page and booking form

**Files:**
- Rewrite: `site/assets/css/style.css`, `site/index.html`
- Create: `site/assets/js/booking.js`
- Modify: `tests/facts.mjs`, `tests/page-checks.mjs`, `tests/home-ro.test.mjs`, `tests/home-en.test.mjs` (skip), `tests/consistency.test.mjs` (RO only for now)
- Delete: `site/assets/img/scuter-50.webp`, `site/assets/img/scuter-125.webp`

**Interfaces:**
- Consumes: `pricing.js` exports (Task 1); `logo.svg`, `hero*.webp`, `fleet-*.webp` (Task 2); `main.js` hooks `.nav-toggle`, `#nav-main`, `.map-facade[data-src][data-title]`, `[data-year]` (unchanged).
- Produces for Task 4 (EN page must mirror): CSS class names you define, and the booking form contract below.

**Booking form contract (RO ids; EN uses the same ids and `name`s):**
- `<section id="rezervare">` (EN: `id="booking"`) containing `<form id="booking-form" data-lang="ro" novalidate>`.
- Inputs: `name="start"` `type="date"` required; `name="end"` `type="date"` required; `name="pickupTime"` `type="time"`; `name="returnTime"` `type="time"`; radio `name="category"` values `50` and `125` (50 checked by default); checkbox `name="extraHelmet"`; checkbox `name="phoneHolder"`; `name="name"` `type="text"` `autocomplete="name"` optional. Every input has a visible `<label>`.
- Summary: element `#booking-summary` with `aria-live="polite"` showing days, scooter, rate/day and tier, extras, total (`#booking-total`), deposit.
- Error element `#booking-error` (`role="alert"`), empty by default.
- Submit button text „Trimite rezervarea pe WhatsApp” (EN „Send booking on WhatsApp”).
- Note text: „Rezervarea se confirmă pe WhatsApp, în funcție de disponibilitate.” (EN „Your booking is confirmed on WhatsApp, subject to availability.”)
- `<noscript>`: a paragraph with a generic WhatsApp link (same generic link as the hero).
- Fleet buttons „Alege 50cc” / „Alege 125cc”: `<a href="#rezervare" data-select-category="50">` / `"125"`.
- Loaded with `<script type="module" src="assets/js/booking.js"></script>` (EN: `../assets/js/booking.js`).

- [ ] **Step 1: Update `tests/facts.mjs`**

Replace `models`, `prices`, `helmetDay` with:

```js
  models: ['SYM Jet 4 RX', 'SYM Jet 4 RX 125', 'Voge SR125 ADV'],
  tiers: {
    '1-2': { '50': 90, '125': 100, minDays: 1, maxDays: 2 },
    '3-6': { '50': 79, '125': 89, minDays: 3, maxDays: 6 },
    '7+': { '50': 45, '125': 50, minDays: 7, maxDays: null },
  },
  deposits: { '50': 300, '125': 350 },
  extras: { helmet: 20, phoneHolder: 10 },
```

(keep every other key).

- [ ] **Step 2: Update `tests/page-checks.mjs`**

Add at the top: `import { buildPackageMessage, waLink } from '../site/assets/js/pricing.js';`

Change the signature to `checkHomePage(t, { file, lang, canonical, alternate, waLinks, faqCount, bookingId })`.

Replace the `visible facts` subtest body with:

```js
    const prices = [...new Set(Object.values(FACTS.tiers).flatMap((x) => [x['50'], x['125']]))];
    for (const s of [FACTS.phoneDisplay, FACTS.street, FACTS.cui, FACTS.company, ...FACTS.models,
      ...prices.map((p) => `${p} RON`), `${FACTS.deposits['50']} RON`, `${FACTS.deposits['125']} RON`,
      `${FACTS.extras.helmet} RON`, `${FACTS.extras.phoneHolder} RON`, '09:00', '12:00', '19:00']) {
      assert.ok(body.includes(s), `page text missing "${s}"`);
    }
    assert.ok(!/ş|ţ|Ş|Ţ/.test(html), 'cedilla diacritics found; use ș ț');
    assert.ok(!/cameră de bord|camera de bord|dashcam|dash cam/i.test(body), 'dashcam claim must not appear');
    for (const old of ['70 RON', '80 RON/zi', '80 RON/day']) assert.ok(!body.includes(old), `old price "${old}" still on page`);
```

In `call and whatsapp links`, after the existing loop add:

```js
    for (const tierId of Object.keys(FACTS.tiers)) {
      const link = waLink(buildPackageMessage(lang, tierId));
      assert.ok(links.includes(link), `missing package link for ${tierId}`);
    }
```

Add a new subtest:

```js
  t.test('booking form contract', () => {
    assert.ok(html.includes(`id="${bookingId}"`), 'booking section');
    assert.ok(html.includes(`<form id="booking-form" data-lang="${lang}" novalidate>`));
    for (const n of ['start', 'end', 'pickupTime', 'returnTime', 'extraHelmet', 'phoneHolder', 'name']) {
      assert.match(html, new RegExp(`name="${n}"`), `missing input ${n}`);
    }
    assert.match(html, /name="category" value="50"[^>]*checked/);
    assert.match(html, /name="category" value="125"/);
    for (const id of ['booking-summary', 'booking-total', 'booking-error']) assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
    assert.ok(html.includes('aria-live="polite"'));
    assert.ok(html.includes('<noscript>'));
    assert.match(html, /<script type="module" src="(\.\.\/)?assets\/js\/booking\.js"><\/script>/);
    assert.match(html, /data-select-category="50"/);
    assert.match(html, /data-select-category="125"/);
    const labels = (html.match(/<label\b/g) || []).length;
    assert.ok(labels >= 9, `every booking input needs a label (found ${labels})`);
  });
```

In the JSON-LD subtest replace the per-offer loop (`for (const cc of Object.keys(FACTS.prices))…`) with:

```js
    assert.equal(biz.makesOffer.length, 6);
    for (const [tierId, tier] of Object.entries(FACTS.tiers)) {
      for (const cc of ['50', '125']) {
        const matches = biz.makesOffer.filter((o) => o.itemOffered.name.includes(`${cc}cc`)
          && o.eligibleQuantity?.minValue === tier.minDays);
        assert.equal(matches.length, 1, `expected one ${cc}cc offer for ${tierId}`);
        const o = matches[0];
        assert.equal(o.priceSpecification.price, tier[cc], `${cc}cc ${tierId} price`);
        assert.equal(o.priceSpecification.unitCode, 'DAY');
        if (tier.maxDays) assert.equal(o.eligibleQuantity.maxValue, tier.maxDays);
        else assert.equal(o.eligibleQuantity.maxValue, undefined);
      }
    }
```

- [ ] **Step 3: Update `tests/home-ro.test.mjs`** — add `bookingId: 'rezervare',` to the options. Keep the three existing generic `waLinks` only if the page still uses those exact messages; the hero and mobile bar must keep using the first generic link (`…scuter.%20Perioada%3A%20`), so keep only that one in `waLinks`.

- [ ] **Step 4: Temporarily skip the EN page and EN/llms consistency**

In `tests/home-en.test.mjs` change `test('EN home page', …)` to `test.skip('EN home page — re-enabled in Task 4', …)` and add `bookingId: 'booking',` to its options. In `tests/consistency.test.mjs` set `const FILES = ['site/index.html'];` with a comment `// EN page and llms.txt re-added in Tasks 4–5` and replace the price entries of `REQUIRED` with:

```js
  ...Object.values(FACTS.tiers).flatMap((x) => [`${x['50']} RON`, `${x['125']} RON`]),
  `${FACTS.deposits['50']} RON`, `${FACTS.deposits['125']} RON`,
  `${FACTS.extras.helmet} RON`, `${FACTS.extras.phoneHolder} RON`,
```

(remove `helmetDay`).

Run: `npm test` — Expected: RO page and consistency FAIL on new prices/booking; pricing/images/privacy/seo pass.

- [ ] **Step 5: Rewrite `site/assets/css/style.css` (dark theme)**

Keep: the two `@font-face` blocks (relative `../fonts/` URLs), `.visually-hidden`, `.skip-link`, `:focus-visible`, `.container`, `prefers-reduced-motion`, mobile nav behaviour (`.nav-toggle`, `.nav.is-open`), `.mobile-bar`, `.map-facade`/`.map-frame`, `.prose`, `.nowrap`, and the mobile hero rule (image on top, content below). Change the tokens to the Global Constraints colors and restyle to match the owner mockups (`images-src/design/3.jpg`–`8.jpg`; view them with Read):
- Section titles centred, large (clamp ~2–2.8rem, weight 800), ending with an orange „.” (`<span class="dot">.</span>`), subtitle in muted color.
- Glass cards: `background: rgb(255 255 255 / .04); border: 1px solid rgb(255 255 255 / .10); border-radius: 16px; backdrop-filter: blur(12px)`.
- Highlighted tariff card (7+): orange border and soft orange glow (`box-shadow: 0 0 32px rgb(249 115 22 / .25)`), badge „Cel mai avantajos” pill in `#C2410C`.
- Buttons: filled `#C2410C` + white, pill radius, min-height 48px; secondary „WhatsApp” button outlined (`border: 1px solid rgb(255 255 255 / .25)`), white text.
- Hero desktop: photo full-bleed (`min-height: min(88vh, 720px)`), gradient overlay darker on the left, glass card on the left (max-width ~460px) with H1, two mini-cards (50cc/125cc: title in orange, licence line, model, „de la … RON/zi” in orange) and the two buttons — as in `5.jpg`.
- Fleet cards: dark cards, image on dark background, list items with an orange ✓.
- Booking: two columns on desktop (form left, summary card right with orange border/glow like `8.jpg`), step headers with „1/3” pill; scooter choice as two large selectable cards (radio inputs visually styled, keyboard-accessible, focus visible); one column on mobile.
- Tables/FAQ/contact/footer restyled for the dark theme. Contrast ≥ 4.5:1 for body text (muted `#A8A29E` on `#111113` passes).
- No external resources.

- [ ] **Step 6: Rewrite `site/index.html`**

Keep the existing `<head>` structure (charset, viewport, canonical, hreflang, OG, twitter, icons, font preload, hero preload, stylesheet) with these changes: `<meta name="theme-color" content="#111113">`; `<title>Închiriere scutere Iași | 50cc și 125cc de la 45 RON/zi | Scuterescu</title>`; meta description (≤160 chars) mentioning SYM și Voge, de la 45 RON/zi, RCA și cască incluse, telefon; OG title/description updated the same way.

JSON-LD `@graph`:
- `AutoRental` — keep all existing fields; `description` updated; `logo`: `https://scuterescu.ro/assets/img/logo.svg`; `priceRange`: `"45–100 RON/zi"`; `makesOffer`: 6 offers, one per category × tier, e.g.
  `{ "@type": "Offer", "name": "Închiriere scuter 125cc — 3–6 zile", "itemOffered": { "@type": "Product", "name": "Scuter 125cc Voge SR125 ADV sau SYM Jet 4 RX 125" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 89, "priceCurrency": "RON", "unitCode": "DAY", "unitText": "zi" }, "eligibleQuantity": { "@type": "QuantitativeValue", "minValue": 3, "maxValue": 6, "unitCode": "DAY" } }`
  (7+ tier: `"minValue": 7` and no `maxValue`; 50cc product name „Scuter 50cc SYM Jet 4 RX”).
- `FAQPage` with exactly these 10 Q&As (visible `<details><summary>` text must match word for word):
  1. „Cât costă să închiriez un scuter în Iași?” — „Prețul depinde de durată: 1–2 zile costă 90 RON/zi (50cc) sau 100 RON/zi (125cc), 3–6 zile costă 79 RON/zi sau 89 RON/zi, iar de la 7 zile costă 45 RON/zi sau 50 RON/zi. Casca și asigurarea RCA sunt incluse.”
  2. „Ce permis îmi trebuie pentru un scuter de 50cc?” — „Pentru un scuter de 50cc ai nevoie de permis categoria AM sau B.”
  3. „Ce permis îmi trebuie pentru un scuter de 125cc?” — „Pentru un scuter de 125cc ai nevoie de permis categoria A1 sau A, ori de permis categoria B dacă ai minimum 24 de ani și ai absolvit cursul necesar.”
  4. „Cât este garanția?” — „Garanția este de 300 RON pentru scuterele de 50cc și 350 RON pentru scuterele de 125cc. Se plătește la ridicare și se returnează la predarea scuterului.”
  5. „Ce este inclus în preț?” — „Toate tarifele includ casca, asigurarea RCA, sistemul antifurt, asistența rutieră 24/7 și kilometri nelimitați. La închirierile de minimum 7 zile este inclus și suportul de telefon.”
  6. „Ce opțiuni suplimentare există?” — „Poți adăuga o cască suplimentară pentru pasager cu 20 RON și un suport de telefon cu 10 RON, pentru toată perioada închirierii. Suportul de telefon este gratuit de la 7 zile.”
  7. „Care este vârsta minimă pentru a închiria un scuter?” — „Vârsta minimă pentru a închiria un scuter este 18 ani. Pentru un scuter de 125cc condus cu permis categoria B, vârsta minimă este 24 de ani.”
  8. „Ce acte trebuie să am la mine?” — „Ai nevoie de cartea de identitate sau pașaport și de permisul de conducere valabil pentru categoria scuterului.”
  9. „Unde ridic și unde returnez scuterul?” — „Ridici și returnezi scuterul la Str. Al. O. Teodoreanu nr. 49, Iași. Programul este luni–vineri 09:00–19:00, sâmbătă și duminică 12:00–19:00.”
  10. „Cum rezerv un scuter?” — „Completezi formularul de rezervare de pe site, care deschide WhatsApp cu detaliile, sau suni la +40 756 205 206. Rezervarea se confirmă pe WhatsApp, în funcție de disponibilitate.”

Body sections in this order (copy follows the spec; RO text with correct diacritics):
1. Skip link; header: `<a class="logo" href="./"><img src="assets/img/logo.svg" alt="Scuterescu" width="…" height="…"></a>` (width/height matching the SVG viewBox ratio, ~36px high), nav `#nav-main` with Flotă (`#flota`) · Prețuri (`#preturi`) · Rezervare (`#rezervare`) · Contact (`#contact`), lang switch `en/`, header call button `tel:+40756205206`, nav toggle (same markup as now).
2. Hero: `<img class="hero__img" src="assets/img/hero-800.webp" srcset="assets/img/hero-800.webp 800w, assets/img/hero.webp 1024w" sizes="100vw" width="1024" height="572" alt="Două scutere Scuterescu în fața Palatului Culturii din Iași" fetchpriority="high">` (update the head preload `imagesrcset` accordingly); glass card with H1 „Închiriere scutere în Iași”; mini-card 50cc: „50cc”, „Permis AM / B”, „SYM Jet 4 RX”, „de la 45 RON/zi”; mini-card 125cc: „125cc”, „Permis A1 / A / B (24+ ani)”, „Voge SR125 ADV”, „de la 50 RON/zi”; buttons „Rezervă scuter” (`href="#rezervare"`) and „WhatsApp” (generic link, same as now).
3. „De ce Scuterescu.” — subtitle „Economisești bani, câștigi timp și te bucuri de Iași.”; four glass cards with inline SVG icons (shield, tag, scooter, chat bubble; stroke `#F97316`): „Zero costuri ascunse” — „Asigurare RCA inclusă, asistență rutieră 24/7 și kilometri nelimitați. Știi exact cât plătești de la început.”; „Discounturi pentru perioade lungi” — „De la 45 RON/zi la închirierile de minimum 7 zile. Ideal pentru navetă și curierat.”; „Flotă modernă și verificată” — „Modele SYM și Voge 2024+, cu sistem antifurt, confortabile pentru oraș.”; „Fără birocrație” — „Suni sau scrii pe WhatsApp, prezinți actele și pleci rapid.”
4. `#flota` „Flota noastră.” — subtitle „Scutere noi și performante”; card „SYM Jet 4 RX (50cc)” with `fleet-50.webp` (width 640 height 440, lazy, alt „Scuter SYM Jet 4 RX de 50cc”) and ✓ items: „Permis categoria AM sau B”, „Consum redus: ~2,2 L/100 km”, „Ideal pentru trafic urban și livrări”, „Faruri full LED și priză USB”; button „Alege 50cc” (`href="#rezervare" data-select-category="50"`). Card „Voge SR125 ADV (125cc)” with `fleet-125.webp` (alt „Scuter Voge SR125 ADV de 125cc”), line „Disponibil și: SYM Jet 4 RX 125”, ✓ items: „Permis categoria A1, A sau B (minimum 24 de ani și curs)”, „Motor 125cc răcit cu lichid și ABS față-spate”, „Parbriz înalt reglabil”, „Suspensie ADV cu amortizoare duble pe gaz”; button „Alege 125cc”.
5. `#preturi` „Tarife Scuterescu.” — subtitle „Alege perioada potrivită pentru tine”; three cards „1–2 zile”, „3–6 zile”, „7+ zile” (the last with badge „Cel mai avantajos” and line „Economisești 50% față de tariful de 1–2 zile”), each showing „50cc: <strong>X RON</strong>/zi” and „125cc: <strong>Y RON</strong>/zi” (wrap each pair in `.nowrap`), bullets „Cască inclusă”, „Asigurare RCA”, „Sistem antifurt” (7+: plus „Suport telefon inclus”), and a „Rezervă” button whose `href` is exactly `waLink(buildPackageMessage('ro', tierId))` — compute the three URLs with `node -e` importing `site/assets/js/pricing.js` and paste them. Below: a proper `<table class="price-table">` (caption visually hidden „Tarife închiriere scutere în Iași”, columns Durată / 50cc / 125cc) with the same numbers (good for AEO), then „Garanție returnabilă la predare: 300 RON (50cc) · 350 RON (125cc)” and „Opțiuni suplimentare: cască suplimentară 20 RON · suport telefon 10 RON (pentru toată perioada închirierii; suportul e gratuit de la 7 zile)”.
6. `#rezervare` „Rezervă online.” — subtitle „Completezi detaliile, noi confirmăm pe WhatsApp”; the booking form per the contract above, with step headers „Alege perioada” (1/3), „Alege scuterul” (2/3, radio cards showing „50cc · SYM Jet 4 RX · de la 45 RON/zi” and „125cc · Voge SR125 ADV / SYM Jet 4 RX 125 · de la 50 RON/zi”), „Adaugă opțiuni” (3/3: „Cască suplimentară (+20 RON)”, „Suport telefon (+10 RON)”), optional „Nume (opțional)”; right column „Rezumat rezervare” (`#booking-summary`) with rows for period, scooter, tarif, opțiuni, „Total estimat” (`#booking-total`), „Garanție returnabilă”, and the submit button + confirmation note; `#booking-error` above the button. Initial summary content (before JS runs) shows „Alege perioada pentru a vedea totalul.”
7. „Cum funcționează” (3 steps: „Rezervi online sau pe WhatsApp”, „Vii cu actele”, „Pleci pe scuter”).
8. `#conditii` „Condiții de închiriere” list: vârsta minimă 18 ani (24 pentru 125cc cu permis B); carte de identitate sau pașaport; 50cc permis AM sau B; 125cc permis A1, A sau B (minimum 24 de ani și curs); garanție 300 RON (50cc) sau 350 RON (125cc); incluse: cască, RCA, antifurt, asistență 24/7, km nelimitați; opțiuni: cască suplimentară 20 RON, suport telefon 10 RON; ridicare și returnare la Str. Al. O. Teodoreanu nr. 49, Iași.
9. `#intrebari` FAQ (the 10 Q&As above in `<details>`).
10. `#contact` — unchanged content (address with `700154 Iași, România`, hours table, call button, Google Maps link, map facade).
11. Footer — unchanged content (brand/CUI/year, privacy link `confidentialitate`, ANPC – SAL), plus the logo image.
12. Mobile bar — unchanged.
13. `<script src="assets/js/main.js" defer></script>` and `<script type="module" src="assets/js/booking.js"></script>`.

- [ ] **Step 7: Create `site/assets/js/booking.js`**

```js
// Booking form: live quote and WhatsApp hand-off. No data leaves the browser except via wa.me.
import { rentalDays, quote, tierLabel, buildBookingMessage, waLink, CATEGORIES, EXTRAS } from './pricing.js';

const form = document.getElementById('booking-form');

if (form) {
  const lang = form.dataset.lang === 'en' ? 'en' : 'ro';
  const T = {
    ro: {
      choose: 'Alege perioada pentru a vedea totalul.',
      missing: 'Alege data de ridicare și data de predare.',
      order: 'Data de predare nu poate fi înaintea datei de ridicare.',
      past: 'Data de ridicare nu poate fi în trecut.',
      perDay: 'RON/zi',
      days: (n) => (n === 1 ? '1 zi' : `${n} zile`),
      none: 'fără',
      helmet: 'cască suplimentară',
      phoneHolder: 'suport telefon',
      included: 'inclus',
    },
    en: {
      choose: 'Choose your dates to see the total.',
      missing: 'Choose a pick-up date and a return date.',
      order: 'The return date cannot be before the pick-up date.',
      past: 'The pick-up date cannot be in the past.',
      perDay: 'RON/day',
      days: (n) => (n === 1 ? '1 day' : `${n} days`),
      none: 'none',
      helmet: 'extra helmet',
      phoneHolder: 'phone holder',
      included: 'included',
    },
  }[lang];

  const $ = (sel) => form.querySelector(sel);
  const out = {
    period: document.getElementById('summary-period'),
    scooter: document.getElementById('summary-scooter'),
    rate: document.getElementById('summary-rate'),
    extras: document.getElementById('summary-extras'),
    total: document.getElementById('booking-total'),
    deposit: document.getElementById('summary-deposit'),
    error: document.getElementById('booking-error'),
  };
  const phoneHolderBox = $('[name="phoneHolder"]');
  const today = new Date().toISOString().slice(0, 10);
  $('[name="start"]').min = today;
  $('[name="end"]').min = today;

  const values = () => ({
    category: $('[name="category"]:checked').value,
    start: $('[name="start"]').value,
    end: $('[name="end"]').value,
    pickupTime: $('[name="pickupTime"]').value,
    returnTime: $('[name="returnTime"]').value,
    extraHelmet: $('[name="extraHelmet"]').checked,
    phoneHolder: phoneHolderBox.checked,
    name: $('[name="name"]').value,
  });

  const validate = (v) => {
    if (!v.start || !v.end) return T.missing;
    if (v.start < today) return T.past;
    if (rentalDays(v.start, v.end) === null) return T.order;
    return '';
  };

  const render = () => {
    const v = values();
    const cat = CATEGORIES[v.category];
    out.scooter.textContent = `${cat.label} (${cat.models})`;
    out.deposit.textContent = `${cat.deposit} RON`;
    const days = v.start && v.end ? rentalDays(v.start, v.end) : null;
    if (!days) {
      out.period.textContent = T.choose;
      out.rate.textContent = '–';
      out.extras.textContent = '–';
      out.total.textContent = '–';
      phoneHolderBox.disabled = false;
      return;
    }
    const q = quote({ category: v.category, days, extraHelmet: v.extraHelmet, phoneHolder: v.phoneHolder });
    phoneHolderBox.disabled = q.phoneHolderIncluded;
    if (q.phoneHolderIncluded) phoneHolderBox.checked = true;
    const extras = [];
    if (v.extraHelmet) extras.push(`${T.helmet} (+${EXTRAS.helmet} RON)`);
    if (q.phoneHolderIncluded) extras.push(`${T.phoneHolder} (${T.included})`);
    else if (v.phoneHolder) extras.push(`${T.phoneHolder} (+${EXTRAS.phoneHolder} RON)`);
    out.period.textContent = T.days(days);
    out.rate.textContent = `${q.rate} ${T.perDay} (${tierLabel(lang, q.tier.id)})`;
    out.extras.textContent = extras.length ? extras.join(', ') : T.none;
    out.total.textContent = `${q.total} RON`;
  };

  form.addEventListener('input', () => {
    out.error.textContent = '';
    render();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = values();
    const error = validate(v);
    out.error.textContent = error;
    if (error) {
      $(v.start ? '[name="end"]' : '[name="start"]').focus();
      return;
    }
    window.open(waLink(buildBookingMessage(lang, v)), '_blank', 'noopener');
  });

  // "Alege 50cc / 125cc" buttons in the fleet section preselect the scooter.
  document.querySelectorAll('[data-select-category]').forEach((link) => {
    link.addEventListener('click', () => {
      const radio = $(`[name="category"][value="${link.dataset.selectCategory}"]`);
      if (radio) {
        radio.checked = true;
        render();
      }
    });
  });

  render();
}
```

The summary markup must therefore contain elements with ids `summary-period`, `summary-scooter`, `summary-rate`, `summary-extras`, `booking-total`, `summary-deposit` (inside `#booking-summary`) and `#booking-error`. Check it with `node --check site/assets/js/booking.js`.

- [ ] **Step 8: Delete the old fleet images**

```bash
git rm site/assets/img/scuter-50.webp site/assets/img/scuter-125.webp
```

- [ ] **Step 9: Run tests, validate, and check in a browser**

Run: `npm test && npx html-validate site/index.html`
Expected: all PASS except the skipped EN test; no validation errors (fix markup, don't loosen rules).

Then serve (`npx --yes serve site -l 8092`, background) and verify in a headless browser or by reading the DOM that: the booking form computes 386 RON for 125cc 15→19 of next June with both options; at 7+ days the phone-holder box is checked and disabled; submitting with no dates shows the error; the WhatsApp URL opened matches `waLink(buildBookingMessage('ro', …))`. If you have no browser tool, write a short throwaway Node check that imports `pricing.js` and replicates the URL, and state in the report that the DOM wiring was verified by code reading only. Stop the server.

- [ ] **Step 10: Commit**

```bash
git add -A site/index.html site/assets/css/style.css site/assets/js/booking.js site/assets/img tests
git commit -m "feat: dark redesign, tier pricing and WhatsApp booking form (RO)"
```

---

### Task 4: English page

**Files:**
- Rewrite: `site/en/index.html`
- Modify: `tests/home-en.test.mjs` (un-skip), `tests/consistency.test.mjs` (add EN page)

**Interfaces:**
- Consumes: everything from Task 3 — mirror `site/index.html` exactly in structure, classes, ids (`booking-form` etc.), with `data-lang="en"`, section id `booking` instead of `rezervare`, anchors `#fleet`, `#prices`, `#booking`, `#contact`, `#conditions`, `#faq`, and `../` relative paths.

- [ ] **Step 1: Un-skip the EN test** — restore `test('EN home page', …)` with `bookingId: 'booking'`; keep only the generic EN WhatsApp link in `waLinks` (`…rent%20a%20scooter.%20Period%3A%20`). Add `'site/en/index.html'` to `FILES` in `tests/consistency.test.mjs`.

Run: `npm test` — Expected: EN page FAIL.

- [ ] **Step 2: Rewrite `site/en/index.html`** as a faithful English translation of the new RO page (same head changes: title „Scooter Rental Iași | 50cc & 125cc from 45 RON/day | Scuterescu”, `og:locale` en_US, canonical `/en/`; JSON-LD offers in English — names like „125cc scooter rental — 3–6 days”, `unitText` „day”, AutoRental `url` stays `https://scuterescu.ro/`). The 10 FAQ answers are translations of the RO ones, e.g. #1 „The price depends on the rental length: 1–2 days cost 90 RON/day (50cc) or 100 RON/day (125cc), 3–6 days cost 79 RON/day or 89 RON/day, and from 7 days it is 45 RON/day or 50 RON/day. Helmet and RCA insurance are included.”; #3 „For a 125cc scooter you need a category A1 or A licence, or a category B licence if you are at least 24 and have completed the required course.” Package „Book” buttons use `waLink(buildPackageMessage('en', tierId))` (compute with node). Use „Economisești 50%” → „Save 50% compared with the 1–2 day rate”. Never mention a dashcam.

- [ ] **Step 3: Run tests and validate**

Run: `npm test && npm run validate`
Expected: all PASS, no validation errors.

- [ ] **Step 4: Commit**

```bash
git add site/en/index.html tests/home-en.test.mjs tests/consistency.test.mjs
git commit -m "feat: English page for the redesign"
```

---

### Task 5: Privacy pages, llms.txt and README

**Files:**
- Modify: `site/confidentialitate.html`, `site/en/privacy.html` (header/footer logo + `theme-color` only), `site/llms.txt`, `site/sitemap.xml` (`<lastmod>2026-09-27</lastmod>` for the two home pages), `tests/consistency.test.mjs` (add `site/llms.txt`), `README.md`

- [ ] **Step 1:** Add `'site/llms.txt'` to `FILES` in `tests/consistency.test.mjs`. Run `npm test` — Expected: llms.txt consistency FAIL.

- [ ] **Step 2: Rewrite `site/llms.txt`** with the same structure as now (H1 `# Scuterescu`, blockquote summary, sections, English summary) and the new facts: tier table (1–2 / 3–6 / 7+ days with both categories), included items (cască, RCA, antifurt, asistență rutieră 24/7, kilometri nelimitați; suport telefon la 7+ zile), extras (cască suplimentară 20 RON, suport telefon 10 RON), deposits (300/350 RON), models (SYM Jet 4 RX 50cc; Voge SR125 ADV and SYM Jet 4 RX 125 for 125cc), licences (AM/B; A1/A/B with min 24 + course), min age 18, address, hours, booking: online form on the site that opens WhatsApp, or phone; confirmation on WhatsApp subject to availability. Page links use the extensionless privacy URL `https://scuterescu.ro/confidentialitate`.

- [ ] **Step 3: Privacy pages** — replace the text logo in the header with the logo `<img>` (relative path: `assets/img/logo.svg` in RO, `../assets/img/logo.svg` in EN), set `theme-color` to `#111113`. No text changes.

- [ ] **Step 4: README** — in "Change prices, hours or contact data" list: `site/assets/js/pricing.js` (tariffs, extras, deposits, WhatsApp messages — the booking form and package buttons use it), both home pages (visible text, JSON-LD offers, FAQ, package button URLs — regenerate with `node -e "import('./site/assets/js/pricing.js').then(p => console.log(['1-2','3-6','7+'].map(t => p.waLink(p.buildPackageMessage('ro', t))).join('\n')))"`), `site/llms.txt`, `tests/facts.mjs`. Update "Replace photos": owner design files go in `images-src/design/`, then `npm run images`.

- [ ] **Step 5:** Run `npm test && npm run validate` — Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add site/confidentialitate.html site/en/privacy.html site/llms.txt site/sitemap.xml tests/consistency.test.mjs README.md
git commit -m "feat: update privacy header, llms.txt and README for the redesign"
```

---

### Task 6: Verification and deploy (controller)

- [ ] `npm test && npm run validate` pass.
- [ ] Lighthouse mobile on `/` and `/en/` ≥ 95 in all categories (serve `site/` on a free port; port 8080 is taken on this machine).
- [ ] Sub-path check: copy `site/` to `/tmp/ghp-check/scuterescu`, serve, and fetch every relative reference from the four pages — all 200.
- [ ] Browser check at 375px and 1280px (RO and EN): no horizontal scroll; hero, tariffs, fleet, booking layout match the mockups; booking total 386 RON for 125cc/4 days/both extras; 7+ days disables phone holder; error on missing dates; WhatsApp link content correct; „Alege 125cc” preselects 125cc; menu, map, language switch work.
- [ ] Merge to `main`, push, confirm the Pages workflow succeeds and the live site serves the new version.
