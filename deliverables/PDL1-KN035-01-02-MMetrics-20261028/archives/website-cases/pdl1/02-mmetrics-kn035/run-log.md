# 02-mmetrics-kn035 执行记录

项目：https://mos.moleculemind.com/?projectId=342604060136448

对象：342604293768192；work：342604299084800。

唯一主结构：`01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。原始主文件未改动、未重新预测。

提交 prompt 原文在本目录 `raw/submitted-*.txt`，并嵌入 input.json；实际任务 payload、对象与输入 hash、链映射均见 input.json。任务的 schema、原始输出、MOS端导出分析分别保留在 raw/mos-export。最终规范结果使用顶层 results.json，本地审计见 raw/local。历史 checkpoint 保留原时点状态，不能取代最终 results.json。

主结构导入后核对链A118/链B128及完整序列。自动任务342604299285504用时1.1min；原生MMetrics任务342604577018880用时3s。首次面板显示Generating/Computing，随后实际完成，捕获记录见visuals/native-initial.png及native-complete-*.png。

独立补充：AbAn342606092895232（20s）、AbLang342606094599168（3s）、AbNatiV342606097245184（3s）、ParaDt342606100722688（25s），全部succeed。四份原生MutX和四份独立抗体CSV全行保留，逐行WT及编号核验通过。Domain/PTM/UniProt等原生缺项如实为空。

最终状态：completed_with_native_UI_scope_limits。

完整逐模块总表见 `../handoff/KN035_STATUS.md`。
