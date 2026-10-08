import panel from '@/public/demo/antibody-affinity/panel.json';

export const PRESET_PROMPT = `Antibody-antigen complex, chains: A = antigen, B = light chain, C = heavy chain.

Recommend 30 single point mutations that may improve antibody affinity.
Avoid positions already in direct contact with the antigen.
State the numbering scheme you use and give a ddG score plus a one-line
mechanism for each.
-------------------`;

export const ATTACHED_STRUCTURE_NAME = '178997552570430_model_sample_1';

export const DEMO_PHASES = [
  { id: 'thinking', titleZh: '思考中', titleEn: 'Thinking', durationMs: 800 },
  { id: 'parse', titleZh: '解析结构与链信息', titleEn: 'Parse structure and chains', durationMs: 1300 },
  { id: 'interface', titleZh: '识别结合界面', titleEn: 'Identify binding interface', durationMs: 1700 },
  { id: 'cdr', titleZh: 'CDR 位点扫描', titleEn: 'Scan CDR sites', durationMs: 1700 },
  { id: 'scoring', titleZh: '亲和力打分与排序', titleEn: 'Score and rank affinity', durationMs: 1800 },
  { id: 'result', titleZh: '整理推荐结果', titleEn: 'Prepare recommendations', durationMs: 900 },
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

export type DemoMutationRow = {
  rank: number;
  chain: string;
  position: number;
  mutation: string;
  region: string;
  ddG: string;
  confidence: string;
  mechanism: string;
  residue: string;
};

// PLACEHOLDER: local model predictions supplied with this case, not measured
// affinity effects. The panel has score percentiles, not calibrated confidence.
export const DEMO_RESULT_ROWS: DemoMutationRow[] = panel.slice(0, 5).map(item => {
  const chain = item.chain === 'B' ? 'C' : item.chain === 'C' ? 'B' : item.chain;
  return {
    rank: item.rank,
    chain,
    position: item.position,
    mutation: `${item.wildType}→${item.mutation}`,
    region: item.context.region,
    ddG: item.bindingAffinity.score.toFixed(2),
    confidence: '—',
    mechanism: item.rationale,
    residue: `${chain}:${item.position}`,
  };
});

// Candidate-site highlights supplied with the case, remapped to the visible
// product chain convention; these are not direct-contact residue claims.
export const DEMO_CANDIDATE_RESIDUES = [
  'C:29', 'C:30', 'C:31', 'C:48', 'C:58', 'C:59', 'C:61', 'C:62',
  'C:67', 'C:69', 'C:71', 'C:95', 'C:104', 'B:32', 'B:34', 'B:56',
  'B:70', 'B:71', 'B:89', 'B:91', 'B:103',
] as const;
