import iconThinking from './vendor/src/assets/mocha/icon-thinking.svg';
import iconMostask from './vendor/src/assets/mocha/icon-mostask.svg';
import iconHitl from './vendor/src/assets/mocha/icon-hitl.svg';
import iconViewer from './vendor/src/assets/mocha/icon-3dviewer.svg';
import type { DemoStep, DemoTask } from '@/demo/tasks.config';
import type {
  FlowStep,
  ReportBlock,
  TaskRowData,
  UnfoldStep,
} from './vendor/src/data/mochaFlow';

export type MochaFlowConfig = {
  taskId: string;
  title: string;
  steps: FlowStep[];
  paceScale: number;
  hasStructure: boolean;
};

const completed = (row: TaskRowData): TaskRowData => ({
  ...row,
  mode: 'completed',
  completedLabel: row.completedLabel ?? row.label,
  completedStatus: row.completedStatus ?? row.status ?? 'Complete',
});

function detailStep(step: DemoStep): UnfoldStep {
  if (step.type === 'thinking') {
    return { text: `Thinking · ${step.duration}`, detail: step.text, durationMs: 520 };
  }
  if (step.type === 'tool') {
    return {
      text: step.name,
      detail: step.args,
      status: 'completed',
      durationMs: 420,
      liveBrand: step.name === 'StartMOSTask',
    };
  }
  if (step.type === 'text') return { text: step.text, durationMs: 460 };
  if (step.type === 'clarify') {
    const selected = step.options.find((option) => option.selected) ?? step.options[0];
    return { text: step.question, detail: `${selected.label} — ${selected.desc}`, durationMs: 420 };
  }
  if (step.type === 'summary') return { text: step.title, detail: step.items.join('\n'), durationMs: 460 };
  return { text: step.title, detail: step.note ?? step.detail, durationMs: 460 };
}

function row(
  type: TaskRowData['type'],
  label: string,
  steps: DemoStep[],
  chip?: string,
): TaskRowData {
  const icon = type === 'thinking' ? iconThinking : type === 'hitl' ? iconHitl : type === 'viewer' ? iconViewer : iconMostask;
  return {
    type,
    icon,
    mode: 'processing',
    label,
    chip,
    status: 'Running',
    completedStatus: `${steps.length}/${steps.length}`,
    unfoldSteps: steps.map(detailStep),
  };
}

function reportBlocks(steps: DemoStep[], final: boolean): ReportBlock[] {
  const blocks: ReportBlock[] = [];
  for (const step of steps) {
    if (step.type === 'result') {
      blocks.push({ type: 'h2', text: step.title });
      if (step.metrics?.length) {
        blocks.push({ type: 'p', text: step.metrics.map((metric) => `**${metric.label}** ${metric.value}`).join('   ·   ') });
      }
      if (step.note) blocks.push({ type: 'p', text: step.note });
      if (step.detail) blocks.push({ type: 'p', text: step.detail });
      if (step.tiers?.length) blocks.push({ type: 'p', text: step.tiers.map((tier) => `**${tier.label}** ${tier.count}`).join('   ·   ') });
      if (step.table) blocks.push({ type: 'mutationTable' });
    }
    if (step.type === 'summary') {
      blocks.push({ type: 'h2', text: step.title });
      step.items.forEach((item) => blocks.push({ type: 'p', text: `• ${item}` }));
    }
  }
  if (final) blocks.push({ type: 'structure' });
  return blocks;
}

function baseStep(id: string): FlowStep {
  return {
    id,
    label: id,
    showUserTimestamp: false,
    showQaCard: false,
    showResult: false,
    tasks: [],
    todos: { kind: 'none' },
  };
}

export function buildMochaFlow(task: DemoTask, title: string): MochaFlowConfig {
  if (task.id !== 'affinity') {
    const [thinking, ...rest] = task.steps;
    const analysisRow = row('thinking', title, [thinking, ...rest.filter((step) => step.type !== 'result' && step.type !== 'summary')]);
    const resultSteps = rest.filter((step) => step.type === 'result' || step.type === 'summary');
    return {
      taskId: task.id,
      title,
      paceScale: 0.25,
      hasStructure: true,
      steps: [
        {
          ...baseStep(`${task.id}-analysis`),
          user: { text: task.userInput.prompt, timestamp: '' },
          tasks: [analysisRow],
          todos: {
            kind: 'unfold',
            items: [
              { status: 'loading', text: 'Validate the input' },
              { status: 'unexecuted', text: 'Inspect the structural context' },
              { status: 'unexecuted', text: 'Prepare the requested analysis' },
            ],
            afterThinkingComplete: true,
            foldStatus: '3/3',
          },
        },
        {
          ...baseStep(`${task.id}-result`),
          tasks: [completed(analysisRow)],
          showResult: true,
          animateResult: true,
          result: { paragraphs: [], blocks: reportBlocks(resultSteps, true) },
          todos: { kind: 'fold', variant: 'complete', status: '3/3' },
        },
      ],
    };
  }

  const clarifyIndex = task.steps.findIndex((step) => step.type === 'clarify');
  const firstResultIndex = task.steps.findIndex((step) => step.type === 'result');
  const scorerIndex = task.steps.findIndex((step) => step.type === 'text' && step.text.startsWith('Now launching'));
  const finalResultIndex = task.steps.findIndex((step) => step.type === 'result' && step.title === 'Recommended mutations');
  const setup = task.steps.slice(0, clarifyIndex);
  const clarify = task.steps.slice(clarifyIndex, firstResultIndex);
  const mmfold = task.steps.slice(firstResultIndex - 3, scorerIndex);
  const scoring = task.steps.slice(scorerIndex, finalResultIndex);
  const results = task.steps.slice(finalResultIndex);
  const setupRow = row('thinking', 'Understand the request and prepare a plan', setup);
  const clarifyRow = row('hitl', 'Confirm mutation scope', clarify);
  const mmfoldRow = row('mostask', 'Predict and inspect the complex', mmfold, 'MMFold');
  const scoringRow = row('mostask', 'Run mutation scoring and verification', scoring, 'MOS Tasks');
  const viewerRow = row('viewer', 'Results and structure ready', results, '3D Viewer');
  const todos = [
    { status: 'loading' as const, text: 'Verify antigen, heavy-chain and light-chain inputs' },
    { status: 'unexecuted' as const, text: 'Plan the antibody affinity workflow' },
    { status: 'unexecuted' as const, text: 'Predict and inspect the complex' },
    { status: 'unexecuted' as const, text: 'Score and verify candidate mutations' },
    { status: 'unexecuted' as const, text: 'Prepare results and interactive structure' },
  ];
  return {
    taskId: task.id,
    title,
    paceScale: 0.23,
    hasStructure: true,
    steps: [
      {
        ...baseStep('affinity-plan'),
        user: { text: task.userInput.prompt, timestamp: '' },
        tasks: [setupRow],
        todos: { kind: 'unfold', items: todos, afterThinkingComplete: true, foldStatus: '1/5' },
      },
      {
        ...baseStep('affinity-scope'),
        tasks: [completed(setupRow), clarifyRow],
        showQaCard: true,
        qaStartConfirmed: true,
        todos: { kind: 'fold', variant: 'processing', status: '2/5' },
      },
      {
        ...baseStep('affinity-mmfold'),
        tasks: [completed(setupRow), completed(clarifyRow), mmfoldRow],
        todos: { kind: 'fold', variant: 'processing', status: '3/5' },
      },
      {
        ...baseStep('affinity-scoring'),
        tasks: [completed(mmfoldRow), scoringRow],
        todos: { kind: 'fold', variant: 'processing', status: '4/5' },
      },
      {
        ...baseStep('affinity-result'),
        tasks: [completed(mmfoldRow), completed(scoringRow), completed(viewerRow)],
        showResult: true,
        animateResult: true,
        result: { paragraphs: [], blocks: reportBlocks(results, true) },
        todos: { kind: 'fold', variant: 'complete', status: '5/5' },
      },
    ],
  };
}
