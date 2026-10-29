import json, hashlib, os, datetime
ROOT="/workspace/kn035_case02"
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
REC=json.load(open(f"{ROOT}/raw/native_task_342604577018880/record.json"))
OBJ=json.load(open(f"{ROOT}/raw/native_task_342604299285504/object_manifest.json"))

auto_files=["affinity_scores.csv","all_sequences.fasta","evolutionary_scores.csv","sequence_info.fasta",
            "sequence_scores.csv","similarity_results.json","struct_fitness_scores.csv"]
auto_outs=[{"file":f"raw/native_task_342604299285504/{f}","bytes":os.path.getsize(f"{ROOT}/raw/native_task_342604299285504/{f}"),
            "sha256":sha(f"{ROOT}/raw/native_task_342604299285504/{f}")} for f in auto_files]

ledger={
 "schema_version":"1.0.0","case":"kn035_case02","generated_utc":NOW,
 "object":{"object_id":"342604293768192","work_id":"342604299084800",
           "tos_key":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif","display_name":"MMFold_1.cif"},
 "native_tasks":[
  {"task_id":"342604299285504","task_name":"autocompute-MMFold_1","task_type":"MOSTask","status":"succeed",
   "role":"native automatic pre-analysis, created by the platform when the structure was imported (before MMetrics)",
   "started":"2026-10-21T02:20:28Z","duration":"1.1min",
   "payload_file":"raw/native_task_342604299285504/task_payload.json",
   "payload_summary":"structure_path = user_objects/123/330665428816896/342604293768192_MMFold_1.cif (fileId 342604293768192)",
   "status_file":"raw/native_task_342604299285504/task_status.txt",
   "outputs":auto_outs,
   "output_objects":OBJ["objects"],
   "note":"The seven objects produced here are the direct inputs of the MMetrics task. Their platform download names differ from the model output names; object_manifest.json proves the rename by sha256."},
  {"task_id":"342604577018880","task_name":"mmetrics-analysis-342604299285504","task_type":"MOSTask","status":"succeed",
   "role":"native automatic MMetrics analysis of this structure",
   "started":"2026-10-21T02:21:36Z","duration":"3s","mmetrics_id":REC["mmetrics_id"],
   "payload_file":"raw/native_task_342604577018880/task_payload.json",
   "payload_summary":"input_structure = user_objects/123/330665428816896/342604293768192_MMFold_1.cif; autocomp_results = 7 objects of task 342604299285504",
   "status_file":"raw/native_task_342604577018880/task_status.txt",
   "outputs":[{"file":"raw/native_task_342604577018880/record.json",
               "bytes":os.path.getsize(f"{ROOT}/raw/native_task_342604577018880/record.json"),
               "sha256":sha(f"{ROOT}/raw/native_task_342604577018880/record.json")}],
   "note":"record.json is the only artifact this task emitted. Everything in derived/mmetrics/ is an extraction from it, not an additional computation."}],
 "independent_tasks_run":[],
 "independent_task_statement":"No MOS task was launched in this session for this case. Nothing in this package is a substitute for an independent run.",
 "local_analyses":[
  {"name":"structure and numbering verification","script":"scripts/build_numbering.py","output":"numbering-map.json",
   "what":"gemmi parse of the MOS object: chain IDs, entities, label/auth numbering, insertion codes, altlocs, _mos_mapping loop, sequence cross-checks against _entity_poly, _entity_poly_seq and record.json",
   "type":"local analysis"},
  {"name":"interface contact recalculation","script":"scripts/verify_contacts.py","output":"derived/verification/contact_crosscheck.json",
   "what":"all heavy-atom distances between chain A and chain B; recurrence of the 44 native interaction pairs; count of residue pairs <= 5 A","type":"local analysis"},
  {"name":"chain identity check against UniProt","script":"sequence-toolkit fetch-uniprot Q9NZQ7","output":"derived/verification/sequence_identity.json",
   "what":"exact substring match of chain A against the human PD-L1 canonical sequence; reading of the native mos-blast top hit for chain B","type":"local analysis"}],
 "artifact_matrix":[
  {"artifact":"chain IDs, full sequences, label/auth numbering","native_status":"present","location":["numbering-map.json","provenance.json"],"note":"read from the structure itself"},
  {"artifact":"Description / reasoning / entity roles","native_status":"present","location":["derived/mmetrics/description.json"],"note":"record.json classification block, verbatim"},
  {"artifact":"Homologs","native_status":"present but empty","location":["derived/mmetrics/homologs.json"],"note":"annotations.homology = [] in the native record; preserved as an empty result. The separate native mos-blast run on the VHH is archived under raw/native_task_342604299285504/ and is not the same field."},
  {"artifact":"Paratope","native_status":"present","location":["derived/mmetrics/paratope.json"],"note":"18 residues, chain B"},
  {"artifact":"Epitope","native_status":"present","location":["derived/mmetrics/epitope.json"],"note":"19 residues, chain A"},
  {"artifact":"Domain","native_status":"absent","location":["derived/mmetrics/domain.json"],"note":"no domain field in the native record"},
  {"artifact":"PTM","native_status":"absent","location":["derived/mmetrics/ptm.json"],"note":"no PTM field in the native record"},
  {"artifact":"UniProt","native_status":"present but empty","location":["derived/mmetrics/uniprot.json"],"note":"annotations.uniprot = [] even though chain A is PD-L1"},
  {"artifact":"PDB cross-reference","native_status":"present but empty","location":["derived/mmetrics/pdb.json"],"note":"annotations.pdb = []"},
  {"artifact":"Interaction Network","native_status":"present","location":["derived/mmetrics/interaction_network.json"],"note":"44 typed interactions with distances plus 2D plot residue lists"},
  {"artifact":"CDR annotation (AbAn-equivalent)","native_status":"present as ranges only","location":["derived/mmetrics/cdr_annotations.json"],"note":"IMGT/Kabat/Chothia CDR ranges in sequential numbering; no numbering-position table, no CSV"},
  {"artifact":"MutX CSVs","native_status":"present","location":["raw/native_task_342604299285504/*.csv","derived/mutx/mutx_manifest.json"],"note":"4 tables: mos-score-esm, mos-score-ligandmpnn, mos-score-msat, mos-diffaffinity"},
  {"artifact":"AbAn heavy CSV","native_status":"absent","location":["derived/antibody/aban_abscn_paradt_status.json"],"note":"not emitted by the native task; no independent run"},
  {"artifact":"AbScN heavy CSV","native_status":"absent","location":["derived/antibody/aban_abscn_paradt_status.json"],"note":"not emitted by the native task; no independent run"},
  {"artifact":"ParaDt heavy CSV","native_status":"absent","location":["derived/antibody/aban_abscn_paradt_status.json"],"note":"native paratope exists only as a residue list, not as a CSV; no independent run"},
  {"artifact":"compact numbering mapping","native_status":"present (derived)","location":["derived/mutx/affinity_compact_numbering.csv","derived/mutx/mutx_manifest.json"],"note":"decoded from the native diffaffinity mutstr column; MMfold1 numbering is identical to MOS numbering"}],
 "overall_status":{"native_mmetrics_task":"succeed","anything_still_computing":False,
   "requested_but_unavailable":["Domain","PTM","AbAn heavy CSV","AbScN heavy CSV","ParaDt heavy CSV"]}}
json.dump(ledger, open(f"{ROOT}/task-ledger.json","w"), indent=2)
print("ledger ok")
