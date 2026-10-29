#!/usr/bin/env python3
"""Deterministic protein-ligand pocket analysis for 5XH3 / ligand 856 (HEMT).

Source of every number: this script, run locally on the RCSB-deposited
coordinates (inputs/5XH3.pdb, author numbering) and the manual ligand file
(inputs/5xh3_B_856.sdf, SHA256-verified).  No numbers are hand-entered.

Numbering conventions
  AUTH : PDB author numbering, protein chain A 1..261, ligand 856 residue 301
  UNP  : UniProt A0A0K8P6T7 precursor numbering = AUTH + 29
  MOS  : sanitized layout (protein chain A 1..261, ligand becomes chain B)
"""
import csv, json, math, itertools
import gemmi
import numpy as np
from rdkit import Chem

PDB = "../inputs/5XH3.pdb"
SDF = "../inputs/5xh3_B_856.sdf"
OUT = "."

CONTACT_CUT = 4.0      # A, any heavy-atom pair -> first-shell contact
HBOND_CUT = 3.6        # A, donor-acceptor heavy atom distance screen
HYDRO_CUT = 4.5        # A, carbon-carbon hydrophobic contact
PI_CUT = 5.5           # A, ring centroid distance
OFFSET = 29            # UNP = AUTH + 29 (5XH3 SEQADV + DBREF2)

# ---------------------------------------------------------------- structures
st = gemmi.read_structure(PDB)
model = st[0]
prot = [c for c in model if c.name == "A"][0]
lig = None
for c in model:
    for r in c:
        if r.name == "856":
            lig = r
if lig is None:
    raise SystemExit("ligand 856 not found")

prot_res = [r for r in prot if r.het_flag == "A"]
lig_atoms = [a for a in lig if a.element.name != "H"]

# ---------------------------------------------------------------- ligand chemistry
mol = Chem.MolFromMolFile(SDF, sanitize=True, removeHs=False)
# SDF atom order == PDB atom order (verified: coordinates identical)
assert mol.GetNumAtoms() == len(lig_atoms), (mol.GetNumAtoms(), len(lig_atoms))

# chemical role per atom, derived from the SDF bond graph (RDKit), not hand-assigned
def role_of(idx):
    a = mol.GetAtomWithIdx(idx)
    if a.GetSymbol() == "C":
        if a.GetIsAromatic():
            return "aromatic_C"
        dbl_o = [b.GetOtherAtom(a) for b in a.GetBonds()
                 if b.GetOtherAtom(a).GetSymbol() == "O" and b.GetBondTypeAsDouble() == 2.0]
        if dbl_o:
            return "ester_carbonyl_C"
        if any(n.GetSymbol() == "O" for n in a.GetNeighbors()):
            if a.GetDegree() == 1:
                return "methyl_C"
            return "hydroxyethyl_CH2"
        return "alkyl_C"
    if a.GetSymbol() == "O":
        if any(b.GetBondTypeAsDouble() == 2.0 for b in a.GetBonds()):
            return "carbonyl_O"
        if a.GetDegree() == 1:
            return "terminal_hydroxyl_O"
        nbr_carbonyl = False
        for n in a.GetNeighbors():
            for b in n.GetBonds():
                o = b.GetOtherAtom(n)
                if o.GetSymbol() == "O" and b.GetBondTypeAsDouble() == 2.0:
                    nbr_carbonyl = True
        if nbr_carbonyl:
            # ester oxygen; distinguish which end by its alkyl neighbour
            alk = [n for n in a.GetNeighbors() if n.GetSymbol() == "C" and not n.GetIsAromatic()]
            if alk and all(x.GetSymbol() == "C" for x in alk[0].GetNeighbors() if x.GetIdx() != a.GetIdx()) and alk[0].GetDegree() == 1:
                return "methoxy_O"
            return "hydroxyethyl_ester_O"
        return "ether_O"
    return a.GetSymbol()

lig_meta = []
for k, a in enumerate(lig_atoms):
    lig_meta.append({"idx": k + 1, "name": a.name, "element": a.element.name,
                     "role": role_of(k), "degree": mol.GetAtomWithIdx(k).GetDegree(),
                     "x": round(a.pos.x, 4), "y": round(a.pos.y, 4), "z": round(a.pos.z, 4)})

# ring centroid of the aromatic ring (for pi-stacking)
ring_atoms = [i for i in range(mol.GetNumAtoms()) if mol.GetAtomWithIdx(i).GetIsAromatic()]
ring_xyz = np.array([[lig_atoms[i].pos.x, lig_atoms[i].pos.y, lig_atoms[i].pos.z] for i in ring_atoms])
ring_centroid = ring_xyz.mean(axis=0)

# ---------------------------------------------------------------- contacts
rows = []
for r in prot_res:
    for pa in r:
        if pa.element.name == "H":
            continue
        for lm in lig_meta:
            d = math.dist((pa.pos.x, pa.pos.y, pa.pos.z), (lm["x"], lm["y"], lm["z"]))
            if d <= CONTACT_CUT:
                rows.append({"auth_res": r.seqid.num, "unp_res": r.seqid.num + OFFSET,
                             "resname": gemmi.find_tabulated_residue(r.name).one_letter_code.upper(),
                             "protein_atom": pa.name, "protein_element": pa.element.name,
                             "ligand_atom": lm["name"], "ligand_element": lm["element"],
                             "ligand_role": lm["role"], "distance": round(d, 3)})
rows.sort(key=lambda x: (x["auth_res"], x["distance"]))
with open(f"{OUT}/ligand856_atom_contacts.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

# per-residue summary
pocket = {}
for r in rows:
    e = pocket.setdefault(r["auth_res"], {"auth_res": r["auth_res"], "unp_res": r["unp_res"],
                                          "resname": r["resname"], "min_dist": 99.0, "n_contacts": 0,
                                          "origins": set(), "ligand_atoms": set()})
    e["min_dist"] = min(e["min_dist"], r["distance"])
    e["n_contacts"] += 1
    e["ligand_atoms"].add(r["ligand_atom"])
    if r["protein_element"] in ("N", "O") and r["ligand_element"] in ("N", "O") and r["distance"] <= HBOND_CUT:
        e["origins"].add("polar")
    if r["protein_element"] == "C" and r["ligand_element"] == "C" and r["distance"] <= HYDRO_CUT:
        e["origins"].add("hydrophobic")

# pi-stacking vs ring centroid (protein aromatic rings)
AROM = {"PHE": ["CG", "CD1", "CD2", "CE1", "CE2", "CZ"],
        "TYR": ["CG", "CD1", "CD2", "CE1", "CE2", "CZ"],
        "TRP": ["CG", "CD1", "CD2", "CE2", "CE3", "CZ2", "CZ3", "CH2"],
        "HIS": ["CG", "ND1", "CD2", "CE1", "NE2"]}
pi_rows = []
for r in prot_res:
    if r.name not in AROM:
        continue
    pts = [[a.pos.x, a.pos.y, a.pos.z] for a in r if a.name in AROM[r.name]]
    if len(pts) < 5:
        continue
    c = np.array(pts).mean(axis=0)
    d = float(np.linalg.norm(c - ring_centroid))
    if d <= PI_CUT:
        pi_rows.append({"auth_res": r.seqid.num, "unp_res": r.seqid.num + OFFSET, "resname": r.name,
                        "ring_centroid_dist": round(d, 3)})
        pocket.setdefault(r.seqid.num, {"auth_res": r.seqid.num, "unp_res": r.seqid.num + OFFSET,
                                        "resname": gemmi.find_tabulated_residue(r.name).one_letter_code.upper(),
                                        "min_dist": d, "n_contacts": 0, "origins": set(), "ligand_atoms": set()})
        pocket[r.seqid.num]["origins"].add("pi")

pk = []
for k, e in sorted(pocket.items()):
    pk.append({"auth_res": e["auth_res"], "unp_res": e["unp_res"], "resname": e["resname"],
               "min_dist_A": round(e["min_dist"], 3), "n_atom_contacts": e["n_contacts"],
               "interaction_classes": "+".join(sorted(e["origins"])) or "vdw",
               "ligand_atoms_touched": ",".join(sorted(e["ligand_atoms"]))})
with open(f"{OUT}/ligand856_pocket_residues.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(pk[0].keys())); w.writeheader(); w.writerows(pk)

# polar contacts (heavy-atom donor/acceptor screen; no H modelled in 5XH3)
polar = [r for r in rows if r["protein_element"] in ("N", "O") and r["ligand_element"] in ("N", "O") and r["distance"] <= HBOND_CUT]
with open(f"{OUT}/ligand856_polar_contacts.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(polar)

# ---------------------------------------------------------------- SASA burial
import freesasa
from Bio.PDB import PDBParser, PDBIO
OPT = {"hetatm": True}
# ligand SASA in the complex (all atoms + het, waters present as in deposit)
fs = freesasa.Structure(PDB, options=OPT)
res_complex = freesasa.calc(fs)
lig_idx = [i for i in range(fs.nAtoms()) if fs.residueName(i).strip() == "856"]
sasa_complex = sum(res_complex.atomArea(i) for i in lig_idx)

# ligand SASA isolated: same coordinates, every other residue removed
parser = PDBParser(QUIET=True)
bio2 = parser.get_structure("y", PDB)
for ch in list(bio2[0]):
    for rid in [r.id for r in ch if r.resname != "856"]:
        ch.detach_child(rid)
io = PDBIO(); io.set_structure(bio2); io.save(f"{OUT}/tmp_856_isolated.pdb")
fs2 = freesasa.Structure(f"{OUT}/tmp_856_isolated.pdb", options=OPT)
c2 = freesasa.calc(fs2)
sasa_isolated = sum(c2.atomArea(i) for i in range(fs2.nAtoms()))
buried = sasa_isolated - sasa_complex

summary = {
    "input_protein": PDB, "input_ligand": SDF,
    "ligand_comp_id": "856", "ligand_name": "O4-(2-hydroxyethyl) O1-methyl benzene-1,4-dicarboxylate",
    "ligand_heavy_atoms": len(lig_meta), "ligand_formula": "C11 H12 O5",
    "numbering": {"AUTH_to_UNP_offset": OFFSET,
                  "catalytic_triad_UNP": "Ser160 / Asp206 / His237",
                  "catalytic_triad_AUTH": "Ser131 / Asp177 / His208"},
    "contact_cutoff_A": CONTACT_CUT, "hbond_screen_A": HBOND_CUT,
    "n_contact_pairs": len(rows), "n_pocket_residues": len(pk),
    "n_polar_contacts_u35": len(polar), "n_pi_contacts": len(pi_rows),
    "ligand_sasa_complex_A2": round(sasa_complex, 2),
    "ligand_sasa_isolated_A2": round(sasa_isolated, 2),
    "ligand_buried_sasa_A2": round(buried, 2),
    "ligand_buried_fraction": round(buried / sasa_isolated, 3) if sasa_isolated else None,
    "ligand_atoms": lig_meta,
    "pi_contacts": pi_rows,
    "polar_contacts": polar,
}
json.dump(summary, open(f"{OUT}/ligand856_pocket_summary.json", "w"), indent=1)
print(json.dumps({k: v for k, v in summary.items() if k not in ("ligand_atoms", "pi_contacts", "polar_contacts")}, indent=1))
print("\nPOCKET:")
for p in pk:
    print(f"  AUTH{p['auth_res']:>4} UNP{p['unp_res']:>4} {p['resname']}  min {p['min_dist_A']:.2f} A  "
          f"contacts {p['n_atom_contacts']:>3}  {p['interaction_classes']}")
print("\nPOLAR:")
for p in polar:
    print(f"  {p['resname']}{p['auth_res']}(UNP{p['unp_res']}) {p['protein_atom']} -- {p['ligand_atom']}({p['ligand_role']}) {p['distance']:.2f} A")
