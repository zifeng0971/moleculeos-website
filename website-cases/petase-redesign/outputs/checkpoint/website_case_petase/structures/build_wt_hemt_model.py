#!/usr/bin/env python3
"""Build the WT-sequence PETase / HEMT model used for ligand-aware redesign.

Why this construction:
  5XH3 is the experimental HEMT complex, but its protein is the catalytically
  dead R103G/S131A double mutant, so it cannot be used as a WT design scaffold.
  5XG0 is genuine WT but apo, and its Trp185 (auth 156) rotamer sterically
  clashes (0.86 A) with the ligand pose transferred by superposition.

Construction:
  backbone + every side chain  -> 5XH3 chain A (the conformation that actually
                                  binds HEMT, including the Trp185 rotamer)
  residue 103 (auth)           -> reverted to WT ARG, atoms from 5XG0 chain C
                                  after superposition (solvent exposed, >4 A from ligand)
  residue 131 (auth)           -> reverted to WT SER, atoms from 5XG0 chain C
                                  after superposition (restores the nucleophile)
  ligand 856                   -> experimental pose from 5XH3

Everything else is untouched 5XH3 coordinates.  The result is a MODEL, not a
deposited structure; it is labelled as such wherever it is used.
"""
import gemmi, json, math

st_wt = gemmi.read_structure("../inputs/5XG0.cif"); st_wt.setup_entities()
st_mu = gemmi.read_structure("../inputs/5XH3.cif"); st_mu.setup_entities()
wt = [c for c in st_wt[0] if c.name == "C"][0]
mu = [c for c in st_mu[0] if c.name == "A"][0]
wt_res = {r.seqid.num: r for r in wt if r.het_flag == "A"}
mu_res = {r.seqid.num: r for r in mu if r.het_flag == "A"}
common = sorted(set(wt_res) & set(mu_res))

p1 = [wt_res[i].find_atom("CA", "*").pos for i in common]
p2 = [mu_res[i].find_atom("CA", "*").pos for i in common]
sup = gemmi.superpose_positions(p1, p2)
t = sup.transform.inverse()   # gemmi maps set2 -> set1; inverse maps WT -> 5XH3 frame

THREE = {"R": "ARG", "S": "SER"}
REVERT = {103: "R", 131: "S"}

out = gemmi.Structure()
out.spacegroup_hm = "P 1"
out.cell = gemmi.UnitCell(100, 100, 100, 90, 90, 90)
model = gemmi.Model("1")
chA = gemmi.Chain("A")
reverted_atoms = {}
for i in common:
    src = mu_res[i]
    if i in REVERT:
        src = wt_res[i]
    nr = gemmi.Residue(); nr.name = src.name; nr.seqid = gemmi.SeqId(str(i), " "); nr.het_flag = "A"
    for a in src:
        pos = a.pos
        if i in REVERT:
            v = t.apply(gemmi.Vec3(a.pos.x, a.pos.y, a.pos.z))
            pos = gemmi.Position(v.x, v.y, v.z)
        na = gemmi.Atom(); na.name = a.name; na.element = a.element
        na.pos = pos; na.occ = a.occ; na.b_iso = a.b_iso
        nr.add_atom(na)
        if i in REVERT:
            reverted_atoms.setdefault(i, []).append((a.name, (pos.x, pos.y, pos.z)))
    chA.add_residue(nr)
model.add_chain(chA)

lig = [r for c in st_mu[0] for r in c if r.name == "856"][0]
chB = gemmi.Chain("B")
nr = gemmi.Residue(); nr.name = "856"; nr.seqid = gemmi.SeqId("856", " "); nr.het_flag = "H"
for a in lig:
    na = gemmi.Atom(); na.name = a.name; na.element = a.element
    na.pos = a.pos; na.occ = a.occ; na.b_iso = a.b_iso
    nr.add_atom(na)
chB.add_residue(nr)
model.add_chain(chB)
out.add_model(model)
out.assign_serial_numbers()
out.make_mmcif_document().write_file("5XG0_WT_HEMT_model.cif")
out.write_pdb("5XG0_WT_HEMT_model.pdb")

# ---------------- validation: clashes, contacts, catalytic geometry ------------
atoms = [(r.seqid.num, r.name, a.name, a.pos) for r in chA for a in r if a.element.name != "H"]
lig_atoms = [a for a in nr if a.element.name != "H"]
clash = []
for i, (ri, rn, an, ap) in enumerate(atoms):
    for b in lig_atoms:
        if ap.dist(b.pos) < 2.2:
            clash.append({"auth_res": ri, "resname": rn, "atom": an, "ligand_atom": b.name,
                          "dist_A": round(ap.dist(b.pos), 2)})
proto_clash = sum(1 for a in clash)
ser131 = {n: p for n, p in reverted_atoms[131]}
arg103 = {n: p for n, p in reverted_atoms[103]}
def d(p, b):
    return round(math.dist(p, (b.pos.x, b.pos.y, b.pos.z)), 3)
rep = {
    "superpose_rmsd_A": round(sup.rmsd, 3),
    "n_protein_residues": len(chA), "n_ligand_atoms": len(lig_atoms),
    "reverted_103": "GLY -> ARG (5XG0 rotamer, superposed)",
    "reverted_131": "ALA -> SER (5XG0 rotamer, superposed)",
    "reverted_atom_clashes_with_ligand_lt_2.2A": clash,
    "Ser131_OG_min_dist_to_ligand_A": min(d(ser131["OG"], b) for b in lig_atoms),
    "Ser131_OG_nearest_ligand_atom": min(((d(ser131["OG"], b), b.name) for b in lig_atoms))[1],
    "Ser131_OG_to_ester_C09_A": d(ser131["OG"], [b for b in lig_atoms if b.name == "C09"][0]),
    "Arg103_NH1_min_dist_to_ligand_A": min(d(arg103["NH1"], b) for b in lig_atoms),
}
json.dump(rep, open("5XG0_WT_HEMT_model_build.json", "w"), indent=1)
print(json.dumps(rep, indent=1))
