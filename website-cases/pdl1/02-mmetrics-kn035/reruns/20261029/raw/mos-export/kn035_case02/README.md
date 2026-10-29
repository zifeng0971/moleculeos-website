# KN035 / PD-L1 case 02 - provenance and raw-output package

Single object: **MMFold_1.cif** (object_id `345488780645376`, work_id `345488784675840`).
No structure was re-predicted; 5GRJ / 7XYQ / 5JDS were never downloaded or used as a model; no other project or task was touched.

## 1. Object and hashes

- TOS key: `user_objects/123/330665428816896/345488780645376_MMFold_1.cif`
- Declared original SHA256: `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`
- Sanitized copy served by GetMOSObject: identical bytes (same SHA256, 154131 bytes) - **raw hash == sanitized hash** for this import.
- Chains: A = 118 aa (human PD-L1 IgV construct), B = 128 aa (KN035 VHH). No light chain, no HETATM, no altlocs, 1 model.

## 2. Numbering

- MOS did **not** renumber: `label_seq_id` = `auth_seq_id` = MOS residue index = 1..N on both chains, no insertion codes.
- The MOS<->MMFold_1 map is the identity function; all 246 residues are listed individually in `numbering-map.json`.
- The `mutstr` column of `affinity_scores.csv` is `<wt><chain><pos><mut>` - the chain letter is the **second** character (`AA105C` = A105->C; `EB6A` = B6->A). Decoded with this grammar, all 4674 rows match the structure with zero conflicts (2242 on chain A, 2432 on chain B = 118x19 + 128x19).

## 3. Native MMetrics record (task `345489060729856`, SUCCEED)

- Classification: **antigen-antibody**, confidence **high**
- Description: Crystal structure of human PD-L1 (programmed death ligand 1) in complex with a VHH nanobody at 1.7 Å resolution. PD-L1 is an immune checkpoint protein expressed on various cells that interacts with PD-1 and plays a role in immune regulation. The nanobody binds the PD-L1 extracellular region, making this complex useful for understanding PD-L1 recognition by single-domain antibodies. No non-solvent small-molecule ligand interaction is indicated.
- Reasoning: The structure contains a single protein antigen chain (entity 1, likely PD-L1) bound to a VHH nanobody chain (entity 2), as indicated by the PDB title, antibody fragment annotation, antibody chains, antigen chains, and a valid interface with 51 contacts. This is a direct antigen-antibody complex, not an enzyme, receptor-ligand signalling complex, nucleic acid complex, or simple monomer.
- Homology (`annotations.homology`): 3 PDB hits - 5JDS_B identity 1.00 (e-value 2.1e-92), 4DKA_A 0.721, 4DK3_A 0.721. These are the pipeline's own reference hits and were not used for any analysis.
- `annotations.uniprot`: **empty array**, preserved as produced.

### CDR definitions reported by the native pipeline (chain B, VHH)

- IMGT: H-CDR1 26-33; H-CDR2 51-58; H-CDR3 97-117
- Kabat: H-CDR1 31-35; H-CDR2 50-66; H-CDR3 99-117
- Chothia: H-CDR1 26-32; H-CDR2 52-57; H-CDR3 99-117

### Paratope (chain B, structural)

18 residues: Lys27, Ser29, Ser30, Arg32, Asp99, Ser100, Phe101, Glu102, Asp103, Pro104, Thr105, Leu108, Val109, Ser111, Gly113, Ala114, Phe115, Gln116
(the contact residue list of the same record holds 17 chain-B residues; paratope minus contacted set = [27])

### Epitope (chain A, structural)

19 residues: Ile38, Tyr40, Glu42, Asp45, Asn47, Gln50, Val52, His53, Asp57, Val60, Arg97, Met99, Ser101, Gly103, Gly104, Ala105, Asp106, Tyr107, Arg109
(the contact residue list holds 16 chain-A residues; epitope minus contacted set = [47, 53, 101])

### Interface

- `interactions.2d_plot_data[0]`: protein-protein A:B, `n_contacts` 44, 16 residues on A and 17 on B.
- Contact metrics: 9 H-bonds, 33 van der Waals, 1 ionic, 1 pi-stacking, 0 disulfide.

### Not produced by the MMetrics run

- `model_tasks.results` = `[]`: no MutX CSV, no AbAn / AbScN / ParaDt heavy CSV was generated, therefore no compact numbering map for such files exists or could be produced.
- No domain annotation and no PTM annotation appear anywhere in the record.
- No graph/network file for the interaction network; only the 2D plot data block.
- Recorded as **not produced** - deliberately not filled in with the auto-compute fitness CSVs, which belong to a different task and different models.

### Internal inconsistencies of the native record (left unmodified)

- Homology entries are tagged `entity_id: 1` although their aligned sequence is chain B (the VHH).
- `reasoning` says "51 contacts"; `meta.n_contacts` and the contact list both say 44.
- `annotations.pdb` lists 5JDS/4DKA/4DK3 - reference hits only, never opened.

## 4. Native auto-compute results (task `345488784917504`, SUCCEED)

Seven files in `raw/autocompute_345488784917504/`, verbatim:

| file | rows | content |
|---|---|---|
| affinity_scores.csv | 4674 | mos-diffaffinity: ddG_pred, score_ddg, rank |
| evolutionary_scores.csv | 4920 | per-mutation evolutionary fitness |
| sequence_scores.csv | 4920 | per-mutation sequence fitness |
| struct_fitness_scores.csv | 4920 | per-mutation structure fitness |
| similarity_results.json | - | mos-blast, 500 homolog rows |
| all_sequences.fasta | - | 500 homolog sequences |
| sequence_info.fasta | - | chain-role call: heavy_sequence = chain B, light_sequence = None |

The three fitness tables contain 4920 = 246 x 20 rows: all 20 substitutions per position **including the wild type** (246 self-rows), unlike affinity_scores.csv which holds only the 19 non-native substitutions.

The child task payload references producer-side filenames (`diffaffinity_scores.csv`, `msat_scores.csv`, `blast_results.json`, `esm_scores.csv`, `proteinmpnn_scores.csv`) that differ from the delivered filenames. That mapping is not evidenced in any returned artifact and is recorded as unresolved rather than guessed.

## 5. Files

```
kn035_case02/
  input/MMFold_1.cif                       byte-identical to the registered object
  raw/autocompute_345488784917504/         7 native auto-compute outputs
  raw/mmetrics_345489060729856/record.json native MMetrics record
  payload/*.payload.json                   exact input payloads of both tasks
  numbering-map.json                       246-residue MOS<->MMFold_1 map + token grammar
  provenance.json                          object ids, hashes, verification evidence
  task-ledger.json                         task ids, status, outputs, what is missing
  build_metadata.py                        script that regenerates the three JSON files
```
