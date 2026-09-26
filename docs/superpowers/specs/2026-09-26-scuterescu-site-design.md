# Scuterescu.ro — Design site

Data: 2026-09-26

## Scop

Site de prezentare pentru închiriere scutere în Iași. O singură pagină atractivă și simplă, bilingvă (RO/EN), optimizată pentru SEO local, AEO (answer engines) și AIO (asistenți AI: ChatGPT, Perplexity, Google AI Overviews). Conversia se face prin telefon și WhatsApp — fără formular, fără sistem de rezervare.

## Date business

- **Brand:** Scuterescu — sub-brand al METZ CARS SRL, CUI RO42088025 (forma juridică SRL de confirmat)
- **Domeniu:** scuterescu.ro
- **Telefon / WhatsApp:** +40 756 205 206
- **Adresă (ridicare și returnare):** Str. Al. O. Teodoreanu nr. 49, Iași
- **Program:** Luni–Vineri 09:00–19:00; Sâmbătă–Duminică 12:00–19:00
- **Fără livrare** — clientul ridică și returnează scuterul la sediu.

### Flotă și prețuri

| Categorie | Modele | Preț/zi | Preț/săptămână | Garanție | Permis |
|---|---|---|---|---|---|
| 50cc | SYM Jet 4 RX 50 | 70 RON | 300 RON | 300 RON | B sau AM |
| 125cc | SYM Jet 4 RX 125, Voge SR125 ADV | 80 RON | 350 RON | 350 RON | A1 sau A |

- **Inclus în preț:** asigurare RCA.
- **Cască:** 10 RON per închiriere la tariful pe zi; gratuită la tariful pe săptămână.
- **Vârstă minimă:** 18 ani.
- **Acte necesare:** carte de identitate/pașaport + permis de conducere valabil pentru categorie.
- Mesajul de brand spune „SYM și Voge”, nu „doar SYM”.

**Notă juridică:** permisul acceptat pentru 125cc apare pe site ca A1/A (varianta conservatoare). Proprietarul verifică dacă permisul B e acceptat legal pentru 125cc în România înainte de a schimba textul.

## Arhitectură

Site static HTML/CSS + JS minimal, fără framework și fără pas de build. Găzduit pe Cloudflare Pages (gratuit, HTTPS), cu domeniul legat prin DNS.

```
index.html                 RO — canonical https://scuterescu.ro/
en/index.html              EN — https://scuterescu.ro/en/
confidentialitate.html     Politică confidențialitate RO
en/privacy.html            Privacy policy EN
assets/css/style.css       un singur CSS
assets/js/main.js          meniu mobil, link-uri WhatsApp precompletate
assets/img/                imagini WebP optimizate, dimensiuni explicite
assets/fonts/              fonturi self-hosted (woff2)
robots.txt
sitemap.xml                ambele limbi, cu hreflang
llms.txt                   rezumat factual pentru LLM-uri (RO + EN)
favicon.svg, apple-touch-icon.png, og-image.jpg (1200×630)
```

Fără cookies și fără tracking la lansare, deci nu e nevoie de banner cookie. Harta Google se încarcă doar la click (facade: imagine statică + buton „Arată harta”), ca să evităm cookie-uri terțe și să păstrăm performanța.

## Structura paginii (identică RO/EN)

1. **Header fix:** logo text „Scuterescu”, meniu ancoră (Flotă · Prețuri · Condiții · Întrebări · Contact), comutator RO/EN, buton „Sună”. Pe mobil: meniu hamburger.
2. **Hero:** imagine mare cu scuter pe stradă. H1: „Închiriere scutere în Iași — de la 70 RON/zi”. Subtitlu: „SYM și Voge · RCA inclus · ridicare din Str. Al. O. Teodoreanu 49”. Butoane: **Sună** (`tel:+40756205206`) și **WhatsApp** (`https://wa.me/40756205206?text=...`).
3. **Avantaje (4 iconițe):** RCA inclus · Cască gratis la închirierea pe săptămână · Scutere noi, verificate · Fără birocrație.
4. **Flotă și prețuri:** 2 carduri (50cc, 125cc) cu poză, modele, preț pe zi și pe săptămână, garanție, permis și buton WhatsApp cu mesaj precompletat specific categoriei. Sub carduri: nota despre cască.
5. **Cum funcționează (3 pași):** Suni / scrii pe WhatsApp → vii cu buletinul și permisul → pleci.
6. **Condiții:** vârstă, acte, garanție, ce e inclus, program de ridicare/returnare.
7. **Întrebări frecvente:** 8–10 întrebări cu `<details>`/`<summary>`, marcate `FAQPage`.
8. **Contact și locație:** adresă, program, telefon, WhatsApp, hartă (facade).
9. **Footer:** „Scuterescu este un brand METZ CARS SRL · CUI RO42088025”, link-uri ANPC (https://anpc.ro) și SOL (https://ec.europa.eu/consumers/odr), politică de confidențialitate, © an.
10. **Bară fixă jos pe mobil:** Sună | WhatsApp.

### Stil vizual

Modern și luminos. Fundal alb/crem deschis, text închis, o singură culoare de accent energică (portocaliu), colțuri rotunjite, fonturi mari (sans-serif self-hosted), mult spațiu liber, poze mari. Mobile-first. Contrast conform WCAG AA.

### Mesaje WhatsApp precompletate

- General: „Bună! Aș dori să închiriez un scuter. Perioada: ...”
- 50cc: „Bună! Aș dori să închiriez un scuter 50cc (SYM Jet 4 RX). Perioada: ...”
- 125cc: „Bună! Aș dori să închiriez un scuter 125cc. Perioada: ...”
- Variantele EN sunt echivalente, în engleză.

Link-urile sunt scrise direct în HTML (`href` complet, URL-encoded), astfel încât funcționează și fără JS.

## SEO

- `<title>` RO: „Închiriere scutere Iași | 50cc și 125cc de la 70 RON/zi | Scuterescu”
- `<title>` EN: „Scooter Rental Iași | 50cc & 125cc from 70 RON/day | Scuterescu”
- Meta description cu preț, locație și CTA (≤ 160 caractere).
- `<link rel="canonical">`, `hreflang` ro / en / x-default (x-default → RO).
- `lang="ro"` / `lang="en"` pe `<html>`.
- Un singur H1, ierarhie H2/H3 corectă, text alternativ descriptiv la toate imaginile.
- Open Graph + Twitter Card cu `og-image.jpg`.
- Performanță: imagini WebP cu `width`/`height`, `loading="lazy"` sub fold, hero cu `fetchpriority="high"`, fonturi `font-display: swap` + preload. Țintă Lighthouse ≥ 95 la toate categoriile pe mobil.
- Date NAP (nume, adresă, telefon) identice peste tot: site, JSON-LD, Google Business Profile.

## AEO / AIO

- **JSON-LD** în fiecare pagină:
  - `AutoRental` (subtip `LocalBusiness`): name, url, telephone, address (`PostalAddress`), geo (coordonate pentru Str. Al. O. Teodoreanu 49, determinate la implementare), `openingHoursSpecification`, `priceRange` („70–350 RON”), `parentOrganization` (METZ CARS SRL, taxID RO42088025), `areaServed` Iași, `makesOffer`.
  - `Offer` / `UnitPriceSpecification` pentru fiecare categorie × perioadă (zi / săptămână), `priceCurrency: RON`.
  - `FAQPage` cu aceleași întrebări și răspunsuri vizibile pe pagină.
- **Răspunsuri FAQ „answer-first”:** prima propoziție conține faptul concret („Închirierea unui scuter 50cc în Iași costă 70 RON pe zi sau 300 RON pe săptămână.”).
- **`llms.txt`:** rezumat Markdown cu cine suntem, flotă, prețuri, condiții, program, contact și link-urile paginilor RO/EN.
- `robots.txt` permite toți crawlerii, inclusiv cei AI (GPTBot, PerplexityBot, Google-Extended, ClaudeBot), și indică sitemap-ul.

### Întrebări FAQ (RO; EN echivalent)

1. Cât costă să închiriez un scuter în Iași?
2. Ce permis îmi trebuie pentru un scuter de 50cc?
3. Ce permis îmi trebuie pentru un scuter de 125cc?
4. Cât este garanția?
5. Ce este inclus în preț?
6. Primesc cască?
7. Care este vârsta minimă?
8. Ce acte trebuie să am la mine?
9. Unde ridic și unde returnez scuterul și care este programul?
10. Cum rezerv un scuter?

## Imagini

Poze cu licență liberă de pe Unsplash/Pexels (scutere urbane, oraș, persoane pe scuter). Sursa și autorul fiecărei imagini se notează într-un comentariu HTML și în `assets/img/CREDITS.md`. Imaginile se convertesc în WebP, redimensionate (hero ~1600px, carduri ~800px). Pe cardurile de flotă, imaginile sunt generice („scuter 50cc”), fără să pretindă că arată exact modelul, până când proprietarul trimite poze reale cu flota. Recomandare: poze proprii cât mai repede, sunt mai bune pentru încredere și SEO.

## Out of scope (YAGNI)

- Sistem de rezervare, calendar, disponibilitate
- Formular de contact, backend, bază de date
- CMS / panou de administrare
- Analytics și cookies (se pot adăuga ulterior, cu banner de consimțământ)
- Limba franceză
- Blog

## Acțiuni pentru proprietar (în afara codului)

- Crearea și verificarea **Google Business Profile** cu aceleași date NAP.
- Verificarea regulii legale pentru 125cc și permis B.
- Confirmarea formei juridice (METZ CARS SRL).
- Configurarea DNS pentru scuterescu.ro către Cloudflare Pages.
- Poze reale cu flota, când sunt disponibile.
- Opțional: pagini Facebook/Instagram, adăugate apoi în `sameAs`.

## Testare și verificare

- Validare HTML (W3C validator sau `html-validate`).
- Validare JSON-LD: Schema Markup Validator + Google Rich Results Test (FAQ, LocalBusiness).
- Lighthouse pe mobil: ≥ 95 la Performance, Accessibility, Best Practices și SEO.
- Test vizual în browser la 375px, 768px și 1280px; fără scroll orizontal.
- Verificare manuală: link-urile `tel:` și `wa.me` (text corect encodat), comutator RO/EN, ancore meniu, `hreflang`, sitemap.
- Verificare consistență: prețurile și programul sunt identice în HTML vizibil, JSON-LD, FAQ și `llms.txt`, în ambele limbi.
