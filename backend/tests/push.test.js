// Tests for phone notifications (importer/push.js) and their use by the price-alert job (importer/alerts.js), with fake Google and Apple servers.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { createFcmSender, createApnsSender, createPusher, pusherFromEnv } = require('../importer/push');
const { checkAlerts, buildPush } = require('../importer/alerts');

const rsa = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const ec = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pem = k => k.export({ type: 'pkcs8', format: 'pem' });
const SA = { client_email: 'push@demo.iam.gserviceaccount.com', private_key: pem(rsa.privateKey), project_id: 'demo-proj', token_uri: 'https://oauth2.googleapis.com/token' };
const P8 = pem(ec.privateKey);
const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
const MSG = { title: 'Price drop', body: 'Sony is now SAR 1,413.00', url: '#/p/sony' };
const TOKEN_A = 'a'.repeat(40), TOKEN_B = 'b'.repeat(40);

function fakeGoogle({ failFor = {} } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (url.includes('oauth2')) return { ok: true, status: 200, json: async () => ({ access_token: 'ya29.fake', expires_in: 3600 }) };
    const token = JSON.parse(init.body).message.token;
    const f = failFor[token];
    if (f) return { ok: false, status: f.status, json: async () => f.body };
    return { ok: true, status: 200, json: async () => ({ name: 'projects/demo-proj/messages/1' }) };
  };
  return { calls, fetchImpl };
}

test('FCM: the sign-in request is signed with the service account key (RS256) and a notification goes to each token', async () => {
  const g = fakeGoogle(); let t = 1_700_000_000_000;
  const s = createFcmSender({ serviceAccount: JSON.stringify(SA), fetchImpl: g.fetchImpl, now: () => t });
  const r = await s.send([TOKEN_A, TOKEN_B], MSG);
  assert.deepEqual(r, { sent: 2, invalid: [], failed: 0 });
  const auth = g.calls[0]; assert.equal(auth.url, SA.token_uri);
  const assertion = new URLSearchParams(auth.init.body).get('assertion'); const [h, c, sig] = assertion.split('.');
  assert.deepEqual(decode(h), { alg: 'RS256', typ: 'JWT' });
  const claims = decode(c); assert.equal(claims.iss, SA.client_email); assert.equal(claims.aud, SA.token_uri); assert.equal(claims.scope, 'https://www.googleapis.com/auth/firebase.messaging'); assert.equal(claims.exp - claims.iat, 3600);
  assert.ok(crypto.createVerify('RSA-SHA256').update(h + '.' + c).verify(rsa.publicKey, Buffer.from(sig, 'base64url')), 'the signature must verify with the matching public key');
  const send = g.calls[1]; assert.equal(send.url, 'https://fcm.googleapis.com/v1/projects/demo-proj/messages:send');
  assert.equal(send.init.headers.Authorization, 'Bearer ya29.fake');
  const body = JSON.parse(send.init.body).message; assert.equal(body.token, TOKEN_A); assert.equal(body.notification.title, 'Price drop'); assert.equal(body.data.url, '#/p/sony');
  assert.equal(g.calls.filter(x => x.url.includes('oauth2')).length, 1);           // one sign-in serves both sends
  await s.send([TOKEN_A], MSG); assert.equal(g.calls.filter(x => x.url.includes('oauth2')).length, 1);   // and is reused later
  t += 3_600_000; await s.send([TOKEN_A], MSG); assert.equal(g.calls.filter(x => x.url.includes('oauth2')).length, 2);   // renewed after it expires
});

test('FCM: dead tokens are reported, other failures are only counted, sign-in failure is an error', async () => {
  const g = fakeGoogle({ failFor: {
    [TOKEN_A]: { status: 404, body: { error: { status: 'NOT_FOUND', details: [{ errorCode: 'UNREGISTERED' }] } } },
    [TOKEN_B]: { status: 500, body: { error: { status: 'INTERNAL' } } },
  } });
  const s = createFcmSender({ serviceAccount: SA, fetchImpl: g.fetchImpl });
  const r = await s.send([TOKEN_A, TOKEN_B, 'c'.repeat(40)], MSG);
  assert.deepEqual(r, { sent: 1, invalid: [TOKEN_A], failed: 1 });
  const bad = createFcmSender({ serviceAccount: SA, fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ error: 'invalid_grant', error_description: 'Invalid JWT' }) }) });
  await assert.rejects(() => bad.send([TOKEN_A], MSG), /FCM sign-in failed: Invalid JWT/);
  assert.throws(() => createFcmSender({ serviceAccount: { client_email: 'x' } }), /needs client_email/);
});

function fakeApns(statuses = {}) {
  const calls = []; let closed = 0;
  const connect = host => ({ request: async (path, headers, body) => { calls.push({ host, path, headers, body }); const t = path.split('/').pop(); const s = statuses[t]; return s ? { status: s.status, body: JSON.stringify({ reason: s.reason }) } : { status: 200, body: '' }; }, close: () => { closed++; } });
  return { calls, connect, closed: () => closed };
}

test('APNs: requests carry a token signed with the .p8 key (ES256) and the app topic, over one connection', async () => {
  const a = fakeApns(); const t0 = 1_700_000_000_000;
  const s = createApnsSender({ teamId: 'TEAM123456', keyId: 'KEY1234567', p8: P8, bundleId: 'com.doabno.app', connect: a.connect, now: () => t0 });
  const t1 = 'ab'.repeat(32), t2 = 'cd'.repeat(32);
  const r = await s.send([t1, t2], MSG);
  assert.deepEqual(r, { sent: 2, invalid: [], failed: 0 }); assert.equal(a.closed(), 1);
  const c = a.calls[0]; assert.equal(c.host, 'https://api.push.apple.com'); assert.equal(c.path, '/3/device/' + t1);
  assert.equal(c.headers['apns-topic'], 'com.doabno.app'); assert.equal(c.headers['apns-push-type'], 'alert');
  const [h, cl, sig] = c.headers.authorization.replace('bearer ', '').split('.');
  assert.deepEqual(decode(h), { alg: 'ES256', kid: 'KEY1234567' }); assert.deepEqual(decode(cl), { iss: 'TEAM123456', iat: Math.floor(t0 / 1000) });
  assert.ok(crypto.verify('sha256', Buffer.from(h + '.' + cl), { key: ec.publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64url')), 'the signature must verify with the matching public key');
  const body = JSON.parse(c.body); assert.equal(body.aps.alert.title, 'Price drop'); assert.equal(body.url, '#/p/sony');
  assert.equal(a.calls[1].headers.authorization, c.headers.authorization);          // the same token is reused within the hour
});

test('APNs: gone devices are reported dead, odd tokens never sent, other errors counted', async () => {
  const good = 'ab'.repeat(32), gone = 'cd'.repeat(32), wrong = 'ef'.repeat(32), busy = '12'.repeat(32);
  const a = fakeApns({ [gone]: { status: 410, reason: 'Unregistered' }, [wrong]: { status: 400, reason: 'BadDeviceToken' }, [busy]: { status: 503, reason: 'ServiceUnavailable' } });
  const s = createApnsSender({ teamId: 'T', keyId: 'K', p8: P8, bundleId: 'com.doabno.app', connect: a.connect });
  const r = await s.send([good, gone, wrong, busy, 'not hex!'], MSG);
  assert.deepEqual(r, { sent: 1, invalid: [gone, wrong, 'not hex!'], failed: 1 });
  assert.equal(a.calls.length, 4);                                                  // the non-hex token was never sent
  assert.throws(() => createApnsSender({ teamId: 'T' }), /needs teamId/);
});

test('the pusher sends each phone through its platform, leaves platforms without secrets alone, and survives a sender error', async () => {
  const sent = []; const mk = (platform, f) => ({ send: async (tokens, msg) => { sent.push([platform, tokens]); return f(tokens); } });
  const p = createPusher({ android: mk('android', tk => ({ sent: tk.length, invalid: [], failed: 0 })), ios: mk('ios', () => { throw new Error('apple down'); }) });
  const r = await p.send([{ token: 'A1', platform: 'android' }, { token: 'I1', platform: 'ios' }, { token: 'I2', platform: 'ios' }], MSG);
  assert.deepEqual(r, { sent: 1, invalid: [], failed: 2, skipped: 0 });
  const onlyAndroid = createPusher({ android: mk('android', tk => ({ sent: tk.length, invalid: [], failed: 0 })) });
  assert.deepEqual(await onlyAndroid.send([{ token: 'A1', platform: 'android' }, { token: 'I1', platform: 'ios' }], MSG), { sent: 1, invalid: [], failed: 0, skipped: 1 });
  assert.equal(createPusher({}).enabled, false);
  assert.equal(pusherFromEnv({}).enabled, false);
  assert.deepEqual(pusherFromEnv({ FCM_SERVICE_ACCOUNT_JSON: JSON.stringify(SA) }).platforms, ['android']);
  assert.deepEqual(pusherFromEnv({ APNS_KEY_P8: P8, APNS_KEY_ID: 'K', APPLE_TEAM_ID: 'T', BUNDLE_ID: 'com.doabno.app' }).platforms, ['ios']);
  assert.deepEqual(pusherFromEnv({ APNS_KEY_P8: P8, APNS_KEY_ID: 'K', BUNDLE_ID: 'com.doabno.app' }).platforms, []);   // the team id is missing: iPhone push stays off
});

// ---------- price alerts with push ----------
function alertRow(over = {}) {
  return Object.assign({ alert_id: 1, user_id: 'u1', email: 'a@example.com', lang: 'en', product_id: 'sony', name_en: 'Sony WH-1000XM6', name_ar: 'سوني', target_price: 1500, currency: 'SAR',
    notify_email: true, notify_push: true, consent_at: '2026-10-01T00:00:00Z', triggered_at: null, market: 'sa', market_currency: 'SAR', lowest: 1413 }, over);
}
function alertDb(rows, tokens) {
  const marks = [], dropped = [];
  return { marks, dropped, getRates: async () => ({ SAR: 3.75, USD: 1 }), getAlertCandidates: async () => rows, markAlert: async (id, at) => { marks.push([id, at]); },
    getPushTokens: async ids => tokens.filter(t => ids.includes(t.user_id)), dropPushTokens: async t => { dropped.push(...t); } };
}
const okMailer = () => { const sent = []; return { sent, send: async m => { sent.push(m); } }; };
const okPusher = (result = {}) => { const calls = []; return { enabled: true, platforms: ['android', 'ios'], calls, send: async (rows, msg) => { calls.push({ rows, msg }); return Object.assign({ sent: rows.length, invalid: [], failed: 0, skipped: 0 }, result); } }; };
const PHONES = [{ user_id: 'u1', token: 'T-ANDROID', platform: 'android' }, { user_id: 'u1', token: 'T-IOS', platform: 'ios' }, { user_id: 'u2', token: 'T-OTHER', platform: 'android' }];

test('alerts: a reached alert sends an email and a notification to every phone of that person, then is marked told', async () => {
  const db = alertDb([alertRow()], PHONES), mailer = okMailer(), pusher = okPusher();
  const out = await checkAlerts({ db, mailer, pusher, siteUrl: 'https://doabno.test' });
  assert.equal(out.sent, 1); assert.equal(out.pushed, 2); assert.equal(mailer.sent.length, 1);
  assert.deepEqual(pusher.calls[0].rows.map(r => r.token), ['T-ANDROID', 'T-IOS']);          // u2's phone is not touched
  assert.equal(pusher.calls[0].msg.title, 'Price drop reached your target'); assert.match(pusher.calls[0].msg.body, /Sony WH-1000XM6 is now SAR 1,413\.00/); assert.equal(pusher.calls[0].msg.url, '#/p/sony');
  assert.equal(db.marks.length, 1); assert.equal(db.marks[0][0], 1); assert.ok(db.marks[0][1]);
});

test('alerts: push works without email consent or an email key, and the Arabic message is right-to-left text', async () => {
  const db = alertDb([alertRow({ notify_email: false, consent_at: null, lang: 'ar' })], PHONES);
  const pusher = okPusher();
  const out = await checkAlerts({ db, mailer: null, pusher, siteUrl: 'https://doabno.test' });
  assert.equal(out.sent, 0); assert.equal(out.pushed, 2); assert.equal(db.marks.length, 1);
  assert.match(pusher.calls[0].msg.title, /انخفض/); assert.match(pusher.calls[0].msg.body, /سوني/);
  // email wanted and consented but no mailer configured: the phone is still told
  const db2 = alertDb([alertRow()], PHONES); const out2 = await checkAlerts({ db: db2, mailer: null, pusher: okPusher(), siteUrl: 'x' });
  assert.equal(out2.sent, 0); assert.equal(out2.pushed, 2); assert.equal(db2.marks.length, 1);
});

test('alerts: no phone, push turned off, or no push set up means the old email-only behavior', async () => {
  for (const [label, row, tokens, pusher] of [['no phone registered', alertRow(), [], okPusher()], ['push off for the alert', alertRow({ notify_push: false }), PHONES, okPusher()], ['no pusher', alertRow(), PHONES, null]]) {
    const db = alertDb([row], tokens), mailer = okMailer();
    const out = await checkAlerts({ db, mailer, pusher, siteUrl: 'x' });
    assert.equal(out.sent, 1, label); assert.equal(out.pushed, 0, label); assert.equal(mailer.sent.length, 1, label); assert.equal(pusher ? pusher.calls.length : 0, 0, label);
  }
  // neither email nor phone possible: skipped with the old reasons
  const out = await checkAlerts({ db: alertDb([alertRow({ notify_email: false })], []), mailer: okMailer(), pusher: okPusher(), siteUrl: 'x' });
  assert.equal(out.skipped.noEmail, 1);
  const out2 = await checkAlerts({ db: alertDb([alertRow({ consent_at: null })], []), mailer: okMailer(), pusher: okPusher(), siteUrl: 'x' });
  assert.equal(out2.skipped.noConsent, 1);
});

test('alerts: not told twice, re-armed when the price rises, and a failed push with no email is retried next run', async () => {
  let db = alertDb([alertRow({ triggered_at: '2026-10-10T00:00:00Z' })], PHONES), pusher = okPusher();
  let out = await checkAlerts({ db, mailer: okMailer(), pusher, siteUrl: 'x' });
  assert.equal(out.skipped.waiting, 1); assert.equal(pusher.calls.length, 0); assert.equal(db.marks.length, 0);
  db = alertDb([alertRow({ triggered_at: '2026-10-10T00:00:00Z', lowest: 1700 })], PHONES);
  out = await checkAlerts({ db, mailer: okMailer(), pusher: okPusher(), siteUrl: 'x' });
  assert.equal(out.rearmed, 1); assert.deepEqual(db.marks, [[1, null]]);
  db = alertDb([alertRow({ notify_email: false })], PHONES);
  out = await checkAlerts({ db, mailer: null, pusher: okPusher({ sent: 0, failed: 2 }), siteUrl: 'x' });
  assert.equal(out.pushed, 0); assert.equal(out.pushFailed, 2); assert.equal(db.marks.length, 0);          // nothing got through: it is tried again next run
});

test('alerts: dead tokens are removed, the email cap leaves push unaffected, dry run changes nothing', async () => {
  let db = alertDb([alertRow()], PHONES);
  await checkAlerts({ db, mailer: okMailer(), pusher: okPusher({ sent: 1, invalid: ['T-IOS'], failed: 0 }), siteUrl: 'x' });
  assert.deepEqual(db.dropped, ['T-IOS']);
  const rows = [alertRow({ alert_id: 1 }), alertRow({ alert_id: 2, user_id: 'u2', email: 'b@example.com' })];
  db = alertDb(rows, PHONES); const mailer = okMailer(), pusher = okPusher();
  const out = await checkAlerts({ db, mailer, pusher, siteUrl: 'x', max: 1 });
  assert.equal(out.sent, 1); assert.equal(mailer.sent.length, 1); assert.equal(out.pushed, 3);        // the second person was only pushed, and still counts as told
  assert.equal(db.marks.length, 2);
  db = alertDb([alertRow()], PHONES); const logs = []; const p2 = okPusher();
  const dry = await checkAlerts({ db, mailer: null, pusher: p2, siteUrl: 'x', dryRun: true, log: m => logs.push(m) });
  assert.equal(db.marks.length, 0); assert.equal(p2.calls.length, 0); assert.equal(dry.pushed, 2); assert.ok(logs.some(l => /would push to 2 phone/.test(l)));
  assert.deepEqual(db.dropped, []);
});

test('buildPush writes short English and Arabic notifications', () => {
  const a = alertRow();
  assert.deepEqual(buildPush(a, { price: 1413, lang: 'en' }), { title: 'Price drop reached your target', body: 'Sony WH-1000XM6 is now SAR 1,413.00 (your target: SAR 1,500.00)', url: '#/p/sony' });
  const ar = buildPush(a, { price: 1413, lang: 'ar' }); assert.match(ar.body, /سوني/); assert.equal(ar.url, '#/p/sony');
});
