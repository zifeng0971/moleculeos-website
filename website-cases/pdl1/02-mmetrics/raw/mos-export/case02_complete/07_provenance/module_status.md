# Case 02 — Decode Molecular Intelligence: human PD-L1 + avelumab Fab (PDB 5GRJ)

Module-status report. Generated 2026-10-20T02:52:21Z from artifacts in this package.

## 1. What this report is, and what it is not

The MMetrics panel in the MOS viewer is backed by a platform autocompute job. In this project that job
(`autocompute-5GRJ`, task `342256189539328`, type `MOSTask`) was created automatically when the structure was
imported, and at inspection time it was still in **RUNNING** state with no retrievable artifacts. Project object
metadata (`ListMOSObjects`) exposes only `name`, `object_id`, `work_id` and `tos_key` — no MMetrics results, no
generated description, no metrics object. The panel states described in the request (*Generating description /
Analyzing structure / Model Computing*) match that unfinished job.

**Therefore no MMetrics UI module is claimed as completed in this package.** Every number below is either
experimental data from the deposited structure, a database record, a MOS task output launched in this project, or a
deterministic local analysis. Provenance is labelled per module and per artifact directory.

| Provenance tag | Meaning |
|---|---|
| `experimental` | measured coordinates/metadata from RCSB PDB 5GRJ |
| `database` | UniProt / PDB records fetched this session |
| `mos_prediction` | output of a MOS compute task (task IDs listed) |
| `builtin_analysis` | deterministic local tooling (ANARCI, InteractionNet, PPInterface, motif regex) |
| `derived` | combination of MOS predictions with structural context, computed here |

## 2. Module status summary

| # | Module | MMetrics UI | Delivered by | Status | Provenance |
|---|---|---|---|---|---|
| 1 | Overview / chain identity | unavailable | MOS object + CIF metadata + UniProt Q9NZQ7 | complete | experimental, database |
| 2 | Description text ("Generating description") | unavailable | not produced | not available | — |
| 3 | Top homologs + similarity | unavailable | 3 x Sequence Homology Search | complete | mos_prediction |
| 4 | VH/VL + IMGT/CDR annotation | unavailable | local ANARCI, IMGT scheme | complete | builtin_analysis |
| 5 | Sequence liability / risk sites | unavailable | local motif panel | complete | builtin_analysis |
| 6 | Antigen-antibody interactions | unavailable | InteractionNet + PPInterface | complete | builtin_analysis |
| 7 | Mutation scores | unavailable | 5 MOS scoring tasks | complete | mos_prediction |
| 8 | Recommended mutations | unavailable | synthesis of 7 + 4 + 5 + 6 | complete | derived |

## 3. Module details

### 3.1 Overview — chain identity (`experimental`, `database`)

5GRJ is a 3.206 Å X-ray structure of the human PD-L1 ectodomain bound by the
avelumab Fab (Cell Res. 2017,
PMID 27573173). MOS sanitization relabels chains A/B/C and reindexes each
entity from 1; author chains were H (heavy), L (light), A (antigen).

| MOS chain | Author | Entity | Molecule | Entity length | Modelled residues | UniProt span |
|---|---|---|---|---|---|---|
| A | H | 1 | avelumab VH | 120 | 118 | engineered antibody, no UniProt entry |
| B | L | 2 | avelumab VL (lambda) | 110 | 108 | engineered antibody, no UniProt entry |
| C | A | 3 | PD-L1 ectodomain | 221 | 213 | Q9NZQ7, residues 18-230 modelled (construct 18-238) |

PD-L1 numbering used throughout this package: `UniProt position = MOS residue + 17`, verified by global alignment of
the chain C entity sequence to Q9NZQ7 (`01_overview/chainC_Q9NZQ7_mapping.json`). UniProt DOMAIN features place the
Ig-like V-type domain at 19-127 and the Ig-like C2-type domain at 128-225; the deposited construct spans the whole
extracellular region (19-238) with eight C-terminal residues unmodelled.

The Fv contains two intradomain disulfides in the antibody (VH C22-C96, VL C22-C90, SG-SG 2.06/2.05 Å) and two in
PD-L1 (C23-C97, C138-C192; 2.05/2.07 Å, i.e. UniProt C40-C114 and C155-C209).

### 3.2 Description text — not available

The MMetrics "Generating description" step produced nothing retrievable. No substitute narrative is stored as a
machine-readable module; the biological interpretation lives in this report only, and is labelled as such.

### 3.3 Top homologs + similarity (`mos_prediction`)

Three Sequence Homology Search tasks (IDs 342256475304960 / 342256475644928 / 342256477762560) returned 500 unique
hits each. Full ranked tables: `02_homologs/*.csv`; raw JSON: `02_homologs/raw/`.

PD-L1 query — 500 unique hits, 42 entries at >=90% identity (all human PD-L1 structures
and the canonical entry), one ortholog at 77.8% (mouse PD-L1, 6SRU_A), the paralog PD-L2 at 42.8% (Q9BQ51), and 454
hits below 40% identity that are other immunoglobulin-superfamily proteins rather than PD-L1 orthologs. The
40% identity gap between PD-L2 and the background is the meaningful signal: within this database, avelumab's antigen
has no close paralog.

| Hit | Description | Identity | Alignment length | E-value | Bit score |
|---|---|---|---|---|---|
| pdb\|5JDR\|A | Chain A, Programmed cell death 1 ligand 1 [Homo sapiens] | 100.0% | 221 | 2.1e-167 | 463.766 |
| pdb\|3BIK\|A | Chain A, Programmed cell death 1 ligand 1 [Homo sapiens] | 100.0% | 221 | 1.7e-167 | 463.381 |
| sp\|Q9NZQ7.1\| | RecName: Full=Programmed cell death 1 ligand 1; Short=PD-L | 100.0% | 221 | 1.6e-166 | 463.381 |
| pdb\|35TL\|A | Chain A, Programmed cell death 1 ligand 1 [Homo sapiens] | 100.0% | 221 | 1.6e-166 | 463.381 |
| pdb\|5GRJ\|A | Chain A, Programmed cell death 1 ligand 1 [Homo sapiens] | 100.0% | 221 | 2.2e-167 | 462.996 |

Avelumab VH — 500 unique hits. Two entries are 100% identical: 4NKI_H (an independent avelumab
Fab structure) and 5GRJ_H itself; the next-nearest heavy chains sit at 84-88% identity, i.e. the same human VH3-23-like
family with different CDR-H3.

| Hit | Description | Identity | Alignment length | E-value | Bit score |
|---|---|---|---|---|---|
| pdb\|4NKI\|H | Chain H, Fab light chain [Homo sapiens] | 100.0% | 120 | 7.9e-85 | 249.98 |
| pdb\|5GRJ\|H | Chain H, avelumab H chain [Homo sapiens] | 100.0% | 120 | 1.4e-84 | 245.358 |
| pdb\|4OGX\|H | Chain H, DX-2930 HEAVY CHAIN [Homo sapiens] | 86.1% | 122 | 5.1e-69 | 209.92 |
| pdb\|7LSB\|B | Chain B, B1 Fab heavy chain [Homo sapiens] | 87.5% | 120 | 1.0e-68 | 208.764 |
| pdb\|6SS5\|HHH | Chain HHH, Fab C0020187 heavy chain (IgG1) [Homo sapiens] | 84.2% | 120 | 1.7e-67 | 206.068 |

Avelumab VL — 500 unique hits. 4NKI_L, 7K90_L and 8DCE_H are 100% identical; the nearest
non-identical lambda chains are 96-98% identical.

| Hit | Description | Identity | Alignment length | E-value | Bit score |
|---|---|---|---|---|---|
| pdb\|7K90\|L | Chain L, C144 Fab Light Chain [Homo sapiens] | 100.0% | 110 | 1.7e-74 | 223.016 |
| pdb\|4NKI\|L | Chain L, Fab heavy chain [Homo sapiens] | 100.0% | 110 | 2.7e-74 | 222.246 |
| pdb\|5GRJ\|L | Chain L, avelumab L chain [Homo sapiens] | 100.0% | 110 | 2.4e-75 | 221.09 |
| pdb\|8DCE\|H | Chain H, C144 scFv [Homo sapiens] | 100.0% | 110 | 7.6e-73 | 220.705 |
| pdb\|7L2D\|L | Chain L, 1-87 light chain [Homo sapiens] | 98.2% | 110 | 2.9e-72 | 217.238 |

### 3.4 VH/VL and IMGT/CDR annotation (`builtin_analysis`)

Numbering by ANARCI (IMGT scheme), per-residue table in `03_antibody_annotation/imgt_residue_mapping.csv`; every MOS
residue maps to an IMGT label, insertion code, region (FR1-4 / CDR1-3) and a modelled/unmodelled flag.

| Domain | CDR1-IMGT | CDR2-IMGT | CDR3-IMGT |
|---|---|---|---|
| VH (MOS 26-33, 51-58, 97-109) | GFTFSSYI | IYPSGGIT | ARIKLGTVTTVDY |
| VL (MOS 26-34, 52-54, 91-100) | SSDVGGYNY | DVS | SSYTSSSTRV |

The IMGT CDR-H3 as returned includes the conserved Ala-Arg at its N-terminus (positions 105-106); the paratope
analysis below treats residues by IMGT region, so this convention does not change any contact assignment.

Two caveats, stated rather than hidden: (i) ANARCI's best HMM hit for the VH is `alpaca_H` (E = 6.6e-65), an artefact
of the short, VHH-like CDR-H3 of a VH3-23 framework — the molecule is a conventional human Fab heavy chain, confirmed
by the 100% match to 4NKI_H; (ii) germline V/J gene assignment was not resolved because no IMGT germline database is
available in the sandbox, so no germline is claimed here.

### 3.5 Sequence liability / risk sites (`builtin_analysis`)

Motif panel (N-glycosylation N-X-S/T, Asn deamidation, Asp isomerization, Lys hydroxylation, Met/Trp oxidation,
cysteine inventory, acidic/basic clusters) applied to both entity sequences: 22 hits
(16 in VH, 6 in VL). No N-linked glycosylation sequon exists anywhere in the Fv.

| Chain | Motif | Match | MOS positions | In CDR |
|---|---|---|---|---|
| VH | Asn deamidation (NG/NS/NH/NT) | NS | 74-75 | no |
| VH | Asn deamidation (NG/NS/NH/NT) | NT | 77-78 | no |
| VH | Asn deamidation (NG/NS/NH/NT) | NS | 84-85 | no |
| VH | Asp isomerization (DG/DS/DH/DT/DD) | DT | 62-63 | no |
| VH | Asp isomerization (DG/DS/DH/DT/DD) | DT | 90-91 | no |
| VH | Lys hydroxylation (KG) | KG | 43-44 | no |
| VH | Lys hydroxylation (KG) | KG | 65-66 | no |
| VH | Met oxidation | M | 34-34 | no |
| VH | Met oxidation | M | 35-35 | no |
| VH | Met oxidation | M | 83-83 | no |
| VH | Trp oxidation | W | 36-36 | no |
| VH | Trp oxidation | W | 47-47 | no |
| VH | Trp oxidation | W | 110-110 | no |
| VH | Cysteine (disulfide/free-thiol context) | C | 22-22 | no |
| VH | Cysteine (disulfide/free-thiol context) | C | 96-96 | no |
| VH | Acidic cluster (DD/DE/ED/EE) | ED | 89-90 | no |
| VL | Asn deamidation (NG/NS/NH/NT) | NT | 71-72 | no |
| VL | Met oxidation | M | 49-49 | no |
| VL | Trp oxidation | W | 37-37 | no |
| VL | Cysteine (disulfide/free-thiol context) | C | 22-22 | no |
| VL | Cysteine (disulfide/free-thiol context) | C | 90-90 | no |
| VL | Acidic cluster (DD/DE/ED/EE) | ED | 83-84 | no |

None of these motifs falls inside a CDR, so the liabilities are developability risks (aggregation, chemical
heterogeneity on storage) rather than direct threats to the avelumab epitope. `04_liabilities/liability_sites.csv`
carries the same table with model scores attached at each site.

### 3.6 Antigen-antibody interactions (`builtin_analysis`)

PPInterface burial (per-pair tables in `05_interactions/if_*`) and InteractionNet contacts
(`05_interactions/contacts/`) on the MOS-sanitized structure:

| Interface | PD-L1 residues | Paratope residues | BSA PD-L1 side (Å²) | BSA antibody side (Å²) | Interface total (Å²) | H-bonds |
|---|---|---|---|---|---|---|
| PD-L1 – VH | 40 | 44 | 1125.9 | 1167.1 | 2293.0 | 12 |
| PD-L1 – VL | 13 | 12 | 333.2 | 324.2 | 657.4 | 2 |

The avelumab paratope is heavy-chain dominated: the VH interface buries 2293.0 Å² against
657.4 Å² for VL, a 3.5:1 ratio. Across both chains 45 PD-L1 residues
and 56 paratope residues contact, with 14 interface hydrogen bonds, two salt
bridges and five pi-stacks. The dominant buried contact is PD-L1 Asp44 (UniProt D61, 146.5 Å²),
which both VH and VL grip and which forms a salt bridge to VL Arg99 — the single PD-L1 acidic side chain that anchors
the light chain to the antigen.

CDR budget (buried area contributed per IMGT region):

| Region | VH residues | VH BSA (Å²) | VL residues | VL BSA (Å²) |
|---|---|---|---|---|
| CDR1-IMGT | 6 | 99.1 | 2 | 108.6 |
| CDR2-IMGT | 7 | 355.0 | 1 | 10.8 |
| CDR3-IMGT | 7 | 248.3 | 5 | 131.6 |
| Framework | 24 | 464.6 | 4 | 73.2 |

VH CDR2 is the single largest paratope element (355.0 Å² over
7 residues), ahead of CDR-H3; VH framework residues also contribute
464.6 Å², mostly
from FR3 Phe59 and the FR4 stretch 112-117 that packs against the PD-L1 IgC domain.

Top epitope residues on PD-L1:

| PD-L1 residue (MOS) | UniProt Q9NZQ7 | BSA (Å²) | H-bond | Contacts | Domain |
|---|---|---|---|---|---|
| ASP44 | 61 | 146.5 | yes | VH, VL | IgV (UniProt 19-127) |
| GLU43 | 60 | 82.0 | yes | VH, VL | IgV (UniProt 19-127) |
| LYS119 | 136 | 79.8 | no | VH | IgC (UniProt 128-225) |
| LYS58 | 75 | 68.8 | no | VH | IgV (UniProt 19-127) |
| ASN18 | 35 | 67.9 | no | VH, VL | IgV (UniProt 19-127) |
| GLN66 | 83 | 65.3 | no | VH | IgV (UniProt 19-127) |
| TYR39 | 56 | 63.9 | yes | VH | IgV (UniProt 19-127) |
| VAL59 | 76 | 60.3 | no | VH | IgV (UniProt 19-127) |
| ARG96 | 113 | 58.3 | yes | VH, VL | IgV (UniProt 19-127) |
| ARG65 | 82 | 55.3 | no | VH | IgV (UniProt 19-127) |

Of the epitope, 37 residues lie in the IgV domain (BSA
1215.4 Å²) and 8
in the IgC domain (BSA 243.5 Å²). The epitope spans
UniProt residues 32-156: it is
an IgV-face epitope with a tail extending onto the IgC domain, not a PD-1-mimetic focused on the IgV front sheet alone.

Top paratope residues:

| Chain | Residue (MOS) | IMGT | Region | BSA (Å²) |
|---|---|---|---|---|
| VH | ILE57 | 64 | CDR2-IMGT | 95.5 |
| VL | TYR34 | 38 | CDR1-IMGT | 79.1 |
| VH | GLY102 | 110 | CDR3-IMGT | 78.6 |
| VH | VAL104 | 112 | CDR3-IMGT | 74.5 |
| VH | PHE59 | 66 | FR3-IMGT | 64.3 |
| VH | GLN112 | 120 | FR4-IMGT | 64.1 |
| VH | SER31 | 36 | CDR1-IMGT | 63.1 |
| VH | GLY55 | 62 | CDR2-IMGT | 61.4 |
| VH | LYS76 | 84 | FR3-IMGT | 59.7 |
| VH | LEU115 | 123 | FR4-IMGT | 59.2 |

### 3.7 Mutation scores (`mos_prediction`)

Five MOS scoring tasks, all completed. 9020 unique substitutions carry sequence-fitness and
evolutionary scores, 8780 carry structural-stability scores, 8341 carry
complex binding-affinity ddG. Raw task CSVs are preserved in `06_mutations/raw_task_outputs/`; the merged table is
`06_mutations/all_scores_long.csv`.

| Axis | Task type | Mutations | Convention |
|---|---|---|---|
| Sequence fitness | Sequence Fitness Mutation Effect | 9020 | higher = more favourable |
| Evolutionary | Evolutionary Mutation Effect | 9020 | higher = more favourable |
| Structural stability | Structural Stability Mutation Effect | 8780 | higher = more favourable |
| Binding affinity | Binding Affinity Mutation Effect | 8341 | ddG, lower = more stabilising for the complex |

Sign conventions are not comparable across axes because the models differ; the package therefore stores raw values
plus within-chain percentile ranks (`seqfit_pct`, `evolve_pct`, `struct_pct`, `combined_pct` = mean of the three) so
that axes can be combined without pretending they share a scale. A sanity check that the conventions hold: every
cysteine in both chains sits in the bottom percentile band of all three tolerance axes, and the top-scoring positions
are the solvent-exposed CDR tips — exactly what a well-behaved substitution model should report.

### 3.8 Recommended mutations (`derived`)

Three categories, each with an explicit selection rule. Percentiles are within-chain.

**(a) Developability / stability** — all three tolerance axes in the top 3% (`combined_pct >= 0.97`), outside the
paratope (<5 Å² buried), no cysteine involved:

| Mutation | Chain | Combined percentile | Sequence fitness | Evolutionary | Structural | Paratope BSA | Region | Plain-language reason |
|---|---|---|---|---|---|---|---|---|
| M49I | VL | 0.979 | 1.83 | -1.60 | 3.23 | 0.0 | FR2-IMGT | removes the VL Met49 oxidation site while all three axes favour the change |
| M49L | VL | 0.978 | 2.63 | -2.22 | 3.31 | 0.0 | FR2-IMGT | removes the VL Met49 oxidation site; isosteric Leu keeps the framework hydrophobic packing |
| T63A | VH | 0.977 | 2.59 | 1.09 | 1.10 | 0.0 | FR3-IMGT | silences the Asp62-Thr63 isomerization motif in VH framework 3 |
| T63S | VH | 0.975 | 4.84 | 6.40 | 0.26 | 0.0 | FR3-IMGT | silences the Asp62-Thr63 isomerization motif; highest sequence-fitness gain of the set |
| H41R | VL | 0.975 | 4.62 | -2.52 | 1.55 | 0.0 | FR2-IMGT | framework-2 charge change favoured by all three axes |
| N62D | VL | 0.973 | 2.91 | -1.74 | 0.89 | 0.0 | FR3-IMGT | framework-3 substitution favoured by all three axes |

The two VL Met49 replacements remove a Met oxidation site while the structural axis actively favours the change
(+3.2). The VH Thr63 replacements address a different problem: Thr63 is the residue that completes the Asp62-Thr63
isomerisation motif, so mutating it removes the liability at a position that the sequence and evolutionary axes rate
at the 98% percentile.
That is a rare case where a developability fix is not paid for with stability.

**(b) Affinity maturation (antibody side)** — predicted ddG <= -1.0 kcal/mol with sequence-fitness percentile >= 0.75
and structural percentile >= 0.35:

| Mutation | Chain | Predicted ddG (kcal/mol) | Paratope BSA (Å²) | Sequence-fitness pct | Structural pct | Region |
|---|---|---|---|---|---|---|
| V104W | VH | -1.88 | 74.5 | 0.8704 | 0.404 | CDR3-IMGT |
| T103Y | VH | -1.81 | 23.2 | 0.8595 | 0.7944 | CDR3-IMGT |
| T103W | VH | -1.75 | 23.2 | 0.8174 | 0.5608 | CDR3-IMGT |
| I33Y | VH | -1.73 | 6.0 | 0.9942 | 0.4383 | CDR1-IMGT |
| T105W | VH | -1.68 | 13.8 | 0.8162 | 0.3501 | CDR3-IMGT |
| K100Y | VH | -1.68 | 0.5 | 0.9617 | 0.3637 | CDR3-IMGT |
| V104Y | VH | -1.49 | 74.5 | 0.9646 | 0.5019 | CDR3-IMGT |
| I99W | VH | -1.44 | 0.0 | 0.8799 | 0.3858 | CDR3-IMGT |

These concentrate in CDR-H3 (103, 104, 105) and CDR-H1 (33) — the paratope hotspots identified independently by burial
analysis — but most of them enlarge side chains at already-buried positions, so they are hypothesis-generating rather
than validated improvements. The strong internal cross-check runs the other way: the mutations the affinity model
calls most damaging (VL Y34A, VH Y52A, VL Y93A, VH F59A; ddG +1.9 to +2.3 kcal/mol) are precisely the residues with
the largest paratope buried surface. Two independent methods agreeing on which side chains matter is the most
trustworthy signal in this section.

**(c) Liability mitigation** — best-scoring substitution at each deamidation / isomerisation / hydroxylation site:

| Chain | Liability site | Motif | Proposed change | Combined percentile | Paratope BSA | Region |
|---|---|---|---|---|---|---|
| VH | N74 | NS | N74T | 0.743 | 0.0 | FR3-IMGT |
| VH | N77 | NT | N77S | 0.826 | 12.7 | FR3-IMGT |
| VH | N84 | NS | N84S | 0.879 | 0.0 | FR3-IMGT |
| VH | D62 | DT | D62E | 0.806 | 0.0 | FR3-IMGT |
| VH | D90 | DT | D90E | 0.457 | 0.0 | FR3-IMGT |
| VH | K43 | KG | K43R | 0.830 | 0.0 | FR2-IMGT |
| VH | K65 | KG | K65Q | 0.805 | 0.7 | FR3-IMGT |
| VL | N71 | NT | N71S | 0.920 | 0.0 | FR3-IMGT |

Every candidate here comes with a cost: the evolutionary axis is negative for all of them, because these framework
asparagines and aspartates are conserved across antibody families. The honest reading is that liability removal in
avelumab's framework is a trade of some naturalness for chemical robustness, and the table lets that trade be made
explicitly rather than by assumption.

## 4. Task ledger

| Task ID | Name | Type | Status | Purpose |
|---|---|---|---|---|
| 342256189539328 | autocompute-5GRJ | MOSTask (platform autocompute / MMetrics backend) | running | auto-triggered by structure import; no outputs retrievable |
| 342256475304960 | 5GRJ_PDL1_homologs | Sequence Homology Search | succeeded | homologs of PD-L1 chain C |
| 342256475644928 | 5GRJ_VH_homologs | Sequence Homology Search | succeeded | homologs of avelumab VH |
| 342256477762560 | 5GRJ_VL_homologs | Sequence Homology Search | succeeded | homologs of avelumab VL |
| 342256486130688 | 5GRJ_VH_seqfitness | Sequence Fitness Mutation Effect | succeeded | VH deep sequence-model mutation scan |
| 342256488231936 | 5GRJ_VL_seqfitness | Sequence Fitness Mutation Effect | succeeded | VL deep sequence-model mutation scan |
| 342256491451392 | 5GRJ_PDL1_seqfitness | Sequence Fitness Mutation Effect | succeeded | PD-L1 deep sequence-model mutation scan |
| 342256499057664 | 5GRJ_VH_evolve | Evolutionary Mutation Effect | succeeded | VH MSA conservation/covariance scan |
| 342256501269504 | 5GRJ_VL_evolve | Evolutionary Mutation Effect | succeeded | VL MSA conservation/covariance scan |
| 342256504251392 | 5GRJ_PDL1_evolve | Evolutionary Mutation Effect | succeeded | PD-L1 MSA conservation/covariance scan |
| 342256515642368 | 5GRJ_complex_structstab | Structural Stability Mutation Effect | succeeded | reverse-folding scan on the 3-chain complex |
| 342256515908608 | 5GRJ_complex_affinity | Binding Affinity Mutation Effect | succeeded | ddG scan on the VH/VL/PD-L1 complex |

`autocompute-5GRJ` is the platform-side MMetrics job; the remaining eleven are the tasks launched explicitly for this
case. Machine-readable ledger: `07_provenance/task_manifest.json`.

## 5. Limitations

- No MMetrics UI output could be retrieved; every module above is a substitute built from supported tasks or local
  geometry. If the autocompute job completes later, its outputs should supersede this reconstruction, not be merged
  with it.
- Homology hits come from a fixed sequence database bundled with the MOS task; absence of a hit is not evidence of
  absence in nature. The 500-hit cap truncated all three searches.
- Interface energetics are geometric (burial, contacts); no experimental affinity or mutational scan exists in this
  package to calibrate the ddG predictions.
- Scores are model outputs on a 3.2 Å structure whose PD-L1 chain has 8 unmodelled C-terminal residues; the scoring
  tasks used the sequence/structure exactly as deposited.
- No claim is made that any recommended mutation improves avelumab as a drug; all recommendations are computational
  hypotheses requiring experimental validation.
