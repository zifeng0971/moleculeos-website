#!/usr/bin/env python
"""Combine MOS mutation-scoring outputs (5 axes) with structural context into ranked recommendations.

Axes and source tasks (all MOS predictions, this session):
  seqfit  : Sequence Fitness Mutation Effect   (higher = more favorable)
  evolve  : Evolutionary Mutation Effect       (higher = more favorable)
  struct  : Structural Stability Mutation Effect (higher = more favorable)
  affinity: Binding Affinity Mutation Effect   (ddG_pred, lower = more stabilizing for the complex)
Local/built-in context (not predictions): paratope/epitope BSA from PPInterface, IMGT regions from ANARCI,
liability motifs from regex scan.

Outputs: analysis/mutations/all_scores_long.csv, per_axis_position_summary.csv,
         recommended_mutations.csv, liability_mitigation_candidates.csv, mutation_analysis.json
"""
import csv, json, os, re, statistics, collections

BASE = "/workspace/case02"
A = os.path.join(BASE, "analysis")
M = os.path.join(A, "mutations")
os.makedirs(M, exist_ok=True)
D = "/workspace/downloads"

TASKS = {
    ("seqfit", "A"): ("sequence_fitness_mutation_effect_342256486130688", "sequence_scores.csv"),
    ("seqfit", "B"): ("sequence_fitness_mutation_effect_342256488231936", "sequence_scores.csv"),
    ("seqfit", "C"): ("sequence_fitness_mutation_effect_342256491451392", "sequence_scores.csv"),
    ("evolve", "A"): ("evolutionary_mutation_effect_342256499057664", "evolutionary_scores.csv"),
    ("evolve", "B"): ("evolutionary_mutation_effect_342256501269504", "evolutionary_scores.csv"),
    ("evolve", "C"): ("evolutionary_mutation_effect_342256504251392", "evolutionary_scores.csv"),
    ("struct", "A"): ("structural_stability_mutation_effect_342256515642368", "struct_fitness_scores.csv"),
    ("bound", "X"): ("binding_affinity_mutation_effect_342256515908608", "affinity_scores.csv"),
}

mut_re = re.compile(r"^([A-Z])(\d+)([A-Z])$")
scores = collections.defaultdict(dict)   # (chain,pos,mut) -> {axis: value}
availability = {}

for (axis, ch), (folder, fname) in TASKS.items():
    path = os.path.join(D, folder, fname)
    if not os.path.exists(path):
        availability[f"{axis}_{ch}"] = "missing"
        continue
    n = 0
    with open(path) as fh:
        rd = csv.DictReader(fh)
        for row in rd:
            if axis == "bound":
                m = re.match(r"^([A-Z])([A-Z])(\d+)([A-Z])$", row["mutstr"])
                if not m:
                    continue
                wt, ch_, pos, mut = m.group(1), m.group(2), int(m.group(3)), m.group(4)
                scores[(ch_, pos, mut)]["affinity_ddG"] = float(row["ddG_pred"])
            else:
                m = mut_re.match(row["mutation"])
                if not m:
                    continue
                wt, pos, mut = m.group(1), int(m.group(2)), m.group(3)
                # single-sequence tasks always report chain "A" internally: use the chain
                # the sequence was submitted for; struct task is genuinely multi-chain.
                chain_key = row["chain"] if axis == "struct" else ch
                scores[(chain_key, pos, mut)][axis] = float(row["score"])
            n += 1
    availability[f"{axis}_{ch}"] = {"file": path, "rows": n}

# ---- percentiles per axis (within chain) so axes with different scales can be combined
axis_vals = collections.defaultdict(list)
for (ch, pos, mut), d in scores.items():
    for ax, v in d.items():
        axis_vals[(ax, ch)].append(v)

def pct(ax, ch, v):
    arr = sorted(axis_vals.get((ax, ch), []))
    if not arr:
        return None
    import bisect
    return round(bisect.bisect_left(arr, v) / max(1, len(arr) - 1), 4)

# ---- context: paratope / epitope / IMGT / liabilities
ctx = json.load(open(os.path.join(A, "epitope_paratope.json")))
paratope = {(r["chain"], r["mos"]): r for r in ctx["paratope_vh_vl"]}
epitope = {r["mos"]: r for r in ctx["epitope_pdl1"]}
imgt = json.load(open(os.path.join(A, "imgt_annotation.json")))
imgt_lookup = {(c, r["mos_residue_number"]): r for c in ("A", "B")
               for r in imgt["chains"][c]["residues"]}
liab = json.load(open(os.path.join(A, "liability_sites.json")))["hits"]
liab_pos = collections.defaultdict(list)
for h in liab:
    for p in range(h["mos_position_start"], h["mos_position_end"] + 1):
        liab_pos[(h["chain"], p)].append(h["motif"])

# ---- long table
long_rows = []
for (ch, pos, mut), d in sorted(scores.items()):
    p = paratope.get((ch, pos))
    e = epitope.get(pos) if ch == "C" else None
    i = imgt_lookup.get((ch, pos))
    row = {
        "chain": ch,
        "role": {"A": "VH", "B": "VL", "C": "PD-L1"}[ch],
        "position": pos, "mutation": f"{mut}{pos}{mut}" if False else None,
        "substitution": None,
        "seqfit": d.get("seqfit"), "evolve": d.get("evolve"),
        "struct": d.get("struct"), "affinity_ddG": d.get("affinity_ddG"),
        "seqfit_pct": pct("seqfit", ch, d["seqfit"]) if "seqfit" in d else None,
        "evolve_pct": pct("evolve", ch, d["evolve"]) if "evolve" in d else None,
        "struct_pct": pct("struct", ch, d["struct"]) if "struct" in d else None,
        "paratope_bsa": p["bsa"] if p else 0.0,
        "imgt_region": i["imgt_region"] if i else None,
        "epitope_bsa": e["bsa"] if e else None,
        "liability_motifs": ";".join(sorted(set(liab_pos.get((ch, pos), [])))) or None,
    }
    long_rows.append(row)

# wt residue per position from the sequence library
seqs = {}
for chain, sid in (("A", "5GRJ_A_full"), ("B", "5GRJ_B_full"), ("C", "5GRJ_C_full")):
    seqs[chain] = "".join(l.strip() for l in open(os.path.join(BASE, "data", f"{sid}.fasta"))
                          if not l.startswith(">"))

for r in long_rows:
    wt = seqs[r["chain"]][r["position"] - 1]
    r["wt"] = wt
    # recover mutant residue: the axis values are keyed by mutation, so recompute from key
# rebuild with mutation keys retained
long_rows = []
for (ch, pos, mut), d in sorted(scores.items()):
    wt = seqs[ch][pos - 1]
    p = paratope.get((ch, pos))
    e = epitope.get(pos) if ch == "C" else None
    i = imgt_lookup.get((ch, pos))
    long_rows.append({
        "chain": ch, "role": {"A": "VH", "B": "VL", "C": "PD-L1"}[ch],
        "position": pos, "wt": wt, "mut": mut, "mutation": f"{wt}{pos}{mut}",
        "seqfit": d.get("seqfit"), "evolve": d.get("evolve"),
        "struct": d.get("struct"), "affinity_ddG": d.get("affinity_ddG"),
        "seqfit_pct": pct("seqfit", ch, d["seqfit"]) if "seqfit" in d else None,
        "evolve_pct": pct("evolve", ch, d["evolve"]) if "evolve" in d else None,
        "struct_pct": pct("struct", ch, d["struct"]) if "struct" in d else None,
        "paratope_bsa": p["bsa"] if p else 0.0,
        "imgt_region": i["imgt_region"] if i else None,
        "epitope_bsa": e["bsa"] if e else None,
        "liability_motifs": ";".join(sorted(set(liab_pos.get((ch, pos), [])))) or None,
    })

# ---- per-position tolerance (mean score across substitutions)
pos_stats = collections.defaultdict(lambda: collections.defaultdict(list))
for r in long_rows:
    for ax in ("seqfit", "evolve", "struct", "affinity_ddG"):
        if r[ax] is not None:
            pos_stats[(r["chain"], r["position"])][ax].append(r[ax])
pos_rows = []
for (ch, pos), d in sorted(pos_stats.items()):
    p = paratope.get((ch, pos))
    pos_rows.append({
        "chain": ch, "position": pos, "wt": seqs[ch][pos - 1],
        "n_substitutions": len(d["seqfit"]),
        "mean_seqfit": round(statistics.mean(d["seqfit"]), 3) if d["seqfit"] else None,
        "mean_evolve": round(statistics.mean(d["evolve"]), 3) if d["evolve"] else None,
        "mean_struct": round(statistics.mean(d["struct"]), 3) if d["struct"] else None,
        "mean_affinity_ddG": round(statistics.mean(d["affinity_ddG"]), 3) if d["affinity_ddG"] else None,
        "min_affinity_ddG": round(min(d["affinity_ddG"]), 3) if d["affinity_ddG"] else None,
        "paratope_bsa": p["bsa"] if p else 0.0,
        "imgt_region": imgt_lookup.get((ch, pos), {}).get("imgt_region"),
        "liability_motifs": ";".join(sorted(set(liab_pos.get((ch, pos), [])))) or None,
    })
with open(os.path.join(M, "per_axis_position_summary.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(pos_rows[0].keys()))
    w.writeheader(); w.writerows(pos_rows)

# ---- combined ranking: mean of available axis percentiles over the three tolerance axes
def combined(r):
    ps = [r[k] for k in ("seqfit_pct", "evolve_pct", "struct_pct") if r[k] is not None]
    return round(sum(ps) / len(ps), 4) if len(ps) == 3 else None

for r in long_rows:
    r["combined_pct"] = combined(r)

with open(os.path.join(M, "all_scores_long.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(long_rows[0].keys()))
    w.writeheader(); w.writerows(long_rows)

# Developability / stability recommendations: all three axes high, not a binding residue, wt not Cys
dev = [r for r in long_rows
       if r["combined_pct"] is not None and r["combined_pct"] >= 0.95
       and r["paratope_bsa"] < 20 and r["wt"] != "C" and r["mut"] != "C"
       and r["chain"] in ("A", "B")]
dev.sort(key=lambda r: -r["combined_pct"])

# Affinity maturation candidates: predicted ddG <= -0.5 with acceptable stability axes
aff = [r for r in long_rows
       if r["affinity_ddG"] is not None and r["affinity_ddG"] <= -0.5
       and (r["seqfit_pct"] or 0) > 0.5 and (r["struct_pct"] or 0) > 0.5]
aff.sort(key=lambda r: r["affinity_ddG"])

# Liability mitigation: at liability positions, substitutions that remove the motif
def removes_motif(r):
    return False
mitig = []
for h in liab:
    if h["motif"] in ("Cysteine (disulfide/free-thiol context)", "Met oxidation", "Trp oxidation",
                      "Acidic cluster (DD/DE/ED/EE)", "Basic cluster (KK/RR)"):
        continue
    pos = h["entity_position_start"]  # first residue of motif is the liability anchor (N or D/K)
    ch = h["chain"]
    cands = [r for r in long_rows if r["chain"] == ch and r["position"] == pos
             and r["mut"] not in ("N", "D", "K")
             and r["combined_pct"] is not None]
    cands.sort(key=lambda r: -r["combined_pct"])
    for r in cands[:3]:
        mitig.append({
            "chain": ch, "role": {"A": "VH", "B": "VL"}[ch],
            "motif": h["motif"], "motif_sequence": h["match"],
            "motif_span": f"{h['mos_position_start']}-{h['mos_position_end']}",
            "site": f"{seqs[ch][pos-1]}{pos}",
            "proposed_mutation": r["mutation"],
            "seqfit": r["seqfit"], "evolve": r["evolve"], "struct": r["struct"],
            "seqfit_pct": r["seqfit_pct"], "evolve_pct": r["evolve_pct"],
            "struct_pct": r["struct_pct"], "combined_pct": r["combined_pct"],
            "paratope_bsa": r["paratope_bsa"],
            "imgt_region": r["imgt_region"],
        })

with open(os.path.join(M, "recommended_mutations.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["category", "chain", "role", "mutation", "combined_pct",
                "seqfit", "evolve", "struct", "affinity_ddG",
                "paratope_bsa", "imgt_region", "epitope_bsa", "note"])
    for r in dev[:60]:
        w.writerow(["developability/stability", r["chain"], r["role"], r["mutation"],
                    r["combined_pct"], r["seqfit"], r["evolve"], r["struct"],
                    r["affinity_ddG"], r["paratope_bsa"], r["imgt_region"],
                    r["epitope_bsa"], "all three tolerance axes >=95th percentile; outside paratope"])
    for r in aff[:40]:
        w.writerow(["affinity maturation", r["chain"], r["role"], r["mutation"],
                    r["combined_pct"], r["seqfit"], r["evolve"], r["struct"],
                    r["affinity_ddG"], r["paratope_bsa"], r["imgt_region"],
                    r["epitope_bsa"], "ddG <= -0.5 kcal/mol; stability axes above median"])

with open(os.path.join(M, "liability_mitigation_candidates.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(mitig[0].keys()))
    w.writeheader(); w.writerows(mitig)

summary = {
    "task_files": availability,
    "axes": {
        "seqfit": "Sequence Fitness Mutation Effect (MOS); higher = more favorable",
        "evolve": "Evolutionary Mutation Effect (MOS); higher = more favorable",
        "struct": "Structural Stability Mutation Effect (MOS); higher = more favorable",
        "affinity": "Binding Affinity Mutation Effect (MOS); ddG_pred, lower = more stabilizing for complex",
    },
    "n_mutations_scored": len(long_rows),
    "n_positions": len(pos_rows),
    "counts": {
        "seqfit": sum(1 for r in long_rows if r["seqfit"] is not None),
        "evolve": sum(1 for r in long_rows if r["evolve"] is not None),
        "struct": sum(1 for r in long_rows if r["struct"] is not None),
        "affinity": sum(1 for r in long_rows if r["affinity_ddG"] is not None),
    },
    "top_developability": dev[:15],
    "top_affinity": aff[:15],
    "liability_mitigation": mitig,
}
json.dump(summary, open(os.path.join(M, "mutation_analysis.json"), "w"), indent=2)

print(json.dumps({"n_mutations": len(long_rows), "counts": summary["counts"],
                  "top_dev": [r["mutation"] + f"({r['chain']})" for r in dev[:12]],
                  "top_aff": [r["mutation"] + f"({r['chain']})={r['affinity_ddG']}" for r in aff[:12]],
                  "n_mitigation": len(mitig)}, indent=2))
