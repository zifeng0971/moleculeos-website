# Case 04 — Developability design of the anti-PD-L1 VHH KN035 (PDB 5JDS)

Computational developability assessment of envafolimab's nanobody domain (KN035) and a ranked
set of single-residue optimisation candidates. Produced on MOS with the models that are actually
available; every number below traces to a file in this package.

---

## 1. System and chain verification

5JDS is a 1.7 Å X-ray structure of human PD-L1 in complex with the KN035 single-domain antibody.

| Chain (working numbering) | Identity | Residues | Evidence |
|---|---|---|---|
| A | KN035 VHH (camelid single immunoglobulin domain) | 127 modelled | ANARCI HMM hit `alpaca VH`, e-value 7.4e-55; closest germline IGHV3-3\*01 79 %, IGHJ5\*01 85 %; one domain, **no light chain** → VHH, not Fab/scFv |
| B | Human PD-L1 IgV domain (PD1L1_HUMAN, Q9NZQ7) | 115 modelled | `_struct_ref` maps entity 2 to UniProt Q9NZQ7, db_align 18–132; sequence matches PD-L1 IgV |

The two chains form a genuine antibody–antigen interface: **1528.5 Å² buried on the VHH side,
1556.9 Å² on PD-L1**, with 16 interface hydrogen bonds and 5 salt bridges (PPInterface).

Numbering used throughout: **domain position** = working chain A position = original author
residue number − 2 (the deposited VHH chain starts at author residue 3, preceded by a cloning
Thr and followed by a `GSMDPGGSHHHHHHHH` tag that is disordered in the crystal). The FASTA in
this package is the 128-residue domain (author residues 3–130); positions 1–127 are observed in
the structure, position 128 (the terminal Ser of `…VTVSS`) is not.

```
QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS
```

## 2. Architecture held fixed during screening

**CDRs (IMGT, assigned with ANARCI and cross-checked against `parse_structure.py`)**

| CDR | Positions | Sequence | Note |
|---|---|---|---|
| CDR1 | 26–33 | GKMSSRRC | contains Cys33, part of the extra disulfide |
| CDR2 | 51–58 | LLTTSGST | |
| CDR3 | 97–117 | AADSFEDPTCTLVTSSGAFQY | 21 residues, net charge −3, contains Cys106 |

**Disulfides (measured, not assumed)** — two SG–SG bonds at 2.03–2.08 Å:

- Cys22–Cys96, the canonical VH intradomain disulfide
- Cys33–Cys106, an **additional CDR1–CDR3 disulfide** that staples the two antigen-binding loops

All four cysteines have relative SASA ≤ 0.002 in the isolated domain, i.e. none is free.
Both disulfides and all CDR positions were excluded from every scan.

**Paratope** — 52 VHH residues bury surface on binding; 13 of them lie outside the CDRs
(positions 3, 5, 11, 25, 39, 41, 42, 59, 93, 120, 121, 123, 125; buried surface ≥ 10 Å²).
These framework contacts were also held fixed, because VHH paratopes routinely extend into
framework-2 and framework-4.

**Screened set** — 75 framework positions × 19 substitutions = 1425 mutations.

## 3. What the models measured

| Axis | MOS task | Task ID | Scope |
|---|---|---|---|
| Structural stability (reverse folding) | Structural Stability Mutation Effect | 342255494362112 | 75 allowed positions, 2413 substitutions |
| Sequence fitness (deep sequence model) | Sequence Fitness Mutation Effect | 342255495889920 | all 128 positions, 2432 substitutions |
| Evolutionary (conservation/covariance) | Evolutionary Mutation Effect | 342255510164480 | all 128 positions, 2432 substitutions |
| Binding affinity (complex ddG) | Binding Affinity Mutation Effect | 342255512777728 | both chains, 4598 substitutions |
| Sequence homology | Sequence Homology Search | 342255515612160 | 503 PDB hits |

The structural scan returned **0.0 for all 20 rows of the 52 excluded positions** — that is the
encoding of "not scored", not a neutral prediction. Only the 75 permitted positions carry
interpretable values (65 of 2413 substitutions scored above zero).

The three mutation axes disagree substantially, which is the main scientific result of this case:

- The **structural** model rewards buried framework repacking (its maximum, A24V, sits next to
  the Cys22 disulfide).
- The **sequence** model's favourable substitutions concentrate almost entirely in the CDRs,
  where natural VHH diversity lives; on framework positions it is mostly mildly unfavourable.
- The **binding** model's strongest changes are all CDR substitutions (A35W −1.79, A35F −1.63,
  C33Y −1.40 kcal/mol-equivalent units). C33Y is instructive: it scores well for affinity but
  would destroy the CDR1–CDR3 disulfide, so affinity gain alone is not a licence to mutate.

## 4. Developability baseline of wild-type KN035

| Indicator | Value | Source |
|---|---|---|
| Length / MW | 128 aa / 13.8 kDa | computed |
| pI | **9.01** (strongly basic) | computed |
| GRAVY | −0.375 | computed |
| Net charge proxy (K+R − D−E) | +4 | computed |
| N-glycosylation motifs (N-X-S/T) | 0 | computed |
| Deamidation motifs | **1** — Asn84-Ser85 (framework 3) | computed |
| Isomerization motifs (D-G/S/T/D) | 3 — Asp62-Ser63, Asp90-Thr91, Asp99-Ser100 (CDR3) | computed |
| Asp-Pro bonds | 0 | computed |
| Free cysteines | 0 (all four bonded) | SASA + SG–SG geometry |
| Exposed hydrophobics (rel-SASA > 0.25) | 11, 23, 28, 59, 75, 93, 108, 114 — five of them in the paratope | freesasa on 5JDS |
| Closest non-self homologs | 72 % identity to Lama glama VHHs 4DKA/4DK3; median 68 % over 503 PDB hits | Sequence Homology Search |

## 5. Ranked candidates

Ranking = weighted composite of baseline-relative percentiles across the four models
(structural 0.40, sequence 0.30, evolutionary 0.20, binding 0.10), after hard filters: no new
cysteine, no new liability motif, no proline, binding ddG ≤ +0.30. 965 of 1425 mutations passed.

| # | Mutation | Region | Burial | Struct score (pct) | Seq score (pct) | Evo score (pct) | Binding ddG | Composite |
|---|---|---|---|---|---|---|---|---|
| 1 | **K87R** | FW3 | partial (0.34) | +0.14 (97.9) | +1.38 (96.1) | −1.89 (80.9) | −0.02 | **0.908** |
| 2 | **V48I** | FW2 | buried (0.01) | +0.07 (97.6) | −0.59 (80.8) | −2.61 (76.1) | −0.34 | **0.877** |
| 3 | **A24V** | FW1 | buried (0.04) | **+4.61 (100)** | −0.63 (80.1) | −1.88 (81.0) | −0.04 | **0.873** |
| 4 | **M34L** | FW2 | buried (0.01) | +0.51 (98.5) | +0.47 (91.0) | −2.75 (75.0) | +0.07 | **0.865** |
| 5 | **A61S** | FW3 | partial (0.16) | +0.66 (98.7) | −1.11 (74.7) | −2.61 (76.2) | −0.16 | **0.855** |
| 6 | **R19S** | FW1 | exposed (0.42) | +0.13 (97.9) | −0.24 (84.1) | −3.14 (71.3) | +0.03 | **0.843** |
| 7 | **S85N** | FW3 | exposed (0.45) | +1.06 (99.2) | −1.73 (67.5) | −2.65 (75.5) | −0.04 | **0.821** |

Scores are model outputs in arbitrary units (higher = more favourable; binding ddG negative =
more favourable). Percentiles are the candidate's standing among every substitution that model
scored, i.e. its position relative to the untargeted baseline of "any random mutation".

Why these seven, in biological terms:

1. **K87R** — a conservative, charge-preserving swap on a partly exposed framework-3 residue. It
   is the only candidate that sits in the top decile of *both* the structural and sequence models
   while leaving the interface untouched; the lowest-risk entry in the set.
2. **V48I** — buried framework-2 packing. Adding one methyl in the core is the classic
   "silent" stabilisation strategy, and the binding model actually improves slightly (−0.34).
3. **A24V** — the largest structural-stability signal in the entire run (+4.61, the global
   maximum), an Ala→Val in the buried framework-1 core immediately C-terminal to Cys22. It
   enlarges the hydrophobic core without approaching the disulfide. Treat the magnitude as a
   hypothesis, not a measured ΔΔG.
4. **M34L** — buried methionine replacement. Removes one of the four oxidation-capable Met
   residues while scoring favourably on both the structural (+0.51) and sequence (+0.47) axes.
5. **A61S** — framework-3 position adjacent to the Asp62 isomerisation motif; the substitution
   itself introduces no new motif and both structural (+0.66) and binding (−0.16) models are content.
6. **R19S** — exposed framework-1 arginine. This is the only candidate that measurably lowers the
   very basic pI (9.01 → 8.76) by deleting a surface positive charge, which is the usual handle for
   reducing non-specific binding of VHHs; the trade-off is a mildly negative evolutionary score.
7. **S85N** — the liability-driven candidate. It replaces the +1 Ser of the Asn84-Ser85
   deamidation motif, abolishing the only deamidation site in the domain (motif count 1 → 0), and
   it is strongly supported structurally (+1.06, 99.2nd percentile). The sequence model dislikes it
   (−1.73, 67.5th percentile) — this one is proposed on liability grounds, not on sequence fitness.

**Deliberately excluded from the shortlist:** A75S (+0.935 composite) and N74T were rejected by the
filter because they *create* an N-glycosylation motif (N74-S75). E44S (0.887) removes a surface
glutamate from an already basic protein and has weak evolutionary support (69th percentile), so it
has no developability rationale. R47L (0.891) is the single most evolutionarily favoured change in
the run but the binding model penalises it by +0.61, i.e. a real affinity loss.

## 6. Optimised sequences

Single mutants and a combined variant are in `variants/kn035_variants.fasta` (one variant per
record, plus `variants/single/*.fa`). Combined variant `kn035_v1_combined` carries all seven:

```
QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS   WT
QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS   v1 (R19S A24V M34L V48I A61S S85N K87R)
```

Baseline-relative comparison of the combined variant:

| Indicator | WT | v1 combined |
|---|---|---|
| pI | 9.01 | 8.77 |
| GRAVY | −0.375 | unchanged (−0.375) |
| Deamidation motifs | 1 (N84-S85) | **0** |
| Isomerization motifs | 3 | 3 (unchanged; the D99-S100 site is in CDR3 and was not touched) |
| Free cysteines | 0 | 0 |
| Met residues (oxidation sites) | 4 | 3 |
| CDRs / disulfides | — | identical to WT |

Each single mutation was verified against the wild-type with `sequence_toolkit identify`: one
substitution per variant, at the intended position, 0 unintended edits.

## 7. What is *not* supported here

Reported honestly rather than estimated:

- **Aggregation propensity** — no TANGO/Zyggregator/AGGRESCAN-class predictor is exposed on MOS.
  Only the structural hydrophobic-exposure inventory above is available.
- **Solubility and expression titre** — no model available; not predicted.
- **Conformational/thermal stability (Tm, Tagg)** — "Antibody Stability Prediction" is listed as
  coming soon on MOS and was not run.
- **Humanness / nativeness (AbNatiV, OASis)** — "Antibody Nativeness Evaluation" and "Antibody
  Language Scoring" are coming soon. The Sequence Homology Search used here is PDB-restricted and
  therefore says nothing about human germline identity.
- **MOS CDR annotation** — "Antibody Region Annotation" is coming soon; CDRs were assigned locally
  with ANARCI (IMGT) and cross-checked against `parse_structure.py`.
- **Viscosity, HIC retention, polyspecificity** — experimental only.

## 8. Validation status and limitations

- Every candidate is a **computational proposal**. No candidate structure was predicted or solved,
  and nothing was experimentally measured. The wild-type VHH structure (5JDS) is the only
  experimental structure in this case.
- Model scores are arbitrary units, not kcal/mol, and the four axes are not on a common scale;
  the composite is a ranking device, not a free-energy estimate.
- Structural and sequence models disagree on framework positions by construction; candidates
  were accepted only when no axis was strongly adverse, which favours conservative changes with
  modest predicted gains.
- Single-mutation effects are not additive — `kn035_v1_combined` is a hypothesis for testing, and
  its seven changes should be validated individually before being combined.
- The binding-affinity predictions describe the crystallised complex only; avidity, PD-L1
  glycosylation and conformational selection are outside the model.

## 9. Package contents

```
README.md                                   this report
results/results.json                        structured record: task IDs, parameters, scores, sequences, limitations
results/all_screened_mutations_scored.csv   1425 mutations × 4 model scores, percentiles, SASA, liability deltas, filters
results/top_candidates.csv                  top 40 by composite
results/sequence_liabilities.json           per-residue SASA + all motif/liability findings
variants/kn035_variants.fasta               WT-derived single mutants + combined variant
variants/single/*.fa                        one file per variant
raw/*.csv, raw/similarity_results.json      untouched MOS task outputs
inputs/                                     5JDS.cif (MOS layout), renumbered VHH and complex, WT FASTA, design manifest
analysis/                                   parse_structure, contacts, interface outputs, step1.json
tasks/tasks.json                            task IDs and exact payloads
```
