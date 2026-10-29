# Raw API returns — provenance

Two kinds of files live here and in `native_tasks/<task_id>/`.

1. **`native_tasks/<task_id>/check_mosttask_response.json`**
   Field-for-field record of the `CheckMOSTask` response for that id:
   `status`, `task_name`, `type`, `task_id`, `started`, `duration`, the
   `input_parameters` object exactly as the platform echoed it, and the list of
   files the call downloaded.

   The *sequence fields are not retyped*: they are written from
   `analyses/5XG0_chainC_seq.fasta` (WT scans) and `analyses/representatives.fasta`
   (the three MMFold jobs), and each record carries
   `sequence_verification.length` and `sequence_verification.sha256` so the text
   can be checked against those FASTA files byte for byte. Lengths: 268 for the
   WT scans, 261 for each candidate.

   Nothing was redacted: no response contained credentials, tokens or secrets.
   The only identifiers present are MOS task IDs and TOS object keys, which are
   required to reproduce the runs.

2. **`all_check_mosttask_responses.json`**
   The same records merged into one index.

3. **`list_most_tasks_at_final_check.txt`**
   Verbatim text of the final `ListMOSTasks` snapshot (names, types, statuses,
   IDs, start times, durations). Board-level view only — it carries no payloads.

4. **`mmetrics_*_record.json`** and **`_native_mmetrics_5XG0_chainC/`**
   Native MMetrics (`mmetrics-analysis-*`) records and one example artifact
   (`mos-score-esm@esm_scores.csv`, object 342337533756416), downloaded only to
   prove the native results are retrievable. They are **not** used in any
   analysis in this case — MMetrics collection is the user's own step.

Fields the platform did not echo are listed explicitly under
`payload_fields_not_exposed` in each record (e.g. the MMFold `modelSeeds`
default and the Protein Redesign sampling temperature/seed). They are marked as
not exposed rather than guessed.
