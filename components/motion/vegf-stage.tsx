'use client';

/*
 * The running case of the capability section: PDB 2FJG (G6 Fab in complex with VEGF-A) rendered live with Mol*.
 * One viewer stays mounted across the four tabs; each tab only changes which chains, sites and camera are shown.
 * Coordinates and contact sets are real (content/vegf-2fjg.json is derived from the file); rankings, curves and
 * the generation panel are illustrative and tagged as such.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import vegf from '@/content/vegf-2fjg.json';
import { createViewer, type ViewerController } from '@/components/hero/molstar-controller';
import { meltPath } from '@/components/motion/task-visuals';
import { ParticleForge } from '@/components/motion/particle-forge';

export type VegfLabels = Record<
  'loading' | 'hint' | 'tag' | 'binder' | 'vegf' | 'fab' | 'epitope' | 'paratope' | 'locked' | 'framework' | 'contacts' | 'stepVegf' | 'stepFab' | 'stepComplex' | 'antigenSide' | 'fabSide' | 'target',
  string
> & { captions: Record<string, string> };
export type StageLabels = { vegf: VegfLabels; candidates: string; melting: string; before: string; after: string; generating: string; denoise: string; illustrative: string };

const COLOR = {
  vegfA: '#52D1AB', vegfB: '#3FA98C', lightA: '#CDBFFF', heavyA: '#9378FF', lightB: '#B0A0F2', heavyB: '#8068E6',
  epitope: '#C9FFF0', paratope: '#F08BD0', framework: '#FFDB13',
};
const CHAINS = [
  { auth: 'V', color: COLOR.vegfA }, { auth: 'W', color: COLOR.vegfB },
  { auth: 'L', color: COLOR.lightA }, { auth: 'H', color: COLOR.heavyA },
  { auth: 'A', color: COLOR.lightB }, { auth: 'B', color: COLOR.heavyB },
];
const STEPS: string[][] = [['V', 'W'], ['V', 'W', 'L', 'H'], ['V', 'W', 'L', 'H', 'A', 'B']];
const EPITOPE_SITES = { labels: [...vegf.epitope, ...vegf.epitopeMirror], color: COLOR.epitope };
const PARATOPE_SITES = { labels: [...vegf.paratope, ...vegf.paratopeMirror], color: COLOR.paratope };
const FRAMEWORK_SITES = { labels: vegf.framework, color: COLOR.framework };
const range = (chain: string, from: number, count: number) => Array.from({ length: count }, (_, i) => `${chain}:${from + i}`);
// Every VEGF-A / Fab residue label; labels absent from the model are skipped when framing.
const DIMER = [...range('V', 14, 96), ...range('W', 14, 96)];
const FAB1 = [...range('L', 1, 211), ...range('H', 1, 218)];
const FAB2 = [...range('A', 1, 211), ...range('B', 1, 218)];
const FRAMES: string[][] = [DIMER, [...DIMER, ...FAB1], [...DIMER, ...FAB1, ...FAB2]];
const CA = vegf.ca as Record<string, number[]>;
const POS = vegf.pos as Record<string, number[]>;
const chainColor = Object.fromEntries(CHAINS.map(c => [c.auth, c.color])) as Record<string, string>;
const trace = (chains: string[]) => chains.map(c => ({ points: CA[c], color: chainColor[c] }));
const at = (labels: readonly string[]) => labels.flatMap(l => POS[l] ?? []);
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const CANDIDATES = vegf.hotspotsFab.slice(0, 5).map((label, i) => {
  const [chain, seq] = label.split(':');
  return { label, id: `${chain === vegf.pair.heavy ? 'H' : 'L'}·${(vegf.paratopeAa as Record<string, string>)[label]}${seq}`, score: [0.92, 0.8, 0.68, 0.56, 0.44][i] };
});
const RANK_SEQUENCE = [[3, 1, 4, 0, 2], [1, 3, 0, 4, 2], [0, 1, 3, 2, 4], [0, 1, 2, 3, 4]];
const AMINO = 'ACDEFGHIKLMNPQRSTVWY';
const BINDER = 'DIQMTQSPSSLSASVGDRVTITCRASQDVSTAVAWYQQKPGKAPKLLIYSASFLYS'.split('');

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function Legend({ items }: { items: { color: string; text: string }[] }) {
  return <div className="tv-chip vegf-chip"><code>PDB 2FJG</code>{items.map(item => <span key={item.text} className="tv-chain"><i style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />{item.text}</span>)}</div>;
}

function Ranking({ title, viewer }: { title: string; viewer: ViewerController | null }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduced()) { setStep(RANK_SEQUENCE.length - 1); return; }
    const timer = setInterval(() => setStep(k => (k + 1) % (RANK_SEQUENCE.length + 2)), 1800);
    return () => clearInterval(timer);
  }, []);
  const order = RANK_SEQUENCE[Math.min(step, RANK_SEQUENCE.length - 1)];
  return <div className="tv-panel tv-ranking vegf-panel">
    <p className="tv-panel-title">{title}</p>
    <ol style={{ height: CANDIDATES.length * 30 }} onMouseLeave={() => viewer?.highlight(null)}>
      {CANDIDATES.map((c, k) => { const rank = order.indexOf(k); return <li key={c.id} style={{ transform: `translateY(${rank * 30}px)` }} data-top={rank === 0 || undefined} onMouseEnter={() => viewer?.highlight(c.label)}>
        <span className="tv-rank-no">{rank + 1}</span><code>{c.id}</code><span className="tv-rank-bar"><i style={{ transform: `scaleX(${c.score})` }} /></span>
      </li>; })}
    </ol>
  </div>;
}

function Melting({ labels }: { labels: StageLabels }) {
  const still = reduced(), A = meltPath(16), B = meltPath(26);
  return <div className="tv-panel tv-melt vegf-panel">
    <p className="tv-panel-title">{labels.melting}</p>
    <svg viewBox="-4 -3 168 66" aria-hidden="true">
      <defs><linearGradient id="vegf-melt-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#65CBF3" /><stop offset="0.78" stopColor="#65CBF3" /><stop offset="1" stopColor="#65CBF3" stopOpacity="0.45" /></linearGradient></defs>
      <path d={meltPath(16)} className="tv-melt-before" />
      {/* The improved curve rises out of the dashed original (same points, shifted transition), holds, then settles back. */}
      <path d={meltPath(26)} className="tv-melt-after" style={{ stroke: 'url(#vegf-melt-grad)' }}>
        {!still && <>
          <animate attributeName="d" dur="8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.1;0.4;0.88;1" keySplines="0 0 1 1;.3 0 .2 1;0 0 1 1;.6 0 .4 1" values={`${A};${A};${B};${B};${A}`} />
          <animate attributeName="opacity" dur="8s" repeatCount="indefinite" keyTimes="0;0.1;0.18;0.9;1" values="0;0;1;1;0" />
        </>}
      </path>
    </svg>
    <div className="tv-melt-legend"><span><i className="tv-dash" />{labels.before}</span><span><i />{labels.after}</span><span className="tv-axis">T →</span></div>
  </div>;
}

/** Denoising readout; `progress` follows the particles condensing in the viewer (0 = noise, 1 = settled). */
function Generating({ labels, progress }: { labels: StageLabels; progress: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduced()) return;
    const timer = setInterval(() => setTick(k => k + 1), 90);
    return () => clearInterval(timer);
  }, []);
  const settled = Math.round(BINDER.length * progress);
  const text = BINDER.map((aa, i) => (i < settled ? aa : AMINO[(i * 7 + tick * 13 + i * i) % AMINO.length])).join('');
  return <div className="tv-panel tv-gen vegf-panel">
    <p className="tv-panel-title"><span className="tv-live" data-done={progress >= 1 || undefined} />{labels.generating}</p>
    <div className="tv-gen-row"><span>{labels.denoise}</span><code>{String(Math.round((1 - progress) * 50)).padStart(2, '0')}</code></div>
    <span className="tv-gen-bar"><i style={{ transform: `scaleX(${progress})` }} /></span>
    <code className="tv-gen-seq"><b>{text.slice(0, settled)}</b>{text.slice(settled)}</code>
  </div>;
}

function Assembly({ step, labels }: { step: number; labels: VegfLabels }) {
  const rows = [labels.stepVegf, labels.stepFab, labels.stepComplex];
  return <div className="tv-panel vegf-panel vegf-steps">
    <ol>{rows.map((text, i) => <li key={text} data-state={step > i ? 'done' : step === i ? 'active' : 'pending'}><span className="vegf-step-dot" />{text}</li>)}</ol>
    <p data-on={step >= 2 || undefined}>{labels.contacts}<span><b>{vegf.epitope.length}</b> {labels.antigenSide} · <b>{vegf.paratope.length}</b> {labels.fabSide}</span></p>
  </div>;
}

export default function VegfStage({ id, labels, onReady, onFail }: { id: string; labels: StageLabels; onReady: () => void; onFail: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null), fx = useRef<HTMLCanvasElement>(null), container = useRef<HTMLDivElement>(null);
  const viewer = useRef<ViewerController | null>(null), forge = useRef<ParticleForge | null>(null);
  const [ready, setReady] = useState(false);
  // Scenes only play while the stage is actually on screen; the viewer itself is mounted earlier so it is ready in time.
  const [onScreen, setOnScreen] = useState(false);
  const [step, setStep] = useState(3);
  const [denoise, setDenoise] = useState(1);
  const resume = useRef<ReturnType<typeof setTimeout>>();
  const run = useRef({ n: 0 }).current, introduced = useRef(false), touched = useRef(false);
  const callbacks = useRef({ onReady, onFail }); callbacks.current = { onReady, onFail };

  useEffect(() => {
    const abort = new AbortController();
    let instance: ViewerController | undefined, visible = true;
    const spin = () => instance?.spin(visible && !document.hidden && !reduced());
    const interact = () => { instance?.spin(false); clearTimeout(resume.current); resume.current = setTimeout(spin, 4500); };
    const host = container.current!;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; instance?.active(visible); forge.current?.setVisible(visible); spin(); });
    observer.observe(host);
    const screen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.35 });
    screen.observe(host);
    // A resized stage (rotation, layout shift, late fonts) changes the aspect ratio the framing was computed for; refit unless the user has taken the camera.
    const resize = new ResizeObserver(() => { forge.current?.resize(); if (!touched.current) viewer.current?.refit(); });
    resize.observe(host);
    const pointer = () => { touched.current = true; interact(); };
    host.addEventListener('pointerdown', pointer); host.addEventListener('wheel', pointer, { passive: true });
    void createViewer(canvas.current!, host, () => {}, () => {}, () => {}, abort.signal, undefined, {
      src: '/demo/2fjg.cif', label: '2FJG · G6 Fab–VEGF-A', showcase: true, chains: CHAINS, startHidden: !reduced(),
    }).then(value => {
      if (abort.signal.aborted) { value.dispose(); return; }
      instance = value; viewer.current = value;
      forge.current = new ParticleForge(fx.current!, (src, out) => value.project(src, out), !reduced());
      setReady(true); callbacks.current.onReady(); spin();
    }).catch(() => { if (!abort.signal.aborted) callbacks.current.onFail(); });
    return () => {
      abort.abort(); run.n++; observer.disconnect(); screen.disconnect(); resize.disconnect(); clearTimeout(resume.current);
      host.removeEventListener('pointerdown', pointer); host.removeEventListener('wheel', pointer);
      forge.current?.dispose(); forge.current = null; viewer.current = null; instance?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` is a stable counter object
  }, []);

  // Scene per tab. Structures condense out of particles and dissolve back into them; the interface is then lit up.
  useEffect(() => {
    const v = viewer.current, f = forge.current;
    if (!v || !f || !ready) return;
    const token = ++run.n, alive = () => run.n === token;
    const still = reduced();
    const frame = (labelsToFrame: string[], pad: number, fixed = false) => { touched.current = false; v.focusRegion(labelsToFrame, pad, 90, fixed); };
    f.clear(); void v.showSites([]);
    if (!onScreen) {
      // Parked at the very start: nothing built yet, so the first thing a visitor sees is the beginning of the story.
      if (!still) { v.showChains([]); setStep(0); setDenoise(0); } else v.showChains(undefined);
      introduced.current = false;
      return () => { run.n++; };
    }
    // Reduced motion shows the finished state; otherwise the panels start at their first step and fill in as the scene plays.
    setStep(still ? 3 : 0); setDenoise(still ? 1 : 0);

    const litInterface = () => {
      void v.showSites([EPITOPE_SITES, PARATOPE_SITES]);
      f.setArcs(vegf.arcs.flat());
      f.setSites([{ points: at([...vegf.epitope, ...vegf.epitopeMirror]), color: COLOR.epitope, size: 13, pulse: true }, { points: at([...vegf.paratope, ...vegf.paratopeMirror]), color: COLOR.paratope, size: 13, pulse: true }]);
    };

    void (async () => {
      // First visit: the whole complex condenses out of a particle cloud.
      // The structure and de novo scenes build everything from scratch themselves, so they skip the whole-complex opening.
      if (!introduced.current && !still && id !== 'denovo' && id !== 'structure') {
        introduced.current = true;
        v.showChains([]); frame(FRAMES[2], 2);
        await f.form({ chains: trace(['V', 'W', 'L', 'H', 'A', 'B']), dir: 'in', duration: 3200, onReveal: () => v.showChains(undefined) });
        if (!alive()) return;
      }
      introduced.current = true;
      if (id === 'denovo') v.showChains(['V', 'W']); else if (id === 'structure') v.showChains([]); else v.showChains(undefined);

      if (id === 'affinity') {
        frame(FRAMES[2], 14, true); litInterface();
      } else if (id === 'stability') {
        void v.showSites([PARATOPE_SITES, FRAMEWORK_SITES]);
        frame(FRAMES[2], 14, true);
        f.setSites([{ points: at([...vegf.paratope, ...vegf.paratopeMirror]), color: COLOR.paratope, size: 12 }, { points: at(vegf.framework), color: COLOR.framework, size: 17, pulse: true }]);
      } else if (id === 'denovo') {
        const target = ['V', 'W'], withBinder = [...DIMER, ...range('H', 1, 218)];
        const sites = [{ labels: [...vegf.epitope, ...vegf.epitopeMirror], color: COLOR.epitope }];
        if (still) { v.showChains([...target, 'H']); void v.showSites(sites); frame(withBinder, 2, true); return; }
        while (alive()) {
          v.showChains(target); void v.showSites(sites); frame(withBinder, 2, true); setDenoise(0);
          f.setSites([{ points: at(vegf.epitope), color: COLOR.epitope, size: 14, pulse: true }]);
          await wait(700); if (!alive()) return;
          await f.form({ chains: trace(['H']), dir: 'in', duration: 5600, onProgress: p => setDenoise(Math.min(1, Math.round(p / 0.8 * 50) / 50)), onReveal: () => v.showChains([...target, 'H']) });
          if (!alive()) return;
          setDenoise(1);
          await wait(3600); if (!alive()) return;
          await f.form({ chains: trace(['H']), dir: 'out', duration: 1900, onReveal: () => v.showChains(target) });
        }
      } else {
        if (still) { v.showChains(undefined); frame(FRAMES[2], 2); void v.showSites([EPITOPE_SITES, PARATOPE_SITES]); return; }
        const added = [['V', 'W'], ['L', 'H'], ['A', 'B']];
        while (alive()) {
          v.showChains([]); f.setArcs(null); f.setSites([]); void v.showSites([]);
          for (let i = 0; i < 3; i++) {
            setStep(i === 0 ? 0 : 1); frame(FRAMES[i], i === 0 ? 10 : 2);
            await wait(i === 0 ? 500 : 250); if (!alive()) return;
            await f.form({ chains: trace(added[i]), dir: 'in', duration: 2800, onReveal: () => v.showChains(STEPS[i]) });
            if (!alive()) return;
          }
          setStep(2); litInterface();
          await wait(1400); if (!alive()) return;
          setStep(3);
          await wait(4200); if (!alive()) return;
          f.setArcs(null); f.setSites([]); void v.showSites([]);
          await f.form({ chains: trace(['V', 'W', 'L', 'H', 'A', 'B']), dir: 'out', duration: 2000, onReveal: () => v.showChains([]) });
        }
      }
    })();
    return () => { run.n++; f.clear(); };
  // `run` is a stable counter object used only to cancel superseded scenes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ready, onScreen]);

  const l = labels.vegf;
  const legend = id === 'affinity' ? [{ color: COLOR.epitope, text: l.epitope }, { color: COLOR.paratope, text: l.paratope }]
    : id === 'stability' ? [{ color: COLOR.paratope, text: l.locked }, { color: COLOR.framework, text: l.framework }]
    : id === 'denovo' ? [{ color: COLOR.vegfA, text: l.target }, { color: COLOR.epitope, text: l.epitope }, { color: COLOR.heavyA, text: l.binder }]
    : [{ color: COLOR.vegfA, text: l.vegf }, { color: COLOR.heavyA, text: l.fab }];
  const panel = id === 'affinity' ? <Ranking title={labels.candidates} viewer={viewer.current} />
    : id === 'stability' ? <Melting labels={labels} />
    : id === 'denovo' ? <Generating labels={labels} progress={denoise} />
    : <Assembly step={step} labels={l} />;

  return <div className="tv-stage vegf-stage" data-task={id} data-ready={ready || undefined}>
    <div ref={container} className="vegf-viewer" aria-label={l.vegf + ' · PDB 2FJG'}>
      <canvas ref={canvas} />
      <canvas ref={fx} className="vegf-fx" aria-hidden="true" />
      <span className="tv-tag">{l.tag}</span>
      <AnimatePresence mode="wait" initial={false}><motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><Legend items={legend} /></motion.div></AnimatePresence>
    </div>
    <div className="vegf-dock">
      <AnimatePresence mode="wait" initial={false}>
        <motion.p key={id} className="vegf-caption" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35 }}>
          {l.captions[id]}<small>{l.hint}</small>
        </motion.p>
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}><motion.div key={id} className="vegf-panel-slot" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>{panel}</motion.div></AnimatePresence>
    </div>
  </div>;
}
