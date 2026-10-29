#!/usr/bin/env python3
"""
Analyze Protein Binder Design outputs for case 05 (PD-L1).

For every structure file in a task output directory this script:
  * identifies the PD-L1 target chain (by optimal match to the reference sequence)
    and every other chain as a designed binder chain,
  * writes valid FASTA entries, labelling each chain as designed sequence or
    virtual backbone based on residue composition (poly-Gly/Ala hallucination
    backbones carry no designed sequence),
  * runs the interaction-analysis interface pipeline on binder:target and records
    buried surface area, interface residue counts, H-bonds and salt bridges,
  * measures engagement of the six designed hotspots (A37/A39/A41/A51/A96/A106),
  * collects any numeric confidence fields (pLDDT/ipTM/PAE/ptm/confidence) found
    in sibling JSON/CSV files.

Nothing is invented: metrics that cannot be computed from the delivered files are
reported as null with a reason.

Usage:
  python analyze_designs.py --task-dir OUT_DIR --label seed111 --out-dir analysis/seed111
"""
import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

import gemmi
from Bio.Align import PairwiseAligner

SKILL_SCRIPTS = Path(
    "/app/src/mocha/agents/custom_skills/interaction-analysis/scripts"
)
TARGET_LEN = 213
HOTSPOTS_SANITIZED = [37, 39, 41, 51, 96, 106]
HOTSPOT_MAP = {37: "I54", 39: "Y56", 41: "E58", 51: "V68", 96: "R113", 106: "Y123"}
STD = set("ALA ARG ASN ASP CYS GLN GLU GLY HIS ILE LEU LYS MET PHE PRO SER THR TRP TYR VAL".split())
OUT_EXT = {".pdb", ".cif", ".mmcif", ".ent"}


def structure_files(root: Path):
    out = []
    for p in sorted(root.rglob("*")):
        if p.is_file() and p.suffix.lower() in OUT_EXT:
            out.append(p)
    return out


def seq_of(chain):
    return "".join(
        gemmi.find_tabulated_residue(r.name).one_letter_code.upper()
        if gemmi.find_tabulated_residue(r.name).one_letter_code != "?"
        else "X"
        for r in chain
        if r.het_flag == "A"
    )


def load_chains(path):
    st = gemmi.read_structure(str(path))
    st.setup_entities()
    m = st[0]
    return [(ch.name, list(ch), seq_of(ch)) for ch in m]


def pick_target(chains, ref_seq):
    """Chain whose sequence best matches the reference PD-L1 sequence."""
    best, best_score = None, -1.0
    for name, res, seq in chains:
        if not seq:
            continue
        score = 0.0
        if len(seq) == TARGET_LEN:
            score += 100.0
        # crude positional identity against reference of the same length
        n = min(len(seq), len(ref_seq))
        if n:
            score += 100.0 * sum(a == b for a, b in zip(seq[:n], ref_seq[:n])) / n
        if score > best_score:
            best, best_score = (name, res, seq), score
    return best


def classify(seq):
    if not seq:
        return "no_sequence"
    ga = sum(1 for c in seq if c in "GA")
    if ga / len(seq) > 0.9:
        return "virtual_backbone_no_designed_sequence"
    return "designed_or_modeled_sequence"


def map_ref_to_chain(ref_seq, chain_seq):
    """Map 0-based reference positions to 0-based positions in chain_seq.

    Hotspots must be located by sequence, never by an assumed residue number:
    MOS reindexes structures on upload and the design pipeline may renumber the
    target again.
    """
    aligner = PairwiseAligner()
    aligner.mode = "global"
    aligner.match_score = 2.0
    aligner.mismatch_score = -1.0
    aligner.open_gap_score = -10.0
    aligner.extend_gap_score = -0.5
    aln = aligner.align(ref_seq, chain_seq)[0]
    mapping = {}
    for (r0, r1), (t0, t1) in zip(aln.aligned[0:1][0], aln.aligned[1:2][0]):
        for k in range(r1 - r0):
            mapping[r0 + k] = t0 + k
    return mapping


def min_dist(res_a, res_b):
    """Minimum non-hydrogen atom distance between two residues (accepts a
    single Residue or an iterable of Residues on either side)."""
    if not isinstance(res_a, (list, tuple)):
        res_a = [res_a]
    if not isinstance(res_b, (list, tuple)):
        res_b = [res_b]
    best = 1e9
    for ra in res_a:
        for a in ra:
            if a.element.name == "H":
                continue
            for rb in res_b:
                for b in rb:
                    if b.element.name == "H":
                        continue
                    d = a.pos.dist(b.pos)
                    if d < best:
                        best = d
    return best


def run_interface(path, pair, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        str(SKILL_SCRIPTS / "calc_interface.py"),
        str(path),
        "--chain-pairs",
        pair,
        "-o",
        str(out_dir),
    ]
    try:
        subprocess.run(cmd, capture_output=True, text=True, timeout=900, check=True)
    except Exception as e:  # pragma: no cover - platform dependent
        return {"error": f"interface pipeline failed: {e}"}
    metrics = {}
    res_tsv = out_dir / "residues.tsv"
    if res_tsv.exists():
        rows = list(csv.DictReader(res_tsv.open(), delimiter="\t"))
        bsa = sum(float(r["bsa"]) for r in rows if r["bsa"] not in ("", "NA"))
        metrics["total_bsa_A2"] = round(bsa, 1)
        metrics["interface_residues_total"] = sum(1 for r in rows if r["in_interface"] == "Y")
        metrics["interface_residues_per_chain"] = {}
        for r in rows:
            if r["in_interface"] == "Y":
                ch = r["chain"]
                metrics["interface_residues_per_chain"][ch] = (
                    metrics["interface_residues_per_chain"].get(ch, 0) + 1
                )
    hb = out_dir / "hbond.tsv"
    if hb.exists():
        metrics["hbonds"] = max(0, sum(1 for _ in hb.open()) - 1)
    sb = out_dir / "salt_bridge.tsv"
    if sb.exists():
        metrics["salt_bridges"] = max(0, sum(1 for _ in sb.open()) - 1)
    return metrics


def collect_confidence(root: Path):
    """Pull numeric confidence-like fields out of any JSON/CSV in the tree."""
    found = {}
    keys = ("plddt", "ptm", "iptm", "ipTM", "pTM", "pae", "confidence", "score", "rmsd")
    for p in sorted(root.rglob("*")):
        if not p.is_file():
            continue
        if p.suffix.lower() == ".json":
            try:
                data = json.loads(p.read_text())
            except Exception:
                continue

            def walk(obj, prefix=""):
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if isinstance(v, (int, float)) and any(t in k.lower() for t in keys):
                            found[f"{p.name}:{prefix}{k}"] = v
                        else:
                            walk(v, f"{prefix}{k}.")
                elif isinstance(obj, list) and obj and len(obj) < 40:
                    for i, v in enumerate(obj):
                        walk(v, f"{prefix}{i}.")
            walk(data)
        elif p.suffix.lower() == ".csv":
            try:
                rows = list(csv.DictReader(p.open()))
            except Exception:
                continue
            if rows:
                for k, v in rows[0].items():
                    try:
                        found[f"{p.name}:{k}"] = float(v)
                    except (TypeError, ValueError):
                        continue
    return found


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--task-dir", required=True)
    ap.add_argument("--label", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--ref-target", default="/workspace/case05/package/target/PD-L1_5GRJ_chainA_target.mos.cif")
    args = ap.parse_args()

    root = Path(args.task_dir)
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    ref_chains = load_chains(Path(args.ref_target))
    ref_seq = max((s for _, _, s in ref_chains), key=len)

    designs = []
    fasta = []
    for path in structure_files(root):
        try:
            chains = load_chains(path)
        except Exception as e:
            designs.append({"file": str(path), "error": f"unreadable: {e}"})
            continue
        if len(chains) < 2:
            designs.append(
                {
                    "file": str(path),
                    "error": "single chain - no complex, interface metrics not computable",
                    "chains": [{"chain": c, "length": len(r), "sequence": s,
                                "type": classify(s)} for c, r, s in chains],
                }
            )
            for c, r, s in chains:
                fasta.append((f"{args.label}|{path.name}|chain{c}|{classify(s)}", s))
            continue

        tgt = pick_target(chains, ref_seq)
        tgt_name = tgt[0]
        binders = [c for c in chains if c[0] != tgt_name]
        rec = {
            "file": str(path.relative_to(root)),
            "target_chain": tgt_name,
            "target_len": len(tgt[1]),
            "binder_chains": [],
        }
        for bname, bres, bseq in binders:
            entry = {
                "chain": bname,
                "length": len(bseq),
                "sequence": bseq,
                "sequence_type": classify(bseq),
                "nonstandard_residues": sorted({r.name for r in bres} - STD),
            }
            # hotspot engagement, located by sequence alignment to the reference
            tgt_poly = [r for r in tgt[1] if r.het_flag == "A"]
            ref2chain = map_ref_to_chain(ref_seq, tgt[2])
            rec["target_numbering"] = {
                "first": tgt_poly[0].seqid.num if tgt_poly else None,
                "last": tgt_poly[-1].seqid.num if tgt_poly else None,
                "n_residues": len(tgt_poly),
                "matches_sanitized_1_based": (
                    bool(tgt_poly) and tgt_poly[0].seqid.num == 1
                    and tgt_poly[-1].seqid.num == TARGET_LEN
                ),
            }
            engagement = {}
            for hs in HOTSPOTS_SANITIZED:
                idx = ref2chain.get(hs - 1)
                if idx is None or idx >= len(tgt_poly):
                    engagement[f"A{hs}({HOTSPOT_MAP[hs]})"] = "not_mapped"
                    continue
                tres = tgt_poly[idx]
                expected = {37: "ILE", 39: "TYR", 41: "GLU", 51: "VAL",
                            96: "ARG", 106: "TYR"}[hs]
                if tres.name != expected:
                    engagement[f"A{hs}({HOTSPOT_MAP[hs]})"] = (
                        f"mapping_conflict:{tres.name}{tres.seqid.num}"
                    )
                    continue
                d = min_dist(tres, bres) if bres else None
                engagement[f"A{hs}({HOTSPOT_MAP[hs]})@struct{tres.seqid.num}"] = (
                    round(d, 2) if d is not None else "absent"
                )
            entry["hotspot_min_heavy_atom_dist_A"] = engagement
            engaged = [k for k, v in engagement.items() if isinstance(v, float) and v <= 4.5]
            entry["hotspots_engaged"] = len(engaged)
            entry["hotspot_engagement_list"] = engaged

            ppi_dir = out / f"ppi_{path.stem}_{bname}"
            entry["interface"] = run_interface(path, f"{bname}:{tgt_name}", ppi_dir)
            rec["binder_chains"].append(entry)
            fasta.append((f"{args.label}|{path.name}|chain{bname}|{entry['sequence_type']}", bseq))
        designs.append(rec)

    conf = collect_confidence(root)
    if fasta:
        with (out / "sequences.fasta").open("w") as fh:
            for h, s in fasta:
                fh.write(f">{h}\n")
                for i in range(0, len(s), 60):
                    fh.write(s[i:i + 60] + "\n")

    payload = {
        "label": args.label,
        "task_dir": str(root),
        "structure_files_found": len(structure_files(root)),
        "hotspots_sanitized": HOTSPOTS_SANITIZED,
        "designs": designs,
        "confidence_fields_found": conf,
        "notes": [
            "sequence_type 'virtual_backbone_no_designed_sequence' means >90% Gly/Ala, i.e. a hallucinated backbone without sequence design",
            "hotspot distance is minimum non-hydrogen atom distance; <=4.5 A is treated as engaged (contact-level, not energetic)",
            "interface metrics come from the interaction-analysis pipeline; null values mean the file did not permit computation",
        ],
    }
    (out / "metrics.json").write_text(json.dumps(payload, indent=2))
    print(json.dumps({"label": args.label, "structures": len(structure_files(root)),
                      "designs": len(designs), "out": str(out)}, indent=2))


if __name__ == "__main__":
    main()
