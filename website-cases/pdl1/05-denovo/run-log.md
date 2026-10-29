# 05 — De Novo PD-L1 Binder execution

- Computer Use project: https://mos.moleculemind.com/?projectId=342254460007424
- Target prepared from 5GRJ human PD-L1 author chain A, 213 modeled extracellular residues. Antibody chains and non-protein records excluded. Missing segments were not rebuilt.
- Hotspots: original auth I54/Y56/E58/V68/R113/Y123 → sanitized A37/A39/A41/A51/A96/A106.
- Protein Binder Design parameters: contigs `A1-213/0 60-100`, compare_binder 1, diffusion_steps 50. Three seeds 111/222/333. Exact payloads and task IDs are in the Workspace export.
- Tasks 342254837666816 and 342254839784448 succeeded and produced both output.cif (poly-Gly backbone) and aligned.cif (designed sequence plus re-predicted complex).
- Task 342254842782720 initially remained Running, then the task UI updated to Succeed (UI update time 2026-10-20 09:51:33). Both raw outputs were downloaded directly through the task detail panel into `raw/direct-task-exports/seed333/raw/`. All three primary design tasks succeeded. Earlier two-candidate snapshots/ZIPs are retained as historical records only; canonical `results.json` includes all three.
- ZIP downloaded through Workspace; CRC checked. Raw exports retain their original names and contents.
- Independent review: `../handoff/scripts/audit_denovo.py` extracts actual binder sequences, verifies target sequence against 5GRJ, recomputes six hotspot distances, contact residue pairs, ionic residue pairs and sequence composition, and calculates solvent-accessible burial using BioPython Shrake-Rupley (probe 1.4 A, 200 points).
- Canonical confidence field is **binder CA-mean pLDDT**, derived from aligned.cif CA B factors. Mocha also supplied an all-atom mean; these different averaging methods must not be mixed. No pTM/ipTM/PAE or predicted binding energy was delivered.
- Chemistry correction: seed111 binder position 8 is **Glu**, not Arg. Its potential ionic contact is Glu8–PD-L1 Arg113 (output chain B96). Same-charge contacts must not be called salt bridges. Canonical local pair count uses acidic/basic charged atoms within 4 A and differs from raw atom-contact counts.
- Poly-Gly intermediate B factors 0/1 are placeholders and not confidence scores.
- Binder CA-mean pLDDT: seed111 68.71, seed222 65.76, seed333 82.60. Sequences include composition bias; geometric hotspot coverage does not demonstrate experimental binding or biological competition. Seed333 is the highest-confidence binder by this averaging method, with two interchain residue pairs closer than 2 A that require relaxation/review.
- No extra websites or frontend components were developed.
