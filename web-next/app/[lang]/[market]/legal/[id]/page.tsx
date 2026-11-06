import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LANGS, MARKETS, isLang, isMarket, t, href, alternates, type Lang, type Market } from '@/lib/site';
import { LEGAL } from '@/lib/strings';
import { OptOutSwitch } from '@/components/product/InfoClient';

type Params = { lang: string; market: string; id: string };
type LegalDoc = Record<string, [string, [string, string][]]>;
const legal = LEGAL as unknown as Record<string, LegalDoc>;

export function generateStaticParams() {
  const out: Params[] = [];
  for (const lang of LANGS) for (const market of MARKETS) for (const id of Object.keys(legal)) out.push({ lang, market, id });
  return out;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, market, id } = await params;
  if (!isLang(lang) || !isMarket(market) || !legal[id]) return {};
  const [title, secs] = legal[id][lang] || legal[id].en;
  return {
    title: { absolute: title + ' | DOABNO' },
    description: secs[0] ? secs[0][1].slice(0, 160) : undefined,
    alternates: alternates(lang, 'sa', '/legal/' + id),
  };
}

export default async function LegalPage({ params }: { params: Promise<Params> }) {
  const { lang, market, id } = await params;
  if (!isLang(lang) || !isMarket(market) || !legal[id]) notFound();
  const L: Lang = lang, M: Market = market;
  const [title, secs] = legal[id][L] || legal[id].en;
  return (
    <div className="page">
      <div className="wrap legal">
        <div className="crumbs"><Link href={href(L, M)}>{t(L, 'home')}</Link> / {title}</div>
        <h1>{title}</h1>
        {secs.length > 8 ? (
          <nav className="toc" aria-label={t(L, 'toc')}>
            <b>{t(L, 'toc')}</b>
            <ol>{secs.map((x, i) => <li key={i}><a href={'#s' + i}>{x[0]}</a></li>)}</ol>
          </nav>
        ) : null}
        {secs.map((x, i) => (<div key={i}><h2 id={'s' + i}>{x[0]}</h2><p>{x[1]}</p></div>))}
        {id === 'privacy' ? <p><Link className="btn primary" href={href(L, M, '/privacy-request')}>{t(L, 'pr.link')}</Link></p> : null}
        {id === 'ccpa' ? <OptOutSwitch label={title} savedMsg={t(L, 'ac.saved')} /> : null}
        <p className="muted small">
          {L === 'ar' ? 'آخر تحديث: أكتوبر 2026. ' : 'Last updated: October 2026. '}
          {L === 'ar' ? 'نص تجريبي للمراجعة، يُستبدل بنص يعتمده المستشار القانوني قبل الإطلاق.' : 'Prototype text for review. Replace with copy approved by legal counsel before launch.'}
        </p>
      </div>
    </div>
  );
}
