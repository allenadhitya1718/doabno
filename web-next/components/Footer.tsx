import { href, t, type Lang, type Market } from '../lib/site';
import { CookieReset } from './Chrome';

export function Footer({ lang, market }: { lang: Lang; market: Market }) {
  const a = (rest: string, k: string) => <a href={href(lang, market, rest)}>{t(lang, k)}</a>;
  return (
    <footer className="foot" id="foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <img src="/assets/brand/doabno-logo-primary.svg" alt="DOABNO" width={120} height={23} />
            <p>{t(lang, 'foot.about')}</p>
          </div>
          <div>
            <h2>{t(lang, 'foot.explore')}</h2>
            {a('/about', 'foot.aboutUs')}{a('/deals', 'deals')}{a('/coupons', 'coupons')}{a('/alerts', 'alerts')}{a('/favorites', 'favsNav')}
          </div>
          <div>
            <h2>{t(lang, 'foot.legal')}</h2>
            {a('/legal/privacy', 'foot.privacy')}{a('/legal/terms', 'foot.terms')}{a('/legal/disclaimer', 'foot.disclaimer')}{a('/legal/prices', 'foot.prices')}
            {a('/legal/cookies', 'foot.cookies')}{a('/legal/accessibility', 'foot.access')}{a('/legal/imprint', 'foot.imprint')}{a('/privacy-request', 'foot.privReq')}{a('/legal/ccpa', 'foot.ccpa')}
            <CookieReset label={t(lang, 'foot.cookieSet')} />
          </div>
        </div>
        <p className="foot-note">{t(lang, 'foot.note')}</p>
      </div>
    </footer>
  );
}
