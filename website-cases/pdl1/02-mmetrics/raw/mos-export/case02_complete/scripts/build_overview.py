#!/usr/bin/env python
"""Build Overview module: chain identity, experimental metadata, sequence/UniProt/IMGT cross-map."""
import json, os, csv

BASE = "/workspace/case02"
A = os.path.join(BASE, "analysis")
D = os.path.join(BASE, "data")


def fasta(p):
    return "".join(l.strip() for l in open(p) if not l.startswith(">"))


c2u = json.load(open(os.path.join(A, "chainC_Q9NZQ7_mapping.json")))["chain_C_to_uniprot"]
imgt = json.load(open(os.path.join(A, "imgt_annotation.json")))

chains = [
    {
        "mos_chain": "A", "author_chain": "H", "entity": 1, "role": "avelumab heavy-chain variable domain (VH)",
        "molecule": "avelumab H chain (Fab fragment, VH + CH1 in the crystal; only VH modelled here)",
        "entity_sequence_length": 120, "modelled_residues": 118,
        "modelled_span_entity": [1, 118], "unmodelled_entity_residues": [119, 120],
        "uniprot": None, "uniprot_note": "engineered therapeutic antibody; no UniProt entry for the Fab chain in the CIF",
        "imgt_chain_type_assignments": imgt["chains"]["A"]["best_chain_type_hit"],
    },
    {
        "mos_chain": "B", "author_chain": "L", "entity": 2, "role": "avelumab light-chain variable domain (VL, lambda)",
        "molecule": "avelumab L chain (Fab fragment)",
        "entity_sequence_length": 110, "modelled_residues": 108,
        "modelled_span_entity": [2, 108], "unmodelled_entity_residues": [1, 109, 110],
        "uniprot": None, "uniprot_note": "engineered therapeutic antibody; no UniProt entry for the Fab chain in the CIF",
        "imgt_chain_type_assignments": imgt["chains"]["B"]["best_chain_type_hit"],
    },
    {
        "mos_chain": "C", "author_chain": "A", "entity": 3, "role": "antigen: human PD-L1 immunoglobulin-like ectodomain",
        "molecule": "Programmed cell death 1 ligand 1 (PD-L1 / CD274 / B7-H1), IgV + IgC domains",
        "entity_sequence_length": 221, "modelled_residues": 213,
        "modelled_span_entity": [1, 213], "unmodelled_entity_residues": list(range(214, 222)),
        "uniprot": {
            "accession": "Q9NZQ7", "entry_name": "PD1L1_HUMAN",
            "entity_residue_1_maps_to_uniprot": c2u["1"],
            "entity_residue_221_maps_to_uniprot": c2u["221"],
            "uniprot_span_modelled": [c2u["1"], c2u[str(213)]],
            "uniprot_full_length": 290,
            "domains": {"signal peptide (UniProt SIGNAL)": [1, 18],
                        "Ig-like V-type (UniProt DOMAIN)": [19, 127],
                        "Ig-like C2-type (UniProt DOMAIN)": [128, 225],
                        "extracellular (UniProt TOPO_DOM)": [19, 238],
                        "transmembrane (UniProt TRANSMEM)": [239, 259]},
            "disulfides_observed_in_structure": {"C23-C97": 2.05, "C138-C192": 2.07,
                                                 "unit": "SG-SG distance, A"},
            "cif_struct_ref": "_struct_ref: UNP PD1L1_HUMAN Q9NZQ7, entity 3, fragment 'UNP residues 18-238'",
        },
    },
]

experimental = {
    "pdb_id": "5GRJ",
    "title": "Crystal structure of human PD-L1 with monoclonal antibody avelumab",
    "method": "X-RAY DIFFRACTION",
    "resolution_A": 3.206,
    "temperature_K": 100,
    "spacegroup_note": "as deposited; see raw CIF",
    "citation": {"title": "Structural basis of anti-PD-L1 monoclonal antibody avelumab for tumor therapy.",
                 "journal": "Cell Res.", "year": 2017, "volume": 27, "pages": "151-153",
                 "doi": "10.1038/cr.2016.102", "pmid": 27573173},
    "assembly": "1 Fab (VH+VL) + 1 PD-L1 ectodomain; no Fc in the deposited coordinates",
    "chain_relabeling": {"A": "H", "B": "L", "C": "A"},
    "raw_metadata_file": "data/raw_metadata/5GRJ_raw.cif",
    "sanitized_structure_file": "struct/mos_5GRJ.cif",
}

overview = {
    "provenance": {
        "experimental_input": "RCSB PDB 5GRJ coordinates + CIF metadata (downloaded this session)",
        "chain_relabeling_and_numbering": "MOS sanitization (sanitize via fetch_struct.py; identical to MOS object 342256182768640)",
        "sequence_identity": "CIF entity sequences + UniProt Q9NZQ7 (fetched this session)",
        "antibody_numbering": "local ANARCI (IMGT scheme) — built-in analysis, not a MOS model",
    },
    "experimental_structure": experimental,
    "chains": chains,
    "sequences": {
        "5GRJ_A_full (VH entity)": fasta(os.path.join(D, "5GRJ_A_full.fasta")),
        "5GRJ_B_full (VL entity)": fasta(os.path.join(D, "5GRJ_B_full.fasta")),
        "5GRJ_C_full (PD-L1 construct)": fasta(os.path.join(D, "5GRJ_C_full.fasta")),
        "Q9NZQ7 (PD-L1 canonical)": fasta(os.path.join(D, "Q9NZQ7.fasta")),
    },
    "residue_numbering_convention": {
        "mos_chain_residue": "entity sequence position, 1-based (MOS relabels A,B,C and reindexes)",
        "pdl1_uniprot_number": "mos residue + 18 (verified by global alignment of chain C to Q9NZQ7)",
        "antibody_imgt": "per-residue IMGT numbering in analysis/imgt_residue_mapping.csv",
    },
}
json.dump(overview, open(os.path.join(A, "overview_chain_identity.json"), "w"), indent=2)

with open(os.path.join(A, "overview_chains.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["mos_chain", "author_chain", "entity", "role", "entity_length",
                "modelled_residues", "modelled_span_entity", "uniprot", "uniprot_span"])
    for c in chains:
        up = c["uniprot"]["accession"] if c["uniprot"] else ""
        span = (f"{c['uniprot']['uniprot_span_modelled'][0]}-{c['uniprot']['uniprot_span_modelled'][1]}"
                if c["uniprot"] else "")
        w.writerow([c["mos_chain"], c["author_chain"], c["entity"], c["role"],
                    c["entity_sequence_length"], c["modelled_residues"],
                    f"{c['modelled_span_entity'][0]}-{c['modelled_span_entity'][1]}", up, span])

print(json.dumps({"chains": [(c["mos_chain"], c["role"], c["entity_sequence_length"],
                              c["modelled_residues"],
                              (c["uniprot"] or {}).get("uniprot_span_modelled")) for c in chains],
                  "pdl1_offset": c2u["1"]}, indent=2))
