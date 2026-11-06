import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BRAND_DOMAINS, ABOUT, DOMAINS } from '../../../lib/strings';
import { alternates, href, isLang, isMarket, moneyText, nm, t, MARKET_NAMES, type Lang, type Market } from '../../../lib/site';
import { getData, getItems } from '../../../lib/catalog';
import { AppBanner } from '../../../components/AppBanner';
import { ListCard, ProductCard } from '../../../components/cards';
import { dict } from '../../../components/dict';
import { SearchBox } from '../../../components/SearchBox';
import { SEARCH_KEYS } from '../../../components/keys';
import { searchIndex, photoOf } from '../../../components/slim';
import { Arrow, Check, LogoBox, Money, Thumb } from '../../../components/ui';

export const revalidate = 900;

type P = { params: Promise<{ lang: string; market: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  const title = 'DOABNO | ' + (lang === 'ar' ? 'قارن قبل أن تشتري' : 'Compare before you buy');
  return { title: { absolute: title }, alternates: alternates(lang, market) };
}

const promoNodes = (lang: Lang) => [
  { x: 12, y: 20, cls: 'green', a: '↓ 18%', b: t(lang, 'pn.drop') },
  { x: 9, y: 70, cls: '', a: 'SAVE10', b: t(lang, 'pn.code') },
  { x: 85, y: 16, cls: 'best', a: 'SAR 3,914', b: 'Carrefour · ' + t(lang, 'pn.best') },
  { x: 90, y: 38, cls: '', a: t(lang, 'pn.free'), b: 'noon' },
];

export default async function Home({ params }: P) {
  const { lang: l, market: m } = await params;
  if (!isLang(l) || !isMarket(m)) notFound();
  const lang: Lang = l, market: Market = m;
  const { data } = await getData();
  const all = await getItems(market);
  const feat = all.find(i => i.p.id === 'iphone-17-pro') || all[0];
  const popularRows = all.slice().sort((a, b) => b.p.reviews - a.p.reviews).slice(0, 8);
  const drops = all.slice().sort((a, b) => b.p.drop - a.p.drop).slice(0, 4);
  const cur = data.MARKETS[market].currency;
  const mt = (v: number) => moneyText(lang, data.CURRENCIES, cur, v);
  const about = (ABOUT as Record<string, any>)[lang] || ABOUT.en;
  const nodes = promoNodes(lang);
  const dom = (id: string) => (DOMAINS as Record<string, string>)[id];

  return (
    <>
      <section className="hero">
        <div className="wrap hero-in">
          <div>
            <h1 dangerouslySetInnerHTML={{ __html: t(lang, 'hero.title') }} />
            <p className="sub">{t(lang, 'hero.sub')}</p>
            <SearchBox lang={lang} market={market} index={searchIndex(all, lang, data, market)} tx={dict(lang, SEARCH_KEYS)} variant="hero" />
            <div className="chips-row"><span className="lbl">{t(lang, 'hero.try')}</span>
              {data.POPULAR.slice(0, 4).map(r => <a key={r} className="chip" href={href(lang, market, '/search?q=' + encodeURIComponent(r))}>{r}</a>)}
            </div>
            <ul className="trust">{['trust.1', 'trust.2', 'trust.3', 'trust.4'].map(k => <li key={k}><Check />{t(lang, k)}</li>)}</ul>
          </div>
          {feat ? (
            <div className="viz-wrap">
              <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 14px 40px rgba(13,41,66,.12)', padding: 18, textAlign: 'center' }}>
                <Thumb photo={photoOf(data, feat.p, 360, 300)} w={360} h={300} />
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>{t(lang, 'viz.low')}</p>
                <p style={{ fontSize: 28, fontWeight: 800 }}><Money>{mt(feat.best.total)}</Money></p>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t(lang, 'viz.save', { x: mt(feat.save) })} · {t(lang, 'stores', { n: feat.n })}</p>
              </div>
              <a className="viz-cta" href={href(lang, market, '/p/' + feat.p.id)} aria-label={t(lang, 'viz.buy', { p: nm(lang, feat.p), s: feat.best.store.name })}>
                <span className="vc-logo"><LogoBox name={feat.best.store.name} color={feat.best.store.color || '#0D2942'} domain={dom(feat.best.store.id)} /></span>
                <span className="vc-info"><span className="vc-best">{t(lang, 'bestTag')} · {feat.best.store.name}</span><span className="vc-name" dir="auto">{nm(lang, feat.p)}</span></span>
                <b className="vc-price money">{mt(feat.best.total)}</b><span className="vc-go" aria-hidden="true"><Arrow /></span>
              </a>
            </div>
          ) : null}
        </div>
        <div className="wrap">
          <section className="promo" aria-labelledby="promoT">
            <div className="promo-copy"><span className="app-pill">{t(lang, 'promo.pill')}</span><h2 id="promoT">{t(lang, 'promo.title')}</h2><p>{t(lang, 'promo.text')}</p>
              <div className="promo-btns"><a className="btn primary" href={href(lang, market, '/deals')}>{t(lang, 'promo.cta')}</a><a className="btn ghost-light" href={href(lang, market, '/about')}>{t(lang, 'promo.cta2')}</a></div>
            </div>
            <div className="promo-visual" role="img" aria-label={t(lang, 'promo.alt')}>
              <span className="promo-circle" aria-hidden="true" />
              <svg className="pn-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {nodes.map((n, i) => <line key={i} x1="29.5" y1="45.5" x2={n.x} y2={n.y} pathLength={1} style={{ '--i': i } as React.CSSProperties} />)}
              </svg>
              <span className="promo-person"><img src="/assets/hero-person.png" alt="" width={322} height={488} loading="eager" decoding="async" /></span>
              {nodes.map((n, i) => <span key={i} className={'pn pn' + (i + 1) + (n.cls ? ' ' + n.cls : '')} style={{ left: n.x + '%', top: n.y + '%', '--i': i } as React.CSSProperties}><b>{n.a}</b><small>{n.b}</small></span>)}
            </div>
          </section>
        </div>
      </section>

      <section className="sec tight"><div className="wrap"><h2 className="sr">{t(lang, 'sec.cats')}</h2>
        <div className="circles">
          {data.CATEGORIES.flatMap(c => c.subs.map(s => ({ c, s, it: all.find(i => i.p.cat === c.id && i.p.sub === s.id) }))).map(({ c, s, it }) => (
            <a key={c.id + s.id} className="circle" href={href(lang, market, '/c/' + c.id + '/' + s.id)}>
              <span className="circle-img" style={{ '--tint': c.tint } as React.CSSProperties}>{it ? <Thumb photo={photoOf(data, it.p, 144, 144)} w={144} h={144} /> : null}</span>
              <span className="circle-label">{nm(lang, s)}</span>
            </a>
          ))}
        </div></div></section>

      <section className="sec alt"><div className="wrap">
        <div className="sec-h"><h2>{t(lang, 'sec.drops')}</h2><a href={href(lang, market, '/deals')}>{t(lang, 'all')}</a></div>
        <div className="grid4">{drops.map(i => <ProductCard key={i.p.id} item={i} lang={lang} market={market} data={data} />)}</div>
      </div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-h"><h2>{t(lang, 'sec.pop')}</h2></div>
        <div className="sq-grid pop">{popularRows.map(i => <ListCard key={i.p.id} item={i} lang={lang} market={market} data={data} />)}</div>
      </div></section>

      <section className="sec alt"><div className="wrap">
        <div className="sec-h"><h2>{t(lang, 'sec.how')}</h2></div>
        <div className="steps">{[1, 2, 3].map(n => <div className="step" key={n}><div className="n">{n}</div><h3>{t(lang, 'how.' + n)}</h3><p>{t(lang, 'how.' + n + 'd')}</p></div>)}</div>
      </div></section>

      <section className="sec about-sec" id="about"><div className="wrap"><div className="ab-panel">
        <div className="ab-panel-t"><span className="app-pill">{t(lang, 'about.sec')}</span><h2>{t(lang, 'about.h')}</h2><p>{about.lead}</p>
          <div className="ab-panel-stats"><span><b>4</b>{t(lang, 'about.stat1')}</span><span><b>2</b>{t(lang, 'about.stat2')}</span><span><b>{t(lang, 'about.free')}</b>{t(lang, 'about.stat3')}</span></div>
          <a className="btn primary" href={href(lang, market, '/about')}>{t(lang, 'about.more')}</a></div>
        <div className="ab-panel-v"><figure><img src="/assets/about-hero.jpg" alt="" width={1200} height={833} loading="lazy" decoding="async" /></figure>
          <div className="ab-fc m"><small>{t(lang, 'about.mission')}</small><p>{about.blocks[1][1]}</p></div>
          <div className="ab-fc v"><small>{t(lang, 'about.vision')}</small><p>{about.blocks[2][1]}</p></div></div>
      </div></div></section>

      <section className="sec"><div className="wrap">
        <div className="sec-h"><h2>{t(lang, 'sec.stores', { m: nm(lang, MARKET_NAMES[market]) })}</h2></div>
        <div className="tiles">{(data.STORES[market] || []).slice(0, 12).map((s: any) => (
          <a key={s.id} className="tile" href={href(lang, market, '/search?q=' + encodeURIComponent(s.name))}><LogoBox name={s.name} color={s.color || '#0D2942'} domain={dom(s.id)} big /><span>{s.name}</span></a>
        ))}</div>
      </div></section>

      <section className="sec alt"><div className="wrap">
        <div className="sec-h"><h2>{t(lang, 'sec.brands')}</h2></div>
        <div className="tiles brands">{Object.keys(BRAND_DOMAINS).map(b => (
          <a key={b} className="tile" href={href(lang, market, '/search?q=' + encodeURIComponent(b))}><LogoBox name={b} color="#0D2942" domain={(BRAND_DOMAINS as Record<string, string>)[b]} big /><span>{b}</span></a>
        ))}</div>
      </div></section>

      <AppBanner items={all} lang={lang} market={market} data={data} />
    </>
  );
}
