# 5XH3 / HEMT ligand-site analysis (deterministic, Mocha built-in)

All numbers below were produced by the scripts listed at the end, run on the
RCSB-deposited coordinates. Nothing here is hand-entered.

## 1. What the deposit actually contains

| item | value | source |
|---|---|---|
| Entry | 5XH3, X-ray, 1.30 A | RCSB entry metadata (`inputs/5XH3_metadata.json`) |
| Title | "Crystal structure of a novel PET hydrolase R103G/S131A mutant in complex with HEMT from *Ideonella sakaiensis* 201-F6" | same |
| Protein | one chain, AUTH 1-261, mature PETase (no signal peptide, no tag) | `structures/5XH3_mos_layout.cif` |
| Ligand | CCD **856**, "O4-(2-hydroxyethyl) O1-methyl benzene-1,4-dicarboxylate", C11 H12 O5, 224.21 Da, 16 heavy atoms, InChIKey DJQMYWWZWUOCBQ-UHFFFAOYSA-N | RCSB chemcomp `856` |
| Ligand SMILES | `COC(=O)c1ccc(C(=O)OCCO)cc1` | RDKit on the SHA256-verified SDF |
| Ligand placement | label asym chain **B**, author chain A, author residue **301** | `5XH3_nonpoly2.json`, ATOM/HETATM records |
| Other hetero | 2 x SO4, 1 x GOL, 244 waters | `5XH3_mos_layout.cif` |

**"HEMT" is not a CCD code.** The deposited ligand is component `856`; HEMT
(1-(2-hydroxyethyl) 4-methyl terephthalate) is the abbreviation used in the
publication. A lookup of CCD id `HEMT` returns 404 from the RCSB API, so any
file named `..._B_856` refers to this component, chain B.

**5XH3 is not wild type.** Two engineered changes are present and are declared
in the file's own SEQADV records:

```
SEQADV 5XH3 GLY A  103  UNP  A0A0K8P6T ARG   132 ENGINEERED MUTATION
SEQADV 5XH3 ALA A  131  UNP  A0A0K8P6T SER   160 ENGINEERED MUTATION
```

The first is a crystal-packing fix (Arg103 from a neighbouring molecule would
otherwise sit in the active-site cleft); the second is the catalytic-nucleophile
knock-out used to trap the substrate analogue. Consequently 5XH3 binds HEMT but
cannot turn it over, and its pocket is the pocket of a dead enzyme.

## 2. Numbering (verified, not assumed)

The DBREF2 record maps author 1-261 onto UniProt A0A0K8P6T7 residues 30-290,
i.e. **UNP = AUTH + 29**, confirmed independently by finding the exact 261-aa
chain sequence inside the UniProt sequence at offset 29.

| feature | UNP | AUTH | construct (score tasks) |
|---|---|---|---|
| nucleophile Ser | 160 | 131 | 138 |
| charge-relay Asp | 206 | 177 | 184 |
| charge-relay His | 237 | 208 | 215 |
| oxyanion-hole backbone N | Tyr87, Met161 | Tyr58, Met132 | 65, 139 |
| disulfide DS1 | Cys203-Cys239 | Cys174-Cys210 | 181-217 |
| disulfide DS2 | Cys273-Cys289 | Cys244-Cys260 | 251-267 |
| engineered mutations | R132G, S160A | R103G, S131A | 110, 138 |

The offsets are uniform but were *derived*, not guessed: 5XG0 chain C and 5XH3
chain A align 1:1 over all 261 author-numbered residues with exactly two
differences (AUTH 103 R->G, AUTH 131 S->A).

## 3. First shell: what HEMT touches

Nine residues have any heavy atom within 4.0 A of the ligand (69 atom-atom
pairs). The published description of the same structure lists W156, I179, H208,
A131, W130, Y58 and M132 - the same set, recovered here from coordinates alone.

| AUTH | UNP | res | closest approach (A) | contacts | character |
|---|---|---|---|---|---|
| 58 | 87 | Tyr | 2.62 | 12 | backbone-NH oxyanion hole + edge of the ring |
| 208 | 237 | His | 2.78 | 9 | catalytic His, NE2...O11 H-bond |
| 132 | 161 | Met | 2.93 | 7 | backbone-NH oxyanion hole |
| 131 | 160 | Ala (mutant) | 3.01 | 5 | position of the nucleophile |
| 156 | 185 | Trp | 3.20 | 12 | pi-stack (4.98 A centroid) + NE1...O H-bond |
| 130 | 159 | Trp | 3.21 | 10 | edge-on packing against the ring |
| 57 | 86 | Gly | 3.33 | 6 | backbone only |
| 179 | 208 | Ile | 3.60 | 7 | hydrophobic face of the ring |
| 60 | 89 | Ala | 3.76 | 1 | single van der Waals contact |

The ligand is deeply enclosed: 328.4 A^2 of its 417.3 A^2 isolated SASA is
buried on binding (78.7 %).

## 4. Interaction chemistry

Polar contacts (heavy-atom distance <= 3.6 A; 5XH3 has no modelled hydrogens, so
these are distance-screened candidates, not angle-refined hydrogen bonds):

| protein | ligand atom | ligand chemistry | distance (A) |
|---|---|---|---|
| Tyr58 backbone N | O10 | hydroxyethyl-ester **carbonyl O** | 2.90 |
| Met132 backbone N | O10 | hydroxyethyl-ester carbonyl O | 2.93 |
| His208 NE2 | O11 | hydroxyethyl-ester **ester O** | 2.87 |
| Trp156 NE1 | O02 | **methoxy O** of the methyl ester | 3.20 |
| Tyr58 backbone O | O14 | terminal hydroxyl O | 2.62 |

The two backbone amides that bracket O10 are the oxyanion hole (UNP Tyr87 and
Met161, both annotated as PET-binding residues in UniProt). The scissile
carbonyl therefore sits in the oxyanion hole, its ester oxygen is hydrogen
bonded to the catalytic histidine, and the hydroxyl end of the hydroxyethyl
group points back toward the Tyr58 backbone.

Hydrophobic/aromatic: Trp156 stacks on the terephthalate ring (ring-centroid
4.98 A, closest carbon 3.20 A); Trp130 packs edge-on (3.21 A); Ile179 and
Tyr58 cap the two ring faces.

Catalytic geometry in the true wild type (5XG0 chain C): Ser131 OG...His208 NE2
= 2.91 A, His208 ND1...Asp177 OD2 = 2.65 A. When WT is superposed into the
5XH3 frame, Ser131 OG lands **2.51 A from the ligand's ester carbon C09** -
the nucleophile is positioned for in-line attack on the ester that HEMT
presents. In 5XH3 itself the equivalent point is the Ala131 CB, 3.01 A away.

## 5. Why this matters for design

The site is an aromatic slot with a hydrogen-bonded ester at one end. Three
things are therefore untouchable: the catalytic triad (131/177/208), the
oxyanion-hole amides (58/132), and the two disulfides (174-210, 244-260) that
hold the loops carrying Trp156 and His208. Everything else in the shell is
fair game for local, conservative redesign - which is what step 5 does.

## Provenance

| file | produced by |
|---|---|
| `ligand856_atom_contacts.csv` | `analyses/ligand_pocket_analysis.py` (gemmi + RDKit + freesasa) |
| `ligand856_pocket_residues.csv` | same |
| `ligand856_polar_contacts.csv` | same |
| `ligand856_pocket_summary.json` | same |
| `5XH3_contacts/*.tsv` | `interaction-analysis` skill, `calc_contacts.py` (InteractionNet) |
| `superpose_5xg0_5xh3_*` | `analyses/superpose_5xg0_5xh3.py` (gemmi) |
