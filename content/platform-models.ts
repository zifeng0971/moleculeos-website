// Copy for /platform ("Platform & models"). Facts and figures are taken from the MoleculeMind technical white paper
// (external edition); the data status line under each block repeats the white paper's own scope notes.
import type { Locale } from '@/lib/site-config';

type Stat = { value: string; label: string };
type Engine = { id: string; name: string; kind: string; tone: 'structure' | 'design' | 'agent'; body: string; stats: Stat[]; note?: string; report?: { label: string; href: string } };
type Skill = { name: string; kind: string; body: string; result: string };
type Copy = {
  eyebrow: string; title: string; lead: string;
  anchors: { overview: string; models: string; engineering: string; platform: string };
  stack: { name: string; body: string }[];
  modelsTitle: string; modelsLead: string; engines: Engine[];
  engineeringTitle: string; engineeringLead: string; skills: Skill[];
  platformTitle: string; platformLead: string; platformPoints: string[];
};

const zh: Copy = {
  eyebrow: '平台与模型',
  title: '读懂分子，设计分子，驱动研发',
  lead: 'MMFold 读懂结构，MMDesign 设计分子，QuantaMind 模拟反应；\n在这些模型之上沉淀出抗体与蛋白工程能力，由 MoleculeOS 统一调用。',
  anchors: { overview: '概览', models: '核心模型', engineering: '工程能力', platform: 'MoleculeOS' },
  stack: [
    { name: '基础模型', body: '自研结构与序列基础模型' },
    { name: '核心引擎', body: '结构预测、蛋白设计、分子模拟、序列优化' },
    { name: '应用工程', body: '抗体与蛋白工程' },
    { name: 'MoleculeOS', body: '统一的平台与对话式入口' },
  ],
  modelsTitle: '核心模型',
  modelsLead: '读懂结构，设计分子，并在原子尺度上模拟反应。',
  engines: [
    {
      id: 'mmfold', name: 'MMFold', kind: '结构预测', tone: 'structure',
      body: '高性能结构预测引擎，全原子建模，并针对抗体-抗原复合物专门调优。输入序列，直接得到结构和 pLDDT 置信度，用于未知蛋白建模、突变体结构复核和从头设计验证。',
      stats: [{ value: '72.5%', label: 'Top-1 可接受率' }, { value: '78.8%', label: 'Top-5 可接受率' }, { value: '70.0% / 65.0%', label: '对照：OpenDDE / Protenix-v2' }],
    },
    {
      id: 'mmdesign', name: 'MMDesign', kind: '蛋白从头设计', tone: 'design',
      body: '从靶点和指定表位出发，生成数万个候选，经结构可靠性、序列自然度和统计物理结合打分层层筛选，只留几十个做实验。已覆盖纳米抗体（VHH）、跨膜的 GPCR 靶点和大环肽。',
      stats: [{ value: '18 / 19', label: '设计任务获得经实验确认的结合分子' }, { value: '6 / 6', label: '测试的 GPCR 均获得结合分子，NK3R 30/30 全部阳性' }, { value: '9–50', label: '每个任务实验测试的候选数' }],
      note: '口径：19 个设计任务、18 个靶点；成功指至少获得 1 个经实验确认的结合分子 · 公司实验验证结果',
      report: { label: '阅读技术报告', href: 'https://zenodo.org/records/23321531' },
    },
    {
      id: 'quantamind', name: 'QuantaMind', kind: '分子模拟', tone: 'agent',
      body: '融合 AI、分子动力学与量子化学的机器学习力场，基于高精度 DFT 数据训练，在反应动力学模拟中兼顾 DFT 级精度与分子动力学级速度。成果发表于 Science Advances。',
      stats: [{ value: '10 万+', label: '原子规模，单步 0.25 s' }, { value: '千亿倍', label: '相对传统 DFT 的加速量级' }],
      note: '来源：Science Advances（Sci. Adv. 12, eaeg3595, 2026）· 已发表 + 公司评测',
      report: { label: '阅读论文', href: 'https://doi.org/10.1126/sciadv.aeg3595' },
    },
  ],
  engineeringTitle: '工程能力',
  engineeringLead: '把模型用在真实的研发问题上，下面是各项的代表性结果或能力。',
  skills: [
    { name: '抗体人源化', kind: '抗体工程', body: '自回归扩散模型同时生成重链与轻链候选，提升人源化程度并保持结合。单轮设计分钟级完成。', result: '人源化度 29 → 64，相对滴度 100% → 293%' },
    { name: '可开发性改造', kind: '抗体工程', body: '覆盖 12 大类 PTM 风险的扫描与评估，结合稳定性优化和虚拟亲和力成熟。', result: '风险扫描可批量处理，并推荐最安全的 5 个候选' },
    { name: 'pH 敏感性设计', kind: '抗体工程', body: '以组氨酸工程实现 pH 门控结合，用于肿瘤微环境靶向、FcRn 回收和前药设计。', result: 'pH 6.0 下解离速率约为 pH 7.4 的 62 倍' },
    { name: '酶稳定性与活性改造', kind: '酶工程', body: '从基因组挖掘到多轮突变设计，在稳定性、活性、表达量等目标之间做多目标优化。', result: '代糖酶半衰期 2.3 h → 200 h，Tm +15 ℃' },
    { name: 'PISCO 密码子优化', kind: '序列优化', body: '融合序列、三维结构和宿主密码子统计，生成宿主特异的密码子序列。', result: '毕赤酵母中 12/13 候选可溶表达提升' },
  ],
  platformTitle: 'MoleculeOS：统一的入口',
  platformLead: '结构预测、蛋白设计、酶发现与人源化统一在一个平台里，由 Mocha 对话式界面调用，降低使用门槛。',
  platformPoints: ['每一步的输入、结果和理由都留在项目里，随时检查和复用', '蛋白质工具矩阵随平台发布：SAbDab Visualization、MMFold Server、Developability Liabilities', '覆盖抗体、ADC、TCE、大环肽和前药设计'],
};

const en: Copy = {
  eyebrow: 'Platform & models',
  title: 'Read molecules, design molecules, drive R&D',
  lead: 'MMFold reads structure, MMDesign designs molecules and QuantaMind simulates reactions.\nAntibody and protein engineering capabilities are built on these models and called together through MoleculeOS.',
  anchors: { overview: 'Overview', models: 'Core models', engineering: 'Engineering', platform: 'MoleculeOS' },
  stack: [
    { name: 'Foundation models', body: 'In-house structure and sequence models' },
    { name: 'Core engines', body: 'Structure prediction, protein design, molecular simulation, sequence optimization' },
    { name: 'Applied engineering', body: 'Antibody and protein engineering' },
    { name: 'MoleculeOS', body: 'One platform, one conversational entry' },
  ],
  modelsTitle: 'Core models',
  modelsLead: 'Read structure, design molecules, and simulate reactions at atomic scale.',
  engines: [
    {
      id: 'mmfold', name: 'MMFold', kind: 'Structure prediction', tone: 'structure',
      body: 'A high-performance structure predictor with all-atom modeling, tuned for antibody–antigen complexes. Give it a sequence and get a structure with pLDDT confidence, for unknown proteins, mutant structure checks and de novo design validation.',
      stats: [{ value: '72.5%', label: 'Top-1 acceptable rate' }, { value: '78.8%', label: 'Top-5 acceptable rate' }, { value: '70.0% / 65.0%', label: 'Compared with OpenDDE / Protenix-v2' }],
    },
    {
      id: 'mmdesign', name: 'MMDesign', kind: 'De novo protein design', tone: 'design',
      body: 'From a target and a specified epitope it generates tens of thousands of candidates, ranks them on structural reliability, sequence naturalness and physics-based binding scores, and sends only a few dozen to the lab. It covers nanobodies (VHH), membrane GPCR targets and macrocycles.',
      stats: [{ value: '18 / 19', label: 'campaigns with an experimentally confirmed binder' }, { value: '6 / 6', label: 'GPCRs tested gave binders, NK3R 30/30 positive' }, { value: '9–50', label: 'candidates tested per campaign' }],
      note: 'Basis: 19 campaigns on 18 targets; success means at least one experimentally confirmed binder · company validation',
      report: { label: 'Read the technical report', href: 'https://zenodo.org/records/23321531' },
    },
    {
      id: 'quantamind', name: 'QuantaMind', kind: 'Molecular simulation', tone: 'agent',
      body: 'A machine-learned force field that blends AI, molecular dynamics and quantum chemistry. Trained on high-accuracy DFT data, it offers DFT-level accuracy at molecular-dynamics speed for reaction simulations. Published in Science Advances.',
      stats: [{ value: '100k+', label: 'atoms, 0.25 s per step' }, { value: '~10¹¹×', label: 'speed-up over conventional DFT' }],
      note: 'Source: Science Advances (Sci. Adv. 12, eaeg3595, 2026) · published + company evaluation',
      report: { label: 'Read the paper', href: 'https://doi.org/10.1126/sciadv.aeg3595' },
    },
  ],
  engineeringTitle: 'Engineering capabilities',
  engineeringLead: 'The models applied to real R&D problems, with a representative result or capability for each.',
  skills: [
    { name: 'Antibody humanization', kind: 'Antibody engineering', body: 'An autoregressive diffusion model generates heavy and light chains together, raising humanness while keeping binding. One design round takes minutes.', result: 'Humanness 29 → 64, relative titer 100% → 293%' },
    { name: 'Developability', kind: 'Antibody engineering', body: 'Scans and assesses 12 classes of PTM risk, with stability optimization and virtual affinity maturation.', result: 'Batch risk scans that recommend the 5 safest candidates' },
    { name: 'pH-sensitive design', kind: 'Antibody engineering', body: 'Histidine engineering for pH-gated binding, used in tumor-microenvironment targeting, FcRn recycling and prodrugs.', result: 'Off-rate at pH 6.0 about 62× that at pH 7.4' },
    { name: 'Enzyme stability and activity', kind: 'Enzyme engineering', body: 'From genome mining to multi-round mutant design, optimizing stability, activity and expression together.', result: 'Sugar-substitute enzyme half-life 2.3 h → 200 h, Tm +15 °C' },
    { name: 'PISCO codon optimization', kind: 'Sequence optimization', body: 'Combines sequence, 3D structure and host codon statistics to produce host-specific codon sequences.', result: '12 of 13 candidates raised soluble expression in Pichia' },
  ],
  platformTitle: 'MoleculeOS: one entry point',
  platformLead: 'Structure prediction, protein design, enzyme discovery and humanization live in one platform, called through the Mocha conversational interface.',
  platformPoints: ['Every step’s input, result and rationale stays in the project, ready to inspect and reuse', 'A protein tool set ships with the platform: SAbDab Visualization, MMFold Server, Developability Liabilities', 'Covers antibodies, ADCs, TCEs, macrocyclic peptides and prodrug design'],
};

export const PLATFORM_COPY: Record<Locale, Copy> = { zh, en };
