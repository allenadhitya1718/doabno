import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LANGS, MARKETS, isLang, isMarket, t, href, alternates, type Lang, type Market } from '@/lib/site';
import { ABOUT, ABOUT_UI } from '@/lib/strings';
import { ABOUT_ILLUS } from '@/components/product/aboutIllus';

type Params = { lang: string; market: string };
type AboutDoc = { title: string; lead: string; blocks: [string, any][] }; // eslint-disable-line @typescript-eslint/no-explicit-any
type AboutUi = {
  pill: string; h1: string; cta1: string; cta2: string; stats: string[][]; mission: string; vision: string; obj: string; objSub: string; objCta: string;
  objT: string[]; story: string; story2: string; pts: string[][]; how: string; howSub: string; steps: string[][]; earn: string; do: string;
  contact: string; contactSub: string; mail: string;
};
const about = ABOUT as unknown as Record<string, AboutDoc>;
const aboutUi = ABOUT_UI as unknown as Record<string, AboutUi>;

export function generateStaticParams() {
  return LANGS.flatMap(lang => MARKETS.map(market => ({ lang, market })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) return {};
  const d = about[lang] || about.en;
  return { title: { absolute: d.title + ' | DOABNO' }, description: d.lead, alternates: alternates(lang, 'sa', '/about') };
}

const IC: Record<string, string> = {
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
  tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 7.5h.01', clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2', shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3zM8.5 12l2.5 2.5L15.5 10',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3', globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', search: 'M11 4a7 7 0 110 14 7 7 0 010-14zM20 20l-4-4',
  scale: 'M12 4v16M5 8h14M5 8l-2 6a3 3 0 006 0L7 8M19 8l-2 6a3 3 0 006 0l-2-6', bell: 'M6 16V11a6 6 0 1112 0v5l2 2H4l2-2zM10 20a2 2 0 004 0', heart: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  phone: 'M8 3h8a1 1 0 011 1v16a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1zM11 18h2', mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
};
const Svg = ({ p }: { p: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d={p} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const objIc = ['tag', 'clock', 'scale', 'lock', 'globe'], doIc = ['search', 'scale', 'bell', 'phone'];

export default async function AboutPage({ params }: { params: Promise<Params> }) {
  const { lang, market } = await params;
  if (!isLang(lang) || !isMarket(market)) notFound();
  const L: Lang = lang, M: Market = market;
  const d = about[L] || about.en, u = aboutUi[L] || aboutUi.en, B = d.blocks;

  return (
    <div className="about-page">
      <section className="ab-hero">
        <div className="wrap ab-hero-in">
          <div>
            <span className="app-pill">{u.pill}</span>
            <h1 dangerouslySetInnerHTML={{ __html: u.h1 }} />
            <p className="ab-lede">{d.lead}</p>
            <div className="ab-ctas">
              <Link className="btn primary" href={href(L, M)}>{u.cta1}</Link>
              <Link className="btn ghost" href={href(L, M, '/legal/privacy')}>{u.cta2}</Link>
            </div>
          </div>
          <div className="ab-visual">
            <figure className="ab-photo">{/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/about-hero.jpg" alt="" width={1200} height={833} loading="eager" decoding="async" /></figure>
            <span className="ab-float f1">↓ 18%<small>{t(L, 'pn.drop')}</small></span>
            <span className="ab-float f2">SAR 3,914<small>Carrefour · {t(L, 'pn.best')}</small></span>
            <span className="ab-float f3">{t(L, 'pn.free')}<small>noon</small></span>
          </div>
        </div>
      </section>

      <section className="ab-stats"><div className="wrap"><div className="ab-stat-grid">
        {u.stats.map((x, i) => <div className="ab-stat" key={i}><b>{x[0]}</b><strong>{x[1]}</strong><span>{x[2]}</span></div>)}
      </div></div></section>

      <section className="ab-sec"><div className="wrap"><div className="ab-duo">
        <article className="ab-big navy">
          <div className="ab-big-img">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/about-mission.jpg" alt="" width={1200} height={833} loading="lazy" decoding="async" /></div>
          <div className="ab-big-b"><span className="ab-ic"><Svg p={IC.target} /></span><h2>{u.mission}</h2><p>{B[1][1]}</p></div>
        </article>
        <article className="ab-big orange">
          <div className="ab-big-img">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/assets/about-vision.jpg" alt="" width={1200} height={833} loading="lazy" decoding="async" /></div>
          <div className="ab-big-b"><span className="ab-ic"><Svg p={IC.eye} /></span><h2>{u.vision}</h2><p>{B[2][1]}</p></div>
        </article>
      </div></div></section>

      <section className="ab-sec alt"><div className="wrap ab-work">
        <aside className="ab-work-intro"><span className="ab-work-pill">05</span><h2>{u.obj}</h2><p>{u.objSub}</p><a className="btn primary" href="#how">{u.objCta}</a></aside>
        <ol className="ab-work-list">
          {(B[3][1] as string[]).map((x, i) => (
            <li className="ab-work-i" key={i}>
              <span className="ab-work-n">0{i + 1}</span><span className="ab-ic sm"><Svg p={IC[objIc[i]]} /></span>
              <div><h3>{u.objT[i]}</h3><p>{x}</p></div>
            </li>
          ))}
        </ol>
      </div></section>

      <section className="ab-sec"><div className="wrap ab-story">
        <div>
          <h2>{u.story}</h2><p>{B[4][1]}</p><p>{u.story2}</p>
          <ul className="ab-pts">
            {u.pts.map((x, i) => (
              <li key={i}><span className="ab-ic sm"><Svg p={IC[['globe', 'tag', 'bell'][i]]} /></span><div><b>{x[0]}</b><span>{x[1]}</span></div></li>
            ))}
          </ul>
        </div>
        <div className="ab-illus" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ABOUT_ILLUS }} />
      </div></section>

      <section className="ab-sec alt" id="how"><div className="wrap">
        <div className="ab-title"><h2>{u.how}</h2><p>{u.howSub}</p></div>
        <div className="ab-steps">
          {u.steps.map((x, i) => <div className="ab-step" key={i}><span className="ab-num">{i + 1}</span><h3>{x[0]}</h3><p>{x[1]}</p></div>)}
        </div>
        <div className="ab-earn"><span className="ab-ic sm"><Svg p={IC.shield} /></span><div><h3>{u.earn}</h3><p>{B[5][1]}</p></div></div>
      </div></section>

      <section className="ab-sec"><div className="wrap">
        <div className="ab-title"><h2>{u.do}</h2></div>
        <div className="ab-do">
          {(B[6][1] as string[]).map((x, i) => <div className="ab-do-i" key={i}><span className="ab-ic sm"><Svg p={IC[doIc[i]]} /></span><p>{x}</p></div>)}
        </div>
      </div></section>

      <section className="ab-cta"><div className="wrap"><div className="ab-cta-in">
        <div><h2>{u.contact}</h2><p>{u.contactSub}</p></div>
        <div className="ab-ctas">
          <a className="btn primary" href="mailto:hello@doabno.com">{u.mail}</a>
          <Link className="btn ghost-light" href={href(L, M)}>{u.cta1}</Link>
        </div>
      </div></div></section>
    </div>
  );
}
