// Price-drop alert emails: who gets one, when, and what happens on failure. Fake database and mailer, no network.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { checkAlerts, buildEmail, money } = require(path.join(__dirname, '..', 'importer', 'alerts.js'));
const { createResendMailer } = require(path.join(__dirname, '..', 'importer', 'mailer.js'));

const RATES = { USD: 1, SAR: 3.75, AED: 3.6725, GBP: 0.79 };
const row = (o = {}) => Object.assign({ alert_id: 1, user_id: 'u1', email: 'sara@example.com', lang: 'en', product_id: 'iphone-17-pro', name_en: 'Apple iPhone 17 Pro 256GB', name_ar: 'آبل آيفون 17 برو',
  target_price: 3500, currency: 'SAR', notify_email: true, consent_at: '2026-10-01T10:00:00Z', triggered_at: null, market: 'sa', market_currency: 'SAR', lowest: 3400 }, o);
function rig(rows) {
  const sent = [], marks = [];
  const db = { getRates: async () => RATES, getAlertCandidates: async () => rows, markAlert: async (id, v) => { marks.push([id, v]); } };
  const mailer = { send: async m => { sent.push(m); } };
  return { db, mailer, sent, marks };
}
const run = (r, extra = {}) => checkAlerts(Object.assign({ db: r.db, mailer: r.mailer, siteUrl: 'https://doabno.example' }, extra));

test('target reached: one email with the product, price and links, then the alert is marked', async () => {
  const r = rig([row()]);
  const res = await run(r);
  assert.equal(res.sent, 1); assert.equal(r.sent.length, 1);
  const m = r.sent[0];
  assert.equal(m.to, 'sara@example.com'); assert.match(m.subject, /Apple iPhone 17 Pro 256GB dropped to SAR 3,400\.00/);
  assert.match(m.text, /https:\/\/doabno\.example\/#\/p\/iphone-17-pro/); assert.match(m.text, /#\/alerts/);
  assert.equal(r.marks.length, 1); assert.equal(r.marks[0][0], 1); assert.match(r.marks[0][1], /^\d{4}-\d\d-\d\dT/);
});

test('price above the target: nothing is sent', async () => {
  const r = rig([row({ lowest: 3600 })]);
  const res = await run(r);
  assert.equal(res.sent, 0); assert.equal(r.sent.length, 0); assert.equal(r.marks.length, 0);
});

test('no email without consent, with email switched off, or without a price', async () => {
  const r = rig([row({ alert_id: 1, consent_at: null }), row({ alert_id: 2, notify_email: false }), row({ alert_id: 3, lowest: null })]);
  const res = await run(r);
  assert.equal(r.sent.length, 0);
  assert.deepEqual([res.skipped.noConsent, res.skipped.noEmail, res.skipped.noPrice], [1, 1, 1]);
});

test('already told about this drop: no second email; once the price rises above the target the alert is armed again', async () => {
  const told = '2026-10-10T08:00:00Z';
  let r = rig([row({ triggered_at: told })]);
  let res = await run(r);
  assert.equal(r.sent.length, 0); assert.equal(res.skipped.waiting, 1); assert.equal(r.marks.length, 0);
  r = rig([row({ triggered_at: told, lowest: 3700 })]);
  res = await run(r);
  assert.equal(res.rearmed, 1); assert.deepEqual(r.marks, [[1, null]]); assert.equal(r.sent.length, 0);
});

test('currencies: a market price in AED is compared with a target in SAR', async () => {
  // AED 3,300 = 3300 / 3.6725 * 3.75 = SAR 3,369.4: under a 3,400 target, over a 3,300 target
  let r = rig([row({ market: 'ae', market_currency: 'AED', lowest: 3300, target_price: 3400, currency: 'SAR' })]);
  await run(r); assert.equal(r.sent.length, 1); assert.match(r.sent[0].subject, /SAR 3,369\.\d\d/);
  r = rig([row({ market: 'ae', market_currency: 'AED', lowest: 3300, target_price: 3300, currency: 'SAR' })]);
  await run(r); assert.equal(r.sent.length, 0);
});

test('Arabic: right-to-left email in Arabic with the Arabic product name', async () => {
  const r = rig([row({ lang: 'ar' })]);
  await run(r);
  const m = r.sent[0];
  assert.match(m.subject, /آبل آيفون 17 برو/); assert.match(m.html, /dir="rtl"/); assert.match(m.text, /3,400\.00 ر\.س/);
});

test('product names are escaped in the HTML', () => {
  const m = buildEmail(row({ name_en: '<img src=x onerror=alert(1)> & "Co"' }), { siteUrl: 'https://x.co', price: 10, lang: 'en' });
  assert.ok(!m.html.includes('<img')); assert.match(m.html, /&lt;img/); assert.match(m.html, /&amp;/);
});

test('daily cap: only the first alerts are emailed, the rest wait for the next run', async () => {
  const r = rig([1, 2, 3, 4, 5].map(i => row({ alert_id: i })));
  const res = await run(r, { max: 3 });
  assert.equal(res.sent, 3); assert.equal(res.skipped.capped, 2); assert.equal(r.marks.length, 3);
});

test('a refused email is not marked as sent, so it is tried again next run; other alerts carry on', async () => {
  const r = rig([row({ alert_id: 1, email: 'bad@example.com' }), row({ alert_id: 2 })]);
  r.mailer.send = async m => { if (m.to === 'bad@example.com') throw new Error('mailbox refused'); r.sent.push(m); };
  const logs = [];
  const res = await run(r, { log: m => logs.push(m) });
  assert.deepEqual([res.sent, res.failed], [1, 1]); assert.deepEqual(r.marks.map(x => x[0]), [2]); assert.match(logs[0], /alert 1.*mailbox refused/);
});

test('dry run: reports who would be emailed and changes nothing', async () => {
  const r = rig([row()]); const logs = [];
  const res = await run(r, { dryRun: true, mailer: null, log: m => logs.push(m) });
  assert.equal(res.sent, 1); assert.equal(r.marks.length, 0); assert.match(logs[0], /would email sara@example\.com/);
});

test('money formatting', () => {
  assert.equal(money(3400, 'SAR', 'en'), 'SAR 3,400.00'); assert.equal(money(24.5, 'USD', 'en'), '$24.50'); assert.equal(money(120, 'AED', 'ar'), '120.00 د.إ');
});

test('Resend mailer: sends the message with the key, and reports a refusal', async () => {
  const calls = [];
  const ok = createResendMailer({ apiKey: 're_test', from: 'DOABNO <alerts@doabno.example>', fetchImpl: async (u, i) => { calls.push([u, i]); return { ok: true, status: 200 }; } });
  await ok.send({ to: 'a@b.co', subject: 'Hi', html: '<p>x</p>', text: 'x' });
  assert.equal(calls[0][0], 'https://api.resend.com/emails'); assert.equal(calls[0][1].headers.Authorization, 'Bearer re_test');
  assert.deepEqual(JSON.parse(calls[0][1].body).to, ['a@b.co']);
  const bad = createResendMailer({ apiKey: 'k', from: 'f@x.co', fetchImpl: async () => ({ ok: false, status: 422, json: async () => ({ message: 'domain not verified' }) }) });
  await assert.rejects(bad.send({ to: 'a@b.co', subject: 's', html: 'h', text: 't' }), /422.*domain not verified/);
  assert.throws(() => createResendMailer({ apiKey: '', from: '' }), /required/);
});
