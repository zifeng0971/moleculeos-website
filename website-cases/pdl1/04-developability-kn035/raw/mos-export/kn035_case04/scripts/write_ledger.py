#!/usr/bin/env python3
"""Write the case04 task/input ledger (single source of truth for provenance)."""
import json, hashlib, os

BASE = "/workspace/kn035_case04"
CIF = "/workspace/protein_data/protein_342605181223936/MMFold_1_chain_B.cif"
SEQ = "".join(open("/workspace/.mocha/seq_lib/kn035_vhh_c04_wt.fasta").read().split("\n")[1:]).strip()


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


ledger = {
    "case": "04",
    "target": "KN035 VHH (single-domain antibody), 128 aa, MMFold_1 chain B",
    "created_utc": "2026-10-21T02:23:37Z",
    "structure_object": {
        "name": "MMFold_1_chain_B.cif",
        "mos_object_id": "342605177943040",
        "mos_work_id": "342605181223936",
        "tos_key": "user_objects/123/330665428816896/342605177943040_MMFold_1_chain_B.cif",
        "local_path": CIF,
        "sha256": sha(CIF),
        "parent": {
            "name": "MMFold_1.cif",
            "sha256": "d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317",
            "provenance": "user-supplied hash; parent file is NOT present in this project and was NOT re-derived or re-predicted",
        },
        "derivation_rule": "keep only atom_site / entity / entity_poly / entity_poly_seq / struct_asym records of chain B; coordinates and label_seq_id / auth_seq_id untouched",
        "chain": "B",
        "entity_id": 2,
        "length": 128,
        "sequence": SEQ,
        "numbering": "label_seq_id == auth_seq_id == MOS resnum == 1..128 (identity mapping to MMFold_1 chain B)",
        "integrity_checks": {
            "n_atom_records": 965,
            "n_residues_with_atoms": 128,
            "missing_residues": 0,
            "missing_CA": 0,
            "altloc": "none",
            "occupancy": "all 1.0",
            "chain_breaks_CA_gt_4.5A": 0,
            "hetero_ligand_water": "none",
            "entity_poly_seq_matches_atom_site": True,
            "cys_positions": [22, 33, 96, 106],
        },
    },
    "sequence_library": {"id": "kn035_vhh_c04_wt", "length": 128,
                         "fasta": "/workspace/.mocha/seq_lib/kn035_vhh_c04_wt.fasta"},
    "protection_map": {
        "source": "user-specified from case 02 project 342604060136448 (IMGT CDR / paratope display); not re-derived here",
        "imgt_cdr": {"CDR1": "B26-33", "CDR2": "B51-58", "CDR3": "B97-117"},
        "paratope": [27, 29, 30, 32, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116],
        "disulfides": [{"cys1": 22, "cys2": 96}, {"cys1": 33, "cys2": 106}],
        "protected_cys": [22, 33, 96, 106],
        "framework_positions_total": 91,
        "framework_positions_unprotected": 89,
        "scored_framework_substitutions": 89 * 19,
    },
    "tasks": [
        {
            "task_type": "Structural Stability Mutation Effect",
            "task_id": "342605430273024",
            "task_name": "KN035c04_Stability_chainB",
            "status": "succeed",
            "duration": "2s",
            "payload": {"structure_path": "user_objects/123/330665428816896/342605177943040_MMFold_1_chain_B.cif"},
            "payload_note": "structure_path points at the chain-B derived structure object (as required); no other structure used",
            "schema": "schema/schema_structural_stability.json",
            "raw_output": "raw/struct_fitness_scores.csv",
            "n_rows": 2560,
            "columns": ["chain", "mutation", "score"],
            "score_key": "score",
            "direction": "higher = more favorable (reverse-folding favorability); WT self-score is exactly 0.0 at all 128 positions",
            "units": "model-internal unitless score; NOT a kcal/mol ddG and NOT an experimental measurement",
        },
        {
            "task_type": "Sequence Fitness Mutation Effect",
            "task_id": "342605430948864",
            "task_name": "KN035c04_SeqFitness",
            "status": "succeed",
            "duration": "3s",
            "payload": {"sequence": SEQ},
            "payload_note": "sequence payload = entity sequence of chain B (identical to structure sequence, verified length 128)",
            "schema": "schema/schema_sequence_fitness.json",
            "raw_output": "raw/sequence_scores.csv",
            "n_rows": 2560,
            "columns": ["chain", "mutation", "score"],
            "score_key": "score",
            "direction": "higher = more favorable; WT self-score exactly 0.0 at all 128 positions",
            "units": "model-internal unitless score; NOT expression level, solubility or ddG",
        },
        {
            "task_type": "Evolutionary Mutation Effect",
            "task_id": "342605433852928",
            "task_name": "KN035c04_Evolutionary",
            "status": "succeed (VOID - not used)",
            "void_reason": "payload sequence was mis-transcribed to 125 aa (missing K77-S78-T79); output discarded and not used anywhere",
            "raw_output": None,
        },
        {
            "task_type": "Evolutionary Mutation Effect",
            "task_id": "342605471151104",
            "task_name": "KN035c04_Evolutionary_v2",
            "status": "succeed",
            "duration": "1.2min",
            "payload": {"sequence": SEQ},
            "payload_verification": "sequence read from library FASTA, asserted len==128 before submission",
            "schema": "schema/schema_evolutionary.json",
            "raw_output": "raw/evolutionary_scores.csv",
            "n_rows": 2560,
            "columns": ["chain", "mutation", "score"],
            "score_key": "score",
            "direction": "higher = more favorable; WT self-score exactly 0.0 at all 128 positions",
            "units": "model-internal unitless score; conservation/covariance evidence, not a physical energy",
        },
    ],
    "direction_evidence": json.load(open(f"{BASE}/direction_evidence.json")),
    "cases03_cross_evaluation": {
        "status": "completed",
        "inputs": "11 B-chain single-point mutations supplied by the user (case03 top-3 + 7 comparisons + interface-priority T105L)",
        "ddg_pred_policy": "strings carried verbatim; no unit asserted because the case03 tool did not state one; B:T105L ddG is null (not yet synced from the affinity table)",
        "case03_structures": {
            "completed_per_user": ["B:A35W", "B:V109L", "B:C33Y", "B:Q116M", "B:T105L"],
            "scoring_table_only_no_structure": ["B:A35Y", "B:A35F", "B:V109W", "B:A97F", "B:A35S", "B:Q116K"],
            "structure_validation_status": "external_case03_pending_verification"
        },
        "key_findings": {
            "only_framework_candidate": "B:A35S (conditional; buried site, packs against paratope F115)",
            "paratope_not_framework": ["B:V109L", "B:V109W", "B:Q116M", "B:Q116K", "B:T105L", "B:A97F"],
            "must_exclude": "B:C33Y - breaks disulfide B33-B106 (SG-SG 2.18 A in model)",
        },
        "outputs": ["cross_eval_case03.md", "affinity-candidates-x-developability.csv", "affinity-candidates-x-developability.json"],
    },
    "outputs": sorted(os.listdir(BASE)),
}
json.dump(ledger, open(f"{BASE}/task_ledger.json", "w"), indent=2, ensure_ascii=False)
print(json.dumps({k: ledger[k] for k in ["case", "structure_object", "tasks"]}, indent=1, ensure_ascii=False)[:1200])
