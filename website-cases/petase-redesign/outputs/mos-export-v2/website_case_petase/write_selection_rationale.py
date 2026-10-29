#!/usr/bin/env python3
"""Emit the site-selection rationale table (numbers joined from
analyses/pocket_position_evidence.csv; reason text is authored, evidence is not).
"""
import csv, json

ev = {int(r["auth_res"]): r for r in csv.DictReader(open("analyses/pocket_position_evidence.csv"))}
shells = json.load(open("analyses/pocket_shells.json"))

SEL = {
    157: ("selected", "second-shell aspartate on the rim of the HEMT site; all three models prefer a substitution (seq N/evo N/struct H) and UniProt MUTAGEN 186 D->H is a validated thermostability+activity variant; carboxylate points at the substrate channel, 6.3 A from HEMT"),
    209: ("selected", "second-shell serine lining the cleft below the ligand (7.4 A); structure model ranks Y/F above WT (8 substitutions with positive ddG-fitness, best S->Y +1.62) and sequence model mildly favours F; UniProt MUTAGEN 238 S->F is the classic PETase activity variant"),
    130: ("selected", "first-shell tryptophan that pi-stacks the HEMT aromatic ring (ring-centroid 5.0-5.2 A, closest heavy atom 3.21 A); structure model prefers H by +2.53 and UniProt MUTAGEN 159 W->H is an experimentally validated activity variant, so the pose-free scoring agrees with experiment at this site"),
    156: ("selected", "first-shell tryptophan that stacks the ring (ring-centroid 5.0 A) and donates NE1-H...O to the methyl-ester oxygen (3.20 A); structure model accepts Y (+0.98) and sequence/evolution models reject anything but aromatic residues, so only conservative aromatics are expected to survive filtering"),
    179: ("selected", "first-shell isoleucine packing one face of the HEMT ring (3.60 A, 7 atom contacts); sequence model prefers T (+1.18) and V (+0.94) while structure and evolution models slightly prefer WT, i.e. a genuine disagreement that a small polar/valine swap tests"),
}
EXC = {
    131: "catalytic nucleophile Ser160 (UNP), 2.51 A from the scissile ester carbon; catalytic machinery, protected",
    177: "catalytic Asp206 (UNP) of the charge-relay triad; protected",
    208: "catalytic His237 (UNP); H-bonds the ester oxygen at 2.87 A; protected",
    58: "Tyr87 (UNP): backbone N is part of the oxyanion hole (N...O10 2.90 A) and UniProt lists it as a PET-binding residue; protected",
    132: "Met161 (UNP): backbone N completes the oxyanion hole (N...O10 2.93 A) and UniProt lists it as a PET-binding residue; protected",
    174: "Cys203 (UNP), disulfide with Cys239; protected",
    210: "Cys239 (UNP), disulfide with Cys203; protected",
    244: "Cys273 (UNP), disulfide with Cys289; protected",
    260: "Cys289 (UNP), disulfide with Cys273; protected",
    57: "Gly86 (UNP): only backbone atoms contact HEMT (6 atom contacts, 3.33 A); a glycine in a tight turn, no side chain to redesign",
    60: "Ala89 (UNP): a single van der Waals contact at 3.76 A and only the structure model favours substitution (A->E +1.37); too little leverage to spend a design slot",
    185: "Ser214 (UNP): 5.9 A from HEMT, two of three models favour H (seq +5.85, evo +4.19) but it sits on the back face of the pocket rather than in the substrate path; deferred to keep the design local",
    153: "Gln182 (UNP): 7.4 A from HEMT, sequence model strongly prefers L (+5.40, 9 positive substitutions) but it is a surface second-shell position with no direct substrate contact; deferred",
    212: "Asn241 (UNP): 6.3 A, sequence model prefers L (+1.79) but the position is outside the immediate lid of the site; deferred",
    207: "Ser236 (UNP): 9.4 A, models favour D but the position is distant from the HEMT ring; deferred",
}

rows = []
for auth, (decision, reason) in SEL.items():
    e = ev[auth]
    rows.append({
        "auth_res": auth, "unp_res": e["unp_res"], "construct_pos": e["construct_pos"], "wt_aa": e["wt_aa"],
        "decision": decision, "shell": e["shell"],
        "min_dist_to_HEMT_A": e["min_dist_to_HEMT_A"], "second_shell_min_dist_A": e["second_shell_min_dist_A"],
        "rel_sasa": e["rel_sasa"],
        "seq_wt_score": e["seq_wt_score"], "seq_best_sub": e["seq_best_sub"], "seq_best_score": e["seq_best_score"],
        "evo_wt_score": e["evo_wt_score"], "evo_best_sub": e["evo_best_sub"], "evo_best_score": e["evo_best_score"],
        "struct_wt_score": e["struct_wt_score"], "struct_best_sub": e["struct_best_sub"], "struct_best_score": e["struct_best_score"],
        "reason": reason})
for auth, reason in EXC.items():
    e = ev.get(auth)
    rows.append({
        "auth_res": auth, "unp_res": e["unp_res"] if e else auth + 29,
        "construct_pos": e["construct_pos"] if e else auth + 7,
        "wt_aa": e["wt_aa"] if e else "",
        "decision": "excluded", "shell": e["shell"] if e else "",
        "min_dist_to_HEMT_A": e["min_dist_to_HEMT_A"] if e else "",
        "second_shell_min_dist_A": e["second_shell_min_dist_A"] if e else "",
        "rel_sasa": e["rel_sasa"] if e else "",
        "seq_wt_score": e["seq_wt_score"] if e else "", "seq_best_sub": e["seq_best_sub"] if e else "",
        "seq_best_score": e["seq_best_score"] if e else "",
        "evo_wt_score": e["evo_wt_score"] if e else "", "evo_best_sub": e["evo_best_sub"] if e else "",
        "evo_best_score": e["evo_best_score"] if e else "",
        "struct_wt_score": e["struct_wt_score"] if e else "", "struct_best_sub": e["struct_best_sub"] if e else "",
        "struct_best_score": e["struct_best_score"] if e else "",
        "reason": reason})

rows.sort(key=lambda r: (r["decision"] != "selected", r["auth_res"]))
with open("analyses/redesign_site_selection.csv", "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

print(f"selected {sum(1 for r in rows if r['decision']=='selected')} / documented {len(rows)}")
for r in rows:
    print(f"  {r['decision']:>8}  AUTH{r['auth_res']:>4} UNP{r['unp_res']:>4} {r['wt_aa']}  d={r['min_dist_to_HEMT_A']}  {r['reason'][:70]}...")
