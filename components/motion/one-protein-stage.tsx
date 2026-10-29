'use client';

/*
 * One molecule for the whole waterfall: the PD-L1 / KN035 complex of case 01 (MMFold_1). The Mocha box appears once, at
 * the start; after that every step is a different view of the same structure:
 *   0 fold      — sequences condense into the complex (ipTM 0.92 / pLDDT 93.7)
 *   1 interface — the MMetrics panel grows over the molecule; epitope (PD-L1) and paratope (KN035) light up
 *   2 affinity  — predicted-stronger KN035 substitutions and the PD-L1 residues they face (the panel fades away)
 *   3 develop   — what stays locked, and the framework substitutions that are safe to screen
 *   4 de novo   — KN035 dissolves; new binders condense on the same PD-L1 face, aimed at the same hotspots
 * Changes between steps never pop: whatever leaves fades into its thread and unravels into particles, whatever arrives gathers into a thread and
 * crossfades into the cartoon,
 * and the camera glides. Every residue id is MMFold_1 chain + label_seq_id (website-cases/pdl1/*-kn035, via
 * scripts/prepare-kn035-story.py); coordinates for the swarms and labels are the Cα traces of that same structure.
 */
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ArrowUp, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import story from '@/content/kn035-story.json';
import pdl1 from '@/content/pdl1-kn035.json';
import interactionMeasurements from '@/content/kn035-interaction-measurements.json';
import { interactionKey, type InteractionFocus } from '@/components/hero/interaction-focus';
import { InteractionRuler } from '@/components/hero/InteractionRuler';
import { createViewer, type ViewerController } from '@/components/hero/molstar-controller';
import { ParticleForge } from '@/components/motion/particle-forge';
import mochaIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-mocha.svg';
import '@/components/hero/mocha-upgrade/vendor-tokens.css';
import './prompt-flow.css';
import './one-protein.css';

const MMOverlay = dynamic(() => import('./one-protein-mm'), { ssr: false });

const C = { target: '#7DF3C4', binder: '#F08BD0', epitope: '#FFD166', paratope: '#FFFFFF', mutation: '#FF6FC2', candidate: '#FFD166', lock: '#FFFFFF' };
const DESIGN_COLORS = ['#FFB86B', '#B8A4FF', '#6FD3FF'];
const SEQ_A = 'MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE';
const SEQ_B = 'QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS';
const labelsAll = [...Array.from({ length: pdl1.lenA }, (_, i) => `A:${i + 1}`), ...Array.from({ length: pdl1.lenB }, (_, i) => `B:${i + 1}`)];
const A = (list: readonly number[]) => list.map(n => `A:${n}`);
const B = (list: readonly number[]) => list.map(n => `B:${n}`);
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// From 1024px the molecule's canvas covers the whole viewport (the stage is only where it is framed); below that the stage is unchanged.
const wide = () => typeof matchMedia === 'function' && matchMedia('(min-width: 1024px)').matches;
// The zoom chord is ⌘ + wheel on Apple devices and Ctrl + wheel elsewhere (both work everywhere; the hint names the local one).
const modKey = () => (typeof navigator !== 'undefined' && !/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent) ? 'Ctrl' : '⌘');
// How far out the viewer may pull back from a step's framing, as a multiple of its distance.
const FARTHEST = 1.8;
const trace = [{ points: pdl1.chainA as number[], color: C.target }, { points: pdl1.chainB as number[], color: C.binder }];
const { interface: iface, affinity, developability: dev, denovo } = story;
const cysB = dev.disulfides.flat();
const YAW = 70;

// Cα coordinates (Å, MMFold_1 frame) of every chain on the stage, and the colour each one settles to.
const CHAIN_PTS: Record<string, number[]> = { A: pdl1.chainA as number[], B: pdl1.chainB as number[], ...Object.fromEntries(denovo.designs.map(d => [d.chain, d.ca])) };
const CHAIN_COLOR: Record<string, string> = { A: C.target, B: C.binder, ...Object.fromEntries(denovo.designs.map((d, i) => [d.chain, DESIGN_COLORS[i]])) };
const ca = (chain: 'A' | 'B', list: readonly number[]) => list.flatMap(n => { const a = CHAIN_PTS[chain]; return [a[3 * n - 3], a[3 * n - 2], a[3 * n - 1]]; });
const mean = (p: number[]) => { const out = [0, 0, 0], n = p.length / 3; for (let i = 0; i < p.length; i += 3) { out[0] += p[i] / n; out[1] += p[i + 1] / n; out[2] += p[i + 2] / n; } return out; };
// Opening view of the complex: looking across the interface so PD-L1 (green) is on the left and KN035 (pink) on the right with the gap between them
// in plain sight, neither hiding the other, and both domains standing upright. "Upright" is the direction the β-strands run (long axis of each chain);
// the screen's horizontal is the line from the centre of A to the centre of B, squared up against it.
const sideBySide = (() => {
  const unit = (v: number[]) => { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; };
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // Long axis of a chain: power iteration on the covariance of its Cα atoms.
  const longAxis = (pts: number[]) => {
    const c = mean(pts), m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < pts.length; i += 3) { const d = [pts[i] - c[0], pts[i + 1] - c[1], pts[i + 2] - c[2]]; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) m[3 * a + b] += d[a] * d[b]; }
    let v = [1, 0.7, 0.4];
    for (let n = 0; n < 40; n++) v = unit([m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]]);
    return v;
  };
  const ma = mean(CHAIN_PTS.A), mb = mean(CHAIN_PTS.B), between = unit([mb[0] - ma[0], mb[1] - ma[1], mb[2] - ma[2]]);
  const la = longAxis(CHAIN_PTS.A), lb = longAxis(CHAIN_PTS.B), sign = Math.sign(dot(la, lb)) || 1;
  let up = unit([la[0] + sign * lb[0], la[1] + sign * lb[1], la[2] + sign * lb[2]]);
  if (up[1] < 0) up = up.map(v => -v);
  const k = dot(between, up), right = unit([between[0] - k * up[0], between[1] - k * up[1], between[2] - k * up[2]]);
  // Mol*'s screen-right is up × forward, so this side puts A on the left and B on the right.
  return { dir: cross(up, right), up };
})();
// A few particles around each residue so a handful of sites still reads as a glowing patch, not a few dots.
const swarm = (p: number[], k = 9, r = 2.2) => {
  const out: number[] = [...p];
  for (let i = 0; i < p.length; i += 3) for (let j = 0; j < k; j++) {
    const u = Math.sin((i + 1) * 12.9898 + j * 78.233) * 43758.5453, w = Math.sin((i + 1) * 39.346 + j * 11.135) * 24634.6345, z = Math.sin((i + 1) * 73.156 + j * 52.235) * 94731.2713;
    out.push(p[i] + (u - Math.floor(u) - 0.5) * 2 * r, p[i + 1] + (w - Math.floor(w) - 0.5) * 2 * r, p[i + 2] + (z - Math.floor(z) - 0.5) * 2 * r);
  }
  return out;
};

type Group = { labels: string[]; color: string };
type Swarm = { points: number[]; color: string };
type Tag = { id: string; text: string; at: number[]; color: string; dir?: 'up' | 'down' };
type Target = { chains: string[]; sites: Group[]; swarms: Swarm[]; tags: Tag[]; cam: (ms: number) => void; /** Zoom-out beat between two carousel items: the camera pulls back to the whole complex before moving to the next one. */ overview?: (ms: number) => void; /** Identity of the swarm set; an unchanged one (the hotspots between two designs) is left lit instead of flashing out and back. */ sig?: string };

const COPY = {
  zh: {
    prompt: '用 MMFold 预测人 PD-L1 与 KN035 纳米抗体的复合物结构', placeholder: '粘贴 FASTA 序列、上传 PDB 文件，或直接提问…', result: '结构预测完成', chains: '链', target: 'PD-L1 · A', binder: 'KN035 · B',
    pred: '预测结合', faces: 'PD-L1接触残基', ddg: 'ΔΔG', locked: '锁定：二硫键', cross: '候选突变', crossTitle: '候选突变的多维计算评估', structure: '结构适应度评分', sequence: '序列适应度评分', evolution: '进化适应度评分', liability: '风险提示', oxid: 'Met 氧化', none: '未检出', best: '推荐', hotspots: '热点', seed: '候选', binderLen: 'aa', bsa: '预测埋藏面积', coverage: '表位覆盖', hot: '热点接触',
    zoomIn: '放大', zoomOut: '缩小', zoomReset: '复位视角', zoomHint: '双指捏合或 ⌘ + 滚轮缩放',
    tag: { pdl1: 'PD-L1', kn: 'KN035 纳米抗体', epi: (n: number) => `PD-L1表位·${n}个残基`, para: (n: number) => `KN035互补位·${n}个残基`, faces: 'PD-L1接触残基', ds: '二硫键 · 锁定', hot: '热点', nb: '新 binder' },
  },
  en: {
    prompt: 'Predict the complex of human PD-L1 and the KN035 nanobody with MMFold', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…', result: 'Structure prediction ready', chains: 'chains', target: 'PD-L1 · A', binder: 'KN035 · B',
    pred: 'Predicted binding', faces: 'PD-L1 contact residues', ddg: 'ΔΔG', locked: 'Locked: disulfides', cross: 'Candidate', crossTitle: 'Multi-dimensional computational assessment of candidate mutations', structure: 'Structure fitness', sequence: 'Sequence fitness', evolution: 'Evolutionary fitness', liability: 'Developability', oxid: 'Met oxidation', none: 'Not detected', best: 'Recommended', hotspots: 'Hotspots', seed: 'Candidate', binderLen: 'aa', bsa: 'Predicted buried area', coverage: 'Epitope covered', hot: 'Hotspots touched',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', zoomReset: 'Reset view', zoomHint: 'Pinch or ⌘ + scroll to zoom',
    tag: { pdl1: 'PD-L1', kn: 'KN035 nanobody', epi: (n: number) => `PD-L1 epitope · ${n} residues`, para: (n: number) => `KN035 paratope · ${n} residues`, faces: 'PD-L1 contacts', ds: 'Disulfides · locked', hot: 'Hotspots', nb: 'New binder' },
  },
} as const;

export default function OneProteinStage({ step, locale, onReady, onFail }: { step: number; locale: string; onReady: () => void; onFail: () => void }) {
  const t = locale === 'en' ? COPY.en : COPY.zh;
  const num = (i: number) => String(i + 1).padStart(2, '0');
  const root = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), fx = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerController | null>(null), forge = useRef<ParticleForge | null>(null);
  const run = useRef({ n: 0 }).current, touched = useRef(false), played = useRef(false), lastStep = useRef(-1), frameRef = useRef<() => void>();
  const shown = useRef<{ chains: string[]; swarms: Swarm[]; sig: string }>({ chains: [], swarms: [], sig: '' }).current;
  const tagEls = useRef<(HTMLElement | null)[]>([]);
  const callbacks = useRef({ onReady, onFail }); callbacks.current = { onReady, onFail };
  const [ready, setReady] = useState(false), [onScreen, setOnScreen] = useState(false);
  // Intro (step 0, once): compose → docked.
  const [typed, setTyped] = useState(''), [stage, setStage] = useState<'compose' | 'docked'>('compose');
  const [na, setNa] = useState(0), [nb, setNb] = useState(0);
  const [result, setResult] = useState(false), [fold, setFold] = useState(false);
  // Per-step selections that cycle on their own and can be clicked.
  const [mut, setMut] = useState(0), [design, setDesign] = useState(0), [manual, setManual] = useState(0), [held, setHeld] = useState(-1);
  const [tags, setTags] = useState<Tag[]>([]), [tagsOn, setTagsOn] = useState(false);
  const [mmMount, setMmMount] = useState(false), [mmOn, setMmOn] = useState(false), [mmHole, setMmHole] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [interaction, setInteraction] = useState<(typeof interactionMeasurements.interactions)[number] | null>(null);
  const arriving = useRef(false), holeRef = useRef(mmHole), camRef = useRef<(ms: number) => void>();
  holeRef.current = mmHole;
  // The canvas around the stage (wide screens): the stage's offset (x, y) and size (sw, sh) inside it and the canvas size, all in px. Null = the canvas is the stage.
  const [vp, setVp] = useState<{ x: number; y: number; sw: number; sh: number; w: number; h: number } | null>(null);
  // Zoomed by the viewer: only then does the molecule show beyond the stage. Any reframing by the story (a step, a carousel item) closes it again.
  const [zoomed, setZoomed] = useState(false);
  const zoomedRef = useRef(zoomed); zoomedRef.current = zoomed;
  const vpRef = useRef(vp); vpRef.current = vp;
  const stepRef = useRef(step); stepRef.current = step;
  // The MMetrics viewport (where the molecule must stay) in the canvas's own pixels.
  // Below 1024px the panel is not shown (one-protein.css), so there is no viewport to fit and the molecule simply takes the whole stage.
  const panelShown = () => matchMedia('(min-width: 1024px)').matches;
  const holeInCanvas = () => (panelShown() ? holeRef.current ?? undefined : undefined);

  // Where the stage sits in the viewport once its column is stuck: the canvas reaches out from there to the viewport's edges.
  useEffect(() => {
    const el = root.current!, col = el.closest<HTMLElement>('.op-stage-col');
    const measure = () => {
      if (!wide() || !col) { setVp(null); return; }
      const next = { x: Math.round(el.getBoundingClientRect().left), y: Math.round(parseFloat(getComputedStyle(col).top) || 0), sw: el.clientWidth, sh: el.clientHeight, w: document.documentElement.clientWidth, h: innerHeight };
      setVp(prev => prev && (Object.keys(next) as (keyof typeof next)[]).every(k => prev[k] === next[k]) ? prev : next);
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    addEventListener('resize', measure);
    return () => { ro.disconnect(); removeEventListener('resize', measure); };
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    let instance: ViewerController | undefined;
    const el = host.current!;
    const intersect = new IntersectionObserver(([entry]) => { instance?.active(entry.isIntersecting); forge.current?.setVisible(entry.isIntersecting); });
    intersect.observe(el);
    const screen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    screen.observe(root.current!);
    let settle: ReturnType<typeof setTimeout> | undefined;
    const resize = new ResizeObserver(() => { forge.current?.resize(); clearTimeout(settle); settle = setTimeout(() => { if (!touched.current) frameRef.current?.(); }, 120); });
    resize.observe(el);
    const pointer = () => { touched.current = true; };
    el.addEventListener('pointerdown', pointer); el.addEventListener('wheel', pointer, { passive: true });
    void createViewer(canvas.current!, el, () => {}, () => {}, () => {}, abort.signal, undefined, {
      src: story.master.file, label: 'PD-L1 + KN035 · MMFold_1', showcase: true, startHidden: true,
      frame: () => { const v = vpRef.current; return v ? { left: v.x, top: v.y, width: v.sw, height: v.sh } : undefined; },
      chains: [{ auth: 'A', color: C.target }, { auth: 'B', color: C.binder }, ...denovo.designs.map((d, i) => ({ auth: d.chain, color: DESIGN_COLORS[i] }))],
    }).then(value => {
      if (abort.signal.aborted) { value.dispose(); return; }
      instance = value; viewer.current = value;
      forge.current = new ParticleForge(fx.current!, (src, out) => value.project(src, out), !reduced());
      setReady(true); callbacks.current.onReady();
    }).catch(() => { if (!abort.signal.aborted) callbacks.current.onFail(); });
    return () => {
      abort.abort(); run.n++; clearTimeout(settle); intersect.disconnect(); screen.disconnect(); resize.disconnect();
      el.removeEventListener('pointerdown', pointer); el.removeEventListener('wheel', pointer);
      forge.current?.dispose(); forge.current = null; viewer.current = null; instance?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` is a stable counter object
  }, []);

  // Labels follow the molecule: each is a world point (Å) projected through the live camera every frame.
  useEffect(() => {
    const v = viewer.current;
    if (!v || !ready || !onScreen || !tags.length) return;
    const src = new Float32Array(3), out = new Float32Array(3);
    let raf = 0;
    const tick = () => {
      const ox = vpRef.current?.x ?? 0, oy = vpRef.current?.y ?? 0;
      tags.forEach((tag, i) => { const el = tagEls.current[i]; if (!el) return; src.set(tag.at); v.project(src, out); const x = out[0] - ox; el.style.transform = `translate3d(${x.toFixed(1)}px, ${(out[1] - oy).toFixed(1)}px, 0)`;
        // Keep the pill inside the stage on any screen width: slide it sideways, the leader stays on the residue.
        const pill = el.firstElementChild as HTMLElement | null, W = el.parentElement?.clientWidth ?? 0;
        if (pill && W) { const half = pill.offsetWidth / 2, lo = 8 + half, hi = W - 8 - half, shift = hi < lo ? W / 2 - x : Math.min(hi, Math.max(lo, x)) - x; pill.style.translate = `${shift.toFixed(1)}px 0`; }
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [ready, onScreen, tags]);

  // Zoom (wide screens): a plain wheel keeps scrolling the page, a pinch (ctrl + wheel on a trackpad, gestures in Safari) or ⌘ + wheel zooms the molecule.
  // It listens on the whole waterfall, so the gesture works over the text too once the molecule has grown that far.
  const zoomBy = useRef((factor: number, ms = 0, client?: { x: number; y: number }) => {
    const v = viewer.current, el = root.current, box = vpRef.current;
    if (!v || !el || !box) return;
    touched.current = true; setZoomed(true);
    // Closest: the molecule may grow until the viewport is well filled, whatever the screen; in step 02 it stays inside the panel (the canvas is clipped to it).
    const most = stepRef.current === 1 ? 3 : 2.5 * Math.max(box.w / el.clientWidth, box.h / el.clientHeight);
    const view = client && host.current!.getBoundingClientRect();
    v.zoomBy(factor, 1 / most, FARTHEST, ms, view ? { x: client.x - view.left, y: client.y - view.top } : undefined);
  }).current;
  useEffect(() => {
    const layout = root.current?.closest<HTMLElement>('.op-layout');
    if (!layout || !ready || !vp) return;
    const wheel = (e: WheelEvent) => {
      const onCanvas = host.current!.contains(e.target as Node);
      if (!(e.ctrlKey || e.metaKey)) { if (onCanvas) e.stopPropagation(); return; } // Mol* never sees a plain wheel: the page scrolls.
      e.preventDefault(); e.stopPropagation();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
      zoomBy(Math.exp(Math.max(-0.25, Math.min(0.25, dy * (e.ctrlKey ? 0.01 : 0.002)))), 0, { x: e.clientX, y: e.clientY });
    };
    let scale = 1;
    const gesture = (e: Event) => { const g = e as Event & { scale: number; clientX: number; clientY: number }; e.preventDefault(); e.stopPropagation(); if (e.type === 'gesturestart') scale = 1; else { zoomBy(scale / g.scale, 0, { x: g.clientX, y: g.clientY }); scale = g.scale; } };
    layout.addEventListener('wheel', wheel, { capture: true, passive: false });
    ['gesturestart', 'gesturechange'].forEach(type => layout.addEventListener(type, gesture, { capture: true, passive: false }));
    return () => { layout.removeEventListener('wheel', wheel, { capture: true }); ['gesturestart', 'gesturechange'].forEach(type => layout.removeEventListener(type, gesture, { capture: true })); };
  }, [ready, vp, zoomBy]);

  // Frosted glass under the step text, only while the molecule actually runs under it. The visible chains' Cα traces are projected every few frames and each
  // backbone segment is tested against the text box (segments, not atoms: zoomed in, neighbouring atoms land hundreds of px apart and would skip over it).
  useEffect(() => {
    const v = viewer.current, layout = root.current?.closest<HTMLElement>('.op-layout');
    if (!v || !layout || !ready || !onScreen || !vp) return;
    const src = Float32Array.from(Object.values(CHAIN_PTS).flat()), out = new Float32Array(src.length);
    const ranges: Record<string, [number, number]> = {};
    let at = 0;
    for (const [chain, pts] of Object.entries(CHAIN_PTS)) { ranges[chain] = [at, at + pts.length]; at += pts.length; }
    // Liang–Barsky: does the segment (x0, y0)–(x1, y1) cross the box?
    const crosses = (x0: number, y0: number, x1: number, y1: number, l: number, t: number, r: number, b: number) => {
      const dx = x1 - x0, dy = y1 - y0;
      let lo = 0, hi = 1;
      for (const [p, q] of [[-dx, x0 - l], [dx, r - x0], [-dy, y0 - t], [dy, b - y0]]) {
        if (p === 0) { if (q < 0) return false; continue; }
        const k = q / p;
        if (p < 0) { if (k > hi) return false; if (k > lo) lo = k; } else { if (k < lo) return false; if (k < hi) hi = k; }
      }
      return true;
    };
    let raf = 0, on = false, frame = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (frame++ % 3) return;
      const text = layout.querySelector('.op-step[data-on] .wf-text');
      let hit = false;
      // Unzoomed the molecule is masked to the stage, and step 02 clips it to the MMetrics viewport: in both it can never reach the text.
      if (text && zoomedRef.current && stepRef.current !== 1) {
        const view = host.current!.getBoundingClientRect(), r = text.getBoundingClientRect(), m = on ? 36 : 16;
        const l = r.left - m - view.left, t = r.top - m - view.top, rr = r.right + m - view.left, bb = r.bottom + m - view.top;
        v.project(src, out);
        for (const chain of shown.chains) {
          const [a, b] = ranges[chain] ?? [0, 0];
          // Points behind the camera project to nonsense; their segments are skipped.
          for (let i = a; i + 5 < b && !hit; i += 3) if (Math.abs(out[i]) < 1e5 && Math.abs(out[i + 3]) < 1e5 && Math.abs(out[i + 1]) < 1e5 && Math.abs(out[i + 4]) < 1e5) hit = crosses(out[i], out[i + 1], out[i + 3], out[i + 4], l, t, rr, bb);
          if (hit) break;
        }
      }
      if (hit !== on) { on = hit; if (on) layout.dataset.glass = ''; else delete layout.dataset.glass; }
    };
    tick();
    return () => { cancelAnimationFrame(raf); delete layout.dataset.glass; };
  // `shown` is stable and read live.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onScreen, vp]);

  // The viewport inside the MMetrics panel is measured after the panel mounts and whenever the stage is resized: keep the molecule inside it.
  useEffect(() => {
    // While the step's own arrival glide is running it already aims at the final viewport; only later resizes re-aim the camera.
    if (step !== 1 || !mmHole || touched.current || arriving.current) return;
    camRef.current?.(played.current ? 400 : 0);
  }, [mmHole, step]);

  // The MMetrics panel exists only around step 02: it mounts just before it grows and unmounts after it has faded.
  useEffect(() => {
    if (step === 1) {
      // Mounted at once (still invisible) so its viewport is measured before the camera sets off: one glide straight to the final framing.
      setMmMount(true);
      const b = setTimeout(() => setMmOn(true), 260);
      return () => clearTimeout(b);
    }
    setMmOn(false);
    const off = setTimeout(() => setMmMount(false), 900);
    return () => clearTimeout(off);
  }, [step]);
  const hover = useRef((id: string | null) => viewer.current?.highlight(id)).current;
  const select = useRef((ids: string[]) => viewer.current?.select(ids)).current;

  const focusInteraction = useRef((link: InteractionFocus | null) => {
    const v = viewer.current;
    if (!v || stepRef.current !== 1) return;
    const row = link && interactionMeasurements.interactions.find(item => interactionKey(item) === interactionKey(link));
    setInteraction(row || null);
    v.highlight(null);
    if (!row) {
      void v.showSites([{ labels: A(iface.epitope), color: C.epitope }, { labels: B(iface.paratope), color: C.paratope }]);
      setTagsOn(true); camRef.current?.(500); return;
    }
    touched.current = true;
    setTagsOn(false);
    void v.showSites([{ labels: [row.residues[0]], color: C.epitope }, { labels: [row.residues[1]], color: C.paratope }]);
    v.focusRegion(row.residues, 3, 90, true, 0, 0, 650, holeInCanvas());
  }).current;
  useEffect(() => {
    setInteraction(null); viewer.current?.select([]);
  }, [step]);

  // Step scenes. Each run is cancelled by the next (run.n), so fast scrolling never leaves a stale scene behind.
  useEffect(() => {
    const v = viewer.current, f = forge.current;
    if (!v || !f || !ready) return;
    setZoomed(false);
    const token = ++run.n, alive = () => run.n === token;
    const settleIntro = () => { setStage('docked'); setNa(SEQ_A.length); setNb(SEQ_B.length); setFold(true); played.current = true; };
    const reset = () => { setTyped(''); setNa(0); setNb(0); setStage('compose'); setResult(false); setFold(false); f.clear(); v.showChains([]); v.showSites([]); shown.chains = []; shown.swarms = []; shown.sig = ''; setTags([]); setTagsOn(false); };
    // Same length and (symmetric) easing as the viewport's clip/mask transition in one-protein.css, so the molecule and its frame move as one.
    const glide = 1100;
    const cand = affinity.candidates[mut], d = denovo.designs[design];
    const focus = (labels: string[], pad: number, shift = 0, yaw = YAW) => (ms: number) => { touched.current = false; v.focusRegion(labels, pad, 90, true, shift, yaw, ms); };
    // Each carousel item is approached from a slightly different side, so the camera visibly travels instead of only zooming.
    const swing = (i: number) => YAW + ([-16, 0, 16][i % 3]);
    const tag = (id: string, text: string, at: number[], color: string, dir?: 'up' | 'down'): Tag => ({ id, text, at, color, dir });
    const pair = (g: Group, pts: number[]): Swarm => ({ points: swarm(pts), color: g.color });

    const targets: Target[] = [
      { chains: ['A', 'B'], sites: [], swarms: [], cam: ms => { touched.current = false; v.focusRegion(labelsAll, 4, 90, true, 0.08, 0, ms, undefined, sideBySide); },
        tags: [tag('a', t.tag.pdl1, mean(ca('A', [60])), C.target, 'up'), tag('b', t.tag.kn, mean(ca('B', [60])), C.binder, 'down')] },
      (() => {
        const e: Group = { labels: A(iface.epitope), color: C.epitope }, p: Group = { labels: B(iface.paratope), color: C.paratope };
        return { chains: ['A', 'B'], sites: [e, p], swarms: [pair(e, ca('A', iface.epitope)), pair(p, ca('B', iface.paratope))], cam: ms => { touched.current = false; const into = holeInCanvas(); if (into) v.focusRegion(labelsAll, 4, 90, true, 0, 0, ms, into); else v.focusRegion(labelsAll, 4, 90, true, panelShown() ? 0.36 : 0.08, 0, ms); },
          tags: [tag('e', t.tag.epi(iface.epitope.length), mean(ca('A', iface.epitope)), C.epitope, 'up'), tag('p', t.tag.para(iface.paratope.length), mean(ca('B', iface.paratope)), C.paratope, 'down')] };
      })(),
      (() => {
        const m: Group = { labels: [`B:${cand.pos}`], color: C.mutation }, fc: Group = { labels: A(cand.facing), color: C.epitope };
        return { chains: ['A', 'B'], sites: [m, fc], swarms: [pair(m, ca('B', [cand.pos])), pair(fc, ca('A', cand.facing))], cam: focus([...m.labels, ...fc.labels], 12, 0, swing(mut)), overview: focus(labelsAll, 6),
          tags: [tag('m', `KN035·${cand.wt}${cand.pos}${cand.mut}`, ca('B', [cand.pos]), C.mutation, 'up'), tag('f', `${t.tag.faces} ${cand.facing.slice(0, 4).join(' · ')}`, mean(ca('A', cand.facing)), C.epitope, 'down')] };
      })(),
      (() => {
        const l: Group = { labels: B(cysB), color: C.lock };
        return { chains: ['A', 'B'], sites: [l], swarms: [pair(l, ca('B', cysB))], cam: focus(B(cysB), 14, 0, YAW), overview: focus(labelsAll, 4),
          tags: [tag('l', t.tag.ds, mean(ca('B', cysB)), C.lock, 'up')] };
      })(),
      (() => {
        const h: Group = { labels: A(denovo.hotspots), color: C.epitope };
        return { chains: ['A', d.chain], sites: [h], sig: 'hotspots', swarms: [pair(h, ca('A', denovo.hotspots))], cam: focus([...h.labels, ...A(d.contacts)], 14, 0, swing(design)),
          tags: [tag('h', t.tag.hot, mean(ca('A', denovo.hotspots)), C.epitope, 'down'), tag('n', `${t.tag.nb} · ${t.seed} ${num(design)}`, mean(d.ca), DESIGN_COLORS[design], 'up')] };
      })(),
    ];
    const target = targets[step];
    frameRef.current = () => target.cam(0);
    camRef.current = target.cam;

    // What leaves disperses into particles, what arrives condenses out of them, and the camera glides in between.
    const apply = async (to: Target, delay = 100) => {
      arriving.current = true;
      await wait(delay); if (!alive()) return;
      // Between two carousel items the camera first pulls back to the whole complex, then goes in on the next one.
      const beat = !!to.overview && lastStep.current === step && shown.swarms.length > 0;
      lastStep.current = step;
      setTagsOn(false);
      const outs: Promise<void>[] = [];
      const leaving = shown.chains.filter(c => !to.chains.includes(c));
      // A leaving chain fades from cartoon to its glowing thread, which then unravels into particles; its cartoon is gone within the first quarter.
      if (leaving.length) outs.push(f.form({ chains: leaving.map(c => ({ points: CHAIN_PTS[c], color: CHAIN_COLOR[c] })), dir: 'out', duration: 1050, onReveal: ms => { shown.chains = shown.chains.filter(c => !leaving.includes(c)); void v.fadeChains(leaving, false, ms); } }));
      const keep = !!to.sig && shown.sig === to.sig;
      if (keep) { /* the same highlights stay lit */ }
      else if (shown.swarms.length) outs.push(f.form({ chains: shown.swarms, lines: false, dir: 'out', duration: 560, onReveal: () => { v.showSites([]); shown.swarms = []; shown.sig = ''; } }));
      else v.showSites([]);
      const swap = leaving.length > 0 && to.chains.some(c => !shown.chains.includes(c));
      if (beat) { to.overview!(750); await wait(700); } else if (!swap) await wait(160);
      if (!alive()) return;
      // Step 02 frames the molecule inside the MMetrics viewport: wait (briefly) until the panel has been measured.
      for (let i = 0; i < 20 && step === 1 && panelShown() && !holeRef.current; i++) { await wait(30); if (!alive()) return; }
      // Arrivals overlap the departures: the camera glides while the new things condense.
      to.cam(glide);
      const ins: Promise<void>[] = [];
      const entering = to.chains.filter(c => !shown.chains.includes(c));
      // An arriving chain gathers out of a loose ghost of itself, stitches into a thread along its backbone and crossfades into the cartoon.
      // Protein → protein: it starts a beat after the old one began to unravel, so the two clouds overlap instead of one popping into the other's place.
      const form = (spec: Parameters<ParticleForge['form']>[0], lag: number) => lag ? wait(lag).then(() => alive() ? f.form(spec) : undefined) : f.form(spec);
      if (entering.length) ins.push(form({ chains: entering.map(c => ({ points: CHAIN_PTS[c], color: CHAIN_COLOR[c] })), dir: 'in', duration: 1700, onReveal: ms => { shown.chains = [...shown.chains, ...entering]; void v.fadeChains(entering, true, ms); } }, swap ? 160 : 0));
      // Residue patches on an arriving chain wait for it, so their sticks never float where the cartoon isn't yet.
      if (to.swarms.length && !keep) ins.push(form({ chains: to.swarms, lines: false, dir: 'in', duration: 850, onReveal: () => { v.showSites(to.sites); shown.swarms = to.swarms; shown.sig = to.sig ?? ''; } }, entering.length ? (swap ? 160 : 0) + 600 : 0));
      await Promise.all([...outs, ...ins]); if (!alive()) return;
      arriving.current = false;
      setTags(to.tags); setTagsOn(true);
    };

    if (step === 0 && !played.current && !reduced()) {
      if (!onScreen) { reset(); return () => { run.n++; }; }
      void (async () => {
        reset(); target.cam(0);
        await wait(450); if (!alive()) return;
        for (let i = 1; i <= t.prompt.length; i++) { setTyped(t.prompt.slice(0, i)); await wait(34 + (i % 7 === 0 ? 40 : 0)); if (!alive()) return; }
        await wait(200); if (!alive()) return;
        for (let i = 4; i <= SEQ_A.length + 3; i += 4) { setNa(Math.min(i, SEQ_A.length)); await wait(22); if (!alive()) return; }
        await wait(60); if (!alive()) return;
        for (let i = 4; i <= SEQ_B.length + 3; i += 4) { setNb(Math.min(i, SEQ_B.length)); await wait(22); if (!alive()) return; }
        await wait(300); if (!alive()) return;
        // The letters hand over from the DOM text to the canvas at exactly the same screen position.
        const box = fx.current!.getBoundingClientRect(), letters: { x: number; y: number; ch: string; color: string }[] = [];
        root.current!.querySelectorAll<HTMLElement>('.pf-fasta code > span').forEach((span, k) => {
          const node = span.firstChild as Text | null;
          if (!node) return;
          const range = document.createRange();
          for (let i = 0; i < node.length; i++) {
            range.setStart(node, i); range.setEnd(node, i + 1);
            const r = range.getBoundingClientRect();
            letters.push({ x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, ch: node.data[i], color: k === 0 ? C.target : C.binder });
          }
        });
        setFold(true);
        const morph = f.form({ chains: trace, dir: 'in', duration: 3200, letters, onReveal: ms => { void v.fadeChains(['A', 'B'], true, ms); shown.chains = ['A', 'B']; } });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        if (!alive()) return;
        setStage('docked');
        await morph;
        if (!alive()) return;
        await wait(300); if (!alive()) return;
        setResult(true); played.current = true; setTags(target.tags); setTagsOn(true);
      })();
      return () => { run.n++; f.clear(); };
    }

    // Anything after the intro (or a reduced-motion visit) starts from a docked Mocha box and the folded complex.
    if (!played.current) settleIntro();
    setResult(step === 0);
    void apply(target, step === 0 && reduced() ? 0 : 100);
    return () => { run.n++; f.clear(); };
  // `run` and `shown` are stable; the scenes are keyed to readiness, visibility, step and the active selection.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onScreen, step, mut, design, locale]);

  // Auto-cycle the selection of the current step until the viewer picks one themselves: from then on the choice stays put, so it can be read at leisure.
  useEffect(() => { setHeld(-1); }, [step]);
  useEffect(() => {
    // Paused while the viewer is zoomed in: the next item would take the camera away from them.
    if (!ready || !onScreen || reduced() || zoomed || held === step) return;
    if (step !== 2 && step !== 4) return;
    const next = () => step === 2 ? setMut(i => (i + 1) % affinity.candidates.length) : setDesign(i => (i + 1) % denovo.designs.length);
    const timer = setInterval(next, step === 4 ? 7000 : 4200);
    return () => clearInterval(timer);
  }, [ready, onScreen, step, manual, zoomed, held]);
  const pick = (setter: (i: number) => void, i: number) => { setter(i); setHeld(step); setManual(m => m + 1); };

  const best = dev.cross.find(r => r.mutation === 'V109L'), c = affinity.candidates[mut], d = denovo.designs[design];
  const fmt = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(2)}`;

  // In step 02 the canvas is clipped to the MMetrics viewport, so however far it is zoomed or turned the molecule never crosses the panel's frame.
  const hole = step === 1 && mmHole && vp ? mmHole : null;
  // Unzoomed, a mask the size of the stage (edges faded as before) shows the molecule exactly as the stage did; zoomed, the mask opens to the whole viewport.
  const open = zoomed || step === 1;
  const mask = vp && { size: open ? `${vp.w}px ${vp.h}px` : `${vp.sw}px ${vp.sh}px`, at: open ? '0px 0px' : `${vp.x}px ${vp.y}px` };
  const viewStyle = vp && mask ? { left: -vp.x, top: -vp.y, width: vp.w, height: vp.h, maskSize: mask.size, WebkitMaskSize: mask.size, maskPosition: mask.at, WebkitMaskPosition: mask.at, clipPath: hole
    ? `inset(${vp.y + hole.top}px ${vp.w - vp.x - hole.left - hole.width}px ${vp.h - vp.y - hole.top - hole.height}px ${vp.x + hole.left}px round 0 0 0 16px)`
    : 'inset(0px 0px 0px 0px round 0 0 0 0)' } : undefined;
  const holeVars = hole ? { '--hole-l': `${hole.left}px`, '--hole-t': `${hole.top}px`, '--hole-r': `${hole.left + hole.width}px`, '--hole-b': `${hole.top + hole.height}px` } as CSSProperties : undefined;

  return <div ref={root} className="pf op" data-ready={ready || undefined} data-stage={stage} data-step={step} data-full={vp ? '' : undefined} data-hole={hole ? '' : undefined} style={holeVars}>
    <div ref={host} className="pf-view" data-fold={fold || undefined} aria-label="PD-L1 + KN035 · MMFold" style={viewStyle}>
      <canvas ref={canvas} />
      <canvas ref={fx} className="pf-fx" aria-hidden="true" />
      {step === 1 && interaction && viewer.current && <InteractionRuler viewer={viewer.current} points={interaction.points}
        distance={interaction.sourceDistance} label={`${interaction.residues.join(' – ')}, ${interaction.category}`} />}
    </div>

    <div className="op-tags" aria-hidden="true">
      {tags.map((tag, i) => <div key={tag.id} ref={node => { tagEls.current[i] = node; }} className="op-tag" data-dir={tag.dir} data-on={tagsOn || undefined} style={{ ['--tag' as string]: tag.color }}><span>{tag.text}</span></div>)}
    </div>

    {mmMount && mmHole && <div className="op-mm-back" data-on={mmOn || undefined} style={{ left: mmHole.left, top: mmHole.top, width: mmHole.width, height: mmHole.height }} />}
    {mmMount && <div className="op-mm" data-on={mmOn || undefined}><MMOverlay onHover={hover} onSelect={select} onHole={setMmHole} onInteraction={focusInteraction} /></div>}

    <div className="pf-agent mocha-upgrade-root" data-stage={stage} hidden={played.current && step > 0 ? true : undefined}>
      <header><Image src={mochaIcon} alt="" width={16} height={19} style={{ width: 16, height: 19 }} /><strong>Mocha</strong></header>
      <div className="pf-composer">
        <p data-empty={!typed || undefined}>{typed || t.placeholder}{typed && !na && <i className="pf-caret" />}</p>
        <div className="pf-fasta" aria-hidden="true" data-on={na > 0 || undefined}>
          <code><em>&gt;PDL1</em><span style={{ color: C.target }}>{SEQ_A.slice(0, na)}</span>{na > 0 && !nb && <i className="pf-caret" />}</code>
          {nb > 0 && <code><em>&gt;KN035</em><span style={{ color: C.binder }}>{SEQ_B.slice(0, nb)}</span>{nb < SEQ_B.length && <i className="pf-caret" />}</code>}
        </div>
        <button type="button" tabIndex={-1} aria-hidden="true" data-ready={nb >= SEQ_B.length || undefined}><ArrowUp size={15} /></button>
      </div>
    </div>

    <div className="pf-result" data-on={(result && step === 0) || undefined}>
      <strong><Check size={13} />{t.result}</strong>
      <dl><div><dt>ipTM</dt><dd>{story.master.iptm.toFixed(2)}</dd></div><div><dt>pLDDT</dt><dd>{story.master.plddt.toFixed(1)}</dd></div></dl>
    </div>

    {vp && ready && <div className="op-zoom" title={t.zoomHint.replace('⌘', modKey())}>
      <button type="button" aria-label={t.zoomIn} onClick={() => zoomBy(0.75, 220)}><ZoomIn size={15} /></button>
      <button type="button" aria-label={t.zoomOut} onClick={() => zoomBy(1 / 0.75, 220)}><ZoomOut size={15} /></button>
      <button type="button" aria-label={t.zoomReset} onClick={() => { setZoomed(false); camRef.current?.(700); }}><RotateCcw size={14} /></button>
    </div>}

    {step === 2 && <div className="op-hud" key="h2">
      <div className="op-chips">{affinity.candidates.map((x, i) => <button key={x.mutation} type="button" data-on={i === mut || undefined} onClick={() => pick(setMut, i)}>{x.mutation}</button>)}</div>
      <p><i style={{ background: C.mutation }} /><b>KN035·{c.wt}{c.pos}{c.mut}</b><span>{t.pred} {t.ddg} · {fmt(c.ddg)}</span></p>
      <p><i style={{ background: C.epitope }} /><b>{t.faces}</b><span>{c.facing.join(', ')}</span></p>
      <p className="op-hud-sum">ipTM {c.iptm.toFixed(2)} · pLDDT {c.plddt.toFixed(1)}</p>
    </div>}

    {step === 3 && <div className="op-hud op-hud-wide" key="h3">
      <p className="op-hud-cap">{t.crossTitle}</p>
      <p className="op-hud-title"><i style={{ background: C.lock }} />{t.locked}</p>
      <table><thead><tr><th>{t.cross}</th><th>{t.ddg}</th><th>{t.structure}</th><th>{t.sequence}</th><th>{t.evolution}</th><th>{t.liability}</th></tr></thead>
        <tbody>{dev.cross.map(row => <tr key={row.mutation} data-best={row === best || undefined}>
          <td><b>{row.mutation}</b>{row === best ? <em>{t.best}</em> : null}</td><td data-tone="up">{fmt(row.ddg)}</td>
          {[row.struct, row.seq, row.evo].map((n, k) => <td key={k} data-tone={n > 0.3 ? 'up' : n < -0.3 ? 'down' : 'flat'}>{fmt(n)}</td>)}<td data-tone={row.risk.length ? 'warn' : 'flat'}>{row.risk.length ? t.oxid : t.none}</td></tr>)}</tbody></table>
    </div>}

    {step === 4 && <div className="op-hud" key="h4">
      <div className="op-chips">{denovo.designs.map((x, i) => <button key={x.seed} type="button" data-on={i === design || undefined} onClick={() => pick(setDesign, i)} style={{ ['--chip' as string]: DESIGN_COLORS[i] }}>{t.seed} {num(i)}</button>)}</div>
      <p><i style={{ background: C.epitope }} /><b>{t.hotspots}</b><span>{denovo.hotspots.map(n => `A${n}`).join(' ')}</span></p>
      <p><i style={{ background: DESIGN_COLORS[design] }} /><b>{d.len} {t.binderLen}</b><span>{t.bsa} {d.bsa} Å²</span></p>
      <p className="op-hud-sum">{t.hot} {d.hotspots}/{d.hotspotTotal}</p>
    </div>}
  </div>;
}
