'use client';

/*
 * Step 05: no starting molecule. A prompt is typed into the Mocha box, the box fades and the target (human PD-L1, 5GRJ)
 * condenses out of particles with its six hotspots lit; a new binder is then generated onto it (particles condense on the
 * face while the designed sequence settles), and the three independent designs of a real MOS Protein Binder Design run
 * (shown as Design 1–3; MOS random seeds 111 / 333 / 222) can be swapped, each re-forming on the same hotspots.
 * Sequences, pLDDT (binder Cα mean, from the predicted-complex B-factors), hotspot distances and buried areas are local
 * audits of the MOS outputs. No ipTM, PAE or affinity exists for these designs; they are unvalidated computational proposals.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import data from '@/content/pdl1-denovo.json';
import { createViewer, type ViewerController } from '@/components/hero/molstar-controller';
import { ParticleForge } from './particle-forge';
import mochaIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-mocha.svg';
import '@/components/hero/mocha-upgrade/vendor-tokens.css';
import './prompt-flow.css';
import './affinity-case.css';
import './denovo-flow.css';

type Contact = { id: number; orig: number; aa: string; d: number; tAtom: string; bAtom: string; b: number; bAA: string; a: number[]; c: number[] };
type Design = (typeof data.designs)[number] & { contacts: Contact[] };
// Shown in the order of the local geometry review (hotspot coverage, then buried area, then binder pLDDT); not an affinity ranking.
const DESIGNS = ['seed111', 'seed333', 'seed222'].map(label => data.designs.find(d => d.label === label)!) as Design[];
const TARGET = '#7DF3C4', HOT = '#6FD3FF';
const DESIGN_COLOR: Record<string, string> = { seed333: '#F08BD0', seed111: '#FFB86B', seed222: '#B5A1FA' };
const hotLabels = data.hotspots.map(h => `B:${h.id}`);
const frameLabels = [...Array.from({ length: data.target.len }, (_, i) => `B:${i + 1}`), ...Array.from({ length: DESIGNS[0].len }, (_, i) => `A:${i + 1}`)];
const centroid = (pts: number[]) => { const n = pts.length / 3; return [0, 1, 2].map(k => { let s = 0; for (let i = k; i < pts.length; i += 3) s += pts[i]; return s / n; }); };
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const AMINO = 'ACDEFGHIKLMNPQRSTVWY';
const HOT_TAGS = ['R113'];

const COPY = {
  zh: {
    prompt: '为 PD-L1 的结合面从零设计新的结合蛋白（60–100 aa），生成 3 个独立设计', placeholder: '粘贴 FASTA 序列、上传 PDB 文件，或直接提问…',
    target: '靶点', targetSub: (n: number) => `人 PD-L1 胞外域 · ${n} 个残基`, hot: '热点残基', hotSub: '与 PD-1 / 抗体竞争的结合面上的 6 个位点',
    gen: '生成新结合蛋白', genSub: (k: number, n: number) => `设计 ${k} · ${n} aa · 去噪中`, designs: '三个独立设计', designsSub: '同一靶点、同一热点，三次独立生成 · 按热点覆盖与埋藏面积排序',
    plddt: 'Binder pLDDT', hotspots: '热点接触', buried: '单侧埋藏面积', contacts: '残基接触对', seq: '设计序列',
     hint: '选择一个设计，看它如何落在同一组热点上',
    seed: '设计', aa: 'aa', of: '/ 6', close: '距离很近，需几何松弛', lead: (l: string, n: number) => `${l} · ${n} aa`,
  },
  en: {
    prompt: 'Design new binders for the PD-L1 binding face from scratch (60–100 aa), three independent designs', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…',
    target: 'Target', targetSub: (n: number) => `Human PD-L1 extracellular domain · ${n} residues`, hot: 'Hotspots', hotSub: '6 sites on the face that PD-1 and antibodies compete for',
    gen: 'Generating a new binder', genSub: (k: number, n: number) => `Design ${k} · ${n} aa · denoising`, designs: 'Three independent designs', designsSub: 'Same target, same hotspots, three independent runs · ordered by hotspot coverage and buried area',
    plddt: 'Binder pLDDT', hotspots: 'Hotspots touched', buried: 'Buried per side', contacts: 'Contact pairs', seq: 'Designed sequence',
     hint: 'Select a design to see it land on the same hotspots',
    seed: 'Design', aa: 'aa', of: '/ 6', close: 'very close, needs relaxation', lead: (l: string, n: number) => `${l} · ${n} aa`,
  },
} as const;

type Tag = { id: string; color: string; at: number[]; head: string; sub: string; lead?: boolean };
type Phase = 'compose' | 'target' | 'gen' | 'done';

export default function DenovoFlowStage({ locale, onReady, onFail }: { locale: string; onReady: () => void; onFail: () => void }) {
  const t = locale === 'en' ? COPY.en : COPY.zh;
  const root = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), fx = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerController | null>(null), forge = useRef<ParticleForge | null>(null);
  const run = useRef({ n: 0 }).current, touched = useRef(false), played = useRef(false), manual = useRef(false), shownDesign = useRef(0), swap = useRef(0);
  const callbacks = useRef({ onReady, onFail }); callbacks.current = { onReady, onFail };
  const [ready, setReady] = useState(false), [onScreen, setOnScreen] = useState(false);
  const [typed, setTyped] = useState(''), [stage, setStage] = useState<'compose' | 'docked'>('compose');
  const [phase, setPhase] = useState<Phase>('compose'), [selected, setSelected] = useState(0), [progress, setProgress] = useState(0), [tick, setTick] = useState(0);
  const cur = DESIGNS[selected];

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
      src: '/demo/pdl1-denovo.cif', label: 'PD-L1 (B) + designed binders (A, C, D)', showcase: true, startHidden: true,
      chains: [{ auth: 'B', color: TARGET }, { auth: 'A', color: DESIGN_COLOR.seed333 }, { auth: 'C', color: DESIGN_COLOR.seed111 }, { auth: 'D', color: DESIGN_COLOR.seed222 }],
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

  // The hotspot glows and the six contact lines of the design on show (the lines are real atom pairs of that design).
  const decorate = (i: number) => {
    const f = forge.current, v = viewer.current;
    if (!f || !v) return;
    const d = DESIGNS[i];
    void v.showSites([{ labels: hotLabels, color: HOT }]);
    f.setSites([{ points: data.hotspots.flatMap(h => h.at), color: HOT, size: 11, pulse: !reduced() }]);
    f.setArcs(reduced() ? null : d.contacts.flatMap(c => [...c.a, ...c.c]), '#C9FFF0');
  };
  const frame = () => { touched.current = false; viewer.current?.focusRegion(frameLabels, -16, 90, false, 0.72); };
  const chainsFor = (i: number | null) => (i === null ? ['B'] : ['B', DESIGNS[i].chain]);

  // Swap the binder on show: the old one dissolves into particles, the new one condenses onto the same hotspots.
  const swapTo = async (i: number, user: boolean) => {
    const v = viewer.current, f = forge.current;
    if (!v || !f) return;
    if (user) manual.current = true;
    setSelected(i);
    if (i === shownDesign.current) { decorate(i); return; }
    const id = ++swap.current, from = shownDesign.current;
    f.clear(); f.setArcs(null);
    shownDesign.current = i;
    if (reduced()) { v.showChains(chainsFor(i)); decorate(i); return; }
    await f.form({ chains: [{ points: DESIGNS[from].ca, color: DESIGN_COLOR[DESIGNS[from].label] }], dir: 'out', duration: 1300, onReveal: () => v.showChains(chainsFor(null)) });
    if (swap.current !== id) return;
    await f.form({ chains: [{ points: DESIGNS[i].ca, color: DESIGN_COLOR[DESIGNS[i].label] }], dir: 'in', duration: 2400, onReveal: () => v.showChains(chainsFor(i)) });
    if (swap.current !== id) return;
    decorate(i);
  };

  useEffect(() => {
    const v = viewer.current, f = forge.current;
    if (!v || !f || !ready) return;
    const token = ++run.n, alive = () => run.n === token;
    const reset = () => { setTyped(''); setStage('compose'); setPhase('compose'); setSelected(0); setProgress(0); shownDesign.current = 0; f.clear(); f.setArcs(null); void v.showSites([]); v.showChains([]); };
    if (!onScreen && !played.current && !reduced()) { reset(); return () => { run.n++; }; }
    if (played.current || reduced()) {
      setStage('docked'); setPhase('done'); const i = played.current ? shownDesign.current : 0; setSelected(i); shownDesign.current = i; v.showChains(chainsFor(i)); frame();
      if (onScreen) setTimeout(() => alive() && decorate(i), 80);
      return () => { run.n++; };
    }

    void (async () => {
      reset(); frame(); manual.current = false;
      await wait(900); if (!alive()) return;
      for (let i = 1; i <= t.prompt.length; i++) { setTyped(t.prompt.slice(0, i)); await wait(26 + (i % 6 === 0 ? 40 : 0)); if (!alive()) return; }
      await wait(700); if (!alive()) return;
      // The box dissolves in place while the target condenses out of particles.
      setStage('docked');
      await f.form({ chains: [{ points: data.target.ca, color: TARGET }], dir: 'in', duration: 4200, onReveal: () => v.showChains(chainsFor(null)) });
      if (!alive()) return;
      setPhase('target');
      await wait(500); if (!alive()) return;
      void v.showSites([{ labels: hotLabels, color: HOT }]);
      f.setSites([{ points: data.hotspots.flatMap(h => h.at), color: HOT, size: 12, pulse: true }]);
      await wait(2200); if (!alive()) return;
      // A new binder is generated onto those hotspots; its sequence settles as the particles do.
      setPhase('gen'); setProgress(0);
      const first = DESIGNS[0];
      await f.form({ chains: [{ points: first.ca, color: DESIGN_COLOR[first.label] }], dir: 'in', duration: 5600, onProgress: p => setProgress(Math.round(p * 50) / 50), onReveal: () => v.showChains(chainsFor(0)) });
      if (!alive()) return;
      setProgress(1); setPhase('done'); decorate(0);
      played.current = true;
      // One pass through the three designs, then it rests on the first; a click takes over at any point.
      for (const i of [1, 2, 0]) {
        await wait(4200); if (!alive() || manual.current) return;
        await swapTo(i, false);
        if (!alive() || manual.current) return;
      }
    })();
    return () => { run.n++; f.clear(); f.setArcs(null); };
  // `run` is a stable counter used only to cancel superseded scenes; the script is keyed to readiness and visibility.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onScreen, locale]);

  // Noise letters keep shimmering while the sequence is being generated.
  useEffect(() => {
    if (phase !== 'gen' || reduced()) return;
    const timer = setInterval(() => setTick(k => k + 1), 90);
    return () => clearInterval(timer);
  }, [phase]);

  const tags = useMemo<Tag[]>(() => {
    if (phase !== 'done') return [];
    const color = DESIGN_COLOR[cur.label], c0 = centroid(cur.ca);
    const picks = cur.contacts.filter(c => HOT_TAGS.includes(`${c.aa}${c.orig}`));
    return [
      { id: 'lead', color, at: c0, head: t.lead(`${t.seed} ${selected + 1}`, cur.len), sub: `${t.plddt} ${cur.plddt}`, lead: true },
      ...picks.map(c => ({ id: `h${c.id}`, color: HOT, at: [(c.a[0] + c.c[0]) / 2, (c.a[1] + c.c[1]) / 2, (c.a[2] + c.c[2]) / 2], head: `${c.aa}${c.orig} ⋯ ${c.bAA}${c.b}`, sub: `${c.d} Å${c.d < 2.2 ? ` · ${t.close}` : ''}` })),
    ];
  }, [phase, cur, selected, t]);
  const tagEls = useRef<(HTMLDivElement | null)[]>([]), leaderEls = useRef<(SVGLineElement | null)[]>([]);
  useEffect(() => {
    const v = viewer.current;
    if (!tags.length || !onScreen || !v) return;
    let raf = 0;
    const src = new Float32Array(tags.length * 3 + 3), out = new Float32Array(tags.length * 3 + 3);
    tags.forEach((tag, i) => src.set(tag.at, i * 3 + 3));
    const tickFrame = () => {
      v.project(src, out);
      const w = root.current?.clientWidth ?? 0, h = root.current?.clientHeight ?? 400, limit = w > 640 ? w - 296 : w - 20;
      tags.forEach((tag, i) => {
        const el = tagEls.current[i], line = leaderEls.current[i], px = out[i * 3 + 3], py = out[i * 3 + 4];
        if (!el) return;
        // The lead chip sits above the binder, the contact chip below its contact point.
        let x = px, y = tag.lead ? py - 46 : py + 52;
        x = Math.min(limit - el.offsetWidth / 2, Math.max(el.offsetWidth / 2 + 8, x)); y = Math.min(h - 24, Math.max(22, y));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`; el.dataset.live = '1';
        line?.setAttribute('x1', px.toFixed(1)); line?.setAttribute('y1', py.toFixed(1)); line?.setAttribute('x2', x.toFixed(1)); line?.setAttribute('y2', (tag.lead ? y + 12 : y).toFixed(1));
      });
      raf = requestAnimationFrame(tickFrame);
    };
    raf = requestAnimationFrame(tickFrame);
    return () => cancelAnimationFrame(raf);
  }, [tags, onScreen]);

  const live = phase === 'gen' ? DESIGNS[0] : cur;
  const settled = Math.round(live.len * progress);
  const seqText = phase === 'gen' ? live.seq.split('').map((aa, i) => (i < settled ? aa : AMINO[(i * 7 + tick * 13 + i * i) % AMINO.length])).join('') : cur.seq;
  const dots = (n: number) => Array.from({ length: 6 }, (_, i) => <i key={i} data-on={i < n || undefined} />);
  return <div ref={root} className="ak an" data-ready={ready || undefined} data-stage={stage}>
    <div ref={host} className="ak-view" aria-label="PD-L1 · chain B / designed binders"><canvas ref={canvas} /><canvas ref={fx} className="ak-fx" aria-hidden="true" /></div>

    <svg className="ak-leaders" data-on={tags.length > 0 || undefined} aria-hidden="true" key={`l${selected}`}>{tags.map((tag, i) => <line key={tag.id} ref={el => { leaderEls.current[i] = el; }} style={{ stroke: tag.color }} />)}</svg>
    <div className="ak-tags" data-on={tags.length > 0 || undefined} aria-hidden="true">{tags.map((tag, i) => <div key={`${selected}-${tag.id}`} ref={el => { tagEls.current[i] = el; }} className="ak-tag" data-kind={tag.lead ? 'pick' : 'ds'} style={{ ['--tag' as string]: tag.color, animationDelay: `${i * 90}ms` }}><b>{tag.head}</b><span>{tag.sub}</span></div>)}</div>

    <section className="ak-panel an-panel" data-on={phase !== 'compose' || undefined} aria-hidden={phase === 'compose'}>
      {phase !== 'done' ? <div className="an-body" key="steps">
        <ol className="an-steps">
          <li data-state="done"><i /><div><b>{t.target}</b><span>{t.targetSub(data.target.len)}</span></div></li>
          <li data-state={phase === 'target' ? 'active' : 'done'}><i /><div><b>{t.hot}</b><span>{t.hotSub}</span><p className="an-hot">{data.hotspots.map(h => <em key={h.id}>{h.aa === 'ILE' ? 'I' : h.aa === 'TYR' ? 'Y' : h.aa === 'GLU' ? 'E' : h.aa === 'VAL' ? 'V' : 'R'}{h.orig}</em>)}</p></div></li>
          <li data-state={phase === 'gen' ? 'active' : 'pending'}><i /><div><b>{t.gen}</b><span>{t.genSub(1, live.len)}</span>
            {phase === 'gen' && <><span className="an-bar"><u style={{ transform: `scaleX(${progress})` }} /></span><code className="an-seq"><b>{seqText.slice(0, settled)}</b>{seqText.slice(settled)}</code></>}
          </div></li>
        </ol>
      </div> : <div className="an-body" key="designs">
        <strong>{t.designs}</strong>
        <p className="ad-sub">{t.designsSub}</p>
        <div className="an-list" role="listbox" aria-label={t.designs}>
          {DESIGNS.map((d, i) => <button type="button" key={d.label} role="option" aria-selected={selected === i} onClick={() => void swapTo(i, true)} style={{ ['--dc' as string]: DESIGN_COLOR[d.label] }}>
            <i /><div><b>{t.seed} {i + 1}</b><span>{d.len} {t.aa}</span></div><span className="an-dots">{dots(d.hot)}</span><code>{d.plddt}</code>
          </button>)}
        </div>
        <div className="an-detail" key={cur.label} style={{ ['--dc' as string]: DESIGN_COLOR[cur.label] }}>
          <dl>
            <div><dt>{t.plddt}</dt><dd>{cur.plddt}</dd></div>
            <div><dt>{t.hotspots}</dt><dd>{cur.hot} <small>{t.of}</small></dd></div>
            <div><dt>{t.buried}</dt><dd>{cur.bsa} <small>Å²</small></dd></div>
            <div><dt>{t.contacts}</dt><dd>{cur.pairs}</dd></div>
          </dl>
          <code className="an-seq an-seq-final" aria-label={t.seq}>{cur.seq}</code>
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
    <p className="ak-hint" data-on={phase === 'done' || undefined}>{t.hint}</p>
  </div>;
}
