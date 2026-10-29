# kn035_case04 — KN035 VHH（MMFold_1 链B）突变效应扫描与候选

## 快速导航

| 想知道什么 | 看这个文件 |
|---|---|
| 结论与解读 | `report.md` |
| 结构/编号/哈希核验 | `structure_verification.json`、`mapping_mos_to_MMFold1_chainB.csv` |
| 任务、payload、状态、方向、单位 | `task_ledger.json`、`schema/` |
| 三模型原始全表 | `raw/struct_fitness_scores.csv`、`raw/sequence_scores.csv`、`raw/evolutionary_scores.csv` |
| 全部 2560 个替换的 delta | `merged_mutation_delta_table.csv` |
| 9 个框架候选 | `candidates_final.csv` |
| 案例03 亲和力候选对照 | `cross_eval_case03.md`、`affinity-candidates-x-developability.csv/.json` |
| 本地风险扫描 | `risk_scan_local.csv`、`residue_exposure.csv` |
| 可复现脚本 | `scripts/` |

## 关键口径

- 三模型 `score` 都是**无量纲模型分，越高越有利**；WT 自身得分在 128 个位点全部恰为 0.0（见 `direction_evidence.json`），故 `delta = score_mut − 0`。
- Stability 是反向折叠有利度，**不是 kcal/mol ΔΔG**；Seq Fitness **不是表达量/溶解度**；Evolutionary 是保守性/共变异性。
- 案例03 的 `ddG_pred` 只保留用户给的**原始字串**，`T105L` 为 null，**未断言任何单位**。
- 案例03 已完成变体结构：A35W / V109L / C33Y / Q116M / T105L；**A35Y 无结构**。所有外部结构状态为 `external_case03_pending_verification`。

## 任务 ID（真实）

| 任务 | ID | 状态 |
|---|---|---|
| Structural Stability Mutation Effect | 342605430273024 | succeed |
| Sequence Fitness Mutation Effect | 342605430948864 | succeed |
| Evolutionary Mutation Effect（修正版，采用） | 342605471151104 | succeed |
| Evolutionary Mutation Effect（误录 125 aa，**作废不用**） | 342605433852928 | succeed but VOID |

## 复现顺序

```bash
python scripts/risk_scan.py            # 风险扫描 + 逐残基 SASA
python scripts/merge_scores.py         # 三表合并 + delta + 方向证据
python scripts/select_candidates.py    # 框架候选筛选与分级
python scripts/cross_eval_case03.py    # 案例03 交叉对照
python scripts/write_ledger.py         # ledger
```
