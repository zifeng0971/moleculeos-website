'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight, ChevronRight, Download, Eye, EyeOff, FileSpreadsheet, Network, PanelTop, ShieldAlert, Table2, X } from 'lucide-react';
import type { ChainInfo } from '../console/molstar-lite';
import { CHAIN_COLORS } from './model';
import {
  CHEM, DESCRIPTION, HOMOLOGS, INTERACTIONS, INTERACTION_STYLE, INTERACTION_TYPES, MUTATION_FILES, SCHEMES, CDRS,
  annotationGroups, chemistry, displayResidue, interactionCounts, mutationTable, resCode, resolveChains, scanLiabilities, toCsv,
  type Chem, type Interaction, type InteractionType, type MutationFile, type Scheme, type Severity,
} from './mmetrics-data';
import './mmetrics.css';

export type DossierTable = { id: string; title: string; columns: string[]; rows: (string | number)[][] };
export type MMetricsProps = {
  chains: ChainInfo[];
  selection: string[];
  onSelect: (labels: string[]) => void;
  onHover: (labels: string[] | null) => void;
  onOpenTable: (t: DossierTable) => void;
};

const SECTIONS = [
  { key: 'desc', label: '概述' }, { key: 'hom', label: '同源' }, { key: 'ann', label: '注释' },
  { key: 'net', label: '互作网络' }, { key: 'dev', label: '可开发性' }, { key: 'mut', label: '突变打分' },
] as const;
type SectionKey = (typeof SECTIONS)[number]['key'];
const SEV_NAME: Record<Severity, string> = { high: '高', medium: '中', low: '低' };

/** Hover wiring shared by every interactive row: mouse and keyboard focus both drive the transient 3D highlight. */
const hoverProps = (onHover: MMetricsProps['onHover'], labels: string[]) => ({
  onMouseEnter: () => onHover(labels), onMouseLeave: () => onHover(null),
  onFocus: () => onHover(labels), onBlur: () => onHover(null),
});
const chainStyle = (id: string) => ({ '--mmx-c': CHAIN_COLORS[id] ?? '#888' }) as CSSProperties;

// =====================================================================================================
// Full dossier, docked under the 3D viewer
// =====================================================================================================
export function MMetricsPanel(p: MMetricsProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<SectionKey>('desc');
  const [scheme, setScheme] = useState<Scheme>('Kabat');
  const ready = p.chains.length > 0;
  const selected = useMemo(() => new Set(p.selection), [p.selection]);

  const jump = (key: SectionKey) => {
    const sc = scroller.current, el = sc?.querySelector<HTMLElement>(`[data-mmx-sec="${key}"]`);
    if (!sc || !el) return;
    const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    sc.scrollTo({ top: el.offsetTop - 40, behavior: reduce ? 'auto' : 'smooth' });
    setActive(key);
  };
  // Scroll-spy: the last section whose top has passed just below the sticky nav is current.
  useEffect(() => {
    const sc = scroller.current; if (!sc || !ready) return;
    const onScroll = () => {
      let current: SectionKey = 'desc';
      if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4) current = 'mut';
      else sc.querySelectorAll<HTMLElement>('[data-mmx-sec]').forEach(el => { if (el.offsetTop - 56 <= sc.scrollTop) current = el.dataset.mmxSec as SectionKey; });
      setActive(current);
    };
    onScroll();
    sc.addEventListener('scroll', onScroll, { passive: true });
    return () => sc.removeEventListener('scroll', onScroll);
  }, [ready]);

  return <div className="mmx-panel" aria-label="MMetrics 结构档案">
    <div className="mmx-scroll" ref={scroller}>
      <nav className="mmx-nav" aria-label="档案分区">
        {SECTIONS.map(s => <button key={s.key} type="button" aria-current={active === s.key ? 'true' : undefined} onClick={() => jump(s.key)}>{s.label}</button>)}
        <span className="mmx-nav-id">2FJG</span>
      </nav>
      {!ready ? <Skeleton /> : <div className="mmx-body">
        <Overview {...p} selected={selected} />
        <Homologs />
        <Annotations {...p} selected={selected} scheme={scheme} setScheme={setScheme} />
        <NetworkSection {...p} selected={selected} />
        <Developability {...p} selected={selected} scheme={scheme} />
        <Scoring {...p} />
        <p className="mmx-foot">演示数据：结构、序列与标注 “结构” 的互作来自 2FJG；置信度、同源一致性、非 Kabat 边界与突变得分为合成值。</p>
      </div>}
    </div>
  </div>;
}

function Skeleton() {
  return <div className="mmx-body mmx-skel" aria-busy="true" aria-label="正在载入结构档案">
    {[0, 1, 2].map(i => <div key={i} className="mmx-skel-block"><i style={{ width: '28%' }} /><i /><i style={{ width: '82%' }} /><i style={{ width: '64%' }} /></div>)}
  </div>;
}

type Shared = MMetricsProps & { selected: Set<string> };

function Section({ id, title, meta, actions, children }: { id: SectionKey; title: string; meta?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return <section className="mmx-sec" data-mmx-sec={id} aria-labelledby={`mmx-h-${id}`}>
    <header className="mmx-sec-head"><h3 id={`mmx-h-${id}`}>{title}</h3>{meta && <span className="mmx-sec-meta">{meta}</span>}{actions && <span className="mmx-sec-actions">{actions}</span>}</header>
    {children}
  </section>;
}

// ---------- 概述 ----------
function Overview({ chains, selected, onSelect, onHover }: Shared) {
  const all = resolveChains(chains);
  return <Section id="desc" title="概述" meta={<span className="mmx-tag is-accent">MMetrics 自动解析</span>}>
    <div className="mmx-desc">
      <div className="mmx-desc-top">
        <span className="mmx-cat"><i />{DESCRIPTION.category}</span>
        <span className="mmx-conf" title="类型判断置信度">高置信 <b>{DESCRIPTION.confidence.score.toFixed(2)}</b></span>
      </div>
      <p className="mmx-desc-name">{DESCRIPTION.name}</p>
      <dl className="mmx-dl">
        <dt>来源</dt><dd>{DESCRIPTION.source}</dd>
        <dt>功能</dt><dd>{DESCRIPTION.function}</dd>
        <dt>结构特征</dt><dd><ul>{DESCRIPTION.features.map(f => <li key={f}>{f}</li>)}</ul></dd>
        <dt>判断依据</dt><dd><ul className="mmx-basis">{DESCRIPTION.reasoning.map(f => <li key={f}>{f}</li>)}</ul></dd>
      </dl>
    </div>
    <div className="mmx-chains" role="group" aria-label="链组成">
      {DESCRIPTION.chains.map(c => {
        const labels = all.find(x => x.auth === c.id)?.residues.map(r => `${c.id}:${r.seq}`) ?? [];
        const on = labels.length > 0 && labels.every(l => selected.has(l));
        return <button key={c.id} type="button" className="mmx-chain" style={chainStyle(c.id)} aria-pressed={on} onClick={() => onSelect(on ? [] : labels)} {...hoverProps(onHover, labels)}>
          <span className="mmx-chain-id">{c.id}</span>
          <span className="mmx-chain-main"><b>{c.role}</b><small>{c.molecule}</small></span>
          <span className="mmx-chain-dom">{c.domains}</span>
          <span className="mmx-num">{labels.length} aa</span>
        </button>;
      })}
    </div>
  </Section>;
}

// ---------- 同源 ----------
function Homologs() {
  return <Section id="hom" title="同源蛋白" meta={`前 ${HOMOLOGS.items.length} 条`}>
    <p className="mmx-caption">{HOMOLOGS.method}</p>
    <ol className="mmx-hom">
      {HOMOLOGS.items.map((h, i) => <li key={h.id}>
        <span className="mmx-rank">{i + 1}</span>
        <span className="mmx-hom-id"><code>{h.id}</code>{h.crystal && <span className="mmx-tag">晶体</span>}</span>
        <span className="mmx-hom-title">{h.title}</span>
        <span className="mmx-bar" aria-hidden="true"><i style={{ width: `${h.identity}%` }} /></span>
        <span className="mmx-num mmx-hom-pct">{h.identity.toFixed(1)}%</span>
        <a className="mmx-link" href={h.url} target="_blank" rel="noopener noreferrer" aria-label={`${h.id} 在 ${h.db} 打开`}>{h.db}<ArrowUpRight size={12} aria-hidden="true" /></a>
      </li>)}
    </ol>
  </Section>;
}

// ---------- 注释 ----------
function Annotations({ chains, selected, onSelect, onHover, scheme, setScheme }: Shared & { scheme: Scheme; setScheme: (s: Scheme) => void }) {
  const groups = useMemo(() => annotationGroups(chains, scheme), [chains, scheme]);
  const toggle = (labels: string[]) => {
    const on = labels.every(l => selected.has(l));
    if (on) { const drop = new Set(labels); onSelect([...selected].filter(l => !drop.has(l))); }
    else onSelect([...new Set([...selected, ...labels])]);
  };
  const res = (label: string, inSel: boolean) => <button key={label} type="button" className="mmx-aa" aria-pressed={inSel} title={displayResidue(chains, label)}
    onClick={() => onSelect([label])} {...hoverProps(onHover, [label])}>{resCode(chains, label)}</button>;
  return <Section id="ann" title="注释" meta={`${CDRS[scheme].length} 个 CDR · 表位 · 重 / 轻链`}
    actions={<>
      <span className="mmx-seg" role="group" aria-label="CDR 编号方案">{SCHEMES.map(s => <button key={s} type="button" aria-pressed={scheme === s} onClick={() => setScheme(s)}>{s}</button>)}</span>
    </>}>
    <div className="mmx-ann-bar">
      <span className="mmx-faint">{selected.size ? <>已选 <b className="mmx-num">{selected.size}</b> 个残基</> : '点击区域可多选；点击单个残基只看它'}</span>
      <button type="button" className="mmx-btn is-ghost" disabled={!selected.size} onClick={() => onSelect([])}><X size={12} aria-hidden="true" />清除</button>
    </div>
    <ul className="mmx-ann">
      {groups.map(g => {
        const on = g.labels.length > 0 && g.labels.every(l => selected.has(l));
        const partial = !on && g.labels.some(l => selected.has(l));
        return <li key={g.id} className="mmx-ann-row" data-kind={g.kind} style={chainStyle(g.chain)}>
          <button type="button" className="mmx-ann-head" aria-pressed={on} data-partial={partial || undefined} onClick={() => toggle(g.labels)} {...hoverProps(onHover, g.labels)}>
            <span className="mmx-check" aria-hidden="true" />
            <b>{g.name}</b>
            <code>{g.range}</code>
            <span className="mmx-num mmx-faint">{g.labels.length}</span>
          </button>
          {g.kind !== 'chain' && <span className="mmx-seq" aria-label={`${g.name} 残基`}>{g.labels.map(l => res(l, selected.has(l)))}</span>}
        </li>;
      })}
    </ul>
    <p className="mmx-caption">Kabat 与 3D 区域视图一致；IMGT / Chothia / AHo 边界为近似换算（演示），非 ANARCI 输出。</p>
  </Section>;
}

// ---------- 互作网络 ----------
function NetworkSection({ chains, selected, onSelect, onHover }: Shared) {
  const [view, setView] = useState<'2d' | 'table'>('2d');
  const [filter, setFilter] = useState<Set<InteractionType> | null>(null);
  const counts = useMemo(interactionCounts, []);
  const shown = useMemo(() => INTERACTIONS.filter(i => !filter || filter.has(i.type)), [filter]);
  const pick = (t: InteractionType) => {
    if (!filter) return setFilter(new Set([t]));
    const next = new Set(filter); if (next.has(t)) next.delete(t); else next.add(t);
    setFilter(next.size === 0 || next.size === INTERACTION_TYPES.length ? null : next);
  };
  return <Section id="net" title="互作网络" meta={`抗体 H/L ↔ 抗原 V/W · ${INTERACTIONS.length} 条`}
    actions={<span className="mmx-seg" role="group" aria-label="视图">
      <button type="button" aria-pressed={view === '2d'} onClick={() => setView('2d')}><Network size={12} aria-hidden="true" />2D</button>
      <button type="button" aria-pressed={view === 'table'} onClick={() => setView('table')}><Table2 size={12} aria-hidden="true" />表格</button>
    </span>}>
    <div className="mmx-chips" role="group" aria-label="按作用类型过滤">
      <button type="button" className="mmx-chip" aria-pressed={!filter} onClick={() => setFilter(null)}>全部 <b>{INTERACTIONS.length}</b></button>
      {INTERACTION_TYPES.filter(t => counts[t]).map(t => <button key={t} type="button" className="mmx-chip" aria-pressed={!!filter?.has(t)} data-off={(filter && !filter.has(t)) || undefined} onClick={() => pick(t)} title={INTERACTION_STYLE[t].hint}>
        <LineSwatch type={t} />{t} <b>{counts[t]}</b>
      </button>)}
    </div>
    {view === '2d' ? <NetworkPlot chains={chains} links={shown} selected={selected} onSelect={onSelect} onHover={onHover} />
      : <ContactTable chains={chains} links={shown} selected={selected} onSelect={onSelect} onHover={onHover} />}
    <div className="mmx-legend" aria-label="图例">
      <span className="mmx-legend-group">{INTERACTION_TYPES.map(t => <span key={t}><LineSwatch type={t} />{t}</span>)}</span>
      <span className="mmx-legend-group">{(Object.keys(CHEM) as Chem[]).map(c => <span key={c}><i className="mmx-dot" style={{ background: CHEM[c].color }} />{CHEM[c].name}</span>)}</span>
    </div>
  </Section>;
}

function LineSwatch({ type }: { type: InteractionType }) {
  const s = INTERACTION_STYLE[type];
  return <svg className="mmx-swatch" width="18" height="6" viewBox="0 0 18 6" aria-hidden="true"><line x1="1" y1="3" x2="17" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} strokeLinecap="round" /></svg>;
}

type NetProps = { chains: ChainInfo[]; links: Interaction[]; selected: Set<string>; onSelect: MMetricsProps['onSelect']; onHover: MMetricsProps['onHover'] };

// Network geometry in viewBox units (600 wide ≈ the docked panel width, so text renders near 1:1).
const W = 600, PW = 108, PH = 20, STEP = 26, TOP = 40, GAP = 12, XL = 12, XR = W - 12 - PW;

/** Bipartite layout: antibody residues (H then L) on the left, antigen residues on the right, ordered to reduce crossings. */
function NetworkPlot({ chains, links, selected, onSelect, onHover }: NetProps) {
  const [focus, setFocus] = useState<string | null>(null);
  const layout = useMemo(() => {
    const num = (l: string) => Number(l.split(':')[1]);
    const left = [...new Set(INTERACTIONS.map(i => i.a))].sort((a, b) => a[0].localeCompare(b[0]) || num(a) - num(b));
    const yOf = new Map<string, number>();
    let y = TOP;
    left.forEach((l, i) => { if (i > 0 && l[0] !== left[i - 1][0]) y += GAP; yOf.set(l, y); y += STEP; });
    // Antigen order: barycentre of partner rows, so lines run mostly horizontal.
    const right = [...new Set(INTERACTIONS.map(i => i.b))].map(b => {
      const ys = INTERACTIONS.filter(i => i.b === b).map(i => yOf.get(i.a)!);
      return { b, c: ys.reduce((s, v) => s + v, 0) / ys.length };
    }).sort((p, q) => p.c - q.c || num(p.b) - num(q.b)).map(x => x.b);
    const leftH = y - TOP, rightH = right.length * STEP;
    const r0 = TOP + Math.max(0, (leftH - rightH) / 2);
    right.forEach((r, i) => yOf.set(r, r0 + i * STEP));
    return { left, right, yOf, H: Math.max(y, r0 + rightH) + 8 };
  }, []);
  // Distance labels: try positions along each line until one doesn't collide with an earlier label.
  const labels = useMemo(() => {
    const placed: { x: number; y: number }[] = [];
    const LW = 38, LH = 14, x1 = XL + PW, x2 = XR;
    return links.map(l => {
      const ya = layout.yOf.get(l.a)! + PH / 2, yb = layout.yOf.get(l.b)! + PH / 2;
      let best = { x: (x1 + x2) / 2, y: (ya + yb) / 2 };
      for (const t of [0.5, 0.38, 0.62, 0.28, 0.72, 0.2, 0.8, 0.44, 0.56, 0.33, 0.67]) {
        const c = { x: x1 + (x2 - x1) * t, y: ya + (yb - ya) * t };
        if (placed.every(p => Math.abs(p.x - c.x) > LW + 2 || Math.abs(p.y - c.y) > LH + 1)) { best = c; break; }
      }
      placed.push(best);
      return best;
    });
  }, [links, layout]);
  const linked = (r: string) => links.some(l => l.a === r || l.b === r);
  const near = (r: string) => !focus || focus === r || links.some(l => (l.id === focus && (l.a === r || l.b === r)) || (l.a === focus && l.b === r) || (l.b === focus && l.a === r));
  const enter = (labelsIn: string[], key: string) => { setFocus(key); onHover(labelsIn); };
  const leave = () => { setFocus(null); onHover(null); };

  const node = (r: string, x: number) => {
    const y = layout.yOf.get(r)!, chem = CHEM[chemistry(resCode(chains, r))], on = selected.has(r);
    const dim = !linked(r) || !near(r);
    return <g key={r} className="mmx-node" data-on={on || undefined} opacity={dim ? 0.28 : 1} tabIndex={0} role="button" aria-pressed={on} aria-label={displayResidue(chains, r)}
      onMouseEnter={() => enter([r], r)} onMouseLeave={leave} onFocus={() => enter([r], r)} onBlur={leave}
      onClick={() => onSelect([r])} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect([r]); } }}>
      <rect x={x} y={y} width={PW} height={PH} rx={PH / 2} fill={chem.color} fillOpacity={0.16} stroke={chem.color} strokeOpacity={0.7} />
      {on && <rect className="mmx-node-ring" x={x - 2.5} y={y - 2.5} width={PW + 5} height={PH + 5} rx={PH / 2 + 2.5} fill="none" />}
      <circle cx={x + 11} cy={y + PH / 2} r={3.5} fill={chem.color} />
      <text x={x + 20} y={y + PH / 2 + 3.8} className="mmx-node-text">{displayResidue(chains, r)}</text>
    </g>;
  };

  return <div className="mmx-net-wrap">
    <svg className="mmx-net" viewBox={`0 0 ${W} ${layout.H}`} role="group" aria-label="抗体–抗原互作网络">
      <text x={XL + PW / 2} y={20} textAnchor="middle" className="mmx-net-col">抗体 · H / L</text>
      <text x={XR + PW / 2} y={20} textAnchor="middle" className="mmx-net-col">抗原 · V</text>
      {links.map((l, i) => {
        const s = INTERACTION_STYLE[l.type], ya = layout.yOf.get(l.a)! + PH / 2, yb = layout.yOf.get(l.b)! + PH / 2;
        const lit = !focus || focus === l.a || focus === l.b || focus === l.id, on = selected.has(l.a) && selected.has(l.b);
        const pos = labels[i];
        return <g key={l.id} className="mmx-link-g" opacity={lit ? 1 : 0.12} tabIndex={0} role="button" aria-pressed={on}
          aria-label={`${l.type} ${displayResidue(chains, l.a)} – ${displayResidue(chains, l.b)} ${l.dist.toFixed(2)} Å`}
          onMouseEnter={() => enter([l.a, l.b], l.id)} onMouseLeave={leave} onFocus={() => enter([l.a, l.b], l.id)} onBlur={leave}
          onClick={() => onSelect([l.a, l.b])} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect([l.a, l.b]); } }}>
          <line x1={XL + PW} y1={ya} x2={XR} y2={yb} stroke="transparent" strokeWidth={10} />
          <line x1={XL + PW} y1={ya} x2={XR} y2={yb} stroke={s.color} strokeWidth={on || focus === l.id ? 2.4 : 1.5} strokeDasharray={s.dash} strokeLinecap="round" />
          <rect x={pos.x - 19} y={pos.y - 7} width={38} height={14} rx={4} className="mmx-dist-bg" stroke={s.color} strokeOpacity={0.55} />
          <text x={pos.x} y={pos.y + 3.4} textAnchor="middle" className="mmx-dist">{l.dist.toFixed(2)}Å</text>
        </g>;
      })}
      {layout.left.map(r => node(r, XL))}
      {layout.right.map(r => node(r, XR))}
    </svg>
  </div>;
}

function ContactTable({ chains, links, selected, onSelect, onHover }: NetProps) {
  const rows = [...links].sort((a, b) => INTERACTION_TYPES.indexOf(a.type) - INTERACTION_TYPES.indexOf(b.type) || a.dist - b.dist);
  return <div className="mmx-table-wrap">
    <table className="mmx-table">
      <thead><tr><th>类型</th><th>抗体侧</th><th>抗原侧</th><th>原子</th><th className="is-num">距离 Å</th></tr></thead>
      <tbody>{rows.map(l => {
        const on = selected.has(l.a) && selected.has(l.b);
        return <tr key={l.id} tabIndex={0} aria-selected={on} onClick={() => onSelect([l.a, l.b])}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect([l.a, l.b]); } }} {...hoverProps(onHover, [l.a, l.b])}>
          <td><span className="mmx-type"><LineSwatch type={l.type} />{l.type}</span></td>
          <td><code>{displayResidue(chains, l.a)}</code></td>
          <td><code>{displayResidue(chains, l.b)}</code></td>
          <td className="mmx-faint"><code>{l.atomA ? `${l.atomA} · ${l.atomB}` : '—'}</code></td>
          <td className="is-num"><code>{l.dist.toFixed(2)}</code></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

// ---------- 可开发性 ----------
function Developability({ chains, selected, onSelect, onHover, scheme }: Shared & { scheme: Scheme }) {
  const items = useMemo(() => scanLiabilities(chains, scheme), [chains, scheme]);
  const count = (s: Severity) => items.filter(i => i.severity === s).length;
  return <Section id="dev" title="可开发性风险" meta={`VH / VL 序列扫描 · ${scheme}`}>
    <div className="mmx-sev-sum">{(['high', 'medium', 'low'] as Severity[]).map(s => <span key={s} data-sev={s}><i />{SEV_NAME[s]}风险 <b className="mmx-num">{count(s)}</b></span>)}</div>
    {items.length === 0 ? <p className="mmx-empty">未发现化学不稳定基序。</p> : <ul className="mmx-liab">
      {items.map(it => {
        const on = it.labels.every(l => selected.has(l));
        return <li key={it.id}><button type="button" data-sev={it.severity} aria-pressed={on} onClick={() => onSelect(it.labels)} {...hoverProps(onHover, it.labels)}>
          <span className="mmx-sev-bar" aria-hidden="true" />
          <span className="mmx-liab-main"><b>{it.name}</b><small><code>{it.chain}:{it.from}{it.to > it.from ? `–${it.to}` : ''}</code> · <code className="mmx-motif">{it.motif}</code></small></span>
          <span className={it.inCdr ? 'mmx-tag is-warn' : 'mmx-tag'}>{it.region}</span>
          <span className="mmx-sev">{SEV_NAME[it.severity]}</span>
        </button></li>;
      })}
    </ul>}
    <p className="mmx-caption"><ShieldAlert size={12} aria-hidden="true" />落在 CDR 内的关键基序（NG、DG、N-x-S/T、游离 Cys）为高风险；Met/Trp 氧化只在 CDR 内报告。切换编号方案会改变 CDR 归属。</p>
  </Section>;
}

// ---------- 突变打分 ----------
function Scoring({ chains, onOpenTable, onHover, onSelect }: MMetricsProps) {
  const [open, setOpen] = useState<MutationFile | null>(null);
  const tables = useMemo(() => Object.fromEntries(MUTATION_FILES.map(f => [f.file, mutationTable(f.file, chains)])) as Record<MutationFile, ReturnType<typeof mutationTable>>, [chains]);
  const toDossier = (f: MutationFile): DossierTable => ({ id: `mmetrics-${f.replace('.csv', '')}`, ...tables[f] });
  const download = useCallback((f: MutationFile) => {
    const blob = new Blob(['﻿' + toCsv(tables[f])], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = f; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [tables]);
  const labelOf = (row: (string | number)[]) => `${row[0]}:${String(row[1]).slice(1, -1)}`;
  return <Section id="mut" title="突变打分" meta="CDR 与界面位点 · 每位点前 3 个替换">
    <ul className="mmx-files">
      {MUTATION_FILES.map(f => {
        const t = tables[f.file], isOpen = open === f.file;
        return <li key={f.file} data-open={isOpen || undefined}>
          <div className="mmx-file">
            <span className="mmx-file-ico" aria-hidden="true"><FileSpreadsheet size={16} /></span>
            <span className="mmx-file-main"><b>{f.file}</b><small>{f.name} · {f.hint} · <span className="mmx-num">{t.rows.length}</span> 行</small></span>
            <span className="mmx-file-actions">
              <button type="button" className="mmx-btn" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : f.file)}>{isOpen ? <EyeOff size={12} aria-hidden="true" /> : <Eye size={12} aria-hidden="true" />}预览</button>
              <button type="button" className="mmx-btn" onClick={() => onOpenTable(toDossier(f.file))}><PanelTop size={12} aria-hidden="true" />在工作台打开</button>
              <button type="button" className="mmx-btn is-icon" aria-label={`下载 ${f.file}`} title="下载 CSV" onClick={() => download(f.file)}><Download size={13} aria-hidden="true" /></button>
            </span>
          </div>
          {isOpen && <div className="mmx-table-wrap is-preview">
            <table className="mmx-table">
              <thead><tr>{t.columns.map(c => <th key={c} className={c === 'score' ? 'is-num' : undefined}>{c}{c === 'score' ? ` (${f.unit})` : ''}</th>)}</tr></thead>
              <tbody>{t.rows.slice(0, 8).map((row, i) => {
                const label = labelOf(row);
                return <tr key={i} tabIndex={0} onClick={() => onSelect([label])} onKeyDown={e => { if (e.key === 'Enter') onSelect([label]); }} {...hoverProps(onHover, [label])}>
                  <td><code>{row[0]}</code></td><td><code>{row[1]}</code></td><td className="is-num"><code>{Number(row[2]).toFixed(2)}</code></td>
                </tr>;
              })}</tbody>
            </table>
            <button type="button" className="mmx-more" onClick={() => onOpenTable(toDossier(f.file))}>查看全部 {t.rows.length} 行<ChevronRight size={12} aria-hidden="true" /></button>
          </div>}
        </li>;
      })}
    </ul>
    <p className="mmx-caption">演示数据：得分由原型内的确定性模型生成，仅用于展示文件格式与交互。</p>
  </Section>;
}

// =====================================================================================================
// Transcript summary card
// =====================================================================================================
export function MMetricsSummary({ chains, onOpen, onResidue }: { chains: ChainInfo[]; onOpen: () => void; onResidue: (label: string) => void }) {
  const liabs = useMemo(() => scanLiabilities(chains, 'Kabat'), [chains]);
  const counts = interactionCounts();
  const best = HOMOLOGS.items.filter(h => h.db === 'RCSB').reduce((a, b) => (b.identity > a.identity ? b : a));
  const high = liabs.filter(l => l.severity === 'high').length, mid = liabs.filter(l => l.severity === 'medium').length;
  const key = INTERACTIONS.filter(i => i.origin === 'structure' && i.type !== '疏水').sort((a, b) => a.dist - b.dist).filter((i, k, arr) => arr.findIndex(x => x.a === i.a) === k).slice(0, 3);
  const all = resolveChains(chains);
  return <article className="mmx-sum" aria-label="MMetrics 结构档案摘要">
    <header className="mmx-sum-head">
      <span className="mmx-sum-title"><b>结构档案</b><code>2FJG</code></span>
      <span className="mmx-cat"><i />{DESCRIPTION.category}</span>
      <span className="mmx-conf">置信度 <b>{Math.round(DESCRIPTION.confidence.score * 100)}%</b></span>
    </header>
    <p className="mmx-sum-name">{DESCRIPTION.name}</p>
    <div className="mmx-sum-chains">{DESCRIPTION.chains.map(c => <span key={c.id} className="mmx-sum-chain" style={chainStyle(c.id)}><b>{c.id}</b>{c.role}<small>{all.find(x => x.auth === c.id)?.residues.length ?? '—'} aa</small></span>)}</div>
    <dl className="mmx-facts">
      <div><dt>CDR</dt><dd><b className="mmx-num">{CDRS.Kabat.length}</b><small>Kabat · H3 {CDRS.Kabat.find(r => r.id === 'h3')!.to - CDRS.Kabat.find(r => r.id === 'h3')!.from + 1} aa</small></dd></div>
      <div><dt>界面互作</dt><dd><b className="mmx-num">{INTERACTIONS.length}</b><small>氢键 {counts['氢键']} · 盐桥 {counts['盐桥']}</small></dd></div>
      <div><dt>同源最高</dt><dd><b className="mmx-num">{best.identity.toFixed(1)}%</b><small>{best.id}</small></dd></div>
      <div><dt>可开发性</dt><dd><b className="mmx-num">{liabs.length}</b><small>{high ? <span className="mmx-sum-sev" data-sev="high">高 {high}</span> : null}{mid ? <span className="mmx-sum-sev" data-sev="medium">中 {mid}</span> : null}{!high && !mid ? '均为低风险' : null}</small></dd></div>
    </dl>
    <div className="mmx-sum-keys"><span className="mmx-faint">关键接触</span>
      {key.map(i => <button key={i.id} type="button" className="mmx-sum-res" style={chainStyle(i.a[0])} onClick={() => onResidue(i.a)} title={`${i.type} · ${i.dist.toFixed(2)} Å`}>
        <code>{displayResidue(chains, i.a)}</code><span aria-hidden="true">↔</span><code>{displayResidue(chains, i.b)}</code><small>{i.type}</small>
      </button>)}
    </div>
    <footer className="mmx-sum-foot">
      <span className="mmx-faint">演示数据 · 依据 MMetrics 自动解析</span>
      <button type="button" className="mmx-btn is-primary" onClick={onOpen}>打开完整档案<ChevronRight size={13} aria-hidden="true" /></button>
    </footer>
  </article>;
}
