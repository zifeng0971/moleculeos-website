# Case 03 — Variant structure assets (sequence-only MMFold)

Two **independent** single-mutation binder variants of DBL1_03 in complex with the
unchanged human PD-L1 entity sequence from PDB 7XYQ. No experimental coordinates
were supplied as input to MMFold — both jobs are sequence-only predictions.

| Variant (author numbering) | Mutation (MOS/entity) | MMFold task | Status | Duration |
|---|---|---|---|---|
| Q13Y | Q18Y | 342259574002688 | succeed | 2.3 min |
| V12I | V17I | 342259585696768 | succeed | 2.3 min |

Antigen: PD-L1 entity 1 of 7XYQ, 207 aa (UniProt 19–225), **identical in both jobs**.
Binder: DBL1_03 entity 2 of 7XYQ, 124 aa, changed at exactly one position per job.
Numbering: MOS/entity is 1-based; PDB 7XYQ chain B author numbering runs −4…119, so
author = MOS − 5 (Q18Y = Q13Y, V17I = V12I). Chain A author = MOS + 18.

## Confidence is NOT affinity
pLDDT / pTM / ipTM / ranking_score below measure how self-consistent each predicted
model is. They are **kept separate** from the Binding Affinity Mutation Effect
ddG values from task 342254431249408 (packaged in `case03_complete.zip`). pTM/ipTM
cannot be read as a binding energy and no ddG is derived or re-derived here.

Best sample by MMFold ranking_score:

| Variant | pLDDT | pTM | ipTM | ranking_score | pLDDT at mutated residue |
|---|---|---|---|---|---|
| Q18Y (Q13Y) | 87.94 | 0.811 | 0.821 | 0.819 | 93.6 |
| V17I (V12I) | 87.17 | 0.817 | 0.776 | 0.784 | 91.8 |

Both variants model with high per-residue confidence and a confidently predicted
interface (ipTM > 0.77 in all ten samples). The Q18Y models place the interface with
higher confidence than V17I (ipTM 0.82 vs 0.78), which is a model-confidence
statement only — it neither confirms nor contradicts the affinity model's ranking,
where Q18Y also scored strongest (ddG −2.45 vs −1.65 kcal/mol).

## Files
```
variant_sequences.fasta              exact sequences submitted (header carries mutation + numbering)
payloads/MMFold_Q18Y.json            exact submitted MMFold payload
payloads/MMFold_V17I.json            exact submitted MMFold payload
variant_results.json                 task IDs, payloads, sequences, per-sample confidence, file map
confidence_summary.csv               all 10 samples, one row each
Q18Y/cif/  5 predicted models (model_sample_1..5.cif)
Q18Y/confidence/  5 summary_confidences_sample_*.json
V17I/cif/  5 predicted models
V17I/confidence/  5 summary_confidences_sample_*.json
PACKAGE_MANIFEST.json                per-file sizes and SHA-256
```

## Caveats
- Five diffusion samples per job; the samples within a job are near-identical
  (spread in ranking_score < 0.005), so the model is not expressing an alternative
  binding mode.
- Predicted complexes are unrefined and unvalidated; no molecular dynamics or
  experimental data support them.
- These are two variants only. No combined double mutant was built.
