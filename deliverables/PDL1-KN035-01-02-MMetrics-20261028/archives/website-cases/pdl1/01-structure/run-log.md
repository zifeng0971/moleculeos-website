# 01-structure execution log

- Date: 2026-10-20. Operator: Codex Computer Use in Chrome.
- Platform: https://mos.moleculemind.com/?projectId=342242986152960
- Task ID: `342253805564928`; final observed task status: **Succeed**.
- Exact submitted prompt, input and task detail snapshots are under `raw/`.
- Outputs were downloaded through the task UI. Completed files were copied into this case directory and parsed locally.
- Reference coordinates remain under `../sources/`; MOS prediction/score files remain under `raw/`.
- Derived analyses and plots: `../handoff/scripts/analyze_verified_outputs.py` (Biopython, NumPy, Matplotlib).
- Browser task time labels are retained verbatim in snapshots; their timezone is not assumed. Handoff generation uses Asia/Jakarta.
- Five mmCIF models and five summary confidence JSON files saved. Sample 1 is selected by highest platform ranking score.
- PAE is absent from the delivered output. Whole-complex C-alpha RMSD uses 242 matched modeled residues from 5JDS; a rigid least-squares fit over both chains.
- Atom-site B factors in predicted coordinates were exported as per-residue confidence proxies, retaining original scale and provenance.
