'use client';

import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/reveal';
import { Phrases } from '@/components/ui/phrase-title';

const CYCLE = 6; // seconds for one lap of the loop
// Racetrack: top run carries design → experiment → evolve, bottom run returns the data to design.
const TRACK = 'M120 70 H980 A110 110 0 0 1 980 290 H120 A110 110 0 0 1 120 70 Z';
const TRACK_LENGTH = 860 * 2 + Math.PI * 110 * 2;
const NODES = [{ x: 260, key: 'design' }, { x: 550, key: 'experiment' }, { x: 840, key: 'evolve' }] as const;

/** Data flywheel: a comet laps the loop and lights each stage as it passes. Pure SVG/CSS, no JS timers. */
export function FlywheelSection() {
  const t = useTranslations('home.flywheel');
  return <section className="flywheel home-section-pad" data-nav-section="models">
    <div className="site-container">
      <Reveal className="text-center">
        <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>
        <h2 className="section-title mx-auto"><Phrases text={t('title')} /></h2>
        <p className="section-copy mx-auto">{t('description')}</p>
      </Reveal>
      <Reveal delay={0.15} className="flywheel-stage">
        <svg viewBox="0 0 1100 360" className="flywheel-svg" role="img" aria-label={`${t('design')} → ${t('experiment')} → ${t('evolve')} → ${t('design')}`}>
          <defs>
            <linearGradient id="fw-track" x1="0" x2="1"><stop stopColor="#7C5CFF" /><stop offset=".5" stopColor="#E07BC8" /><stop offset="1" stopColor="#5AC8FA" /></linearGradient>
            <radialGradient id="fw-comet"><stop stopColor="#fff" /><stop offset=".35" stopColor="#C9B8FF" /><stop offset="1" stopColor="#7C5CFF" stopOpacity="0" /></radialGradient>
          </defs>
          <path d={TRACK} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="2" />
          <path d={TRACK} fill="none" stroke="url(#fw-track)" strokeWidth="2" strokeLinecap="round" className="flywheel-flow" strokeDasharray={`90 ${TRACK_LENGTH}`} style={{ ['--len' as string]: `${TRACK_LENGTH}px` }} />
          {/* Comet with a fading tail: each trailing dot starts a little later on the same path. */}
          {Array.from({ length: 7 }, (_, k) => <circle key={k} className="flywheel-comet" r={k === 0 ? 12 : 6 - k * 0.7} fill={k === 0 ? 'url(#fw-comet)' : '#B6A6FF'} opacity={k === 0 ? 1 : 0.5 - k * 0.06}>
            <animateMotion dur={`${CYCLE}s`} repeatCount="indefinite" begin={`${-(CYCLE - k * 0.045)}s`} path={TRACK} />
          </circle>)}
          {NODES.map((node, i) => {
            const at = (node.x - 120) / TRACK_LENGTH * CYCLE;
            return <g key={node.key} className="flywheel-node" style={{ animationDelay: `${at - 0.15}s` }}>
              <circle cx={node.x} cy="70" r="34" className="flywheel-node-halo" />
              <circle cx={node.x} cy="70" r="26" className="flywheel-node-core" />
              <text x={node.x} y="76" textAnchor="middle" className="flywheel-node-index">0{i + 1}</text>
              <text x={node.x} y="140" textAnchor="middle" className="flywheel-node-label">{t(node.key)}</text>
            </g>;
          })}
          <g className="flywheel-return">
            <text x="550" y="296" textAnchor="middle">NewOrigin</text>
          </g>
        </svg>
        <ol className="flywheel-steps">
          {NODES.map((node, i) => <li key={node.key} style={{ animationDelay: `${i * (CYCLE / 3)}s` }}><span>0{i + 1}</span>{t(node.key)}</li>)}
        </ol>
      </Reveal>
    </div>
  </section>;
}
