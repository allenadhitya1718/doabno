// Push notifications to phones, without any packages: Android through Firebase Cloud Messaging (FCM) and iPhone through Apple's push
// service (APNs). Each sender takes a list of device tokens and one message and answers { sent, invalid, failed }:
//   sent    how many phones the service accepted;
//   invalid the tokens the service says no longer exist (app removed, token renewed): the caller deletes them;
//   failed  how many could not be sent for another reason (a retry on the next run is fine).
// Secrets come from the environment of the job (never the repo): FCM_SERVICE_ACCOUNT_JSON, APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID, BUNDLE_ID.
const crypto = require('crypto');
const http2 = require('http2');

const b64url = x => Buffer.from(typeof x === 'string' ? x : JSON.stringify(x)).toString('base64url');

// ---------- Android: FCM HTTP v1 ----------
// A short-lived access token is requested with a signed request (RS256) made from the service account's private key.
function createFcmSender({ serviceAccount, fetchImpl = fetch, now = () => Date.now() }) {
  const sa = typeof serviceAccount === 'string' ? JSON.parse(serviceAccount) : serviceAccount;
  if (!sa || !sa.client_email || !sa.private_key || !sa.project_id) throw new Error('FCM service account needs client_email, private_key and project_id');
  const tokenUri = sa.token_uri || 'https://oauth2.googleapis.com/token';
  let access = null, until = 0;

  async function accessToken() {
    if (access && now() < until - 60_000) return access;
    const iat = Math.floor(now() / 1000);
    const head = b64url({ alg: 'RS256', typ: 'JWT' });
    const claims = b64url({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: tokenUri, iat, exp: iat + 3600 });
    const sig = crypto.createSign('RSA-SHA256').update(head + '.' + claims).sign(sa.private_key).toString('base64url');
    const res = await fetchImpl(tokenUri, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + head + '.' + claims + '.' + sig });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.access_token) throw new Error('FCM sign-in failed: ' + (j.error_description || j.error || 'HTTP ' + res.status));
    access = j.access_token; until = now() + (Number(j.expires_in) || 3600) * 1000;
    return access;
  }

  return {
    platform: 'android',
    async send(tokens, msg) {
      const out = { sent: 0, invalid: [], failed: 0 };
      if (!tokens.length) return out;
      const bearer = await accessToken();
      for (const token of tokens) {
        const res = await fetchImpl('https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(sa.project_id) + '/messages:send', {
          method: 'POST', headers: { Authorization: 'Bearer ' + bearer, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: { token, notification: { title: msg.title, body: msg.body }, data: { url: String(msg.url || '') },
            android: { priority: 'HIGH', notification: { channel_id: 'price_alerts' } } } }),
        }).catch(() => null);
        if (res && res.ok) { out.sent++; continue; }
        const j = res ? await res.json().catch(() => ({})) : {};
        const code = (j.error && ((j.error.details || []).map(d => d.errorCode).find(Boolean) || j.error.status)) || '';
        if (res && (res.status === 404 || code === 'UNREGISTERED' || code === 'NOT_FOUND' || (res.status === 400 && code === 'INVALID_ARGUMENT'))) out.invalid.push(token);
        else out.failed++;
      }
      return out;
    },
  };
}

// ---------- iPhone: APNs over HTTP/2 ----------
// Requests carry a short-lived token signed (ES256) with the APNs key from the Apple developer account (a .p8 file).
// Builds from TestFlight and the App Store use the production server.
function defaultApnsRequest(host) {
  const session = http2.connect(host);
  const errors = [];
  session.on('error', e => errors.push(e));
  return {
    request(path, headers, body) {
      return new Promise((resolve, reject) => {
        if (errors.length) return reject(errors[0]);
        const req = session.request(Object.assign({ ':method': 'POST', ':path': path }, headers));
        let status = 0, data = '';
        req.setEncoding('utf8');
        req.on('response', h => { status = h[':status']; });
        req.on('data', c => { data += c; });
        req.on('end', () => resolve({ status, body: data }));
        req.on('error', reject);
        req.setTimeout(15000, () => { req.close(); reject(new Error('APNs request timed out')); });
        req.end(body);
      });
    },
    close() { try { session.close(); } catch (e) { /* already closed */ } },
  };
}

function createApnsSender({ teamId, keyId, p8, bundleId, host = 'https://api.push.apple.com', connect = defaultApnsRequest, now = () => Date.now() }) {
  if (!teamId || !keyId || !p8 || !bundleId) throw new Error('APNs needs teamId, keyId, p8 and bundleId');
  let jwt = null, jwtAt = 0;
  const token = () => {
    if (jwt && now() - jwtAt < 40 * 60_000) return jwt;           // Apple wants a new token at least every hour, and not more often than every 20 minutes
    const iat = Math.floor(now() / 1000);
    const data = b64url({ alg: 'ES256', kid: keyId }) + '.' + b64url({ iss: teamId, iat });
    jwt = data + '.' + crypto.sign('sha256', Buffer.from(data), { key: p8, dsaEncoding: 'ieee-p1363' }).toString('base64url'); jwtAt = now();
    return jwt;
  };
  return {
    platform: 'ios',
    async send(tokens, msg) {
      const out = { sent: 0, invalid: [], failed: 0 };
      if (!tokens.length) return out;
      const conn = connect(host);
      try {
        const body = JSON.stringify({ aps: { alert: { title: msg.title, body: msg.body }, sound: 'default' }, url: String(msg.url || '') });
        for (const t of tokens) {
          if (!/^[0-9a-fA-F]{20,200}$/.test(t)) { out.invalid.push(t); continue; }       // an APNs device token is hexadecimal
          try {
            const r = await conn.request('/3/device/' + t, { authorization: 'bearer ' + token(), 'apns-topic': bundleId, 'apns-push-type': 'alert', 'apns-priority': '10', 'content-type': 'application/json' }, body);
            if (r.status === 200) { out.sent++; continue; }
            let reason = ''; try { reason = JSON.parse(r.body).reason || ''; } catch (e) { /* no body */ }
            if (r.status === 410 || reason === 'BadDeviceToken' || reason === 'Unregistered' || reason === 'DeviceTokenNotForTopic') out.invalid.push(t);
            else out.failed++;
          } catch (e) { out.failed++; }
        }
      } finally { if (conn.close) conn.close(); }
      return out;
    },
  };
}

// Builds the senders that the environment has secrets for. Missing secrets simply mean that platform is off.
function pusherFromEnv(env = process.env, opts = {}) {
  const senders = {};
  if (env.FCM_SERVICE_ACCOUNT_JSON) senders.android = createFcmSender({ serviceAccount: env.FCM_SERVICE_ACCOUNT_JSON, fetchImpl: opts.fetchImpl });
  if (env.APNS_KEY_P8 && env.APNS_KEY_ID && (env.APNS_TEAM_ID || env.APPLE_TEAM_ID) && env.BUNDLE_ID) {
    senders.ios = createApnsSender({ teamId: env.APNS_TEAM_ID || env.APPLE_TEAM_ID, keyId: env.APNS_KEY_ID, p8: env.APNS_KEY_P8, bundleId: env.BUNDLE_ID, connect: opts.connect });
  }
  return createPusher(senders);
}

// pusher.send(tokenRows [{ token, platform }], message) -> { sent, invalid: [tokens], failed, skipped }
function createPusher(senders) {
  return {
    enabled: Object.keys(senders).length > 0,
    platforms: Object.keys(senders),
    async send(rows, msg) {
      const out = { sent: 0, invalid: [], failed: 0, skipped: 0 };
      for (const platform of ['android', 'ios']) {
        const mine = rows.filter(r => r.platform === platform).map(r => r.token);
        if (!mine.length) continue;
        if (!senders[platform]) { out.skipped += mine.length; continue; }          // no secrets for this platform: leave the tokens alone
        try {
          const r = await senders[platform].send(mine, msg);
          out.sent += r.sent; out.invalid.push(...r.invalid); out.failed += r.failed;
        } catch (e) { out.failed += mine.length; }
      }
      return out;
    },
  };
}

module.exports = { createFcmSender, createApnsSender, createPusher, pusherFromEnv };
