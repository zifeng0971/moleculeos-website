# Case 05 bundle — de novo binders against human PD-L1 (5GRJ)

Start here: **REPORT.md** holds the results and their interpretation;
**metrics_summary.csv** holds the numbers in one table; **results.json** holds the
same in machine-readable form.

## Bundle state

| Run | Task ID | Status | Output |
|---|---|---|---|
| seed111 | 342254837666816 | SUCCEED (4.3 min) | 2 CIFs, analysed |
| seed222 | 342254839784448 | SUCCEED (8.2 min) | 2 CIFs, analysed |
| seed333 | 342254842782720 | RUNNING, no output delivered | none |

Only outputs that actually existed are included. Runs without output contribute
no files and no metrics.

## Target

PDB 5GRJ, human PD-L1 extracellular domain. Entity 3, auth chain A / label C,
213 modeled residues (auth 18-233, 185-187 disordered). Avelumab H and L removed,
no waters/glycans/ligands present. Sanitized layout chain A 1-213. Hotspots:
I54→A37, Y56→A39, R113→A96, plus E58→A41, V68→A51, Y123→A106.
`verification.txt` records the 16 programmatic checks.

## How the analysis was done

`analyze_designs.py` identifies the receptor chain by sequence match, treats the
other chain as the binder, and locates the six hotspots by global sequence
alignment — never by assumed residue numbers, because the pipeline renumbers. It
classifies a chain as `virtual_backbone_no_designed_sequence` when more than 90%
of residues are Gly/Ala, which is how the poly-Gly hallucination backbone is kept
distinct from the designed sequence. It was validated against the 5GRJ
avelumab/PD-L1 complex, where it recovered the known footprint
(I54 3.6 Å, Y56 2.3 Å, E58 2.8 Å, R113 3.2 Å, Y123 3.4 Å).

`audit_chemistry.py` re-checks every InteractionNet "salt bridge" against the
residue names in the coordinates, because that table labels any close N/O pair a
salt bridge without testing charge. Only acidic-vs-basic residue pairs are counted
as salt bridges; same-charge pairs are rejected and His is treated as a weak
partner. Per-candidate results are in `designs/<label>/chemistry_audit.json` and
summarized in REPORT.md section 6.

`bsa_shrake.py` computes buried area directly from coordinates as a cross-check;
the PPInterface pipeline in InteractionNet fails on side-chain-free poly-Gly
backbones, so the backbone-only model has Shrake-Rupley numbers only.

## Metric conventions used in this bundle

- `plddt` values are read from the CIF B-factor column of the delivered
  prediction; they are not recomputed.
- `bsa_total_A2_ppinterface` sums both partners; divide by 2 for interface area
  per side. `bsa_per_side_A2_shrake` is the independent Shrake-Rupley
  cross-check.
- `hotspot_min_dist_A` is the minimum heavy-atom distance between a hotspot
  residue and the binder; ≤ 4.5 Å is treated as engaged.
- Missing values are `null` with the reason stated in `results.json`; nothing in
  this bundle is imputed.

## Commands

```bash
python analyze_designs.py --task-dir <task_output_dir> --label <label> --out-dir <out>
python bsa_shrake.py <complex.cif> A B
python audit_chemistry.py <complex.cif> <ppi_dir> <label>
```
