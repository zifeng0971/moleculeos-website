# MOS agent transcript — case 00

Project `342947812647936`; task `342948473701376`.

The text below is captured from the real UI, without correcting the agent. Raw rendered HTML/text, tool inputs/results, and observation timestamps are in `raw/`. Exact per-step start/end times are **unknown**: the UI exposes total turn time, and the network capture failed. Observation timestamps must not be treated as backend execution timestamps.

## Turn 1: Worked for 44s

| Order | UI step title | Start (s) | End (s) | Duration (s) |
| --- | --- | --- | --- | --- |
| 1 | Thinking | unknown | unknown | unknown |
| 2 | Execution details 2 items | unknown | unknown | unknown |
| 3 | Thinking | unknown | unknown | unknown |
| 4 | File operations | unknown | unknown | unknown |
| 5 | Thinking | unknown | unknown | unknown |
| 6 | Run commands 2 items | unknown | unknown | unknown |
| 7 | Thinking | unknown | unknown | unknown |
| 8 | Run commands | unknown | unknown | unknown |
| 9 | Thinking | unknown | unknown | unknown |
| 10 | Tool calls 2 items | unknown | unknown | unknown |
| 11 | Thinking | unknown | unknown | unknown |
| 12 | Run commands | unknown | unknown | unknown |
| 13 | Thinking | unknown | unknown | unknown |
| 14 | Tool calls | unknown | unknown | unknown |
| 15 | Thinking | unknown | unknown | unknown |
| 16 | Search sources | unknown | unknown | unknown |
| 17 | Thinking | unknown | unknown | unknown |
| 18 | Tool calls | unknown | unknown | unknown |
| 19 | Thinking | unknown | unknown | unknown |

### Agent reply (verbatim)

The complex prediction is running on MMFold (task `PDL1_KN035_complex`, ID 342948473701376).


**What went into the prediction**



- **Chain A** — human PD-L1 IgV domain. Verified against UniProt Q9NZQ7: identical to residues 19–134, with an N-terminal “MA” cloning tag and a C-terminal PY→LE change in the flexible tail. 118 residues, the domain that carries the PD-1/antibody binding face.
- **Chain B** — KN035 (envafolimab) VHH, 128 residues, single immunoglobulin domain with the hallmark long CDR3.
- 1:1 stoichiometry, no ligands, default sampling seeds.


**Reference point for cross-checking the prediction**


The experimental structure of exactly this complex exists — PDB 5JDS (Zhang et al., *Cell Discovery* 2017, 1.7 Å) — so the predicted interface can be validated rather than taken on trust. That crystal structure shows KN035 docking onto the front β-sheet of PD-L1 (C, C′, F, G strands), engaging almost exclusively through CDR3 plus a minor CDR1 contribution, and it buries five PD-L1 hotspot residues that are also shared with the PD-1 site: **Ile54, Tyr56, Glu58, Gln66, Arg113** (UniProt numbering). I will map the predicted interface onto that set and report agreement or divergence.


I’ll pick this up when the prediction lands: download the model, compute the interface (contacts, buried surface area, salt bridges/H-bonds), and report the epitope on PD-L1 and the paratope on KN035 — with chain-A residue numbers converted back to standard PD-L1 numbering so they are directly comparable to the literature. Let me know when you’d like me to continue.

## Turn 2: Worked for 7s

User follow-up (verbatim): `continue`

| Order | UI step title | Start (s) | End (s) | Duration (s) |
| --- | --- | --- | --- | --- |
| 1 | Thinking | unknown | unknown | unknown |
| 2 | Tool calls | unknown | unknown | unknown |
| 3 | Thinking | unknown | unknown | unknown |
| 4 | Execution details 2 items | unknown | unknown | unknown |
| 5 | Thinking | unknown | unknown | unknown |
| 6 | Run commands | unknown | unknown | unknown |

### Agent reply (verbatim)

The analysis toolchain is ready (InteractionNet and PPInterface both resolve), and the prediction is still in progress (1.4 min elapsed). MMFold has no auto-download step — once the model is ready I’ll pull the output files, register the complex in MOS, then run contact/interface analysis (buried surface area, H-bonds, salt bridges) on the A:B pair and map chain-A positions back to standard PD-L1 numbering.


I’ll stop here rather than poll — send “continue” again and I’ll check the task.

## Turn 3: Worked for 7m 34s

User follow-up (verbatim): `continue`

| Order | UI step title | Start (s) | End (s) | Duration (s) |
| --- | --- | --- | --- | --- |
| 1 | Tool calls | unknown | unknown | unknown |
| 2 | Thinking | unknown | unknown | unknown |
| 3 | Tool calls | unknown | unknown | unknown |
| 4 | Thinking | unknown | unknown | unknown |
| 5 | Run commands | unknown | unknown | unknown |
| 6 | Thinking | unknown | unknown | unknown |
| 7 | Run commands | unknown | unknown | unknown |
| 8 | Thinking | unknown | unknown | unknown |
| 9 | Run commands | unknown | unknown | unknown |
| 10 | Thinking | unknown | unknown | unknown |
| 11 | Run commands 2 items | unknown | unknown | unknown |
| 12 | Thinking | unknown | unknown | unknown |
| 13 | Run commands | unknown | unknown | unknown |
| 14 | Thinking | unknown | unknown | unknown |
| 15 | Run commands | unknown | unknown | unknown |
| 16 | Thinking | unknown | unknown | unknown |
| 17 | 3D Viewer | unknown | unknown | unknown |
| 18 | Thinking | unknown | unknown | unknown |
| 19 | Tool calls | unknown | unknown | unknown |
| 20 | Thinking | unknown | unknown | unknown |
| 21 | Run commands | unknown | unknown | unknown |
| 22 | Thinking | unknown | unknown | unknown |
| 23 | Run commands | unknown | unknown | unknown |
| 24 | Thinking | unknown | unknown | unknown |
| 25 | Run commands | unknown | unknown | unknown |
| 26 | Thinking | unknown | unknown | unknown |
| 27 | Run commands | unknown | unknown | unknown |
| 28 | Thinking | unknown | unknown | unknown |
| 29 | 3D Viewer | unknown | unknown | unknown |
| 30 | Thinking | unknown | unknown | unknown |
| 31 | 3D Viewer | unknown | unknown | unknown |
| 32 | Thinking | unknown | unknown | unknown |
| 33 | 3D Viewer 4 items | unknown | unknown | unknown |
| 34 | Thinking | unknown | unknown | unknown |
| 35 | Run commands 2 items | unknown | unknown | unknown |
| 36 | Thinking | unknown | unknown | unknown |
| 37 | Run commands | unknown | unknown | unknown |
| 38 | Thinking | unknown | unknown | unknown |
| 39 | Run commands | unknown | unknown | unknown |
| 40 | Thinking | unknown | unknown | unknown |
| 41 | Run commands | unknown | unknown | unknown |
| 42 | Thinking | unknown | unknown | unknown |
| 43 | Run commands | unknown | unknown | unknown |
| 44 | Thinking | unknown | unknown | unknown |
| 45 | Run commands | unknown | unknown | unknown |
| 46 | Thinking | unknown | unknown | unknown |
| 47 | Run commands | unknown | unknown | unknown |
| 48 | Thinking | unknown | unknown | unknown |
| 49 | Run commands | unknown | unknown | unknown |
| 50 | Thinking | unknown | unknown | unknown |
| 51 | Run commands | unknown | unknown | unknown |
| 52 | Thinking | unknown | unknown | unknown |
| 53 | Run commands | unknown | unknown | unknown |
| 54 | Thinking | unknown | unknown | unknown |
| 55 | Run commands | unknown | unknown | unknown |
| 56 | Thinking | unknown | unknown | unknown |
| 57 | Run commands | unknown | unknown | unknown |
| 58 | Thinking | unknown | unknown | unknown |
| 59 | Run commands | unknown | unknown | unknown |
| 60 | Thinking | unknown | unknown | unknown |
| 61 | Run commands | unknown | unknown | unknown |
| 62 | Thinking | unknown | unknown | unknown |
| 63 | Run commands | unknown | unknown | unknown |
| 64 | Thinking | unknown | unknown | unknown |
| 65 | Run commands | unknown | unknown | unknown |
| 66 | Thinking | unknown | unknown | unknown |
| 67 | Run commands | unknown | unknown | unknown |
| 68 | Thinking | unknown | unknown | unknown |
| 69 | Run commands | unknown | unknown | unknown |
| 70 | Thinking | unknown | unknown | unknown |
| 71 | Run commands | unknown | unknown | unknown |
| 72 | Thinking | unknown | unknown | unknown |
| 73 | Run commands | unknown | unknown | unknown |
| 74 | Thinking | unknown | unknown | unknown |
| 75 | Run commands | unknown | unknown | unknown |
| 76 | Thinking | unknown | unknown | unknown |
| 77 | Run commands | unknown | unknown | unknown |
| 78 | Thinking | unknown | unknown | unknown |
| 79 | Run commands | unknown | unknown | unknown |
| 80 | Thinking | unknown | unknown | unknown |
| 81 | 3D Viewer 3 items | unknown | unknown | unknown |
| 82 | File operations | unknown | unknown | unknown |
| 83 | Thinking | unknown | unknown | unknown |

### Agent reply (verbatim)

The complex is predicted and the interface is defined. Here is what came out.


## The model


MMFold produced five samples; only one converged on an assembled complex — interface ipTM 0.925, pTM 0.941, mean pLDDT 93.7. The other four scored ipTM ~0.33, meaning they docked the nanobody in four mutually inconsistent, low-confidence ways. Everything below is from that single converged model, which is now loaded in the viewer with the interface colored (orange, PD-L1; green, KN035) and the hotspot patch annotated.


The two partners form one interface, burying **1419 Å² total** (699 Å² on PD-L1, 721 Å² on KN035) — a compact, antibody-typical paratope–epitope footprint, with 13 hydrogen bonds, one salt bridge, and one aromatic stacking contact.


## What KN035 grips on PD-L1


The nanobody lands on the front β-sheet of the PD-L1 IgV domain, and the footprint is built from three separate patches that its CDR3 spans. In standard PD-L1 numbering, the residues in contact are:


**Strand C and the C–C′ loop** — Ile54, Tyr56, Glu58, Asp61, Asn63 — this is the heart of the epitope. Asp61 alone buries 104 Å², the single largest contribution on PD-L1, and it is pinned by three separate contacts to the nanobody (Ser29 OG, Ser30 OG, and the Arg32 backbone amide).


**The C′–D region** — Gln66, Val68, His69, Asp73, Val76 — a secondary anchor, with Gln66 donating two hydrogen bonds into the CDR3 backbone and accepting one.


**The F–G edge** — Arg113, Met115, Ser117, Gly119, Gly120, Ala121, Asp122, Tyr123, Arg125 — the C-terminal end of the footprint, where Arg113 and Arg125 make the electrostatic contacts (Arg113–Asp99 is the only true salt bridge, 2.4 Å; Arg125–Gln116, 2.4 Å).


The single most important chemical feature is the **aromatic stacking of PD-L1 Tyr56 against KN035 Phe101** (ring centroids 5.2 Å apart, tilted 83° — an edge-to-face arrangement). Tyr56 also hydrogen bonds to both the Glu102 backbone nitrogen and Ser100 hydroxyl, so it is engaged by stacking and by two polar contacts at once.


## How KN035 grips back


The paratope is overwhelmingly CDR3, exactly as expected for this nanobody: **Asp99 through Tyr117** (16 of the 21 interface residues). The N-terminal half of CDR3 — Asp99, Ser100, Phe101, Glu102, Asp103, Pro104, Thr105 — carries the polar and stacking contacts, while the C-terminal half (Leu108, Val109, Thr110, Ser111, Gly113, Ala114, Phe115, Gln116, Tyr117) contributes mostly hydrophobic burial. A minor CDR1 contribution comes from Lys27, Ser29, Ser30, and Arg32, with framework residue Glu44 at the CDR1 base also touching the interface. CDR2 makes no contact at all.


## Does the prediction hold up?


A crystal structure of this exact complex exists (PDB 5JDS, 1.7 Å), so I recomputed its interface with an identical protein-only protocol and compared directly:



- **Epitope: 18 of 19 crystal residues reproduced.** The model misses only Glu60 (a 9 Å² marginal contact) and adds Val76.
- **Paratope: 18 of 18 crystal residues reproduced.** The model adds Glu44, Thr110, Tyr117 as peripheral contacts.
- **The hydrogen-bond network is nearly bond-for-bond identical**: Asp61–Ser30, Glu58–Ser100, Gln66–Asp103, Arg113–Asp99, Arg113–Ser100, Arg125–Gln116, Tyr56–Glu102 all appear in both.
- All five published hotspot residues that KN035 depends on — **Ile54, Tyr56, Glu58, Gln66, Arg113** — are present in the predicted interface with the correct chemistry.


Two caveats worth stating plainly. First, the construct you supplied carries an N-terminal **MA tag**, and the artificial Met1 accounts for 42 Å² of the apparent interface, forming a spurious salt bridge to Glu44 of the nanobody; I excluded it from the epitope above, but it is a real artifact of the model, not PD-L1 biology. Second, this is a single converged prediction, and the peripheral contacts (Val76, Glu44, Thr110, Tyr117) are the parts most likely to differ in reality.


The functional readout is that the epitope overlaps the PD-1 binding site — Ile54, Tyr56, Glu58, Gln66 and Arg113 are shared with PD-1 — which is why KN035 blocks the checkpoint interaction by direct steric competition rather than allostery.


Full measurements are saved in `/workspace/analysis/interface_results.md`.

