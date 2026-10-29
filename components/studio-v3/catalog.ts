/**
 * MOS model catalog — the ten real MOS model functions plus SeqSim and MMetrics (see content/manual/zh).
 * FROZEN (orchestrator-owned). Credits/ETAs are demo values. Shared by the sidebar (models rail), ⌘K, the verb strip
 * and the agent's task-configuration form, so every entry point offers the same parameters.
 */
export type ModelGoal = 'predict' | 'design' | 'score' | 'evaluate' | 'search' | 'analyze';
export type ParamKind = 'sequence' | 'residues' | 'chain' | 'structure' | 'number' | 'select' | 'text' | 'ligand';
export interface ModelParam {
  key: string;
  label: string;
  kind: ParamKind;
  required: boolean;
  hint?: string;
  default?: string;
  options?: string[];
  /** Where an automatic value comes from when the user already has context. */
  fill?: 'selection' | 'structure' | 'sequence' | 'chain';
}
export interface ModelDef {
  id: string;
  /** Real MOS name (kept in English as in the product). */
  name: string;
  /** Plain-language name shown first in the UI. */
  title: string;
  goal: ModelGoal;
  summary: string;
  credits: number;
  eta: string;
  /** Free tools still show as tool calls but never ask for approval. */
  free?: boolean;
  params: ModelParam[];
}

export const GOAL_LABELS: Record<ModelGoal, string> = { predict: '预测', design: '设计', score: '打分', evaluate: '评估', search: '查找', analyze: '解析' };

export const MODELS: ModelDef[] = [
  { id: 'mmfold', name: 'MMFold', title: '结构预测', goal: 'predict', credits: 3, eta: '约 6 分钟',
    summary: '用多序列比对预测蛋白、抗体或复合物的 3D 结构，返回 3 个模型。',
    params: [
      { key: 'chains', label: '序列', kind: 'sequence', required: true, hint: '粘贴 FASTA，可含多条链', fill: 'sequence' },
      { key: 'num_models', label: '模型数', kind: 'number', required: false, default: '3' },
      { key: 'templates', label: '使用模板', kind: 'select', required: false, default: '开', options: ['开', '关'] },
    ] },
  { id: 'redesign', name: 'Protein Redesign', title: '序列重设计', goal: 'design', credits: 5, eta: '约 12 分钟',
    summary: '基于结构重新设计序列；可固定部分位点，只重设计其余部分。',
    params: [
      { key: 'structure', label: '结构', kind: 'structure', required: true, fill: 'structure' },
      { key: 'fixed', label: '固定位点', kind: 'residues', required: false, hint: '这些位点保持不变', fill: 'selection' },
      { key: 'num_designs', label: '设计数量', kind: 'number', required: false, default: '8' },
    ] },
  { id: 'binder', name: 'Protein Binder Design', title: '结合蛋白设计', goal: 'design', credits: 9, eta: '约 25 分钟',
    summary: '针对靶点设计 binder 蛋白（主链，或含序列）。',
    params: [
      { key: 'target', label: '靶点结构', kind: 'structure', required: true, fill: 'structure' },
      { key: 'chain', label: '靶点链', kind: 'chain', required: true, fill: 'chain' },
      { key: 'hotspots', label: '热点残基', kind: 'residues', required: false, hint: '希望 binder 接触的位点', fill: 'selection' },
      { key: 'length', label: 'binder 长度', kind: 'number', required: false, default: '80' },
    ] },
  { id: 'seqfit', name: 'Sequence Fitness Mutation Effect', title: '突变效果 · 序列适应性', goal: 'score', credits: 1, eta: '约 3 分钟',
    summary: '用序列适应性模型给全部可能突变打分，分数越高越好。',
    params: [{ key: 'sequence', label: '序列', kind: 'sequence', required: true, fill: 'sequence' }] },
  { id: 'evo', name: 'Evolutionary Mutation Effect', title: '突变效果 · 进化保守性', goal: 'score', credits: 2, eta: '约 6 分钟',
    summary: '基于 MSA 评估每个突变在同源序列中的容忍度。',
    params: [{ key: 'sequence', label: '序列', kind: 'sequence', required: true, fill: 'sequence' }] },
  { id: 'stability', name: 'Structural Stability Mutation Effect', title: '突变效果 · 结构稳定性', goal: 'score', credits: 1, eta: '约 1 分钟',
    summary: '评估结构中所有可能突变对折叠稳定性的影响。',
    params: [
      { key: 'structure', label: '结构', kind: 'structure', required: true, fill: 'structure' },
      { key: 'positions', label: '位点', kind: 'residues', required: false, hint: '留空则扫描全部位点', fill: 'selection' },
    ] },
  { id: 'affinity', name: 'Protein-Ligand Affinity Evaluation', title: '蛋白-配体亲和力', goal: 'evaluate', credits: 2, eta: '约 4 分钟',
    summary: '用统计物理方法估计蛋白与小分子配体的结合亲和力。',
    params: [
      { key: 'structure', label: '蛋白结构', kind: 'structure', required: true, fill: 'structure' },
      { key: 'ligand', label: '配体', kind: 'ligand', required: true, hint: 'SDF 文件或 SMILES' },
    ] },
  { id: 'pocket', name: 'Geometric Pocket Detection', title: '口袋识别与对接', goal: 'evaluate', credits: 3, eta: '约 8 分钟',
    summary: '识别前 N 个结合口袋，并对配体做对接。',
    params: [
      { key: 'structure', label: '结构', kind: 'structure', required: true, fill: 'structure' },
      { key: 'top_n', label: '口袋数量', kind: 'number', required: false, default: '3' },
      { key: 'ligand', label: '配体 SMILES', kind: 'ligand', required: false },
    ] },
  { id: 'humanize', name: 'Antibody Humanization Modelling', title: '抗体人源化', goal: 'design', credits: 6, eta: '约 15 分钟',
    summary: '输入重链与轻链序列，设计保留抗原结合的人源化候选并排序（公测）。',
    params: [
      { key: 'heavy', label: '重链序列', kind: 'sequence', required: true, fill: 'sequence' },
      { key: 'light', label: '轻链序列', kind: 'sequence', required: true, fill: 'sequence' },
      { key: 'num_designs', label: '设计数量', kind: 'number', required: false, default: '5' },
    ] },
  { id: 'bam', name: 'Binding Affinity Mutation Scoring', title: '结合亲和力突变扫描', goal: 'score', credits: 2, eta: '约 2 分钟',
    summary: '对指定链做单点突变扫描，计算结合自由能变化 ΔΔG。',
    params: [
      { key: 'structure', label: '复合物结构', kind: 'structure', required: true, fill: 'structure' },
      { key: 'chain', label: '扫描的链', kind: 'chain', required: true, fill: 'chain' },
      { key: 'positions', label: '位点', kind: 'residues', required: false, hint: '留空则扫描整条链', fill: 'selection' },
    ] },
  { id: 'seqsim', name: 'SeqSim Search', title: '同源蛋白搜索', goal: 'search', credits: 0, eta: '约 2 分钟', free: true,
    summary: '在外部数据库中搜索同源蛋白，按匹配程度排序。',
    params: [
      { key: 'query', label: '目标', kind: 'sequence', required: true, hint: '序列，或选择已导入的链', fill: 'sequence' },
      { key: 'evalue', label: 'E-value 上限', kind: 'number', required: false, default: '1e-5' },
    ] },
  { id: 'mmetrics', name: 'MMetrics', title: '结构档案', goal: 'analyze', credits: 0, eta: '约 6 秒', free: true,
    summary: '结构进入项目时自动运行：类型、同源、CDR/表位、互作网络、可开发性风险与突变打分。',
    params: [{ key: 'structure', label: '结构', kind: 'structure', required: true, fill: 'structure' }] },
];

export const modelById = (id: string) => MODELS.find(m => m.id === id);
