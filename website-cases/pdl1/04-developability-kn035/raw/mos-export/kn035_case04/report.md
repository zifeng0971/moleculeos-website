# 案例04：KN035 VHH（MMFold_1 链B，128 aa）框架区单点候选与三模型突变效应扫描

日期：2026-10-21 ｜ 结构对象：MMFold_1_chain_B.cif（object 342605177943040）｜ 序列库ID：kn035_vhh_c04_wt

---

## 1. 结论摘要

1. **结构输入核验通过**：链B 派生结构为单一链、128 个残基、坐标/编号与 MMFold_1 完全一致（label_seq = auth_seq = MOS 编号 = 1–128），无缺失残基、无缺失 CA、无 altloc、占有率全为 1.0、无链断裂、无配体/水。sha256 = `49a0e1a6…2f2a24`。未重新预测主结构，未使用 5GRJ / 7XYQ / 5JDS。
2. **三个模型任务全部成功**，均为 128 位点 × 20 种氨基酸的全饱和扫描（各 2560 行原始表）：Structural Stability（342605430273024）、Sequence Fitness（342605430948864）、Evolutionary（342605471151104）。**突变方向经证据确认：分数越高越有利；每个位点的 WT 自身得分恰为 0.0**，因此 delta = score_mut − 0。
3. **输出 9 个框架区单点候选**（≥5 的要求已满足）：6 个位于"远离 paratope"的 Tier A（Q5V、L60Y、M93V、M93T、N73D、A75S），3 个位于"紧邻 paratope"的 Tier B（K50S、K50A、R47L）。全部排除 IMGT CDR B26-33/B51-58/B97-117、18 个 paratope 位点、4 个二硫键 Cys（B22/B33/B96/B106），无 WT→WT。
4. **重要警示**：两个综合分最高的"框架"候选 B:K50S 与 B:R47L 在模型中分别距 CDR3 的 D103 仅 3.35 Å、距 paratope 的 V109 仅 2.63 Å（K50 侧链与 D103 构成埋藏盐桥/氢键，relSASA 仅 0.005），它们并非结构上"远离结合面"，其得分增益可能以结合活性为代价 —— 列为 Tier B，需结合实验优先验证结合。
5. **本地风险扫描**：无 N-糖基化序列子（N-X-S/T）；3 个脱酰胺位点（N74A 低、N84S 中、Q120G 低）、3 个异构化位点（D62S、D90T、D99S）、3 个暴露 Met（M28 在 CDR1 内、M93 可被候选移除、M83 埋藏）+ 2 个 Trp。全部为**本地规则判定，非实验测量**。
6. **与案例03的交叉评估已完成**（11 个候选，见 `cross_eval_case03.md` 与 `affinity-candidates-x-developability.csv/json`）：唯一可进入框架可开发性讨论的是 B:A35S（有条件）；V109 位于原生 paratope/CDR3，明确不属于框架推荐；C33Y 破坏 B33–B106 二硫键，必须排除。案例03 外部结构一律标记 `external_case03_pending_verification`，尚未在本项目核验。

---

## 2. 输入核验与编号映射

### 2.1 对象与哈希

| 项目 | 值 |
|---|---|
| MOS object ID | 342605177943040 |
| MOS work ID | 342605181223936 |
| TOS key | `user_objects/123/330665428816896/342605177943040_MMFold_1_chain_B.cif` |
| 本地文件 | `/workspace/protein_data/protein_342605181223936/MMFold_1_chain_B.cif` |
| sha256（本对象，实测） | `49a0e1a6eb3da121c7eb6fbcf7bdef1d72f943c7d3a81bd786366e11792f2a24` |
| 父结构 MMFold_1.cif sha256 | `d32305d7…44822317`（**用户提供值；父文件不在本项目内，未重新预测、未重新切片、未独立复核**） |
| 派生规则 | 仅保留链B的 atom_site / entity / entity_poly / entity_poly_seq / struct_asym；坐标与 label/auth 编号未改动 |

### 2.2 序列（完整，128 aa）

```
QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRF
TISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS
```

三重一致性核对：`_entity_poly.pdbx_seq_one_letter_code` = `_entity_poly_seq` 逐行拼接 = atom_site 实际残基序列，三者完全相同，长度 128。半胱氨酸位于 C22、C33、C96、C106，与用户给出的二硫键 B22–B96 / B33–B106 一致。

### 2.3 逐残基映射

`mapping_mos_to_MMFold1_chainB.csv` 给出 128 行逐残基对应：MOS 残基号 = MMFold_1 链B auth_seq_id = label_seq_id（1–128 恒等映射），并标注 region（CDR1/CDR2/CDR3/Framework）与保护类型。由于派生时未重排编号，此映射是恒等映射，结构任务输出中的链B编号可直接对回 MMFold_1 链B。

### 2.4 结构完整性

965 条原子记录 / 128 残基；无缺失残基与 CA；无 altloc；占有率全 1.0；CA–CA 连续无 >4.5 Å 断裂；无 HETATM/水。

---

## 3. 保护位点（筛选硬约束）

来源：案例02项目 342604060136448 已显示的 IMGT CDR 与 paratope 列表，本案例直接引用、未重新预测。

| 类别 | 位点 | 处理 |
|---|---|---|
| IMGT CDR1 | B26–B33（GKMSSRRC） | 全排除 |
| IMGT CDR2 | B51–B58（LLTTSGST） | 全排除 |
| IMGT CDR3 | B97–B117（AADSFEDPTCTLVTSSGAFQY） | 全排除 |
| Paratope | B27, 29, 30, 32, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116 | 全排除（18 个位点全部落在 CDR 内） |
| 二硫键 | B22–B96、B33–B106（4 个 Cys 全保护） | 既排除 Cys 位点本身，也排除任何 X→C（新增游离 Cys）与 C→X（破坏二硫键） |

框架区位点共 91 个，扣除受保护 Cys22、Cys96 后为 **89 个可评分框架位点**，对应 89 × 19 = 1691 个非 WT 替换，全部参与候选筛选。

---

## 4. 三个模型任务：payload、方向与单位

| 任务 | task ID | 状态 | 输入 | 原始表 |
|---|---|---|---|---|
| Structural Stability Mutation Effect | 342605430273024 | succeed | `structure_path` = 上述链B对象的 TOS key（**按要求指向链B派生结构**） | `raw/struct_fitness_scores.csv` |
| Sequence Fitness Mutation Effect | 342605430948864 | succeed | `sequence` = 链B实体序列（128 aa，与结构序列一致） | `raw/sequence_scores.csv` |
| Evolutionary Mutation Effect | 342605471151104 | succeed | `sequence` = 同上（从序列库 FASTA 读入并断言长度 128） | `raw/evolutionary_scores.csv` |

**作废任务（未使用）**：342605433852928（Evolutionary 首次提交）因 payload 序列被我误录为 125 aa（漏 K77-S78-T79），其输出全部丢弃、未参与任何分析，已重新提交 342605471151104。此条在 `task_ledger.json` 中如实记录。

### 4.1 方向的证据（不是假设）

| 模型 | WT 自身得分 | WT 为该位点最高分的位点数 | WT 为该位点最低分的位点数 |
|---|---|---|---|
| Structural Stability | 128/128 位点恰为 0.0 | 68 / 128 | 0 |
| Sequence Fitness | 128/128 位点恰为 0.0 | 72 / 128 | 0 |
| Evolutionary | 128/128 位点恰为 0.0 | 87 / 128 | 2 * |

\* Evolutionary 有 2 个位点 WT 与最低分并列：K27 与 C33，均为 CDR1/paratope 位点 —— 即 MSA 模型认为这两个高变位点"任何残基都不比 WT 差"。这正好说明：**进化类打分不能单独用于 paratope，必须靠人工保护名单兜底**。

结论：三模型方向一致 —— **分数越高越有利**；WT 基线 = 0.0；`delta = score_mut − 0`。

### 4.2 单位与解释边界（重要）

- 三张表的 `score` 均为**模型内部的无量纲分数**。Stability 是反向折叠（reverse-folding）的"有利度"，**不是 kcal/mol 的 ΔΔG**；Sequence Fitness 是深度序列模型的偏好度，**不是表达量、溶解度或实测 ΔΔG**；Evolutionary 是 MSA 保守性/共变异性打分，**不是物理能量**。
- 三者的量纲不同，直接相加会被幅度大的模型主导，因此候选排序用 **归一化共识分**：consensus = 三个 delta 各自除以该模型在框架区非 WT 行的 |delta| 第 90 百分位后的平均值（p90：stability 5.57、seq fitness 9.06、evolutionary 10.07）。
- 正向 delta 只代表"模型认为比 WT 更可取"，任何候选都需实验验证，本报告不作功能性断言。

---

## 5. 候选筛选与结果

### 5.1 硬过滤（全部记录在 `candidates_final.csv` 的 acceptance 字段）

F1 仅框架区；F2 非保护位点；F3 非 WT→WT；F4 不新增游离 Cys；F5 不破坏二硫键 Cys；F6 不新增脱酰胺/异构化/N-糖基化 motif；F7 不新增 Met 氧化风险。

分级：
- **strict**：stability_delta ≥ 0 且 seq_fitness_delta > 0 且 evolutionary_delta > 0。
- **extended**：三个 delta 中至少两个 > 0，第三个 ≥ −1.0，且 consensus ≥ 0.05。
- **Tier A**：与最近 paratope 残基的重原子距离 ≥ 8 Å（远离结合面）；**Tier B**：< 8 Å（紧邻结合面，结合风险需实验排除）。

### 5.2 九个框架区单点候选（delta = score_mut − score_WT，WT 基线 0.0；单位均为无量纲模型分）

| 候选 | 分级 | stability Δ | seq-fitness Δ | evolutionary Δ | consensus | relSASA | 距最近 paratope | 备注 |
|---|---|---|---|---|---|---|---|---|
| **B:L60Y** | Tier A / extended | −0.67 | **+3.23** | **+6.32** | 0.287 | 0.17 | L108, 9.9 Å | 序列与进化两模型强支持，结构模型轻微不利 |
| **B:Q5V** | Tier A / strict | **+1.16** | **+1.91** | **+4.11** | 0.276 | 0.48 | Q116, 11.9 Å | 三模型全部为正；N端框架1，远离结合面 |
| **B:M93V** | Tier A / extended | **+2.25** | −0.23 | **+4.04** | 0.260 | 0.23 | S111, 13.1 Å | 同时**移除 M93 氧化风险** |
| **B:N73D** | Tier A / extended | −0.71 | **+4.04** | **+3.92** | 0.236 | 0.21 | R32, 11.3 Å | 序列/进化强支持，结构略不利 |
| **B:M93T** | Tier A / extended | **+1.85** | **+2.92** | −0.88 | 0.189 | 0.23 | S111, 13.1 Å | M93 的另一选择，同样移除氧化位点 |
| **B:A75S** | Tier A / strict | +0.43 | +0.81 | +1.04 | 0.090 | 0.60 | K27, 9.6 Å | 三模型全正但幅度小；表面暴露、远离结合面 |
| **B:K50S** | Tier B / strict | **+1.96** | **+2.20** | **+3.99** | 0.331 | **0.005** | D103, **3.35 Å** | 综合分最高，但 K50 完全埋藏并与 CDR3 的 D103 成盐桥/氢键；改小侧链的增益可能以结合为代价 |
| **B:R47L** | Tier B / strict | +1.35 | +0.88 | **+6.48** | 0.328 | 0.08 | V109, **2.63 Å** | 位于 VHH hallmark 四联体（37/44/45/47）第47位，直接贴 paratope 的 V109；改变原 VH/VL 界面一侧，溶解性/聚集风险未被模型覆盖 |
| **B:K50A** | Tier B / strict | +0.27 | +1.06 | +2.94 | 0.153 | 0.005 | D103, 3.35 Å | K50S 的保守替代方案，同样的盐桥顾虑 |

**全部 9 个候选均明确标注为"候选，未做结构验证 / 未做实验验证"**。若只取 5 个最稳妥的，建议 Tier A 前 5：**Q5V、L60Y、M93V、N73D、A75S**（互相不同位点，均离结合面 ≥9.5 Å）。

### 5.3 生物学解读（按位点）

- **Q5V（框架1，表面）**：三个模型一致偏好，且远离 paratope 与 CDR，是最"干净"的单点。位置5在 N 端 β 折叠起始处，侧链朝溶剂（relSASA 0.48），突变为疏水 Val 可能在表面形成小的疏水斑，建议关注表达后聚集行为。
- **L60Y / L60I（框架3）**：L60 部分埋藏（0.17），位于框架3 的核心堆积区。L60Y 由序列与进化模型强烈支持（+3.23 / +6.32），但结构模型轻负（−0.67）—— 提示芳香侧链在该位点可能的空间代价，这正是需要结构验证的地方。
- **M93V / M93T（框架3 末，CDR3 之前）**：M93 是**唯一暴露的 Met**（relSASA 0.23，M28 在 CDR1 内受保护，M83 埋藏），氧化后可能影响 CDR3 邻近构象。两个替换在移除氧化敏感位点的同时，稳定性模型给出正增益（+2.25 / +1.85）。但因紧邻保守 Y94-Y95-C96，必须确认不扰动 CDR3 主链走向。
- **N73D（框架3）**：序列与进化模型强正（+4.04 / +3.92），结构轻负（−0.71）。该位点靠近 CDR1 背面（距 R32 11.3 Å），侧链部分暴露（0.21），是典型的"表面电荷调整"候选。注意它不引入新的异构化/脱酰胺 motif（其后为 N74，非 G/S/H/T/A/D）。
- **A75S（框架3，表面）**：幅度小但三模型一致为正，且高度暴露（0.60）、离结合面最远的"保守试探"选项。
- **K50S / K50A / K50R（框架2，埋藏）**：K50 侧链与 CDR3 的 D103 形成 3.35 Å 接触，relSASA 0.005 说明它完全埋藏 —— 这是把框架2 锚定到 CDR3 的关键相互作用。三个替换在模型里都"有利"，但**拆掉该盐桥的代价是结合/构象稳定性**，模型（尤其是反向折叠模型）看不到这层耦合。列为 Tier B。
- **R47L（框架2，hallmark 四联体）**：R47 属于骆驼源 VHH 取代 VH/VL 界面的 hallmark 四联体位置。R47L 在进化模型中得分最高（+6.48，全表第一），说明该位点在 VHH 家族中高度可变；但它一旦改动就改变了疏水核心朝 paratope 的一面，且距 V109 仅 2.63 Å。列为 Tier B。

---

## 6. 本地序列风险扫描（`risk_scan_local.csv`，规则法，非实验）

先声明：以下判定完全基于序列 motif 规则 + 链B模型的相对溶剂可及性（Shrake–Rupley / Tien 参考值），**不是实验测量**，也不构成稳定性结论。

| 类别 | 位点 | 判定 | relSASA | 说明 |
|---|---|---|---|---|
| 脱酰胺 | **N84S** | 中 | 0.29 | 部分暴露的 NS motif，最值得关注的实际脱酰胺位点 |
| 脱酰胺 | N74A | 低 | 0.81 | NA motif，低反应性但高度暴露 |
| 脱酰胺 | Q120G | 低 | 0.41 | QG，慢速脱酰胺；位于框架4 |
| 异构化 | **D62S** | 中 | 0.57 | 暴露的 DS motif，iso-Asp 风险 |
| 异构化 | D90T | 中 | 0.02 | DT motif，但埋藏（0.02），实际风险低 |
| 异构化 | D99S | 中 | 0.02 | 位于 CDR3（受保护，不可改），埋藏 |
| 氧化 | **M28** | 中 | 0.34 | 暴露 Met，但位于 CDR1/paratope，不可改；提示制剂需抗氧化 |
| 氧化 | **M93** | 中 | 0.23 | 暴露 Met，可被候选 M93V / M93T 移除 |
| 氧化 | M83 / M34 / W36 / W118 | 低 | 0–0.25 | M34、W36 埋藏；W118 部分暴露 |
| N-糖基化 | — | **无** | — | 全序列无 N-X-S/T（X≠P）序列子 |

对候选的交集：6 个 Tier A 候选均**不新增**任何脱酰胺/异构化/糖基化 motif；M93V/M93T 额外**消除**一个氧化位点。脱酰胺热点 N84S 位于框架3 表面，本次候选池里没有覆盖它（该位点自身得分未进入前列），若后续要做"可开发性改造"，N84S→N84A/N84Q 值得单独设计并重新打分。

---

## 7. 与案例03 亲和力候选的交叉评估（已完成）

完整内容见 `cross_eval_case03.md`、`affinity-candidates-x-developability.csv` / `.json`。共 11 行（03 前三 + 7 个对照 + 界面优先 T105L）。

| 突变 | `ddG_pred` 原始字串 | Stability Δ | Seq-fitness Δ | Evolutionary Δ | 区域 | 结论 |
|---|---|---|---|---|---|---|
| B:A35W | -1.7464554 | −4.93 | −1.99 | −2.24 | Framework | 框架位点但结构代价极大 |
| B:V109L | -1.6510735 | −0.04 | +0.20 | +1.34 | CDR3 / Paratope | **亲和力候选，非框架推荐** |
| B:A35Y | -1.5832196 | −4.14 | +0.55 | −0.02 | Framework | 结构代价极大（**无结构，仅评分表**） |
| B:A35F | -1.5236144 | −5.03 | −0.43 | −1.43 | Framework | 结构代价极大 |
| B:V109W | -1.5057821 | −2.21 | −0.74 | +0.49 | CDR3 / Paratope | 非框架推荐 |
| B:C33Y | -1.4980912 | −5.40 | +2.59 | +3.64 | CDR1 / Cys | **排除：破坏 B33–B106 二硫键** |
| B:Q116M | -1.4936166 | −2.15 | −0.73 | −3.38 | CDR3 / Paratope | 且新增 Met 氧化位点 |
| B:A97F | -1.4836845 | −5.11 | −4.49 | −2.07 | CDR3 | 全表最差 |
| B:A35S | -1.4654148 | −0.93 | +1.05 | +0.54 | Framework | **唯一可进入框架可开发性讨论（有条件）** |
| B:Q116K | -1.4106131 | +0.64 | −0.14 | +0.07 | CDR3 / Paratope | 非框架推荐 |
| B:T105L | null（未同步） | −0.05 | −0.04 | −0.71 | CDR3 / Paratope | 界面优先改造，ddG 待回填 |

关键判断：
- **V109 位于原生 paratope 且属 IMGT CDR3**，即使可开发性分数最干净，也**不属于框架区可开发性推荐**。
- **C33Y 必须排除**：破坏二硫键；seq（+2.59）/evo（+3.64）正分说明这两类模型对二硫键完全盲视，只有结构模型（−5.40）抓住了代价。
- **A35 位点埋藏（relSASA 0.017）且紧贴 paratope F115（4.0 Å）**：W/Y/F 三种芳香替换在反向折叠模型上均 −4 至 −5；只有 A35S 被三模型勉强接受。
- 案例03 已完成的变体结构仅 A35W / V109L / C33Y / Q116M / T105L；所有外部结构状态标记为 `external_case03_pending_verification`，**A35Y 尚无结构，不作结构验证陈述**。
- 与本案例 9 个框架候选**无位点重叠**。

---

## 8. 局限与未完成项（如实记录）

1. **父结构未复核**：MMFold_1.cif 不在本项目，仅记录用户提供的 sha256，未重新预测、未重新派生。
2. **结构为预测模型**：所有 SASA、距离、盐桥判断基于 MMFold 单链模型（无抗原、无溶剂、无糖链），不是晶体结构；未使用 5GRJ/7XYQ/5JDS（按要求）。
3. **无抗原复合物**：paratope 定义来自案例02 的显示结果，本案例未做抗原对接；Tier B 的"结合风险"是几何邻近推断，不是亲和力预测。
4. **分数无物理单位**：不能把 stability delta 当 ΔΔG(kcal/mol)，不能把 fitness delta 当表达量/溶解度。
5. **进化模型在 2 个 CDR1 位点给出"WT 即最差"**（K27、C33），说明该模型对高变区不适用，已在保护策略中排除。
6. **案例03 结构未核验**：A35W/V109L/C33Y/Q116M/T105L 的外部 MMFold 结果尚未在本项目内用真实 CIF 核验，状态统一为 `external_case03_pending_verification`；A35Y 仅存在于评分表，无结构。
7. 一个作废任务（342605433852928，125 aa 误录序列）已弃用并在 ledger 中留痕。

---

## 9. 文件清单

| 文件 | 内容 |
|---|---|
| `structure_verification.json` | 对象ID / TOS key / sha256 / 序列 / 编号 / 完整性检查 |
| `mapping_mos_to_MMFold1_chainB.csv` | 128 行逐残基 MOS↔MMFold_1 映射 + region + 保护标记 |
| `task_ledger.json` | 输入、payload、taskID、状态、方向、单位、作废任务 |
| `schema/*.json` | 三个任务的 schema 快照 |
| `raw/struct_fitness_scores.csv` | Stability 原始全表（2560 行） |
| `raw/sequence_scores.csv` | Sequence Fitness 原始全表（2560 行） |
| `raw/evolutionary_scores.csv` | Evolutionary 原始全表（2560 行） |
| `wt_baseline.csv` | 每位点 WT 得分（三模型，基线 0.0） |
| `direction_evidence.json` | 方向判定的统计证据 |
| `merged_mutation_delta_table.csv` | 2560 行合并 delta 表（含保护标记与风险 flag） |
| `candidates_final.csv` | 9 个候选（分级、三模型 delta、consensus、SASA、paratope 距离） |
| `affinity-candidates-x-developability.csv` / `.json` | 案例03 11 个突变的三模型 delta、风险位点扫描、结构状态、判定 |
| `risk_scan_local.csv` / `residue_exposure.csv` | 本地风险扫描 / 逐残基 SASA |
| `cross_eval_case03.md` | 与案例03 的交叉评估（11 行，含 T105L，外部结构待核验） |
| `scripts/*.py` | 全部可复现脚本 |
