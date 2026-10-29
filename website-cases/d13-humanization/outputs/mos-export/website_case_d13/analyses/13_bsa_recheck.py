"""Independent BSA for the 1FDL Fab:lysozyme interface with explicit reference states.
BSA_total = SASA(Fab A+B as one body) + SASA(Ag) - SASA(Fab+Ag)
dSASA(Fab chain) = SASA(chain inside Fab) - SASA(chain inside complex)
dSASA(Ag residue) = SASA(Ag alone) - SASA(Ag in complex)"""
import freesasa, gemmi, json, tempfile
from Bio.PDB import MMCIFParser, PDBIO, Select
SRC="structures/1FDL_mos_sanitized.cif"
st=MMCIFParser(QUIET=True).get_structure("x",SRC)
VDOM={"A":(1,107),"B":(1,116)}
def isV(ch,n): return ch=="C" or (ch in VDOM and VDOM[ch][0]<=n<=VDOM[ch][1])
tmp=tempfile.mkdtemp()
class Sel(Select):
    def __init__(self,chains,vonly): self.chains=chains; self.vonly=vonly
    def accept_chain(self,ch): return ch.id in self.chains
    def accept_residue(self,r): return isV(r.get_parent().id,r.id[1]) if self.vonly else True
    def accept_atom(self,a): return a.get_altloc() in (" ","A") and a.element!="H"
params=freesasa.Parameters({"algorithm":freesasa.LeeRichards,"n-slices":100,"n-points":1000})
def run(chains,vonly,name):
    p=f"{tmp}/{name}.pdb"; io=PDBIO(); io.set_structure(st); io.save(p,Sel(chains,vonly))
    s=freesasa.Structure(p); r=freesasa.calc(s,params)
    per={}
    for i in range(s.nAtoms()):
        k=(s.chainLabel(i),int(s.residueNumber(i).split()[0]))
        per[k]=per.get(k,0.0)+r.atomArea(i)
    return per,r.totalArea()
def analyse(vonly,label):
    comp,ct=run("ABC",vonly,"c"); fab,ft=run("AB",vonly,"f"); ag,at=run("C",vonly,"a")
    rows=[]
    for (ch,rn),v in comp.items():
        d=(ag.get((ch,rn),0.0)-v) if ch=="C" else (fab.get((ch,rn),0.0)-v)
        rows.append({"chain":ch,"res_num":rn,"dSASA_A2":round(d,2)})
    side={k:round(sum(r["dSASA_A2"] for r in rows if r["chain"]==c),1) for k,c in [("VH","B"),("VL","A"),("antigen","C")]}
    print(f"[{label}] SASA fab={ft:.1f} ag={at:.1f} complex={ct:.1f} -> BSA={ft+at-ct:.1f} A^2 | per side {side}")
    print("   buried residues (>0.5 A^2):",
          {k:sum(1 for r in rows if r["chain"]==c and r["dSASA_A2"]>0.5) for k,c in [("VH","B"),("VL","A"),("antigen","C")]})
    return {"label":label,"bsa_total_A2":round(ft+at-ct,1),"per_side_A2":side,"per_residue":rows}
res={"full_fab":analyse(False,"full Fab (constant domains included)"),
     "v_domains_only":analyse(True,"V domains only")}
json.dump(res,open("analyses/bsa_recheck_1FDL.json","w"),indent=1)
