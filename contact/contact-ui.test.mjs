// Behaviour test of the new Contact embed in jsdom: real embed HTML + script, mocked server, Turnstile and clock.
// Needs jsdom: npm i --no-save jsdom@24, then node contact/contact-ui.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');
const EMBED = readFileSync(new URL('./contact-embed-v2.html', import.meta.url), 'utf8');

function page(server, { token = 'tok-1' } = {}) {
  const posts = [], gets = [];
  const pre = `<script>(function(){var real=Date.now.bind(Date),start=real(),speed=1000;Date.now=function(){return start+(real()-start)*speed};
    var st=window.setTimeout;window.setTimeout=function(f,ms){return st(f,(ms||0)/speed)};})();</script>`;
  const dom = new JSDOM(`<!doctype html><html><body>${pre}${EMBED}</body></html>`, { runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(win) {
      let n = 0; win.__resets = 0;
      win.turnstile = { reset() { win.__resets++; const i = win.document.querySelector('[name="cf-turnstile-response"]'); if (i) i.value = 'tok-' + (++n + 1); }, isExpired() { return false; } };
      win.fetch = (url, opts = {}) => {
        if ((opts.method || 'GET') === 'POST') { const b = JSON.parse(opts.body); posts.push(b); return server.post(b, posts.length, opts.signal); }
        gets.push(url); return server.get(url, gets.length);
      };
      win.crypto = globalThis.crypto;
    } });
  const w = dom.window, d = w.document;
  // Turnstile's widget puts its token in a hidden input inside the container.
  const ts = d.querySelector('.cf-turnstile'); const inp = d.createElement('input'); inp.type = 'hidden'; inp.name = 'cf-turnstile-response'; inp.value = token; ts.appendChild(inp);
  const $ = (id) => d.getElementById(id);
  const fill = (v = {}) => { const f = { 'vcf-first': 'Jane', 'vcf-last': 'Smith', 'vcf-email': 'jane@example.com', 'vcf-phone': '604 000 0000', 'vcf-message': 'Term life please', ...v }; for (const k in f) $(k).value = f[k]; $('vcf-product').value = v.product ?? 'Life'; };
  const send = () => d.getElementById('vsContactForm').dispatchEvent(new w.Event('submit', { cancelable: true, bubbles: true }));
  const view = () => ({ success: $('vsContactSuccess').style.display === 'block', formShown: $('vsContactForm').style.display !== 'none', status: $('vsContactStatus').hidden ? '' : $('vsContactStatus').textContent,
    bad: $('vsContactStatus').classList.contains('is-bad'), btn: d.querySelector('.vs-form-submit').textContent.trim(), disabled: d.querySelector('.vs-form-submit').disabled,
    invalid: [...d.querySelectorAll('[aria-invalid="true"]')].map((x) => x.id), values: ['vcf-first', 'vcf-last', 'vcf-email', 'vcf-phone', 'vcf-message'].map((k) => $(k).value) });
  return { w, d, $, fill, send, view, posts, gets, resets: () => w.__resets };
}
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const json = (code, j) => Promise.resolve({ status: code, json: async () => j });
const FAILED = 'We couldn’t confirm your message was received. Please try again or contact us directly.';
const results = [];
const ok = (name) => { results.push(name); };

// 1. Valid submission → "Message sent!" only after the server confirms.
{ const p = page({ post: (b) => json(200, { state: 'confirmed', reference: b.reference }) });
  p.fill(); p.send();
  const mid = p.view(); assert.equal(mid.btn, 'Sending your message…'); assert.equal(mid.disabled, true); assert.equal(mid.success, false);
  await tick();
  const v = p.view(); assert.equal(v.success, true); assert.equal(v.formShown, false);
  assert.equal(p.d.querySelector('#vsContactSuccess h3').textContent, 'Message sent!'); assert.equal(p.d.querySelector('#vsContactSuccess p').textContent, 'We’ll be in touch soon.');
  const b = p.posts[0];
  assert.deepEqual(Object.keys(b).sort(), ['email', 'first_name', 'form_type', 'hp', 'last_name', 'message', 'phone', 'product', 'reference', 'turnstile_token']);
  assert.equal(b.form_type, 'contact'); assert.match(b.reference, /^VQ-[A-HJ-NP-Z2-9]{10}$/); assert.equal(b.product, 'Life'); assert.equal(b.turnstile_token, 'tok-1'); assert.equal(b.hp, '');
  assert.equal(p.resets(), 1, 'fresh spam check after the send');
  ok('valid submission: pending text, then confirmed success; correct payload'); }

// 2. Invalid email and 3. missing required field → validation errors, nothing sent.
{ const p = page({ post: () => { throw new Error('must not send'); } });
  p.fill({ 'vcf-email': 'jane@' }); p.send(); await tick();
  let v = p.view(); assert.deepEqual(v.invalid, ['vcf-email']); assert.match(v.status, /email address/); assert.equal(p.posts.length, 0);
  p.fill({ 'vcf-last': '' }); p.send(); await tick();
  v = p.view(); assert.deepEqual(v.invalid, ['vcf-last']); assert.match(v.status, /last name/); assert.equal(p.posts.length, 0);
  p.fill({ 'vcf-first': '', 'vcf-email': '' }); p.send(); await tick();
  v = p.view(); assert.deepEqual(v.invalid.sort(), ['vcf-email', 'vcf-first']); assert.equal(p.d.activeElement.id, 'vcf-first');
  p.fill({ 'vcf-phone': 'call me' }); p.send(); await tick(); assert.deepEqual(p.view().invalid, ['vcf-phone']);
  ok('invalid email / missing fields / bad phone: inline errors, nothing sent'); }

// 4. Double-click → one submission.
{ let release; const p = page({ post: () => new Promise((r) => { release = () => r({ status: 200, json: async () => ({ state: 'confirmed' }) }); }) });
  p.fill(); p.send(); p.send(); p.send(); await tick(); assert.equal(p.posts.length, 1); release(); await tick(); assert.equal(p.view().success, true);
  ok('double-click: one request'); }

// 5. Network timeout → unknown status, never success or failure; status checks by reference; data kept.
{ const p = page({ post: (b, n, signal) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('aborted')))),
    get: () => json(404, { state: 'unknown' }) });
  p.fill(); p.send(); await tick(60);                       // 15 s timeout (scaled) fires
  let v = p.view(); assert.match(v.status, /checking whether your message arrived/); assert.equal(v.success, false); assert.equal(v.bad, false);
  await tick(200);                                          // 60 s of status checks (scaled)
  v = p.view(); const ref = p.posts[0].reference;
  assert.ok(p.gets.length >= 4 && p.gets.every((u) => u.endsWith('?ref=' + ref)), 'status checks use the same reference');
  assert.match(v.status, new RegExp('couldn’t confirm yet.*' + ref)); assert.equal(v.success, false); assert.equal(v.disabled, false);
  assert.deepEqual(v.values, ['Jane', 'Smith', 'jane@example.com', '604 000 0000', 'Term life please'], 'entered details kept');
  ok('network timeout: "checking", status polling by reference, then unknown with reference; details kept'); }

// 5b. Resend after unknown keeps the same reference (the server then returns the existing result, no duplicate).
{ let n = 0; const p = page({ post: (b, i, signal) => (i === 1 ? new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('x')))) : json(200, { state: 'confirmed' })),
    get: () => json(404, { state: 'unknown' }) });
  p.fill(); p.send(); await tick(260); p.send(); await tick();
  assert.equal(p.posts[1].reference, p.posts[0].reference, 'same reference on resend'); assert.notEqual(p.posts[1].turnstile_token, p.posts[0].turnstile_token, 'fresh token');
  assert.equal(p.view().success, true);
  ok('resend after unknown: same reference, fresh spam token'); }

// 5c. Connection lost but the server did create the lead → status check finds it → success.
{ const p = page({ post: () => Promise.reject(new TypeError('Failed to fetch')), get: () => json(200, { state: 'confirmed' }) });
  p.fill(); p.send(); await tick(80); assert.equal(p.view().success, true);
  ok('lost response, lead created: status check confirms success'); }

// 6. Zoho rejects → confirmed failure message, details kept, next try gets a new reference.
{ const p = page({ post: (b, i) => json(200, i === 1 ? { state: 'failed', reference: b.reference } : { state: 'confirmed' }) });
  p.fill(); p.send(); await tick();
  const v = p.view(); assert.equal(v.status, FAILED); assert.equal(v.bad, true); assert.equal(v.success, false); assert.equal(v.btn, 'Send Message');
  assert.deepEqual(v.values, ['Jane', 'Smith', 'jane@example.com', '604 000 0000', 'Term life please']);
  p.send(); await tick(); assert.notEqual(p.posts[1].reference, p.posts[0].reference); assert.equal(p.view().success, true);
  ok('Zoho rejects: exact failure message, details kept, retry with a new reference'); }

// 7. Spam check fails (403) → rejected with the failure message, details kept.
{ const p = page({ post: () => json(403, { state: 'failed', errors: ['bot'] }) });
  p.fill(); p.send(); await tick(); const v = p.view(); assert.equal(v.status, FAILED); assert.equal(v.success, false); assert.equal(v.values[0], 'Jane');
  ok('spam check failure: rejected, no success'); }

// 8. Server-side validation (422) → fields marked, spam token kept for the corrected send.
{ const p = page({ post: () => json(422, { state: 'failed', errors: ['email', 'last_name'] }) });
  p.fill(); p.send(); await tick(); const v = p.view(); assert.deepEqual(v.invalid.sort(), ['vcf-email', 'vcf-last']); assert.equal(p.resets(), 0);
  ok('server validation error: fields marked, token not wasted'); }

// 9. Rate limited (429).
{ const p = page({ post: () => json(429, { state: 'failed', errors: ['rate'] }) });
  p.fill(); p.send(); await tick(); assert.match(p.view().status, /several messages in a short time/); assert.equal(p.view().success, false);
  ok('rate limited: clear message, no success'); }

// 10. Spam check not ready (empty token) → waits, sends nothing.
{ const p = page({ post: () => { throw new Error('must not send'); } }, { token: '' });
  p.fill(); p.send(); await tick(); assert.match(p.view().status, /quick spam check/); assert.equal(p.posts.length, 0);
  ok('empty spam token: held back, nothing sent'); }

// 11. Server accepted but Zoho unsure (202) → checking, then confirmed by status check.
{ const p = page({ post: (b) => json(202, { state: 'uncertain', reference: b.reference }), get: (u, i) => json(200, { state: i < 2 ? 'uncertain' : 'confirmed' }) });
  p.fill(); p.send(); await tick(5); assert.match(p.view().status, /checking/); await tick(100); assert.equal(p.view().success, true);
  ok('uncertain then confirmed by status check'); }

// 12. Status check reports failure → failure message (not unknown).
{ const p = page({ post: (b) => json(202, { state: 'uncertain' }), get: () => json(200, { state: 'failed' }) });
  p.fill(); p.send(); await tick(80); assert.equal(p.view().status, FAILED);
  ok('uncertain then failed: failure message'); }

console.log(results.map((r, i) => `${i + 1}. PASS ${r}`).join('\n'));
console.log(`\n${results.length} Contact UI scenarios passed`);
