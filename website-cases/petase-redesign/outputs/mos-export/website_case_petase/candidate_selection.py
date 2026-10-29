#!/usr/bin/env python3
"""Assemble the per-position evidence table used to choose redesign sites.

Inputs (all produced earlier in this run):
  native_tasks/seqfitness_*/sequence_scores.csv        (construct numbering 1..268)
  native_tasks/evomut_*/evolutionary_scores.csv        (construct numbering 1..268)
  native_tasks/structfitness_*/struct_fitness_scores.csv (construct numbering 1..268)
  analyses/ligand856_pocket_residues.csv               (author numbering)
  structures/5XG0_WT_HEMT_model.cif                    (author numbering, WT sequence)

Numbering: construct = author + 7 (tag GAGAGAM occupies construct 1..7),
           UNP = author + 29.
"""
import csv, json, math
import gemmi
import freesasa
import numpy as np

OFF_AUTH = 7      # construct -> author
OFF_UNP = 29      # author -> UniProt

SCORES = {
    "seq": "native_tasks/seqfitness_342337264870400/sequence_scores.csv",
    "evo": "native_tasks/evomut_342337268093952/evolutionary_scores.csv",
    "struct": "native_tasks/structfitness_342337277858816/struct_fitness_scores.csv",
}
MODEL = "structures/5XG0_WT_HEMT_model.pdb"

st = gemmi.read_structure(MODEL); st.setup_entities()
ch = [c for c in st[0] if c.name == "A"][0]
lig = [r for c in st[0] for r in c if r.name == "856"][0]
res = {r.seqid.num: r for r in ch if r.het_flag == "A"}
lig_atoms = [a for a in lig if a.element.name != "H"]

# --- per-residue min distance to ligand
mind = {}
for n, r in res.items():
    mind[n] = min(math.dist((a.pos.x, a.pos.y, a.pos.z), (b.pos.x, b.pos.y, b.pos.z))
                  for a in r if a.element.name != "H" for b in lig_atoms)

first_shell = sorted([n for n, d in mind.items() if d < 4.0])

# --- second shell: within 4.5 A of any first-shell heavy atom, not first shell
second = []
for n, r in res.items():
    if n in first_shell:
        continue
    dmin = 99.0
    for m in first_shell:
        for a in res[m]:
            if a.element.name == "H":
                continue
            for b in r:
                if b.element.name == "H":
                    continue
                d = math.dist((a.pos.x, a.pos.y, a.pos.z), (b.pos.x, b.pos.y, b.pos.z))
                if d < dmin:
                    dmin = d
    if dmin < 4.5:
        second.append((n, round(dmin, 2)))
second_nums = [n for n, _ in second]
second_dmin = dict(second)

# --- SASA of each residue in the complex (relative to free-residue reference)
fs = freesasa.Structure(MODEL, options={"hetatm": True})
rs = freesasa.calc(fs)
areas = rs.residueAreas()["A"]
ref = freesasa.Classifier.getStandardClassifier("protor") if hasattr(freesasa, "Classifier") else None
rel = {}
for key, ra in areas.items():
    try:
        n = int(key.split(".")[0])
    except ValueError:
        continue
    ref_area = None
    if hasattr(ra, "relativeTotal"):
        rel[n] = round(ra.relativeTotal, 3)

# --- secondary structure from the model
ssd = {}
st2 = gemmi.read_structure(MODEL)
for c in st2[0]:
    if c.name != "A":
        continue
    for r in c:
        ssd[r.seqid.num] = r.het_flag

# --- scores
tab = {}
for model, path in SCORES.items():
    d = {}
    for row in csv.DictReader(open(path)):
        mut = row["mutation"]
        wt, pos, alt = mut[0], int(mut[1:-1]), mut[-1]
        d[(pos, alt)] = float(row["score"])
    tab[model] = d

positions = sorted(set(first_shell) | set(second_nums))
rows = []
for n in positions:
    cpos = n + OFF_AUTH
    wt_aa = gemmi.find_tabulated_residue(res[n].name).one_letter_code.upper()
    rec = {"auth_res": n, "construct_pos": cpos, "unp_res": n + OFF_UNP, "wt_aa": wt_aa,
           "shell": "1st" if n in first_shell else "2nd",
           "min_dist_to_HEMT_A": round(mind[n], 2),
           "second_shell_min_dist_A": second_dmin.get(n),
           "rel_sasa": rel.get(n, None)}
    for model, d in tab.items():
        vals = {a: d.get((cpos, a)) for a in "ACDEFGHIKLMNPQRSTVWY"}
        vals = {a: v for a, v in vals.items() if v is not None}
        best_a, best_v = max(vals.items(), key=lambda kv: kv[1])
        rec[f"{model}_wt_score"] = round(vals.get(wt_aa, float("nan")), 4)
        rec[f"{model}_best_sub"] = best_a
        rec[f"{model}_best_score"] = round(best_v, 4)
        rec[f"{model}_n_positive"] = sum(1 for v in vals.values() if v > 0)
        # rank of WT among all 19 substitutions (1 = best)
        order = sorted(vals.items(), key=lambda kv: -kv[1])
        rec[f"{model}_wt_rank"] = [a for a, _ in order].index(wt_aa) + 1 if wt_aa in [a for a, _ in order] else None
    rows.append(rec)

with open("analyses/pocket_position_evidence.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
json.dump({"first_shell_auth": first_shell, "second_shell_auth": second_nums,
           "note": "construct = auth + 7; UNP = auth + 29"},
          open("analyses/pocket_shells.json", "w"), indent=1)

hdr = f"{'AUTH':>5}{'CONST':>6}{'UNP':>5} {'AA':>2} {'shell':>5}{'d_lig':>7}{'rSASA':>7}   seq(best/score)      evo                 struct"
print(hdr)
for r in rows:
    print(f"{r['auth_res']:>5}{r['construct_pos']:>6}{r['unp_res']:>5} {r['wt_aa']:>2} {r['shell']:>5}"
          f"{r['min_dist_to_HEMT_A']:>7.2f}{str(r['rel_sasa']):>7}   "
          f"{r['seq_best_sub']}{r['seq_best_score']:>6.2f}(n+{r['seq_n_positive']})   "
          f"{r['evo_best_sub']}{r['evo_best_score']:>6.2f}(n+{r['evo_n_positive']})   "
          f"{r['struct_best_sub']}{r['struct_best_score']:>6.2f}(n+{r['struct_n_positive']})")
