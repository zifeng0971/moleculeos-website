"""Direct heavy-atom contacts between the Fab (chains A=VL, B=VH) and lysozyme (chain C) in 1FDL,
computed from coordinates with explicit distance cutoffs. No external contact engine."""
import gemmi, numpy as np, json, csv
st=gemmi.read_structure("structures/1FDL_mos_sanitized.cif"); st.setup_entities()
ch={c.name:c for c in st[0]}
def collect(cid,nmax=None):
    meta=[];xyz=[]
    for r in ch[cid].get_polymer():
        if nmax and r.seqid.num>nmax: continue
        for a in r:
            if str(a.element)=="H": continue
            meta.append((cid,r.seqid.num,r.name,a.name,str(a.element))); xyz.append([a.pos.x,a.pos.y,a.pos.z])
    return meta,np.array(xyz)
def collect_multi(chains):
    M=[];X=[]
    for c,nmax in chains:
        m,x=collect(c,nmax); M+=m; X.append(x)
    return M,np.vstack(X)
M,X=collect_multi([("A",None),("B",None)])
A_meta,A_xyz=collect("C")
D=np.sqrt(((X[:,None,:]-A_xyz[None,:,:])**2).sum(-1))
out={}
for thr in (4.0,4.5):
    i,j=np.where(D<=thr)
    pairs=[(M[ii]+tuple(A_meta[jj])+(round(float(D[ii,jj]),2),)) for ii,jj in zip(i,j)]
    res={(p[0],p[1]) for p in pairs}
    out[f"contacts_{thr}"]={"n_atom_pairs":len(pairs),"n_fab_residues":len(res),
        "fab_residues":sorted([f"{c}{n}" for c,n in res]),}
    if thr==4.0: out["pairs_4.0"]=[{"fab_chain":p[0],"fab_res":p[1],"fab_resname":p[2],"fab_atom":p[3],
                                    "ag_res":p[6],"ag_resname":p[7],"ag_atom":p[8],"distance":p[10]} for p in pairs]
print("4.0 A:",out["contacts_4.0"]["n_atom_pairs"],"atom pairs,",out["contacts_4.0"]["n_fab_residues"],"Fab residues")
print("4.5 A:",out["contacts_4.5"]["n_atom_pairs"],"atom pairs,",out["contacts_4.5"]["n_fab_residues"],"Fab residues")
print("VH:",[r for r in out["contacts_4.5"]["fab_residues"] if r.startswith("B")])
print("VL:",[r for r in out["contacts_4.5"]["fab_residues"] if r.startswith("A")])
# polar contacts and charge pairs at 4.0 A
pairs=out["pairs_4.0"]
pol=[p for p in pairs if p["fab_atom"][0] in "NO" and p["ag_atom"][0] in "NO"]
sb=[p for p in pol if p["distance"]<=4.0 and (
      (p["fab_resname"] in ("ARG","LYS","HIS") and p["fab_atom"].startswith("N") and p["ag_resname"] in ("ASP","GLU") and p["ag_atom"].startswith("O")) or
      (p["ag_resname"] in ("ARG","LYS","HIS") and p["ag_atom"].startswith("N") and p["fab_resname"] in ("ASP","GLU") and p["fab_atom"].startswith("O")))]
out["polar_4.0"]=pol; out["charge_pairs_4.0"]=sb
print("polar N/O pairs <=4.0 A:",len(pol)," charge-pair candidates:",len(sb))
json.dump(out,open("analyses/contacts_recheck_1FDL.json","w"),indent=1)
with open("analyses/contacts_recheck_1FDL.tsv","w",newline="") as f:
    w=csv.DictWriter(f,delimiter="\t",fieldnames=["fab_chain","fab_res","fab_resname","fab_atom","ag_res","ag_resname","ag_atom","distance"])
    w.writeheader()
    for p in sorted(pairs,key=lambda x:x["distance"]): w.writerow(p)
