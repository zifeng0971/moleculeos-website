'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import type { StructureDef } from './data';
import type { ChainInfo, LigandInfo, Rep, Viewer } from './molstar-lite';

export type ViewportHandle = Pick<Viewer, 'focus' | 'zoom' | 'reset' | 'neighbors' | 'clearNeighbors' | 'measure' | 'clearMeasurements'>;
type Props = {
  structure: StructureDef;
  rep: Rep;
  chainVisible: Record<string, boolean>;
  selection: string[];
  highlight: string[] | null;
  onLoaded: (chains: ChainInfo[], ligands: LigandInfo[], colors: Record<string, string>) => void;
  onPick: (label: string | null, additive: boolean) => void;
  children?: ReactNode;
};

export const Viewport = forwardRef<ViewportHandle, Props>(function Viewport(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const latest = useRef(props); latest.current = props;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hover, setHover] = useState<string | null>(null);
  const [message, setMessage] = useState('Starting viewer');

  useEffect(() => {
    const abort = new AbortController();
    let created: Viewer | null = null;
    setStatus('loading'); setMessage('Starting viewer');
    (async () => {
      // Let React's dev double-mount settle before touching WebGL on this canvas.
      await new Promise(resolve => setTimeout(resolve, 30));
      abort.signal.throwIfAborted();
      const { createViewer } = await import('./molstar-lite');
      const s = latest.current.structure;
      created = await createViewer(canvas.current!, host.current!, s.src, s.format ?? 'mmcif', s.colors, {
        onPick: (label, additive) => latest.current.onPick(label, additive),
        onHover: setHover,
        onProgress: setMessage,
      }, abort.signal);
      abort.signal.throwIfAborted();
      viewer.current = created;
      latest.current.onLoaded(created.chains, created.ligands, created.colors);
      setStatus('ready');
    })().catch(error => { if (!abort.signal.aborted) { console.error(error); setStatus('error'); } });
    return () => { abort.abort(); viewer.current = null; try { created?.dispose(); } catch { /* already disposed */ } };
  }, [props.structure.id]);

  const ready = status === 'ready';
  const framed = useRef(false);
  useEffect(() => { if (!ready) framed.current = false; }, [ready, props.structure.id]);
  useEffect(() => {
    if (!ready) return;
    for (const [chain, visible] of Object.entries(props.chainVisible)) viewer.current?.setChainVisible(chain, visible);
    // Frame whatever is visible the first time the chain list arrives (some chains start hidden).
    if (!framed.current && Object.keys(props.chainVisible).length) { framed.current = true; setTimeout(() => viewer.current?.reset(), 450); }
  }, [ready, props.chainVisible]);
  useEffect(() => { if (ready) void viewer.current?.setRep(props.rep); }, [ready, props.rep]);
  useEffect(() => { if (ready) viewer.current?.select(props.selection); }, [ready, props.selection]);
  useEffect(() => { if (ready) viewer.current?.highlight(props.highlight); }, [ready, props.highlight]);

  useImperativeHandle(ref, () => ({
    focus: labels => viewer.current?.focus(labels),
    zoom: factor => viewer.current?.zoom(factor),
    reset: () => viewer.current?.reset(),
    neighbors: (labels, radius) => viewer.current?.neighbors(labels, radius) ?? Promise.resolve([]),
    clearNeighbors: () => viewer.current?.clearNeighbors() ?? Promise.resolve(),
    measure: (a, b) => viewer.current?.measure(a, b) ?? Promise.resolve(0),
    clearMeasurements: () => viewer.current?.clearMeasurements() ?? Promise.resolve(),
  }), []);

  return (
    <div className="wb-stage" ref={host}>
      <canvas ref={canvas} key={props.structure.id} />
      {status === 'loading' && <div className="wb-ov wb-loading"><div><Loader2 className="wb-spin" size={22} /><span>{message}…</span><div className="wb-bar"><i style={{ width: '60%' }} /></div></div></div>}
      {status === 'error' && <div className="wb-ov wb-loading"><div><TriangleAlert size={22} /><span>The 3D viewer could not start (WebGL unavailable?).</span></div></div>}
      {hover && <div className="wb-ov wb-tip">{hover}</div>}
      {props.children}
    </div>
  );
});
