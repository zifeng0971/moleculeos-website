'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Crosshair, GitCompare, ListChecks, Maximize, Play, Radius, Ruler, Save, Search, Sparkles, Tags, Trash2, X, ZoomIn, ZoomOut, BarChart3, FolderOpen } from 'lucide-react';
import './console.css';
import { MODELS, PROJECTS, type Group, type Project, type StructureDef, type Task, type Toast } from './data';
import type { ChainInfo, LigandInfo, Rep } from './molstar-lite';
import { Topbar } from './topbar';
import { Explorer } from './explorer';
import { SequenceStrip } from './sequence-strip';
import { Viewport, type ViewportHandle } from './viewport';
import { RunDialog } from './run-dialog';
import { ResultDialog, TasksPanel } from './tasks-panel';
import { MochaPanel } from './mocha-panel';
import { FilesPanel, InsightsPanel } from './insights-panel';
import { ShareDialog, SuperimposeDialog } from './dialogs';

type Dialog = { type: 'run'; initial?: string } | { type: 'result'; task: Task } | { type: 'super' } | { type: 'share' } | null;
type Tab = 'mocha' | 'tasks' | 'insights' | 'files';
let counter = 0;
const uid = () => `t${Date.now().toString(36)}${counter++}`;
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

export function ConsoleApp() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [projectId, setProjectId] = useState(PROJECTS[0].id);
  const project = projects.find(p => p.id === projectId) ?? projects[0];
  const [structureId, setStructureId] = useState(project.structures[0].id);
  const structure: StructureDef = project.structures.find(s => s.id === structureId) ?? project.structures[0];

  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [ligands, setLigands] = useState<LigandInfo[]>([]);
  const [colors, setColors] = useState<Record<string, string>>(structure.colors);
  const [chainVisible, setChainVisible] = useState<Record<string, boolean>>({});
  const [rep, setRep] = useState<Rep>('cartoon');
  const [selection, setSelection] = useState<string[]>([]);
  const [hoverSeq, setHoverSeq] = useState<string[] | null>(null);
  const [hoverGroup, setHoverGroup] = useState<string[] | null>(null);
  const [seqOpen, setSeqOpen] = useState(true);
  const [sideOpen, setSideOpen] = useState(true);
  const [inspOpen, setInspOpen] = useState(true);
  const [tab, setTab] = useState<Tab>('mocha');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [unread, setUnread] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const tasksRef = useRef<Task[]>([]);
  const [naming, setNaming] = useState<string | null>(null);
  const [nb, setNb] = useState<{ radius: number; found: { label: string; name: string }[] } | null>(null);
  const [measures, setMeasures] = useState<{ pair: string; dist: number }[]>([]);
  useEffect(() => { if (window.innerWidth < 1000) { setSideOpen(false); setInspOpen(false); } }, []);
  const view = useRef<ViewportHandle>(null);
  const toastId = useRef(1);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = toastId.current++;
    setToasts(t => [...t, { id, text, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // ----- tasks: a small simulation standing in for the real job queue -----
  const commitTasks = (next: Task[]) => { tasksRef.current = next; setTasks(next); };
  const addTask = useCallback((t: { modelId: string; name: string; input: string; by?: 'you' | 'mocha' }) => {
    const id = uid();
    commitTasks([{ id, name: t.name, modelId: t.modelId, status: 'queued', progress: 0, by: t.by ?? 'you', structure: structure.name, input: t.input, created: Date.now() }, ...tasksRef.current]);
    return id;
  }, [structure.name]);
  useEffect(() => {
    const timer = setInterval(() => {
      const prev = tasksRef.current;
      if (!prev.some(t => t.status !== 'done')) return;
      const finished: Task[] = [];
      const next = prev.map(t => {
        if (t.status === 'done') return t;
        const step = 100 / ((6 + (hash(t.id) % 8)) * 2);
        const progress = Math.min(100, t.progress + step * (t.status === 'queued' ? 0.5 : 1));
        const status = progress >= 100 ? 'done' as const : 'running' as const;
        const out = { ...t, progress, status };
        if (status === 'done') finished.push(out);
        return out;
      });
      commitTasks(next);
      if (finished.length) { setUnread(n => n + finished.length); finished.forEach(t => toast(`Task finished · ${t.name}`)); }
    }, 500);
    return () => clearInterval(timer);
  }, [toast]);
  const running = tasks.filter(t => t.status !== 'done').length;

  // ----- project / structure switching -----
  const resetScene = () => { setSelection([]); setNb(null); setMeasures([]); setNaming(null); setChains([]); setLigands([]); setChainVisible({}); };
  const openStructure = (id: string) => { if (id !== structureId) { resetScene(); setStructureId(id); } };
  const openProject = (id: string) => {
    const next = projects.find(p => p.id === id); if (!next || id === projectId) return;
    resetScene(); setProjectId(id); setStructureId(next.structures[0].id);
  };
  useEffect(() => { setColors(structure.colors); }, [structure]);
  const onLoaded = useCallback((c: ChainInfo[], l: LigandInfo[], resolved: Record<string, string>) => {
    setChains(c); setLigands(l); setColors(resolved);
    setChainVisible(Object.fromEntries(c.map(chain => [chain.auth, !structure.hiddenChains?.includes(chain.auth)])));
  }, [structure]);

  const addStructure = (file: File) => {
    const text = file.name.toLowerCase().endsWith('.pdb') || file.name.toLowerCase().endsWith('.ent') ? 'pdb' as const : 'mmcif' as const;
    const id = `up-${Date.now()}`;
    const def: StructureDef = {
      id, name: file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 12), title: file.name, src: URL.createObjectURL(file), format: text, source: 'Uploaded',
      colors: {}, chainNames: {}, insights: { kind: 'Uploaded structure', confidence: 0.5, summary: 'MMetrics runs on the server for uploaded structures; this prototype shows no analysis for them.', basis: [], homologs: [], regions: [], contacts: [] },
    };
    setProjects(ps => ps.map(p => p.id === projectId ? { ...p, structures: [...p.structures, def] } : p));
    resetScene(); setStructureId(id); toast(`${def.name} added to ${project.name}`);
  };

  // ----- selection -----
  const pick = useCallback((label: string | null, additive: boolean) => {
    if (!label) { setSelection([]); return; }
    setSelection(sel => additive ? (sel.includes(label) ? sel.filter(l => l !== label) : [...sel, label]) : (sel.length === 1 && sel[0] === label ? [] : [label]));
  }, []);
  const selectFromSeq = (label: string, mode: 'replace' | 'toggle' | 'range', range?: string[]) => {
    if (mode === 'range' && range) setSelection(range); else pick(label, mode === 'toggle');
  };
  const selectAndFocus = (labels: string[]) => { setSelection(labels); setTimeout(() => view.current?.focus(labels), 30); };

  // ----- viewport tools -----
  const openNeighbors = async (radius = 5) => {
    const found = await view.current?.neighbors(selection, radius) ?? [];
    setNb({ radius, found });
  };
  const closeNeighbors = () => { void view.current?.clearNeighbors(); setNb(null); };
  const saveGroup = (name: string) => {
    const g: Group = { id: uid(), name: name.trim() || `Group ${project.groups.length + 1}`, kind: 'annotation', labels: selection, desc: `${selection.length} residues` };
    setProjects(ps => ps.map(p => p.id === projectId ? { ...p, groups: [...p.groups, g] } : p));
    setNaming(null); toast(`Saved “${g.name}” to Residue groups`);
  };
  const saveNeighbors = () => {
    if (!nb) return;
    const g: Group = { id: uid(), name: `${nb.radius} Å around ${selection.slice(0, 2).join(', ')}${selection.length > 2 ? '…' : ''}`, kind: 'neighbors', labels: nb.found.map(f => f.label), desc: `within ${nb.radius} Å` };
    setProjects(ps => ps.map(p => p.id === projectId ? { ...p, groups: [...p.groups, g] } : p));
    toast('Neighbors saved to Residue groups');
  };
  const doMeasure = async () => {
    const [a, b] = selection; if (!a || !b) return;
    const dist = await view.current?.measure(a, b); if (dist) setMeasures(m => [...m, { pair: `${a} – ${b}`, dist }]);
  };

  // ----- keyboard -----
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setDialog({ type: 'run' }); }
      else if (event.key === 'Escape' && !dialog) setSelection([]);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [dialog]);

  const marks = useMemo(() => {
    const out: Record<string, string> = {};
    for (const region of structure.insights.regions) for (const label of region.labels) out[label] ??= region.tone;
    return out;
  }, [structure]);
  const highlight = hoverGroup ?? hoverSeq;
  const doneTask = dialog?.type === 'result' ? dialog.task : null;
  const resultSeq = useMemo(() => (chains[0]?.residues.map(r => r.code).join('') ?? ''), [chains]);
  const tabs: { id: Tab; label: string; icon: typeof Sparkles; badge?: number }[] = [
    { id: 'mocha', label: 'Mocha', icon: Sparkles }, { id: 'tasks', label: 'Tasks', icon: ListChecks, badge: running },
    { id: 'insights', label: 'Insights', icon: BarChart3 }, { id: 'files', label: 'Files', icon: FolderOpen },
  ];
  const [draftName, setDraftName] = useState('');

  return (
    <div className="wb" data-theme={theme}>
      <Topbar projects={projects} project={project} onProject={openProject} running={running} unread={unread}
        onRuns={() => { setInspOpen(true); setTab('tasks'); }} onPalette={() => setDialog({ type: 'run' })} onShare={() => setDialog({ type: 'share' })}
        onBell={() => { setUnread(0); setInspOpen(true); setTab('tasks'); }} theme={theme} onTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        sideOpen={sideOpen} inspOpen={inspOpen} onSide={() => setSideOpen(o => !o)} onInsp={() => setInspOpen(o => !o)} />
      <div className="wb-body">
        <div className={`wb-side ${sideOpen ? '' : 'closed'}`}>
          <Explorer project={project} active={structure.id} structures={project.structures} chains={chains} ligands={ligands} chainVisible={chainVisible}
            onStructure={openStructure} onToggleChain={chain => setChainVisible(v => ({ ...v, [chain]: v[chain] === false }))} onUpload={addStructure}
            groups={project.groups} onGroupHover={setHoverGroup} onGroupOpen={g => selectAndFocus(g.labels)}
            onGroupDelete={id => setProjects(ps => ps.map(p => p.id === projectId ? { ...p, groups: p.groups.filter(g => g.id !== id) } : p))}
            onGroupCopy={g => { void navigator.clipboard?.writeText(g.labels.join(', ')); toast('Residues copied'); }} />
        </div>

        <main className="wb-view">
          <div className="wb-view-head">
            <div className="wb-view-title"><b>{structure.name}</b><span>{structure.title}</span></div>
            <div className="wb-seg" role="group" aria-label="Representation">
              {(['cartoon', 'sticks', 'surface'] as const).map(r => <button key={r} className={rep === r ? 'on' : ''} onClick={() => setRep(r)}>{r[0].toUpperCase() + r.slice(1)}</button>)}
            </div>
            <span className="wb-grow" />
            {measures.length > 0 && <button className="wb-btn sm ghost" onClick={() => { void view.current?.clearMeasurements(); setMeasures([]); }}><Trash2 size={13} />Clear {measures.length} measurement{measures.length > 1 ? 's' : ''}</button>}
            <button className="wb-icon" onClick={() => view.current?.zoom(0.8)} aria-label="Zoom in" title="Zoom in"><ZoomIn size={17} /></button>
            <button className="wb-icon" onClick={() => view.current?.zoom(1.25)} aria-label="Zoom out" title="Zoom out"><ZoomOut size={17} /></button>
            <button className="wb-icon" onClick={() => view.current?.reset()} aria-label="Reset view" title="Reset view"><Maximize size={17} /></button>
          </div>
          <SequenceStrip chains={chains} colors={colors} chainNames={structure.chainNames} chainVisible={chainVisible} selection={selection} highlight={highlight} marks={marks}
            onSelect={selectFromSeq} onHover={setHoverSeq} open={seqOpen} onToggle={() => setSeqOpen(o => !o)} />
          <Viewport ref={view} structure={structure} rep={rep} chainVisible={chainVisible} selection={selection} highlight={highlight} onLoaded={onLoaded} onPick={pick}>
            <div className="wb-topstack">
            {selection.length === 0 ? (
              <div className="wb-selbar idle"><Crosshair size={14} />Click residues in the structure or the sequence to select them. Tools for the selection appear here.</div>
            ) : (
              <div className="wb-selbar">
                {selection.slice(0, 5).map(l => <span key={l} className="wb-chip">{l}<button aria-label={`Deselect ${l}`} onClick={() => setSelection(s => s.filter(x => x !== l))}><X size={11} /></button></span>)}
                {selection.length > 5 && <span className="wb-pill">+{selection.length - 5}</span>}
                <span className="wb-sep" />
                {naming === null ? (<>
                  <button className="wb-btn sm ghost" onClick={() => view.current?.focus(selection)}><Crosshair size={13} />Focus</button>
                  <button className="wb-btn sm ghost" onClick={() => openNeighbors(nb?.radius ?? 5)}><Radius size={13} />Neighbors</button>
                  <button className="wb-btn sm ghost" disabled={selection.length !== 2} title={selection.length === 2 ? '' : 'Select exactly two residues'} onClick={doMeasure}><Ruler size={13} />Measure</button>
                  <button className="wb-btn sm ghost" onClick={() => { setDraftName(''); setNaming(''); }}><Tags size={13} />Save as group</button>
                  <button className="wb-btn sm ghost" onClick={() => setDialog({ type: 'run' })}><Play size={13} />Run on selection</button>
                  <button className="wb-icon sm" aria-label="Clear selection" onClick={() => setSelection([])}><X size={14} /></button>
                </>) : (<>
                  <input className="wb-input" autoFocus style={{ width: 170, height: 26 }} placeholder="Group name" value={draftName} onChange={e => setDraftName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveGroup(draftName); if (e.key === 'Escape') setNaming(null); }} />
                  <button className="wb-btn sm primary" onClick={() => saveGroup(draftName)}><Save size={13} />Save</button>
                  <button className="wb-btn sm ghost" onClick={() => setNaming(null)}>Cancel</button>
                </>)}
                {measures.slice(-1).map(m => <span key={m.pair} className="wb-pill accent">{m.pair} · {m.dist.toFixed(2)} Å</span>)}
              </div>
            )}
            {nb && (
              <div className="wb-nb">
                <h4><Radius size={14} />Neighbors within {nb.radius} Å <span className="wb-grow" /><button className="wb-icon sm" aria-label="Close neighbors" onClick={closeNeighbors}><X size={14} /></button></h4>
                <input type="range" min={1} max={10} step={0.5} value={nb.radius} aria-label="Radius in angstrom" onChange={e => void openNeighbors(Number(e.target.value))} />
                <div className="wb-muted">{nb.found.length} residues found</div>
                <div className="wb-res-list">{nb.found.slice(0, 40).map(f => <span key={f.label} title={f.name}>{f.label}</span>)}</div>
                <button className="wb-btn sm" style={{ marginTop: 8 }} onClick={saveNeighbors}><Check size={13} />Save to groups</button>
              </div>
            )}
            </div>
            <div className="wb-ov wb-dock" role="toolbar" aria-label="Actions">
              <button className="wb-btn primary" onClick={() => setDialog({ type: 'run' })}><Play size={14} />Run model<kbd className="wb-kbd" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>⌘K</kbd></button>
              <span className="wb-sep" />
              <button className="wb-btn" onClick={() => setDialog({ type: 'run', initial: 'seqsim' })}><Search size={14} />Find homologs</button>
              <button className="wb-btn" onClick={() => setDialog({ type: 'super' })}><GitCompare size={14} />Superimpose</button>
              <button className="wb-btn" onClick={() => { setInspOpen(true); setTab('mocha'); }}><Sparkles size={14} />Ask Mocha</button>
            </div>
          </Viewport>
        </main>

        <aside className={`wb-insp ${inspOpen ? '' : 'closed'}`}>
          <div className="wb-tabs" role="tablist">
            {tabs.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={`wb-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
                <t.icon size={15} />{t.label}{t.badge ? <em>{t.badge}</em> : null}
              </button>
            ))}
          </div>
          {tab === 'mocha' && <MochaPanel tasks={tasks} structure={structure.name} selection={selection} addTask={addTask as never} onSelect={selectAndFocus} onShowTasks={() => setTab('tasks')} />}
          {tab === 'tasks' && <TasksPanel tasks={tasks} onOpen={task => setDialog({ type: 'result', task })} onRun={() => setDialog({ type: 'run' })} />}
          {tab === 'insights' && <InsightsPanel data={structure.insights} onRegion={selectAndFocus} onHover={setHoverGroup} />}
          {tab === 'files' && <FilesPanel tasks={tasks} structures={project.structures} />}
        </aside>
      </div>

      {dialog?.type === 'run' && (
        <RunDialog initial={dialog.initial} structure={structure} chains={chains} ligands={ligands} selection={selection} onClose={() => setDialog(null)}
          onSubmit={t => { addTask(t); setDialog(null); setInspOpen(true); setTab('tasks'); toast(`Started · ${MODELS.find(m => m.id === t.modelId)?.name}`, 'info'); }} />
      )}
      {doneTask && <ResultDialog task={doneTask} sequence={resultSeq} onClose={() => setDialog(null)} onToast={toast} />}
      {dialog?.type === 'super' && <SuperimposeDialog structures={project.structures} onClose={() => setDialog(null)} onAdd={() => document.querySelector<HTMLInputElement>('.wb input[type=file]')?.click()} onConfirm={names => { setDialog(null); toast(`Aligned ${names.join(' + ')} (demo)`); }} />}
      {dialog?.type === 'share' && <ShareDialog project={project.name} onClose={() => setDialog(null)} onCopy={() => { void navigator.clipboard?.writeText(location.href); toast('Link copied'); }} />}
      <div className="wb-toasts" aria-live="polite">{toasts.map(t => <div key={t.id} className={`wb-toast ${t.tone}`}><Check size={15} />{t.text}</div>)}</div>
    </div>
  );
}
