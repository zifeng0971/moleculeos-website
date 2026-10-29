#!/usr/bin/env python
"""Assemble the case02 data package: provenance manifest, module-status report, README, zip."""
import json, os, shutil, csv, subprocess, datetime

BASE = "/workspace/case02"
PKG = "/workspace/case02_complete"
A = os.path.join(BASE, "analysis")
DL = "/workspace/downloads"

NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

TASKS = [
    # task_id, name, type, status, purpose
    ("342256189539328", "autocompute-5GRJ", "MOSTask (platform autocompute / MMetrics backend)",
     "running", "auto-triggered by structure import; no outputs retrievable"),
    ("342256475304960", "5GRJ_PDL1_homologs", "Sequence Homology Search", "succeeded", "homologs of PD-L1 chain C"),
    ("342256475644928", "5GRJ_VH_homologs", "Sequence Homology Search", "succeeded", "homologs of avelumab VH"),
    ("342256477762560", "5GRJ_VL_homologs", "Sequence Homology Search", "succeeded", "homologs of avelumab VL"),
    ("342256486130688", "5GRJ_VH_seqfitness", "Sequence Fitness Mutation Effect", "succeeded", "VH deep sequence-model mutation scan"),
    ("342256488231936", "5GRJ_VL_seqfitness", "Sequence Fitness Mutation Effect", "succeeded", "VL deep sequence-model mutation scan"),
    ("342256491451392", "5GRJ_PDL1_seqfitness", "Sequence Fitness Mutation Effect", "succeeded", "PD-L1 deep sequence-model mutation scan"),
    ("342256499057664", "5GRJ_VH_evolve", "Evolutionary Mutation Effect", "succeeded", "VH MSA conservation/covariance scan"),
    ("342256501269504", "5GRJ_VL_evolve", "Evolutionary Mutation Effect", "succeeded", "VL MSA conservation/covariance scan"),
    ("342256504251392", "5GRJ_PDL1_evolve", "Evolutionary Mutation Effect", "succeeded", "PD-L1 MSA conservation/covariance scan"),
    ("342256515642368", "5GRJ_complex_structstab", "Structural Stability Mutation Effect", "succeeded", "reverse-folding scan on the 3-chain complex"),
    ("342256515908608", "5GRJ_complex_affinity", "Binding Affinity Mutation Effect", "succeeded", "ddG scan on the VH/VL/PD-L1 complex"),
]

RAW_OUTPUTS = {
    "342256475304960": ["sequence_homology_search_342256475304960/similarity_results.json",
                        "sequence_homology_search_342256475304960/all_sequences.fasta"],
    "342256475644928": ["sequence_homology_search_342256475644928/similarity_results.json",
                        "sequence_homology_search_342256475644928/all_sequences.fasta"],
    "342256477762560": ["sequence_homology_search_342256477762560/similarity_results.json",
                        "sequence_homology_search_342256477762560/all_sequences.fasta"],
    "342256486130688": ["sequence_fitness_mutation_effect_342256486130688/sequence_scores.csv"],
    "342256488231936": ["sequence_fitness_mutation_effect_342256488231936/sequence_scores.csv"],
    "342256491451392": ["sequence_fitness_mutation_effect_342256491451392/sequence_scores.csv"],
    "342256499057664": ["evolutionary_mutation_effect_342256499057664/evolutionary_scores.csv"],
    "342256501269504": ["evolutionary_mutation_effect_342256501269504/evolutionary_scores.csv"],
    "342256504251392": ["evolutionary_mutation_effect_342256504251392/evolutionary_scores.csv"],
    "342256515642368": ["structural_stability_mutation_effect_342256515642368/struct_fitness_scores.csv"],
    "342256515908608": ["binding_affinity_mutation_effect_342256515908608/affinity_scores.csv"],
}

manifest = {"generated_utc": NOW, "pdb": "5GRJ", "mos_object": {
    "object_id": "342256182768640", "work_id": "342256189350912",
    "tos_key": "user_objects/123/330665428816896/sanitized/179246423758257_5GRJ.cif",
    "name": "5GRJ.cif"}, "tasks": []}
for tid, name, ttype, status, purpose in TASKS:
    entry = {"task_id": tid, "name": name, "type": ttype, "status": status, "purpose": purpose,
             "outputs": []}
    for rel in RAW_OUTPUTS.get(tid, []):
        p = os.path.join(DL, rel)
        if os.path.exists(p):
            entry["outputs"].append({"file": rel, "bytes": os.path.getsize(p)})
    manifest["tasks"].append(entry)
json.dump(manifest, open(os.path.join(A, "task_manifest.json"), "w"), indent=2)

# ---------------- module status ----------------
hom = json.load(open(os.path.join(A, "homology/homology_summary.json")))
imgt = json.load(open(os.path.join(A, "imgt_annotation.json")))
ep = json.load(open(os.path.join(A, "epitope_paratope.json")))
mut = json.load(open(os.path.join(A, "mutations/mutation_analysis.json")))

def top_homologs(label, n=5):
    out = []
    for r in hom[label]["top20"]:
        out.append({"hit": r["hit_id"], "description": r["description"],
                    "identity_percent": r["identity_percent_derived"],
                    "alignment_length": r["alignment_length"], "e_value": r["e_value"],
                    "bit_score": r["bit_score"]})
        if len(out) >= n:
            break
    return out

module_status = {
    "generated_utc": NOW,
    "system": "human PD-L1 (Q9NZQ7) + avelumab Fab, PDB 5GRJ",
    "mmetrics_panel": {
        "checked_how": ["ListMOSObjects (object metadata)", "ListMOSTasks / CheckMOSTask (UI backend job)",
                        "GetMOSObject (download of the only registered object)"],
        "object_metadata_fields_returned": ["name", "object_id", "work_id", "tos_key"],
        "mmetrics_result_objects_found": 0,
        "autocompute_job": {"task_id": "342256189539328", "name": "autocompute-5GRJ",
                            "type": "MOSTask", "status_at_inspection": "running",
                            "job_input": {"structure_path": "user_objects/123/330665428816896/sanitized/179246423758257_5GRJ.cif"},
                            "outputs_retrievable": False},
        "verdict": ("The MMetrics panel backend job (autocompute-5GRJ) was created by the structure import and was still "
                    "RUNNING with no retrievable artifacts at inspection time; no MMetrics result object (description, "
                    "metrics, homologs, antibody annotation, interaction summary) exists in the project. MMetrics UI "
                    "modules are therefore reported as UNAVAILABLE, not completed."),
        "ui_states_observed_in_prompt": ["Generating description", "Analyzing structure", "Model Computing"],
    },
    "modules": [
        {
            "module": "Overview (chain identity)",
            "mmetrics_ui": "unavailable",
            "delivered_by": "MOS sanitized object + RCSB CIF metadata + UniProt Q9NZQ7 (built-in, deterministic)",
            "status": "complete",
            "provenance": ["experimental", "database"],
            "artifacts": ["01_overview/overview_chain_identity.json", "01_overview/overview_chains.csv",
                          "01_overview/chainC_Q9NZQ7_mapping.json", "01_overview/*.fasta"],
            "key_facts": {
                "chains": [{"mos": "A", "author": "H", "entity": 1, "role": "avelumab VH",
                            "length": 120, "modelled": 118},
                           {"mos": "B", "author": "L", "entity": 2, "role": "avelumab VL (lambda)",
                            "length": 110, "modelled": 108},
                           {"mos": "C", "author": "A", "entity": 3, "role": "PD-L1 ectodomain",
                            "length": 221, "modelled": 213, "uniprot": "Q9NZQ7",
                            "uniprot_span_modelled": [18, 230]}],
                "resolution_A": 3.206,
                "method": "X-ray diffraction",
            },
        },
        {
            "module": "Description / annotation text (MMetrics 'Generating description')",
            "mmetrics_ui": "unavailable (job still running)",
            "delivered_by": "not produced - substituted with structured overview + interaction narrative",
            "status": "not_available",
            "provenance": [],
            "artifacts": [],
        },
        {
            "module": "Top homologs + similarity",
            "mmetrics_ui": "unavailable",
            "delivered_by": "3 x MOS Sequence Homology Search",
            "status": "complete",
            "provenance": ["mos_prediction"],
            "tasks": ["342256475304960", "342256475644928", "342256477762560"],
            "artifacts": ["02_homologs/PD-L1_homologs.csv", "02_homologs/VH_homologs.csv",
                          "02_homologs/VL_homologs.csv", "02_homologs/homology_summary.json"],
            "key_facts": {
                "PD-L1": {"unique_hits": hom["PD-L1"]["n_unique_hits"],
                          "identical_entries": 42,
                          "closest_ortholog": "mouse PD-L1 6SRU_A at 77.8% identity",
                          "closest_paralog": "PD-L2 Q9BQ51 at 42.8% identity",
                          "top": top_homologs("PD-L1")},
                "VH": {"unique_hits": hom["VH"]["n_unique_hits"],
                       "top": top_homologs("VH")},
                "VL": {"unique_hits": hom["VL"]["n_unique_hits"],
                       "top": top_homologs("VL")},
            },
        },
        {
            "module": "VH/VL + IMGT/CDR annotation",
            "mmetrics_ui": "unavailable",
            "delivered_by": "local ANARCI (IMGT scheme) on entity sequences - built-in analysis, not a MOS model",
            "status": "complete",
            "provenance": ["builtin_analysis"],
            "artifacts": ["03_antibody_annotation/imgt_annotation.json",
                          "03_antibody_annotation/imgt_residue_mapping.csv",
                          "03_antibody_annotation/imgt_cdr_summary.csv"],
            "key_facts": {
                "VH_cdr": {k: v["sequence"] for k, v in imgt["cdr_summary"]["A"]["cdrs"].items()},
                "VL_cdr": {k: v["sequence"] for k, v in imgt["cdr_summary"]["B"]["cdrs"].items()},
                "VH_cdr_mos_span": {k: v["mos_span"] for k, v in imgt["cdr_summary"]["A"]["cdrs"].items()},
                "VL_cdr_mos_span": {k: v["mos_span"] for k, v in imgt["cdr_summary"]["B"]["cdrs"].items()},
                "vh_chain_type_hmm_best": imgt["chains"]["A"]["best_chain_type_hit"],
                "vl_chain_type_hmm_best": imgt["chains"]["B"]["best_chain_type_hit"],
                "caveat": ("ANARCI's best HMM hit for the VH is 'alpaca_H' because the avelumab VH3-23 framework with a "
                           "short CDR-H3 resembles a VHH; the molecule is a conventional human Fab heavy chain. "
                           "Germline gene assignment was not resolved locally (no IMGT germline database in the sandbox)."),
            },
        },
        {
            "module": "Sequence liability / risk sites",
            "mmetrics_ui": "unavailable",
            "delivered_by": "local motif scan (regex panel) on entity sequences - built-in analysis",
            "status": "complete",
            "provenance": ["builtin_analysis"],
            "artifacts": ["04_liabilities/liability_sites.json", "04_liabilities/liability_sites.csv"],
            "key_facts": {"hits": len(json.load(open(os.path.join(A, "liability_sites.json")))["hits"]),
                          "no_n_glycosylation_sequon_in_Fv": True},
        },
        {
            "module": "Antigen-antibody interactions",
            "mmetrics_ui": "unavailable",
            "delivered_by": "InteractionNet (contacts) + PPInterface (burial) via interaction-analysis skill - built-in",
            "status": "complete",
            "provenance": ["builtin_analysis"],
            "artifacts": ["05_interactions/epitope_paratope.json", "05_interactions/epitope_paratope.csv",
                          "05_interactions/interface_summary.md", "05_interactions/contacts/",
                          "05_interactions/if_VH_PDL1/", "05_interactions/if_VL_PDL1/",
                          "05_interactions/interaction_report.jsonl"],
            "key_facts": ep["totals"] | {"interfaces": {k: {kk: vv for kk, vv in v.items() if kk != "hbonds"}
                                                       for k, v in ep["interfaces"].items()}},
        },
        {
            "module": "Mutation scores",
            "mmetrics_ui": "unavailable",
            "delivered_by": "5 MOS scoring tasks (sequence fitness x3, evolutionary x3, structural stability x1 complex, "
                            "binding affinity x1 complex)",
            "status": "complete",
            "provenance": ["mos_prediction"],
            "tasks": [t[0] for t in TASKS if "Mutation" in t[2]],
            "artifacts": ["06_mutations/all_scores_long.csv", "06_mutations/per_axis_position_summary.csv",
                          "06_mutations/raw_task_outputs/"],
            "key_facts": mut["counts"],
        },
        {
            "module": "Recommended mutations",
            "mmetrics_ui": "unavailable",
            "delivered_by": "local synthesis of the 5 MOS scoring axes + local interface/IMGT/liability context",
            "status": "complete",
            "provenance": ["derived"],
            "artifacts": ["06_mutations/recommended_mutations.csv",
                          "06_mutations/liability_mitigation_candidates.csv",
                          "06_mutations/mutation_analysis.json"],
            "key_facts": {"n_recommended_rows": None,
                          "n_liability_mitigation_candidates": len(mut["liability_mitigation"])},
        },
    ],
    "provenance_legend": {
        "experimental": "coordinates/metadata from RCSB PDB 5GRJ (measured structure)",
        "database": "UniProt/PDB records fetched this session",
        "mos_prediction": "outputs of MOS compute tasks launched in this project",
        "builtin_analysis": "deterministic local tools (ANARCI, InteractionNet, PPInterface, regex motif scan)",
        "derived": "combination of MOS predictions with structural context, produced here",
    },
}

rec_path = os.path.join(A, "mutations/recommended_mutations.csv")
module_status["modules"][7]["key_facts"]["n_recommended_rows"] = sum(1 for _ in open(rec_path)) - 1
json.dump(module_status, open(os.path.join(A, "module_status.json"), "w"), indent=2)
print(json.dumps(module_status["modules"][3]["key_facts"]["VH_cdr"], indent=1))
print("written module_status.json, task_manifest.json")
