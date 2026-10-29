#!/usr/bin/env python
"""IMGT numbering + CDR/FR region annotation + liability motif scan for the avelumab Fv (PDB 5GRJ).

Numbering      : ANARCI (scheme=imgt), deterministic
Inputs         : data/5GRJ_{A,B}_full.fasta (entity sequences, MOS layout)
Outputs        : imgt_residue_mapping.csv/.json, imgt_annotation.json, liability_sites.csv/.json
Positional     : mos_residue_number == sequential entity position (MOS reindexes each entity from 1)
"""
import json, csv, re, os
from anarci import run_anarci

BASE = "/workspace/case02"
OUT = os.path.join(BASE, "analysis")
CHAINS = {"A": ("5GRJ_A_full", "VH"), "B": ("5GRJ_B_full", "VL")}
# first modelled residue in MOS numbering (chain B lacks entity residue 1 in the crystal)
FIRST_MODELLED = {"A": 1, "B": 2}

REGIONS = [(1, 26, "FR1-IMGT"), (27, 38, "CDR1-IMGT"), (39, 55, "FR2-IMGT"),
           (56, 65, "CDR2-IMGT"), (66, 104, "FR3-IMGT"), (105, 117, "CDR3-IMGT"),
           (118, 128, "FR4-IMGT")]


def region_of(pos):
    for a, b, name in REGIONS:
        if a <= pos <= b:
            return name
    return "unassigned"


def read_fasta(path):
    return "".join(l.strip() for l in open(path) if not l.startswith(">"))


results = {}
for chain, (sid, role) in CHAINS.items():
    seq = read_fasta(os.path.join(BASE, "data", f"{sid}.fasta"))
    out = run_anarci([(f"5GRJ_{chain}", seq)], scheme="imgt")
    numbered = out[1][0][0][0]          # list of ((position, insertion), aa) incl. gaps
    hit_table = out[3][0]
    hit_header, hit_rows = hit_table[0], hit_table[1:]
    species_rows = [dict(zip(hit_header, r)) for r in hit_rows]
    best = species_rows[0]
    rows, seq_idx = [], 0
    for (pos, ins), aa in numbered:
        if aa == "-":
            continue
        seq_idx += 1
        rows.append({
            "chain": chain, "role": role,
            "imgt_position": int(pos),
            "imgt_insertion_code": ins.strip(),
            "imgt_label": f"{int(pos)}{ins.strip()}",
            "imgt_region": region_of(int(pos)),
            "aa": aa,
            "entity_position": seq_idx,
            "mos_residue_number": seq_idx,
            "modelled_in_structure": seq_idx >= FIRST_MODELLED[chain],
        })
    assert seq_idx == len(seq), (seq_idx, len(seq))
    results[chain] = {
        "role": role, "sequence_id": sid, "length": len(seq),
        "numbering_scheme": "IMGT (ANARCI)",
        "best_chain_type_hit": {"id": best["id"], "evalue": best["evalue"],
                                "bitscore": best["bitscore"],
                                "query_start": best["query_start"], "query_end": best["query_end"]},
        "residues": rows,
    }

# ---- residue mapping CSV
with open(os.path.join(OUT, "imgt_residue_mapping.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["chain", "role", "mos_residue_number", "entity_position", "aa",
                "imgt_label", "imgt_position", "imgt_insertion_code", "imgt_region",
                "modelled_in_structure"])
    for chain, d in results.items():
        for r in d["residues"]:
            w.writerow([r["chain"], r["role"], r["mos_residue_number"], r["entity_position"],
                        r["aa"], r["imgt_label"], r["imgt_position"],
                        r["imgt_insertion_code"], r["imgt_region"],
                        r["modelled_in_structure"]])

# ---- CDR summary (IMGT) with both IMGT and MOS spans
cdr_summary = {}
for chain, d in results.items():
    cdrs = {}
    for cdr in ["CDR1-IMGT", "CDR2-IMGT", "CDR3-IMGT"]:
        sel = [r for r in d["residues"] if r["imgt_region"] == cdr]
        cdrs[cdr] = {
            "sequence": "".join(r["aa"] for r in sel),
            "imgt_positions": [sel[0]["imgt_label"], sel[-1]["imgt_label"]],
            "mos_residues": [r["mos_residue_number"] for r in sel],
            "mos_span": [sel[0]["mos_residue_number"], sel[-1]["mos_residue_number"]],
            "length": len(sel),
        }
    fr = {}
    for f in ["FR1-IMGT", "FR2-IMGT", "FR3-IMGT", "FR4-IMGT"]:
        sel = [r for r in d["residues"] if r["imgt_region"] == f]
        fr[f] = {"mos_span": [sel[0]["mos_residue_number"], sel[-1]["mos_residue_number"]],
                 "length": len(sel)}
    cdr_summary[chain] = {"role": d["role"], "cdrs": cdrs, "frameworks": fr}

# ---- liability motifs
PATTERNS = {
    "N-glycosylation (N-X-S/T, X!=P)": r"N[^P][ST]",
    "Asn deamidation (NG/NS/NH/NT)": r"N[GSHT]",
    "Asp isomerization (DG/DS/DH/DT/DD)": r"D[GSHTD]",
    "Lys hydroxylation (KG)": r"KG",
    "Met oxidation": r"M",
    "Trp oxidation": r"W",
    "Cysteine (disulfide/free-thiol context)": r"C",
    "Acidic cluster (DD/DE/ED/EE)": r"(?:DD|DE|ED|EE)",
    "Basic cluster (KK/RR)": r"(?:KK|RR)",
}
liabilities = []
for chain, (sid, role) in CHAINS.items():
    seq = read_fasta(os.path.join(BASE, "data", f"{sid}.fasta"))
    for name, pat in PATTERNS.items():
        for m in re.finditer(pat, seq):
            start, end = m.start() + 1, m.end()
            in_cdr = False
            for r in results[chain]["residues"]:
                if start <= r["entity_position"] <= end and r["imgt_region"].startswith("CDR"):
                    in_cdr = True
            liabilities.append({
                "chain": chain, "role": role, "motif": name, "match": m.group(0),
                "entity_position_start": start, "entity_position_end": end,
                "mos_position_start": start, "mos_position_end": end,
                "modelled": start >= FIRST_MODELLED[chain],
                "in_cdr": in_cdr,
            })

json.dump({"method": "ANARCI run_anarci, IMGT scheme", "chains": results,
           "cdr_summary": cdr_summary},
          open(os.path.join(OUT, "imgt_annotation.json"), "w"), indent=2)
json.dump({"patterns": PATTERNS, "hit_count": len(liabilities), "hits": liabilities,
           "note": "Motif regex scan on entity sequences; positions are 1-based entity positions "
                   "which equal MOS residue numbers."},
          open(os.path.join(OUT, "liability_sites.json"), "w"), indent=2)
with open(os.path.join(OUT, "liability_sites.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(liabilities[0].keys()))
    w.writeheader(); w.writerows(liabilities)

print(json.dumps({"cdr_summary": cdr_summary,
                  "chain_type": {c: results[c]["best_chain_type_hit"] for c in results},
                  "liability_hits": len(liabilities)}, indent=2))
