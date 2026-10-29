# KN035 Case 05 — 第二轮 de novo（seed 444 / 555 / 666）

授权：用户明确授权再跑 3 次真正 de novo。复用本项目原有 PD-L1 对象，未重算主结构，未使用任何现有 binder 重设计，未改动首轮任务/文件/项目。

## 输入（与首轮完全相同）

| 项目 | 值 |
|---|---|
| MOS object ID | `342605515027456` |
| TOS key（提交用） | `user_objects/123/330665428816896/342605515027456_MMFold_1_chain_A.cif` |
| 生效 TOS（平台回显） | `tos:mosv2-prod/user_objects/123/330665428816896/342605515027456_MMFold_1_chain_A.cif` |
| sha256 | `8303fd1077893b07cb6ab679f5fa0db8753ba6a1f0039d05089c5a786b38253e`（与用户给值一致，已重算） |
| 结构 | 链 A，118 aa，1–118 |
| 包内副本 | `inputs/MMFold_1_chain_A.cif` |

## 参数来源

`schema/protein_binder_design_schema.json` 为原样复制的 schema；`payloads/payload_seed{444,555,666}.json` 由首轮 `payload_seed111.json` **程序化复制**并仅改 `random_seed`（脚本内断言除该字段外全部逐字相同）。

`contigs="A1-118/0 60-100"`，`hotspot_res="A45,A40,A97,A107,A105,A38"`，`compare_binder=1`，`diffusion_steps` 未设置（平台默认 50）。

## 任务与用时

| seed | task ID | 状态 | 平台用时 | binder 长度 | 真实设计序列（输出链 A） |
|---|---|---|---|---|---|
| 444 | `342610714428416` | succeed | 6.5 min | 79 | `AAELAEIEEQIAAIAERIAELEAEAAALRARLERDTDLAPEERARLEARVAALEQSAAIL…`（全文见 FASTA） |
| 555 | `342610715788288` | succeed | 3.6 min | 72 | `MMNEEEAEEMAAKAREYAALLAAGAPVAELEAEARRLREEAKKADESKAAFLESLARGLE` |
| 666 | `342610718331904` | succeed | 9.5 min | 89 | `AAEGAARAAALRRQAAEAAAAEQRQVEVGAEKFLRIAAGELSDEESIEIYDKYEDSLPDIRAVLAADAAKLAAFDAAVARIEALKAARK` |

三个任务均在约 10 分钟内完成，无失败、无 429、无 budget_exceeded。

## 链角色与映射

输出链 **B** = PD-L1 靶点，与主结构链 A 编号恒等（`inputs/output_chainB_to_main_chainA_mapping.csv`，118 行）。
输出链 **A** = 全新 de novo binder，在 MMFold_1 中无对应物，**刻意不映射**。

`*_output.cif` 链 A 为全 GLY **虚拟骨架**（非设计序列）；`*_aligned.cif` 链 A 为 compare_binder 的**真实设计序列**。FASTA 中两类分别标注。

## 置信度

平台每个任务只返回两个 CIF，**未提供 ipTM / pLDDT / PAE / score 文件 → 缺失**，未做任何估算。

## 本包不含几何分析

按要求不扩展分析。SASA、热点距离、Cα RMSD、接触重合由本地独立复算。
