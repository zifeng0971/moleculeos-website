'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Focus, Network, Ruler, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { createViewer, type ViewerController, type MeasurementLabel } from '../molstar-controller';
import contacts from '@/content/mocha-workbench-contacts.json';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';
import { DEMO_CANDIDATE_RESIDUES, type DemoPhase } from './demoScript';

const STRUCTURE = '/demo/antibody-affinity/workbench.cif';
const PREVIEW = '/demo/antibody-affinity/preview.png';
const CHAINS = [
  { auth: 'A', role: 'Antigen', color: '#18bba1' },
  { auth: 'B', role: 'Light chain', color: '#f39838' },
  { auth: 'C', role: 'Heavy chain', color: '#a58aee' },
] as const;

export function MochaStructurePane({ title, phase, phaseProgress, running, hoverResidue }: {
  title: string;
  phase: DemoPhase;
  phaseProgress: number;
  running: boolean;
  hoverResidue: string | null;
}) {
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
  const [shareMessage, setShareMessage] = useState('');
  const [status, setStatus] = useState('');
  const chainBeat = phase === 'parse' ? Math.min(2, Math.floor(phaseProgress * 3)) : -1;

  useEffect(() => {
    const abort = new AbortController();
    let controller: ViewerController | null = null;
    setReady(false);
    setFailed(false);
    // The preview image covers the pane until Mol* is ready, so starting after the hero entrance looks the same.
    const cancelStart = afterHeroEntrance(() => {
      void createViewer(canvasRef.current!, viewportRef.current!, () => {}, setStatus, setLabels, abort.signal, undefined, {
        src: STRUCTURE,
        label: 'Antibody–Antigen Complex · Fab',
        chains: CHAINS.map(chain => ({ auth: chain.auth, color: chain.color })),
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

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !ready) return;
    viewer.active(running && shown);
    const allowSpin = running && shown && !manuallyStopped.current && !matchMedia('(prefers-reduced-motion: reduce)').matches && (phase === 'ready' || phase === 'thinking' || phase === 'parse');
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
    if (phase === 'interface') {
      viewer.spin(false);
      viewer.highlightChain(null);
      viewer.select(contacts);
      // Keep the whole complex visible in the shorter hero workbench.
      viewer.reset();
      return;
    }
    if (phase === 'cdr') {
      viewer.select([...DEMO_CANDIDATE_RESIDUES]);
      void viewer.showResidueSticks(DEMO_CANDIDATE_RESIDUES);
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
      setShareMessage('链接已复制');
      window.setTimeout(() => setShareMessage(''), 1800);
    } catch {
      setShareMessage('可复制浏览器地址分享');
    }
  }

  return <section className="mocha-structure-pane" aria-label="Antibody–Antigen Complex 3D">
    <header className="mocha-structure-heading">
      <strong>{title}</strong>
      <span>Antibody–Antigen Complex · Fab</span>
      <div className="mocha-structure-legend" aria-label="Chain colors">
        {CHAINS.map(chain => <span key={chain.auth}><i style={{ background: chain.color }} />{chain.auth} · {chain.role}</span>)}
      </div>
    </header>
    <div ref={viewportRef} className="mocha-structure-viewport" onPointerDownCapture={stopSpin}>
      <canvas ref={canvasRef} aria-label="Interactive protein structure; drag to rotate, scroll to zoom" />
      {!ready && <Image src={PREVIEW} fill priority sizes="(min-width: 1024px) 55vw, 92vw" alt="Antibody–antigen structure preview" />}
      {!ready && <div className="mocha-structure-loading" role={failed ? 'alert' : 'status'}>
        {failed ? <><span>无法加载结构查看器</span><button type="button" onClick={() => setRetry(value => value + 1)}>重试</button></> : <span>正在加载 3D 结构…</span>}
      </div>}
      {ready && !shown && <div className="mocha-structure-hidden">结构已隐藏</div>}
      {ready && <div className="mocha-structure-toolbar" role="toolbar" aria-label="Structure tools">
        <button type="button" title="放大" aria-label="放大" onClick={() => viewerRef.current?.zoom(.85)}><ZoomIn size={17}/></button>
        <button type="button" title="缩小" aria-label="缩小" onClick={() => viewerRef.current?.zoom(1.15)}><ZoomOut size={17}/></button>
        <button type="button" title="居中" aria-label="居中" onClick={() => viewerRef.current?.reset()}><Focus size={17}/></button>
        <button type="button" title="互作" aria-label="互作" aria-pressed={interactions} onClick={() => { setInteractions(value => !value); void viewerRef.current?.interactions(!interactions); }}><Network size={17}/></button>
        <button type="button" title="测量" aria-label="测量" aria-pressed={measure} onClick={() => { setMeasure(value => !value); viewerRef.current?.measure(!measure); }}><Ruler size={17}/></button>
        <button type="button" title="显隐" aria-label="显隐" aria-pressed={!shown} onClick={() => setShown(value => !value)}>{shown ? <Eye size={17}/> : <EyeOff size={17}/>}</button>
        <button type="button" title="分享" aria-label="分享" onClick={share}><Share2 size={17}/></button>
      </div>}
      {labels.map((label, index) => <span key={index} className="mm-distance" style={{ left: label.x, top: label.y }}>{label.distance}</span>)}
      {shareMessage && <span className="mocha-structure-toast" role="status">{shareMessage}</span>}
      <p className="mocha-structure-hint">{measure ? status === 'firstAtom' ? '选择第二个原子' : '选择两个原子测距' : '拖动旋转 · 滚轮缩放'}</p>
    </div>
  </section>;
}
