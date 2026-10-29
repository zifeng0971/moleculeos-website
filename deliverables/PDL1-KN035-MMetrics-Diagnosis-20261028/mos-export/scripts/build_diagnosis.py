import json, hashlib, os, datetime
D="/workspace/kn035_homolog_diagnosis_20261028"
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
rec=json.load(open(f"{D}/evidence/raw/record.json"))
bq=json.load(open(f"{D}/evidence/blast_query_analysis.json"))

# ---- record excerpt
excerpt={
 "mmetrics_id":rec["mmetrics_id"],
 "protein_metadata.entities":[{"entity_id":e["entity_id"],"chain_id":e["chain_id"],
    "length":len(e["sequence"]),"antibody_fragment":e.get("antibody_fragment")} for e in rec["protein_metadata"]["entities"]],
 "annotations.homology":rec["annotations"]["homology"],
 "annotations.uniprot":rec["annotations"]["uniprot"],
 "annotations.pdb":rec["annotations"]["pdb"],
 "annotations.features_count":len(rec["annotations"]["features"]),
 "model_tasks":rec["model_tasks"],
 "classification.description":rec["classification"]["description"],
 "classification.reasoning":rec["classification"]["reasoning"],
 "top_level_keys":list(rec.keys()),
 "annotation_keys":list(rec["annotations"].keys())}
json.dump(excerpt, open(f"{D}/evidence/record_annotations_excerpt.json","w"), indent=2)

# ---- timestamps
ts={
 "note":"Raw strings are reproduced exactly as the platform returned them. The platform does not label a timezone on task times; the epoch field is unambiguous and is converted to UTC below.",
 "raw":{
   "autocompute_task_started_string":"2026-10-21 02:20:28",
   "autocompute_task_duration":"1.1min",
   "mmetrics_task_started_string":"2026-10-21 02:21:36",
   "mmetrics_task_duration":"3s",
   "autocompute_object_createTime_epoch":1792549294},
 "derived_utc":{
   "autocompute_object_createTime":"2026-10-21T02:21:34+00:00",
   "implied_autocompute_end":"2026-10-21T02:21:34+00:00 (computed as start + 1.1 min = 02:21:34, matching createTime)",
   "mmetrics_start":"2026-10-21T02:21:36+00:00",
   "gap_seconds_between_autocompute_objects_and_mmetrics_start":2},
 "consistency_check":"Only the UTC interpretation makes the epoch createTime (02:21:34) fall between the autocompute start (02:20:28) and the MMetrics start (02:21:36). The displayed times are therefore consistent with UTC; no other zone was applied or assumed.",
 "local_file_mtimes":{
   "similarity_results.json":"2026-10-21T02:21:59Z (session download time, not a model timestamp)",
   "record.json":"2026-10-21T02:22:02Z (session download time, not a model timestamp)"},
 "recheck_note":"CheckMOSTask was re-run on 2026-10-28; the downloader skipped the existing files (mtimes unchanged at 2026-10-21T02:21:59Z / 02:22:02Z), so the re-check added no files and altered no evidence."}
json.dump(ts, open(f"{D}/evidence/timestamps.json","w"), indent=2)

# ---- diagnosis
diag={
 "schema_version":"1.0.0",
 "case":"kn035 homolog diagnosis",
 "generated_utc":NOW,
 "mode":"read-only diagnosis; no StartMOSTask call, no model re-run, no modification of structure, tasks, annotations or previous archives",
 "scope":{
   "project_id_user_supplied":"342604060136448",
   "project_id_verifiable_with_available_tools":False,
   "project_id_note":"The object/work/TOS identifiers were supplied by the user and match the focused structure; the project id itself is not exposed by any read-only tool available to this session, so it is recorded as user-supplied and not independently verified.",
   "object_id":"342604293768192","work_id":"342604299084800",
   "tos_key":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
   "structure_sha256":"d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317",
   "chains":{"A":"PD-L1 118 aa","B":"KN035 VHH 128 aa"}},
 "proven":[
  {"id":"P1","statement":"The only sequence search present in this pipeline used chain B (128 aa) as its single query.",
   "evidence":f"{bq['alignments']} alignments, {bq['unique_hits']} unique PDB hits, {bq['unique_query_sequences']} unique query sequence; general.query_sequence equals chain B exactly. See evidence/blast_query_analysis.json and evidence/raw/similarity_results.mos-blast.json."},
  {"id":"P2","statement":"Chain A never appears as a query in any available artifact.",
   "evidence":"evidence/raw/sequence_info.fasta contains only 'heavy_sequence' (chain B) and 'light_sequence' = None. No chain-A sequence occurs in the blast output as query_sequence_full. any_query_is_chain_A = false."},
  {"id":"P3","statement":"All 500 hits are PDB immunoglobulin-family chains; none is a PD-L1 sequence.",
   "evidence":"hit_db = {pdb}, reference = RCSB; identity 53.7%-100%, E-value 2.1e-92 to 3.4e-36; top hit pdb|5JDS|B at 100%; targeted search for five PD-L1 motifs in every hit_sequence_full returned zero matches."},
  {"id":"P4","statement":"The native MMetrics record contains empty homology, UniProt and PDB annotation lists and no linked model-task results.",
   "evidence":"record.json: annotations.homology=[], annotations.uniprot=[], annotations.pdb=[], model_tasks.results=[]; annotation keys are exactly ['homology','uniprot','pdb','features']."},
  {"id":"P5","statement":"The MMetrics task had no chain selector, query sequence, database or threshold of its own.",
   "evidence":"task_342604577018880_payload.json has exactly two keys: input_structure and autocomp_results (seven objects from task 342604299285504)."},
  {"id":"P6","statement":"No failed or skipped antigen-search task exists, and no antigen-search task exists at all.",
   "evidence":"evidence/task_board_snapshot.txt: six tasks, all SUCCEED; the only native ones are autocompute-MMFold_1 and mmetrics-analysis-342604299285504."},
  {"id":"P7","statement":"MMetrics consumed exactly the autocompute outputs that were created two seconds before it started.",
   "evidence":"evidence/timestamps.json: object createTime 2026-10-21T02:21:34Z; MMetrics start 2026-10-21T02:21:36Z."}],
 "ruled_out":[
  {"id":"R1","claim":"'The pipeline searched the PD-L1 antigen and found no significant homologs.'",
   "verdict":"not supported by any evidence available here",
   "reason":"No chain-A query exists in any artifact. The statement can be true only if the antigen search happened server-side and left no trace; nothing in the payloads, objects or task board shows it."},
  {"id":"R2","claim":"'The 503 BLAST alignments are PD-L1 homology evidence.'",
   "verdict":"false",
   "reason":"Every alignment has chain B as query and an immunoglobulin-family PDB chain as hit; no PD-L1 motif occurs in any hit sequence. These alignments say nothing about chain A."},
  {"id":"R3","claim":"A task failed or was skipped.",
   "verdict":"false",
   "reason":"All six project tasks are SUCCEED; no failed/skipped/queued entry exists."}],
 "most_likely":[
  {"id":"M1","statement":"Chain routing: the autocompute sequence-search step submits the antibody heavy chain (B) as the BLAST query and never submits the antigen chain (A).",
   "confidence":"high for the observed run (directly evidenced that only B was searched); the routing rule itself is inferred, because the service code is not readable here.",
   "supporting":["sequence_info.fasta assigns B as heavy_sequence and leaves light_sequence empty","the single query in the blast JSON is B","the autocompute payload contains no chain selector, so role assignment happens inside the service"],
   "tension":"The UI wording the user reports ('Searched by antigen sequence similarity') describes an antigen query, which contradicts the executed query set."},
  {"id":"M2","statement":"Because the homology annotation is assembled from antigen-oriented search results, a B-only search leaves annotations.homology empty.",
   "confidence":"medium",
   "supporting":["the UI wording ties the field to the antigen","the field is empty while a large B-chain result set exists","uniprot and pdb annotations are empty at the same time, which points at an annotation stage that produced nothing rather than at a filtering step on one hit list"]},
  {"id":"M3","statement":"Alternative: MMetrics assembles annotations.homology only from non-immunoglobulin hits and/or from model_tasks.results, both of which are empty here.",
   "confidence":"medium; not distinguishable from M2 with available evidence",
   "supporting":["model_tasks.results = [] in the record","all 500 hits are immunoglobulin-family, so any immunoglobulin-depleting filter would return zero","the record's own description says 'no homology or UniProt annotations were available'"]}],
 "missing_evidence":[
  "No source code or configuration for mos-blast, mos-autocomp-analysis or the MMetrics postprocessing is present in this sandbox; the services are remote and only their OpenAPI descriptions were reachable. The exact query-selection and annotations.homology assembly/filter code could not be read.",
  "No task logs, stderr/stdout, or intermediate query manifest are exposed by CheckMOSTask or any other read-only tool.",
  "No record of how chain roles were assigned inside autocompute (antibody vs antigen) is stored anywhere the session can read.",
  "The UI string 'Searched by antigen sequence similarity / No significant homologs found' is user-reported; the session cannot read the UI.",
  "It is unknown whether MMetrics issues its own antigen search independently of autocompute; the payload contains no such parameter, but server-side behaviour cannot be observed.",
  "The project id cannot be verified with available tools."],
 "why_the_null_result_is_suspicious":{
  "statement":"A genuine chain-A query against PDB would be expected to return PD-L1 structures, so an empty antigen-homology field is more consistent with 'the antigen was never queried (or its result was never ingested)' than with 'the antigen was searched and nothing was found'.",
  "status":"domain-knowledge inference only; NOT measured in this session because running the A-chain search would require a new task, which the user forbade.",
  "counterpoint":"The B search itself hit the 500-hit cap (max_seq default 500, exactly 500 unique hits) with a permissive E-value ceiling, so the search configuration is permissive, not restrictive."},
 "sequence_homology_tool":{
  "task_display_name":"Sequence Homology Search",
  "input_schema_file":"tooling/sequence_homology_search_schema.json",
  "can_query_chain_A_explicitly":True,
  "how":["provide sequence = the 118-aa chain A sequence, OR","provide pdb_path = the MMFold_1 TOS key together with chain_id = 'A' (the schema states the chain sequence is extracted and used as query; sequence takes priority if both are given)"],
  "parameters":{"local":{"type":"boolean","default":True,"description":"Local search flag"},
                "max_seq":{"type":"integer","default":500,"description":"Maximum number of hits"},
                "chain_id":"required when pdb_path is provided",
                "pdb_path":"PDB/mmCIF; sequence of chain_id used as query",
                "sequence":"explicit query; takes priority over pdb_path+chain_id",
                "custom_output_path":"framework-resolved output destination"},
  "returned_fields_observed_in_mos_blast_output":["hit_id","hit_name","display_name","hit_desc","hit_db","reference","hit_len","hsp_id","query_sequence_full","query_sequence_aligned","query_sequence_print","hit_sequence_full","hit_sequence_aligned","hit_sequence_print","midline","midline_print","identity","identity_percentage","positive","gaps","score","bit_score","e_value","query_from","query_to","hit_from","hit_to","links.web_link","links.download_link"],
  "summary_block_fields":["query_sequence","score_max","score_min","e_value_max","e_value_min","bit_score_max","bit_score_min","identity_percentage_max","identity_percentage_min","references"],
  "schema_note":"The tool schema declares only inputs. Output fields listed above are those actually observed in the native mos-blast file, whose structure (data[] + general{}) matches this tool's output shape."},
 "next_steps":[
  {"step":1,"action":"Run Sequence Homology Search with sequence = chain A (118 aa), max_seq 500, default local flag, purely as a control.",
   "purpose":"Distinguish 'antigen never queried' from 'antigen queried with no hits'.",
   "requires_user_approval":True,
   "expected_if_routing_bug":">0 PD-L1/PDB hits, proving the null field is a routing/assembly problem",
   "expected_if_true_null":"No hits, which would make the empty field correct and shift the explanation to database/threshold choice"},
  {"step":2,"action":"Report the finding to the MOS platform with task IDs 342604299285504 and 342604577018880, asking for the chain-role assignment log of the autocompute search step.",
   "purpose":"Convert the routing hypothesis into a confirmed root cause.",
   "requires_user_approval":False},
  {"step":3,"action":"If a fix ships, re-run MMetrics on an unchanged copy of the structure and compare annotations.homology before/after.",
   "purpose":"Verify the fix without altering this archived run.",
   "requires_user_approval":True}],
 "files":{}}
inv=[]
for dp,dn,fn in os.walk(D):
    dn[:]=[d for d in sorted(dn) if d!="__pycache__"]
    for f in sorted(fn):
        if f=="diagnosis.json": continue
        p=os.path.join(dp,f)
        inv.append({"path":os.path.relpath(p,D),"bytes":os.path.getsize(p),"sha256":sha(p)})
diag["files"]=inv
json.dump(diag, open(f"{D}/diagnosis.json","w"), indent=2)
print("diagnosis written, files:",len(inv))
