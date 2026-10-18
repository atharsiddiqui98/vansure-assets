/* Vansure Learn + Community behaviour. Source: vansure-assets/learn-community/lc.js
   No personal data is ever sent to analytics. Works without JS: content stays readable. */
(function () {
  'use strict';
  var d = document, w = window;
  var RM = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PROD = /(^|\.)vansure\.ca$/.test(location.hostname);
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

  // ---------- analytics (never personal data; staging logs only) ----------
  function track(name, params) {
    params = params || {}; params.page_path = location.pathname;
    if (!PROD) { if (w.vlcDebug) console.log('[vlc ga4]', name, params); (w.vlcEvents = w.vlcEvents || []).push([name, params]); return; }
    if (typeof w.gtag === 'function') w.gtag('event', name, params);
  }
  w.vlcTrack = track;

  // ---------- sticky header offset ----------
  function setHeader() {
    var nav = $('.vs-nav-wrapper') || $('.w-nav');
    var h = 0;
    if (nav) { var cs = getComputedStyle(nav); if (cs.position === 'sticky' || cs.position === 'fixed') h = Math.round(nav.getBoundingClientRect().height); }
    $$('.vlc').forEach(function (el) { el.style.setProperty('--vlc-hdr', h + 'px'); });
  }

  // ---------- fade-in ----------
  function fades() {
    var els = $$('.vlc .vlc-fade');
    if (RM || !('IntersectionObserver' in w)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold: .1 });
    els.forEach(function (e) { io.observe(e); });
  }

  // ---------- article: table of contents ----------
  function slug(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60); }
  function toc() {
    var art = $('.vlc-article'); if (!art) return;
    var nav = $('.toc', art); if (!nav) return;
    var heads = $$('.body h2', art).filter(function (h) { return h.offsetParent !== null && h.textContent.trim(); });
    var qa = $('.qa', art);
    var items = [];
    if (qa) { qa.id = qa.id || 'quick-answer'; items.push({ el: qa, label: 'Quick answer' }); }
    heads.forEach(function (h) { if (!h.id) h.id = slug(h.textContent); items.push({ el: h, label: h.textContent.trim() }); });
    if (items.length < 3) { nav.style.display = 'none'; return; }
    var deskList = $('.toc-desk', nav), mobList = $('.list', nav), cur = $('.cur', nav), btn = $('.m', nav), bar = $('.bar', nav);
    function mk(list) { list.innerHTML = ''; items.forEach(function (it) { var a = d.createElement('a'); a.href = '#' + it.el.id; a.textContent = it.label; list.appendChild(a); }); }
    if (deskList) mk(deskList); if (mobList) mk(mobList);
    $$('a', nav).forEach(function (a, k) { if (k % items.length === 0) { a.classList.add('on'); a.setAttribute('aria-current', 'true'); } });
    function setOpen(open) { art.classList.toggle('tocopen', open); if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    if (btn) btn.addEventListener('click', function () { setOpen(!art.classList.contains('tocopen')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && art.classList.contains('tocopen')) { setOpen(false); btn && btn.focus(); } });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    var lastY = w.scrollY;
    w.addEventListener('scroll', function () {
      if (Math.abs(w.scrollY - lastY) > 40 && art.classList.contains('tocopen')) setOpen(false);
      lastY = w.scrollY;
      if (bar) { var r = art.getBoundingClientRect(); var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight))); bar.style.width = Math.round(p * 100) + '%'; }
    }, { passive: true });
    if ('IntersectionObserver' in w) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = e.target.id;
          $$('a', nav).forEach(function (a) { var on = a.getAttribute('href') === '#' + id; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
          var it = items.filter(function (x) { return x.el.id === id; })[0]; if (cur && it) cur.textContent = it.label;
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      items.forEach(function (it) { io.observe(it.el); });
    }
  }

  // ---------- article: FAQ accordion from rich text (h3 question + following paragraphs) ----------
  function faqs() {
    $$('.vlc-article .faqs-rt').forEach(function (rt, n) {
      var hs = $$('h3', rt); if (!hs.length) return;
      var wrap = d.createElement('div');
      hs.forEach(function (h, i) {
        var box = d.createElement('div'); box.className = 'faq';
        var b = d.createElement('button'); b.className = 'q'; b.type = 'button'; b.textContent = h.textContent; b.id = 'faq-q-' + n + '-' + i;
        var a = d.createElement('div'); a.className = 'a'; a.id = 'faq-a-' + n + '-' + i; a.setAttribute('role', 'region'); a.setAttribute('aria-labelledby', b.id);
        var el = h.nextElementSibling; while (el && el.tagName !== 'H3') { var nx = el.nextElementSibling; a.appendChild(el); el = nx; }
        b.setAttribute('aria-controls', a.id); b.setAttribute('aria-expanded', i === 0 ? 'true' : 'false'); a.hidden = i !== 0;
        b.addEventListener('click', function () { var o = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', o ? 'false' : 'true'); a.hidden = o; });
        var hh = d.createElement('h3'); hh.style.margin = '0'; hh.style.font = 'inherit'; hh.appendChild(b);
        box.appendChild(hh); box.appendChild(a); wrap.appendChild(box);
      });
      rt.innerHTML = ''; rt.appendChild(wrap);
    });
  }

  // ---------- Vee Explains tabs ----------
  function veeTabs() {
    $$('.vlc-learn [data-vlc-terms]').forEach(function (root) {
      var src = $$('[data-vlc-term]', root);
      var tabs = $('.tabs', root), panel = $('.def', root), cnt = $('.vlc-count', root);
      if (!src.length || !tabs || !panel) { root.closest('section') && (root.closest('section').style.display = src.length ? '' : 'none'); return; }
      var data = src.map(function (s) { return { term: s.getAttribute('data-vlc-term'), def: s.getAttribute('data-def'), seen: s.getAttribute('data-seen-title'), href: s.getAttribute('data-seen-href') }; });
      tabs.innerHTML = ''; tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'Insurance words');
      var idx = 0;
      function show(i, focus) {
        idx = (i + data.length) % data.length;
        $$('.tab', tabs).forEach(function (t, k) { var on = k === idx; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
        var x = data[idx];
        panel.innerHTML = '<b></b><p></p>' + (x.href ? '<a class="eg"></a>' : '');
        panel.querySelector('b').textContent = x.term; panel.querySelector('p').textContent = x.def;
        if (x.href) { var a = panel.querySelector('a'); a.href = x.href; a.textContent = 'Seen in: ' + x.seen + ' →'; }
        panel.setAttribute('aria-labelledby', 'vt-' + idx);
        if (cnt) cnt.textContent = (idx + 1) + ' of ' + data.length;
      }
      data.forEach(function (x, k) {
        var b = d.createElement('button'); b.type = 'button'; b.className = 'tab'; b.id = 'vt-' + k; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'vee-panel'); b.textContent = x.term;
        b.addEventListener('click', function () { show(k); track('vee_term_view', { term: x.term }); });
        b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); } if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); } if (e.key === 'Home') { e.preventDefault(); show(0, true); } if (e.key === 'End') { e.preventDefault(); show(data.length - 1, true); } });
        tabs.appendChild(b);
      });
      panel.id = 'vee-panel'; panel.setAttribute('role', 'tabpanel'); panel.tabIndex = 0;
      var prev = $('[data-vlc-prev]', root), next = $('[data-vlc-next]', root);
      if (data.length < 2) { tabs.hidden = true; prev && (prev.parentNode.style.display = 'none'); }
      prev && prev.addEventListener('click', function () { show(idx - 1); });
      next && next.addEventListener('click', function () { show(idx + 1); });
      show(0);
    });
  }

  // ---------- stories carousel controls ----------
  function stories() {
    $$('.vlc-comm .stories-more').forEach(function (root) {
      var track_ = $('.cards', root), items = $$('.w-dyn-item, .mini', track_).filter(function (x) { return !x.closest('.w-dyn-item') || x.classList.contains('w-dyn-item'); });
      var prev = $('[data-vlc-prev]', root), next = $('[data-vlc-next]', root), dots = $('.dots', root);
      if (!track_ || items.length < 2) return;
      if (dots) { dots.innerHTML = ''; items.forEach(function () { dots.appendChild(d.createElement('i')); }); }
      function step() { var it = items[0]; return it ? it.getBoundingClientRect().width + 14 : 300; }
      function upd() { var i = Math.round(track_.scrollLeft / step()); if (dots) $$('i', dots).forEach(function (x, k) { x.classList.toggle('on', k === i); }); }
      prev && prev.addEventListener('click', function () { track_.scrollBy({ left: -step(), behavior: RM ? 'auto' : 'smooth' }); });
      next && next.addEventListener('click', function () { track_.scrollBy({ left: step(), behavior: RM ? 'auto' : 'smooth' }); });
      track_.addEventListener('scroll', upd, { passive: true }); upd();
    });
  }

  // ---------- events: area + month filters, expiry backup ----------
  function events() {
    var root = $('.vlc-comm [data-vlc-events]'); if (!root) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var items = $$('[data-end]', root);
    items.forEach(function (it) { var end = new Date(it.getAttribute('data-end')); if (!isNaN(end) && end < today) it.closest('.w-dyn-item') ? it.closest('.w-dyn-item').remove() : it.remove(); });
    items = $$('[data-end]', root);
    var sec = root.closest('section');
    var zero = $('[data-vlc-events-zero]', sec), nomatch = $('[data-vlc-events-nomatch]', sec), list = $('[data-vlc-events-list]', sec), filters = $('.filters', sec);
    if (!items.length) { list && (list.hidden = true); filters && (filters.hidden = true); zero && (zero.hidden = false); return; }
    var monthSel = $('select.sel', sec);
    var months = {}; items.forEach(function (it) { months[it.getAttribute('data-month')] = it.getAttribute('data-month-label'); });
    if (monthSel) { monthSel.innerHTML = '<option value="">All months</option>'; Object.keys(months).sort().forEach(function (m) { var o = d.createElement('option'); o.value = m; o.textContent = months[m]; monthSel.appendChild(o); }); }
    var area = '', month = '';
    var live = $('[data-vlc-live]', sec);
    function apply() {
      var shown = 0;
      items.forEach(function (it) { var ok = (!area || it.getAttribute('data-area') === area) && (!month || it.getAttribute('data-month') === month); var host = it.closest('.w-dyn-item') || it; host.hidden = !ok; if (ok) shown++; });
      $$('[data-vlc-month-head]', sec).forEach(function (h) { h.hidden = true; });
      if (nomatch) { nomatch.hidden = shown > 0; var t = $('[data-vlc-nomatch-text]', nomatch); if (t) t.textContent = 'No upcoming events' + (area ? ' in ' + area : '') + (month ? ' for ' + months[month] : '') + '.'; }
      if (live) live.textContent = shown + (shown === 1 ? ' event' : ' events') + ' shown';
    }
    $$('.chip[data-area]', sec).forEach(function (c) {
      c.setAttribute('aria-pressed', c.getAttribute('data-area') === '' ? 'true' : 'false');
      c.addEventListener('click', function () { area = c.getAttribute('data-area'); $$('.chip[data-area]', sec).forEach(function (x) { x.setAttribute('aria-pressed', x === c ? 'true' : 'false'); }); apply(); track('community_event_filter', { area: area || 'all', month: month || 'all' }); });
    });
    monthSel && monthSel.addEventListener('change', function () { month = monthSel.value; apply(); track('community_event_filter', { area: area || 'all', month: month || 'all' }); });
    var reset = $('[data-vlc-events-reset]', sec); reset && reset.addEventListener('click', function () { area = ''; month = ''; monthSel && (monthSel.value = ''); $$('.chip[data-area]', sec).forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-area') === '' ? 'true' : 'false'); }); apply(); });
    $$('a[data-vlc-source]', sec).forEach(function (a) { a.addEventListener('click', function () { track('community_event_click', { source: a.getAttribute('data-vlc-source') }); }); });
    apply();
  }

  // ---------- resources accordion (mobile) ----------
  function resources() {
    $$('.vlc-comm .rc').forEach(function (rc, i) {
      var h = $('h3', rc), ul = $('ul', rc); if (!h || !ul) return;
      var b = d.createElement('button'); b.type = 'button'; b.textContent = h.textContent; ul.id = ul.id || 'res-' + i;
      b.setAttribute('aria-controls', ul.id);
      h.textContent = ''; h.appendChild(b);
      function sync() { var mob = w.innerWidth <= 760; var open = !mob || rc.classList.contains('open'); b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
      b.addEventListener('click', function () { if (w.innerWidth > 760) return; rc.classList.toggle('open'); sync(); });
      w.addEventListener('resize', sync); sync();
    });
    var more = $('.vlc-comm [data-vlc-allres]'), extra = $('.vlc-comm [data-vlc-extra-res]');
    if (more && extra) { more.setAttribute('aria-expanded', 'false'); more.setAttribute('aria-controls', extra.id || (extra.id = 'res-extra')); extra.hidden = true;
      more.addEventListener('click', function () { var o = !extra.hidden; extra.hidden = o; more.setAttribute('aria-expanded', o ? 'false' : 'true'); }); }
  }

  // ---------- Ask Vansure / Suggest an event / Nominate a business ----------
  var FORMS = {
    question: { topic: null, h: 'Have an insurance question? Ask privately.', msgLabel: 'Your question', msgHint: 'Please leave out policy numbers, health details, dates of birth and banking information.', btn: 'Send my question', consent: 'I agree that Vansure may use my name and email to reply to this question.', version: 'ask-question-v1' },
    event: { topic: 'Suggest an event', h: 'Suggest a local event', msgLabel: 'Tell us about the event', msgHint: 'Name, date, place and who runs it. We check every event with its organizer before listing it.', btn: 'Send the event', consent: 'I agree that Vansure may use my name and email to follow up about this event suggestion.', version: 'suggest-event-v1' },
    nomination: { topic: 'Nominate a business', h: 'Nominate a local business', msgLabel: 'Why should we feature them?', msgHint: 'We contact the business and only share their story with their permission.', btn: 'Send the nomination', consent: 'I agree that Vansure may use my name and email to follow up about this nomination.', version: 'nominate-business-v1' },
  };
  var RCHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function newRef() { var a = new Uint8Array(10); crypto.getRandomValues(a); var s = 'VQ-'; for (var i = 0; i < 10; i++) s += RCHARS[a[i] % 32]; return s; }
  function askForm() {
    var form = $('.vlc-comm form[data-vlc-ask]'); if (!form) return;
    var ep = form.getAttribute('data-endpoint'); var type = 'question', ref = newRef(), started = false, busy = false;
    var F = function (n) { return form.elements[n]; };
    var banner = $('.banner', form), btn = $('.fbtn', form), btnTxt = $('.fbtn-t', form), head = $('[data-vlc-form-h]');
    function setType(t, focus) {
      type = t; var c = FORMS[t];
      $$('.ftabs button', form).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-type') === t ? 'true' : 'false'); });
      if (head) head.textContent = c.h;
      $('[for=vlc-msg]', form).textContent = c.msgLabel; $('#vlc-msg-hint', form).textContent = c.msgHint;
      btnTxt.textContent = c.btn; $('#vlc-consent-text', form).textContent = c.consent + ' ';
      $('.f-topic', form).hidden = t !== 'question'; $('.f-biz', form).hidden = t !== 'nomination'; $('.f-link', form).hidden = t !== 'event';
      ref = newRef(); clearErrors(); banner.textContent = ''; banner.className = 'banner';
      if (focus) F('first_name').focus();
    }
    $$('.ftabs button', form).forEach(function (b) { b.addEventListener('click', function () { setType(b.getAttribute('data-type')); }); });
    $$('[data-vlc-form]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); setType(a.getAttribute('data-vlc-form'), false); var s = $('#ask'); s && s.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' }); setTimeout(function () { F('first_name').focus({ preventScroll: true }); }, RM ? 0 : 500); track('community_cta_click', { cta: a.getAttribute('data-vlc-form') }); }); });
    if (/[?&]form=(event|nomination)/.test(location.search)) setType(location.search.match(/form=(event|nomination)/)[1]);
    form.addEventListener('input', function () { if (!started) { started = true; track('ask_form_start', { form_type: type }); } });
    var MSG = { required: 'Please fill this in.', invalid: 'Please check this.', too_long: 'Please shorten this.' };
    var FIELDS = { first_name: 'Please enter your first name.', email: 'Please enter a full email address, like name@example.com.', message: 'Please add a few words.', topic: 'Please choose a topic.', consent: 'Please tick the box so we can reply.', business_name: 'Please enter the business name.', event_link: 'Please use a full link starting with https://' };
    function clearErrors() { $$('[aria-invalid]', form).forEach(function (x) { x.removeAttribute('aria-invalid'); }); $$('.ferr', form).forEach(function (x) { x.textContent = ''; }); }
    function err(name, text) { var el = F(name); if (!el) return; el.setAttribute('aria-invalid', 'true'); var e = $('#err-' + name, form); if (e) e.textContent = text || FIELDS[name]; }
    function check() {
      clearErrors(); var bad = [];
      var em = F('email').value.trim();
      if (!F('first_name').value.trim()) bad.push('first_name');
      if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(em)) bad.push('email');
      if (type === 'question' && !F('topic').value) bad.push('topic');
      if (type === 'nomination' && !F('business_name').value.trim()) bad.push('business_name');
      if (type === 'event' && F('event_link').value.trim() && !/^https:\/\//.test(F('event_link').value.trim())) bad.push('event_link');
      if (!F('message').value.trim()) bad.push('message');
      if (!F('consent').checked) bad.push('consent');
      bad.forEach(function (n) { err(n); });
      if (bad.length) { F(bad[0]).focus(); }
      return !bad.length;
    }
    var NOUN = { question: 'question', event: 'event suggestion', nomination: 'nomination' };
    function txt(state) { var n = NOUN[type];
      return state === 'confirmed' ? 'Thanks, we’ve received your ' + n + '. We’ll reply by email.' : state === 'failed' ? 'Sorry, we couldn’t submit your ' + n + '. Please try again.' : 'We’re checking whether your ' + n + ' was received. Please don’t submit it again yet.'; }
    function say(state, extra) {
      banner.className = 'banner ' + (state === 'confirmed' ? 'ok' : state === 'failed' ? 'bad' : 'pend');
      banner.textContent = extra || txt(state);
      banner.focus();
    }
    function done(state) {
      busy = false; btn.disabled = false; btn.removeAttribute('aria-busy');
      track('ask_form_result', { form_type: type, topic: type === 'question' ? F('topic').value : type, result: state });
      if (state === 'confirmed') { form.reset(); ref = newRef(); started = false; }
    }
    function poll(t0, n) {
      var wait = [3000, 5000, 8000, 12000, 15000, 20000][n] || 20000;
      if (Date.now() - t0 > 60000) { say('uncertain', 'We couldn’t confirm yet. Your reference is ' + ref + '. Please don’t send it again. If you don’t hear from us, contact us and mention this reference.'); done('uncertain'); return; }
      setTimeout(function () {
        fetch(ep + '?ref=' + encodeURIComponent(ref), { method: 'GET', credentials: 'omit', cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j.state === 'confirmed') { say('confirmed'); done('confirmed'); } else poll(t0, n + 1); })
          .catch(function () { poll(t0, n + 1); });
      }, wait);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return;
      if (!check()) return;
      if (!ep) { banner.className = 'banner pend'; banner.textContent = 'Preview only: sending is turned off on this copy of the page.'; banner.focus(); return; }
      busy = true; btn.disabled = true; btn.setAttribute('aria-busy', 'true'); banner.className = 'banner'; banner.textContent = '';
      var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
      var c = FORMS[type];
      var body = { reference: ref, form_type: type, topic: c.topic || F('topic').value, first_name: F('first_name').value.trim(), email: F('email').value.trim(),
        message: F('message').value.trim(), business_name: type === 'nomination' ? F('business_name').value.trim() : undefined, event_link: type === 'event' ? F('event_link').value.trim() : undefined,
        consent: F('consent').checked === true, consent_version: c.version, hp: F('company_site').value, turnstile_token: tokenEl ? tokenEl.value : '' };
      var ctl = new AbortController(); var to = setTimeout(function () { ctl.abort(); }, 15000);
      var headers = { 'Content-Type': 'application/json' }; if (w.vlcScenario) headers['x-test-scenario'] = w.vlcScenario;
      fetch(ep, { method: 'POST', headers: headers, body: JSON.stringify(body), credentials: 'omit', signal: ctl.signal })
        .then(function (r) { clearTimeout(to); return r.json().then(function (j) { return { code: r.status, j: j }; }, function () { return { code: r.status, j: {} }; }); })
        .then(function (res) {
          var st = res.j.state;
          if (res.code === 422 && res.j.errors) { res.j.errors.forEach(function (n) { err(n); }); F(res.j.errors[0]) && F(res.j.errors[0]).focus(); busy = false; btn.disabled = false; btn.removeAttribute('aria-busy'); return; }
          if (res.code === 429) { say('failed', 'You’ve sent several messages in a short time. Please wait a few minutes and try again.'); done('failed'); return; }
          if (st === 'confirmed') { say('confirmed'); done('confirmed'); return; }
          if (st === 'failed') { say('failed'); done('failed'); ref = newRef(); if (w.turnstile) try { w.turnstile.reset(); } catch (x) {} return; }
          say('uncertain'); poll(Date.now(), 0);
        })
        .catch(function () { clearTimeout(to); say('uncertain'); poll(Date.now(), 0); }); // network/timeout: never claim failure
    });
  }

  // ---------- Learn: analytics hooks + path/calculator clicks ----------
  function learnSearchBridge() {
    var hero = $('.vlc-learn form[data-vlc-hero-search]'), lib = $('.vlc-learn [data-vlc-search]'), sec = $('#insurance-guides');
    function go(focusLib) { if (sec) sec.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); if (focusLib && lib) setTimeout(function () { lib.focus({ preventScroll: true }); }, RM ? 0 : 450); }
    if (hero && lib) hero.addEventListener('submit', function (e) { e.preventDefault(); lib.value = $('input', hero).value; lib.dispatchEvent(new Event('input', { bubbles: true })); go(true); });
    $$('.vlc-learn [data-vlc-topic-link]').forEach(function (a) { a.addEventListener('click', function (e) {
      e.preventDefault(); var name = a.textContent.trim();
      $$('.vlc-learn input[fs-list-field=topic]').forEach(function (cb) { var want = cb.getAttribute('fs-list-value') === name; if (cb.checked !== want) { cb.checked = want; cb.dispatchEvent(new Event('input', { bubbles: true })); cb.dispatchEvent(new Event('change', { bubbles: true })); } cb.closest('.chip') && cb.closest('.chip').classList.toggle('is-on', want); });
      track('learn_filter', { filter: 'topic', value: name }); go(false); }); });
    $$('.vlc-learn input[fs-list-field=topic]').forEach(function (cb) { cb.addEventListener('change', function () { cb.closest('.chip') && cb.closest('.chip').classList.toggle('is-on', cb.checked); }); });
    var clr = $('.vlc-learn [fs-list-element=clear]'); clr && clr.addEventListener('click', function () { $$('.vlc-learn .chip.is-on').forEach(function (c) { c.classList.remove('is-on'); }); });
  }
  function learnTracking() {
    var s = $('.vlc-learn input[type=search]');
    if (s) { var t; s.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { var rc = $('.vlc-learn [fs-list-element=results-count]'); var n = rc ? parseInt(rc.textContent, 10) || 0 : 0; if (s.value.trim()) track('learn_search', { result_count: n }); }, 1200); }); }
    $$('.vlc-learn [data-vlc-filter]').forEach(function (b) { b.addEventListener('click', function () { track('learn_filter', { filter: b.getAttribute('data-vlc-filter'), value: b.textContent.trim() }); }); });
    $$('.vlc [data-vlc-calc]').forEach(function (a) { a.addEventListener('click', function () { track('guide_calculator_click', { tool_name: a.getAttribute('data-vlc-calc') }); }); });
    $$('.vlc [data-vlc-path]').forEach(function (a) { a.addEventListener('click', function () { track('path_start', { path_slug: a.getAttribute('data-vlc-path') }); }); });
    var g = $('.vlc-article[data-guide]'); if (g) track('guide_view', { guide_slug: g.getAttribute('data-guide'), topic: g.getAttribute('data-topic') || '' });
    $$('.vlc [data-vlc-cta]').forEach(function (a) { a.addEventListener('click', function () { track('learn_cta_click', { cta_location: a.getAttribute('data-vlc-cta') }); }); });
  }

  ready(function () {
    if (!$('.vlc')) return;
    setHeader(); w.addEventListener('resize', setHeader);
    try { faqs(); } catch (e) {}
    try { toc(); } catch (e) {}
    try { veeTabs(); } catch (e) {}
    try { stories(); } catch (e) {}
    try { events(); } catch (e) {}
    try { resources(); } catch (e) {}
    try { askForm(); } catch (e) {}
    try { learnSearchBridge(); } catch (e) {}
    try { learnTracking(); } catch (e) {}
    fades();
  });
})();
