'use client';
import { useState } from 'react';
import { useMM, type FlowNode, type MMRecord } from './mmetrics-dataset';
import { INTERACTION_TYPES, typeCounts } from './mmetrics-insights';
import { useTranslations } from 'next-intl';
import type { InteractionFocus } from './interaction-focus';
import { MMetricsNativeNetwork } from './MMetricsNativeNetwork';

// Same encodings as the MOS interaction network (colours come from the dataset: the native plot's palette).
const LINK_LABELS: Record<string, string> = { 'H-Bond': 'H-Bond', 'VdW Contact': 'VdW Contact', 'π-π Stack': 'π-π Stack', Ionic: 'Salt Bridge', 'π-Cation': 'π-Cation' };

const id = (r: FlowNode) => `${r.chain}:${r.number}`;

/** Interaction network per chain pair: a bipartite 2D view (MOS layout) or a table, both linked to the 3D viewer. */
export function MMetricsNetwork({ hover, toggle, selected, filter, setFilter, onInteraction }: { hover: (value: string | null) => void; toggle: (value: string) => void; selected: string[]; filter: string[] | null; setFilter: (types: string[] | null) => void; onInteraction?: (link: InteractionFocus | null) => void }) {
  const t = useTranslations('mmetricsDemo');
  const { data: mmetrics, linkColors: LINK_COLORS, propertyColors: PROPERTY_COLORS, nativeNetworkSvg } = useMM();
  const [view, setView] = useState<'2d' | 'table'>('2d');
  const [active, setActive] = useState<string | null>(null);
  const counts = typeCounts(mmetrics), total = Object.values(counts).reduce((a, b) => a + b, 0);
  // With every type on there is no filter; the first click isolates one type, later clicks add or remove types.
  const pick = (type: string) => {
    if (!filter) return setFilter([type]);
    const next = filter.includes(type) ? filter.filter(x => x !== type) : [...filter, type];
    setFilter(next.length === 0 || next.length === INTERACTION_TYPES.length ? null : next);
  };
  const shown = (category: string) => !filter || filter.includes(category);
  return <>
    <div className="mm-network-head"><p className="mm-section-label">INTERACTION NETWORK</p>
      <span className="mm-seg" role="tablist">{(['table', '2d'] as const).map(v => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}>{v === 'table' ? 'Table' : '2D'}</button>)}</span>
    </div>
    <div className="mm-type-filter" role="group" aria-label={t('typeFilter')}>
      <button aria-pressed={!filter} onClick={() => setFilter(null)}>{t('typeAll')} <b>{total}</b></button>
      {INTERACTION_TYPES.filter(type => counts[type]).map(type => <button key={type} aria-pressed={!!filter && filter.includes(type)} data-off={(filter && !filter.includes(type)) || undefined} onClick={() => pick(type)}><i style={{ background: LINK_COLORS[type] }} />{LINK_LABELS[type] ?? type} <b>{counts[type]}</b></button>)}
    </div>
    {filter && <p className="mm-type-hint">{t('typeHint')}</p>}
    {mmetrics.interactions.map(full => { const pair = { ...full, links: full.links.filter(l => shown(l.category)) }; return view === '2d' ? nativeNetworkSvg
      ? <MMetricsNativeNetwork key={pair.key} svg={nativeNetworkSvg} onInteraction={onInteraction} pair={pair} hover={hover} toggle={toggle} selected={selected} active={active} setActive={setActive} filtered={!!filter} />
      : <PairPlot key={pair.key} pair={pair} linkColors={LINK_COLORS} propertyColors={PROPERTY_COLORS} hover={hover} toggle={toggle} selected={selected} active={active} setActive={setActive} filtered={!!filter} />
      : <table key={pair.key} className="mm-net-table"><caption>Chain {pair.a} · Chain {pair.b}</caption><thead><tr><th>{pair.a}</th><th>{pair.b}</th><th>Type</th><th>Å</th></tr></thead><tbody>
        {pair.links.map((link, k) => { const a = pair.left.find(r => r.key === link.a)!, b = pair.right.find(r => r.key === link.b)!; return <tr key={k} onMouseEnter={() => hover(id(a))} onMouseLeave={() => hover(null)} onClick={() => onInteraction ? onInteraction(link) : toggle(id(a))}>
          <td>{a.name}{a.number}</td><td>{b.name}{b.number}</td><td><i style={{ background: LINK_COLORS[link.category] }} />{LINK_LABELS[link.category] ?? link.category}</td><td>{link.distance.toFixed(2)}</td></tr>; })}
      </tbody></table>; })}
    <div className="mm-legend">
      {Object.entries(LINK_LABELS).map(([key, label]) => <span key={key}><i className="mm-legend-line" style={{ background: LINK_COLORS[key] }} />{label}</span>)}
      {Object.entries(PROPERTY_COLORS).map(([key, color]) => <span key={key}><i className="mm-legend-dot" style={{ background: color }} />{key}</span>)}
    </div>
  </>;
}

function PairPlot({ pair, hover, toggle, selected, active, setActive, filtered, linkColors: LINK_COLORS, propertyColors: PROPERTY_COLORS }: { linkColors: Record<string, string>; propertyColors: Record<string, string>; filtered: boolean; pair: MMRecord['interactions'][number]; hover: (value: string | null) => void; toggle: (value: string) => void; selected: string[]; active: string | null; setActive: (value: string | null) => void }) {
  const W = 440, top = 70, step = 58, r = 24, xl = 92, xr = W - 92;
  const rows = Math.max(pair.left.length, pair.right.length);
  const H = top + rows * step;
  // Both columns start at the top, as in MOS.
  const y = (i: number) => top + step / 2 + i * step;
  const pos = new Map<string, [number, number]>([...pair.left.map((res, i) => [res.key, [xl, y(i)]] as [string, [number, number]]), ...pair.right.map((res, i) => [res.key, [xr, y(i)]] as [string, [number, number]])]);
  const enter = (res: FlowNode) => { setActive(res.key); hover(id(res)); };
  const leave = () => { setActive(null); hover(null); };
  const node = (res: FlowNode) => { const [x, yy] = pos.get(res.key)!; const on = selected.includes(id(res)); const unused = filtered && !pair.links.some(l => l.a === res.key || l.b === res.key); const dim = unused || (active && active !== res.key && !pair.links.some(l => (l.a === active && l.b === res.key) || (l.b === active && l.a === res.key)));
    return <g key={res.key} className="mm-net-node" tabIndex={0} role="button" aria-pressed={on} aria-label={`${res.name} ${res.chain}${res.number}`} opacity={dim ? 0.3 : 1}
      onMouseEnter={() => enter(res)} onMouseLeave={leave} onFocus={() => enter(res)} onBlur={leave} onClick={() => toggle(id(res))} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(id(res)); } }}>
      <circle cx={x} cy={yy} r={r} fill={PROPERTY_COLORS[res.property ?? ''] ?? '#777'} stroke={on ? '#fff' : 'rgba(0,0,0,.35)'} strokeWidth={on ? 3 : 1.5} />
      <text x={x} y={yy - 2} textAnchor="middle" className="mm-net-name">{res.name}</text>
      <text x={x} y={yy + 11} textAnchor="middle" className="mm-net-num">{res.chain}{res.number}</text>
    </g>; };
  return <svg className="mm-net" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Chain ${pair.a} – Chain ${pair.b} interactions`}>
    <text x={xl} y={36} textAnchor="middle" className="mm-net-chain">Chain {pair.a}</text>
    <text x={xr} y={36} textAnchor="middle" className="mm-net-chain">Chain {pair.b}</text>
    {pair.links.map((link, k) => { const [x1, y1] = pos.get(link.a)!, [x2, y2] = pos.get(link.b)!; const lit = !active || active === link.a || active === link.b;
      // The same residue pair can carry several interaction types (e.g. an H-bond and a VdW contact): fan those lines out a little.
      const dup = pair.links.slice(0, k).filter(l => l.a === link.a && l.b === link.b).length, o = dup * 6;
      return <g key={k} opacity={lit ? 1 : 0.15}><line x1={x1 + r} y1={y1 + o} x2={x2 - r} y2={y2 + o} stroke={LINK_COLORS[link.category] ?? '#888'} strokeWidth={1.6} />
        <g transform={`translate(${(x1 + x2) / 2} ${(y1 + y2) / 2 + o + dup * 10})`}><rect x="-21" y="-9" width="42" height="18" rx="4" className="mm-net-dist-bg" /><text y="4" textAnchor="middle" className="mm-net-dist">{link.distance.toFixed(2)}Å</text></g></g>; })}
    {pair.left.map(node)}{pair.right.map(node)}
  </svg>;
}
