# PD-L1 案例执行报告

报告时间：2026-10-20T14:03:10.152770+07:00（Asia/Jakarta）。

| 案例 | 最终分子 | 计算与素材状态 | 核心结果 | 待补项 |
|---|---|---|---|---|
| 01 MMFold | KN035 VHH | 成功；5 CIF + 5 confidence JSON、FASTA、映射、截图、图表 | ipTM 0.918；pLDDT 93.71；242 Cα RMSD 1.05 Å | PAE 不在平台输出中 |
| 02 MMetrics 原生与补充分析 | Avelumab VH/VL | 原生六区块、10 CSV、3 SVG、逐屏与交互截图已取得；另有11项独立任务 | 原生Paratope43/Epitope38；交互71条；每矩阵8,341非同义替换；抗体affinity4,294条 | 原生Homologs为空；无独立Risk Sites/Recommended Mutations区块；自动任务最终状态未暴露 |
| 03 Affinity | DBL1_03 | 突变扫描成功；另有两种变体各5个MMFold结构及置信度 | 2,356 Binder 替换；Q18Y ΔΔG −2.45 kcal/mol；变体 ipTM 0.821/0.776 | 未提供绝对 Kd；组合效应与实验验证不在本次输出中 |
| 04 Developability | KN035 VHH | 5 项任务成功；7 个单点候选，四轴评分与序列风险数据完整 | 75 框架位点；M34L 的 Met 4→3；R19S 理论 pI 9.01→8.76 | 溶解性、聚集、Tm、表达模型未提供 |
| 05 De Novo | 3 个新 Binder | 3 项设计任务均成功；73/66/95 aa，6份骨架/最终复合物 CIF | seed333 Binder Cα 平均 pLDDT 82.60；6/6 热点接触 | 无复合物 ipTM/PAE；碰撞松弛、序列复杂度与实验验证需后续评估 |

## 真实任务清单

- 01：`342253805564928`。
- 02：详见 `02-mmetrics/raw/mos-export/case02_complete/08_tasks/task_ledger.json`；11 个显式任务全部 succeeded；原生自动任务最终条目当前未暴露，但其界面与十份输出已取得。
- 03：`342254431249408`（Binding Affinity Mutation Effect）。
- 04：`342255494362112`、`342255495889920`、`342255510164480`、`342255512777728`、`342255515612160`。
- 05：`342254837666816`、`342254839784448`、`342254842782720`，均在原生任务表中确认 Succeed。第三个候选随后通过任务详情面板直接下载。

- 03 补充的变体 MMFold：见 `03-affinity/raw/candidate-structures.json`。两种变体的结构预测与此前亲和力模型分开记录。

本次共主动发起 **23 项模型任务，全部成功**；另有原生 MMetrics 的实际界面与十份输出文件已补齐；自动任务最终条目未暴露，不增加显式成功任务数。

## 素材完整度与科学审校

每个案例有 `input.json`、`results.json`、`raw/`、`visuals/`、`run-log.md`；公共来源有原始 PDB/mmCIF/FASTA/元数据和来源清单。交接入口为 `CLAUDE_HANDOFF.md` 与 `website-cards.json`。

- 01 的参考 RMSD、接触残基与热点距离来自下载后的真实预测，不使用晶体结构冒充预测。
- 02 的 9,020 行评分矩阵包含 451 条 WT→WT，自替换被排除后才是 8,569 个非同义替换。原生 MMetrics 与替代分析来源已分开。
- 03 每个 WT 残基都与7XYQ实体序列核对；独立下载的 CSV 与 Workspace 导出的原始 CSV SHA-256 相同。
- 04 的屏蔽位点零值不是中性评分；七个单点突变、四轴原始分数、pI/Met数及原始作者编号均经审校。
- 05 的三种有效序列来自 aligned.cif，poly-Gly 骨架仅是中间产物。CA 均值与 raw 中的全原子均值分开，酸碱接触化学身份经坐标核对。
- Raw 归档中存在早期运行状态和部分叙述错误；顶层审校 JSON、verified 映射和本报告是前端使用依据。

## 最终限制

原生 MMetrics 可用面板与十份可读输出已补齐。该版本的Homologs显示空结果，没有独立Risk Sites/Recommended Mutations区块；补充分析分别标注。原生自动任务最终状态未暴露，未虚构Succeed；模型结果不等于实验证实。

本次未修改官网前端，未发布网站，未进行湿实验。


## 04 补充素材

已下载内部 GitLab DevelopabilityLiabilities main 源码归档（观察 commit c3e7fe6f），提取38条规则、12类；另保存 KN035 的56条模式匹配记录，独立标注为本地规则注释，不计作 MOS 新任务。详见 `04-developability/supplementary-risk-materials.md`。S85N 的 NS→NN 仍是关注基序。
