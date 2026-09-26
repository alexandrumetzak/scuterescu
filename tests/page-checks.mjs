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
