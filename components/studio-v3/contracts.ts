/**
 * MOS v3 — shared contracts. FROZEN: owned by the orchestrator; the five module owners must not edit this file
 * (see docs/STUDIO-V3-AMENDMENTS.md §A.3 for how to extend). Types only — no runtime code lives here.
 */
import type { ChainInfo } from '../console/molstar-lite';
import type { StageHandle } from '../studio/stage';

// ---------- primitives ----------
/** A residue address `chain:authSeq`, e.g. 'H:54'. Same shape as ../studio/model.ts labels. No insertion codes. */
export type Addr = string;
export type SchemeId = 'IMGT' | 'Kabat' | 'Chothia' | 'AHo' | 'auth' | 'UniProt' | 'source';
/** One-letter amino acid codes. */
export interface MutationRef { addr: Addr; from: string; to: string }
export type Origin = 'real' | 'derived' | 'demo';
export type EvidenceKind = 'structure' | 'model' | 'paper' | 'patent' | 'risk' | 'lab';
export type Actor = 'stage' | 'track' | 'sidebar' | 'agent' | 'evidence' | 'doc' | 'candidate' | 'cmdk' | 'statusbar';

// ---------- focus bus ----------
export interface Focus {
  /** Persistent selection; becomes Mocha's context. */
  sel: Addr[];
  region?: string;                 // id from ../studio/model.ts REGIONS ('h2', 'ep', …)
  mutation?: MutationRef;
  evidenceId?: string;
  candidateId?: string;
  by: Actor;
}
/** Transient hover. Kept apart from Focus so selecting `s => s.focus` does not re-render on every pointer move. */
export interface HoverState { addrs: Addr[] | null; by: Actor }
/** A request to move the camera. `tick` increments on every request so StageLayer can react to repeats. */
export interface CameraRequest { addrs: Addr[]; tick: number }

// ---------- layers ----------
export type PaintLensId =
  | 'chain' | 'plddt' | 'region' | 'interface' | 'conservation' | 'ddg' | 'stability'
  | 'paper' | 'patent' | 'fto' | 'gap' | 'shift';
export type TrackRowId = 'region' | 'paint' | 'contact' | 'paper' | 'patent' | 'risk' | 'candidate' | 'shift';
export interface LayerState {
  /** Mutually exclusive colouring. */
  paint: PaintLensId;
  lines: boolean;
  neighbors: { on: boolean; radius: number };
  /** Evidence overlay channel: highlight paper/patent anchors in a second colour alongside the paint lens. */
  overlay: { paper: boolean; patent: boolean };
  track: Record<TrackRowId, boolean>;
  /** 仅显示真实证据: recomputes lenses, counts, candidate gates and Mocha's conclusions. */
  realOnly: boolean;
  evidenceKinds: EvidenceKind[];
  /** Representation of the whole structure. */
  rep: 'cartoon' | 'sticks' | 'surface';
}

// ---------- layout ----------
export type DockTab = 'evidence' | 'candidates' | 'docs' | 'runs';
export type DockSize = 'fold' | 'peek' | 'read' | 'max';
export interface DockScope {
  label: string;                   // breadcrumb text: '全结构 › CDR-H2 › H:54A>M' (display names; data uses Addr)
  addrs: Addr[];                   // empty = whole structure
  regionId?: string;
  mutation?: MutationRef;
}
export interface DockFilter { kinds: EvidenceKind[]; riskOnly: boolean; patentOnly: boolean; demoOnly: boolean }
export interface DockState { tab: DockTab; size: DockSize; scope: DockScope; filter: DockFilter; docId?: string }
export interface LayoutState {
  sidebar: 'open' | 'drawer' | 'closed';
  mocha: 'open' | 'drawer' | 'closed';
  track: 'fold' | 'normal' | 'tall';
  immersive: boolean;
  railTab: 'data' | 'search' | 'models' | 'tasks' | 'help';
}
export type LayoutMode = 'desktop' | 'compact' | 'tablet' | 'phone';
export interface ComputedLayout {
  mode: LayoutMode;
  stage: { x: number; y: number; w: number; h: number };   // canvas rectangle in px
  track: { h: number };
  dock: { h: number };
  sidebar: { w: number };
  mocha: { w: number };
  /** desktop/compact: stage clear area meets the invariant (≥480×420, or ≥480×300 while reading). */
  invariantOk: boolean;
  /** tablet/phone: canvas visible and tall enough (≥42vh / ≥30vh). */
  canvasVisible: boolean;
}

// ---------- structure & scores ----------
export interface StructureState {
  /** The user has a structure in the project (sample loaded, imported, or predicted). False = empty state with the ghost specimen. */
  loaded: boolean;
  /** The canvas currently shows the built-in 2FJG as an unowned ghost specimen. */
  specimen: boolean;
  predicted: boolean;
  name: string;
  chains: ChainInfo[];
}
/** Per-position saturation scan, best first. Demo values. */
export interface DdgEntry { to: string; ddg: number }
export interface Scores {
  ddg: Record<Addr, DdgEntry[]>;
  stab: Record<Addr, number>;
}

// ---------- candidates ----------
export interface Candidate {
  id: string;
  mutation: MutationRef;
  /** Evidence ids pinned as the basis (⌥-click a citation). */
  basis: string[];
  ddg?: number;
  stab?: number;
  source: string;
  note?: string;
  addedAt: string;
}

// ---------- files, runs, notices ----------
export type ToolStatus = 'awaiting' | 'queued' | 'running' | 'done' | 'denied' | 'failed' | 'canceled';
export interface FileRecord {
  id: string;
  title: string;                   // 'affinity_scan.csv'
  kind: 'csv' | 'cif' | 'report' | 'archive';
  meta: string;
  /** table payload for csv/report; structure files carry none. */
  columns?: string[];
  rows?: (string | number)[][];
  markdown?: string;
  runId?: string;
  demo: boolean;
  createdAt: string;
}
export interface RunRecord {
  id: string;
  model: string;                   // catalog id or tool name
  modelVersion: string;
  title: string;
  args: [string, string][];
  inputHash: string;
  status: ToolStatus;
  progress: number;                // 0–100
  credits: number;
  logs: string[];
  startedAt: string;
  projectId: string;
  outputs: { fileId: string; title: string }[];
  parentRunId?: string;
  error?: string;
}
export interface Notice { id: string; text: string; runId?: string; at: string; read: boolean }

// ---------- agent session (state lives here; logic lives in agent/engine.ts) ----------
export type Mode = 'ask' | 'auto' | 'plan';
export interface PlanItem { text: string; state: 'todo' | 'doing' | 'done' }
export interface CandidateRow { addr: Addr; from: string; to: string; ddg: number; stab: number; cons: number; liability?: string }
export interface FormField { key: string; label: string; kind: string; required: boolean; value: string; error?: string }
export type Block =
  | { id: string; t: 'text'; md: string }                          // may contain {{cite:ID,ID}} and [[H:54]] chips
  | { id: string; t: 'thinking'; md: string }
  | { id: string; t: 'plan'; items: PlanItem[] }
  | { id: string; t: 'context'; addrs: Addr[]; label: string }     // "Mocha 看到 · H:54"
  | { id: string; t: 'tool'; name: string; title: string; args: [string, string][]; status: ToolStatus; cost?: string; logs: string[]; progress: number; source?: string; runId?: string; free?: boolean }
  | { id: string; t: 'form'; modelId: string; fields: FormField[]; submitted: boolean }
  | { id: string; t: 'confirm'; modelId: string; credits: number; eta: string; state: 'pending' | 'approved' | 'denied' }
  | { id: string; t: 'candidates'; rows: CandidateRow[] }
  | { id: string; t: 'file'; fileId: string; title: string; meta: string }
  | { id: string; t: 'basis'; real: number; demo: number; ids: string[] }
  | { id: string; t: 'suggest'; items: { label: string; cost?: string; prompt: string }[] }
  | { id: string; t: 'card'; kind: 'mmetrics' | 'fto' | 'recap'; data?: unknown }
  | { id: string; t: 'ext'; kind: string; data: unknown };
export interface Msg { id: string; role: 'user' | 'agent'; blocks: Block[]; text?: string; context?: Addr[]; ledgerVersion?: string; at: string }
export interface AgentState { messages: Msg[]; busy: boolean; mode: Mode; allowAll: boolean; draft: string }

// ---------- diff (demo superimposition) ----------
export interface DiffResult {
  fixed: string; moving: string; rmsd: number;
  perChain: Record<string, number>;
  perResidue: Record<Addr, number>;
  demo: true;
}

// ---------- project ----------
export interface ProjectInfo { id: string; name: string; goal: string; role: 'Owner' | 'Editor' | 'Viewer'; members: string[] }

// ---------- the whole store ----------
export interface V3State {
  project: ProjectInfo;
  projects: ProjectInfo[];
  structure: StructureState;
  focus: Focus;
  hover: HoverState;
  camera: CameraRequest | null;
  /** The user rotated/zoomed manually: agent-driven camera moves pause and a 「回到此处」 button appears. */
  cameraPaused: boolean;
  layer: LayerState;
  scheme: SchemeId;
  layout: LayoutState;
  viewport: { w: number; h: number };
  dock: DockState;
  scores: Scores;
  candidates: Candidate[];
  files: FileRecord[];
  runs: RunRecord[];
  notices: Notice[];
  agent: AgentState;
  mochaCursor: { label: string; addrs: Addr[] } | null;
  diff: DiffResult | null;
  /** Registered by StageLayer. Null until the Mol* viewer is ready. */
  stage: StageHandle | null;
  ext: Record<string, unknown>;
}
