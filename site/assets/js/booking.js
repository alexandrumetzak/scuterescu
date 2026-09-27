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
  const startInput = $('[name="start"]');
  const endInput = $('[name="end"]');
  const today = new Date().toISOString().slice(0, 10);
  startInput.min = today;
  endInput.min = today;

  // The user's own phone-holder choice, tracked separately from the checkbox's
  // displayed state so that an auto-check at 7+ days doesn't stick once the
  // period shortens back below 7 days.
  let phoneHolderChosen = phoneHolderBox.checked;
  phoneHolderBox.addEventListener('change', () => {
    if (!phoneHolderBox.disabled) phoneHolderChosen = phoneHolderBox.checked;
  });

  const values = () => ({
    category: $('[name="category"]:checked').value,
    start: startInput.value,
    end: endInput.value,
    pickupTime: $('[name="pickupTime"]').value,
    returnTime: $('[name="returnTime"]').value,
    extraHelmet: $('[name="extraHelmet"]').checked,
    phoneHolder: phoneHolderChosen,
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
      phoneHolderBox.checked = phoneHolderChosen;
      return;
    }
    const q = quote({ category: v.category, days, extraHelmet: v.extraHelmet, phoneHolder: v.phoneHolder });
    if (q.phoneHolderIncluded) {
      phoneHolderBox.checked = true;
      phoneHolderBox.disabled = true;
    } else {
      phoneHolderBox.disabled = false;
      phoneHolderBox.checked = phoneHolderChosen;
    }
    const extras = [];
    if (v.extraHelmet) extras.push(`${T.helmet} (+${EXTRAS.helmet} RON)`);
    if (q.phoneHolderIncluded) extras.push(`${T.phoneHolder} (${T.included})`);
    else if (v.phoneHolder) extras.push(`${T.phoneHolder} (+${EXTRAS.phoneHolder} RON)`);
    out.period.textContent = T.days(days);
    out.rate.textContent = `${q.rate} ${T.perDay} (${tierLabel(lang, q.tier.id)})`;
    out.extras.textContent = extras.length ? extras.join(', ') : T.none;
    out.total.textContent = `${q.total} RON`;
  };

  const clearFieldError = (input) => {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
  };
  const markFieldError = (input) => {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', 'booking-error');
  };

  form.addEventListener('input', () => {
    out.error.textContent = '';
    clearFieldError(startInput);
    clearFieldError(endInput);
    render();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = values();
    const error = validate(v);
    out.error.textContent = error;
    clearFieldError(startInput);
    clearFieldError(endInput);
    if (error) {
      let focusTarget;
      if (!v.start) { markFieldError(startInput); focusTarget = startInput; }
      if (!v.end) { markFieldError(endInput); focusTarget = focusTarget || endInput; }
      if (v.start && v.end) {
        const field = v.start < today ? startInput : endInput;
        markFieldError(field);
        focusTarget = field;
      }
      focusTarget.focus();
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
