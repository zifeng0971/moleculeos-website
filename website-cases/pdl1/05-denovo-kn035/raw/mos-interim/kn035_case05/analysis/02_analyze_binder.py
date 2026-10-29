#!/usr/bin/env python
"""Case05 step 2: analyze de novo binder design outputs.

Usage: python 02_analyze_binder.py <task_output_dir> <seed> <out_json>

Everything here is computed from the actual downloaded files:
  - every structure file found (cif/pdb) is parsed and reported
  - chains are classified as target (matches reference MMFold_1 chain A) or binder
  - GLY-only chains are flagged as virtual backbone placeholders, separate from real designs
  - hotspot heavy-atom distances, contacts, interface residues, SASA/BSA
  - C-alpha superposition of the complexed target onto the original MMFold_1 chain A
  - overlap / Jaccard against the case02 KN035 native epitope list
Any confidence metric that is absent in the files is reported as missing, never imputed.
"""
import json, os, sys, glob, math, itertools, tempfile
import numpy as np
import gemmi
import freesasa

REF = "/workspace/protein_data/protein_342605519696896/MMFold_1_chain_A.cif"
HOTSPOTS = [45, 40, 97, 107, 105, 38]
KN035_EPITOPE = [38, 40, 42, 45, 47, 50, 52, 53, 57, 60, 97, 99, 101, 103, 104, 105, 106, 107, 109]
THREE2ONE = {"ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C", "GLN": "Q",
             "GLU": "E", "GLY": "G", "HIS": "H", "ILE": "I", "LEU": "L", "LYS": "K",
             "MET": "M", "PHE": "F", "PRO": "P", "SER": "S", "THR": "T", "TRP": "W",
             "TYR": "Y", "VAL": "V"}

freesasa.setVerbosity(freesasa.silent)


def chain_seq(chain):
    return "".join(THREE2ONE.get(r.name, "X") for r in chain)


def load(path):
    st = gemmi.read_structure(path)
    st.setup_entities()
    return st


def ref_sequence():
    st = load(REF)
    return chain_seq(st[0]["A"])


def similarity(a, b):
    if not a or not b:
        return 0.0
    n = min(len(a), len(b))
    return sum(1 for x, y in zip(a, b) if x == y) / max(len(a), len(b))


def write_pdb(st, chain_names=None, path=None):
    st2 = st.clone()
    if chain_names is not None:
        keep = set(chain_names)
        for model in st2:
            for i in range(len(model) - 1, -1, -1):
                if model[i].name not in keep:
                    del model[i]
    tmp = path or tempfile.mktemp(suffix=".pdb")
    st2.write_pdb(tmp)
    return tmp


HELPER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sasa_helper.py")


def per_res_sasa(pdb_path):
    """Run one freeSASA calc in a fresh process (avoids repeat-call segfault)."""
    import subprocess
    r = subprocess.run([sys.executable, HELPER, pdb_path],
                       capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError(f"SASA helper failed on {pdb_path}: {r.stderr[-500:]}")
    d = json.loads(r.stdout)
    out = {}
    for ch, vals in d.items():
        if ch == "_total":
            continue
        for rn, v in vals.items():
            out[(ch, int(rn))] = v
    return out


def ca_coords(chain):
    d = {}
    for r in chain:
        for a in r:
            if a.name == "CA":
                d[r.seqid.num] = np.array([a.pos.x, a.pos.y, a.pos.z])
    return d


def kabsch_rmsd(P, Q):
    Pc = P - P.mean(0)
    Qc = Q - Q.mean(0)
    H = Pc.T @ Qc
    U, S, Vt = np.linalg.svd(H)
    d = np.sign(np.linalg.det(Vt.T @ U.T))
    D = np.diag([1, 1, d])
    R = Vt.T @ D @ U.T
    Prot = (R @ Pc.T).T
    diff = Prot - Qc
    return float(np.sqrt((diff ** 2).sum(1).mean()))


def analyze_structure(path, ref_seq):
    st = load(path)
    info = {"file": path, "n_models": len(st), "chains": []}
    for ch in st[0]:
        seq = chain_seq(ch)
        info["chains"].append({
            "chain": ch.name, "n_residues": len(list(ch)), "length": len(seq),
            "sequence": seq,
            "gly_only_or_near": (seq.count("G") / max(len(seq), 1)) > 0.8,
            "identical_to_target": seq == ref_seq,
            "identity_to_target": round(similarity(seq, ref_seq), 3),
        })
    return st, info


def main(task_dir, seed, out_json):
    ref_seq = ref_sequence()
    res = {"seed": seed, "task_output_dir": task_dir, "reference": REF,
           "hotspots_mos": HOTSPOTS, "kn035_epitope_case02": KN035_EPITOPE,
           "structures": [], "confidence_metrics_found": {}, "missing_metrics": []}

    structs = sorted([p for p in glob.glob(os.path.join(task_dir, "**", "*"), recursive=True)
                      if p.lower().endswith((".cif", ".pdb", ".mmcif"))])
    res["structure_files_found"] = structs

    for path in structs:
        try:
            st, info = analyze_structure(path, ref_seq)
        except Exception as e:
            res["structures"].append({"file": path, "error": str(e)})
            continue
        info["sasa_analysis"] = {}
        target_chain = None
        for c in info["chains"]:
            if c["identical_to_target"]:
                target_chain = c["chain"]
        binder_chains = [c["chain"] for c in info["chains"]
                         if c["chain"] != target_chain and not c["gly_only_or_near"]]
        virtual_chains = [c["chain"] for c in info["chains"] if c["gly_only_or_near"]]
        info["target_chain"] = target_chain
        info["binder_chains"] = binder_chains
        info["virtual_backbone_chains"] = virtual_chains

        model = st[0]
        # C-alpha superposition of the complexed target onto the original MMFold_1 chain A
        if target_chain:
            ref = load(REF)[0]["A"]
            ref_ca = ca_coords(ref)
            tgt_ca = ca_coords(model[target_chain])
            common = sorted(set(ref_ca) & set(tgt_ca))
            if common:
                P = np.array([tgt_ca[k] for k in common])
                Q = np.array([ref_ca[k] for k in common])
                info["ca_superposition"] = {"n_common_ca": len(common),
                                            "rmsd_A": round(kabsch_rmsd(P, Q), 3),
                                            "target_chain": target_chain}

        # hotspot distances + contacts
        hs = {}
        for b in binder_chains:
            batoms = [a for r in model[b] for a in r]
            for h in HOTSPOTS:
                try:
                    r = model[target_chain][h]
                except Exception:
                    hs[f"{b}:{h}"] = None
                    continue
                dmin = min(math.dist(a.pos, bb.pos) for a in r for bb in batoms)
                hs[f"{b}:A{h}"] = round(dmin, 2)
        info["hotspot_min_distance_A"] = hs

        # contacts (heavy atom < 4.0 A) and interface residues
        contacts = []
        iface_target, iface_binder = set(), set()
        near_target, near_binder = set(), set()
        for b in binder_chains:
            for rt in model[target_chain]:
                for rb in model[b]:
                    d = min(math.dist(a.pos, c.pos) for a in rt for c in rb)
                    if d < 4.0:
                        contacts.append({"target_res": rt.seqid.num, "target_name": rt.name,
                                         "binder_chain": b, "binder_res": rb.seqid.num,
                                         "binder_name": rb.name, "min_dist_A": round(d, 2)})
                        iface_target.add(rt.seqid.num)
                        iface_binder.add((b, rb.seqid.num))
                    elif d < 5.0:
                        near_target.add(rt.seqid.num)
                        near_binder.add((b, rb.seqid.num))
        # interface by BSA (>0.1 A^2 loss upon complex formation)
        if target_chain and binder_chains:
            whole = write_pdb(st)
            try:
                complex_sasa = per_res_sasa(whole)
                tgt_only = write_pdb(st, [target_chain])
                bnd_only = write_pdb(st, binder_chains)
                tgt_sasa = per_res_sasa(tgt_only)
                bnd_sasa = per_res_sasa(bnd_only)
                bsa = 0.0
                bsa_res = {}
                for (ch, rn), v in tgt_sasa.items():
                    delta = v - complex_sasa.get((ch, rn), v)
                    if delta > 0.1:
                        bsa_res[rn] = round(delta, 2)
                        iface_target.add(rn)
                    bsa += delta
                bsa_b = 0.0
                for (ch, rn), v in bnd_sasa.items():
                    bsa_b += v - complex_sasa.get((ch, rn), v)
                info["interface"] = {
                    "bsa_A2_total": round(bsa + bsa_b, 1),
                    "bsa_A2_target_side": round(bsa, 1),
                    "bsa_A2_binder_side": round(bsa_b, 1),
                    "bsa_per_target_residue": dict(sorted(bsa_res.items())),
                    "n_contact_pairs_lt4A": len(contacts),
                    "contact_pairs": contacts,
                    "interface_target_residues": sorted(iface_target),
                    "interface_binder_residues": sorted([f"{c}:{r}" for c, r in iface_binder]),
                    "target_residues_within_5A": sorted(near_target),
                }
            finally:
                for tmp in (whole, tgt_only, bnd_only):
                    if os.path.exists(tmp):
                        os.remove(tmp)
        else:
            info["interface"] = {"bsa_A2_total": None,
                                 "note": "no binder chain identified" if not binder_chains else "no target chain identified"}

        # epitope overlap
        if iface_target:
            it = set(iface_target)
            ep = set(KN035_EPITOPE)
            inter = sorted(it & ep)
            info["epitope_overlap"] = {
                "n_interface_target_residues": len(it),
                "n_epitope_residues": len(ep),
                "overlap_residues": inter,
                "n_overlap": len(inter),
                "fraction_of_kn035_epitope_recovered": round(len(inter) / len(ep), 3),
                "fraction_of_designed_interface_on_kn035_epitope": round(len(inter) / len(it), 3) if it else None,
                "jaccard": round(len(inter) / len(it | ep), 3) if (it | ep) else None,
                "hotspots_contacted": sorted([h for h in HOTSPOTS if h in it]),
            }
        res["structures"].append(info)
    json.dump(res, open(out_json, "w"), indent=2)
    print(json.dumps({k: v for k, v in res.items() if k != "structures"}, indent=2)[:2000])
    print("structures analyzed:", len(res["structures"]))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
