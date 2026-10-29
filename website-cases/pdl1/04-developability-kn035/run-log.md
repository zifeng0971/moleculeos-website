# 04-developability-kn035 执行记录

项目：https://mos.moleculemind.com/?projectId=342605041570816

对象：342605177943040；work：342605181223936。

唯一主结构：`01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。原始主文件未改动、未重新预测。

提交 prompt 原文在本目录 `raw/submitted-*.txt`，并嵌入 input.json；实际任务 payload、对象与输入 hash、链映射均见 input.json。任务的 schema、原始输出、MOS端导出分析分别保留在 raw/mos-export。最终规范结果使用顶层 results.json，本地审计见 raw/local。历史 checkpoint 保留原时点状态，不能取代最终 results.json。

使用本地按链精确提取的B结构，坐标与主文件逐原子相等，导入hash与本地派生文件相同。三项评分2560行/项，全行WT验证；sequence/evolution输出泛称链A，明确映射为主结构B。稳定性342605430273024（2s）、序列342605430948864（3s）、正确进化任务342605471151104（1.2min；任务列表09:25:14→09:26:25）。错误125aa进化输入342605433852928排除，未删任务。

规范筛选保护IMGT/Kabat/Chothia的CDR并集、原生Paratope及B22/B33/B96/B106，最后6个候选。MOS端IMGT-only分析中的L60Y、K50S/A属于Kabat CDR2，不列入最终框架清单。11行亲和力交叉表已回填T105L ΔΔG，5个变体类型的结构状态由本地25份CIF核验后更新；候选与实验验证严格区分。

最终状态：scores_and_local_risk_screen_collected。

完整逐模块总表见 `../handoff/KN035_STATUS.md`。
