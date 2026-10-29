# D1.3 antibody humanization — execution log (Mocha session)

All timestamps UTC. Compute results are model outputs unless explicitly labelled as experimental structure data.

## Phase A — inputs and annotation
- Downloaded from RCSB into `inputs/`: 1FDL.pdb, 1FDL.cif, 1FDL_fasta.txt, 1FDL_metadata.json;
  1BVL.pdb, 1BVL.cif, 1BVL_fasta.txt, 1BVL_metadata.json; plus 1BVL_assembly1.json / 1BVL_assembly2.json
  (assembly definitions retrieved to establish Fv chain pairing).
- Chain roles verified from FASTA headers / COMPND / SOURCE:
  - 1FDL auth **L** = IGG1-KAPPA D1.3 FAB light chain (Mus musculus), auth **H** = heavy chain, auth **Y** = hen egg-white lysozyme (Gallus gallus).
  - 1FDL mmCIF label chains: **A = auth L (light)**, **B = auth H (heavy)**, **C = auth Y (lysozyme)**, confirmed by `_mos_mapping` loop of the MOS-sanitized copy.
- Imported native 1FDL into MOS via `ImportStructure(pdb_id=1FDL)` → Work ID 342335703692288, object ID 342335694263296,
  which also triggered the platform MMetrics/auto-compute task 342335703909376. Downloaded the MOS-sanitized copy to
  `structures/1FDL_mos_sanitized.cif` and confirmed label→auth mapping holds 1:1 for residues.
- ANARCI (installed binary) run in IMGT, Kabat and Chothia schemes on every polymer chain; raw output kept in
  `analyses/anarci_raw.json`, per-residue tables in `analyses/numbering_all_schemes.tsv`, domain metadata in
  `analyses/domains_meta.json`. Variable domains (constant regions excluded): VH 116 aa, VL 107 aa.
  ANARCI reports no immunoglobulin domain for chain Y (lysozyme) — expected.

## Phase B — humanization task
- `StartMOSTask` task type "Antibody Humanization", task name `D13_humanization_10designs`,
  **task ID 342335722341376**, launched 08:07:40Z, num_designs=10, VH/VL = ANARCI variable domains only.
  Payload and status recorded in `native_tasks/task-ledger.json`.

## Phase C — interface analysis of the parent complex (1FDL, MOS-sanitized layout)
- InteractionNet contacts: `analyses/contacts_1FDL/`; PPInterface: `analyses/interface_1FDL/` (all chains) and
  `analyses/interface_1FDL_Vdom/` (V domains only).
- Independent freesasa (Lee–Richards) BSA calculation `analyses/04_bsa_freesasa.py` → `analyses/bsa_freesasa_1FDL.json`:
  BSA(Fv:lysozyme) = 1243.2 A^2 (VH 349.4 + VL 246.8 on the antibody side, 647.1 on the lysozyme side).
  The full-Fab calculation also captures **constant-domain contacts to lysozyme (BSA ~1690 A^2) that are crystal
  contacts, not part of the physiological paratope**; they are reported separately and excluded from paratope statements.
- Merged machine-readable interface table: `analyses/interface_residues_1FDL.tsv` / `.json`
  (IMGT position, IMGT region, freesasa dSASA, contact types, H-bond partners/atoms/distances).

## Phase D — 1BVL reference
- 1BVL = "HUMANIZED ANTI-LYSOZYME FV", 2.87 A, two Fv copies per asymmetric unit.
- Chain roles from entity definitions: entity 1 = heavy (auth A, C), entity 2 = light (auth B, D).
  Sanitized labels: A = heavy(auth A), B = heavy(auth C), C = light(auth B), D = light(auth D).
- Pairing established two independent ways: deposited assembly definitions (assembly 1 = auth A+B, assembly 2 = auth C+D)
  and interface burial computed here (A:C BSA 1222/1230 A^2 and B:D 1072/1187 A^2 vs cross pairs 22-103 A^2).
  → Fv1 = heavy A + light C; Fv2 = heavy B + light D.
- 1BVL vs 1FDL parent: all six CDRs sequence-identical; 42 framework substitutions (VH 25, VL 17)
  (`analyses/seqdiff_parent_vs_1BVL.tsv`).
