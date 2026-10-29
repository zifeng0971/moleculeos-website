#!/usr/bin/env python3
"""Build task-ledger.json (v2).

Every task entry is assembled from
  native_tasks/<task_id>/check_mosttask_response.json
so the ledger carries the real, complete payloads (full sequences) rather than
summaries.  Roles, output paths and results are attached here.
"""
import hashlib, json, pathlib

ROOT = pathlib.Path(".")


def sha(p):
    p = pathlib.Path(p)
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None


def size(p):
    p = pathlib.Path(p)
    return p.stat().st_size if p.exists() else None


resp = json.load(open("native_tasks/_raw_api_returns/all_check_mosttask_responses.json"))

ROLE = {
    "338706466620416": ("affinity (manual example, native reference run — read-only lookup, not re-executed)",
                        "native_tasks/affinity_338706466620416_manual_native/predicted_sipobe_scores.csv",
                        {"score": -4.310292, "vdw": -2.4951997, "hbond": -0.5505939, "metal": 0.0, "hydrophobic": -1.2644981}),
    "342337422410752": ("affinity (this run)",
                        "native_tasks/affinity_342337422410752/predicted_sipobe_scores.csv",
                        {"score": -4.310292, "vdw": -2.4951997, "hbond": -0.5505939, "metal": 0.0, "hydrophobic": -1.2644981}),
    "342337264870400": ("WT sequence fitness scan (5XG0 chain C construct, 268 aa)",
                        "native_tasks/seqfitness_342337264870400/sequence_scores.csv", None),
    "342337268093952": ("WT evolutionary scan (identical 268 aa input)",
                        "native_tasks/evomut_342337268093952/evolutionary_scores.csv", None),
    "342337277858816": ("WT structural fitness scan (same construct as a 268-residue structure)",
                        "native_tasks/structfitness_342337277858816/struct_fitness_scores.csv", None),
    "342338944422912": ("ligand-aware local redesign, 10 designs, 5 opened positions",
                        "native_tasks/redesign_342338944422912/redesign.fasta", None),
    "342339217835008": ("MMFold candidate seq_4", "native_tasks/mmfold_seq_4_342339217835008/", None),
    "342339221820416": ("MMFold candidate seq_2", "native_tasks/mmfold_seq_2_342339221820416/", None),
    "342339232719872": ("MMFold candidate seq_1", "native_tasks/mmfold_seq_1_342339232719872/", None),
    "342337764889600": ("auto-triggered native MMetrics/autocompute for 5XH3_HEMT_complex (duplicate 1)", None, None),
    "342337765340160": ("auto-triggered native MMetrics/autocompute for 5XH3_HEMT_complex (duplicate 2)", None, None),
    "342337536795648": ("native MMetrics analysis of 5XG0 chain C object", "native_tasks/_raw_api_returns/mmetrics_342337536795648_record.json", None),
    "342338457240576": ("native MMetrics analysis of 5xh3_clean object", "native_tasks/_raw_api_returns/mmetrics_342338457240576_record.json", None),
}

tasks = []
for tid, r in resp.items():
    role, out, result = ROLE.get(tid, (None, None, None))
    entry = {
        "role": role,
        "task_id": tid,
        "task_type": r["check_mosttask_response"]["type"],
        "task_name": r["check_mosttask_response"]["task_name"],
        "status": r["check_mosttask_response"]["status"],
        "started": r["check_mosttask_response"]["started"],
        "duration": r["check_mosttask_response"]["duration"],
        "payload_exact": r["payload_exact"],
        "payload_fields_not_exposed": r.get("payload_fields_not_exposed", []),
        "full_response_file": f"native_tasks/{tid}/check_mosttask_response.json",
        "downloaded_files": r.get("downloaded_files", []),
    }
    if out:
        entry["archived_output"] = out
        entry["archived_output_sha256"] = sha(out) if not str(out).endswith("/") else None
    if result:
        entry["result"] = result
    if r.get("note"):
        entry["note"] = r["note"]
    tasks.append(entry)

tasks.sort(key=lambda t: t["started"])

ledger = {
    "case": "website_case_petase — rational engineering of IsPETase around the experimental HEMT site",
    "ledger_version": 2,
    "note": "payload_exact is the complete parameter object as echoed by the platform; sequences are the full 268/261-letter strings, written from the local FASTA and verified by length+SHA256 in each response file. Fields the platform did not return are listed under payload_fields_not_exposed instead of being guessed.",
    "inputs": {
        "5XH3.pdb": {"bytes": size("inputs/5XH3.pdb"), "sha256": sha("inputs/5XH3.pdb")},
        "5XH3.cif": {"bytes": size("inputs/5XH3.cif"), "sha256": sha("inputs/5XH3.cif")},
        "5XH3_pdbx_fasta.fasta": {"bytes": size("inputs/5XH3_pdbx_fasta.fasta"), "sha256": sha("inputs/5XH3_pdbx_fasta.fasta")},
        "5XH3_metadata.json": {"bytes": size("inputs/5XH3_metadata.json"), "sha256": sha("inputs/5XH3_metadata.json")},
        "5XG0.pdb": {"bytes": size("inputs/5XG0.pdb"), "sha256": sha("inputs/5XG0.pdb")},
        "5XG0.cif": {"bytes": size("inputs/5XG0.cif"), "sha256": sha("inputs/5XG0.cif")},
        "5XG0_pdbx_fasta.fasta": {"bytes": size("inputs/5XG0_pdbx_fasta.fasta"), "sha256": sha("inputs/5XG0_pdbx_fasta.fasta")},
        "5XG0_metadata.json": {"bytes": size("inputs/5XG0_metadata.json"), "sha256": sha("inputs/5XG0_metadata.json")},
        "uniprot_A0A0K8P6T7.fasta": {"bytes": size("inputs/uniprot_A0A0K6P7T7.fasta") if False else size("inputs/uniprot_A0A0K8P6T7.fasta"), "sha256": sha("inputs/uniprot_A0A0K8P6T7.fasta")},
        "856_ccd.json": {"bytes": size("inputs/856_ccd.json"), "sha256": sha("inputs/856_ccd.json")},
        "manual_example_protein_5xh3_clean.pdb": {
            "bytes": size("inputs/5xh3_clean.pdb"), "sha256": sha("inputs/5xh3_clean.pdb"),
            "expected_bytes": 156500,
            "expected_sha256": "aa9ddaea2fb33662c15cfd0fb1d8877203bf0ad33132d77553cb4f8eeb12853c",
            "verified": size("inputs/5xh3_clean.pdb") == 156500 and sha("inputs/5xh3_clean.pdb") == "aa9ddaea2fb33662c15cfd0fb1d8877203bf0ad33132d77553cb4f8eeb12853c",
            "reconstruction": "all b'ATOM  ' lines of inputs/5XH3.pdb (1931 lines, 80 bytes each) + b'TER    1932      SER A 261'.ljust(81,b' ') + b'END   ', joined with b'\\n' plus trailing b'\\n'",
        },
        "manual_example_ligand_5xh3_B_856.sdf": {
            "bytes": size("inputs/5xh3_B_856.sdf"), "sha256": sha("inputs/5xh3_B_856.sdf"),
            "expected_bytes": 2191,
            "expected_sha256": "44c9ea73346d5d29b74d034010fcb65e4489dd58407ecccb219863d70fe443e9",
            "verified": size("inputs/5xh3_B_856.sdf") == 2191 and sha("inputs/5xh3_B_856.sdf") == "44c9ea73346d5d29b74d034010fcb65e4489dd58407ecccb219863d70fe443e9",
            "reconstruction": "decoded user-supplied base64 (manual file), repaired to the byte-verified form and checked against the deposited 856 atom block",
        },
    },
    "mos_tasks": tasks,
    "native_mmetrics_status": {
        "5XH3_HEMT_complex": {
            "autocompute_task_ids": ["342337764889600", "342337765340160"],
            "status": "PENDING (platform: 'Task is waiting (not queued)') at final check",
            "downloadable_native_results": False,
            "consequence": "no native MMetrics CSVs exist for the 5XH3 complex yet; the pocket/contact analysis in this case therefore rests on the Mocha built-in scripts, not on MMetrics",
        },
        "5XG0_WT_chainC": {
            "mmetrics_task_id": "342337536795648",
            "status": "SUCCEED",
            "object_ids": {"all_sequences.fasta": "342337533723648", "blast_results.json": "342337533740032",
                           "esm_scores.csv": "342337533756416", "proteinmpnn_scores.csv": "342337533772800",
                           "msat_scores.csv": "342337533789184", "sequence_info.fasta": "342337533801472"},
            "downloadable_native_results": True,
        },
        "5xh3_clean": {
            "mmetrics_task_id": "342338457240576",
            "status": "SUCCEED",
            "object_ids": {"all_sequences.fasta": "342338453922816", "blast_results.json": "342338453935104",
                           "esm_scores.csv": "342338453943296", "proteinmpnn_scores.csv": "342338453955584",
                           "msat_scores.csv": "342338453963776", "sequence_info.fasta": "342338453976064"},
            "downloadable_native_results": True,
        },
        "candidate_models": {
            "autocompute_task_ids": ["342339910697984", "342339911291904", "342339921769472",
                                      "342339922211840", "342339942724608", "342339943171072"],
            "status": "PENDING at final check",
            "downloadable_native_results": False,
        },
        "5XG0_WT_HEMT_model": {
            "autocompute_task_ids": ["342338538587136", "342338541339648"],
            "status": "PENDING at final check",
            "downloadable_native_results": False,
        },
    },
    "limitations": [
        {"item": "ImportStructure of SDF ligands", "status": "not supported in this environment",
         "raw_error": "ERROR: This file is already a sanitized MOS structure and cannot be re-imported as a local file. Use source='mos_object' with the objectId from the original task result instead.",
         "reproduced_on": ["inputs/5xh3_B_856.sdf", "inputs/tmp/lig856.sdf (renamed copy)", "inputs/tmp/tiny.sdf (3-atom test)"],
         "consequence": "the manual SDF was passed to the affinity task at its original TOS path; no substitute ligand was used"},
        {"item": "ImportStructure of MMFold output CIFs as local files", "status": "blocked by the same guard (files carry _mos_mapping)",
         "workaround": "imported with source='mos_object' using the object id found in the data block"},
        {"item": "MOS Superimpose task", "status": "not offered by ListAvailableMOSTasks in this environment",
         "consequence": "superpositions computed with gemmi (Mocha built-in, deterministic), labelled as such"},
        {"item": "AnalyzeMutationScores on task 342337268093952", "status": "wrapper returned 'succeeded but some expected output files are missing'",
         "workaround": "the raw evolutionary_scores.csv was present and used directly"},
    ],
    "overlays_for_screenshots": json.load(open("structures/overlays/overlay_manifest.json")) if pathlib.Path("structures/overlays/overlay_manifest.json").exists() else [],
}

pathlib.Path("task-ledger.json").write_text(json.dumps(ledger, indent=1))
print("wrote task-ledger.json v2:", len(tasks), "tasks")
for t in tasks:
    print(f"  {t['task_id']:<18} {t['status']:<8} {t['task_type'][:38]:<40} keys={list(t['payload_exact'])}")
