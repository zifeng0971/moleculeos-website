#!/usr/bin/env python3
"""Final framework single-point candidate list for KN035 case04.

Hard filters (applied to every substitution):
  F1 region == Framework                    -> excludes IMGT CDR B26-33 / B51-58 / B97-117
  F2 protected == "none"                    -> excludes all 18 paratope residues and C22/C33/C96/C106
  F3 mut != wt                              -> excludes WT->WT
  F4 no introduces_free_Cys (X->C)
  F5 no removes_disulfide_Cys (C->X)
  F6 no creates_deamidation / creates_isomerization / creates_N_glycosylation
  F7 no introduces_Met_oxidation_risk

Two acceptance levels, both recorded in the output:
  strict    : stability_delta >= 0 AND seq_fitness_delta > 0 AND evolutionary_delta > 0
  extended  : at least two of the three deltas > 0, the third >= -1.0, consensus >= 0.05
Consensus = mean of (delta / p90-|delta| of that model over framework non-WT rows),
so the three models contribute on a comparable scale instead of by raw magnitude.

Tier A = nearest paratope heavy-atom distance >= 8 A (paratope-distal)
Tier B = < 8 A (paratope-adjacent; binding risk must be tested experimentally)
"""
import csv, json, math, statistics
import gemmi

BASE = "/workspace/kn035_case04"
CIF = "/workspace/protein_data/protein_342605181223936/MMFold_1_chain_B.cif"
SEQ = "".join(open("/workspace/.mocha/seq_lib/kn035_vhh_c04_wt.fasta").read().split("\n")[1:]).strip()
PARATOPE = {27, 29, 30, 32, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116}
HALLMARK = {37, 44, 45, 47}

rows = list(csv.DictReader(open(f"{BASE}/merged_mutation_delta_table.csv")))
fw = [r for r in rows if r["region"] == "Framework" and r["protected"] == "none" and r["is_wt_self"] == "False"]

KEYS = ["stability_delta", "seq_fitness_delta", "evolutionary_delta"]
SCALES = {k: statistics.quantiles([abs(float(r[k])) for r in fw], n=10)[8] for k in KEYS}
BAN = {"introduces_free_Cys", "removes_disulfide_Cys", "creates_deamidation",
       "creates_isomerization", "creates_N_glycosylation", "introduces_Met_oxidation_risk"}

# geometry
ch = gemmi.read_structure(CIF)[0][0]
rm = {r.seqid.num: r for r in ch}


def nearest_paratope(i):
    best = (99.0, None)
    for j in PARATOPE:
        for x in rm[i]:
            for y in rm[j]:
                d = math.dist([x.pos.x, x.pos.y, x.pos.z], [y.pos.x, y.pos.y, y.pos.z])
                if d < best[0]:
                    best = (d, j)
    return best


rel_sasa = {int(r["pos"]): float(r["rel_sasa"]) for r in csv.DictReader(open(f"{BASE}/residue_exposure.csv"))}

pool = []
for r in fw:
    flags = set(f for f in r["risk_flags"].split(";") if f)
    if flags & BAN:
        continue
    d = {k: float(r[k]) for k in KEYS}
    comps = [d[k] / SCALES[k] for k in KEYS]
    cons = sum(comps) / 3
    npos = sum(1 for k in KEYS if d[k] > 0)
    nneg = sum(1 for k in KEYS if d[k] < 0)
    if d["stability_delta"] >= 0 and d["seq_fitness_delta"] > 0 and d["evolutionary_delta"] > 0:
        level = "strict"
    elif npos >= 2 and min(d.values()) >= -1.0 and cons >= 0.05:
        level = "extended"
    else:
        continue
    i = int(r["pos"])
    dist, pid = nearest_paratope(i)
    pool.append({"pos": i, "wt": r["wt"], "mut": r["mut"], "mutation": f"B:{r['wt']}{i}{r['mut']}",
                 "acceptance": level, "tier": "A_paratope_distal" if dist >= 8.0 else "B_paratope_adjacent",
                 **{k: round(d[k], 4) for k in KEYS}, "consensus": round(cons, 3),
                 "risk_flags": r["risk_flags"] or "none",
                 "rel_sasa": rel_sasa[i],
                 "nearest_paratope_res": f"{SEQ[pid-1]}{pid}",
                 "nearest_paratope_dist_A": round(dist, 2),
                 "vhh_hallmark": i in HALLMARK})

# keep the best substitution per position, but allow up to 2 per position for the two best positions
pool.sort(key=lambda c: (c["tier"] != "A_paratope_distal", -c["consensus"]))
final, per_pos = [], {}
for c in pool:
    if per_pos.get(c["pos"], 0) >= 2:
        continue
    per_pos[c["pos"]] = per_pos.get(c["pos"], 0) + 1
    final.append(c)
    if len(final) >= 10:
        break
final.sort(key=lambda c: (c["tier"], -c["consensus"]))

with open(f"{BASE}/candidates_final.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(final[0].keys()))
    w.writeheader(); w.writerows(final)

print(json.dumps({"scales_p90": SCALES, "pool_size": len(pool),
                  "tierA": sum(1 for c in final if c["tier"].startswith("A")),
                  "tierB": sum(1 for c in final if c["tier"].startswith("B"))}, indent=2))
for c in final:
    print(c["tier"], c["mutation"], c["acceptance"], c["consensus"],
          c["stability_delta"], c["seq_fitness_delta"], c["evolutionary_delta"],
          f"relSASA={c['rel_sasa']}", f"{c['nearest_paratope_res']}@{c['nearest_paratope_dist_A']}A",
          c["risk_flags"])
