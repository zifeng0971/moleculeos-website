# 02 MMetrics 同源数据重跑，2026-10-29

[新 MOS 项目](https://mos.moleculemind.com/?projectId=345488380847104)重新导入相同的 MMFold_1.cif，再提交逐字相同的 [原 prompt](submitted-prompt.txt)。[输入索引](input.json)记录结构 SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`、prompt SHA256 `9b02ca7773f4fd5aba14c34cabf80f3d0b24b549060b32b1e30dd0cf69c99f94` 及链映射。没有重新预测结构，原项目保留。

- 新对象 `345488780645376`，work `345488784675840`。
- 自动前置任务 `345488784917504`、MMetrics 任务 `345489060729856` 均为 `SUCCEED`；[实际任务与 payload 索引](raw/mos-export/kn035_case02/task-ledger.json)。
- [原始下载 ZIP](raw/kn035_case02.zip)，SHA256 `18b787c8acb639120fd6e4965a6bc613a08dfac074f95844e7001dd71e306342`；[解压原始 record](raw/mos-export/kn035_case02/raw/mmetrics_345489060729856/record.json)。
- [完整本次结果](results.json)、[原生同源行](raw/homologs-native.json)、[逐条核验摘要](homologs-summary.json)、[原生 UI 卡片](raw/homologs-ui-cards.json)与[实际界面截图](visuals/native-homologs-overview.jpg)。

原生记录和界面都有 3 条：5JDS 100%、4DKA 72.1%、4DK3 72.1%。原始行的 `entity_id=1` 与 UI 的 antigen similarity 文案均保留，但去缺口 query 全部等于 KN035 B 链 128 aa；不能据此声称是 PD-L1 A 链同源结果。5JDS_B 是同一 KN035 序列命中，相似性也不证明共同的实验结合功能。

新 Description 写 “Crystal structure … at 1.7 Å resolution”，输入仍是原 MMFold 预测，不能把引用实验条目的分辨率当作输入的实验来源。子任务 `model_tasks.results=[]`、父任务输出的评分 CSV、UI 中四份 MutX CSV 下载入口分别留档，不由其中一项推断另一项缺失。其他模块的规范数据仍沿用 2026-10-21，原空同源记录也保留在历史观察中。

收集完成后用 [finalize_rerun.py](scripts/finalize_rerun.py)校验、生成清单并打包；运行须提供本次原生 record 与下载的输入副本。`validation.json` 和 `manifest.json` 以实际最终生成文件为准。
