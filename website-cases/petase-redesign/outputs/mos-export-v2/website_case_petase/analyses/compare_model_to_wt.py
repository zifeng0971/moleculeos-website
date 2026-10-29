#!/usr/bin/env python3
"""Compare an MMFold candidate model with the wild-type 5XG0 structure.

Usage: python compare_model_to_wt.py <model.cif|pdb> <label>

Outputs (analyses/model_compare_<label>.json and .csv):
  global CA RMSD over all matched residues, matched CA count
  per-residue CA displacement (model numbering == AUTH numbering)
  pocket / catalytic-local RMSD
  catalytic geometry and disulfides measured in the model
  designed side-chain contacts and clashes against the HEMT pose
  (model superposed onto 5XH3 chain A, ligand 856 kept in place)
"""
import csv, json, math, sys
import gemmi

MODEL = sys.argv[1]
LABEL = sys.argv[2]
WT = "../inputs/5XG0.cif"
MUT = "../inputs/5XH3.cif"
OFFSET = 29
POCKET = [57, 58, 60, 130, 131, 132, 156, 157, 179, 208, 209]
CATALYTIC = [131, 177, 208]
DISULF = [(174, 210), (244, 260)]
DESIGNED = [130, 156, 157, 179, 209]


def load_chain(path, name=None):
    st = gemmi.read_structure(path)
    st.setup_entities()
    if name is None:
        cands = [c for c in st[0] if any(r.het_flag == "A" for r in c)]
        ch = max(cands, key=lambda c: len([r for r in c if r.het_flag == "A"]))
    else:
        ch = [c for c in st[0] if c.name == name][0]
    return ch


def superpose(mobile, target):
    """Return (rmsd, transform target<-mobile coords, matched ids)."""
    m = [r.seqid.num for r in mobile if r.het_flag == "A"]
    t = [r.seqid.num for r in target if r.het_flag == "A"]
    common = sorted(set(m) & set(t))
    mr = {r.seqid.num: r for r in mobile}
    tr = {r.seqid.num: r for r in target}
    p1 = [mr[i].find_atom("CA", "*").pos for i in common]
    p2 = [tr[i].find_atom("CA", "*").pos for i in common]
    sup = gemmi.superpose_positions(p1, p2)
    # gemmi maps arg2 -> arg1; we want mobile -> target => inverse
    return sup.rmsd, sup.transform.inverse(), common, mr, tr


ch_model = load_chain(MODEL)
ch_wt = load_chain(WT, "C")
ch_mu = load_chain(MUT, "A")

rmsd_wt, tf_wt, common, mr, wr = superpose(ch_model, ch_wt)
rows = []
for i in common:
    a = mr[i].find_atom("CA", "*").pos
    v = tf_wt.apply(gemmi.Vec3(a.x, a.y, a.z))
    b = wr[i].find_atom("CA", "*").pos
    rows.append({"auth_res": i, "unp_res": i + OFFSET,
                 "wt_resname": gemmi.find_tabulated_residue(wr[i].name).one_letter_code.upper(),
                 "model_resname": gemmi.find_tabulated_residue(mr[i].name).one_letter_code.upper(),
                 "ca_displacement_A": round(math.dist((v.x, v.y, v.z), (b.x, b.y, b.z)), 3),
                 "is_pocket": int(i in POCKET), "is_designed": int(i in DESIGNED)})
with open(f"model_compare_{LABEL}.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

def rmsd_of(sel):
    vals = [r["ca_displacement_A"] for r in rows if sel(r)]
    return round(float((sum(v * v for v in vals) / len(vals)) ** 0.5), 3) if vals else None

# catalytic geometry inside the model
def d(res, at, res2, at2):
    r1 = mr.get(res); r2 = mr.get(res2)
    if not r1 or not r2:
        return None
    a1 = r1.find_atom(at, "*"); a2 = r2.find_atom(at2, "*")
    if not a1 or not a2:
        return None
    return round(math.dist((a1.pos.x, a1.pos.y, a1.pos.z), (a2.pos.x, a2.pos.y, a2.pos.z)), 3)

geo = {"Ser131_OG__His208_NE2": d(131, "OG", 208, "NE2"),
       "His208_ND1__Asp177_OD2": d(208, "ND1", 177, "OD2")}
for a, b in DISULF:
    geo[f"Cys{a}_SG__Cys{b}_SG"] = d(a, "SG", b, "SG")

# ligand compatibility: model -> 5XH3 frame, measure designed side chains vs HEMT
rmsd_mu, tf_mu, common_mu, mr2, mur = superpose(ch_model, ch_mu)
lig = [r for c in gemmi.read_structure(MUT)[0] for r in c if r.name == "856"][0]
lig_atoms = [a for a in lig if a.element.name != "H"]
lig_contacts, lig_clash = [], []
for i in DESIGNED:
    if i not in mr:
        continue
    res = mr[i]
    dmin = 99.0; which = None; protein_atom = None
    for a in res:
        if a.element.name == "H":
            continue
        v = tf_mu.apply(gemmi.Vec3(a.pos.x, a.pos.y, a.pos.z))
        for b in lig_atoms:
            dd = math.dist((v.x, v.y, v.z), (b.pos.x, b.pos.y, b.pos.z))
            if dd < dmin:
                dmin, which, protein_atom = dd, b.name, a.name
    lig_contacts.append({"auth_res": i, "model_resname": gemmi.find_tabulated_residue(res.name).one_letter_code.upper(),
                         "min_dist_to_HEMT_A": round(dmin, 2), "protein_atom": protein_atom, "ligand_atom": which})
    if dmin < 2.2:
        lig_clash.append(i)

# global geometry sanity: does the model keep the overall fold?
rep = {
    "label": LABEL, "model_file": MODEL,
    "matched_CA": len(common),
    "global_CA_RMSD_vs_5XG0_A": round(rmsd_wt, 3),
    "pocket_CA_RMSD_vs_5XG0_A": rmsd_of(lambda r: r["is_pocket"]),
    "designed_site_CA_RMSD_vs_5XG0_A": rmsd_of(lambda r: r["is_designed"]),
    "max_CA_displacement_A": max(r["ca_displacement_A"] for r in rows),
    "max_CA_displacement_auth": max(rows, key=lambda r: r["ca_displacement_A"])["auth_res"],
    "catalytic_geometry_model_A": geo,
    "ligand_frame_superpose_RMSD_A": round(rmsd_mu, 3),
    "designed_residue_HEMT_contacts": lig_contacts,
    "clashes_under_2.2A": lig_clash,
}
json.dump(rep, open(f"model_compare_{LABEL}.json", "w"), indent=1)
print(json.dumps(rep, indent=1))
