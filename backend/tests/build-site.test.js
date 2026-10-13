// The site build must refuse a page that carries a secret Supabase key, and accept the public key and the warning comment.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { hasSecretKey } = require(path.join(__dirname, '..', '..', 'scripts', 'build-site.js'));
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = role => 'eyJ' + b64({ alg: 'HS256', typ: 'JWT' }).slice(3) + '.' + b64({ iss: 'supabase', ref: 'abc', role }) + '.' + 'x'.repeat(30);

test('public key and the warning comment are fine', () => {
  assert.equal(hasSecretKey("/* Never put a service_role key here */\nwindow.DOABNO_CONFIG = { supabaseUrl: 'https://a.supabase.co', anonKey: 'sb_publishable_abc123' };"), false);
  assert.equal(hasSecretKey("// service_role is secret\nconst k = '" + jwt('anon') + "';"), false);
});
test('a service_role key is caught, in either format', () => {
  assert.equal(hasSecretKey("anonKey: '" + jwt('service_role') + "'"), true);
  assert.equal(hasSecretKey("anonKey: 'sb_secret_0123456789abcdef'"), true);
});
test('a secret key hidden in a comment-looking line that is real code is still caught', () => {
  assert.equal(hasSecretKey("const url = 'https://x.co'; const k = 'sb_secret_0123456789abcdef'; // note"), true);
});
