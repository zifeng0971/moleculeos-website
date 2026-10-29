# 一个复合物贯穿01–05：PD-L1 / KN035

唯一主结构是 `01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。来自MOS项目342242986152960、MMFold任务342253805564928；A=人PD-L1构建体118 aa、B=KN035 VHH128 aa，无轻链。此文件未修改、未替换、未重新预测。所有新任务只读此文件或原样提取链A/B；未以5GRJ、7XYQ、5JDS作输入。BLAST输出可包含5JDS命中名称，那是原生检索返回，不是任务输入结构。

## 01 → 02：从预测复合物到界面解读

01的同一个MMFold_1直接导入02新项目。链、序列、246个label/auth编号与MOS编号逐位一致；完整映射在`02-mmetrics-kn035/raw/residue-numbering-map.json`。原生MMetrics给出A链Epitope19位点、B链Paratope18位点、三套CDR范围和44条带类型相互作用。原生Homologs为空；Domain/PTM缺失、UniProt为空，按实际输出保留。AbAn/AbScN/ParaDt CSV原生未产出，四个独立任务补齐，明确另标来源。

02→03/04/05的共同消费文件是`02-mmetrics-kn035/residues-on-mmfold1.json`；原生列表来源可追溯到`raw/mos-export/kn035_case02/raw/native_task_342604577018880/record.json`，不能用本地4.5Å接触替代原生列表。抗体CSV紧凑号映射另见`02-mmetrics-kn035/raw/antibody-csv-compact-to-mmfold1.json`。

## 02 → 03：在原有界面上比较更强结合的预测候选

03输入仍为同一MMFold_1；A序列不变，仅推荐B替换。工具schema会枚举双方全表，4674行全部保留，2432条B链替换单独排序。两个排名分别是全B和原生Paratope优先；按界面位点去重的前三是V109L、Q116M、T105L，均有5份真实MMFold变体复合物。另有A35W远端命中和C33Y破坏二硫键的诊断性反例。

03不是“已实测变强”：ΔΔG列只有预测方向，单位未被本次schema/CSV声明，保留unknown；置信度只是预测结构自信程度。网站应使用`03-affinity-kn035/results.json`和两份候选JSON，突变位置/它面对的A残基使用`residues-on-mmfold1.json`。25份结构逐一验证：A原序列118aa不变、B128aa只改一个指定位点、label编号1:1。

|变体|任务ID|best ipTM|best pLDDT|全B链CA RMSD（按PD-L1对齐，Å）|
|---|---|---:|---:|---:|
|A35W|342605501072384|0.6119|86.54|26.298|
|V109L|342605511136256|0.9169|93.63|0.860|
|C33Y|342605520978944|0.2602|82.81|25.152|
|Q116M|342606341129216|0.9183|93.70|0.790|
|T105L|342606351508480|0.9005|92.86|1.443|

best按原始ranking_score选；V109L另外4个样本ipTM低，不能只展示最好一份。A35W/C33Y的低界面置信度及明显重排不是原界面亲和力已提升的证据。所有样本、原始confidence、对齐结果都保留。

## 03 → 04：亲和力与可开发性同时看

04输入是原主结构B单链，提取脚本/坐标等同性/文件hash见`04-developability-kn035/raw/MMFold_1_chain_B.provenance.json`。三项评分各2560行。序列模型输出链A只是单序列工具的默认标签，逐位映射到主结构B；不能上色到PD-L1。

03真实MutXaff候选与04三项评分按B链位置、WT与mutant精确连接，输出`04-developability-kn035/affinity-candidates-x-developability.json`及CSV（11行）。T105L ΔΔG已回填；5个变体类型标记“预测结构的序列已核验”，其他仅有分数，没有实验验证。C33Y虽亲和力列看似有利，却破坏B33–B106，明确排除开发推荐。

开发筛选保护三套CDR并集、原生Paratope和B22/B33/B96/B106；两对SG几何距离为2.066Å和2.180Å。用同位点WT→WT为基线比较mutant−WT，三模型是无量纲fitness，不是假造的稳定性ΔΔG/表达量/溶解度。当地序列风险分析另标“本地分析”，只是motif筛查。

最终框架单点候选：Q5V, M93V, N73D, M93T, A75S, R47L。它们尚无新结构或实验验证；保留每个模型正负取舍及R47 hallmark/界面邻近风险。MOS端IMGT-only的9候选为历史导出，规范结果采用更严格并集后的6个。

## 02 → 05：在KN035占据的同一PD-L1面上设计全新binder

05从同一MMFold_1删去B，保留全部A1–118及原坐标。用02原生Epitope，再按游离靶点溶剂暴露（SASA≥20Å²）和界面埋藏筛选6个热点A45/A40/A97/A107/A105/A38，详见`05-denovo-kn035/raw/hotspot-selection.json`。三次真实Protein Binder Design输入都只有此靶点，不含KN035或任何既有binder；contigs=A1-118/0 60-100、compare_binder=1、seed111/222/333。

输出链角色交换：输出B=PD-L1，对回主结构A1–118；输出A=新binder，其残基在MMFold_1没有对应物。逐残基映射在`05-denovo-kn035/raw/residue-numbering-map.json`，网站只把靶点热点/接触映回主结构；展示新binder必须加载经PD-L1对齐后的设计结构，不能把新binder的A链误涂到主结构A链。全G虚拟骨架与真实设计序列的FASTA/CIF明确分开。

|seed|任务ID|binder aa|PD-L1 CA RMSD Å|BSA Å²|4.5Å接触覆盖原生表位|Ala比例|
|---|---|---:|---:|---:|---|---:|
|111|342606137910272|73|0.488|602.9|13/19|57.5%|
|222|342606139298816|66|0.383|571.6|13/19|81.8%|
|333|342606141764608|95|0.366|895.0|18/19|40.0%|

本地BSA统一为(两条游离链SASA之和−复合物SASA)/2，接触阈值4.5Å。MOS端早期报告按总SASA损失/混合SASA界面算出的数字保留在raw中，不与规范口径混用。排名按接触重合Jaccard、热点参与和BSA排序，仅为几何排序。3个binder都在同一表位区域，但各有偏移，未声称完整覆盖全部热点。

平台没有给ipTM/PAE或显式pLDDT汇总；原始CIF CA B字段另存，未自行解释为置信度。序列存在明显Ala偏高（尤其seed222），不能把这三条讲成成熟、验证有效的binder。

## 网站读取契约与交付边界

每个新目录的`input.json`记录实际项目URL、对象、hash、链映射、提交prompt及任务payload；`results.json`是规范数值，`residues-on-mmfold1.json`是3D上色入口；raw/native-ui、raw/mos-export、raw/local严格标注来源，历史checkpoint不作为最终状态。

manifest保留原01–05记录，追加4条-kn035记录，KN035 narrative列出01原记录和4条新记录。前端应明确选用KN035这一组，不能继续把旧02–05混入本叙事。本次交付是案例数据及交接文件，没有把旧前端数据引用自动改成新引用。

完整逐模块数据量、映射与限制见`KN035_STATUS.md`和`KN035_STATUS.json`。所有真实输入输出均保留；唯一主文件及旧目录未改动，旧MOS项目/任务未修改或删除。

<!-- KN035_DENOVO_ROUND2 -->

## 用户授权追加：de novo第二轮

首轮全部保留，第二轮seed444/555/666已独立完成；仍使用同一PD-L1输入和六热点，只有随机种子改变。第二轮规范结果位于`05-denovo-kn035/round2/results.json`，两轮六设计的同口径对比位于`05-denovo-kn035/ROUND2_COMPARISON.md`及`round-comparison.json`。原生文件与映射单独留在round2，未覆盖首轮。
