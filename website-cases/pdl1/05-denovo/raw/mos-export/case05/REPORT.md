# Case 05 — De novo binders against human PD-L1: results

**Task type:** Protein Binder Design (MOS) — de novo backbone generation, sequence
design and complex prediction (`compare_binder=1`).
**Binder length requested:** 60-100 aa. **Hotspots:** I54/Y56/R113 face of PD-L1.

**Outcome:** 2 of 3 runs completed and fully processed, 2 de novo candidates
delivered, both docking on the PD-1/avelumab-competitive face. seed333 was still
running at bundle build time and is reported as unresolved. No existing binder was
redesigned at any point; the input structure contained no binder chain.

---

## 1. Target

Human PD-L1 extracellular domain from PDB 5GRJ, chain identity verified
programmatically (`verification.txt`, 16/16 checks pass):

- entity 3, `Programmed cell death 1 ligand 1`, auth chain **A** / label **C**
- 213 modeled residues, auth 18-233 (auth 185-187 disordered, not modeled)
- avelumab H and L chains removed; no waters, glycans, ions or ligands were present
- sanitized MOS layout: chain A, residues 1-213, contiguous

Numbering map for the requested epitope, and the three extra accessible interface
positions added to broaden it:

| Author | Sanitized | Residue | SASA (Å²) | Role |
|---|---|---|---|---|
| I54 | A37 | Ile | 25 | requested |
| Y56 | A39 | Tyr | 71 | requested |
| R113 | A96 | Arg | 70 | requested |
| E58 | A41 | Glu | 48 | added |
| V68 | A51 | Val | 37 | added |
| Y123 | A106 | Tyr | 113 | added |

Hotspots passed to MOS: `A37,A39,A41,A51,A96,A106`. Contigs `A1-213/0 60-100`.

## 2. Task outcomes (observed)

| Run | Task ID | Seed | Status | Runtime | Files |
|---|---|---|---|---|---|
| seed111 | 342254837666816 | 111 | SUCCEED | 4.3 min | `output.cif`, `aligned.cif` |
| seed222 | 342254839784448 | 222 | SUCCEED | 8.2 min | `output.cif`, `aligned.cif` |
| seed333 | 342254842782720 | 333 | RUNNING at build time | >8 min | none delivered |

Each successful run returned exactly two structures:

- `*_output.cif` — the hallucinated backbone. The binder chain is **poly-glycine**
  (all residues Gly, B-factor 0), i.e. a virtual backbone with **no designed
  sequence**. It is retained in the bundle but is not a design.
- `*_aligned.cif` — the sequence-designed, re-predicted complex. Binder chain A
  (designed sequence) + PD-L1 chain B, per-residue pLDDT in the B-factor column.
  This is the actual design deliverable.

## 3. Designed sequences

```
>candidate_2 (seed222) 66 aa
MGSIEALNNLYKQMGEKAAELKEFAEEAEKKLEETRKKDEEKALELAKEIDKKTSKLFDELKGDNK

>candidate_1 (seed111) 73 aa
DAAARAAELERRCESLAKIIAEHEAALAALRAAAASAADREAVAAAAARQARAAAALRALRARLEAEARALRE
```

Both are genuine de novo sequences with no counterpart in the input structure.
Both are helical, Glu/Lys- or Arg/Glu-rich, and both lie in the requested 60-100
aa window (73 and 66 residues).

## 4. Measured interface and confidence metrics

Every value below was measured from the delivered files; nothing is estimated.

| Metric | candidate_1 (seed111) | candidate_2 (seed222) |
|---|---|---|
| Binder length | 73 aa | 66 aa |
| Hotspots engaged (≤4.5 Å, of 6) | **6** | **5** |
| Per-hotspot min distance I54 / Y56 / E58 / V68 / R113 / Y123 | 3.73 / 3.05 / 2.47 / 3.27 / 2.42 / 2.97 Å | 3.87 / 4.34 / 4.72 / 1.87 / 2.97 / 2.37 Å |
| Buried area, both sides (PPInterface) | 1833 Å² | 1214 Å² |
| Buried area per side (PPInterface) | 894 / 940 Å² | 585 / 629 Å² |
| Buried area per side (Shrake-Rupley cross-check) | 887 Å² | 601 Å² |
| Interface residues binder / PD-L1 | 25 / 26 | 19 / 18 |
| H-bonds across interface | 2 | 1 |
| Salt bridges reported by InteractionNet | 10 atom contacts | 5 atom contacts |
| — charge-validated as salt bridges (audit §6) | **9 atom contacts / 4 distinct acid–base pairs** | **5 atom contacts / 3 distinct acid–base pairs** |
| — rejected as non-salt-bridge | 1 (His23–Asp56, neutral partner) | 0 |
| Binder pLDDT mean / median / max | 65.9 / 67.0 / 74.1 | 62.2 / 64.1 / 85.4 |
| Binder residues pLDDT ≥70 / ≥80 | 14% / 0% | 27% / 2% |
| Interface pLDDT (binder side) | 65.3 | 60.2 |
| PD-L1 pLDDT mean | 87.6 | 88.8 |
| Helix fraction (φ/ψ) | 0.94 | 0.97 |
| Ala fraction / net charge pH 7 / entropy | 0.45 / +2 / 2.52 bits | 0.11 / −3 / 3.35 bits |

**Not delivered by the pipeline: ipTM, pTM, PAE, interface energy.** Only pLDDT
was returned. Complex-level confidence therefore cannot be stated and is recorded
as `null` throughout the bundle rather than approximated.

## 5. Epitope convergence — the main biological finding

Both independent runs dock onto the PD-1/avelumab-competitive face, and they do so
with chemically different solutions:

- **candidate_1** buries 26 PD-L1 residues, of which **18 of the 20 avelumab
  footprint residues (90%)** are engaged (auth 54, 56, 58, 60, 61, 62, 63, 66,
  69, 73, 75, 76, 113, 115, 117, 121, 123, 125). Its **Glu8** (binder position 8
  is glutamic acid, read from the coordinates) forms a bidentate salt bridge to
  PD-L1 **Arg113** (2.4 Å to NH1, 3.5 Å to NH2) — an acidic side chain against a
  basic one, the correct charge complementarity. Arg12 clamps PD-L1 Glu58
  (2.5 Å), and Arg5 hydrogen bonds Tyr123 (3.3 Å).
- **candidate_2** buries 18 PD-L1 residues with **12 of 20 (60%)** in the avelumab
  footprint. Its Glu29 forms a salt bridge to **Arg113** (3.8 Å), and Lys22
  bridges PD-L1 Asp61 (2.8 Å) while hydrogen bonding to it (3.1 Å).

Two independent seeds converging on Arg113 — a documented PD-1 contact and part of
the avelumab epitope — is a weak but real consistency signal: the hotspot
prescription, not chance, is steering the designs to the PD-1-competitive surface.
It is not evidence of binding.

## 6. Chemistry audit — residue identities and charge classes

The InteractionNet table flags any close nitrogen/oxygen pair as a "salt bridge"
without checking charge class, so every call was re-checked against the residue
names read directly from the coordinate file (`audit_chemistry.py`). Acidic side
chains (Asp, Glu) were required to face basic ones (Lys, Arg); His was treated as
a weak, partially protonated partner and not counted as a formal salt bridge.

**candidate_1 (seed111) — 10 reported rows:**

| Binder residue | PD-L1 residue | Distance | Charge classes | Verdict |
|---|---|---|---|---|
| Glu8 | Arg113 (B96) | 2.4 Å | acid vs base | salt bridge |
| Glu8 | Arg113 (B96) | 3.5 Å | acid vs base | salt bridge |
| Glu8 | Arg125 (B108) | 3.6 Å | acid vs base | salt bridge |
| Arg12 | Glu58 (B41) | 2.5 Å | base vs acid | salt bridge |
| Arg12 | Glu58 (B41) | 3.8 Å | base vs acid | salt bridge |
| Arg12 | Glu58 (B41) | 3.9 Å | base vs acid | salt bridge |
| Arg12 | Asp61 (B44) | 2.9 Å | base vs acid | salt bridge |
| Arg12 | Asp61 (B44) | 3.2 Å | base vs acid | salt bridge |
| Arg5 | Asp105 (B105) | 3.7 Å | base vs acid | salt bridge |
| His23 | Asp56 (B56) | 2.8 Å | weak vs acid | **not a salt bridge** (neutral partner) |

9 of 10 atom contacts are genuine opposite-charge salt bridges, collapsing to 4
distinct residue pairs (Glu8–Arg113 bidentate, Glu8–Arg125, Arg12–Glu58
tridentate, Arg12–Asp61 bidentate, Arg5–Asp105). The His23–Asp56 contact is a
polar contact, not a salt bridge, and is excluded from the count.

**candidate_2 (seed222) — 5 reported rows:** all five are charge-validated:
Glu29–Arg113 (3.8 Å), Glu29–Arg125 (3.7 and 3.8 Å), Lys22–Asp61 (2.8 and 4.0 Å,
plus a 3.1 Å H-bond). Three distinct acid–base pairs. No same-charge pair was
found in either candidate.

**Correction issued.** An earlier version of this report described candidate_1's
contact to Arg113 as coming from "Arg8". That was wrong: position 8 of the
candidate_1 sequence is **Glu** (`DAAARAAE...`, position 8 = E), verified in both
the raw task output and the MOS-sanitized copy. The interaction is
Glu8(acidic)–Arg113(basic), which is a legitimate salt bridge; the residue name in
the prose was mistaken, not the chemistry. Had position 8 actually been Arg, that
pair would have been same-charge and would **not** be a salt bridge — no such
pair exists in either design.

## 7. Ranking (supported: two candidates, measured quantities)

Ordered on hotspots engaged, then interface size, then binder pLDDT:

| Rank | Candidate | Basis |
|---|---|---|
| 1 | candidate_1 (seed111) | 6/6 hotspots ≤3.73 Å, largest interface (1833 Å²), highest binder pLDDT (65.9), 90% avelumab-footprint overlap |
| 2 | candidate_2 (seed222) | 5/6 hotspots (E58 at 4.72 Å, just outside cutoff), 1214 Å² interface, pLDDT 62.2 but a better top end (max 85.4), chemically distinct (Glu/Lys vs Ala/Arg), longer low-confidence regions |

This is a **structural-contact-based ranking**, not a confidence-ranked design
list: with no ipTM or interface energy, the ordering reflects how much of the
requested epitope each design physically covers, not how likely either is to bind.

## 8. Scientific quality — honest assessment

What the data support:

- Two de novo helical proteins, 73 and 66 aa, each burying 600-940 Å² per side on
  the requested PD-1/avelumab face and each making a salt bridge to Arg113.
- Epitope placement is the intended one, independently reproduced across seeds.

What the data do not support, and what limits these as candidates:

1. **Moderate binder confidence.** Mean pLDDT 65.9 and 62.2 is low for a designed
   protein; candidate_1 has no residue above 74, and candidate_2 is
   bimodal (27% ≥70, only 2% ≥80, min 38.2). Interfacial residues are not better
   resolved than the rest of each binder.
2. **No complex-level confidence.** Without ipTM/PAE the relative orientation is
   unvalidated. Per-chain pLDDT does not certify a pose.
3. **The hallucinated backbone barely contacts the target.** In both `output.cif`
   files the poly-Gly binder sits 5.98-9.07 Å (seed222) / 5.97-10.44 Å (seed111)
   from hotspot atoms, with only ~103 Å² of burial in the seed111 backbone. The
   interface appears only after sequence design and re-prediction — so it is the
   predictor's proposal, not a property the diffusion stage established.
4. **The pose moves between stages.** For seed111, superposing receptor chains,
   binder CA RMSD is 7.9 Å (max 14.3 Å) between backbone and predicted complex,
   while the receptor is reproduced at 2.46 Å.
5. **Low-complexity sequences.** candidate_1 is 45% Ala with an `RAAAA` repeat and
   2.52 bits of entropy; candidate_2 is 11% Ala but 21% Lys and 21% Glu (14 of each, net −3) at
   3.35 bits, and begins with an `MGS` remnant typical of a cloning artefact. Both raise
   expression, aggregation and immunogenicity questions that no in-silico pass
   answers.
6. **n = 2, one backbone per seed, no diversity screen, no experimental data.**

Realistic reading: these are computationally plausible epitope-targeted designs
worth expressing and testing, not validated binders.

## 9. Bundle map

```
README.md                        bundle guide and metric conventions
REPORT.md                        this document
input.json                       exact target, hotspot map, launch parameters
task_ids.json                    task IDs, seeds, shared payload
results.json                     machine-readable status + per-model metrics
metrics_summary.csv              one row per designed candidate
verification.txt                 16 target checks (all PASS)
sequences/designed_binders.fasta designed sequences only, type labelled
designs/seed111/raw/             exact unmodified task outputs
designs/seed111/analysis/        analyzer output + PPInterface tables
designs/seed111/bsa_shrake.txt   BSA cross-check
designs/seed222/...              same for seed222
target/                          exact target input, mapping, original 5GRJ
provenance/epitope_overlap.json  engaged vs avelumab-footprint residues
analyze_designs.py               analyzer (hotspots by sequence alignment)
bsa_shrake.py                    BSA fallback/cross-check
```
