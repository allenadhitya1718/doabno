import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LANGS, MARKETS, isLang, isMarket, t, nm, href, moneyText, alternates, abs, type Lang, type Market } from '@/lib/site';
import { getData, getItems, getItem, REVALIDATE_SECONDS, type Item } from '@/lib/catalog';
import { productJsonLd, breadcrumbJsonLd, jsonLdString } from '@/lib/jsonld';
import { ProductCard } from '@/components/cards';
import { Money, Fresh } from '@/components/product/format';
import { OfferTable } from '@/components/product/OfferTable';
import { Gallery, type Photo } from '@/components/product/Gallery';
import { PriceHistory } from '@/components/product/PriceHistory';
import { FavToggle } from '@/components/product/FavToggle';
import { AlertButton } from '@/components/product/AlertButton';
import { VisitStore } from '@/components/product/VisitStore';

export const revalidate = 900;

type Params = { lang: string; market: string; productId: string };

export async function generateStaticParams() {
  const out: Params[] = [];
  for (const market of MARKETS) {
    const items = await getItems(market);
    for (const lang of LANGS) for (const it of items) out.push({ lang, market, productId: it.p.id });
  }
  return out;
}

const storesLabel = (lang: Lang, n: number) => (n === 1 ? t(lang, 'store1') : t(lang, 'stores', { n }));

async function photosOf(item: Item): Promise<Photo[]> {
  const { data } = await getData();
  return ((item.p.photos || []) as { id: string }[]).slice(0, 5).map(ph => ({
    big: data.photoUrl(ph.id, 140, 140),
    big2: data.photoUrl(ph.id, 280, 280),
    small: data.photoUrl(ph.id, 72, 72),
  }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, market, productId } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  const it = await getItem(market, productId);
  if (!it) return {};
  const { data } = await getData();
  const cur = data.MARKETS[market].currency;
  const name = nm(lang, it.p);
  const title = name + ' | DOABNO';
  const desc = (lang === 'ar' ? 'قارن أسعار ' : 'Compare prices for ') + name + ' ' + (lang === 'ar' ? 'من ' : 'from ') +
    moneyText(lang, data.CURRENCIES, cur, it.best.total) + ' ' + (lang === 'ar' ? 'عبر ' + it.n + ' متاجر.' : 'across ' + it.n + ' stores.');
  const photos = await photosOf(it);
  const ph = (it.p.photos || [])[0];
  const image = ph ? data.photoUrl(ph.id, 1200, 630) : photos[0]?.big2;
  return {
    title: { absolute: title },
    description: desc,
    alternates: alternates(lang, market, '/p/' + productId),
    openGraph: {
      type: 'website',
      title,
      description: desc,
      url: abs(href(lang, market, '/p/' + productId)),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function similarOf(items: Item[], it: Item): Item[] {
  const p = it.p;
  return items
    .filter(i => i.p.id !== p.id)
    .map(i => ({ i, s: (i.p.sub === p.sub ? 2 : 0) + (i.p.cat === p.cat ? 1 : 0) + (i.p.brand === p.brand ? 0.5 : 0) }))
    .filter(x => x.s >= 1)
    .sort((a, b) => b.s - a.s || Math.abs(a.i.best.total - it.best.total) - Math.abs(b.i.best.total - it.best.total))
    .slice(0, 4)
    .map(x => x.i);
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { lang, market, productId } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const L: Lang = lang, M: Market = market;
  const it = await getItem(M, productId);
  if (!it) notFound();

  const { data, live } = await getData();
  const items = await getItems(M);
  const p = it.p, b = it.best;
  const cur = data.MARKETS[M].currency;
  const c = data.CATEGORIES.find(x => x.id === p.cat);
  const sub = c && c.subs.find(s => s.id === p.sub);

  const series: Record<string, number[]> = {};
  for (const d of [30, 90, 180]) series[String(d)] = data.historyFor(p, M, d);
  const h30 = series['30'];
  const avg = h30.reduce((s, v) => s + v, 0) / h30.length;
  const diff = avg - b.price;

  const photos = await photosOf(it);
  const photo0 = (p.photos || [])[0];
  const ogImage = photo0 ? data.photoUrl(photo0.id, 1200, 630) : undefined;
  const money = (() => {
    const sym = data.CURRENCIES[cur] ? data.CURRENCIES[cur][L] : cur;
    return { sym, isSym: /^[^A-Za-z؀-ۿ]/.test(sym), ar: L === 'ar' };
  })();
  const near = similarOf(items, it);
  const txt = (v: number) => moneyText(L, data.CURRENCIES, cur, v);
  const M$ = (v: number, dec?: boolean) => <Money lang={L} data={data} currency={cur} v={v} dec={dec} />;

  const ld = productJsonLd({ item: it, lang: L, market: M, currency: cur, image: ogImage });
  const crumbLd = breadcrumbJsonLd({ lang: L, market: M, homeLabel: t(L, 'home'), cat: c, sub, productName: nm(L, p), productId: p.id });

  return (
    <div className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(crumbLd) }} />
      <div className="wrap">
        <div className="crumbs">
          <Link href={href(L, M)}>{t(L, 'home')}</Link> /{' '}
          {c ? <Link href={href(L, M, '/c/' + c.id)}>{nm(L, c)}</Link> : null}
          {c && sub ? <> / <Link href={href(L, M, '/c/' + c.id + '/' + sub.id)}>{nm(L, sub)}</Link></> : null}
        </div>
        <div className="phead">
          <Gallery photos={photos.slice(0, 1)} />
          <div>
            <h1 dir="auto">{nm(L, p)}</h1>
            <div className="pmeta">
              <span>{p.brand}</span>
              <span><span className="stars" aria-hidden="true">★</span> <b>{p.rating}</b> · {t(L, 'p.reviews', { n: Number(p.reviews).toLocaleString('en-US') })}</span>
              <span>{storesLabel(L, it.n)}</span>
            </div>
          </div>
        </div>
        <div className="pgrid">
          <div>
            <section className="card">
              <h2>{t(L, 'p.compare')}</h2>
              <OfferTable lang={L} data={data} offers={it.offers} best={b} live={live} />
            </section>
            <section className="card">
              <h2>{t(L, 'p.history')}</h2>
              <PriceHistory
                series={series}
                current={b.price}
                money={money}
                labels={{ hi: t(L, 'p.hi'), cur: t(L, 'p.cur'), lo: t(L, 'p.lo'), title: t(L, 'p.history'), d30: t(L, 'p.d30'), d90: t(L, 'p.d90'), d180: L === 'ar' ? '180 يومًا' : '180 days' }}
              />
            </section>
            <section className="card">
              <h2>{t(L, 'p.specs')}</h2>
              <ul className="specs">{(nm(L, p.specs) as unknown as string[]).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </section>
            {near.length ? (
              <section className="card">
                <h2>{t(L, 'p.similar')}</h2>
                <div className="grid4 similar">
                  {near.map(i => <ProductCard key={i.p.id} item={i} lang={L} market={M} data={data} />)}
                </div>
              </section>
            ) : null}
          </div>
          <aside>
            <div className="card best-card">
              <div className="lbl">{t(L, 'p.bestTotal')}</div>
              <div className="big">{M$(b.total)}</div>
              {Math.abs(diff) >= 1 ? (
                <div className="vs">{diff > 0 ? '↓ ' + t(L, 'p.vs', { x: txt(diff) }) : '↑ ' + t(L, 'p.vsUp', { x: txt(-diff) })}</div>
              ) : null}
              <div style={{ marginTop: 6 }}><Fresh lang={L} o={b} /></div>
              <div className="bd">
                <div><span>{t(L, 'p.product')}</span>{M$(b.price, true)}</div>
                <div><span>{t(L, 'p.delivery')}</span>{b.shipping ? M$(b.shipping, true) : <span>{t(L, 'free')}</span>}</div>
                <div className="tot"><span>{t(L, 'p.total')}</span>{M$(b.total, true)}</div>
              </div>
              <div className="bc-actions">
                <VisitStore storeName={b.store.name} trackingId={b.trackingId} hasUrl={!!b.url} label={t(L, 'p.visit', { s: b.store.name })} primary block
                  redirectMsg={t(L, 'redirect', { s: b.store.name })} noLinkMsg={t(L, 'noLink', { s: b.store.name })} live={live} />
                <p className="fine">{t(L, 'p.incl')} {t(L, 'p.disc')}</p>
                <AlertButton
                  id={p.id}
                  defaultTarget={Math.floor(b.total * 0.95)}
                  currency={cur}
                  money={money}
                  privacyHref={href(L, M, '/legal/privacy')}
                  labels={{
                    alert: t(L, 'p.alert'), alertOn: t(L, 'p.alertOn'), title: t(L, 'al.title'), sub: t(L, 'al.sub'), target: t(L, 'al.target'),
                    email: t(L, 'al.email'), consent: t(L, 'al.consent'), privacy: t(L, 'foot.privacy'), create: t(L, 'al.create'),
                    errT: t(L, 'al.errT'), err: t(L, 'al.err'), done: t(L, 'al.done'),
                  }}
                />
                <FavToggle id={p.id} saveLabel={t(L, 'p.save')} savedLabel={t(L, 'p.saved')} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
