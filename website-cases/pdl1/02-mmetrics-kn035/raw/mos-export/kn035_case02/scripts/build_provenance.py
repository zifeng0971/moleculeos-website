import json, hashlib, os, datetime, re
ROOT="/workspace/kn035_case02"
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
def md5(p): return hashlib.md5(open(p,'rb').read()).hexdigest()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
NUM=json.load(open(f"{ROOT}/work/numbering_raw.json"))
REC=json.load(open(f"{ROOT}/raw/native_task_342604577018880/record.json"))
text=open(f"{ROOT}/raw/structure/MMFold_1.sanitized.cif").read()
n_atoms=len(re.findall(r"^ATOM", text, re.M)); n_het=len(re.findall(r"^HETATM", text, re.M))
seqs={c["label_asym_id"]:c["observed_sequence"] for c in NUM["chains"]}

struct={
 "display_name":"MMFold_1.cif",
 "data_block":NUM["data_block"],
 "object_id":"342604293768192",
 "work_id":"342604299084800",
 "tos_key":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
 "origin":"MMFold prediction output uploaded/imported by the user as MMFold_1.cif; no structure prediction was re-run in this case",
 "local_original_path":"/workspace/protein_data/protein_342604299084800/MMFold_1.cif",
 "bytes":os.path.getsize(f"{ROOT}/raw/structure/MMFold_1.original.cif"),
 "sha256_original":sha(f"{ROOT}/raw/structure/MMFold_1.original.cif"),
 "md5_original":md5(f"{ROOT}/raw/structure/MMFold_1.original.cif"),
 "sha256_mos_object_copy":sha(f"{ROOT}/raw/structure/MMFold_1.sanitized.cif"),
 "md5_mos_object_copy":md5(f"{ROOT}/raw/structure/MMFold_1.sanitized.cif"),
 "sanitization_byte_identical":sha(f"{ROOT}/raw/structure/MMFold_1.original.cif")==sha(f"{ROOT}/raw/structure/MMFold_1.sanitized.cif"),
 "sanitization_note":"The object returned by GetMOSObject(342604293768192) is byte-for-byte the file that was imported. MOS added a _mos_mapping loop (246 rows) but did not alter any coordinate, chain label, residue name or residue number relative to the imported file.",
 "coordinates":{"n_atoms":n_atoms,"n_hetatm":n_het,"n_residues":246,"n_models":1},
 "chains":[
   {"chain_id":"A","auth_chain_id":"A","entity_id":1,"entity_type":"polypeptide(L)","length":118,
    "sequence":seqs["A"],"sequence_sha256":hashlib.sha256(seqs["A"].encode()).hexdigest(),
    "assigned_role":"human PD-L1 antigen (light-chain-free complex partner)"},
   {"chain_id":"B","auth_chain_id":"B","entity_id":2,"entity_type":"polypeptide(L)","length":128,
    "sequence":seqs["B"],"sequence_sha256":hashlib.sha256(seqs["B"].encode()).hexdigest(),
    "assigned_role":"KN035 VHH (single-domain antibody heavy chain; no light chain present)"}],
 "numbering":"label_seq_id == auth_seq_id == _mos_mapping.mapped_seqidx == MMFold_1 numbering, 1..N per chain, no insertion codes, no gaps; see numbering-map.json"
}

lineage=[
 {"step":1,"event":"structure import / registration","object_id":"342604293768192","work_id":"342604299084800",
  "tos_key":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
  "input_sha256":struct["sha256_original"],"registered_copy_sha256":struct["sha256_mos_object_copy"]},
 {"step":2,"event":"native automatic pre-analysis (autocompute)","task_id":"342604299285504","task_name":"autocompute-MMFold_1",
  "status":"succeed","started":"2026-10-21T02:20:28Z","duration":"1.1min",
  "input":"structure_path = same TOS key as step 1",
  "produced_objects":["mos-blast/all_sequences.fasta","mos-blast/blast_results.json","mos-score-esm/esm_scores.csv",
                      "mos-score-ligandmpnn/proteinmpnn_scores.csv","mos-diffaffinity/diffaffinity_scores.csv",
                      "mos-score-msat/msat_scores.csv","sequence_info.fasta"]},
 {"step":3,"event":"native automatic MMetrics analysis","task_id":"342604577018880","task_name":"mmetrics-analysis-342604299285504",
  "status":"succeed","started":"2026-10-21T02:21:36Z","duration":"3s",
  "input":"input_structure = same TOS key as step 1; autocomp_results = the seven objects from step 2",
  "output":"record.json","mmetrics_id":REC["mmetrics_id"]}
]

prov={"schema_version":"1.0.0","case":"kn035_case02","generated_utc":NOW,
 "scope":"Single structure only: the imported MMFold_1.cif (object 342604293768192 / work 342604299084800). No other project, task or structure is included.",
 "structure":struct,
 "lineage":lineage,
 "inputs_used":["Imported structure MMFold_1.cif (sha256 "+struct['sha256_original']+")",
                "Native autocompute outputs of task 342604299285504",
                "Native MMetrics output record.json of task 342604577018880",
                "UniProt Q9NZQ7 canonical sequence (external check of chain A identity only)"],
 "inputs_explicitly_not_used":[
   {"item":"PDB 5GRJ","reason":"excluded by case instruction"},
   {"item":"PDB 7XYQ","reason":"excluded by case instruction"},
   {"item":"PDB 5JDS","reason":"excluded by case instruction; it appears only as the top sequence hit inside the native mos-blast output and was not downloaded, superimposed or used as a reference structure"},
   {"item":"structure re-prediction","reason":"excluded by case instruction; no MMFold or other folding run was launched"}],
 "separation_policy":{
   "native_automatic":"Anything produced by task 342604299285504 or 342604577018880 without any action of this session beyond reading and downloading it.",
   "independent_tasks":"None. No MOS task was launched in this session for this case.",
   "local_analysis":"Numbering verification, heavy-atom contact recalculation and the UniProt sequence check. These are in derived/verification/ and never merged into the native outputs."},
 "native_raw_files":{
   "structure_original":"raw/structure/MMFold_1.original.cif",
   "structure_mos_object":"raw/structure/MMFold_1.sanitized.cif",
   "autocompute":"raw/native_task_342604299285504/ (7 downloaded files + task_status.txt + task_payload.json + object_manifest.json + original_objects/)",
   "mmetrics":"raw/native_task_342604577018880/ (record.json + task_status.txt + task_payload.json)"},
 "payload_verbatim_note":"task_payload.json files hold the full StartMOSTask payloads of both native tasks. Values are verbatim from CheckMOSTask output; JSON key order was normalised when re-serialised.",
 "delivery":{"directory":"/workspace/kn035_case02","zip":"/workspace/kn035_case02.zip"}}

# file inventory
inv=[]
for dp,dn,fn in os.walk(ROOT):
    dn[:]=[d for d in sorted(dn) if d not in ("work","__pycache__")]
    for f in sorted(fn):
        p=os.path.join(dp,f)
        inv.append({"path":os.path.relpath(p,ROOT),"bytes":os.path.getsize(p),"sha256":sha(p)})
prov["file_inventory"]=inv
json.dump(prov, open(f"{ROOT}/provenance.json","w"), indent=2)
print("files:",len(inv),"atoms:",n_atoms,"het:",n_het)
