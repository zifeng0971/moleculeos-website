# Run log

- 2026-10-22 Asia/Jakarta: MOS initially redirected to login; user completed login. No credentials recorded.
- New project created through Project Lists → Create Project → Submit. Project ID: `342947812647936`. No old project modified.
- Add New opened Create a Work (file import); closed without uploading.
- Input sequences checked: A 118 aa; B 128 aa; exact source retained.
- Submitted via UI at 2026-10-22T01:40:23.560Z.
- Download event API timed out after first file; file was saved by Chrome in Downloads. Continued by clicking each download control. Chrome appended numeric suffixes to confidence JSON filenames due to older files in Downloads. An initial local copy selected the unsuffixed files; timestamp audit caught this immediately. Those copies were replaced with the newly downloaded 2026-10-22 08:44 files before any analysis; download-receipts.json records exact paths, timestamps and hashes. No old results used in final data.

## Final status and deviations

- New MMFold task succeeded. Agent turns reported `Worked for 44s`, `Worked for 7s`, `Worked for 7m 34s` (454 s); only two follow-ups, both exactly `continue`. No steering/model/seed instruction was added.
- Task tool UI reports start `2026-10-22 01:40:55` and duration `2.0min`; task-list UI local time was `2026-10-22 8:40:55`. The rounded duration is retained as shown, not treated as an exact end timestamp.
- Final output: sample 1 selected; all five CIFs and confidence JSONs downloaded from this new project, with explicit download receipt hashes and timestamps. All five chain sequences independently verified.
- Agent did output interface residues: A uses standard PD-L1/UniProt numbering; B uses model indices from Q1. IMGT was used for CDR-region annotation, not the final residue position numbering.
- Agent independently looked up 5JDS after prediction submission, and downloaded reference coordinates after success for comparison. Prediction payload contains no template. Its intermediate statements are retained without correction in raw UI captures.
- Agent retries: original CIF import refused because `_mos_mapping` already existed; an initial sanitize command failed; agent stripped mapping metadata, sanitized a viewer-only copy and imported it successfully as work `342949239514112`. Original predicted CIFs retained untouched.
- Agent comparison retries included failed shell commands, reversed SASA subtraction returning empty sets, water/environment contamination, and an intermediate claim about multiple complexes. These are historical agent claims, not independently endorsed conclusions. Final answer and full command/results captures retained separately.
- Agent final epitope intentionally omits artificial A:Met1. Local physical 4.5 Å contacts retain it; local biology-only set is separately listed. Differences: agent-only A:47; B:27,110,117. See local-validation.md.
- Missing required capture: pre-submit screenshot. Multiple screenshot attempts timed out before submission; only pre-submit DOM text exists. The input screenshot was not recreated later.
- Missing required capture: exact start/end/duration of each individual step. UI exposes only total turn durations; raw CDP was unavailable while resolving a paused document response. All per-step exact timings are `unknown`; timestamped UI observations are retained separately.
- Initial native wide capture followed a different foreground window; that accidental capture was removed and not used. Later direct browser capture worked after viewport override. Verified running capture is 02-running-wide.jpg (1440 width); final capture is 03-final-reply-and-3d-1920.jpg (1920x1080). The initial native running capture is historical evidence only.
- The initial 1440 final screenshot clipped the right edge; the 1920x1080 final screenshot was visually verified. No screenshot pixels were edited.
- No website source code changed. No existing MOS project/task modified, deleted or cancelled. Manifest only receives case 00; existing entries/other values are preserved.

## Timestamped observations

- 2026-10-22T01:40:27.532Z — Working 2s
- 2026-10-22T01:40:30.829Z — Working 5s
- 2026-10-22T01:40:34.585Z — Working 8s
- 2026-10-22T01:40:46.512Z — Working 21s
- 2026-10-22T01:40:53.164Z — Working 27s
- 2026-10-22T01:41:11.300Z — Worked for 44s
- 2026-10-22T01:42:16.895Z — Worked for 44s
- 2026-10-22T01:42:30.333Z — Worked for 44s; Worked for 7s
- 2026-10-22T01:43:01.811Z — Worked for 44s; Worked for 7s
- 2026-10-22T01:43:06.044Z — Worked for 44s; Worked for 7s; Working 2s
- 2026-10-22T01:43:17.800Z — Worked for 44s; Worked for 7s; Working 14s
- 2026-10-22T01:45:10.793Z — Worked for 44s; Worked for 7s; Working 2m 7s
- 2026-10-22T01:45:29.253Z — Worked for 44s; Worked for 7s; Working 2m 25s
- 2026-10-22T01:45:58.888Z — Worked for 44s; Worked for 7s; Working 2m 55s
- 2026-10-22T01:46:25.074Z — Worked for 44s; Worked for 7s; Working 3m 21s
- 2026-10-22T01:47:01.910Z — Working 3m 58s
- 2026-10-22T01:48:08.435Z — Working 5m 4s
- 2026-10-22T01:48:51.795Z — Working 5m 47s
- 2026-10-22T01:49:34.176Z — Working 6m 30s
- 2026-10-22T01:49:53.175Z — Working 6m 49s
- 2026-10-22T01:50:22.962Z — Working 7m 18s
- 2026-10-22T01:50:50.670Z — Worked for 7m 34s

## Completion recheck 2026-10-22T03:09:15.051Z

Live task confirmed Succeed; final reply HTML unchanged. UI creation 08:40:55 and last update 08:42:57 Asia/Jakarta, a 122-second span (not asserted exact compute runtime). Supplemented salt-bridge raw atom-pair table and agent crystal contact files. Explained six atom-pair records versus one biological residue-pair salt bridge; added BSA protocol/inclusion limits. No new MOS message/task submitted; website code unchanged. See completion-recheck.md.
