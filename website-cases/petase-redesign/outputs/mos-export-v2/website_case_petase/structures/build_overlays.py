#!/usr/bin/env python3
"""Build WT + candidate overlay structures for native screenshots.

Each overlay contains exactly two protein chains and nothing else:
  chain A = wild-type IsPETase, 5XG0 chain C, author residues 1-261
            (the GAGAGAM tag at -6..0 is dropped; coordinates untouched)
  chain B = MMFold model of the design, rigid-body superposed onto chain A
            (261 CA, transform from analyses/compare_model_to_wt.py)

No ligand is included. The HEMT pose is experimental only in 5XH3 and exists in
this project as `5XH3_HEMT_complex`; the constructed `5XG0_WT_HEMT_model` carries
a transplanted pose and is labelled as a model. These overlays therefore must
not be described as experimental candidate complexes.
"""
import json, math, pathlib
import gemmi

MODELS = {
    "seq_4": "native_tasks/mmfold_seq_4_342339217835008/179248463320004_model_sample_1.cif",
    "seq_2": "native_tasks/mmfold_seq_2_342339221820416/179248463619830_model_sample_1.cif",
    "seq_1": "native_tasks/mmfold_seq_1_342339232719872/179248463080003_model_sample_1.cif",
}
SUBST = {
    "seq_4": "W130H W156Y D157H S209G",
    "seq_2": "W130H W156Y D157Y S209G",
    "seq_1": "W130H W156Y D157H I179V S209G",
}
OUT = pathlib.Path("structures/overlays")
OUT.mkdir(parents=True, exist_ok=True)

wt_st = gemmi.read_structure("inputs/5XG0.cif")
wt_st.setup_entities()
wt_chain = [c for c in wt_st[0] if c.name == "C"][0]
wt_res = [r for r in wt_chain if r.het_flag == "A" and r.seqid.num >= 1]

manifest = []
for label, path in MODELS.items():
    md = gemmi.read_structure(path)
    mchain = [c for c in md[0] if any(r.het_flag == "A" for r in c)]
    mchain = max(mchain, key=lambda c: len([r for r in c if r.het_flag == "A"]))
    mres = {r.seqid.num: r for r in mchain if r.het_flag == "A"}
    ids = sorted(set(r.seqid.num for r in wt_res) & set(mres))
    sup = gemmi.superpose_positions(
        [r.find_atom("CA", "*").pos for r in wt_res if r.seqid.num in ids],
        [mres[i].find_atom("CA", "*").pos for i in ids])
    tf = sup.transform   # gemmi maps pos2 -> pos1, i.e. model -> WT here

    st = gemmi.Structure()
    st.spacegroup_hm = "P 1"
    st.cell = gemmi.UnitCell(100, 100, 100, 90, 90, 90)
    model = gemmi.Model("1")

    chA = gemmi.Chain("A")
    for r in wt_res:
        nr = gemmi.Residue(); nr.name = r.name; nr.seqid = r.seqid; nr.het_flag = "A"
        for a in r:
            na = gemmi.Atom(); na.name = a.name; na.element = a.element
            na.pos = a.pos; na.occ = 1.0; na.b_iso = a.b_iso
            nr.add_atom(na)
        chA.add_residue(nr)
    model.add_chain(chA)

    chB = gemmi.Chain("B")
    for i in ids:
        r = mres[i]
        nr = gemmi.Residue(); nr.name = r.name; nr.seqid = gemmi.SeqId(str(i), " "); nr.het_flag = "A"
        for a in r:
            v = tf.apply(gemmi.Vec3(a.pos.x, a.pos.y, a.pos.z))
            na = gemmi.Atom(); na.name = a.name; na.element = a.element
            na.pos = gemmi.Position(v.x, v.y, v.z); na.occ = 1.0; na.b_iso = a.b_iso
            nr.add_atom(na)
        chB.add_residue(nr)
    model.add_chain(chB)
    st.add_model(model)
    st.assign_serial_numbers()

    cif = OUT / f"overlay_WT_chainA_{label}_chainB.cif"
    pdb = OUT / f"overlay_WT_chainA_{label}_chainB.pdb"
    st.make_mmcif_document().write_file(str(cif))
    st.write_pdb(str(pdb))

    # verification: chain A vs 5XG0, and chain B vs the original prediction
    devs = []
    for i in ids:
        a = [r for r in chA if r.seqid.num == i][0].find_atom("CA", "*").pos
        b = [r for r in chB if r.seqid.num == i][0].find_atom("CA", "*").pos
        devs.append(math.dist((a.x, a.y, a.z), (b.x, b.y, b.z)))
    manifest.append({
        "file_cif": str(cif), "file_pdb": str(pdb), "candidate": label,
        "substitutions_AUTH": SUBST[label],
        "chain_A": "wild-type IsPETase, 5XG0 chain C, author 1-261, experimental coordinates, no ligand, no tag",
        "chain_B": f"MMFold prediction for candidate {label} (task payload name PETase_design_{label}), model_sample_1, rigid-body superposed onto chain A",
        "chain_B_source_file": path,
        "matched_CA": len(ids),
        "superpose_RMSD_A": round(sup.rmsd, 3),
        "max_CA_dev_after_superpose_A": round(max(devs), 3),
        "contains_ligand": False,
        "not_an_experimental_complex": True,
    })
    print(f"{label}: {len(ids)} CA matched, superpose RMSD {sup.rmsd:.3f} A, max dev {max(devs):.3f} A -> {cif.name}")

(OUT / "overlay_manifest.json").write_text(json.dumps(manifest, indent=1))
print("wrote", OUT / "overlay_manifest.json")
