# KN035 MMetrics 原生复现

项目：https://mos.moleculemind.com/?projectId=342604060136448 。唯一输入为案例01的 MMFold_1.cif，未重新预测。

`raw/native-ui/panel-dom.json` 和 `full-dom.html` 是原生渲染后 DOM；`layout-and-typography.json` 为真实样式和边界。`complete-scroll-captures.json` 对应有重叠的六张 `native-complete-*.png`，记录 scrollTop、1470×713 CSS px 及 DPR=2。保留早期截图及索引作为历史，完整采集以 complete 前缀为准。

原生 Paratope=18、Epitope=19；IMGT、Kabat、Chothia 三套 CDR 区间保存于原始 record 与 derived/mmetrics/cdr_annotations.json。`annotations.json` 保存每个 chip 的完整文案与 title tooltip。Domain/PTM 无条目、UniProt/Homologs 为空，不能挪用其他结构的条目。原生 typed interaction 表44行与Description正文51 contacts分别原样保留；2D SVG原生导出，没有重绘。

四份 MutX CSV 所有行均核对 WT、链和 MMFold_1 编号，完整 CSV 与验证索引位于 `raw/native-ui/`。所有来源数值保留字符串，不截断成示例行。AbAn/AbScN/ParaDt 未由本次原生任务输出；追加独立任务作为补充，另列来源，不能称为已观察的原生 Antibody Design 区块。

网站上色入口：`residues-on-mmfold1.json`。不要把 compact aa_index、IMGT 位置号或 UniProt 全长编号直接用于3D定位。
