# kn035_homolog_diagnosis_20261028 — 原生 MMetrics Homologs 为空的只读诊断

本目录为只读诊断产物。未调用 `StartMOSTask`，未重跑或刷新任何模型/自动分析，未修改结构、任务、注释或旧归档（`kn035_case02/`、`kn035_case02_supplement/` 均未改动）。

## 0. 一句话结论

原生流程里**只跑过一条序列检索：以 B 链（KN035 VHH，128 aa）为 query**，得到 503 条比对 / 500 个 PDB hit；**没有任何 A 链 query 的痕迹**。因此 `annotations.homology=[]` 与 PD-L1 的同源性无关，不能把 B 链的 503 条抗体命中当作 A 链结果。具体是哪一步把为空写进去的，缺少服务端源码与日志，无法证实到代码行。

## 1. 任务与输入复查（只读）

| 项 | 值 |
|---|---|
| autocompute | `342604299285504`，SUCCEED，Started `2026-10-21 02:20:28`，1.1min |
| MMetrics | `342604577018880`，SUCCEED，Started `2026-10-21 02:21:36`，3s |
| autocompute payload | 仅 `structure_path` + fileId + filename，无链选择、无 query 序列 |
| MMetrics payload | 仅 `input_structure` + `autocomp_results`（7 个对象），无链选择、无库/阈值参数 |
| 项目任务板 | 6 个任务，全部 SUCCEED；无 failed/skipped/queued，无 A 链检索任务 |

时间语义：平台显示的任务时间不带时区；对象 `createTime=1792549294` 换算为 UTC `2026-10-21T02:21:34Z`，正好落在 autocompute 开始（02:20:28）与 MMetrics 开始（02:21:36）之间，说明显示时间与 UTC 一致。详情见 `evidence/timestamps.json`。

复读说明：2026-10-28 再次执行 `CheckMOSTask`，下载器跳过已存在文件，文件 mtime 仍为 2026-10-21T02:21:59Z / 02:22:02Z，未产生新文件、未改动证据。

## 2. 已证实的事实

1. **唯一 query 是 B 链**：503 条比对、500 个唯一 PDB hit、query 序列集合只有 1 条且与链 B 完全相同，`general.query_sequence` 也是 B。
2. **A 链从未作为 query 出现**：`sequence_info.fasta` 只有 `heavy_sequence`（B）和 `light_sequence=None`；blast 输出中不存在 A 序列。
3. **500 个 hit 全是免疫球蛋白家族**：库为 PDB/RCSB，identity 53.7%–100%，E 值 2.1e-92–3.4e-36，最高命中 `pdb|5JDS|B` 100%；在每条 `hit_sequence_full` 中检索 5 个 PD-L1 特征片段，命中数为 0。
4. **原生 record 的三个注释字段同时为空**：`annotations.homology=[]`、`uniprot=[]`、`pdb=[]`，`model_tasks.results=[]`。
5. **不存在失败/跳过记录**，也不存在任何 A 链检索任务。

## 3. 排除项

- **"检索了 PD-L1 但没有显著同源"**：现有证据不支持。没有任何 A 链 query 产物；除非服务端做过且未留痕，否则这句话没有依据。
- **"503 条是 PD-L1 的同源证据"**：错误。query 全是 B，hit 全是抗体/纳米抗体。
- **"有任务失败被忽略"**：不成立，任务板全为 SUCCEED。

## 4. 最可能原因（推断，非证实）

- **M1（对本次运行置信度高）**：autocompute 的序列检索步骤把抗体重链（B）当作唯一 query，抗原链（A）根本没提交。与用户看到的 UI 文案"Searched by antigen sequence similarity"直接冲突——文案说的是抗原检索，实际执行的是抗体检索。
- **M2（中）**：homology 注释按抗原检索结果装配，只有 B 的结果 ⇒ 装配为空。
- **M3（中，暂不能与 M2 区分）**：MMetrics 只从"非免疫球蛋白 hit"或 `model_tasks.results` 装配 homology；本次 hit 全是 Ig 家族、`model_tasks.results=[]`，两种情况下都会得到 `[]`。

一个支持"不是数据库没结果"的旁证：本次搜索触发了 500 条上限、阈值相当宽松（E 值上限 3.4e-36，identity 下限 53.7%），说明检索配置并不严格。据此推测，若真以 A 链 118 aa 去查 PDB，应能命中 PD-L1 结构——但这是领域常识推断，本次**没有**实测。

## 5. 尚缺证据

- mos-blast / mos-autocomp-analysis / MMetrics postprocessing 的**源码与配置不在本沙箱内**（服务为远端；本地无 `mos`/`mocha`/`mmetrics` 包），无法引用具体文件、行号与代码片段。这是访问限制，不是"没有检查"。
- 无任务日志、stderr、中间 query 清单，也看不到 autocompute 内部如何判定抗体/抗原链。
- UI 文案为用户转述，会话无法读取 UI。
- 无法确认 MMetrics 是否自己另发过抗原检索（payload 无相应参数，但服务端行为不可观测）。
- `project=342604060136448` 无法用现有只读工具核验，仅按用户提供记录。

## 6. Sequence Homology Search 工具（只读 schema）

- 可**显式**用 A 链单独作对照：`sequence` 直接给 118 aa，或 `pdb_path` + `chain_id="A"`（schema 明确：取该链序列作 query；两者同给时 `sequence` 优先）。
- 参数：`local`（默认 true）、`max_seq`（默认 500）、`chain_id`、`pdb_path`、`sequence`、`custom_output_path`。
- 输出字段（以原生 mos-blast 文件实测为准，`data[] + general{}` 结构）：hit_id / hit_name / display_name / hit_desc / hit_db / reference / hit_len / hsp_id / query_sequence_full·aligned·print / hit_sequence_full·aligned·print / midline·print / identity / identity_percentage / positive / gaps / score / bit_score / e_value / query_from·to / hit_from·to / links.web_link·download_link；`general` 含 query_sequence 与 score/E 值/identity 的 min-max 及 references。
- schema 原文：`tooling/sequence_homology_search_schema.json`。

## 7. 建议的下一步

1. **对照实验**：用 Sequence Homology Search 以 A 链 118 aa 为 query（max_seq 500、local 默认）跑一次。>0 命中 ⇒ 空字段是路由/装配问题；0 命中 ⇒ 空字段本身正确，问题转到库与阈值。需你批准后才会提交任务。
2. 把 task ID `342604299285504`、`342604577018880` 与本次证据提交平台，索取 autocompute 的链角色判定日志，把 M1 从推断变成实证。
3. 若平台修复，用同一结构副本重跑 MMetrics 做前后对比，不改动本次归档。

## 8. 文件

```
diagnosis.json                          三分法结论（已证实/最可能/缺证据）+ 证据索引
evidence/task_board_snapshot.txt        6 个任务的只读快照
evidence/task_342604299285504_*.{txt,json}
evidence/task_342604577018880_*.{txt,json}
evidence/record_annotations_excerpt.json
evidence/blast_query_analysis.json      query/命中统计与 PD-L1 motif 检索结果
evidence/timestamps.json                原始时间串 + epoch → UTC 换算与一致性
evidence/raw/                           原始 mos-blast JSON、sequence_info.fasta、record.json
tooling/sequence_homology_search_schema.json
source_review/access_probe.txt          源码/包可访问性探查
source_review/grep_results.txt          允许范围内（skills 目录）的定向检索结果
scripts/                                诊断脚本
```

---

## 9. 对照实验（2026-10-28 追加，见 control_A118/）

在不改动上述只读诊断的前提下，新增 1 个独立 Sequence Homology Search：`diag_PDL1_A118_20261028`，Task ID `345176768607232`，**succeed**，3s，payload = `sequence`（链 A 完整 118 aa）+ `local=true` + `max_seq=500`。

结果：473 条比对 / 457 唯一 hit / 457 条 FASTA；PDB 239 条（233 唯一，63 条 E<1e-5），UniProt 234 条（224 唯一，17 条 E<1e-5）。首位 `pdb|5JDS|A` 为 PD-L1，identity 1.0、覆盖 1–118 全长、E=5.2e-85；UniProt 首位 `sp|Q9NZQ7.1`，identity 1.0，query 2–116 对齐 UniProt 18–132。

定位与边界：

- **能证明**：链 A 序列可检索且同源物充足，即使只看 PDB 也有大量显著命中；空 homology 字段不是"没有同源物"或阈值过严造成的。
- **不能证明**：具体哪一段后台实现出错（query 选择/链路由、结果入库、annotations.homology 装配、下游过滤均未观测）。对照用的是不同服务调用与更宽的库（PDB+UniProt vs 原生仅 PDB），且未测试链角色判定规则。
- **没有修复**：原生 `record.json` 仍为 `homology=[]`、`uniprot=[]`、`pdb=[]`；未重跑 MMetrics、未回填、未改任何旧归档。

三方并列见 `control_A118/comparison.json`，实验细节见 `control_A118/README.md`。

> 注：本目录中的 `diagnosis.json` 与第 1–8 节描述的是对照实验之前的只读诊断状态；其 `files` 清单不含 `control_A118/`。
