'use client';

import { useEffect, useRef, useState } from 'react';
import structures from '@/content/task-structures.json';

/*
 * Capability demos rendered from real Cα traces (PETase 5XH3 and the demo antibody–antigen complex).
 * Geometry is real; the per-task overlays (rankings, curves, steps) are illustrative and carry no values.
 */

type RGB = [number, number, number];
type V3 = [number, number, number];
type Residue = { chain: string; aa: string; p: number[]; flex: number };
export type TaskVisualLabels = Record<
  'illustrative' | 'confidence' | 'veryHigh' | 'high' | 'low' | 'veryLow' | 'candidates' | 'interface' | 'antigen' | 'light' | 'heavy'
  | 'flexibility' | 'rigid' | 'flexible' | 'stabilizing' | 'melting' | 'before' | 'after' | 'generating' | 'denoise' | 'target' | 'binder' | 'folding',
  string
>;

const PETASE = structures.petase as Residue[];
const COMPLEX = structures.complex.residues as Residue[];
const INTERFACE = new Set(structures.complex.interface);

const BG: RGB = [13, 13, 19];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const window01 = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

// AlphaFold-style confidence bands, chain colours matching the hero workbench, flexibility ramp.
const PLDDT = ['#0053D6', '#65CBF3', '#FFDB13', '#FF7D45'].map(hex);
const CHAIN: Record<string, RGB> = { A: hex('#4FC3A1'), B: hex('#F2A541'), C: hex('#A58BFF') };
const COOL = hex('#4D7CFF'), NEUTRAL = hex('#E8E6F5'), WARM = hex('#FF6B6B'), GLOW = hex('#F08BD0');
const flexColor = (f: number) => (f < 0.5 ? mix(COOL, NEUTRAL, f * 2) : mix(NEUTRAL, WARM, (f - 0.5) * 2));
const band = (flex: number) => (flex < 0.3 ? 0 : flex < 0.5 ? 1 : flex < 0.72 ? 2 : 3);

type Scene = { pos: V3[]; color: RGB[]; alpha: number[]; glow: number[]; breaks: boolean[]; width?: number };

/** Chain breaks: a new chain or an unusually long Cα–Cα step (missing residues). */
function breaksFor(residues: Residue[]) {
  return residues.map((r, i) => i === 0 || r.chain !== residues[i - 1].chain
    || Math.hypot(r.p[0] - residues[i - 1].p[0], r.p[1] - residues[i - 1].p[1], r.p[2] - residues[i - 1].p[2]) > 0.2);
}

/** Catmull-Rom smoothing: inserts `k` points between consecutive residues of the same chain. */
function smooth(scene: Scene, k = 2): Scene {
  const out: Scene = { pos: [], color: [], alpha: [], glow: [], breaks: [], width: scene.width };
  const n = scene.pos.length;
  for (let i = 0; i < n; i++) {
    if (i > 0 && !scene.breaks[i]) {
      const p0 = scene.pos[!scene.breaks[i - 1] && i > 1 ? i - 2 : i - 1], p1 = scene.pos[i - 1], p2 = scene.pos[i];
      const p3 = scene.pos[i + 1 < n && !scene.breaks[i + 1] ? i + 1 : i];
      for (let j = 1; j <= k; j++) {
        const t = j / (k + 1), t2 = t * t, t3 = t2 * t;
        const c = (a: number, b: number, c2: number, d: number) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
        out.pos.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1]), c(p0[2], p1[2], p2[2], p3[2])]);
        out.color.push(mix(scene.color[i - 1], scene.color[i], t));
        out.alpha.push(scene.alpha[i - 1] + (scene.alpha[i] - scene.alpha[i - 1]) * t);
        out.glow.push(0); out.breaks.push(false);
      }
    }
    out.pos.push(scene.pos[i]); out.color.push(scene.color[i]); out.alpha.push(scene.alpha[i]); out.glow.push(scene.glow[i]); out.breaks.push(scene.breaks[i]);
  }
  return out;
}

/**
 * Depth-sorted tube renderer. The smoothed trace is cut into short runs; runs are painted far→near,
 * each as one path (outline, body, specular), so joints stay seamless while overlaps still occlude.
 */
function render(ctx: CanvasRenderingContext2D, w: number, h: number, input: Scene, yaw: number, pitch: number, zoom: number, oy = 0, shift = 0) {
  const scene = smooth(input);
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  const s = Math.min(w, h) * 0.46 * zoom, ox = w / 2 + (w > 560 ? shift * w : 0), oyy = h / 2 + oy;
  const pts = scene.pos.map(p => {
    const x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
    const y1 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
    const f = 3.4 / (3.4 + z2);
    return { x: ox + x1 * s * f, y: oyy - y1 * s * f, z: z2, f };
  });
  const RUN = 6;
  const runs: { from: number; to: number; z: number }[] = [];
  let from = 0;
  for (let i = 1; i <= pts.length; i++) {
    const cut = i === pts.length || scene.breaks[i] || scene.alpha[i] < 0.01 || i - from >= RUN;
    if (!cut) continue;
    if (i - from > 1) {
      let z = 0;
      for (let j = from; j < i; j++) z += pts[j].z;
      runs.push({ from, to: i - 1, z: z / (i - from) });
    }
    // Consecutive runs share an end point so the tube stays continuous.
    from = i === pts.length || scene.breaks[i] || scene.alpha[i] < 0.01 ? i : i - 1;
  }
  runs.sort((a, b) => b.z - a.z);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const base = scene.width ?? 1;
  const path = (a: number, b: number, dx = 0) => { ctx.beginPath(); ctx.moveTo(pts[a].x + dx, pts[a].y + dx); for (let j = a + 1; j <= b; j++) ctx.lineTo(pts[j].x + dx, pts[j].y + dx); };
  for (const run of runs) {
    const mid = (run.from + run.to) >> 1;
    const fog = clamp((run.z + 0.9) / 1.9) * 0.6;
    const colour = mix(scene.color[mid], BG, fog);
    const alpha = scene.alpha[mid];
    const width = (3 + (1 - fog) * 3.6) * base * pts[mid].f;
    ctx.strokeStyle = rgb(mix(colour, BG, 0.62), alpha); ctx.lineWidth = width + 1.8; path(run.from, run.to); ctx.stroke();
    ctx.strokeStyle = rgb(colour, alpha); ctx.lineWidth = width; path(run.from, run.to); ctx.stroke();
    ctx.strokeStyle = rgb(mix(colour, [255, 255, 255], 0.5), alpha * 0.55 * (1 - fog)); ctx.lineWidth = width * 0.3; path(run.from, run.to, -width * 0.17); ctx.stroke();
  }
  ctx.globalCompositeOperation = 'lighter';
  pts.forEach((p, i) => {
    const g = scene.glow[i];
    if (g < 0.02) return;
    const r = (7 + g * 9) * p.f;
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gradient.addColorStop(0, rgb([255, 255, 255], 0.9 * g));
    gradient.addColorStop(0.3, rgb(GLOW, 0.7 * g));
    gradient.addColorStop(1, rgb(GLOW, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}

type Overlay = Record<string, HTMLElement | SVGElement | null>;
type SceneFn = (time: number, ctx: CanvasRenderingContext2D, w: number, h: number, overlay: Overlay) => void;

/* ---------- 1. Structure prediction: an extended chain folds into PETase, coloured by confidence ---------- */
function structureScene(): SceneFn {
  const n = PETASE.length;
  const real = PETASE.map(r => r.p as V3);
  const extended = PETASE.map((_, i) => [-1.25 + 2.5 * i / n, Math.sin(i * 0.3) * 0.12, Math.cos(i * 0.3) * 0.12] as V3);
  const breaks = PETASE.map((_, i) => i === 0);
  const grey = hex('#8B86A8');
  return (time, ctx, w, h, overlay) => {
    const t = (time / 10000) % 1;
    const fold = ease(window01(t, 0.1, 0.62));
    const fade = 1 - window01(t, 0.94, 1);
    const pos: V3[] = [], color: RGB[] = [], local: number[] = [];
    for (let i = 0; i < n; i++) {
      const l = ease(clamp(fold * 1.35 - (i / n) * 0.35));
      local.push(l);
      pos.push([extended[i][0] + (real[i][0] - extended[i][0]) * l, extended[i][1] + (real[i][1] - extended[i][1]) * l, extended[i][2] + (real[i][2] - extended[i][2]) * l]);
      color.push(mix(grey, PLDDT[band(PETASE[i].flex)], window01(l, 0.55, 1)));
    }
    render(ctx, w, h - 34, { pos, color, alpha: pos.map(() => fade), glow: pos.map(() => 0), breaks }, time / 5200, 0.35, 0.95);
    // Per-residue confidence track along the bottom, revealed as the fold resolves.
    const cell = (w - 48) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rgb(mix(hex('#2A2838'), PLDDT[band(PETASE[i].flex)], window01(local[i], 0.55, 1)), fade);
      ctx.fillRect(24 + i * cell, h - 22, Math.max(1, cell - 0.6), 8);
    }
    overlay.status?.setAttribute('data-done', fold > 0.98 ? 'true' : 'false');
  };
}

/* ---------- 2. Affinity: antibody docks onto the antigen, the interface lights up ---------- */
function affinityScene(): SceneFn {
  const breaks = breaksFor(COMPLEX);
  const centre = (rs: Residue[]) => rs.reduce((c, r) => [c[0] + r.p[0] / rs.length, c[1] + r.p[1] / rs.length, c[2] + r.p[2] / rs.length], [0, 0, 0]);
  const ca = centre(COMPLEX.filter(r => r.chain === 'A')), cb = centre(COMPLEX.filter(r => r.chain !== 'A'));
  const away = [cb[0] - ca[0], cb[1] - ca[1], cb[2] - ca[2]];
  const colours = COMPLEX.map(r => CHAIN[r.chain] ?? NEUTRAL);
  return (time, ctx, w, h) => {
    const t = (time / 9000) % 1;
    const offset = (1 - ease(window01(t, 0.05, 0.35))) * 0.55;
    const fade = 1 - window01(t, 0.95, 1);
    const pos = COMPLEX.map(r => (r.chain === 'A' ? r.p : [r.p[0] + away[0] * offset, r.p[1] + away[1] * offset, r.p[2] + away[2] * offset]) as V3);
    const glow = COMPLEX.map((_, i) => (INTERFACE.has(i) ? window01(t, 0.38 + (i % 17) * 0.012, 0.5 + (i % 17) * 0.012) * (0.55 + 0.45 * Math.sin(time / 380 + i)) * fade : 0));
    render(ctx, w, h, { pos, color: colours, alpha: pos.map(() => fade), glow, breaks, width: 0.75 }, -0.6 + time / 9000, 0.2, 0.95, 8, -0.13);
  };
}

/* ---------- 3. Stability: flexible regions settle once stabilising sites are introduced ---------- */
function stabilityScene(): SceneFn {
  const breaks = breaksFor(PETASE);
  const ranked = PETASE.map((r, i) => ({ i, f: r.flex })).filter(x => x.i > 12 && x.i < PETASE.length - 12).sort((a, b) => b.f - a.f);
  const sites: number[] = [];
  for (const x of ranked) if (sites.length < 4 && sites.every(i => Math.abs(i - x.i) > 18)) sites.push(x.i);
  const siteSet = new Set(sites);
  return (time, ctx, w, h, overlay) => {
    const t = (time / 9000) % 1;
    const stab = ease(window01(t, 0.42, 0.62)) * (1 - window01(t, 0.94, 1));
    const s = time / 1000;
    const pos = PETASE.map((r, i) => {
      const amp = r.flex ** 1.6 * 0.07 * (1 - stab * 0.85);
      return [r.p[0] + Math.sin(s * 5.3 + i * 0.7) * amp, r.p[1] + Math.sin(s * 4.1 + i * 1.3) * amp, r.p[2] + Math.cos(s * 4.7 + i * 0.9) * amp] as V3;
    });
    const color = PETASE.map(r => flexColor(r.flex * (1 - stab * 0.55)));
    const glow = PETASE.map((_, i) => (siteSet.has(i) ? window01(t, 0.36, 0.46) * (1 - window01(t, 0.94, 1)) * (0.7 + 0.3 * Math.sin(s * 3 + i)) : 0));
    render(ctx, w, h, { pos, color, alpha: pos.map(() => 1), glow, breaks }, 0.9 + time / 7000, 0.3, 0.95, -6, -0.11);
    // Melting curve: the transition shifts to a higher temperature as stability improves.
    overlay.curve?.setAttribute('d', meltPath(16 + stab * 10));
  };
}

const meltPath = (mid: number) => Array.from({ length: 40 }, (_, k) => `${k ? 'L' : 'M'}${k * 4} ${(54 - 46 / (1 + Math.exp((k - mid) / 2.4))).toFixed(1)}`).join(' ');

/* ---------- 4. De novo: a binder denoises out of noise onto the target interface ---------- */
function deNovoScene(): SceneFn {
  const target = COMPLEX.filter(r => r.chain === 'A');
  const binder = COMPLEX.filter(r => r.chain === 'C');
  const all = [...target, ...binder];
  const breaks = breaksFor(all);
  const seq = binder.map(r => r.aa).join('');
  const noise = binder.map((_, i) => [Math.sin(i * 12.99) * 0.5, Math.sin(i * 78.23) * 0.5, Math.sin(i * 37.71) * 0.5]);
  const targetColour = hex('#5E8F86'), noisy = hex('#6E6A88');
  const interfaceTarget = new Set(COMPLEX.map((r, i) => (r.chain === 'A' && INTERFACE.has(i) ? i : -1)).filter(i => i >= 0));
  return (time, ctx, w, h, overlay) => {
    const t = (time / 10000) % 1;
    const appear = window01(t, 0.08, 0.16);
    const denoise = ease(window01(t, 0.16, 0.72));
    const fade = 1 - window01(t, 0.95, 1);
    const s = time / 1000, amt = (1 - denoise) ** 1.4;
    const pos = all.map((r, i) => {
      if (i < target.length) return r.p as V3;
      const k = i - target.length, wobble = amt * 0.06;
      return [r.p[0] + noise[k][0] * amt + Math.sin(s * 6 + k) * wobble, r.p[1] + noise[k][1] * amt + Math.cos(s * 5 + k) * wobble, r.p[2] + noise[k][2] * amt] as V3;
    });
    const color = all.map((_, i) => (i < target.length ? targetColour : mix(noisy, CHAIN.C, denoise)));
    // While noisy the binder reads as loose beads (glow), then joins into a chain.
    const chained = denoise > 0.55;
    const alpha = all.map((_, i) => (i < target.length ? 0.85 * fade : (chained ? appear : 0) * fade));
    const glow = all.map((_, i) => (i < target.length ? (interfaceTarget.has(i) ? window01(t, 0.7, 0.8) * fade * 0.7 : 0) : (chained ? 0 : appear * 0.35 * fade)));
    render(ctx, w, h, { pos, color, alpha, glow, breaks, width: 0.8 }, -0.4 + time / 11000, 0.2, 1, 8, -0.12);
    if (overlay.step) overlay.step.textContent = String(Math.round((1 - denoise) * 50)).padStart(2, '0');
    if (overlay.bar) (overlay.bar as HTMLElement).style.transform = `scaleX(${denoise})`;
    if (overlay.seq) overlay.seq.textContent = seq.slice(0, Math.round(seq.length * denoise)) || ' ';
  };
}

const SCENES: Record<string, () => SceneFn> = { structure: structureScene, affinity: affinityScene, stability: stabilityScene, denovo: deNovoScene };
// Under reduced motion each scene shows one settled frame from late in its cycle.
const STILL: Record<string, number> = { structure: 7000, affinity: 6000, stability: 7000, denovo: 8000 };

function useCanvasScene(id: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<Overlay>({});
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const scene = SCENES[id]();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let frame = 0, visible = true, w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = (now: number) => { ctx.clearRect(0, 0, w, h); scene(reduce ? STILL[id] : now - start, ctx, w, h, overlay.current); };
    const loop = (now: number) => { frame = 0; if (!visible || document.hidden) return; draw(now); frame = requestAnimationFrame(loop); };
    const kick = () => { if (!reduce && !frame && visible) frame = requestAnimationFrame(loop); };
    resize(); draw(performance.now()); kick();
    const ro = new ResizeObserver(() => { resize(); draw(performance.now()); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    io.observe(canvas);
    document.addEventListener('visibilitychange', kick);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', kick); };
  }, [id]);
  const bind = (key: string) => (el: HTMLElement | SVGElement | null) => { overlay.current[key] = el; };
  return { canvasRef, bind };
}

// Five real interface positions on the antibody chains, labelled H (heavy) / L (light) with their residue number in the chain.
const CANDIDATES = (() => {
  const counters: Record<string, number> = {};
  const numberInChain = COMPLEX.map(r => (counters[r.chain] = (counters[r.chain] ?? 0) + 1));
  return [...INTERFACE].filter(i => COMPLEX[i].chain !== 'A').filter((_, k) => k % 6 === 0).slice(0, 5)
    .map((i, k) => ({ id: `${COMPLEX[i].chain === 'C' ? 'H' : 'L'}·${COMPLEX[i].aa}${numberInChain[i]}`, score: [0.92, 0.8, 0.68, 0.56, 0.44][k] }));
})();
const RANK_SEQUENCE = [[3, 1, 4, 0, 2], [1, 3, 0, 4, 2], [0, 1, 3, 2, 4], [0, 1, 2, 3, 4]];

/** Candidate list that settles into ranked order, then reshuffles for the next cycle. */
function CandidateRanking({ labels }: { labels: TaskVisualLabels }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(RANK_SEQUENCE.length - 1); return; }
    const timer = setInterval(() => setStep(k => (k + 1) % (RANK_SEQUENCE.length + 2)), 1800);
    return () => clearInterval(timer);
  }, []);
  const order = RANK_SEQUENCE[Math.min(step, RANK_SEQUENCE.length - 1)];
  return <div className="tv-panel tv-ranking">
    <p className="tv-panel-title">{labels.candidates}</p>
    <ol style={{ height: CANDIDATES.length * 30 }}>
      {CANDIDATES.map((c, k) => { const rank = order.indexOf(k); return <li key={c.id} style={{ transform: `translateY(${rank * 30}px)` }} data-top={rank === 0 || undefined}>
        <span className="tv-rank-no">{rank + 1}</span><code>{c.id}</code><span className="tv-rank-bar"><i style={{ transform: `scaleX(${c.score})` }} /></span>
      </li>; })}
    </ol>
  </div>;
}

export function TaskVisual({ id, labels }: { id: string; labels: TaskVisualLabels }) {
  const { canvasRef, bind } = useCanvasScene(id);
  return <div className="tv-stage" data-task={id}>
    <canvas ref={canvasRef} className="tv-canvas" aria-hidden="true" />
    <span className="tv-tag">{labels.illustrative}</span>
    {id === 'structure' && <>
      <div className="tv-chip"><span className="tv-live" ref={bind('status')} />{labels.folding} · PETase 5XH3</div>
      <div className="tv-legend">
        <span>{labels.confidence}</span>
        {(['veryHigh', 'high', 'low', 'veryLow'] as const).map((k, i) => <span key={k}><i style={{ background: rgb(PLDDT[i]) }} />{labels[k]}</span>)}
      </div>
    </>}
    {id === 'affinity' && <>
      <div className="tv-chip">
        {(['antigen', 'light', 'heavy'] as const).map((k, i) => <span key={k} className="tv-chain"><i style={{ background: rgb(CHAIN['ABC'[i]]) }} />{labels[k]}</span>)}
        <span className="tv-chain"><i className="tv-glow-dot" />{labels.interface}</span>
      </div>
      <CandidateRanking labels={labels} />
    </>}
    {id === 'stability' && <>
      <div className="tv-chip"><span className="tv-chain"><i className="tv-glow-dot" />{labels.stabilizing}</span></div>
      <div className="tv-legend tv-legend-ramp"><span>{labels.flexibility}</span><span>{labels.rigid}</span><i className="tv-ramp" /><span>{labels.flexible}</span></div>
      <div className="tv-panel tv-melt">
        <p className="tv-panel-title">{labels.melting}</p>
        <svg viewBox="0 0 160 60" aria-hidden="true">
          <path d={meltPath(16)} className="tv-melt-before" />
          <path ref={bind('curve')} d={meltPath(16)} className="tv-melt-after" />
        </svg>
        <div className="tv-melt-legend"><span><i className="tv-dash" />{labels.before}</span><span><i />{labels.after}</span><span className="tv-axis">T →</span></div>
      </div>
    </>}
    {id === 'denovo' && <>
      <div className="tv-chip">
        <span className="tv-chain"><i style={{ background: '#5E8F86' }} />{labels.target}</span>
        <span className="tv-chain"><i style={{ background: rgb(CHAIN.C) }} />{labels.binder}</span>
      </div>
      <div className="tv-panel tv-gen">
        <p className="tv-panel-title"><span className="tv-live" />{labels.generating}</p>
        <div className="tv-gen-row"><span>{labels.denoise}</span><code ref={bind('step')}>50</code></div>
        <span className="tv-gen-bar"><i ref={bind('bar')} /></span>
        <code className="tv-gen-seq" ref={bind('seq')} />
      </div>
    </>}
  </div>;
}
