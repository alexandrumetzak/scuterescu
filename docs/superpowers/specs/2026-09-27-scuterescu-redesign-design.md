# Scuterescu.ro — Redesign și rezervare prin WhatsApp

Data: 2026-09-27. Extinde `2026-09-26-scuterescu-site-design.md`. Unde cele două diferă, acest document are prioritate.

## Scop

Aducem site-ul la designul proprietarului (temă închisă la culoare, logo nou, poza cu Palatul Culturii), trecem la tarife pe trepte de durată și adăugăm un formular de rezervare care **nu trimite nimic la un server**: construiește un mesaj WhatsApp cu detaliile și deschide `wa.me`. Fără verificarea disponibilității, fără backend, fără reCAPTCHA, fără costuri.

## Date business (înlocuiesc prețurile și flota din spec-ul inițial)

### Tarife (RON pe zi, în funcție de durata închirierii)

| Durată | 50cc | 125cc |
|---|---|---|
| 1–2 zile | 90 | 100 |
| 3–6 zile | 79 | 89 |
| 7+ zile | 45 | 50 |

- Cardul 7+ zile are eticheta „Cel mai avantajos” și nota „Economisești 50% față de tariful zilnic” (45/90 și 50/100).
- Hero: 50cc „de la 45 RON/zi”, 125cc „de la 50 RON/zi”.
- **Inclus la toate tarifele:** cască, asigurare RCA, sistem antifurt. La 7+ zile e inclus și suportul de telefon.
- **Opțiuni suplimentare (pentru toată perioada):** cască suplimentară 20 RON; suport telefon 10 RON (gratuit la 7+ zile).
- **Garanție returnabilă la predare:** 300 RON (50cc), 350 RON (125cc). Nu intră în total.
- **Calcul total:** `zile × tariful treptei + 20 (dacă cască suplimentară) + 10 (dacă suport telefon și zile < 7)`. Zile = diferența în zile calendaristice dintre data de predare și data de ridicare, minimum 1 (ex. 15–19 iunie = 4 zile). Exemplu: 125cc, 4 zile, ambele opțiuni = 4 × 89 + 20 + 10 = 386 RON.

### Flotă

- **50cc — SYM Jet 4 RX:** permis categoria AM sau B; consum redus ~2,2 L/100 km; ideal pentru trafic urban și livrări; faruri full LED și priză USB.
- **125cc — Voge SR125 ADV** (disponibil și **SYM Jet 4 RX 125**): permis A1, A sau B (minim 24 de ani și curs) — confirmat de proprietar; motor 125cc răcit cu lichid și ABS față-spate; parbriz înalt reglabil; suspensie ADV cu amortizoare duble pe gaz. **Nu** menționăm camera de bord.

### Promisiuni confirmate de proprietar

Asistență rutieră 24/7, kilometri nelimitați, sistem antifurt, modele 2024+. Reformulate: „pleci rapid” (nu „în 5 minute”); „Discounturi pentru perioade lungi” (nu „Rezervare garantată”).

Restul datelor (telefon, adresă, program, firmă, CUI, vârstă minimă 18 ani) rămân neschimbate.

## Design vizual

- Temă închisă: fundal `#111113`, secțiuni alternate `#18181B`, carduri semi-transparente (`rgb(255 255 255 / .04)`, bordură `rgb(255 255 255 / .10)`, `backdrop-filter: blur`), text `#F5F5F4`, text secundar `#A8A29E`.
- Accent portocaliu `#F97316` (titluri cu punct portocaliu „Scuterescu.”, borduri, glow, iconițe). Butoane pline `#C2410C` cu text alb (contrast AA); buton WhatsApp secundar cu contur.
- Logo: refăcut ca SVG (iconiță scuter line-art + „Scuterescu.” cu „S” și punctul portocalii), variantă pentru fundal închis. Favicon/apple-touch-icon derivate din iconiță + S.
- Hero: poza proprietarului (scutere + Palatul Culturii) pe toată lățimea; pe desktop, card „glass” în stânga cu H1, două mini-carduri 50cc/125cc și butoanele „Rezervă scuter” (ancoră la rezervare) + „WhatsApp”. Pe mobil: poza sus, conținutul dedesubt (ca acum).
- Imagini flotă: decupate din macheta proprietarului până vin poze mai bune.

## Structura paginii (RO și EN identice)

1. Header: logo, Flotă · Prețuri · Rezervare · Contact, RO/EN, buton Sună; meniu hamburger pe mobil.
2. Hero (vezi mai sus).
3. De ce Scuterescu: Zero costuri ascunse (RCA, asistență rutieră 24/7, km nelimitați) · Discounturi pentru perioade lungi (de la 45 RON/zi la 7+ zile; ideal pentru navetă și curierat) · Flotă modernă și verificată (SYM și Voge, modele 2024+, sistem antifurt) · Fără birocrație (suni sau scrii pe WhatsApp, prezinți actele și pleci rapid).
4. Flota: 2 carduri cu poză, dotări și buton „Alege 50cc/125cc” (ancoră la rezervare; cu JS preselectează scuterul).
5. Tarife: 3 carduri de treaptă + garanție + opțiuni. Butonul „Rezervă” al fiecărui card e un link `wa.me` static (funcționează fără JS) cu mesajul pachetului.
6. Rezervare (3 pași numerotați 1/3, 2/3, 3/3): perioada (dată ridicare, dată predare, ore opționale), scuterul (50cc / 125cc), opțiunile (cască suplimentară, suport telefon — bifat și dezactivat la 7+ zile cu eticheta „inclus”), plus nume opțional. Rezumat live: zile, scuter, tarif/zi, opțiuni, total estimat, garanție. Buton „Trimite rezervarea pe WhatsApp” deschide `wa.me` cu mesajul complet. Text: „Rezervarea se confirmă pe WhatsApp, în funcție de disponibilitate.” Validare: ambele date completate, predarea nu înaintea ridicării, ridicarea nu în trecut; erori afișate lângă câmp, accesibile (`aria-live`). Fără JS: se afișează un link WhatsApp generic.
7. Cum funcționează (3 pași), Condiții, Întrebări frecvente (actualizate), Contact și locație, Footer — ca acum, cu datele noi.
8. Bara fixă pe mobil: Sună | WhatsApp.

## Arhitectură

- `site/assets/js/pricing.js` — modul ES pur, fără DOM: tarife, calculul zilelor, treapta, totalul, mesajele WhatsApp (RO/EN) și link-ul `wa.me`. Testat direct în Node.
- `site/assets/js/booking.js` — modul ES care leagă formularul de `pricing.js` (încărcat cu `<script type="module">`).
- `site/assets/js/main.js` — rămâne (meniu, hartă, an).
- Date structurate: `AutoRental` cu câte o `Offer` per categorie × treaptă (6), `UnitPriceSpecification` pe zi cu `eligibleQuantity` (min/max zile); `priceRange` „45–100 RON/zi”. FAQ, `llms.txt` și ambele pagini folosesc aceleași cifre, verificate de teste față de `tests/facts.mjs`.
- Găzduire neschimbată: GitHub Pages, căi relative.

## Out of scope

Disponibilitate în timp real, plăți online, trimiterea formularului la server, reCAPTCHA, cont client.

## Testare

- Teste unitare pentru `pricing.js` (trepte la limite 1/2/3/6/7 zile, zile minime, opțiuni, suport gratuit la 7+, mesaje RO/EN, encodare link).
- Testele de pagină verifică prețurile noi în text, JSON-LD (6 oferte), FAQ, link-urile pachetelor (generate cu aceleași funcții din `pricing.js`), absența camerei de bord, căi relative, fără resurse terțe.
- html-validate, Lighthouse mobil ≥ 95 (contrast în tema închisă), verificare vizuală 375/1280 și verificare manuală a formularului.
