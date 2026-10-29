#!/usr/bin/env python3
"""Case03 affinity candidates x case04 three-model developability cross-evaluation.

Input: the 10 single-point B-chain mutations supplied by the user with their raw
ddG_pred strings from case03. NOTHING is recomputed for affinity; the ddG_pred
strings are carried through VERBATIM and no unit is asserted (the tool did not
state one).
"""
import csv, json, math, statistics
import gemmi
from Bio.PDB import MMCIFParser, ShrakeRupley

BASE = "/workspace/kn035_case04"
CIF = "/workspace/protein_data/protein_342605181223936/MMFold_1_chain_B.cif"
SEQ = "".join(open("/workspace/.mocha/seq_lib/kn035_vhh_c04_wt.fasta").read().split("\n")[1:]).strip()
PARATOPE = {27, 29, 30, 32, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116}
CDR = set(range(26, 34)) | set(range(51, 59)) | set(range(97, 118))
CYS = {22, 33, 96, 106}
DISULFIDE = {22: 96, 33: 106, 96: 22, 106: 33}

# user-supplied, verbatim (including digit strings) -- do not reorder digits
INPUTS = [
    ("03-A1", "B:A35W", "-1.7464554", "case03 top-1 (user-reported)"),
    ("03-A2", "B:V109L", "-1.6510735", "case03 top-2 (user-reported)"),
    ("03-A3", "B:A35Y", "-1.5832196", "case03 top-3 (user-reported)"),
    ("03-B4", "B:A35F", "-1.5236144", "case03 comparison"),
    ("03-B5", "B:V109W", "-1.5057821", "case03 comparison"),
    ("03-B6", "B:C33Y", "-1.4980912", "case03 comparison"),
    ("03-B7", "B:Q116M", "-1.4936166", "case03 comparison"),
    ("03-B8", "B:A97F", "-1.4836845", "case03 comparison"),
    ("03-B9", "B:A35S", "-1.4654148", "case03 comparison"),
    ("03-B10", "B:Q116K", "-1.4106131", "case03 comparison"),
    ("03-B11", "B:T105L", None, "case03 interface-priority follow-up; ddG not synced from the affinity table - left null pending user's local merge"),
]

# Case03 structure status as corrected by the user: only A35W, V109L, C33Y, Q116M, T105L
# have case03 MMFold runs. A35Y exists ONLY in the scoring table - it must not be
# described as structurally validated anywhere.
CASE03_STRUCT = {
    "B:A35W": "case03 MMFold completed (user-reported)",
    "B:V109L": "case03 MMFold completed (user-reported)",
    "B:C33Y": "case03 MMFold completed (user-reported)",
    "B:Q116M": "case03 MMFold completed (user-reported, interface-priority follow-up)",
    "B:T105L": "case03 MMFold completed (user-reported, interface-priority follow-up)",
}

rows = {}
for r in csv.DictReader(open(f"{BASE}/merged_mutation_delta_table.csv")):
    rows[(int(r["pos"]), r["mut"])] = r

FW = [r for r in rows.values() if r["region"] == "Framework" and r["protected"] == "none" and r["is_wt_self"] == "False"]
KEYS = ["stability_delta", "seq_fitness_delta", "evolutionary_delta"]
SCALES = {k: statistics.quantiles([abs(float(r[k])) for r in FW], n=10)[8] for k in KEYS}

ch = gemmi.read_structure(CIF)[0][0]
rm = {r.seqid.num: r for r in ch}
st = MMCIFParser(QUIET=True).get_structure("k", CIF)
ShrakeRupley().compute(st, level="R")
sasa = {r.id[1]: r.sasa for r in st[0]["B"]}
MAX = {'A':129,'R':274,'N':195,'D':193,'C':167,'Q':225,'E':223,'G':84,'H':224,'I':197,'L':201,'K':236,'M':224,'F':240,'P':159,'S':130,'T':142,'W':285,'Y':263,'V':174}


def ca(i):
    a = rm[i].find_atom("CA", "*")
    return [a.pos.x, a.pos.y, a.pos.z]


def nearest_paratope(i):
    best = (99.0, None)
    for j in PARATOPE:
        if j == i: continue
        for x in rm[i]:
            for y in rm[j]:
                d = math.dist([x.pos.x, x.pos.y, x.pos.z], [y.pos.x, y.pos.y, y.pos.z])
                if d < best[0]: best = (d, j)
    return best


def motif_scan(pos, mut):
    s = list(SEQ); s[pos - 1] = mut; s = "".join(s)
    i = pos - 1
    nxt = s[i + 1] if i + 1 < len(s) else "-"
    nxt2 = s[i + 2] if i + 2 < len(s) else "-"
    new, removed = [], []
    if i > 0:
        pre = s[i - 1]
        if pre == 'N' and nxt in 'GSHATDE': new.append(f"deamidation N{pos}{nxt}")
        if pre == 'D' and nxt in 'GSHTDA': new.append(f"isomerization D{pos}{nxt}")
        if pre == 'N' and nxt != 'P' and nxt2 in 'ST': new.append(f"N-glycosylation N{pos}{nxt}{nxt2}")
    wt = SEQ[i]
    wn = SEQ[i + 1] if i + 1 < len(SEQ) else "-"
    if wt == 'N' and wn in 'GSHATDE': removed.append(f"deamidation N{pos}{wn}")
    if wt == 'D' and wn in 'GSHTDA': removed.append(f"isomerization D{pos}{wn}")
    if mut == 'M' and wt != 'M': new.append("Met oxidation site introduced")
    if wt == 'M' and mut != 'M': removed.append("Met oxidation site removed")
    return new, removed


out = []
for cid, mut, ddg, src in INPUTS:
    body = mut.split(":")[1]
    wt = body[0]
    pos = int(body[1:-1]); m = body[-1]
    assert wt == SEQ[pos - 1], (mut, wt)
    r = rows[(pos, m)]
    d = {k: float(r[k]) for k in KEYS}
    cons = sum(d[k] / SCALES[k] for k in KEYS) / 3
    dist, pid = nearest_paratope(pos)
    prot = []
    if pos in CDR: prot.append("IMGT_CDR")
    if pos in PARATOPE: prot.append("Paratope")
    if pos in CYS: prot.append("Disulfide_Cys")
    new_mot, rem_mot = motif_scan(pos, m)

    flags, verdict = [], None
    if pos in CYS:
        partner = DISULFIDE[pos]
        sg = rm[pos].find_atom("SG", "*"); pg = rm[partner].find_atom("SG", "*")
        sg_dist = round(math.dist([sg.pos.x, sg.pos.y, sg.pos.z], [pg.pos.x, pg.pos.y, pg.pos.z]), 2)
        flags.append(f"BREAKS_DISULFIDE B{pos}-B{partner} (SG-SG {sg_dist} A in model)")
        verdict = "EXCLUDE - disulfide-breaking; not a developability candidate"
    elif pos in PARATOPE:
        flags.append("PARATOPE_RESIDUE - binding interface, outside allowable developability framework set")
    if pos in CDR and pos not in PARATOPE:
        flags.append("IMGT_CDR - antigen-binding loop, outside framework set")
    if pos not in CDR and pos not in PARATOPE and pos not in CYS:
        flags.append("framework_by_IMGT")
        if dist < 8.0:
            flags.append(f"packs_against_paratope ({SEQ[pid-1]}{pid} at {dist:.1f} A)")
    is_fw_dev = (pos not in CDR and pos not in PARATOPE and pos not in CYS and verdict is None)
    if verdict is None:
        if is_fw_dev:
            verdict = ("framework_developability_candidate" if d["stability_delta"] > -1.5
                       else "framework_but_structurally_costly")
        else:
            verdict = "affinity_candidate_only (protected site; not a framework developability recommendation)"

    out.append({
        "candidate_id": cid,
        "mutation": mut,
        "source": src,
        "ddg_pred_raw_string": ddg,                       # verbatim from user / case03; None = not synced
        "ddg_unit": "NOT STATED BY THE TOOL - no unit asserted" if ddg is not None else "not available",
        "structure_validation_status": "external_case03_pending_verification",
        "case03_structure_status": CASE03_STRUCT.get(mut, "scoring table only - no case03 structure"),
        "wt": wt, "pos": pos, "mut": m,
        "region": "CDR" if pos in CDR else "Framework",
        "protected": ";".join(prot) if prot else "none",
        "is_framework_developability_candidate": is_fw_dev,
        "stability_score": float(r["stability_score"]), "stability_delta": round(d["stability_delta"], 4),
        "seq_fitness_score": float(r["seq_fitness_score"]), "seq_fitness_delta": round(d["seq_fitness_delta"], 4),
        "evolutionary_score": float(r["evolutionary_score"]), "evolutionary_delta": round(d["evolutionary_delta"], 4),
        "consensus_delta": round(cons, 3),
        "rel_sasa": round(sasa.get(pos, 0.0) / MAX[wt], 3),
        "n_CA_within_8A": sum(1 for j in rm if j != pos and math.dist(ca(pos), ca(j)) <= 8.0),
        "nearest_paratope_res": f"{SEQ[pid-1]}{pid}",
        "nearest_paratope_dist_A": round(dist, 2),
        "new_risk_motifs": ";".join(new_mot) if new_mot else "none",
        "removed_risk_motifs": ";".join(rem_mot) if rem_mot else "none",
        "developability_flags": ";".join(flags),
        "verdict": verdict,
        "scoring_provenance": {"stability": "task 342605430273024", "seq_fitness": "task 342605430948864",
                               "evolutionary": "task 342605471151104"},
        "note": "three-model scores are unitless model outputs; higher = more favorable; delta = score_mut - 0.0 (WT self-score)",
    })

with open(f"{BASE}/affinity-candidates-x-developability.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0].keys()))
    w.writeheader(); w.writerows(out)
json.dump(out, open(f"{BASE}/affinity-candidates-x-developability.json", "w"), indent=2, ensure_ascii=False)

for o in out:
    print(f"{o['candidate_id']} {o['mutation']:9s} ddG={str(o['ddg_pred_raw_string']):>12s} | "
          f"stab {o['stability_delta']:>7.3f} seq {o['seq_fitness_delta']:>7.3f} evo {o['evolutionary_delta']:>7.3f} cons {o['consensus_delta']:>6.3f} | "
          f"{o['region']:9s} {o['protected']:28s} | {o['verdict']}")
