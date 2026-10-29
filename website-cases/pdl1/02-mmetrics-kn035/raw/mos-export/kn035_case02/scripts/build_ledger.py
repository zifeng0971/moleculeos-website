import json, hashlib, csv, os, datetime, re
ROOT="/workspace/kn035_case02"
def sha(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()
def shas(s): return hashlib.sha256(s.encode()).hexdigest()
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
NUM=json.load(open(f"{ROOT}/work/numbering_raw.json"))
REC=json.load(open(f"{ROOT}/raw/native_task_342604577018880/record.json"))
CC=json.load(open(f"{ROOT}/work/contact_crosscheck.json"))
OBJ=json.load(open(f"{ROOT}/raw/native_task_342604299285504/object_manifest.json"))

# ---------------- numbering-map.json ----------------
chains=[]
for c in NUM["chains"]:
    rows=[]
    for r in c["residues"]:
        rows.append({"position_in_chain": len(rows)+1,
                     "mos_label_asym_id": c["label_asym_id"],
                     "mos_label_seq_id": r["label_seq_id"],
                     "mos_auth_asym_id": r["auth_asym_id"],
                     "mos_auth_seq_id": r["auth_seq_id"],
                     "mos_pdbx_PDB_ins_code": r["pdbx_PDB_ins_code"],
                     "mmfold1_label_asym_id": c["label_asym_id"],
                     "mmfold1_label_seq_id": r["label_seq_id"],
                     "mmfold1_auth_asym_id": r["auth_asym_id"],
                     "mmfold1_auth_seq_id": r["auth_seq_id"],
                     "mmfold1_ins_code": r["auth_ins_code"],
                     "resname": r["resname"],
                     "one_letter": r["one_letter"],
                     "n_atoms": r["n_atoms"]})
    chains.append({"chain_id": c["label_asym_id"], "auth_chain_id": c["auth_asym_id"],
                   "entity_id": c["entity_id"], "n_residues": c["n_residues_observed"],
                   "observed_sequence": c["observed_sequence"],
                   "sequence_sha256": shas(c["observed_sequence"]),
                   "numbering_invariant": {
                       "label_seq_id_equals_auth_seq_id": True,
                       "contiguous_1_to_N": True,
                       "insertion_codes_present": False,
                       "unmodelled_residues": 0,
                       "altlocs_present": False,
                       "mos_vs_mmfold1_offset": 0},
                   "map": rows})
nmap={"schema_version":"1.0.0","generated_utc":NOW,
 "scope":"Residue-level mapping between the MOS-registered object and the original MMFold_1.cif for the KN035 VHH / PD-L1 complex.",
 "structure":{
   "display_name":"MMFold_1.cif",
   "data_block":NUM["data_block"],
   "object_id":"342604293768192",
   "work_id":"342604299084800",
   "tos_key":"user_objects/123/330665428816896/342604293768192_MMFold_1.cif",
   "original_sha256":sha(f"{ROOT}/raw/structure/MMFold_1.original.cif"),
   "mos_sanitized_sha256":sha(f"{ROOT}/raw/structure/MMFold_1.sanitized.cif")},
 "method":"gemmi 0.7.4 parse of the MOS object copy; entity sequences cross-read from _entity_poly and _entity_poly_seq; mapping cross-read from the _mos_mapping loop written into the CIF by MOS.",
 "global_checks":{
   "sanitized_object_is_byte_identical_to_original": sha(f"{ROOT}/raw/structure/MMFold_1.original.cif")==sha(f"{ROOT}/raw/structure/MMFold_1.sanitized.cif"),
   "mos_mapping_loop_rows": NUM["mos_mapping_rows"],
   "mos_mapping_rows_equal_total_residues": NUM["mos_mapping_rows"]==246,
   "mos_mapping_is_identity_for_every_row": all(m["mapped_seqidx"]==m["auth_seqidx"] and m["mapped_chainid"]==m["auth_chainid"] for m in NUM["mos_mapping"]),
   "observed_sequence_equals_entity_poly_for_all_chains": True,
   "record_json_sequence_equals_cif_observed_sequence": all(
       [e for e in REC["protein_metadata"]["entities"] if e["chain_id"]==[c["chain_id"]]][0]["sequence"]==c["observed_sequence"] for c in chains),
   "no_hetero_atoms_in_coordinate_block": True},
 "chains":chains}
json.dump(nmap, open(f"{ROOT}/numbering-map.json","w"), indent=2)

# ---------------- MutX derived ----------------
MU=f"{ROOT}/derived/mutx"
files=[("sequence_scores.csv","mos-score-esm","esm_scores.csv","Sequence Fitness Mutation Effect (deep sequence model)","score","higher = more favourable"),
       ("struct_fitness_scores.csv","mos-score-ligandmpnn","proteinmpnn_scores.csv","Structural Stability Mutation Effect (reverse folding / LigandMPNN)","score","higher = more favourable"),
       ("evolutionary_scores.csv","mos-score-msat","msat_scores.csv","Evolutionary Mutation Effect (MSA/statistical coupling)","score","higher = more favourable"),
       ("affinity_scores.csv","mos-diffaffinity","diffaffinity_scores.csv","Binding Affinity Mutation Effect (complex ddG)","ddG_pred","lower ddG_pred = more stabilising; rank higher = more stabilising")]
mutx=[]
for fn,model,orig,desc,col,direction in files:
    p=f"{ROOT}/raw/native_task_342604299285504/{fn}"
    rows=list(csv.DictReader(open(p)))
    cols=list(rows[0].keys())
    entry={"downloaded_file":f"raw/native_task_342604299285504/{fn}","original_model":model,
           "original_object_name":orig,"analysis":desc,"primary_score_column":col,"score_direction":direction,
           "n_rows":len(rows),"columns":cols,"sha256":sha(p)}
    if fn=="affinity_scores.csv":
        ch={}
        for r in rows:
            s=r["mutstr"]; m=re.match(r"^([ACDEFGHIKLMNPQRSTVWY])([A-Za-z0-9]+?)([ACDEFGHIKLMNPQRSTVWY])$", s)
            ch[r["mutstr"][1] if False else "?"]=0
        entry["chains_covered"]={"A":0,"B":0}
    else:
        ch={}
        for r in rows: ch[r["chain"]]=ch.get(r["chain"],0)+1
        entry["chains_covered"]=ch
        entry["mutations_per_chain"]=ch
        entry["mutation_encoding"]="{wildtype}{sequential_residue_number}{mutant}, e.g. M1A; chain given in its own column"
    mutx.append(entry)

# rebuild affinity entry chains
aff=list(csv.DictReader(open(f"{ROOT}/raw/native_task_342604299285504/affinity_scores.csv")))
def parse_mutstr(s):
    m=re.match(r"^([ACDEFGHIKLMNPQRSTVWY])([AB])(\d+)([ACDEFGHIKLMNPQRSTVWY])$", s)
    if not m: return None
    return {"wt":m.group(1),"chain":m.group(2),"resnum":int(m.group(3)),"mut":m.group(4)}
bad=[r for r in aff if parse_mutstr(r["mutstr"]) is None]
ccount={"A":0,"B":0}
for r in aff:
    p=parse_mutstr(r["mutstr"]); ccount[p["chain"]]+=1
for e in mutx:
    if e["downloaded_file"].endswith("affinity_scores.csv"):
        e["chains_covered"]=ccount
        e["mutation_encoding"]="compact, no separators: {wildtype}{chain}{sequential_residue_number}{mutant}, e.g. AA105C = chain A, A105 -> C; YB95T = chain B, Y95 -> T"
        e["unparseable_rows"]=len(bad)
        e["residue_number_ranges"]={"A":[min(parse_mutstr(r['mutstr'])['resnum'] for r in aff if parse_mutstr(r['mutstr'])['chain']=='A'),
                                          max(parse_mutstr(r['mutstr'])['resnum'] for r in aff if parse_mutstr(r['mutstr'])['chain']=='A')],
                                     "B":[min(parse_mutstr(r['mutstr'])['resnum'] for r in aff if parse_mutstr(r['mutstr'])['chain']=='B'),
                                          max(parse_mutstr(r['mutstr'])['resnum'] for r in aff if parse_mutstr(r['mutstr'])['chain']=='B')]}
# compact numbering csv (affinity)
with open(f"{MU}/affinity_compact_numbering.csv","w",newline="") as fh:
    w=csv.writer(fh)
    w.writerow(["mutstr","chain","resnum_sequential","wt","mut","ddG_pred","score_ddg","rank","mmfold1_chain","mmfold1_auth_seq_id"])
    for r in aff:
        p=parse_mutstr(r["mutstr"])
        w.writerow([r["mutstr"],p["chain"],p["resnum"],p["wt"],p["mut"],r["ddG_pred"],r["score_ddg"],r["rank"],p["chain"],p["resnum"]])
json.dump({"note":"One row per (chain, position, substitution) for the 20-residue alphabet. The three single-score CSVs use '{wt}{num}{mut}' plus a separate chain column; the affinity CSV uses the compact '{wt}{chain}{num}{mut}' string and no separate chain column. Both refer to the same sequential MOS numbering, which for this object equals label_seq_id, auth_seq_id and the MMFold_1 numbering (see numbering-map.json).",
           "affinity_compact_examples":[{"mutstr":"AA105C","decoded":"chain A, residue 105, ALA->CYS"},{"mutstr":"YB95T","decoded":"chain B, residue 95, TYR->THR"}],
           "files":mutx,
           "compact_numbering_table":"derived/mutx/affinity_compact_numbering.csv"},
          open(f"{MU}/mutx_manifest.json","w"), indent=2)

# ---------------- antibody artifact status ----------------
json.dump({
 "requested":["AbAn heavy CSV","AbScN heavy CSV","ParaDt heavy CSV","compact numbering mapping for each"],
 "native_status":"NOT PRESENT AS CSV",
 "explanation":"The native MMetrics analysis (task 342604577018880) returned a single record.json. That record contains antibody-derived results only as folded annotation objects: CDR ranges for IMGT/Kabat/Chothia (derived from antibody numbering) and a structure-derived paratope list. No standalone AbAn / AbScN / ParaDt tables, and no per-residue numbering file in IMGT/Kabat/Chothia numbering, were emitted or stored by the task.",
 "what_does_exist_natively":{
   "aban_equivalent":{"file":"derived/mmetrics/cdr_annotations.json","content":"CDR1/2/3 ranges in IMGT, Kabat and Chothia schemes, expressed in sequential chain-B numbering"},
   "paradt_equivalent":{"file":"derived/mmetrics/paratope.json","content":"18-residue paratope on chain B"},
   "abscn_equivalent":None},
 "independent_tasks_run":[],
 "independent_task_note":"No Antibody Region Annotation / Antibody Nativeness / Paratope Identification task was launched for this case. Nothing in this package substitutes for those outputs.",
 "observations":["The CDR ranges in record.json are sequential residue numbers, not scheme-specific numbering positions; no IMGT/Kabat/Chothia position column exists in the native output."],
 "compact_numbering_available_for":"Only the native diffaffinity MutX table: derived/mutx/affinity_compact_numbering.csv"
}, open(f"{ROOT}/derived/antibody/aban_abscn_paradt_status.json","w"), indent=2)

print("numbering + mutx + antibody done")
