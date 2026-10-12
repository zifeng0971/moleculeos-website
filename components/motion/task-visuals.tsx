'use client';

import { useEffect, useRef } from 'react';

/*
 * Generative illustrations for the four capability tasks, shown until real recordings exist.
 * They are conceptual diagrams — no numeric values — so they never imply unconfirmed results.
 */

const VIOLET = '#A88BFF', CYAN = '#6FD3FF', PINK = '#F08BD0', TEAL = '#7EE0C3', AMBER = '#FFC56B';

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Structure prediction: a linear sequence folds into a compact chain, coloured by per-residue confidence. */
function StructureVisual() {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const root = svg.current;
    if (!root) return;
    const reduce = prefersReducedMotion();
    const n = 48;
    // Folded target: a compact three-helix bundle joined by two short loops (14 + 3 + 14 + 3 + 14 residues).
    const helix = (cx: number, top: number, down: boolean) => Array.from({ length: 14 }, (_, k) => {
      const step = down ? k : 13 - k;
      return [cx + Math.sin(step * 1.75) * 15, top + step * 14];
    });
    const loop = (from: number[], to: number[], lift: number) => Array.from({ length: 3 }, (_, k) => {
      const f = (k + 1) / 4;
      return [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f + Math.sin(f * Math.PI) * lift];
    });
    const a = helix(250, 108, true), b = helix(320, 108, false), c = helix(390, 108, true);
    const folded = [...a, ...loop(a[13], b[0], 34), ...b, ...loop(b[13], c[0], -34), ...c];
    const line = Array.from({ length: n }, (_, i) => [70 + i * (500 / (n - 1)), 330]);
    const conf = folded.map((_, i) => (i >= 14 && i < 17) || (i >= 31 && i < 34) || i > 45 ? 0.45 : 0.92);
    const dots = Array.from(root.querySelectorAll<SVGCircleElement>('circle[data-r]'));
    const path = root.querySelector<SVGPathElement>('path[data-chain]')!;
    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const cycle = reduce ? 0.6 : ((now - start) / 6000) % 1;
      // 0–0.15 hold line, 0.15–0.55 fold, 0.55–0.9 hold folded, 0.9–1 unfold.
      const raw = cycle < 0.15 ? 0 : cycle < 0.55 ? (cycle - 0.15) / 0.4 : cycle < 0.9 ? 1 : 1 - (cycle - 0.9) / 0.1;
      const t = raw < 0.5 ? 4 * raw ** 3 : 1 - (-2 * raw + 2) ** 3 / 2;
      const pts = folded.map((f, i) => {
        const lag = Math.min(1, Math.max(0, t * 1.4 - (i / n) * 0.4));
        return [line[i][0] + (f[0] - line[i][0]) * lag, line[i][1] + (f[1] - line[i][1]) * lag];
      });
      path.setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L'));
      dots.forEach((dot, i) => {
        dot.setAttribute('cx', pts[i][0].toFixed(1)); dot.setAttribute('cy', pts[i][1].toFixed(1));
        dot.setAttribute('fill', t > 0.6 ? (conf[i] > 0.8 ? CYAN : AMBER) : VIOLET);
      });
      if (!reduce) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <svg ref={svg} viewBox="0 0 640 400" className="task-visual" aria-hidden="true">
    <path data-chain fill="none" stroke="url(#tv-chain)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    {Array.from({ length: 48 }, (_, i) => <circle key={i} data-r r="4.2" />)}
    <defs><linearGradient id="tv-chain" x1="0" x2="1"><stop stopColor={VIOLET} stopOpacity=".7" /><stop offset="1" stopColor={CYAN} stopOpacity=".7" /></linearGradient></defs>
    <g className="tv-legend" transform="translate(470 352)"><circle r="4" fill={CYAN} /><rect x="10" y="-3" width="30" height="6" rx="3" fill={CYAN} opacity=".35" /><circle cx="56" r="4" fill={AMBER} /><rect x="66" y="-3" width="18" height="6" rx="3" fill={AMBER} opacity=".35" /></g>
  </svg>;
}

/** Affinity optimisation: interface residues light up, mutations land, and candidates re-rank. */
function AffinityVisual() {
  const interfaceDots = [[300, 168], [312, 196], [306, 226], [296, 254], [318, 140], [322, 282]];
  return <svg viewBox="0 0 640 400" className="task-visual tv-affinity" aria-hidden="true">
    <defs>
      <radialGradient id="tv-antigen" cx=".35" cy=".5"><stop stopColor={TEAL} stopOpacity=".35" /><stop offset="1" stopColor={TEAL} stopOpacity=".05" /></radialGradient>
      <radialGradient id="tv-binder" cx=".65" cy=".5"><stop stopColor={VIOLET} stopOpacity=".4" /><stop offset="1" stopColor={VIOLET} stopOpacity=".05" /></radialGradient>
    </defs>
    <path d="M90 90 C190 60 290 110 300 160 C310 210 280 250 300 300 C250 350 140 340 100 300 C60 250 50 130 90 90Z" fill="url(#tv-antigen)" stroke={TEAL} strokeOpacity=".5" />
    <g className="tv-binder"><path d="M440 80 C380 100 330 120 330 160 C330 210 350 240 330 300 C360 340 430 340 470 300 C520 250 520 120 440 80Z" fill="url(#tv-binder)" stroke={VIOLET} strokeOpacity=".6" /></g>
    {interfaceDots.map(([x, y], i) => <g key={i} className="tv-site" style={{ animationDelay: `${0.6 + i * 0.35}s` }}>
      <circle cx={x} cy={y} r="10" fill={PINK} opacity=".18" /><circle cx={x} cy={y} r="4.5" fill={PINK} />
    </g>)}
    <g transform="translate(540 118)">
      {[0, 1, 2, 3, 4].map(i => <g key={i} transform={`translate(0 ${i * 28})`}>
        <rect x="0" width="70" height="14" rx="7" fill="rgba(255,255,255,.06)" />
        <rect className="tv-rank" x="0" width={70 - i * 11} height="14" rx="7" fill={i === 0 ? PINK : VIOLET} opacity={0.9 - i * 0.14} style={{ animationDelay: `${i * 0.12}s` }} />
      </g>)}
    </g>
  </svg>;
}

/** Stability engineering: thermal jitter calms as the melting curve shifts to higher temperature. */
function StabilityVisual() {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const root = svg.current;
    if (!root) return;
    const reduce = prefersReducedMotion();
    const ribbon = root.querySelector<SVGPathElement>('path[data-ribbon]')!;
    const curve = root.querySelector<SVGPathElement>('path[data-curve]')!;
    const ghost = root.querySelector<SVGPathElement>('path[data-ghost]')!;
    const sigmoid = (shift: number) => Array.from({ length: 60 }, (_, i) => {
      const x = 360 + i * 4.2, y = 320 - 150 / (1 + Math.exp((i - 22 - shift) / 3.2));
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    ghost.setAttribute('d', sigmoid(0));
    let frame = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const s = (now - start) / 1000;
      const phase = reduce ? 1 : (Math.sin(s * 0.7 - Math.PI / 2) + 1) / 2; // 0 unstable → 1 stabilised
      const amp = 22 * (1 - phase) + 3;
      ribbon.setAttribute('d', Array.from({ length: 80 }, (_, i) => {
        const x = 60 + i * 3.5;
        const y = 200 + Math.sin(i * 0.32) * 46 + Math.sin(i * 1.7 + s * 9) * amp * Math.sin(i * 0.11 + s * 2);
        return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' '));
      curve.setAttribute('d', sigmoid(phase * 16));
      if (!reduce) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <svg ref={svg} viewBox="0 0 640 400" className="task-visual" aria-hidden="true">
    <path data-ribbon fill="none" stroke={VIOLET} strokeWidth="5" strokeLinecap="round" opacity=".9" />
    <line x1="360" y1="320" x2="610" y2="320" stroke="rgba(255,255,255,.15)" /><line x1="360" y1="150" x2="360" y2="320" stroke="rgba(255,255,255,.15)" />
    <path data-ghost fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeDasharray="4 6" />
    <path data-curve fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
    <text x="604" y="342" textAnchor="end" className="tv-axis">T →</text>
  </svg>;
}

/** De novo design: candidate sequences stream out and a binder assembles into the target pocket. */
function DeNovoVisual() {
  const rows = ['MKVLAAGIEW', 'SPEDLKRYTF', 'GQNVAWLHEK', 'TRDYQSAFIN', 'EKWLGRPVDA'];
  return <svg viewBox="0 0 640 400" className="task-visual tv-denovo" aria-hidden="true">
    <defs><linearGradient id="tv-target" x1="0" y1="0" x2="0" y2="1"><stop stopColor={TEAL} stopOpacity=".3" /><stop offset="1" stopColor={TEAL} stopOpacity="0" /></linearGradient></defs>
    <path d="M40 60 L250 60 C260 60 262 70 268 90 C280 140 360 140 372 90 C378 70 380 60 390 60 L600 60 L600 30 L40 30Z" fill="url(#tv-target)" stroke={TEAL} strokeOpacity=".6" />
    <g className="tv-binder-build"><path d="M276 96 C290 150 350 150 364 96 C350 180 290 180 276 96Z" fill={VIOLET} fillOpacity=".35" stroke={VIOLET} /></g>
    <g fontFamily="ui-monospace, SF Mono, Menlo, monospace" fontSize="15" letterSpacing="4">
      {rows.map((row, r) => <text key={row} x="320" y={230 + r * 30} textAnchor="middle" className="tv-seq" style={{ animationDelay: `${r * 0.45}s` }}>
        {row.split('').map((c, i) => <tspan key={i} fill={'AVLIMFWC'.includes(c) ? VIOLET : 'KRH'.includes(c) ? PINK : 'DE'.includes(c) ? TEAL : CYAN}>{c}</tspan>)}
      </text>)}
    </g>
  </svg>;
}

export function TaskVisual({ id }: { id: string }) {
  if (id === 'structure') return <StructureVisual />;
  if (id === 'affinity') return <AffinityVisual />;
  if (id === 'stability') return <StabilityVisual />;
  return <DeNovoVisual />;
}
