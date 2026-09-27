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
