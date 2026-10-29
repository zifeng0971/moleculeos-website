# Case 05 — De novo binder design against human PD-L1 (5GRJ)

Status at bundle build time: **3 design runs submitted, 0 completed.**
This bundle therefore contains the verified, launch-ready target input and the exact
launch record. A second bundle (`case05_design_results_*.zip`) will be produced when
the design tasks finish, containing raw designed structures, designed FASTA,
metrics and ranking.

---

## 1. Target provenance and verification

| Item | Value |
|---|---|
| PDB entry | 5GRJ — "Crystal structure of human PD-L1 with monoclonal antibody avelumab" |
| Target entity | entity 3, `Programmed cell death 1 ligand 1` / `_entity_name_com.name` = "human PD-L1", UNP residues 18-238 |
| Chain in source file | auth_asym_id **A**, label_asym_id **C** |
| Removed | avelumab heavy chain (auth H / label A), avelumab light chain (auth L / label B) |
| Removed non-polymer | waters, glycans, ions, ligands — none present in this crystal form (verified: zero HETATM residues) |
| Retained | all 213 modeled extracellular residues, auth 18-184 + 188-233 (auth 185-187 disordered, not modeled) |
| Sanitized layout | chain A, residues 1-213, contiguous |
| File uploaded to MOS | `target/PD-L1_5GRJ_chainA_target.mos.cif` |
| MOS object | object_id `342254736761856`, work_id `342254742443008` |

Programmatic checks are in `verification.txt` (16 checks, all PASS): single chain,
213 residues, author numbering preserved, no hetero residues, hotspot residue
identities correct in both numbering schemes, mapping covers all 213 residues.

## 2. Epitope and numbering map

The avelumab footprint on PD-L1 in 5GRJ (chain A residues within 4.5 A of H or L)
is auth 54, 56, 58, 59, 60, 61, 62, 63, 66, 69, 73, 75, 76, 78, 113, 115, 117,
121, 123, 125 — i.e. 5GRJ captures a PD-1-competitive antibody, and the requested
residues lie inside that face.

| Author | Sanitized | Residue | SASA (A^2) | Role |
|---|---|---|---|---|
| I54 | A37 | Ile | 25.4 | requested hotspot |
| Y56 | A39 | Tyr | 71.0 | requested hotspot |
| R113 | A96 | Arg | 70.2 | requested hotspot |
| E58 | A41 | Glu | 47.7 | nearby accessible interface |
| V68 | A51 | Val | 37.3 | nearby accessible interface |
| Y123 | A106 | Tyr | 112.9 | nearby accessible interface |

`hotspot_res` passed to MOS: `A37,A39,A41,A51,A96,A106` (sanitized numbering).

## 3. Exact launch parameters

```json
{
  "input_structure": "user_objects/123/330665428816896/sanitized/179246388469366_PD-L1_5GRJ_chainA_target.mos.cif",
  "contigs": "A1-213/0 60-100",
  "hotspot_res": "A37,A39,A41,A51,A96,A106",
  "compare_binder": 1,
  "diffusion_steps": 50
}
```

`contigs` fixes the entire modeled PD-L1 extracellular domain and hallucinates a
new chain of 60-100 residues. `compare_binder=1` requests sequence design plus
structure prediction on the generated backbone, so each run should return a
designed sequence and a predicted complex rather than a backbone alone.

The Protein Binder Design schema has **no `num_designs` field**, so three
candidates come from three independent runs differing only in `random_seed`.

## 4. Task IDs

| Task name | Seed | Task ID |
|---|---|---|
| PDL1 de novo binder seed111 | 111 | 342254837666816 |
| PDL1 de novo binder seed222 | 222 | 342254839784448 |
| PDL1 de novo binder seed333 | 333 | 342254842782720 |

## 5. Bundle contents

```
README.md                  this file
input.json                 exact target/provenance/parameter record
task_ids.json              task IDs + shared payload
results.json               scaffold, to be filled with candidates and metrics
verification.txt           16 programmatic target checks
checksums.sha256           sha256 of every file in this bundle
analyze_designs.py         parser/metrics script for the design outputs
target/PD-L1_5GRJ_chainA_target.pdb        exact input, author numbering
target/PD-L1_5GRJ_chainA_target.mos.cif    exact file uploaded to MOS
target/PD-L1_5GRJ_chainA_target.mos.cif.mapping  auth->sanitized residue map
target/5GRJ.cif            original RCSB entry, unmodified, for provenance
```

## 6. What is and is not in this bundle

- **Present**: the target structure that was actually used, its numbering map, the
  exact parameter set, the task IDs, and a reproducible verification of the target.
- **Absent**: designed structures, designed sequences, per-design confidence
  (pLDDT/ipTM/PAE) and interface metrics (contacts, BSA, hotspot engagement),
  and candidate ranking. These depend on task output that did not exist when this
  bundle was built. They are not inferred or placeholdered anywhere in this bundle.

Task submission is not a scientific result. Once outputs exist, task success
(exit status, files present) will be reported separately from scientific quality
(interface confidence, hotspot engagement, sequence designability).
