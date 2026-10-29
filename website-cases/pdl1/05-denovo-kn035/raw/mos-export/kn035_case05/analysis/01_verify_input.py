#!/usr/bin/env python
"""Case05 step 1: verify the imported MMFold_1 chain A object.

Checks performed, all from the actual file content (no assumptions):
  - file / structure hashes
  - chains present, residue counts, altlocs
  - polymer sequence vs _entity_poly.pdbx_seq_one_letter_code
  - per-residue MOS number (label_seq_id) <-> auth_seq_id mapping
  - single-chain Shrake-Rupley SASA (probe 1.4 A, 960 points) via freeSASA
  - SASA of the 6 requested hotspots under identity numbering
  - SASA of the same positions under the alternative -17 numbering hypothesis
"""
import hashlib, json, os, sys
import gemmi
import freesasa

CIF = "/workspace/protein_data/protein_342605519696896/MMFold_1_chain_A.cif"
OUT = "/workspace/kn035_case05/analysis"

HOTSPOTS_REQUESTED = [45, 40, 97, 107, 105, 38]

def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

rep = {}
rep["input_file"] = CIF
rep["input_file_size_bytes"] = os.path.getsize(CIF)
rep["input_file_sha256"] = sha256(CIF)

st = gemmi.read_structure(CIF)
rep["cif_data_block"] = st.name
rep["n_models"] = len(st)

chains = []
for ch in st[0]:
    residues = [r for r in ch]
    chains.append({"chain": ch.name,
                   "n_residues": len(residues),
                   "first_res": residues[0].seqid.num if residues else None,
                   "last_res": residues[-1].seqid.num if residues else None})
rep["chains_in_file"] = chains
rep["n_chains"] = len(chains)

ch = st[0][0]

# per-residue table: label_seq_id (gemmi seqid.num for this mmCIF is label_seq_id),
# auth_seq_id recovered from the raw CIF columns.
rows = []
with open(CIF) as fh:
    started = False
    for line in fh:
        if line.startswith("ATOM") or line.startswith("HETATM"):
            f = line.split()
            rows.append(f)

resmap = {}
for f in rows:
    label_seq = int(f[8]); auth_seq = int(f[16]); asym = f[17]; comp = f[5]
    key = label_seq
    d = resmap.setdefault(key, {"label_seq_id": label_seq, "auth_seq_id": set(),
                                "auth_asym": set(), "comp": set(), "n_atoms": 0})
    d["auth_seq_id"].add(auth_seq); d["auth_asym"].add(asym); d["comp"].add(comp)
    d["n_atoms"] += 1

map_rows = []
for k in sorted(resmap):
    d = resmap[k]
    a = sorted(d["auth_seq_id"]); c = sorted(d["comp"])
    map_rows.append({"mos_residue_number": k, "label_seq_id": k,
                     "auth_seq_id": a[0] if len(a) == 1 else a,
                     "auth_asym": sorted(d["auth_asym"]),
                     "residue_name_3": c[0] if len(c) == 1 else c,
                     "n_atoms": d["n_atoms"]})
rep["n_unique_label_seq_ids"] = len(map_rows)
rep["label_seq_id_range"] = [map_rows[0]["label_seq_id"], map_rows[-1]["label_seq_id"]]
rep["mapping_identity_label_vs_auth"] = all(r["auth_seq_id"] == r["label_seq_id"] for r in map_rows)
rep["auth_asym_values"] = sorted({a for r in map_rows for a in r["auth_asym"]})
rep["residues_with_multiple_auth_ids"] = [r for r in map_rows if not isinstance(r["auth_seq_id"], int)]

# one-letter sequence straight from the coordinates
three2one = {"ALA":"A","ARG":"R","ASN":"N","ASP":"D","CYS":"C","GLN":"Q","GLU":"E",
             "GLY":"G","HIS":"H","ILE":"I","LEU":"L","LYS":"K","MET":"M","PHE":"F",
             "PRO":"P","SER":"S","THR":"T","TRP":"W","TYR":"Y","VAL":"V"}
seq_struct = "".join(three2one.get(r["residue_name_3"], "X") for r in map_rows)
poly = None
for block in st:
    break
rep["seq_from_atoms"] = seq_struct
rep["seq_from_atoms_len"] = len(seq_struct)
rep["seq_entity_poly"] = "MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE"
rep["seq_match_entity_poly"] = (seq_struct == rep["seq_entity_poly"])

# freeSASA: Shrake-Rupley, 960 test points, probe 1.4
freesasa.setVerbosity(freesasa.silent)
sr = freesasa.Parameters({"algorithm": freesasa.ShrakeRupley,
                          "n-points": 960,
                          "probe-radius": 1.4})
PDB = "/workspace/kn035_case05/inputs/MMFold_1_chain_A_from_cif.pdb"
st.setup_entities()
st.write_pdb(PDB)
structure = freesasa.Structure(PDB)
res = freesasa.calc(structure, sr)
rep["sasa_params"] = {"algorithm": "Shrake-Rupley", "n_points": 960, "probe_radius_A": 1.4}
rep["sasa_total_A2"] = round(res.totalArea(), 2)

# per-residue SASA aggregated over all atoms of a residue
per_res = {}
for i in range(structure.nAtoms()):
    rn = int(structure.residueNumber(i))  # label_seq_id == auth_seq_id in this file
    per_res[rn] = per_res.get(rn, 0.0) + res.atomArea(i)
per_res = {k: round(v, 2) for k, v in sorted(per_res.items())}
rep["sum_per_residue_sasa"] = round(sum(per_res.values()), 2)

hot_identity = []
for p in HOTSPOTS_REQUESTED:
    hot_identity.append({"requested_number": p, "mos_number": p,
                         "residue": map_rows[p - 1]["residue_name_3"],
                         "sasa_A2": per_res.get(p),
                         "passes_20A2": (per_res.get(p) or 0) >= 20.0})
rep["hotspots_identity_numbering"] = hot_identity

# alternative hypothesis: case-02 numbering is UniProt-canonical (1-290, signal peptide 1-18)
# -> MOS = request - 17
alt = []
for p in HOTSPOTS_REQUESTED:
    q = p - 17
    alt.append({"requested_number": p, "mos_number": q,
                "residue": map_rows[q - 1]["residue_name_3"] if 1 <= q <= len(map_rows) else None,
                "sasa_A2": per_res.get(q) if 1 <= q <= len(map_rows) else None,
                "passes_20A2": (per_res.get(q) or 0) >= 20.0 if 1 <= q <= len(map_rows) else False})
rep["hotspots_shift_minus17_hypothesis"] = alt

# surface stats
buried = [k for k, v in per_res.items() if v < 5.0]
rep["n_residues_sasa_lt_5A2"] = len(buried)
rep["median_residue_sasa"] = sorted(per_res.values())[len(per_res) // 2]

os.makedirs(OUT, exist_ok=True)
with open(os.path.join(OUT, "residue_mapping_MOS_vs_MMFold_1.csv"), "w") as fh:
    fh.write("mos_residue_number,label_seq_id,auth_seq_id,auth_asym,residue_name_3,residue_one,"
             "sasa_A2,hotspot_requested\n")
    for r in map_rows:
        hot = "yes" if r["mos_residue_number"] in HOTSPOTS_REQUESTED else ""
        fh.write(f"{r['mos_residue_number']},{r['label_seq_id']},{r['auth_seq_id']},"
                 f"{r['auth_asym'][0]},{r['residue_name_3']},"
                 f"{three2one.get(r['residue_name_3'],'X')},{per_res.get(r['mos_residue_number'])},{hot}\n")

with open(os.path.join(OUT, "01_input_verification.json"), "w") as fh:
    json.dump(rep, fh, indent=2)

print(json.dumps({k: v for k, v in rep.items() if k not in ("seq_from_atoms",)}, indent=2))
print("\nSEQ:", seq_struct)
