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

## CORRECTION (applies to Phase D above; original text kept unchanged for the record)
The Phase D lines "Fv1 = heavy A + light C; Fv2 = heavy B + light D" use **MOS label** chain IDs and were
written without an explicit author-chain mapping. They are ambiguous on their own and are superseded by the
following audit, which is the only chain-identity statement used in the final report.

Author chains (RCSB 1BVL, read directly from `inputs/1BVL.pdb`): A and C = VH (116 modeled residues,
`QVQLQESGPGLVRPSQTLSL...`), B and D = VL (108 modeled residues, `DIQMTQSPSSLSASVGDRVTITCRA...`).
Deposited assembly records (`_pdbx_struct_assembly_gen.asym_id_list`): **assembly 1 = A,B; assembly 2 = C,D**.
Entity records (`_entity_poly.pdbx_strand_id` = `A,C` / `B,D`; entity lengths 117 / 108 — the VH entity carries
one unmodelled C-terminal Gly).

**Biological pairs are author A+B and author C+D. They are NOT paired by chain-name order after sanitization.**

Verified MOS-label ↔ author-chain mapping (three independent checks, all agreeing):
1. `structures/1BVL_sanitized.cif.mapping` from `sanitize_structure.py`: A←A, B←C, C←B, D←D.
2. Coordinate identity: max |ΔCA| between each MOS label chain and exactly one author chain = **0.000 Å**
   (label A↔auth A, label B↔auth C, label C↔auth B, label D↔auth D).
3. Sequence + deposited assembly/entity records as above.

| author chain | role | MOS label | biological Fv |
|---|---|---|---|
| A | VH | A | Fv1 (author A+B) |
| B | VL | C | Fv1 (author A+B) |
| C | VH | B | Fv2 (author C+D) |
| D | VL | D | Fv2 (author C+D) |

Reference structures were rebuilt directly from the RCSB author chains and renamed:
`structures/ref_1BVL_authAB.pdb` (author A VH + author B VL) and `structures/ref_1BVL_authCD.pdb`
(author C VH + author D VL). The earlier `ref_1BVL_Fv1.pdb` / `ref_1BVL_Fv2.pdb` files were derived from the
MOS-labeled copy and have been removed to prevent mis-citation; every comparison is now labelled by author chains.
The burial calculation reported earlier already used these same pairs (MOS label A+C = author A+B; MOS label B+D
= author C+D), so the structural numbers are unchanged — only the naming is now unambiguous.

## CORRECTION 2 — antibody/antigen interface (supersedes the Phase C interface numbers)
**Retracted claim:** "constant-domain contacts to lysozyme (BSA ~1690 A^2) are crystal contacts". That statement
was wrong on both the number and its interpretation, and is withdrawn. What follows replaces it; the earlier text
above is kept only as a record of the error.

What happened: the Phase C table was merged from the `interaction-analysis` skill's PPInterface/InteractionNet
outputs (`analyses/interface_1FDL/`, `analyses/contacts_1FDL/`) with a freesasa dSASA column computed here. A
geometry audit showed the archived skill tables do not reproduce against the coordinates: e.g. the archived row
"C39 ND2 -> B208 O, 3.00 A" is 79.5 A apart in the actual model, and every archived H-bond partner was tens of
Angstroms from its stated partner. Those files are therefore kept for audit only and are NOT used for any
conclusion in this case. (Their apparent "constant-domain burial" came from per-residue buried-area values that
do not belong to an antibody-lysozyme interface at all.)

Independent recomputation (`analyses/13_bsa_recheck.py`, `analyses/14_contacts_recheck.py`,
`analyses/15_rebuild_interface_table.py`):
- Direct heavy-atom sweep: Fab residues within 4.5 A of lysozyme = 10 in VH (30, 31, 32, 52, 53, 54, 99, 100,
  101, 102) and 7 in VL (32, 49, 50, 53, 91, 92, 93). **Constant domains: 0 residues; nearest heavy-atom
  approach 33.03 A.** This matches an independent check done outside this session.
- BSA with explicit reference states (Fab A+B as one body vs Fab+lysozyme):
  SASA(Fab) 19566.2 + SASA(lysozyme) 6502.6 - SASA(complex) 24825.6 = **1243.2 A^2**;
  VH side 349.4, VL side 246.8, lysozyme side 647.1.
- The same calculation restricted to the V domains gives **exactly the same** 1243.2 A^2 and identical per-residue
  values, so the constant domains contribute 0.0 A^2. The interface is entirely V-domain.
- 21 N/O...N/O atom pairs within 4.0 A (distance-only H-bond proxy); 0 formal salt bridges between Fab and lysozyme.
  Useful measured contacts: VH Asp100 OD2-Ser24 OG 2.63 A, VH Asp100 OD1-Ser24 N 2.82 A, VL Tyr50 OH-Asp18 OD2
  2.86 A, VH Tyr101 OH-Asp119 OD1 2.97 A, VH Tyr101 OH-Gln121 N 2.99 A, VL Thr53 OG1-Asn19 ND2 3.07 A,
  VL Phe91 O-Gln121 NE2 3.07 A.
- Nothing here was named "crystal packing": in this lattice the constant domains simply do not touch the antigen.

`results.json` -> `parent_interface` now carries the recomputed values plus an explicit `superseded` field.
