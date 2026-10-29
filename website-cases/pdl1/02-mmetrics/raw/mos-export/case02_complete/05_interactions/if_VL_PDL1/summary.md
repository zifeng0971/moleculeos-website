# Interface Burial Analysis Report

## Interfaces Analyzed

| Chain1 | Chain2 | H-bonds | Salt Bridges | Residues C1 | Residues C2 | BSA C1 (Å²) | BSA C2 (Å²) |
|--------|--------|---------|--------------|-------------|-------------|-------------|-------------|
| C | B | 2 | 2 | 13 | 12 | 333.3 | 324.2 |

## Output Files

| File | Description |
|------|-------------|
| `hbond.tsv` | Hydrogen bonds (donor → acceptor) |
| `salt_bridge.tsv` | Salt bridges |
| `residues.tsv` | Interface residues sorted by BSA (hotspots) |

## Units
- Distance: Å
- ASA/BSA: Å²
- Solvation energy: kcal/mol

## Residue Columns
- `in_interface`: Y/N - part of interface
- `on_surface`: Y/N - on protein surface
- `has_hbond`: Y/N - forms H-bond across interface
- `has_salt_bridge`: Y/N - forms salt bridge across interface