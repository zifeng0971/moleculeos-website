#!/usr/bin/env python3
"""
Chemistry audit of InteractionNet 'salt bridge' and 'H-bond' calls.

The InteractionNet table labels any close N/O pair as a salt bridge without
checking charge class. This script reads the residue identities straight from the
coordinate file and re-classifies every call:

  acidic  : ASP, GLU                       (formal -1 at pH 7)
  basic   : LYS, ARG                       (formal +1 at pH 7)
  weak    : HIS                            (partially protonated, not counted as
                                            a formal salt bridge)
  neutral : everything else

A pair is reported as a legitimate salt bridge only when it is acidic vs basic
(opposite formal charge). Same-charge pairs (e.g. ARG-ARG, GLU-ASP) are
electrostatically repulsive and must not be described as salt bridges; pairs with
a neutral partner are hydrogen bonds, not salt bridges.

Usage: python audit_chemistry.py <structure.cif> <ppi_dir> [label]
"""
import csv
import json
import sys
from collections import Counter
from pathlib import Path

import gemmi

ACIDIC = {"ASP", "GLU"}
BASIC = {"LYS", "ARG"}
WEAK = {"HIS"}


def charge_class(resname):
    if resname in ACIDIC:
        return "acidic(-1)"
    if resname in BASIC:
        return "basic(+1)"
    if resname in WEAK:
        return "weak(HIS)"
    return "neutral"


def residue_table(path):
    st = gemmi.read_structure(str(path))
    st.setup_entities()
    table = {}
    for ch in st[0]:
        for r in ch:
            if r.het_flag == "A":
                table[(ch.name, r.seqid.num)] = r.name
    return table


def audit(cif, ppi_dir, label=""):
    res = residue_table(cif)
    ppi = Path(ppi_dir)
    out = {"label": label, "structure": str(cif), "salt_bridges": [], "hbonds": []}

    sb_file = ppi / "salt_bridge.tsv"
    if sb_file.exists():
        for row in csv.DictReader(sb_file.open(), delimiter="\t"):
            c1 = res.get((row["chain1"], int(row["resnum1"])), "UNK")
            c2 = res.get((row["chain2"], int(row["resnum2"])), "UNK")
            q1, q2 = charge_class(c1), charge_class(c2)
            legitimate = {q1, q2} == {"acidic(-1)", "basic(+1)"}
            rec = {
                "chain1": row["chain1"], "resnum1": int(row["resnum1"]),
                "resname1": c1, "charge1": q1,
                "chain2": row["chain2"], "resnum2": int(row["resnum2"]),
                "resname2": c2, "charge2": q2,
                "distance_A": float(row["distance"]),
                "verdict": "salt_bridge" if legitimate else (
                    "same_charge_rejected" if q1 == q2 and q1 in
                    ("acidic(-1)", "basic(+1)") else "not_a_salt_bridge_neutral_partner"
                ),
            }
            out["salt_bridges"].append(rec)

    hb_file = ppi / "hbond.tsv"
    if hb_file.exists():
        for row in csv.DictReader(hb_file.open(), delimiter="\t"):
            out["hbonds"].append({
                "donor": f'{row["donor_chain"]}/{row["donor_res"]}{row["donor_resnum"]}',
                "acceptor": f'{row["acceptor_chain"]}/{row["acceptor_res"]}{row["acceptor_resnum"]}',
                "distance_A": float(row["distance"]),
            })

    verdicts = Counter(r["verdict"] for r in out["salt_bridges"])
    out["summary"] = {
        "salt_bridge_rows_reported": len(out["salt_bridges"]),
        "legitimate_salt_bridges": verdicts.get("salt_bridge", 0),
        "same_charge_rejected": verdicts.get("same_charge_rejected", 0),
        "not_a_salt_bridge_neutral_partner": verdicts.get("not_a_salt_bridge_neutral_partner", 0),
        "hbond_rows": len(out["hbonds"]),
    }
    return out


def main():
    cif, ppi_dir = sys.argv[1], sys.argv[2]
    label = sys.argv[3] if len(sys.argv) > 3 else ""
    result = audit(cif, ppi_dir, label)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
