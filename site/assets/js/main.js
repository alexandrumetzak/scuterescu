// Mobile menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav-main');
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
}

// Google Map loads only on click (no third-party requests on page load)
document.querySelectorAll('.map-facade').forEach((button) => {
  button.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.src = button.dataset.src;
    iframe.title = button.dataset.title;
    iframe.className = 'map-frame';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    button.replaceWith(iframe);
  });
});

// Current year in footer
document.querySelectorAll('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});
