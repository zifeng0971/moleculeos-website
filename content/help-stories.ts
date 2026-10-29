// Computational case studies shown in the help center. Figures come from the project write-ups; two items are still to
// be confirmed with the authors (see the README note in the PR): the 7RGP interface buried area and the 11,267 scan size.
export type Tile = { label: string; value: string; unit?: string };
export type Verdict = 'no' | 'ok' | 'warn';
export type Link = { label: string; href: string };
export type MmStory = { tab: string; tag: string; title: string; lead: string; steps: { tag: string; title: string; body: string }[]; demoLabel: string };
export type StoryText = {
  tab: string; tag: string; title: string; subtitle: string; intro: string; tiles: Tile[];
  steps: { title: string; lead: string; takeaway?: string; tags?: string[] }[];
  headers: Record<string, string>;
  anchors?: { tag: string; pair: string; detail: string }[];
  conclusionTitle: string; conclusion: string; note: string; flow: Link[]; flowLabel: string;
};

export const GLP = {
  mutations: [
    { id: 'Y1M', seq: 5.52, ddg: 1.57, seqLabel: '+5.52 (Top 1)', ddgLabel: '+1.57', verdict: 'no' as Verdict },
    { id: 'F22G', seq: 3.78, ddg: 0.42, seqLabel: '+3.78 (Top 2)', ddgLabel: '+0.42', verdict: 'no' as Verdict },
    { id: 'V23W', seq: -1.32, ddg: -2.52, seqLabel: '−1.32', ddgLabel: '−2.52', verdict: 'ok' as Verdict },
    { id: 'F22K', seq: 2.22, ddg: -0.82, seqLabel: '+2.22', ddgLabel: '−0.82', verdict: 'ok' as Verdict },
  ],
  prediction: [
    { metric: '7TM Cα RMSD', wt: '1.17 Å', mut: '1.20 Å', better: 'wt' },
    { metric: 'ipTM', wt: '0.768', mut: '0.753', better: 'wt' },
    { metric: 'pLDDT', wt: '72.3', mut: '71.4', better: 'wt' },
  ],
  design: [{ label: '', value: '100', unit: 'aa' }, { label: '', value: '~82', unit: '%' }, { label: '', value: '2,254', unit: 'Å²' }, { label: '', value: '1/11', unit: '' }],
};

export const CLDN = {
  variants: [{ site: 'Ala42', a: 'Ala', b: 'Ser' }, { site: 'Asn45', a: 'Asn', b: 'Gln' }, { site: 'Glu56', a: 'Glu', b: 'Gln' }],
  accuracy: [
    { part: 'VH', rmsd: 0.84, aligned: '112/117', conf: 'pLDDT 95 · iPTM 0.95' },
    { part: 'VL', rmsd: 0.94, aligned: '111/113', conf: 'pLDDT 95 · iPTM 0.95' },
    { part: 'CLDN18.2', rmsd: 1.14, aligned: '140/171', conf: '—' },
  ],
  scan: { total: 11267, stable: 4809 },
  cross: [
    { id: 'VH CDR3 S99→L', aff: -1.21, stab: 2.51, pct: '99%', verdict: 'ok' as Verdict },
    { id: 'VL CDR3 F102→W', aff: -1.66, stab: -0.69, pct: '76%', verdict: 'warn' as Verdict },
    { id: 'CLDN18.2 A42→T / L', aff: -2.05, stab: -0.37, pct: '66–68%', verdict: 'warn' as Verdict, affLabel: '−2.05 / −1.97', stabLabel: '−0.37 / −0.45' },
    { id: 'VH CDR3 N103→Y', aff: -1.57, stab: -4.56, pct: '13%', verdict: 'no' as Verdict },
    { id: 'VH CDR3 N103→W', aff: -1.21, stab: -4.88, pct: '11%', verdict: 'no' as Verdict },
    { id: 'VL CDR1 N31→W', aff: -1.28, stab: -3.2, pct: '32%', verdict: 'no' as Verdict },
  ],
};

export const STORIES: Record<'zh' | 'en', { glp: StoryText & { text: Record<string, string> }; cldn: StoryText & { text: Record<string, string> }; mm: MmStory; verdict: Record<Verdict, string> }> = {
  zh: {
    verdict: { no: '否决', ok: '保留', warn: '存疑' },
    mm: {
      tab: 'MMetrics', tag: 'MMetrics · 4HT1', title: '围绕同一蛋白，追溯分析依据',
      lead: '基于 4HT1 序列的抗体—抗原复合物（MMFold 预测结构），从拿到结构到列出待验证的突变，每一步的依据都留在 MoleculeOS 的同一个项目里：下面的演示就是 MoleculeOS 里的 MMetrics 视图，可以直接拖动、点选。',
      steps: [
        { tag: 'MMFold · 蛋白管理', title: '载入结构', body: '从序列用 MMFold 预测结构，或通过 PDB ID、上传文件，把 4HT1 放进项目。' },
        { tag: 'MMetrics', title: '读懂分子', body: 'Description、Homologs 和 Annotations 给出链组成、同源蛋白和 CDR / 表位；点区域名称，结构里对应位置同步高亮。' },
        { tag: 'MMetrics · 互作', title: '检查互作与风险', body: '互作网络可以按 H-Bond、盐桥、π-π 等类型筛选；风险位点列出需要留意的序列基序。' },
        { tag: 'Mocha · Annotation', title: '提出候选并留给团队', body: '在推荐突变里查看示例候选的依据与风险，再交给 Mocha 做突变评分；关键位点用 Annotation 记录，团队成员打开项目就能定位。' },
      ],
      demoLabel: '基于 4HT1 序列的 MMFold 预测结构，与 MoleculeOS 里的 MMetrics 视图保持一致。推荐突变为示例，风险位点来自序列规则扫描，都不是实验验证。',
    },
    glp: {
      tab: '多肽设计', tag: 'GLP-1R · Tirzepatide', title: 'GLP-1R 多肽的突变评估与从头设计',
      subtitle: '以已上市药物为基准，在 MoleculeOS 的一个项目里走通从界面分析、突变打分到从头设计的完整链路',
      intro: 'GLP-1 受体是 2 型糖尿病和肥胖治疗的核心靶点，替尔泊肽（Tirzepatide）是 GIPR / GLP-1R 双受体激动剂。本案例以 PDB 7RGP（GLP-1R–替尔泊肽复合物，冷冻电镜）为实验基准。结构载入 MoleculeOS 项目后，界面分析用互作工具，评分和设计任务通过 Mocha 提交，预测验证用 MMFold，每一步的结果都在 Task 和 Workspace 里留档、可复查。',
      tiles: [{ label: '实验基准', value: 'PDB 7RGP' }, { label: '分辨率', value: '2.9', unit: 'Å' }, { label: '肽段长度', value: '39', unit: 'aa' }, { label: '界面埋藏面积', value: '1,735', unit: 'Å²' }],
      flowLabel: '用到的 MoleculeOS 功能',
      flow: [{ label: 'Non-Covalent Bond', href: '#case-5' }, { label: 'Mocha', href: '#case-1' }, { label: 'Mutation Scoring', href: '#case-6' }, { label: 'MMFold', href: '#case-2' }, { label: 'Task / Workspace', href: '#case-7' }],
      steps: [
        { tags: ['Non-Covalent Bond', 'Hotspots', 'Annotation'], title: '界面分析：先画出不能碰的区域', lead: '在 MoleculeOS 中载入 7RGP，用 Non-Covalent Bond 检查肽—受体界面的氢键、盐桥和疏水接触，再参考 Hotspots 的互作排序，找出 3 个关键锚点，用 Annotation 存进项目，作为后续设计的“禁区地图”：任何设计都不应破坏它们。' },
        { tags: ['Mocha', 'Mutation Scoring'], title: '多轴突变打分：序列轴与结构轴的分歧', lead: '通过 Mocha 对全部 741 个单点突变（39 个位置 × 19 种替换）提交序列适应度和结合亲和力两类评分任务，结果从 Output Data 取回，放进同一张表里比较。两个轴的结果出现明显冲突。', takeaway: '序列模型把“罕见”当成了“可改进”，给 Y1M 打出全场最高分；但结合亲和力模型给出正的 ddG（去稳定），而且 Y1M 会破坏 N 端氢键锚定。两轴冲突时，以结构轴为准。' },
        { tags: ['MMFold', 'Superimpose'], title: '结构预测验证：用实验结构做对照', lead: '用 MMFold 对野生型和 Y1M 变体分别预测复合物，再用 Superimpose 把预测结构对到实验结构 7RGP 上比较。', takeaway: 'Y1M 的三项指标都略有下降，与结构轴“否决 Y1M”的结论方向一致。差异本身很小，只作为佐证，不单独构成否决的依据。' },
        { tags: ['Mocha', 'MMFold', 'Task'], title: '从头设计：探索新的结合分子', lead: '以受体胞外域沟槽中的 11 个热点残基为约束，通过 Mocha 提交设计任务，得到 60–100 个残基的全新结合蛋白，进度在 Task 里跟踪。', takeaway: '新设计的界面埋藏面积（2,254 Å²）超过替尔泊肽（1,735 Å²），但只命中 1 / 11 个热点，说明这次生成没有准确落在沟槽中央。下一步可以更换随机种子、收紧热点约束、用 MMFold 批量筛选，再进入湿实验。' },
      ],
      headers: { variant: '突变', seq: '序列适应度', ddg: '结合 ΔΔG', struct: '结构依据', verdict: '判定', metric: '指标', wt: '野生型', mut: 'Y1M 变体', quadX: '序列适应度 →', quadY: '结合 ΔΔG', quadBad: '去稳定', quadGood: '增强', design: '设计长度|α 螺旋占比|界面埋藏|热点命中' },
      anchors: [{ tag: 'N 端锚定', pair: 'Tyr1 ↔ Gln257', detail: '氢键 · 2.6 Å · 埋藏 176 Å²' }, { tag: '盐桥网络', pair: 'Glu3 ↔ Arg213', detail: '盐桥 · 3.0–3.5 Å' }, { tag: '疏水核心', pair: 'Phe6 / Phe22', detail: '埋藏 130 / 104 Å²' }],
      text: { struct: '破坏 N 端氢键锚定|拆掉疏水核心|芳香填充空腔|两轴一致', predNote: 'ipTM 和 pLDDT 越高越好，RMSD 越低越好。' },
      conclusionTitle: '核心结论', conclusion: '序列轴初筛 → 结构轴过滤 → 结构预测验证：序列模型单独使用，会推出高风险的候选；多个维度交叉之后，才能得到值得实验验证的起点。在 MoleculeOS 里，这条链路是连续的：每一步的输入、结果和依据都留在同一个项目里，换一个靶点可以按同样的步骤再走一遍。AI 打分用来指路，最终要由实验确认。',
      note: '以上均为计算预测，尚未经过湿实验验证。',
    },
    cldn: {
      tab: '抗体亲和力成熟', tag: 'CLDN18.2 · Zolbetuximab', title: 'CLDN18.2 抗体的结构预测与亲和力成熟',
      subtitle: '以 2024 年获批的药物为案例，在 MoleculeOS 里检验抗体结构预测与突变筛选的可靠程度',
      intro: 'CLDN18.2 在胃癌中高表达。Zolbetuximab（Vyloy）于 2024 年获 FDA 批准，联合化疗用于 CLDN18.2 阳性、HER2 阴性晚期胃癌的一线治疗。本案例以 PDB 9V32（CLDN18.2–Zolbetuximab Fab 复合物，冷冻电镜）为实验基准。从只有序列开始，MoleculeOS 用 MMFold 预测结构，MMetrics 解读界面，亲和力与稳定性评分通过 Mocha 提交，结果放在同一个项目里交叉比较。',
      tiles: [{ label: '实验基准', value: 'PDB 9V32' }, { label: '分辨率', value: '4.1', unit: 'Å' }, { label: '表位残基', value: '11' }, { label: '突变扫描', value: '11,267', unit: '个' }],
      flowLabel: '用到的 MoleculeOS 功能',
      flow: [{ label: 'MMFold', href: '#case-2' }, { label: 'MMetrics', href: '#case-3' }, { label: 'Non-Covalent Bond', href: '#case-5' }, { label: 'Mocha', href: '#case-1' }, { label: 'Mutation Scoring', href: '#case-6' }],
      steps: [
        { tags: ['MMetrics', 'Non-Covalent Bond'], title: '结构解析：变体选择性的原子基础', lead: '在 MoleculeOS 中载入 9V32，用 MMetrics 的 Annotations 定位表位，再用 Non-Covalent Bond 检查抗体—抗原界面。表位核心包含 3 个 CLDN18.1 / CLDN18.2 的差异位点，这解释了 zolbetuximab 对变体的选择性。', takeaway: 'Asn45 的双氢键网络在 CLDN18.1（此处为 Gln45）上无法形成：选择性可以落实到具体的原子接触。' },
        { tags: ['MMFold', 'Superimpose'], title: '抗体预测：Fv 与复合物的重建', lead: '只输入 VH / VL 序列（117 / 113 aa），用 MMFold 独立完成 Fv 折叠与复合物组装，再用 Superimpose 对到实验冷冻电镜结构上，逐组分比较。', takeaway: '本例中 VH、VL 的 Cα RMSD 都小于 1 Å：没有实验结构时，可变区预测的精度可以支撑后续计算。表位重现 9 / 11（82%），可用于早期表位作图，为 binder 设计和双抗布局提供参考。' },
        { tags: ['Mocha', 'Mutation Scoring'], title: '亲和力打分：全部单点突变的全景扫描', lead: '通过 Mocha 创建亲和力评分任务，对复合物的全部单点突变打分，从 Output Data 取回结果，其中 4,809 个被预测为稳定化。有两个值得留意的现象：' },
        { tags: ['Mutation Scoring', 'Workspace'], title: '交叉验证：用稳定性评分过滤高风险候选', lead: '再用稳定性评分逐一检查亲和力排名靠前的候选，两份结果都在 Workspace 里，可以并排比对，找出亲和力模型看不到的结构风险。', takeaway: 'Asn103 是 CDR3 的氢键枢纽（4 个氢键）：亲和力模型看到“换成 Tyr 可以 π 堆积”，稳定性评分看到“环失去锚点、局部可能塌陷”。只看亲和力，会推出高风险的工程突变，多维度交叉才能把它们筛掉。' },
      ],
      headers: { site: '差异位点', a: 'CLDN18.2', b: 'CLDN18.1', role: '结构作用', part: '组分', rmsd: 'Cα RMSD', aligned: '比对残基', conf: '置信度', mut: '突变', aff: '亲和力 ΔΔG', stab: '稳定性分数', pct: '百分位', verdict: '判定', scanStable: '预测稳定化', scanAll: '全部单点突变', epitope: '表位重现' },
      text: { roles: '位于表位中心，侧链小，周围有空腔|与轻链 CDR1 Asn31 形成双氢键网络|与重链 Asn103 形成氢键，另有 Glu62–Lys36 盐桥', hot: '抗原侧 Ala42|19 种替换全部预测增强结合|ΔΔG −0.31 ~ −2.56 kcal/mol，芳香族最强。该位点在抗原上，用来理解界面的敏感程度，不是抗体的改造方案。', arom: '界面芳香化趋势|Phe102 → Trp · Asn103 → Tyr|大侧链芳香残基填充 CDR 与抗原之间的空腔。', cross: '' },
      conclusionTitle: '核心结论', conclusion: '预测 → 验证 → 设计：在 11,267 个突变扫描之后，只有 VH CDR3 Ser99→Leu 同时拿到强阳性的亲和力与稳定性评分（−1.21 / +2.51，99% 分位），其余高分项都被降级或否决。在 MoleculeOS 里，结构预测、界面解读和两类评分在同一个项目中衔接，每个结论都能回到具体的任务和结果文件。实验结构是检验预测的标准；单一维度的高分只是线索，多个维度的交集才是起点。',
      note: '以上均为计算预测，尚未经过湿实验验证。',
    },
  },
  en: {
    verdict: { no: 'Rejected', ok: 'Keep', warn: 'Doubtful' },
    mm: {
      tab: 'MMetrics', tag: 'MMetrics · 4HT1', title: 'Around one protein, trace the evidence behind the analysis',
      lead: 'One antibody–antigen complex (MMFold prediction from the 4HT1 sequences), from getting the structure to listing mutations worth testing, with the evidence for every step kept in the same MoleculeOS project. The demo below is the MMetrics view from MoleculeOS; drag and click it directly.',
      steps: [
        { tag: 'MMFold · Protein manager', title: 'Load the structure', body: 'Predict it from sequence with MMFold, or load 4HT1 into the project by PDB ID or file upload.' },
        { tag: 'MMetrics', title: 'Understand the molecule', body: 'Description, Homologs and Annotations give the chain composition, homologous proteins and CDRs / epitope; click a region name and the matching positions light up in the structure.' },
        { tag: 'MMetrics · Interactions', title: 'Check interactions and risks', body: 'Filter the interaction network by H-bond, salt bridge, π–π and more; the liabilities list flags sequence motifs worth watching.' },
        { tag: 'Mocha · Annotation', title: 'Propose candidates and hand over to the team', body: 'See the basis and risk of the example candidates under Suggestions, then hand them to Mocha for mutation scoring; record key sites with Annotation so teammates can jump straight to them.' },
      ],
      demoLabel: 'The MMFold-predicted structure from the 4HT1 sequences, matching the MMetrics view in MoleculeOS. Suggestions are examples and liabilities come from a sequence-rule scan; neither is experimentally validated.',
    },
    glp: {
      tab: 'Peptide design', tag: 'GLP-1R · Tirzepatide', title: 'Mutation assessment and de novo design for GLP-1R peptides',
      subtitle: 'Using an approved drug as the benchmark, run the whole chain from interface analysis to mutation scoring to de novo design inside one MoleculeOS project',
      intro: 'The GLP-1 receptor is a core target for type 2 diabetes and obesity, and tirzepatide is a dual GIPR / GLP-1R agonist. This case uses PDB 7RGP (the GLP-1R–tirzepatide complex, cryo-EM) as the experimental benchmark. Once the structure is in a MoleculeOS project, interface analysis uses the interaction tools, scoring and design jobs are submitted through Mocha, and prediction checks use MMFold; every result is kept in Task and Workspace and can be reviewed.',
      tiles: [{ label: 'Benchmark', value: 'PDB 7RGP' }, { label: 'Resolution', value: '2.9', unit: 'Å' }, { label: 'Peptide length', value: '39', unit: 'aa' }, { label: 'Buried interface', value: '1,735', unit: 'Å²' }],
      flowLabel: 'MoleculeOS features used',
      flow: [{ label: 'Non-Covalent Bond', href: '#case-5' }, { label: 'Mocha', href: '#case-1' }, { label: 'Mutation Scoring', href: '#case-6' }, { label: 'MMFold', href: '#case-2' }, { label: 'Task / Workspace', href: '#case-7' }],
      steps: [
        { tags: ['Non-Covalent Bond', 'Hotspots', 'Annotation'], title: 'Interface analysis: mark what must not be touched', lead: 'Load 7RGP in MoleculeOS, check hydrogen bonds, salt bridges and hydrophobic contacts across the peptide–receptor interface with Non-Covalent Bond, and use the Hotspots ranking to find 3 key anchors. Save them in the project with Annotation as a “no-go map”: no design should break these interactions.' },
        { tags: ['Mocha', 'Mutation Scoring'], title: 'Multi-axis scoring: sequence axis vs structure axis', lead: 'Through Mocha, submit sequence-fitness and binding-affinity scoring jobs for all 741 single-point mutations (39 positions × 19 substitutions), fetch the results from Output Data and compare them in one table. The two axes clearly disagree.', takeaway: 'The sequence model mistook “rare” for “improvable” and gave Y1M the top score, yet the affinity model gives a positive ddG (destabilizing) and Y1M breaks the N-terminal hydrogen-bond anchor. When the axes conflict, trust the structure axis.' },
        { tags: ['MMFold', 'Superimpose'], title: 'Structure-prediction check: compare with the experimental structure', lead: 'Predict the complex for wild type and the Y1M variant with MMFold, then superimpose the predictions on the experimental structure 7RGP with Superimpose.', takeaway: 'All three Y1M metrics drop slightly, in the same direction as the structure axis rejecting Y1M. The differences are small, so they only support the call and do not justify it alone.' },
        { tags: ['Mocha', 'MMFold', 'Task'], title: 'De novo design: explore new binders', lead: 'Constrained by 11 hotspot residues in the receptor ECD groove, submit a design job through Mocha to get new binders of 60–100 residues; follow progress in Task.', takeaway: 'The new interface buries more area (2,254 Å²) than tirzepatide (1,735 Å²) but hits only 1 of 11 hotspots, so this generation did not land in the middle of the groove. Next: change the random seed, tighten the hotspot constraints, screen in bulk with MMFold, then go to wet-lab tests.' },
      ],
      headers: { variant: 'Mutation', seq: 'Sequence fitness', ddg: 'Binding ΔΔG', struct: 'Structural basis', verdict: 'Call', metric: 'Metric', wt: 'Wild type', mut: 'Y1M variant', quadX: 'Sequence fitness →', quadY: 'Binding ΔΔG', quadBad: 'Destabilizing', quadGood: 'Stronger', design: 'Design length|α-helix share|Buried interface|Hotspot hits' },
      anchors: [{ tag: 'N-terminal anchor', pair: 'Tyr1 ↔ Gln257', detail: 'H-bond · 2.6 Å · 176 Å² buried' }, { tag: 'Salt-bridge network', pair: 'Glu3 ↔ Arg213', detail: 'Salt bridge · 3.0–3.5 Å' }, { tag: 'Hydrophobic core', pair: 'Phe6 / Phe22', detail: '130 / 104 Å² buried' }],
      text: { struct: 'Breaks the N-terminal H-bond anchor|Removes the hydrophobic core|Aromatic fill of a cavity|Both axes agree', predNote: 'Higher is better for ipTM and pLDDT; lower is better for RMSD.' },
      conclusionTitle: 'Takeaway', conclusion: 'Sequence-axis screening → structure-axis filtering → structure-prediction check. Used alone, a sequence model pushes out risky candidates; only after several dimensions agree do you get a starting point worth testing. In MoleculeOS the chain is continuous: the input, result and evidence of every step stay in the same project, and the same steps can be run again on another target. AI scores point the way; experiments confirm.',
      note: 'All results are computational predictions and have not been validated in the wet lab.',
    },
    cldn: {
      tab: 'Affinity maturation', tag: 'CLDN18.2 · Zolbetuximab', title: 'Structure prediction and affinity maturation for a CLDN18.2 antibody',
      subtitle: 'Using a drug approved in 2024 as the case, test in MoleculeOS how reliable antibody structure prediction and mutation screening are',
      intro: 'CLDN18.2 is highly expressed in gastric cancer. Zolbetuximab (Vyloy) was approved by the FDA in 2024 and is used with chemotherapy as first-line treatment of CLDN18.2-positive, HER2-negative advanced gastric cancer. This case uses PDB 9V32 (CLDN18.2 with the zolbetuximab Fab, cryo-EM) as the experimental benchmark. Starting from sequences alone, MoleculeOS predicts the structure with MMFold, MMetrics reads the interface, affinity and stability scoring jobs go through Mocha, and the results are cross-checked in one project.',
      tiles: [{ label: 'Benchmark', value: 'PDB 9V32' }, { label: 'Resolution', value: '4.1', unit: 'Å' }, { label: 'Epitope residues', value: '11' }, { label: 'Mutations scanned', value: '11,267' }],
      flowLabel: 'MoleculeOS features used',
      flow: [{ label: 'MMFold', href: '#case-2' }, { label: 'MMetrics', href: '#case-3' }, { label: 'Non-Covalent Bond', href: '#case-5' }, { label: 'Mocha', href: '#case-1' }, { label: 'Mutation Scoring', href: '#case-6' }],
      steps: [
        { tags: ['MMetrics', 'Non-Covalent Bond'], title: 'Structure analysis: the atomic basis of variant selectivity', lead: 'Load 9V32 in MoleculeOS, locate the epitope with MMetrics Annotations, then inspect the antibody–antigen interface with Non-Covalent Bond. The epitope core holds 3 sites that differ between CLDN18.1 and CLDN18.2, which explains zolbetuximab’s selectivity.', takeaway: 'Asn45’s double hydrogen-bond network cannot form on CLDN18.1 (Gln45 there): selectivity comes down to specific atomic contacts.' },
        { tags: ['MMFold', 'Superimpose'], title: 'Antibody prediction: rebuilding the Fv and the complex', lead: 'From VH / VL sequences alone (117 / 113 aa), MMFold folds the Fv and assembles the complex independently; Superimpose then aligns it to the experimental cryo-EM structure for a component-by-component comparison.', takeaway: 'Here both VH and VL have a Cα RMSD below 1 Å, so with no experimental structure the variable-region prediction is accurate enough to support later computation. The epitope is recovered at 9 / 11 (82%), useful for early epitope mapping and for binder design and bispecific layout.' },
        { tags: ['Mocha', 'Mutation Scoring'], title: 'Affinity scoring: a panorama of every single-point mutation', lead: 'Create an affinity scoring job through Mocha for every single-point mutation in the complex and fetch the results from Output Data; 4,809 are predicted to be stabilizing. Two observations stand out:' },
        { tags: ['Mutation Scoring', 'Workspace'], title: 'Cross-check: filter risky candidates with stability scores', lead: 'Stability scores then check the top affinity candidates one by one. Both result sets sit in Workspace and can be compared side by side, catching structural risks the affinity model cannot see.', takeaway: 'Asn103 is the hydrogen-bond hub of CDR3 (4 H-bonds): the affinity model sees “Tyr allows π-stacking”, the stability score sees “the loop loses its anchor and may collapse”. Looking at affinity alone would push out high-risk engineered mutations; crossing several dimensions filters them.' },
      ],
      headers: { site: 'Differing site', a: 'CLDN18.2', b: 'CLDN18.1', role: 'Structural role', part: 'Component', rmsd: 'Cα RMSD', aligned: 'Aligned', conf: 'Confidence', mut: 'Mutation', aff: 'Affinity ΔΔG', stab: 'Stability score', pct: 'Percentile', verdict: 'Call', scanStable: 'Predicted stabilizing', scanAll: 'All single-point mutations', epitope: 'Epitope recovered' },
      text: { roles: 'At the centre of the epitope; small side chain with a cavity around it|Forms a double H-bond network with light-chain CDR1 Asn31|H-bonds heavy-chain Asn103, plus a Glu62–Lys36 salt bridge', hot: 'Antigen-side Ala42|All 19 substitutions predicted to strengthen binding|ΔΔG −0.31 to −2.56 kcal/mol, strongest for aromatics. The site is on the antigen: it shows how sensitive the interface is, and is not an antibody design option.', arom: 'Interface aromatization|Phe102 → Trp · Asn103 → Tyr|Large aromatic side chains fill the cavity between the CDR and the antigen.', cross: '' },
      conclusionTitle: 'Takeaway', conclusion: 'Predict → verify → design: after scanning 11,267 mutations, only VH CDR3 Ser99→Leu got strongly positive affinity and stability scores together (−1.21 / +2.51, 99th percentile); every other high scorer was downgraded or rejected. In MoleculeOS, structure prediction, interface reading and both kinds of scoring link up in one project, and every conclusion can be traced back to a task and its result files. The experimental structure is the standard for checking predictions; a high score on one dimension is only a lead, and the intersection of several is the starting point.',
      note: 'All results are computational predictions and have not been validated in the wet lab.',
    },
  },
};
