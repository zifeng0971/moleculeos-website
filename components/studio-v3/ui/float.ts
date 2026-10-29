'use client';
import { useLayoutEffect, useState, type RefObject } from 'react';

export interface Placement { top: number; left: number; side: 'top' | 'bottom'; align: 'start' | 'end' }

/** Position a fixed-position panel against an anchor, flipping at viewport edges. */
export function useFloat(open: boolean, anchor: RefObject<HTMLElement>, panel: RefObject<HTMLElement>, side: 'top' | 'bottom', align: 'start' | 'end' | 'center', gap = 6): Placement | null {
  const [pos, setPos] = useState<Placement | null>(null);
  useLayoutEffect(() => {
    if (!open) { setPos(null); return; }
    const calc = () => {
      const a = anchor.current, p = panel.current;
      if (!a || !p) return;
      const r = a.getBoundingClientRect();
      const w = p.offsetWidth, h = p.offsetHeight;
      const vw = window.innerWidth, vh = window.innerHeight, m = 8;
      let s = side;
      const below = vh - r.bottom - gap - m, above = r.top - gap - m;
      if (s === 'bottom' && h > below && above > below) s = 'top';
      else if (s === 'top' && h > above && below > above) s = 'bottom';
      let al: 'start' | 'end' = align === 'end' ? 'end' : 'start';
      let left = align === 'center' ? r.left + r.width / 2 - w / 2 : al === 'start' ? r.left : r.right - w;
      if (align !== 'center') {
        if (al === 'start' && left + w > vw - m && r.right - w >= m) { al = 'end'; left = r.right - w; }
        else if (al === 'end' && left < m && r.left + w <= vw - m) { al = 'start'; left = r.left; }
      }
      left = Math.max(m, Math.min(left, vw - w - m));
      let top = s === 'bottom' ? r.bottom + gap : r.top - gap - h;
      top = Math.max(m, Math.min(top, vh - h - m));
      setPos(prev => (prev && prev.top === top && prev.left === left && prev.side === s && prev.align === al ? prev : { top, left, side: s, align: al }));
    };
    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    const ro = typeof ResizeObserver !== 'undefined' && panel.current ? new ResizeObserver(calc) : null;
    if (ro && panel.current) ro.observe(panel.current);
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('scroll', calc, true); ro?.disconnect(); };
  }, [open, anchor, panel, side, align, gap]);
  return pos;
}
