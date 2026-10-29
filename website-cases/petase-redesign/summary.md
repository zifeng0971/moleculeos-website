# PETase 底物口袋与局部理性改造

实际新增8个MOS任务均成功：1个手册输入的亲和力评估、3个WT适应度扫描、1个局部重设计及3个代表序列MMFold。保留10条设计输出（4种独立序列）和15个预测结构。完整HEMT复合物原生MMetrics仍在计算，未把额外坐标分析冒充原生结果。

## 来源、输入与编号

- 实验结构：[5XH3](https://www.rcsb.org/structure/5XH3) 为 R103G/S131A 配体结合突变体；[5XG0](https://www.rcsb.org/structure/5XG0) 为野生型参考。原始PDB/CIF/FASTA及来源哈希位于 `source/`。
- 5XH3 配体为CCD 856 / HEMT，16个重原子，C11H12O5；原始label链B、作者A301。它不同于先前示例可能使用的BHET。
- WT扫描输入使用5XG0完整链C共268 aa，包含7 aa人工N端GAGAGAM。成熟作者编号1–261：扫描construct位置=作者+7；UniProt位置=作者+29。全部5360行的WT字母与真实输入核对。
- 催化位点作者S131/D177/H208 = UniProt S160/D206/H237 = 扫描138/184/215。氧阴离子相关骨架N Tyr58/Met132；二硫键174–210、244–260。上述序列及7 aa人工前导均未作为开放设计位点。
- 手册输入精确文件 `source/5xh3_clean.pdb`（SHA256 aa9ddaea2fb33662c15cfd0fb1d8877203bf0ad33132d77553cb4f8eeb12853c）、`source/5xh3_B_856.sdf`（44c9ea73346d5d29b74d034010fcb65e4489dd58407ecccb219863d70fe443e9）。输入字节与手册下载文件独立核对。

## 每步实操及证据

|步骤|状态与实际结果|证据|
|---|---|---|
|载入5XH3/HEMT|完成；原始复合物保留|source/；原始导出structures/5XH3_mos_layout.cif|
|MMetrics口袋分析|完整复合物仍显示Generating description/Model Computing；未取得完整原生口袋表|tasks/native-5XH3-mmetrics-final-state.txt；对应截图|
|额外坐标口袋统计|4 Å内9残基、69个重原子接触对|analysis/verified-results.json；原始analyses/ligand856_*.csv|
|手册亲和力新任务|Succeed，342337422410752，原生SiPoBe score −4.310292|outputs/native-affinity-page/PLSc.csv；native-affinity-task-details截图|
|WT结构对齐|成熟261个CA，5XG0C对5XH3A RMSD0.256 Å|原始analyses/superpose_5xg0_5xh3*；独立audit|
|WT三模型扫描|3个任务Succeed，每个5360行=268×20（含268个自身替换）|原始native_tasks/；analysis/verified-results.json|
|局部重设计|任务342338944422912成功，10输出、4独立序列|原始native_tasks/redesign*；analyses/redesign_variants.json|
|代表MMFold|seq4/2/1各5个采样，全部序列核对|原始native_tasks/mmfold_seq_*|
|结构比较与MOS展示|Kabsch独立统计并导入叠合结构；原生Superimpose入口未暴露|analysis/verified-results.json；structures/overlays/；screenshots/|

原生WT MMetrics能提供3个评分下载项，但Homologs无显著结果、无残基注释、Interaction Network报计算失败。原生页面CSV位于 `outputs/native-mmetrics-WT/`，与本次明确发起的三项WT任务原始输出分别保留。

## 任务记录

|功能|新任务ID|结果|
|---|---|---|
|手册蛋白–配体评估|342337422410752|Succeed|
|WT sequence fitness|342337264870400|Succeed|
|WT evolutionary fitness|342337268093952|Succeed|
|WT structural fitness|342337277858816|Succeed|
|Protein Redesign，10条|342338944422912|Succeed|
|MMFold seq4|342339217835008|Succeed，5模型|
|MMFold seq2|342339221820416|Succeed，5模型|
|MMFold seq1|342339232719872|Succeed，5模型|

完整参数、实际序列、未暴露字段和原生task响应见 `outputs/mos-export-v2/website_case_petase/task-ledger.json`、`native_tasks/_raw_api_returns/`。v2为优先原始包；v1/checkpoint保留历史。

## 口袋证据与设计背景

4 Å口袋作者编号 G57/Y58/A60/W130/A131/M132/W156/I179/H208。A131是5XH3结合突变体，不可将其误称WT催化Ser。6个潜在极性接触的距离及原子名见原始 `analyses/ligand856_polar_contacts.csv`；它们是坐标规则统计，不是已完成的原生MMetrics结论。

开放的局部非催化设计位置为130、156、157、179、209。重设计支架是**构造模型**：使用5XH3结合态骨架，将103G/131A恢复为WT R/S，并采用对齐5XG0侧链；保留实验HEMT姿态。它不是实验解析的WT–HEMT复合物。原始WT5XG0上刚性转移配体会出现W156约0.86 Å严重接触，因此明确保存了支架选择过程。

亲和力任务输出为原生score及分项：vdw −2.4951997、hbond −0.5505939、hydrophobic −1.2644981、metal 0，求和与总分一致。CSV没有单位说明，不称Kd、pKd或实验自由能。使用手册同一配体原生对象路径，来自历史已成功任务338706466620416；本次新任务ID独立保存。

## 候选比较与展示顺序

以下为工程展示优先级：4号作为几何参考，2号展示局部侧链冲突，1号展示额外I179V变化。不是实测催化性能排名。模型为各任务原生精确ranking_score最高采样。

|候选|成熟作者编号突变|原生global pLDDT|WT全局CA RMSD Å|WT口袋CA RMSD Å|刚性HEMT转移最短重原子距离 Å|
|---|---|---:|---:|---:|---:|
|seq_4|W130H, W156Y, D157H, S209G|97.29|0.249|0.241|2.151|
|seq_2|W130H, W156Y, D157Y, S209G|96.83|0.288|0.239|1.665|
|seq_1|W130H, W156Y, D157H, I179V, S209G|97.22|0.291|0.316|2.112|

- 重复分组：seq4/5/8/9/10同序列；seq2/3/6同序列；seq1及seq7各独立。不能宣传为10种独立设计。所有10条输出FASTA均保留。
- seq2 Tyr156 CE1–配体O02最短1.665 Å，提示刚性姿态下明显局部空间冲突。seq4全蛋白仍有Ser131 OG–配体C09 2.151 Å短接触；因此不能声称“完全无碰撞”。seq1最短2.112 Å也位于Ser131。未做配体重对接或松弛，这些只是额外几何筛查。
- 原始Mocha只检查设计侧链得到的最短距离，与本地全蛋白复核范围不同。官网采用 `analysis/verified-results.json` 的范围明确结果。
- 15个MMFold样本全保留，pLDDT为native global，CA均值另列。单链ipTM=0是原生输出，不展示为失败或结合界面评分。

## 不同模型的支持与冲突

以下均为WT背景单突变模型分，不能相加当作组合突变评分，也不能据此推断酶活或亲和力提升。

|突变|Sequence|Evolution|Structure|
|---|---:|---:|---:|
|W130H|-1.554|-8.576|2.530|
|W156Y|-0.612|-4.320|0.975|
|D157H|-0.113|-0.668|3.942|
|I179V|0.937|-1.672|-0.421|
|S209G|-0.646|-6.943|0.666|
|D157Y|-0.661|-4.896|-0.079|

## 交接素材及失败记录

- 机器读取：`website-data.json`、`analysis/verified-results.json`、`analysis/all-candidate-mutations.csv`、`analysis/representative-summary.csv`。
- 推荐叙事：实验HEMT口袋 → WT/突变体编号映射 → 三模型意见差异 → 限定5位点设计 → 4种独立序列 → 3个代表结构及局部空间筛查。
- 叠合文件在原始导出 `structures/overlays/overlay_WT_chainA_seq_*_chainB.{pdb,cif}`：A=实验WT成熟261 aa，B=预测候选sample1；不含配体，不能标作实验蛋白–配体复合物。原子/链映射见overlay_manifest.json。
- 全部原始文件：`outputs/website_case_petase_final_v2.zip`、`outputs/mos-export-v2/website_case_petase/`。旧包保留作历史。
- 原生页面截图：`screenshots/`；对话、纠错和状态证据：`tasks/`；额外统计和可复现脚本：`analysis/`。
- 已保留的功能限制：浏览器本地文件选择权限不足；直接ImportStructure读取SDF失败；Evo评分解释包装器失败但原始完整CSV成功；完整5XH3原生MMetrics待计算；本会话没有暴露原生Superimpose。替代输入的逐字节哈希验证与实际任务参数都有记录。
- 尚需补齐：平台完整HEMT复合物原生MMetrics结果。当前材料足以写真实“结构引导的候选探索与筛查”案例，不支持性能改善、实验活性或实验亲和力结论。
- `manifest.json` 保存文件路径、字节数与SHA256。

额外定量可视化：`analysis/candidate-comparison.png` / `.svg`；由审核后的实际模型数据绘制，图表不替代原生MOS截图。
