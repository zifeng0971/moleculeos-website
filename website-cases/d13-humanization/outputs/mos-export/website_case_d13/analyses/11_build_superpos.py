"""Write one PDB with the 1FDL parent Fv and a candidate Fv superposed onto it
(Kabsch on all paired VH+VL CA, ANARCI-IMGT pairing).
Parent chains: A=VL, B=VH. Candidate chains: C=VL, D=VH (transformed)."""
import sys, json, glob, numpy as np
sys.path.insert(0,"analyses")
from fv_compare import fv_map, kabsch
from Bio.PDB import PDBParser, MMCIFParser, PDBIO, Structure, Model, Chain, Residue, Atom
CASE="/workspace/website_case_d13"
def _parse(path,name):
    if path.endswith((".cif",".mmcif")): return MMCIFParser(QUIET=True).get_structure(name,path)
    return PDBParser(QUIET=True).get_structure(name,path)

def build(parent, cand, out):
    R,_=fv_map(parent); M,_=fv_map(cand)
    keys=sorted(set(R)&set(M), key=lambda k:(k[0],k[1]))
    P=np.array([M[k]["ca"] for k in keys]); Q=np.array([R[k]["ca"] for k in keys])
    rmsd,Rm,t,_=kabsch(P,Q)
    roles={}
    for k in keys: roles.setdefault(M[k]["chain"],k[0])
    pst=_parse(parent,"p")
    cst=_parse(cand,"c")
    newname={"VH":"D","VL":"C"}
    out_st=Structure.Structure("sup"); model=Model.Model(0); out_st.add(model)
    # parent chains kept as-is
    for ch in pst[0]:
        model.add(Chain.Chain(ch.id))
        for r in ch:
            if r.id[0]!=" ": continue
            model[ch.id].add(Residue.Residue((" ",r.id[1],r.id[2]),r.resname," "))
            for a in r:
                if a.element=="H": continue
                na=Atom.Atom(a.name,a.coord,a.bfactor,a.occupancy,a.altloc,a.fullname,a.element)
                model[ch.id][(" ",r.id[1],r.id[2])].add(na)
    # candidate chains, transformed
    for ch in cst[0]:
        role=roles.get(ch.id)
        if role not in newname: continue
        nid=newname[role]
        model.add(Chain.Chain(nid))
        for r in ch:
            if r.id[0]!=" ": continue
            model[nid].add(Residue.Residue((" ",r.id[1],r.id[2]),r.resname," "))
            for a in r:
                if a.element=="H": continue
                xyz=Rm@a.coord+t
                na=Atom.Atom(a.name,xyz,a.bfactor,a.occupancy,a.altloc,a.fullname,a.element)
                model[nid][(" ",r.id[1],r.id[2])].add(na)
    io=PDBIO(); io.set_structure(out_st); io.save(out)
    return rmsd,len(keys),out
if __name__=="__main__":
    for cid in ["humanization_3","humanization_9","humanization_2"]:
        best=json.load(open(f"{CASE}/native_tasks/mmfold/{cid}/manifest.json"))["best_sample"]
        model=glob.glob(f"{CASE}/native_tasks/mmfold/{cid}/*_sample_{best}.cif")[0]
        r,n,o=build(f"{CASE}/structures/parent_1FDL_Fv.pdb",model,f"{CASE}/structures/superposed_parent_{cid}.pdb")
        print(cid,"CA RMSD %.3f A over %d CA -> %s"%(r,n,o))
