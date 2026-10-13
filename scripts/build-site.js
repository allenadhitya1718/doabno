#!/usr/bin/env node
// Builds the hosted site into ./dist: the website at /, the app at /app/, the admin portal at /admin/.
//   node scripts/build-site.js
// Cloudflare Pages settings: build command "node scripts/build-site.js", output directory "dist". No packages to install.
// The pages are static files; they talk to Supabase from the visitor's browser using the public key in assets/config.js.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const MOUNTS = [['web-v2', ''], ['app-v2', 'app'], ['admin-v2', 'admin']];
const SKIP = /(^|[\\/])(node_modules|\.git|\.DS_Store|Thumbs\.db)([\\/]|$)|\.(bak|orig|map)$/i;
const MAX_FILE = 25 * 1024 * 1024 - 1024;   // Cloudflare Pages refuses files of 25 MiB or more

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, e.name), dst = path.join(to, e.name);
    if (SKIP.test(src)) continue;
    if (e.isDirectory()) copyDir(src, dst);
    else {
      if (fs.statSync(src).size > MAX_FILE) throw new Error(src + ' is larger than 25 MB, which Cloudflare Pages does not accept');
      fs.copyFileSync(src, dst);
    }
  }
}

// A secret Supabase key is either "sb_secret_..." or an old-style JWT whose payload says role "service_role". The word alone (in a comment) is fine.
function hasSecretKey(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(code)) return true;
  return (code.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g) || []).some(jwt => {
    try { return JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8')).role === 'service_role'; } catch (e) { return false; }
  });
}
function build() {
fs.rmSync(OUT, { recursive: true, force: true });
const problems = [];
let files = 0, bytes = 0;
for (const [dir, mount] of MOUNTS) {
  const src = path.join(ROOT, dir), dst = path.join(OUT, mount);
  if (!fs.existsSync(path.join(src, 'index.html'))) throw new Error(dir + '/index.html is missing');
  copyDir(src, dst);
  const cfg = path.join(dst, 'assets', 'config.js');
  const text = fs.existsSync(cfg) ? fs.readFileSync(cfg, 'utf8') : '';
  if (!/supabaseUrl:\s*'https:\/\/[^']+'/.test(text) || !/anonKey:\s*'[^']+'/.test(text)) problems.push(dir + '/assets/config.js has no Supabase address and key: this page would show demo data only');
  if (hasSecretKey(text)) throw new Error(dir + '/assets/config.js contains a secret Supabase key: remove it, that key must never be in the site');
}
// Count what is being published.
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else { files++; bytes += fs.statSync(p).size; } } })(OUT);

// Response headers (Cloudflare Pages reads _headers). No Content-Security-Policy yet: the pages use inline scripts and styles,
// so one needs a careful pass first (listed in HANDOVER.md).
fs.writeFileSync(path.join(OUT, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: SAMEORIGIN',
  '  Permissions-Policy: camera=(self), microphone=(), geolocation=(), payment=()',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '',
  '/admin/*',
  '  X-Robots-Tag: noindex, nofollow',
  '  Cache-Control: no-store',
  '',
  '/app/*',
  '  X-Robots-Tag: noindex',
  ''
].join('\n'));
// Search engines: the site yes, the admin portal and the app prototype no.
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /admin/\nDisallow: /app/\n');

console.log('Built ' + files + ' files (' + (bytes / 1024 / 1024).toFixed(1) + ' MB) into dist/: / website, /app/ app, /admin/ admin portal');
problems.forEach(p => console.log('WARNING: ' + p));
if (problems.length) process.exitCode = 1;
}

if (require.main === module) build();
module.exports = { hasSecretKey, build };
