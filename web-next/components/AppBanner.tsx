/* "Get the app" section of the home page (static phones, port of appBanner without the animated demo). */
import { moneyText, nm, t, type Lang, type Market } from '../lib/site';
import type { Data, Item } from '../lib/catalog';
import { photoOf } from './slim';
import { LogoBox, Thumb, HeartIcon } from './ui';
import { DOMAINS } from '../lib/strings';

const APPLE = 'M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701';
const PLAY = 'M22.018 13.298l-3.919 2.218-3.515-3.493 3.543-3.521 3.891 2.202a1.49 1.49 0 0 1 0 2.594zM1.337.924a1.486 1.486 0 0 0-.112.568v21.017c0 .217.045.419.124.6l11.155-11.087L1.337.924zm12.207 10.065l3.258-3.238L3.45.195a1.466 1.466 0 0 0-.946-.179l11.04 10.973zm0 2.067l-11 10.933c.298.036.612-.016.906-.183l13.324-7.54-3.23-3.21z';
const Logo = () => <img className="phone-logo" src="/assets/brand/doabno-logo-primary.svg" alt="" width={84} height={16} />;
const storeLogo = (d: string) => <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d={d} fill="currentColor" /></svg>;
const ago = (lang: Lang, m: number) => (m < 60 ? t(lang, 'ago.min', { n: Math.round(m) }) : m < 1440 ? t(lang, 'ago.h', { n: Math.round(m / 60) }) : t(lang, 'ago.d', { n: Math.round(m / 1440) }));

export function AppBanner({ items, lang, market, data }: { items: Item[]; lang: Lang; market: Market; data: Data }) {
  const feat = items.find(i => i.p.id === 'iphone-17-pro') || items[0];
  const cur = data.MARKETS[market].currency, mt = (v: number) => moneyText(lang, data.CURRENCIES, cur, v);
  const sl = (n: number) => (n === 1 ? t(lang, 'store1') : t(lang, 'stores', { n }));
  const dom = (id: string) => (DOMAINS as Record<string, string>)[id];
  let main = null;
  if (feat) {
    const rows = feat.offers.filter((o: any) => o.inStock).slice().sort((x: any, y: any) => x.total - y.total).slice(0, 4);
    const best = rows[0];
    if (best) {
      const hist = data.historyFor(feat.p, market, 30), mn = Math.min(...hist), mx = Math.max(...hist), rg = mx - mn || 1;
      const path = hist.map((x: number, i: number) => (i ? 'L' : 'M') + ((i * 200) / (hist.length - 1)).toFixed(1) + ' ' + (4 + (1 - (x - mn) / rg) * 36).toFixed(1)).join(' ');
      main = (
        <div className="phone main"><div className="phone-screen mp">
          <div className="pd-top"><Logo /><span className="pd-heart on"><HeartIcon on /></span></div>
          <div className="mp-hero"><Thumb photo={photoOf(data, feat.p, 320, 320)} w={320} h={320} />{feat.p.drop >= 3 ? <span className="mp-drop">↓ {Math.round(feat.p.drop)}%</span> : null}</div>
          <b className="mp-name" dir="auto">{nm(lang, feat.p)}</b><small className="mp-meta">{sl(feat.n)} · {t(lang, 'verified', { n: ago(lang, best.updatedMin) })}</small>
          <div className="mp-best"><small>{t(lang, 'viz.low')}</small><div className="mp-bp"><b className="money">{mt(best.total)}</b><LogoBox name={best.store.name} color={best.store.color || '#0D2942'} domain={dom(best.store.id)} /></div><span>{best.store.name} · {t(lang, 'bestTag')}</span></div>
          <ul className="mp-rows">{rows.slice(1).map((o: any) => <li key={o.store.id}><LogoBox name={o.store.name} color={o.store.color || '#0D2942'} domain={dom(o.store.id)} /><span>{o.store.name}</span><b className="money">{mt(o.total)}</b></li>)}</ul>
          <div className="mp-chart"><svg viewBox="0 0 200 44" preserveAspectRatio="none"><path d={path + ' L200 44 L0 44 Z'} fill="rgba(31,169,113,.12)" /><path d={path} fill="none" stroke="#1FA971" strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg></div>
          <span className="mp-btn">{t(lang, 'p.visit', { s: best.store.name })}</span>
        </div></div>
      );
    }
  }
  const pool = items.filter(i => i.p.photos && i.p.photos[0]);
  const alertsPh = (
    <div className="phone side"><div className="phone-screen"><div className="pd-top"><Logo /></div><h4 className="sp-h">{t(lang, 'app.alerts')}</h4>
      {pool.slice(1, 5).map((i, k) => (
        <div className="sp-row" key={i.p.id}><span className="sp-img"><Thumb photo={photoOf(data, i.p, 40, 40)} w={40} h={40} /></span>
          <span className="sp-t"><b dir="auto">{nm(lang, i.p)}</b><small>{k === 0 ? <em>{t(lang, 'app.hit')}</em> : t(lang, 'app.target', { x: mt(i.best.total * 0.9) })}</small></span></div>
      ))}
    </div></div>
  );
  const dealsPh = (
    <div className="phone side"><div className="phone-screen"><div className="pd-top"><Logo /></div><h4 className="sp-h">{t(lang, 'app.deals')}</h4>
      {pool.slice().sort((a, b) => b.p.drop - a.p.drop).slice(0, 4).map(i => (
        <div className="sp-row" key={i.p.id}><span className="sp-img"><Thumb photo={photoOf(data, i.p, 40, 40)} w={40} h={40} /></span>
          <span className="sp-t"><b dir="auto">{nm(lang, i.p)}</b><small><strong className="money">{mt(i.best.total)}</strong><em className="dn">↓ {Math.round(i.p.drop)}%</em></small></span></div>
      ))}
    </div></div>
  );
  return (
    <section className="sec app-sec"><div className="wrap"><div className="app-promo2">
      <span className="app-pill">{t(lang, 'app.pill')}</span>
      <h2>{t(lang, 'app.title')}<span>{t(lang, 'app.title2')}</span></h2>
      <p className="app-text">{t(lang, 'app.text')}</p>
      <div className="store-badges">
        <span className="store-badge">{storeLogo(APPLE)}<span><small>{t(lang, 'app.soon')}</small>App Store</span></span>
        <span className="store-badge">{storeLogo(PLAY)}<span><small>{t(lang, 'app.soon')}</small>Google Play</span></span>
      </div>
      <div className="app-phones" aria-hidden="true">{alertsPh}{main}{dealsPh}</div>
    </div></div></section>
  );
}
