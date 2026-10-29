# InteractionNet Interaction Analysis Report

## Counts by Type

| Type | Total | Inter-chain |
|------|-------|-------------|
| VDW | 37 | 37 |
| HBOND | 25 | 25 |
| PISTACK | 4 | 4 |
| IONIC | 2 | 2 |
| PICATION | 1 | 1 |
| PIHBOND | 1 | 1 |
| SSBOND | 1 | 1 |

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
