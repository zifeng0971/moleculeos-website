'use client';
import { useEffect, useRef } from 'react';
import type { ViewerController } from './molstar-controller';

/** World-space endpoints projected by the same camera as the molecule. */
export function InteractionRuler({ viewer, points, distance, label }: {
  viewer: ViewerController; points: number[][]; distance: number; label: string;
}) {
  const line = useRef<SVGLineElement>(null), text = useRef<SVGGElement>(null);
  const start = useRef<SVGCircleElement>(null), end = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const src = points.flat(), out = new Float32Array(6);
    let raf = 0;
    const draw = () => {
      viewer.project(src, out);
      if (line.current && text.current && Array.from(out).every(Number.isFinite)) {
        line.current.setAttribute('x1', String(out[0])); line.current.setAttribute('y1', String(out[1]));
        line.current.setAttribute('x2', String(out[3])); line.current.setAttribute('y2', String(out[4]));
        start.current?.setAttribute('cx', String(out[0])); start.current?.setAttribute('cy', String(out[1]));
        end.current?.setAttribute('cx', String(out[3])); end.current?.setAttribute('cy', String(out[4]));
        text.current.setAttribute('transform', `translate(${(out[0] + out[3]) / 2},${(out[1] + out[4]) / 2 - 20})`);
      }
      raf = requestAnimationFrame(draw);
    };
    draw(); return () => cancelAnimationFrame(raf);
  }, [viewer, points]);
  return <svg className="op-interaction-ruler" role="img" aria-label={`${label}, ${distance.toFixed(2)} Å`}
    data-distance={distance} data-points={JSON.stringify(points)}>
    <line ref={line} stroke="#8ee89c" strokeWidth="2" strokeDasharray="5 4" />
    <circle ref={start} r="3" fill="#8ee89c" /><circle ref={end} r="3" fill="#8ee89c" />
    <g ref={text}><rect x="-36" y="-13" width="72" height="26" rx="5" fill="#17271c" fillOpacity=".94" stroke="#8ee89c" strokeOpacity=".5" />
      <text y="5" textAnchor="middle" fill="#c0ffcd">{distance.toFixed(2)} Å</text></g>
  </svg>;
}
