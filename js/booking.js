/* =====================================================
   TÁROVAÉ: Booking modal (4-step flow)
   Service → Your Details → Select Slot → Consent → Success (4 steps, no membership step)
   Opens from every "Book Appointment" button on the site.
   ===================================================== */
(() => {
  'use strict';

  /* ---------- SETTINGS (edit here) ---------- */
  const CONFIG = {
    // Set this to a URL (Formspree, your API, Google Apps Script …) to receive bookings as JSON via POST.
    // While empty, the success screen gives the customer a "Send on WhatsApp" button instead.
    endpoint: '',
    // WhatsApp number and automatic alerts are set once for the whole site in js/main.js (TAROVAE_NOTIFY)
    whatsapp: (window.TAROVAE_NOTIFY && window.TAROVAE_NOTIFY.whatsapp) || '918160440298',
    salonName: 'TÁROVAÉ',
  };

  // Categories and services. Prices are in rupees. Edit freely.
  const CATEGORIES = {
    hair:   { label: 'Hair',   items: [['Hair & Styling', 799], ['Haircut', 1000], ['Beard', 800], ['Clean Shave', 700], ['Styling', 500], ['Shampoo & Conditioning', 800], ['Hair Spa', 1500], ['Keratin Treatment', 5000], ['Hair Colour', 3500], ['Keratin', 5000], ['Botox', 6000], ['Smoothening', 5000], ['Kera Smooth', 7000], ['Perming', 5000]] },
    skin:   { label: 'Skin',   items: [['Face Treatment', 2000], ['Microneedling', 2000], ['Dermaplaning', 2000], ['Radio Frequency (RF)', 2000]] },
    nails:  { label: 'Nails',  items: [['Classic Manicure & Pedicure', 1500], ['Premium Manicure & Pedicure', 2000], ['Luxury Manicure & Pedicure', 3000], ['Classic Manicure', 800], ['Pedicure', 1000], ['Gel Polish', 1200], ['Nail Extensions', 2500]] },
    brows:  { label: 'Brows',  items: [['Brow Shaping', 300], ['Brow Tint', 400], ['Brow Lamination', 1500]] },
    body:   { label: 'Body',   items: [['Body Massage', 1500], ['Body Polishing', 2500], ['Back Cleanup', 1200]] },
  };
  const SLOTS = ['09:00 - 10:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00', '21:00 - 22:00'];
  const CONSENTS = [
    'I have no known allergies to any hair, skin or beauty products.',
    'I understand patch testing may be required for certain services.',
    'I agree to TÁROVAÉ’s cancellation and rescheduling policy.',
    'I agree to the use of my personal information as per the Privacy Policy.',
  ];
  const STEP_NAMES = ['Service', 'Your Details', 'Select Slot', 'Consent'];
  const DONE = 5; // success screen

  /* ---------- helpers ---------- */
  const rupee = n => '₹' + Number(n).toLocaleString('en-IN');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ordinal = d => d + (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SPARK = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c.8 7.2 4.8 11.2 12 12-7.2.8-11.2 4.8-12 12-.8-7.2-4.8-11.2-12-12C7.2 11.2 11.2 7.2 12 0z"/></svg>';
  const CHECK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.2 8.6l3 3 6.4-6.8"/></svg>';
  const CHEV = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>';

  const days = () => [0, 1, 2].map(i => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return { i, date: d, label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Next Day (${ordinal(d.getDate())} ${MONTHS[d.getMonth()]})`, text: `${ordinal(d.getDate())} ${MONTHS[d.getMonth()]}` };
  });
  const slotOpen = (dayIdx, slot) => {
    if (dayIdx !== 0) return true;
    const now = new Date(); const start = parseInt(slot.slice(0, 2), 10) * 60 + parseInt(slot.slice(3, 5), 10);
    return start > now.getHours() * 60 + now.getMinutes();
  };
  const firstOpenDay = () => (SLOTS.some(s => slotOpen(0, s)) ? 0 : 1);

  /* ---------- state ---------- */
  const fresh = () => ({ step: 1, cat: 'hair', service: 'Hair & Styling', price: 799, name: '', email: '', phone: '', day: firstOpenDay(), slot: null, consent: [false, false, false, false], result: null });
  let S = fresh();
  let opener = null;

  /* ---------- markup ---------- */
  const root = document.createElement('div');
  root.className = 'bk'; root.id = 'bookingModal'; root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="bk-backdrop" data-bk-close></div>
    <div class="bk-dialog" role="dialog" aria-modal="true" aria-labelledby="bkTitle">
      <header class="bk-head">
        <h2 class="bk-title" id="bkTitle">Book Your<br>Appointment ${SPARK}</h2>
        <span class="bk-spark s" style="left:193px;top:60px;width:6px;height:6px">${SPARK}</span><span class="bk-spark s" style="left:197px;top:85px;width:5px;height:5px">${SPARK}</span>
        <p class="bk-sub">Choose your preferred service, expert and<br class="bk-br"> time. We’ll take care of the rest.</p>
        <div class="bk-art" aria-hidden="true"><img src="assets/images/booking-arch.png" alt="" width="190" height="160">
          <span class="bk-spark" style="left:33px;top:42px;width:7px;height:7px">${SPARK}</span>
          <span class="bk-spark" style="left:147px;top:13px;width:7px;height:7px">${SPARK}</span>
          <span class="bk-spark" style="left:150px;top:45px;width:6px;height:6px">${SPARK}</span>
        </div>
        <button class="bk-x" type="button" data-bk-close aria-label="Close booking"></button>
      </header>
      <ol class="bk-steps" id="bkSteps" aria-label="Booking progress"></ol>
      <div class="bk-box" id="bkBox" aria-live="polite"></div>
      <div class="bk-actions"><button type="button" class="bk-btn bk-btn--ghost" id="bkBack"></button><button type="button" class="bk-btn bk-btn--primary" id="bkNext"></button></div>
      <div class="bk-pad"></div>
    </div>`;
  document.body.appendChild(root);
  const $ = s => root.querySelector(s);
  const box = $('#bkBox'), back = $('#bkBack'), next = $('#bkNext'), stepsEl = $('#bkSteps'), dialog = $('.bk-dialog');

  // stepper skeleton
  stepsEl.innerHTML = STEP_NAMES.map((n, i) => `${i ? '<li class="bk-line" aria-hidden="true"></li>' : ''}<li class="bk-step" data-i="${i + 1}"><span class="bk-dot">${i + 1}${CHECK}</span><span class="bk-label">${n}</span></li>`).join('');

  /* ---------- rendering ---------- */
  const catIcon = (k, on) => `assets/icons/cat-${k}${on ? '-white' : ''}.svg`;

  function paintStepper() {
    const cur = S.result ? DONE : S.step;
    stepsEl.querySelectorAll('.bk-step').forEach(li => {
      const i = +li.dataset.i; li.classList.toggle('done', i <= cur);
      li.setAttribute('aria-current', i === S.step && !S.result ? 'step' : 'false');
    });
    stepsEl.querySelectorAll('.bk-line').forEach((ln, idx) => {
      const i = idx + 1; // line between step i and i+1
      ln.classList.toggle('done', S.result ? true : i < S.step);
    });
  }

  function valid() {
    if (S.step === 1) return true;
    if (S.step === 2) return S.name.trim().length > 1 && S.phone.replace(/\D/g, '').length >= 10 && (!S.email || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(S.email.trim()));
    if (S.step === 3) return S.slot !== null;
    if (S.step === 4) return S.consent.every(Boolean);
    return true;
  }
  function paintButtons() {
    next.disabled = !valid();
    if (S.step === DONE) return;
  }

  function stepHTML() {
    const cat = CATEGORIES[S.cat];
    if (S.step === 1) return `<div class="bk-pane">
      <h3 class="bk-eyebrow">Choose a service category</h3>
      <div class="bk-cats" role="radiogroup" aria-label="Service category">${Object.entries(CATEGORIES).map(([k, c]) => `<button type="button" class="bk-cat" role="radio" aria-checked="${k === S.cat}" data-cat="${k}"><img src="${catIcon(k, k === S.cat)}" alt="" width="24" height="24"><span>${c.label}</span></button>`).join('')}</div>
      <div class="bk-service"><span class="bk-lbl" id="bkSvcLbl">Service</span>
        <div class="bk-select" id="bkSelect"><button type="button" class="bk-select-btn" id="bkSelBtn" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="bkSvcLbl bkSelBtn"><span>${esc(S.service)}</span><span class="pr">${rupee(S.price)}</span>${CHEV}</button>
          <ul class="bk-list" role="listbox" aria-labelledby="bkSvcLbl" tabindex="-1">${cat.items.map(([n, p]) => `<li role="option" data-n="${esc(n)}" data-p="${p}" aria-selected="${n === S.service}"><span>${esc(n)}</span><b>${rupee(p)}</b></li>`).join('')}</ul></div></div></div>`;
    if (S.step === 2) return `<div class="bk-pane"><div class="bk-grid2">
      <label class="bk-field" data-f="name"><span class="bk-lbl">Full Name*</span><input class="bk-in" name="name" type="text" autocomplete="name" placeholder="eg. Aman Gupta" value="${esc(S.name)}"><span class="bk-err">Please enter your full name.</span></label>
      <label class="bk-field" data-f="email"><span class="bk-lbl">Enter Your Email</span><input class="bk-in" name="email" type="email" autocomplete="email" placeholder="eg. aman.gupta@gmail.com" value="${esc(S.email)}"><span class="bk-err">Please enter a valid email.</span></label>
      <label class="bk-field full bk-row2" data-f="phone"><span class="bk-lbl">WhatsApp Number*</span><input class="bk-in" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="eg. +91 8934234322" value="${esc(S.phone)}"><span class="bk-err">Please enter a valid WhatsApp number.</span></label>
      <p class="bk-note full bk-help">Will send appointment confirmation message on this number</p></div></div>`;
    if (S.step === 3) {
      const ds = days(); const anyToday = SLOTS.some(s => slotOpen(0, s));
      return `<div class="bk-pane"><h3 class="bk-h">Select Preferred Day &amp; Time</h3>
      <div class="bk-days" role="radiogroup" aria-label="Day">${ds.map(d => `<button type="button" class="bk-day" role="radio" aria-checked="${d.i === S.day}" data-day="${d.i}" ${d.i === 0 && !anyToday ? 'disabled style="opacity:.45;cursor:not-allowed"' : ''}>${d.label}</button>`).join('')}</div>
      <h3 class="bk-slot-h">Select Time Slot</h3>
      <div class="bk-slots" role="group" aria-label="Time slots">${SLOTS.map(s => `<button type="button" class="bk-slot" data-slot="${s}" aria-pressed="${S.slot === s}" ${slotOpen(S.day, s) ? '' : 'disabled'}>${s}</button>`).join('')}</div></div>`;
    }
    if (S.step === 4) return `<div class="bk-pane"><h3 class="bk-h">Give Your Consent</h3>
      <p class="bk-sub2">For your safety and comfort, please review and confirm the following.</p>
      <ul class="bk-consents">${CONSENTS.map((t, i) => `<li><label class="bk-consent"><input type="checkbox" data-c="${i}" ${S.consent[i] ? 'checked' : ''}><span class="bk-cb">${CHECK}</span><span>${esc(t)}</span></label></li>`).join('')}</ul></div>`;
    // success
    const d = days()[S.day];
    const sent = live();
    return `<div class="bk-pane bk-done"><div class="big">${CHECK}</div><h3>${sent ? 'Booking Request Sent' : 'Your Booking Request is Ready'}</h3>
      <p class="msg">${sent ? 'Thank you! We will confirm your slot on your WhatsApp number shortly.' : 'Tap “Send on WhatsApp” to share it with us and confirm your slot.'}</p>
      <ul class="bk-sum"><li><span>Service</span><b>${esc(S.service)} · ${rupee(S.price)}</b></li><li><span>Date &amp; time</span><b>${d.text}, ${S.slot}</b></li><li><span>Name</span><b>${esc(S.name)}</b></li><li><span>WhatsApp</span><b>${esc(S.phone)}</b></li></ul></div>`;
  }

  function render(focus = true) {
    S.step = Math.min(S.step, DONE);
    root.classList.toggle('is-select', S.step === 1);
    box.innerHTML = stepHTML();
    paintStepper();
    // buttons
    back.style.display = '';
    if (S.step === 1) { back.textContent = 'Close'; next.textContent = 'Book Appointment'; }
    else if (S.step === 4) { back.textContent = 'Go Back'; next.textContent = 'Confirm Booking'; }
    else if (S.step === DONE) { back.textContent = 'Done'; next.textContent = live() ? 'Close' : 'Send on WhatsApp'; if (live()) next.style.display = 'none'; else next.style.display = ''; }
    else { back.textContent = 'Go Back'; next.textContent = 'Proceed'; }
    if (S.step !== DONE) next.style.display = '';
    next.disabled = !valid();
    if (focus) { const t = box.querySelector('.bk-in') || box.querySelector('.bk-pane'); if (t) { t.setAttribute('tabindex', t.matches('.bk-pane') ? '-1' : '0'); if (!matchMedia('(max-width:600px)').matches || S.step !== 2) t.focus({ preventScroll: true }); } }
    dialog.scrollTop = 0;
  }
  const live = () => !!(S.result && S.result.sent);

  /* ---------- open / close ---------- */
  function open(ctx) {
    if (ctx) {
      if (ctx.category && CATEGORIES[ctx.category]) S.cat = ctx.category;
      if (ctx.service) {
        let found = null, foundCat = null;
        for (const [k, c] of Object.entries(CATEGORIES)) { const it = c.items.find(i => i[0].toLowerCase() === ctx.service.toLowerCase()); if (it) { found = it; foundCat = k; break; } }
        if (found) { S.cat = foundCat; S.service = found[0]; S.price = ctx.price || found[1]; }
        else { CATEGORIES[S.cat].items.unshift([ctx.service, ctx.price || 0]); S.service = ctx.service; S.price = ctx.price || 0; }
      } else if (ctx.category) { const it = CATEGORIES[S.cat].items[0]; S.service = it[0]; S.price = it[1]; }
    }
    if (S.result) S = Object.assign(fresh(), { name: S.name, email: S.email, phone: S.phone });
    S.step = 1; S.day = S.slot ? S.day : firstOpenDay();
    opener = document.activeElement;
    render(false);
    root.classList.add('open'); root.setAttribute('aria-hidden', 'false'); document.documentElement.classList.add('bk-lock');
    setTimeout(() => dialog.focus({ preventScroll: true }), 50); dialog.setAttribute('tabindex', '-1');
  }
  function close() {
    if (!root.classList.contains('open')) return;
    root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); document.documentElement.classList.remove('bk-lock');
    if (S.result) S = fresh();
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  /* ---------- submit ---------- */
  async function submit() {
    const d = days()[S.day];
    const payload = { service: S.service, category: CATEGORIES[S.cat].label, price: S.price, name: S.name.trim(), email: S.email.trim(), whatsapp: S.phone.trim(), date: d.text, time: S.slot, consent: true, source: location.pathname.split('/').pop() || 'index.html' };
    next.disabled = true; const prev = next.textContent; next.textContent = 'Booking…';
    try {
      if (CONFIG.endpoint) {
        const res = await fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('bad response');
      }
      // WhatsApp alert to the salon (automatic when the CallMeBot key is set in js/main.js)
      const alert = `New booking from the ${CONFIG.salonName} website\n\nService: ${payload.service} (${rupee(payload.price)})\nDate: ${payload.date}\nTime: ${payload.time}\nName: ${payload.name}\nWhatsApp: ${payload.whatsapp}${payload.email ? '\nEmail: ' + payload.email : ''}`;
      const sent = window.tarovaeNotify ? await window.tarovaeNotify(alert) : false;
      S.result = { payload, sent }; S.step = DONE; render();
    } catch (e) {
      next.textContent = prev; next.disabled = false;
      const m = document.createElement('p'); m.className = 'bk-err'; m.style.cssText = 'display:block;text-align:center;margin:10px 24px 0'; m.textContent = 'Sorry, we could not complete the booking. Please try again or call +91 7600310169.';
      dialog.querySelector('.bk-actions').after(m); setTimeout(() => m.remove(), 6000);
    }
  }
  function whatsappLink() {
    const p = S.result.payload;
    const msg = `Hello ${CONFIG.salonName}, I would like to book an appointment.\n\nService: ${p.service} (${rupee(p.price)})\nDate: ${p.date}\nTime: ${p.time}\nName: ${p.name}\nWhatsApp: ${p.whatsapp}${p.email ? '\nEmail: ' + p.email : ''}`;
    return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  /* ---------- events ---------- */
  back.addEventListener('click', () => {
    if (S.step === 1 || S.step === DONE) return close();
    S.step -= 1; render();
  });
  next.addEventListener('click', () => {
    if (next.disabled) return;
    if (S.step === DONE) { if (!live()) window.open(whatsappLink(), '_blank', 'noopener'); return; }
    if (S.step === 4) return submit();
    S.step += 1; render();
  });
  root.addEventListener('click', e => { if (e.target.closest('[data-bk-close]')) close(); });
  document.addEventListener('keydown', e => {
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') { const sel = root.querySelector('.bk-select.open'); if (sel) { sel.classList.remove('open'); sel.querySelector('.bk-select-btn').setAttribute('aria-expanded', 'false'); } else close(); }
    if (e.key === 'Tab') {
      const f = [...dialog.querySelectorAll('button:not([disabled]):not([hidden]), input, [tabindex="0"], li[role=option]')].filter(el => el.offsetParent !== null && !el.matches('li'));
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // delegated events inside the box
  box.addEventListener('click', e => {
    const cat = e.target.closest('[data-cat]');
    if (cat) { S.cat = cat.dataset.cat; const it = CATEGORIES[S.cat].items[0]; S.service = it[0]; S.price = it[1]; render(false); box.querySelector(`[data-cat="${S.cat}"]`).focus({ preventScroll: true }); return; }
    const selBtn = e.target.closest('#bkSelBtn');
    if (selBtn) { const w = selBtn.parentElement; const o = !w.classList.contains('open'); w.classList.toggle('open', o); selBtn.setAttribute('aria-expanded', o); return; }
    const opt = e.target.closest('li[role=option]');
    if (opt) { S.service = opt.dataset.n; S.price = +opt.dataset.p; render(false); box.querySelector('#bkSelBtn').focus({ preventScroll: true }); return; }
    const day = e.target.closest('[data-day]');
    if (day) { S.day = +day.dataset.day; if (S.slot && !slotOpen(S.day, S.slot)) S.slot = null; S.slot = null; render(false); next.disabled = !valid(); return; }
    const slot = e.target.closest('[data-slot]');
    if (slot && !slot.disabled) { S.slot = slot.dataset.slot; box.querySelectorAll('.bk-slot').forEach(b => b.setAttribute('aria-pressed', b === slot)); paintButtons(); return; }
  });
  document.addEventListener('click', e => { const w = root.querySelector('.bk-select.open'); if (w && !w.contains(e.target)) { w.classList.remove('open'); w.querySelector('.bk-select-btn').setAttribute('aria-expanded', 'false'); } });
  box.addEventListener('change', e => { const c = e.target.closest('[data-c]'); if (c) { S.consent[+c.dataset.c] = c.checked; paintButtons(); } });
  box.addEventListener('input', e => {
    const el = e.target.closest('.bk-in'); if (!el) return;
    S[el.name] = el.value; const f = el.closest('.bk-field'); if (f.classList.contains('invalid')) validateField(el); paintButtons();
  });
  box.addEventListener('focusout', e => { const el = e.target.closest('.bk-in'); if (el) validateField(el); }, true);
  box.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.matches('.bk-in')) { e.preventDefault(); if (!next.disabled) next.click(); }
    const o = e.target.closest('#bkSelBtn'); if (o && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); o.parentElement.classList.add('open'); o.setAttribute('aria-expanded', 'true'); const li = box.querySelectorAll('li[role=option]'); li[0] && li[0].focus && (li[0].tabIndex = 0, li[0].focus()); }
    if (e.target.matches('li[role=option]')) {
      const li = [...box.querySelectorAll('li[role=option]')]; const i = li.indexOf(e.target);
      if (e.key === 'ArrowDown') { e.preventDefault(); const n = li[Math.min(i + 1, li.length - 1)]; n.tabIndex = 0; n.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); const n = li[Math.max(i - 1, 0)]; n.tabIndex = 0; n.focus(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.target.click(); }
    }
  });
  function validateField(el) {
    const f = el.closest('.bk-field'); let ok = true; const v = el.value.trim();
    if (el.name === 'name') ok = v.length > 1;
    if (el.name === 'phone') ok = v.replace(/\D/g, '').length >= 10;
    if (el.name === 'email') ok = !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    f.classList.toggle('invalid', !ok && (v.length > 0 || el.name !== 'email'));
    if (!ok && v.length === 0 && el.name !== 'email') f.classList.remove('invalid'); // don't nag on empty-untouched
  }

  /* ---------- triggers: every "Book Appointment" button on the site ---------- */
  const BOOK_RE = /^(book\s+(an\s+)?appointment(\s+now)?|book\s+now)$/i;
  document.addEventListener('click', e => {
    const t = e.target.closest('a, button');
    if (!t || t.closest('.bk') || t.closest('.f-submit') || t.type === 'submit') return;
    const text = t.textContent.replace(/\s+/g, ' ').trim();
    if (!BOOK_RE.test(text) && !t.hasAttribute('data-book')) return;
    e.preventDefault();
    let ctx = null;
    const card = t.closest('.card, .s-card');
    if (card) {
      const h = card.querySelector('h3'); const pr = card.querySelector('.card-foot span');
      const grid = card.closest('[data-bk-cat]');
      const lab = card.closest('.s-panel') && card.closest('.s-panel').querySelector('.s-label');
      const label = grid ? grid.dataset.bkCat : lab ? lab.textContent.trim().toLowerCase() : (card.closest('.panel') ? 'skin' : '');
      const num = pr && pr.textContent.match(/\d[\d,]*/); // first price (also for ranges and "Starting from")
      const price = num ? parseInt(num[0].replace(/,/g, ''), 10) : 0;
      const cat = CATEGORIES[label] ? label : (card.closest('.panel') ? ({ 'panel-nails': 'nails', 'panel-makeup': 'brows', 'panel-hair': 'hair', 'panel-skin': 'skin' }[card.closest('.panel').id] || 'skin') : undefined);
      if (h) ctx = { service: card.dataset.bkService || h.textContent.trim(), price, category: cat };
    }
    open(ctx);
  });

  window.TarovaeBooking = { open, close, config: CONFIG };
})();
