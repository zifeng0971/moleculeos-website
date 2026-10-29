import json, os, hashlib, datetime, collections
C="/workspace/kn035_homolog_diagnosis_20261028/control_A118"
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
SEQ="MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE"
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")

json.dump({"sequence":SEQ,"local":True,"max_seq":500}, open(f"{C}/task_payload_actual.json","w"), indent=2)
open(f"{C}/task_status.txt","w").write("""CheckMOSTask(345176768607232) — captured 2026-10-28T08:48Z

[SUCCEED] diag_PDL1_A118_20261028
Type:     Sequence Homology Search
Task ID:  345176768607232
Started:  2026-10-28 08:47:52
Duration: 3s

Input parameters (verbatim):
{
  "sequence": "MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE",
  "local": true,
  "max_seq": 500
}

Downloaded 2 file(s):
  all_sequences.fasta
  similarity_results.json

Time semantics: the platform printed no timezone suffix. The session clock at launch read
2026-10-28T08:47:5xZ, so the displayed start time is consistent with UTC. Original strings are
preserved above exactly as returned.
""")

d=json.load(open(f"{C}/raw/similarity_results.json"))
data=d["data"]; gen=d["general"]
by_db={}
for db in sorted({x["hit_db"] for x in data}):
    sub=[x for x in data if x["hit_db"]==db]
    by_db[db]={"n_alignments":len(sub),"n_unique_hits":len({x["hit_id"] for x in sub}),
               "identity_percentage_max":max(x["identity_percentage"] for x in sub),
               "e_value_min":min(x["e_value"] for x in sub),
               "n_e_value_below_1e-5":sum(1 for x in sub if x["e_value"]<1e-5)}
fa=[r for r in open(f"{C}/raw/all_sequences.fasta").read().split(">") if r.strip()]
top5=[]
for x in data[:5]:
    top5.append({"hit_id":x["hit_id"],"hit_name":x["hit_name"],"hit_db":x["hit_db"],"reference":x["reference"],
      "description":x["hit_desc"],"hit_len":x["hit_len"],"hsp_id":x["hsp_id"],
      "identity_count":x["identity"],"identity_percentage":x["identity_percentage"],
      "identity_scale":"fraction 0-1 as returned by the tool (not percent 0-100)",
      "e_value":x["e_value"],"bit_score":x["bit_score"],"score":x["score"],
      "query_from":x["query_from"],"query_to":x["query_to"],
      "query_coverage_residues":x["query_to"]-x["query_from"]+1,
      "query_coverage_fraction":round((x["query_to"]-x["query_from"]+1)/len(SEQ),4),
      "hit_from":x["hit_from"],"hit_to":x["hit_to"],"links":x["links"]})
summary={
 "task":{"task_id":"345176768607232","task_name":"diag_PDL1_A118_20261028","task_type":"Sequence Homology Search",
         "status":"succeed","started_raw":"2026-10-28 08:47:52","duration":"3s"},
 "query":{"sequence":SEQ,"length":len(SEQ),"source":"chain A of MMFold_1, provided explicitly as `sequence`"},
 "query_verification":{
   "general_query_sequence_equals_input":gen["query_sequence"]==SEQ,
   "general_query_length":len(gen["query_sequence"]),
   "unique_query_sequences_in_alignments":len({x["query_sequence_full"] for x in data}),
   "every_alignment_query_equals_input":all(x["query_sequence_full"]==SEQ for x in data),
   "any_alignment_query_equals_chain_B":any(x["query_sequence_full"].startswith("QVQLQESGGG") for x in data)},
 "counts":{"n_alignments":len(data),"n_unique_hits":len({x["hit_id"] for x in data}),
           "n_fasta_records":len(fa),"n_unique_fasta_ids":len({r.split(chr(10),1)[0] for r in fa}),
           "n_hits_with_multiple_hsps":sum(1 for k,v in collections.Counter(x["hit_id"] for x in data).items() if v>1)},
 "by_database":by_db,
 "hit_db_meaning":{"pdb":"RCSB PDB chains","sp":"UniProtKB/Swiss-Prot entries (reference 'UniProt')"},
 "identity_and_evalue_range":{"identity_percentage_min":min(x["identity_percentage"] for x in data),
           "identity_percentage_max":max(x["identity_percentage"] for x in data),
           "e_value_min":min(x["e_value"] for x in data),"e_value_max":max(x["e_value"] for x in data),
           "n_e_value_below_1e-5":sum(1 for x in data if x["e_value"]<1e-5),
           "n_e_value_below_1e-3":sum(1 for x in data if x["e_value"]<1e-3)},
 "top5":top5,
 "uniprot_top_hit_note":"sp|Q9NZQ7.1 aligns query residues 2-116 to UniProt positions 18-132 (115/115 identical). Query residue 1 (Met) and residues 117-118 (LE) are unaligned, which reproduces the earlier independent sequence check of chain A.",
 "generated_utc":NOW,
 "raw_files":{"similarity_results.json":sha(f"{C}/raw/similarity_results.json"),
              "all_sequences.fasta":sha(f"{C}/raw/all_sequences.fasta")}}
json.dump(summary, open(f"{C}/summary.json","w"), indent=2)
print(json.dumps({k:summary[k] for k in ("counts","by_database","identity_and_evalue_range")}, indent=1))
