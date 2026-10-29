'use client';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Box, ChartNoAxesCombined, Crosshair, FileSpreadsheet, Maximize, Minus, Plus, Rows3, X } from 'lucide-react';
import './workbench.css';
import { MMetricsPanel, type DossierTable } from './mmetrics';
import type { ChainInfo } from '../console/molstar-lite';
import { Stage, type PaintGroup, type StageHandle } from './stage';
import { CHAIN_COLORS, CHAIN_NAMES, INTERFACE, isAntigen, REGIONS, plddt, plddtColor, rampColor, regionOf, type Mutation } from './model';
import type { TabSpec } from './agent';

type Lens = Extract<TabSpec, { kind: 'structure' }>['lens'];
const LENS_NAMES: Record<Lens, string> = { plddt: '置信度', region: '区域', interface: '界面', ddg: '亲和力 ΔΔG' };
const GREY = '#4a5063';

type Props = {
  hidden?: boolean;
  tabs: TabSpec[]; active: string | null; setActive: (id: string) => void; close: (id: string) => void;
  lens: Lens; setLens: (l: Lens) => void;
  chains: ChainInfo[]; onLoaded: (c: ChainInfo[]) => void;
  selection: string[]; select: (labels: string[], additive?: boolean) => void;
  hover: string[] | null; setHover: (h: string[] | null) => void;
  ddg: Map<string, Mutation[]>;
  dock: Dock; setDock: (d: Dock) => void;
  /** MMetrics has run for the open structure; until then its dock tab explains that it will appear automatically. */
  dossierReady: boolean;
  onOpenTable: (t: DossierTable) => void;
};
export type Dock = 'seq' | 'mmetrics';

export const Workbench = forwardRef<StageHandle, Props>(function Workbench(p, stageRef) {
  const tab = p.tabs.find(t => t.id === p.active);
  const hasStructure = p.tabs.some(t => t.kind === 'structure');
  const labels = useMemo(() => p.chains.flatMap(c => c.residues.map(r => `${c.auth}:${r.seq}`)), [p.chains]);
  const paint = useMemo<PaintGroup[] | null>(() => {
    if (!p.chains.length) return null;
    const base: PaintGroup = { color: GREY, chains: p.chains.map(c => c.auth) };
    const bins = (values: [string, string][]) => {
      const by = new Map<string, string[]>();
      for (const [l, c] of values) by.set(c, [...(by.get(c) ?? []), l]);
      return [...by].map(([color, ls]) => ({ color, labels: ls }));
    };
    switch (p.lens) {
      case 'plddt': return bins(labels.map(l => [l, plddtColor(plddt(l))]));
      case 'region': return [base, ...REGIONS.map(r => ({ color: r.tone, labels: r.labels }))];
      case 'interface': return [base, { color: '#ffd166', labels: [...INTERFACE].filter(l => !isAntigen(l)) }, { color: '#ff4d8d', labels: [...INTERFACE].filter(isAntigen) }];
      case 'ddg': return [base, ...bins([...p.ddg].map(([l, m]) => [l, rampColor((m[0].ddg + 2) / 3)]))];
    }
  }, [p.lens, p.chains, labels, p.ddg]);
  const lenses: Lens[] = ['plddt', 'region', 'interface', ...(p.ddg.size ? ['ddg' as const] : [])];

  return (
    <section className="ag-wb" style={p.hidden ? { display: 'none' } : undefined}>
      <div className="ag-tabs">
        {p.tabs.map(t => (
          <div key={t.id} className={`ag-tab${t.id === p.active ? ' is-on' : ''}`} onClick={() => p.setActive(t.id)}>
            {t.kind === 'structure' ? <Box size={13} /> : <FileSpreadsheet size={13} />}<span>{t.title}</span>
            <button onClick={e => { e.stopPropagation(); p.close(t.id); }} aria-label="关闭"><X size={12} /></button>
          </div>
        ))}
      </div>
      {/* The 3D viewer stays mounted while other tabs are in front, so camera and selection survive tab switches. */}
      {hasStructure && (
        <div className="ag-wb-structure" style={{ display: tab?.kind === 'structure' ? 'flex' : 'none' }}>
          <Stage ref={stageRef} selection={p.selection} highlight={p.hover} paint={paint} onLoaded={p.onLoaded}
            onPick={(l, add) => l ? p.select([l], add) : (!add && p.select([]))} onHover={l => p.setHover(l ? [l] : null)}>
            <div className="ag-lenses">
              {lenses.map(l => <button key={l} className={p.lens === l ? 'is-on' : ''} onClick={() => p.setLens(l)}>{LENS_NAMES[l]}</button>)}
            </div>
            <Legend lens={p.lens} />
            <ViewTools stage={stageRef as React.RefObject<StageHandle>} selection={p.selection} />
          </Stage>
          <DockPanel {...p} stage={stageRef as React.RefObject<StageHandle>} />
        </div>
      )}
      {tab?.kind === 'table' && <Table tab={tab} onRow={row => { const m = String(row[0]).match(/^(?:([A-Z]):)?[A-Z](\d+)[A-Z]$/); const chain = m?.[1] ?? String(row[1]); if (m) p.select([`${chain}:${m[2]}`]); }} />}
    </section>
  );
});

/** Under the 3D view: the sequence strip, or the MMetrics dossier (resizable, so the structure and its evidence stay on one screen). */
function DockPanel(p: Props & { stage: React.RefObject<StageHandle> }) {
  const [height, setHeight] = useState(360);
  const drag = useRef<{ y: number; h: number } | null>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => { const d = drag.current; if (d) setHeight(Math.max(200, Math.min(window.innerHeight - 260, d.h + d.y - e.clientY))); };
    const up = () => { drag.current = null; document.body.style.cursor = ''; };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);
  const dossier = p.dock === 'mmetrics';
  return (
    <div className={`ag-dk${dossier ? ' is-dossier' : ''}`} style={dossier ? { height } : undefined}>
      {dossier && <div className="ag-dk-grip" onMouseDown={e => { e.preventDefault(); drag.current = { y: e.clientY, h: height }; document.body.style.cursor = 'row-resize'; }} aria-label="拖动调整高度" />}
      <div className="ag-dk-bar" role="tablist">
        <button role="tab" aria-selected={!dossier} className={!dossier ? 'is-on' : ''} onClick={() => p.setDock('seq')}><Rows3 size={13} />序列</button>
        <button role="tab" aria-selected={dossier} className={dossier ? 'is-on' : ''} onClick={() => p.setDock('mmetrics')}>
          <ChartNoAxesCombined size={13} />MMetrics 档案{p.dossierReady && !dossier && <i className="ag-dk-dot" />}
        </button>
      </div>
      {!dossier
        ? <SeqStrip chains={p.chains} selection={p.selection} hover={p.hover} lens={p.lens} ddg={p.ddg} select={p.select} setHover={p.setHover} />
        : p.dossierReady
          ? <div className="ag-dk-body"><MMetricsPanel chains={p.chains} selection={p.selection} onHover={p.setHover} onOpenTable={p.onOpenTable}
              onSelect={labels => { p.select(labels); if (labels.length) p.stage.current?.focus(labels); }} /></div>
          : <div className="ag-dk-empty">结构进入会话后，MMetrics 会自动生成这个蛋白的档案：类型、CDR、互作网络、可开发性风险与突变打分。</div>}
    </div>
  );
}

function Legend({ lens }: { lens: Lens }) {
  if (lens === 'plddt') return <div className="ag-legend">pLDDT {[['>90', '#2f6fe0'], ['70–90', '#65cbf3'], ['50–70', '#ffd23f'], ['<50', '#ff8a4c']].map(([t, c]) => <span key={t}><i style={{ background: c }} />{t}</span>)}</div>;
  if (lens === 'region') return <div className="ag-legend">{[['CDR-H', '#f2a14a'], ['CDR-L', '#8b93ff'], ['表位', '#ff6fae']].map(([t, c]) => <span key={t}><i style={{ background: c }} />{t}</span>)}</div>;
  if (lens === 'interface') return <div className="ag-legend">{[['抗体侧', '#ffd166'], ['抗原侧', '#ff4d8d']].map(([t, c]) => <span key={t}><i style={{ background: c }} />{t}</span>)}</div>;
  return <div className="ag-legend">ΔΔG <span><i style={{ background: rampColor(0) }} />更强</span><span><i style={{ background: rampColor(1) }} />更弱</span></div>;
}

function ViewTools({ stage, selection }: { stage: React.RefObject<StageHandle>; selection: string[] }) {
  return (
    <div className="ag-viewtools">
      <button onClick={() => stage.current?.zoom(0.8)} aria-label="放大"><Plus size={13} /></button>
      <button onClick={() => stage.current?.zoom(1.25)} aria-label="缩小"><Minus size={13} /></button>
      <button onClick={() => selection.length ? stage.current?.focus(selection) : stage.current?.reset()} aria-label="聚焦选区"><Crosshair size={13} /></button>
      <button onClick={() => stage.current?.reset()} aria-label="复位"><Maximize size={13} /></button>
    </div>
  );
}

function SeqStrip({ chains, selection, hover, lens, ddg, select, setHover }: { chains: ChainInfo[]; selection: string[]; hover: string[] | null; lens: Lens; ddg: Map<string, Mutation[]>; select: Props['select']; setHover: Props['setHover'] }) {
  const [chain, setChain] = useState('H');
  const info = chains.find(c => c.auth === chain) ?? chains[0];
  const sel = new Set(selection), hov = new Set(hover ?? []);
  const drag = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { const up = () => { drag.current = null; }; window.addEventListener('mouseup', up); return () => window.removeEventListener('mouseup', up); }, []);
  useEffect(() => {
    const first = selection[0]; if (!first) return;
    const [c] = first.split(':'); if (c !== chain && chains.some(x => x.auth === c)) setChain(c);
  }, [selection]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = box.current?.querySelector('.is-sel') as HTMLElement | null;
    if (el && box.current && drag.current === null) box.current.scrollTo({ left: el.offsetLeft - box.current.clientWidth / 3, behavior: 'smooth' });
  }, [selection, chain]);
  if (!info) return <div className="ag-strip ag-faint">加载序列…</div>;
  const ls = info.residues.map(r => `${info.auth}:${r.seq}`);
  const tint = (l: string) => {
    if (lens === 'plddt') return plddtColor(plddt(l));
    if (lens === 'region') return regionOf(l)?.tone;
    if (lens === 'interface') return INTERFACE.has(l) ? '#ffd166' : undefined;
    const m = ddg.get(l); return m ? rampColor((m[0].ddg + 2) / 3) : undefined;
  };
  return (
    <div className="ag-strip">
      <div className="ag-strip-chains">
        {chains.map(c => <button key={c.auth} className={c.auth === info.auth ? 'is-on' : ''} onClick={() => setChain(c.auth)}><i style={{ background: CHAIN_COLORS[c.auth] }} />{c.auth}<span>{CHAIN_NAMES[c.auth]}</span></button>)}
        <em>拖选序列 · Shift 追加 · 选区会作为上下文发给 Mocha</em>
      </div>
      <div className="ag-strip-seq" ref={box}>
        {info.residues.map((r, i) => {
          const l = ls[i], t = tint(l);
          return (
            <span key={l} className={`${sel.has(l) ? 'is-sel' : ''}${hov.has(l) ? ' is-hov' : ''}`} title={`${l} ${r.name}`}
              onMouseDown={e => { e.preventDefault(); drag.current = i; select([l], e.shiftKey || e.metaKey); }}
              onMouseEnter={() => { setHover([l]); if (drag.current !== null) select(ls.slice(Math.min(drag.current, i), Math.max(drag.current, i) + 1)); }}
              onMouseLeave={() => setHover(null)}>
              {r.seq % 10 === 0 && <sup>{r.seq}</sup>}{r.code}<b style={t ? { background: t } : undefined} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Table({ tab, onRow }: { tab: Extract<TabSpec, { kind: 'table' }>; onRow: (row: (string | number)[]) => void }) {
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const rows = useMemo(() => !sort ? tab.rows : [...tab.rows].sort((a, b) => {
    const x = a[sort.col], y = b[sort.col];
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'zh')) * sort.dir;
  }), [tab.rows, sort]);
  const download = () => {
    const csv = [tab.columns, ...tab.rows].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: tab.title }).click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="ag-wb-table">
      <div className="ag-wb-table-bar"><span>{tab.rows.length} 行 · 点列名排序 · 点行在结构中定位</span><button className="ag-btn" onClick={download}>下载 CSV</button></div>
      <div className="ag-wb-table-scroll">
        <table className="ag-table">
          <thead><tr>{tab.columns.map((c, i) => (
            <th key={c} onClick={() => setSort(s => s?.col === i ? { col: i, dir: s.dir === 1 ? -1 : 1 } : { col: i, dir: 1 })}>
              {c}{sort?.col === i && (sort.dir === 1 ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
            </th>
          ))}</tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} onClick={() => onRow(r)}>{r.map((v, k) => (
              <td key={k} style={typeof v === 'number' ? { color: rampColor((v + 2) / 3) } : undefined}>{v}</td>
            ))}</tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
