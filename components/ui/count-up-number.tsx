'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

export function CountUpNumber({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion ? to : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) { setValue(to); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(to * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, to]);

  return <span ref={ref}>{value}{suffix}</span>;
}

/** Animates every number in a string ("94.7%", "9–50", "18"), keeping its decimals, dashes and suffixes. */
export function CountUpText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) { setProgress(1); return; }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / 1200, 1);
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion]);
  const shown = text.replace(/\d+(?:\.\d+)?/g, n => { const decimals = n.split('.')[1]?.length ?? 0; return (parseFloat(n) * progress).toFixed(decimals); });
  return <span ref={ref} aria-label={text}>{shown}</span>;
}
