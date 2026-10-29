#!/usr/bin/env python3
"""Merge the three MOS mutation-effect tables into one delta table against the WT baseline.

Direction evidence (recorded, not assumed):
  Every WT->WT entry scores exactly 0.0 in both Structural Stability and Sequence
  Fitness tables; WT is the per-position maximum at 68/128 (stability) and 72/128
  (sequence fitness) positions and is never the minimum.  => higher score = more
  favorable, delta = score_mut - 0.0 = score_mut.

Outputs:
  merged_mutation_delta_table.csv  (all 128x20 rows, protections + deltas + risk flags)
  wt_baseline.csv                  (per-position WT score per model)
"""
import csv, json, os, sys
from collections import defaultdict

BASE = "/workspace/kn035_case04"
SEQ = "".join(open("/workspace/.mocha/seq_lib/kn035_vhh_c04_wt.fasta").read().split("\n")[1:]).strip()
assert len(SEQ) == 128

FILES = {
    "stability": f"{BASE}/raw/struct_fitness_scores.csv",
    "seq_fitness": f"{BASE}/raw/sequence_scores.csv",
    "evolutionary": f"{BASE}/raw/evolutionary_scores.csv",
}
missing = [k for k, v in FILES.items() if not os.path.exists(v)]
if missing:
    print("MISSING:", missing)


def load(path):
    d = defaultdict(dict)
    if not os.path.exists(path):
        return None
    for r in csv.DictReader(open(path)):
        mut = r["mutation"]
        pos = int(mut[1:-1]); aa = mut[-1]
        d[pos][aa] = float(r["score"])
    return d


data = {k: load(v) for k, v in FILES.items()}

CDR1 = set(range(26, 34)); CDR2 = set(range(51, 59)); CDR3 = set(range(97, 118))
PARATOPE = {27, 29, 30, 32, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116}
CYS = {22, 33, 96, 106}
DISULFIDE = {22: 96, 33: 106, 96: 22, 106: 33}
AA = "ACDEFGHIKLMNPQRSTVWY"


def region(i):
    if i in CDR1: return "CDR1"
    if i in CDR2: return "CDR2"
    if i in CDR3: return "CDR3"
    return "Framework"


def protections(i):
    p = []
    if region(i) != "Framework": p.append("IMGT_CDR")
    if i in PARATOPE: p.append("Paratope")
    if i in CYS: p.append("Disulfide_Cys")
    return p or ["none"]


def risk_flags(pos, wt, mut):
    """flags that a substitution CREATES a new liability motif, or removes a native disulfide."""
    f = []
    s = list(SEQ); s[pos - 1] = mut; s = "".join(s)
    i = pos - 1
    nxt = s[i + 1] if i + 1 < len(s) else "-"
    nxt2 = s[i + 2] if i + 2 < len(s) else "-"
    if mut == 'N' and nxt in 'GSHATDE': f.append("creates_deamidation")
    if mut == 'D' and nxt in 'GSHTDA': f.append("creates_isomerization")
    if mut == 'N' and nxt != 'P' and nxt2 in 'ST': f.append("creates_N_glycosylation")
    if wt == 'C': f.append("removes_disulfide_Cys")
    if mut == 'C' and wt != 'C': f.append("introduces_free_Cys")
    if wt == 'M' and mut != 'M': f.append("removes_oxidation_Met")
    if mut == 'M' and wt != 'M': f.append("introduces_Met_oxidation_risk")
    return f


rows = []
wt_base = []
for pos in range(1, 129):
    wt = SEQ[pos - 1]
    rec_base = {"pos": pos, "wt": wt, "region": region(pos),
                "protected": ";".join(protections(pos)),
                "wt_score_stability": None, "wt_score_seq_fitness": None,
                "wt_score_evolutionary": None}
    for m in AA:
        rec = {"pos": pos, "wt": wt, "mut": m, "region": region(pos),
               "protected": ";".join(protections(pos)),
               "is_wt_self": (m == wt)}
        ok = True
        for k in FILES:
            d = data[k]
            if d is None:
                rec[k + "_score"] = ""; rec[k + "_delta"] = ""
                ok = False
                continue
            if pos not in d or m not in d[pos]:
                rec[k + "_score"] = ""; rec[k + "_delta"] = ""
                continue
            sc = d[pos][m]
            rec[k + "_score"] = round(sc, 4)
            rec[k + "_delta"] = round(sc - d[pos][wt], 4)
            if k + "_wt" not in rec_base or True:
                pass
        for k in FILES:
            d = data[k]
            if d is not None and pos in d and wt in d[pos]:
                rec_base["wt_score_" + {"stability": "stability", "seq_fitness": "seq_fitness",
                                        "evolutionary": "evolutionary"}[k]] = round(d[pos][wt], 4)
        rec["risk_flags"] = ";".join(risk_flags(pos, wt, m))
        rows.append(rec)
    wt_base.append(rec_base)

DELTA_COLS = ["stability_delta", "seq_fitness_delta", "evolutionary_delta"]
with open(f"{BASE}/merged_mutation_delta_table.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    w.writeheader(); w.writerows(rows)
with open(f"{BASE}/wt_baseline.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(wt_base[0].keys()))
    w.writeheader(); w.writerows(wt_base)

# direction diagnostics
diag = {"n_rows": len(rows), "models_present": [k for k in FILES if data[k] is not None]}
for k in FILES:
    d = data[k]
    if d is None: continue
    wtmax = sum(1 for p in range(1, 129) if d[p][SEQ[p - 1]] == max(d[p].values()))
    wtmin = sum(1 for p in range(1, 129) if d[p][SEQ[p - 1]] == min(d[p].values()))
    zeros = sum(1 for p in range(1, 129) if abs(d[p][SEQ[p - 1]]) < 1e-9)
    diag[k] = {"wt_is_position_max": wtmax, "wt_is_position_min": wtmin,
               "wt_score_exactly_zero": zeros, "n_positions": 128}
json.dump(diag, open(f"{BASE}/direction_evidence.json", "w"), indent=2)
print(json.dumps(diag, indent=2))
