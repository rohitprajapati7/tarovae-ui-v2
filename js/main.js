// =====================================================
// WHATSAPP NOTIFICATIONS for every form (booking popup + contact form)
//   numbers : the salon numbers that receive the alerts (country code + number, no + or spaces).
//   key     : CallMeBot API key of THAT number. Each number gets its own key (see README).
//             With a key, the alert reaches that number automatically after every submit.
//   While no key is set, the form opens WhatsApp on the visitor's phone with the message
//   ready for the FIRST number, and the visitor taps Send.
// =====================================================
window.TAROVAE_NOTIFY = {
  numbers: [
    { phone: '918160440298', key: '' },
    { phone: '918780715510', key: '' },
  ],
};
window.TAROVAE_NOTIFY.whatsapp = window.TAROVAE_NOTIFY.numbers[0].phone;
window.tarovaeAuto = () => window.TAROVAE_NOTIFY.numbers.some(n => n.key);
// Sends text to every number that has a key. Returns true when at least one was sent automatically.
window.tarovaeNotify = async text => {
  const list = window.TAROVAE_NOTIFY.numbers.filter(n => n.key);
  if (!list.length) return false;
  const res = await Promise.all(list.map(n => fetch('https://api.callmebot.com/whatsapp.php?phone=' + n.phone + '&text=' + encodeURIComponent(text) + '&apikey=' + encodeURIComponent(n.key), { mode: 'no-cors' }).then(() => true, () => false)));
  return res.some(Boolean);
};
window.tarovaeWaLink = text => 'https://wa.me/' + window.TAROVAE_NOTIFY.whatsapp + '?text=' + encodeURIComponent(text);

// Full-screen menu (drawer)
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const drawer = document.getElementById('drawer');
const drawerClose = document.getElementById('drawerClose');
function openMenu() {
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true');
  setTimeout(() => drawerClose.focus(), 60);
}
function closeMenu(returnFocus = true) {
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false');
  if (returnFocus) burger.focus();
}
burger.addEventListener('click', openMenu);
drawerClose.addEventListener('click', () => closeMenu());
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMenu();
  if (e.key === 'Tab' && drawer.classList.contains('open')) {
    const f = [...drawer.querySelectorAll('a, button')]; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', e => { if (e.matches) closeMenu(false); });

// Tabs (works for every tablist on any page, no reload)
document.querySelectorAll('[role="tablist"]').forEach(list => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = tab => tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).classList.toggle('active', on);
  });
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); select(next);
    });
  });
});

// Active nav item follows scroll (home page only; other pages keep their own active link)
if (!document.body.classList.contains('page-services')) {
  const links = [...nav.querySelectorAll('a')].filter(a => a.getAttribute('href').startsWith('#'));
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  const spy = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) links.forEach((a, i) => a.classList.toggle('active', sections[i] === e.target));
  }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => s && spy.observe(s));
}

// Scroll reveal
const io = new IntersectionObserver(entries => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .05, rootMargin: '0px 0px -5% 0px' });
document.querySelectorAll('.reveal, .zoom').forEach(el => io.observe(el));


// FAQ accordion (one open per panel)
document.querySelectorAll('.faq-q').forEach(btn => btn.addEventListener('click', () => {
  const item = btn.closest('.faq-item');
  const open = !item.classList.contains('open');
  item.closest('.faq-panel').querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open'); i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (open) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
}));

// Team slider: drag with mouse, native swipe on touch
const track = document.getElementById('teamTrack');
if (track) {
  let down = false, startX = 0, startLeft = 0, moved = false;
  track.addEventListener('mousedown', e => { down = true; moved = false; startX = e.pageX; startLeft = track.scrollLeft; track.classList.add('dragging'); });
  window.addEventListener('mouseup', () => { down = false; track.classList.remove('dragging'); });
  track.addEventListener('mousemove', e => { if (!down) return; const dx = e.pageX - startX; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = startLeft - dx; });
  track.addEventListener('click', e => { if (moved) { e.preventDefault(); moved = false; } }, true);
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') track.scrollBy({ left: 414, behavior: 'smooth' });
    if (e.key === 'ArrowLeft') track.scrollBy({ left: -414, behavior: 'smooth' });
  });
}

// Contact form: validation + submit
// Contact form: validates, then sends the enquiry to the salon's WhatsApp (see TAROVAE_NOTIFY above).
// Optional: set data-endpoint on the <form> (Formspree / your own API) to also receive it there.
const form = document.getElementById('contactForm');
if (form) {
  const status = document.getElementById('formStatus');
  const validators = {
    first_name: v => v.trim().length > 1,
    last_name: v => v.trim().length > 0,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    phone: v => v.replace(/\D/g, '').length >= 7,
    message: v => v.trim().length > 4,
  };
  const check = el => {
    const rule = validators[el.name]; if (!rule) return true;
    const ok = rule(el.value); el.closest('.f-field').classList.toggle('invalid', !ok); return ok;
  };
  form.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('blur', () => check(el));
    el.addEventListener('input', () => { if (el.closest('.f-field').classList.contains('invalid')) check(el); });
  });
  form.addEventListener('submit', async e => {
    e.preventDefault(); status.textContent = '';
    const fields = [...form.elements].filter(el => el.name);
    const bad = fields.filter(el => !check(el));
    if (bad.length) { bad[0].focus(); status.textContent = 'Please fill in the highlighted fields.'; return; }
    const data = Object.fromEntries(fields.map(el => [el.name, el.value.trim()]));
    const text = 'New enquiry from the TÁROVAÉ website\n\n' +
      'Name: ' + data.first_name + ' ' + data.last_name + '\n' +
      'Phone: ' + data.phone + '\n' +
      'Email: ' + data.email + '\n' +
      'Reason: ' + data.reason + '\n' +
      (data.location ? 'Location: ' + data.location + '\n' : '') +
      'Message: ' + data.message;
    const auto = window.tarovaeAuto();
    // without the automatic key, open WhatsApp right away (must happen inside the click, before any wait)
    const waWin = auto ? null : window.open(window.tarovaeWaLink(text), '_blank');
    if (waWin) waWin.opener = null;
    const btn = form.querySelector('.f-submit'); btn.disabled = true;
    try {
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Request failed');
      }
      if (auto) {
        await window.tarovaeNotify(text);
        form.reset(); status.textContent = 'Thank you! Your message has been sent. We will get back to you shortly.';
      } else {
        if (!waWin) window.location.href = window.tarovaeWaLink(text);
        form.reset(); status.textContent = 'WhatsApp is opening with your message. Tap Send to share it with us.';
      }
    } catch (err) { status.textContent = 'Sorry, something went wrong. Please call us on +91 7600310169.'; }
    btn.disabled = false;
  });
}

// Services page: "View More" opens the extra section of the active tab smoothly, "View Less" closes it
const moreBtn = document.getElementById('sMore');
if (moreBtn) {
  const moreWrap = document.getElementById('sMoreWrap');
  const activeExtra = () => document.querySelector('.s-panel.active .s-extra');
  const setExtra = (x, open) => { x.classList.toggle('open', open); x.inert = !open; };
  const setBtn = open => { moreBtn.textContent = open ? 'View Less' : 'View More'; moreBtn.setAttribute('aria-expanded', String(open)); };
  const sync = () => {
    document.querySelectorAll('.s-extra').forEach(x => { if (!x.closest('.s-panel.active')) setExtra(x, false); });
    const x = activeExtra();
    moreWrap.hidden = !x;
    document.querySelectorAll('[data-for]').forEach(n => { n.hidden = !document.getElementById(n.dataset.for).classList.contains('active'); });
    if (x) { moreBtn.setAttribute('aria-controls', x.id); setBtn(x.classList.contains('open')); }
  };
  moreBtn.addEventListener('click', () => {
    const x = activeExtra(); if (!x) return;
    const open = !x.classList.contains('open');
    if (!open) {
      // keep the button in view while the section closes
      const target = x.getBoundingClientRect().top + window.scrollY + 170 - window.innerHeight * 0.8;
      if (window.scrollY > target) window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
    setExtra(x, open); setBtn(open);
  });
  document.querySelectorAll('.s-tab').forEach(t => {
    t.addEventListener('click', () => setTimeout(sync));
    t.addEventListener('keydown', () => setTimeout(sync));
  });
  sync();
}
