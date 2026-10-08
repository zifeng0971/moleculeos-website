'use client';

import { useEffect, useRef } from 'react';

// Fixed page-wide light: drifting aurora plus a soft pointer-tracked glow.
export function AmbientBackground() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    let frame = 0, x = 0, y = 0;
    const move = (event: PointerEvent) => {
      x = event.clientX; y = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        el.style.setProperty('--cx', `${x}px`); el.style.setProperty('--cy', `${y}px`);
        el.setAttribute('data-pointer', '');
      });
    };
    const leave = () => el.removeAttribute('data-pointer');
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    return () => { window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={ref} className="ambient-bg" aria-hidden="true">
    <div className="ambient-aurora ambient-aurora-a" />
    <div className="ambient-aurora ambient-aurora-b" />
    <div className="ambient-aurora ambient-aurora-c" />
    <div className="ambient-glow-spot" />
    <div className="ambient-noise" />
  </div>;
}
