# KN035 VHH / PD-L1 — Case 03 — status report

Scope: only the project's own `MMFold_1.cif`. No legacy structures used, no existing object modified or deleted, no new structure imported.

## 1. Input object verification

| Item | Value |
|---|---|
| MOS object ID | 342604788900864 |
| MOS work ID | 342604793074688 |
| TOS key | user_objects/123/330665428816896/342604788900864_MMFold_1.cif |
| SHA-256 claimed | d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317 |
| SHA-256 computed | d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317 |
| Hash match | yes |

Chains: A = PD-L1, 118 aa; B = KN035 VHH, 128 aa.

Numbering: MOS residue number, original `_atom_site.label_seq_id` and `_atom_site.auth_seq_id` are identical for all 246 residues (per-residue mapping in `residue_numbering_map.csv`; zero mismatches, no insertion codes, no alternate conformers).

## 2. Binding Affinity Mutation Effect

Schema (`raw/bindmut/schema_binding_affinity_mutation_effect.json`) requires only `input_structure` and `chain_ids`. It accepts no mutation list and no per-chain restriction, so the scan is necessarily exhaustive over both chains.

- Submitted payload: `{"input_structure": "user_objects/123/330665428816896/342604788900864_MMFold_1.cif", "chain_ids": "A,B"}`
- Task ID: 342605020787712
- Output: `raw/bindmut/affinity_scores.csv`, 4674 rows = 246 residues × 19 substitutions. The complete original table is preserved untouched.
- Only chain-B rows are used as candidates. Chain A was never treated as a mutational target.

The task output is byte-identical (md5 `ddcc858ceb28d60271bf00a2d1e8cd1b`) to this object's native MMetrics diffaffinity table, so task and native MMetrics ΔΔG are the same model output, not two independent methods.

Direction and unit:
- Direction: negative `ddG_pred` = predicted stronger binding. This is inferred from the table's internal arithmetic (`score_ddg` = −`ddG_pred` exactly; `rank` is a monotone rescaling of `ddG_pred`, Spearman = 1.0) and is **not** stated in platform documentation.
- Unit: **unknown**. Neither the schema nor the CSV header declares a unit. No kcal/mol or other unit is asserted in this deliverable.

WT identity: all 4674 rows were checked against the MMFold_1 sequences — 0 mismatches; 0 rows where the mutant equals the WT residue.

## 3. Native paratope / epitope provenance

Carried over from the case02 project (project 342604060136448, native MMetrics task 342604577018880), **not** re-run in case03:

- Paratope (chain B): 27, 29, 30, 32, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116
- IMGT CDR (chain B): CDR1 26–33, CDR2 51–58, CDR3 97–117
- Epitope (chain A): 38, 40, 42, 45, 47, 50, 52, 53, 57, 60, 97, 99, 101, 103, 104, 105, 106, 107, 109

Case03 produced no paratope output of its own (no paratope file exists among this project's MMetrics objects). Case03 local 4.5 Å geometry on MMFold_1 reproduces all 17 chain-B paratope residues exactly — that is corroboration, not provenance.

## 4. Two rankings (chain B only)

**Ranking 1 — all chain-B single substitutions** (`raw/bindmut/ranking_allB.csv`). Top hits:

| # | Mutation | ddG_pred | min dist to A (Å) | native paratope | region |
|---|---|---|---|---|---|
| 1 | B:A35W | −1.746 | 11.88 | no | FR2 |
| 2 | B:V109L | −1.651 | 3.47 | yes | CDR3 |
| 3 | B:A35Y | −1.583 | 11.88 | no | FR2 |
| 4 | B:A35F | −1.524 | 11.88 | no | FR2 |
| 5 | B:V109W | −1.506 | 3.47 | yes | CDR3 |
| 6 | B:C33Y | −1.498 | 7.96 | no | CDR1 |
| 7 | B:Q116M | −1.494 | 2.52 | yes | CDR3 |
| 8 | B:A97F | −1.484 | 9.88 | no | CDR3 |

The top entry by score, B:A35W, sits 11.9 Å from the antigen and is **not** a paratope residue. Its score must not be read as "interface binding got stronger" — nothing at that position touches PD-L1.

**Ranking 2 — interface-priority, best substitution per native paratope position** (`raw/bindmut/ranking_interface_priority.csv`):

| # | Mutation | ddG_pred | min dist to A (Å) | BSA (Å²) |
|---|---|---|---|---|
| 1 | B:V109L | −1.651 | 3.47 | 35.1 |
| 2 | B:Q116M | −1.494 | 2.52 | 86.8 |
| 3 | B:T105L | −1.132 | 2.69 | 58.8 |
| 4 | B:A114E | −1.071 | 3.62 | 37.2 |
| 5 | B:D99C | −0.854 | 2.36 | 2.9 |
| 6 | B:S111W | −0.829 | 3.21 | 50.9 |

Fifteen B single-point candidates with full structural annotation are in `candidates.json`.

## 5. Variant structure predictions (MMFold, chain A fixed, single-point chain B)

Every payload carries the unmodified 118 aa PD-L1 chain A plus one substitution on chain B; full payloads and SHA-256 in `variants/submission_record.json`. These are variant predictions, not re-dos of the main complex.

| Variant | Task ID | Status | best iPTM | best pLDDT | samples |
|---|---|---|---|---|---|
| B:A35W | 342605501072384 | SUCCEED | 0.612 | 86.5 | 5 |
| B:V109L | 342605511136256 | SUCCEED | 0.917 | 93.6 | 5 |
| B:C33Y | 342605520978944 | SUCCEED | 0.260 | 82.8 | 5 |
| B:Q116M | 342606341129216 | SUCCEED | 0.918 | 93.7 | 5 |
| B:T105L | 342606351508480 | SUCCEED | 0.901 | 92.9 | 5 |

All five variants are complete: 5 model CIFs and 5 `summary_confidences` JSON files each, retained unmodified under `raw/variants/<variant>/`. (For C33Y the 0.599 figure is pTM, not iPTM; iPTM is 0.260.)

Reference MMFold_1: mean CA pLDDT 96.1 (A) and 97.1 (B). No confidence JSON was persisted for the imported object, so a reference iPTM is **unavailable** — iPTM of the variants is therefore not compared against a WT iPTM.

A-aligned comparison (interface-analysis scripts; local recomputation is possible from the raw CIFs):

- B:V109L — chain B 0.86 Å CA RMSD, paratope 0.25 Å, epitope 0.13 Å: the binding mode is essentially unchanged, interface burial preserved (654 / 672 Å² vs 659 / 669 Å² for WT), 13 H-bonds vs 14. Mutated residue faces PD-L1 Met99 (3.3 Å), Ser101 (3.5 Å), Ile38 (4.4 Å).
- B:Q116M — predicted with high confidence (iPTM 0.918) and WT-like pLDDT.
- B:T105L — all five samples agree (iPTM 0.899–0.901, pLDDT 92.9), the most reproducible variant prediction of the set.
- B:A35W — chain B moves 26.3 Å CA RMSD with a 12.8 Å centroid shift: a different docking pose, not a strengthened original interface. The mutation itself is >6 Å from any antigen atom.
- B:C33Y — the B33–B106 disulfide present in MMFold_1 (SG–SG 2.18 Å) is absent in the model; chain B moves 25.2 Å and pLDDT at position 33 drops to 80.9 with a 33.5 minimum on the VHH. The favourable ΔΔG score at this position is not structurally supported.

## 6. Caveats

- ΔΔG is a prediction only; unit unknown; not experimentally validated.
- A35W ranked first overall while lying far from the antigen — an illustration that this score is not an interface-only metric.
- Variant sampling is not uniform. Samples reaching iPTM > 0.6: A35W 3/5, V109L 1/5, C33Y 0/5, Q116M 4/5, T105L 5/5. Single-sample comparison is therefore noisy; T105L is the only variant whose five samples agree (iPTM 0.899–0.901).
- The excluded task 342605442536448 ran with a wrong payload (WT residue left at position 35, C-terminal S128W introduced instead). It was neither cancelled nor deleted; its results are excluded from all analysis and it is retained in `task-ledger.json`.
- B:T105L completed after the first packaging pass; its raw files are included and the ledger reflects the final SUCCEED status.
