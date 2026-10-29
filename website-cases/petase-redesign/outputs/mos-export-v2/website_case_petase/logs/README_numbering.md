# Numbering conventions used in this case

| scheme | range | definition |
|---|---|---|
| UNP | 1-290 | UniProt A0A0K8P6T7 (PETH_PISS1) precursor numbering. Catalytic triad Ser160/Asp206/His237, disulfides Cys203-Cys239 and Cys273-Cys289, oxyanion-hole partners Tyr87/Met161, PET-binding sites Tyr87/Met161/Trp185. |
| AUTH | 1-261 | PDB author numbering of 5XG0 / 5XH3. AUTH = UNP - 29 (5XH3 SEQADV: GLY A 103 = UNP ARG 132; ALA A 131 = UNP SER 160; DBREF2: AUTH 1-261 = UNP 30-290). |
| CONSTRUCT (score tasks) | 1-268 | 5XG0 chain C as submitted to the three WT scoring tasks: GAGAGAM expression tag (AUTH -6..0) + mature AUTH 1..261. CONSTRUCT = AUTH + 7. Tag positions 1-7 are NOT natural PETase and are excluded from site selection. |
| MOS (5XH3 object) | chain A 1-261, ligand chain B | sanitized layout: protein chain A reindexed 1..261, ligand 856 moved to chain B. |
| MOS (5XG0 chain C object) | chain A 1-268 | sanitized layout keeps the same order; position 8 = AUTH 1. |
| MOS (WT+HEMT model) | chain D 1-261, ligand chain E | sanitized layout of the constructed WT/HEMT model; numbering equals AUTH because the tag was dropped in the model. |
