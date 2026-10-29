# 03-affinity execution log

- Date: 2026-10-20. Operator: Codex Computer Use in Chrome.
- Platform: https://mos.moleculemind.com/?projectId=342242986152960
- Task ID: `342254431249408`; final observed task status: **Succeed**.
- Exact submitted prompt, input and task detail snapshots are under `raw/`.
- Outputs were downloaded through the task UI. Completed files were copied into this case directory and parsed locally.
- Reference coordinates remain under `../sources/`; MOS prediction/score files remain under `raw/`.
- Derived analyses and plots: `../handoff/scripts/analyze_verified_outputs.py` (Biopython, NumPy, Matplotlib).
- Browser task time labels are retained verbatim in snapshots; their timezone is not assumed. Handoff generation uses Asia/Jakarta.
- Raw CSV has 6,213 substitutions: 2,356 binder, 3,857 antigen. All WT letters were checked against deposited entity sequences.
- CSV numbering is label/entity sequence numbering. Binder B18 corresponds to original author B13.
- Direct task-input download returned a 42-byte JSON response instead of coordinates; preserved as `raw/input-download-error.txt`. Exact valid input was recovered through the MOS Workspace ZIP.
- Raw CSV from task download matches the independent Workspace export by SHA-256.
- Candidate sequences are single-mutant hypotheses; mutant structures and absolute Kd were not produced.

## Additional variant structures

- Two separate MMFold jobs for Q18Y (task 342259574002688) and V17I (task 342259585696768) both Succeeded. Each generated five predicted complexes and five confidence JSONs.
- Target sequence is unchanged 207-aa 7XYQ entity sequence; binder is a single mutant of the 124-aa original. Every atom-coordinate residue in all ten models matches the expected input sequence.
- Downloaded 35-file ZIP through Workspace; CRC passed. Best samples selected by platform ranking_score; Q18Y ipTM 0.8214, V17I ipTM 0.7760.
- These are structure predictions, not new binding-energy predictions or experimental validation.
