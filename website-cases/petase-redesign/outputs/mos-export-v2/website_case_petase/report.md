# PETase rational engineering around the HEMT site — case report

Working directory: `/workspace/website_case_petase/`
Every number in this report comes from a file in this directory or from a MOS
task listed in `task-ledger.json`. No predicted affinity, activity or stability
value is reported that was not actually computed, and no experimental claim is
made for any designed variant.

---

## 1. Structures, identity checks, and why 5XH3 cannot stand in for WT

Two deposits were downloaded from RCSB together with their PDBx FASTA and
metadata (`inputs/`):

* **5XG0** — 1.58 A, apo PETase, three copies of the same construct in the
  asymmetric unit (chains A/B/C, author numbering -6..261; positions -6..0 are a
  `GAGAGAM` expression tag, mature residues are 1-261). No ligand.
* **5XH3** — 1.30 A, "R103G/S131A mutant in complex with HEMT", one protein
  chain (author 1-261) plus the ligand.

The single most consequential fact for this case: **5XH3 carries the catalytic
knock-out.** Its own SEQADV records map GLY A 103 to UNP ARG 132 and ALA A 131
to UNP SER 160, i.e. R103G is a packing fix and S131A removes the nucleophile
Ser160. Any scoring, design or structural argument that treats 5XH3 as wild type
would be wrong by construction, so all three mutation scans were run on 5XG0,
and the ligand-free WT was kept as the structural reference throughout.

Numbering was derived, not assumed: the 261-residue chain sequence of 5XG0 was
located verbatim inside UniProt A0A0K8P6T7 at offset 29, which reproduces the
DBREF2 mapping AUTH 1-261 = UNP 30-290 (`UNP = AUTH + 29`). The three scoring
tasks used the 268-residue chain C construct, where `CONSTRUCT = AUTH + 7`
because of the tag; tag positions 1-7 were excluded from every selection
decision and are never counted as natural PETase sequence. The full table is in
`logs/README_numbering.md`.

The ligand is component **856**, not "HEMT": HEMT (1-(2-hydroxyethyl) 4-methyl
terephthalate, C11H12O5, `COC(=O)c1ccc(C(=O)OCCO)cc1`) is the publication's
abbreviation and there is no CCD entry called HEMT (RCSB returns 404). The
16-heavy-atom diester sits in label chain B / author chain A residue 301. It is
not the 18-heavy-atom BHET used in docking exercises; the two were kept strictly
apart.

## 2. The ligand site, measured

Nine residues line HEMT within 4.0 A (69 atom-atom contacts); 328.4 of the
ligand's 417.3 A^2 of free SASA is buried on binding (78.7 %), so this is a
closed aromatic slot rather than a surface groove.

The chemistry that matters is at the hydroxyethyl ester end. The scissile
carbonyl oxygen O10 is held by two backbone amides - **Tyr58 N (2.90 A)** and
**Met132 N (2.93 A)** - which are UNP Tyr87 and Met161, the oxyanion hole. The
ester oxygen O11 is hydrogen bonded to **His208 NE2 (2.87 A)**, the catalytic
histidine. The terephthalate ring is sandwiched between **Trp156** (ring-centroid
4.98 A, pi-stack) and **Ile179**, with **Trp130** packing edge-on (3.21 A), and
the methyl-ester end reaches **Trp156 NE1 (3.20 A)**. When the true wild-type
nucleophile is placed in this frame (5XG0 superposed, RMSD 0.26 A over 261 CA),
**Ser131 OG lands 2.51 A from the ester carbon C09** - the geometry of an
in-line attack that the S131A mutant can never perform.

Details, per-atom distances and interaction typing: `analyses/01_ligand_pocket_analysis.md`,
`analyses/ligand856_*.csv`, `analyses/5XH3_contacts/`.

## 3. The registered affinity task reproduces the manual example

The manual example files were rebuilt and verified byte-for-byte before use:

| file | bytes | SHA256 | check |
|---|---|---|---|
| `inputs/5xh3_clean.pdb` | 156500 | `aa9ddaea...12853c` | matches the stated hash |
| `inputs/5xh3_B_856.sdf` | 2191 | `44c9ea73...443e9` | matches the stated hash |

`5xh3_clean.pdb` was produced exactly as specified (the 1931 `ATOM  ` lines of
the deposited 5XH3.pdb, a TER record and END); `5xh3_B_856.sdf` is the decoded
manual base64, byte-verified.

A **new** Protein-Ligand Affinity Evaluation task was launched
(`342337422410752`, SiPoBe) using the registered `5xh3_clean` object (1931 atoms,
coordinates identical to the verified file) and the manual SDF at its original
TOS path. It returned

```
score -4.310292 | vdw -2.4951997 | hbond -0.5505939 | metal 0.0 | hydrophobic -1.2644981
```

which is identical, to every digit, to the native reference task `338706466620416`
(`-4.310292`, same four components). The manual example therefore reproduces in
this project, which is the only thing that result is used for: **it says nothing
about PETase engineering quality and must not be read as an affinity improvement
metric.**

One limitation was hit and is recorded rather than worked around: importing an
SDF through `ImportStructure` fails in this environment ("This file is already a
sanitized MOS structure..."), reproduced on three different SDF files. The
manual SDF was therefore referenced at its original TOS path; no substitute
ligand was fabricated.

## 4. Three wild-type scans, one input, identical sequence

All three tasks consumed the same 5XG0 chain C construct (268 aa):

| task | type | ID | output |
|---|---|---|---|
| `WT_PETase_seqfitness` | Sequence Fitness Mutation Effect | 342337264870400 | `native_tasks/seqfitness_.../sequence_scores.csv` |
| `WT_PETase_evomut` | Evolutionary Mutation Effect | 342337268093952 | `native_tasks/evomut_.../evolutionary_scores.csv` |
| `WT_PETase_structfitness` | Structural Stability Mutation Effect | 342337277858816 | `native_tasks/structfitness_.../struct_fitness_scores.csv` |

Each file contains 5360 rows (268 positions x 20 substitutions, WT self-score
0). Scores are relative to WT, so 0 = "no better than wild type"; positives are
substitutions the model prefers. The evolutionary task's result was present on
disk (the `AnalyzeMutationScores` wrapper reported missing files); the raw CSV
was used directly and is archived with the rest.

## 5. Choosing five positions (and documenting the refusals)

Selection used three independent lines of evidence - HEMT contact geometry,
second-shell packing, and the three score sets - under a hard constraint that
the catalytic triad (131/177/208), the oxyanion-hole amides (58/132) and both
disulfides (174-210, 244-260) stay fixed. `analyses/redesign_site_selection.csv`
records every position with its distance to the ligand, its relative SASA, the
best substitution and score from each of the three models, and the reason.

**Opened for design (5):**

| AUTH | UNP | WT | closest HEMT atom | why |
|---|---|---|---|---|
| 130 | 159 | Trp | 3.21 | edge-on packing against the ring; structure model prefers His by +2.53 |
| 156 | 185 | Trp | 3.20 | pi-stack + NE1...O H-bond to the methyl ester; structure model accepts Tyr (+0.98) |
| 157 | 186 | Asp | 6.28 | second-shell carboxylate on the rim; all three models prefer a substitution (N/N/H) |
| 179 | 208 | Ile | 3.60 | hydrophobic face of the ring; sequence model prefers Thr (+1.18) / Val (+0.94) |
| 209 | 238 | Ser | 7.42 | second-shell cleft lining; structure model ranks Tyr (+1.62) well above WT |

**Refused, with reasons** (full text in the CSV): 131/177/208 catalytic;
58/132 oxyanion hole; 174/210/244/260 disulfides; 57 glycine with backbone-only
contact; 60 alanine with a single 3.76 A contact and only one model in favour;
185, 153, 212, 207 deferred because they sit off the substrate path, which kept
the design local instead of spraying changes across the protein.

## 6. Ligand-aware local redesign (Protein Redesign, 10 designs)

**The template is a constructed model, not an experimental WT complex.**
5XH3's protein is the catalytically dead double mutant, and transferring the
HEMT pose onto the deposited WT 5XG0 coordinates produces a 0.86 A clash with
the Trp185 side chain (the WT rotamer differs - predicted per-residue CA
displacement at AUTH 156 is 0.94 A, the largest in the pocket). The template
therefore takes:

* backbone and every side chain from **5XH3** (the conformation that actually
  binds HEMT),
* AUTH **103** reverted GLY -> ARG and AUTH **131** reverted ALA -> SER, atoms
  transplanted from **5XG0 chain C** after superposition (Arg103 NH1 is 26.4 A
  from the ligand; Ser131 OG lands 2.51 A from C09, no atom closer than 2.2 A),
* the **experimental HEMT pose** from 5XH3.

File: `structures/5XG0_WT_HEMT_model.cif`; build log and validation:
`structures/5XG0_WT_HEMT_model_build.json`, script
`structures/write_wt_hemt_cif.py`. It is never described as a crystal structure.

Task `342338944422912` (Protein Redesign), exact payload:

```json
{"structure_path": "user_objects/123/330665428816896/sanitized/179248434317855_5XG0_WT_HEMT_model.cif",
 "n_designs": 10, "chains_to_design": "D",
 "redesigned_residues": "D130 D156 D157 D179 D209",
 "design_output_mode": "full"}
```

It succeeded in 35 s and returned ten 261-residue sequences
(`native_tasks/redesign_342338944422912/redesign.fasta`). Verification against
the WT model sequence shows **zero substitutions outside the five opened
positions** in all ten designs.

| design | substitutions (AUTH) |
|---|---|
| seq_1 | W130H, W156Y, D157H, **I179V**, S209G |
| seq_2, seq_3, seq_6, seq_7 | W130H, W156Y, D157Y, (I179V in seq_7), S209G |
| seq_4, seq_5, seq_8, seq_9, seq_10 | W130H, W156Y, D157H, S209G |

Reproducing the same run: `analyses/redesign_variants.json`. The task returns
sequences only - no per-position probabilities and no per-design score were
produced, and none are invented here.

**Honest reading of the design output.** The three redesign variants
(Trp130His, Trp156Tyr, Ser209Gly) are not what the sequence-based models would
have chosen: single-substitution scores on WT are W130H -1.55 (sequence) /
-8.58 (evolutionary) / +2.53 (structure), W156Y -0.61 / -4.32 / +0.98, D157H
-0.11 / -0.67 / +3.94, S209G -0.65 / **-6.94** / +0.67
(`analyses/design_substitution_scores.csv`). The ligand-aware design trades
sequence plausibility for pocket fit, and Ser209Gly in particular is strongly
disfavoured by the evolutionary model. These are single-mutant scores and are
*not* summed into a multi-mutant prediction.

## 7. Representative candidates: MMFold models and structural comparison

Three of the ten designs were folded with the registered **MMFold** task; each
returned five model samples plus confidence summaries. All nine had to be
compared to something, so the comparison is against the apo wild-type
5XG0 chain C (261 CA).

| task | candidate | substitutions | task ID | pLDDT (mean) | pTM | ensemble spread (CA RMSD vs sample 1) |
|---|---|---|---|---|---|---|
| MMFold_candidate_seq_4 | seq_4 | W130H W156Y **D157H** S209G | 342339217835008 | 97.29 | 0.984 | 0.068-0.095 A |
| MMFold_candidate_seq_2 | seq_2 | W130H W156Y **D157Y** S209G | 342339221820416 | 96.83 | 0.981 | 0.092-0.128 A |
| MMFold_candidate_seq_1 | seq_1 | W130H W156Y D157H **I179V** S209G | 342339232719872 | 97.22 | 0.984 | 0.066-0.094 A |

Model files and confidences: `native_tasks/mmfold_seq_*/`; per-residue
comparison tables: `analyses/model_compare_seq_*.csv`; summaries:
`analyses/model_compare_seq_*.json`. The five samples of each candidate agree to
< 0.13 A, which means MMFold is not sampling alternatives here - the fold is
unambiguous, and it therefore cannot be used as evidence that a design is
*correct*, only that it is structurally plausible.

**Whole-chain and local agreement with WT.** Superposing each model on 5XG0
over all 261 matched CA:

| candidate | global CA RMSD | pocket CA RMSD (11 residues) | designed-site CA RMSD | largest displacement |
|---|---|---|---|---|
| seq_4 | 0.249 A | 0.288 A | 0.370 A | 1.12 A (AUTH 29) |
| seq_2 | 0.288 A | 0.262 A | 0.259 A | 1.00 A (AUTH 29) |
| seq_1 | 0.291 A | 0.351 A | 0.396 A | 1.04 A (AUTH 158) |

Per designed position (CA displacement): 130: 0.12-0.15 A; 156: 0.25-0.51 A;
157: 0.41-0.60 A; 179: 0.13-0.20 A; 209: 0.28-0.31 A. The largest local
movements are at the two positions where the design changes side-chain volume,
never at the catalytic residues.

**The catalytic machinery survives the designs**, measured inside each model:
Ser131 OG...His208 NE2 = 2.90-3.02 A, His208 ND1...Asp177 OD2 = 2.64-2.75 A,
Cys174-SG...Cys210-SG = 2.04-2.09 A, Cys244-SG...Cys260-SG = 2.03-2.08 A - all
within the WT ranges (2.91 / 2.65 / 2.06 / 2.05 A).

**Pocket fit against the experimental HEMT pose.** Each apo model was rigid-body
superposed onto 5XH3 (RMSD 0.21-0.26 A) and the experimental ligand left in
place:

| candidate | 130 | 156 | 157 | 179 | 209 | closest contact |
|---|---|---|---|---|---|---|
| seq_4 | 3.63 A (His CE1...C12) | 2.59 A (Tyr CE1...O02) | 5.89 A | 3.82 A | 7.40 A | 2.59 A, no clash |
| seq_2 | 3.63 A | **1.67 A (Tyr CE1...O02)** | 5.56 A | 3.87 A | 7.48 A | 1.67 A, clash |
| seq_1 | 3.61 A | **2.20 A** | 5.84 A | 3.82 A (Val CG2) | 7.45 A | 2.20 A, borderline |

Read with care: this is a rigid transfer of an experimental pose that was
determined with a *tryptophan* at position 156, so a tyrosine there is being
judged against a methyl-ester oxygen that never had to accommodate it. What it
does show is that seq_4 (His at 157) is the only representative whose designed
side chains all clear the crystallographic ligand without a short contact,
whereas the Tyr156 in seq_2 and seq_1 comes within 1.7-2.2 A of the ligand's
methoxy oxygen. That is a geometric caution, not a measured affinity penalty.

**WT single-substitution scores of the new substitutions** (from the three
5XG0 scans; single mutants, *not* additive):

| substitution | sequence | evolutionary | structure |
|---|---|---|---|
| W130H | -1.55 | -8.58 | **+2.53** |
| W156Y | -0.61 | -4.32 | **+0.98** |
| D157H | -0.11 | -0.67 | **+3.94** |
| D157Y | -0.66 | -4.90 | -0.08 |
| I179V | **+0.94** | -1.67 | -0.42 |
| S209G | -0.65 | **-6.94** | +0.67 |

No combined-variant score exists: none of the registered scorers accepts a
multi-mutant or a model-built complex in this environment, so the designs are
*not* assigned a summed or predicted effect. The honest summary is that
D157H and W130H are supported by the structure model and tolerated-to-mildly-
disfavoured by the sequence models, W156Y is driven almost entirely by structure
fitness, and S209G is the one change that the evolutionary model strongly
opposes.

## 8. What this case does and does not establish

Established:

* the experimental ligand is CCD 856 = HEMT, 16 heavy atoms, in label chain B /
  author chain A 301, and its site is a closed aromatic slot with the scissile
  ester held by the Tyr58/Met132 oxyanion hole and His208;
* 5XH3 is not wild type - it is the catalytically dead S131A (UNP S160A) plus a
  packing-fix R103G - so every WT-scored input was 5XG0;
* the registered affinity task reproduces the manual example exactly
  (-4.310292), which validates the pipeline but says nothing about engineering;
* five local non-catalytic positions were opened around the site, ten designs
  were produced with no substitutions outside those positions, and three of them
  fold to within 0.25-0.29 A of wild-type with intact catalytic geometry and
  disulfides.

Not established, and not claimed:

* any improvement in binding affinity, kcat, thermostability or PET turnover for
  any design - no such measurement or validated predictor was run;
* that S209G or W156Y are beneficial: the sequence/evolutionary models argue
  against both, and only the rigid ligand transfer passes judgement on them;
* that the WT+HEMT template equals an experimental WT complex - it is a model,
  built from 5XH3 coordinates with two side chains reverted from 5XG0.

Open limitation: no MOS Superimpose task exists here, so all superpositions are
gemmi computations, labelled as Mocha built-in throughout; SDF import through
`ImportStructure` is blocked in this environment, which is why the affinity task
consumes the manual ligand at its original TOS path.

---

## 9. Inventory and provenance classes

| class | what it is | where |
|---|---|---|
| **experimental reference** | RCSB 5XH3 / 5XG0 coordinates, PDBx FASTA, entry metadata, chem_comp 856, UniProt A0A0K8P6T7 | `inputs/` |
| **manual example inputs** | byte-verified `5xh3_clean.pdb` (156500 B) and `5xh3_B_856.sdf` (2191 B) | `inputs/` |
| **MOS-registered models / task outputs** | affinity score, three WT scans, redesign FASTA, nine MMFold models + confidences | `native_tasks/` |
| **constructed model (not experimental)** | `5XG0_WT_HEMT_model.cif` = 5XH3 conformation + WT identity at AUTH 103/131 + experimental HEMT pose | `structures/` |
| **Mocha built-in analysis** | pocket geometry, SASA burial, superpositions, per-residue maps, model comparisons, all CSV/JSON | `analyses/` |
| **bookkeeping** | `task-ledger.json` (9 MOS tasks with exact payloads), `results.json`, `logs/run_log.md`, `logs/README_numbering.md` | root / `logs/` |

Reproduce: `python candidate_selection.py`, then
`analyses/ligand_pocket_analysis.py`, `analyses/superpose_5xg0_5xh3.py`,
`analyses/compare_model_to_wt.py <model.cif> <label>`, `write_selection_rationale.py`,
`write_results.py`, `write_ledger.py`, `package.py`.

---

## 10. Payload provenance (ledger v2)

`task-ledger.json` (v2) no longer carries prose in place of parameters. Each of
the 13 tasks now has:

* `payload_exact` — the complete parameter object the platform echoed back,
  including the **full 268-letter WT sequence** for the two sequence scans and
  the **full 261-letter sequence** for each of the three MMFold jobs
  (verified by length and SHA256 against `analyses/5XG0_chainC_seq.fasta` and
  `analyses/representatives.fasta`);
* `payload_fields_not_exposed` — fields the platform never returned, marked as
  such instead of guessed: for MMFold, `modelSeeds` (omitted by us, platform
  default used, seed values not echoed); for Protein Redesign, sampling
  temperature, random seed, per-position probabilities and the checkpoint name;
* `full_response_file` — `native_tasks/<task_id>/check_mosttask_response.json`,
  the field-for-field CheckMOSTask response (status, name, type, start, duration,
  input parameters, downloaded files);
* `downloaded_files`, `archived_output`, `archived_output_sha256`.

`native_tasks/_raw_api_returns/` holds the merged index
(`all_check_mosttask_responses.json`) and the verbatim `ListMOSTasks` board
snapshot. No response contained credentials or tokens, so nothing needed
redaction.

## 11. Native MMetrics status for the 5XH3 complex

Importing `5XH3_HEMT_complex` auto-triggered two `autocompute-*` jobs
(342337764889600 and 342337765340160). At the final check both are still
**PENDING** ("Task is waiting (not queued)"), so **no downloadable native
MMetrics output exists for the 5XH3 complex yet** — the pocket numbers in this
case come from the Mocha built-in scripts, not from MMetrics.

Native MMetrics does exist, and is retrievable, for two other objects:

| object | mmetrics task | status | artifact object ids |
|---|---|---|---|
| 5XG0 chain C | 342337536795648 | SUCCEED | blast 342337533740032, esm 342337533756416, ligandmpnn 342337533772800, msat 342337533789184 |
| 5xh3_clean | 342338457240576 | SUCCEED | blast 342338453935104, esm 342338453943296, ligandmpnn 342338453955584, msat 342338453963776 |

The candidate models and the WT+HEMT model also have auto-triggered jobs, all
still PENDING. One example artifact (`mos-score-esm@esm_scores.csv`,
object 342337533756416) was downloaded only to prove retrievability; it is not
used in any analysis here.

## 12. Overlays for native screenshots

Three two-chain overlays were built so WT and a candidate can be inspected
together, already superposed:

| MOS object | work ID | chain A | chain B |
|---|---|---|---|
| overlay_WT_chainA_seq_4_chainB.cif | 342340966765568 | WT 5XG0 chain C (experimental, tag removed) | MMFold seq_4, RMSD 0.249 A |
| overlay_WT_chainA_seq_2_chainB.cif | 342340974621696 | same WT chain | MMFold seq_2, RMSD 0.288 A |
| overlay_WT_chainA_seq_1_chainB.cif | 342341006595072 | same WT chain | MMFold seq_1, RMSD 0.291 A |

Chain sources, matched CA counts, per-file max displacement and MOS ids are in
`structures/overlays/overlay_manifest.json`; originals are kept untouched in
`native_tasks/mmfold_seq_*/`. The overlays contain **no ligand**: the HEMT pose
is experimental only in `5XH3_HEMT_complex`, and the transplanted pose in
`5XG0_WT_HEMT_model` remains a model. The overlays are therefore not
experimental candidate complexes and must not be captioned as such.
