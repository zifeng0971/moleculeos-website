import json, itertools, re, gemmi
st = gemmi.read_structure("/workspace/kn035_case02/raw/sanitized/MMFold_1.cif")
st.setup_entities()
st.remove_hydrogens()
m = st[0]
A = m["A"]; B = m["B"]
def resmap(ch):
    return {r.seqid.num: r for r in ch}
ra, rb = resmap(A), resmap(B)
def mindist(r1, r2):
    best = 1e9
    for a1 in r1:
        if a1.element.is_hydrogen: continue
        for a2 in r2:
            if a2.element.is_hydrogen: continue
            d = a1.pos.dist(a2.pos)
            if d < best: best = d
    return best

rec = json.load(open("/workspace/downloads/mostask_342604577018880/record.json"))
it = rec["interactions"]["2d_plot_data"][0]
rows = []
for x in it["interactions"]:
    ma = re.match(r"^([A-Z]{3})(\d+)\.([A-Za-z0-9]+)$", x["residue_key_a"])
    mb = re.match(r"^([A-Z]{3})(\d+)\.([A-Za-z0-9]+)$", x["residue_key_b"])
    na, nb = int(ma.group(2)), int(mb.group(2))
    d = mindist(ra[na], rb[nb])
    rows.append({"residue_a": x["residue_key_a"], "residue_b": x["residue_key_b"],
                 "native_type": x["type"], "native_distance": x["distance"],
                 "local_min_heavy_atom_distance": round(d, 3)})
# all pairs < 5 A
pairs = []
for i, r1 in ra.items():
    for j, r2 in rb.items():
        d = mindist(r1, r2)
        if d <= 5.0:
            pairs.append((i, j, round(d, 2)))
out = {"n_native_interactions": len(rows),
       "native_pairs_all_reproduced_within_5A": all(r["local_min_heavy_atom_distance"] <= 5.0 for r in rows),
       "max_local_distance_over_native_pairs": max(r["local_min_heavy_atom_distance"] for r in rows),
       "n_residue_pairs_within_5A_local": len(pairs),
       "n_unique_A_residues_within_5A": len({p[0] for p in pairs}),
       "n_unique_B_residues_within_5A": len({p[1] for p in pairs}),
       "pairs_within_5A": pairs,
       "native_interactions_with_local_distance": rows}
json.dump(out, open("/workspace/kn035_case02/work/contact_crosscheck.json", "w"), indent=1)
print("native interactions:", out["n_native_interactions"])
print("all native pairs <=5A locally:", out["native_pairs_all_reproduced_within_5A"], "max dist:", out["max_local_distance_over_native_pairs"])
print("local residue pairs <=5A:", out["n_residue_pairs_within_5A_local"], "unique A:", out["n_unique_A_residues_within_5A"], "unique B:", out["n_unique_B_residues_within_5A"])
print("worst 5 native pairs:", sorted(rows, key=lambda r: -r["local_min_heavy_atom_distance"])[:5])
