# 03-affinity-kn035 执行记录

项目：https://mos.moleculemind.com/?projectId=342604683428864

对象：342604788900864；work：342604793074688。

唯一主结构：`01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。原始主文件未改动、未重新预测。

提交 prompt 原文在本目录 `raw/submitted-*.txt`，并嵌入 input.json；实际任务 payload、对象与输入 hash、链映射均见 input.json。任务的 schema、原始输出、MOS端导出分析分别保留在 raw/mos-export。最终规范结果使用顶层 results.json，本地审计见 raw/local。历史 checkpoint 保留原时点状态，不能取代最终 results.json。

真实亲和力任务342605020787712，37s。全表4674行；仅2432条B链替换进入排名，A始终保留原序列。界面优先按位点去重前三为V109L、Q116M、T105L。另保留A35W远端命中和C33Y二硫键破坏的反例预测。五个变体共25份结构与25份confidence JSON，全部核对完整A序列和B唯一替换。

错误任务342605442536448实际提交S128W而非A35W，保留MOS任务但排除结果。采用正确A35W任务342605501072384。所有结构对齐与接触在本地重新计算，不能直接使用MOS端对话里的早期调试数字。原始C33Y confidence JSON的pTM=0.598656、ipTM=0.260212，raw ledger早期把两者混淆；规范results使用原始JSON。

最终状态：completed_with_model_and_unit_limits。

完整逐模块总表见 `../handoff/KN035_STATUS.md`。
