/* Parla Diş Kliniği — tasarım & geliştirme: DAB Labs */
(function () {
  'use strict';

  /* ---- AYARLAR ---- */
  var CONFIG = {
    // https://web3forms.com adresinden alınan anahtar. Boş bırakılırsa randevu
    // formu DEMO modunda çalışır: talep hiçbir yere gönderilmez, sadece başarı ekranı gösterilir.
    WEB3FORMS_KEY: '',
    WHATSAPP: '',            // örn: '905551234567' (boşsa WhatsApp butonu gizli kalır)
    TREATMENTS: ['Muayene', 'İmplant', 'Ortodonti', 'Diş Beyazlatma', 'Zirkonyum Kaplama', 'Kanal Tedavisi', 'Çocuk Diş Hekimliği'],
    SLOTS_WEEKDAY: ['09:30', '10:00', '11:00', '11:30', '13:00', '14:30', '15:00', '16:30', '17:30', '18:00'],
    SLOTS_SATURDAY: ['10:00', '11:00', '12:30', '13:30', '14:30', '15:00'],
    DAYS_SHOWN: 6
  };

  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* menü */
  var nav = $('#nav'), menu = $('#menu'), burger = $('.burger');
  var onScroll = function () { nav.classList.toggle('s', window.scrollY > 20); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var closeMenu = function () { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', function () {
    var o = menu.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false');
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });

  /* kaydırınca belirme */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, sib = $$('.rv', el.parentNode).indexOf(el);
        el.style.transitionDelay = Math.min(sib, 5) * 70 + 'ms';
        el.classList.add('in'); io.unobserve(el);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* sayaçlar */
  var fmt = function (n, d) { return n.toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d }); };
  var runCount = function (el) {
    var to = parseFloat(el.dataset.count), d = parseInt(el.dataset.decimals || '0', 10), suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = fmt(to, d) + suf; return; }
    var t0 = performance.now(), dur = 1600;
    var step = function (now) {
      var p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(to * e, d) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: .5 });
    counters.forEach(function (c) { cio.observe(c); });
  } else { counters.forEach(runCount); }

  /* yıl */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* WhatsApp */
  var wa = $('[data-wa]');
  if (wa && CONFIG.WHATSAPP) {
    wa.href = 'https://wa.me/' + CONFIG.WHATSAPP + '?text=' + encodeURIComponent('Merhaba, randevu almak istiyorum.');
    wa.hidden = false;
  }

  /* ---------------- ONLINE RANDEVU ---------------- */
  var DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  var DAYS_LONG = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

  // Sonraki açık günler (pazar kapalı)
  var openDays = function () {
    var out = [], d = new Date(); d.setHours(0, 0, 0, 0);
    while (out.length < CONFIG.DAYS_SHOWN) {
      if (d.getDay() !== 0 && slotsFor(d).some(function (s) { return !s.off; })) out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  };
  // Dolu saatleri tarihten türetilen sabit bir desenle gösterir (gerçek takvim bağlanana kadar örnek)
  var slotsFor = function (date) {
    var list = date.getDay() === 6 ? CONFIG.SLOTS_SATURDAY : CONFIG.SLOTS_WEEKDAY;
    var now = new Date(), seed = date.getDate() * 7 + date.getMonth() * 13;
    return list.map(function (t, i) {
      var hm = t.split(':'), dt = new Date(date); dt.setHours(+hm[0], +hm[1], 0, 0);
      var booked = ((seed + i * 5) % 4) === 0;
      return { time: t, off: booked || dt.getTime() < now.getTime() + 60 * 60 * 1000 };
    });
  };

  var modal = $('#randevu'), form = $('#randevu-form'), step = $('#m-step'), ok = $('#m-ok');
  var elTreat = $('#m-treat'), elDays = $('#m-days'), elSlots = $('#m-slots'), elMonth = $('#m-month'), err = $('#m-err'), submit = $('#m-submit');
  var state = { treat: 'Muayene', day: null, slot: null }, lastFocus = null, days = [];

  var pressBtn = function (cls, label, html, pressed, disabled) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.innerHTML = html;
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    if (label) b.setAttribute('aria-label', label);
    if (disabled) b.disabled = true;
    return b;
  };

  var renderTreat = function () {
    elTreat.innerHTML = '';
    CONFIG.TREATMENTS.forEach(function (t) {
      var b = pressBtn('opt', null, t, t === state.treat);
      b.addEventListener('click', function () { state.treat = t; renderTreat(); });
      elTreat.appendChild(b);
    });
  };
  var renderDays = function () {
    elDays.innerHTML = '';
    var months = [];
    days.forEach(function (d, i) {
      if (months.indexOf(MONTHS[d.getMonth()]) < 0) months.push(MONTHS[d.getMonth()]);
      var b = pressBtn('day', DAYS_LONG[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()], DAYS[d.getDay()] + '<b>' + d.getDate() + '</b>', i === state.day);
      b.addEventListener('click', function () { state.day = i; state.slot = null; renderDays(); renderSlots(); });
      elDays.appendChild(b);
    });
    elMonth.textContent = 'TARİH · ' + months.join(' / ').toLocaleUpperCase('tr-TR');
  };
  var renderSlots = function () {
    elSlots.innerHTML = '';
    if (state.day === null) return;
    slotsFor(days[state.day]).forEach(function (s) {
      var b = pressBtn('slot', s.off ? s.time + ' dolu' : null, s.time, s.time === state.slot, s.off);
      b.addEventListener('click', function () { state.slot = s.time; err.textContent = ''; renderSlots(); });
      elSlots.appendChild(b);
    });
  };

  // hero kartındaki "en yakın saat"
  (function () {
    var el = $('[data-next-slot]'); if (!el) return;
    var d = openDays()[0], free = slotsFor(d).filter(function (s) { return !s.off; })[0];
    if (free) el.textContent = (d.toDateString() === new Date().toDateString() ? '' : DAYS_LONG[d.getDay()] + ' ') + free.time;
  })();

  var openModal = function (treat) {
    lastFocus = document.activeElement;
    days = openDays();
    state = { treat: treat && CONFIG.TREATMENTS.indexOf(treat) > -1 ? treat : 'Muayene', day: 0, slot: null };
    step.hidden = false; ok.hidden = true; err.textContent = ''; form.reset();
    renderTreat(); renderDays(); renderSlots();
    modal.hidden = false; document.body.style.overflow = 'hidden';
    closeMenu();
    var first = $('.opt[aria-pressed="true"]', modal); if (first) first.focus();
  };
  var closeModal = function () {
    modal.hidden = true; document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  };

  $$('[data-randevu]').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-randevu')); });
  });
  modal.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Tab') { // odak pencere içinde kalsın
      var f = $$('button:not([disabled]),input:not(.hp)', modal).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ad = form.elements.ad.value.trim(), tel = form.elements.tel.value.replace(/\D/g, '');
    if (state.slot === null) { err.textContent = 'Lütfen bir saat seçin.'; return; }
    if (ad.length < 3) { err.textContent = 'Lütfen adınızı ve soyadınızı yazın.'; form.elements.ad.focus(); return; }
    if (!/^(90)?0?5\d{9}$/.test(tel)) { err.textContent = 'Lütfen geçerli bir cep telefonu numarası yazın.'; form.elements.tel.focus(); return; }
    if (form.elements.botcheck.checked) return;

    var d = days[state.day];
    var when = DAYS_LONG[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' · ' + state.slot;
    var done = function () {
      $('#m-summary').innerHTML = '';
      var b = document.createElement('b'); b.textContent = when;
      $('#m-summary').append(b, document.createElement('br'), document.createTextNode(state.treat + ' · ' + ad));
      step.hidden = true; ok.hidden = false;
      var c = $('[data-close]', ok); if (c) c.focus();
    };

    if (!CONFIG.WEB3FORMS_KEY) { done(); return; } // DEMO modu

    submit.disabled = true; submit.textContent = 'Gönderiliyor...';
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: CONFIG.WEB3FORMS_KEY,
        subject: 'Yeni online randevu talebi: ' + state.treat,
        from_name: 'Parla Diş Kliniği Web Sitesi',
        'Ad Soyad': ad, 'Telefon': tel, 'Tedavi': state.treat, 'Tarih ve saat': when
      })
    }).then(function (r) { return r.json(); })
      .then(function (res) { if (!res.success) throw new Error(res.message); done(); })
      .catch(function () { err.textContent = 'Bir sorun oluştu. Lütfen tekrar deneyin ya da bizi arayın: 0212 000 00 00'; })
      .then(function () { submit.disabled = false; submit.textContent = 'Randevuyu Onayla'; });
  });
})();
