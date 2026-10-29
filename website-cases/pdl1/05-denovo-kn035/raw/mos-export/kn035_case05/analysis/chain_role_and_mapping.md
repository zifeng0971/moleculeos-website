# 输出链角色 与 编号映射

## 角色（三个任务一致）

| 位置 | 链 | 身份 | 长度 |
|---|---|---|---|
| 输入（主结构 MMFold_1_chain_A） | **A** | PD-L1 IgV 靶点 | 118 |
| 任务输出 `<id>_output.cif` | **A** | 新设计 binder 骨架（全 GLY 虚拟占位） | 73 (seed111) / 66 (seed222) / 待 seed333 |
| 任务输出 `<id>_output.cif` | **B** | PD-L1 靶点（与输入链 A 同一分子） | 118 |
| 任务输出 `<id>_aligned.cif` | **A** | 真实设计序列（sequence design 后）+ 其预测结构 | 同上 |
| 任务输出 `<id>_aligned.cif` | **B** | PD-L1 靶点 | 118 |

即：**角色发生了重命名**——输入链 A（靶点）在输出里变成链 **B**；输出链 **A** 是全新的 binder。

## 靶点 输出B → 主结构 A 的逐残基映射

`output_chain_map_to_main.csv`（118 行）。规则为**恒等**：

- 输出链 B 残基号 = 主结构链 A 的 `label_seq_id` = `auth_seq_id` = MOS 编号，1–118；
- 实测依据：输出链 B 序列与主结构链 A 序列 118/118 完全一致，无插入码、无缺残基、无偏移；
- 因此 hotspot（主结构 A45/A40/A97/A107/A105/A38）在输出复合物中读作 **B45/B40/B97/B107/B105/B38**。

## Binder 链（输出 A）

新设计的 binder 在 MMFold_1 中**没有对应物**，因此**不做任何强行映射**：其残基编号是 binder 内部编号 1..N（N = 73 / 66 / …），不与主结构的任何残基对应。`output_chain_map_to_main.csv` 中不含 binder 的映射行，这是刻意留空而非遗漏。

## 骨架虚拟序列 vs 真实设计序列

- `*_output.cif` 链 A：全 GLY，**虚拟骨架占位**，不是真实序列，不得当作设计结果引用。
- `*_aligned.cif` 链 A：compare_binder 的**真实设计序列**（见 `outputs/seed*/sequences.fasta`，标签 `designed_sequence_complex_binder`）。

## 置信度指标

平台本次只返回两个 CIF，未附带 ipTM / pLDDT / PAE / score JSON。**这些指标为缺失**，不做估算或替代。
