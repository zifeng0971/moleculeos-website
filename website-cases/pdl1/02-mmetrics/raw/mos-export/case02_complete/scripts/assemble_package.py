#!/usr/bin/env python
"""Assemble /workspace/case02_complete and zip it to /workspace/case02_complete.zip."""
import json, os, shutil, csv, subprocess, datetime

BASE = "/workspace/case02"
PKG = "/workspace/case02_complete"
A = os.path.join(BASE, "analysis")
DL = "/workspace/downloads"

if os.path.exists(PKG):
    shutil.rmtree(PKG)
dirs = ["00_structure", "01_overview", "02_homologs/raw", "03_antibody_annotation",
        "04_liabilities", "05_interactions/contacts", "05_interactions/if_VH_PDL1",
        "05_interactions/if_VL_PDL1", "06_mutations/raw_task_outputs", "07_provenance",
        "scripts"]
for d in dirs:
    os.makedirs(os.path.join(PKG, d), exist_ok=True)

def cp(src, dst):
    shutil.copy2(src, dst)

# ---- structure
cp(os.path.join(BASE, "struct/mos_5GRJ.cif"), os.path.join(PKG, "00_structure/5GRJ_mos_sanitized.cif"))
cp(os.path.join(BASE, "struct/5GRJ.cif"), os.path.join(PKG, "00_structure/5GRJ_local_sanitized.cif"))
cp(os.path.join(BASE, "struct/5GRJ.cif.mapping"), os.path.join(PKG, "00_structure/5GRJ_local_sanitized.cif.mapping"))
cp(os.path.join(BASE, "data/raw_metadata/5GRJ_raw.cif"), os.path.join(PKG, "00_structure/5GRJ_rcsb_raw.cif"))

# ---- overview
for f in ["overview_chain_identity.json", "overview_chains.csv", "chainC_Q9NZQ7_mapping.json"]:
    cp(os.path.join(A, f), os.path.join(PKG, "01_overview", f))
for f in ["5GRJ_A.fasta", "5GRJ_A_full.fasta", "5GRJ_B.fasta", "5GRJ_B_full.fasta",
          "5GRJ_C.fasta", "5GRJ_C_full.fasta", "Q9NZQ7.fasta", "Q9NZQ7_uniprot.jsonl"]:
    if os.path.exists(os.path.join(BASE, "data", f)):
        cp(os.path.join(BASE, "data", f), os.path.join(PKG, "01_overview", f))

# ---- homologs
for f in ["PD-L1_homologs.csv", "VH_homologs.csv", "VL_homologs.csv", "homology_summary.json"]:
    cp(os.path.join(A, "homology", f), os.path.join(PKG, "02_homologs", f))
for folder in ["sequence_homology_search_342256475304960",
               "sequence_homology_search_342256475644928",
               "sequence_homology_search_342256477762560"]:
    for f in ["similarity_results.json", "all_sequences.fasta"]:
        p = os.path.join(DL, folder, f)
        if os.path.exists(p):
            cp(p, os.path.join(PKG, "02_homologs/raw", f"{folder}__{f}"))

# ---- antibody annotation
cp(os.path.join(A, "imgt_annotation.json"), os.path.join(PKG, "03_antibody_annotation/imgt_annotation.json"))
cp(os.path.join(A, "imgt_residue_mapping.csv"), os.path.join(PKG, "03_antibody_annotation/imgt_residue_mapping.csv"))
imgt = json.load(open(os.path.join(A, "imgt_annotation.json")))
with open(os.path.join(PKG, "03_antibody_annotation/imgt_cdr_summary.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["chain", "role", "element", "sequence_or_length", "imgt_positions",
                "mos_start", "mos_end", "length"])
    for ch, d in imgt["cdr_summary"].items():
        for name, v in d["cdrs"].items():
            w.writerow([ch, d["role"], name, v["sequence"], f"{v['imgt_positions'][0]}-{v['imgt_positions'][1]}",
                        v["mos_span"][0], v["mos_span"][1], v["length"]])
        for name, v in d["frameworks"].items():
            w.writerow([ch, d["role"], name, "", "", v["mos_span"][0], v["mos_span"][1], v["length"]])

# ---- liabilities
cp(os.path.join(A, "liability_sites.json"), os.path.join(PKG, "04_liabilities/liability_sites.json"))
cp(os.path.join(A, "liability_sites.csv"), os.path.join(PKG, "04_liabilities/liability_sites.csv"))

# ---- interactions
cp(os.path.join(A, "epitope_paratope.json"), os.path.join(PKG, "05_interactions/epitope_paratope.json"))
cp(os.path.join(A, "epitope_paratope.csv"), os.path.join(PKG, "05_interactions/epitope_paratope.csv"))
cp(os.path.join(A, "interface/summary.md"), os.path.join(PKG, "05_interactions/interface_summary.md"))
cp(os.path.join(A, "interface/hbond.tsv"), os.path.join(PKG, "05_interactions/interface_hbonds.tsv"))
cp(os.path.join(A, "interface/salt_bridge.tsv"), os.path.join(PKG, "05_interactions/interface_salt_bridges.tsv"))
cp(os.path.join(A, "interaction_report.jsonl"), os.path.join(PKG, "05_interactions/interaction_report.jsonl"))
for f in ["hbond.tsv", "pistack.tsv", "pication.tsv", "residues.tsv"]:
    cp(os.path.join(A, "contacts", f), os.path.join(PKG, "05_interactions/contacts", f))
for d in ["if_VH_PDL1", "if_VL_PDL1"]:
    for f in os.listdir(os.path.join(A, d)):
        cp(os.path.join(A, d, f), os.path.join(PKG, "05_interactions", d, f))

# ---- mutations
for f in ["all_scores_long.csv", "per_axis_position_summary.csv", "recommended_mutations.csv",
          "liability_mitigation_candidates.csv", "mutation_analysis.json"]:
    cp(os.path.join(A, "mutations", f), os.path.join(PKG, "06_mutations", f))
rawmap = {
    "342256486130688": "sequence_fitness_mutation_effect_342256486130688/sequence_scores.csv",
    "342256488231936": "sequence_fitness_mutation_effect_342256488231936/sequence_scores.csv",
    "342256491451392": "sequence_fitness_mutation_effect_342256491451392/sequence_scores.csv",
    "342256499057664": "evolutionary_mutation_effect_342256499057664/evolutionary_scores.csv",
    "342256501269504": "evolutionary_mutation_effect_342256501269504/evolutionary_scores.csv",
    "342256504251392": "evolutionary_mutation_effect_342256504251392/evolutionary_scores.csv",
    "342256515642368": "structural_stability_mutation_effect_342256515642368/struct_fitness_scores.csv",
    "342256515908608": "binding_affinity_mutation_effect_342256515908608/affinity_scores.csv",
}
for tid, rel in rawmap.items():
    p = os.path.join(DL, rel)
    if os.path.exists(p):
        cp(p, os.path.join(PKG, "06_mutations/raw_task_outputs", f"{tid}__{os.path.basename(rel)}"))

# ---- provenance + scripts
for f in ["task_manifest.json", "module_status.json"]:
    cp(os.path.join(A, f), os.path.join(PKG, "07_provenance", f))
for f in ["annotate_ab.py", "map_interface.py", "parse_homology.py", "combine_mutations.py",
          "build_overview.py", "build_package_meta.py", "assemble_package.py"]:
    p = os.path.join(A, f)
    if os.path.exists(p):
        cp(p, os.path.join(PKG, "scripts", f))

print("staged files:", sum(len(fs) for _, _, fs in os.walk(PKG)))
