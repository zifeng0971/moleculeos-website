import type { ReactNode } from 'react';
import type { TableRowData } from './mochaPanel';

export type FlowStepId = string;
export type TaskMode = 'completed' | 'processing';
export type UnfoldStepStatus = 'completed' | 'processing' | 'failed';
export type DetailControl =
  | { type: 'readout'; label: string; value: string }
  | { type: 'toggle'; id: string; label: string; defaultOn: boolean }
  | { type: 'choice'; id: string; label: string; options: string[]; defaultValue: string }
  | { type: 'slider'; id: string; label: string; min: number; max: number; defaultValue: number; unit?: string }
  | { type: 'button'; label: string };
export type DetailChartBar = { label: string; value: number; current?: boolean };
export type DetailChartSegment = { kind: 'match' | 'gap'; start: number; end: number };
export type DetailChart =
  | { type: 'bars'; title: string; unit?: string; min?: number; items: DetailChartBar[] }
  | { type: 'alignment'; title: string; length: number; segments: DetailChartSegment[] }
  | { type: 'stack'; title: string; items: DetailChartBar[] };
export type SearchHit = { title: string; url: string; date?: string; summary: string };
export type ResidueSelection = { residueCount: number; chain: string };
export type MosTaskFile = { name: string };
export type MosTaskDetailData = {
  taskId: string; taskName: string; taskType: string; description: string; taskStatus: string;
  outputs: MosTaskFile[];
  input: { kind: string; count: number; chain: string; sequence: string; length: number };
};
export type UnfoldStep = {
  text: string; detail?: string; liveDetail?: string; liveBrand?: boolean; durationMs?: number;
  layout?: 'schema' | 'search' | 'mosTask'; taskName?: string; code?: string; transient?: boolean;
  links?: SearchHit[]; status?: UnfoldStepStatus; selection?: ResidueSelection; action?: 'zoom';
  controls?: DetailControl[]; charts?: DetailChart[]; mosTask?: MosTaskDetailData;
};
export function residueSelectionLabel(selection: ResidueSelection) {
  return `${selection.residueCount} ${selection.residueCount === 1 ? 'residue' : 'residues'} in Chain ${selection.chain}`;
}
export type TaskRowData = {
  type: 'thinking' | 'mostask' | 'hitl' | 'viewer' | 'coding' | 'search';
  icon: string; mode: TaskMode; label: string; chip?: string; status?: string; detail?: string;
  completedLabel?: string; completedStatus?: string; labelAccent?: string; unfoldSteps?: UnfoldStep[];
};
export type TodosItemStatus = 'success' | 'warning' | 'loading' | 'unexecuted';
export type TodosItem = { status: TodosItemStatus; text: string; note?: string; strike?: boolean; emphasis?: boolean };
export type TodosState =
  | { kind: 'none' }
  | { kind: 'unfold'; items: TodosItem[]; afterThinkingComplete?: boolean; foldStatus?: string; liveProgress?: { stopAtExecuting: number }; initialExecuting?: number; startCollapsed?: boolean; paused?: boolean; completeAfterThinking?: boolean }
  | { kind: 'fold'; variant: 'processing' | 'complete'; status: string };
export type ReportViewerTone = 'orange' | 'blue' | 'green' | 'purple' | 'focus';
export type ReportViewerLegendItem = { id: string; tone: ReportViewerTone; label: string; title: string; detail?: string };
export type ReportAttachment = { name: string; subtitle?: string; content?: string };
export type ReportBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'rule' }
  | { type: 'table' }
  | { type: 'attachments'; items: ReportAttachment[] }
  | { type: 'viewerLegend'; intro?: string; items: ReportViewerLegendItem[]; footnote?: string }
  | { type: 'structure' }
  | { type: 'mutationTable' };
export type StepResult = {
  paragraphs: string[]; blocks?: ReportBlock[]; tableTitle?: string;
  tableHeaders?: readonly [string, string, string, string, string, string, string]; tableRows?: TableRowData[];
};
export function resultBlocks(result: StepResult): ReportBlock[] {
  if (result.blocks?.length) return result.blocks;
  const blocks: ReportBlock[] = result.paragraphs.map((text) => ({ type: 'p', text }));
  if (result.tableRows?.length) blocks.push({ type: 'table' });
  return blocks;
}
export type HistoryTurn = { user: { text: string; timestamp: string }; tasks: TaskRowData[]; todos?: { items: TodosItem[]; status: string }; result?: StepResult };
export type FlowStep = {
  id: FlowStepId; label: string; user?: { text: string; timestamp: string }; showUserTimestamp: boolean;
  history?: HistoryTurn[]; tasks: TaskRowData[]; followOnTasks?: TaskRowData[]; showQaCard: boolean;
  qaStartConfirmed?: boolean; showResult: boolean; animateResult?: boolean; result?: StepResult;
  composerAction?: 'stop' | 'send'; todos: TodosState;
};
export function progressTodosItems(items: TodosItem[], executingIndex: number): TodosItem[] {
  return items.map((item, index) => index < executingIndex
    ? { text: item.text, status: 'success' }
    : index === executingIndex
      ? { text: item.text, status: 'loading', emphasis: true }
      : { text: item.text, status: 'unexecuted' });
}
export function mosTaskDetail(chip: string): UnfoldStep { return { text: chip, detail: `MOS task: ${chip}.` }; }
export const qaCard = {
  title: 'Question', prompt: 'Where should the 30 mutations be introduced?',
  collapsedLabel: 'Mutation target', submitLabel: 'Continue',
  options: [
    { id: 'antibody', title: 'On the antibody (VH + VL)', description: 'Classic affinity maturation while excluding the paratope.' },
    { id: 'antigen', title: 'On the antigen, outside its epitope', description: 'Engineer the target while excluding epitope residues.' },
  ], defaultOptionId: 'antibody',
};
export type QACardData = typeof qaCard;
export type ReportSlot = (kind: 'structure' | 'mutationTable') => ReactNode;
