'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ZoomIn, ZoomOut, Focus, Layers, Network, Ruler, Eye, AlignCenter, Trash2 } from 'lucide-react';
import { createViewer, type ViewerController, type MeasurementLabel } from './molstar-controller';
export default function MolstarViewer({ selected, hovered, focus, onPick, onInvalidSelected }: { selected: string[]; hovered: string | null; focus: { residue: string; serial: number } | null; onPick?: (label: string) => void; onInvalidSelected?: (labels: string[]) => void }) {
  const t = useTranslations('mmetricsDemo');
  const canvas = useRef<HTMLCanvasElement>(null), container = useRef<HTMLDivElement>(null), driver = useRef<ViewerController>();
  const [ready, setReady] = useState(false), [error, setError] = useState(false), [attempt, setAttempt] = useState(0), [progress, setProgress] = useState(0), [status, setStatus] = useState('ready');
  const [representation, setRepresentation] = useState(0), [interactions, setInteractions] = useState(false), [measure, setMeasure] = useState(false), [overlays, setOverlays] = useState(true);
  const activity = useRef<() => void>(() => {});
  const [labels, setLabels] = useState<MeasurementLabel[]>([]);
  const measuring = useRef(false);
  const pick = useRef(onPick); pick.current = onPick;
  const invalidSelected = useRef(onInvalidSelected); invalidSelected.current = onInvalidSelected;
  useEffect(() => {
    const abort = new AbortController(); let timer: ReturnType<typeof setTimeout>; let visible = false; let controller: ViewerController | undefined;
    setError(false); setReady(false); setProgress(0);
    setLabels([]);
    setRepresentation(0); setInteractions(false); setMeasure(false); setOverlays(true); measuring.current = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const spin = () => controller?.spin(visible && !document.hidden && !reduced.matches && !measuring.current);
    const interact = () => { controller?.spin(false); clearTimeout(timer); timer = setTimeout(spin, 5000); };
    activity.current = interact;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; controller?.spin(false); clearTimeout(timer); if (visible) timer = setTimeout(spin, 3000); }); observer.observe(container.current!);
    const visibility = () => { if (document.hidden) { clearTimeout(timer); controller?.spin(false); } else interact(); };
    document.addEventListener('visibilitychange', visibility); reduced.addEventListener('change', visibility);
    void createViewer(canvas.current!, container.current!, setProgress, setStatus, setLabels, abort.signal, label => pick.current?.(label)).then(value => { if (abort.signal.aborted) { value.dispose(); return; } controller = value; driver.current = value; setReady(true); clearTimeout(timer); timer = setTimeout(spin, 3000); }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); reduced.removeEventListener('change', visibility); activity.current = () => {}; if (controller) { controller.dispose(); driver.current = undefined; } else abort.abort(); };
  }, [attempt]);
  useEffect(() => {
    if (!ready || !driver.current) return;
    const invalid = selected.filter(label => !driver.current!.hasResidue(label));
    if (invalid.length) { invalidSelected.current?.(invalid); setStatus('missing'); }
    driver.current.select(selected.filter(label => !invalid.includes(label)));
    activity.current();
  }, [selected, ready]);
  useEffect(() => { if (ready) { driver.current?.highlight(hovered); if (hovered) activity.current(); } }, [hovered, ready]);
  useEffect(() => { if (ready && focus) { driver.current?.focus(focus.residue); activity.current(); } }, [focus, ready]);
  function action(fn: () => void) { activity.current(); fn(); }
  const buttons = [
    { key: 'zoomIn', icon: ZoomIn, fn: () => driver.current?.zoom(0.85) }, { key: 'zoomOut', icon: ZoomOut, fn: () => driver.current?.zoom(1.15) }, { key: 'reset', icon: Focus, fn: () => driver.current?.reset() },
    { key: 'representation', icon: Layers, fn: () => { const next = (representation + 1) % 3; setRepresentation(next); void driver.current?.representation((['cartoon', 'molecular-surface', 'ball-and-stick'] as const)[next]); } },
    { key: 'interactions', icon: Network, pressed: interactions, fn: () => { setInteractions(!interactions); void driver.current?.interactions(!interactions); } },
    { key: 'measure', icon: Ruler, pressed: measure, fn: () => { measuring.current = !measure; setMeasure(!measure); driver.current?.measure(!measure); } }, { key: 'clear', icon: Trash2, fn: () => { void driver.current?.clear(); } },
    { key: 'overlays', icon: Eye, pressed: overlays, fn: () => setOverlays(!overlays) },
  ];
  return <div ref={container} className="mm-live" onPointerDown={() => activity.current()} onPointerMove={event => { if (event.buttons) activity.current(); }} onPointerUp={() => activity.current()} onWheel={() => activity.current()} onKeyDown={() => activity.current()} tabIndex={0} aria-label={t('viewer')}>{!ready && <Image src="/demo/5xh3-platform-preview.png" alt={t('preview')} fill sizes="(min-width:1024px) 34vw, 90vw" />}<canvas ref={canvas} />{labels.map((label,index)=><span key={index} className="mm-distance" style={{left:label.x,top:label.y}}>{label.distance}</span>)}{!ready && !error && <div className="mm-loading" role="status"><progress value={progress} max={3} /><span>{t('loading')} · {progress}/3</span></div>}{error && <div className="mm-loading mm-error" role="alert"><p>{t('error')}</p><button className="mm-enter" onClick={() => setAttempt(value => value + 1)}>{t('retry')}</button></div>}{ready && <><div className="mm-toolbar">{buttons.map(({ key, icon: Icon, fn, pressed }, index) => <button key={key} className={index === 3 || index === 7 ? 'mm-toolbar-divider' : ''} aria-label={t(key)} title={key === 'representation' ? `${t(key)} · ${['cartoon', 'surface', 'ball-stick'][representation]}` : t(key)} aria-pressed={pressed} onClick={() => action(fn)}><Icon /></button>)}<button className="mm-toolbar-divider" disabled title={t('align')} aria-label={t('align')}><AlignCenter /></button></div>{overlays && <div className="mm-viewer-status" role="status">{t(status)}</div>}</>}</div>;
}
