import json, csv, re, hashlib, datetime, os
OUT="/workspace/kn035_homolog_diagnosis_20261028"
B="QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS"
A="MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE"

sim=json.load(open("/workspace/downloads/mostask_342604299285504/similarity_results.json"))
data=sim["data"]; gen=sim["general"]
qseqs=set(x["query_sequence_full"] for x in data)
print("alignments:",len(data))
print("unique hit_id:",len(set(x["hit_id"] for x in data)))
print("unique query sequences:",len(qseqs))
print("query == chain B for all:", qseqs=={B})
print("any query length != 128:", sorted({len(q) for q in qseqs}))
print("general.query_sequence == B:", gen["query_sequence"]==B)
print("hit_db:", set(x.get("hit_db") for x in data))
print("references:", gen.get("references"))
print("fields:", sorted(data[0].keys()))
print("e_value range:", min(x["e_value"] for x in data), max(x["e_value"] for x in data))
print("identity range:", min(x["identity_percentage"] for x in data), max(x["identity_percentage"] for x in data))
# top 5
for x in data[:5]:
    print(" top:", x["hit_id"], x["hit_desc"], x["identity_percentage"], x["e_value"])
# does any hit carry PD-L1 sequence
motifs=["AFTVTVPKDLY","NIIQFVHGE","YRCMISYGG","DAGVYRCMIS","QFVHGEEDL"]
hits_with=[m for m in motifs if any(m in (x.get("hit_sequence_full") or "") for x in data)]
print("PD-L1 motifs found in any hit sequence:", hits_with)
# any query equal to A
print("any query == A:", any(q==A for q in qseqs))
# per-hit query ids? check keys that look like query identity
print("sample full record keys/values of one hit:")
print(json.dumps({k:(v[:60] if isinstance(v,str) else v) for k,v in data[0].items()}, indent=1)[:1200])

info=open("/workspace/downloads/mostask_342604299285504/sequence_info.fasta").read()
print("--- sequence_info.fasta ---"); print(info)

rec=json.load(open("/workspace/downloads/mostask_342604577018880/record.json"))
print("record annotations:", {k:len(v) if isinstance(v,list) else type(v).__name__ for k,v in rec["annotations"].items()})
print("model_tasks:", rec["model_tasks"])
print("entities:", [(e["entity_id"],e["chain_id"],e.get("antibody_fragment")) for e in rec["protein_metadata"]["entities"]])

out={"alignments":len(data),"unique_hits":len(set(x["hit_id"] for x in data)),
     "unique_query_sequences":len(qseqs),"query_is_chain_B":qseqs=={B},
     "query_lengths":sorted({len(q) for q in qseqs}),
     "general_query_is_chain_B":gen["query_sequence"]==B,
     "hit_dbs":sorted({x.get("hit_db") for x in data}),"references":gen.get("references"),
     "fields":sorted(data[0].keys()),
     "e_value_range":[min(x["e_value"] for x in data),max(x["e_value"] for x in data)],
     "identity_range":[min(x["identity_percentage"] for x in data),max(x["identity_percentage"] for x in data)],
     "top_hit":{k:data[0][k] for k in ("hit_id","hit_desc","identity_percentage","e_value","hit_len","query_from","query_to","hit_from","hit_to")},
     "pdl1_motifs_found_in_hits":hits_with,"any_query_is_chain_A":any(q==A for q in qseqs),
     "record_annotation_counts":{k:(len(v) if isinstance(v,list) else str(type(v))) for k,v in rec["annotations"].items()},
     "record_model_tasks":rec["model_tasks"],
     "record_entities":[{"entity_id":e["entity_id"],"chain_id":e["chain_id"],"antibody_fragment":e.get("antibody_fragment")} for e in rec["protein_metadata"]["entities"]]}
json.dump(out, open(f"{OUT}/evidence/blast_query_analysis.json","w"), indent=2)
print("saved")
