PD-L1 / KN035 — MMetrics Homologs 诊断结论
整理时间：2026-10-28T15:55:21+07:00（Asia/Jakarta）

一、结论
证据更支持MOS原生自动流程未提供或未接入A链抗原检索结果。优先查自动query选择/调度，以及MMetrics的实体关联和结果装配。
已确认原生输出查询对象是B链抗体，但Homologs面板面向A链抗原；新对照表明同一条A链118aa能够检索到显著PD-L1命中。
尚未取得实际后台源码和调度/装配日志，因此不能把最可疑环节写成已经定位到某一代码行的根因。

二、三条任务链并列
原01来源：342253805564928 / PDL1_KN035_VHH_complex / MMFold_1.cif。
02项目：342604060136448（PDL1-02-MMetrics-KN035-20261021）。
结构object=342604293768192，work=342604299084800。
结构A=PD-L1 118aa，B=KN035 VHH 128aa；01→02文件SHA256一致：
d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317。

1. 原生自动前置任务342604299285504 / autocompute-MMFold_1：
   留档Started=2026-10-21 02:20:28，无时区后缀，duration=1.1min。
   503条比对 / 500个唯一hit，所有query都是B链128aa。
   sequence_info.fasta只有heavy_sequence(B)和light_sequence=None。
   当前可见输出中没有A链query；这不等于已经读到了服务内部全部调用日志。
2. 原生MMetrics任务342604577018880 / mmetrics-analysis-342604299285504：
   留档Started=2026-10-21 02:21:36，无时区后缀，duration=3s。
   input_structure正确，autocomp_results含前置7个对象；record.homology/uniprot/pdb均=[]。
   UI明确显示“Searched by antigen sequence similarity / No significant homologs found.”。
3. 本次新增独立对照345176768607232 / diag_PDL1_A118_20261028：
   工具名Sequence Homology Search，UI显示Sequence Similarity Search。
   状态Succeed，Started原文2026-10-28 08:47:52，duration=3s。
   UI Task下拉显示2026-10-28 15:47:52；与Asia/Jakarta UTC+07一致。原始服务字段本身未声明时区。
   实际payload仅有sequence=原始A链118aa、local=true、max_seq=500。
   general.query_sequence及所有query_sequence_full均与A链逐字相同。
   473条比对 / 457个唯一候选 / 457条FASTA。
   PDB子集239条比对、233个唯一命中；按本次复核阈值E<1e-5筛选有63条比对。
   首条pdb|5JDS|A，描述Programmed cell death 1 ligand 1，118/118一致、query覆盖1–118，E=5.20957e-85。
   原始identity_percentage=1.0，字段尺度0–1；不是1%。

三、这次排查排除了什么
1. 原结构在01→02流转时发生改变：三份CIF字节相同。
2. 这条A链序列本身无法作检索输入：本次直接输入118aa对照已成功。
3. 当前检索服务整体查不到PD-L1：出现显著且明确的PD-L1命中。
4. 只是官网演示层没渲染：原生record.json里字段已经为空，线上原生MOS也显示空。

四、仍不能下定论的部分
本次对照是10月28日的独立服务调用，原任务发生于10月21日；库/服务版本/阈值快照未知。
新检索返回PDB+Swiss-Prot，原生B结果仅PDB。比较PDB子集支持抗原可检索，但不证明两个服务的配置完全相同。
因此不能完全排除历史配置、过滤或结果解析问题，不能直接声称“唯一原因就是后台选错链”。
473条比对的尾部含弱命中，457个候选不应全称为可靠PD-L1同源蛋白；结论依靠显著的头部PD-L1命中。
E<1e-5是本报告的复核标准，不能冒充原MMetrics阈值。
Mocha导出的diagnosis.json/comparison.json包含其推断；其中“无任何失败/跳过任务”“A从未检索”“不是阈值造成”等表述应按可见任务/产物范围理解。本报告的边界说明优先。
旧的4HT1阳性快照存在entity关联问题，不用作可靠的同构建体阳性对照。其他单链案例也为空，说明一般性自动汇总问题值得并行检查。

五、平台开发者下一步可以直接查的点
1. 以autocompute342604299285504、object342604293768192、work342604299084800查逐entity/chain的query选择与调度记录。
   A/118aa是否被选择？若跳过、失败或另存，输出明确原因、请求/响应和任务关联。
2. 查MMetrics342604577018880读取的对象与schema，逐步记录输入条数、query对应链、过滤前后条数、目标entity_id和空数组写入理由。
   重点核对BLAST JSON对象342604574229504与FASTA对象342604574114816的读取和映射。
3. 与对照345176768607232的PDB头部命中对照，先排查抗原检索遗漏及结果未接入，再核对历史过滤配置。
4. 建议输出每条query的chain/entity/source-task/参数/库版本，并区分not-run、failed、zero-hits、filtered-empty与annotation-missing。
   回归对照应包括抗原短于抗体的复合物、链顺序交换、单链PD-L1与带显著命中的汇总输入。

六、当前状态
本次只新增了上述1个独立序列检索任务。原生autocompute/MMetrics没有重跑，原record没有回填，Homologs尚未修复。
原始检索任务与结果仍可在02项目中查看：https://mos.moleculemind.com/?projectId=342604060136448。

七、包内证据
mos-export/：从MOS Workspace下载的实际诊断目录与A链对照原始JSON/FASTA/schema/payload/status。
browser/：两次实际提交的诊断指令、原生UI观察、对照任务截图、直接UI下载SeqSrch JSON。
source-01/：原01输入FASTA、input.json、选中MMFold_1.cif。
source-02/：原生B检索FASTA。
independent-validation/：本地重新解析、直接UI文件与导出一致性、独立复核结果。
comparison/、pipeline/：其他原生案例比较与本地后台源码可用性检查。
diagnosis-verdict.json：本报告结论和证据边界的机器可读版本。

直接UI下载SeqSrch.json SHA256：40e3cea779a3ec9da098caac71ca4791cd1f2a5e1941f83922c9db140b7905ea。
运行python3 verify_package.py可离线校验包内文件，无网络、无新MOS任务。
