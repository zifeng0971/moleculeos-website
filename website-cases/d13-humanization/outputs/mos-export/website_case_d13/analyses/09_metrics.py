"""Assemble per-candidate metrics: humanization scores, sequence changes by region,
structural deviation from the 1FDL parent, paratope displacement, and 1BVL reference comparison."""
import json, csv, glob, os, sys, numpy as np
sys.path.insert(0,"analyses")
from fv_compare import compare
CASE="/workspace/website_case_d13"
# paratope keys from the measured interface (freesasa dSASA > 0.5 A^2, V domains only)
iface=json.load(open(f"{CASE}/analyses/interface_residues_1FDL.json"))
paratope=[(("VH" if r["chain_label"]=="B" else "VL"), r["imgt_position"], r["chain_label"]+str(r["res_num"]), round(r["dSASA_A2"],1))
          for r in iface if r["chain_label"] in ("A","B") and r["dSASA_A2"]>0.5]
scores={r["id"]:r for r in csv.DictReader(open(f"{CASE}/native_tasks/humanization/final_ranked_summary.csv"))}
out={"paratope_residues_used":[{"role":p[0],"imgt_position":p[1],"parent_label_residue":p[2],"dSASA_A2":p[3]} for p in paratope]}
rows=[]
for cdir in sorted(glob.glob(f"{CASE}/native_tasks/mmfold/humanization_*")):
    cid=os.path.basename(cdir)
    man=json.load(open(f"{cdir}/manifest.json"))
    best=[s for s in man["samples"] if s["sample"]==man["best_sample"]][0]
    model=f"{cdir}/{best['file']}"
    cmp_par=compare(f"{CASE}/structures/parent_1FDL_Fv.pdb", model, f"{cid}_vs_parent")
    pr={ (r["role"],r["imgt_position"]):r for r in cmp_par["per_residue"]}
    pd_=[pr[(k[0],k[1])]["displacement_under_global_fit"] for k in paratope if (k[0],k[1]) in pr]
    seqdiff=cmp_par["sequence_differences"]["substitutions"]
    byreg={}
    for s in seqdiff:
        key=f"{s['role']}_{s['region']}"; byreg[key]=byreg.get(key,0)+1
    cdr_changes={k.split("_",1)[1]:v for k,v in byreg.items() if k.split("_",1)[1].startswith("CDR")}
    sc=scores.get(cid,{})
    row={"candidate":cid,
         "mmfold_best_sample":man["best_sample"],"plddt":round(best["plddt"],2),"ptm":round(best["ptm"],3),
         "iptm":round(best["iptm"],3),"ranking_score":round(best["ranking_score"],3),
         "oasis_identity_pct":round(100*float(sc.get("oasis_identity",0)),1),
         "oasis_percentile_pct":round(100*float(sc.get("oasis_percentile",0)),1),
         "abnativ_heavy":round(float(sc.get("abnativ_heavy_score",0)),3),
         "abnativ_light":round(float(sc.get("abnativ_light_score",0)),3),
         "score_global":round(float(sc.get("score_global",0)),4),
         "total_seq_changes_vs_parent":len(seqdiff),
         "n_FR_changes":sum(v for k,v in byreg.items() if "FR" in k),
         "n_CDR_changes":sum(cdr_changes.values()),
         "parent_global_ca_rmsd":cmp_par["global_fit"]["ca_rmsd"],
         "parent_FR_fit_ca_rmsd":cmp_par["framework_fit"]["ca_rmsd"],
         "paratope_mean_displacement_after_global_fit":round(float(np.mean(pd_)),3) if pd_ else None,
         "paratope_max_displacement_after_global_fit":round(float(np.max(pd_)),3) if pd_ else None,
         "paratope_n":len(pd_)}
    for reg in ["VH_CDR1","VH_CDR2","VH_CDR3","VL_CDR1","VL_CDR2","VL_CDR3"]:
        c=cmp_par["framework_fit"]["cdr"].get(reg)
        row[f"{reg}_local_rmsd"]=c["local_fit_ca_rmsd"] if c else None
        row[f"{reg}_shift_after_FR_fit"]=c["displacement_after_FR_fit_mean"] if c else None
    rows.append(row)
out["candidates"]=rows
json.dump(out,open(f"{CASE}/analyses/candidate_metrics.json","w"),indent=1)
with open(f"{CASE}/analyses/candidate_metrics.tsv","w",newline="") as f:
    w=csv.DictWriter(f,delimiter="\t",fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
print("paratope residues:",len(paratope))
for r in rows: print({k:r[k] for k in ["candidate","plddt","oasis_identity_pct","total_seq_changes_vs_parent","n_CDR_changes","parent_global_ca_rmsd","paratope_max_displacement_after_global_fit"]})
