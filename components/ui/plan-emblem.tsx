'use client';

import { useEffect, useState } from 'react';

// One atom per tier: more electron orbits as the plan grows. Monochrome: the orbit count carries the meaning, not a hue.
const TIERS = [
  { color: '#D2D2D7', orbits: [{ rx: 38, ry: 15, angle: -28, dur: 7 }] },
  { color: '#D2D2D7', orbits: [{ rx: 40, ry: 15, angle: -30, dur: 6.5 }, { rx: 40, ry: 15, angle: 30, dur: 8.5 }] },
  { color: '#D2D2D7', orbits: [{ rx: 42, ry: 15, angle: 0, dur: 6 }, { rx: 42, ry: 15, angle: 60, dur: 7.5 }, { rx: 42, ry: 15, angle: 120, dur: 9 }] },
];
const ring = (rx: number, ry: number) => `M ${60 - rx} 60 a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`;

/** Decorative atom whose electrons orbit; static under reduced motion. */
export function PlanEmblem({ tier, className }: { tier: number; className?: string }) {
  const [still, setStill] = useState(false);
  useEffect(() => { setStill(matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  const { color, orbits } = TIERS[Math.min(tier, TIERS.length - 1)];
  const id = `pe-${tier}`;
  return <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
    <defs>
      <radialGradient id={`${id}-core`}><stop offset="0" stopColor="#fff" /><stop offset="0.35" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient>
      <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" /></filter>
    </defs>
    <circle cx="60" cy="60" r="26" fill={`url(#${id}-core)`} opacity="0.55"><animate attributeName="r" values="22;28;22" dur="4s" repeatCount="indefinite" /></circle>
    {orbits.map((o, i) => <g key={i} transform={`rotate(${o.angle} 60 60)`}>
      <ellipse cx="60" cy="60" rx={o.rx} ry={o.ry} fill="none" stroke={color} strokeOpacity="0.38" strokeWidth="1" />
      <circle r="3.4" fill={color} filter={`url(#${id}-glow)`}>{!still && <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={ring(o.rx, o.ry)} />}</circle>
      <circle r="2" fill="#fff">{!still && <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={ring(o.rx, o.ry)} />}</circle>
      {still && <circle cx={60 + o.rx} cy="60" r="2.4" fill="#fff" />}
    </g>)}
    <circle cx="60" cy="60" r="5.5" fill="#fff" /><circle cx="60" cy="60" r="9" fill={color} fillOpacity="0.35" />
  </svg>;
}
