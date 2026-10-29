#!/usr/bin/env python3
"""Write the WT/HEMT model as an mmCIF derived from the deposited 5XH3 file.

Starting from 5XH3.cif preserves every metadata category (chem_comp for ligand
856, entity definitions, ...), which the MOS importer validates.  Only two
residues are changed:
  auth 103  GLY -> ARG   (atoms from 5XG0 chain C, superposed)
  auth 131  ALA -> SER   (atoms from 5XG0 chain C, superposed)
Everything else - backbone, all other side chains, and the ligand 856 pose -
is experimental 5XH3.  Waters, SO4 and GOL are removed.
"""
import gemmi

st_wt = gemmi.read_structure("../inputs/5XG0.cif"); st_wt.setup_entities()
st = gemmi.read_structure("../inputs/5XH3.cif"); st.setup_entities()

wt = [c for c in st_wt[0] if c.name == "C"][0]
mu = [c for c in st[0] if c.name == "A"][0]
wt_res = {r.seqid.num: r for r in wt if r.het_flag == "A"}
mu_res = {r.seqid.num: r for r in mu if r.het_flag == "A"}
common = sorted(set(wt_res) & set(mu_res))
sup = gemmi.superpose_positions([wt_res[i].find_atom("CA", "*").pos for i in common],
                                [mu_res[i].find_atom("CA", "*").pos for i in common])
t = sup.transform.inverse()
print("superpose rmsd", round(sup.rmsd, 3))

REVERT = {103: "R", 131: "S"}

def reverted_residue(src, seqid):
    r = gemmi.Residue()
    r.name = src.name
    r.seqid = seqid
    r.het_flag = "A"
    for a in src:
        v = t.apply(gemmi.Vec3(a.pos.x, a.pos.y, a.pos.z))
        na = gemmi.Atom(); na.name = a.name; na.element = a.element
        na.pos = gemmi.Position(v.x, v.y, v.z); na.occ = 1.0; na.b_iso = a.b_iso
        r.add_atom(na)
    return r

newchain = gemmi.Chain("A")
for r in mu:
    if r.het_flag != "A":
        continue
    if r.seqid.num in REVERT:
        newchain.add_residue(reverted_residue(wt_res[r.seqid.num], r.seqid))
    else:
        newchain.add_residue(r)

st[0].remove_chain("A")
st[0].add_chain(newchain, 0)

# ligand chain from the pristine deposit, chain B (label asym) / auth A 301
lig = [r for c in gemmi.read_structure("../inputs/5XH3.cif")[0] for r in c if r.name == "856"][0]
for c in list(st[0]):
    if c.name != "A" and c.name != "B":
        st[0].remove_chain(c.name)
for c in list(st[0]):
    if c.name == "B":
        st[0].remove_chain("B")
chB = gemmi.Chain("B"); chB.add_residue(lig); st[0].add_chain(chB, 1)

st.assign_serial_numbers()
st.make_mmcif_document().write_file("5XG0_WT_HEMT_model.cif")

prot = [r for r in st[0]["A"] if r.het_flag == "A"]
seq = "".join(gemmi.find_tabulated_residue(r.name).one_letter_code.upper() for r in prot)
print("chains:", [(c.name, len(c)) for c in st[0]])
print("protein len", len(seq))
print("103:", seq[102], "131:", seq[130], "177:", seq[176], "208:", seq[207])
open("5XG0_WT_HEMT_model_seq.fasta", "w").write(">5XG0_WT_HEMT_model_chainA_auth1-261\n" + seq + "\n")
