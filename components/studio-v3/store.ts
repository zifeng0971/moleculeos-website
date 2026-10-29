/**
 * MOS v3 — the single state container. FROZEN (orchestrator-owned). See docs/STUDIO-V3-AMENDMENTS.md §A.
 *
 * - One module-level store, no providers. Read with `useV3(selector)`; write with `store.<action>()`.
 * - Hover lives in its own slice: components that do not select `s.hover` never re-render on pointer moves.
 * - Camera moves are requests (`s.camera`) that StageLayer executes; `by: 'stage'` never moves the camera.
 */
import { useRef, useSyncExternalStore } from 'react';
import type { ChainInfo } from '../console/molstar-lite';
import type { StageHandle } from '../studio/stage';
import type {
  Actor, Addr, AgentState, Candidate, DiffResult, DockState, FileRecord, LayerState, LayoutState, MutationRef,
  Notice, ProjectInfo, RunRecord, SchemeId, Scores, StructureState, V3State,
} from './contracts';

const now = () => new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
let seq = 0;
export const uid = (prefix: string) => `${prefix}${(++seq).toString(36)}${Math.floor(performance.now()).toString(36)}`;

const PROJECTS: ProjectInfo[] = [
  { id: 'vegf', name: 'VEGF 抗体亲和力成熟', goal: '提升 G6 对 VEGF-A 的亲和力 ≥10×，同时保持可开发性', role: 'Owner', members: ['Z', 'L', 'W'] },
  { id: 'pet', name: 'PET 水解酶热稳定性', goal: '把 IsPETase 的 Tm 提高 10 °C 且活性不降', role: 'Editor', members: ['Z', 'Q'] },
  { id: 'hum', name: '鼠源抗体人源化', goal: '人源化 4HT1 抗体并保持结合', role: 'Viewer', members: ['L'] },
];

const initialLayer = (): LayerState => ({
  paint: 'chain', lines: false, neighbors: { on: false, radius: 5 }, overlay: { paper: false, patent: false },
  track: { region: true, paint: true, contact: true, paper: true, patent: true, risk: true, candidate: true, shift: false },
  realOnly: false, evidenceKinds: [], rep: 'cartoon',
});
const initialDock = (): DockState => ({
  tab: 'evidence', size: 'fold', scope: { label: '全结构', addrs: [] },
  filter: { kinds: [], riskOnly: false, patentOnly: false, demoOnly: false },
});
const initialAgent = (): AgentState => ({ messages: [], busy: false, mode: 'ask', allowAll: false, draft: '' });

function initial(): V3State {
  return {
    project: PROJECTS[0], projects: PROJECTS,
    structure: { loaded: false, specimen: true, predicted: false, name: '2FJG', chains: [] },
    focus: { sel: [], by: 'stage' }, hover: { addrs: null, by: 'stage' }, camera: null, cameraPaused: false,
    layer: initialLayer(), scheme: 'Kabat',
    layout: { sidebar: 'open', mocha: 'open', track: 'normal', immersive: false, railTab: 'data' },
    viewport: { w: 1440, h: 900 },
    dock: initialDock(), scores: { ddg: {}, stab: {} },
    candidates: [], files: [], runs: [], notices: [], agent: initialAgent(),
    mochaCursor: null, diff: null, stage: null, ext: {},
  };
}

let state: V3State = initial();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
function set(patch: Partial<V3State> | ((s: V3State) => Partial<V3State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  emit();
}

// ---------- selector hook ----------
function shallowEqual(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}
/** Subscribe to a slice. The component re-renders only when the (shallowly compared) selection changes. */
export function useV3<T>(selector: (s: V3State) => T): T {
  const last = useRef<{ v: T } | null>(null);
  const read = () => {
    const next = selector(state);
    if (last.current && shallowEqual(last.current.v, next)) return last.current.v;
    last.current = { v: next };
    return next;
  };
  return useSyncExternalStore(subscribe, read, read);
}

// ---------- helpers ----------
const sameAddrs = (a: Addr[], b: Addr[]) => a.length === b.length && a.every((x, i) => x === b[i]);
let cameraTick = 0;
const cameraFor = (by: Actor) => by !== 'stage';
function residueCode(chains: ChainInfo[], addr: Addr) {
  const [c, n] = addr.split(':');
  return chains.find(x => x.auth === c)?.residues.find(r => r.seq === Number(n))?.code;
}
function scopeLabel(addrs: Addr[], mutation?: MutationRef, regionName?: string) {
  if (mutation) return `全结构 › ${regionName ? regionName + ' › ' : ''}${mutation.addr} ${mutation.from}→${mutation.to}`;
  if (regionName) return `全结构 › ${regionName}`;
  if (addrs.length === 1) return `全结构 › ${addrs[0]}`;
  if (addrs.length > 1) return `全结构 › ${addrs.length} 个残基`;
  return '全结构';
}

// ---------- actions ----------
export const store = {
  get: () => state,
  set,
  subscribe,

  // focus bus -------------------------------------------------------------
  setSel(addrs: Addr[], by: Actor) {
    if (sameAddrs(state.focus.sel, addrs) && state.focus.by === by) return;
    set(s => ({
      focus: { sel: addrs, by, evidenceId: undefined, candidateId: undefined },
      camera: cameraFor(by) && addrs.length ? { addrs, tick: ++cameraTick } : s.camera,
    }));
  },
  toggleSel(addr: Addr, by: Actor) {
    const cur = state.focus.sel;
    store.setSel(cur.includes(addr) ? cur.filter(a => a !== addr) : [...cur, addr], by);
  },
  setHover(addrs: Addr[] | null, by: Actor) {
    const cur = state.hover.addrs;
    if ((cur === null && addrs === null) || (cur && addrs && sameAddrs(cur, addrs))) return;
    set({ hover: { addrs, by } });
  },
  setRegion(regionId: string | undefined, addrs: Addr[], by: Actor) {
    set({ focus: { sel: addrs, region: regionId, by }, camera: cameraFor(by) && addrs.length ? { addrs, tick: ++cameraTick } : state.camera });
  },
  /** Focus an evidence item: `addrs` are its anchor residues (the caller has the evidence object). */
  focusEvidence(id: string, addrs: Addr[], by: Actor) {
    set({ focus: { sel: addrs, evidenceId: id, by }, camera: cameraFor(by) && addrs.length ? { addrs, tick: ++cameraTick } : state.camera });
  },
  /** Rejects mutations whose `from` does not match the structure (H:54 is Ala, so 'T' is refused). */
  focusMutation(m: MutationRef, by: Actor): boolean {
    const code = residueCode(state.structure.chains, m.addr);
    if (code && code !== m.from) { console.warn(`[v3] mutation ${m.addr} ${m.from}→${m.to} rejected: structure has ${code}`); return false; }
    set({ focus: { sel: [m.addr], mutation: m, by }, camera: cameraFor(by) ? { addrs: [m.addr], tick: ++cameraTick } : state.camera });
    return true;
  },
  clearFocus() { set({ focus: { sel: [], by: 'stage' }, mochaCursor: null }); },
  requestCamera(addrs: Addr[]) { set({ camera: { addrs, tick: ++cameraTick }, cameraPaused: false }); },
  setCameraPaused(paused: boolean) { if (state.cameraPaused !== paused) set({ cameraPaused: paused }); },
  setMochaCursor(c: { label: string; addrs: Addr[] } | null) { set({ mochaCursor: c }); },

  // layers & layout ---------------------------------------------------------
  setLayer(p: Partial<LayerState>) {
    set(s => ({
      layer: {
        ...s.layer, ...p,
        neighbors: { ...s.layer.neighbors, ...(p.neighbors ?? {}) },
        overlay: { ...s.layer.overlay, ...(p.overlay ?? {}) },
        track: { ...s.layer.track, ...(p.track ?? {}) },
      },
    }));
  },
  setScheme(scheme: SchemeId) { set({ scheme }); },
  setLayout(p: Partial<LayoutState>) { set(s => ({ layout: { ...s.layout, ...p } })); },
  setViewport(w: number, h: number) { if (state.viewport.w !== w || state.viewport.h !== h) set({ viewport: { w, h } }); },
  openDock(p: Partial<DockState> & { tab: DockState['tab'] }) {
    set(s => {
      const next: DockState = { ...s.dock, ...p, size: p.size ?? (s.dock.size === 'fold' ? 'peek' : s.dock.size) };
      if (p.scope) next.scope = p.scope;
      if (p.filter) next.filter = { ...s.dock.filter, ...p.filter };
      return { dock: next };
    });
  },
  setDock(p: Partial<DockState>) {
    set(s => ({ dock: { ...s.dock, ...p, filter: { ...s.dock.filter, ...(p.filter ?? {}) } } }));
  },
  foldDock() { set(s => ({ dock: { ...s.dock, size: 'fold' } })); },
  /** Re-derive the scope breadcrumb from the current focus. */
  scopeFromFocus(regionName?: string) {
    const f = state.focus;
    set(s => ({ dock: { ...s.dock, scope: { label: scopeLabel(f.sel, f.mutation, regionName), addrs: f.sel, regionId: f.region, mutation: f.mutation } } }));
  },

  // structure & scores -------------------------------------------------------
  setChains(chains: ChainInfo[]) { set(s => ({ structure: { ...s.structure, chains } })); },
  setStructure(p: Partial<StructureState>) { set(s => ({ structure: { ...s.structure, ...p } })); },
  /** 载入示例 2FJG: the ghost specimen becomes the user's structure. */
  loadSample() {
    set(s => ({ structure: { ...s.structure, loaded: true, specimen: false, predicted: false }, layer: { ...s.layer, paint: s.layer.paint === 'chain' ? 'region' : s.layer.paint } }));
  },
  setScores(p: Partial<Scores>) { set(s => ({ scores: { ddg: { ...s.scores.ddg, ...(p.ddg ?? {}) }, stab: { ...s.scores.stab, ...(p.stab ?? {}) } } })); },
  setDiff(diff: DiffResult | null) { set({ diff }); },
  registerStage(handle: StageHandle | null) { set({ stage: handle }); },

  // candidates -----------------------------------------------------------------
  addCandidate(c: Omit<Candidate, 'id' | 'addedAt'>): string | null {
    const code = residueCode(state.structure.chains, c.mutation.addr);
    if (code && code !== c.mutation.from) { console.warn(`[v3] candidate ${c.mutation.addr} ${c.mutation.from}→${c.mutation.to} rejected: structure has ${code}`); return null; }
    const dup = state.candidates.find(x => x.mutation.addr === c.mutation.addr && x.mutation.to === c.mutation.to);
    if (dup) return dup.id;
    const id = uid('cand');
    set(s => ({ candidates: [...s.candidates, { ...c, id, addedAt: now() }] }));
    return id;
  },
  updateCandidate(id: string, patch: Partial<Candidate>) { set(s => ({ candidates: s.candidates.map(c => c.id === id ? { ...c, ...patch } : c) })); },
  removeCandidate(id: string) { set(s => ({ candidates: s.candidates.filter(c => c.id !== id) })); },

  // files, runs, notices --------------------------------------------------------
  addFile(f: Omit<FileRecord, 'id' | 'createdAt'> & { id?: string }): string {
    const id = f.id ?? uid('file');
    set(s => ({ files: [...s.files.filter(x => x.id !== id), { ...f, id, createdAt: now() }] }));
    return id;
  },
  addRun(r: Omit<RunRecord, 'id' | 'startedAt' | 'projectId'> & { id?: string }): string {
    const id = r.id ?? uid('run');
    set(s => ({ runs: [{ ...r, id, startedAt: now(), projectId: s.project.id }, ...s.runs] }));
    return id;
  },
  patchRun(id: string, patch: Partial<RunRecord>) { set(s => ({ runs: s.runs.map(r => r.id === id ? { ...r, ...patch } : r) })); },
  addNotice(text: string, runId?: string) {
    set(s => ({ notices: [{ id: uid('n'), text, runId, at: now(), read: false }, ...s.notices] as Notice[] }));
  },
  markNoticesRead() { set(s => ({ notices: s.notices.map(n => ({ ...n, read: true })) })); },

  // agent session (state only; logic is in agent/engine.ts) -----------------------
  setAgent(p: Partial<AgentState>) { set(s => ({ agent: { ...s.agent, ...p } })); },
  updateMessages(fn: (m: AgentState['messages']) => AgentState['messages']) { set(s => ({ agent: { ...s.agent, messages: fn(s.agent.messages) } })); },
  setDraft(draft: string) { set(s => ({ agent: { ...s.agent, draft } })); },

  // project / misc ----------------------------------------------------------------
  setProject(id: string) { const p = state.projects.find(x => x.id === id); if (p) set({ project: p }); },
  setExt(key: string, value: unknown) { set(s => ({ ext: { ...s.ext, [key]: value } })); },
  /** Start a new session: keeps the project, drops everything the user produced. */
  reset() { const keep = { project: state.project, projects: state.projects, viewport: state.viewport, stage: state.stage, structure: { ...initial().structure, chains: state.structure.chains } }; state = { ...initial(), ...keep }; emit(); },
};

export type Store = typeof store;
