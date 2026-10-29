/** Studio prototype data. Everything is demo content: shapes are what a real backend would fill, values are synthetic. */
import type { ChainInfo } from '../console/molstar-lite';

export const STRUCTURE = { id: '2fjg', name: '2FJG', title: 'G6 Fab · VEGF-A', src: '/demo/2fjg.cif' };
export const CHAIN_COLORS: Record<string, string> = { H: '#f2a14a', L: '#8b93ff', V: '#ff6fae', W: '#ff9fcb', A: '#8b93ff', B: '#f2a14a' };
// A/B are the second Fab copy in the asymmetric unit. Both VEGF-A monomers stay visible: G6's epitope spans the dimer.
export const HIDDEN_CHAINS = ['A', 'B'];
export const CHAIN_NAMES: Record<string, string> = { H: '重链 Heavy', L: '轻链 Light', V: 'VEGF-A 亚基 1', W: 'VEGF-A 亚基 2' };
export const isAntigen = (label: string) => label[0] === 'V' || label[0] === 'W';

const range = (chain: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${chain}:${from + i}`);

export type Region = { id: string; name: string; labels: string[]; tone: string };
/**
 * Kabat CDRs located on 2FJG's own (sequential) residue numbering by their sequences, e.g. CDR-H3 FVFFLPYAMDY = H:99–109.
 * The epitope is every VEGF-A residue within 4.5 Å of the Fab, computed from the deposited coordinates.
 */
export const REGIONS: Region[] = [
  { id: 'h1', name: 'CDR-H1', labels: range('H', 31, 35), tone: '#f2a14a' },
  { id: 'h2', name: 'CDR-H2', labels: range('H', 50, 66), tone: '#f2a14a' },
  { id: 'h3', name: 'CDR-H3', labels: range('H', 99, 109), tone: '#f2a14a' },
  { id: 'l1', name: 'CDR-L1', labels: range('L', 24, 34), tone: '#8b93ff' },
  { id: 'l2', name: 'CDR-L2', labels: range('L', 50, 56), tone: '#8b93ff' },
  { id: 'l3', name: 'CDR-L3', labels: range('L', 89, 97), tone: '#8b93ff' },
  { id: 'ep', name: '表位 Epitope', labels: [...[48, 81, 83, 84, 85, 86, 87, 88, 89, 90, 91].map(n => `V:${n}`), ...[17, 18, 21, 22, 25, 62, 63, 64, 66, 106].map(n => `W:${n}`)], tone: '#ff6fae' },
];
export const regionOf = (label: string) => REGIONS.find(r => r.labels.includes(label));

export type ContactType = '氢键' | '盐桥' | 'π–π' | 'π–阳离子' | '疏水';
export type Contact = { type: ContactType; a: string; b: string; dist: number; atomA: string; atomB: string };
/**
 * Fab–VEGF-A contacts measured on 2FJG (closest classified atom pair per residue pair; H-bond N/O ≤ 3.5 Å,
 * salt bridge ≤ 4.0 Å, aromatic ≤ 5.0 Å, hydrophobic C–C ≤ 4.0 Å). Strongest first.
 */
export const CONTACTS: Contact[] = ([
  ['盐桥', 'H:31', 'V:90', 3.46, 'OD2', 'ND1'],
  ['氢键', 'L:92', 'W:64', 1.92, 'OH', 'OE1'],
  ['氢键', 'H:53', 'W:21', 2.59, 'O', 'OH'],
  ['氢键', 'H:105', 'V:48', 2.73, 'OH', 'NZ'],
  ['氢键', 'H:101', 'V:89', 2.9, 'N', 'NE2'],
  ['氢键', 'H:102', 'V:86', 2.98, 'O', 'N'],
  ['氢键', 'H:105', 'W:63', 2.99, 'OH', 'OD2'],
  ['氢键', 'H:31', 'V:89', 3.0, 'O', 'OE1'],
  ['氢键', 'H:56', 'W:22', 3.28, 'O', 'OE1'],
  ['π–阳离子', 'H:101', 'V:48', 3.39, 'CD2', 'NZ'],
  ['π–π', 'L:49', 'V:86', 3.92, 'CE2', 'ND1'],
  ['π–π', 'H:33', 'W:17', 3.95, 'CZ2', 'CE2'],
  ['π–π', 'H:101', 'W:21', 4.03, 'CZ', 'CE1'],
  ['π–π', 'L:53', 'V:86', 4.11, 'CZ', 'NE2'],
  ['疏水', 'H:102', 'V:87', 3.33, 'CD1', 'C'],
  ['疏水', 'H:57', 'W:22', 3.42, 'CE2', 'CD'],
  ['疏水', 'H:101', 'V:83', 3.43, 'CB', 'CD1'],
  ['疏水', 'H:54', 'W:25', 3.55, 'CA', 'CZ'],
  ['疏水', 'H:51', 'W:18', 3.64, 'CG2', 'CE'],
  ['疏水', 'L:28', 'W:106', 3.69, 'CB', 'CG'],
] as const).map(([type, a, b, dist, atomA, atomB]) => ({ type, a, b, dist, atomA, atomB }));
export const INTERFACE = new Set(CONTACTS.flatMap(c => [c.a, c.b]));

export const HOMOLOGS = [
  { id: '2FJF', identity: 99.2, note: '晶体' }, { id: '1CZ8', identity: 81.4, note: '晶体' }, { id: '2FJH', identity: 76.8, note: '晶体' },
];

// ---------- deterministic synthetic metrics ----------
// FNV-1a plus a final avalanche, so labels differing only in their last character still land far apart.
const hash = (s: string) => {
  let h = [...s].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 16777619), 2166136261);
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
};
const rand = (s: string) => (hash(s) % 10000) / 10000;
const AA = 'ACDEFGHIKLMNPQRSTVWY'.split('');

/** 0..1, higher = more conserved. CDRs are variable, frameworks conserved. */
export function conservation(label: string) {
  const r = rand(`c${label}`);
  if (isAntigen(label)) return 0.55 + r * 0.4;
  return regionOf(label) ? 0.15 + r * 0.45 : 0.62 + r * 0.38;
}

export type Mutation = { label: string; from: string; to: string; ddg: number };
/** Binding ΔΔG (kcal/mol, negative = tighter binding) for the best substitutions at a position. */
/** Residues making polar or aromatic contacts (not just hydrophobic packing): binding hotspots. */
export const HOTSPOTS = new Set(CONTACTS.filter(c => c.type !== '疏水').map(c => c.a));
const SIMILAR = ['DE', 'KR', 'FYW', 'ST', 'NQ', 'ILVM'];
const similar = (a: string, b: string) => SIMILAR.some(g => g.includes(a) && g.includes(b));
/**
 * Synthetic binding ΔΔG (kcal/mol, negative = tighter) shaped like real scans: hotspots are intolerant except to
 * conservative swaps; gains come from peripheral interface/CDR positions, mostly by adding aromatic or Arg side chains.
 */
export function ddgScan(label: string, from: string): Mutation[] {
  const hot = HOTSPOTS.has(label), iface = INTERFACE.has(label), cdr = !!regionOf(label);
  return AA.filter(a => a !== from)
    .map(to => {
      let v = (rand(`d${label}${to}`) - 0.5) * 1.2;
      if (hot) v += similar(from, to) ? 0.25 : 1.1 + rand(`h${label}${to}`);
      else if (iface) v += -0.35 + ('YWFR'.includes(to) ? -0.6 : 0) + (to === 'G' ? 0.7 : 0);
      else if (cdr) v += -0.1 + ('YWFR'.includes(to) ? -0.3 : 0);
      else v += 0.4;
      // Pro breaks loop backbones and free Cys adds liabilities; keep them out of the top like a real scorer would.
      if (to === 'P' || to === 'C') v += 1.4;
      return { label, from, to, ddg: +v.toFixed(2) };
    })
    .sort((a, b) => a.ddg - b.ddg);
}
/** Stability ΔΔG of folding (kcal/mol, negative = more stable). */
export function stability(label: string, to?: string) {
  return +((rand(`s${label}${to ?? ''}`) - 0.45) * 2.4).toFixed(2);
}

// ---------- lenses: what the 3D stage is coloured by ----------
export type LensId = 'chain' | 'plddt' | 'region' | 'interface' | 'conservation' | 'ddg' | 'stability';
export const LENSES: { id: LensId; name: string; hint: string }[] = [
  { id: 'chain', name: '链', hint: '按链着色' },
  { id: 'plddt', name: '置信度', hint: '结构预测的逐残基置信度 pLDDT' },
  { id: 'region', name: '区域', hint: 'CDR 与表位' },
  { id: 'interface', name: '界面', hint: '与抗原接触的残基' },
  { id: 'conservation', name: '保守性', hint: '同源序列保守程度' },
  { id: 'ddg', name: '亲和力 ΔΔG', hint: '最佳单点突变的结合能变化' },
  { id: 'stability', name: '稳定性', hint: '最佳单点突变的折叠稳定性变化' },
];

/** Diverging ramp: good (teal) → neutral (grey) → bad (red). */
export function rampColor(t: number) {
  const stops = ['#2fd3a7', '#7fd0b9', '#59606f', '#e98a7b', '#ff5e6c'];
  return stops[Math.max(0, Math.min(stops.length - 1, Math.round(t * (stops.length - 1))))];
}
export function heatColor(t: number) {
  const stops = ['#2b3045', '#3d4d8f', '#5b6cf0', '#9b7bff', '#f0a5ff'];
  return stops[Math.max(0, Math.min(stops.length - 1, Math.round(t * (stops.length - 1))))];
}

// ---------- the research thread ----------
export type StepKind = 'import' | 'predict' | 'analyze' | 'conservation' | 'ddg' | 'stability' | 'neighbors' | 'group' | 'suggest' | 'note';
export type Step = {
  id: string; kind: StepKind; title: string; by: 'you' | 'mocha' | 'auto'; at: string;
  status: 'done' | 'running' | 'queued' | 'suggested';
  progress?: number; targets?: string[]; model?: string; outputs?: { lens?: LensId; text: string }[];
  body?: string; eta?: string;
};

export type Verb = { id: 'ddg' | 'stability' | 'neighbors' | 'contacts' | 'measure' | 'group' | 'ask'; name: string; model?: string; eta?: string; hint: string; min?: number; exact?: number };
export const VERBS: Verb[] = [
  { id: 'ddg', name: '亲和力突变扫描', model: 'Binding Affinity Mutation Scoring', eta: '约 2 分钟', hint: '对选中位点做饱和突变，计算结合 ΔΔG' },
  { id: 'stability', name: '稳定性打分', model: 'Structural Stability Mutation Effect', eta: '约 1 分钟', hint: '评估突变对折叠稳定性的影响' },
  { id: 'neighbors', name: '邻近残基', hint: '找出周围一定距离内的残基' },
  { id: 'contacts', name: '互作关系', hint: '查看氢键、π 堆积等非共价互作' },
  { id: 'measure', name: '测距', hint: '测量两个残基之间的距离', exact: 2 },
  { id: 'group', name: '存为残基组', hint: '保存到项目，成员可见' },
  { id: 'ask', name: '问 Mocha', hint: '带着选区向 Mocha 提问' },
];

export type Candidate = Mutation & { id: string; stab?: number; cons: number; source: string };

export function compactLabels(labels: string[]) {
  // H:98,H:99,H:100 -> H:98–100
  const byChain = new Map<string, number[]>();
  for (const l of labels) { const [c, n] = l.split(':'); byChain.set(c, [...(byChain.get(c) ?? []), Number(n)]); }
  const parts: string[] = [];
  for (const [c, nums] of byChain) {
    const s = [...new Set(nums)].sort((a, b) => a - b);
    let start = s[0], prev = s[0];
    const flush = () => parts.push(start === prev ? `${c}:${start}` : `${c}:${start}–${prev}`);
    for (const n of s.slice(1)) { if (n === prev + 1) { prev = n; continue; } flush(); start = prev = n; }
    flush();
  }
  return parts.join(', ');
}

export const residueName = (chains: ChainInfo[], label: string) => {
  const [c, n] = label.split(':');
  return chains.find(ch => ch.auth === c)?.residues.find(r => r.seq === Number(n));
};

export const INITIAL_STEPS: Step[] = [
  { id: 's1', kind: 'import', title: '导入结构 2FJG', by: 'you', at: '今天 09:12', status: 'done', body: 'G6 Fab 与 VEGF-A 受体结合域复合物（RCSB PDB）。', outputs: [{ lens: 'chain', text: '3 条链 · 1 个复合物' }] },
  { id: 's2', kind: 'analyze', title: '结构自动解析', by: 'auto', at: '今天 09:12', status: 'done', model: 'MMetrics', body: '识别为抗体–抗原复合物（置信度 96%），标注 CDR 与表位，计算界面互作。', outputs: [{ lens: 'region', text: '6 个 CDR + 表位' }, { lens: 'interface', text: '8 条界面互作' }] },
  { id: 's3', kind: 'conservation', title: '同源搜索与保守性', by: 'mocha', at: '今天 09:20', status: 'done', model: 'SeqSim Search · MSA', body: '检索到 412 条同源序列，前三：2FJF (99%)、1CZ8 (81%)、2FJH (77%)。', outputs: [{ lens: 'conservation', text: '逐位点保守性' }] },
];

// ---------- projects & the "start from sequence" flow ----------
export type ChainRole = 'heavy' | 'light' | 'antigen' | 'other';
export const ROLE_NAMES: Record<ChainRole, string> = { heavy: '抗体重链', light: '抗体轻链', antigen: '抗原', other: '其他蛋白' };
export type InputChain = { id: string; name: string; seq: string; role: ChainRole };

/** The 2FJG chains as a user would paste them. The prototype "predicts" these into the 2FJG structure. */
export const SAMPLE_FASTA = `>G6_heavy
EVQLVESGGGLVQPGGSLRLSCAASGFTISDYWIHWVRQAPGKGLEWVAGITPAGGYTYYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCARFVFFLPYAMDYWGQGTLVTVSS
>G6_light
DIQMTQSPSSLSASVGDRVTITCRASQDVSTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSGSGTDFTLTISSLQPEDFATYYCQQSYTTPPTFGQGTKVEIK
>VEGF-A_RBD
GQNHHEVVKFMDVYQRSYCHPIETLVDIFQEYPDEIEYIFKPSCVPLMRCGGCCNDEGLECVPTEESNITMQIMRIKPHQGQHIGEMSFLQHNKCECRPKKD`;

/** Antibody variable domains end in a conserved framework-4 motif: WGxG for heavy chains, FGxG for light chains. */
export function guessRole(seq: string): ChainRole {
  if (/WG.G/.test(seq) && seq.length < 260) return 'heavy';
  if (/FG.G/.test(seq) && seq.length < 240) return 'light';
  return 'antigen';
}

const AA_SET = /^[ACDEFGHIKLMNPQRSTVWYX]+$/;
/** FASTA or bare sequences (one per line / blank-line separated). Returns null when the text is not sequence-like. */
export function parseSequences(text: string): InputChain[] | null {
  const t = text.trim();
  if (!t) return null;
  const blocks = t.startsWith('>') ? t.split(/^>/m).filter(Boolean).map(b => { const [head, ...rest] = b.split('\n'); return { name: head.trim(), seq: rest.join('') }; })
    : t.split(/\n\s*\n|\n/).map((s, i) => ({ name: `链 ${i + 1}`, seq: s }));
  const chains = blocks.map(b => ({ ...b, seq: b.seq.replace(/[\s\d]/g, '').toUpperCase() })).filter(b => b.seq.length);
  if (!chains.length || chains.some(c => c.seq.length < 10 || !AA_SET.test(c.seq))) return null;
  return chains.map((c, i) => ({ id: `c${i}`, name: c.name, seq: c.seq, role: guessRole(c.seq) }));
}

/** Predicted-structure confidence (pLDDT, 0–100): high in frameworks, lower in CDR loops and termini. */
export function plddt(label: string, model = 0) {
  const pos = Number(label.split(':')[1]);
  let v = 93 - rand(`p${model}${label}`) * 8 - model * 2.5;
  if (regionOf(label)) v -= 12 + rand(`q${label}`) * 10;
  if (label.startsWith('H') && pos >= 101 && pos <= 106) v -= 14; // CDR-H3 tip
  if (pos < 3 || (!isAntigen(label) && pos > 210)) v -= 25;
  return Math.max(30, Math.min(98, v));
}
export function plddtColor(v: number) { return v >= 90 ? '#2f6fe0' : v >= 70 ? '#65cbf3' : v >= 50 ? '#ffd23f' : '#ff8a4c'; }
export const PREDICTED_MODELS = [
  { id: 0, name: 'model_1', plddt: 89.4, iptm: 0.86, note: '界面置信度最高' },
  { id: 1, name: 'model_2', plddt: 87.1, iptm: 0.81, note: 'CDR-H3 构象不同' },
  { id: 2, name: 'model_3', plddt: 84.8, iptm: 0.72, note: '抗原取向偏移' },
];

export type ProjectCard = {
  id: string; name: string; goal: string; kind: string; image?: string; updated: string; members: string[];
  done: number; running: number; candidates: number; pending?: string; demoOnly?: boolean;
};
export const PROJECT_CARDS: ProjectCard[] = [
  { id: 'vegf', name: 'VEGF 抗体亲和力成熟', goal: '提升 G6 对 VEGF-A 的亲和力 ≥10×，同时保持可开发性', kind: '抗体 · 亲和力', image: '/demo/2bdn-preview.webp', updated: '2 小时前', members: ['Z', 'L', 'W'], done: 3, running: 0, candidates: 0, pending: 'Mocha 建议扫描 8 个界面位点' },
  { id: 'pet', name: 'PET 水解酶热稳定性', goal: '把 IsPETase 的 Tm 提高 10 °C 且活性不降', kind: '酶 · 稳定性', image: '/demo/5xh3-platform-preview.png', updated: '昨天', members: ['Z', 'Q'], done: 7, running: 1, candidates: 14, demoOnly: true },
  { id: 'hum', name: '鼠源抗体人源化', goal: '人源化 4HT1 抗体并保持结合', kind: '抗体 · 人源化', image: '/demo/4ht1-preview.png', updated: '3 天前', members: ['L'], done: 4, running: 0, candidates: 6, pending: '2 个人源化方案待比较', demoOnly: true },
];

export const GOAL_TEMPLATES = [
  { id: 'predict', title: '从序列预测结构', body: '粘贴抗体、抗原或任意蛋白序列，得到 3D 结构与置信度', fill: SAMPLE_FASTA },
  { id: 'affinity', title: '提升抗体亲和力', body: '找出提升结合、又不牺牲稳定性的突变' },
  { id: 'stability', title: '酶稳定性改造', body: '在保持活性的前提下提高热稳定性' },
  { id: 'humanize', title: '抗体人源化', body: '降低免疫原性并保留抗原结合' },
];
