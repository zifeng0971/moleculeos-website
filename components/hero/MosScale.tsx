'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * Renders its child at a fixed design width (the proportions of the real MOS workbench) and scales it to the frame with
 * CSS zoom, so text, panels and the viewer keep MOS's ratios instead of reflowing. "Full screen" shows it at 1:1.
 * Narrow screens skip the scaling and let the demo stack normally.
 */
export function MosScale({ children, designWidth = 860, label }: { children: ReactNode; designWidth?: number; label: { expand: string; collapse: string } }) {
  const host = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [height, setHeight] = useState(0);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const el = host.current!;
    // Pixel lengths are multiplied by zoom, percentages are not: the design height is set in px.
    const update = () => { const z = full || el.clientWidth < 480 ? null : el.clientWidth / designWidth; setZoom(z); setHeight(z ? el.clientHeight / z : 0); };
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth, full]);
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.documentElement.style.overflow = ''; };
  }, [full]);
  const toggle = <button className="mos-scale-toggle" onClick={() => setFull(v => !v)} aria-label={full ? label.collapse : label.expand} title={full ? label.collapse : label.expand}>
    {full ? <Minimize2 size={15} /> : <Maximize2 size={15} />}<span>{full ? label.collapse : label.expand}</span>
  </button>;
  // Full screen is portalled to <body>: the frame sits inside 3D-transformed motion layers, which would trap position: fixed.
  return <div ref={host} className="mos-scale">
    {full ? createPortal(<div className="mos-full" role="dialog" aria-modal="true">
      <div className="mos-scale-backdrop" onClick={() => setFull(false)} />
      <div className="mos-full-inner mm-mos">{children}{toggle}</div>
    </div>, document.body) : <>
      <div className="mos-scale-inner mm-mos" style={zoom ? { width: designWidth, height, zoom } : undefined}>{children}</div>
      {toggle}
    </>}
  </div>;
}
