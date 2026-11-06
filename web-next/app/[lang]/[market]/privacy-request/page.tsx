import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LANGS, MARKETS, isLang, isMarket, t, href, alternates, type Lang, type Market } from '@/lib/site';
import { PrivacyRequestForm } from '@/components/product/InfoClient';

type Params = { lang: string; market: string };

export function generateStaticParams() {
  return LANGS.flatMap(lang => MARKETS.map(market => ({ lang, market })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  return { title: { absolute: t(lang, 'pr.title') + ' | DOABNO' }, description: t(lang, 'pr.sub'), alternates: alternates(lang, 'sa', '/privacy-request') };
}

const TYPES = ['access', 'correct', 'delete', 'restrict', 'port', 'object', 'consent', 'optout'];

export default async function PrivacyRequestPage({ params }: { params: Promise<Params> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const L: Lang = lang, M: Market = market;
  return (
    <div className="page">
      <div className="wrap legal">
        <div className="crumbs">
          <Link href={href(L, M)}>{t(L, 'home')}</Link> / <Link href={href(L, M, '/legal/privacy')}>{t(L, 'foot.privacy')}</Link> / {t(L, 'pr.title')}
        </div>
        <h1>{t(L, 'pr.title')}</h1>
        <p>{t(L, 'pr.sub')}</p>
        <PrivacyRequestForm
          notConnected={L === 'ar' ? 'هذا النموذج غير متصل بالخادم بعد، ولا يُرسل شيء.' : 'This form is not connected to a back end yet; nothing is sent.'}
          labels={{
            type: t(L, 'pr.type'), name: t(L, 'pr.name'), email: t(L, 'pr.email'), details: t(L, 'pr.details'), confirm: t(L, 'pr.confirm'),
            send: t(L, 'pr.send'), demo: t(L, 'pr.demo'), err: t(L, 'pr.err'), doneT: t(L, 'pr.doneT'), doneP: t(L, 'pr.doneP'),
            types: TYPES.map(k => [k, t(L, 'pr.t.' + k)] as [string, string]),
          }}
        />
      </div>
    </div>
  );
}
