# KN035 MMetrics 原生复现

原项目：https://mos.moleculemind.com/?projectId=342604060136448 。唯一输入为案例01的 MMFold_1.cif，未重新预测。下述原生完整采集保留的是 2026-10-21 快照；2026-10-29 同源数据重跑见文末，不能把不同日期的模块视为同一次运行。

`raw/native-ui/panel-dom.json` 和 `full-dom.html` 是原生渲染后 DOM；`layout-and-typography.json` 为真实样式和边界。`complete-scroll-captures.json` 对应有重叠的六张 `native-complete-*.png`，记录 scrollTop、1470×713 CSS px 及 DPR=2。保留早期截图及索引作为历史，完整采集以 complete 前缀为准。

2026-10-21 原生 Paratope=18、Epitope=19；IMGT、Kabat、Chothia 三套 CDR 区间保存于原始 record 与 derived/mmetrics/cdr_annotations.json。`annotations.json` 保存每个 chip 的完整文案与 title tooltip。该历史快照的 Domain/PTM 无条目、UniProt/Homologs 为空，不能挪用其他结构的条目。原生 typed interaction 表44行与Description正文51 contacts分别原样保留；2D SVG原生导出，没有重绘。

四份 MutX CSV 所有行均核对 WT、链和 MMFold_1 编号，完整 CSV 与验证索引位于 `raw/native-ui/`。所有来源数值保留字符串，不截断成示例行。AbAn/AbScN/ParaDt 未由本次原生任务输出；追加独立任务作为补充，另列来源，不能称为已观察的原生 Antibody Design 区块。

网站上色入口：`residues-on-mmfold1.json`。不要把 compact aa_index、IMGT 位置号或 UniProt 全长编号直接用于3D定位。

## 2026-10-29：相同输入与原 prompt 重跑

在[新项目](https://mos.moleculemind.com/?projectId=345488380847104)重新导入字节相同的 MMFold_1.cif，随后提交原 prompt，未启动新 MMFold 预测。对象 `345488780645376`，work `345488784675840`；自动前置任务 `345488784917504` 与 MMetrics 任务 `345489060729856` 均为 `SUCCEED`。原项目及旧原始文件保留。

最新采集入口为 [reruns/20261029/README.md](reruns/20261029/README.md)，原生 `record.json`、原始下载 ZIP、完整 DOM 和实际截图分别保存在该次运行目录。最新原生 Homologs 记录和界面均有 3 条：5JDS 100%、4DKA 72.1%、4DK3 72.1%。规范 `results.json.homologs` 指向这一快照，并内嵌保留原空结果的历史观察；其他规范模块和 `native_tasks` 仍对应 2026-10-21。

这 3 条原生记录虽标 `entity_id=1`，界面仍写 “Searched by antigen sequence similarity”，但每条去掉比对缺口后的 query 都等于 KN035 B 链完整 128 aa。它们必须按实际序列标注为 B 链相似性命中，不可当作已核验的 PD-L1 A 链同源数据或按 entity_id 给 A 链上色。5JDS_B 是同一 KN035 序列命中，另两条是 VHH 相似序列；相似性不证明共同的实验结合功能。

新原生 Description 把输入称作 “Crystal structure … at 1.7 Å resolution”，此文案保留在原始记录中；输入文件仍是原 MMFold 预测，1.7 Å 属于引用实验条目的元数据，不能改写输入来源。新子任务 `model_tasks.results=[]` 与新界面存在四份 MutX CSV 下载入口是不同层面的观察，不能由空数组推出界面无 CSV。
