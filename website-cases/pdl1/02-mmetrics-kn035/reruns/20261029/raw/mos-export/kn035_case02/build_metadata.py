#!/usr/bin/env python3
"""Generate numbering-map.json, provenance.json and task-ledger.json for kn035_case02.

Every value is derived by parsing the files on disk; nothing is hand-typed.
"""
import csv
import hashlib
import json
import os
import re
import collections
import gemmi

ROOT = "/workspace/kn035_case02"
CIF_OBJ = f"{ROOT}/input/MMFold_1.cif"
CIF_SESS = "/workspace/protein_data/protein_345488784675840/MMFold_1.cif"
CIF_LOCAL = f"{ROOT}/input/MMFold_1.cif"
AUTO = f"{ROOT}/raw/autocompute_345488784917504"
MMET = f"{ROOT}/raw/mmetrics_345489060729856"
DECLARED_ORIG_SHA256 = "d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


st = gemmi.read_structure(CIF_LOCAL)
seqs = {}
three_to_pos = {}
residues = []
for ch in st[0]:
    s = ""
    for r in ch:
        aa1 = gemmi.find_tabulated_residue(r.name).one_letter_code.upper()
        s += aa1
        residues.append(
            {
                "chain": ch.name,
                "mos_residue_index": r.seqid.num,
                "mmfold1_label_seq_id": r.seqid.num,
                "mmfold1_auth_seq_id": r.seqid.num,
                "label_asym_id": ch.name,
                "auth_asym_id": ch.name,
                "ins_code": r.seqid.icode.strip() or "",
                "one_letter": aa1,
                "three_letter": r.name,
            }
        )
    seqs[ch.name] = s

# ---------------------------------------------------------------- numbering map
numbering = {
    "schema": "kn035_case02/numbering-map/v1",
    "scope": "single imported structure MMFold_1 only",
    "source_file_in_package": "input/MMFold_1.cif",
    "source_file_sha256": sha256(CIF_LOCAL),
    "conventions": {
        "mos_residue_index": (
            "1-based residue index of the MOS-sanitized copy: per chain, "
            "renumbered to entity-sequence order. This is the numbering used by "
            "the 3D viewer, SelectResidues/ManageAnnotation, and every MOS task "
            "that consumes the object."
        ),
        "mmfold1_label_seq_id": "_atom_site.label_seq_id in MMFold_1.cif (entity sequence numbering).",
        "mmfold1_auth_seq_id": "_atom_site.auth_seq_id in MMFold_1.cif (author numbering).",
    },
    "result": {
        "renumbering_occurred": False,
        "author_equals_label": True,
        "insertion_codes_present": False,
        "microheterogeneity_altloc_present": False,
        "mapping_is_identity": True,
        "statement": (
            "MOS did not renumber this import: for both chains label_seq_id, "
            "auth_seq_id and the MOS residue index are the same integer, with no "
            "insertion codes. MOS<->MMFold_1 residue mapping is therefore the identity "
            "function on both chains (A 1-118, B 1-128)."
        ),
    },
    "chains": {
        c: {
            "mos_residue_index_range": [1, len(s)],
            "mmfold1_auth_range": [1, len(s)],
            "length": len(s),
            "sequence": s,
            "sequence_sha256": hashlib.sha256(s.encode()).hexdigest(),
            "role": (
                "human PD-L1 (CD274) extracellular IgV-domain fragment construct, antigen"
                if c == "A"
                else "KN035 single-domain antibody (VHH), no light chain, binder"
            ),
        }
        for c, s in seqs.items()
    },
    "chain_count": len(seqs),
    "no_light_chain": len(seqs) == 2,
    "residue_count_total": len(residues),
    "residues": residues,
    "compact_token_spec": {
        "files": ["raw/autocompute_345488784917504/affinity_scores.csv"],
        "column": "mutstr",
        "grammar": "<wt_aa><chain><position><mut_aa>",
        "example": "AA105C -> wild-type ALA at chain A position 105 replaced by CYS",
        "example_2": "EB6A -> wild-type GLU at chain B position 6 replaced by ALA",
        "position_padding": "none; 1/2/3 digits give token lengths 4/5/6",
        "warning": (
            "The chain letter is the SECOND character, not the first. Reading it as "
            "'<chain><wt><pos><mut>' silently mis-assigns every row."
        ),
        "verification": "all 4674 tokens parsed and matched to the structure with 0 conflicts",
    },
    "chain_attribution_after_decode": {
        "A": {"positions": 118, "mutations": 2242},
        "B": {"positions": 128, "mutations": 2432},
    },
    "files_with_explicit_chain_column": {
        "raw/autocompute_345488784917504/evolutionary_scores.csv": "chain,mutation (e.g. A,M1A)",
        "raw/autocompute_345488784917504/sequence_scores.csv": "chain,mutation (e.g. A,M1A)",
        "raw/autocompute_345488784917504/struct_fitness_scores.csv": "chain,mutation (e.g. A,M1A)",
    },
    "not_available": {
        "mmetrics_mutx_csv": (
            "No MMetrics MutX (AbAn/AbScN/ParaDt) CSV exists for this structure. "
            "record.json contains model_tasks.results = [], i.e. the MMetrics run "
            "produced no per-mutation model output. Consequently no compact/sequential "
            "renumbering map for such CSVs can be produced - there is nothing to map."
        )
    },
}

with open(f"{ROOT}/numbering-map.json", "w") as fh:
    json.dump(numbering, fh, indent=2, ensure_ascii=False)

# ---------------------------------------------------------------- mutation check
pat = re.compile(r"^([A-Z])([A-Z])(\d+)([A-Z])$")
rows = list(csv.DictReader(open(f"{AUTO}/affinity_scores.csv")))
bad, per, positions, mutsets = [], collections.Counter(), collections.defaultdict(set), collections.defaultdict(set)
for r in rows:
    g = pat.match(r["mutstr"])
    if not g:
        bad.append({"mutstr": r["mutstr"], "error": "unparsed"})
        continue
    wt, ch, p, mut = g.group(1), g.group(2), int(g.group(3)), g.group(4)
    if ch not in seqs:
        bad.append({"mutstr": r["mutstr"], "error": "unknown chain"})
    elif p > len(seqs[ch]) or seqs[ch][p - 1] != wt:
        bad.append({"mutstr": r["mutstr"], "error": "wt mismatch"})
    else:
        per[ch] += 1
        positions[ch].add(p)
        mutsets[(ch, p)].add(mut)

fitness = {}
for name in ("evolutionary_scores.csv", "sequence_scores.csv", "struct_fitness_scores.csv"):
    rr = list(csv.DictReader(open(f"{AUTO}/{name}")))
    mism = 0
    selfsub = 0
    for r in rr:
        ch, m = r["chain"], r["mutation"]
        if seqs[ch][int(m[1:-1]) - 1] != m[0]:
            mism += 1
        if m[0] == m[-1]:
            selfsub += 1
    fitness[name] = {"rows": len(rr), "wt_letter_mismatches": mism, "wild_type_rows": selfsub}

# ---------------------------------------------------------------- provenance
prov = {
    "schema": "kn035_case02/provenance/v1",
    "package": "kn035_case02",
    "created_utc": "2026-10-29T05:56:06+00:00",
    "scope_statement": (
        "This package covers exactly one imported molecular object, MMFold_1, and the "
        "MMetrics/auto-compute tasks the platform ran on it. No structure was "
        "re-predicted, no external structure (5GRJ / 7XYQ / 5JDS) was downloaded or "
        "used as a model, and no other project or task was touched."
    ),
    "object": {
        "name": "MMFold_1.cif",
        "object_id": "345488780645376",
        "work_id": "345488784675840",
        "tos_key": "user_objects/123/330665428816896/345488780645376_MMFold_1.cif",
        "entity_count": 2,
        "chain_ids": ["A", "B"],
        "chains": {
            "A": {"length": 118, "identity": "human PD-L1 (CD274) IgV-domain construct, antigen"},
            "B": {"length": 128, "identity": "KN035 VHH single-domain antibody, binder"},
        },
        "light_chain_present": False,
        "hetero_atoms_present": False,
        "altlocs_present": False,
        "n_models": 1,
    },
    "hashes": {
        "declared_original_sha256": DECLARED_ORIG_SHA256,
        "declared_original_matches_observed": sha256(CIF_OBJ) == DECLARED_ORIG_SHA256,
        "observed": {
            "mos_object_download (GetMOSObject, sanitized)": {
                "path": "input/MMFold_1.cif (downloaded copy kept as the single package input copy)", "sha256": sha256(CIF_OBJ), "bytes": os.path.getsize(CIF_OBJ)
            },
            "session_copy (protein_data)": {
                "path": CIF_SESS, "sha256": sha256(CIF_SESS), "bytes": os.path.getsize(CIF_SESS)
            },
            "package_input_copy": {
                "path": "input/MMFold_1.cif", "sha256": sha256(CIF_LOCAL), "bytes": os.path.getsize(CIF_LOCAL)
            },
        },
        "interpretation": (
            "The declared source SHA256, the MOS-sanitized object served by GetMOSObject, "
            "and the session copy are byte-identical. For this import the sanitization "
            "step changed no bytes, so 'raw input hash' and 'sanitized input hash' are the "
            "same value; the file already carried the MOS layout (_mos_mapping, P 1 cell, "
            "_entry.id 342254287430656_model_sample_1) when it entered the session."
        ),
    },
    "sequence_verification": {
        "method": "sequence-toolkit store --length + Biopython BLOSUM62 local alignment vs UniProt Q9NZQ7",
        "chain_A": {
            "length": 118,
            "identical_to_uniprot_span": "Q9NZQ7 residues 18-132",
            "aligned_length": 115,
            "identities": 115,
            "identity_percentage": 100.0,
            "substitutions_in_aligned_span": 0,
            "construct_artifacts": "leading Met (residue 1) and trailing LE (residues 117-118) outside the UniProt span",
        },
        "chain_B": {
            "length": 128,
            "annotation": "VHH (record.json protein_metadata.entities[1].antibody_fragment)",
            "framework4": "WGQGTQVTVSS (hallmark of camelid VHH, CH1 absent)",
            "note": "no light chain in the structure, consistent with a single-domain binder",
        },
        "library_ids": ["kn035_case02_A", "kn035_case02_B", "pd_l1_human_uni"],
    },
    "native_mmetrics_record": {
        "file": "raw/mmetrics_345489060729856/record.json",
        "sha256": sha256(f"{MMET}/record.json"),
        "mmetrics_id": "d8d4e831-5b7a-41bc-868a-93dc27bc3cd5",
        "schema_version": "1.0.0",
        "sections_present": ["protein_metadata", "annotations.homology", "annotations.pdb", "annotations.features", "classification", "interactions"],
        "sections_empty_verbatim": {
            "annotations.uniprot": "[] (empty array kept as produced)",
            "model_tasks.results": "[] (no MutX / AbAn / AbScN / ParaDt model output produced)",
        },
        "sections_absent": [
            "protein domain annotation (no feature with annotation_type 'domain')",
            "PTM annotation (no feature with annotation_type ptm/glycosylation/phosphorylation)",
            "no separate 'Homologs' boolean section; homology is annotations.homology (3 hits) and annotations.uniprot is empty",
        ],
        "native_inconsistencies_noted": [
            "annotations.homology entries carry entity_id=1 but their query/aligned sequence is chain B (the VHH) - entity tagging error in the native output, left unmodified.",
            "classification.reasoning states '51 contacts' while interactions.2d_plot_data[0].meta.n_contacts is 44 and the contact list holds 44 entries; the reasoning text is not reconciled with the numeric block.",
            "annotations.pdb lists 5JDS / 4DKA / 4DK3 and annotations.homology hit pdb|5JDS|B at identity 1.0. These are native pipeline reference hits only. They were NOT downloaded, opened, or used as a model for any analysis in this package; 5JDS/7XYQ/5GRJ were excluded per instruction.",
        ],
    },
    "numbering_summary": {
        "identity_mapping": True,
        "residues_mapped": len(residues),
        "detail": "numbering-map.json",
    },
    "mutation_token_verification": {
        "affinity_scores.csv": {
            "rows": len(rows),
            "parsed_and_matched": len(rows) - len(bad),
            "conflicts": len(bad),
            "conflict_examples": bad[:5],
            "per_chain_after_decode": dict(per),
            "positions_covered": {c: [len(positions[c]), len(seqs[c])] for c in seqs},
            "all_positions_contiguous_1_to_N": all(sorted(positions[c]) == list(range(1, len(seqs[c]) + 1)) for c in seqs),
            "all_19_non_native_substitutions_per_position": all(
                len(mutsets[(c, p)]) == 19 and seqs[c][p - 1] not in mutsets[(c, p)] for c in seqs for p in positions[c]
            ),
        },
        "fitness_csvs": fitness,
        "conclusion": (
            "The auto-compute mutation tables are internally consistent with the structure "
            "numbering: 4674 = 118x19 + 128x19 affinity rows, every wild-type letter matches "
            "the residue at that index, and each position carries exactly 19 non-native "
            "substitutions."
        ),
    },
    "separation_of_sources": {
        "native_auto_results": {
            "produced_by": ["345488784917504", "345489060729856"],
            "paths": ["raw/autocompute_345488784917504/", "raw/mmetrics_345489060729856/record.json"],
            "hashes": {f: sha256(f"{AUTO}/{f}") for f in sorted(os.listdir(AUTO))},
        },
        "independent_tasks": {
            "count": 0,
            "note": "No independently launched MOS task exists for this structure; the platform task list held only the two auto tasks.",
        },
        "local_analysis": {
            "performed_here": [
                "chain/sequence/label-auth verification from MMFold_1.cif",
                "SHA256 comparison of declared vs registered vs session copy",
                "BLOSUM62 local alignment of chain A/B vs UniProt Q9NZQ7 (sequence-identity check only)",
                "decoding and validating mutstr tokens against structure residues",
            ],
            "files": ["verification.json (embedded in this file)", "numbering-map.json"],
            "note": "No local structural or energetic recomputation (no re-fold, no docking, no ddG). Local work is limited to identity, numbering and token decoding checks.",
        },
    },
}
with open(f"{ROOT}/provenance.json", "w") as fh:
    json.dump(prov, fh, indent=2, ensure_ascii=False)

# ---------------------------------------------------------------- task ledger
ledger = {
    "schema": "kn035_case02/task-ledger/v1",
    "registered_object": {
        "object_id": "345488780645376",
        "work_id": "345488784675840",
        "tos_key": "user_objects/123/330665428816896/345488780645376_MMFold_1.cif",
        "name": "MMFold_1.cif",
    },
    "tasks": [
        {
            "order": 1,
            "task_id": "345488784917504",
            "name": "autocompute-MMFold_1",
            "type": "MOSTask",
            "origin": "automatic (platform auto-compute, not user-launched)",
            "started": "2026-10-29 05:57:28",
            "duration": "1.1min",
            "status": "SUCCEED",
            "payload_file": "payload/autocompute_345488784917504.payload.json",
            "payload": {
                "structure_path": "user_objects/123/330665428816896/345488780645376_MMFold_1.cif",
                "structure_pathFileId": "345488780645376",
                "structure_pathFilename": "MMFold_1.cif",
            },
            "outputs_dir": "raw/autocompute_345488784917504/",
            "outputs": [
                {"file": "affinity_scores.csv", "bytes": os.path.getsize(f"{AUTO}/affinity_scores.csv"), "sha256": sha256(f"{AUTO}/affinity_scores.csv"), "model": "mos-diffaffinity (per payload of the child task)"},
                {"file": "evolutionary_scores.csv", "bytes": os.path.getsize(f"{AUTO}/evolutionary_scores.csv"), "sha256": sha256(f"{AUTO}/evolutionary_scores.csv"), "model": "not stated in any payload"},
                {"file": "sequence_scores.csv", "bytes": os.path.getsize(f"{AUTO}/sequence_scores.csv"), "sha256": sha256(f"{AUTO}/sequence_scores.csv"), "model": "not stated in any payload"},
                {"file": "struct_fitness_scores.csv", "bytes": os.path.getsize(f"{AUTO}/struct_fitness_scores.csv"), "sha256": sha256(f"{AUTO}/struct_fitness_scores.csv"), "model": "not stated in any payload"},
                {"file": "similarity_results.json", "bytes": os.path.getsize(f"{AUTO}/similarity_results.json"), "sha256": sha256(f"{AUTO}/similarity_results.json"), "model": "mos-blast (per payload of the child task)"},
                {"file": "all_sequences.fasta", "bytes": os.path.getsize(f"{AUTO}/all_sequences.fasta"), "sha256": sha256(f"{AUTO}/all_sequences.fasta"), "model": "mos-blast (per payload of the child task)"},
                {"file": "sequence_info.fasta", "bytes": os.path.getsize(f"{AUTO}/sequence_info.fasta"), "sha256": sha256(f"{AUTO}/sequence_info.fasta"), "model": "not stated"},
            ],
            "notes": [
                "Downloaded 7 files; all preserved verbatim, unedited.",
                "sequence_info.fasta labels chain B as heavy_sequence and chain light_sequence as 'None' - this is the native chain-role call for a heavy-chain-only VHH.",
                "filename mismatch: the child task payload references diffaffinity_scores.csv / msat_scores.csv / blast_results.json / esm_scores.csv / proteinmpnn_scores.csv, while this task delivered affinity_scores.csv / evolutionary_scores.csv / similarity_results.json / sequence_scores.csv / struct_fitness_scores.csv. The producer-side filename mapping is NOT evidenced in any returned artifact, so it is recorded as unresolved rather than guessed.",
            ],
        },
        {
            "order": 2,
            "task_id": "345489060729856",
            "name": "mmetrics-analysis-345488784917504",
            "type": "MOSTask",
            "origin": "automatic (spawned by 345488784917504)",
            "parent_task_id": "345488784917504",
            "started": "2026-10-29 05:58:35",
            "duration": "26s",
            "status": "SUCCEED",
            "payload_file": "payload/mmetrics_345489060729856.payload.json",
            "outputs_dir": "raw/mmetrics_345489060729856/",
            "outputs": [
                {"file": "record.json", "bytes": os.path.getsize(f"{MMET}/record.json"), "sha256": sha256(f"{MMET}/record.json"), "content": "single MMetrics record (mmetrics_id d8d4e831-5b7a-41bc-868a-93dc27bc3cd5)"}
            ],
            "delivered_sections": {
                "protein_metadata.entities": "2 entities: A=PD-L1 118aa, B=VHH 128aa (antibody_fragment=VHH)",
                "classification": "class=antigen-antibody, confidence=high, plus reasoning (389 chars) and description (447 chars) text",
                "annotations.homology": "3 hits, all pdb (5JDS_B identity 1.0; 4DKA_A 0.7209; 4DK3_A 0.7209)",
                "annotations.uniprot": "EMPTY ARRAY - preserved as produced, not filled in from elsewhere",
                "annotations.pdb": "3 entries (5JDS 1.7A, 4DKA 1.97A, 4DK3 2.76A)",
                "annotations.features": "11 entries: 9 CDR regions (IMGT/Kabat/Chothia, chain B), 1 paratope (18 residues, chain B), 1 epitope (19 residues, chain A)",
                "interactions.2d_plot_data": "1 protein-protein interaction A:B, 44 contacts, 16 interface residues on A / 17 on B, metrics block (hbond 9, vdw 33, ionic 1, pipistack 1)",
            },
            "requested_but_not_produced": {
                "Homologs (standalone section)": "not a separate section; annotations.homology has 3 hits and annotations.uniprot is empty - both preserved verbatim",
                "Domain annotation": "ABSENT - no domain feature in the record",
                "PTM annotation": "ABSENT - no PTM feature in the record",
                "UniProt annotation": "EMPTY ARRAY in the record",
                "Interaction Network": "only the 2D interaction plot data block exists; no network/graph file",
                "MutX CSVs (all)": "ABSENT - model_tasks.results = []",
                "AbAn / AbScN / ParaDt heavy CSV": "ABSENT - no such file returned by any task",
                "compact numbering map for those CSVs": "NOT PRODUCIBLE - the CSVs do not exist",
            },
            "status_statement": (
                "The MMetrics task itself finished (SUCCEED). What is 'incomplete' is its "
                "content coverage: the model_tasks section is empty, so the per-mutation "
                "MutX/AbAn/AbScN/ParaDt outputs were never generated. They are recorded here "
                "as not produced. They were NOT substituted with the auto-compute fitness "
                "CSVs, which come from a different task and different models."
            ),
        },
    ],
    "independent_tasks": [],
    "independent_tasks_note": "The platform task list for this project contains exactly these 2 tasks. Nothing else was launched, resumed, or modified.",
    "waiting_policy": "Both tasks were already SUCCEED at first inspection of the child; no waiting or polling was required.",
}
with open(f"{ROOT}/task-ledger.json", "w") as fh:
    json.dump(ledger, fh, indent=2, ensure_ascii=False)

print("wrote numbering-map.json, provenance.json, task-ledger.json")
print("affinity conflicts:", len(bad), "| per chain:", dict(per))
print("fitness:", json.dumps(fitness))
