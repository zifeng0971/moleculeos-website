# kn035_case02_supplement — 独立抗体任务输出（非原生）

本目录只补充用户要求的抗体 CSV。四个任务都是本次新启动的**独立任务**，输入是 MMFold_1 链 B（KN035 VHH）完整 128 aa。它们**不是**原生 MMetrics 结果，不替代、不修改 `/workspace/kn035_case02/` 中的任何文件。

## 1. 任务

| 任务类型（实际 display name） | Task ID | 状态 | 耗时 | 输出 |
|---|---|---|---|---|
| Antibody Region Annotation（AbAn） | `342606092895232` | succeed | 20s | `abnumber_heavy.csv` |
| Antibody Language Scoring（AbScN，语言模型打分） | `342606094599168` | succeed | 3s | `ablang_heavy_scores.csv` |
| Antibody Nativeness Evaluation（AbScN，人源化/nativeness 打分） | `342606097245184` | succeed | 3s | `abnativ_heavy.csv` |
| Paratope Identification（ParaDt） | `342606100722688` | succeed | 25s | `paragraph_heavy.csv` |

任务名分别为 `kn035-AbAn-independent`、`kn035-AbScN-language-independent`、`kn035-AbScN-nativeness-independent`、`kn035-ParaDt-independent`。

AbScN 在 MOS 上没有单一同名任务，实际存在两个不同任务类型，两者都已运行并分目录保存，便于用户按需取用；没有把任何一个说成是另一个。

ParaDt 提交时 `pdb_path` 写的是 `user_objects/123/.../342604293768192_MMFold_1.cif`，实际生效值为 `tos:mosv2-prod/user_objects/123/330665428816896/342604293768192_MMFold_1.cif`（平台自动补全 TOS 前缀），两者都记录在 payload 与 manifest 中。`pdb_heavy_chain=B`、`is_pdb_numbered=false`、`light_sequence=null`。

## 2. 序号映射

所有 CSV 的序号都能无歧义落到 MMFold_1 链 B 的 `label_seq_id`：

- `abnumber_heavy.csv`、`abnativ_heavy.csv`、`paragraph_heavy.csv`：`aa_index` 就是 `label_seq_id`（1..128）。
- `ablang_heavy_scores.csv`：`mutation` 形如 `Q1A`，数字段即 `label_seq_id`；`chain` 列写 `H`，对应结构链 `B`。
- 映射依据：链 B 在 MMFold_1 中完全建模、起始 `label_seq_id=1`、无插入码、无缺失残基（见 `../kn035_case02/numbering-map.json`），因此顺序索引 = `label_seq_id`。

逐残基映射文件在 `mapping/`：

| 文件 | 内容 |
|---|---|
| `mapping_abnumber_heavy.csv` | 128 行；`label_seq_id` + `pos_imgt/region_imgt` + `pos_kabat/region_kabat` + `pos_chothia/region_chothia` |
| `mapping_ablang_heavy_scores.csv` | 2560 行逐个替换；`mutation` → `label_seq_id`、wt 校验、score |
| `mapping_ablang_per_residue.csv` | 128 行按残基汇总 20 个替换的 min/max/mean |
| `mapping_abnativ_heavy.csv` | 128 行；humanness 分数 |
| `mapping_paragraph_heavy.csv` | 128 行；paratope 分数 |
| `mapping_summary.json` / `mapping_verification.json` | 映射说明与自动校验结果 |

校验结果：四个 CSV 的序列与链 B 完全一致；所有 `label_seq_id` 连续 1..128；AbLang 2560 条替换的野生型字母与结构序列全部吻合（0 处不符）。

AbAn 的编号列是带插入码的标准方案位置，但存在两处需要使用者注意的地方：

- IMGT 列有标准缺口（H9→H11、H30→H35、H59→H62、H72→H74），另有插入码 H111A–H111D。
- 残基 108–111 的 IMGT 位置依次为 `H112D, H112C, H112B, H112A`（由工具原样输出，呈降序），随后残基 112 才是 `H112`。此处按原样保存，未做任何"修正"。

## 3. ParaDt 与原生 paratope 的关系

`comparison/paradt_vs_native_paratope.json` 只做对照：独立 ParaDt 取分数最高的 18 个残基，与原生 MMetrics paratope 的 18 个残基重合 12 个；两者都集中在 CDR3，独立模型另外给出 CDR2/FR 的若干位点，而原生结构法另含 N 端 CDR1 的 27/29/30/32。该对照不改变原生结果，也不作为原生结果的替代。

## 4. 目录

```
supplement-manifest.json          总清单：任务、payload、哈希、分离声明
tasks/<slug>/                     CSV + input_schema.json + task_payload_actual.json + task_status.txt
mapping/                          每个 CSV 的逐残基序号映射与校验
comparison/                       ParaDt 与原生 paratope 的对照
scripts/                          生成与校验脚本
```
