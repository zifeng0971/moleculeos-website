# KN035 Case 05 — 真正 de novo binder 设计（单链 MMFold_1 chain A）

状态：**3 个任务已真实提交，平台状态 PENDING（排队中）**。本文件会在结果回传后继续更新分析章节。

---

## 1. 输入核验（全部为实测，非假设）

| 项目 | 实测值 |
|---|---|
| MOS object ID | `342605515027456` |
| MOS work ID | `342605519696896` |
| TOS key | `user_objects/123/330665428816896/342605515027456_MMFold_1_chain_A.cif` |
| 本地副本 | `/workspace/protein_data/protein_342605519696896/MMFold_1_chain_A.cif` |
| 本地副本 sha256 | `8303fd1077893b07cb6ab679f5fa0db8753ba6a1f0039d05089c5a786b38253e` |
| 通过 `GetMOSObject` 重新下载的副本 sha256 | `8303fd1077893b07cb6ab679f5fa0db8753ba6a1f0039d05089c5a786b38253e`（与本地逐字节相同） |
| 链 | 仅链 **A**，118 残基，1–118 连续，无缺失 |
| 序列（由 ATOM 记录重建） | `MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE` |
| 序列一致性 | ATOM 重建序列 == `_entity_poly.pdbx_seq_one_letter_code` == 118 aa（完全一致） |
| CIF data block | `342254287430656_model_sample_1`，1 个模型，947 个原子 |

### 关于来源 hash 的诚实说明
用户给出的 `MMFold_1.cif` sha256 = `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。
**该 2 链源文件本身不在本项目内（本项目只有派生出的单链对象），因此无法在此重算并验证此 hash。**
可验证的是：本项目导入对象（单链 A）的字节级 hash 如上，且其序列/编号/坐标就是提交给任务的输入。
"删除链 B、保留 A 全部 118 aa、坐标未改" 这一来源陈述来自用户，未能被本环境独立复核——这是本案例唯一的不可验证环节，已如实记录。

### 逐残基 MOS ↔ MMFold_1 label_seq_id 映射
`analysis/residue_mapping_MOS_vs_MMFold_1.csv`（118 行，含每位点 SASA 与 hotspot 标记）。

结论：**映射为恒等**。文件中 `label_seq_id` = `auth_seq_id` = MOS 编号，均为 1–118，链名全程 `A`，无插入码、无多重 auth 编号、无缺残基（118/118 建模）。因此 MOS 编号与 MMFold_1 的 label_seq_id 一一相同。

---

## 2. Hotspot 选择与编号换算

案例 02 原生 MMetrics 项目 342604060136448 观察到 KN035 表位（19 位点）：
`A38, 40, 42, 45, 47, 50, 52, 53, 57, 60, 97, 99, 101, 103, 104, 105, 106, 107, 109`

按要求取其中 6 个：**A45, A40, A97, A107, A105, A38**（按界面埋藏面积优先）。

本地验证（freeSASA，Shrake–Rupley，探针 1.4 Å，960 点，单链即"未结合态"SASA）：

| case02 编号 | MOS 编号 | 残基 | 单链 SASA (Å²) | ≥20 Å² |
|---|---|---|---|---|
| 45 | 45 | Asp | 135.50 | 通过 |
| 40 | 40 | Tyr | 58.85 | 通过 |
| 97 | 97 | Arg | 67.67 | 通过 |
| 107 | 107 | Tyr | 98.36 | 通过 |
| 105 | 105 | Ala | 62.99 | 通过 |
| 38 | 38 | Ile | 63.65 | 通过 |

换算证据：恒等映射下 6 个位点全部暴露（≥20 Å²）；若假设 case02 用的是 UniProt 全长编号（信号肽 1–18，即 MOS = 编号 − 17），则 A97→80 (Asn, 2.96 Å²) 与 A105→88 (Val, 0.10 Å²) 落在完全埋藏的核心，物理上不可能是 KN035 界面热点。因此采用恒等映射，表中 MOS 编号即提交编号。

提交字符串：`hotspot_res = "A45,A40,A97,A107,A105,A38"`

---

## 3. Protein Binder Design 实际 schema 与 payload

Schema 原文存于 `schema/protein_binder_design_schema.json`（由 `GetMOSTaskSchema('Protein Binder Design')` 取得）。
必需字段：`input_structure`, `contigs`；可选：`hotspot_res`, `random_seed`, `compare_binder`, `diffusion_steps`。

参数决定（全部按 schema 文本，非猜测）：
- `contigs = "A1-118/0 60-100"` — 固定靶点 A1–118 全链，`/0` 为链断裂，随后裸数字区间 `60-100` 表示幻觉生成 60–100 aa 的新链（即 binder 长度区间）。
- `compare_binder = 1` — schema 明确：backbone 生成后运行序列设计 + 结构预测，返回对齐的比较结构（即真实序列 + 复合物预测）。
- `diffusion_steps` 未设置 → 采用平台默认 50（schema 默认值）。
- `random_seed` = 111 / 222 / 333，三次完全独立。

三个 payload 原文：`payloads/payload_seed111.json`、`payload_seed222.json`、`payload_seed333.json`。
唯一的差异字段是 `random_seed`。

---

## 4. 任务 ledger

| run | task name | task ID | seed | 提交时间 (UTC) | 状态 |
|---|---|---|---|---|---|
| 1 | kn035_c05_denovo_seed111 | `342606137910272` | 111 | 2026-10-21T02:28:04Z | PENDING |
| 2 | kn035_c05_denovo_seed222 | `342606139298816` | 222 | 2026-10-21T02:28:04Z | PENDING |
| 3 | kn035_c05_denovo_seed333 | `342606141764608` | 333 | 2026-10-21T02:28:04Z | PENDING |

机器可读版：`tasks/task_ledger.json`；平台快照：`tasks/status_snapshot_*.txt`。

---

## 5. 合规声明

- 未使用任何现有 binder 重设计冒充 de novo；三条 binder 均来自上述三个独立 de novo 运行。
- 未使用 5GRJ / 7XYQ / 5JDS 的坐标作为输入、模板或对照。
- 未读写其他项目（案例 02 的 MMetrics 项目仅引用用户给出的表位位点列表，未访问其数据）。
- 骨架阶段的虚拟 GLY 序列与 compare_binder 输出的真实设计序列将**分别标注**。
- 平台未提供的置信度指标（ipTM / PAE 等）将写为"缺失"，不做推断。

---

## 6. 结果分析（待任务完成后填充）

计划（脚本将在此目录下保存）：
1. 下载全部原始输出 / 结构 / FASTA / 日志；列出实际字段，有什么写什么。
2. 分离两类序列：骨架虚拟序列（GLY 占位）与真实设计序列（compare_binder 结果）。
3. 本地计算：hotspot（A45/40/97/107/105/38）到 binder 的最近重原子距离、binder 与靶点 SASA/BSA 界面面积。
4. 以复合物中 PD-L1（链 A）Cα 叠合到原始 MMFold_1 chain A，报告 RMSD 与配准后的接触位点。
5. 接触位点 vs 案例 02 KN035 原生表位（19 位点）：重合率与 Jaccard。
6. 打包 `kn035_case05.zip`。

---

## 7. 运行结果（三个任务全部 succeed）

| seed | task ID | 状态 | 用时 | binder 长度 | 骨架虚拟链 | 真实设计序列（输出链 A） |
|---|---|---|---|---|---|---|
| 111 | `342606137910272` | succeed | 3.7 min | 73 | 73×GLY | `AAAAAAAAAAAAAAAEAAAAAAAAAAAEAEAAALRAEEEKREAELRKLQEKKNEEKRLARIAAWKAAAAAAAL` |
| 222 | `342606139298816` | succeed | 6.7 min | 66 | 66×GLY | `AAEERAAAEAKAAAIRAEVEAARAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` |
| 333 | `342606141764608` | succeed | 9.7 min | 95 | 95×GLY | `SALDARVAELAAIMAEVAKLAARALALLRAGPASAAEADAAEAELRALLDRHLEKAREMGENEVALIEALRAQVLGRLAAERAALAAAAAAAAAA` |

每个任务产物固定为两个 CIF：`*_output.cif`（全 GLY 骨架，虚拟序列，不可当作设计结果）与 `*_aligned.cif`（compare_binder 的真实序列 + 复合物预测）。**平台未返回 ipTM / pLDDT / PAE / score 文件 → 记作缺失。**

链角色已重命名：输入链 A（PD-L1）在输出中变为链 **B**；输出链 **A** 是全新 binder。靶点映射恒等（`analysis/output_chain_map_to_main.csv`，118 行），binder 残基在 MMFold_1 中无对应物，刻意不映射（`analysis/chain_role_and_mapping.md`）。

## 8. 已算数值（供独立复算对照，非最终裁决）

来自 `analysis/analysis_seed*.json`，口径：freeSASA Shrake–Rupley 探针 1.4 Å / 960 点；接触 = 重原子 <4.0 Å；界面 = 结合前后每残基 SASA 减少 >0.1 Å²；Cα 叠合为 Kabsch 全 118 Cα。

| seed | binder | 界面 BSA (Å²) | 靶点侧 / binder 侧 | 接触对 (<4 Å) | 靶点界面残基 | 与 KN035 19 位点重合 | Jaccard | 复合物靶点 Cα RMSD 到原始 MMFold_1 (Å) |
|---|---|---|---|---|---|---|---|---|
| 111 | 73 aa | 1236.6 | 539.6 / 697.0 | 23 | 21 | 15/19 | 0.600 | 0.488 |
| 222 | 66 aa | 1219.9 | 616.0 / 603.9 | 18 | 21 | 16/19 | 0.667 | 0.383 |
| 333 | 95 aa | 1823.7 | 849.5 / 974.2 | 38 | 26 | 19/19 | 0.731 | 0.366 |

hotspot 最近重原子距离（靶点编号，输出复合物中读作链 B）：

| seed | B38 | B40 | B45 | B97 | B105 | B107 |
|---|---|---|---|---|---|---|
| 111 | 5.33 | 5.62 | 6.22 | 5.94 | 3.67 | 5.30 |
| 222 | 6.70 | 7.44 | 7.24 | 7.35 | 3.76 | 6.61 |
| 333 | 5.75 | 7.33 | 4.67 | 5.21 | 4.17 | 6.10 |

说明：三次运行都落在同一表位区域，但没有任何一次给出结合置信度指标；这些数值只描述几何与埋藏，不构成亲和力或成功率结论。骨架阶段 CIF 的靶点 Cα RMSD 为 0.063–0.066 Å（输入固定未动），复合物预测后为 0.366–0.488 Å。
