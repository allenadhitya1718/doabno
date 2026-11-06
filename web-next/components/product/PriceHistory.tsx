'use client';
/* Price history with the 30/90/180-day switch. The series are computed on the server and passed in. */
import { useState } from 'react';

function chartPath(vals: number[]) {
  const W = 600, H = 190, pad = 10;
  const mn = Math.min(...vals), mx = Math.max(...vals), rg = mx - mn || 1;
  const pts = vals.map((v, i) => [pad + (i * (W - 2 * pad)) / Math.max(1, vals.length - 1), pad + 12 + (1 - (v - mn) / rg) * (H - 2 * pad - 24)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return { W, H, pts, line, last: pts[pts.length - 1] };
}

export type MoneyFmt = { sym: string; isSym: boolean; ar: boolean };

export function fmtMoney(v: number, m: MoneyFmt) {
  const n = v < 100 && !Number.isInteger(v)
    ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(v).toLocaleString('en-US');
  return m.isSym ? m.sym + n : m.ar ? n + ' ' + m.sym : m.sym + ' ' + n;
}

export function PriceHistory({ series, current, labels, money }: {
  series: Record<string, number[]>; // keys '30', '90', '180'
  current: number;
  labels: { hi: string; cur: string; lo: string; title: string; d30: string; d90: string; d180: string };
  money: MoneyFmt;
}) {
  const [days, setDays] = useState('30');
  const v = series[days] && series[days].length > 1 ? series[days] : series['30'];
  const { W, H, pts, line, last } = chartPath(v);
  const tabs: [string, string][] = [['30', labels.d30], ['90', labels.d90], ['180', labels.d180]];
  return (
    <>
      <div className="ptabs">
        {tabs.map(([d, l]) => (
          <button key={d} className="btn ghost sm" type="button" aria-pressed={days === d} onClick={() => setDays(d)}>{l}</button>
        ))}
      </div>
      <div id="hist">
        <div className="hist-stats">
          <div><small>{labels.hi}</small><b><span className="money">{fmtMoney(Math.max(...v), money)}</span></b></div>
          <div className="cur"><small>{labels.cur}</small><b><span className="money">{fmtMoney(current, money)}</span></b></div>
          <div><small>{labels.lo}</small><b><span className="money">{fmtMoney(Math.min(...v, current), money)}</span></b></div>
        </div>
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={labels.title}>
          <path d={`${line} L${last[0]} ${H} L${pts[0][0]} ${H} Z`} fill="#16845B" opacity=".08" />
          <path d={line} fill="none" stroke="#16845B" strokeWidth="2.4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <circle cx={last[0]} cy={last[1]} r="5" fill="#16845B" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </>
  );
}
