import gemmi, json, hashlib, re

cif_path = "/workspace/kn035_case02/raw/sanitized/MMFold_1.cif"
raw = open(cif_path, "rb").read()
sha = hashlib.sha256(raw).hexdigest()
text = raw.decode()

# --- entity_poly block
ent_poly = {}
m = re.search(r"loop_\n_entity_poly\.entity_id\n_entity_poly\.type\n_entity_poly\.pdbx_strand_id\n_entity_poly\.pdbx_seq_one_letter_code\n(.*?)\n#", text, re.S)
for line in m.group(1).splitlines():
    parts = line.split()
    if len(parts) >= 4:
        ent_poly[parts[0]] = {"type": parts[1], "strand": parts[2], "seq": "".join(parts[3:])}

# --- struct_asym
asym = {}
m = re.search(r"loop_\n_struct_asym\.id\n_struct_asym\.entity_id\n(.*?)\n#", text, re.S)
for line in m.group(1).splitlines():
    p = line.split()
    if len(p) == 2:
        asym[p[0]] = p[1]

# --- entity_poly_seq (full entity sequence incl. unmodelled)
ent_seq = {}
m = re.search(r"loop_\n_entity_poly_seq\.entity_id\n_entity_poly_seq\.num\n_entity_poly_seq\.mon_id\n_entity_poly_seq\.hetero\n(.*?)\n#", text, re.S)
three2one = {}
for line in m.group(1).splitlines():
    p = line.split()
    if len(p) >= 4:
        ent_seq.setdefault(p[0], []).append((int(p[1]), p[2], p[3]))
        three2one[p[2]] = gemmi.find_tabulated_residue(p[2]).one_letter_code

# --- mos_mapping loop
mm = re.findall(r"^([A-Za-z0-9]) (\d+)\s+(\S+) ([A-Za-z0-9]) (\d+)\s+(\S+)\s*$", text, re.M)
# restrict to the mapping block
mblock = re.search(r"_mos_mapping\.auth_icode\n(.*)$", text, re.S).group(1)
mm = []
for line in mblock.splitlines():
    p = line.split()
    if len(p) == 6:
        mm.append({"mapped_chainid": p[0], "mapped_seqidx": int(p[1]), "mapped_icode": p[2],
                   "auth_chainid": p[3], "auth_seqidx": int(p[4]), "auth_icode": p[5]})

st = gemmi.read_structure(cif_path)
model = st[0]
chains = []
for ch in model:
    residues = []
    for r in ch:
        info = gemmi.find_tabulated_residue(r.name)
        residues.append({
            "label_asym_id": ch.name,
            "label_entity_id": asym.get(ch.name),
            "label_seq_id": r.seqid.num,
            "pdbx_PDB_ins_code": r.seqid.icode.strip() or ".",
            "auth_asym_id": ch.name,
            "auth_seq_id": r.seqid.num,
            "auth_ins_code": r.seqid.icode.strip() or ".",
            "resname": r.name,
            "one_letter": info.one_letter_code if info else "X",
            "n_atoms": len(r),
            "altlocs": sorted({a.altloc for a in r if a.altloc.strip()}),
        })
    chains.append({
        "label_asym_id": ch.name,
        "auth_asym_id": ch.name,
        "entity_id": asym.get(ch.name),
        "entity_type": ent_poly.get(asym.get(ch.name), {}).get("type"),
        "n_residues_observed": len(residues),
        "observed_sequence": "".join(x["one_letter"] for x in residues),
        "residues": residues,
    })

# entity sequences from entity_poly_seq (all residues, modelled or not)
entity_seq = {eid: "".join(three2one.get(mn, "X") for _, mn, _ in rows) for eid, rows in ent_seq.items()}

out = {
    "source_file": cif_path,
    "sha256": sha,
    "file_bytes": len(raw),
    "data_block": text.splitlines()[0].replace("data_", ""),
    "entity_poly": ent_poly,
    "entity_seq_one_letter_from_entity_poly_seq": entity_seq,
    "struct_asym": asym,
    "mos_mapping_rows": len(mm),
    "mos_mapping": mm,
    "chains": chains,
}
json.dump(out, open("/workspace/kn035_case02/work/numbering_raw.json", "w"), indent=1)

print("data_block:", out["data_block"], "bytes:", len(raw), "sha256:", sha)
for e, v in ent_poly.items():
    print(f"entity {e}: chain {v['strand']} type {v['type']} len(entity_poly)={len(v['seq'])}")
for e, s in entity_seq.items():
    print(f"entity {e}: entity_poly_seq len={len(s)}")
for c in chains:
    print(f"chain {c['label_asym_id']} entity {c['entity_id']}: observed {c['n_residues_observed']} label {c['residues'][0]['label_seq_id']}-{c['residues'][-1]['label_seq_id']} auth {c['residues'][0]['auth_seq_id']}-{c['residues'][-1]['auth_seq_id']}")
print("mos_mapping rows:", len(mm), "| chain counts:", {ch: sum(1 for x in mm if x['mapped_chainid']==ch) for ch in set(x['mapped_chainid'] for x in mm)})
# identity checks
for c in chains:
    eid = c["entity_id"]
    print(f"chain {c['label_asym_id']}: observed == entity_poly_seq ? {c['observed_sequence']==entity_seq[eid]}  observed==entity_poly ? {c['observed_sequence']==ent_poly[eid]['seq']}")
    lab = [r["label_seq_id"] for r in c["residues"]]
    auth = [r["auth_seq_id"] for r in c["residues"]]
    print("   label==auth numbering:", lab==auth, "| contiguous 1..N:", lab==list(range(1,len(lab)+1)))
    print("   icodes all '.':", all(r["pdbx_PDB_ins_code"]=="." for r in c["residues"]), "| altlocs:", sorted({a for r in c['residues'] for a in r['altlocs']}))
print("mapping identity mapped_seqidx==auth_seqidx for all rows:", all(x["mapped_seqidx"]==x["auth_seqidx"] and x["mapped_chainid"]==x["auth_chainid"] for x in mm))
