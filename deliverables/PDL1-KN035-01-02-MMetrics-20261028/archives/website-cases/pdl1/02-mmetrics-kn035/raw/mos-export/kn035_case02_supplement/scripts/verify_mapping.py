import csv, json, re
SUP="/workspace/kn035_case02_supplement"
SEQ="QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRPTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS"
SEQ="QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS"
res={}
for name,key in [("mapping_abnumber_heavy.csv","aa"),("mapping_abnativ_heavy.csv","aa"),("mapping_paragraph_heavy.csv","aa")]:
    rows=list(csv.DictReader(open(f"{SUP}/mapping/{name}")))
    ok_idx=all(int(r["mmfold1_B_label_seq_id"])==i+1 for i,r in enumerate(rows))
    ok_aa=all(r[key]==SEQ[int(r["mmfold1_B_label_seq_id"])-1] for r in rows)
    res[name]={"rows":len(rows),"contiguous_labels":ok_idx,"aa_matches_structure":ok_aa}
rows=list(csv.DictReader(open(f"{SUP}/mapping/mapping_ablang_heavy_scores.csv")))
res["mapping_ablang_heavy_scores.csv"]={"rows":len(rows),
  "all_chain_map_H_to_B":all(r["mmfold1_chain"]=="B" and r["chain_id_in_csv"]=="H" for r in rows),
  "labels_1_to_128":all(1<=int(r["mmfold1_B_label_seq_id"])<=128 for r in rows),
  "all_wildtypes_match":all(r["wt_matches"]=="yes" for r in rows)}
rows=list(csv.DictReader(open(f"{SUP}/mapping/mapping_ablang_per_residue.csv")))
res["mapping_ablang_per_residue.csv"]={"rows":len(rows),"aa_matches_structure":all(r["aa"]==SEQ[i] for i,r in enumerate(rows))}
print(json.dumps(res,indent=1))
json.dump(res, open(f"{SUP}/mapping/mapping_verification.json","w"), indent=2)
assert all(v.get("rows")==128 for k,v in res.items() if k!="mapping_ablang_heavy_scores.csv")
assert all(v.get("aa_matches_structure",True) for v in res.values())
assert res["mapping_ablang_heavy_scores.csv"]["all_wildtypes_match"]
print("ALL MAPPINGS VERIFIED")
