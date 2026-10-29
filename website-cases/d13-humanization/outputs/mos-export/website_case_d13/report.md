# D1.3 antibody humanization — computational case report

**Case:** website case A (D1.3 humanization). **Parent:** murine anti-hen egg-white lysozyme Fab D1.3, PDB **1FDL** (2.5 Å).
**Experimental humanized reference:** PDB **1BVL**, "humanized anti-lysozyme Fv" (2.87 Å).

**What this case does and does not contain.** Every antibody sequence and every 3D model below is a *computational
prediction* (MOS `Antibody Humanization` and MOS `MMFold`). The only experimental numbers are the crystallographic
coordinates and derived geometry from 1FDL and 1BVL, which are labelled as such. **No affinity, immunogenicity,
expression or stability measurement was made.** Nothing in this report supports a claim that immunogenicity was
reduced or that binding was retained.

---

## 1. Chain identity: author numbering vs MOS labels

Two different chain-naming systems are in play and they must not be mixed.

**1FDL** (verified from COMPND/SOURCE records, the RCSB FASTA, and the `_mos_mapping` loop of the MOS-sanitized copy):

| author chain | molecule | MOS label | length |
|---|---|---|---|
| L | D1.3 light chain (mouse) | A | 214 (VL 1–107 + CL) |
| H | D1.3 heavy chain (mouse) | B | 218 (VH 1–116 + CH1) |
| Y | hen egg-white lysozyme (chicken) | C | 129 |

**1BVL** — this is where an earlier draft of this case went wrong, and the correction is recorded explicitly.
The deposited author chains are A and C = **VH** (116 modelled residues, entity 117 aa), B and D = **VL** (108),
with `_pdbx_struct_assembly_gen.asym_id_list` = `A,B` / `C,D`. **The biological pairs are author A+B and author C+D.**
MOS re-labels by entity, so the mapping is *not* the identity:

| author chain | role | MOS label | biological Fv |
|---|---|---|---|
| A | VH | A | Fv1 = author A+B |
| B | VL | C | Fv1 = author A+B |
| C | VH | B | Fv2 = author C+D |
| D | VL | D | Fv2 = author C+D |

Three independent checks agree on this mapping (`analyses/1BVL_chain_mapping.json`): the sanitizer mapping file
(A←A, B←C, C←B, D←D), coordinate identity with max |ΔCA| = **0.000 Å** between each MOS label chain and exactly one
author chain, and the deposited assembly/entity records. All comparisons in this report are named by author chains
(`1BVL_Fv1_authorAB`, `1BVL_Fv2_authorCD`) and were computed from PDB files cut directly out of the RCSB author
chains (`structures/ref_1BVL_authAB.pdb`, `structures/ref_1BVL_authCD.pdb`).

## 2. Variable domains used as the humanization input

Constant regions were excluded before any design work. ANARCI was run in IMGT, Kabat and Chothia schemes on every
polymer chain; per-residue tables are in `analyses/numbering_all_schemes.tsv`.

- **VH** (116 aa): `QVQLKESGPGLVAPSQSLSITCTVSGFSLTGYGVNWVRQPPGKGLEWLGMIWGDGNTDYNSALKSRLSISKDNSKSQVFLKMNSLHTDDTARYYCARERDYRLDYWGQGTTLTVSS`
- **VL** (107 aa): `DIQMTQSPASLSASVGETVTITCRASGNIHNYLAWYQQKQGKSPQLLVYYTTTLADGVPSRFSGSGSGTQYSLKINSLQPEDFGSYYCQHFWSTPRTFGGGTKLEIK`

IMGT CDRs of the parent: VH `GFSLTGYG` / `IWGDGNT` / `ARERDYRLDY`; VL `GNIHNY` / `YTT` / `QHFWSTPRT`.
Kabat and Chothia segmentations are stored alongside, because the three schemes give different CDR-H1 boundaries
(Kabat `GYGVN` at 31–35 vs Chothia `GFSLTGY` at 26–32) and mixing them silently corrupts any CDR-based statement.

## 3. The parent paratope and epitope (measured from 1FDL)

Buried surface was recomputed from the coordinates with explicit reference states:
BSA = SASA(Fab A+B as one body) + SASA(lysozyme) − SASA(Fab+lysozyme).

- **BSA = 1243.2 Å²** (VH side 349.4, VL side 246.8, lysozyme side 647.1).
- Repeating the identical calculation with the constant domains deleted gives **the same 1243.2 Å²** and identical
  per-residue values. The constant domains contribute **0.0 Å²**: they never touch the antigen (nearest heavy-atom
  approach 33.0 Å). The entire interface is V-domain.
- Direct heavy-atom contacts at 4.5 Å: **10 VH residues** (30, 31, 32, 52, 53, 54, 99, 100, 101, 102) and
  **7 VL residues** (32, 49, 50, 53, 91, 92, 93).

The paratope is CDR-dominated but not CDR-exclusive: VH CDR3 Tyr101 and Asp100 carry the largest burial
(68.8 and 62.6 Å²), followed by VL CDR2 Tyr50 (61.8 Å²) and VL CDR3 Trp92 (60.0 Å²). Two framework residues
participate directly — VL Tyr49 (FR2, 19.8 Å², contacting Asn19/Gly22) and VL Thr53 (FR3, 17.0 Å², contacting Asn19).
That matters for humanization: framework positions that touch antigen are exactly the ones a naive framework swap
can disturb.

Measured polar contacts (N/O···N/O ≤ 4.0 Å; distance-only proxy, not angle-validated): 21 atom pairs, **0 formal salt
bridges**. The structurally important ones include VH Asp100 OD2–Ser24 OG (2.63 Å), VH Asp100 OD1–Ser24 N (2.82 Å),
VL Tyr50 OH–Asp18 OD2 (2.86 Å), VH Tyr101 OH–Asp119 OD1 (2.97 Å), VH Tyr101 OH–Gln121 N (2.99 Å),
VL Thr53 OG1–Asn19 ND2 (3.07 Å) and VL Phe91 O–Gln121 NE2 (3.07 Å).

The lysozyme epitope recovered here (Gln121 98.0 Å², Asn19 69.9, Gly117 69.2, Lys116 56.0, Arg125 53.2, Ser24 52.7,
Gly22 51.4, Asp119 45.0, Thr118 39.2, Asp18 33.6) is the classical D1.3 epitope, which is a useful sanity check that
the geometry is being read correctly.

> **Correction recorded here.** An earlier version of this case reported ~1690 Å² of "constant-domain contacts to
> lysozyme / crystal packing". That was an artefact of merging the interaction-analysis skill's per-residue table,
> which does not reproduce against the coordinates (archived rows claim e.g. a 3.00 Å contact between atoms that are
> 79.5 Å apart). The claim is withdrawn; the archived skill outputs are kept in `analyses/interface_1FDL/` and
> `analyses/contacts_1FDL/` for audit only and are not used anywhere in this report.

## 4. Humanization designs (model scores — not measurements)

MOS task `Antibody Humanization`, **task ID 342335722341376**, 10 designs, SUCCEED (3.9 min).
All ten candidates preserve **all six CDRs exactly** — verified here by re-running ANARCI on each output sequence,
not taken from the task's own report. Design differences are confined to framework: 35–40 substitutions per candidate.

| candidate | score | OASis id.% (pct) | AbNatiV H / L | pLDDT | ipTM | seq changes |
|---|---|---|---|---|---|---|
| humanization_9 | 0.503 | 72.9 (29.1) | 0.75 / 0.68 | 95.0 | 0.964 | 36 |
| humanization_5 | 0.475 | 72.5 (27.5) | 0.73 / 0.62 | 95.5 | 0.964 | 35 |
| humanization_3 | 0.473 | 72.0 (25.8) | 0.64 / 0.73 | 96.1 | 0.963 | 36 |
| humanization_4 | 0.471 | 71.5 (24.3) | 0.70 / 0.70 | 94.8 | 0.959 | 38 |
| humanization_8 | 0.469 | 71.0 (22.7) | 0.74 / 0.69 | 96.0 | 0.966 | 40 |
| humanization_10 | 0.463 | 69.6 (18.5) | 0.73 / 0.75 | 96.2 | 0.962 | 38 |
| humanization_2 | 0.459 | 70.0 (19.5) | 0.73 / 0.72 | 96.8 | 0.966 | 35 |
| humanization_1 | 0.455 | 70.0 (19.5) | 0.69 / 0.74 | 95.8 | 0.959 | 36 |
| humanization_7 | 0.426 | 69.9 (19.1) | 0.74 / 0.58 | 94.0 | 0.962 | 40 |
| humanization_6 | 0.401 | 66.2 (13.4) | 0.66 / 0.68 | 95.7 | 0.959 | 36 |

These are the task's own model scores (BIOPHI OASis identity/percentile, AbNatiV per-chain). Read them with care:
every candidate sits between the **13th and 29th OASis percentile**, and every AbNatiV value stays **below the 0.8
"native-like" threshold** the scoring tool itself uses. This is a modest humanization, not a clinical-grade one, and
no immunogenicity claim follows from it.

## 5. Structural fidelity of the ten candidate Fv models

Because the humanization task returned structures for only one candidate, **all ten** Fv structures were predicted
de novo with MOS `MMFold` (VH = chain A, VL = chain B; five samples each). All ten tasks succeeded; the five sample
models the humanization task produced for `humanization_9` are kept separately in `native_tasks/humanization/` and
are **not** part of the uniform structural set.

Superposition is a **Kabsch fit on CA atoms with residue pairing from shared ANARCI IMGT positions** (223 CA for the
whole Fv, 180 CA for the framework fit). This is a Mocha-computed statistic — see §8 on why it is not called a native
superimpose.

| candidate | CA RMSD vs parent (Å) | FR-fit RMSD (Å) | paratope mean / max shift (Å) | VH CDR3 local RMSD (Å) | VL CDR3 local RMSD (Å) |
|---|---|---|---|---|---|
| humanization_1 | 0.42 | 0.41 | 0.41 / 1.04 | 0.22 | 0.50 |
| humanization_2 | 0.43 | 0.42 | 0.42 / 1.06 | 0.22 | 0.54 |
| humanization_3 | 0.41 | 0.39 | 0.42 / 1.03 | 0.20 | 0.52 |
| humanization_4 | 0.47 | 0.42 | 0.64 / 2.04 | 0.24 | 0.53 |
| humanization_5 | 0.43 | 0.42 | 0.40 / 1.08 | 0.21 | 0.55 |
| humanization_6 | 0.41 | 0.41 | 0.39 / 1.00 | 0.22 | 0.50 |
| humanization_7 | 0.46 | 0.45 | 0.42 / 1.13 | 0.20 | 0.58 |
| humanization_8 | 0.45 | 0.44 | 0.45 / 1.10 | 0.24 | 0.57 |
| humanization_9 | 0.50 | 0.45 | 0.64 / 1.22 | 0.22 | 0.54 |
| humanization_10 | 0.42 | 0.42 | 0.40 / 1.02 | 0.20 | 0.49 |

The scale against which these numbers should be read is the experimental one: **the two copies of the same humanized
Fv inside 1BVL differ from each other by 0.816 Å CA RMSD** (0.782 Å framework fit) at 2.87 Å resolution. Every
candidate deviates from the parent Fv by *less* than two copies of one identical protein deviate from each other.
At this resolution the models do not resolve candidate-to-candidate differences, and the 0.41–0.50 Å spread should
not be ranked as if it were signal.

Individual CDR loops keep their parent conformation (local RMSDs 0.11–0.58 Å), with VL CDR3 consistently the most
mobile (0.49–0.58 Å) — the same loop is also the most variable between the two experimental 1BVL copies (0.24–0.59 Å).

**One flag worth reporting.** In `humanization_4` and `humanization_9`, VH CDR2 position 58 (parent residue B53, a
direct antigen contact) moves up to 2.0–2.5 Å in some samples. Across the five MMFold samples of the same sequence,
that displacement ranges 0.24–2.04 Å for `humanization_4` and 0.41–2.49 Å for `humanization_9`, whereas
`humanization_2` (0.32–0.46 Å) and `humanization_3` (0.52–0.62 Å) hold it steady. That pattern says the CDR2
conformation is **under-determined by the predictor** for those two sequences; it is not evidence that the
humanization moved the paratope. No candidate is credited or penalised on this basis.

## 6. Comparison with the experimental humanized Fv (1BVL)

1BVL is a framework-humanized D1.3: its six CDRs are **sequence-identical** to the mouse parent, with **42 framework
substitutions** (VH 25, VL 17). It is a reference point, not ground truth for these candidates — the candidates differ
from it at 23–24 framework positions and carry a different humanization strategy.

Two independent fits per candidate, against both deposited copies (author A+B and author C+D):

| candidate | vs 1BVL Fv1 (author A+B) CA RMSD / FR fit | vs 1BVL Fv2 (author C+D) CA RMSD / FR fit |
|---|---|---|
| humanization_1 | 0.72 / 0.61 | 0.63 / 0.65 |
| humanization_2 | 0.71 / 0.61 | 0.62 / 0.63 |
| humanization_3 | 0.76 / 0.63 | 0.65 / 0.65 |
| humanization_4 | 0.76 / 0.69 | 0.73 / 0.70 |
| humanization_5 | 0.77 / 0.66 | 0.64 / 0.65 |
| humanization_6 | 0.73 / 0.63 | 0.61 / 0.62 |
| humanization_7 | 0.72 / 0.64 | 0.68 / 0.71 |
| humanization_8 | 0.67 / 0.60 | 0.62 / 0.64 |
| humanization_9 | 0.64 / 0.58 | 0.67 / 0.66 |
| humanization_10 | 0.78 / 0.67 | 0.72 / 0.74 |

(Full per-region and framework-fit values for every pair are in `results.json` -> `candidates[*].vs_1BVL`.)

The two reference copies themselves differ by 0.816 Å, and the mouse parent sits 0.81 Å from Fv1 and 0.66 Å from Fv2.
The candidates fall inside exactly this band (0.61–0.78 Å). In plain terms: each predicted humanized Fv is about as
close to the experimental humanized Fv as the two experimental copies are to each other and as the experimental
humanized Fv is to the mouse parent. That is a consistency statement about predicted coordinates — it is **not**
evidence about affinity.

**Three representatives** were carried forward for the 1BVL comparison and for the viewer, chosen on stated criteria
rather than a declared winner: `humanization_9` (top task score and top OASis percentile), `humanization_3` (lowest
deviation from the parent, tightest ensemble), `humanization_2` (highest pLDDT / ipTM with a stable CDR2).
`humanization_4` is discussed above as the ensemble-unstable case.

## 7. What these results do and do not support

- **Supported:** the ten designs are complete VH/VL sequences with intact CDRs; their predicted Fv structures are
  high-confidence, internally consistent, and deviate from the parent Fv by less than experimental copy-to-copy
  variation; the designs sit ~0.6–0.8 Å from a real framework-humanized D1.3 Fv.
- **Not supported:** that any candidate preserves affinity; that any candidate reduces immunogenicity; that any
  candidate is better than another on the basis of 0.02–0.09 Å RMSD differences; that the humanization score implies
  clinical acceptability (all candidates are below the 30th OASis percentile and below the AbNatiV native-like bar).
- **Untested here:** expression, stability, aggregation, actual immunogenicity, and antigen binding. A binding
  measurement (SPR/BLI) or a scored antibody-antigen complex prediction would be required next; neither was run.

## 8. Provenance: native MOS vs Mocha-added statistics

| item | what it is |
|---|---|
| `Antibody Humanization` task 342335722341376 | **native MOS task**, payload and outputs preserved |
| 10 × `MMFold` tasks (IDs in `native_tasks/task-ledger.json`) | **native MOS tasks**, 5 samples each, all SUCCEED |
| MMetrics auto-compute on 1FDL (task 342335703909376) | **native MOS task**, still RUNNING at last check — **no output used** |
| ANARCI numbering (IMGT/Kabat/Chothia) | Mocha-run installed binary |
| BSA / contacts / H-bond proxy | Mocha-run `freesasa` + direct coordinate geometry |
| CA superposition, RMSD, per-region displacement | **Mocha-added structural statistics (Kabsch)**, not a MOS-native superimpose |
| Viewer imports of aligned complexes | native MOS `ImportStructure`; the interactive viewer stayed on 1FDL, so selections were applied to 1FDL only |

**On "native Superimpose":** no superposition task type exists among the available MOS tasks, and no Superimpose tool
is exposed in this session. No native MOS superposition was run, and none is claimed. Every RMSD in this report comes
from the documented Kabsch fit in `analyses/fv_compare.py`. The *results* of that fit were materialised as aligned
complex PDB/CIF files and registered in MOS (`superposed_1FDLparent_humanization_{2,3,9}`, object IDs 342339294221312 /
342339292763136 / 342339296826368) so the alignment can be inspected and screenshotted in the viewer.

## 9. Open item

The native MMetrics analysis of 1FDL (`autocompute-1FDL`, task **342335703909376**, started 08:07:33Z) was still
RUNNING when this case closed; its input parameters were captured (`logs/autocompute_1FDL_last_check.json`) but no
output was retrievable and none was used. The 1BVL auto-compute tasks (342337097712640, 342337098777600) were also
still pending/running. If those complete, their MMetrics tables should be added as a separate native-data section;
nothing in the present analysis depends on them.
