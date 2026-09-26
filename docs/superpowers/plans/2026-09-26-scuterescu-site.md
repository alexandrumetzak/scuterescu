# Scuterescu.ro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build scuterescu.ro — a fast, bilingual (RO/EN) one-page static site for scooter rental in Iași, optimized for local SEO, AEO and AIO, with phone/WhatsApp as the only conversion path.

**Architecture:** Plain HTML/CSS with ~40 lines of vanilla JS, no framework, no build step for the site itself. Everything deployable lives in `site/` (Cloudflare Pages output directory). Content correctness is enforced by Node's built-in test runner (`node:test`) reading the HTML/text files and checking facts, structured data and links against one facts module. `html-validate` checks markup; `sharp` (dev-only) optimizes images.

**Tech Stack:** HTML5, CSS (custom properties), vanilla JS, JSON-LD (schema.org), Node 24 (`node:test`), `html-validate`, `sharp`, `@fontsource-variable/inter`, Cloudflare Pages.

**Spec:** `docs/superpowers/specs/2026-09-26-scuterescu-site-design.md`

## Global Constraints

- Brand: **Scuterescu** — sub-brand of **METZ CARS SRL**, CUI **RO42088025**.
- Domain / canonical base: `https://scuterescu.ro/` (RO), `https://scuterescu.ro/en/` (EN).
- Phone & WhatsApp: `+40 756 205 206` (E.164 `+40756205206`, WhatsApp `https://wa.me/40756205206`).
- Address: `Str. Al. O. Teodoreanu nr. 49, Iași`, postal code `700154`, geo `47.1456874, 27.6050934`.
- Hours: Monday–Friday `09:00–19:00`; Saturday–Sunday `12:00–19:00`. Pickup/return only at the address; no delivery.
- 50cc: `SYM Jet 4 RX 50` — `70 RON`/day, `300 RON`/week, deposit `300 RON`, licence `AM or B`.
- 125cc: `SYM Jet 4 RX 125`, `Voge SR125 ADV` — `80 RON`/day, `350 RON`/week, deposit `350 RON`, licence `A1 or A`.
- RCA insurance included. Helmet: `10 RON` per rental on daily rate; free on weekly rate. Minimum age `18`. Documents: ID card/passport + valid driving licence.
- Brand copy says "SYM și Voge", never "doar SYM".
- Always write "Iași" with ș (U+0219, comma below) and ț (U+021B) — never cedilla ş/ţ.
- No cookies, no analytics, no third-party requests on page load. Google Map loads only on click.
- WhatsApp links are complete `href`s in HTML (work without JS).
- Accent colors: buttons `#C2410C` (white text), decorative accent `#EA580C`, WhatsApp button `#075E54`. Text `#1C1917`, background `#FFFBF5`. WCAG AA contrast.
- Lighthouse mobile target ≥ 95 in all four categories.
- Out of scope: booking system, forms, backend, CMS, analytics, French, blog.

---

## File Structure

```
package.json                 dev scripts + devDependencies (not deployed)
.gitignore
.htmlvalidate.json           html-validate config
README.md                    run, test, deploy instructions
scripts/optimize-images.mjs  images-src/*.jpg -> site/assets/img/*.webp, og-image, touch icon
images-src/                  raw downloaded photos (git-ignored)
tests/facts.mjs              single source of truth for business facts used by tests
tests/helpers.mjs            file reading, JSON-LD extraction, text normalization
tests/page-checks.mjs        shared assertions for RO and EN home pages
tests/assets.test.mjs
tests/home-ro.test.mjs
tests/home-en.test.mjs
tests/privacy.test.mjs
tests/images.test.mjs
tests/seo-files.test.mjs
tests/consistency.test.mjs
site/                        <- Cloudflare Pages output directory
  index.html                 RO home
  en/index.html              EN home
  confidentialitate.html     RO privacy
  en/privacy.html            EN privacy
  assets/css/style.css
  assets/js/main.js
  assets/fonts/inter-latin-wght-normal.woff2
  assets/fonts/inter-latin-ext-wght-normal.woff2
  assets/img/hero.webp, hero-800.webp, scuter-50.webp, scuter-125.webp
  assets/img/CREDITS.md
  favicon.svg, apple-touch-icon.png, og-image.jpg
  robots.txt, sitemap.xml, llms.txt, _headers
```

---

### Task 1: Tooling, facts and test helpers

**Files:**
- Create: `package.json`, `.gitignore`, `.htmlvalidate.json`, `tests/facts.mjs`, `tests/helpers.mjs`, `tests/assets.test.mjs` (smoke test only in this task)

**Interfaces:**
- Produces:
  - `tests/facts.mjs` exports `FACTS` (object below).
  - `tests/helpers.mjs` exports `ROOT: string`, `read(relPath): string`, `exists(relPath): boolean`, `jsonLd(html): object[]`, `text(html): string` (tags stripped, `&nbsp;` → space, whitespace collapsed), `imgTags(html): {src, alt, width, height}[]`, `hrefs(html): string[]`.
  - npm scripts: `npm test`, `npm run validate`, `npm run images`, `npm run serve`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "scuterescu-site",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test \"tests/**/*.test.mjs\"",
    "validate": "html-validate \"site/**/*.html\"",
    "images": "node scripts/optimize-images.mjs",
    "serve": "npx --yes serve site -l 8080"
  },
  "devDependencies": {
    "@fontsource-variable/inter": "^5.1.0",
    "html-validate": "^9.0.0",
    "sharp": "^0.33.5"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
images-src/
.DS_Store
```

- [ ] **Step 3: Create `.htmlvalidate.json`**

```json
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "long-title": "off",
    "require-sri": "off"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors.

- [ ] **Step 5: Create `tests/facts.mjs`**

```js
// Single source of truth for business facts checked by the tests.
export const FACTS = {
  brand: 'Scuterescu',
  company: 'METZ CARS SRL',
  cui: 'RO42088025',
  baseUrl: 'https://scuterescu.ro/',
  enUrl: 'https://scuterescu.ro/en/',
  phoneE164: '+40756205206',
  phoneDisplay: '+40 756 205 206',
  waBase: 'https://wa.me/40756205206',
  street: 'Str. Al. O. Teodoreanu nr. 49',
  city: 'Iași',
  postalCode: '700154',
  lat: 47.1456874,
  lng: 27.6050934,
  hours: { weekdays: ['09:00', '19:00'], weekend: ['12:00', '19:00'] },
  models: ['SYM Jet 4 RX 50', 'SYM Jet 4 RX 125', 'Voge SR125 ADV'],
  prices: {
    '50': { day: 70, week: 300, deposit: 300 },
    '125': { day: 80, week: 350, deposit: 350 },
  },
  helmetDay: 10,
  minAge: 18,
};
```

- [ ] **Step 6: Create `tests/helpers.mjs`**

```js
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');
export const exists = (rel) => existsSync(path.join(ROOT, rel));

export function jsonLd(html) {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  return [...html.matchAll(re)].map((m) => JSON.parse(m[1]));
}

export function text(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

export function imgTags(html) {
  return [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => ({
    src: attr(tag, 'src'),
    alt: attr(tag, 'alt'),
    width: attr(tag, 'width'),
    height: attr(tag, 'height'),
  }));
}

export function hrefs(html) {
  return [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
}
```

- [ ] **Step 7: Write smoke test `tests/assets.test.mjs`**

```js
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
```

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: 2 tests pass.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore .htmlvalidate.json tests/
git commit -m "chore: add tooling, business facts and test helpers"
```

---

### Task 2: Styles, script and fonts

**Files:**
- Create: `site/assets/css/style.css`, `site/assets/js/main.js`, `site/assets/fonts/*.woff2`
- Modify: `tests/assets.test.mjs` (append tests)

**Interfaces:**
- Consumes: `read`, `exists` from `tests/helpers.mjs`.
- Produces CSS classes used by the pages (Tasks 3–5): `skip-link`, `container`, `site-header`, `site-header__inner`, `logo`, `logo__dot`, `nav`, `nav.is-open`, `nav-toggle`, `nav-toggle__bar`, `lang-switch`, `btn`, `btn--call`, `btn--wa`, `btn--ghost`, `btn--sm`, `hero`, `hero__img`, `hero__content`, `hero__lead`, `hero__actions`, `section`, `section--alt`, `section__title`, `section__lead`, `features`, `feature`, `feature__icon`, `cards`, `card`, `card__img`, `card__body`, `card__models`, `card__price`, `card__meta`, `price-table`, `note`, `steps`, `step`, `step__num`, `conditions`, `faq`, `contact`, `contact__info`, `hours`, `map-facade`, `map-frame`, `site-footer`, `mobile-bar`, `visually-hidden`, `prose`.
- Produces JS behaviour keyed on: `.nav-toggle` + `#nav-main` (menu), `.map-facade[data-src][data-title]` (map on click), `[data-year]` (current year).

- [ ] **Step 1: Append failing tests to `tests/assets.test.mjs`**

```js
import { execFileSync } from 'node:child_process';
import { read, exists } from './helpers.mjs';

test('css defines color tokens and no external imports', () => {
  const css = read('site/assets/css/style.css');
  for (const token of ['--color-btn: #C2410C', '--color-accent: #EA580C', '--color-wa: #075E54', '--color-text: #1C1917', '--color-bg: #FFFBF5']) {
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
```

Note: merge the new `import` lines with the existing imports at the top of the file (import `read`, `exists` alongside `text`, `jsonLd`, `imgTags`, `hrefs`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: 3 new tests FAIL (`ENOENT` for style.css / fonts / main.js).

- [ ] **Step 3: Copy fonts**

```bash
mkdir -p site/assets/fonts
ls node_modules/@fontsource-variable/inter/files/ | grep -E 'latin(-ext)?-wght-normal.woff2'
cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 site/assets/fonts/
cp node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2 site/assets/fonts/
```

If `ls` shows different file names, copy the `latin` and `latin-ext` normal-style variable files and rename them to the two names above.

- [ ] **Step 4: Create `site/assets/css/style.css`**

```css
/* Inter variable — latin + latin-ext (ș, ț, ă, â, î) */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/assets/fonts/inter-latin-wght-normal.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/assets/fonts/inter-latin-ext-wght-normal.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

:root {
  --color-bg: #FFFBF5;
  --color-bg-alt: #FFF1E3;
  --color-surface: #FFFFFF;
  --color-text: #1C1917;
  --color-muted: #57534E;
  --color-border: #E7E5E4;
  --color-accent: #EA580C;
  --color-btn: #C2410C;
  --color-btn-hover: #9A3412;
  --color-wa: #075E54;
  --color-wa-hover: #054A42;
  --radius: 16px;
  --shadow: 0 6px 24px rgb(28 25 23 / 0.08);
  --container: 1120px;
  --gutter: 16px;
  --header-h: 64px;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: calc(var(--header-h) + 8px); }
body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-size: 1.0625rem;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--color-btn); }
h1, h2, h3 { line-height: 1.15; margin: 0 0 .5em; letter-spacing: -0.02em; }
h1 { font-size: clamp(2rem, 6vw, 3.5rem); font-weight: 800; }
h2 { font-size: clamp(1.6rem, 4vw, 2.4rem); font-weight: 800; }
h3 { font-size: 1.25rem; font-weight: 700; }
p { margin: 0 0 1em; }

.visually-hidden {
  position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.skip-link { position: absolute; left: -9999px; top: 8px; z-index: 100; background: var(--color-text); color: #fff; padding: 8px 12px; border-radius: 8px; }
.skip-link:focus { left: 8px; }
:focus-visible { outline: 3px solid var(--color-accent); outline-offset: 2px; }

.container { width: 100%; max-width: var(--container); margin: 0 auto; padding: 0 var(--gutter); }

/* Header */
.site-header {
  position: sticky; top: 0; z-index: 50;
  background: rgb(255 251 245 / 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}
.site-header__inner { display: flex; align-items: center; gap: 16px; height: var(--header-h); }
.logo { font-weight: 800; font-size: 1.4rem; color: var(--color-text); text-decoration: none; letter-spacing: -0.03em; margin-right: auto; }
.logo__dot { color: var(--color-accent); }
.nav ul { list-style: none; margin: 0; padding: 0; display: flex; gap: 20px; }
.nav a { color: var(--color-text); text-decoration: none; font-weight: 600; font-size: .95rem; }
.nav a:hover { color: var(--color-btn); }
.lang-switch { font-weight: 700; font-size: .9rem; color: var(--color-muted); text-decoration: none; border: 1px solid var(--color-border); border-radius: 999px; padding: 4px 10px; }
.nav-toggle { display: none; background: none; border: 0; padding: 8px; cursor: pointer; }
.nav-toggle__bar { display: block; width: 24px; height: 2px; background: var(--color-text); margin: 5px 0; border-radius: 2px; }

/* Buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 48px; padding: 12px 22px; border-radius: 999px;
  font-weight: 700; font-size: 1rem; text-decoration: none; border: 2px solid transparent;
  transition: background-color .15s ease, transform .15s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn--call { background: var(--color-btn); color: #fff; }
.btn--call:hover { background: var(--color-btn-hover); }
.btn--wa { background: var(--color-wa); color: #fff; }
.btn--wa:hover { background: var(--color-wa-hover); }
.btn--ghost { background: transparent; color: var(--color-text); border-color: var(--color-text); }
.btn--sm { min-height: 40px; padding: 8px 16px; font-size: .9rem; }

/* Hero */
.hero { position: relative; min-height: min(88vh, 720px); display: grid; align-items: end; color: #fff; overflow: hidden; }
.hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgb(0 0 0 / .1) 0%, rgb(0 0 0 / .72) 100%); }
.hero__content { position: relative; z-index: 1; padding-top: 96px; padding-bottom: 56px; }
.hero__lead { font-size: clamp(1.05rem, 2.5vw, 1.3rem); max-width: 40ch; opacity: .95; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }

/* Sections */
.section { padding: 72px 0; }
.section--alt { background: var(--color-bg-alt); }
.section__title { text-align: center; }
.section__lead { text-align: center; color: var(--color-muted); max-width: 60ch; margin: 0 auto 40px; }

.features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; list-style: none; margin: 0; padding: 0; }
.feature { background: var(--color-surface); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
.feature__icon { width: 44px; height: 44px; border-radius: 12px; background: var(--color-bg-alt); color: var(--color-accent); display: grid; place-items: center; margin-bottom: 12px; }
.feature h3 { font-size: 1.05rem; margin-bottom: .25em; }
.feature p { margin: 0; color: var(--color-muted); font-size: .95rem; }

.cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.card { background: var(--color-surface); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); display: flex; flex-direction: column; }
.card__img { aspect-ratio: 4 / 3; object-fit: cover; width: 100%; }
.card__body { padding: 24px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
.card__models { color: var(--color-muted); margin: 0; }
.card__price { font-size: 1.1rem; margin: 0; }
.card__price strong { font-size: 2rem; color: var(--color-text); }
.card__meta { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; color: var(--color-muted); font-size: .95rem; }
.card .btn { margin-top: auto; align-self: flex-start; }

.price-table { width: 100%; border-collapse: collapse; background: var(--color-surface); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.price-table th, .price-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid var(--color-border); }
.price-table thead th { background: var(--color-text); color: #fff; font-size: .95rem; }
.price-table tbody tr:last-child th, .price-table tbody tr:last-child td { border-bottom: 0; }
.note { margin-top: 16px; color: var(--color-muted); font-size: .95rem; }

.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.step { background: var(--color-surface); border-radius: var(--radius); padding: 24px; box-shadow: var(--shadow); }
.step__num { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--color-accent); color: #fff; font-weight: 800; margin-bottom: 12px; }

.conditions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 32px; margin: 0; padding: 0; list-style: none; }
.conditions li { padding-left: 28px; position: relative; }
.conditions li::before { content: "✓"; position: absolute; left: 0; color: var(--color-accent); font-weight: 800; }

.faq { max-width: 800px; margin: 0 auto; display: grid; gap: 12px; }
.faq details { background: var(--color-surface); border-radius: 12px; padding: 16px 20px; box-shadow: var(--shadow); }
.faq summary { font-weight: 700; cursor: pointer; }
.faq details p { margin: 12px 0 0; color: var(--color-muted); }

.contact { display: grid; grid-template-columns: 1fr 1.2fr; gap: 32px; align-items: stretch; }
.contact__info address { font-style: normal; margin-bottom: 16px; }
.hours { border-collapse: collapse; margin-bottom: 20px; }
.hours th, .hours td { text-align: left; padding: 4px 16px 4px 0; }
.map-facade, .map-frame { width: 100%; min-height: 320px; border-radius: var(--radius); border: 0; }
.map-facade {
  display: grid; place-items: center; gap: 8px; cursor: pointer;
  background: repeating-linear-gradient(45deg, var(--color-bg-alt), var(--color-bg-alt) 12px, #FFE8D1 12px, #FFE8D1 24px);
  color: var(--color-text); font: inherit; font-weight: 700;
}

.prose { max-width: 760px; margin: 0 auto; padding: 48px var(--gutter) 72px; }
.prose h1 { font-size: clamp(1.8rem, 5vw, 2.6rem); }
.prose h2 { font-size: 1.35rem; margin-top: 1.6em; }

.site-footer { background: var(--color-text); color: #D6D3D1; padding: 40px 0 32px; font-size: .95rem; }
.site-footer a { color: #fff; }
.site-footer ul { list-style: none; padding: 0; margin: 12px 0 0; display: flex; flex-wrap: wrap; gap: 16px; }

.mobile-bar { display: none; }

@media (max-width: 900px) {
  .features { grid-template-columns: repeat(2, 1fr); }
  .contact { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  body { padding-bottom: 72px; }
  .nav-toggle { display: block; }
  .header-call { display: none; }
  .nav { position: absolute; top: var(--header-h); left: 0; right: 0; background: var(--color-bg); border-bottom: 1px solid var(--color-border); display: none; }
  .nav.is-open { display: block; }
  .nav ul { flex-direction: column; gap: 0; padding: 8px var(--gutter) 16px; }
  .nav a { display: block; padding: 12px 0; font-size: 1.05rem; }
  .section { padding: 56px 0; }
  .cards, .steps, .conditions { grid-template-columns: 1fr; }
  .features { grid-template-columns: 1fr; }
  .mobile-bar {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 60;
    padding: 8px var(--gutter) calc(8px + env(safe-area-inset-bottom));
    background: var(--color-surface); border-top: 1px solid var(--color-border);
  }
  .mobile-bar .btn { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .btn { transition: none; }
  .btn:hover { transform: none; }
}
```

- [ ] **Step 5: Create `site/assets/js/main.js`**

```js
// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav-main');
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
}

// Google Map loads only on click (no third-party requests on page load)
document.querySelectorAll('.map-facade').forEach((button) => {
  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = button.dataset.src;
    iframe.title = button.dataset.title;
    iframe.className = 'map-frame';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
  });
});

// Current year in footer
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Commit**

```bash
git add site/assets tests/assets.test.mjs
git commit -m "feat: add site styles, script and self-hosted fonts"
```

---

### Task 3: Romanian home page

**Files:**
- Create: `tests/page-checks.mjs`, `tests/home-ro.test.mjs`, `site/index.html`

**Interfaces:**
- Consumes: `FACTS`, helpers, CSS classes and JS hooks from Task 2.
- Produces: `checkHomePage(t, { file, lang, canonical, alternate, waLinks, faqCount })` in `tests/page-checks.mjs` (reused by Task 4). Image paths referenced (created in Task 6): `/assets/img/hero.webp`, `/assets/img/hero-800.webp`, `/assets/img/scuter-50.webp`, `/assets/img/scuter-125.webp`, `/og-image.jpg`, `/favicon.svg`, `/apple-touch-icon.png`.

- [ ] **Step 1: Create `tests/page-checks.mjs`**

```js
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, jsonLd, text, hrefs } from './helpers.mjs';

// Shared assertions for the RO and EN home pages.
export function checkHomePage(t, { file, lang, canonical, alternate, waLinks, faqCount }) {
  const html = read(file);
  const body = text(html);
  const links = hrefs(html);

  t.test('lang, canonical and hreflang', () => {
    assert.match(html, new RegExp(`<html lang="${lang}">`));
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="ro" href="${FACTS.baseUrl}">`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${FACTS.enUrl}">`));
    assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${FACTS.baseUrl}">`));
    assert.ok(links.includes(alternate), 'language switch link');
  });

  t.test('exactly one h1 and a meta description <= 160 chars', () => {
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    const m = html.match(/<meta name="description" content="([^"]+)">/);
    assert.ok(m, 'meta description present');
    assert.ok(m[1].length <= 160, `description is ${m[1].length} chars`);
  });

  t.test('open graph tags', () => {
    for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale', 'og:type']) {
      assert.ok(html.includes(`property="${p}"`), `missing ${p}`);
    }
    assert.ok(html.includes('content="https://scuterescu.ro/og-image.jpg"'));
  });

  t.test('visible facts', () => {
    for (const s of [FACTS.phoneDisplay, FACTS.street, FACTS.cui, FACTS.company, ...FACTS.models,
      '70 RON', '300 RON', '80 RON', '350 RON', '10 RON', '09:00', '12:00', '19:00']) {
      assert.ok(body.includes(s), `page text missing "${s}"`);
    }
    assert.ok(!/ş|ţ|Ş|Ţ/.test(html), 'cedilla diacritics found; use ș ț');
  });

  t.test('call and whatsapp links', () => {
    assert.ok(links.filter((h) => h === `tel:${FACTS.phoneE164}`).length >= 3, 'tel links in header, hero, mobile bar');
    for (const wa of waLinks) assert.ok(links.includes(wa), `missing ${wa}`);
  });

  t.test('no third-party resources on load', () => {
    const loads = [...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*(?:src|href)="(https?:[^"]+)"/g)]
      .map((m) => m[0])
      .filter((tag) => !/rel="(canonical|alternate)"/.test(tag));
    assert.deepEqual(loads, []);
    assert.ok(!html.includes('<iframe'), 'map must load on click only');
  });

  t.test('JSON-LD AutoRental and FAQPage', () => {
    const graph = jsonLd(html).flatMap((d) => d['@graph'] ?? [d]);
    const biz = graph.find((n) => n['@type'] === 'AutoRental');
    assert.ok(biz, 'AutoRental present');
    assert.equal(biz.telephone, FACTS.phoneE164);
    assert.equal(biz.address.streetAddress, FACTS.street);
    assert.equal(biz.address.postalCode, FACTS.postalCode);
    assert.equal(biz.address.addressCountry, 'RO');
    assert.equal(biz.geo.latitude, FACTS.lat);
    assert.equal(biz.geo.longitude, FACTS.lng);
    assert.equal(biz.parentOrganization.taxID, FACTS.cui);
    const hours = biz.openingHoursSpecification.map((h) => `${h.opens}-${h.closes}`).sort();
    assert.deepEqual(hours, ['09:00-19:00', '12:00-19:00']);
    const prices = biz.makesOffer.map((o) => o.priceSpecification.price).sort((a, b) => a - b);
    assert.deepEqual(prices, [70, 80, 300, 350]);
    for (const o of biz.makesOffer) assert.equal(o.priceSpecification.priceCurrency, 'RON');

    const faq = graph.find((n) => n['@type'] === 'FAQPage');
    assert.ok(faq, 'FAQPage present');
    assert.equal(faq.mainEntity.length, faqCount);
    const visibleQuestions = (html.match(/<summary>/g) || []).length;
    assert.equal(visibleQuestions, faqCount, 'every FAQ in JSON-LD is visible on page');
    for (const q of faq.mainEntity) {
      assert.ok(body.includes(q.name), `question not visible: ${q.name}`);
      assert.ok(body.includes(q.acceptedAnswer.text), `answer not visible: ${q.name}`);
    }
  });
}
```

- [ ] **Step 2: Create `tests/home-ro.test.mjs`**

```js
import { test } from 'node:test';
import { FACTS } from './facts.mjs';
import { checkHomePage } from './page-checks.mjs';

test('RO home page', (t) => checkHomePage(t, {
  file: 'site/index.html',
  lang: 'ro',
  canonical: FACTS.baseUrl,
  alternate: '/en/',
  faqCount: 10,
  waLinks: [
    'https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter.%20Perioada%3A%20',
    'https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter%2050cc%20(SYM%20Jet%204%20RX).%20Perioada%3A%20',
    'https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter%20125cc.%20Perioada%3A%20',
  ],
}));
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: `RO home page` FAILS with `ENOENT ... site/index.html`.

- [ ] **Step 4: Create `site/index.html`**

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Închiriere scutere Iași | 50cc și 125cc de la 70 RON/zi | Scuterescu</title>
  <meta name="description" content="Închiriază un scuter SYM sau Voge în Iași: 50cc de la 70 RON/zi, 125cc de la 80 RON/zi. RCA inclus. Sună sau scrie pe WhatsApp: +40 756 205 206.">
  <link rel="canonical" href="https://scuterescu.ro/">
  <link rel="alternate" hreflang="ro" href="https://scuterescu.ro/">
  <link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/">
  <link rel="alternate" hreflang="x-default" href="https://scuterescu.ro/">
  <meta name="theme-color" content="#FFFBF5">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Scuterescu">
  <meta property="og:title" content="Închiriere scutere Iași — de la 70 RON/zi | Scuterescu">
  <meta property="og:description" content="Scutere SYM și Voge de 50cc și 125cc. RCA inclus. Ridicare din Str. Al. O. Teodoreanu nr. 49, Iași.">
  <meta property="og:url" content="https://scuterescu.ro/">
  <meta property="og:image" content="https://scuterescu.ro/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="ro_RO">
  <meta property="og:locale:alternate" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/img/hero-800.webp" as="image" type="image/webp" imagesrcset="/assets/img/hero-800.webp 800w, /assets/img/hero.webp 1600w" imagesizes="100vw" fetchpriority="high">
  <link rel="stylesheet" href="/assets/css/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AutoRental",
        "@id": "https://scuterescu.ro/#business",
        "name": "Scuterescu",
        "description": "Închiriere scutere SYM și Voge de 50cc și 125cc în Iași. Asigurare RCA inclusă.",
        "url": "https://scuterescu.ro/",
        "telephone": "+40756205206",
        "image": "https://scuterescu.ro/og-image.jpg",
        "logo": "https://scuterescu.ro/apple-touch-icon.png",
        "priceRange": "70–350 RON",
        "currenciesAccepted": "RON",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Str. Al. O. Teodoreanu nr. 49",
          "addressLocality": "Iași",
          "addressRegion": "Iași",
          "postalCode": "700154",
          "addressCountry": "RO"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 47.1456874, "longitude": 27.6050934 },
        "hasMap": "https://www.google.com/maps/search/?api=1&query=47.1456874,27.6050934",
        "openingHoursSpecification": [
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "19:00" },
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday"], "opens": "12:00", "closes": "19:00" }
        ],
        "areaServed": { "@type": "City", "name": "Iași" },
        "parentOrganization": { "@type": "Organization", "name": "METZ CARS SRL", "taxID": "RO42088025" },
        "makesOffer": [
          { "@type": "Offer", "name": "Închiriere scuter 50cc — 1 zi", "itemOffered": { "@type": "Product", "name": "Scuter 50cc SYM Jet 4 RX 50" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 70, "priceCurrency": "RON", "unitCode": "DAY", "unitText": "zi" } },
          { "@type": "Offer", "name": "Închiriere scuter 50cc — 1 săptămână", "itemOffered": { "@type": "Product", "name": "Scuter 50cc SYM Jet 4 RX 50" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 300, "priceCurrency": "RON", "unitCode": "WEE", "unitText": "săptămână" } },
          { "@type": "Offer", "name": "Închiriere scuter 125cc — 1 zi", "itemOffered": { "@type": "Product", "name": "Scuter 125cc SYM Jet 4 RX 125 sau Voge SR125 ADV" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 80, "priceCurrency": "RON", "unitCode": "DAY", "unitText": "zi" } },
          { "@type": "Offer", "name": "Închiriere scuter 125cc — 1 săptămână", "itemOffered": { "@type": "Product", "name": "Scuter 125cc SYM Jet 4 RX 125 sau Voge SR125 ADV" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 350, "priceCurrency": "RON", "unitCode": "WEE", "unitText": "săptămână" } }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Cât costă să închiriez un scuter în Iași?", "acceptedAnswer": { "@type": "Answer", "text": "Un scuter 50cc costă 70 RON pe zi sau 300 RON pe săptămână. Un scuter 125cc costă 80 RON pe zi sau 350 RON pe săptămână. Asigurarea RCA este inclusă în preț." } },
          { "@type": "Question", "name": "Ce permis îmi trebuie pentru un scuter de 50cc?", "acceptedAnswer": { "@type": "Answer", "text": "Pentru un scuter de 50cc ai nevoie de permis categoria AM sau B. Permisul categoria B include categoria AM." } },
          { "@type": "Question", "name": "Ce permis îmi trebuie pentru un scuter de 125cc?", "acceptedAnswer": { "@type": "Answer", "text": "Pentru un scuter de 125cc ai nevoie de permis categoria A1 sau A." } },
          { "@type": "Question", "name": "Cât este garanția?", "acceptedAnswer": { "@type": "Answer", "text": "Garanția este de 300 RON pentru scuterele de 50cc și 350 RON pentru scuterele de 125cc. Se plătește la ridicare și se returnează la predarea scuterului." } },
          { "@type": "Question", "name": "Ce este inclus în preț?", "acceptedAnswer": { "@type": "Answer", "text": "Prețul include asigurarea RCA. Casca este gratuită la închirierea pe o săptămână și costă 10 RON per închiriere la tariful pe zi." } },
          { "@type": "Question", "name": "Primesc cască?", "acceptedAnswer": { "@type": "Answer", "text": "Da. Casca este gratuită la închirierea pe o săptămână. La închirierea pe zi, casca costă 10 RON per închiriere." } },
          { "@type": "Question", "name": "Care este vârsta minimă pentru a închiria un scuter?", "acceptedAnswer": { "@type": "Answer", "text": "Vârsta minimă pentru a închiria un scuter este 18 ani." } },
          { "@type": "Question", "name": "Ce acte trebuie să am la mine?", "acceptedAnswer": { "@type": "Answer", "text": "Ai nevoie de cartea de identitate sau pașaport și de permisul de conducere valabil pentru categoria scuterului." } },
          { "@type": "Question", "name": "Unde ridic și unde returnez scuterul?", "acceptedAnswer": { "@type": "Answer", "text": "Ridici și returnezi scuterul la Str. Al. O. Teodoreanu nr. 49, Iași. Programul este luni–vineri 09:00–19:00, sâmbătă și duminică 12:00–19:00." } },
          { "@type": "Question", "name": "Cum rezerv un scuter?", "acceptedAnswer": { "@type": "Answer", "text": "Suni la +40 756 205 206 sau scrii pe WhatsApp la același număr, cu perioada dorită și tipul de scuter: 50cc sau 125cc." } }
        ]
      }
    ]
  }
  </script>
</head>
<body>
  <a class="skip-link" href="#continut">Sari la conținut</a>

  <header class="site-header">
    <div class="container site-header__inner">
      <a class="logo" href="/">Scuterescu<span class="logo__dot">.</span></a>
      <nav class="nav" id="nav-main" aria-label="Meniu principal">
        <ul>
          <li><a href="#flota">Flotă</a></li>
          <li><a href="#preturi">Prețuri</a></li>
          <li><a href="#conditii">Condiții</a></li>
          <li><a href="#intrebari">Întrebări</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
      <a class="lang-switch" href="/en/" hreflang="en" lang="en">EN</a>
      <a class="btn btn--call btn--sm header-call" href="tel:+40756205206">Sună</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-main">
        <span class="visually-hidden">Deschide meniul</span>
        <span class="nav-toggle__bar"></span>
        <span class="nav-toggle__bar"></span>
        <span class="nav-toggle__bar"></span>
      </button>
    </div>
  </header>

  <main id="continut">
    <section class="hero">
      <img class="hero__img" src="/assets/img/hero-800.webp" srcset="/assets/img/hero-800.webp 800w, /assets/img/hero.webp 1600w" sizes="100vw" width="1600" height="900" alt="Scuter parcat pe o stradă din oraș" fetchpriority="high">
      <div class="container hero__content">
        <h1>Închiriere scutere în Iași — de la 70 RON/zi</h1>
        <p class="hero__lead">Scutere SYM și Voge de 50cc și 125cc · RCA inclus · ridicare din Str. Al. O. Teodoreanu nr. 49</p>
        <div class="hero__actions">
          <a class="btn btn--call" href="tel:+40756205206">Sună: +40&nbsp;756&nbsp;205&nbsp;206</a>
          <a class="btn btn--wa" href="https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter.%20Perioada%3A%20">Scrie pe WhatsApp</a>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="avantaje-titlu">
      <div class="container">
        <h2 class="section__title" id="avantaje-titlu">De ce Scuterescu</h2>
        <p class="section__lead">Închiriezi rapid, fără birocrație, și pleci imediat prin Iași.</p>
        <ul class="features">
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg></div>
            <h3>RCA inclus</h3>
            <p>Asigurarea obligatorie este inclusă în toate prețurile.</p>
          </li>
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16a8 8 0 0 1 16 0v2H4z"/><path d="M12 8v8"/></svg></div>
            <h3>Cască gratuită</h3>
            <p>La închirierea pe o săptămână, casca e din partea noastră.</p>
          </li>
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg></div>
            <h3>Scutere verificate</h3>
            <p>Modele SYM și Voge moderne, revizuite înainte de fiecare închiriere.</p>
          </li>
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg></div>
            <h3>Fără birocrație</h3>
            <p>Suni sau scrii pe WhatsApp, vii cu actele și pleci.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section section--alt" id="flota" aria-labelledby="flota-titlu">
      <div class="container">
        <h2 class="section__title" id="flota-titlu">Flota noastră</h2>
        <p class="section__lead">Două categorii de scutere, pentru oraș și pentru drumuri mai lungi.</p>
        <div class="cards">
          <article class="card">
            <img class="card__img" src="/assets/img/scuter-50.webp" width="800" height="600" alt="Scuter de 50cc pentru închiriere în Iași" loading="lazy">
            <div class="card__body">
              <h3>Scuter 50cc</h3>
              <p class="card__models">SYM Jet 4 RX 50</p>
              <p class="card__price"><strong>70 RON</strong>/zi · <strong>300 RON</strong>/săptămână</p>
              <ul class="card__meta">
                <li>Garanție: 300 RON</li>
                <li>Permis: categoria AM sau B</li>
                <li>Ideal pentru oraș</li>
              </ul>
              <a class="btn btn--wa" href="https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter%2050cc%20(SYM%20Jet%204%20RX).%20Perioada%3A%20">Rezervă 50cc pe WhatsApp</a>
            </div>
          </article>
          <article class="card">
            <img class="card__img" src="/assets/img/scuter-125.webp" width="800" height="600" alt="Scuter de 125cc pentru închiriere în Iași" loading="lazy">
            <div class="card__body">
              <h3>Scuter 125cc</h3>
              <p class="card__models">SYM Jet 4 RX 125 · Voge SR125 ADV</p>
              <p class="card__price"><strong>80 RON</strong>/zi · <strong>350 RON</strong>/săptămână</p>
              <ul class="card__meta">
                <li>Garanție: 350 RON</li>
                <li>Permis: categoria A1 sau A</li>
                <li>Mai multă putere, pentru oraș și împrejurimi</li>
              </ul>
              <a class="btn btn--wa" href="https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter%20125cc.%20Perioada%3A%20">Rezervă 125cc pe WhatsApp</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="preturi" aria-labelledby="preturi-titlu">
      <div class="container">
        <h2 class="section__title" id="preturi-titlu">Prețuri închiriere scutere</h2>
        <p class="section__lead">Prețuri simple, cu asigurarea RCA inclusă.</p>
        <table class="price-table">
          <caption class="visually-hidden">Prețuri închiriere scutere în Iași</caption>
          <thead>
            <tr><th scope="col">Scuter</th><th scope="col">Pe zi</th><th scope="col">Pe săptămână</th><th scope="col">Garanție</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">50cc (SYM Jet 4 RX 50)</th><td>70 RON</td><td>300 RON</td><td>300 RON</td></tr>
            <tr><th scope="row">125cc (SYM Jet 4 RX 125, Voge SR125 ADV)</th><td>80 RON</td><td>350 RON</td><td>350 RON</td></tr>
          </tbody>
        </table>
        <p class="note">Casca: 10 RON per închiriere la tariful pe zi, gratuită la tariful pe săptămână. Asigurarea RCA este inclusă în toate prețurile.</p>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="pasi-titlu">
      <div class="container">
        <h2 class="section__title" id="pasi-titlu">Cum funcționează</h2>
        <ol class="steps">
          <li class="step"><span class="step__num">1</span><h3>Suni sau scrii pe WhatsApp</h3><p>Ne spui perioada și tipul de scuter: 50cc sau 125cc.</p></li>
          <li class="step"><span class="step__num">2</span><h3>Vii cu actele</h3><p>Cartea de identitate sau pașaportul și permisul de conducere.</p></li>
          <li class="step"><span class="step__num">3</span><h3>Pleci pe scuter</h3><p>Plătești închirierea și garanția, primești cheile și pleci.</p></li>
        </ol>
      </div>
    </section>

    <section class="section" id="conditii" aria-labelledby="conditii-titlu">
      <div class="container">
        <h2 class="section__title" id="conditii-titlu">Condiții de închiriere</h2>
        <ul class="conditions">
          <li>Vârsta minimă: 18 ani</li>
          <li>Carte de identitate sau pașaport</li>
          <li>Scuter 50cc: permis categoria AM sau B</li>
          <li>Scuter 125cc: permis categoria A1 sau A</li>
          <li>Garanție: 300 RON (50cc) sau 350 RON (125cc)</li>
          <li>Asigurarea RCA este inclusă în preț</li>
          <li>Cască: 10 RON/închiriere pe zi, gratuită pe săptămână</li>
          <li>Ridicare și returnare la Str. Al. O. Teodoreanu nr. 49, Iași</li>
        </ul>
      </div>
    </section>

    <section class="section section--alt" id="intrebari" aria-labelledby="intrebari-titlu">
      <div class="container">
        <h2 class="section__title" id="intrebari-titlu">Întrebări frecvente</h2>
        <div class="faq">
          <details><summary>Cât costă să închiriez un scuter în Iași?</summary><p>Un scuter 50cc costă 70 RON pe zi sau 300 RON pe săptămână. Un scuter 125cc costă 80 RON pe zi sau 350 RON pe săptămână. Asigurarea RCA este inclusă în preț.</p></details>
          <details><summary>Ce permis îmi trebuie pentru un scuter de 50cc?</summary><p>Pentru un scuter de 50cc ai nevoie de permis categoria AM sau B. Permisul categoria B include categoria AM.</p></details>
          <details><summary>Ce permis îmi trebuie pentru un scuter de 125cc?</summary><p>Pentru un scuter de 125cc ai nevoie de permis categoria A1 sau A.</p></details>
          <details><summary>Cât este garanția?</summary><p>Garanția este de 300 RON pentru scuterele de 50cc și 350 RON pentru scuterele de 125cc. Se plătește la ridicare și se returnează la predarea scuterului.</p></details>
          <details><summary>Ce este inclus în preț?</summary><p>Prețul include asigurarea RCA. Casca este gratuită la închirierea pe o săptămână și costă 10 RON per închiriere la tariful pe zi.</p></details>
          <details><summary>Primesc cască?</summary><p>Da. Casca este gratuită la închirierea pe o săptămână. La închirierea pe zi, casca costă 10 RON per închiriere.</p></details>
          <details><summary>Care este vârsta minimă pentru a închiria un scuter?</summary><p>Vârsta minimă pentru a închiria un scuter este 18 ani.</p></details>
          <details><summary>Ce acte trebuie să am la mine?</summary><p>Ai nevoie de cartea de identitate sau pașaport și de permisul de conducere valabil pentru categoria scuterului.</p></details>
          <details><summary>Unde ridic și unde returnez scuterul?</summary><p>Ridici și returnezi scuterul la Str. Al. O. Teodoreanu nr. 49, Iași. Programul este luni–vineri 09:00–19:00, sâmbătă și duminică 12:00–19:00.</p></details>
          <details><summary>Cum rezerv un scuter?</summary><p>Suni la +40 756 205 206 sau scrii pe WhatsApp la același număr, cu perioada dorită și tipul de scuter: 50cc sau 125cc.</p></details>
        </div>
      </div>
    </section>

    <section class="section" id="contact" aria-labelledby="contact-titlu">
      <div class="container contact">
        <div class="contact__info">
          <h2 id="contact-titlu">Contact și locație</h2>
          <address>
            <strong>Scuterescu</strong><br>
            Str. Al. O. Teodoreanu nr. 49<br>
            Iași 700154, România<br>
            Telefon și WhatsApp: <a href="tel:+40756205206">+40&nbsp;756&nbsp;205&nbsp;206</a>
          </address>
          <table class="hours">
            <caption class="visually-hidden">Program</caption>
            <tbody>
              <tr><th scope="row">Luni–Vineri</th><td>09:00–19:00</td></tr>
              <tr><th scope="row">Sâmbătă–Duminică</th><td>12:00–19:00</td></tr>
            </tbody>
          </table>
          <div class="hero__actions">
            <a class="btn btn--call" href="tel:+40756205206">Sună acum</a>
            <a class="btn btn--ghost" href="https://www.google.com/maps/search/?api=1&amp;query=47.1456874,27.6050934" rel="noopener">Deschide în Google Maps</a>
          </div>
        </div>
        <button class="map-facade" type="button" data-src="https://www.google.com/maps?q=47.1456874,27.6050934&amp;z=16&amp;output=embed" data-title="Hartă Scuterescu, Str. Al. O. Teodoreanu nr. 49, Iași">
          Arată harta
        </button>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Scuterescu este un brand METZ CARS SRL · CUI RO42088025 · © <span data-year>2026</span></p>
      <ul>
        <li><a href="/confidentialitate.html">Politica de confidențialitate</a></li>
        <li><a href="https://anpc.ro/" rel="noopener">ANPC</a></li>
        <li><a href="https://ec.europa.eu/consumers/odr" rel="noopener">Soluționarea online a litigiilor (SOL)</a></li>
      </ul>
    </div>
  </footer>

  <div class="mobile-bar">
    <a class="btn btn--call" href="tel:+40756205206">Sună</a>
    <a class="btn btn--wa" href="https://wa.me/40756205206?text=Bun%C4%83!%20A%C8%99%20dori%20s%C4%83%20%C3%AEnchiriez%20un%20scuter.%20Perioada%3A%20">WhatsApp</a>
  </div>

  <script src="/assets/js/main.js" defer></script>
</body>
</html>
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all `RO home page` subtests PASS.

- [ ] **Step 6: Validate markup**

Run: `npx html-validate site/index.html`
Expected: no errors. If a rule fires, fix the markup (not the config), unless the rule conflicts with the spec — then disable only that rule in `.htmlvalidate.json` with a one-line reason in the commit message.

- [ ] **Step 7: Commit**

```bash
git add tests/page-checks.mjs tests/home-ro.test.mjs site/index.html
git commit -m "feat: add Romanian home page with structured data and FAQ"
```

---

### Task 4: English home page

**Files:**
- Create: `tests/home-en.test.mjs`, `site/en/index.html`

**Interfaces:**
- Consumes: `checkHomePage` from `tests/page-checks.mjs`; same CSS/JS/images as Task 3. Anchor ids in EN: `fleet`, `prices`, `conditions`, `faq`, `contact`.

- [ ] **Step 1: Create `tests/home-en.test.mjs`**

```js
import { test } from 'node:test';
import { FACTS } from './facts.mjs';
import { checkHomePage } from './page-checks.mjs';

test('EN home page', (t) => checkHomePage(t, {
  file: 'site/en/index.html',
  lang: 'en',
  canonical: FACTS.enUrl,
  alternate: '/',
  faqCount: 10,
  waLinks: [
    'https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20scooter.%20Period%3A%20',
    'https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%2050cc%20scooter%20(SYM%20Jet%204%20RX).%20Period%3A%20',
    'https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20125cc%20scooter.%20Period%3A%20',
  ],
}));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: `EN home page` FAILS with `ENOENT ... site/en/index.html`.

- [ ] **Step 3: Create `site/en/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Scooter Rental Iași | 50cc &amp; 125cc from 70 RON/day | Scuterescu</title>
  <meta name="description" content="Rent a SYM or Voge scooter in Iași, Romania: 50cc from 70 RON/day, 125cc from 80 RON/day. Insurance included. Call or WhatsApp +40 756 205 206.">
  <link rel="canonical" href="https://scuterescu.ro/en/">
  <link rel="alternate" hreflang="ro" href="https://scuterescu.ro/">
  <link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/">
  <link rel="alternate" hreflang="x-default" href="https://scuterescu.ro/">
  <meta name="theme-color" content="#FFFBF5">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Scuterescu">
  <meta property="og:title" content="Scooter rental in Iași — from 70 RON/day | Scuterescu">
  <meta property="og:description" content="SYM and Voge 50cc and 125cc scooters. Insurance included. Pick-up at Str. Al. O. Teodoreanu nr. 49, Iași.">
  <meta property="og:url" content="https://scuterescu.ro/en/">
  <meta property="og:image" content="https://scuterescu.ro/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="en_US">
  <meta property="og:locale:alternate" content="ro_RO">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/assets/fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/img/hero-800.webp" as="image" type="image/webp" imagesrcset="/assets/img/hero-800.webp 800w, /assets/img/hero.webp 1600w" imagesizes="100vw" fetchpriority="high">
  <link rel="stylesheet" href="/assets/css/style.css">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AutoRental",
        "@id": "https://scuterescu.ro/#business",
        "name": "Scuterescu",
        "description": "SYM and Voge 50cc and 125cc scooter rental in Iași, Romania. Mandatory third-party (RCA) insurance included.",
        "url": "https://scuterescu.ro/en/",
        "telephone": "+40756205206",
        "image": "https://scuterescu.ro/og-image.jpg",
        "logo": "https://scuterescu.ro/apple-touch-icon.png",
        "priceRange": "70–350 RON",
        "currenciesAccepted": "RON",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Str. Al. O. Teodoreanu nr. 49",
          "addressLocality": "Iași",
          "addressRegion": "Iași",
          "postalCode": "700154",
          "addressCountry": "RO"
        },
        "geo": { "@type": "GeoCoordinates", "latitude": 47.1456874, "longitude": 27.6050934 },
        "hasMap": "https://www.google.com/maps/search/?api=1&query=47.1456874,27.6050934",
        "openingHoursSpecification": [
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], "opens": "09:00", "closes": "19:00" },
          { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday"], "opens": "12:00", "closes": "19:00" }
        ],
        "areaServed": { "@type": "City", "name": "Iași" },
        "parentOrganization": { "@type": "Organization", "name": "METZ CARS SRL", "taxID": "RO42088025" },
        "makesOffer": [
          { "@type": "Offer", "name": "50cc scooter rental — 1 day", "itemOffered": { "@type": "Product", "name": "50cc scooter SYM Jet 4 RX 50" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 70, "priceCurrency": "RON", "unitCode": "DAY", "unitText": "day" } },
          { "@type": "Offer", "name": "50cc scooter rental — 1 week", "itemOffered": { "@type": "Product", "name": "50cc scooter SYM Jet 4 RX 50" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 300, "priceCurrency": "RON", "unitCode": "WEE", "unitText": "week" } },
          { "@type": "Offer", "name": "125cc scooter rental — 1 day", "itemOffered": { "@type": "Product", "name": "125cc scooter SYM Jet 4 RX 125 or Voge SR125 ADV" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 80, "priceCurrency": "RON", "unitCode": "DAY", "unitText": "day" } },
          { "@type": "Offer", "name": "125cc scooter rental — 1 week", "itemOffered": { "@type": "Product", "name": "125cc scooter SYM Jet 4 RX 125 or Voge SR125 ADV" }, "priceSpecification": { "@type": "UnitPriceSpecification", "price": 350, "priceCurrency": "RON", "unitCode": "WEE", "unitText": "week" } }
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How much does it cost to rent a scooter in Iași?", "acceptedAnswer": { "@type": "Answer", "text": "A 50cc scooter costs 70 RON per day or 300 RON per week. A 125cc scooter costs 80 RON per day or 350 RON per week. Third-party (RCA) insurance is included." } },
          { "@type": "Question", "name": "What licence do I need for a 50cc scooter?", "acceptedAnswer": { "@type": "Answer", "text": "For a 50cc scooter you need a category AM or B driving licence. A category B licence includes category AM." } },
          { "@type": "Question", "name": "What licence do I need for a 125cc scooter?", "acceptedAnswer": { "@type": "Answer", "text": "For a 125cc scooter you need a category A1 or A driving licence." } },
          { "@type": "Question", "name": "How much is the deposit?", "acceptedAnswer": { "@type": "Answer", "text": "The deposit is 300 RON for 50cc scooters and 350 RON for 125cc scooters. You pay it at pick-up and get it back when you return the scooter." } },
          { "@type": "Question", "name": "What is included in the price?", "acceptedAnswer": { "@type": "Answer", "text": "The price includes third-party (RCA) insurance. A helmet is free on weekly rentals and costs 10 RON per rental on the daily rate." } },
          { "@type": "Question", "name": "Do I get a helmet?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. A helmet is free on weekly rentals. On daily rentals, a helmet costs 10 RON per rental." } },
          { "@type": "Question", "name": "What is the minimum age to rent a scooter?", "acceptedAnswer": { "@type": "Answer", "text": "The minimum age to rent a scooter is 18." } },
          { "@type": "Question", "name": "What documents do I need?", "acceptedAnswer": { "@type": "Answer", "text": "You need an ID card or passport and a driving licence valid for the scooter category." } },
          { "@type": "Question", "name": "Where do I pick up and return the scooter?", "acceptedAnswer": { "@type": "Answer", "text": "You pick up and return the scooter at Str. Al. O. Teodoreanu nr. 49, Iași. Opening hours are Monday–Friday 09:00–19:00 and Saturday–Sunday 12:00–19:00." } },
          { "@type": "Question", "name": "How do I book a scooter?", "acceptedAnswer": { "@type": "Answer", "text": "Call +40 756 205 206 or send a WhatsApp message to the same number with your dates and the scooter type: 50cc or 125cc." } }
        ]
      }
    ]
  }
  </script>
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>

  <header class="site-header">
    <div class="container site-header__inner">
      <a class="logo" href="/en/">Scuterescu<span class="logo__dot">.</span></a>
      <nav class="nav" id="nav-main" aria-label="Main menu">
        <ul>
          <li><a href="#fleet">Fleet</a></li>
          <li><a href="#prices">Prices</a></li>
          <li><a href="#conditions">Conditions</a></li>
          <li><a href="#faq">FAQ</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
      <a class="lang-switch" href="/" hreflang="ro" lang="ro">RO</a>
      <a class="btn btn--call btn--sm header-call" href="tel:+40756205206">Call</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-main">
        <span class="visually-hidden">Open menu</span>
        <span class="nav-toggle__bar"></span>
        <span class="nav-toggle__bar"></span>
        <span class="nav-toggle__bar"></span>
      </button>
    </div>
  </header>

  <main id="content">
    <section class="hero">
      <img class="hero__img" src="/assets/img/hero-800.webp" srcset="/assets/img/hero-800.webp 800w, /assets/img/hero.webp 1600w" sizes="100vw" width="1600" height="900" alt="Scooter parked on a city street" fetchpriority="high">
      <div class="container hero__content">
        <h1>Scooter rental in Iași — from 70 RON/day</h1>
        <p class="hero__lead">SYM and Voge 50cc and 125cc scooters · insurance included · pick-up at Str. Al. O. Teodoreanu nr. 49</p>
        <div class="hero__actions">
          <a class="btn btn--call" href="tel:+40756205206">Call: +40&nbsp;756&nbsp;205&nbsp;206</a>
          <a class="btn btn--wa" href="https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20scooter.%20Period%3A%20">Message on WhatsApp</a>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="why-title">
      <div class="container">
        <h2 class="section__title" id="why-title">Why Scuterescu</h2>
        <p class="section__lead">Rent in minutes, no paperwork hassle, and ride around Iași right away.</p>
        <ul class="features">
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg></div>
            <h3>Insurance included</h3>
            <p>Mandatory third-party (RCA) insurance is included in every price.</p>
          </li>
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16a8 8 0 0 1 16 0v2H4z"/><path d="M12 8v8"/></svg></div>
            <h3>Free helmet</h3>
            <p>Rent for a week and the helmet is on us.</p>
          </li>
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9 12l2 2 4-4"/></svg></div>
            <h3>Checked scooters</h3>
            <p>Modern SYM and Voge models, inspected before every rental.</p>
          </li>
          <li class="feature">
            <div class="feature__icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg></div>
            <h3>No hassle</h3>
            <p>Call or message on WhatsApp, bring your documents and ride.</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="section section--alt" id="fleet" aria-labelledby="fleet-title">
      <div class="container">
        <h2 class="section__title" id="fleet-title">Our fleet</h2>
        <p class="section__lead">Two scooter categories, for the city and for longer rides.</p>
        <div class="cards">
          <article class="card">
            <img class="card__img" src="/assets/img/scuter-50.webp" width="800" height="600" alt="50cc scooter for rent in Iași" loading="lazy">
            <div class="card__body">
              <h3>50cc scooter</h3>
              <p class="card__models">SYM Jet 4 RX 50</p>
              <p class="card__price"><strong>70 RON</strong>/day · <strong>300 RON</strong>/week</p>
              <ul class="card__meta">
                <li>Deposit: 300 RON</li>
                <li>Licence: category AM or B</li>
                <li>Perfect for the city</li>
              </ul>
              <a class="btn btn--wa" href="https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%2050cc%20scooter%20(SYM%20Jet%204%20RX).%20Period%3A%20">Book 50cc on WhatsApp</a>
            </div>
          </article>
          <article class="card">
            <img class="card__img" src="/assets/img/scuter-125.webp" width="800" height="600" alt="125cc scooter for rent in Iași" loading="lazy">
            <div class="card__body">
              <h3>125cc scooter</h3>
              <p class="card__models">SYM Jet 4 RX 125 · Voge SR125 ADV</p>
              <p class="card__price"><strong>80 RON</strong>/day · <strong>350 RON</strong>/week</p>
              <ul class="card__meta">
                <li>Deposit: 350 RON</li>
                <li>Licence: category A1 or A</li>
                <li>More power, for the city and beyond</li>
              </ul>
              <a class="btn btn--wa" href="https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20125cc%20scooter.%20Period%3A%20">Book 125cc on WhatsApp</a>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="prices" aria-labelledby="prices-title">
      <div class="container">
        <h2 class="section__title" id="prices-title">Scooter rental prices</h2>
        <p class="section__lead">Simple prices, third-party insurance included.</p>
        <table class="price-table">
          <caption class="visually-hidden">Scooter rental prices in Iași</caption>
          <thead>
            <tr><th scope="col">Scooter</th><th scope="col">Per day</th><th scope="col">Per week</th><th scope="col">Deposit</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">50cc (SYM Jet 4 RX 50)</th><td>70 RON</td><td>300 RON</td><td>300 RON</td></tr>
            <tr><th scope="row">125cc (SYM Jet 4 RX 125, Voge SR125 ADV)</th><td>80 RON</td><td>350 RON</td><td>350 RON</td></tr>
          </tbody>
        </table>
        <p class="note">Helmet: 10 RON per rental on the daily rate, free on the weekly rate. Third-party (RCA) insurance is included in all prices.</p>
      </div>
    </section>

    <section class="section section--alt" aria-labelledby="steps-title">
      <div class="container">
        <h2 class="section__title" id="steps-title">How it works</h2>
        <ol class="steps">
          <li class="step"><span class="step__num">1</span><h3>Call or WhatsApp us</h3><p>Tell us your dates and the scooter type: 50cc or 125cc.</p></li>
          <li class="step"><span class="step__num">2</span><h3>Bring your documents</h3><p>ID card or passport and your driving licence.</p></li>
          <li class="step"><span class="step__num">3</span><h3>Ride away</h3><p>Pay the rental and deposit, get the keys and go.</p></li>
        </ol>
      </div>
    </section>

    <section class="section" id="conditions" aria-labelledby="conditions-title">
      <div class="container">
        <h2 class="section__title" id="conditions-title">Rental conditions</h2>
        <ul class="conditions">
          <li>Minimum age: 18</li>
          <li>ID card or passport</li>
          <li>50cc scooter: category AM or B licence</li>
          <li>125cc scooter: category A1 or A licence</li>
          <li>Deposit: 300 RON (50cc) or 350 RON (125cc)</li>
          <li>Third-party (RCA) insurance included</li>
          <li>Helmet: 10 RON/rental on daily rate, free on weekly rate</li>
          <li>Pick-up and return at Str. Al. O. Teodoreanu nr. 49, Iași</li>
        </ul>
      </div>
    </section>

    <section class="section section--alt" id="faq" aria-labelledby="faq-title">
      <div class="container">
        <h2 class="section__title" id="faq-title">Frequently asked questions</h2>
        <div class="faq">
          <details><summary>How much does it cost to rent a scooter in Iași?</summary><p>A 50cc scooter costs 70 RON per day or 300 RON per week. A 125cc scooter costs 80 RON per day or 350 RON per week. Third-party (RCA) insurance is included.</p></details>
          <details><summary>What licence do I need for a 50cc scooter?</summary><p>For a 50cc scooter you need a category AM or B driving licence. A category B licence includes category AM.</p></details>
          <details><summary>What licence do I need for a 125cc scooter?</summary><p>For a 125cc scooter you need a category A1 or A driving licence.</p></details>
          <details><summary>How much is the deposit?</summary><p>The deposit is 300 RON for 50cc scooters and 350 RON for 125cc scooters. You pay it at pick-up and get it back when you return the scooter.</p></details>
          <details><summary>What is included in the price?</summary><p>The price includes third-party (RCA) insurance. A helmet is free on weekly rentals and costs 10 RON per rental on the daily rate.</p></details>
          <details><summary>Do I get a helmet?</summary><p>Yes. A helmet is free on weekly rentals. On daily rentals, a helmet costs 10 RON per rental.</p></details>
          <details><summary>What is the minimum age to rent a scooter?</summary><p>The minimum age to rent a scooter is 18.</p></details>
          <details><summary>What documents do I need?</summary><p>You need an ID card or passport and a driving licence valid for the scooter category.</p></details>
          <details><summary>Where do I pick up and return the scooter?</summary><p>You pick up and return the scooter at Str. Al. O. Teodoreanu nr. 49, Iași. Opening hours are Monday–Friday 09:00–19:00 and Saturday–Sunday 12:00–19:00.</p></details>
          <details><summary>How do I book a scooter?</summary><p>Call +40 756 205 206 or send a WhatsApp message to the same number with your dates and the scooter type: 50cc or 125cc.</p></details>
        </div>
      </div>
    </section>

    <section class="section" id="contact" aria-labelledby="contact-title">
      <div class="container contact">
        <div class="contact__info">
          <h2 id="contact-title">Contact and location</h2>
          <address>
            <strong>Scuterescu</strong><br>
            Str. Al. O. Teodoreanu nr. 49<br>
            Iași 700154, Romania<br>
            Phone and WhatsApp: <a href="tel:+40756205206">+40&nbsp;756&nbsp;205&nbsp;206</a>
          </address>
          <table class="hours">
            <caption class="visually-hidden">Opening hours</caption>
            <tbody>
              <tr><th scope="row">Monday–Friday</th><td>09:00–19:00</td></tr>
              <tr><th scope="row">Saturday–Sunday</th><td>12:00–19:00</td></tr>
            </tbody>
          </table>
          <div class="hero__actions">
            <a class="btn btn--call" href="tel:+40756205206">Call now</a>
            <a class="btn btn--ghost" href="https://www.google.com/maps/search/?api=1&amp;query=47.1456874,27.6050934" rel="noopener">Open in Google Maps</a>
          </div>
        </div>
        <button class="map-facade" type="button" data-src="https://www.google.com/maps?q=47.1456874,27.6050934&amp;z=16&amp;output=embed" data-title="Map: Scuterescu, Str. Al. O. Teodoreanu nr. 49, Iași">
          Show map
        </button>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Scuterescu is a brand of METZ CARS SRL · CUI RO42088025 · © <span data-year>2026</span></p>
      <ul>
        <li><a href="/en/privacy.html">Privacy policy</a></li>
        <li><a href="https://anpc.ro/" rel="noopener">ANPC (consumer protection)</a></li>
        <li><a href="https://ec.europa.eu/consumers/odr" rel="noopener">Online dispute resolution (ODR)</a></li>
      </ul>
    </div>
  </footer>

  <div class="mobile-bar">
    <a class="btn btn--call" href="tel:+40756205206">Call</a>
    <a class="btn btn--wa" href="https://wa.me/40756205206?text=Hi!%20I%20would%20like%20to%20rent%20a%20scooter.%20Period%3A%20">WhatsApp</a>
  </div>

  <script src="/assets/js/main.js" defer></script>
</body>
</html>
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all `EN home page` subtests PASS.

- [ ] **Step 5: Validate markup**

Run: `npx html-validate site/en/index.html`
Expected: no errors (same fix policy as Task 3 Step 6).

- [ ] **Step 6: Commit**

```bash
git add tests/home-en.test.mjs site/en/index.html
git commit -m "feat: add English home page"
```

---

### Task 5: Privacy policy pages

**Files:**
- Create: `tests/privacy.test.mjs`, `site/confidentialitate.html`, `site/en/privacy.html`

**Interfaces:**
- Consumes: helpers, `FACTS`, CSS class `prose`, `site-header`, `site-footer`.
- Produces: URLs `/confidentialitate.html` and `/en/privacy.html` (linked from footers; listed in sitemap in Task 7).

- [ ] **Step 1: Create `tests/privacy.test.mjs`**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: both privacy tests FAIL with `ENOENT`.

- [ ] **Step 3: Create `site/confidentialitate.html`**

```html
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Politica de confidențialitate | Scuterescu</title>
  <meta name="description" content="Cum prelucrează Scuterescu (METZ CARS SRL) datele personale ale clienților care închiriază scutere în Iași.">
  <link rel="canonical" href="https://scuterescu.ro/confidentialitate.html">
  <link rel="alternate" hreflang="ro" href="https://scuterescu.ro/confidentialitate.html">
  <link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/privacy.html">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="logo" href="/">Scuterescu<span class="logo__dot">.</span></a>
      <a class="lang-switch" href="/en/privacy.html" hreflang="en" lang="en">EN</a>
    </div>
  </header>

  <main class="prose">
    <h1>Politica de confidențialitate</h1>
    <p>Ultima actualizare: 26 septembrie 2026</p>

    <h2>Cine suntem</h2>
    <p>Scuterescu este un brand METZ CARS SRL, CUI RO42088025, cu punct de lucru la Str. Al. O. Teodoreanu nr. 49, Iași. Ne poți contacta la +40 756 205 206 (telefon și WhatsApp).</p>

    <h2>Ce date colectăm</h2>
    <p>Site-ul nu folosește formulare, nu folosește cookie-uri și nu folosește instrumente de analiză a traficului. Nu colectăm date prin site.</p>
    <p>Când ne suni sau ne scrii pe WhatsApp, primim numărul tău de telefon și informațiile pe care ni le transmiți (de exemplu perioada dorită). La închiriere, prelucrăm datele din actul de identitate și din permisul de conducere, necesare pentru contractul de închiriere.</p>

    <h2>De ce folosim datele</h2>
    <p>Folosim datele doar pentru a răspunde solicitărilor, pentru a încheia și executa contractul de închiriere și pentru a respecta obligațiile legale (de exemplu cele fiscale și contabile).</p>

    <h2>Cât timp păstrăm datele</h2>
    <p>Păstrăm datele din contract pe durata prevăzută de legislația fiscală și contabilă. Mesajele primite pe telefon sau WhatsApp le păstrăm doar cât este necesar pentru a răspunde solicitării.</p>

    <h2>Harta Google</h2>
    <p>Harta din pagina de contact se încarcă doar dacă apeși butonul „Arată harta”. În acel moment, Google poate prelucra date conform propriei politici de confidențialitate.</p>

    <h2>Drepturile tale</h2>
    <p>Ai dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție. Pentru a le exercita, contactează-ne la +40 756 205 206. Ai și dreptul de a depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), <a href="https://www.dataprotection.ro/" rel="noopener">www.dataprotection.ro</a>.</p>

    <p><a href="/">← Înapoi la pagina principală</a></p>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Scuterescu este un brand METZ CARS SRL · CUI RO42088025</p>
    </div>
  </footer>
</body>
</html>
```

- [ ] **Step 4: Create `site/en/privacy.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy policy | Scuterescu</title>
  <meta name="description" content="How Scuterescu (METZ CARS SRL) processes the personal data of customers renting scooters in Iași.">
  <link rel="canonical" href="https://scuterescu.ro/en/privacy.html">
  <link rel="alternate" hreflang="ro" href="https://scuterescu.ro/confidentialitate.html">
  <link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/privacy.html">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container site-header__inner">
      <a class="logo" href="/en/">Scuterescu<span class="logo__dot">.</span></a>
      <a class="lang-switch" href="/confidentialitate.html" hreflang="ro" lang="ro">RO</a>
    </div>
  </header>

  <main class="prose">
    <h1>Privacy policy</h1>
    <p>Last updated: 26 September 2026</p>

    <h2>Who we are</h2>
    <p>Scuterescu is a brand of METZ CARS SRL, CUI RO42088025, located at Str. Al. O. Teodoreanu nr. 49, Iași, Romania. You can reach us at +40 756 205 206 (phone and WhatsApp).</p>

    <h2>What data we collect</h2>
    <p>This website has no forms, uses no cookies and no analytics tools. We do not collect data through the website.</p>
    <p>When you call us or message us on WhatsApp, we receive your phone number and the information you send (for example your rental dates). When you rent a scooter, we process the data on your ID document and driving licence, as required for the rental contract.</p>

    <h2>Why we use the data</h2>
    <p>We use the data only to answer your requests, to conclude and perform the rental contract, and to meet legal obligations (for example tax and accounting).</p>

    <h2>How long we keep the data</h2>
    <p>We keep contract data for the period required by tax and accounting law. Phone and WhatsApp messages are kept only as long as needed to handle your request.</p>

    <h2>Google Map</h2>
    <p>The map on the contact section loads only if you press the “Show map” button. At that point, Google may process data under its own privacy policy.</p>

    <h2>Your rights</h2>
    <p>You have the right of access, rectification, erasure, restriction, portability and objection. To exercise them, contact us at +40 756 205 206. You may also lodge a complaint with the Romanian data protection authority (ANSPDCP), <a href="https://www.dataprotection.ro/" rel="noopener">www.dataprotection.ro</a>.</p>

    <p><a href="/en/">← Back to the home page</a></p>
  </main>

  <footer class="site-footer">
    <div class="container">
      <p>Scuterescu is a brand of METZ CARS SRL · CUI RO42088025</p>
    </div>
  </footer>
</body>
</html>
```

- [ ] **Step 5: Run tests and validate**

Run: `npm test && npx html-validate site/confidentialitate.html site/en/privacy.html`
Expected: all tests PASS, no validation errors.

- [ ] **Step 6: Commit**

```bash
git add tests/privacy.test.mjs site/confidentialitate.html site/en/privacy.html
git commit -m "feat: add privacy policy pages"
```

---

### Task 6: Images, favicon and Open Graph image

**Files:**
- Create: `tests/images.test.mjs`, `scripts/optimize-images.mjs`, `site/favicon.svg`, `site/assets/img/CREDITS.md`
- Generated: `site/assets/img/hero.webp`, `hero-800.webp`, `scuter-50.webp`, `scuter-125.webp`, `site/og-image.jpg`, `site/apple-touch-icon.png`
- Downloaded (git-ignored): `images-src/hero.jpg`, `images-src/scuter-50.jpg`, `images-src/scuter-125.jpg`

**Interfaces:**
- Consumes: image paths referenced by pages from Tasks 3–4.
- Produces: `npm run images` regenerates all derived images from `images-src/`.

- [ ] **Step 1: Create `tests/images.test.mjs`**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: image tests FAIL (missing files).

- [ ] **Step 3: Download three free-licence photos**

Search Unsplash (https://unsplash.com/s/photos/scooter) or Pexels (https://www.pexels.com/search/scooter/) — both licences allow free commercial use without permission. Use the built-in browser to pick:
- `hero.jpg`: landscape, a scooter on a city street, bright/sunny, space on the left or bottom for text, at least 1600×900.
- `scuter-50.jpg`: a small modern urban scooter (sporty style like SYM Jet 4), clearly visible, landscape.
- `scuter-125.jpg`: a larger scooter, ideally adventure/crossover style (like Voge SR125 ADV), landscape.

Rules: no visible licence plates or recognizable faces as the main subject; no brand logos of competitors; not a watermarked or "Unsplash+" (paid) image.

Download each at original size:

```bash
mkdir -p images-src
curl -L -o images-src/hero.jpg "<download URL of chosen photo>"
curl -L -o images-src/scuter-50.jpg "<download URL of chosen photo>"
curl -L -o images-src/scuter-125.jpg "<download URL of chosen photo>"
file images-src/*.jpg
```

Expected: three JPEG files. (The `<download URL>` values are whatever photos you picked in this step — for Unsplash, the photo page URL + `/download?force=true`; for Pexels, the "Free download" link.)

- [ ] **Step 4: Create `site/assets/img/CREDITS.md`**

Fill in one line per photo with the real values from Step 3:

```markdown
# Image credits

Photos are used under the Unsplash License (https://unsplash.com/license) or the Pexels License (https://www.pexels.com/license/). Replace with own fleet photos when available.

- hero.jpg → hero.webp, hero-800.webp, og-image.jpg — Photo by <author name> — <photo page URL>
- scuter-50.jpg → scuter-50.webp — Photo by <author name> — <photo page URL>
- scuter-125.jpg → scuter-125.webp — Photo by <author name> — <photo page URL>
```

- [ ] **Step 5: Create `site/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#C2410C"/>
  <text x="32" y="45" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#FFFFFF">S</text>
</svg>
```

- [ ] **Step 6: Create `scripts/optimize-images.mjs`**

```js
// Converts raw photos from images-src/ into optimized site images.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'images-src';
const OUT = 'site/assets/img';
mkdirSync(OUT, { recursive: true });

const jobs = [
  { input: 'hero.jpg', output: 'hero.webp', width: 1600, height: 900 },
  { input: 'hero.jpg', output: 'hero-800.webp', width: 800, height: 450 },
  { input: 'scuter-50.jpg', output: 'scuter-50.webp', width: 800, height: 600 },
  { input: 'scuter-125.jpg', output: 'scuter-125.webp', width: 800, height: 600 },
];

for (const job of jobs) {
  await sharp(`${SRC}/${job.input}`)
    .resize(job.width, job.height, { fit: 'cover' })
    .webp({ quality: 78 })
    .toFile(`${OUT}/${job.output}`);
  console.log(`${OUT}/${job.output}`);
}

await sharp(`${SRC}/hero.jpg`).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 82 }).toFile('site/og-image.jpg');
await sharp('site/favicon.svg').resize(180, 180).png().toFile('site/apple-touch-icon.png');
console.log('site/og-image.jpg\nsite/apple-touch-icon.png');
```

- [ ] **Step 7: Generate images**

Run: `npm run images && ls -la site/assets/img site/og-image.jpg site/apple-touch-icon.png`
Expected: 4 webp files (hero.webp under ~250 KB, others under ~120 KB), og-image.jpg, apple-touch-icon.png.

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add tests/images.test.mjs scripts/optimize-images.mjs site/favicon.svg site/apple-touch-icon.png site/og-image.jpg site/assets/img
git commit -m "feat: add optimized scooter photos, favicon and og image"
```

---

### Task 7: robots.txt, sitemap.xml, llms.txt, _headers and cross-file consistency

**Files:**
- Create: `tests/seo-files.test.mjs`, `tests/consistency.test.mjs`, `site/robots.txt`, `site/sitemap.xml`, `site/llms.txt`, `site/_headers`

**Interfaces:**
- Consumes: `FACTS`, helpers; page URLs from Tasks 3–5.

- [ ] **Step 1: Create `tests/seo-files.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.mjs';

const URLS = [
  'https://scuterescu.ro/',
  'https://scuterescu.ro/en/',
  'https://scuterescu.ro/confidentialitate.html',
  'https://scuterescu.ro/en/privacy.html',
];

test('robots.txt allows all crawlers incl. AI and points to sitemap', () => {
  const robots = read('site/robots.txt');
  assert.match(robots, /User-agent: \*\s+Allow: \//);
  for (const bot of ['GPTBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot']) {
    assert.ok(robots.includes(`User-agent: ${bot}`), `missing ${bot}`);
  }
  assert.ok(robots.includes('Sitemap: https://scuterescu.ro/sitemap.xml'));
});

test('sitemap lists all pages with hreflang alternates', () => {
  const sitemap = read('site/sitemap.xml');
  assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  for (const url of URLS) assert.ok(sitemap.includes(`<loc>${url}</loc>`), `missing ${url}`);
  assert.equal((sitemap.match(/<url>/g) || []).length, 4);
  assert.ok(sitemap.includes('hreflang="en" href="https://scuterescu.ro/en/"'));
});

test('llms.txt starts with H1 and a summary blockquote', () => {
  const llms = read('site/llms.txt');
  assert.match(llms, /^# Scuterescu\n\n> .+/);
  assert.ok(llms.includes('https://scuterescu.ro/en/'));
});

test('_headers sets security and cache headers', () => {
  const headers = read('site/_headers');
  for (const h of ['X-Content-Type-Options: nosniff', 'Referrer-Policy:', 'Cache-Control:']) {
    assert.ok(headers.includes(h), `missing ${h}`);
  }
});
```

- [ ] **Step 2: Create `tests/consistency.test.mjs`**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, text } from './helpers.mjs';

// Prices, hours and contact data must be identical everywhere they appear.
const FILES = ['site/index.html', 'site/en/index.html', 'site/llms.txt'];
const REQUIRED = [
  FACTS.phoneDisplay, FACTS.street, FACTS.company, FACTS.cui, FACTS.city, ...FACTS.models,
  `${FACTS.prices['50'].day} RON`, `${FACTS.prices['50'].week} RON`,
  `${FACTS.prices['125'].day} RON`, `${FACTS.prices['125'].week} RON`,
  `${FACTS.helmetDay} RON`,
  FACTS.hours.weekdays[0], FACTS.hours.weekend[0], FACTS.hours.weekdays[1],
];

for (const file of FILES) {
  test(`facts consistent in ${file}`, () => {
    const content = text(read(file));
    for (const s of REQUIRED) assert.ok(content.includes(s), `${file} missing "${s}"`);
    assert.ok(!/ş|ţ|Ş|Ţ/.test(content), `${file} uses cedilla diacritics`);
  });
}
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: seo-files tests and `facts consistent in site/llms.txt` FAIL with `ENOENT`; RO/EN consistency tests PASS.

- [ ] **Step 4: Create `site/robots.txt`**

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://scuterescu.ro/sitemap.xml
```

- [ ] **Step 5: Create `site/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>https://scuterescu.ro/</loc>
    <lastmod>2026-09-26</lastmod>
    <xhtml:link rel="alternate" hreflang="ro" href="https://scuterescu.ro/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://scuterescu.ro/"/>
  </url>
  <url>
    <loc>https://scuterescu.ro/en/</loc>
    <lastmod>2026-09-26</lastmod>
    <xhtml:link rel="alternate" hreflang="ro" href="https://scuterescu.ro/"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="https://scuterescu.ro/"/>
  </url>
  <url>
    <loc>https://scuterescu.ro/confidentialitate.html</loc>
    <lastmod>2026-09-26</lastmod>
    <xhtml:link rel="alternate" hreflang="ro" href="https://scuterescu.ro/confidentialitate.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/privacy.html"/>
  </url>
  <url>
    <loc>https://scuterescu.ro/en/privacy.html</loc>
    <lastmod>2026-09-26</lastmod>
    <xhtml:link rel="alternate" hreflang="ro" href="https://scuterescu.ro/confidentialitate.html"/>
    <xhtml:link rel="alternate" hreflang="en" href="https://scuterescu.ro/en/privacy.html"/>
  </url>
</urlset>
```

- [ ] **Step 6: Create `site/llms.txt`**

```markdown
# Scuterescu

> Scuterescu închiriază scutere SYM și Voge de 50cc și 125cc în Iași, România. Scuter 50cc: 70 RON/zi sau 300 RON/săptămână. Scuter 125cc: 80 RON/zi sau 350 RON/săptămână. Asigurarea RCA este inclusă. Rezervări la +40 756 205 206 (telefon și WhatsApp).

Scuterescu este un brand METZ CARS SRL, CUI RO42088025.

## Flotă și prețuri

- Scuter 50cc — SYM Jet 4 RX 50: 70 RON/zi, 300 RON/săptămână, garanție 300 RON, permis categoria AM sau B.
- Scuter 125cc — SYM Jet 4 RX 125 sau Voge SR125 ADV: 80 RON/zi, 350 RON/săptămână, garanție 350 RON, permis categoria A1 sau A.
- Asigurarea RCA este inclusă în toate prețurile.
- Cască: 10 RON per închiriere la tariful pe zi; gratuită la tariful pe săptămână.

## Condiții

- Vârsta minimă: 18 ani.
- Acte: carte de identitate sau pașaport și permis de conducere valabil pentru categoria scuterului.
- Garanția se plătește la ridicare și se returnează la predare.

## Locație și program

- Adresă (ridicare și returnare): Str. Al. O. Teodoreanu nr. 49, Iași 700154, România. Nu livrăm la domiciliu.
- Luni–Vineri: 09:00–19:00.
- Sâmbătă–Duminică: 12:00–19:00.

## Rezervare

- Telefon și WhatsApp: +40 756 205 206.
- Nu există rezervare online; rezervarea se face telefonic sau pe WhatsApp.

## Pagini

- [Pagina principală (RO)](https://scuterescu.ro/): flotă, prețuri, condiții, întrebări frecvente, contact.
- [Home page (EN)](https://scuterescu.ro/en/): fleet, prices, conditions, FAQ, contact.
- [Politica de confidențialitate](https://scuterescu.ro/confidentialitate.html)

## English summary

Scuterescu rents SYM and Voge 50cc and 125cc scooters in Iași, Romania. 50cc (SYM Jet 4 RX 50): 70 RON/day or 300 RON/week, deposit 300 RON, licence AM or B. 125cc (SYM Jet 4 RX 125 or Voge SR125 ADV): 80 RON/day or 350 RON/week, deposit 350 RON, licence A1 or A. Third-party (RCA) insurance included. Helmet 10 RON per daily rental, free on weekly rentals. Minimum age 18. Pick-up and return at Str. Al. O. Teodoreanu nr. 49, Iași. Open Monday–Friday 09:00–19:00, Saturday–Sunday 12:00–19:00. Book by phone or WhatsApp: +40 756 205 206.
```

- [ ] **Step 7: Create `site/_headers`** (Cloudflare Pages header rules)

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=604800

/llms.txt
  Content-Type: text/plain; charset=utf-8
```

- [ ] **Step 8: Run tests**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 9: Commit**

```bash
git add tests/seo-files.test.mjs tests/consistency.test.mjs site/robots.txt site/sitemap.xml site/llms.txt site/_headers
git commit -m "feat: add robots, sitemap, llms.txt and Cloudflare headers"
```

---

### Task 8: Full verification and README

**Files:**
- Create: `README.md`
- Modify: any site file where a check below finds a problem

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test && npm run validate`
Expected: all tests PASS; html-validate reports no errors.

- [ ] **Step 2: Serve locally**

Run (background): `npm run serve`
Expected: site at `http://localhost:8080`.

- [ ] **Step 3: Visual check in the built-in browser**

Open `http://localhost:8080/` and `http://localhost:8080/en/` at widths 375, 768 and 1280. Check for each:
- No horizontal scroll (`document.documentElement.scrollWidth <= innerWidth` via JS console).
- Hero text readable over photo; buttons visible.
- At 375: hamburger opens/closes the menu, menu link click closes it, bottom bar with Sună/WhatsApp visible and not covering footer text.
- "Arată harta" / "Show map" replaces the button with the Google Map.
- RO ↔ EN switch works in both directions; privacy links work.
- Footer shows the current year.

Fix any issue in CSS/HTML, re-run `npm test`, and commit with `fix: ...`.

- [ ] **Step 4: Lighthouse (mobile)**

Run: `npx --yes lighthouse http://localhost:8080/ --form-factor=mobile --screenEmulation.mobile --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=./lighthouse-ro.json --chrome-flags="--headless=new" && node -e "const r=require('./lighthouse-ro.json');for(const [k,v] of Object.entries(r.categories))console.log(k, Math.round(v.score*100))"`
Expected: every category ≥ 95. Repeat for `http://localhost:8080/en/`. If Chrome is not installed locally, skip and run PageSpeed Insights (https://pagespeed.web.dev/) after deploy instead. Do not commit the JSON reports (`rm lighthouse-*.json`).

- [ ] **Step 5: Structured data check**

Paste the full HTML of `site/index.html` into https://validator.schema.org/ (Code snippet tab) and confirm `AutoRental` and `FAQPage` parse with 0 errors. After deploy, also run https://search.google.com/test/rich-results on `https://scuterescu.ro/`.

- [ ] **Step 6: Create `README.md`**

```markdown
# scuterescu.ro

Static site for Scuterescu — scooter rental in Iași (brand of METZ CARS SRL).
Design spec: `docs/superpowers/specs/2026-09-26-scuterescu-site-design.md`.

Everything deployable is in `site/`. No build step.

## Develop

    npm install
    npm run serve      # http://localhost:8080
    npm test           # content, structured data and consistency checks
    npm run validate   # HTML validation

## Change prices, hours or contact data

Update **all** of these, then run `npm test` (it fails if they disagree):

- `site/index.html` — visible text + JSON-LD (`makesOffer`, `openingHoursSpecification`, FAQ answers)
- `site/en/index.html` — same, in English
- `site/llms.txt`
- `tests/facts.mjs`

## Replace photos

Put new JPEGs in `images-src/` (`hero.jpg`, `scuter-50.jpg`, `scuter-125.jpg`), run `npm run images`, update `site/assets/img/CREDITS.md`.

## Deploy (Cloudflare Pages)

1. Push this repository to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command: *(empty)*. Build output directory: `site`.
4. Custom domains → add `scuterescu.ro` and `www.scuterescu.ro`; follow the DNS instructions (redirect `www` to the apex).
5. After the first deploy: submit `https://scuterescu.ro/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Owner to-do (outside the code)

- Create and verify the Google Business Profile with exactly the same name, address, phone and hours as the site.
- Confirm whether a category B licence is legally enough for 125cc in Romania before changing the licence text.
- Confirm the legal form "METZ CARS SRL".
- Replace stock photos with real fleet photos.
- Optional: Facebook/Instagram pages, then add them to `sameAs` in the JSON-LD.
```

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: add README with develop, update and deploy instructions"
```
