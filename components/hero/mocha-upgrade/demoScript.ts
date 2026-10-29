import entry from '@/content/entry-pdl1.json';
import { DEMO_TASKS, type DemoTask } from '@/demo/tasks.config';

// The hero case is a real MOS run (website-cases/pdl1/00-entry): one sentence in, an MMFold complex and its interface out.
export const PRESET_PROMPT = entry.prompt;

export const ATTACHED_STRUCTURE_NAME = 'PD-L1 · KN035.fasta';

// Phase timing is compressed for the page; the step titles and tool names are the ones the agent showed.
export const DEMO_PHASES = [
  { id: 'thinking', titleZh: '思考中', titleEn: 'Thinking', durationMs: 800 },
  { id: 'parse', titleZh: '核对序列与 MoleculeOS 任务', titleEn: 'Check sequences and MoleculeOS tasks', durationMs: 1300 },
  { id: 'fold', titleZh: '运行 MMFold 预测复合物', titleEn: 'Run MMFold on the complex', durationMs: 1700 },
  { id: 'rank', titleZh: '按 ipTM 筛选样本', titleEn: 'Rank samples by ipTM', durationMs: 1500 },
  { id: 'interface', titleZh: '识别结合界面', titleEn: 'Map the binding interface', durationMs: 1900 },
  { id: 'result', titleZh: '整理结果', titleEn: 'Prepare results', durationMs: 900 },
] as const;

export type DemoPhase = typeof DEMO_PHASES[number]['id'] | 'ready' | 'complete';
export const DEMO_TOTAL_MS = DEMO_PHASES.reduce((sum, phase) => sum + phase.durationMs, 0);

export function phaseAt(elapsed: number): { phase: DemoPhase; index: number; progress: number } {
  if (elapsed < 0) return { phase: 'ready', index: -1, progress: 0 };
  let start = 0;
  for (let index = 0; index < DEMO_PHASES.length; index++) {
    const step = DEMO_PHASES[index];
    if (elapsed < start + step.durationMs) return { phase: step.id, index, progress: (elapsed - start) / step.durationMs };
    start += step.durationMs;
  }
  return { phase: 'complete', index: DEMO_PHASES.length, progress: 1 };
}

export const DEMO_STEP_NOTES = [
  'Review the supplied PD-L1 and KN035 sequences against UniProt Q9NZQ7.',
  'ListAvailableMOSTasks · GetMOSTaskSchema (MMFold) · A PD-L1 · B KN035 · 1:1, no template.',
  'StartMOSTask · MMFold · 5 samples · CheckMOSTask until the task succeeds.',
  'DownloadMOSResults · only sample 1 converged (interface ipTM 0.92); the other four sit near 0.33.',
  `Buried surface, contacts, H-bonds and salt bridges · epitope ${entry.summary.epitopeTotal} · paratope ${entry.summary.paratopeTotal} residues.`,
] as const;

export const DEMO_SAMPLES = entry.samples;
export const DEMO_PAIRS = entry.pairs.map(pair => ({ ...pair, aResidue: `A:${pair.aId}`, bResidue: `B:${pair.bId}` }));
export const DEMO_SUMMARY = entry.summary;
export const DEMO_VS_CRYSTAL = entry.vs5JDS;
export const DEMO_FASTA = entry.chains.map(chain => ({ name: chain.role === 'target' ? 'PD-L1' : 'KN035 VHH', chain: chain.id, sequence: chain.sequence }));

// Epitope and paratope residues as the agent reported them (model indices).
export const DEMO_INTERFACE_RESIDUES = [
  ...entry.interface.epitope.map(n => `A:${n}`),
  ...entry.interface.paratope.map(n => `B:${n}`),
];
export const DEMO_KEY_RESIDUES = DEMO_PAIRS.flatMap(pair => [pair.aResidue, pair.bResidue]);

const structureTask: DemoTask = {
  id: 'structure',
  titleKey: 'tasks.structure.title',
  subtitleKey: 'tasks.structure.short',
  userInput: { prompt: PRESET_PROMPT, sequences: [] },
  steps: [
    { type: 'thinking', duration: '4s', text: 'Verify the two sequences, then predict the complex with MMFold.' },
    { type: 'text', text: 'The complex prediction is running on MMFold; I will compute the interface when it lands.' },
  ],
};

/** The idle-screen cards: the structure-prediction case replaces the old affinity card; the generic ones stay. */
export const ENTRY_TASKS: readonly DemoTask[] = DEMO_TASKS.map(task => task.id === 'affinity' ? structureTask : task);
