'use client';

import { Flow, Phrases } from '@/components/ui/phrase-title';
import { Fragment, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Minus, TriangleAlert, X } from 'lucide-react';
import { CLDN, GLP, STORIES, type Link, type Tile, type Verdict } from '@/content/help-stories';
import { CASES, type CaseImage, type CaseStep, type CaseText } from '@/content/help-cases';
import type { Locale } from '@/lib/site-config';
import { MODULE } from '@/lib/palette';

const VERDICT_ICON = { no: X, ok: Check, warn: TriangleAlert } as const;
const Pill = ({ v, label }: { v: Verdict; label: string }) => { const Icon = VERDICT_ICON[v]; return <span className="hs-pill" data-v={v}><Icon size={12} aria-hidden="true" />{label}</span>; };
const Tiles = ({ tiles }: { tiles: Tile[] }) => <div className="hs-tiles">{tiles.map(t => <div key={t.label + t.value} className="hs-tile"><span>{t.label}</span><strong>{t.value}{t.unit && <small>{t.unit}</small>}</strong></div>)}</div>;
const Step = ({ n, title, lead, takeaway, tags, children }: { n: number; title: string; lead: string; takeaway?: string; tags?: string[]; children?: ReactNode }) => <section className="hs-step">
  <span className="hs-step-no">{String(n).padStart(2, '0')}</span>
  <div className="hs-step-body"><h3><Phrases text={title} /></h3>{tags && <p className="hs-tags" aria-label="MoleculeOS">{tags.map(t => <em key={t}>{t}</em>)}</p>}<p><Flow text={lead} /></p>{children}{takeaway && <p className="hs-takeaway"><i aria-hidden="true" /><Flow text={takeaway} /></p>}</div>
</section>;
const Grow = ({ w, delay = 0, className }: { w: number; delay?: number; className?: string }) => <motion.i className={className} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }} style={{ width: `${w}%` }} />;
type Col = { key: string; label: string };
/** A responsive table: columns on wide screens, stacked labelled lines on narrow ones. Never scrolls sideways. */
function Grid({ cols, template, rows, className }: { cols: Col[]; template: string; rows: { key: string; cells: ReactNode[]; v?: Verdict }[]; className?: string }) {
  return <div className={'hs-grid ' + (className ?? '')} style={{ '--cols': template } as CSSProperties} role="table">
    <div className="hs-grid-head" role="row">{cols.map(c => <span key={c.key} role="columnheader">{c.label}</span>)}</div>
    {rows.map(r => <div key={r.key} className="hs-grid-row" role="row" data-v={r.v}>{r.cells.map((cell, i) => <span key={i} role="cell" data-label={cols[i].label}>{cell}</span>)}</div>)}
  </div>;
}
const Dots = ({ total, filled }: { total: number; filled: number }) => <span className="hs-dots" aria-label={`${filled}/${total}`}>{Array.from({ length: total }, (_, i) => <i key={i} data-on={i < filled || undefined} />)}</span>;

/** Sequence fitness (x) against binding ΔΔG (y): the conflict between the two axes, drawn. */
function Quadrant({ h }: { h: Record<string, string> }) {
  const X = (v: number) => 56 + ((v + 3) / 10) * 560, Y = (v: number) => 22 + ((2 - v) / 5) * 150;
  return <figure className="hs-quad"><svg viewBox="0 0 680 218" role="img" aria-label={`${h.quadX} / ${h.quadY}`}>
    <rect x="56" y="22" width="560" height={Y(0) - 22} className="hs-quad-bad" /><rect x="56" y={Y(0)} width="560" height={172 - Y(0)} className="hs-quad-good" />
    <line x1="56" x2="616" y1={Y(0)} y2={Y(0)} className="hs-quad-zero" /><line x1={X(0)} x2={X(0)} y1="22" y2="172" className="hs-quad-zero" />
    <text x="66" y="40" className="hs-quad-tag" data-v="no">{h.quadBad}</text><text x="66" y="165" className="hs-quad-tag" data-v="ok">{h.quadGood}</text>
    {GLP.mutations.map((m, i) => <g key={m.id} className="hs-quad-pt" data-v={m.verdict} style={{ '--i': i } as CSSProperties}><circle cx={X(m.seq)} cy={Y(m.ddg)} r="16" className="halo" /><circle cx={X(m.seq)} cy={Y(m.ddg)} r="6" /><text x={X(m.seq)} y={Y(m.ddg) - 14} textAnchor="middle">{m.id}</text></g>)}
    <text x="336" y="204" textAnchor="middle" className="hs-quad-axis">{h.quadX}</text><text x="18" y="97" textAnchor="middle" transform="rotate(-90 18 97)" className="hs-quad-axis">{h.quadY}</text>
  </svg></figure>;
}

function Glp({ locale }: { locale: Locale }) {
  const s = STORIES[locale].glp, v = STORIES[locale].verdict, h = s.headers, structs = s.text.struct.split('|'), design = h.design.split('|');
  return <>
    <Header s={s} />
    <div className="hs-steps">
      <Step n={1} {...s.steps[0]}><div className="hs-anchors">{s.anchors!.map((a, i) => <div key={a.tag} className="hs-anchor" style={{ '--i': i } as CSSProperties}><em>{a.tag}</em><strong>{a.pair}</strong><span>{a.detail}</span></div>)}</div></Step>
      <Step n={2} {...s.steps[1]}><Quadrant h={h} />
        <Grid className="hs-g-mut" template="64px 1fr 1fr 1.7fr 74px" cols={[{ key: 'v', label: h.variant }, { key: 's', label: h.seq }, { key: 'd', label: h.ddg }, { key: 'b', label: h.struct }, { key: 'j', label: h.verdict }]}
          rows={GLP.mutations.map((m, i) => ({ key: m.id, v: m.verdict, cells: [<code key="c">{m.id}</code>, m.seqLabel, <b key="d" data-v={m.ddg > 0 ? 'no' : 'ok'}>{m.ddgLabel}</b>, structs[i], <Pill key="p" v={m.verdict} label={v[m.verdict]} />] }))} /></Step>
      <Step n={3} {...s.steps[2]}><Grid className="hs-g-pred" template="1.4fr 1fr 1fr 40px" cols={[{ key: 'm', label: h.metric }, { key: 'w', label: h.wt }, { key: 'x', label: h.mut }, { key: 't', label: '' }]}
          rows={GLP.prediction.map(p => ({ key: p.metric, cells: [p.metric, p.wt, p.mut, <span key="d" className="hs-delta">{p.metric.includes('RMSD') ? '▲' : '▼'}</span>] }))} /></Step>
      <Step n={4} {...s.steps[3]}><div className="hs-design">{GLP.design.map((d, i) => <div key={i} className="hs-tile"><span>{design[i]}</span><strong>{d.value}{d.unit && <small>{d.unit}</small>}</strong></div>)}</div><div className="hs-hotspots"><Dots total={11} filled={1} /></div></Step>
    </div>
    <Footer s={s} />
  </>;
}

function Cldn({ locale }: { locale: Locale }) {
  const s = STORIES[locale].cldn, v = STORIES[locale].verdict, h = s.headers, roles = s.text.roles.split('|'), hot = s.text.hot.split('|'), arom = s.text.arom.split('|');
  const stablePct = (CLDN.scan.stable / CLDN.scan.total) * 100;
  return <>
    <Header s={s} />
    <div className="hs-steps">
      <Step n={1} {...s.steps[0]}><div className="hs-variants">{CLDN.variants.map((x, i) => <div key={x.site} className="hs-variant" style={{ '--i': i } as CSSProperties}>
        <strong>{x.site}</strong><span className="hs-swap"><b>{x.a}</b><ArrowRight size={13} aria-hidden="true" /><b className="alt">{x.b}</b></span><small>{h.a} → {h.b}</small><p>{roles[i]}</p></div>)}</div></Step>
      <Step n={2} {...s.steps[1]}><div className="hs-acc">{CLDN.accuracy.map((a, i) => <div key={a.part} className="hs-acc-row"><span className="hs-acc-name">{a.part}</span>
        <span className="hs-acc-bar"><Grow w={(a.rmsd / 1.5) * 100} delay={i * 0.12} /><u aria-hidden="true" /></span><strong>{a.rmsd.toFixed(2)} Å</strong><small>{a.aligned} · {a.conf}</small></div>)}
        <div className="hs-acc-row"><span className="hs-acc-name">{h.epitope}</span><span className="hs-acc-dots"><Dots total={11} filled={9} /></span><strong>9 / 11</strong><small>82%</small></div></div></Step>
      <Step n={3} {...s.steps[2]}><div className="hs-scan"><div className="hs-scan-bar"><Grow w={stablePct} className="hs-scan-fill" /></div>
        <div className="hs-scan-legend"><span><b>{CLDN.scan.stable.toLocaleString('en-US')}</b>{h.scanStable} · {stablePct.toFixed(0)}%</span><span><b>{CLDN.scan.total.toLocaleString('en-US')}</b>{h.scanAll}</span></div></div>
        <div className="hs-finds"><div className="hs-find"><em>{hot[0]}</em><strong>{hot[1]}</strong><p>{hot[2]}</p></div><div className="hs-find"><em>{arom[0]}</em><strong>{arom[1]}</strong><p>{arom[2]}</p></div></div></Step>
      <Step n={4} {...s.steps[3]}><Grid className="hs-g-x" template="1.5fr 1.1fr 1.2fr 66px 74px" cols={[{ key: 'm', label: h.mut }, { key: 'a', label: h.aff }, { key: 's', label: h.stab }, { key: 'p', label: h.pct }, { key: 'v', label: h.verdict }]}
        rows={CLDN.cross.map((r, i) => ({ key: r.id, v: r.verdict, cells: [
          <code key="c">{r.id}</code>,
          <span key="a" className="hs-x-cell"><span className="hs-x-track"><Grow w={(Math.abs(r.aff) / 2.2) * 100} delay={i * 0.08} className="hs-x-good" /></span><b>{r.affLabel ?? r.aff.toFixed(2).replace('-', '−')}</b></span>,
          <span key="s" className="hs-x-cell"><span className="hs-x-mid"><motion.i className={r.stab >= 0 ? 'pos' : 'neg'} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }} style={{ width: `${(Math.abs(r.stab) / 5) * 50}%`, [r.stab >= 0 ? 'left' : 'right']: '50%' }} /></span><b>{r.stabLabel ?? (r.stab > 0 ? '+' : '') + r.stab.toFixed(2).replace('-', '−')}</b></span>,
          <em key="p">{r.pct}</em>, <Pill key="v" v={r.verdict} label={v[r.verdict]} />] }))} /></Step>
    </div>
    <Footer s={s} />
  </>;
}

/** Cases 04 / 05: data-driven steps, each with optional tiles and a table. */
const bestCell = (c: string) => /[↑↓]$/.test(c) ? <b className="hs-best">{c.replace(/\s*[↑↓]$/, '')}<i aria-hidden="true">{c.endsWith('↑') ? '↑' : '↓'}</i></b> : c;
/** Parent-RMSD (x) against humanization score (y) of the representative candidates, drawn from the real values. */
function Scatter({ d }: { d: NonNullable<CaseStep['scatter']> }) {
  const xs = d.points.map(p => p.x), ys = d.points.map(p => p.y), x0 = Math.min(...xs) - 0.3 * (d.plain ? 1 : 0.1), x1 = Math.max(...xs) + (d.plain ? 0.5 : 0.03), y0 = Math.min(...ys) - (d.plain ? 0.4 : 0.02), y1 = Math.max(...ys) + (d.plain ? 0.4 : 0.02);
  const H = d.plain ? 250 : 140, top = 28, bot = top + H, W = d.plain ? 480 : 540;
  const X = (v: number) => 64 + ((v - x0) / (x1 - x0)) * W, Y = (v: number) => bot - ((v - y0) / (y1 - y0)) * H, zx = x0 < 0 && x1 > 0, zy = y0 < 0 && y1 > 0, R = 64 + W;
  return <figure className="hs-quad"><svg viewBox={`0 0 680 ${bot + 50}`} role="img" aria-label={`${d.xLabel} / ${d.yLabel}`}>
    <rect x="64" y={top} width={W} height={H} className="hs-quad-good" opacity=".5" />
    {zy && <line x1="64" x2={R} y1={Y(0)} y2={Y(0)} className="hs-quad-zero" />}{zx && <line x1={X(0)} x2={X(0)} y1={top} y2={bot} className="hs-quad-zero" />}<line x1="64" x2={R} y1={bot} y2={bot} className="hs-quad-zero" /><line x1="64" x2="64" y1={top} y2={bot} className="hs-quad-zero" />
    {d.points.map((p, i) => <g key={p.id} className="hs-quad-pt" data-v="ok" style={{ '--i': i } as CSSProperties}><circle cx={X(p.x)} cy={Y(p.y)} r="16" className="halo" /><circle cx={X(p.x)} cy={Y(p.y)} r="6" />
      {d.plain ? <text x={X(p.x) + 14} y={Y(p.y) + 5} style={{ fontSize: 14 }}>{p.id}</text> : <text x={X(p.x)} y={Y(p.y) - 16} textAnchor="middle" style={{ fontSize: 14 }}>{p.id} · {p.x.toFixed(3)}, {p.y.toFixed(4)}</text>}</g>)}
    <text x={64 + W / 2} y={bot + 36} textAnchor="middle" className="hs-quad-axis" style={{ fontSize: 14 }}>{d.xLabel}</text><text x="18" y={top + H / 2} textAnchor="middle" transform={`rotate(-90 18 ${top + H / 2})`} className="hs-quad-axis" style={{ fontSize: 14 }}>{d.yLabel}</text>
  </svg></figure>;
}
function Shots({ images }: { images: CaseImage[] }) {
  const [i, setI] = useState(0);
  return <figure className="hs-shot">{images.length > 1 && <div className="hs-shot-tabs" role="tablist">{images.map((im, k) => <button key={im.src} role="tab" aria-selected={k === i} data-active={k === i || undefined} onClick={() => setI(k)}>{im.label}</button>)}</div>}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={images[i].src} alt={images[i].label} loading="lazy" /></figure>;
}

/** Cases 04 / 05: data-driven steps, each with optional tiles, anchors, chart, table and screenshots. */
function CaseView({ s }: { s: CaseText }) {
  return <>
    <Header s={s} />
    <div className="hs-steps">{s.steps.map((st, i) => <Step key={st.title} n={i + 1} title={st.title} lead={st.lead} takeaway={st.takeaway} tags={st.tags}>
      {st.anchors && <div className="hs-anchors">{st.anchors.map((a, k) => <div key={a.tag} className="hs-anchor" style={{ '--i': k } as CSSProperties}><em>{a.tag}</em><strong>{a.pair}</strong><span>{a.detail}</span></div>)}</div>}
      {st.tiles && <Tiles tiles={st.tiles} />}
      {st.scatter && <Scatter d={st.scatter} />}
      {st.table && <><Grid className="hs-g-case" template={st.table.template} cols={st.table.cols.map((c, k) => ({ key: String(k), label: c }))}
        rows={st.table.rows.map((r, j) => ({ key: String(j), v: r.v, cells: r.cells.map((c, k) => k === 0 ? <code key="c">{c}</code> : bestCell(c)) }))} /></>}
      {st.images && <Shots images={st.images} />}
    </Step>)}</div>
    <Footer s={s} />
  </>;
}

function Header({ s }: { s: { tag: string; title: string; subtitle: string; intro: string; tiles: Tile[]; flow: Link[]; flowLabel: string } }) {
  return <header className="hs-head"><p className="hc-kicker"><span>{s.tag}</span></p><h2><Phrases text={s.title} /></h2><p className="hc-sub"><Flow text={s.subtitle} /></p><p className="hs-intro"><Flow text={s.intro} /></p><Tiles tiles={s.tiles} />
    <div className="hs-mosflow"><span>{s.flowLabel}</span>{s.flow.map((f, i) => <Fragment key={f.label}>{i > 0 && <ArrowRight size={12} aria-hidden="true" />}<a href={f.href}>{f.label}</a></Fragment>)}</div></header>;
}
function Footer({ s }: { s: { conclusionTitle: string; conclusion: string } }) {
  return <footer className="hs-foot-block"><div className="hs-conclusion"><Minus size={16} aria-hidden="true" /><div><strong>{s.conclusionTitle}</strong><p><Flow text={s.conclusion} /></p></div></div></footer>;
}

function Mm({ locale, children }: { locale: Locale; children: ReactNode }) {
  const m = STORIES[locale].mm;
  return <>
    <header className="hs-head"><p className="hc-kicker"><span>{m.tag}</span></p><h2><Phrases text={m.title} /></h2><p className="hs-intro"><Flow text={m.lead} /></p></header>
    <ol className="hs-mmflow">{m.steps.map((st, i) => <li key={st.title}><span className="hs-mmno">{i + 1}</span><em>{st.tag}</em><strong>{st.title}</strong><p>{st.body}</p></li>)}</ol>
    {children}
  </>;
}

type StoryKey = 'mm' | 'glp' | 'cldn' | 'd13' | 'petase';
// Each story wears the hue of its main kind of work (lib/palette.ts): peptide design, affinity maturation, humanization (sequence),
// enzyme stability, and the MMetrics reading of one molecule (sequence).
const HUE: Record<StoryKey, string> = { glp: MODULE.design, cldn: MODULE.affinity, d13: MODULE.sequence, petase: MODULE.stability, mm: MODULE.sequence };

/**
 * User stories: a list to choose one (a sticky column at the side on wide screens, a swipeable row on narrow ones),
 * then that story alone in one reading column, ending with a way into the next story so nobody has to scroll back up.
 */
export function HelpStories({ locale, mm }: { locale: Locale; mm: ReactNode }) {
  const [tab, setTab] = useState<StoryKey>('glp');
  const top = useRef<HTMLDivElement>(null);
  const t = STORIES[locale], c = CASES[locale];
  const stories: { k: StoryKey; label: string; title: string }[] = [
    { k: 'glp', label: t.glp.tab, title: t.glp.title }, { k: 'cldn', label: t.cldn.tab, title: t.cldn.title },
    { k: 'd13', label: c.d13.tab, title: c.d13.title }, { k: 'petase', label: c.petase.tab, title: c.petase.title },
    { k: 'mm', label: t.mm.tab, title: t.mm.title },
  ];
  const index = stories.findIndex(x => x.k === tab), next = stories[(index + 1) % stories.length], last = index === stories.length - 1;
  const choose = (k: StoryKey) => {
    setTab(k);
    // Always start the chosen story from its beginning, whichever control was used.
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  };
  return <div className="hs" style={{ '--h': HUE[tab] } as CSSProperties}>
    <div className="hs-layout">
      <div className="hs-picker" role="tablist" aria-orientation="vertical">{stories.map((x, i) => <button key={x.k} role="tab" aria-selected={tab === x.k} data-active={tab === x.k || undefined} style={{ '--h': HUE[x.k] } as CSSProperties} onClick={() => choose(x.k)}>
        <i>{String(i + 1).padStart(2, '0')}</i><strong>{x.label}</strong><span>{x.title}</span>
      </button>)}</div>
      <div ref={top} className="hs-main">
        <div className="hs-panel" key={tab} role="tabpanel">{tab === 'mm' ? <Mm locale={locale}>{mm}</Mm> : tab === 'glp' ? <Glp locale={locale} /> : tab === 'cldn' ? <Cldn locale={locale} /> : <CaseView s={c[tab]} />}</div>
        <button className="hs-next" style={{ '--h': HUE[next.k] } as CSSProperties} onClick={() => choose(next.k)}>
          <small>{last ? (locale === 'zh' ? '回到第一个案例' : 'Back to the first story') : (locale === 'zh' ? '下一个案例' : 'Next story')} · {String((index + 1) % stories.length + 1).padStart(2, '0')} / {String(stories.length).padStart(2, '0')}</small>
          <strong>{next.label}</strong><span><Flow text={next.title} /></span>
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>;
}
