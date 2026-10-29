# Independent local geometry validation

This file is local analysis of the newly downloaded selected sample, not MOS agent output.

A-chain C-alpha RMSD to 5JDS: **1.304227 Å**, using 115 identical sequence-matched C-alpha pairs, no outlier rejection. Predicted A positions 2–116 correspond to reference author chain A (label chain B), author positions 18–132. Reference label chain A is KN035; it must not be fitted as PD-L1.

KN035 C-alpha RMSD after the same PD-L1 fit: 1.013931 Å over 127 pairs.

4.5 Å heavy-atom contact residues, original prediction label_seq_id:

- A: 1, 38, 40, 42, 45, 50, 52, 53, 57, 60, 97, 99, 101, 103, 104, 105, 106, 107, 109
- B: 29, 30, 32, 44, 99, 100, 101, 102, 103, 104, 105, 108, 109, 111, 113, 114, 115, 116

Agent final epitope A has 19 residues in UniProt numbering; mapping to original model indices gives 38, 40, 42, 45, 47, 50, 52, 53, 57, 60, 97, 99, 101, 103, 104, 105, 106, 107, 109. Agent B has 21 model-index residues.

| Chain | Agent only | Local only | Shared |
| --- | --- | --- | --- |
| A | 47 | 1 | 18 |
| B | 27, 110, 117 | none | 18 |

A:1 (Met1) is the artificial terminal contact explicitly excluded by the agent. Removing that artifact leaves 18 biological A contacts locally, all within the agent list; agent-only A:47 is Asn63 in UniProt numbering. Agent-only B positions are Lys27, Thr110, Tyr117. Their closest heavy-atom distances are:

- A:N47: 4.981567 Å
- B:K27: 5.003188 Å
- B:T110: 5.416936 Å
- B:Y117: 4.777855 Å

These are different operational interface definitions (surface burial versus distance), not fields to silently overwrite. Raw coordinates were not changed for the local fit or contact calculation.
