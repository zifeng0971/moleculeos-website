export type DemoSequence = { name: string; length: string; sequence: string };
export type DemoMetric = { label: string; value: string; highlight?: boolean };
export type DemoStep =
  | { type: 'thinking'; duration: string; text: string }
  | { type: 'tool'; name: string; args?: string; status: 'success' }
  | { type: 'text'; text: string }
  | { type: 'clarify'; question: string; options: Array<{ label: string; desc: string; selected?: boolean }> }
  | { type: 'result'; title: string; note?: string; detail?: string; metrics?: DemoMetric[]; tiers?: Array<{label:string;count:number}>; table?: { source: string; initialRows: number }; structure?: boolean; structureHighlight?: boolean }
  | { type: 'summary'; title: string; items: string[] };

export type DemoTask = { id: string; titleKey: string; subtitleKey: string; userInput: { prompt: string; sequences: DemoSequence[] }; steps: DemoStep[] };

const sequences: DemoSequence[] = [
  { name: 'antigen', length: '406 aa', sequence: 'NFRAPPVIPNVPFLWAWNAPSEFCLGKFDEPLDMSLFSFIGSPRINATGQGVTIFYVDRLGYYPYIDSITGVTVNGGIPQKISLQDHLDKAKKDITFYMPVDNLGMAVIDWEEWRPTWARNWKPKDVYKNRSIELVQQQNVQLSLTEATEKAKQEFEKAGKDFLVETIKLGKLLRPNHLWGYYLFPDCYNHHYKKPGYNGSCFNVEIKRNDDLSWLWNESTALYPSIYLNTQQSPVAATLYVRNRVREAIRVSKIPDAKSPLPVFAYTRIVFTDQVLKFLSQDELVYTFGETVALGASGIVIWGTLSIMRSMKSCLLLDNYMETILNPYIINVTLAAKMCSQVLCQEQGVCIRKNWNSSDYLHLNPDNFAIQLEKGGKFTVRGKPTLEDLEQFSEKFYCSCYSTLS' },
  { name: 'heavy chain', length: '117 aa', sequence: 'SVEESGGRLVTPGGSLTLTCTVSGFSLSSNAISWVRQAPGKGLEYIGIISTSGSTYYANWAKGRFTISKTSTTVDLKMTSLTTEDTATYFCARDGAYDDFAYYFDLWGQGTLVTVSS' },
  { name: 'light chain', length: '110 aa', sequence: 'ALVMTQTPSSVSAAVGGTVTINCQASQNIYSGLAWYQQKLGQPPKLLIYKASTLASGVPSRFKGSGSGTQFTLTISGVQCDDAATYYCQLAYSSTNVDNAFGGGTEVVVK' },
];

const affinitySteps: DemoStep[] = [
  { type: 'thinking', duration: '12s', text: 'The user gives an antigen sequence plus heavy and light chains. Let me discover the available MOS tasks and read the relevant skills before planning.' },
  { type: 'tool', name: 'ListAvailableMOSTasks', status: 'success' },
  { type: 'tool', name: 'GetMOSTaskSchema', args: 'MMFold', status: 'success' },
  { type: 'tool', name: 'StartMOSTask', args: 'MMFold · 3-chain complex', status: 'success' },
  { type: 'text', text: 'While MMFold runs, let me double-check my transcription of your sequences with an independent second copy and cross-compare.' },
  { type: 'tool', name: 'Write', args: 'antigen sequence · verification copy', status: 'success' },
  { type: 'tool', name: 'Write', args: 'heavy-chain sequence · verification copy', status: 'success' },
  { type: 'tool', name: 'Write', args: 'light-chain sequence · verification copy', status: 'success' },
  { type: 'thinking', duration: '4s', text: 'Both transcriptions agree (edit distance 0). Good confidence.' },
  { type: 'text', text: 'Sequences verified: two independent transcriptions of each chain agree exactly, so the library copies are reliable.' },
  { type: 'clarify', question: 'Where should the 30 mutations be introduced?', options: [
    { label: 'On the antibody (VH + VL)', desc: 'Classic affinity maturation. Positions that interact with the antigen — the paratope — are excluded.', selected: true },
    { label: 'On the antigen, outside its epitope', desc: 'Engineering the target to be bound better, excluding the epitope residues themselves.' },
  ] },
  { type: 'thinking', duration: '3s', text: 'User chose option 1: mutate the antibody (VH + VL), exclude the paratope.' },
  { type: 'thinking', duration: '20s', text: 'MMFold produced 5 samples. Before trusting any of them I should superimpose and check whether they converge — the downstream mutation panel depends on this starting structure.' },
  { type: 'tool', name: 'Shell', args: 'superimpose samples · per-chain RMSD', status: 'success' },
  { type: 'thinking', duration: '8s', text: 'All 5 samples are essentially identical (sub-Å differences, differing only in global placement).' },
  { type: 'result', title: 'Predicted complex', metrics: [
    { label: 'pLDDT', value: '91.7', highlight: true }, { label: 'interface ipTM', value: '0.951', highlight: true },
    { label: 'antibody–antigen score', value: '0.945' }, { label: 'samples converged', value: '5 / 5' },
  ], note: '五个独立样本收敛到同一复合物，折叠与对接姿态均确定。以此作为下游优化起点。', structure: true },
  { type: 'tool', name: 'ImportStructure', args: 'predicted complex', status: 'success' },
  { type: 'tool', name: 'AnalyzeInterface', status: 'success' },
  { type: 'result', title: 'Interface mapped', note: '重链在抗原上埋 497 Å²（13 个残基），轻链埋 433 Å²（14 个残基），合计约 930 Å² 的 paratope。表位是抗原上一块紧凑连续的区域。主导热点是抗原 Lys384，既形成氢键又与重链 Asp94 形成盐桥。', detail: '排除 13 个重链 + 14 个轻链接触残基后，候选池为 200 个位点（104 重 + 96 轻），即框架残基加上不接触抗原但塑造 loop 构象的 CDR 位点。' },
  { type: 'text', text: 'Now launching the mutation scorers in parallel — binding affinity as primary evidence, plus structural stability and sequence-level tolerance for each antibody chain.' },
  { type: 'tool', name: 'StartMOSTask', args: 'Binding Affinity Mutation Effect', status: 'success' },
  { type: 'tool', name: 'StartMOSTask', args: 'Structural Stability Mutation Effect', status: 'success' },
  { type: 'tool', name: 'StartMOSTask', args: 'Sequence Fitness · heavy chain', status: 'success' },
  { type: 'tool', name: 'StartMOSTask', args: 'Sequence Fitness · light chain', status: 'success' },
  { type: 'thinking', duration: '6s', text: 'The pool size is 4000 but I expected 3800. Let me check.' },
  { type: 'text', text: 'The pool accidentally included wild-type self-substitutions. Fixing that and adding structural context for each candidate.' },
  { type: 'tool', name: 'Shell', args: 'rebuild pool · 200 × 19 = 3800', status: 'success' },
  { type: 'thinking', duration: '10s', text: 'The panel is dominated by innocuous-but-weak substitutions — that comes from weighting tolerance scorers equally with affinity.' },
  { type: 'text', text: 'Since affinity is the objective, let me weight the affinity bar more strictly than the tolerance bars.' },
  { type: 'tool', name: 'Shell', args: 're-gate · require second-shell context', status: 'success' },
  { type: 'thinking', duration: '5s', text: 'All 30 mutation tokens verified against the sanitized structure — chain, position and wild-type residue match 30/30.' },
  { type: 'tool', name: 'SelectResidues', args: '21 positions · chains B and C', status: 'success' },
  { type: 'result', title: 'Recommended mutations', note: 'All entries are verified against the structure. Percentages are percentile ranks within the 3800-mutation pool.', tiers: [{ label: 'STRONG', count: 8 }, { label: 'RECOMMEND', count: 22 }], table: { source: '/demo/antibody-affinity/panel.json', initialRows: 8 }, structureHighlight: true },
  { type: 'result', title: 'Why this panel looks the way it does', note: '表位由抗原 Lys384 锚定，它与重链 Asp94 之间同时存在氢键和盐桥；重链 Phe100 与轻链 Tyr30/Tyr92 在周围堆叠。排除接触位点后，框架区成为在不改动现有接触的前提下改善亲和力的主要空间。两个主题随之浮现：paratope 边缘增加芳香残基，以及在 loop 基部做静电引导。' },
  { type: 'result', title: 'Watch list', note: '亲和力位于前四分位、但某一维度刚好未过闸的候选，可作为第二轮的自然人选。' },
  { type: 'summary', title: 'Limitations', items: [
    'Evolutionary Mutation Effect 未运行。对兔源抗体，同源保守性主要反映种系框架，主导此界面的高变 CDR 会被打成超容忍；序列适应度与反折叠适应度已覆盖替换容忍度。',
    '打分是预测值；单点 ddG 接近 −1 kcal/mol 在方法噪声范围内。每一条都是从野生型独立评估的单点替换，未评估组合效应。',
    '所有推荐位点的 per-residue pLDDT 在 92–98 之间，面板中没有任何一项落在模型的低置信区域。',
  ] },
];

function compactTask(id: string, titleKey: string, subtitleKey: string, prompt: string, tool: string): DemoTask {
  return { id, titleKey, subtitleKey, userInput: { prompt, sequences }, steps: [
    { type: 'thinking', duration: '8s', text: 'I will inspect the three-chain complex, verify the input chains and prepare the requested analysis.' },
    { type: 'tool', name: 'ListAvailableMOSTasks', status: 'success' },
    { type: 'tool', name: tool, args: 'verified three-chain complex', status: 'success' },
    { type: 'text', text: 'The input and structural context are ready for review.' },
    { type: 'result', title: 'Analysis ready', note: 'The requested structural view has been prepared from the supplied static complex.', structure: true },
    { type: 'summary', title: 'Next step', items: ['Review the structure and continue the full workflow in MOS when you are ready.'] },
  ] };
}

export const DEMO_TASKS: readonly DemoTask[] = [
  compactTask('humanization', 'tasks.humanization.title', 'tasks.humanization.short', 'Review this antibody complex and prepare a humanization workflow while preserving the binding interface.', 'PrepareHumanizationReview'),
  { id: 'affinity', titleKey: 'tasks.affinity.title', subtitleKey: 'tasks.affinity.short', userInput: { prompt: 'Please predict the structure from the given input sequence, and recommend a list of 30 mutations that may improve antibody affinity while avoiding positions that already interact with the antigen.', sequences }, steps: affinitySteps },
  compactTask('homology', 'tasks.homology.title', 'tasks.homology.short', 'Find structurally relevant sequence homologs for this complex and organize the references for review.', 'SearchSequenceHomology'),
  compactTask('epitope', 'tasks.epitope.title', 'tasks.epitope.short', 'Map the antibody–antigen interface and prepare the epitope residues for inspection.', 'AnalyzeEpitope'),
];

export const DEMO_PRESETS = [{ title: 'Antibody Affinity Optimization', taskId: 'affinity' }] as const;
export const DEMO_STEP_INTERVAL = 500;
export const DEMO_STRUCTURE = { src: '/demo/antibody-affinity/structure.cif', preview: '/demo/antibody-affinity/preview.png', label: 'Antibody–antigen complex' } as const;
