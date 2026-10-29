# 02-mmetrics-kn035 执行记录

项目：https://mos.moleculemind.com/?projectId=342604060136448

对象：342604293768192；work：342604299084800。

唯一主结构：`01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。原始主文件未改动、未重新预测。

提交 prompt 原文在本目录 `raw/submitted-*.txt`，并嵌入 input.json；实际任务 payload、对象与输入 hash、链映射均见 input.json。任务的 schema、原始输出、MOS端导出分析分别保留在 raw/mos-export。最终规范结果使用顶层 results.json，本地审计见 raw/local。历史 checkpoint 保留原时点状态，不能取代最终 results.json。

主结构导入后核对链A118/链B128及完整序列。自动任务342604299285504用时1.1min；原生MMetrics任务342604577018880用时3s。首次面板显示Generating/Computing，随后实际完成，捕获记录见visuals/native-initial.png及native-complete-*.png。

独立补充：AbAn342606092895232（20s）、AbLang342606094599168（3s）、AbNatiV342606097245184（3s）、ParaDt342606100722688（25s），全部succeed。四份原生MutX和四份独立抗体CSV全行保留，逐行WT及编号核验通过。Domain/PTM/UniProt等原生缺项如实为空。

最终状态：completed_with_native_UI_scope_limits。

完整逐模块总表见 `../handoff/KN035_STATUS.md`。

## 2026-10-29 同源数据重跑与追加采集

用户要求用相同 prompt 重新跑。原项目保留，在新项目 https://mos.moleculemind.com/?projectId=345488380847104 重新导入相同 MMFold_1.cif；输入 SHA256 仍为 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`，原 prompt 1150 字节、SHA256 `9b02ca7773f4fd5aba14c34cabf80f3d0b24b549060b32b1e30dd0cf69c99f94`，均未改动。没有新 MMFold 结构预测。新对象 `345488780645376`，work `345488784675840`；自动前置任务 `345488784917504` 和原生 MMetrics 任务 `345489060729856` 均为 `SUCCEED`。

完整原始 ZIP、解压文件、任务 payload、record、界面 DOM 与真实截图保存在 `reruns/20261029/`。新 `annotations.homology` 与界面均有 3 条：5JDS 100%、4DKA 72.1%、4DK3 72.1%。顶层 `results.json` 仅更新 Homologs 并添加 `latest_rerun` 指针；原空结果作为历史观察保留，其他模块与旧 `native_tasks` 未改成新任务。

核验发现：3 条原生记录的 `entity_id=1` 与界面 antigen 文案和实际 query 不一致，去缺口 query 全部为 KN035 B 链 128 aa。保留原值并另标这一限制，不称为 A 链 PD-L1 同源证据。新 Description 的 “crystal / 1.7 Å” 来自原生文案，不能把相同输入的预测结构变成实验结构。新子任务的空 `model_tasks.results` 与界面的四份 MutX CSV 下载入口分别记录，未混淆。详见 `reruns/20261029/README.md`。
