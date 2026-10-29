# Completion recheck

Live MOS rechecked at 2026-10-22T03:09:15.051Z. Same project `342947812647936`, same task `342948473701376`; no new task or agent message submitted.

## Completion evidence

- Task UI: **Succeed**.
- Creation Time: **2026-10-22 08:40:55**, Asia/Jakarta.
- Update Time: **2026-10-22 08:42:57**, Asia/Jakarta.
- Creation-to-last-update span: **122 seconds**. This is not asserted to be the exact compute runtime or an exact timestamp for any agent step.
- The final reply's rendered HTML matches the previous capture exactly; no Stop button is present. There is no later final response to append.
- Workspace analysis directory still has 17 direct items; MMFold output directory still has the five CIFs and five confidence JSONs.

## Additional raw records saved

`raw/agent-analysis/interface-salt_bridge.tsv` and `crystal-{hbond,ionic,pistack,residues}.tsv`, `crystal-summary.md` were downloaded from this project's Workspace. Sources/timestamps/hashes are in `raw/recheck-download-receipts.json`. Crystal files are **MOS agent's post-hoc reference analysis**, not prediction inputs or local recomputation.

## Useful interpretation of the completed output

| Item | Captured value | Provenance / interpretation |
| --- | --- | --- |
| Predicted buried surface area | A 698.6 + B 720.5 = 1419.1 Å² | MOS PPInterface output; includes artificial Met1 |
| Hydrogen-bond records | 13 | MOS interface H-bond table |
| Raw salt-bridge atom pairs | 6 | Two Met1–Glu44 atom pairs plus four Arg97–Asp99 atom pairs |
| Distinct salt-bridge residue pairs | 2 including tag; 1 excluding tag | Counted from MOS raw table; explains final reply's one biological salt bridge |
| Biological salt bridge | PD-L1 Arg113 / model A:97 – KN035 B:Asp99 | Four atom-pair distances 2.4–3.7 Å; one residue pair |
| Aromatic stacking | PD-L1 Tyr56 / model A:40 – KN035 B:Phe101 | Ring-centroid distance 5.166 Å, angle 83.30°, MOS contact table |
| Crystal agreement claimed by agent | Epitope 18/19; paratope 18/18 | Retained as agent output, not independently validated here |

## Display limits

- The agent calls its prediction/reference comparison an identical protein-only protocol. Raw commands show prediction BSA from PPInterface and crystal BSA from Shrake–Rupley (960 points). A uniform independent BSA recalculation has not been performed, so that wording should not be promoted to a locally verified claim.
- Use “one sample has high ipTM” for the score result; the confidence scores alone do not prove five-model geometric convergence or quantify mutual pose inconsistency.
- Agent final biological epitope excludes artificial Met1, while the total BSA includes that residue. Preserve both conventions.
- Missing pre-submit screenshot and exact per-step timing remain missing. A later completed state cannot reconstruct them.
