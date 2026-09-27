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
