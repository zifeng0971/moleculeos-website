D1.3 antibody humanization — website case A (computational)
===========================================================

WHAT THIS IS
  Ten humanization designs for the murine anti-lysozyme antibody D1.3 (parent structure PDB 1FDL),
  produced with the native MOS task "Antibody Humanization", each modelled as an Fv with native MOS
  task "MMFold", and compared structurally to the parent Fv and to the experimental humanized Fv 1BVL.

  Everything antibody-side is a computational prediction. No affinity, immunogenicity, expression or
  stability measurement was performed. 1FDL and 1BVL values are experimental crystallographic data.

START HERE
  report.md                     narrative report (biology, numbers, corrections, limitations)
  results.json                  structured results: mapping, numbering, interface, candidates, provenance
  native_tasks/task-ledger.json every MOS task: exact payload, task ID, status, duration, output paths

DIRECTORIES
  inputs/                       RCSB downloads, unmodified: 1FDL.{pdb,cif,fasta,metadata}, 1BVL.*,
                                1BVL_assembly{1,2}.json, D13_VH_VL_from_ANARCI.fasta, seq/*.fasta
  native_tasks/
    humanization/               raw output of Antibody Humanization 342335722341376
                                (result.fasta, final_ranked_summary.csv, OASis/AbNatiV tables,
                                 biophi_humanization_results.json, and the 5 MMFold sample models of
                                 humanization_9 that the task itself returned — kept separate, not used
                                 as the uniform structural set)
    mmfold_payloads/            exact MMFold payload per candidate
    mmfold/humanization_N/      raw MMFold output: 5 model CIFs, 5 confidence JSONs, manifest.json
  analyses/                     all scripts and derived tables
  structures/                   prepared coordinate sets (parent Fv, 1BVL author-chain references,
                                superposed complexes) and mos_imports/ (what MOS returned after import)
  logs/                         execution log including both corrections, comparison run log,
                                last native auto-compute status

KEY METHOD POINTS
  * Variable domains only were sent for humanization; constant regions were removed with ANARCI
    (IMGT domain boundaries). Per-residue IMGT/Kabat/Chothia numbering is in
    analyses/numbering_all_schemes.tsv.
  * 1BVL chain identity: author A+B and author C+D are the biological pairs. MOS relabels chains as
    A=VH(author A), B=VH(author C), C=VL(author B), D=VL(author D). Explicit, verified mapping in
    analyses/1BVL_chain_mapping.{json,tsv}. Author chains and MOS labels are never mixed in this case.
  * Buried surface (analyses/13_bsa_recheck.py): freesasa Lee-Richards with explicit reference states,
    BSA = SASA(Fab) + SASA(lysozyme) - SASA(complex). Full Fab and V-domain-only give the identical
    1243.2 A^2, i.e. the constant domains contribute nothing.
  * Contacts (analyses/14_contacts_recheck.py): direct heavy-atom distance sweep from coordinates.
  * Superposition (analyses/fv_compare.py): Kabsch on CA atoms, residues paired by shared ANARCI IMGT
    positions. This is a Mocha-added statistic. No native MOS superposition tool/task exists and none
    was claimed.

REPRODUCE
  python analyses/02_numbering.py            # ANARCI tables (needs ANARCI in PATH)
  python analyses/13_bsa_recheck.py          # BSA, full Fab vs V-domain-only
  python analyses/14_contacts_recheck.py     # contacts / polar contacts
  python analyses/07_run_comparisons.py      # candidate vs parent and vs 1BVL (both copies)
  python analyses/09_metrics.py              # per-candidate metric table
  python analyses/12_build_results.py        # rebuild results.json

KNOWN OPEN ITEM
  Native MMetrics auto-compute on 1FDL (task 342335703909376) was still RUNNING at close; its output was
  not retrievable and was not used. See logs/autocompute_1FDL_last_check.json.
