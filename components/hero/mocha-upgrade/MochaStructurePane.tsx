'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { Eye, EyeOff, Focus, Network, Ruler, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { createViewer, type ViewerController, type MeasurementLabel } from '../molstar-controller';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';
import entry from '@/content/entry-pdl1.json';
import { DEMO_INTERFACE_RESIDUES, DEMO_KEY_RESIDUES, type DemoPhase } from './demoScript';

const STRUCTURE = entry.structure;
const CHAINS = [
  { auth: 'A', role: 'PD-L1', color: '#18bba1' },
  { auth: 'B', role: 'KN035 nanobody', color: '#a58aee' },
] as const;
const TITLE = 'PD-L1 · KN035 Complex · MMFold';

const TEXT = {
  zh: { copied: '链接已复制', copyUrl: '可复制浏览器地址分享', loadFail: '无法加载结构查看器', retry: '重试', loading: '正在加载 3D 结构…', hidden: '结构已隐藏', zoomIn: '放大', zoomOut: '缩小', center: '居中', interactions: '互作', measure: '测量', toggle: '显隐', share: '分享', second: '选择第二个原子', two: '选择两个原子测距', wheel: '按住 Ctrl / ⌘ 再滚动来缩放', hint: '拖动旋转 · Ctrl/⌘ + 滚轮缩放' },
  en: { copied: 'Link copied', copyUrl: 'Copy the address bar to share', loadFail: 'Could not load the structure viewer', retry: 'Retry', loading: 'Loading 3D structure…', hidden: 'Structure hidden', zoomIn: 'Zoom in', zoomOut: 'Zoom out', center: 'Center', interactions: 'Interactions', measure: 'Measure', toggle: 'Show/hide', share: 'Share', second: 'Pick the second atom', two: 'Pick two atoms to measure distance', wheel: 'Hold Ctrl / ⌘ and scroll to zoom', hint: 'Drag to rotate · Ctrl/⌘ + scroll to zoom' },
} as const;

export function MochaStructurePane({ title, phase, phaseProgress, running, hoverResidue }: {
  title: string;
  phase: DemoPhase;
  phaseProgress: number;
  running: boolean;
  hoverResidue: string | null;
}) {
  const L = TEXT[useLocale() === 'en' ? 'en' : 'zh'];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ViewerController | null>(null);
  const manuallyStopped = useRef(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [measure, setMeasure] = useState(false);
  const [interactions, setInteractions] = useState(false);
  const [shown, setShown] = useState(true);
  const [labels, setLabels] = useState<MeasurementLabel[]>([]);
  const [wheelHint, setWheelHint] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [status, setStatus] = useState('');
  const chainBeat = phase === 'parse' ? Math.min(CHAINS.length - 1, Math.floor(phaseProgress * CHAINS.length)) : -1;

  useEffect(() => {
    const abort = new AbortController();
    let controller: ViewerController | null = null;
    setReady(false);
    setFailed(false);
    // The preview image covers the pane until Mol* is ready, so starting after the hero entrance looks the same.
    const cancelStart = afterHeroEntrance(() => {
      void createViewer(canvasRef.current!, viewportRef.current!, () => {}, setStatus, setLabels, abort.signal, undefined, {
        src: STRUCTURE,
        label: TITLE,
        chains: CHAINS.map(chain => ({ auth: chain.auth, color: chain.color })),
        // Fill the pane: the complex is two small domains, so the bounding sphere can be framed tightly.
        fit: 0.7,
      }).then(instance => {
        if (abort.signal.aborted) { instance.dispose(); return; }
        controller = instance;
        viewerRef.current = instance;
        setReady(true);
      }).catch(() => { if (!abort.signal.aborted) setFailed(true); });
    });
    return () => {
      cancelStart();
      abort.abort();
      controller?.dispose();
      viewerRef.current = null;
    };
  }, [retry]);

  // A plain wheel scrolls the page; only Ctrl/⌘ + wheel (and trackpad pinch, which arrives as ctrl+wheel) zooms the structure.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); return; }
      e.stopPropagation();
      setWheelHint(true);
      clearTimeout(timer);
      timer = setTimeout(() => setWheelHint(false), 1400);
    };
    el.addEventListener('wheel', onWheel, { capture: true, passive: false });
    return () => { clearTimeout(timer); el.removeEventListener('wheel', onWheel, { capture: true }); };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    viewer.active(running && shown);
    const allowSpin = running && shown && !manuallyStopped.current && !matchMedia('(prefers-reduced-motion: reduce)').matches && (phase === 'ready' || phase === 'thinking' || phase === 'parse' || phase === 'fold');
    viewer.spin(allowSpin);
  }, [phase, ready, running, shown]);

  useEffect(() => {
    if (!ready) return;
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (phase === 'ready' || phase === 'thinking') {
      viewer.highlightChain(null);
      viewer.select([]);
      void viewer.showResidueSticks([]);
      viewer.reset();
      return;
    }
    if (phase === 'parse') {
      viewer.select([]);
      void viewer.showResidueSticks([]);
      return;
    }
    if (phase === 'fold' || phase === 'rank') {
      viewer.select([]);
      void viewer.showResidueSticks([]);
      return;
    }
    if (phase === 'interface') {
      viewer.spin(false);
      viewer.highlightChain(null);
      viewer.select(DEMO_INTERFACE_RESIDUES);
      void viewer.showResidueSticks(DEMO_KEY_RESIDUES).then(() => viewer.reset());
    }
  }, [phase, ready]);

  useEffect(() => {
    if (!ready || chainBeat < 0) return;
    viewerRef.current?.highlightChain(CHAINS[chainBeat].auth);
  }, [chainBeat, ready]);

  useEffect(() => {
    if (!ready) return;
    if (hoverResidue) {
      viewerRef.current?.highlight(hoverResidue);
      viewerRef.current?.focus(hoverResidue);
    } else if (phase !== 'parse') viewerRef.current?.highlight(null);
  }, [hoverResidue, phase, ready]);

  function stopSpin() {
    manuallyStopped.current = true;
    viewerRef.current?.spin(false);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage(L.copied);
      window.setTimeout(() => setShareMessage(''), 1800);
    } catch {
      setShareMessage(L.copyUrl);
    }
  }

  return <section className="mocha-structure-pane" aria-label="PD-L1 · KN035 complex 3D">
    <header className="mocha-structure-heading">
      <strong>{title}</strong>
      <span>{TITLE}</span>
      <div className="mocha-structure-legend" aria-label="Chain colors">
        {CHAINS.map(chain => <span key={chain.auth}><i style={{ background: chain.color }} />{chain.auth} · {chain.role}</span>)}
      </div>
    </header>
    <div ref={viewportRef} className="mocha-structure-viewport" onPointerDownCapture={stopSpin}>
      <canvas ref={canvasRef} aria-label="Interactive protein structure; drag to rotate, Ctrl/Cmd + scroll to zoom" />
      {!ready && <div className="mocha-structure-loading" role={failed ? 'alert' : 'status'}>
        {failed ? <><span>{L.loadFail}</span><button type="button" onClick={() => setRetry(value => value + 1)}>{L.retry}</button></> : <span>{L.loading}</span>}
      </div>}
      {ready && !shown && <div className="mocha-structure-hidden">{L.hidden}</div>}
      {ready && <div className="mocha-structure-toolbar" role="toolbar" aria-label="Structure tools">
        <button type="button" title={L.zoomIn} aria-label={L.zoomIn} onClick={() => viewerRef.current?.zoom(.85)}><ZoomIn size={17}/></button>
        <button type="button" title={L.zoomOut} aria-label={L.zoomOut} onClick={() => viewerRef.current?.zoom(1.15)}><ZoomOut size={17}/></button>
        <button type="button" title={L.center} aria-label={L.center} onClick={() => viewerRef.current?.reset()}><Focus size={17}/></button>
        <button type="button" title={L.interactions} aria-label={L.interactions} aria-pressed={interactions} onClick={() => { setInteractions(value => !value); void viewerRef.current?.interactions(!interactions); }}><Network size={17}/></button>
        <button type="button" title={L.measure} aria-label={L.measure} aria-pressed={measure} onClick={() => { setMeasure(value => !value); viewerRef.current?.measure(!measure); }}><Ruler size={17}/></button>
        <button type="button" title={L.toggle} aria-label={L.toggle} aria-pressed={!shown} onClick={() => setShown(value => !value)}>{shown ? <Eye size={17}/> : <EyeOff size={17}/>}</button>
        <button type="button" title={L.share} aria-label={L.share} onClick={share}><Share2 size={17}/></button>
      </div>}
      {labels.map((label, index) => <span key={index} className="mm-distance" style={{ left: label.x, top: label.y }}>{label.distance}</span>)}
      {shareMessage && <span className="mocha-structure-toast" role="status">{shareMessage}</span>}
      <p className="mocha-structure-hint">{measure ? status === 'firstAtom' ? L.second : L.two : wheelHint ? L.wheel : L.hint}</p>
    </div>
  </section>;
}
