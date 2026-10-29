# case02_complete — human PD-L1 + avelumab Fab (PDB 5GRJ)

Machine-readable export for Case 02. Every metric in this package traces to one of: the deposited experimental
structure, a database record, a MOS compute task, or a deterministic local analysis. Nothing is reconstructed from
screenshots and no value is invented.

**Read first:** `07_provenance/module_status.md` (module-status report) and `07_provenance/module_status.json`
(same content, machine-readable). `08_tasks/task_ledger.json` holds the exact task IDs, payloads, statuses and output
file inventory for every run.

## MMetrics status

The MMetrics panel is backed by the platform job `autocompute-5GRJ` (task `342256189539328`). It was created
automatically by the structure import, and at the final snapshot it was still **RUNNING** with a duration that never
advanced past 2.1 min, no output files and no registered MMetrics result object. Object metadata
(`ListMOSObjects`) exposes only `name`, `object_id`, `work_id`, `tos_key`.

Therefore MMetrics UI modules are recorded as **unavailable / incomplete** throughout this package. They are not
reported as completed, and no substitute output is labelled as MMetrics.

## Contents

| Path | What it holds | Provenance |
|---|---|---|
| `00_structure/` | MOS-sanitized 5GRJ CIF (identical to the registered object), local sanitized copy + old→new mapping, raw RCSB CIF | experimental |
| `01_overview/` | `overview_chain_identity.json`, `overview_chains.csv`, chain-C→Q9NZQ7 residue map, entity FASTA (with and without unmodelled gaps), UniProt Q9NZQ7 FASTA + feature dump | experimental + database |
| `02_homologs/` | ranked homolog tables for PD-L1 / VH / VL (identity, alignment length, E-value, bit score), summary JSON, raw task JSON + FASTA | mos_prediction |
| `03_antibody_annotation/` | IMGT numbering (`imgt_residue_mapping.csv`: MOS residue ↔ IMGT label ↔ region ↔ modelled flag), CDR/FR summary, full annotation JSON | builtin_analysis |
| `04_liabilities/` | motif-panel hits (deamidation, isomerisation, hydroxylation, oxidation, cysteine, clusters) with positions and CDR flags | builtin_analysis |
| `05_interactions/` | per-pair interface burial (VH–PD-L1, VL–PD-L1), H-bonds, salt bridges, pi-stacks, pi-cation, per-residue contact degrees, consolidated JSONL | builtin_analysis |
| `06_mutations/` | merged 4-axis table (`all_scores_long.csv`), per-position summary, recommendations, liability-mitigation candidates, analysis JSON, raw per-task CSVs | mos_prediction + derived |
| `07_provenance/` | module-status report (md + json), task manifest | metadata |
| `08_tasks/` | one folder per task: raw downloadable outputs + `task_record.json` (exact payload, status, duration); `task_ledger.json` | metadata |
| `scripts/` | every analysis script used, in run order | metadata |

## Column conventions

`06_mutations/all_scores_long.csv`

| Column | Meaning |
|---|---|
| `chain` / `role` | MOS chain (A=VH, B=VL, C=PD-L1) and biological role |
| `position` / `wt` / `mut` / `mutation` | MOS residue number, wild type, substitution, and `WTposMUT` token |
| `seqfit` / `evolve` / `struct` | MOS model scores, **higher = more favourable** |
| `affinity_ddG` | MOS predicted ΔΔG for the complex, **lower = more stabilising** |
| `*_pct` | within-chain percentile rank of that score (0-1) |
| `combined_pct` | mean of the three tolerance-axis percentiles |
| `paratope_bsa` / `epitope_bsa` | buried surface area (Å²) at the interface, from PPInterface |
| `imgt_region` | IMGT region of the residue (FR1-4 / CDR1-3) |
| `liability_motifs` | liability motifs that overlap this position |

Scores from different axes are **not** on a common scale and must not be summed as raw values; use the percentile
columns or consult each axis separately.

## Positioning conventions

- MOS chain residues are entity-sequence positions, 1-based (chains relabelled A/B/C by MOS sanitization).
- PD-L1 UniProt numbering: `Q9NZQ7 position = MOS residue + 17` (chain C residue 1 = UniProt A18; map in
  `01_overview/chainC_Q9NZQ7_mapping.json`).
- Antibody IMGT numbering: `03_antibody_annotation/imgt_residue_mapping.csv`.
- Author chain labels were H (VH), L (VL), A (PD-L1).

## Reproducing

Run the scripts in `scripts/` in this order from a directory containing the same `data/` and `analysis/` layout:
`annotate_ab.py` → `map_interface.py` → `parse_homology.py` → `combine_mutations.py` → `build_overview.py` →
`build_package_meta.py` → `assemble_package.py` → `write_reports.py` → `add_tasks.py`. The raw task downloads must be
present under `downloads/<task_type>_<task_id>/` exactly as delivered by the platform.
