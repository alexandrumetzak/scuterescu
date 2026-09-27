import assert from 'node:assert/strict';
import { FACTS } from './facts.mjs';
import { read, jsonLd, text, hrefs } from './helpers.mjs';
import { buildPackageMessage, waLink } from '../site/assets/js/pricing.js';

// Shared assertions for the RO and EN home pages.
export function checkHomePage(t, { file, lang, canonical, alternate, waLinks, faqCount, bookingId }) {
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
    const prices = [...new Set(Object.values(FACTS.tiers).flatMap((x) => [x['50'], x['125']]))];
    for (const s of [FACTS.phoneDisplay, FACTS.street, FACTS.cui, FACTS.company, ...FACTS.models,
      ...prices.map((p) => `${p} RON`), `${FACTS.deposits['50']} RON`, `${FACTS.deposits['125']} RON`,
      `${FACTS.extras.helmet} RON`, `${FACTS.extras.phoneHolder} RON`, '09:00', '12:00', '19:00']) {
      assert.ok(body.includes(s), `page text missing "${s}"`);
    }
    assert.ok(!/ş|ţ|Ş|Ţ/.test(html), 'cedilla diacritics found; use ș ț');
    assert.ok(!/cameră de bord|camera de bord|dashcam|dash cam/i.test(body), 'dashcam claim must not appear');
    for (const old of ['70 RON', '80 RON/zi', '80 RON/day']) assert.ok(!body.includes(old), `old price "${old}" still on page`);
  });

  t.test('call and whatsapp links', () => {
    assert.ok(links.filter((h) => h === `tel:${FACTS.phoneE164}`).length >= 3, 'tel links in header, hero, mobile bar');
    for (const wa of waLinks) assert.ok(links.includes(wa), `missing ${wa}`);
    for (const tierId of Object.keys(FACTS.tiers)) {
      const link = waLink(buildPackageMessage(lang, tierId));
      assert.ok(links.includes(link), `missing package link for ${tierId}`);
    }
  });

  t.test('no third-party resources on load', () => {
    const loads = [...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*(?:src|href)="(https?:[^"]+|\/\/[^"]+)"/g)]
      .map((m) => m[0])
      .filter((tag) => !/rel="(canonical|alternate)"/.test(tag));
    assert.deepEqual(loads, []);
    assert.ok(!html.includes('<iframe'), 'map must load on click only');
  });

  t.test('no root-relative references (GitHub Pages sub-path)', () => {
    for (const attr of ['src="/', 'href="/', 'srcset="/', 'imagesrcset="/']) {
      assert.ok(!html.includes(attr), `root-relative reference found: ${attr}`);
    }
  });

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
    for (const o of biz.makesOffer) assert.equal(o.priceSpecification.priceCurrency, 'RON');
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
