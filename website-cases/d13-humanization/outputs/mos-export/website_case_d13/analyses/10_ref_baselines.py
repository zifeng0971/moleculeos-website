import json, sys
sys.path.insert(0,"analyses")
from fv_compare import compare
CASE="/workspace/website_case_d13"
res={}
res["parent_vs_1BVL_authorAB"]=compare(f"{CASE}/structures/parent_1FDL_Fv.pdb",f"{CASE}/structures/ref_1BVL_authAB.pdb","parent_vs_1BVL_authorAB")
res["parent_vs_1BVL_authorCD"]=compare(f"{CASE}/structures/parent_1FDL_Fv.pdb",f"{CASE}/structures/ref_1BVL_authCD.pdb","parent_vs_1BVL_authorCD")
res["1BVL_authorAB_vs_authorCD"]=compare(f"{CASE}/structures/ref_1BVL_authAB.pdb",f"{CASE}/structures/ref_1BVL_authCD.pdb","1BVL_authorAB_vs_authorCD")
for k,v in res.items():
    if "global_fit" not in v: print(k,"ERR",v.get("error")); continue
    print(f"{k}: global CA RMSD {v['global_fit']['ca_rmsd']} A over {v['global_fit']['n_ca_atoms']} CA; "
          f"FR-fit {v['framework_fit']['ca_rmsd']} A over {v['framework_fit']['n_ca_atoms']} CA; "
          f"seq diffs {v['sequence_differences']['count']}")
    print("   CDR local RMSD:", {k2:round(x['local_fit_ca_rmsd'],2) for k2,x in v['framework_fit']['cdr'].items()})
json.dump({k:{kk:vv for kk,vv in v.items() if kk!='per_residue'} for k,v in res.items()},
          open(f"{CASE}/analyses/reference_baselines.json","w"),indent=1)
