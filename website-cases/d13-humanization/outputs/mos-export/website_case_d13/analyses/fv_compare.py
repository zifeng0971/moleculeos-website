"""Numbering-aware Fv comparison: Kabsch CA superposition with explicit residue pairing.
Pairing key = (chain role, IMGT position) from ANARCI. Method is recorded with every number."""
import subprocess, tempfile, os, json, re
import numpy as np
from Bio.PDB import PDBParser, MMCIFParser

AA3={'ALA':'A','ARG':'R','ASN':'N','ASP':'D','CYS':'C','GLN':'Q','GLU':'E','GLY':'G','HIS':'H',
     'ILE':'I','LEU':'L','LYS':'K','MET':'M','PHE':'F','PRO':'P','SER':'S','THR':'T','TRP':'W',
     'TYR':'Y','VAL':'V','MSE':'M'}
_LINE=re.compile(r"^(\S+)\s+(\d+)([A-Za-z]?)\s+(?:([A-Za-z])\s+)?([A-Za-z-])\s*$")

def anarci(seq, scheme="imgt"):
    with tempfile.NamedTemporaryFile("w",suffix=".fa",delete=False) as f:
        f.write(">q\n"+seq+"\n"); p=f.name
    r=subprocess.run(["ANARCI","-i",p,"-s",scheme,"-r","ig"],capture_output=True,text=True)
    os.unlink(p)
    return r.stdout

def parse_numbering(txt):
    out=[]
    for line in txt.splitlines():
        if line.startswith("#"): continue
        m=_LINE.match(line)
        if not m: continue
        tag,num,ins,ins2,aa=m.groups()
        out.append({"pos":f"{num}{ins or ins2 or ''}","aa":aa})
    return out

REGIONS={"FR1":(1,26),"CDR1":(27,38),"FR2":(39,55),"CDR2":(56,65),"FR3":(66,104),"CDR3":(105,117),"FR4":(118,128)}
def region_of(pos):
    n=int(re.match(r"(\d+)",pos).group(1))
    for r,(lo,hi) in REGIONS.items():
        if lo<=n<=hi: return r
    return "OUTSIDE"

def pdb_chains(path):
    if path.endswith((".cif",".mmcif")):
        st=MMCIFParser(QUIET=True).get_structure("s",path)
    else:
        st=PDBParser(QUIET=True).get_structure("s",path)
    out={}
    for ch in st[0]:
        res=[r for r in ch if r.id[0]==" " and r.resname in AA3]
        if len(res)<50: continue
        out[ch.id]={"seq":"".join(AA3[r.resname] for r in res),
                    "ca":{i+1:r["CA"].coord.copy() for i,r in enumerate(res) if "CA" in r},
                    "res":res}
    return out

_CACHE_PATH=os.path.join(os.path.dirname(os.path.abspath(__file__)),"anarci_cache.json")
try: _CACHE=json.load(open(_CACHE_PATH))
except Exception: _CACHE={}
def _anarci_cached(seq):
    import hashlib
    k=hashlib.md5(seq.encode()).hexdigest()
    if k not in _CACHE:
        _CACHE[k]=anarci(seq)
        json.dump(_CACHE,open(_CACHE_PATH,"w"))
    return _CACHE[k]

def fv_map(path):
    """Return dict (role,imgt_pos) -> {'ca':xyz,'aa':letter,'region':r,'chain':id,'resnum':n} plus chain meta."""
    chains=pdb_chains(path)
    meta={}; mapped={}
    for cid,info in chains.items():
        txt=_anarci_cached(info["seq"])
        num=parse_numbering(txt)
        iaas=[x for x in num if x["aa"]!="-"]
        if not iaas: 
            meta[cid]={"role":"non_ig","length":len(info["seq"])}
            continue
        ct=None
        for i,l in enumerate(txt.splitlines()):
            if l.startswith("#|") and "chain_type" in l:
                ct=txt.splitlines()[i+1].strip("#| ").split("|")[1]
        role={"H":"VH","K":"VL","L":"VL"}.get(ct,"other")
        meta[cid]={"role":role,"length":len(info["seq"]),"domain_length":len(iaas),"chain_type":ct}
        for idx,x in enumerate(iaas,start=1):
            if idx in info["ca"]:
                mapped[(role,x["pos"])]={"ca":info["ca"][idx],"aa":x["aa"],
                                          "region":region_of(x["pos"]),"chain":cid,"resnum":idx}
    return mapped,meta

def kabsch(P,Q):
    """Superpose P onto Q (both Nx3); returns rmsd, R, t. Kabsch via SVD."""
    Pc=P-P.mean(0); Qc=Q-Q.mean(0)
    H=Pc.T@Qc
    U,S,Vt=np.linalg.svd(H)
    d=np.sign(np.linalg.det(Vt.T@U.T))
    D=np.diag([1,1,d])
    R=Vt.T@D@U.T
    t=Q.mean(0)-R@P.mean(0)
    Pr=(R@P.T).T+t
    rmsd=float(np.sqrt(((Pr-Q)**2).sum()/len(P)))
    return rmsd,R,t,Pr

def compare(ref_path, mob_path, label=""):
    R,rmeta=fv_map(ref_path); M,mmeta=fv_map(mob_path)
    keys=sorted(set(R)&set(M), key=lambda k:(k[0],int(re.match(r"(\d+)",k[1]).group(1))))
    def subset(ks, regions=None):
        if regions is None: return ks
        return [k for k in ks if R[k]["region"] in regions]
    res={"label":label,"ref":ref_path,"mob":mob_path,"ref_chains":rmeta,"mob_chains":mmeta,
         "n_paired_residues":len(keys)}
    if len(keys)<50: 
        res["error"]="insufficient paired residues"; return res
    P=np.array([M[k]["ca"] for k in keys])
    Q=np.array([R[k]["ca"] for k in keys])
    rmsd,Rm,tm,Pr=kabsch(P,Q)
    res["global_fit"]={"method":"Kabsch superposition on CA atoms, all paired VH+VL residues (ANARCI IMGT pairing)",
                       "n_ca_atoms":len(keys),"ca_rmsd":round(rmsd,3)}
    # per-region displacement under global fit
    idx={k:i for i,k in enumerate(keys)}
    per={}
    for reg in ["FR1","CDR1","FR2","CDR2","FR3","CDR3","FR4"]:
        ks=[k for k in keys if R[k]["region"]==reg]
        if not ks: continue
        d=np.array([np.linalg.norm(Pr[idx[k]]-Q[idx[k]]) for k in ks])
        per[reg]={"n":len(ks),"mean_displacement":round(float(d.mean()),3),
                  "max_displacement":round(float(d.max()),3)}
    res["region_displacement_after_global_fit"]=per
    # FR-only fit -> CDR displacement + per-CDR local fit
    fks=[k for k in keys if R[k]["region"] in ("FR1","FR2","FR3","FR4")]
    Pf=np.array([M[k]["ca"] for k in fks]); Qf=np.array([R[k]["ca"] for k in fks])
    rmsd_f,Rf,tf,_=kabsch(Pf,Qf)
    fidx={k:i for i,k in enumerate(fks)}
    cdr={}
    for role in ["VH","VL"]:
        for reg in ["CDR1","CDR2","CDR3"]:
            k2=[k for k in keys if k[0]==role and R[k]["region"]==reg]
            if not k2: continue
            Pl=np.array([M[k]["ca"] for k in k2]); Ql=np.array([R[k]["ca"] for k in k2])
            rmsd_l=kabsch(Pl,Ql)[0] if len(k2)>=3 else None
            Pcdr=np.array([M[k]['ca'] for k in k2]); Pfit=(Rf@Pcdr.T).T+tf
            d=np.array([np.linalg.norm(Pfit[j]-Q[idx[k]]) for j,k in enumerate(k2)])
            cdr[f"{role}_{reg}"]={"n_ca":len(k2),
                                  "local_fit_ca_rmsd":None if rmsd_l is None else round(rmsd_l,3),
                                  "displacement_after_FR_fit_mean":round(float(d.mean()),3),
                                  "displacement_after_FR_fit_max":round(float(d.max()),3)}
    res["framework_fit"]={"method":"Kabsch on CA of all IMGT framework residues of VH+VL; CDR values are measured after this framework fit; local_fit_ca_rmsd is an independent Kabsch fit on that CDR alone","n_ca_atoms":len(fks),
                          "ca_rmsd":round(rmsd_f,3),"cdr":cdr}
    # sequence differences
    seqdiff=[]
    for role in ["VH","VL"]:
        for k in keys:
            if k[0]!=role: continue
            if R[k]["aa"]!=M[k]["aa"]:
                seqdiff.append({"role":role,"imgt_position":k[1],"parent":R[k]["aa"],"candidate":M[k]["aa"],"region":R[k]["region"]})
    res["sequence_differences"]={"count":len(seqdiff),"substitutions":seqdiff}
    # per-residue table
    pr=[]
    for k in keys:
        i=idx[k]
        pr.append({"role":k[0],"imgt_position":k[1],"region":R[k]["region"],
                   "parent_aa":R[k]["aa"],"candidate_aa":M[k]["aa"],
                   "displacement_under_global_fit":round(float(np.linalg.norm(Pr[i]-Q[i])),3)})
    res["per_residue"]=pr
    return res

if __name__=="__main__":
    import sys
    r=compare(sys.argv[1],sys.argv[2],sys.argv[3] if len(sys.argv)>3 else "")
    r2={k:v for k,v in r.items() if k!="per_residue"}
    print(json.dumps(r2,indent=1)[:4000])
