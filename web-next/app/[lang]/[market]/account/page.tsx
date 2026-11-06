import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LANGS, MARKETS, isLang, isMarket, t, href, type Lang, type Market } from '@/lib/site';

type Params = { lang: string; market: string };

export function generateStaticParams() {
  return LANGS.flatMap(lang => MARKETS.map(market => ({ lang, market })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: { absolute: t(lang, 'ac.title') + ' | DOABNO' }, robots: { index: false, follow: false } };
}

/* Placeholder: sign-in and account sync still live in web-v2. */
export default async function AccountPage({ params }: { params: Promise<Params> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const L: Lang = lang, M: Market = market;
  return (
    <div className="page">
      <div className="wrap acc">
        <div className="page-h"><div><h1>{t(L, 'ac.title')}</h1></div></div>
        <section className="card">
          <p>{L === 'ar' ? 'تسجيل الدخول وإدارة الحساب ما زالا يعملان في النسخة الحالية من الموقع (web-v2). سننقلهما إلى هذه النسخة قريبًا.' : 'Sign-in and account management are still handled in web-v2 for now. They will move to this version soon.'}</p>
          <p>
            <Link className="btn ghost sm" href={href(L, M, '/favorites')}>{t(L, 'favsNav')}</Link>{' '}
            <Link className="btn ghost sm" href={href(L, M, '/alerts')}>{t(L, 'alerts')}</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
