'use client';
import Image from 'next/image';
import { AgentSequence } from './AgentSequence';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Focus, Network, Ruler, Trash2, ZoomIn, ZoomOut, Layers } from 'lucide-react';
import data from '@/content/antibody-affinity-structure.json';
import { DEMO_STRUCTURE } from '@/demo/tasks.config';
import { createViewer, type ViewerController, type MeasurementLabel } from './molstar-controller';
import type { Camera } from 'molstar/lib/mol-canvas3d/camera';

type ViewState = { camera?: Camera.Snapshot; sequence: boolean; interactions: boolean; representation: number };
export default function AgentStructure({ taskId, prepared, selected, onSelect, focus, running }: {
  taskId: number | null; prepared: boolean; selected: string[]; onSelect: (label: string) => void;
  focus: { residue: string; serial: number } | null; running: boolean;
}) {
  const t = useTranslations('agentDemo.structure');
  const canvas = useRef<HTMLCanvasElement>(null), container = useRef<HTMLDivElement>(null);
  const driver = useRef<ViewerController>(), views = useRef(new Map<number, ViewState>()), previousTask = useRef<number | null>(null);
  const pick = useRef(onSelect); pick.current = onSelect;
  const [enabled, setEnabled] = useState(false), [ready, setReady] = useState(false), [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0), [progress, setProgress] = useState(0), [sequence, setSequence] = useState(false);
  const [interactions, setInteractions] = useState(false), [measure, setMeasure] = useState(false), [representation, setRepresentation] = useState(0);
  const [labels, setLabels] = useState<MeasurementLabel[]>([]), [status, setStatus] = useState('ready');
  const settings = useRef({ sequence, interactions, representation });
  settings.current = { sequence, interactions, representation };
  useEffect(() => { if (prepared && matchMedia('(min-width:768px) and (prefers-reduced-motion:no-preference)').matches) setEnabled(true); }, [prepared]);
  useEffect(() => {
    if (!enabled) return;
    const abort = new AbortController(); let controller: ViewerController | undefined;
    setError(false); setReady(false); setProgress(0);
    void createViewer(canvas.current!, container.current!, setProgress, setStatus, setLabels, abort.signal, value => pick.current(value), { src: DEMO_STRUCTURE.src, label: DEMO_STRUCTURE.label, chains: data.chains }).then(value => {
      if (abort.signal.aborted) { value.dispose(); return; }
      controller = value; driver.current = value; value.spin(false); setReady(true);
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => { if (controller) { controller.dispose(); driver.current = undefined; } else abort.abort(); };
  }, [enabled, attempt]);
  useEffect(() => {
    if (previousTask.current !== null && driver.current) {
      const prior = views.current.get(previousTask.current);
      views.current.set(previousTask.current, { camera: driver.current.snapshot(), ...settings.current, sequence: prior?.sequence ?? settings.current.sequence });
    }
    previousTask.current = taskId;
    const view = taskId === null ? undefined : views.current.get(taskId);
    setSequence(view?.sequence ?? false);
    setInteractions(view?.interactions ?? false); setRepresentation(view?.representation ?? 0);
    if (ready && driver.current) { if (view?.camera) driver.current.restore(view.camera); else driver.current.reset(); void driver.current.clear(); }
    if (ready && driver.current) { void driver.current.interactions(view?.interactions ?? false); void driver.current.representation((['cartoon', 'molecular-surface', 'ball-and-stick'] as const)[view?.representation ?? 0]); }
    setLabels([]); setMeasure(false); driver.current?.measure(false);
  }, [taskId, ready]);
  useEffect(() => { if (ready) { driver.current?.select(selected); } }, [selected, ready]);
  useEffect(() => { if (ready && focus) driver.current?.focus(focus.residue); }, [focus, ready]);
  useEffect(() => {
    if (!ready) return;
    let visible = false;
    const sync = () => driver.current?.active(visible && running && !document.hidden && !sequence && prepared);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(container.current!); document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, [ready, running, sequence, prepared]);
  const buttons = [
    { name: 'zoomIn', icon: ZoomIn, run: () => driver.current?.zoom(.85) },
    { name: 'zoomOut', icon: ZoomOut, run: () => driver.current?.zoom(1.15) },
    { name: 'reset', icon: Focus, run: () => driver.current?.reset() },
    { name: 'representation', icon: Layers, run: () => { const next = (representation + 1) % 3; setRepresentation(next); void driver.current?.representation((['cartoon', 'molecular-surface', 'ball-and-stick'] as const)[next]); } },
    { name: 'interactions', icon: Network, pressed: interactions, run: () => { setInteractions(!interactions); void driver.current?.interactions(!interactions); } },
    { name: 'measure', icon: Ruler, pressed: measure, run: () => { setMeasure(!measure); driver.current?.measure(!measure); } },
    { name: 'clear', icon: Trash2, run: () => { void driver.current?.clear(); } },
  ];
  function changeView(value: boolean) { setSequence(value); if (taskId !== null) views.current.set(taskId, { ...views.current.get(taskId), sequence: value, interactions, representation }); }
  return <section className="agent-structure" aria-label={t('label')}>
    <header><strong>{DEMO_STRUCTURE.label}</strong><div className="agent-chain-legend">{data.chains.map(chain => <span key={chain.auth} style={{ color: chain.color }}>{t(chain.role)} · {chain.auth}</span>)}</div></header>
    <AgentSequence selected={selected} select={onSelect} hover={residue => driver.current?.highlight(residue)}/>
    <div className="agent-structure-body">
      <div ref={container} className={`agent-canvas ${sequence ? 'agent-canvas-hidden' : ''}`} tabIndex={0} aria-label={t('label')}>
        <canvas ref={canvas} />
        {(!ready || !prepared) && <Image src={DEMO_STRUCTURE.preview} alt={t('preview')} fill sizes="(min-width:1024px) 30vw, 90vw" />}
        {!prepared ? <div className="agent-structure-cover" role="status">{t('preparing')}</div> : !enabled ? <div className="agent-structure-cover"><button onClick={() => setEnabled(true)}>{t('load')}</button></div> : error ? <div className="agent-structure-cover" role="alert"><p>{t('error')}</p><button onClick={() => setAttempt(value => value + 1)}>{t('retry')}</button></div> : !ready ? <div className="agent-structure-cover" role="status"><progress value={progress} max={3}/>{t('loading')}</div> : <>
          <div className="agent-viewer-tools">{buttons.map(({ name, icon: Icon, run, pressed }) => <button key={name} aria-label={t(name)} title={t(name)} aria-pressed={pressed} onClick={run}><Icon size={17}/></button>)}</div>
          {labels.map((label, index) => <span key={index} className="mm-distance" style={{ left: label.x, top: label.y }}>{label.distance}</span>)}
          <p className="agent-structure-status">{measure ? t(status === 'firstAtom' ? 'secondAtom' : 'measureHint') : t('drag')}</p>
        </>}
      </div>
      {sequence && <div className="agent-actual-sequence">{data.chains.map(chain => <div key={chain.auth}><strong style={{ color: chain.color }}>{t(chain.role)} · {chain.auth}</strong><div>{chain.residues.map(residue => <button key={residue.label} aria-pressed={selected.includes(residue.label)} title={`${residue.name} · ${residue.label}`} aria-label={`${residue.name} · ${residue.label}`} onMouseEnter={() => driver.current?.highlight(residue.label)} onMouseLeave={() => driver.current?.highlight(null)} onClick={() => onSelect(residue.label)}>{residue.name}<small>{residue.label.split(':')[1]}</small></button>)}</div></div>)}</div>}
    </div>
    <footer><button aria-pressed={!sequence} onClick={() => changeView(false)}>{t('structure')}</button><button aria-pressed={sequence} onClick={() => changeView(true)}>{t('sequence')}</button></footer>
  </section>;
}
