"""Compare every MMFold candidate Fv model with (a) the 1FDL parent Fv and (b) both experimental
1BVL Fv copies; write per-candidate JSON + a summary TSV."""
import json, os, sys, glob, csv
sys.path.insert(0,"analyses")
from fv_compare import compare
CASE="/workspace/website_case_d13"
out=f"{CASE}/analyses/comparisons"; os.makedirs(out,exist_ok=True)
parent=f"{CASE}/structures/parent_1FDL_Fv.pdb"
refs={"1BVL_Fv1":f"{CASE}/structures/ref_1BVL_Fv1.pdb","1BVL_Fv2":f"{CASE}/structures/ref_1BVL_Fv2.pdb"}
rows=[]
for cdir in sorted(glob.glob(f"{CASE}/native_tasks/mmfold/humanization_*")):
    cid=os.path.basename(cdir)
    models=sorted(glob.glob(f"{cdir}/**/*.cif",recursive=True))
    # pick best model by ranking_score if confidences present
    best=None; bestscore=-9
    for m in models:
        base=os.path.dirname(m)
        cand_conf=glob.glob(f"{base}/summary_confidences_*.json")
        score=None
        for c in cand_conf:
            try:
                d=json.load(open(c)); score=max(score or -9, d.get("ranking_score",d.get("ptm",0)))
            except Exception: pass
        if score is None: score=0
        if score>bestscore: bestscore=score; best=m
    if not best:
        rows.append({"candidate":cid,"status":"no_model"}); continue
    cmp_parent=compare(parent,best,f"{cid}_vs_parent")
    res={"candidate":cid,"model_used":best,"n_models":len(models),"selection":"highest summary_confidences ranking_score" ,
         "vs_parent":cmp_parent}
    for rn,rp in refs.items():
        res[f"vs_{rn}"]=compare(rp,best,f"{cid}_vs_{rn}")
    json.dump(res,open(f"{out}/{cid}.json","w"),indent=1)
    g=cmp_parent["global_fit"]; f=cmp_parent["framework_fit"]
    row={"candidate":cid,"n_models":len(models),
         "parent_global_ca_rmsd":g["ca_rmsd"],"parent_global_n":g["n_ca_atoms"],
         "parent_FR_fit_ca_rmsd":f["ca_rmsd"],
         "parent_H3_local_rmsd":f["cdr"].get("VH_CDR3",{}).get("local_fit_ca_rmsd"),
         "parent_L3_local_rmsd":f["cdr"].get("VL_CDR3",{}).get("local_fit_ca_rmsd"),
         "parent_n_seq_diff":cmp_parent["sequence_differences"]["count"]}
    for rn in refs:
        rr=res[f"vs_{rn}"]
        if "global_fit" in rr:
            row[f"{rn}_global_ca_rmsd"]=rr["global_fit"]["ca_rmsd"]
            row[f"{rn}_FR_fit_ca_rmsd"]=rr["framework_fit"]["ca_rmsd"]
            row[f"{rn}_n_seq_diff"]=rr["sequence_differences"]["count"]
    rows.append(row)
with open(f"{CASE}/analyses/comparison_summary.tsv","w",newline="") as fh:
    w=csv.DictWriter(fh,delimiter="\t",fieldnames=sorted({k for r in rows for k in r})); w.writeheader(); w.writerows(rows)
print(json.dumps(rows,indent=1))
