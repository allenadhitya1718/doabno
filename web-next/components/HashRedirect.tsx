'use client';
/* Old links like /#/p/iphone-17-pro (web-v2) are sent to the new address /{lang}/{market}/p/iphone-17-pro. */
import { useEffect } from 'react';
import { href } from './clientlib';

const KNOWN = ['p', 'c', 'search', 'deals', 'coupons', 'favorites', 'alerts', 'about', 'legal', 'privacy-request', 'account'];
const pick = (k: string, ok: (v: string) => boolean, d: string) => {
  try { const v = JSON.parse(localStorage.getItem('doabno2.' + k) || 'null'); return typeof v === 'string' && ok(v) ? v : d; } catch { return d; }
};

export function HashRedirect() {
  useEffect(() => {
    const h = location.hash;
    if (!h.startsWith('#/')) return;
    const seg0 = location.pathname.split('/')[1] || 'en', seg1 = location.pathname.split('/')[2] || 'sa';
    const lang = pick('lang', v => v === 'en' || v === 'ar', seg0 === 'ar' ? 'ar' : 'en');
    const market = pick('market', v => ['sa', 'ae', 'us', 'uk'].includes(v), ['sa', 'ae', 'us', 'uk'].includes(seg1) ? seg1 : 'sa');
    const body = h.slice(1);                       // '/p/ID?x=y'
    const qi = body.indexOf('?');
    const path = (qi < 0 ? body : body.slice(0, qi)).split('/').filter(Boolean);
    const query = qi < 0 ? '' : body.slice(qi);
    const rest = path.length && KNOWN.includes(path[0]) ? '/' + path.join('/') + query : '';
    location.replace(href(lang, market, rest));
  }, []);
  return null;
}
