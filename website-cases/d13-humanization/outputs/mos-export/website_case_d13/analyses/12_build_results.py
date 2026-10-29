"""Assemble results.json from all artifacts produced in this case."""
import json, csv, glob, os, datetime
CASE="/workspace/website_case_d13"
R={}
R["case"]={"name":"Website case A - D1.3 antibody humanization","created_utc":datetime.datetime.utcnow().isoformat()+"Z",
           "parent_antibody":"murine anti-hen egg-white lysozyme Fab D1.3 (PDB 1FDL)",
           "humanization_reference":"humanized anti-lysozyme Fv (PDB 1BVL)",
           "disclaimer":("All antibody sequences and 3D models here are computational predictions. "
                         "No affinity, immunogenicity, expression or stability measurement was performed in this case. "
                         "1FDL/1BVL values are experimental crystallographic data from the public PDB, cited as such.")}
# ---- inputs
R["inputs"]={"rcsb_files":{p:os.path.basename(p) for p in sorted(glob.glob(f"{CASE}/inputs/*")) if os.path.isfile(p)},
             "source":"RCSB PDB (files.rcsb.org / data.rcsb.org), downloaded 2026-10-20"}
# ---- chain mapping
R["chain_mapping_1FDL"]=json.load(open(f"{CASE}/analyses/mos_label_auth_map.json")) if False else {
 "file_facts":{"auth_light":{"chain":"L","molecule":"IGG1-KAPPA D1.3 FAB light chain","organism":"Mus musculus"},
               "auth_heavy":{"chain":"H","molecule":"IGG1-KAPPA D1.3 FAB heavy chain","organism":"Mus musculus"},
               "auth_antigen":{"chain":"Y","molecule":"hen egg-white lysozyme","organism":"Gallus gallus"}},
 "mos_sanitized_labels":{"A":"auth L (light chain, 214 aa incl. constant domain)",
                          "B":"auth H (heavy chain, 218 aa incl. CH1)",
                          "C":"auth Y (lysozyme, 129 aa)"},
 "verified_by":"_mos_mapping loop of the MOS-sanitized copy + COMPND/FASTA records",
 "variable_domains":{"VH":"label B residues 1-116","VL":"label A residues 1-107"}}
R["chain_mapping_1BVL"]=json.load(open(f"{CASE}/analyses/1BVL_chain_mapping.json"))
R["chain_mapping_1BVL"]["statement"]=("Biological pairs are the deposited ones: assembly 1 = author A (VH) + author B (VL); "
 "assembly 2 = author C (VH) + author D (VL). MOS labels are A=VH(auth A), B=VH(auth C), C=VL(auth B), D=VL(auth D); "
 "therefore author A+B corresponds to MOS label A+C, and author C+D to MOS label B+D. Author chains and MOS labels are "
 "never interchanged in the comparisons.")
# ---- numbering / CDRs
dom=json.load(open(f"{CASE}/analyses/domains_meta.json"))
def cdr_set(fid, scheme):
    out={}
    for r in csv.DictReader(open(f"{CASE}/analyses/numbering_all_schemes.tsv"),delimiter="\t"):
        if r["fasta_id"]!=fid or r["scheme"]!=scheme or r["aa"]=="-": continue
        out.setdefault(r["region"],[]).append(r["aa"])
    return {k:"".join(v) for k,v in out.items() if k.startswith("CDR")}
R["variable_domains"]={
 "parent_VH":{"sequence":dom["1FDL_2|Chain"]["imgt"]["domain_sequence"],"length":116,"source":"1FDL auth H residues 1-116 (ANARCI IMGT domain)"},
 "parent_VL":{"sequence":dom["1FDL_1|Chain"]["imgt"]["domain_sequence"],"length":107,"source":"1FDL auth L residues 1-107 (ANARCI IMGT domain)"},
 "IMGT_CDRs_parent_VH":cdr_set("1FDL_2|Chain","imgt"),"IMGT_CDRs_parent_VL":cdr_set("1FDL_1|Chain","imgt"),
 "Kabat_CDRs_parent_VH":cdr_set("1FDL_2|Chain","kabat"),"Kabat_CDRs_parent_VL":cdr_set("1FDL_1|Chain","kabat"),
 "Chothia_CDRs_parent_VH":cdr_set("1FDL_2|Chain","chothia"),"Chothia_CDRs_parent_VL":cdr_set("1FDL_1|Chain","chothia"),
 "reference_1BVL_VH":dom["1BVL_1|Chains"]["imgt"]["domain_sequence"],"reference_1BVL_VL":dom["1BVL_2|Chains"]["imgt"]["domain_sequence"],
 "files":{"per_residue_all_schemes":"analyses/numbering_all_schemes.tsv","raw_anarci":"analyses/anarci_raw.json"}}
# ---- interface (recomputed independently; see logs correction section)
_bsa=json.load(open(f"{CASE}/analyses/bsa_recheck_1FDL.json"))
_con=json.load(open(f"{CASE}/analyses/contacts_recheck_1FDL.json"))
_iface=json.load(open(f"{CASE}/analyses/interface_residues_1FDL.json"))
R["parent_interface"]={
 "method":{
   "bsa":("freesasa 2.x, Lee-Richards, 100 slices / 1000 points, hydrogens excluded. "
          "BSA_total = SASA(Fab chains A+B as one body) + SASA(lysozyme) - SASA(Fab+lysozyme). "
          "dSASA(Fab chain) = SASA(chain inside Fab) - SASA(chain inside complex); "
          "dSASA(lysozyme residue) = SASA(lysozyme alone) - SASA(lysozyme in complex)."),
   "contacts":"direct heavy-atom distance sweep from the coordinates (4.0 and 4.5 A cutoffs), no external contact engine",
   "hbond_proxy":"N/O...N/O atom pairs within 4.0 A (distance-only geometric proxy, not an angle-validated H-bond assignment)",
   "salt_bridge":"Arg/Lys/His N within 4.0 A of Asp/Glu O"},
 "bsa_total_A2":_bsa["full_fab"]["bsa_total_A2"],
 "bsa_v_domains_only_A2":_bsa["v_domains_only"]["bsa_total_A2"],
 "bsa_by_side_A2":_bsa["full_fab"]["per_side_A2"],
 "constant_domain_contribution":"0.0 A^2 - the full-Fab and V-domain-only calculations give identical BSA, per-side values and interface-residue sets",
 "contacts":{"n_fab_residues_4.0A":_con["contacts_4.0"]["n_fab_residues"],
             "n_fab_residues_4.5A":_con["contacts_4.5"]["n_fab_residues"],
             "fab_residues_4.5A":_con["contacts_4.5"]["fab_residues"],
             "n_atom_pairs_4.0A":_con["contacts_4.0"]["n_atom_pairs"],
             "n_polar_pairs_4.0A":len(_con["polar_4.0"]),
             "n_salt_bridges_4.0A":len(_con["charge_pairs_4.0"])},
 "closest_polar_contacts":[{"fab":f'{p["fab_chain"]}{p["fab_res"]}{p["fab_resname"]}',
                            "ag":f'Y{p["ag_res"]}{p["ag_resname"]}',"atoms":f'{p["fab_atom"]}...{p["ag_atom"]}',
                            "distance_A":p["distance"]} for p in sorted(_con["polar_4.0"],key=lambda x:x["distance"])[:8]],
 "paratope_residues":[{"role":("VH" if r["chain_label"]=="B" else "VL"),"imgt_position":r["imgt_position"],
                        "parent_residue":f'{r["chain_label"]}{r["res_num"]}',"region":r["region"],
                        "dSASA_A2":r["dSASA_A2"],"contact_4A":r["in_contact_4A"],
                        "lysozyme_partners":[f"Y{x}" for x in r["contact_partners"]]}
                       for r in sorted([x for x in _iface if x["chain_label"]!="C" and x["dSASA_A2"]>0.5],key=lambda x:-x["dSASA_A2"])],
 "epitope_residues":[{"residue":f'Y{r["res_num"]}',"dSASA_A2":r["dSASA_A2"]}
                     for r in sorted([x for x in _iface if x["chain_label"]=="C" and x["dSASA_A2"]>0.5],key=lambda x:-x["dSASA_A2"])],
 "files":{"merged_table":"analyses/interface_residues_1FDL.tsv","bsa":"analyses/bsa_recheck_1FDL.json",
          "contacts":"analyses/contacts_recheck_1FDL.tsv","code":["analyses/13_bsa_recheck.py","analyses/14_contacts_recheck.py"]},
 "superseded":{"statement":"An earlier version of this file reported ~1690 A^2 of constant-domain burial assigned to 'crystal packing'. That was WRONG and is retracted: it summed the PPInterface per-residue table, which does not reproduce against the coordinates (archived H-bond rows do not match the atom positions). Constant domains make zero contact with lysozyme: nearest approach 33.03 A."}}
# ---- humanization task
R["humanization_task"]={"task_id":"342335722341376","type":"Antibody Humanization","status":"SUCCEED","duration":"3.9min",
 "input":{"num_designs":10,"vh_sequence":R["variable_domains"]["parent_VH"]["sequence"],"vl_sequence":R["variable_domains"]["parent_VL"]["sequence"]},
 "outputs":{"raw_dir":"native_tasks/humanization/","n_designs_returned":10,
            "note":"The task also returned 5 MMFold sample models of candidate humanization_9 only; these are kept separately and are NOT used as the uniform structural set."},
 "scores_meaning":"score_global / delta_global / oasis_percentile / AbNatiV values are model outputs from the MOS task (BIOPHI OASis + AbNatiV); not experimental measurements."}
# ---- candidates
scores={r["id"]:r for r in csv.DictReader(open(f"{CASE}/native_tasks/humanization/final_ranked_summary.csv"))}
from Bio import SeqIO
seqs={r.id:str(r.seq).split(":") for r in SeqIO.parse(f"{CASE}/native_tasks/humanization/result.fasta","fasta")}
cmp_summary={r["candidate"]:r for r in csv.DictReader(open(f"{CASE}/analyses/candidate_metrics.tsv"),delimiter="\t")}
cands=[]
for cid in sorted(seqs, key=lambda x:int(x.split("_")[1])):
    man=json.load(open(f"{CASE}/native_tasks/mmfold/{cid}/manifest.json"))
    best=[s for s in man["samples"] if s["sample"]==man["best_sample"]][0]
    comp=json.load(open(f"{CASE}/analyses/comparisons/{cid}.json"))
    sc=scores[cid]
    c={"id":cid,"VH":seqs[cid][0],"VL":seqs[cid][1],
       "humanization_scores":{"score_global":float(sc["score_global"]),"delta_global":float(sc["delta_global"]),
          "oasis_identity_pct":round(100*float(sc["oasis_identity"]),1),"oasis_percentile_pct":round(100*float(sc["oasis_percentile"]),1),
          "abnativ_heavy":float(sc["abnativ_heavy_score"]),"abnativ_light":float(sc["abnativ_light_score"])},
       "mmfold":{"task_id":[t for t in json.load(open(f"{CASE}/native_tasks/task-ledger.json"))["tasks"] if t.get("candidate")==cid][0]["task_id"],
                 "n_samples":man["n_samples"],"best_sample":man["best_sample"],
                 "best_plddt":round(best["plddt"],2),"best_ptm":round(best["ptm"],3),"best_iptm":round(best["iptm"],3),
                 "best_ranking_score":round(best["ranking_score"],3),
                 "plddt_range":[round(min(s["plddt"] for s in man["samples"]),2),round(max(s["plddt"] for s in man["samples"]),2)],
                 "sequence_matches_payload":all(s["sequence_matches_payload"] for s in man["samples"]),
                 "dir":f"native_tasks/mmfold/{cid}/"},
       "vs_parent":{"sequence":{"total_changes":comp["vs_parent"]["sequence_differences"]["count"],
                                 "CDR_changes":sum(1 for s in comp["vs_parent"]["sequence_differences"]["substitutions"] if s["region"].startswith("CDR")),
                                 "substitutions":comp["vs_parent"]["sequence_differences"]["substitutions"]},
                    "structure":{k:comp["vs_parent"][k] for k in ["global_fit","region_displacement_after_global_fit","framework_fit"]}},
       "vs_1BVL":{"authorAB_Fv1":{k:comp["vs_1BVL_Fv1_authorAB"][k] for k in ["global_fit","framework_fit","sequence_differences"]},
                  "authorCD_Fv2":{k:comp["vs_1BVL_Fv2_authorCD"][k] for k in ["global_fit","framework_fit","sequence_differences"]}}}
    cm=cmp_summary.get(cid,{})
    c["vs_parent"]["structure"]["paratope_displacement"]={
        "n":int(cm.get("paratope_n") or 0) or None,
        "mean":float(cm["paratope_mean_displacement_after_global_fit"]) if cm.get("paratope_mean_displacement_after_global_fit") else None,
        "max":float(cm["paratope_max_displacement_after_global_fit"]) if cm.get("paratope_max_displacement_after_global_fit") else None}
    cands.append(c)
R["candidates"]=cands
# ---- baselines
R["reference_baselines"]=json.load(open(f"{CASE}/analyses/reference_baselines.json"))
R["reference_baselines"]["interpretation"]=("The two copies of the same humanized Fv inside 1BVL (author A+B vs author C+D, "
  "identical sequences) differ by 0.816 A CA RMSD (FR fit 0.782 A). That is the experimental copy-to-copy spread at 2.87 A "
  "resolution and is the scale against which candidate-vs-parent deviations should be read.")
# ---- methods/provenance
R["methods"]={
 "antibody_numbering":{"tool":"ANARCI (installed binary)","schemes":["imgt","kabat","chothia"],"files":"analyses/numbering_all_schemes.tsv"},
 "structure_comparison":{"method":"Kabsch superposition on CA atoms with residue pairing from shared ANARCI IMGT positions",
    "fits":["global: all paired VH+VL CA","framework: IMGT FR1-FR4 CA","local: each CDR fitted independently"],
    "provenance":"computed by Mocha (numpy SVD Kabsch). NOT a MOS-native Superimpose run - no superimposed task type exists in ListAvailableMOSTasks and no Superimpose tool is exposed in this session."},
 "native_mos_superimpose":{"available":False,"checked":"ListAvailableMOSTasks (8 available task types, none is superposition) and session tool list",
    "statement":"No native MOS superposition was run. All RMSDs are Mocha-added structural statistics."},
 "viewer_imports":{"method":"ImportStructure(local_file) of the pre-superposed complexes",
    "objects":{"superposed_1FDLparent_humanization_3":{"object_id":"342339292763136","work_id":"342339299021824"},
               "superposed_1FDLparent_humanization_9":{"object_id":"342339296826368","work_id":"342339311997952"},
               "superposed_1FDLparent_humanization_2":{"object_id":"342339294221312","work_id":"342339305542656"},
               "aligned_1FDLFv_humanization_3_Fv":{"work_id":"342339482539008"}},
    "note":"Imports registered successfully but the interactive viewer in this session stayed on 1FDL; selections applied to 1FDL only."}}
R["report"]="report.md"
R["readme"]="README.txt"
R["corrections"]=[
 {"topic":"1BVL chain pairing","status":"corrected",
  "what":"An earlier note described the paired chains using MOS labels without stating the author mapping. The biological pairs are author A+B and author C+D; MOS labels run A=VH(author A), B=VH(author C), C=VL(author B), D=VL(author D).",
  "evidence":"deposited assembly/entity records + sanitizer mapping file + 0.000 A CA coordinate identity",
  "file":"analyses/1BVL_chain_mapping.json"},
 {"topic":"constant-domain contacts to lysozyme","status":"RETRACTED",
  "what":"An earlier version claimed ~1690 A^2 of constant-domain burial assigned to crystal packing. That figure came from merging an archived PPInterface table that does not reproduce against the coordinates. Constant domains make zero contact with lysozyme (nearest 33.03 A); the full-Fab and V-domain-only BSA are identical at 1243.2 A^2.",
  "evidence":"analyses/13_bsa_recheck.py, analyses/14_contacts_recheck.py",
  "file":"logs/execution_log.md (CORRECTION 2)"}]
R["original_humanization_task_models"]={
 "files":"native_tasks/humanization/*model_sample_*.cif + summary_confidences_sample_*.json",
 "identity":"all five are MMFold samples of candidate humanization_9 (verified by exact sequence match)",
 "confidence_sample1":json.load(open(f"{CASE}/native_tasks/humanization/summary_confidences_sample_1.json")),
 "kept_separate_because":"the uniform structural comparison uses one independent MMFold run per candidate, so all ten candidates are compared on identical footing",
 "reproducibility":json.load(open(f"{CASE}/analyses/original_task_models_vs_mmfold.json"))}
json.dump(R,open(f"{CASE}/results.json","w"),indent=1)
print("results.json written, candidates:",len(cands))
print(json.dumps(cands[0]["vs_parent"]["structure"]["global_fit"],indent=1))
