'use client';

/*
 * Step 04: the structure already exists (the PD-L1 / KN035 complex from step 01), so there is no agent run. A one-line
 * prompt is typed into the Mocha box, the box fades and the complex condenses straight out of a particle cloud. The right-hand
 * panel then walks through the real case-04 screen of KN035 (5JDS): first what is protected (CDRs, disulfides, interface),
 * then the shortlisted framework substitutions, each tied to its residue on the structure.
 * Scores are baseline-relative percentiles of MOS model outputs (arbitrary units); sequence properties are computed
 * locally. They are screening values, not measured stability, solubility or expression.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import complex from '@/content/pdl1-kn035.json';
import dev from '@/content/kn035-developability.json';
import { createViewer, type ViewerController } from '@/components/hero/molstar-controller';
import { ParticleForge } from './particle-forge';
import mochaIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-mocha.svg';
import '@/components/hero/mocha-upgrade/vendor-tokens.css';
import './prompt-flow.css';
import './affinity-case.css';
import './stability-flow.css';

const COLORS = { target: '#7DF3C4', binder: '#B5A1FA', protect: '#F08BD0', bond: '#FFDB13', frame: '#6FD3FF', pick: '#FFCD5A', risk: '#FF9E6B' };
const range = ([a, b]: number[]) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const CDR = [dev.cdr.CDR1, dev.cdr.CDR2, dev.cdr.CDR3];
const cdrLabels = CDR.flatMap(r => range(r)).map(i => `B:${i}`);
const CYS = Array.from(new Set(Object.keys(dev.disulfides).flatMap(k => k.split('-').map(Number))));
const labelsAll = [...Array.from({ length: complex.lenA }, (_, i) => `A:${i + 1}`), ...Array.from({ length: complex.lenB }, (_, i) => `B:${i + 1}`)];
const trace = [{ points: complex.chainA as number[], color: COLORS.target }, { points: complex.chainB as number[], color: COLORS.binder }];
const centroid = (pts: number[]) => { const n = pts.length / 3; return [0, 1, 2].map(k => { let s = 0; for (let i = k; i < pts.length; i += 3) s += pts[i]; return s / n; }); };
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const COPY = {
  zh: {
    prompt: '保留 CDR 和二硫键，在框架区筛选 KN035 的突变，改善可开发性', placeholder: '粘贴 FASTA 序列、上传 PDB 文件，或直接提问…',
    tabs: ['受保护区域', '序列风险', '框架候选'], protectTitle: '先划定不能动的部分', candTitle: '框架突变候选',
    kept: '保留', cdr: (n: number) => `CDR1–3 · ${n} 个残基`, cdrSub: '结合环，不参与筛选', ds: '二硫键', dsSub: (a: string, b: string) => `C22–C96 ${a} Å · C33–C106 ${b} Å`, para: '界面残基', paraSub: (n: number) => `${n} 个与 PD-L1 接触的位点，不参与筛选`,
    screen: '筛选范围', screenSub: (n: number, m: string) => `${n} 个框架位点 · ${m} 个替换`, structure: '结构', sequence: '序列', evolution: '进化', composite: '综合',
    burial: { buried: '埋藏', 'partially exposed': '部分暴露', exposed: '暴露' } as Record<string, string>, exposed: '溶剂暴露',
    prop: (c: { mut: string; pI: number; met: number }) => (c.mut === 'M34L' ? '甲硫氨酸 4 → 3 · 去掉 M34 氧化关注位点' : c.mut === 'R19S' ? `理论 pI 9.01 → ${c.pI.toFixed(2)}` : c.mut === 'S85N' ? 'NS84–85 → NN84–85 · 基序改变，风险仍需评估' : '未引入新的风险基序'),
    ds1: 'C22–C96', ds2: 'C33–C106', cdr3: 'CDR3', hint: '选择一项，在结构上定位', wt: '框架位点',
    seqRow: '序列', seqSub: (n: number, mw: number, pI: number, g: number) => `${n} aa · ${mw} kDa · pI ${pI} · GRAVY ${g}`, ifaceSub: (n: number, b: number, h: number, sb: number) => `${n} 个残基 · 埋藏面积 ${b.toLocaleString('en-US')} Å² · ${h} 氢键 · ${sb} 盐桥`,
    riskTitle: '先扫描序列里的风险位点', riskSub: (r: number, g: number) => `按规则库模式匹配，共 ${r} 条命中，归为 ${g} 组`, lvl: { Medium: '中', Low: '低' } as Record<string, string>,
    risks: { met: '甲硫氨酸氧化', trp: '色氨酸氧化', deam: '脱酰胺', iso: '天冬氨酸异构化', dp: '酸敏裂解 (DP)', nq: 'N 端环化' } as Record<string, string>,
    bindRow: '结合 ΔΔG（预测）', bindUnit: 'kcal/mol', sasa: '溶剂可及', bindMeter: '结合',
  },
  en: {
    prompt: 'Keep the CDRs and disulfides, and screen KN035 framework mutations to improve developability', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…',
    tabs: ['Protected', 'Risks', 'Candidates'], protectTitle: 'First, what must not change', candTitle: 'Framework candidates',
    kept: 'Kept', cdr: (n: number) => `CDR1–3 · ${n} residues`, cdrSub: 'Binding loops, excluded from the screen', ds: 'Disulfides', dsSub: (a: string, b: string) => `C22–C96 ${a} Å · C33–C106 ${b} Å`, para: 'Interface', paraSub: (n: number) => `${n} residues contacting PD-L1, excluded`,
    screen: 'Screened', screenSub: (n: number, m: string) => `${n} framework positions · ${m} substitutions`, structure: 'Structure', sequence: 'Sequence', evolution: 'Evolution', composite: 'Composite',
    burial: { buried: 'Buried', 'partially exposed': 'Partly exposed', exposed: 'Exposed' } as Record<string, string>, exposed: 'solvent exposed',
    prop: (c: { mut: string; pI: number; met: number }) => (c.mut === 'M34L' ? 'Methionine 4 → 3 · removes the M34 oxidation flag' : c.mut === 'R19S' ? `Theoretical pI 9.01 → ${c.pI.toFixed(2)}` : c.mut === 'S85N' ? 'NS84–85 → NN84–85 · motif changes, risk still to assess' : 'No new liability motif'),
    ds1: 'C22–C96', ds2: 'C33–C106', cdr3: 'CDR3', hint: 'Select an item to locate it on the structure', wt: 'Framework site',
    seqRow: 'Sequence', seqSub: (n: number, mw: number, pI: number, g: number) => `${n} aa · ${mw} kDa · pI ${pI} · GRAVY ${g}`, ifaceSub: (n: number, b: number, h: number, sb: number) => `${n} residues · ${b.toLocaleString('en-US')} Å² buried · ${h} H-bonds · ${sb} salt bridges`,
    riskTitle: 'Then scan the sequence for risk sites', riskSub: (r: number, g: number) => `Rule-based pattern scan · ${r} hits in ${g} groups`, lvl: { Medium: 'Medium', Low: 'Low' } as Record<string, string>,
    risks: { met: 'Met oxidation', trp: 'Trp oxidation', deam: 'Deamidation', iso: 'Asp isomerization', dp: 'Acid-labile cleavage (DP)', nq: 'N-terminal cyclization' } as Record<string, string>,
    bindRow: 'Binding ΔΔG (predicted)', bindUnit: 'kcal/mol', sasa: 'solvent accessible', bindMeter: 'Binding',
  },
} as const;

type Tag = { id: string; color: string; at: number[]; head: string; sub: string; lead?: boolean };

export default function StabilityFlowStage({ locale, onReady, onFail }: { locale: string; onReady: () => void; onFail: () => void }) {
  const t = locale === 'en' ? COPY.en : COPY.zh;
  const root = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), fx = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerController | null>(null), forge = useRef<ParticleForge | null>(null);
  const run = useRef({ n: 0 }).current, touched = useRef(false), played = useRef(false), manual = useRef(false);
  const callbacks = useRef({ onReady, onFail }); callbacks.current = { onReady, onFail };
  const [ready, setReady] = useState(false), [onScreen, setOnScreen] = useState(false);
  const [typed, setTyped] = useState(''), [stage, setStage] = useState<'compose' | 'docked'>('compose');
  const [result, setResult] = useState(false), [tab, setTab] = useState(0), [selected, setSelected] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    let instance: ViewerController | undefined;
    const el = host.current!;
    const intersect = new IntersectionObserver(([entry]) => { instance?.active(entry.isIntersecting); forge.current?.setVisible(entry.isIntersecting); });
    intersect.observe(el);
    const screen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    screen.observe(root.current!);
    const resize = new ResizeObserver(() => { forge.current?.resize(); if (!touched.current) viewer.current?.refit(); });
    resize.observe(el);
    const pointer = () => { touched.current = true; };
    el.addEventListener('pointerdown', pointer); el.addEventListener('wheel', pointer, { passive: true });
    void createViewer(canvas.current!, el, () => {}, () => {}, () => {}, abort.signal, undefined, {
      src: '/demo/kn035-pdl1-mmfold.cif', label: 'PD-L1 (A) / KN035 VHH (B)', showcase: true, startHidden: true,
      chains: [{ auth: 'A', color: COLORS.target }, { auth: 'B', color: COLORS.binder }],
    }).then(value => {
      if (abort.signal.aborted) { value.dispose(); return; }
      instance = value; viewer.current = value;
      forge.current = new ParticleForge(fx.current!, (src, out) => value.project(src, out), !reduced());
      setReady(true); callbacks.current.onReady();
    }).catch(() => { if (!abort.signal.aborted) callbacks.current.onFail(); });
    return () => {
      abort.abort(); run.n++; intersect.disconnect(); screen.disconnect(); resize.disconnect();
      el.removeEventListener('pointerdown', pointer); el.removeEventListener('wheel', pointer);
      forge.current?.dispose(); forge.current = null; viewer.current = null; instance?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` is a stable counter object
  }, []);

  // Tab 0: everything that stays fixed. Tab 1 (with candidate `i`): one framework substitution on the structure.
  const show = (which: number, i = 0) => {
    const v = viewer.current, f = forge.current;
    if (!v || !f) return;
    touched.current = false;
    f.setArcs(null);
    if (which === 0) {
      v.focusRegion(labelsAll, -10, 90, false, 0.75);
      void v.showSites([{ labels: cdrLabels, color: COLORS.protect }, { labels: CYS.map(c => `B:${c}`), color: COLORS.bond }]);
      f.setSites([{ points: dev.screenedCa, color: COLORS.frame, size: 7, pulse: false }]);
    } else if (which === 1) {
      const g = dev.risks[i];
      v.focusRegion(g.res.map(r => `B:${r}`), 26, 90, false, 0.45);
      void v.showSites([{ labels: g.res.map(r => `B:${r}`), color: COLORS.risk }]);
      f.setSites([{ points: g.sides, color: COLORS.risk, size: 14, pulse: !reduced() }]);
    } else {
      const c = dev.cands[i];
      v.focusRegion([`B:${c.pos}`], 16, undefined, false, 0.55);
      void v.showSites([{ labels: [`B:${c.pos}`], color: COLORS.pick }]);
      f.setSites([{ points: dev.screenedCa, color: COLORS.frame, size: 5, pulse: false }, { points: c.side, color: COLORS.pick, size: 20, pulse: !reduced() }]);
    }
  };
  const go = (which: number, i = 0, user = true) => { if (user) manual.current = true; setTab(which); setSelected(i); show(which, i); };

  useEffect(() => {
    const v = viewer.current, f = forge.current;
    if (!v || !f || !ready) return;
    const token = ++run.n, alive = () => run.n === token;
    const frame = () => { touched.current = false; v.focusRegion(labelsAll, -10, 90, false, 0.75); };
    const reset = () => { setTyped(''); setStage('compose'); setResult(false); setTab(0); setSelected(0); f.clear(); f.setArcs(null); void v.showSites([]); v.showChains([]); };
    if (!onScreen && !played.current && !reduced()) { reset(); return () => { run.n++; }; }
    if (played.current || reduced()) {
      setStage('docked'); setResult(true); v.showChains(undefined); frame();
      if (onScreen) setTimeout(() => alive() && show(played.current ? tab : 2, played.current ? selected : 0), 80);
      if (reduced()) { setTab(2); }
      return () => { run.n++; };
    }

    void (async () => {
      reset(); frame(); manual.current = false;
      await wait(900); if (!alive()) return;
      for (let i = 1; i <= t.prompt.length; i++) { setTyped(t.prompt.slice(0, i)); await wait(26 + (i % 6 === 0 ? 40 : 0)); if (!alive()) return; }
      await wait(700); if (!alive()) return;
      // The box dissolves in place while the particles condense into the complex.
      setStage('docked');
      await f.form({ chains: trace, dir: 'in', duration: 5000, onReveal: () => v.showChains(undefined) });
      if (!alive()) return;
      setResult(true);
      await wait(600); if (!alive()) return;
      go(0, 0, false);
      played.current = true;
      await wait(5200); if (!alive() || manual.current) return;
      // What is risky in the sequence, one group at a time.
      for (let i = 0; i < dev.risks.length; i++) {
        go(1, i, false);
        await wait(2400); if (!alive() || manual.current) return;
      }
      // Then the candidates, one pass; it rests on the top one. A click takes over at any point.
      go(2, 0, false);
      for (let i = 1; i <= dev.cands.length; i++) {
        await wait(3300); if (!alive() || manual.current) return;
        go(2, i % dev.cands.length, false);
      }
    })();
    return () => { run.n++; f.clear(); f.setArcs(null); };
  // `run` is a stable counter used only to cancel superseded scenes; the script is keyed to readiness and visibility.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onScreen, locale]);

  const cur = dev.cands[Math.min(selected, dev.cands.length - 1)], rg = dev.risks[Math.min(selected, dev.risks.length - 1)];
  const tags = useMemo<Tag[]>(() => {
    if (tab === 0) {
      const d = dev.disulfides as Record<string, { a: number[]; b: number[]; d: number }>;
      return [
        { id: 'ds1', color: COLORS.bond, at: d['22-96'].a, head: t.ds1, sub: `SG–SG ${d['22-96'].d} Å` },
        { id: 'ds2', color: COLORS.bond, at: d['33-106'].a, head: t.ds2, sub: `SG–SG ${d['33-106'].d} Å` },
      ];
    }
    if (tab === 1) {
      const n = rg.sides.length / 3, at = [0, 1, 2].map(k => rg.sides.filter((_, j) => j % 3 === k).reduce((x, y) => x + y, 0) / n);
      return [{ id: 'risk', color: COLORS.risk, at, head: t.risks[rg.id], sub: rg.items.join(' · ') }];
    }
    return [
      { id: 'res', color: COLORS.pick, at: cur.side, head: `${cur.wt}${cur.pos} → ${cur.aa}`, sub: `${cur.region} · ${t.burial[cur.burial]} · ${Math.round(cur.sasa * 100)}% ${t.sasa}`, lead: true },
    ];
  }, [tab, cur, rg, t]);
  const tagEls = useRef<(HTMLDivElement | null)[]>([]), leaderEls = useRef<(SVGLineElement | null)[]>([]);
  const centre = useMemo(() => centroid(complex.chainB as number[]), []);
  useEffect(() => {
    const v = viewer.current;
    if (!result || !onScreen || !v) return;
    let raf = 0;
    const src = new Float32Array(tags.length * 3 + 3), out = new Float32Array(tags.length * 3 + 3);
    src.set(centre, 0); tags.forEach((tag, i) => src.set(tag.at, i * 3 + 3));
    const tick = () => {
      v.project(src, out);
      const w = root.current?.clientWidth ?? 0, h = root.current?.clientHeight ?? 400, limit = w > 640 ? w - 296 : w - 20, ax = out[0], ay = out[1];
      tags.forEach((tag, i) => {
        const el = tagEls.current[i], line = leaderEls.current[i], px = out[i * 3 + 3], py = out[i * 3 + 4];
        if (!el) return;
        let x = px, y = py - 44;
        if (!tag.lead) {
          let dx = px - ax, dy = py - ay, len = Math.hypot(dx, dy);
          if (len < 8) { dx = 1; dy = 0.4; len = 1.08; }
          x = px + (dx / len) * 60; y = py + (dy / len) * 60;
        }
        x = Math.min(limit - el.offsetWidth / 2, Math.max(el.offsetWidth / 2 + 8, x)); y = Math.min(h - 24, Math.max(22, y));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`; el.dataset.live = '1';
        line?.setAttribute('x1', px.toFixed(1)); line?.setAttribute('y1', py.toFixed(1)); line?.setAttribute('x2', x.toFixed(1)); line?.setAttribute('y2', (tag.lead ? y + 12 : y).toFixed(1));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tags, result, onScreen, centre]);

  const ds = dev.disulfides as Record<string, { d: number }>;
  const meter = (label: string, value: number) => <div className="ad-meter"><span>{label}</span><i><u style={{ width: `${value * 100}%` }} /></i><code>{Math.round(value * 100)}</code></div>;
  return <div ref={root} className="ak ad" data-ready={ready || undefined} data-stage={stage}>
    <div ref={host} className="ak-view" aria-label="PD-L1 · chain A / KN035 VHH · chain B"><canvas ref={canvas} /><canvas ref={fx} className="ak-fx" aria-hidden="true" /></div>

    <svg className="ak-leaders" data-on={result || undefined} aria-hidden="true" key={`l${tab}-${selected}`}>{tags.map((tag, i) => <line key={tag.id} ref={el => { leaderEls.current[i] = el; }} style={{ stroke: tag.color }} />)}</svg>
    <div className="ak-tags" data-on={result || undefined} aria-hidden="true">{tags.map((tag, i) => <div key={`${tab}-${selected}-${tag.id}`} ref={el => { tagEls.current[i] = el; }} className="ak-tag" data-kind={tag.lead ? 'pick' : 'ds'} style={{ ['--tag' as string]: tag.color, animationDelay: `${i * 90}ms` }}><b>{tag.head}</b><span>{tag.sub}</span></div>)}</div>

    <section className="ak-panel ad-panel" data-on={result || undefined} aria-hidden={!result}>
      <div className="ad-tabs" role="tablist">{t.tabs.map((label, i) => <button type="button" key={label} role="tab" aria-selected={tab === i} tabIndex={result ? 0 : -1} onClick={() => go(i, 0)}>{label}</button>)}</div>
      {tab === 0 ? <div className="ad-body" key="protect">
        <strong>{t.protectTitle}</strong>
        <ul className="ad-keep">
          <li><i style={{ background: COLORS.protect }} /><div><b>{t.cdr(CDR.reduce((n, r) => n + r[1] - r[0] + 1, 0))}</b><span>{t.cdrSub}</span></div><em>{t.kept}</em></li>
          <li><i style={{ background: COLORS.bond }} /><div><b>{t.ds}</b><span>{t.dsSub(String(ds['22-96'].d), String(ds['33-106'].d))}</span></div><em>{t.kept}</em></li>
          <li><i style={{ background: COLORS.target }} /><div><b>{t.para}</b><span>{t.ifaceSub(dev.paratope.length, dev.stats.bsa, dev.stats.hbonds, dev.stats.salt)}</span></div><em>{t.kept}</em></li>
          <li><i style={{ background: COLORS.binder }} /><div><b>{t.seqRow}</b><span>{t.seqSub(dev.stats.len, dev.stats.mw, dev.stats.pI, dev.stats.gravy)}</span></div></li>
          <li><i style={{ background: COLORS.frame }} /><div><b>{t.screen}</b><span>{t.screenSub(dev.stats.screened, dev.stats.substitutions.toLocaleString('en-US'))}</span></div></li>
        </ul>
      </div> : tab === 1 ? <div className="ad-body" key="risks">
        <strong>{t.riskTitle}</strong>
        <p className="ad-sub">{t.riskSub(dev.stats.ruleHits, 12)}</p>
        <div className="ak-list" role="listbox" aria-label={t.riskTitle}>
          {dev.risks.map((g, i) => <button type="button" key={g.id} role="option" aria-selected={selected === i} tabIndex={result ? 0 : -1} onClick={() => go(1, i)} className="ad-risk">
            <i style={{ background: COLORS.risk, opacity: g.level === 'Low' ? 0.45 : 1 }} /><div><b>{t.risks[g.id]}</b><span>{g.items.join(' · ')}</span></div><em className="ad-region">{t.lvl[g.level]}</em>
          </button>)}
        </div>
      </div> : <div className="ad-body" key="cands">
        <div className="ak-list" role="listbox" aria-label={t.candTitle}>
          {dev.cands.map((c, i) => <button type="button" key={c.mut} role="option" aria-selected={selected === i} tabIndex={result ? 0 : -1} onClick={() => go(2, i)}>
            <small>{String(i + 1).padStart(2, '0')}</small><b><span>{c.wt}{c.pos}</span><span className="ak-arrow">→</span><span className="ak-mut">{c.aa}</span></b>
            <em className="ad-region">{c.region}</em><span className="ak-score"><i style={{ width: `${c.composite * 100}%` }} /></span><code>{Math.round(c.composite * 100)}</code>
          </button>)}
        </div>
        <div className="ad-detail" key={cur.mut}>
          <div className="ad-meters">{meter(t.structure, cur.struct)}{meter(t.sequence, cur.seq)}{meter(t.evolution, cur.evo)}{meter(t.bindMeter, cur.bindPct)}</div>
          <p><b>{t.prop(cur)}</b><span>{t.bindRow} {cur.bind > 0 ? '+' : cur.bind < 0 ? '−' : ''}{Math.abs(cur.bind).toFixed(2)} {t.bindUnit}</span></p>
        </div>
      </div>}
    </section>

    <div className="pf-agent mocha-upgrade-root" data-stage={stage}>
      <header><Image src={mochaIcon} alt="" width={16} height={19} style={{ width: 16, height: 19 }} /><strong>Mocha</strong></header>
      <div className="pf-composer">
        <p data-empty={!typed || undefined}>{typed || t.placeholder}{typed && typed.length < t.prompt.length && <i className="pf-caret" />}</p>
        <button type="button" tabIndex={-1} aria-hidden="true" data-ready={typed.length >= t.prompt.length || undefined}><ArrowUp size={15} /></button>
      </div>
    </div>
    <p className="ak-hint" data-on={result && tab > 0 || undefined}>{t.hint}</p>
  </div>;
}
