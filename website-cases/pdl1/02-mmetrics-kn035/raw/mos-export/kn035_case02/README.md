# kn035_case02 — MMFold_1（KN035 VHH / 人 PD-L1）原生 MMetrics 结果归档与核验

本目录只针对当前已导入的 `MMFold_1.cif`。没有重新预测，没有使用 5GRJ / 7XYQ / 5JDS 作为参考结构，没有改动其他项目或任务。

## 1. 对象与任务

| 项 | 值 |
|---|---|
| 显示名 | `MMFold_1.cif` |
| object_id | `342604293768192` |
| work_id | `342604299084800` |
| tos_key | `user_objects/123/330665428816896/342604293768192_MMFold_1.cif` |
| 原生自动 MMetrics 任务 | `342604577018880`（`mmetrics-analysis-342604299285504`）**succeed**，3s |
| 原生自动前置任务 | `342604299285504`（`autocompute-MMFold_1`）**succeed**，1.1min |
| MMetrics 记录 ID | `caca9ec3-b45d-4c7a-a69d-99cc182aa3f6` |
| 当前是否仍在计算 | 否（两个任务均已完成；本会话未新建任何任务） |

## 2. 结构与编号核验

- 链 A：人 PD-L1，118 aa，entity 1。
- 链 B：KN035 VHH（重链单域，无轻链），128 aa，entity 2。
- 246 个残基全部建模，`label_seq_id == auth_seq_id == _mos_mapping.mapped_seqidx == MMFold_1 编号`，每条链连续 1..N，无插入码、无缺失残基、无 altloc、无 HETATM。
- 原始文件 SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`；MOS 对象的 SHA256 **相同**——sanitize 没有改变任何字节，CIF 内新增的 `_mos_mapping`（246 行）逐行是恒等映射。逐残基表见 `numbering-map.json`。

序列层面的外部核对（本地分析，不属于原生输出）：

- 链 A = UniProt Q9NZQ7（人 PD-L1）第 18–132 位精确匹配 115/115，另外带一个 N 端起始 Met 和一个非天然的 C 端 `LE`（Q9NZQ7 133–134 为 `AP`）。
- 链 B 在原生 mos-blast 中的最高命中为 PDB 5JDS chain B，identity 100%（128/128），是该纳米抗体自身的序列，属于自命中，不构成独立同源证据；按案例要求未使用该结构。

## 3. 原生 / 独立 / 本地 三层严格分离

- **原生（native）**：`raw/` 下两个任务目录。`record.json`、7 个 autocompute 输出、任务状态文本、任务 payload，全部逐字保存；autocompute 对象另按 object_id 重新下载并按 SHA256 证明与平台重命名后的下载文件一致（`object_manifest.json`）。
- **独立任务（independent）**：**无**。本会话没有启动 Antibody Region Annotation / Antibody Nativeness / Paratope Identification 或任何其他 MOS 任务。
- **本地分析（local）**：`derived/verification/` 下的编号核验、重原子接触重算、UniProt 序列核对。它们不与原生结果混放，也不冒充原生字段。

## 4. 请求项逐条状态

| 请求项 | 状态 | 位置 |
|---|---|---|
| Description / reasoning / 链角色 | 有 | `derived/mmetrics/description.json` |
| Homologs | 有，但为空（`[]`），原样保留 | `derived/mmetrics/homologs.json` |
| Paratope | 有（链 B 18 残基） | `derived/mmetrics/paratope.json` |
| Epitope | 有（链 A 19 残基） | `derived/mmetrics/epitope.json` |
| CDR（IMGT/Kabat/Chothia） | 有，但只是顺序编号区间 | `derived/mmetrics/cdr_annotations.json` |
| Domain | **缺失**（原生 record 无该字段） | `derived/mmetrics/domain.json` |
| PTM | **缺失**（原生 record 无该字段） | `derived/mmetrics/ptm.json` |
| UniProt | 有，但为空（`[]`） | `derived/mmetrics/uniprot.json` |
| PDB cross-ref | 有，但为空（`[]`） | `derived/mmetrics/pdb.json` |
| Interaction Network | 有（44 条带类型与距离的相互作用） | `derived/mmetrics/interaction_network.json` |
| 全部 MutX CSV | 有（4 张） | `raw/native_task_342604299285504/`、`derived/mutx/mutx_manifest.json` |
| AbAn heavy CSV | **缺失** | `derived/antibody/aban_abscn_paradt_status.json` |
| AbScN heavy CSV | **缺失** | 同上 |
| ParaDt heavy CSV | **缺失** | 同上 |
| 紧凑序号映射 | 有（由原生 diffaffinity 的 `mutstr` 解出） | `derived/mutx/affinity_compact_numbering.csv` |

缺失项一律写"缺失"，没有用其他任务或本地推断填补。

## 5. 需要注意的三处原生结果内部情况

1. **44 与 51**：`classification.reasoning` 写的是 51 个 contacts，而 `meta.n_contacts` 与相互作用列表是 44。两者其实相容：44 是带类型的相互作用记录数（9 HBOND + 33 VDW + 1 IONIC + 1 PIPISTACK），51 是任一重原子距离 ≤ 5 Å 的残基对数。本地重算同时复现了 44 和 51（`derived/verification/contact_crosscheck.json`）。
2. **表位/副位与 5 Å 集合完全一致**：本地 ≤5 Å 得到的链 A 19 个残基、链 B 18 个残基，与原生 epitope / paratope 列表逐位相同，说明这两份注释由同一结构阈值产生。
3. **原生注释为空但生物学明确**：record 里 homology / uniprot / pdb 都是空，导致 description 写"无法指定物种或功能"。但链 A 序列本身与 PD-L1 完全匹配——这是外部核对得到的，不是 MMetrics 给的。

## 6. 目录

```
provenance.json        对象/哈希/谱系/文件清单
numbering-map.json     246 残基逐残基 MOS ↔ MMFold_1 映射与不变量
task-ledger.json       任务 ID/状态/payload/输出/请求项矩阵
raw/structure/         原始与 MOS 对象副本（两者字节相同）
raw/native_task_342604299285504/   7 个原生输出 + 状态 + payload + 对象清单 + 原始命名对象
raw/native_task_342604577018880/   record.json + 状态 + payload
derived/mmetrics/      从 record.json 逐字段拆出的原生结果
derived/mutx/          4 张 MutX 的清单 + 紧凑序号表
derived/antibody/      AbAn/AbScN/ParaDt 缺失说明
derived/verification/  本地核验结果
scripts/               全部生成脚本（编号、接触、打包）
```
