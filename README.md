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

## Deploy (GitHub Pages)

Pushes to `main` deploy automatically via `.github/workflows/pages.yml` (runs `npm ci && npm test && npm run validate`, then publishes `site/` with GitHub Pages).

Site URL: `https://alexandrumetzak.github.io/scuterescu/`.

### Custom domain (`scuterescu.ro`)

Once the owner is ready to point the domain at GitHub Pages:

1. **DNS at the registrar** — apex `A` records:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

   Optionally `AAAA` records:
   - `2606:50c0:8000::153`
   - `2606:50c0:8001::153`
   - `2606:50c0:8002::153`
   - `2606:50c0:8003::153`

   And a `www` `CNAME` → `alexandrumetzak.github.io`.
2. Add a file `site/CNAME` containing `scuterescu.ro`, then push.
3. Repo Settings → Pages → Custom domain → `scuterescu.ro`. Tick "Enforce HTTPS" once the certificate is issued. GitHub redirects `www` to the apex automatically.
4. Submit `https://scuterescu.ro/sitemap.xml` in Google Search Console. Also run https://search.google.com/test/rich-results on `https://scuterescu.ro/` to confirm the structured data renders correctly in production.

## Owner to-do (outside the code)

- Create and verify the Google Business Profile with exactly the same name, address, phone and hours as the site.
- Confirm whether a category B licence is legally enough for 125cc in Romania before changing the licence text.
- Confirm the legal form "METZ CARS SRL".
- Replace stock photos with real fleet photos.
- Optional: Facebook/Instagram pages, then add them to `sameAs` in the JSON-LD.
