#!/usr/bin/env python3
"""Assemble results.json from the analysis artifacts on disk (re-runnable)."""
import csv, glob, json, pathlib

def j(p):
    p = pathlib.Path(p)
    return json.load(open(p)) if p.exists() else None

lig = j("analyses/ligand856_pocket_summary.json")
sup = j("analyses/superpose_5xg0_5xh3_summary.json")
red = j("analyses/redesign_variants.json")
subs = j("analyses/design_substitution_scores.json")
build = j("structures/5XG0_WT_HEMT_model_build.json")

aff = list(csv.DictReader(open("native_tasks/affinity_342337422410752/predicted_sipobe_scores.csv")))
aff_native = list(csv.DictReader(open("native_tasks/affinity_338706466620416_manual_native/predicted_sipobe_scores.csv")))

models = {}
for f in sorted(glob.glob("analyses/model_compare_*.json")):
    d = json.load(open(f))
    models[d["label"]] = d

res = {
    "case": "PETase rational engineering around the experimental HEMT site",
    "structures": {
        "5XH3": {"resolution_A": 1.3, "protein_chain": "A (author 1-261)",
                 "engineered": {"AUTH103": "R->G (UNP R132G, packing fix)", "AUTH131": "S->A (UNP S160A, nucleophile knock-out)"},
                 "ligand": {"ccd": "856", "name": "O4-(2-hydroxyethyl) O1-methyl benzene-1,4-dicarboxylate",
                            "abbreviation": "HEMT", "formula": "C11 H12 O5", "heavy_atoms": 16,
                            "smiles": "COC(=O)c1ccc(C(=O)OCCO)cc1",
                            "label_chain": "B", "auth_chain": "A", "auth_resnum": 301}},
        "5XG0": {"resolution_A": 1.58, "chains": "A, B, C (author -6..261, GAGAGAM tag then mature 1-261)", "ligand": None},
        "numbering": {"UNP_equals_AUTH_plus": 29, "CONSTRUCT_equals_AUTH_plus": 7,
                      "catalytic_triad_UNP": [160, 206, 237],
                      "catalytic_triad_AUTH": [131, 177, 208],
                      "oxyanion_hole_backbone_N_UNP": [87, 161],
                      "disulfides_UNP": [[203, 239], [273, 289]]},
    },
    "ligand_site": {
        "contact_cutoff_A": lig["contact_cutoff_A"],
        "n_pocket_residues": lig["n_pocket_residues"],
        "n_atom_contact_pairs": lig["n_contact_pairs"],
        "pocket_residues_AUTH": [57, 58, 60, 130, 131, 132, 156, 179, 208],
        "ligand_buried_fraction": lig["ligand_buried_fraction"],
        "ligand_buried_SASA_A2": lig["ligand_buried_sasa_A2"],
        "polar_contacts": [f"{p['resname']}{p['auth_res']} {p['protein_atom']} -- ligand {p['ligand_atom']} ({p['ligand_role']}) {p['distance']} A"
                           for p in lig["polar_contacts"]],
        "pi_stack": [f"{p['resname']}{p['auth_res']} ring centroid {p['ring_centroid_dist']} A" for p in lig["pi_contacts"]],
        "source": "analyses/ligand_pocket_analysis.py (gemmi/RDKit/freesasa) + interaction-analysis calc_contacts.py",
    },
    "superposition_5XG0_chainC_vs_5XH3_chainA": {
        "matched_CA": sup["matched_CA"], "global_CA_RMSD_A": sup["global_ca_rmsd_A"],
        "pocket_CA_RMSD_A": sup["pocket_ca_rmsd_A"], "catalytic_CA_RMSD_A": sup["catalytic_ca_rmsd_A"],
        "max_CA_dev_A": sup["global_ca_max_dev_A"], "max_CA_dev_auth": sup["global_ca_max_dev_auth"],
        "WT_Ser131_OG_to_ligand_C09_A": sup["wt_Ser131_OG_after_superpose_min_dist_to_ligand_A"],
        "WT_geometry": sup["wt_catalytic_geometry_A"],
        "method": "gemmi superposition, Mocha built-in (no MOS Superimpose task available)",
        "source": "analyses/superpose_5xg0_5xh3_residue_map.csv",
    },
    "affinity_manual_example": {
        "native_reference_task": "338706466620416",
        "this_run_task": "342337422410752",
        "native_score": float(aff_native[0]["score"]) if aff_native else None,
        "this_run_score": float(aff[0]["score"]) if aff else None,
        "components": {"vdw": float(aff[0]["vdw"]), "hbond": float(aff[0]["hbond"]),
                       "metal": float(aff[0]["metal"]), "hydrophobic": float(aff[0]["hydrophobic"])} if aff else None,
        "reproduced": bool(aff and aff_native and abs(float(aff[0]["score"]) - float(aff_native[0]["score"])) < 1e-6),
        "meaning": "positive control that the registered task reproduces the manual example; NOT an engineering readout",
    },
    "wt_scans": {
        "inputs": "5XG0 chain C construct, 268 aa (GAGAGAM tag + mature 1-261), identical sequence in all three tasks",
        "tasks": {"seq": "342337264870400", "evo": "342337268093952", "struct": "342337277858816"},
        "rows_per_file": 5360, "positions": 268, "substitutions_per_position": 20,
        "interpretation": "score 0 = WT itself; positive = model prefers the substitution",
    },
    "design_template": {
        "file": "structures/5XG0_WT_HEMT_model.cif",
        "is_experimental": False,
        "derivation": "5XH3 backbone and side chains (HEMT-bound conformation) + AUTH103 and AUTH131 reverted to WT using superposed 5XG0 rotamers + experimental HEMT pose",
        "superpose_rmsd_A": build["superpose_rmsd_A"] if build else None,
        "Ser131_OG_min_dist_to_ligand_A": build["Ser131_OG_min_dist_to_ligand_A"] if build else None,
        "clashes_under_2.2A": build["reverted_atom_clashes_with_ligand_lt_2.2A"] if build else None,
    },
    "redesign": {
        "task_id": "342338944422912",
        "n_designs_requested": 10, "n_designs_returned": len(red["designs"]),
        "opened_positions_AUTH": red["allowed_positions"],
        "out_of_scope_substitutions": sum(len(v["out_of_scope"]) for v in red["designs"].values()),
        "designs": {k: [f"{w}{p}{m}" for p, w, m in v["diff"]] for k, v in red["designs"].items()},
        "probabilities_available": False,
        "wt_single_substitution_scores": subs,
        "caveat": "single-mutant scores only; not additive; the design trades sequence/evolutionary plausibility for ligand fit",
    },
    "candidate_models": models,
    "claims_not_made": [
        "no predicted binding affinity improvement for any design",
        "no predicted enzymatic activity, kcat, Tm or PET-degradation rate for any design",
        "no claim that 5XH3 represents wild-type PETase",
    ],
}
pathlib.Path("results.json").write_text(json.dumps(res, indent=1))
print("wrote results.json; model comparisons present:", list(models))
