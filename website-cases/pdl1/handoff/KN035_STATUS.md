# KN035 任务与数据状态

除单独标注的 2026-10-29 Homologs 重跑外，其余模块保留截至 2026-10-21 09:45:13（Asia/Jakarta）的快照。用于交付的数据任务均已完成并下载；没有仍在运行的任务被标为完成。

|案例|模块|取得真实数据|来源|条目数|回到 MMFold_1 编号|限制|
|---|---|---|---|---:|---|---|
|02|Description|是|native_UI_and_MMetrics_task|1|是|confidence high is classification confidence, not structure confidence|
|02|Homologs（2026-10-29）|是|native_UI_and_MMetrics_task_rerun_20261029|3|不可按 entity_id 映射|原空结果保留。3 条 query 实为 KN035 B128，原生 entity_id=1/UI antigen 文案不一致，不作 PD-L1 A 链同源主张|
|02|Domain|无条目或缺失|native_UI_and_MMetrics_record|0|不适用|Absent/empty in the actual native result; no fabricated entries|
|02|PTM|无条目或缺失|native_UI_and_MMetrics_record|0|不适用|Absent/empty in the actual native result; no fabricated entries|
|02|UniProt Feature|无条目或缺失|native_UI_and_MMetrics_record|0|不适用|Absent/empty in the actual native result; no fabricated entries|
|02|Epitope|是|native_UI_and_MMetrics_task|19|是||
|02|Paratope|是|native_UI_and_MMetrics_task|18|是||
|02|CDR ranges|是|native_MMetrics_task|9|是|3 schemes x 3 ranges|
|02|Interaction Network|是|native_UI_table_and_SVG|44|是|Description 51 contacts differs from 44 typed records; local 5 A contact pairs corroborate 51|
|02|MutXevo.csv|是|native_UI_download|4920|是||
|02|MutXstruct.csv|是|native_UI_download|4920|是||
|02|MutXseq.csv|是|native_UI_download|4920|是||
|02|MutXaff.csv|是|native_UI_download|4674|是||
|02|abnumber_heavy.csv|是|independent_MOS_task|128|是|Original native panel did not produce these CSVs; supplemental tasks are explicitly separate|
|02|ablang_heavy_scores.csv|是|independent_MOS_task|2560|是|Original native panel did not produce these CSVs; supplemental tasks are explicitly separate|
|02|abnativ_heavy.csv|是|independent_MOS_task|128|是|Original native panel did not produce these CSVs; supplemental tasks are explicitly separate|
|02|paragraph_heavy.csv|是|independent_MOS_task|128|是|Original native panel did not produce these CSVs; supplemental tasks are explicitly separate|
|02|Native Antibody Design CSVs|无条目或缺失|not_emitted_by_native_task|0|不适用|Original native task did not emit AbAn/AbScN/ParaDt CSVs; separate real supplemental tasks supply the requested data.|
|02|Native capture|是|native_UI_screenshots_DOM_SVG|6|是|6 overlapping complete screenshots, full DOM, all tooltip/title attributes, style/viewport/DPR/scrollTop; early captures retained as history|
|03|Affinity scan|是|MOS_task|4674|是|Schema scores A+B; all A substitutions excluded from candidates. Delta score unit unknown|
|03|KN035 mutations|是|filtered_MOS_task|2432|是||
|03|Variant structures|是|MOS_MMfold_plus_local_sequence_geometry_audit|25|是|5 variants x 5 samples; confidence is not affinity; erroneous S128W task excluded|
|04|Structural Stability|是|MOS_task|2560|是|Dimensionless model fitness; mutant minus same-site WT; generic sequence score chain A maps to master B|
|04|Sequence Fitness|是|MOS_task|2560|是|Dimensionless model fitness; mutant minus same-site WT; generic sequence score chain A maps to master B|
|04|Evolutionary Effect|是|MOS_task|2560|是|Dimensionless model fitness; mutant minus same-site WT; generic sequence score chain A maps to master B|
|04|Local sequence risk|是|local_analysis|10|是|Motif flags, not measured degradation probability|
|04|Framework candidates|是|local_screen_of_MOS_scores|6|是|Protect union of all 3 CDR schemes, paratope and 4 cysteines; candidates have no new validated structures|
|04|Affinity x Developability|是|local_merge_of_MOS_outputs|11|是|5 mutation types have sequence-verified predicted structures; all are experimentally unverified|
|05|De novo runs|是|MOS_Protein_Binder_Design|3|是|Seeds111/222/333; no existing binder input; 60-100 aa design range|
|05|Raw complexes|是|MOS_task|6|是|3 virtual GLY backbone CIFs + 3 designed-sequence complex CIFs|
|05|Hotspots|是|native_epitope_plus_local_SASA|6|是|Target-only input retains all 118 residues; output target B maps to master A|
|05|Alignment/contact/BSA/rank|是|local_geometry|3|是|BSA=(isolated SASA sum-complex SASA)/2; 4.5 A contacts; geometry ranking only|
|05|Explicit ipTM / pLDDT / PAE summary|无条目或缺失|not_supplied_by_MOS|0|不适用|No confidence summary supplied. Raw CIF atom-site B values retained without assigning an unverified confidence meaning.|

原生缺项保留为空；独立补充任务不算作原生面板文件。完整模块状态也见 `KN035_STATUS.json`。

同源重跑入口：[`02-mmetrics-kn035/reruns/20261029/README.md`](../02-mmetrics-kn035/reruns/20261029/README.md)。新项目345488380847104，对象345488780645376/work345488784675840；自动前置345488784917504和MMetrics345489060729856均为SUCCEED。记录/UI均有5JDS、4DKA、4DK3三个条目。原始与新快照分开保留；顶层其余模块未更新为新运行。输入仍为MMFold预测，新Description的crystal/1.7 Å文案不可改写其来源。

错误任务342605442536448、342605433852928保留在MOS，已明确排除其数据。没有修改或删除旧项目、旧任务、旧案例目录。

## 实际任务ID索引

|案例|任务|ID|结果使用状态|
|---|---|---|---|
|02|MOSTask|342604299285504|使用真实完成输出|
|02|MOSTask|342604577018880|使用真实完成输出|
|02|Antibody Region Annotation|342606092895232|使用真实完成输出|
|02|Antibody Language Scoring|342606094599168|使用真实完成输出|
|02|Antibody Nativeness Evaluation|342606097245184|使用真实完成输出|
|02|Paratope Identification|342606100722688|使用真实完成输出|
|03|Binding Affinity Mutation Effect|342605020787712|使用真实完成输出|
|03|MMFold|342605501072384|使用真实完成输出|
|03|MMFold|342605511136256|使用真实完成输出|
|03|MMFold|342605520978944|使用真实完成输出|
|03|MMFold|342605442536448|排除错误输入，任务保留|
|03|MMFold|342606341129216|使用真实完成输出|
|03|MMFold|342606351508480|使用真实完成输出|
|04|Structural Stability Mutation Effect|342605430273024|使用真实完成输出|
|04|Sequence Fitness Mutation Effect|342605430948864|使用真实完成输出|
|04|Evolutionary Mutation Effect|342605433852928|排除错误输入，任务保留|
|04|Evolutionary Mutation Effect|342605471151104|使用真实完成输出|
|05|kn035_c05_denovo_seed111|342606137910272|使用真实完成输出|
|05|kn035_c05_denovo_seed222|342606139298816|使用真实完成输出|
|05|kn035_c05_denovo_seed333|342606141764608|使用真实完成输出|

<!-- KN035_DENOVO_ROUND2 -->

## de novo第二轮状态

|seed|任务ID|状态|真实输出|主结构映射|
|---|---|---|---|---|
|444|342610714428416|Succeed，输出已下载|虚拟骨架CIF、设计复合物CIF、分类FASTA|靶点118/118；新binder无主结构对应|
|555|342610715788288|Succeed，输出已下载|虚拟骨架CIF、设计复合物CIF、分类FASTA|靶点118/118；新binder无主结构对应|
|666|342610718331904|Succeed，输出已下载|虚拟骨架CIF、设计复合物CIF、分类FASTA|靶点118/118；新binder无主结构对应|

两轮对比见`../05-denovo-kn035/ROUND2_COMPARISON.md`；第二轮原始payload仅seed不同，首轮文件hash核验未变。
