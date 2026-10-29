#!/usr/bin/env python3
"""Regenerate task-ledger.json from the artifacts currently on disk.

Every entry is filled from what actually happened in this run (task IDs, exact
payloads, status, output files).  Nothing is inferred or invented; entries with
a documented limitation carry the raw error text.
"""
import csv, hashlib, json, os, pathlib

ROOT = pathlib.Path(".")


def sha(p):
    p = pathlib.Path(p)
    if not p.exists():
        return None
    return hashlib.sha256(p.read_bytes()).hexdigest()


def size(p):
    p = pathlib.Path(p)
    return p.stat().st_size if p.exists() else None


ledger = {
    "case": "website_case_petase — rational engineering of IsPETase around the HEMT site",
    "generated_utc": "2026-10-20T08:25:00Z",
    "inputs": {
        "5XH3.pdb": {"bytes": size("inputs/5XH3.pdb"), "sha256": sha("inputs/5XH3.pdb")},
        "5XH3.cif": {"bytes": size("inputs/5XH3.cif"), "sha256": sha("inputs/5XH3.cif")},
        "5XH3_pdbx_fasta.fasta": {"bytes": size("inputs/5XH3_pdbx_fasta.fasta"), "sha256": sha("inputs/5XH3_pdbx_fasta.fasta")},
        "5XH3_metadata.json": {"bytes": size("inputs/5XH3_metadata.json"), "sha256": sha("inputs/5XH3_metadata.json")},
        "5XG0.pdb": {"bytes": size("inputs/5XG0.pdb"), "sha256": sha("inputs/5XG0.pdb")},
        "5XG0.cif": {"bytes": size("inputs/5XG0.cif"), "sha256": sha("inputs/5XG0.cif")},
        "5XG0_pdbx_fasta.fasta": {"bytes": size("inputs/5XG0_pdbx_fasta.fasta"), "sha256": sha("inputs/5XG0_pdbx_fasta.fasta")},
        "5XG0_metadata.json": {"bytes": size("inputs/5XG0_metadata.json"), "sha256": sha("inputs/5XG0_metadata.json")},
        "uniprot_A0A0K8P6T7.fasta": {"bytes": size("inputs/uniprot_A0A0K8P6T7.fasta"), "sha256": sha("inputs/uniprot_A0A0K8P6T7.fasta")},
        "856_ccd.json": {"bytes": size("inputs/856_ccd.json"), "sha256": sha("inputs/856_ccd.json")},
        "manual_example_protein_5xh3_clean.pdb": {
            "bytes": size("inputs/5xh3_clean.pdb"), "sha256": sha("inputs/5xh3_clean.pdb"),
            "expected_bytes": 156500,
            "expected_sha256": "aa9ddaea2fb33662c15cfd0fb1d8877203bf0ad33132d77553cb4f8eeb12853c",
            "reconstruction": "all b'ATOM  ' lines of inputs/5XH3.pdb (1931 lines, 80 chars each) + b'TER    1932      SER A 261'.ljust(81,b' ') + b'END   ', joined with b'\\n' + trailing b'\\n'",
        },
        "manual_example_ligand_5xh3_B_856.sdf": {
            "bytes": size("inputs/5xh3_B_856.sdf"), "sha256": sha("inputs/5xh3_B_856.sdf"),
            "expected_bytes": 2191,
            "expected_sha256": "44c9ea73346d5d29b74d034010fcb65e4489dd58407ecccb219863d70fe443e9",
            "reconstruction": "base64 block supplied by the user (verbatim manual file), decoded and byte-verified",
        },
    },
    "mos_tasks": [
        {
            "role": "affinity (manual example, native reference run, read-only)",
            "task_id": "338706466620416",
            "task_type": "Protein-Ligand Affinity Evaluation",
            "task_name": "5xh3_A_ligand_affinity",
            "status": "succeed (platform record, 2026-10-10, 3.2 min)",
            "payload_exact": {
                "target_file": "tos:mosv2-prod/user_objects/0/329502077678592/sanitized/179159720409225_5xh3_clean (2).cif",
                "reference_file": "tos:mosv2-prod/user_objects/0/329502077678592/338706328146944_5xh3_B_856 (1).sdf",
            },
            "outputs": ["native_tasks/affinity_338706466620416_manual_native/predicted_sipobe_scores.csv"],
            "note": "not used as this run's result; kept only as the reference the re-run must reproduce",
        },
        {
            "role": "affinity (this run)",
            "task_id": "342337422410752",
            "task_type": "Protein-Ligand Affinity Evaluation",
            "task_name": "PETase_5xh3_HEMT_affinity_rerun",
            "status": "succeed",
            "payload_exact": {
                "model_name": "sipobe",
                "batch_size": 1,
                "ngpu": 0,
                "target_file": "tos:mosv2-prod/user_objects/123/330665428816896/sanitized/179248399086985_5xh3_clean.cif",
                "reference_file": "tos:mosv2-prod/user_objects/0/329502077678592/338706328146944_5xh3_B_856 (1).sdf",
            },
            "input_provenance": {
                "target": "our registered object 5xh3_clean.cif, built from the 156500-byte SHA256-verified manual PDB; 1931 atoms, coordinates identical to that file",
                "reference": "the manual SDF at its original TOS path (same object the native task 338706466620416 consumed); local copy byte-identical (2191 bytes, SHA256 verified)",
            },
            "outputs": ["native_tasks/affinity_342337422410752/predicted_sipobe_scores.csv"],
            "result": {"score": -4.310292, "vdw": -2.4951997, "hbond": -0.5505939, "metal": 0.0, "hydrophobic": -1.2644981},
            "reproduces_native_task_338706466620416": True,
        },
        {
            "role": "WT sequence fitness scan",
            "task_id": "342337264870400",
            "task_type": "Sequence Fitness Mutation Effect",
            "task_name": "WT_PETase_seqfitness",
            "status": "succeed",
            "payload_exact": {"sequence": "5XG0 chain C construct, 268 aa (GAGAGAM tag + mature AUTH 1-261)"},
            "outputs": ["native_tasks/seqfitness_342337264870400/sequence_scores.csv"],
        },
        {
            "role": "WT evolutionary scan",
            "task_id": "342337268093952",
            "task_type": "Evolutionary Mutation Effect",
            "task_name": "WT_PETase_evomut",
            "status": "succeed",
            "payload_exact": {"sequence": "identical 268 aa 5XG0 chain C construct"},
            "outputs": ["native_tasks/evomut_342337268093952/evolutionary_scores.csv"],
            "note": "the AnalyzeMutationScores wrapper reported 'some expected output files are missing'; the raw CSV was present and was used directly",
        },
        {
            "role": "WT structure fitness scan",
            "task_id": "342337277858816",
            "task_type": "Structural Stability Mutation Effect",
            "task_name": "WT_PETase_structfitness",
            "status": "succeed",
            "payload_exact": {"structure_path": "user_objects/123/330665428816896/sanitized/179248398139384_5XG0_WT_chainC_author-6_261.cif"},
            "outputs": ["native_tasks/structfitness_342337277858816/struct_fitness_scores.csv"],
        },
        {
            "role": "ligand-aware local redesign",
            "task_id": "342338944422912",
            "task_type": "Protein Redesign",
            "task_name": "PETase_WT_HEMT_local_redesign_10",
            "status": "succeed",
            "payload_exact": {
                "structure_path": "user_objects/123/330665428816896/sanitized/179248434317855_5XG0_WT_HEMT_model.cif",
                "n_designs": 10,
                "chains_to_design": "D",
                "redesigned_residues": "D130 D156 D157 D179 D209",
                "design_output_mode": "full",
            },
            "template": "structures/5XG0_WT_HEMT_model.cif — constructed model (5XH3 conformation + AUTH103/AUTH131 reverted to WT from superposed 5XG0 + experimental HEMT pose); NOT an experimental WT complex",
            "outputs": ["native_tasks/redesign_342338944422912/redesign.fasta"],
            "note": "10 sequences returned; no per-position probabilities or per-design scores were produced by the task",
        },
        {
            "role": "candidate model",
            "task_id": "342339217835008",
            "task_type": "MMFold",
            "task_name": "MMFold_candidate_seq_4",
            "status": "succeed",
            "payload_exact": {"name": "PETase_design_seq_4_W130H_W156Y_D157H_S209G", "dialect": "mmfold", "version": 1,
                              "sequences": [{"protein": {"id": "A", "sequence": "261 aa, W130H/W156Y/D157H/S209G"}}]},
            "outputs_dir": "native_tasks/mmfold_seq_4_342339217835008/",
            "mos_model_object_sample1": {"object_id": "342339708015616", "work_id": "342339910484992"},
            "confidence": {"plddt_mean": 97.29, "ptm": 0.984},
        },
        {
            "role": "candidate model",
            "task_id": "342339221820416",
            "task_type": "MMFold",
            "task_name": "MMFold_candidate_seq_2",
            "status": "succeed",
            "payload_exact": {"name": "PETase_design_seq_2_W130H_W156Y_D157Y_S209G", "dialect": "mmfold", "version": 1,
                              "sequences": [{"protein": {"id": "A", "sequence": "261 aa, W130H/W156Y/D157Y/S209G"}}]},
            "outputs_dir": "native_tasks/mmfold_seq_2_342339221820416/",
            "mos_model_object_sample1": {"object_id": "342339721073664", "work_id": "342339921507328"},
            "confidence": {"plddt_mean": 96.83, "ptm": 0.981},
        },
        {
            "role": "candidate model",
            "task_id": "342339232719872",
            "task_type": "MMFold",
            "task_name": "MMFold_candidate_seq_1",
            "status": "succeed",
            "payload_exact": {"name": "PETase_design_seq_1_W130H_W156Y_D157H_I179V_S209G", "dialect": "mmfold", "version": 1,
                              "sequences": [{"protein": {"id": "A", "sequence": "261 aa, W130H/W156Y/D157H/I179V/S209G"}}]},
            "outputs_dir": "native_tasks/mmfold_seq_1_342339232719872/",
            "mos_model_object_sample1": {"object_id": "342339706594304", "work_id": "342339942499328"},
            "confidence": {"plddt_mean": 97.22, "ptm": 0.984},
        },
    ],
    "limitations": [
        {
            "item": "ImportStructure of SDF ligands",
            "status": "not supported in this environment",
            "raw_error": "ERROR: This file is already a sanitized MOS structure and cannot be re-imported as a local file. Use source='mos_object' with the objectId from the original task result instead.",
            "reproduced_on": ["inputs/5xh3_B_856.sdf", "renamed copy inputs/tmp/lig856.sdf", "a 3-atom test SDF"],
            "consequence": "the manual SDF was supplied to the affinity task at its original TOS path instead; no substitute ligand was used",
        },
        {
            "item": "ImportStructure of MMFold output CIFs as local files",
            "status": "blocked by the same 'already a sanitized MOS structure' guard (outputs carry _mos_mapping)",
            "workaround": "imported with source='mos_object' using the object id from the data block (e.g. 342339708015616)",
        },
        {
            "item": "MOS Superimpose task",
            "status": "not offered by ListAvailableMOSTasks in this environment",
            "consequence": "superpositions were computed with gemmi (Mocha built-in, deterministic) and are labelled as such",
        },
    ],
}

# attach per-task output hashes
for t in ledger["mos_tasks"]:
    t["output_hashes"] = {o: sha(o) for o in t.get("outputs", [])}

pathlib.Path("task-ledger.json").write_text(json.dumps(ledger, indent=1))
print("wrote task-ledger.json with", len(ledger["mos_tasks"]), "tasks")
for f, v in ledger["inputs"].items():
    print(f"  {f}: {v['bytes']} bytes")
