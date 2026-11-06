/* Copies the text and lookup tables out of web-v2/v2.js into lib/strings.ts, so the Next.js site uses the same wording.
 * Run from web-next/:  node scripts/extract-strings.cjs ../web-v2/v2.js lib/strings.ts
 * Each table must start with "  const NAME = " and end with "  };" (or be a single line ending in ";"). */
const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/);
const NAMES = ['S', 'MK', 'SOON', 'DOMAINS', 'BRAND_DOMAINS', 'BRAND_AR', 'LEGAL', 'ABOUT', 'ABOUT_UI'];

function find(name) {
  const i = src.findIndex(l => l.startsWith('  const ' + name + ' = '));
  if (i < 0) throw new Error('not found: ' + name);
  if (src[i].trim().endsWith(';')) return [i, i];
  let j = i;
  while (j < src.length && src[j] !== '  };') j++;
  if (j >= src.length) throw new Error('no end for ' + name);
  return [i, j];
}

let out = '/* Text and lookup tables copied from web-v2/v2.js (same keys). Do not edit by hand:\n' +
  ' * regenerate with  node scripts/extract-strings.cjs ../web-v2/v2.js lib/strings.ts */\n/* eslint-disable */\n// @ts-nocheck\n';
for (const n of NAMES) {
  const [a, b] = find(n);
  const block = src.slice(a, b + 1).map(l => l.replace(/^  /, '')).join('\n').replace(/^const /, 'export const ');
  out += '\n' + block + '\n';
}
fs.writeFileSync(process.argv[3], out);
console.log('wrote', process.argv[3], out.length, 'chars');
