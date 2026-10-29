# 02 — Avelumab / PD-L1 analysis execution

- Original direct upload into project 342242986152960 triggered MMetrics. The native panel remained on Generating description / Analyzing structure / Model Computing after a page refresh.
- Independent project https://mos.moleculemind.com/?projectId=342256011498496 reproduced the same native panel state. Native automatic task 342256189539328 still returned Running, no output. Native panel completion is not claimed.
- Eleven explicit MOS tasks succeeded: three homology searches, three sequence-fitness scans, three evolutionary scans, one whole-complex structural-fitness scan, one whole-complex affinity scan. Exact input sequences and payloads are in `raw/mos-export/case02_complete/08_tasks/task_ledger.json`. All eleven native task rows were checked across both task-list pages.
- Seven requested analysis categories are supplied through explicit MOS outputs and built-in annotation/geometry/motif tools, with provenance per category. No alternate data is passed off as completed native MMetrics UI output.
- Downloaded 100-file ZIP via Workspace; CRC verification passed. All original CSV/JSON/FASTA and structure inputs are retained.
- Independent audit script `../handoff/scripts/audit_mmetrics.py`: every merged score checked against raw task CSV, every WT residue and CDR sequence checked against original RCSB entity sequences, original label/auth atom-site maps verified.
- Score matrix: 9,020 rows include 451 WT-to-WT entries. There are 8,569 nonself substitutions; 8,341 affinity ddG entries on modeled residues. Do not advertise all 9,020 rows as distinct mutations.
- Original 5GRJ contains VH/VL variable fragments, not a full Fab constant-region scaffold. Entity lengths: 120 / 110 / 221; modeled residues: 118 / 108 / 213.
- Numbering corrections: PD-L1 label C1-167 and C171-216 map to original auth A18-184 and A188-233. The raw overview's +18 and contiguous modeled-span claims are incorrect. Use `raw/verified-residue-numbering.json`. VL modeled positions are 2-109.
- Interface area semantics: raw VH-PD-L1 2,293 A² sums both sides (1,125.9 antigen + 1,167.1 antibody); mean per side is 1,146.5 A². Do not label the sum as burial on PD-L1 alone.
- Hypothetical mutation recommendations, motif liabilities and HMM species classifications require their stated provenance and are not experimental conclusions.

## 原生 MMetrics 继续执行：登录会话失效

2026-10-20 再次打开原项目342256011498496，MOS重定向至登录页面；Company=moleculemind，Username/Password为空。尚不能读取原生任务的新状态。已保存visuals/resume-login-required.jpg，建立native-ui-capture.json逐模块记录要求；等待用户在Chrome完成MOS登录后继续。现有独立分析结果未作为原生面板完成证据。

## 原生 MMetrics 采集完成（登录恢复后）

2026-10-20：恢复登录后进入项目342256011498496。Description、Homologs、Annotations、Interaction Network、Mutation Scoring、Antibody Design六个原生区块均已加载。十份CSV从原生Download逐份下载，并实际打开View检查，保存字段、行数、预览截图与DOM；另保存三张原生SVG、71条交互表格、逐屏截图、注释/残基/PTM选中、排序和分页状态。原生显示Paratope43/Epitope38；Homologs为空。未出现独立Risk Sites/Recommended Mutations，不以补充数据冒充。逐残基核验8780行×3与4294行affinity；轻链紧凑索引1映射B2。自动任务最终状态未在Task List暴露，原生输出交付依据是实际UI与下载文件。详见MMETRICS_REPRODUCTION.md和raw/native-ui/verified-native-summary.json。
