#!/usr/bin/env python3
"""
Shrake-Rupley buried-surface-area fallback.

The InteractionNet/PPInterface pipeline needs residue typing and side chains and
fails on poly-Gly hallucination backbones, so buried area is computed here
directly from coordinates for every complex, giving one consistent method across
backbone-only and sequence-designed models.

BSA_total  = SASA(binder alone) + SASA(receptor alone) - SASA(complex)
             (both partners summed; divide by 2 for the conventional
              "interface area per side")

Usage: python bsa_shrake.py STRUCTURE.cif [BINDER_CHAIN RECEPTOR_CHAIN]
"""
import sys

import gemmi
from Bio.PDB import MMCIFParser, PDBParser, ShrakeRupley


def load(path):
    if path.endswith((".cif", ".mmcif")):
        return MMCIFParser(QUIET=True).get_structure("s", path)
    return PDBParser(QUIET=True).get_structure("s", path)


def sasa_of(structure):
    sr = ShrakeRupley()
    sr.compute(structure, level="S")
    return sum(atom.sasa for atom in structure.get_atoms())


def main():
    path = sys.argv[1]
    binder = sys.argv[2] if len(sys.argv) > 2 else "A"
    receptor = sys.argv[3] if len(sys.argv) > 3 else "B"
    # chain groups may be comma separated, e.g. "H,L" for an antibody
    binder_ids = [c.strip() for c in binder.split(",")]
    receptor_ids = [c.strip() for c in receptor.split(",")]

    st = load(path)
    complex_sasa = sasa_of(st)

    st_b = load(path)
    for ch in [c.id for c in st_b[0] if c.id not in binder_ids]:
        st_b[0].detach_child(ch)
    binder_sasa = sasa_of(st_b)

    st_r = load(path)
    for ch in [c.id for c in st_r[0] if c.id not in receptor_ids]:
        st_r[0].detach_child(ch)
    receptor_sasa = sasa_of(st_r)

    bsa = binder_sasa + receptor_sasa - complex_sasa
    print(
        f"{path}\tbinder={binder}\treceptor={receptor}\t"
        f"sasa_complex={complex_sasa:.1f}\tsasa_binder={binder_sasa:.1f}\t"
        f"sasa_receptor={receptor_sasa:.1f}\tbsa_total={bsa:.1f}\t"
        f"bsa_per_side={bsa / 2:.1f}"
    )


if __name__ == "__main__":
    main()
