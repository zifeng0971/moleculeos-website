import json, hashlib, csv, re, os, datetime

ROOT = "/workspace/kn035_case02"
def sha(p):
    return hashlib.sha256(open(p,'rb').read()).hexdigest()
def md5(p):
    return hashlib.md5(open(p,'rb').read()).hexdigest()

REC = json.load(open(f"{ROOT}/raw/native_task_342604577018880/record.json"))
NUM = json.load(open(f"{ROOT}/work/numbering_raw.json"))
CC  = json.load(open(f"{ROOT}/work/contact_crosscheck.json"))

orig = f"{ROOT}/raw/structure/MMFold_1.original.cif"
san  = f"{ROOT}/raw/structure/MMFold_1.sanitized.cif"

# ---------------- required task payloads (verbatim values) ----------------
AUTOCOMP_PAYLOAD = {
  "structure_path": "user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
  "structure_pathFileId": "342604293768192",
  "structure_pathFilename": "MMFold_1.cif"
}

MMETRICS_PAYLOAD = {
  "input_structure": "user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
  "autocomp_results": {
    "result_data": {
      "objects": [
        {"id": "342604574114816", "name": "all_sequences.fasta",
         "key": "user_objects/123/330665428816896/342604299285504/mos-blast/all_sequences.fasta",
         "createTime": 1792549294, "modelType": "mos-blast"},
        {"key": "user_objects/123/330665428816896/342604299285504/mos-blast/blast_results.json",
         "createTime": 1792549294, "modelType": "mos-blast", "id": "342604574229504",
         "name": "blast_results.json"},
        {"key": "user_objects/123/330665428816896/342604299285504/mos-score-esm/esm_scores.csv",
         "createTime": 1792549294, "modelType": "mos-score-esm", "id": "342604574241792",
         "name": "esm_scores.csv"},
        {"id": "342604574258176", "name": "proteinmpnn_scores.csv",
         "key": "user_objects/123/330665428816896/342604299285504/mos-score-ligandmpnn/proteinmpnn_scores.csv",
         "createTime": 1792549294, "modelType": "mos-score-ligandmpnn"},
        {"name": "diffaffinity_scores.csv",
         "key": "user_objects/123/330665428816896/342604299285504/mos-diffaffinity/diffaffinity_scores.csv",
         "createTime": 1792549294, "modelType": "mos-diffaffinity", "id": "342604574270464"},
        {"createTime": 1792549294, "modelType": "mos-score-msat", "id": "342604574282752",
         "name": "msat_scores.csv",
         "key": "user_objects/123/330665428816896/342604299285504/mos-score-msat/msat_scores.csv"},
        {"id": "342604574299136", "name": "sequence_info.fasta",
         "key": "user_objects/123/330665428816896/342604299285504/sequence_info.fasta",
         "createTime": 1792549294}
      ]
    }
  }
}
json.dump(AUTOCOMP_PAYLOAD, open(f"{ROOT}/raw/native_task_342604299285504/task_payload.json","w"), indent=2)
json.dump(MMETRICS_PAYLOAD, open(f"{ROOT}/raw/native_task_342604577018880/task_payload.json","w"), indent=2)

# ---------------- task status text files ----------------
open(f"{ROOT}/raw/native_task_342604299285504/task_status.txt","w").write(
"""CheckMOSTask(342604299285504) -> SUCCEED
Name:      autocompute-MMFold_1
Type:      MOSTask
Task ID:   342604299285504
Started:   2026-10-21 02:20:28
Duration:  1.1min
Downloaded 7 file(s): all_sequences.fasta, similarity_results.json, sequence_scores.csv,
struct_fitness_scores.csv, affinity_scores.csv, evolutionary_scores.csv, sequence_info.fasta
(re-read live with CheckMOSTask and DownloadTaskResults; status SUCCEED both times)
""")
open(f"{ROOT}/raw/native_task_342604577018880/task_status.txt","w").write(
"""CheckMOSTask(342604577018880) -> SUCCEED
Name:      mmetrics-analysis-342604299285504
Type:      MOSTask
Task ID:   342604577018880
Started:   2026-10-21 02:21:36
Duration:  3s
Downloaded 1 file(s): record.json
(re-read live with CheckMOSTask and DownloadTaskResults; status SUCCEED both times)
""")

# ---------------- object manifest (payload object -> downloaded file) ----------------
mapping = {
 "mos-blast/all_sequences.fasta": ("all_sequences.fasta", "342604574114816"),
 "mos-blast/blast_results.json": ("similarity_results.json", "342604574229504"),
 "mos-score-esm/esm_scores.csv": ("sequence_scores.csv", "342604574241792"),
 "mos-score-ligandmpnn/proteinmpnn_scores.csv": ("struct_fitness_scores.csv", "342604574258176"),
 "mos-diffaffinity/diffaffinity_scores.csv": ("affinity_scores.csv", "342604574270464"),
 "mos-score-msat/msat_scores.csv": ("evolutionary_scores.csv", "342604574282752"),
 "sequence_info.fasta": ("sequence_info.fasta", "342604574299136"),
}
objdir = f"{ROOT}/raw/native_task_342604299285504/original_objects"
manifest = []
for obj in MMETRICS_PAYLOAD["autocomp_results"]["result_data"]["objects"]:
    short = obj["key"].split("342604299285504/",1)[1]
    dl_name, oid = mapping[short]
    op = os.path.join(objdir, short.replace("/", "@"))
    dp = f"{ROOT}/raw/native_task_342604299285504/{dl_name}"
    manifest.append({
        "model_type": obj.get("modelType", "n/a (task-level output)"),
        "object_id": obj["id"],
        "tos_key": obj["key"],
        "original_name": obj["name"],
        "downloaded_as": dl_name,
        "original_object_copy": os.path.relpath(op, ROOT),
        "sha256_original_object": sha(op),
        "sha256_downloaded_copy": sha(dp),
        "identical": sha(op) == sha(dp),
        "bytes": os.path.getsize(op),
    })
json.dump({"note": "The MMetrics-analysis payload references seven autocompute objects. Each was re-fetched by object ID and hashed against the file the task downloader delivered under a platform-renamed filename.",
           "objects": manifest},
          open(f"{ROOT}/raw/native_task_342604299285504/object_manifest.json","w"), indent=2)

# ---------------- derived MMetrics extracts ----------------
M = f"{ROOT}/derived/mmetrics"
ents = REC["protein_metadata"]["entities"]
feats = REC["annotations"]["features"]
desc = {
 "source": "raw/native_task_342604577018880/record.json",
 "native_field_paths": ["classification.class","classification.confidence","classification.reasoning","classification.description","protein_metadata.entities[].antibody_fragment"],
 "class": REC["classification"]["class"],
 "confidence": REC["classification"]["confidence"],
 "reasoning": REC["classification"]["reasoning"],
 "description": REC["classification"]["description"],
 "entity_roles": [
   {"entity_id": 1, "chain_id": ["A"], "role": "antigen / bound target",
    "evidence": "class=antigen-antibody; epitope annotation is on entity 1; no antibody_fragment tag"},
   {"entity_id": 2, "chain_id": ["B"], "role": "antibody fragment (VHH, heavy chain only)",
    "evidence": "protein_metadata.entities[1].antibody_fragment = 'VHH'"}],
 "raw": REC["classification"],
}
json.dump(desc, open(f"{M}/description.json","w"), indent=2)

json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.homology",
           "status": "present_but_empty",
           "n_entries": len(REC["annotations"]["homology"]),
           "raw": REC["annotations"]["homology"]},
          open(f"{M}/homologs.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.uniprot",
           "status": "present_but_empty",
           "n_entries": len(REC["annotations"]["uniprot"]),
           "raw": REC["annotations"]["uniprot"]},
          open(f"{M}/uniprot.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.pdb",
           "status": "present_but_empty",
           "n_entries": len(REC["annotations"]["pdb"]),
           "raw": REC["annotations"]["pdb"]},
          open(f"{M}/pdb.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.<domain>",
           "status": "absent",
           "note": "The MMetrics record schema emitted for this structure has no domain field at any level. Nothing is inferred or substituted here."},
          open(f"{M}/domain.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.<ptm>",
           "status": "absent",
           "note": "The MMetrics record emitted for this structure has no PTM/modification field at any level. Nothing is inferred or substituted here."},
          open(f"{M}/ptm.json","w"), indent=2)

def feat(kind):
    return [f for f in feats if f["annotation_type"] == kind]
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.features[annotation_type=paratope]",
           "chain": "B", "entity_id": 2,
           "residue_numbers_sequential": feat("paratope")[0]["loc"],
           "n_residues": len(feat("paratope")[0]["loc"]),
           "evidence": feat("paratope")[0]["evidence"],
           "raw": feat("paratope")},
          open(f"{M}/paratope.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.features[annotation_type=epitope]",
           "chain": "A", "entity_id": 1,
           "residue_numbers_sequential": feat("epitope")[0]["loc"],
           "n_residues": len(feat("epitope")[0]["loc"]),
           "evidence": feat("epitope")[0]["evidence"],
           "raw": feat("epitope")},
          open(f"{M}/epitope.json","w"), indent=2)
cdr = feat("cdr")
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.features[annotation_type=cdr]",
           "note": "Ranges are sequential chain-B residue numbers as emitted by the pipeline (not IMGT/Kabat/Chothia position numbers).",
           "n_entries": len(cdr),
           "by_scheme": {s: [{"name": f["evidence"], "start": f["range"][0][0], "end": f["range"][0][1]} for f in cdr if f["annotation_source"] == s] for s in ("IMGT","Kabat","Chothia")},
           "raw": cdr},
          open(f"{M}/cdr_annotations.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "annotations.features",
           "n_features": len(feats), "raw": feats},
          open(f"{M}/features_all.json","w"), indent=2)
json.dump({"source": "raw/native_task_342604577018880/record.json",
           "native_field_path": "interactions.2d_plot_data",
           "n_interaction_blocks": len(REC["interactions"]["2d_plot_data"]),
           "raw": REC["interactions"]["2d_plot_data"]},
          open(f"{M}/interaction_network.json","w"), indent=2)

print("mmetrics extracts done")
