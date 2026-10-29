#!/usr/bin/env python3
"""Superpose wild-type 5XG0 (chain C) onto the 5XH3 R103G/S131A complex (chain A).

Deterministic superposition with gemmi (no MOS Superimpose task exists in this
environment).  Mapping is established by author residue number after verifying
that both chains carry the same 261-residue mature sequence (only auth 103 and
auth 131 differ).  Outputs:
  superpose_5xg0_5xh3_residue_map.csv   per-residue CA correspondence + deviation
  superpose_5xg0_5xh3_summary.json      global / pocket / catalytic RMSDs
"""
import csv, json, math
import gemmi
import numpy as np

WT = "../inputs/5XG0.cif"
MUT = "../inputs/5XH3.cif"
OFFSET = 29
POCKET_AUTH = [57, 58, 60, 130, 131, 132, 156, 179, 208]      # from ligand856_pocket_residues.csv
CATALYTIC_AUTH = [131, 177, 208]
OXYANION_AUTH = [58, 132]                                     # backbone N donors (UNP Y87, M161)
DISULFIDE_AUTH = [(174, 210), (244, 260)]


def chain(path, name):
    st = gemmi.read_structure(path)
    st.setup_entities()
    return [c for c in st[0] if c.name == name][0]


wt = chain(WT, "C")
mu = chain(MUT, "A")
wt_res = {r.seqid.num: r for r in wt if r.het_flag == "A"}
mu_res = {r.seqid.num: r for r in mu if r.het_flag == "A"}
common = sorted(set(wt_res) & set(mu_res))
assert len(common) == 261, len(common)

# sanity: same sequence apart from the two engineered substitutions
wtseq = "".join(gemmi.find_tabulated_residue(wt_res[i].name).one_letter_code for i in common).upper()
museq = "".join(gemmi.find_tabulated_residue(mu_res[i].name).one_letter_code for i in common).upper()
diffs = [(i + 1, a, b) for i, (a, b) in enumerate(zip(wtseq, museq)) if a != b]
assert diffs == [(103, "R", "G"), (131, "S", "A")], diffs

# superpose on backbone CA using all matched residues
wt_ca = np.array([[wt_res[i].find_atom("CA", "*").pos.x, wt_res[i].find_atom("CA", "*").pos.y, wt_res[i].find_atom("CA", "*").pos.z] for i in common])
mu_ca = np.array([[mu_res[i].find_atom("CA", "*").pos.x, mu_res[i].find_atom("CA", "*").pos.y, mu_res[i].find_atom("CA", "*").pos.z] for i in common])
sup = gemmi.superpose_positions([gemmi.Position(*p) for p in wt_ca.tolist()], [gemmi.Position(*p) for p in mu_ca.tolist()])

# transform WT coordinates into the 5XH3 frame
def tf(p):
    v = sup.transform.inverse().apply(gemmi.Vec3(p[0], p[1], p[2]))  # gemmi transform maps set2->set1
    return gemmi.Position(v.x, v.y, v.z)

rows = []
for i in common:
    a = wt_res[i].find_atom("CA", "*").pos
    b = mu_res[i].find_atom("CA", "*").pos
    q = tf((a.x, a.y, a.z))
    dev = math.dist((q.x, q.y, q.z), (b.x, b.y, b.z))
    rows.append({"auth_res": i, "unp_res": i + OFFSET,
                 "wt_resname": gemmi.find_tabulated_residue(wt_res[i].name).one_letter_code.upper(),
                 "x5h3_resname": gemmi.find_tabulated_residue(mu_res[i].name).one_letter_code.upper(),
                 "wt_ca_x": round(a.x, 3), "wt_ca_y": round(a.y, 3), "wt_ca_z": round(a.z, 3),
                 "x5h3_ca_x": round(b.x, 3), "x5h3_ca_y": round(b.y, 3), "x5h3_ca_z": round(b.z, 3),
                 "ca_dev_after_superpose_A": round(dev, 3),
                 "is_pocket": int(i in POCKET_AUTH),
                 "is_catalytic": int(i in CATALYTIC_AUTH)})
with open("superpose_5xg0_5xh3_residue_map.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

devs = np.array([r["ca_dev_after_superpose_A"] for r in rows])
pk = np.array([r["ca_dev_after_superpose_A"] for r in rows if r["is_pocket"]])
cat = np.array([r["ca_dev_after_superpose_A"] for r in rows if r["is_catalytic"]])

# whole-chain RMSD recomputed from the per-residue deviations
def rmsd(v):
    return float(np.sqrt(np.mean(np.square(v))))

# disulfides and catalytic geometry in the WT structure (5XG0 chain C)
def dist(res1, at1, res2, at2):
    p1 = wt_res[res1].find_atom(at1, "*").pos
    p2 = wt_res[res2].find_atom(at2, "*").pos
    return round(math.dist((p1.x, p1.y, p1.z), (p2.x, p2.y, p2.z)), 3)

wt_geo = {
    "catalytic_Ser131_OG__His208_NE2_A": dist(131, "OG", 208, "NE2"),
    "catalytic_His208_ND1__Asp177_OD1_A": dist(208, "ND1", 177, "OD1"),
    "catalytic_His208_ND1__Asp177_OD2_A": dist(208, "ND1", 177, "OD2"),
    "oxyanion_Tyr58_N__Ser131_OG_A": dist(58, "N", 131, "OG"),
    "oxyanion_Met132_N__Ser131_OG_A": dist(132, "N", 131, "OG"),
}
for a, b in DISULFIDE_AUTH:
    wt_geo[f"disulfide_Cys{a}_SG__Cys{b}_SG_A"] = dist(a, "SG", b, "SG")

# mutation site geometry in 5XH3 (S131A -> CB where OG would be) vs ligand 856
lh = gemmi.read_structure(MUT)[0]
lg = [r for c in lh for r in c if r.name == "856"][0]
def lig_min(cb, exclude_h=True):
    d = min(math.dist((cb.x, cb.y, cb.z), (a.pos.x, a.pos.y, a.pos.z)) for a in lg if a.element.name != "H")
    return round(d, 3)
al31 = mu_res[131].find_atom("CB", "*").pos
wt_ser_og = tf(tuple([wt_res[131].find_atom("OG", "*").pos.x, wt_res[131].find_atom("OG", "*").pos.y, wt_res[131].find_atom("OG", "*").pos.z]))
summary = {
    "method": "gemmi.Superpose.ca_align on 261 matched CA atoms (Mocha built-in, deterministic)",
    "wt_structure": "5XG0 chain C (author -6..261, mature 1..261)",
    "mutant_structure": "5XH3 chain A (author 1..261, R103G/S131A, ligand 856)",
    "matched_CA": len(common),
    "sequence_differences": diffs,
    "global_ca_rmsd_A": round(rmsd(devs), 3),
    "global_ca_rmsd_A_median_dev": round(float(np.median(devs)), 3),
    "global_ca_max_dev_A": round(float(devs.max()), 3),
    "global_ca_max_dev_auth": int(rows[int(devs.argmax())]["auth_res"]),
    "pocket_ca_rmsd_A": round(rmsd(pk), 3),
    "pocket_ca_max_dev_A": round(float(pk.max()), 3),
    "catalytic_ca_rmsd_A": round(rmsd(cat), 3),
    "wt_catalytic_geometry_A": wt_geo,
    "x5h3_Ala131_CB_min_dist_to_ligand_A": lig_min(al31),
    "wt_Ser131_OG_after_superpose_min_dist_to_ligand_A": lig_min(wt_ser_og),
    "wt_Ser131_OG_after_superpose_xyz": [round(v, 3) for v in (wt_ser_og.x, wt_ser_og.y, wt_ser_og.z)],
}
json.dump(summary, open("superpose_5xg0_5xh3_summary.json", "w"), indent=1)
print(json.dumps(summary, indent=1))
print("\nresidues with CA deviation > 1.0 A:")
for r in rows:
    if r["ca_dev_after_superpose_A"] > 1.0:
        print(f"  AUTH{r['auth_res']:>4} UNP{r['unp_res']:>4} {r['wt_resname']} dev {r['ca_dev_after_superpose_A']:.2f}")
