# Case 03 — Engineer Stronger Binding: PD-L1 + DBL1_03 (PDB 7XYQ)

## System
| Role | Molecule | Chain (MOS) | Residues | Numbering |
|---|---|---|---|---|
| Antigen | Human PD-L1 (CD274), IgV+IgC | A | 203 modelled of 207 (gaps 166–169) | MOS 1–207 = UniProt 19–225 |
| Binder | DBL1_03, de novo designed helical bundle | B | 124 | MOS 1–124 = PDB author −4…119 |

7XYQ is the crystal structure of PD-L1 in complex with the computationally designed
binder DBL1_03. Chains C and D of the deposited entry are a single modelled
arginine and a water — removed before scoring, so the scored complex is a clean
two-chain A/B assembly.

## MOS task actually run
- Type: **Binding Affinity Mutation Effect**
- Task ID: **342254431249408**, name `PDL1_DBL1_03_affinity_scan`, status `succeed`, 1.2 min
- Payload (exact):
  ```json
  {"input_structure": "tos:mosv2-prod/user_objects/123/330665428816896/sanitized/179246379963275_7XYQ_PDL1_DBL1_03_clean.cif",
   "chain_ids": "A,B",
   "custom_output_path": ""}
  ```
- Compatibility note: the task schema (`input_structure`, `chain_ids`) imposes no
  antibody/VHH restriction, and the run on the non-immunoglobulin designed binder
  completed normally. The KN035 (5JDS) / avelumab (5GRJ) fallback was therefore not
  needed; 5JDS was downloaded only as a contingency and is not part of the results.

## Score semantics
- `ddG_pred` (kcal/mol): predicted change in binding free energy relative to wild type.
  **Negative = stronger predicted binding**, positive = weaker.
- `score_ddg` = −`ddG_pred` (higher = stronger binding).
- `rank` (0–1): model rank over all 6213 substitutions, **lower = better**.
- Baseline: the wild-type complex is the reference (ddG = 0). The task does not emit an
  absolute wild-type ΔG/Kd, so no absolute affinity is claimed.

## Structural baseline (measured on 7XYQ, this session)
Interface PD-L1↔DBL1_03: buried surface 1059 Å² (PD-L1 side) / 1140 Å² (binder side),
12 hydrogen bonds, 5 salt bridges, 38 + 34 interface residues.

## Files
```
inputs/7XYQ_PDL1_DBL1_03_clean.pdb            cleaned two-chain input (chains A,B)
inputs/7XYQ_PDL1_DBL1_03_MOSsanitized.cif     exact file consumed by the task
structures/7XYQ_original_sanitized.cif        deposited entry in MOS layout (4 chains)
sequences/original_7XYQ_PDL1_DBL1_03.fasta    parental antigen + binder (gap-preserving)
sequences/optimized_7XYQ_PDL1_DBL1_03_candidates.fasta   WT + 5 single-mutant binders + unchanged antigen
tables/mutation_scores_all.csv                all 6213 scored substitutions, both chains
tables/binder_candidates_ranked.csv           chain B only, sorted by ddG (2356 rows)
tables/7XYQ_interface_residues.csv            per-residue BSA / H-bond / salt bridge
raw/affinity_scores.csv                       unmodified model output
results.json                                  structured summary, candidates, semantics, caveats
```

## Candidate ranking (binder chain B, single substitutions, model output)
Reported in both numbering systems; author numbering is the PDB 7XYQ chain B
numbering (starts at −4).

| # | Mutation (author) | MOS | ddG_pred (kcal/mol) | model rank | interface? (BSA) |
|---|---|---|---|---|---|
| 1 | Q13Y | Q18Y | −2.45 | 0.0002 | edge, 6.7 Å² |
| 2 | I50F | I55F | −1.80 | 0.0008 | no (core) |
| 3 | V12I | V17I | −1.65 | 0.0011 | yes, 78.6 Å² |
| 4 | Q14Y | Q19Y | −1.59 | 0.0018 | no (core) |
| 5 | Q25Y | Q30Y | −1.37 | 0.0029 | no (core) |

Interface-restricted alternative shortlist: Q13Y, V12I, G0F, S9Y, E−2F.

Antigen (PD-L1) sequence is unchanged in every candidate. Model-scored PD-L1
substitutions exist in `mutation_scores_all.csv` for reference but are not proposed.

## Caveats
- Single-model in silico predictions on one crystal conformation; no MD, no experimental validation.
- Candidates are mutually exclusive; ddG values are not additive and combinations were not scored.
- Core (non-interface) hits such as I50F and Q25Y plausibly act through packing/stability
  rather than direct contact energy; the model does not separate those contributions.
