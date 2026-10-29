# 04 — KN035 developability execution

- Operated MOS with Computer Use on 2026-10-20 in project `342254576038912`.
- Submitted structural fitness, sequence fitness, evolutionary fitness, binding affinity and sequence homology tasks. All five returned succeeded; IDs and exact payloads are in `raw/mos-export/case04_pkg/tasks/tasks.json`.
- Downloaded the 37-file ZIP through MOS Workspace; ZIP CRC verification passed. Raw output preserved unchanged.
- Isolated VHH structure: 127 modeled residues. Sequence tasks: 128-aa domain with one extra terminal serine; candidate sequences remain 128 aa.
- Screening protects CDRs, two disulfides and selected framework paratope residues. Structural scan allows 75 framework positions; excluded positions have zero-filled output and must not be treated as measured neutral effects.
- Seven curated single-mutant candidate sequences and four model score axes independently checked against the raw CSVs. The seven-mutant combined sequence is retained only in raw export, with no jointly simulated score.
- Independent audit: `../handoff/scripts/audit_developability.py`. It verifies all single substitutions, raw score agreement, theoretical pI and Met count, and original RCSB atom-site numbering.
- Numbering correction: exported Mocha narrative calls VHH domain+2 the original author position; that is label sequence numbering. Original RCSB 5JDS uses VHH author chain B and author residue equal to domain residue. Top-level `results.json` and `raw/verified-residue-mapping.json` carry the corrected mapping.
- S85N replaces NS with NN. The defined N[SGHT] motif count changes 1 to 0; this does not establish removal of all deamidation risk.
- M34L reduces theoretical methionine count 4 to 3; this does not establish measured oxidation stability.
- Solubility, aggregation, expression, Tm and humanness predictors were not available. Structural/sequence/evolutionary fitness scores are arbitrary model units; binding ddG is separately reported in kcal/mol.
- Composite ranking is a heuristic screening rule, not a native calibrated probability or percent improvement.

## 2026-10-20 GitLab 补充素材

用户指定的 DevelopabilityLiabilities main 已通过 Chrome 下载；观察 commit c3e7fe6fd067390af479479ccfb00d30a0b9c8ac。保留源码 ZIP 与29个源码文件，CRC 通过；从 AST 提取38条规则、12组，未执行下载代码。另生成 KN035 56条模式匹配，明确不属于 MOS 评分。详见 supplementary-risk-materials.md。
