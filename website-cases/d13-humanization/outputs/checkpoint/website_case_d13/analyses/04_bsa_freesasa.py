import freesasa, json, tempfile, io
from Bio.PDB import MMCIFParser, PDBIO, Select
SRC="structures/1FDL_mos_sanitized.cif"
st_=MMCIFParser(QUIET=True).get_structure("x",SRC)
V={"A":(1,107),"B":(1,116),"C":(1,129)}
def isV(ch,n): return ch=="C" or (ch in V and V[ch][0]<=n<=V[ch][1])
tmp=tempfile.mkdtemp()
def write_sel(chains, path):
    class Sel(Select):
        def accept_chain(self,ch): return ch.id in chains
        def accept_residue(self,r): return isV(r.get_parent().id,r.id[1])
        def accept_atom(self,a): return a.get_altloc() in (" ","A") and a.element!="H"
    io_=PDBIO(); io_.set_structure(st_); io_.save(path,Sel())
paths={"complex":("ABC",f"{tmp}/c.pdb"),"AB":("AB",f"{tmp}/ab.pdb"),"AG":("C",f"{tmp}/ag.pdb"),
       "B":("B",f"{tmp}/b.pdb"),"A":("A",f"{tmp}/a.pdb")}
params=freesasa.Parameters({"algorithm":freesasa.LeeRichards,"n-slices":100,"n-points":1000})
def calc(key):
    chains,p=paths[key]; write_sel(chains,p)
    s=freesasa.Structure(p); r=freesasa.calc(s,params)
    d={}
    for i in range(s.nAtoms()):
        ch=s.chainLabel(i); rn=int(s.residueNumber(i).split()[0])
        d[(ch,rn)]=d.get((ch,rn),0.0)+r.atomArea(i)
    return d, r.totalArea()
C={k:calc(k) for k in paths}
pc=C["complex"][0]; pa=C["AB"][0]; pg=C["AG"][0]; pb=C["B"][0]; pl=C["A"][0]
seg=None
rows=[]
for (ch,rn),v in sorted(pc.items()):
    if ch=="C": d=pg.get((ch,rn),0.0)-v
    else: d=pa.get((ch,rn),0.0)-v   # SASA in Fab (A+B) minus SASA in Fab:antigen complex
    rows.append({"chain":ch,"res_num":rn,"delta_sasa_A2":round(d,2)})
sB=sum(r["delta_sasa_A2"] for r in rows if r["chain"]=="B")
sA=sum(r["delta_sasa_A2"] for r in rows if r["chain"]=="A")
sC=sum(r["delta_sasa_A2"] for r in rows if r["chain"]=="C")
print("Total SASA: complex %.1f | AB(no Ag) %.1f | Ag alone %.1f"%(C["complex"][1],C["AB"][1],C["AG"][1]))
bsa_tot=C["AB"][1]+C["AG"][1]-C["complex"][1]
print("dSASA on burial: VH %.1f  VL %.1f  lysozyme %.1f"%(sB,sA,sC))
print("Interface BSA (ASA_Fab + ASA_Ag - ASA_complex) = %.1f A^2 ; per-side sum = %.1f"%(bsa_tot,sA+sB+sC))
print("interface residues >0.5A2: VH %d VL %d Ag %d"%(sum(1 for r in rows if r['chain']=='B' and r['delta_sasa_A2']>0.5),
 sum(1 for r in rows if r['chain']=='A' and r['delta_sasa_A2']>0.5),
 sum(1 for r in rows if r['chain']=='C' and r['delta_sasa_A2']>0.5)))
top=sorted([r for r in rows if r["delta_sasa_A2"]>0],key=lambda x:-x["delta_sasa_A2"])[:15]
for r in top: print(r)
json.dump(rows,open("analyses/bsa_freesasa_1FDL.json","w"),indent=1)
