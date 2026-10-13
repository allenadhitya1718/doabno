#!/usr/bin/env node
// Serves ./dist on this computer and applies dist/_headers the way Cloudflare Pages does, so the security headers
// (including the Content-Security-Policy) can be tried before going live.   node scripts/serve-dist.js [port]
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'dist');
const PORT = +process.argv[2] || 5190;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

// _headers: a path pattern on its own line ("/admin/*"), then indented "Name: value" lines.
function parseHeaders(text) {
  const rules = []; let cur = null;
  text.split(/\r?\n/).forEach(line => {
    if (!line.trim()) return;
    if (/^\S/.test(line)) { cur = { pattern: line.trim(), headers: [] }; rules.push(cur); }
    else if (cur) { const i = line.indexOf(':'); cur.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]); }
  });
  return rules;
}
const matches = (pattern, urlPath) => pattern.endsWith('*') ? urlPath.startsWith(pattern.slice(0, -1)) : urlPath === pattern;
const rules = fs.existsSync(path.join(ROOT, '_headers')) ? parseHeaders(fs.readFileSync(path.join(ROOT, '_headers'), 'utf8')) : [];

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) { if (!urlPath.endsWith('/')) { res.writeHead(301, { Location: urlPath + '/' }); return res.end(); } file = path.join(file, 'index.html'); }
  if (!fs.existsSync(file) || path.basename(file) === '_headers') { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
  const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' };
  rules.filter(r => matches(r.pattern, urlPath)).forEach(r => r.headers.forEach(([k, v]) => { headers[k] = headers[k] ? headers[k] + ', ' + v : v; }));
  res.writeHead(200, headers);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('Serving dist/ at http://localhost:' + PORT + ' with its _headers applied'));
