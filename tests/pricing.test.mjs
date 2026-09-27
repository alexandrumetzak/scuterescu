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

test('invalid input fails with a clear RangeError', () => {
  assert.throws(() => quote({ category: '50', days: 0 }), RangeError);
  assert.throws(() => quote({ category: '50', days: null }), RangeError);
  assert.throws(() => quote({ category: '250', days: 3 }), RangeError);
  assert.throws(() => buildBookingMessage('ro', { category: '50', start: '2026-07-08', end: '2026-07-01' }), RangeError);
});
