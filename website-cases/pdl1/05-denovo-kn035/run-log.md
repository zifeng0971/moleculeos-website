# 05-denovo-kn035 执行记录

项目：https://mos.moleculemind.com/?projectId=342605363971072

对象：342605515027456；work：342605519696896。

唯一主结构：`01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。原始主文件未改动、未重新预测。

提交 prompt 原文在本目录 `raw/submitted-*.txt`，并嵌入 input.json；实际任务 payload、对象与输入 hash、链映射均见 input.json。任务的 schema、原始输出、MOS端导出分析分别保留在 raw/mos-export。最终规范结果使用顶层 results.json，本地审计见 raw/local。历史 checkpoint 保留原时点状态，不能取代最终 results.json。

靶点仅来自MMFold_1链A，118残基全部保留；六个热点来自02原生Epitope并经本地暴露/埋藏面积筛选。schema支持compare_binder=1，三次独立seed111/222/333均已完成：平台报告等待至完成分别3.7/6.7/9.7min，Task List的创建→更新分别09:27:57→09:31:37、09:27:57→09:34:36、09:27:58→09:37:39（Asia/Jakarta）。中间RUNNING/PENDING原文快照完整保留。

输入A=PD-L1；输出B=PD-L1、输出A=新binder，118行输出靶点映射已保存；新binder无MMFold_1同源位置，不强行映射。虚拟全G骨架与真实设计FASTA分开。三次仅有两份CIF/次，没有显式ipTM/pLDDT/PAE汇总；原始CA B值另存。

本地按残基ID重新计算热点距离、4.5Å接触、118个CA对齐和BSA，规范值见results.json。MOS导出分析中的热点索引/混合界面定义不作为规范结果：Gemmi的整数链索引与残基ID不同，raw报告的BSA total是双侧SASA损失之和，顶层BSA定义为其一半；接触重合只用明确4.5Å阈值，不混入SASA损失位点。

最终状态：completed_with_confidence_and_sequence_quality_limits。

完整逐模块总表见 `../handoff/KN035_STATUS.md`。
