'use client';
/* Animated hero comparison (port of vizStart / vizStop / vizHold / countTo from web-v2/v2.js).
 * Phases p0..p4 are CSS classes on .viz; the first frame is server-rendered in its final state ("static") so the HTML already has
 * the product and its prices. Once mounted it replays the loop, unless the visitor prefers reduced motion. */
import { useEffect, useRef, useState } from 'react';
import { fmt, href, type Tx } from './clientlib';
import { fmtIn, convert, useChosenCurrency, type CurrencyInfo } from './currency';
import { HERO_QUERY_EVENT } from './HeroSearch';
import { Dot } from './product/Dot';
import { Arrow, SearchIcon } from './ui';
import type { VizItem } from './vizdata';

const NODE_POS = [[50, 14], [84, 35], [77, 86], [23, 86], [16, 35]];
const STATIC = 'viz p0 p1 p2 p3 static';

export function HeroViz({ lang, market, items, featId, stores, tx, cx }: {
  lang: string; market: string; items: VizItem[]; featId: string; stores: { id: string; name: string }[]; tx: Tx; cx: CurrencyInfo;
}) {
  const [id, setId] = useState(featId);
  const [cls, setCls] = useState(STATIC);
  const [status, setStatus] = useState(3);
  const [size, setSize] = useState({ W: 430, H: 378 });
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [held, setHeld] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const code = useChosenCurrency(cx);
  const money = (v: number) => fmtIn(cx, code, convert(cx, v, cx.market, code));
  const moneyRef = useRef(money);
  moneyRef.current = money;

  const it = items.find(x => x.id === id) || items[0];
  const lastId = useRef(featId);

  // Measure once mounted (v2 reads clientWidth/clientHeight), then keep the lines in step with the box size.
  useEffect(() => {
    const e = el.current;
    if (!e) return;
    setReduced(matchMedia('(prefers-reduced-motion: reduce)').matches);
    const measure = () => setSize(s => {
      const W = e.clientWidth || 460, H = e.clientHeight || 440;
      return s.W === W && s.H === H ? s : { W, H };
    });
    measure();
    setReady(true);
    let tm: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => { clearTimeout(tm); tm = setTimeout(measure, 250); };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(tm); window.removeEventListener('resize', onResize); };
  }, []);

  // The hero search box switches the featured product (debounced 450 ms, same matching as matchItems()).
  useEffect(() => {
    const norm = (s: string) => s.toLowerCase();
    let tm: ReturnType<typeof setTimeout> | undefined;
    const onQuery = (ev: Event) => {
      const value = String((ev as CustomEvent).detail ?? '');
      clearTimeout(tm);
      tm = setTimeout(() => {
        const q = value.trim();
        let hit: VizItem | undefined;
        if (!q) hit = items.find(x => x.id === featId) || items[0];
        else {
          const toks = norm(q).split(/\s+/).filter(Boolean);
          const storeHit = stores.find(s => norm(s.name) === norm(q));
          hit = items.find(x => (storeHit ? x.storeIds.includes(storeHit.id) : toks.every(tk => x.hay.includes(tk))));
        }
        if (hit && hit.id !== lastId.current) { lastId.current = hit.id; setId(hit.id); }
      }, 450);
    };
    window.addEventListener(HERO_QUERY_EVENT, onQuery);
    return () => { clearTimeout(tm); window.removeEventListener(HERO_QUERY_EVENT, onQuery); };
  }, [items, featId, stores]);

  // The animation loop. Everything it starts is cleared on cleanup (item change, hover, resize, unmount).
  useEffect(() => {
    const root = el.current;
    if (!ready || !root || !it) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0, alive = true;
    const vps = () => Array.from(root.querySelectorAll<HTMLElement>('.vp'));
    if (reduced || held) {
      setCls(STATIC); setStatus(3);
      vps().forEach((p, i) => { if (it.nodes[i]) p.textContent = moneyRef.current(it.nodes[i].total); });
      return () => { alive = false; };
    }

    const countTo = (e: HTMLElement | null, from: number, to: number, ms: number) => {
      if (!e) return;
      const t0 = performance.now();
      (function step(now: number) {
        if (!alive || !e.isConnected) return;
        const k = Math.min(1, (now - t0) / ms), ease = 1 - Math.pow(1 - k, 3);
        e.textContent = moneyRef.current(from + (to - from) * ease);
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    };
    const at = (ms: number, fn: () => void) => { timers.push(setTimeout(() => { if (alive) fn(); }, ms)); };
    const add = (c: string) => setCls(s => s + ' ' + c);
    const big = root.querySelector<HTMLElement>('.vz-result b');
    setStatus(0);
    const run = () => {
      setCls('viz');
      at(60, () => add('p0'));
      at(600, () => { add('p1'); setStatus(1); });
      at(2100, () => {
        add('p2'); setStatus(2);
        vps().forEach((p, i) => { const f = it.nodes[i].total; countTo(p, f * (1.05 + 0.05 * ((i * 37) % 5) / 4), f, 1000 + i * 90); });
      });
      at(3600, () => { add('p3'); setStatus(3); countTo(big, it.bestTotal * 1.06, it.bestTotal, 900); });
      at(5500, () => { add('p4'); setStatus(4); });
      at(8200, () => add('out'));
      at(8900, run);
    };
    run();
    return () => { alive = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf); };
  }, [it, ready, reduced, held, size.W, size.H]);

  if (!it) return null;
  const { W, H } = size;
  const hist = it.hist, mn = Math.min(...hist, it.bestPrice), mx = Math.max(...hist, it.bestPrice), rg = (mx - mn) || 1;
  const pts = hist.map((x, i) => [i * 300 / (hist.length - 1), 12 + (1 - (x - mn) / rg) * 86]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const end = pts[pts.length - 1];
  const best = it.nodes.find(n => n.best) || it.nodes[0];
  const p0 = href(lang, market, '/p/' + it.id);
  const buy = (s: string) => fmt(tx['viz.buy'], { p: it.name, s });

  return (
    <div className="viz-wrap">
      <div className={cls} id="viz" ref={el}
        onMouseEnter={() => { if (ready && !reduced) setHeld(true); }}
        onMouseLeave={() => setHeld(false)}>
        <div className="vz-status" id="vzStatus"><i /><span>{fmt(tx['viz.s' + status], { n: it.n })}</span></div>
        <svg className="vz-lines" viewBox={`0 0 ${W} ${H}`}>
          {it.nodes.map((o, i) => (
            <line key={o.name + i} x1={W / 2} y1={H / 2} x2={NODE_POS[i][0] * W / 100} y2={NODE_POS[i][1] * H / 100} pathLength={1}
              className={'vz-line' + (o.best ? ' best' : '')} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </svg>
        <div className="vz-core">
          <div className="vz-ring" /><div className="vz-ring r2" />
          <div className="vz-chip"><SearchIcon size={16} /><span dir="auto">{it.name}</span></div>
          <div className="vz-result"><small>{tx['viz.low']}</small><b className="money">{money(it.bestTotal)}</b>
            <span className="vz-save">{fmt(tx['viz.save'], { x: money(it.hi - it.bestTotal) })}</span></div>
        </div>
        {it.nodes.map((o, i) => (
          <a key={o.name + i} className={'vz-node' + (o.best ? ' best' : '')} href={p0} aria-label={buy(o.name)}
            style={{ left: NODE_POS[i][0] + '%', top: NODE_POS[i][1] + '%', '--i': i } as React.CSSProperties}>
            <Dot name={o.name} color={o.color} domain={o.domain} />
            <span className="vn"><b>{o.name}</b><span className="vp money">{money(o.total)}</span></span>
            <i className="vz-tag">{tx.bestTag}</i>
          </a>
        ))}
        {it.more > 0 ? <div className="vz-more">{fmt(tx['viz.more'], { n: it.more })}</div> : null}
        <div className="vz-hist">
          <div className="vh-top"><span className="vh-chip">{it.dropPct >= 1 ? fmt(tx['viz.drop'], { n: it.dropPct }) : tx['viz.today']}</span></div>
          <div className="vh-plot">
            <svg viewBox="0 0 300 110" preserveAspectRatio="none">
              <path d={path + ' L300 110 L0 110 Z'} className="vh-area" />
              <path d={path} pathLength={1} className="vh-line" />
            </svg>
            <span className="vh-dot" style={{ left: (end[0] / 3) + '%', top: (end[1] / 110 * 100) + '%' }} />
          </div>
          <b className="vh-price money">{money(it.bestTotal)}</b>
        </div>
      </div>
      <p className="sr" id="vizAlt">{fmt(tx['viz.alt'], { p: it.name, n: it.n, x: money(it.bestTotal) })}</p>
      <a className="viz-cta" id="vizCta" href={p0} aria-label={buy(best.name)}>
        <span className="vc-logo"><Dot name={best.name} color={best.color} domain={best.domain} /></span>
        <span className="vc-info"><span className="vc-best">{tx.bestTag} · {best.name}</span><span className="vc-name" dir="auto">{it.name}</span></span>
        <b className="vc-price money">{money(it.bestTotal)}</b><span className="vc-go" aria-hidden="true"><Arrow /></span>
      </a>
    </div>
  );
}
