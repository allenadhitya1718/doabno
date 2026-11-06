import { t, type Lang } from '@/lib/site';
import type { Data, Offer } from '@/lib/catalog';
import { Money, Fresh, StoreDot, CheckIcon } from './format';
import { VisitStore } from './VisitStore';

export function OfferTable({ lang, data, offers, best, live }: { lang: Lang; data: Data; offers: Offer[]; best: Offer; live: boolean }) {
  const m = (o: Offer, v: number) => <Money lang={lang} data={data} currency={o.currency} v={v} />;
  return (
    <table className="otable">
      <thead>
        <tr>
          <th>{t(lang, 'th.store')}</th><th className="num">{t(lang, 'th.price')}</th><th className="num">{t(lang, 'th.ship')}</th>
          <th className="num">{t(lang, 'th.total')}</th><th>{t(lang, 'th.stock')}</th><th></th>
        </tr>
      </thead>
      <tbody>
        {offers.map(o => (
          <tr key={o.trackingId || o.store.id} className={o === best ? 'best' : ''}>
            <td className="store-c">
              <div className="store">
                <StoreDot store={o.store} />
                <span>{o.store.name}{o === best ? <> <span className="tag best"><CheckIcon />{t(lang, 'bestTag')}</span></> : null}</span>
              </div>
              {o.promo ? <small><span className="tag tag-code">{t(lang, 'promo', { c: o.promo.code })}</span></small> : null}
            </td>
            <td className="p-c num money">{m(o, o.price)}</td>
            <td className="d-c num">{o.shipping ? m(o, o.shipping) : t(lang, 'free')}{o.days && o.days[0] != null && o.days[1] != null ? <small>{t(lang, 'days', { a: o.days[0], b: o.days[1] })}</small> : null}</td>
            <td className="tot-c num tot">{m(o, o.total)}</td>
            <td className="s-c">
              {o.inStock ? <span className="stock-ok">{t(lang, 'inStock')}</span> : <span className="stock-no">{t(lang, 'outStock')}</span>}
              <small><Fresh lang={lang} o={o} /></small>
            </td>
            <td className="a-c num">
              <VisitStore storeName={o.store.name} trackingId={o.trackingId} hasUrl={!!o.url} label={t(lang, 'visit')} primary={o === best} sm
                redirectMsg={t(lang, 'redirect', { s: o.store.name })} noLinkMsg={t(lang, 'noLink', { s: o.store.name })} live={live} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
