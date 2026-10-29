# InteractionNet Interaction Analysis Report

## Counts by Type

| Type | Total | Inter-chain |
|------|-------|-------------|
| HBOND | 9 | 9 |
| IONIC | 1 | 1 |
| PISTACK | 1 | 1 |

## Output Files

- `hbond.tsv` - Hydrogen bond between donor and acceptor atoms
- `ionic.tsv` - Salt bridge between oppositely charged residues
- `pistack.tsv` - Pi-Pi stacking between aromatic rings
- `residues.tsv` - Per-residue info (sorted by degree, desc)

## Units
- distance: Å, angle: °, bfactor_CA: Å², x/y/z: Å

## Orientation Codes (π-π stacking, π-cation)
P=Parallel (stacked), T=Parallel T-shaped, I=Inverted T-shaped, S=Sandwich (perpendicular), U=Undefined/unknown
