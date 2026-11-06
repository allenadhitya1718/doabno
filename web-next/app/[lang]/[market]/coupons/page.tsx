import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isLang, isMarket, t, nm, href, alternates, type Lang, type Market } from '@/lib/site';
import { getData, REVALIDATE_SECONDS } from '@/lib/catalog';
import { MK } from '@/lib/strings';
import { StoreDot } from '@/components/product/format';
import { CopyCode } from '@/components/product/InfoClient';

export const revalidate = 900;

type Params = { lang: string; market: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  const title = t(lang, 'cp.title') + ' | DOABNO';
  return { title: { absolute: title }, description: t(lang, 'cp.sub', { m: nm(lang, (MK as Record<string, { en: string; ar: string }>)[market]) }), alternates: alternates(lang, market, '/coupons') };
}

export default async function CouponsPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ cat?: string | string[] }> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const L: Lang = lang, M: Market = market;
  const sp = await searchParams;
  const cat = Array.isArray(sp.cat) ? sp.cat[0] : sp.cat;
  const { data } = await getData();
  const list = data.COUPONS.filter(c => c.market === M && c.active !== false && c.days >= 0);
  const shown = cat ? list.filter(c => c.cat === cat) : list;
  const storeOf = (c: { store: string }) => (data.STORES[M] || []).find(s => s.name === c.store) || { id: '', name: c.store, color: '#0D2942' };

  return (
    <div className="page">
      <div className="wrap">
        <div className="crumbs"><Link href={href(L, M)}>{t(L, 'home')}</Link> / {t(L, 'coupons')}</div>
        <div className="page-h"><div><h1>{t(L, 'cp.title')}</h1><p>{t(L, 'cp.sub', { m: nm(L, (MK as Record<string, { en: string; ar: string }>)[M]) })}</p></div></div>
        <div className="chips-row">
          <Link className={'chip' + (!cat ? ' on' : '')} href={href(L, M, '/coupons')}>{t(L, 'cp.all')}</Link>
          {data.CATEGORIES.map(c => (
            <Link key={c.id} className={'chip' + (cat === c.id ? ' on' : '')} href={href(L, M, '/coupons') + '?cat=' + c.id}>{nm(L, c)}</Link>
          ))}
        </div>
        {shown.length ? (
          <div className="coupons">
            {shown.map(c => (
              <div className="coupon" key={c.store + c.code}>
                <div className="cp-top">
                  <StoreDot store={storeOf(c)} big />
                  <div><b>{c.store}</b><span>{nm(L, c)}</span></div>
                </div>
                <div className="cp-code"><code className="ltr">{c.code}</code><CopyCode code={c.code} label={t(L, 'cp.copy')} copied={t(L, 'cp.copied')} /></div>
                <div className="cp-foot">
                  <span>{c.days === 0 ? t(L, 'cp.exp0') : t(L, 'cp.exp', { n: c.days })}</span>
                  <Link href={href(L, M, '/search') + '?q=' + encodeURIComponent(c.store)}>{t(L, 'cp.shop', { s: c.store })}</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty"><h3>{t(L, 'cp.none')}</h3></div>
        )}
      </div>
    </div>
  );
}
