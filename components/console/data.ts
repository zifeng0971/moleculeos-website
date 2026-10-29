/** Prototype data for the console. Everything here is demo content; the shapes are what a real backend would fill. */
export type Role = 'Owner' | 'Editor' | 'Viewer';
export type StructureDef = {
  id: string; name: string; title: string; src: string; format?: 'mmcif' | 'pdb'; source: string;
  colors: Record<string, string>; hiddenChains?: string[];
  chainNames: Record<string, string>;
  insights: Insights;
};
export type Project = { id: string; name: string; desc: string; role: Role; updated: string; structures: StructureDef[]; groups: Group[] };
export type Group = { id: string; name: string; kind: 'annotation' | 'neighbors'; labels: string[]; desc: string };

export type Insights = {
  kind: string; confidence: number; summary: string; basis: string[];
  homologs: { id: string; note?: string; identity: number; ref: string }[];
  regions: { name: string; labels: string[]; tone: string }[];
  contacts: { type: string; a: string; b: string; dist: number }[];
};

export type ModelDef = {
  id: string; name: string; goal: Goal; summary: string; needs: Need[]; eta: string;
};
export type Goal = 'predict' | 'design' | 'score' | 'evaluate' | 'search';
export type Need = 'sequence' | 'residues' | 'ligand' | 'structure';

export const GOALS: { id: Goal; label: string; hint: string }[] = [
  { id: 'predict', label: 'Predict', hint: 'Fold a sequence into a 3D structure' },
  { id: 'design', label: 'Design', hint: 'Generate new sequences, binders, pockets' },
  { id: 'score', label: 'Score mutations', hint: 'Rank every possible substitution' },
  { id: 'evaluate', label: 'Evaluate', hint: 'Estimate binding and affinity' },
  { id: 'search', label: 'Search', hint: 'Find homologous proteins' },
];

export const MODELS: ModelDef[] = [
  { id: 'mmfold', name: 'Structure prediction', goal: 'predict', summary: 'MMFold predicts a 3D structure from sequence using MSA and evolutionary signal. Returns three PDB candidates.', needs: ['sequence'], eta: '~8 min' },
  { id: 'redesign', name: 'Sequence redesign', goal: 'design', summary: 'Redesign sequences on a fixed backbone. Keep chosen positions, redesign the rest for stability or activity.', needs: ['structure', 'residues'], eta: '~12 min' },
  { id: 'binder', name: 'Binder design', goal: 'design', summary: 'Design a protein binder against a target surface or active site.', needs: ['structure', 'residues'], eta: '~25 min' },
  { id: 'pocket', name: 'Pocket design', goal: 'design', summary: 'Re-shape a binding pocket around a ligand to improve fit and specificity.', needs: ['structure', 'ligand'], eta: '~15 min' },
  { id: 'seqfit', name: 'Mutation effect · sequence fitness', goal: 'score', summary: 'Score every substitution with a sequence-based fitness model. Higher is better.', needs: ['sequence'], eta: '~3 min' },
  { id: 'evo', name: 'Mutation effect · evolutionary', goal: 'score', summary: 'MSA-based fitness: how tolerated is each substitution across homologs?', needs: ['sequence'], eta: '~6 min' },
  { id: 'stability', name: 'Mutation effect · stability', goal: 'score', summary: 'Structure-based stability change for every possible mutation.', needs: ['structure'], eta: '~5 min' },
  { id: 'seqsim', name: 'Homolog search (SeqSim)', goal: 'search', summary: 'Search external databases for homologous proteins. Reveals conserved positions and function.', needs: ['sequence'], eta: '~2 min' },
  { id: 'affinity', name: 'Protein–ligand affinity', goal: 'evaluate', summary: 'Statistical-physics estimate of binding affinity for a protein–ligand pair.', needs: ['structure', 'ligand'], eta: '~4 min' },
];

const FAB = { L: '#7c8cff', H: '#f4a340', V: '#ff6fae', A: '#7c8cff', B: '#f4a340', W: '#ff6fae' };

const range = (chain: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${chain}:${from + i}`);

export const STRUCTURE_2FJG: StructureDef = {
  id: '2fjg', name: '2FJG', title: 'G6 Fab · VEGF-A complex', src: '/demo/2fjg.cif', source: 'PDB 2FJG',
  colors: FAB, hiddenChains: ['A', 'B', 'W'],
  chainNames: { L: 'Fab light chain', H: 'Fab heavy chain', V: 'VEGF-A', A: 'Fab light chain (copy 2)', B: 'Fab heavy chain (copy 2)', W: 'VEGF-A (copy 2)' },
  insights: {
    kind: 'Antibody–antigen complex', confidence: 0.96,
    summary: 'Phage-derived G6 Fab bound to the receptor-binding domain of VEGF-A. Heavy and light chains form the paratope; VEGF-A dimerises on the opposite face.',
    basis: ['Two chains with variable/constant Ig folds', 'Third chain annotated as VEGF-A', 'Interface buries a CDR-rich surface'],
    homologs: [
      { id: '2FJF', note: 'crystal', identity: 99.2, ref: 'RCSB PDB' },
      { id: '1CZ8', note: 'crystal', identity: 81.4, ref: 'RCSB PDB' },
      { id: '2FJH', note: 'crystal', identity: 76.8, ref: 'RCSB PDB' },
      { id: '1BJ1', note: 'crystal', identity: 62.3, ref: 'RCSB PDB' },
      { id: '6BFT', identity: 51.1, ref: 'UniProt' },
    ],
    regions: [
      { name: 'CDR-H1', labels: range('H', 26, 35), tone: '#f4a340' },
      { name: 'CDR-H2', labels: range('H', 50, 65), tone: '#f4a340' },
      { name: 'CDR-H3', labels: range('H', 95, 102), tone: '#f4a340' },
      { name: 'CDR-L1', labels: range('L', 24, 34), tone: '#7c8cff' },
      { name: 'CDR-L2', labels: range('L', 50, 56), tone: '#7c8cff' },
      { name: 'CDR-L3', labels: range('L', 89, 97), tone: '#7c8cff' },
      { name: 'Epitope', labels: range('V', 63, 70), tone: '#ff6fae' },
    ],
    contacts: [
      { type: 'H-bond', a: 'H:Tyr53', b: 'V:Asp63', dist: 2.8 },
      { type: 'H-bond', a: 'H:Arg99', b: 'V:Glu64', dist: 2.7 },
      { type: 'π–π stack', a: 'L:Tyr91', b: 'V:Phe17', dist: 4.1 },
      { type: 'π–cation', a: 'H:Trp100', b: 'V:Lys16', dist: 4.6 },
      { type: 'H-bond', a: 'L:Ser92', b: 'V:Gln22', dist: 3.0 },
    ],
  },
};

export const STRUCTURE_5XH3: StructureDef = {
  id: '5xh3', name: '5XH3', title: 'PET hydrolase · HEMT', src: '/demo/5xh3.cif', source: 'PDB 5XH3',
  colors: { A: '#37c8a0' },
  chainNames: { A: 'PET hydrolase R103G/S131A' },
  insights: {
    kind: 'Enzyme + small molecule', confidence: 0.98,
    summary: 'IsPETase double mutant in complex with the HEMT substrate analogue. The ligand sits in a shallow cleft lined by the catalytic triad.',
    basis: ['Single polymer chain with α/β-hydrolase fold', 'HETATM ligand HEMT in a surface cleft', 'Catalytic Ser/Asp/His arrangement'],
    homologs: [
      { id: '5XFY', note: 'crystal', identity: 99.6, ref: 'RCSB PDB' },
      { id: '6ILW', note: 'crystal', identity: 98.4, ref: 'RCSB PDB' },
      { id: '5XJH', note: 'crystal', identity: 97.9, ref: 'RCSB PDB' },
      { id: '4EB0', note: 'crystal', identity: 55.2, ref: 'RCSB PDB' },
      { id: 'A0A0K8P6T7', identity: 100, ref: 'UniProt' },
    ],
    regions: [
      { name: 'Active site', labels: ['A:131', 'A:177', 'A:208'], tone: '#ff6fae' },
      { name: 'Binding cleft', labels: ['A:58', 'A:132', 'A:156', 'A:209'], tone: '#f4a340' },
      { name: 'Mutations', labels: ['A:103', 'A:131'], tone: '#7c8cff' },
    ],
    contacts: [
      { type: 'H-bond', a: 'HEMT O1', b: 'A:Ala131', dist: 2.9 },
      { type: 'H-bond', a: 'HEMT O3', b: 'A:Met132', dist: 3.1 },
      { type: 'π–π stack', a: 'HEMT ring', b: 'A:Trp156', dist: 3.8 },
      { type: 'π–π stack', a: 'HEMT ring', b: 'A:Tyr58', dist: 4.3 },
    ],
  },
};

export const PROJECTS: Project[] = [
  {
    id: 'ab', name: 'Antibody Design', desc: 'Affinity maturation of a VEGF-A binder', role: 'Owner', updated: '2 h ago',
    structures: [STRUCTURE_2FJG],
    groups: [
      { id: 'g1', name: 'CDR-H3 hotspot', kind: 'annotation', labels: range('H', 98, 102), desc: 'Saved from literature' },
      { id: 'g2', name: 'Paratope core', kind: 'annotation', labels: ['H:53', 'H:99', 'L:91', 'L:92'], desc: 'Interface residues' },
    ],
  },
  {
    id: 'pet', name: 'PET hydrolase engineering', desc: 'Thermostability of IsPETase variants', role: 'Editor', updated: 'Yesterday',
    structures: [STRUCTURE_5XH3],
    groups: [{ id: 'g3', name: 'Catalytic triad', kind: 'annotation', labels: ['A:131', 'A:177', 'A:208'], desc: 'Ser–Asp–His' }],
  },
];

export const MOCHA_SAMPLES = [
  { id: 'humanize', icon: 'humanize', title: 'Humanization', body: 'Reduce immunogenicity of a heterologous antibody while keeping antigen binding.' },
  { id: 'affinity', icon: 'affinity', title: 'Binding affinity', body: 'Predict binding free energy and recommend mutations that raise affinity.' },
  { id: 'homology', icon: 'homology', title: 'Sequence homology', body: 'Find evolutionary relatives across sequence databases.' },
  { id: 'epitope', icon: 'epitope', title: 'Epitope analysis', body: 'Map interacting residues and pinpoint key antigenic determinants.' },
] as const;

/** Deterministic score matrix for the mutation-effect result view. */
export function scoreMatrix(seed: number, cols: number) {
  const rows = 20; let s = seed;
  const next = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => (next() - 0.62) * 6));
}
export const AMINO = 'ACDEFGHIKLMNPQRSTVWY'.split('');

export type TaskStatus = 'queued' | 'running' | 'done';
export type Task = {
  id: string; name: string; modelId: string; status: TaskStatus; progress: number;
  by: 'you' | 'mocha'; structure: string; input: string; created: number;
};
export type Toast = { id: number; text: string; tone?: 'ok' | 'info' };
