# control_A118 — 最小对照实验（独立任务，非原生）

## 任务

| 项 | 值 |
|---|---|
| Task name | `diag_PDL1_A118_20261028` |
| Task ID | `345176768607232` |
| Type | Sequence Homology Search |
| Status | **succeed** |
| Started（原文） | `2026-10-28 08:47:52`（平台未标时区；会话时钟为 `2026-10-28T08:47:5xZ`，与 UTC 一致） |
| Duration | 3s |
| Payload | `{"sequence": "<118 aa>", "local": true, "max_seq": 500}`，无额外字段 |
| 输出 | `raw/similarity_results.json`、`raw/all_sequences.fasta` |

query 为 MMFold_1 链 A 完整 118 aa，经 sequence-toolkit 存储校验（`diag_PDL1_A118`，length=118），未使用 B 链、未使用 221 aa 旧构建体。

## 结果

- 比对 **473** 条，唯一 hit **457** 个，FASTA **457** 条（457 个唯一 ID，16 个 hit 有多个 HSP）。
- 数据库：`pdb` 239 条比对 / 233 唯一 hit；`sp`（UniProtKB/Swiss-Prot）234 条 / 224 唯一 hit。
- query 核验：`general.query_sequence` 与输入 118 aa 完全一致（长度 118）；473 条比对的 `query_sequence_full` 只有 1 种取值且等于输入；无任何 B 链 query。
- 显著性：E < 1e-5 共 80 条（PDB 63 条），E < 1e-3 共 120 条；identity 上限 1.0，下限 0.183（尾部低质量命中）。

前 5 条 hit（identity 为工具原始 0–1 标度，非百分数）：

| # | hit_id | description | identity | E-value | query 覆盖 |
|---|---|---|---|---|---|
| 1 | `pdb|5JDS|A` | Chain A, Programmed cell death 1 ligand 1 [Homo sapiens] | 1.0 (118/124) | 5.20957e-85 | 1–118（全长 118） |
| 2 | `pdb|6VQN|A` | Programmed cell death 1 ligand 1 [Homo sapiens]（多链合并条目） | 1.0 (116/129) | 1.23162e-83 | 1–116 |
| 3 | `pdb|8RPB|P` | Programmed cell death 1 ligand 1 [Homo sapiens] | 1.0 (116/125) | 1.69127e-83 | 1–116 |
| 4 | `pdb|6NM7|A` | Programmed cell death 1 ligand 1 [Homo sapiens] | 0.9914 (115/129) | 4.59752e-83 | 1–116 |
| 5 | `pdb|5IUS|C` | Programmed cell death 1 ligand 1 [Homo sapiens] | 1.0 (116/225) | 6.21143e-83 | 1–116 |

UniProt 最高命中 `sp|Q9NZQ7.1`：identity 1.0，query 第 2–116 位对齐 UniProt 第 18–132 位（115/115），query 第 1 位 Met 与第 117–118 位 LE 未对齐——与先前独立序列核对一致。

## 能证明什么

1. 链 A 序列本身可检索，且同源物充足；空字段不是"没有同源物"。
2. 即使只看 PDB（与原生 B 检索同一库），仍有 239 条比对 / 233 唯一 hit、63 条 E<1e-5，首位为 PD-L1 全长 100%。
3. 因此 `annotations.homology=[]` 属于原生流程对抗原的处理问题，而不是数据或阈值本身不成立。

## 不能证明什么

1. 不能定位到具体实现环节：是 autocompute 的 query 选择/链路由、结果入库、`annotations.homology` 装配，还是下游过滤，仍全部未知。
2. 不能证明原生 autocompute 若拿到 A 链会得到同样结果：本对照是另一个服务调用（Sequence Homology Search vs 内部 mos-blast），且检索库更宽（PDB + UniProt vs 仅 PDB）。PDB 子集是可比的部分。
3. 不能证明 MMetrics 拿到 A 链结果就会回填 homology——装配逻辑未读到。
4. 没有测试"抗原 vs 抗体"链角色判定规则；本实验通过直接给序列绕过了它。
5. **没有修复任何东西**：`record.json` 仍是 `homology=[]`、`uniprot=[]`、`pdb=[]`，未重跑、未回填、未改注释。

## 文件

```
task_status.txt            状态与时间原文
task_payload_actual.json   实际提交 payload
input_schema.json          读取到的工具 schema
summary.json               核验与统计
comparison.json            与原生 B 链检索、MMetrics 记录的三方并列
raw/                       原始 JSON 与 FASTA
``` 
