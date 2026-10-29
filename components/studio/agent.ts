/** Agent transcript model + scripted scenarios. A real backend would stream the same block types. */
import {
  INTERFACE, REGIONS, isAntigen, compactLabels, conservation, ddgScan, parseSequences, plddt, stability, PREDICTED_MODELS, ROLE_NAMES, SAMPLE_FASTA,
  type InputChain, type Mutation,
} from './model';
import type { ChainInfo } from '../console/molstar-lite';
import { scanLiabilities } from './mmetrics-data';

export type Mode = 'ask' | 'auto' | 'plan';
export type PlanItem = { text: string; state: 'todo' | 'doing' | 'done' };
export type ToolStatus = 'awaiting' | 'running' | 'done' | 'denied';
export type CandidateRow = { label: string; from: string; to: string; ddg: number; stab: number; cons: number; liability?: string };

export type Block =
  | { id: string; t: 'text'; md: string }
  | { id: string; t: 'thinking'; md: string }
  | { id: string; t: 'plan'; items: PlanItem[] }
  | { id: string; t: 'sequence'; chains: InputChain[] }
  | {
      id: string; t: 'tool'; name: string; title: string; args: [string, string][]; status: ToolStatus;
      cost?: string; logs: string[]; progress: number; duration?: string; source?: string; result?: ToolResult;
    }
  | { id: string; t: 'artifact'; tab: TabSpec; meta: string }
  | { id: string; t: 'heatmap'; positions: { label: string; from: string; scores: Record<string, number> }[] }
  | { id: string; t: 'candidates'; rows: CandidateRow[] }
  | { id: string; t: 'suggest'; items: string[] }
  | { id: string; t: 'mmetrics' }
  | { id: string; t: 'proceed'; prompt: string };

export type ToolResult = { kind: 'models' } | { kind: 'kv'; rows: [string, string][] };
export type Msg = { id: string; role: 'user' | 'agent'; blocks: Block[]; text?: string; context?: string[]; done?: boolean };

export type TabSpec =
  | { id: string; kind: 'structure'; title: string; lens: 'plddt' | 'region' | 'interface' | 'ddg' }
  | { id: string; kind: 'table'; title: string; columns: string[]; rows: (string | number)[][] };

export type ToolSpec = {
  name: string; title: string; args: [string, string][]; cost?: string; logs: string[]; ms: number; source?: string; result?: ToolResult;
};

/** What a scenario can do. Implemented by the app; every call streams into the current agent message. */
export type Ctx = {
  say: (md: string) => Promise<void>;
  think: (md: string) => Promise<void>;
  sequence: (chains: InputChain[]) => void;
  plan: (items: string[]) => (i: number, state: PlanItem['state']) => void;
  tool: (spec: ToolSpec) => Promise<void>;
  artifact: (tab: TabSpec, meta: string) => void;
  heatmap: (positions: { label: string; from: string; scores: Record<string, number> }[]) => void;
  candidates: (rows: CandidateRow[]) => void;
  suggest: (items: string[]) => void;
  setDdg: (m: Map<string, Mutation[]>) => void;
  ensureStructure: () => Promise<{ code: (label: string) => string; chains: ChainInfo[] }>;
  /** Post the MMetrics dossier summary card and dock the full dossier under the structure. */
  mmetrics: () => void;
  /** Dock the full dossier under the structure without posting a card. */
  dossier: () => void;
  sleep: (ms: number) => Promise<void>;
};

const PARATOPE = [...INTERFACE].filter(l => !isAntigen(l)).sort((a, b) => a.localeCompare(b) || Number(a.slice(2)) - Number(b.slice(2)));
const fmt = (m: Mutation) => `${m.label.split(':')[0]}:${m.from}${m.label.split(':')[1]}${m.to}`;

export const STARTERS = [
  { title: '从序列预测复合物结构', body: '粘贴抗体与抗原序列，得到 3D 结构、置信度与结合界面', prompt: SAMPLE_FASTA },
  { title: '提升抗体亲和力', body: '扫描界面位点，筛出亲和力更高又不失稳的突变', prompt: '帮我找能提升 G6 对 VEGF-A 亲和力、又不影响稳定性的突变' },
  { title: 'MMetrics 速览结构', body: '输入 PDB ID，自动生成结构档案：CDR、互作网络、可开发性风险', prompt: '用 MMetrics 解读 PDB 2FJG' },
  { title: '抗体人源化', body: '降低免疫原性并保留抗原结合（公测）', prompt: '对 G6 抗体做人源化评估' },
];

export const SLASH = [
  { cmd: '/fold', name: '结构预测', model: 'MMFold' },
  { cmd: '/scan', name: '亲和力突变扫描', model: 'Binding Affinity Mutation Scoring' },
  { cmd: '/stability', name: '稳定性打分', model: 'Structural Stability Mutation Effect' },
  { cmd: '/search', name: '同源蛋白搜索', model: 'SeqSim Search' },
  { cmd: '/pocket', name: '口袋识别与对接', model: 'Geometric Pocket Detection' },
  { cmd: '/humanize', name: '抗体人源化', model: 'Antibody Humanization' },
];

/** Pick a scenario for a user turn. */
export function route(text: string, context: string[], hasStructure: boolean): (c: Ctx) => Promise<void> {
  const seqs = parseSequences(text.replace(/^\/fold\s*/, ''));
  if (seqs) return c => foldScenario(c, seqs);
  if (/^\/fold|预测.*结构|结构预测/.test(text)) return c => foldScenario(c, parseSequences(SAMPLE_FASTA)!);
  if (/可开发性|风险|liabilit/i.test(text)) return c => liabilityScenario(c);
  if (/^\/scan|亲和|突变|mutation|affinity/i.test(text)) return c => scanScenario(c, context.length ? context : PARATOPE);
  if (/2fjg|解读|界面|mmetrics|档案/i.test(text)) return c => interpretScenario(c, hasStructure);
  if (context.length) return c => explainScenario(c, context);
  return c => fallbackScenario(c);
}

// ---------------------------------------------------------------------------------------------------------------------
async function foldScenario(c: Ctx, chains: InputChain[]) {
  await c.say(`识别到 **${chains.length} 条链**。根据框架区保守基序判断了各自的类型，有误可以直接告诉我。`);
  c.sequence(chains);
  const step = c.plan(['预测复合物结构（MMFold，3 个模型）', '检查置信度，挑选最佳模型', '识别 CDR、表位与界面互作', '给出下一步建议']);
  step(0, 'doing');
  await c.tool({
    name: 'MMFold', title: `结构预测 · ${chains.length} 条链 · 3 个模型`,
    args: [['chains', chains.map(ch => `${ch.name} (${ch.seq.length} aa)`).join(', ')], ['num_models', '3'], ['msa', 'UniRef30 + PDB70'], ['templates', 'on']],
    cost: '约 6 GPU·分钟 · 3 积分', ms: 7000, source: 'MMFold v2.1 · 输入序列哈希 7f3a…c21',
    logs: ['构建 MSA：检索到 412 条同源序列', '模板搜索：命中 2FJF、1CZ8（序列一致性 99% / 81%）', '结构推理 model_1 / 2 / 3', '计算 pLDDT 与 ipTM'],
    result: { kind: 'models' },
  });
  step(0, 'done'); step(1, 'doing');
  await c.think('model_1 的 ipTM 最高（0.86），界面置信度明显好于 model_3；CDR-H3 尖端在三个模型里构象不一致，属于正常的柔性环区。选 model_1。');
  c.artifact({ id: 'struct', kind: 'structure', title: 'g6_vegf_model_1.cif', lens: 'plddt' }, 'pLDDT 89.4 · ipTM 0.86 · 按置信度着色');
  await c.ensureStructure();
  step(1, 'done'); step(2, 'doing');
  await runMMetrics(c, 'g6_vegf_model_1.cif');
  step(2, 'done'); step(3, 'doing');
  await c.say('依据 MMetrics 档案：G6 以 **CDR-H1/H2/H3** 为主、CDR-L1/L3 为辅结合 VEGF-A，表位**横跨 VEGF-A 二聚体的两个亚基**。最关键的接触是 [[H:31]]–[[V:90]] 盐桥（Asp–His）、[[H:105]]–[[V:48]] 氢键（Tyr–Lys，2.7 Å）和 [[H:101]]–[[V:48]] π–阳离子作用。\n\n需要注意：CDR-H3 尖端 [[H:101]]–[[H:105]] 的 pLDDT 只有 70 左右，而它恰好贡献了最多的界面接触，基于这一段的设计结论要更谨慎，最好配合实验结构验证。');
  step(3, 'done');
  c.suggest(['扫描界面位点，找提升亲和力的突变', '对比 3 个模型的 CDR-H3 构象', '导出结构与报告']);
}

/** MMetrics runs whenever a structure enters the session: free, no approval, and its dossier is what the agent cites. */
async function runMMetrics(c: Ctx, structure: string) {
  await c.tool({
    name: 'MMetrics', title: '结构档案 · 自动生成', args: [['structure', structure], ['trigger', '结构进入会话时自动运行'], ['numbering', 'Kabat（可切换 IMGT / Chothia / AHo）']], ms: 2600,
    source: 'MMetrics · 规则库 2026.09', logs: ['分类：抗体–抗原复合物（96%）', '检索同源结构：前 5 条', '注释 CDR 与表位', '计算界面非共价互作', '扫描可开发性风险基序'],
    result: { kind: 'kv', rows: [['类型', '抗体–抗原复合物 · 96%'], ['CDR', REGIONS.filter(r => r.name.startsWith('CDR')).map(r => r.name).join(' / ')], ['界面', '与抗原的非共价互作已映射'], ['费用', '免费 · 不消耗积分']] },
  });
  c.mmetrics();
}

/** Would this substitution create a chemical-liability motif? (Same rules MMetrics uses for the dossier.) */
function introducedLiability(to: string, next: string, prev: string) {
  if (to === 'N' && (next === 'G' || next === 'S')) return '引入脱酰胺基序 N' + next;
  if (to === 'D' && next === 'G') return '引入异构化基序 DG';
  if (to === 'G' && prev === 'N') return '引入脱酰胺基序 NG';
  if (to === 'M' || to === 'W') return '新增易氧化残基';
  if (to === 'C') return '引入游离半胱氨酸';
  return undefined;
}

async function scanScenario(c: Ctx, targets: string[]) {
  const s = await c.ensureStructure();
  await c.say(`我会在 **${targets.length} 个位点**（${compactLabels(targets)}）做饱和突变，算结合 ΔΔG；再对最好的几个做稳定性打分，排除失稳的。`);
  const step = c.plan([`饱和突变扫描 ${targets.length} 个位点 × 19 种氨基酸`, '对最优突变做稳定性打分', '汇总候选清单']);
  step(0, 'doing');
  await c.tool({
    name: 'BindingAffinityMutationScoring', title: `亲和力突变扫描 · ${targets.length * 19} 个突变`,
    args: [['structure', 'g6_vegf_model_1.cif'], ['positions', compactLabels(targets)], ['partner', 'VEGF-A (chain V)'], ['substitutions', '19 / site']],
    cost: '约 4 GPU·分钟 · 2 积分', ms: 6000, source: 'Binding ΔΔG v1.4 · 结构 model_1', logs: ['准备复合物与界面残基', `突变打分 ${targets.length * 19} 个`, '汇总每个位点的最优突变'],
  });
  const ddg = new Map(targets.map(l => [l, ddgScan(l, s.code(l))]));
  c.setDdg(ddg);
  c.heatmap(targets.map(l => ({ label: l, from: s.code(l), scores: Object.fromEntries(ddg.get(l)!.map(m => [m.to, m.ddg])) })));
  const best = [...ddg.values()].map(m => m[0]).filter(m => m.ddg < 0).sort((a, b) => a.ddg - b.ddg);
  const intolerant = targets.filter(l => ddg.get(l)![0].ddg > 0);
  if (intolerant.length) await c.say(`热图里整行偏红的 ${intolerant.map(l => `[[${l}]]`).join('、')} 是结合热点：几乎任何替换都会削弱结合（最优 ΔΔG 仍 > 0），应当保留。提升空间主要在界面外围。`);
  c.artifact({ id: 'scan', kind: 'table', title: 'affinity_scan.csv', columns: ['突变', '链', '结合 ΔΔG', '保守性'],
    rows: [...ddg.values()].flat().sort((a, b) => a.ddg - b.ddg).map(m => [fmt(m).split(':')[1], m.label.split(':')[0], m.ddg, `${Math.round(conservation(m.label) * 100)}%`]) }, `${targets.length * 19} 行 · 按 ΔΔG 排序`);
  step(0, 'done'); step(1, 'doing');
  const top = best.slice(0, 6);
  await c.tool({
    name: 'StructuralStabilityMutationEffect', title: `稳定性打分 · ${top.length} 个突变`, args: [['mutations', top.map(fmt).join(', ')]],
    cost: '约 1 GPU·分钟 · 1 积分', ms: 3200, source: 'Stability ΔΔG v2.0', logs: ['逐个突变弛豫并计算折叠 ΔΔG'],
  });
  step(1, 'done'); step(2, 'doing');
  const near = (l: string, d: number) => { const [ch, n] = l.split(':'); return s.code(`${ch}:${Number(n) + d}`); };
  const rows = top.map(m => ({ label: m.label, from: m.from, to: m.to, ddg: m.ddg, stab: stability(m.label, m.to), cons: conservation(m.label), liability: introducedLiability(m.to, near(m.label, 1), near(m.label, -1)) }));
  c.candidates(rows);
  const safe = rows.filter(r => r.stab <= 0.6 && !r.liability), risky = rows.filter(r => r.stab > 0.6), flagged = rows.filter(r => r.stab <= 0.6 && r.liability);
  await c.say(`**${safe.length} 个突变**亲和力提升且稳定性无明显损失，建议进入下一轮实验：${safe.map(r => `[[${r.label}]] ${r.from}→${r.to}`).join('、')}。` +
    (risky.length ? `\n\n${risky.map(r => `[[${r.label}]] ${r.from}→${r.to}`).join('、')} 亲和力最好，但稳定性 ΔΔG > 0.6 kcal/mol，可能失稳，先不推荐单独使用。` : '') +
    (flagged.length ? `\n\n对照 MMetrics 可开发性规则：${flagged.map(r => `[[${r.label}]] ${r.from}→${r.to}（${r.liability}）`).join('、')}，建议实验前评估。` : ''));
  step(2, 'done');
  c.artifact({ id: 'cands', kind: 'table', title: 'candidates.csv', columns: ['突变', '结合 ΔΔG', '稳定性 ΔΔG', '保守性', '建议'],
    rows: rows.map(r => [`${r.label.split(':')[0]}:${r.from}${r.label.split(':')[1]}${r.to}`, r.ddg, r.stab, `${Math.round(r.cons * 100)}%`, r.stab > 0.6 ? '慎用 · 可能失稳' : r.liability ? `留意 · ${r.liability}` : '推荐']) }, `${rows.length} 个候选 · 可直接发给实验团队`);
  c.suggest(['把推荐突变两两组合，评估叠加效果', '对候选做可开发性风险扫描', '生成实验方案草稿']);
}

async function interpretScenario(c: Ctx, has: boolean) {
  if (!has) {
    await c.tool({ name: 'FetchPDB', title: '获取结构 2FJG', args: [['id', '2FJG'], ['source', 'RCSB PDB']], ms: 1200, source: 'RCSB PDB · 2FJG', logs: ['下载 mmCIF', '保留链 H / L / V，去除重复拷贝'] });
    c.artifact({ id: 'struct', kind: 'structure', title: '2fjg.cif', lens: 'region' }, 'G6 Fab · VEGF-A · 按功能区域着色');
    await c.ensureStructure();
  }
  await runMMetrics(c, '2fjg.cif');
  await c.say('依据 MMetrics 档案：2FJG 是噬菌体展示来源的 **G6 Fab** 与 **VEGF-A** 受体结合域二聚体的复合物，表位横跨两个亚基，与 VEGFR 结合位点重叠，这也是 G6 能中和 VEGF-A 的原因。关键接触：[[H:31]]–[[V:90]] 盐桥、[[H:105]]–[[V:48]] 氢键、[[L:92]]–[[W:64]] 氢键、[[H:33]]–[[W:17]] π–π 堆积。');
  c.suggest(['扫描界面位点，找提升亲和力的突变', '查看 CDR 中的可开发性风险']);
}

async function liabilityScenario(c: Ctx) {
  const s = await c.ensureStructure();
  // Same scanner as the dossier's 可开发性 section, so the numbers in chat and in the dossier always agree.
  const hits = scanLiabilities(s.chains, 'Kabat');
  const sev = { high: '高', medium: '中', low: '低' } as const;
  const count = (k: keyof typeof sev) => hits.filter(h => h.severity === k).length;
  const top = hits.filter(h => h.severity !== 'low');
  c.dossier();
  await c.say(hits.length
    ? `依据 MMetrics 档案，可变区共有 **${hits.length} 处**化学不稳定风险（高 ${count('high')} · 中 ${count('medium')} · 低 ${count('low')}）。` +
      (top.length ? `需要优先关注：${top.map(h => `[[${h.labels[0]}]] ${h.motif}（${h.name}，${h.inCdr ? h.region : '框架区'}，${sev[h.severity]}）`).join('、')}。` : '') +
      '\n\n位于结合界面的风险位点，建议在实验中做强制降解测试；脱酰胺与异构化基序优先考虑保守替换。完整列表在工作台下方 MMetrics 档案的「可开发性」一节。'
    : '可变区没有发现常见的化学不稳定基序。');
  c.suggest(['扫描界面位点，找提升亲和力的突变']);
}

async function explainScenario(c: Ctx, labels: string[]) {
  const regions = [...new Set(labels.map(l => REGIONS.find(r => r.labels.includes(l))?.name).filter(Boolean))];
  const iface = labels.filter(l => INTERFACE.has(l));
  await c.say(`你选中了 ${labels.length} 个残基（${compactLabels(labels)}）${regions.length ? `，位于 ${regions.join('、')}` : ''}。` +
    (iface.length ? `其中 ${iface.map(l => `[[${l}]]`).join('、')} 直接接触抗原。` : '它们不在结合界面上。') +
    `平均保守性 ${Math.round(labels.reduce((a, l) => a + conservation(l), 0) / labels.length * 100)}%，平均预测置信度 pLDDT ${Math.round(labels.reduce((a, l) => a + plddt(l), 0) / labels.length)}。`);
  c.suggest([`对 ${compactLabels(labels).slice(0, 20)} 做亲和力突变扫描`, '找出它们 5 Å 内的邻近残基']);
}

async function fallbackScenario(c: Ctx) {
  await c.say('我可以帮你做结构预测、突变扫描、稳定性评估、同源搜索、口袋识别和人源化。最快的开始方式是**粘贴序列**或**输入 PDB ID**，也可以输入 `/` 直接调用某个模型。');
  c.suggest(['从序列预测结构', '用 MMetrics 解读 PDB 2FJG']);
}

export const MODEL_ROWS = PREDICTED_MODELS;
export { ROLE_NAMES };
