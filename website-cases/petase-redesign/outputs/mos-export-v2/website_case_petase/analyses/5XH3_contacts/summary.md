# InteractionNet Interaction Analysis Report

## Counts by Type

| Type | Total | Inter-chain |
|------|-------|-------------|
| HBOND | 213 | 7 |
| VDW | 206 | 9 |
| PISTACK | 11 | 4 |
| IONIC | 2 | 0 |
| PICATION | 2 | 0 |
| SSBOND | 2 | 0 |
| PIHBOND | 1 | 0 |

## Output Files

- `hbond.tsv` - Hydrogen bond between donor and acceptor atoms
- `ionic.tsv` - Salt bridge between oppositely charged residues
- `pistack.tsv` - Pi-Pi stacking between aromatic rings
- `pication.tsv` - Pi-cation interaction between aromatic ring and cation
- `pihbond.tsv` - Pi-hydrogen bond to aromatic ring
- `ssbond.tsv` - Disulfide bond between cysteines
- `vdw.tsv` - Van der Waals contact
- `residues.tsv` - Per-residue info (sorted by degree, desc)

## Units
- distance: Å, angle: °, bfactor_CA: Å², x/y/z: Å

## Orientation Codes (π-π stacking, π-cation)
P=Parallel (stacked), T=Parallel T-shaped, I=Inverted T-shaped, S=Sandwich (perpendicular), U=Undefined/unknown
