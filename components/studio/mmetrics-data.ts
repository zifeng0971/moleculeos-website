/**
 * MMetrics "structure dossier" for the running case, PDB 2FJG (G6 Fab · VEGF-A RBD).
 *
 * Shapes follow the real MMetrics export (see components/hero/mmetrics-data.ts for the 4HT1 record); this module is
 * self-contained on purpose so the studio never imports marketing-site code.
 *
 * Provenance, honestly:
 * - Sequences, residue names and the 10 contacts flagged `origin: 'structure'` were read from public/demo/2fjg.cif
 *   (heavy-atom pairs ≤ 4.2 Å between chain H/L and chain V). Interaction types for them are assigned by chemistry.
 * - Interface contacts, CDRs (Kabat) and the epitope are measured on the real 2FJG coordinates (see model.ts).
 * - Homolog identities, confidence, mutation scores and non-Kabat CDR boundaries are demo values.
 */
import type { ChainInfo } from '../console/molstar-lite';
import { CONTACTS, REGIONS, compactLabels, conservation, ddgScan, stability } from './model';

// ---------- residues ----------
const THREE: Record<string, string> = {
  A: 'ALA', R: 'ARG', N: 'ASN', D: 'ASP', C: 'CYS', Q: 'GLN', E: 'GLU', G: 'GLY', H: 'HIS', I: 'ILE',
  L: 'LEU', K: 'LYS', M: 'MET', F: 'PHE', P: 'PRO', S: 'SER', T: 'THR', W: 'TRP', Y: 'TYR', V: 'VAL',
};
const ONE: Record<string, string> = Object.fromEntries(Object.entries(THREE).map(([k, v]) => [v, k]));

/** Chain sequences as deposited in 2FJG (auth numbering; H and L start at 1, V at 14). Used when the viewer has not reported chains yet. */
const FALLBACK: { auth: string; entity: string; start: number; seq: string; gapAfter?: [number, number] }[] = [
  { auth: 'H', entity: '1', start: 1, seq: 'EVQLVESGGGLVQPGGSLRLSCAASGFTISDYWIHWVRQAPGKGLEWVAGITPAGGYTYYADSVKGRFTISADTSKNTAYLQMNSLRAEDTAVYYCARFVFFLPYAMDYWGQGTLVTVSSASTKGPSVFPLAPSSGTAALGCLVKDYFPEPVTVSWNSGALTSGVHTFPAVLQSSGLYSLSSVVTVPSSSLGTQTYICNVNHKPSNTKVDKKVEPKSC', gapAfter: [135, 5] },
  { auth: 'L', entity: '2', start: 1, seq: 'DIQMTQSPSSLSASVGDRVTITCRASQDVSTAVAWYQQKPGKAPKLLIYSASFLYSGVPSRFSGSGSGTDFTLTISSLQPEDFATYYCQQSYTTPPTFGQGTKVEIKRTVAAPSVFIFPPSDEQLKSGTASVVCLLNNFYPREAKVQWKVDNALQSGNSQESVTEQDSKDSTYSLSSTLTLSKADYEKHKVYACEVTHQGLSSPVTKSFNR' },
  { auth: 'V', entity: '3', start: 14, seq: 'VVKFMDVYQRSYCHPIETLVDIFQEYPDEIEYIFKPSCVPLMRCGGCCNDEGLECVPTEESNITMQIMRIKPHQGQHIGEMSFLQHNKCECRPKK' },
  { auth: 'W', entity: '3', start: 14, seq: 'VVKFMDVYQRSYCHPIETLVDIFQEYPDEIEYIFKPSCVPLMRCGGCCNDEGLECVPTEESNITMQIMRIKPHQGQHIGEMSFLQHNKCECRPKK' },
];
// Chain H skips auth numbers 136–140 (disordered CH1 loop), hence `gapAfter`.

/** Chains from the viewer when available, otherwise the deposited 2FJG sequences. */
export function resolveChains(chains: ChainInfo[]): ChainInfo[] {
  const have = new Set(chains.map(c => c.auth));
  const extra = FALLBACK.filter(f => !have.has(f.auth)).map(f => ({
    auth: f.auth, entity: f.entity,
    residues: [...f.seq].map((code, i) => {
      const seq = f.start + i;
      return { seq: f.gapAfter && seq > f.gapAfter[0] ? seq + f.gapAfter[1] : seq, code, name: THREE[code] ?? 'UNK' };
    }),
  }));
  return [...chains.filter(c => ['H', 'L', 'V', 'W'].includes(c.auth)), ...extra].sort((a, b) => 'HLVW'.indexOf(a.auth) - 'HLVW'.indexOf(b.auth));
}

const find = (chains: ChainInfo[], label: string) => {
  const [c, n] = label.split(':');
  return chains.find(ch => ch.auth === c)?.residues.find(r => r.seq === Number(n));
};
/** Three-letter name ("TYR"), falling back to the deposited sequence. */
export function resName(chains: ChainInfo[], label: string) {
  return find(chains, label)?.name ?? find(resolveChains([]), label)?.name ?? 'UNK';
}
export function resCode(chains: ChainInfo[], label: string) {
  const r = find(chains, label) ?? find(resolveChains([]), label);
  return r?.code ?? (r ? ONE[r.name] : undefined) ?? 'X';
}
/** "H:53" → "H:TYR53", the MMetrics display convention. */
export function displayResidue(chains: ChainInfo[], label: string) {
  const [c, n] = label.split(':');
  return `${c}:${resName(chains, label)}${n}`;
}
export const range = (chain: string, from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => `${chain}:${from + i}`);

// ---------- description ----------
export const DESCRIPTION = {
  category: '抗体–抗原复合物',
  confidence: { level: 'high' as const, score: 0.96 },
  name: 'G6 Fab 与 VEGF-A 受体结合域复合物',
  source: 'RCSB PDB 2FJG · X 射线衍射 2.80 Å · 噬菌体展示合成抗体 G6 的 Fab 片段',
  function: 'G6 结合 VEGF-A 受体结合域上与 VEGFR1/VEGFR2 重叠的表面，竞争性阻断 VEGF-A 与受体的结合，从而中和其促血管生成活性。',
  features: [
    'Fab 由重链 VH+CH1 与轻链 VL+CL 组成，VH/VL 形成一个抗原结合位点',
    'CDR-H1、H2、H3 与 L3 共同构成相对平坦的结合面，CDR-H3 贡献最多界面接触',
    'VEGF-A 以二硫键连接的反平行同源二聚体存在；G6 的表位横跨两个亚基（V、W 链）',
  ],
  reasoning: [
    '链 H、L 含抗体可变区保守基序（重链 WGQG、轻链 FGQG），且各有一对典型链内二硫键 Cys',
    '链 V 与 UniProt P15692（VEGFA_HUMAN）受体结合域序列一致',
    'H/L 的 CDR 环与 VEGF-A 二聚体的两个亚基（V、W 链）形成连续的非共价界面，符合抗体–抗原识别模式',
    'PDB 标题与实体描述：G6 Fab in complex with VEGF',
  ],
  chains: [
    { id: 'H', role: '抗体重链', domains: 'VH + CH1', molecule: 'G6 Fab 重链' },
    { id: 'L', role: '抗体轻链', domains: 'VL + CL (κ)', molecule: 'G6 Fab 轻链' },
    { id: 'V', role: '抗原', domains: 'VEGF-A RBD', molecule: 'VEGF-A 受体结合域 · 亚基 1' },
    { id: 'W', role: '抗原', domains: 'VEGF-A RBD', molecule: 'VEGF-A 受体结合域 · 亚基 2' },
  ],
};

// ---------- homologs ----------
export type Homolog = { id: string; title: string; crystal: boolean; identity: number; db: 'RCSB' | 'UniProt'; url: string };
// Demo values: plausible VEGF-binding Fab complexes. Identities are illustrative and match model.ts HOMOLOGS where they overlap.
export const HOMOLOGS: { method: string; items: Homolog[] } = {
  method: '按抗体 Fv 序列相似度检索（MMseqs2 · PDB seqres + UniProt），按匹配可信度排序',
  items: [
    { id: '2FJF', title: 'G6 Fab（未结合）', crystal: true, identity: 99.2, db: 'RCSB', url: 'https://www.rcsb.org/structure/2FJF' },
    { id: '1CZ8', title: 'Y0317 Fab · VEGF', crystal: true, identity: 81.4, db: 'RCSB', url: 'https://www.rcsb.org/structure/1CZ8' },
    { id: '2FJH', title: 'B20-4 Fab · VEGF', crystal: true, identity: 76.8, db: 'RCSB', url: 'https://www.rcsb.org/structure/2FJH' },
    { id: '1BJ1', title: 'Fab-12 · VEGF', crystal: true, identity: 74.3, db: 'RCSB', url: 'https://www.rcsb.org/structure/1BJ1' },
    { id: 'P15692', title: 'VEGFA_HUMAN（抗原）', crystal: false, identity: 100, db: 'UniProt', url: 'https://www.uniprot.org/uniprotkb/P15692/entry' },
  ],
};

// ---------- annotations ----------
export const SCHEMES = ['IMGT', 'Kabat', 'Chothia', 'AHo'] as const;
export type Scheme = (typeof SCHEMES)[number];
export type CdrRange = { id: string; name: string; chain: 'H' | 'L'; from: number; to: number };

const kabatFromRegions: CdrRange[] = REGIONS.filter(r => r.id !== 'ep').map(r => {
  const nums = r.labels.map(l => Number(l.split(':')[1]));
  return { id: r.id, name: r.name, chain: r.labels[0][0] as 'H' | 'L', from: Math.min(...nums), to: Math.max(...nums) };
});
const cdr = (h: [number, number][], l: [number, number][]): CdrRange[] => [
  ...h.map(([from, to], i) => ({ id: `h${i + 1}`, name: `CDR-H${i + 1}`, chain: 'H' as const, from, to })),
  ...l.map(([from, to], i) => ({ id: `l${i + 1}`, name: `CDR-L${i + 1}`, chain: 'L' as const, from, to })),
];
/**
 * CDR boundaries on the structure's auth numbering. Kabat mirrors model.ts REGIONS so 3D lenses agree.
 * IMGT / Chothia / AHo are approximations shifted from Kabat the way those schemes usually differ — not ANARCI output.
 */
export const CDRS: Record<Scheme, CdrRange[]> = {
  Kabat: kabatFromRegions,
  IMGT: cdr([[26, 33], [51, 58], [97, 109]], [[27, 32], [50, 52], [89, 97]]),
  Chothia: cdr([[26, 32], [52, 56], [99, 109]], [[24, 34], [50, 56], [89, 97]]),
  AHo: cdr([[25, 35], [50, 60], [97, 110]], [[24, 35], [49, 57], [88, 98]]),
};
export const EPITOPE: string[] = REGIONS.find(r => r.id === 'ep')?.labels ?? [];

export type AnnotationGroup = { id: string; name: string; kind: 'cdr' | 'epitope' | 'chain'; chain: string; labels: string[]; range: string };
export function annotationGroups(chains: ChainInfo[], scheme: Scheme): AnnotationGroup[] {
  const all = resolveChains(chains);
  const chainLabels = (id: string) => all.find(c => c.auth === id)?.residues.map(r => `${id}:${r.seq}`) ?? [];
  const span = (labels: string[]) => { const n = labels.map(l => Number(l.split(':')[1])); return labels.length ? `${labels[0][0]}:${Math.min(...n)}–${Math.max(...n)}` : ''; };
  const h = chainLabels('H'), l = chainLabels('L');
  return [
    ...CDRS[scheme].map(r => ({ id: r.id, name: r.name, kind: 'cdr' as const, chain: r.chain, labels: range(r.chain, r.from, r.to), range: `${r.chain}:${r.from}–${r.to}` })),
    { id: 'ep', name: '表位 Epitope', kind: 'epitope', chain: 'V', labels: EPITOPE, range: compactLabels(EPITOPE) },
    { id: 'heavy', name: '重链 Heavy', kind: 'chain', chain: 'H', labels: h, range: span(h) },
    { id: 'light', name: '轻链 Light', kind: 'chain', chain: 'L', labels: l, range: span(l) },
  ];
}
export function cdrOf(label: string, scheme: Scheme) {
  const [c, n] = label.split(':'); const num = Number(n);
  return CDRS[scheme].find(r => r.chain === c && num >= r.from && num <= r.to);
}

// ---------- interactions ----------
export const INTERACTION_TYPES = ['氢键', '盐桥', 'π–π', 'π–阳离子', '疏水'] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];
export type Interaction = { id: string; type: InteractionType; a: string; b: string; dist: number; atomA?: string; atomB?: string; origin: 'demo' | 'structure' };
/** Colour + dash per interaction type (same hues as the MOS network). */
export const INTERACTION_STYLE: Record<InteractionType, { color: string; dash: string; hint: string }> = {
  '氢键': { color: '#4DBBA8', dash: '5 3', hint: '供体–受体 ≤ 3.5 Å' },
  '盐桥': { color: '#E0603E', dash: '', hint: '异号带电基团 ≤ 4.0 Å' },
  'π–π': { color: '#E2804A', dash: '1.5 3', hint: '芳香环堆积 ≤ 5.5 Å' },
  'π–阳离子': { color: '#D9A53B', dash: '7 3 1.5 3', hint: '芳香环–阳离子 ≤ 6.0 Å' },
  '疏水': { color: '#8A8A8A', dash: '2 4', hint: '非极性碳原子 ≤ 4.0 Å' },
};

/** Every contact comes from model.ts CONTACTS, which are measured on the deposited 2FJG coordinates. */
export const INTERACTIONS: Interaction[] = CONTACTS.map((c, i) => ({ ...c, id: `c${i}`, origin: 'structure' as const }));
export const interactionCounts = () => {
  const out = Object.fromEntries(INTERACTION_TYPES.map(t => [t, 0])) as Record<InteractionType, number>;
  for (const i of INTERACTIONS) out[i.type] += 1;
  return out;
};

export type Chem = 'aromatic' | 'basic' | 'acidic' | 'polar' | 'hydrophobic' | 'sulfur';
export const CHEM: Record<Chem, { name: string; color: string }> = {
  aromatic: { name: '芳香', color: '#2BB7C9' },
  basic: { name: '碱性', color: '#5B7CE6' },
  acidic: { name: '酸性', color: '#E26A3D' },
  polar: { name: '极性', color: '#26B3A8' },
  hydrophobic: { name: '疏水', color: '#6CC04A' },
  sulfur: { name: '含硫', color: '#D9B23B' },
};
export function chemistry(code: string): Chem {
  if ('FWY'.includes(code)) return 'aromatic';
  if ('KRH'.includes(code)) return 'basic';
  if ('DE'.includes(code)) return 'acidic';
  if ('STNQ'.includes(code)) return 'polar';
  if ('CM'.includes(code)) return 'sulfur';
  return 'hydrophobic';
}

// ---------- developability liabilities ----------
export type Severity = 'high' | 'medium' | 'low';
export type Liability = { id: string; rule: string; name: string; chain: string; from: number; to: number; motif: string; region: string; inCdr: boolean; severity: Severity; labels: string[] };

// Ported from components/hero/mmetrics-insights.ts. `critical` motifs matter wherever they sit; `cdrOnly` motifs are reported inside CDRs only.
const RULES: { key: string; name: string; pattern: RegExp; critical: boolean; cdrOnly?: boolean }[] = [
  { key: 'glyc', name: 'N-糖基化 N-x-S/T', pattern: /N[^P][ST]/y, critical: true },
  { key: 'deamG', name: '脱酰胺 NG', pattern: /NG/y, critical: true },
  { key: 'deam', name: '脱酰胺 NS/NT/NH', pattern: /N[STH]/y, critical: false },
  { key: 'isoG', name: '异构化 DG', pattern: /DG/y, critical: true },
  { key: 'iso', name: '异构化 DS/DT/DD/DH', pattern: /D[STDH]/y, critical: false },
  { key: 'cleave', name: '酸性裂解 DP', pattern: /DP/y, critical: false },
  { key: 'oxM', name: '氧化 Met', pattern: /M/y, critical: false, cdrOnly: true },
  { key: 'oxW', name: '氧化 Trp', pattern: /W/y, critical: false, cdrOnly: true },
];
/** Variable-domain ends (auth numbering) — liabilities are scanned in VH / VL, as MMetrics does. */
const V_END: Record<string, number> = { H: 120, L: 107 };
/** Cys pairs of the canonical intradomain disulfides (H22–H96, L23–L88); any other Cys in VH/VL is unpaired. */
const PAIRED_CYS = new Set(['H:22', 'H:96', 'L:23', 'L:88']);

export function scanLiabilities(chains: ChainInfo[], scheme: Scheme): Liability[] {
  const out: Liability[] = [];
  for (const chain of resolveChains(chains).filter(c => c.auth in V_END)) {
    const res = chain.residues.filter(r => r.seq <= V_END[chain.auth]);
    const seq = res.map(r => r.code || ONE[r.name] || 'X').join('');
    const push = (rule: string, name: string, i: number, len: number, critical: boolean) => {
      const labels = res.slice(i, i + len).map(r => `${chain.auth}:${r.seq}`);
      const hit = labels.map(l => cdrOf(l, scheme)).find(Boolean);
      const severity: Severity = critical && hit ? 'high' : critical || hit ? 'medium' : 'low';
      out.push({ id: `${labels[0]}-${rule}`, rule, name, chain: chain.auth, from: res[i].seq, to: res[i + len - 1].seq, motif: seq.slice(i, i + len), region: hit?.name ?? '框架区 FR', inCdr: !!hit, severity, labels });
    };
    for (const rule of RULES) {
      for (let i = 0; i < seq.length; i++) {
        rule.pattern.lastIndex = i;
        const m = rule.pattern.exec(seq);
        if (!m) continue;
        if (rule.cdrOnly && !cdrOf(`${chain.auth}:${res[i].seq}`, scheme)) continue;
        push(rule.key, rule.name, i, m[0].length, rule.critical);
      }
    }
    res.forEach((r, i) => { if (seq[i] === 'C' && !PAIRED_CYS.has(`${chain.auth}:${r.seq}`)) push('cys', '游离 Cys', i, 1, true); });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.chain.localeCompare(b.chain) || a.from - b.from);
}

// ---------- mutation scoring ----------
export const MUTATION_FILES = [
  { file: 'MutXseq.csv', name: '序列维度', hint: '蛋白语言模型对序列特征的打分，越高越有利', unit: 'log-odds' },
  { file: 'MutXstruct.csv', name: '结构维度', hint: '结合三维结构与残基环境的 ΔΔG，越低越有利', unit: 'kcal/mol' },
  { file: 'MutXevo.csv', name: '进化维度', hint: '基于同源序列保守性的可接受度，越高越有利', unit: 'score' },
] as const;
export type MutationFile = (typeof MUTATION_FILES)[number]['file'];
export type ScoreTable = { title: string; columns: string[]; rows: (string | number)[][] };

/** Scored positions: Kabat CDRs of H/L plus every antibody-side interface residue. */
function scoredPositions() {
  const set = new Set<string>([...CDRS.Kabat.flatMap(r => range(r.chain, r.from, r.to)), ...INTERACTIONS.map(i => i.a)]);
  return [...set].sort((x, y) => x[0].localeCompare(y[0]) || Number(x.split(':')[1]) - Number(y.split(':')[1]));
}
/** Demo scores derived deterministically from model.ts helpers: top 3 substitutions per position, best first. */
export function mutationTable(file: MutationFile, chains: ChainInfo[]): ScoreTable {
  const rows: { chain: string; mutation: string; score: number }[] = [];
  for (const label of scoredPositions()) {
    const [chain, n] = label.split(':');
    const wt = resCode(chains, label);
    for (const m of ddgScan(label, wt).slice(0, 3)) {
      const score = file === 'MutXstruct.csv' ? m.ddg
        : file === 'MutXseq.csv' ? +(0.4 - stability(label, m.to) * 0.8 - conservation(label) * 1.5).toFixed(3)
        : +((1 - conservation(label)) * 2.2 - 1 + stability(label, `${m.to}evo`) * 0.25).toFixed(3);
      rows.push({ chain, mutation: `${wt}${n}${m.to}`, score });
    }
  }
  rows.sort((a, b) => (file === 'MutXstruct.csv' ? a.score - b.score : b.score - a.score));
  return { title: file, columns: ['chain', 'mutation', 'score'], rows: rows.map(r => [r.chain, r.mutation, r.score]) };
}

export function toCsv(t: { columns: string[]; rows: (string | number)[][] }) {
  const cell = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [t.columns, ...t.rows].map(r => r.map(cell).join(',')).join('\n');
}
