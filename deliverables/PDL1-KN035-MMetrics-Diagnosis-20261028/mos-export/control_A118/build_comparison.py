import json, datetime
C="/workspace/kn035_homolog_diagnosis_20261028/control_A118"
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
ctl=json.load(open(f"{C}/summary.json"))
bq=json.load(open("/workspace/kn035_homolog_diagnosis_20261028/evidence/blast_query_analysis.json"))
rec=json.load(open("/workspace/kn035_homolog_diagnosis_20261028/evidence/raw/record.json"))
comp={
 "schema_version":"1.0.0","generated_utc":NOW,
 "purpose":"Place the control search next to the two native tasks so the evidential weight of the control is explicit.",
 "columns":{
  "control_A_118":{"task_id":"345176768607232","task_name":"diag_PDL1_A118_20261028","task_type":"Sequence Homology Search",
    "status":"succeed","query":"chain A, 118 aa, supplied explicitly as `sequence`",
    "parameters":{"local":True,"max_seq":500},
    "databases":sorted(ctl["by_database"].keys()),
    "n_alignments":ctl["counts"]["n_alignments"],"n_unique_hits":ctl["counts"]["n_unique_hits"],
    "n_fasta_records":ctl["counts"]["n_fasta_records"],
    "top_hit":ctl["top5"][0]["hit_id"],"top_hit_identity":ctl["top5"][0]["identity_percentage"],
    "top_hit_e_value":ctl["top5"][0]["e_value"],"top_hit_query_coverage":ctl["top5"][0]["query_coverage_residues"],
    "n_significant_e_value_below_1e-5":ctl["identity_and_evalue_range"]["n_e_value_below_1e-5"]},
  "native_B_search":{"task_id":"342604299285504","task_name":"autocompute-MMFold_1","task_type":"MOSTask (internal mos-blast)",
    "status":"succeed","query":"chain B, 128 aa (implicit; chosen inside the service)",
    "databases":["pdb"],"n_alignments":bq["alignments"],"n_unique_hits":bq["unique_hits"],
    "n_fasta_records":bq["unique_hits"],
    "top_hit":"pdb|5JDS|B","top_hit_identity":1.0,"top_hit_e_value":2.10588e-92,"top_hit_query_coverage":128,
    "note":"Every hit is an immunoglobulin-family PDB chain; no PD-L1 motif in any hit sequence."},
  "native_mmetrics":{"task_id":"342604577018880","task_name":"mmetrics-analysis-342604299285504","task_type":"MOSTask (MMetrics postprocessing)",
    "status":"succeed","annotations.homology":rec["annotations"]["homology"],
    "annotations.uniprot":rec["annotations"]["uniprot"],"annotations.pdb":rec["annotations"]["pdb"],
    "model_tasks.results":rec["model_tasks"]["results"],
    "note":"Record left untouched by this control; no backfill performed."}},
 "what_the_control_proves":[
  "The 118-aa chain A sequence is a valid query that returns 473 alignments / 457 unique hits, so PD-L1 homologs are abundant in the databases the tool searches.",
  "Even restricted to the PDB database alone (the same database the native B search used), the control returns 239 alignments / 233 unique hits with 63 hits below E=1e-5; the top PDB hit is PD-L1 chain 5JDS_A at identity 1.0 over the full 1-118 query span, E=5.2e-85.",
  "The top UniProt hit is Q9NZQ7.1 at identity 1.0, aligning query residues 2-116 to UniProt 18-132, which independently reproduces the chain-A identity established earlier.",
  "Therefore an empty antigen-homology field cannot be attributed to the biology, to a missing database, or to a threshold that is intrinsically too strict for this antigen."],
 "what_the_control_does_not_prove":[
  "It does not identify which backend step is at fault: query selection/chain routing inside autocompute, ingestion of the search result into MMetrics, the annotations.homology assembly, or a downstream filter are all still unobserved.",
  "It does not prove that the native autocompute search would return these hits if it were given chain A: the control is a different service invocation (Sequence Homology Search vs the internal mos-blast step) and searched a wider database set (PDB + UniProt/Swiss-Prot) than the native run (PDB only).",
  "It does not prove that MMetrics would populate annotations.homology even with an A-chain result in hand; the assembly logic was not read.",
  "It does not test the antigen-versus-antibody chain-role assignment rule; it bypasses it by supplying the sequence explicitly.",
  "Nothing was fixed: record.json for task 342604577018880 still carries homology=[], uniprot=[], pdb=[]. No re-run, no write-back, no annotation change."],
 "caveats":[
  "Database scope differs: control references = ['UniProt','RCSB']; native B search references = ['RCSB']. The PDB-only subset comparison is the like-for-like part.",
  "The control task is an independent, separately launched task; it is not part of the native pipeline and must not be merged into the native MMetrics record.",
  "The control's top PDB hit 5JDS is the KN035/PD-L1 complex entry; it is reported only as a search hit. Per case instruction it is still not used as a reference structure.",
  "The search returns low-quality tail hits (identity down to 0.183, E-value up to 9.85); only the significant head of the list is relevant to this argument."],
 "conclusion":"The control establishes that a chain-A query yields abundant significant PD-L1 homologs, so the native empty homology field is an artefact of the native pipeline's handling of the antigen, not of the antigen's homolog availability. It does not localise the defect to a specific implementation step; that still requires service-side source or logs."}
json.dump(comp, open(f"{C}/comparison.json","w"), indent=2)
print("comparison written")
