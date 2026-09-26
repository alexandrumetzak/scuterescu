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
5. After the first deploy: submit `https://scuterescu.ro/sitemap.xml` in Google Search Console and Bing Webmaster Tools. Also run https://search.google.com/test/rich-results on `https://scuterescu.ro/` to confirm the structured data renders correctly in production.

## Owner to-do (outside the code)

- Create and verify the Google Business Profile with exactly the same name, address, phone and hours as the site.
- Confirm whether a category B licence is legally enough for 125cc in Romania before changing the licence text.
- Confirm the legal form "METZ CARS SRL".
- Replace stock photos with real fleet photos.
- Optional: Facebook/Instagram pages, then add them to `sameAs` in the JSON-LD.
