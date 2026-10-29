// Cases 04 and 05 of the help-center user stories. Figures come from website-cases/*/summary.md (audited versions);
// both are computational predictions with no wet-lab validation, and the PETase native MMetrics is still pending.
import type { Link, Tile, Verdict } from '@/content/help-stories';

export type CaseImage = { src: string; label: string };
export type CaseScatter = { xLabel: string; yLabel: string; points: { id: string; x: number; y: number }[]; plain?: boolean };
export type CaseTable = { template: string; cols: string[]; rows: { cells: string[]; v?: Verdict }[]; foot?: string };
export type CaseStep = { title: string; lead: string; takeaway?: string; tags?: string[]; tiles?: Tile[]; table?: CaseTable;
  anchors?: { tag: string; pair: string; detail: string }[]; scatter?: CaseScatter; images?: CaseImage[] };
export type CaseText = {
  tab: string; tag: string; title: string; subtitle: string; intro: string; tiles: Tile[]; flowLabel: string; flow: Link[];
  steps: CaseStep[]; conclusionTitle: string; conclusion: string; 
};

export const CASES: Record<'zh' | 'en', { d13: CaseText; petase: CaseText }> = {
  zh: {
    d13: {
      tab: '抗体人源化', tag: 'USER CASE 03 · ANTIBODY ENGINEERING', title: 'D1.3 抗体人源化：保留抗原识别区，重塑框架',
      subtitle: '从结合界面解析，到人源化序列生成，再到 Fv 结构筛选。',
      intro: '以 D1.3–溶菌酶实验复合物 PDB 1FDL 为起点，在 MoleculeOS 中解析抗原结合界面、发起人源化设计，并对候选 Fv 进行独立结构预测。对照已发表的人源化抗体结构 1BVL，比较框架替换后的构象变化与模型评分。',
      tiles: [{ label: '人源化候选', value: '10', unit: '组' }, { label: 'CDR 位点保留', value: '43 / 43' }, { label: 'Fv 结构模型', value: '55', unit: '个' }, { label: '最小亲本 Cα RMSD（3 号）', value: '0.406', unit: 'Å' }],
      flowLabel: 'MoleculeOS 工作流',
      flow: [{ label: 'MMetrics', href: '#case-3' }, { label: 'Mocha', href: '#case-1' }, { label: 'Antibody Humanization', href: '#case-1' }, { label: 'MMFold', href: '#case-2' }, { label: 'Task / Workspace', href: '#case-7' }],
      steps: [
        { tags: ['MMetrics', 'Interaction Network', 'Annotation'], title: '界面解析：先锁定抗原识别区', lead: '载入 1FDL 后，MMetrics 识别抗体重链、轻链与溶菌酶，生成六段 CDR 标注和抗原结合互作网络。重链与抗原记录 19 条互作，轻链与抗原记录 14 条。',
          anchors: [{ tag: '重链 · 氢键', pair: 'Asp100 ↔ Ser24', detail: '2.82 Å' }, { tag: '重链 · 接触', pair: 'Gly53 ↔ Gly117', detail: '2.87 Å' }, { tag: '轻链 · 接触', pair: 'Tyr50 ↔ Asp18', detail: '2.86 Å' }],
          images: [{ src: '/cases/d13/native-1FDL-mmetrics-antigen-interface.jpg', label: '1FDL · Interaction Network' }],
          takeaway: '本步结论：先确定参与抗原识别的关键残基，再将六段 CDR 作为后续设计的保留区域。' },
        { tags: ['Mocha', 'Antibody Humanization'], title: '人源化设计：CDR 保留，框架区重塑', lead: 'Mocha 根据原始 VH（116 aa）与 VL（107 aa）序列生成 10 组人源化候选。全部方案保留 43 个 CDR 位点，序列替换集中在抗体框架区。',
          tiles: [{ label: '独立 VH/VL 候选', value: '10' }, { label: '保留的 CDR 位点', value: '43 / 43' }, { label: '三组代表候选的框架变化', value: '35–36' }],
          scatter: { xLabel: '与亲本实验结构的 Cα RMSD（Å）→', yLabel: '人源化综合评分', points: [{ id: '03', x: 0.406, y: 0.4730 }, { id: '02', x: 0.432, y: 0.4589 }, { id: '09', x: 0.503, y: 0.5032 }] },
          takeaway: '本步发现：3 号结构最接近亲本；9 号人源化评分最高；2 号在后续结构预测中取得最高的 pLDDT 与 VH/VL ipTM。图中仅展示 3 组代表候选。' },
        { tags: ['MMFold', 'Structure Visualization'], title: '结构预测：55 个 Fv 模型，筛出代表候选', lead: '对 10 组候选分别运行独立 MMFold 任务，每组获得 5 个采样结构；计入人源化任务附带的 5 个结构，共保留 55 个 Fv 模型。选择各候选排名最高的采样，对照亲本实验结构计算 Cα RMSD，并在 MoleculeOS 中查看叠合效果。',
          table: { template: '1.3fr 1fr 1fr 1fr', cols: ['指标', '候选 3', '候选 2', '候选 9'], rows: [
            { cells: ['pLDDT', '96.10', '96.77 ↑', '95.04'] }, { cells: ['VH/VL ipTM', '0.963', '0.966 ↑', '0.964'] },
            { cells: ['亲本 Cα RMSD', '0.406 Å ↓', '0.432 Å', '0.503 Å'] }, { cells: ['框架拟合 RMSD', '0.390 Å ↓', '0.420 Å', '0.449 Å'] }] },
          images: [{ src: '/cases/d13/representative-humanization-3-overlay.jpg', label: 'humanization_3' }, { src: '/cases/d13/representative-humanization-2-overlay.jpg', label: 'humanization_2' }, { src: '/cases/d13/representative-humanization-9-overlay.jpg', label: 'humanization_9' }],
          takeaway: '本步发现：三组候选的预测 Fv 构象均接近亲本，其中 3 号偏差最小；2 号获得三者中最高的模型结构置信度。' },
        { tags: ['MMetrics', 'MMFold', 'Structural Comparison'], title: '候选决策：三条不同的设计路径', lead: '引入已发表的人源化抗体结构 1BVL 作为独立参照，结合人源化评分、亲本结构偏差和参考结构差异，归纳三组候选的各自优势。',
          table: { template: '.6fr .8fr .9fr .9fr .9fr 1.2fr', cols: ['候选', '框架变化', '人源化评分', '亲本 RMSD', '1BVL RMSD', '设计方向'], rows: [
            { cells: ['03', '36', '0.4730', '0.406 Å ↓', '0.759 Å', '结构优先'] }, { cells: ['02', '35', '0.4589', '0.432 Å', '0.707 Å', '置信度优先'] }, { cells: ['09', '36', '0.5032 ↑', '0.503 Å', '0.637 Å ↓', '人源化评分优先'] }] },
          takeaway: '核心判断：3 号更接近亲本，2 号预测置信度更高，9 号的人源化评分最高、与 1BVL 的结构差异最小。不同指标给出了不同的候选选择方向。' },
      ],
      conclusionTitle: '核心判断', conclusion: '先锁定抗原识别区，再重塑框架，最后用独立结构预测和 1BVL 参照筛选：10 组候选全部保留 43 个 CDR 位点，三组代表候选各有所长。结构偏差使用已审核的坐标叠合结果；pLDDT、VH/VL ipTM 是结构模型指标，不替代结合亲和力数据。',
    },
    petase: {
      tab: '酶局部改造', tag: 'USER CASE 04 · ENZYME ENGINEERING', title: 'PETase 局部改造：从底物口袋到候选序列',
      subtitle: '口袋解析、三轴突变评估、约束序列设计与结构复核。',
      intro: '以 PETase–HEMT 实验复合物 5XH3（R103G/S131A 突变体）和野生型结构 5XG0 为起点，在 MoleculeOS 中依次开展配体结合评分、三类突变适应度计算、局部 Protein Redesign 与 MMFold 预测。将底物邻域的空间约束与候选结构对比连接成完整设计链路。',
      tiles: [{ label: '4 Å 口袋邻近残基', value: '9', unit: '个' }, { label: 'WT 单点扫描记录', value: '3 × 5,092' }, { label: '独立设计序列', value: '4', unit: '种' }, { label: '代表候选预测结构', value: '15', unit: '个' }],
      flowLabel: 'MoleculeOS 工作流',
      flow: [{ label: 'Mocha', href: '#case-1' }, { label: 'Affinity Score', href: '#case-6' }, { label: 'Mutation Fitness × 3', href: '#case-6' }, { label: 'Protein Redesign', href: '#case-1' }, { label: 'MMFold', href: '#case-2' }],
      steps: [
        { tags: ['Structure Visualization', 'Mocha', 'Protein–Ligand Affinity'], title: '结合口袋：定义底物周围的改造边界', lead: '载入实验结构 5XH3，并以 HEMT 的原子坐标筛选 4 Å 范围内的蛋白残基：9 个残基与底物形成 69 对重原子近邻接触。随后由 Mocha 发起蛋白–配体评分，得到 SiPoBe 总分 −4.310。',
          tiles: [{ label: '底物 4 Å 邻近残基', value: '9' }, { label: '重原子接触对', value: '69' }, { label: 'SiPoBe 模型评分', value: '−4.310' }],
          takeaway: '本步发现：结合实验结构 5XH3 确定底物邻域，再以 5XG0 野生型序列固定催化核心 Ser131、Asp177、His208，将局部改造范围收敛至非催化位点。' },
        { tags: ['Mocha', 'Sequence Fitness', 'Evolutionary Fitness', 'Structural Fitness'], title: '三轴突变评分：同一位点，不同模型的判断', lead: '以野生型 PETase 268 aa 构建序列为输入，MoleculeOS 分别运行序列、进化和结构适应度扫描，每个模型输出 5,092 条单点替换记录。从设计区域提取代表突变，观察不同模型对相同氨基酸替换的评分差异。',
          scatter: { xLabel: 'Sequence Fitness →', yLabel: 'Structural Fitness', plain: true, points: [{ id: 'W130H', x: -1.554, y: 2.530 }, { id: 'W156Y', x: -0.612, y: 0.975 }, { id: 'D157H', x: -0.113, y: 3.942 }, { id: 'I179V', x: 0.937, y: -0.421 }, { id: 'S209G', x: -0.646, y: 0.666 }, { id: 'D157Y', x: -0.661, y: -0.079 }] },
          table: { template: '1fr 1fr 1fr 1fr', cols: ['突变', '序列分', '进化分', '结构分'], rows: [
            { cells: ['W130H', '−1.554', '−8.576', '+2.530'] }, { cells: ['W156Y', '−0.612', '−4.320', '+0.975'] }, { cells: ['D157H', '−0.113', '−0.668', '+3.942'] },
            { cells: ['I179V', '+0.937', '−1.672', '−0.421'] }, { cells: ['S209G', '−0.646', '−6.943', '+0.666'] }, { cells: ['D157Y', '−0.661', '−4.896', '−0.079'] }] },
          takeaway: '本步发现：W130H 的结构评分为 +2.530，进化评分却为 −8.576；I179V 的序列评分为 +0.937，结构评分则为 −0.421。多模型结果揭示单一评分排序之外的设计取舍。' },
        { tags: ['Mocha', 'Protein Redesign', 'Task / Workspace'], title: '定点重设计：固定催化核心，开放五个局部位点', lead: '结合口袋位置、三轴突变评分和野生型结构信息，选择 W130、W156、D157、I179、S209 五个非催化位点开展局部重设计。Mocha 调用 Protein Redesign 生成 10 条设计输出，去重后得到 4 种独立序列。',
          tiles: [{ label: '开放改造位点', value: '5' }, { label: '模型设计输出', value: '10' }, { label: '独立候选序列', value: '4' }, { label: 'MMFold 结构采样', value: '15' }],
          takeaway: '本步发现：把设计限制在五个位点内，保留催化三联体和重要结构约束，使生成序列可以直接进入下一轮模型比较。' },
        { tags: ['MMFold', 'Structure Overlay', 'Local Geometry'], title: '结构复核：折叠置信度之外，再检查口袋空间', lead: '对 seq_4、seq_2、seq_1 分别运行 MMFold，每组生成 5 个结构采样。将代表模型与 WT 结构叠合，比较全局及底物口袋 Cα RMSD，并在固定 HEMT 姿态下检查蛋白–配体最短原子距离。',
          table: { template: '.7fr 2.2fr .7fr 1fr 1fr 1fr', cols: ['候选', '局部突变（成熟蛋白编号）', 'pLDDT', 'WT 全局 RMSD', 'WT 口袋 RMSD', '最短距离'], rows: [
            { cells: ['seq_4', 'W130H / W156Y / D157H / S209G', '97.29', '0.249 Å', '0.241 Å', '2.151 Å'] },
            { cells: ['seq_2', 'W130H / W156Y / D157Y / S209G', '96.83', '0.288 Å', '0.239 Å', '1.665 Å'] },
            { cells: ['seq_1', 'W130H / W156Y / D157H / I179V / S209G', '97.22', '0.291 Å', '0.316 Å', '2.112 Å'] }] },
          images: [{ src: '/cases/petase/representative-seq_4-overlay.jpg', label: 'seq_4' }, { src: '/cases/petase/representative-seq_2-overlay.jpg', label: 'seq_2' }, { src: '/cases/petase/representative-seq_1-overlay.jpg', label: 'seq_1' }],
          takeaway: '本步发现：三组候选的 pLDDT 均高于 96；seq_4 的整体结构最接近 WT，seq_2 出现 1.665 Å 的局部近接触，seq_1 则呈现额外 I179V 替换带来的口袋构象变化。' },
      ],
      conclusionTitle: '核心判断', conclusion: '先由口袋坐标划定改造边界，再用三类模型评估单点突变、固定催化核心做五位点重设计，最后用 MMFold 与 WT 叠合复核：得到 4 种独立序列，其中 seq_4 整体最接近 WT，seq_2 的局部近接触提示需要进一步处理。',
    },
  },
  en: {
    d13: {
      tab: 'Humanization', tag: 'USER CASE 03 · ANTIBODY ENGINEERING', title: 'D1.3 humanization: keep the antigen-binding region, reshape the framework',
      subtitle: 'From interface analysis to humanized sequence generation to Fv structure screening.',
      intro: 'Starting from the experimental D1.3–lysozyme complex (PDB 1FDL), MoleculeOS is used to analyze the antigen-binding interface, launch the humanization design and predict candidate Fv structures independently. The published humanized antibody structure 1BVL serves as a reference for comparing conformational change and model scores after framework substitution.',
      tiles: [{ label: 'Humanized candidates', value: '10' }, { label: 'CDR positions kept', value: '43 / 43' }, { label: 'Fv structure models', value: '55' }, { label: 'Lowest parent Cα RMSD (no. 3)', value: '0.406', unit: 'Å' }],
      flowLabel: 'MoleculeOS workflow',
      flow: [{ label: 'MMetrics', href: '#case-3' }, { label: 'Mocha', href: '#case-1' }, { label: 'Antibody Humanization', href: '#case-1' }, { label: 'MMFold', href: '#case-2' }, { label: 'Task / Workspace', href: '#case-7' }],
      steps: [
        { tags: ['MMetrics', 'Interaction Network', 'Annotation'], title: 'Interface analysis: lock down the antigen-recognition region first', lead: 'After loading 1FDL, MMetrics identifies the antibody heavy and light chains and lysozyme, and builds six CDR annotations and the antigen-binding interaction network. The heavy chain has 19 recorded interactions with the antigen, the light chain 14.',
          anchors: [{ tag: 'Heavy chain · H-bond', pair: 'Asp100 ↔ Ser24', detail: '2.82 Å' }, { tag: 'Heavy chain · contact', pair: 'Gly53 ↔ Gly117', detail: '2.87 Å' }, { tag: 'Light chain · contact', pair: 'Tyr50 ↔ Asp18', detail: '2.86 Å' }],
          images: [{ src: '/cases/d13/native-1FDL-mmetrics-antigen-interface.jpg', label: '1FDL · Interaction Network' }],
          takeaway: 'Takeaway: identify the key residues in antigen recognition first, then keep the six CDRs as the protected region for the design that follows.' },
        { tags: ['Mocha', 'Antibody Humanization'], title: 'Humanization design: keep the CDRs, reshape the framework', lead: 'From the original VH (116 aa) and VL (107 aa), Mocha generates 10 humanized candidates. Every design keeps all 43 CDR positions; substitutions are concentrated in the framework.',
          tiles: [{ label: 'Independent VH/VL candidates', value: '10' }, { label: 'CDR positions kept', value: '43 / 43' }, { label: 'Framework changes, 3 representatives', value: '35–36' }],
          scatter: { xLabel: 'Cα RMSD to the parent experimental structure (Å) →', yLabel: 'Humanization score', points: [{ id: '03', x: 0.406, y: 0.4730 }, { id: '02', x: 0.432, y: 0.4589 }, { id: '09', x: 0.503, y: 0.5032 }] },
          takeaway: 'Finding: no. 3 is structurally closest to the parent; no. 9 has the highest humanization score; no. 2 later gets the highest pLDDT and VH/VL ipTM. Only the three representatives are plotted.' },
        { tags: ['MMFold', 'Structure Visualization'], title: 'Structure prediction: 55 Fv models, representatives picked', lead: 'Each of the 10 candidates runs as its own MMFold task with 5 sampled structures; with the 5 structures attached to the humanization task, 55 Fv models are kept. The top-ranked sample of each candidate is compared with the parent experimental structure by Cα RMSD and inspected as a superposition in MoleculeOS.',
          table: { template: '1.3fr 1fr 1fr 1fr', cols: ['Metric', 'Candidate 3', 'Candidate 2', 'Candidate 9'], rows: [
            { cells: ['pLDDT', '96.10', '96.77 ↑', '95.04'] }, { cells: ['VH/VL ipTM', '0.963', '0.966 ↑', '0.964'] },
            { cells: ['Parent Cα RMSD', '0.406 Å ↓', '0.432 Å', '0.503 Å'] }, { cells: ['Framework-fit RMSD', '0.390 Å ↓', '0.420 Å', '0.449 Å'] }] },
          images: [{ src: '/cases/d13/representative-humanization-3-overlay.jpg', label: 'humanization_3' }, { src: '/cases/d13/representative-humanization-2-overlay.jpg', label: 'humanization_2' }, { src: '/cases/d13/representative-humanization-9-overlay.jpg', label: 'humanization_9' }],
          takeaway: 'Finding: all three predicted Fv conformations stay close to the parent, no. 3 deviating least; no. 2 has the highest model confidence of the three.' },
        { tags: ['MMetrics', 'MMFold', 'Structural Comparison'], title: 'Candidate decision: three different design paths', lead: 'The published humanized antibody structure 1BVL is brought in as an independent reference. Together with the humanization score, parent deviation and reference difference, it summarizes what each of the three candidates does best.',
          table: { template: '.6fr .8fr .9fr .9fr .9fr 1.2fr', cols: ['Cand.', 'Framework changes', 'Humanization score', 'Parent RMSD', '1BVL RMSD', 'Design direction'], rows: [
            { cells: ['03', '36', '0.4730', '0.406 Å ↓', '0.759 Å', 'Structure first'] }, { cells: ['02', '35', '0.4589', '0.432 Å', '0.707 Å', 'Confidence first'] }, { cells: ['09', '36', '0.5032 ↑', '0.503 Å', '0.637 Å ↓', 'Humanization score first'] }] },
          takeaway: 'Core judgment: no. 3 is closer to the parent, no. 2 has higher predicted confidence, and no. 9 has the highest humanization score and the smallest difference from 1BVL. Different metrics point to different candidates.' },
      ],
      conclusionTitle: 'Core judgment', conclusion: 'Lock the antigen-recognition region first, reshape the framework, then screen with independent structure prediction and the 1BVL reference: all 10 candidates keep the 43 CDR positions and each of the three representatives has its own strength. Structural deviations use reviewed coordinate superpositions; pLDDT and VH/VL ipTM are structure-model metrics and do not replace binding-affinity data.',
    },
    petase: {
      tab: 'Enzyme redesign', tag: 'USER CASE 04 · ENZYME ENGINEERING', title: 'PETase local redesign: from substrate pocket to candidate sequences',
      subtitle: 'Pocket analysis, three-axis mutation assessment, constrained sequence design and structure review.',
      intro: 'Starting from the PETase–HEMT experimental complex 5XH3 (R103G/S131A variant) and the wild-type structure 5XG0, MoleculeOS runs ligand-binding scoring, three kinds of mutation fitness, local Protein Redesign and MMFold prediction in turn, linking the spatial constraints around the substrate to candidate-structure comparison as one design chain.',
      tiles: [{ label: 'Residues within 4 Å of the pocket', value: '9' }, { label: 'WT single-point scan records', value: '3 × 5,092' }, { label: 'Independent designed sequences', value: '4' }, { label: 'Predicted structures of representatives', value: '15' }],
      flowLabel: 'MoleculeOS workflow',
      flow: [{ label: 'Mocha', href: '#case-1' }, { label: 'Affinity Score', href: '#case-6' }, { label: 'Mutation Fitness × 3', href: '#case-6' }, { label: 'Protein Redesign', href: '#case-1' }, { label: 'MMFold', href: '#case-2' }],
      steps: [
        { tags: ['Structure Visualization', 'Mocha', 'Protein–Ligand Affinity'], title: 'Binding pocket: set the boundary for redesign around the substrate', lead: 'Load the experimental structure 5XH3 and screen protein residues within 4 Å of the HEMT atoms: 9 residues form 69 heavy-atom contact pairs with the substrate. Mocha then runs protein–ligand scoring, giving a total SiPoBe score of −4.310.',
          tiles: [{ label: 'Residues within 4 Å of substrate', value: '9' }, { label: 'Heavy-atom contact pairs', value: '69' }, { label: 'SiPoBe model score', value: '−4.310' }],
          takeaway: 'Finding: the experimental structure 5XH3 fixes the substrate neighborhood; with the 5XG0 wild-type catalytic core Ser131, Asp177 and His208 held fixed, local redesign narrows to non-catalytic sites.' },
        { tags: ['Mocha', 'Sequence Fitness', 'Evolutionary Fitness', 'Structural Fitness'], title: 'Three-axis mutation scoring: one site, different verdicts', lead: 'With the 268 aa wild-type PETase construct as input, MoleculeOS runs sequence, evolutionary and structural fitness scans, each returning 5,092 single-substitution records. Representative mutations from the design region show how the models score the same substitution differently.',
          scatter: { xLabel: 'Sequence Fitness →', yLabel: 'Structural Fitness', plain: true, points: [{ id: 'W130H', x: -1.554, y: 2.530 }, { id: 'W156Y', x: -0.612, y: 0.975 }, { id: 'D157H', x: -0.113, y: 3.942 }, { id: 'I179V', x: 0.937, y: -0.421 }, { id: 'S209G', x: -0.646, y: 0.666 }, { id: 'D157Y', x: -0.661, y: -0.079 }] },
          table: { template: '1fr 1fr 1fr 1fr', cols: ['Mutation', 'Sequence', 'Evolution', 'Structure'], rows: [
            { cells: ['W130H', '−1.554', '−8.576', '+2.530'] }, { cells: ['W156Y', '−0.612', '−4.320', '+0.975'] }, { cells: ['D157H', '−0.113', '−0.668', '+3.942'] },
            { cells: ['I179V', '+0.937', '−1.672', '−0.421'] }, { cells: ['S209G', '−0.646', '−6.943', '+0.666'] }, { cells: ['D157Y', '−0.661', '−4.896', '−0.079'] }] },
          takeaway: 'Finding: W130H scores +2.530 on structure but −8.576 on evolution; I179V scores +0.937 on sequence but −0.421 on structure. Multiple models expose design trade-offs that a single ranking hides.' },
        { tags: ['Mocha', 'Protein Redesign', 'Task / Workspace'], title: 'Site-directed redesign: fix the catalytic core, open five local sites', lead: 'Combining pocket positions, the three-axis scores and the wild-type structure, five non-catalytic sites (W130, W156, D157, I179, S209) are opened for local redesign. Mocha calls Protein Redesign for 10 design outputs, which reduce to 4 independent sequences.',
          tiles: [{ label: 'Open redesign sites', value: '5' }, { label: 'Model design outputs', value: '10' }, { label: 'Independent candidate sequences', value: '4' }, { label: 'MMFold structure samples', value: '15' }],
          takeaway: 'Finding: confining the design to five sites keeps the catalytic triad and key structural constraints, so the generated sequences go straight into the next round of model comparison.' },
        { tags: ['MMFold', 'Structure Overlay', 'Local Geometry'], title: 'Structure review: check pocket space beyond folding confidence', lead: 'MMFold runs on seq_4, seq_2 and seq_1, five structure samples each. The representative models are superposed on WT to compare global and substrate-pocket Cα RMSD, and the shortest protein–ligand atom distance is checked with HEMT held in its experimental pose.',
          table: { template: '.7fr 2.2fr .7fr 1fr 1fr 1fr', cols: ['Cand.', 'Local mutations (mature numbering)', 'pLDDT', 'WT global RMSD', 'WT pocket RMSD', 'Shortest distance'], rows: [
            { cells: ['seq_4', 'W130H / W156Y / D157H / S209G', '97.29', '0.249 Å', '0.241 Å', '2.151 Å'] },
            { cells: ['seq_2', 'W130H / W156Y / D157Y / S209G', '96.83', '0.288 Å', '0.239 Å', '1.665 Å'] },
            { cells: ['seq_1', 'W130H / W156Y / D157H / I179V / S209G', '97.22', '0.291 Å', '0.316 Å', '2.112 Å'] }] },
          images: [{ src: '/cases/petase/representative-seq_4-overlay.jpg', label: 'seq_4' }, { src: '/cases/petase/representative-seq_2-overlay.jpg', label: 'seq_2' }, { src: '/cases/petase/representative-seq_1-overlay.jpg', label: 'seq_1' }],
          takeaway: 'Finding: all three candidates exceed pLDDT 96; seq_4 is overall closest to WT, seq_2 shows a 1.665 Å local close contact, and seq_1 shows the pocket conformational change brought by the extra I179V.' },
      ],
      conclusionTitle: 'Core judgment', conclusion: 'Pocket coordinates set the redesign boundary, three models assess single-point mutations, the catalytic core stays fixed for a five-site redesign, and MMFold with WT superposition closes the review: four independent sequences result, of which seq_4 is overall closest to WT and the local close contact in seq_2 needs further handling.',
    },
  },
};
