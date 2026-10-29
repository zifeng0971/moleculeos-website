'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Bell, Check, ChevronDown, Copy, FolderOpen, History, Mail, Plus, Ruler, Network, ScanSearch, Search, SendHorizontal, Settings, Eye, Upload, ZoomIn, ZoomOut } from 'lucide-react';

/*
 * Illustrations of the MOS workbench for the help center. They follow the real product's structure, naming and colours
 * (top bar, protein list, viewer toolbar, Mocha panel, Task / Share / Function List / SeqSim), redrawn with more polish.
 * Everything is decorative and aria-hidden; the data shown is illustrative (4HT1 naming), not real results.
 */
const W = 640, H = 400;

/** Renders a fixed-size design and scales it to the container width, so details stay in proportion at any size. */
function Stage({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = host.current!, update = () => setScale(el.clientWidth / W);
    update(); const ro = new ResizeObserver(update); ro.observe(el); return () => ro.disconnect();
  }, []);
  return <div ref={host} className="mx-host" style={{ height: H * scale }} aria-hidden="true"><div className="mx" style={{ width: W, height: H, transform: `scale(${scale})` }}>{children}</div></div>;
}

const Bar = ({ project = 'mmetrics' }: { project?: string }) => <header className="mx-bar">
  <span className="mx-logo">MoleculeOS<i>BETA</i></span><span className="mx-project">{project}<ChevronDown size={9} /></span>
  <span className="mx-bar-right"><span className="mx-avatars"><b>X</b><b>S</b><b>Z</b></span><u>Task</u><u>Share</u><Mail size={11} /><Bell size={11} /><Settings size={11} /></span>
</header>;

const Tabs = ({ active = 'Mocha' }: { active?: string }) => <div className="mx-tabs">{['Mocha', 'MMetrics'].map(t => <span key={t} data-on={t === active || undefined}><i className={t === 'Mocha' ? 'mx-ico-mocha' : 'mx-ico-mm'} />{t}</span>)}</div>;
const Chip = ({ c, children }: { c: 'orange' | 'green' | 'red' | 'blue' | 'violet' | 'gray'; children: ReactNode }) => <span className="mx-chip" data-c={c}>{children}</span>;

/** Real Mol* renders (transparent WebP) of 4HT1 and PETase, made offline with the same viewer the site uses. */
const ART = { complex: '/demo/art/mos-complex.webp', sites: '/demo/art/mos-sites.webp', seqsim: '/demo/art/mos-seqsim.webp' } as const;
// eslint-disable-next-line @next/next/no-img-element -- static export; the files are already optimised WebP
const Protein = ({ kind, className }: { kind: keyof typeof ART; className?: string }) => <img className={'mx-prot3d ' + (className ?? '')} src={ART[kind]} alt="" draggable={false} loading="lazy" decoding="async" />;
const Toolbar = () => <div className="mx-tools"><ZoomIn size={10} /><ZoomOut size={10} /><ScanSearch size={10} /><i /><Ruler size={10} /><Network size={10} /><Eye size={10} /></div>;
const Dock = ({ active }: { active?: string }) => <div className="mx-dock"><span data-on={active === 'Mutation' || undefined}>Aₓ Mutation</span><span data-on={active === 'Function List' || undefined}>⠿ Function List</span><span data-on={active === 'SeqSim Search' || undefined}><Search size={9} />SeqSim Search</span></div>;
const Seq = ({ cdr = [] as number[] }) => <div className="mx-seq"><p>4HT1_TWEAK_rabbit_Fv_complex</p><span className="mx-seq-chains"><b>1:</b><b>A</b><b>B</b><b>C</b></span>
  <div>{'QEQLVESGGGLVQPGGSLTLSCKASGFDFSTYYMSWVRQAPGKGLEWIG'.split('').map((c, i) => <em key={i} data-cdr={cdr.includes(i) || undefined}>{c}</em>)}</div></div>;
const File = ({ name }: { name: string }) => <div className="mx-file"><span className="mx-csv"><i>{name.split('.').pop()?.toUpperCase()}</i></span><b>{name}</b><u>View</u><u>Download</u></div>;

/* 1 · Mocha */
function MochaScene() {
  return <><Bar /><div className="mx-body"><section className="mx-panel mx-viewcol mx-lead"><Seq cdr={[25, 26, 27, 28, 29, 30, 31, 32, 50, 51, 52]} /><div className="mx-viewer"><Protein kind="complex" /><Toolbar /></div><Dock /></section><section className="mx-panel mx-grow">
    <Tabs /><div className="mx-mocha-head"><i className="mx-ico-mocha" /><b>Mocha</b><code>c40a5136-e</code><Copy size={9} /><span><FolderOpen size={11} /><History size={11} /><Plus size={11} /></span></div>
    <div className="mx-thread">
      <div className="mx-user"><p>Predict the structure and recommend 30 mutations that may improve affinity, avoiding contact positions.</p></div>
      <div className="mx-ai"><span className="mx-ai-tag"><i className="mx-ico-mocha" />Mocha</span>
        <p>I&apos;ll break this into steps.</p>
        <ul className="mx-todos">{[['Predict structure with MMFold', 'done'], ['Mark antigen-contact positions', 'done'], ['Score single-point mutations', 'run'], ['Rank and explain candidates', 'wait']].map(([t, s]) => <li key={t} data-s={s}><span>{s === 'done' ? <Check size={8} strokeWidth={3} /> : null}</span>{t}</li>)}</ul>
        <div className="mx-taskchip"><i />TWEAK_Fv_affinity_scan<em>Binding Affinity Mutation Scoring</em><b>Running</b></div>
      </div>
    </div>
    <div className="mx-composer"><span>4HT1_TWEAK…</span><p>Ask Mocha, paste a FASTA sequence or upload a PDB file…</p><div><span><Upload size={9} />Upload</span><i><SendHorizontal size={10} /></i></div></div>
  </section></div></>;
}

/* 2 · MMFold */
function FoldScene() {
  return <><Bar /><div className="mx-body mx-split">
    <section className="mx-panel">
      <p className="mx-label">Function List</p>
      <div className="mx-fn"><Protein kind="complex" className="mx-fn-art" /><b>MMFold</b><p>Structure prediction for protein / ligand / DNA / RNA, with specialized optimization for antibody–antigen modeling.</p><Chip c="orange">Structure Prediction</Chip></div>
      <p className="mx-label">Input (FASTA)</p>
      <div className="mx-fasta"><code>&gt;VH:VL</code><code>QEQLVESGGGLVQPGG<b>:</b>AIEMTQTPFSVSAAVG</code><code>&gt;Antigen</code><code>MKGRKTRARRAIAAHYEVHPRPGQ</code></div>
    </section>
    <section className="mx-panel mx-grow">
      <div className="mx-job"><i /><b>4HT1_TWEAK_rabbit_Fv_complex</b><em>Structure Prediction with MMFold</em><Chip c="green">Succeed</Chip></div>
      <div className="mx-viewer"><Protein kind="complex" /><Toolbar /></div>
      <div className="mx-samples">{['Sample 1', 'Sample 2', 'Sample 3'].map((s, i) => <span key={s} data-on={i === 0 || undefined}>{s}</span>)}<em>Import to project →</em></div>
    </section></div></>;
}

/* 3 · MMetrics */
function MetricsScene() {
  return <><Bar /><div className="mx-body mx-split"><section className="mx-panel mx-viewcol"><Seq cdr={[25, 26, 27, 28, 29, 30, 31, 32, 50, 51, 52]} /><div className="mx-viewer"><Protein kind="complex" /><Toolbar /></div></section>
    <section className="mx-panel mx-grow"><Tabs active="MMetrics" /><div className="mx-pills"><span data-on>4HT1_TWEAK_rabbit…</span></div>
      <p className="mx-label">DESCRIPTION</p><div className="mx-card"><div className="mx-row"><Chip c="blue">● Antigen–Antibody</Chip><Chip c="green">confidence: high</Chip></div><p>TWEAK in complex with the Fab fragment of a neutralizing antibody.</p><div className="mx-row"><Chip c="gray">Chain A · VH</Chip><Chip c="gray">Chain B · VL</Chip><Chip c="gray">Chain C</Chip></div></div>
      <p className="mx-label">ANNOTATIONS <span className="mx-scheme">{['IMGT', 'Kabat', 'Chothia'].map((s, i) => <b key={s} data-on={i === 0 || undefined}>{s}</b>)}</span></p>
      <div className="mx-card"><p className="mx-cdr-title">CDR <small>6 regions · IMGT</small></p><div className="mx-row">{['H-CDR1', 'H-CDR2', 'H-CDR3', 'L-CDR1', 'L-CDR2', 'L-CDR3'].map((c, i) => <b key={c} className="mx-mono" data-on={i === 1 || undefined}>{c}</b>)}</div></div>
    </section></div></>;
}

/* 4 · SeqSim Search */
function SeqSimScene() {
  const rows = [['4HT1', 'Crystal', 100], ['O43508', '', 100], ['O54907', '', 93.5], ['Q9GZV5', '', 71.2]] as const;
  return <><Bar /><div className="mx-body mx-split"><section className="mx-panel mx-viewcol"><div className="mx-viewer mx-dim"><Protein kind="seqsim" /></div>
    <div className="mx-pop"><div className="mx-pop-tabs"><b data-on>Search by chain</b><b>Search by sequence</b></div><p>Protein: <span>5xh3<ChevronDown size={9} /></span></p><div className="mx-pop-row"><span>chain-A</span><u>Blast</u></div></div><Dock active="SeqSim Search" /></section>
    <section className="mx-panel mx-grow"><p className="mx-label">HOMOLOGS <small>Searched by antigen sequence similarity</small></p>
      {rows.map(([id, type, pct], i) => <div key={id} className="mx-homolog" data-on={i < 3 || undefined}><span className="mx-check">{i < 3 && <Check size={8} strokeWidth={3} />}</span><code>{id}</code>{type && <Chip c="green">{type}</Chip>}<b>{pct}%</b><u>Reference ↗</u></div>)}
      <div className="mx-actions"><span>Filter</span><span className="mx-primary">Align</span></div>
      <div className="mx-align">{[0, 1, 2].map(r => <div key={r}>{'KGRKTRARRAAIAAHYEV'.split('').map((c, i) => <em key={i} data-k={[2, 3, 7, 8, 12].includes(i) || undefined}>{r === 1 && i % 5 === 4 ? '-' : c}</em>)}</div>)}</div>
    </section></div></>;
}

/* 5 · Locating sites */
function SitesScene() {
  const links: [string, string, string, string][] = [['H-Bond', 'ARG54 · GLU57', '2.64', 'teal'], ['Ionic', 'ASP104 · ARG132', '3.63', 'red'], ['π-Cation', 'TYR101 · ARG130', '4.14', 'amber'], ['π-π Stack', 'PHE107 · TYR36', '6.43', 'orange']];
  return <><Bar /><div className="mx-body"><section className="mx-panel mx-grow mx-stagecol"><div className="mx-viewer mx-big"><Protein kind="sites" /><Toolbar />
    <span className="mx-flag"><i />Keep: ARG54</span></div><Dock /></section>
    <section className="mx-panel mx-nc"><p className="mx-label">Non-Covalent Bond</p>
      {links.map(([t, r, d, c]) => <div key={t} className="mx-link"><i data-c={c} /><span><b>{t}</b><small>{r}</small></span><em>{d} Å</em></div>)}
      <p className="mx-label">Hotspots</p>{[88, 64, 46].map((w, i) => <div key={i} className="mx-hot"><code>{['ARG54', 'ASN102', 'TYR101'][i]}</code><span><u style={{ width: `${w}%` }} /></span><b>{[5, 4, 3][i]}</b></div>)}
      <div className="mx-actions"><span>Superimpose</span><span>5Å</span><span>Distance</span></div></section></div></>;
}

/* 6 · Mutation scoring */
const AA = 'ACDEFGHIKLMNPQRSTVWY'.split('');
function ScoreScene() {
  const cols = 22;
  return <><Bar /><div className="mx-body mx-split"><section className="mx-panel mx-viewcol mx-reserve"><p className="mx-label">Seq Fitness <small>· Mutation Effect</small></p>
    <div className="mx-hmap"><div className="mx-hmap-y">{AA.filter((_, i) => i % 2 === 0).map(a => <i key={a}>{a}</i>)}</div>
      <div className="mx-heat2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>{Array.from({ length: 20 * cols }, (_, i) => { const r = Math.floor(i / cols), c = i % cols; return <em key={i} style={{ '--v': (Math.sin(r * 1.7 + c * 0.9) + Math.cos(c * 0.55 - r * 0.4) + 2) / 4 } as CSSProperties} data-hit={(r === 8 && c === 7) || (r === 14 && c === 15) || undefined} />; })}</div>
      <div className="mx-hmap-x">{[1, 5, 10, 15, 20].map(n => <i key={n}>{n * 4}</i>)}</div></div>
    <div className="mx-ramp"><span>deleterious</span><i /><span>beneficial</span></div>
    <div className="mx-callout"><b>A:Y52 → F</b><span>top candidate</span><em>+0.82</em></div>
    <div className="mx-menu"><p>Mutation</p><span>Seq Fitness Mutation Effect</span><span>Evolutionary Mutation Effect</span></div><Dock active="Mutation" /></section>
    <section className="mx-panel mx-grow"><Tabs active="MMetrics" /><p className="mx-label">MUTATION SCORING</p><File name="MutXevo.csv" /><File name="MutXstruct.csv" /><File name="MutXseq.csv" />
      <p className="mx-label">Mocha · Protein Redesign</p><div className="mx-card"><div className="mx-row"><Chip c="violet">Input Data</Chip><Chip c="violet">Output Data</Chip></div><p className="mx-mono mx-fa">&gt;redesign_01 · FASTA</p></div></section></div></>;
}

/* 7 · Team */
function TeamScene() {
  return <><Bar /><div className="mx-body mx-split"><section className="mx-panel mx-grow"><p className="mx-label">Task List</p>
    <div className="mx-table"><div className="mx-th"><span>name</span><span>status</span><span>type</span></div>
      {[['TWEAK_Fv_affinity_scan', 'Binding Affinity Mutation Scoring'], ['TWEAK_Fv_stability_scan', 'Structure Fitness Mutation Effect'], ['4HT1_TWEAK_rabbit_Fv', 'Structure Prediction with MMFold']].map(([n, t]) => <div key={n} className="mx-tr"><span>{n}</span><span><Chip c="green">Succeed</Chip></span><span>{t}</span></div>)}</div>
    <p className="mx-label">Workspace</p><File name="report.pdf" /></section>
    <section className="mx-panel mx-share"><b>Share project</b><u>Share link</u><div className="mx-invite"><span>Invite colleagues by name</span><i>Invite</i></div>
      {[['xinxu', 'Owner'], ['shengchen', 'Edit'], ['zifengye', 'Read']].map(([n, r]) => <div key={n} className="mx-member"><b>{n}</b><span>{r}<ChevronDown size={9} /></span></div>)}
      <p className="mx-label">Annotation</p><div className="mx-note"><i />A:ARG54 · <em>to keep</em></div></section></div></>;
}

const SCENES = [MochaScene, FoldScene, MetricsScene, SeqSimScene, SitesScene, ScoreScene, TeamScene];
export function MosMock({ kind }: { kind: number }) {
  const Scene = SCENES[kind] ?? MochaScene;
  return <Stage><Scene /></Stage>;
}
