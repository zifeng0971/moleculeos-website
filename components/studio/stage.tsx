'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import type { ChainInfo, Viewer } from '../console/molstar-lite';
import { CHAIN_COLORS, HIDDEN_CHAINS, STRUCTURE } from './model';

export type PaintGroup = { color: string; labels?: string[]; chains?: string[] };
export type StageHandle = Pick<Viewer, 'focus' | 'zoom' | 'reset' | 'neighbors' | 'clearNeighbors' | 'measure' | 'clearMeasurements'>;
type Props = {
  selection: string[];
  highlight: string[] | null;
  paint: PaintGroup[] | null;
  onLoaded: (chains: ChainInfo[]) => void;
  onPick: (label: string | null, additive: boolean) => void;
  onHover: (label: string | null) => void;
  children?: ReactNode;
};

/** The 3D stage: one Mol* viewer for the prototype's single structure. */
export const Stage = forwardRef<StageHandle, Props>(function Stage(props, ref) {
  const canvas = useRef<HTMLCanvasElement>(null), host = useRef<HTMLDivElement>(null);
  const viewer = useRef<Viewer | null>(null);
  const latest = useRef(props); latest.current = props;
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('启动查看器');

  useEffect(() => {
    const abort = new AbortController();
    let created: Viewer | null = null;
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 30));
      abort.signal.throwIfAborted();
      const { createViewer } = await import('../console/molstar-lite');
      created = await createViewer(canvas.current!, host.current!, STRUCTURE.src, 'mmcif', CHAIN_COLORS, {
        onPick: (label, additive) => latest.current.onPick(label, additive),
        onHover: label => latest.current.onHover(label),
        onProgress: m => setMessage(m === 'Fetching structure' ? '加载结构' : m),
      }, abort.signal);
      abort.signal.throwIfAborted();
      HIDDEN_CHAINS.forEach(c => created!.setChainVisible(c, false));
      viewer.current = created;
      latest.current.onLoaded(created.chains.filter(c => !HIDDEN_CHAINS.includes(c.auth)));
      setStatus('ready');
      setTimeout(() => created?.reset(), 300);
    })().catch(error => { if (!abort.signal.aborted) { console.error(error); setStatus('error'); } });
    return () => { abort.abort(); viewer.current = null; try { created?.dispose(); } catch { /* already disposed */ } };
  }, []);

  const ready = status === 'ready';
  useEffect(() => { if (ready) viewer.current?.select(props.selection); }, [ready, props.selection]);
  useEffect(() => { if (ready) viewer.current?.highlight(props.highlight); }, [ready, props.highlight]);
  // Paints are serialised: a lens switch while the previous overpaint is still committing must not interleave.
  const queue = useRef(Promise.resolve());
  useEffect(() => {
    if (!ready) return;
    const groups = props.paint;
    queue.current = queue.current.then(() => viewer.current?.paint(groups)).catch(console.error);
  }, [ready, props.paint]);

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
    <div className="st-stage" ref={host}>
      <canvas ref={canvas} />
      {status === 'loading' && <div className="st-stage-msg"><Loader2 className="st-spin" size={20} /><span>{message}…</span></div>}
      {status === 'error' && <div className="st-stage-msg"><TriangleAlert size={20} /><span>3D 查看器无法启动（WebGL 不可用？）</span></div>}
      {props.children}
    </div>
  );
});
