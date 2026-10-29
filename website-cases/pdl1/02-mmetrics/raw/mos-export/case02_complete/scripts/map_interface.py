#!/usr/bin/env python
"""Map the avelumab/PD-L1 interface (PDB 5GRJ) onto chains, IMGT regions and UniProt numbering.

Inputs (all produced in this session):
  analysis/if_VH_PDL1/residues.tsv  , if_VH_PDL1/hbond.tsv
  analysis/if_VL_PDL1/residues.tsv  , if_VL_PDL1/hbond.tsv
  analysis/imgt_annotation.json     (ANARCI IMGT numbering)
  data/5GRJ_C_full.fasta , data/Q9NZQ7.fasta
Outputs:
  analysis/epitope_paratope.json, epitope_paratope.csv, interface_summary.json
"""
import json, csv, os
from Bio import Align
from Bio.Align import substitution_matrices

BASE = "/workspace/case02"
A = os.path.join(BASE, "analysis")


def read_fasta(p):
    return "".join(l.strip() for l in open(p) if not l.startswith(">"))


def read_tsv(p):
    with open(p) as fh:
        return list(csv.DictReader(fh, delimiter="\t"))


# ---------- PD-L1 chain C -> UniProt Q9NZQ7 numbering ----------
pl = read_fasta(os.path.join(BASE, "data/5GRJ_C_full.fasta"))
up = read_fasta(os.path.join(BASE, "data/Q9NZQ7.fasta"))
al = Align.PairwiseAligner()
al.substitution_matrix = substitution_matrices.load("BLOSUM62")
al.open_gap_score, al.extend_gap_score = -10, -0.5
al.mode = "global"
best = al.align(pl, up)[0]
blocks = best.aligned
c2u = {}
for (c0, c1), (u0, u1) in zip(blocks[0], blocks[1]):
    for k in range(c1 - c0):
        c2u[c0 + k + 1] = int(u0 + k + 1)
assert len(c2u) == len(pl)
json.dump({"chain_C_to_uniprot": {str(k): v for k, v in c2u.items()},
           "alignment_score": best.score},
          open(os.path.join(A, "chainC_Q9NZQ7_mapping.json"), "w"), indent=2)

# ---------- IMGT annotation ----------
imgt = json.load(open(os.path.join(A, "imgt_annotation.json")))
ab_lookup = {}
for chain in ("A", "B"):
    for r in imgt["chains"][chain]["residues"]:
        ab_lookup[(chain, r["mos_residue_number"])] = r

# ---------- interface residue tables ----------
pairs = {"A:C": ("VH", "PD-L1"), "B:C": ("VL", "PD-L1")}
dirs = {"A:C": "if_VH_PDL1", "B:C": "if_VL_PDL1"}
summary = {}
epitope, paratope = {}, {}
for pair, d in dirs.items():
    rows = read_tsv(os.path.join(A, d, "residues.tsv"))
    hb = read_tsv(os.path.join(A, d, "hbond.tsv"))
    ab_chain = pair.split(":")[0]
    bsa_c = sum(float(r["bsa"]) for r in rows if r["chain"] == "C")
    bsa_ab = sum(float(r["bsa"]) for r in rows if r["chain"] == ab_chain)
    summary[pair] = {
        "hv_side": pairs[pair][0],
        "n_pdl1_residues": sum(1 for r in rows if r["chain"] == "C"),
        "n_ab_residues": sum(1 for r in rows if r["chain"] == ab_chain),
        "bsa_pdl1_A2": round(bsa_c, 1),
        "bsa_ab_A2": round(bsa_ab, 1),
        "bsa_total_A2": round(bsa_c + bsa_ab, 1),
        "hbonds": hb,
        "n_hbonds": len(hb),
    }
    for r in rows:
        if r["chain"] == "C":
            k = int(r["res_num"])
            epitope.setdefault(k, {"res": r["res_type"], "mos": k,
                                   "uniprot": c2u[k], "bsa": 0.0, "delta_g": 0.0,
                                   "hbond": False, "partner": []})
            epitope[k]["bsa"] += float(r["bsa"])
            epitope[k]["delta_g"] = min(epitope[k]["delta_g"], float(r["delta_g"]))
            epitope[k]["hbond"] = epitope[k]["hbond"] or r["has_hbond"] == "Y"
            epitope[k]["partner"].append(pairs[pair][0])
        else:
            k = int(r["res_num"])
            ann = ab_lookup.get((r["chain"], k), {})
            paratope.setdefault((r["chain"], k), {
                "chain": r["chain"], "role": pairs[pair][0], "mos": k,
                "res": r["res_type"], "imgt": ann.get("imgt_label"),
                "region": ann.get("imgt_region"),
                "bsa": 0.0, "delta_g": 0.0, "hbond": False})
            paratope[(r["chain"], k)]["bsa"] += float(r["bsa"])
            paratope[(r["chain"], k)]["delta_g"] = min(
                paratope[(r["chain"], k)]["delta_g"], float(r["delta_g"]))
            paratope[(r["chain"], k)]["hbond"] = paratope[(r["chain"], k)]["hbond"] or r["has_hbond"] == "Y"

# ---------- per-CDR paratope usage ----------
cdr_usage = {}
for ch, role in (("A", "VH"), ("B", "VL")):
    usage = {}
    for (chain, k), v in paratope.items():
        if chain != ch:
            continue
        reg = v["region"] or "unassigned"
        u = usage.setdefault(reg, {"n_residues": 0, "bsa": 0.0, "positions": []})
        u["n_residues"] += 1
        u["bsa"] += v["bsa"]
        u["positions"].append(f"{v['res']}{k}")
    for reg in usage:
        usage[reg]["bsa"] = round(usage[reg]["bsa"], 1)
    cdr_usage[role] = dict(sorted(usage.items()))

# ---------- PD-L1 domain assignment ----------
def pdl1_domain(u):
    # UniProt Q9NZQ7 DOMAIN features: Ig-like V-type 19-127, Ig-like C2-type 128-225
    return "IgV (UniProt 19-127)" if u <= 127 else "IgC (UniProt 128-225)"


epi_rows = sorted(epitope.values(), key=lambda x: -x["bsa"])
for r in epi_rows:
    r["bsa"] = round(r["bsa"], 1)
    r["partners"] = sorted(set(r["partner"]))
    r.pop("partner")
    r["pdl1_domain"] = pdl1_domain(r["uniprot"])
    r["in_igv"] = r["uniprot"] <= 127

para_rows = sorted(paratope.values(), key=lambda x: -x["bsa"])
for r in para_rows:
    r["bsa"] = round(r["bsa"], 1)

out = {
    "structure": "5GRJ (MOS sanitized, chains A=VH, B=VL, C=PD-L1)",
    "provenance": "InteractionNet (contacts) + PPInterface (burial) via interaction-analysis skill",
    "interfaces": summary,
    "epitope_pdl1": epi_rows,
    "paratope_vh_vl": para_rows,
    "cdr_usage": cdr_usage,
    "totals": {
        "epitope_residues": len(epi_rows),
        "epitope_igv_residues": sum(1 for r in epi_rows if r["in_igv"]),
        "paratope_residues": len(para_rows),
        "bsa_total_A2": round(sum(v["bsa_total_A2"] for v in summary.values()) / 1.0, 1),
        "hbonds_total": sum(v["n_hbonds"] for v in summary.values()),
    },
}
json.dump(out, open(os.path.join(A, "epitope_paratope.json"), "w"), indent=2)

with open(os.path.join(A, "epitope_paratope.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["side", "chain", "role", "mos_residue", "aa", "uniprot_position",
                "imgt_label", "imgt_region", "bsa_A2", "delta_g_kcal_mol", "hbond", "note"])
    for r in epi_rows:
        w.writerow(["epitope", "C", "PD-L1", r["mos"], r["res"], r["uniprot"], "", "",
                    r["bsa"], r["delta_g"], r["hbond"],
                    f"{r['pdl1_domain']}; partners={','.join(r['partners'])}"])
    for r in para_rows:
        w.writerow(["paratope", r["chain"], r["role"], r["mos"], r["res"], "",
                    r["imgt"], r["region"], r["bsa"], r["delta_g"], r["hbond"], ""])

print(json.dumps({"interfaces": {k: {kk: vv for kk, vv in v.items() if kk != 'hbonds'}
                                 for k, v in summary.items()},
                  "cdr_usage": cdr_usage, "totals": out["totals"]}, indent=2))
