import csv, json, os, hashlib, datetime, re, shutil
SUP="/workspace/kn035_case02_supplement"
DL="/workspace/downloads"
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
SEQ="QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS"

TASKS=[
 {"slug":"aban_342606092895232","task_type":"Antibody Region Annotation","task_id":"342606092895232",
  "task_name":"kn035-AbAn-independent","started":"2026-10-21T02:27:46Z","duration":"20s",
  "src":f"{DL}/antibody_region_annotation_342606092895232","csv":"abnumber_heavy.csv",
  "payload":{"schemes":["imgt","kabat","chothia"],"heavy_sequence":SEQ,"light_sequence":None},
  "schema":{"type":"object","title":"Input","properties":{
      "schemes":{"type":"array","items":{"type":"string"},"title":"Schemes","default":["imgt","kabat","chothia"],"description":"List of the numbering schemes to use."},
      "heavy_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Heavy Sequence","default":None,"description":"Heavy sequence"},
      "light_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Light Sequence","default":None,"description":"Light sequence"},
      "custom_output_path":{"type":"string","title":"Custom Output Path","default":"","description":"Resolved output destination. Set by framework."}}},
  "status_line":"SUCCEED | Antibody Region Annotation | Task ID 342606092895232 | Started 2026-10-21 02:27:46 | Duration 20s"},
 {"slug":"abscn_language_342606094599168","task_type":"Antibody Language Scoring","task_id":"342606094599168",
  "task_name":"kn035-AbScN-language-independent","started":"2026-10-21T02:27:46Z","duration":"3s",
  "src":f"{DL}/antibody_language_scoring_342606094599168","csv":"ablang_heavy_scores.csv",
  "payload":{"heavy_sequence":SEQ,"light_sequence":None,"heavy_sequence_id":"H","light_sequence_id":"L"},
  "schema":{"type":"object","title":"Input","properties":{
      "heavy_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Heavy Sequence","default":None,"description":"Input heavy-chain sequence"},
      "light_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Light Sequence","default":None,"description":"Input light-chain sequence"},
      "heavy_sequence_id":{"type":"string","title":"Heavy Sequence Id","default":"H","description":"Heavy-chain identifier"},
      "light_sequence_id":{"type":"string","title":"Light Sequence Id","default":"L","description":"Light-chain identifier"},
      "custom_output_path":{"type":"string","title":"Custom Output Path","default":"","description":"Resolved output destination. Set by framework."}}},
  "status_line":"SUCCEED | Antibody Language Scoring | Task ID 342606094599168 | Started 2026-10-21 02:27:46 | Duration 3s"},
 {"slug":"abscn_nativeness_342606097245184","task_type":"Antibody Nativeness Evaluation","task_id":"342606097245184",
  "task_name":"kn035-AbScN-nativeness-independent","started":"2026-10-21T02:27:47Z","duration":"3s",
  "src":f"{DL}/antibody_nativeness_evaluation_342606097245184","csv":"abnativ_heavy.csv",
  "payload":{"heavy_sequence":SEQ,"light_sequence":None},
  "schema":{"type":"object","title":"Input","properties":{
      "fasta_file":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Fasta File","default":None,"description":"FASTA path or TOS URI. Sequences can be 'H:L' or just 'H'."},
      "heavy_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Heavy Sequence","default":None,"description":"Heavy sequence"},
      "light_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Light Sequence","default":None,"description":"Light sequence"},
      "custom_output_path":{"type":"string","title":"Custom Output Path","default":"","description":"Resolved output destination. Set by framework."}}},
  "status_line":"SUCCEED | Antibody Nativeness Evaluation | Task ID 342606097245184 | Started 2026-10-21 02:27:47 | Duration 3s"},
 {"slug":"paradt_342606100722688","task_type":"Paratope Identification","task_id":"342606100722688",
  "task_name":"kn035-ParaDt-independent","started":"2026-10-21T02:27:48Z","duration":"25s",
  "src":f"{DL}/paratope_identification_342606100722688","csv":"paragraph_heavy.csv",
  "payload":{"pdb_path":"tos:mosv2-prod/user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
             "heavy_sequence":SEQ,"light_sequence":None,"is_pdb_numbered":False,"pdb_heavy_chain":"B","pdb_light_chain":"L"},
  "submitted_pdb_path":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
  "schema":{"type":"object","title":"Input","required":["pdb_path"],"properties":{
      "pdb_path":{"type":"string","title":"Pdb Path","description":"Structure path for the antibody, in PDB (.pdb) or mmCIF (.cif/.mmcif) format"},
      "heavy_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Heavy Sequence","default":None,"description":"Heavy sequence"},
      "light_sequence":{"anyOf":[{"type":"string"},{"type":"null"}],"title":"Light Sequence","default":None,"description":"Light sequence"},
      "is_pdb_numbered":{"type":"boolean","title":"Is Pdb Numbered","default":False,"description":"Is the PDB file already IMGT numbered?"},
      "pdb_heavy_chain":{"type":"string","title":"Pdb Heavy Chain","default":"H","description":"PDB chain identifier of the heavy chain"},
      "pdb_light_chain":{"type":"string","title":"Pdb Light Chain","default":"L","description":"PDB chain identifier of the light chain"},
      "custom_output_path":{"type":"string","title":"Custom Output Path","default":"","description":"Resolved output destination. Set by framework."}}},
  "status_line":"SUCCEED | Paratope Identification | Task ID 342606100722688 | Started 2026-10-21 02:27:48 | Duration 25s"},
]

# --- copy task artifacts
for t in TASKS:
    d=os.path.join(SUP,"tasks",t["slug"]); os.makedirs(d,exist_ok=True)
    shutil.copy(os.path.join(t["src"],t["csv"]), os.path.join(d,t["csv"]))
    json.dump(t["payload"], open(os.path.join(d,"task_payload_actual.json"),"w"), indent=2)
    json.dump(t["schema"], open(os.path.join(d,"input_schema.json"),"w"), indent=2)
    open(os.path.join(d,"task_status.txt"),"w").write(
        f"{t['status_line']}\n\nTask name: {t['task_name']}\nTask type: {t['task_type']}\n"
        f"Result: 1 output file, {t['csv']}\n"
        "Captured from CheckMOSTask on 2026-10-21 after the task reached SUCCEED.\n"
        "INDEPENDENT TASK - not part of the native MMetrics analysis of MMFold_1.\n")
    t["csv_sha256"]=sha(os.path.join(d,t["csv"]))
    t["csv_bytes"]=os.path.getsize(os.path.join(d,t["csv"]))

# --- mappings
M=os.path.join(SUP,"mapping"); os.makedirs(M,exist_ok=True)
def rows_of(t): return list(csv.DictReader(open(os.path.join(SUP,"tasks",t["slug"],t["csv"]))))
summ=[]
# AbAn
t=TASKS[0]; rows=rows_of(t)
with open(f"{M}/mapping_abnumber_heavy.csv","w",newline="") as fh:
    w=csv.writer(fh); w.writerow(["mmfold1_B_label_seq_id","aa_index_in_csv","aa","pos_imgt","region_imgt","pos_kabat","region_kabat","pos_chothia","region_chothia"])
    for r in rows: w.writerow([r["aa_index"],r["aa_index"],r["aa"],r["pos_imgt"],r["region_imgt"],r["pos_kabat"],r["region_kabat"],r["pos_chothia"],r["region_chothia"]])
summ.append({"csv":"abnumber_heavy.csv","task_id":t["task_id"],"n_rows":len(rows),
  "row_key":"aa_index (1..128, sequential)","maps_to":"MMFold_1 chain B label_seq_id 1..128, identity",
  "scheme_columns":{"pos_imgt":"IMGT position with insertion codes and IMGT gaps (H9->H11, H30->H35, H59->H62, H72->H74); odd descending block H112D,H112C,H112B,H112A at label_seq_id 108-111 as emitted by the tool",
                     "pos_kabat":"Kabat position with insertions H52A, H82A-C, H100A-K",
                     "pos_chothia":"Chothia position with insertions H52A, H82A-C, H100A-K"},
  "mapping_file":"mapping/mapping_abnumber_heavy.csv"})
# AbNativ
t=TASKS[2]; rows=rows_of(t)
with open(f"{M}/mapping_abnativ_heavy.csv","w",newline="") as fh:
    w=csv.writer(fh); w.writerow(["mmfold1_B_label_seq_id","aa_index_in_csv","aa","humanness_VH2_score","sequence_humanness_VH2_score","humanness_VHH2_score","sequence_humanness_VHH2_score"])
    for r in rows: w.writerow([r["aa_index"],r["aa_index"],r["aa"],r["humanness_VH2_score"],r["sequence_humanness_VH2_score"],r["humanness_VHH2_score"],r["sequence_humanness_VHH2_score"]])
summ.append({"csv":"abnativ_heavy.csv","task_id":t["task_id"],"n_rows":len(rows),
  "row_key":"aa_index (1..128, sequential)","maps_to":"MMFold_1 chain B label_seq_id 1..128, identity",
  "mapping_file":"mapping/mapping_abnativ_heavy.csv",
  "score_columns":{"humanness_VH2_score":"per-residue","sequence_humanness_VH2_score":"whole-sequence constant",
                   "humanness_VHH2_score":"per-residue","sequence_humanness_VHH2_score":"whole-sequence constant"}})
# ParaDt
t=TASKS[3]; rows=rows_of(t)
with open(f"{M}/mapping_paragraph_heavy.csv","w",newline="") as fh:
    w=csv.writer(fh); w.writerow(["mmfold1_B_label_seq_id","aa_index_in_csv","aa","pos_imgt","region_imgt","paragraph_score"])
    for r in rows: w.writerow([r["aa_index"],r["aa_index"],r["aa"],r["pos_imgt"],r["region_imgt"],r["paragraph_score"]])
summ.append({"csv":"paragraph_heavy.csv","task_id":t["task_id"],"n_rows":len(rows),
  "row_key":"aa_index (1..128, sequential)","maps_to":"MMFold_1 chain B label_seq_id 1..128, identity",
  "mapping_file":"mapping/mapping_paragraph_heavy.csv"})
# AbLang (mutation level + per residue)
t=TASKS[1]; rows=rows_of(t)
mism=0
with open(f"{M}/mapping_ablang_heavy_scores.csv","w",newline="") as fh:
    w=csv.writer(fh); w.writerow(["mutation","chain_id_in_csv","mmfold1_chain","mmfold1_B_label_seq_id","wt_in_mutation","wt_in_structure","wt_matches","mut","score"])
    for r in rows:
        m=re.match(r"^([ACDEFGHIKLMNPQRSTVWY])(\d+)([ACDEFGHIKLMNPQRSTVWY])$", r["mutation"])
        idx=int(m.group(2)); wtr=m.group(1); ok=(wtr==SEQ[idx-1])
        if not ok: mism+=1
        w.writerow([r["mutation"],r["chain"],"B",idx,wtr,SEQ[idx-1],"yes" if ok else "no",m.group(3),r["score"]])
per={}
for r in rows:
    m=re.match(r"^([ACDEFGHIKLMNPQRSTVWY])(\d+)([ACDEFGHIKLMNPQRSTVWY])$", r["mutation"]); per.setdefault(int(m.group(2)),[]).append(float(r["score"]))
with open(f"{M}/mapping_ablang_per_residue.csv","w",newline="") as fh:
    w=csv.writer(fh); w.writerow(["mmfold1_B_label_seq_id","aa","n_substitutions_scored","score_min","score_max","score_mean"])
    for i in range(1,129):
        v=per[i]; w.writerow([i,SEQ[i-1],len(v),round(min(v),6),round(max(v),6),round(sum(v)/len(v),6)])
summ.append({"csv":"ablang_heavy_scores.csv","task_id":t["task_id"],"n_rows":len(rows),
  "row_key":"mutation string '{wt}{aa_index}{mut}', e.g. Q1A","chain_column_value":"H",
  "maps_to":"MMFold_1 chain B label_seq_id = aa_index parsed from the mutation string; chain 'H' -> chain 'B'",
  "n_positions":len(per),"n_substitutions_per_position":sorted({len(v) for v in per.values()}),
  "wildtype_mismatches_against_structure_sequence":mism,
  "mapping_file":"mapping/mapping_ablang_heavy_scores.csv",
  "per_residue_summary_file":"mapping/mapping_ablang_per_residue.csv"})

json.dump({"generated_utc":NOW,
 "chain":"MMFold_1 chain B (KN035 VHH), label_seq_id 1..128",
 "principle":"Every independent CSV indexes residues either by aa_index (1..128 sequential) or, for AbLang, by the number embedded in the mutation string. Both coincide with MMFold_1 chain B label_seq_id because chain B is fully modelled, starts at label_seq_id 1 and has no insertion codes.",
 "sequence_in_all_csvs_equals_chain_B":True,
 "per_csv":summ}, open(f"{M}/mapping_summary.json","w"), indent=2)

# --- comparison ParaDt vs native paratope
rec=json.load(open("/workspace/kn035_case02/raw/native_task_342604577018880/record.json"))
native=[f for f in rec["annotations"]["features"] if f["annotation_type"]=="paratope"][0]["loc"]
rows=rows_of(TASKS[3])
sc=sorted([(float(r["paragraph_score"]),int(r["aa_index"]),r["aa"]) for r in rows],reverse=True)
for k in (18,24,32):
    top={x[1] for x in sc[:k]}
    pass
comp={"disclaimer":"This comparison is provided for orientation only. paragraph_heavy.csv is an INDEPENDENT Paratope Identification task, not the native MMetrics paratope and not a replacement for it.",
 "native_paratope":{"source":"raw record.json annotations.features[annotation_type=paratope]","n":len(native),"residues":native},
 "independent_paradt":{"source":"tasks/paradt_342606100722688/paragraph_heavy.csv","n_residues_with_score_gt_0":sum(1 for x in sc if x[0]>0),
   "score_range":[min(x[0] for x in sc),max(x[0] for x in sc)],
   "top18":{"residues":sorted(x[1] for x in sc[:18]),"overlap_with_native":len({x[1] for x in sc[:18]}&set(native))},
   "top24":{"residues":sorted(x[1] for x in sc[:24]),"overlap_with_native":len({x[1] for x in sc[:24]}&set(native))},
   "top_residues":[{ "label_seq_id":x[1],"aa":x[2],"score":round(x[0],4)} for x in sc[:20]]},
 "note":"Both lists concentrate on CDR3; the independent model additionally scores several framework/CDR2 positions and misses the N-terminal CDR1 residues that the native structure-based paratope calls."}
json.dump(comp, open(os.path.join(SUP,"comparison","paradt_vs_native_paratope.json"),"w"), indent=2)

# --- manifest
man={"schema_version":"1.0.0","case":"kn035_case02 supplement","generated_utc":NOW,
 "purpose":"Independent antibody CSV outputs requested to complement the native MMetrics archive. They are NOT native MMetrics files and do not replace anything in /workspace/kn035_case02.",
 "input":{"chain":"MMFold_1 chain B (KN035 VHH)","length":128,"sequence":SEQ,
          "sequence_source":"sequence-toolkit record MMFold_1_B, derived from /workspace/protein_data/protein_342604299084800/MMFold_1.cif",
          "structure_object_id":"342604293768192","structure_work_id":"342604299084800",
          "structure_tos_key":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif"},
 "separation":{"native_archive":"/workspace/kn035_case02 (unchanged)","independent_tasks":"all four tasks below are independent runs launched in this session","native_files_reused":"none"},
 "tasks":[{"slug":t["slug"],"task_type":t["task_type"],"task_id":t["task_id"],"task_name":t["task_name"],
           "status":"succeed","started":t["started"],"duration":t["duration"],"csv":t["csv"],
           "csv_sha256":t["csv_sha256"],"csv_bytes":t["csv_bytes"],
           "dir":f"tasks/{t['slug']}","payload":t["payload"],
           **({"submitted_pdb_path":t["submitted_pdb_path"],"effective_pdb_path":t["payload"]["pdb_path"]} if t["slug"].startswith("paradt") else {})} for t in TASKS],
 "abscn_note":"The requested AbScN corresponds to two distinct MOS task types. Both were run and are kept apart: 'Antibody Language Scoring' (AbLang, mutation-level scores) and 'Antibody Nativeness Evaluation' (AbNatiV, humanness scores). Neither is the native MMetrics output.",
 "unavailable":[],
 "all_requested_delivered":True}
json.dump(man, open(os.path.join(SUP,"supplement-manifest.json"),"w"), indent=2)
print("built")
