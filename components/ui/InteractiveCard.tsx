'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { INTERACTION_CONFIG as config } from '@/lib/interaction-config';
import { cn } from '@/lib/utils';

export interface InteractiveCardProps {
  children: ReactNode;
  tilt?: boolean;
  glow?: boolean;
  borderGlow?: boolean;
  tiltMax?: number;
  glowRadius?: number;
  as?: 'div' | 'a';
  href?: string;
  className?: string;
}

// Only one card owns a native mousemove listener at any time.
let releaseActive: (() => void) | null = null;

export function InteractiveCard({ children, tilt = true, glow = true, borderGlow = true,
  tiltMax = config.tiltMax, glowRadius = config.glowRadius, as = 'div', href, className }: InteractiveCardProps) {
  const element = useRef<HTMLDivElement & HTMLAnchorElement>(null);
  const enter = useRef<() => void>(() => {});
  const leave = useRef<() => void>(() => {});
  useEffect(() => {
    const el = element.current;
    if (!el) return;
    const media = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let visible = false, small = false, attached = false;
    let frame: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let point = { x: 0, y: 0 };
    const restore = () => { el.style.zIndex = ''; };
    const move = (event: globalThis.MouseEvent) => {
      if (!visible || !media.matches) return;
      point = { x: event.clientX, y: event.clientY };
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        if (!visible || !media.matches) return;
        const rect = el.getBoundingClientRect();
        const x = point.x - rect.left, y = point.y - rect.top;
        const px = Math.max(-1, Math.min(1, x / rect.width * 2 - 1));
        const py = Math.max(-1, Math.min(1, y / rect.height * 2 - 1));
        el.style.setProperty('--mx', `${x}px`); el.style.setProperty('--my', `${y}px`);
        if (tilt && !small) {
          el.style.transition = `transform ${config.followDuration}ms ease-out`;
          el.style.transform = `perspective(${config.perspective}px) rotateX(${-py * tiltMax}deg) rotateY(${px * tiltMax}deg) scale(${config.pressedScale})`;
        }
      });
    };
    const stop = () => {
      el.removeEventListener('mousemove', move); attached = false;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; el.removeAttribute('data-interaction-active');
      el.style.transition = `transform ${config.resetDuration}ms ${config.resetEase}`;
      el.style.transform = '';
      if (releaseActive === stop) releaseActive = null;
      if (timer) clearTimeout(timer);
      timer = setTimeout(restore, config.resetDuration);
    };
    const start = () => {
      if (!visible || !media.matches || attached) return;
      releaseActive?.(); releaseActive = stop;
      if (timer) clearTimeout(timer);
      el.style.zIndex = '10';
      el.setAttribute('data-interaction-active', 'true');
      el.addEventListener('mousemove', move, { passive: true }); attached = true;
    };
    const sync = () => { el.dataset.interactionStatic = String(!media.matches); if (!media.matches) stop(); };
    sync();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) stop(); else if (el.matches(':hover')) start();
    });
    observer.observe(el);
    const resize = new ResizeObserver(([entry]) => {
      const size = entry.borderBoxSize[0];
      small = (size?.inlineSize ?? el.offsetWidth) < config.minimumWidth || (size?.blockSize ?? el.offsetHeight) < config.minimumHeight;
      if (small) el.style.transform = '';
    });
    resize.observe(el); media.addEventListener('change', sync);
    enter.current = start; leave.current = stop;
    return () => {
      stop(); if (timer) clearTimeout(timer); restore(); observer.disconnect(); resize.disconnect();
      media.removeEventListener('change', sync); enter.current = () => {}; leave.current = () => {};
    };
  }, [tilt, tiltMax]);
  const Tag = as;
  const style = {
    '--interaction-glow-radius': `${glowRadius}px`, '--interaction-border-radius': `${config.borderGlowRadius}px`,
    '--interaction-glow-color': config.glowColor, '--interaction-border-color': config.borderGlowColor,
    '--interaction-glow-duration': `${config.glowDuration}ms`, '--interaction-perspective': `${config.perspective}px`,
    '--interaction-reset-duration': `${config.resetDuration}ms`, '--interaction-reset-ease': config.resetEase,
  } as CSSProperties;
  return <Tag ref={element} href={as === 'a' ? href : undefined} className={cn('block interactive-card tilt-layer', className)} style={style}
    onMouseEnter={() => enter.current()} onMouseLeave={() => leave.current()}>
    {glow && <span className="card-glow" aria-hidden="true" />}
    {borderGlow && <span className="card-border-glow" aria-hidden="true" />}
    {children}
  </Tag>;
}
