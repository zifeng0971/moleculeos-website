# PD-L1 (chain A) / KN035 nanobody (chain B) — predicted complex interface

Model: MMFold, sample 1 (best of 5; ipTM 0.925, pTM 0.941, mean pLDDT 93.7)
Confidence ranking of all samples: s1 ipTM 0.925 | s2 0.340 | s3 0.337 | s4 0.335 | s5 0.322
Interface: single A:B protein-protein interface, 50 residue contacts
Buried surface area: 698.6 A^2 (PD-L1 side) + 720.5 A^2 (KN035 side) = 1419.1 A^2 total
Hydrogen bonds: 13   Salt bridges: 6   Interface residues: 20 (A) + 21 (B)

## Numbering
- Chain A model residue n -> UniProt Q9NZQ7 position n+16 (chain A = MA tag + PD-L1 19-134)
- Chain A model positions 1-2 = artificial MA cloning tag (M17/A18)
- Chain B = KN035, model numbering is sequential from Q1; CDR3 = 97-117

## PD-L1 epitope (UniProt numbering, BSA > 5 A^2)
pos  res  BSA(A^2)  model_pos
54   ILE   49.8      38
56   TYR   56.9      40
58   GLU   14.7      42
61   ASP  104.3      45
63   ASN    5.9      47
66   GLN   40.9      50
68   VAL   29.4      52
69   HIS   19.5      53
73   ASP   15.7      57
76   VAL   38.5      60
113  ARG   59.7      97
115  MET   46.9      99
117  SER   14.1     101
119  GLY    9.2     103
120  GLY    6.6     104
121  ALA   54.0     105
122  ASP    7.7     106
123  TYR   53.9     107
125  ARG   28.3     109
(tag) MET 42.5       1   <- cloning tag artifact, not PD-L1

## KN035 paratope (model numbering)
CDR1 (26-33): Lys27, Ser29, Ser30, Arg32
Framework:   Glu44
CDR3 (97-117): Asp99, Ser100, Phe101, Glu102, Asp103, Pro104, Thr105, Leu108,
               Val109, Thr110, Ser111, Gly113, Ala114, Phe115, Gln116, Tyr117

## Key interactions in the model
Salt bridge / ionic:  PD-L1 Arg113 (NH1/NH2) -- KN035 Asp99 (OD1/OD2), 2.4-3.7 A
Salt bridge (tag artifact): tag Met1 N -- KN035 Glu44 OE1/OE2, 3.9 A
pi-stacking:          PD-L1 Tyr56 ring -- KN035 Phe101 ring, centroid 5.17 A, 83 deg
H-bonds:
  Tyr56 OH    -> Ser100 O      3.7
  Tyr56 OH    -> Glu102 N      3.2
  Glu58 OE2   -> Ser100 OG     2.4
  Asp61 OD2   -> Ser29 OG      3.2
  Asp61 OD2   -> Ser30 OG      2.6
  Asp61 O     -> Arg32 NH1     2.5
  Gln66 NE2   -> Asp103 O      3.3
  Gln66 OE1   -> Thr105 N      3.1
  Gln66 OE1   -> Thr105 OG1    2.7
  Arg113 NH1  -> Ala114 O      3.6
  Arg113 NH2  -> Ser100 OG     3.5
  Arg125 NH2  -> Gln116 OE1    2.4
  Gly119 O    -> Ser111 OG     3.1

## Cross-validation against the experimental structure (PDB 5JDS, 1.7 A)
Crystal interface recomputed with the same protein-only Shrake-Rupley protocol
(crystallographic waters excluded):
  PD-L1: 19 interface residues, 658.0 A^2 buried
  KN035: 18 interface residues, 616.3 A^2 buried

Epitope agreement: 18 of 19 crystal residues are reproduced.
  Shared:     Ile54, Tyr56, Glu58, Asp61, Asn63, Gln66, Val68, His69, Asp73,
              Arg113, Met115, Ser117, Gly119, Gly120, Ala121, Asp122, Tyr123, Arg125
  Crystal only: Glu60
  Model only:   Val76 (+ artificial tag Met17)

Paratope agreement: 18 of 18 crystal residues are reproduced.
  Shared:     Lys27, Ser29, Ser30, Arg32, Asp99, Ser100, Phe101, Glu102, Asp103,
              Pro104, Thr105, Leu108, Val109, Ser111, Gly113, Ala114, Phe115, Gln116
  Model only: Glu44, Thr110, Tyr117

Note on PPInterface output: running it on the deposited 5JDS entry reports 47 PD-L1
interface residues / 1557 A^2 because crystallographic waters are present and counted
as part of the environment. Protein-only analysis of the same entry gives the 19
residues / 658 A^2 reported above, which is directly comparable to the model.
