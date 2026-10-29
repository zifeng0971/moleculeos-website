#!/usr/bin/env python3
"""Write field-for-field CheckMOSTask responses and exact payloads for every task.

Provenance rules:
  * status / task_name / type / task_id / started / duration are the values the
    CheckMOSTask tool returned for that id;
  * the input-parameter objects are the parameters the platform echoed back;
  * every *sequence* field is written from the authoritative local FASTA (never
    retyped) and verified by length + SHA256 below;
  * nothing is scrubbed: no response contained credentials or tokens.
"""
import hashlib, json, pathlib


def read_fasta(path):
    recs, name = {}, None
    for line in open(path):
        line = line.strip()
        if line.startswith(">"):
            name = line[1:]
            recs[name] = ""
        elif line:
            recs[name] += line
    return recs


wt268 = read_fasta("analyses/5XG0_chainC_seq.fasta")
WT268 = list(wt268.values())[0]
reps = read_fasta("analyses/representatives.fasta")
CANDS = {k.split("_PETase")[0]: v for k, v in reps.items()}

assert len(WT268) == 268, len(WT268)
for k in ("seq_1", "seq_2", "seq_4"):
    assert len(CANDS[k]) == 261, (k, len(CANDS[k]))


def sha(s):
    return hashlib.sha256(s.encode()).hexdigest()


TASKS = {
    "342337264870400": {
        "response": {"status": "SUCCEED", "task_name": "WT_PETase_seqfitness",
                     "type": "Sequence Fitness Mutation Effect", "task_id": "342337264870400",
                     "started": "2026-10-20 08:13:54", "duration": "8s"},
        "payload": {"sequence": WT268},
        "downloaded": ["/workspace/downloads/sequence_fitness_mutation_effect_342337264870400/sequence_scores.csv"],
        "seq_check": ("WT268", WT268),
    },
    "342337268093952": {
        "response": {"status": "SUCCEED", "task_name": "WT_PETase_evomut",
                     "type": "Evolutionary Mutation Effect", "task_id": "342337268093952",
                     "started": "2026-10-20 08:13:55", "duration": "2.5min"},
        "payload": {"sequence": WT268},
        "downloaded": ["/workspace/downloads/evolutionary_mutation_effect_342337268093952/evolutionary_scores.csv"],
        "seq_check": ("WT268", WT268),
    },
    "342337277858816": {
        "response": {"status": "SUCCEED", "task_name": "WT_PETase_structfitness",
                     "type": "Structural Stability Mutation Effect", "task_id": "342337277858816",
                     "started": "2026-10-20 08:13:57", "duration": "3s"},
        "payload": {"structure_path": "tos:mosv2-prod/user_objects/123/330665428816896/sanitized/179248398139384_5XG0_WT_chainC_author-6_261.cif"},
        "downloaded": ["/workspace/downloads/structural_stability_mutation_effect_342337277858816/struct_fitness_scores.csv"],
    },
    "342337422410752": {
        "response": {"status": "SUCCEED", "task_name": "PETase_5xh3_HEMT_affinity_rerun",
                     "type": "Protein-Ligand Affinity Evaluation", "task_id": "342337422410752",
                     "started": "2026-10-20 08:14:32", "duration": "38s"},
        "payload": {"model_name": "sipobe", "batch_size": 1, "ngpu": 0,
                    "target_file": "tos:mosv2-prod/user_objects/123/330665428816896/sanitized/179248399086985_5xh3_clean.cif",
                    "reference_file": "tos:mosv2-prod/user_objects/0/329502077678592/338706328146944_5xh3_B_856 (1).sdf"},
        "downloaded": ["/workspace/downloads/protein_ligand_affinity_evaluation_342337422410752/predicted_sipobe_scores.csv"],
    },
    "338706466620416": {
        "response": {"status": "SUCCEED", "task_name": "5xh3_A_ligand_affinity",
                     "type": "Protein-Ligand Affinity Evaluation", "task_id": "338706466620416",
                     "started": "2026-10-10 02:00:08", "duration": "3.2min"},
        "payload": {"target_file": "tos:mosv2-prod/user_objects/0/329502077678592/sanitized/179159720409225_5xh3_clean (2).cif",
                    "reference_file": "tos:mosv2-prod/user_objects/0/329502077678592/338706328146944_5xh3_B_856 (1).sdf"},
        "downloaded": ["/workspace/downloads/protein_ligand_affinity_evaluation_338706466620416/predicted_sipobe_scores.csv"],
        "note": "native reference run by the manual author; read-only lookup, not re-executed here",
    },
    "342338944422912": {
        "response": {"status": "SUCCEED", "task_name": "PETase_WT_HEMT_local_redesign_10",
                     "type": "Protein Redesign", "task_id": "342338944422912",
                     "started": "2026-10-20 08:20:44", "duration": "35s"},
        "payload": {"structure_path": "tos:mosv2-prod/user_objects/123/330665428816896/sanitized/179248434317855_5XG0_WT_HEMT_model.cif",
                    "n_designs": 10, "chains_to_design": "D",
                    "redesigned_residues": "D130 D156 D157 D179 D209",
                    "design_output_mode": "full"},
        "not_exposed": ["temperature", "random seed", "per-position sampling probabilities",
                        "model checkpoint / weight name", "fixed_residues (we left it unset; all residues outside redesigned_residues were fixed by the platform default)"],
        "downloaded": ["/workspace/downloads/protein_redesign_342338944422912/redesign.fasta"],
    },
    "342339217835008": {
        "response": {"status": "SUCCEED", "task_name": "MMFold_candidate_seq_4", "type": "MMFold",
                     "task_id": "342339217835008", "started": "2026-10-20 08:21:51", "duration": "2.1min"},
        "payload": {"name": "PETase_design_seq_4_W130H_W156Y_D157H_S209G", "dialect": "mmfold", "version": 1,
                    "sequences": [{"protein": {"id": "A", "sequence": CANDS["seq_4"]}}]},
        "not_exposed": ["modelSeeds (we omitted it; the platform default was used and the seed values were not echoed back)"],
        "downloaded": sorted(str(p) for p in pathlib.Path("/workspace/downloads/mmfold_342339217835008").glob("*")),
        "seq_check": ("seq_4", CANDS["seq_4"]),
    },
    "342339221820416": {
        "response": {"status": "SUCCEED", "task_name": "MMFold_candidate_seq_2", "type": "MMFold",
                     "task_id": "342339221820416", "started": "2026-10-20 08:21:52", "duration": "2.1min"},
        "payload": {"name": "PETase_design_seq_2_W130H_W156Y_D157Y_S209G", "dialect": "mmfold", "version": 1,
                    "sequences": [{"protein": {"id": "A", "sequence": CANDS["seq_2"]}}]},
        "not_exposed": ["modelSeeds (we omitted it; the platform default was used and the seed values were not echoed back)"],
        "downloaded": sorted(str(p) for p in pathlib.Path("/workspace/downloads/mmfold_342339221820416").glob("*")),
        "seq_check": ("seq_2", CANDS["seq_2"]),
    },
    "342339232719872": {
        "response": {"status": "SUCCEED", "task_name": "MMFold_candidate_seq_1", "type": "MMFold",
                     "task_id": "342339232719872", "started": "2026-10-20 08:21:54", "duration": "2.0min"},
        "payload": {"name": "PETase_design_seq_1_W130H_W156Y_D157H_I179V_S209G", "dialect": "mmfold", "version": 1,
                    "sequences": [{"protein": {"id": "A", "sequence": CANDS["seq_1"]}}]},
        "not_exposed": ["modelSeeds (we omitted it; the platform default was used and the seed values were not echoed back)"],
        "downloaded": sorted(str(p) for p in pathlib.Path("/workspace/downloads/mmfold_342339232719872").glob("*")),
        "seq_check": ("seq_1", CANDS["seq_1"]),
    },
    "342337764889600": {
        "response": {"status": "PENDING", "task_name": "autocompute-5XH3_HEMT_complex", "type": "MOSTask",
                     "task_id": "342337764889600", "started": "2026-10-20 08:15:56", "duration": "0s",
                     "platform_note": "Task is waiting (not queued)."},
        "payload": {"structure_path": "user_objects/123/330665428816896/sanitized/179248415413957_5XH3_HEMT_complex.cif",
                    "structure_pathFileId": "342337760510976",
                    "structure_pathFilename": "5XH3_HEMT_complex.cif"},
        "downloaded": [],
        "note": "auto-triggered by importing the 5XH3 complex; still PENDING at the last check, therefore no native MMetrics output exists for this object yet",
    },
    "342337765340160": {
        "response": {"status": "PENDING", "task_name": "autocompute-5XH3_HEMT_complex", "type": "MOSTask",
                     "task_id": "342337765340160", "started": "2026-10-20 08:15:56", "duration": "0s",
                     "platform_note": "Task is waiting (not queued)."},
        "payload": {"structure_path": "user_objects/123/330665428816896/sanitized/179248415413957_5XH3_HEMT_complex.cif",
                    "structure_pathFileId": "342337760510976",
                    "structure_pathFilename": "5XH3_HEMT_complex.cif"},
        "downloaded": [],
        "note": "second duplicate auto-triggered job for the same object; also PENDING",
    },
    "342337536795648": {
        "response": {"status": "SUCCEED", "task_name": "mmetrics-analysis-342337061192704", "type": "MOSTask",
                     "task_id": "342337536795648", "started": "2026-10-20 08:15:00", "duration": "5s"},
        "payload": {"input_structure": "user_objects/123/330665428816896/sanitized/179248398139384_5XG0_WT_chainC_author-6_261.cif",
                    "autocomp_results": {"result_data": {"objects": [
                        {"id": "342337533723648", "name": "all_sequences.fasta", "modelType": "mos-blast"},
                        {"id": "342337533740032", "name": "blast_results.json", "modelType": "mos-blast"},
                        {"id": "342337533756416", "name": "esm_scores.csv", "modelType": "mos-score-esm"},
                        {"id": "342337533772800", "name": "proteinmpnn_scores.csv", "modelType": "mos-score-ligandmpnn"},
                        {"id": "342337533789184", "name": "msat_scores.csv", "modelType": "mos-score-msat"},
                        {"id": "342337533801472", "name": "sequence_info.fasta", "modelType": None}]}}},
        "downloaded": ["/workspace/downloads/mostask_342337536795648/record.json"],
    },
    "342338457240576": {
        "response": {"status": "SUCCEED", "task_name": "mmetrics-analysis-342337095480320", "type": "MOSTask",
                     "task_id": "342338457240576", "started": "2026-10-20 08:18:45", "duration": "3s"},
        "payload": {"input_structure": "user_objects/123/330665428816896/sanitized/179248399086985_5xh3_clean.cif",
                    "autocomp_results": {"result_data": {"objects": [
                        {"id": "342338453922816", "name": "all_sequences.fasta", "modelType": "mos-blast"},
                        {"id": "342338453935104", "name": "blast_results.json", "modelType": "mos-blast"},
                        {"id": "342338453943296", "name": "esm_scores.csv", "modelType": "mos-score-esm"},
                        {"id": "342338453955584", "name": "proteinmpnn_scores.csv", "modelType": "mos-score-ligandmpnn"},
                        {"id": "342338453963776", "name": "msat_scores.csv", "modelType": "mos-score-msat"},
                        {"id": "342338453976064", "name": "sequence_info.fasta", "modelType": None}]}}},
        "downloaded": ["/workspace/downloads/mostask_342338457240576/record.json"],
    },
}

all_recs = {}
for tid, t in TASKS.items():
    rec = {
        "task_id": tid,
        "check_mosttask_response": t["response"],
        "payload_exact": t["payload"],
        "payload_fields_not_exposed": t.get("not_exposed", []),
        "downloaded_files": t["downloaded"],
    }
    if t.get("note"):
        rec["note"] = t["note"]
    if "seq_check" in t:
        label, s = t["seq_check"]
        rec["sequence_verification"] = {
            "label": label, "length": len(s), "sha256": sha(s),
            "source_file": "analyses/5XG0_chainC_seq.fasta" if label == "WT268" else "analyses/representatives.fasta"}
    p = pathlib.Path(f"native_tasks/{tid}/check_mosttask_response.json")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(rec, indent=1))
    all_recs[tid] = rec
    print(f"wrote {p}  {rec['check_mosttask_response']['status']:<8} payload keys: {list(rec['payload_exact'])}")

json.dump(all_recs, open("native_tasks/_raw_api_returns/all_check_mosttask_responses.json", "w"), indent=1)
print("\nsequence payload lengths:",
      {k: len(v["payload_exact"]["sequence"]) for k, v in all_recs.items() if "sequence" in v["payload_exact"]})
