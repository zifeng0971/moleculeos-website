#!/usr/bin/env python3
"""Local sequence-liability scan for KN035 VHH chain B (MMFold_1_chain_B.cif).

Motif rules (sequence-level, deterministic):
  - Deamidation: N followed by G/S/H/A/T/D/E (NG most labile); also Q-G (slow)
  - Isomerization (iso-Asp / succinimide): D followed by G/S/H/T/D/A
  - Oxidation: M, W, H (and free Cys) -- flagged always, annotated with relative SASA
  - N-glycosylation sequon: N-X-S/T, X != P
All calls are LOCAL, rule-based predictions -- not experimental measurements.
Relative SASA from Shrake-Rupley on the chain-B model (single-chain, so it is a
model-context exposure estimate, not a real solvent environment).
"""
import csv, json
import gemmi
from Bio.PDB import MMCIFParser, ShrakeRupley

CIF = "/workspace/protein_data/protein_342605181223936/MMFold_1_chain_B.cif"
OUT = "/workspace/kn035_case04"

blk = gemmi.cif.read(CIF).sole_block()
seq = blk.find_value('_entity_poly.pdbx_seq_one_letter_code')

# --- relative SASA (Shrake-Rupley) ---
parser = MMCIFParser(QUIET=True)
structure = parser.get_structure("kn035", CIF)
structure[0].hetatm = False
sr = ShrakeRupley()
sr.compute(structure, level="R")
sasa = {}
for res in structure[0]["B"]:
    sasa[res.id[1]] = res.sasa
# max reference SASA per residue type (Tien et al. 2013, theoretical)
MAX_SASA = {'A':129,'R':274,'N':195,'D':193,'C':167,'Q':225,'E':223,'G':84,'H':224,
            'I':197,'L':201,'K':236,'M':224,'F':240,'P':159,'S':130,'T':142,'W':285,
            'Y':263,'V':174}

rows = []
for i, aa in enumerate(seq, start=1):
    nxt = seq[i] if i < len(seq) else '-'
    nxt2 = seq[i+1] if i+1 < len(seq) else '-'
    rsasa = sasa.get(i, 0.0) / MAX_SASA[aa] if aa in MAX_SASA else 0.0
    liabilities = []

    if aa == 'N' and nxt in 'GSHATDE':
        sev = "high" if nxt == 'G' else ("medium" if nxt in 'SH' else "low")
        liabilities.append(("Deamidation", f"N{i}{nxt}", sev,
                            f"NG motif (fastest deamidation)" if nxt == 'G' else f"N{nxt} motif"))
    if aa == 'Q' and nxt == 'G':
        liabilities.append(("Deamidation", f"Q{i}G", "low", "QG motif, slow deamidation"))
    if aa == 'D' and nxt in 'GSHTDA':
        sev = "high" if nxt == 'G' else "medium"
        liabilities.append(("Isomerization", f"D{i}{nxt}", sev,
                            "DG motif, classic iso-Asp/succinimide hotspot" if nxt == 'G' else f"D{nxt} motif"))
    if aa in 'MW':
        liabilities.append(("Oxidation", f"{aa}{i}", "medium" if aa == 'M' else "low",
                            f"{aa} oxidation-sensitive; relSASA={rsasa:.2f}"))
    if aa == 'H' and rsasa > 0.25:
        liabilities.append(("Oxidation", f"H{i}", "low", f"His oxidation sensitive when exposed; relSASA={rsasa:.2f}"))
    if aa == 'C':
        liabilities.append(("Free_Cys_check", f"C{i}", "none", "disulfide-paired Cys (see disulfide map)"))
    if aa == 'N' and nxt != 'P' and nxt2 in 'ST':
        liabilities.append(("N_glycosylation", f"N{i}{nxt}{nxt2}", "high",
                            "N-X-S/T sequon (X!=P) — potential N-glycan site if expressed in eukaryotic host"))

    for cl, motif, sev, note in liabilities:
        rows.append({"pos": i, "aa": aa, "relSASA": round(rsasa, 3),
                     "liability_class": cl, "motif": motif, "severity": sev, "note": note})

with open(f"{OUT}/risk_scan_local.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["pos", "aa", "relSASA", "liability_class", "motif", "severity", "note"])
    w.writeheader(); w.writerows(rows)

# per-residue exposure table
with open(f"{OUT}/residue_exposure.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["pos", "aa", "abs_sasa_A2", "rel_sasa"])
    for i, aa in enumerate(seq, start=1):
        w.writerow([i, aa, round(sasa.get(i, 0.0), 1), round(sasa.get(i, 0.0)/MAX_SASA[aa], 3)])

print(json.dumps({"n_liabilities": len(rows),
                  "by_class": {c: sum(1 for r in rows if r["liability_class"] == c)
                               for c in sorted({r["liability_class"] for r in rows})}}, indent=1))
for r in rows:
    if r["liability_class"] in ("Deamidation", "Isomerization", "N_glycosylation"):
        print(r)
