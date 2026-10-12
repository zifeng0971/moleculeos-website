'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/reveal';
import { Phrases } from '@/components/ui/phrase-title';

const ROUNDS = 4, PER_ROUND = 16, STAGES = ['design', 'experiment', 'evolve'] as const;
const STEP_MS = 1500;
// Chart geometry (SVG units). Value 0–1 maps bottom→top; the success bar sits at 0.62.
const X0 = 70, X1 = 560, Y0 = 300, Y1 = 40, BAR = 0.62;
const colX = (r: number) => X0 + 60 + r * ((X1 - X0 - 90) / (ROUNDS - 1));
const toY = (v: number) => Y0 - v * (Y0 - Y1);

function seeded(seed: number) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
// Each round's candidates: the distribution rises and tightens as the model learns from the previous round.
const DOTS = (() => {
  const rand = seeded(7);
  return Array.from({ length: ROUNDS }, (_, r) => {
    const centre = 0.36 + r * 0.13, spread = 0.2 - r * 0.035;
    return Array.from({ length: PER_ROUND }, (_, j) => {
      const g = (rand() + rand() + rand() - 1.5) / 1.5;
      const v = Math.min(0.97, Math.max(0.05, centre + g * spread * 1.6));
      return { x: colX(r) + ((j % 4) - 1.5) * 13 + (rand() - 0.5) * 6, y: toY(v), hit: v >= BAR };
    });
  });
})();
const CENTROIDS = DOTS.map((round, r) => ({ x: colX(r), y: round.reduce((sum, d) => sum + d.y, 0) / round.length }));

/** Data flywheel as convergence over rounds: design → test → learn, with each round landing more hits. */
export function FlywheelSection() {
  const t = useTranslations('home.flywheel');
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const total = ROUNDS * STAGES.length;
  const [step, setStep] = useState(total - 1);
  const started = useRef(false);
  useEffect(() => {
    if (reduce || !inView) return;
    if (!started.current) { started.current = true; setStep(0); }
    // Run through all rounds, rest on the final state, then start again.
    const timer = setInterval(() => setStep(s => (s >= total + 2 ? 0 : s + 1)), STEP_MS);
    return () => clearInterval(timer);
  }, [inView, reduce, total]);
  const shown = Math.min(step, total - 1);
  const round = Math.floor(shown / STAGES.length), stage = shown % STAGES.length;
  const visibleRound = (r: number) => r <= round;
  const tested = (r: number) => r < round || (r === round && stage >= 1);
  const learned = (r: number) => r < round || (r === round && stage >= 2);

  return <section className="flywheel home-section-pad" data-nav-section="models">
    <div className="site-container flywheel-grid">
      <div>
        <Reveal>
          <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>
          <h2 className="section-title"><Phrases text={t('title')} /></h2>
          <p className="section-copy">{t('description')}</p>
        </Reveal>
        <ol className="flywheel-stages">
          {STAGES.map((key, i) => <li key={key} data-active={stage === i || undefined}>
            <span className="flywheel-stage-index">0{i + 1}</span>
            <span>{t(key)}</span>
            {stage === i && <span className="flywheel-stage-round">{t('round', { n: round + 1 })}</span>}
          </li>)}
        </ol>
      </div>
      <Reveal delay={0.1}>
        <div ref={ref} className="flywheel-chart">
          <span className="flywheel-chart-tag">{t('illustrative')}</span>
          <svg viewBox="0 0 600 350" role="img" aria-label={t('title')}>
            <defs>
              <linearGradient id="fw-zone" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#7EE0C3" stopOpacity=".07" /><stop offset="1" stopColor="#7EE0C3" stopOpacity="0" /></linearGradient>
              <linearGradient id="fw-trend" x1="0" x2="1"><stop stopColor="#7C5CFF" /><stop offset="1" stopColor="#7EE0C3" /></linearGradient>
              <marker id="fw-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#B6A6FF" /></marker>
            </defs>
            <rect x={X0} y={Y1} width={X1 - X0} height={toY(BAR) - Y1} fill="url(#fw-zone)" />
            <line x1={X0} x2={X1} y1={toY(BAR)} y2={toY(BAR)} className="fw-bar" />
            <text x={X0} y={toY(BAR) - 8} className="fw-bar-label">{t('threshold')}</text>
            {/* Learning arcs carry each round's results into the next design. */}
            {CENTROIDS.slice(0, -1).map((c, r) => {
              const next = CENTROIDS[r + 1], mid = (c.x + next.x) / 2;
              return <path key={r} d={`M${c.x + 24} ${Y1 - 6} Q ${mid} ${Y1 - 36} ${next.x - 24} ${Y1 - 6}`} className="fw-learn" data-on={learned(r) || undefined} markerEnd="url(#fw-arrow)" />;
            })}
            <polyline points={CENTROIDS.filter((_, r) => tested(r)).map(c => `${c.x},${c.y}`).join(' ')} className="fw-trend" />
            {DOTS.map((dots, r) => <g key={r} className="fw-round" data-on={visibleRound(r) || undefined} data-tested={tested(r) || undefined}>
              {dots.map((d, j) => <circle key={j} cx={d.x} cy={d.y} r="5" className={d.hit ? 'fw-dot fw-dot-hit' : 'fw-dot'} style={{ transitionDelay: `${j * 18}ms` }} />)}
              <text x={colX(r)} y={Y0 + 34} textAnchor="middle" className="fw-round-label" data-current={r === round || undefined}>{t('round', { n: r + 1 })}</text>
            </g>)}
          </svg>
          <div className="flywheel-legend"><span><i className="fw-legend-dot" />{t('candidate')}</span><span><i className="fw-legend-dot fw-legend-hit" />{t('hit')}</span></div>
        </div>
      </Reveal>
    </div>
  </section>;
}
