# Run log — website_case_petase

Machine: Mocha sandbox (Linux, 4 vCPU / 2 GB). All timestamps UTC, 2026-10-20.
Every entry corresponds to a command or MOS call that actually ran.

## 08:07–08:12 — inputs and identity

| time | action | result |
|---|---|---|
| 08:07 | `mkdir -p inputs native_tasks analyses structures logs` | created |
| 08:09 | `ListAvailableMOSTasks` | 8 tasks available; "Protein-Ligand Affinity Evaluation" and "Protein Redesign" listed as *coming soon* — both were nevertheless accepted by `StartMOSTask` (verified below) |
| 08:09 | `CheckMOSTask 338706466620416` (read-only) | manual native task found, SUCCEED, payload recovered: target `.../sanitized/179159720409225_5xh3_clean (2).cif`, reference `.../338706328146944_5xh3_B_856 (1).sdf`; its `predicted_sipobe_scores.csv` archived |
| 08:09 | `GetMOSObject` on the two remote object ids | **failed** ("Object ... not found on MOS") — cross-project objects are not downloadable, so the original paths were reused in a new task instead |
| 08:09 | RCSB downloads: 5XH3/5XG0 `.pdb`, `.cif`, PDBx FASTA, entry metadata | sizes 394389 / 481172 / 364 / 15918 B (5XH3); 609039 / 759856 / 378 / 14386 B (5XG0) |
| 08:10 | `polymer_entity` / `nonpolymer_entity` / `chemcomp` queries | ligand = comp **856**, label chain B, auth chain A 301; `chemcomp/HEMT` returns 404 |
| 08:10 | UniProt A0A0K8P6T7 fetch | ACT_SITE 160/206/237; DISULFID 203-239 and 273-289; BINDING 87/161/185 |
| 08:11 | sequence map | 5XG0 chain C 261 aa found inside UniProt at offset 29 → UNP = AUTH + 29; 5XH3 differs at AUTH 103 (R→G) and 131 (S→A) only |

## 08:12–08:14 — manual example reconstruction and WT inputs

| time | action | result |
|---|---|---|
| 08:12 | rebuilt `inputs/5xh3_clean.pdb` from 5XH3.pdb (1931 ATOM lines + TER + END) | 156500 B, SHA256 `aa9ddaea…12853c` — matches |
| 08:12 | decoded manual SDF from base64 | first pass 2190 B (transcription slips), repaired against the PDB atom block; final 2191 B, SHA256 `44c9ea73…443e9` — matches |
| 08:13 | extracted 5XG0 chain C (268 residues, author -6..261, complete backbone, no altlocs, mean B 11.89) → `structures/5XG0_WT_chainC_author-6_261.pdb` | validation: 0 missing backbone atoms |
| 08:13 | stored WT sequence in the sequence-toolkit library as `5XG0_WT_chainC_268` | length 268 |
| 08:13 | `ImportStructure` 5XG0 chain C, `5xh3_clean.pdb` | objects 342337053230080, 342337091843072 |

## 08:13–08:17 — MOS tasks

| time | task | ID | outcome |
|---|---|---|---|
| 08:13:54 | Sequence Fitness (WT) | 342337264870400 | succeed, 8 s |
| 08:13:55 | Evolutionary (WT) | 342337268093952 | succeed, 2.5 min |
| 08:13:57 | Structural Stability (WT) | 342337277858816 | succeed, 3 s |
| 08:14:32 | Protein-Ligand Affinity Evaluation (manual inputs) | 342337422410752 | succeed, 38 s, score −4.310292 = native task |
| 08:20:44 | Protein Redesign (10 designs, 5 positions) | 342338944422912 | succeed, 35 s |
| 08:21:51–54 | MMFold × 3 candidates | 342339217835008 / 342339221820416 / 342339232719872 | see §"MMFold" below |

`ImportStructure` of the SDF ligand was attempted three times (original file,
renamed copy, 3-atom test SDF) and failed identically each time — limitation
recorded, not bypassed. No environment credentials were read or used.

## 08:14–08:19 — structural analysis (Mocha built-in)

* `sanitize_structure.py` on 5XH3 → MOS layout (protein chain A 1-261, ligand chain B).
* `parse_structure.py` → 1 protein entity + ligand 856.
* `calc_contacts.py` (InteractionNet) → 213 H-bonds, 206 vdW, 11 π-stacks (4 inter-chain), 2 disulfides.
* `ligand_pocket_analysis.py` → 9 pocket residues, 69 atom contacts, 6 polar contacts, 1 π-stack, 78.7 % ligand burial.
* `superpose_5xg0_5xh3.py` → 261 CA matched, global RMSD 0.256 Å, pocket 0.39 Å, max 1.005 Å (AUTH 164).
  First attempt used the gemmi transform in the wrong direction (deviations 40-60 Å); detected because the numbers were physically impossible, fixed by inverting the transform, and re-run.

## 08:16–08:22 — scoring interpretation and site choice

* Merged three score tables + geometry into `analyses/pocket_position_evidence.csv` (20 positions: 9 first shell + 11 second shell).
* Selected 5 positions, documented 15 refusals in `analyses/redesign_site_selection.csv`.
* Literature cross-check (Han 2017 Nat Commun; Joo 2018; FEBS review) confirmed the HEMT contact set {W156, I179, H208, A131, W130, Y58, M132} and the R103G packing-fix rationale.
  Conflict recorded: Joo et al. report W159H and S238F as *decreasing* activity, while other engineering studies report gains — therefore no activity claim is made for those sites.

## 08:19–08:21 — design template

* Attempt 1: ligand transferred onto superposed WT 5XG0 → **rejected**: 0.86 Å clash between Trp185 and HEMT (WT rotamer differs).
* Attempt 2 (used): 5XH3 conformation + AUTH 103/131 reverted to WT + experimental HEMT pose. Validation: no atom pair < 2.2 Å, Ser131 OG 2.51 Å from C09.
* `ImportStructure` of the from-scratch CIF and PDB failed validation (missing chem_comp metadata); re-emitting the CIF from the deposited 5XH3 file fixed it.

## MMFold (open at time of writing)

Three MMFold tasks were submitted for candidates seq_4, seq_2, seq_1 and were
still in platform state "waiting (not queued)" at the last snapshot. Their
task IDs, payloads and any later outputs are recorded in `task-ledger.json`.
No structure was substituted for a model that had not been produced.
