#!/usr/bin/env python3
"""Emit README.md from the preserved raw record (no hand-typed residue lists)."""
import json

ROOT = "/workspace/kn035_case02"
d = json.load(open(f"{ROOT}/raw/mmetrics_345489060729856/record.json"))
it = d["interactions"]["2d_plot_data"][0]
feats = d["annotations"]["features"]
par = [f for f in feats if f["annotation_type"] == "paratope"][0]["loc"]
epi = [f for f in feats if f["annotation_type"] == "epitope"][0]["loc"]
cdrs = {}
for f in feats:
    if f["annotation_type"] == "cdr":
        cdrs.setdefault(f["annotation_source"], []).append(f["range"][0])
m = it["metrics"]
seqA = d["protein_metadata"]["entities"][0]["sequence"]
seqB = d["protein_metadata"]["entities"][1]["sequence"]
A3 = {
    "A": "Ala", "R": "Arg", "N": "Asn", "D": "Asp", "C": "Cys", "Q": "Gln", "E": "Glu",
    "G": "Gly", "H": "His", "I": "Ile", "L": "Leu", "K": "Lys", "M": "Met", "F": "Phe",
    "P": "Pro", "S": "Ser", "T": "Thr", "W": "Trp", "Y": "Tyr", "V": "Val",
}


def name_map(seq):
    return {i + 1: A3[aa] for i, aa in enumerate(seq)}


a_res = name_map(seqA)
b_res = name_map(seqB)


def fmt(res, seq, nums):
    return ", ".join(f"{res[n].title()}{n}" for n in sorted(nums) if n in res)


lines = []
w = lines.append
w("# KN035 / PD-L1 case 02 - provenance and raw-output package\n")
w("Single object: **MMFold_1.cif** (object_id `345488780645376`, work_id `345488784675840`).")
w("No structure was re-predicted; 5GRJ / 7XYQ / 5JDS were never downloaded or used as a model; no other project or task was touched.\n")
w("## 1. Object and hashes\n")
w(f"- TOS key: `user_objects/123/330665428816896/345488780645376_MMFold_1.cif`")
w(f"- Declared original SHA256: `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`")
w(f"- Sanitized copy served by GetMOSObject: identical bytes (same SHA256, 154131 bytes) - **raw hash == sanitized hash** for this import.")
w(f"- Chains: A = {len(seqA)} aa (human PD-L1 IgV construct), B = {len(seqB)} aa (KN035 VHH). No light chain, no HETATM, no altlocs, 1 model.\n")
w("## 2. Numbering\n")
w("- MOS did **not** renumber: `label_seq_id` = `auth_seq_id` = MOS residue index = 1..N on both chains, no insertion codes.")
w("- The MOS<->MMFold_1 map is the identity function; all 246 residues are listed individually in `numbering-map.json`.")
w("- The `mutstr` column of `affinity_scores.csv` is `<wt><chain><pos><mut>` - the chain letter is the **second** character "
  "(`AA105C` = A105->C; `EB6A` = B6->A). Decoded with this grammar, all 4674 rows match the structure with zero conflicts "
  "(2242 on chain A, 2432 on chain B = 118x19 + 128x19).\n")
w("## 3. Native MMetrics record (task `345489060729856`, SUCCEED)\n")
c = d["classification"]
w(f"- Classification: **{c['class']}**, confidence **{c['confidence']}**")
w(f"- Description: {c['description']}")
w(f"- Reasoning: {c['reasoning']}")
w("- Homology (`annotations.homology`): 3 PDB hits - 5JDS_B identity 1.00 (e-value 2.1e-92), 4DKA_A 0.721, 4DK3_A 0.721. "
  "These are the pipeline's own reference hits and were not used for any analysis.")
w("- `annotations.uniprot`: **empty array**, preserved as produced.\n")
w("### CDR definitions reported by the native pipeline (chain B, VHH)\n")
for src, rngs in cdrs.items():
    w(f"- {src}: " + "; ".join(f"H-CDR{i+1} {a}-{b}" for i, (a, b) in enumerate(sorted(rngs))))
w("\n### Paratope (chain B, structural)\n")
w(f"{len(par)} residues: {fmt(b_res, seqB, par)}")
w(
    f"(the contact residue list of the same record holds {len(it['residues_b'])} chain-B residues; "
    f"paratope minus contacted set = {sorted(set(par) - set(r['number'] for r in it['residues_b']))})\n"
)
w("### Epitope (chain A, structural)\n")
w(f"{len(epi)} residues: {fmt(a_res, seqA, epi)}")
w(
    f"(the contact residue list holds {len(it['residues_a'])} chain-A residues; "
    f"epitope minus contacted set = {sorted(set(epi) - set(r['number'] for r in it['residues_a']))})\n"
)
w("### Interface\n")
w(f"- `interactions.2d_plot_data[0]`: protein-protein A:B, `n_contacts` {it['meta']['n_contacts']}, "
  f"{len(it['residues_a'])} residues on A and {len(it['residues_b'])} on B.")
w(f"- Contact metrics: {m['hbond_count']} H-bonds, {m['vdw_count']} van der Waals, {m['ionic_count']} ionic, "
  f"{m['pipistack_count']} pi-stacking, {m['ssbond_count']} disulfide.\n")
w("### Not produced by the MMetrics run\n")
w("- `model_tasks.results` = `[]`: no MutX CSV, no AbAn / AbScN / ParaDt heavy CSV was generated, therefore no compact "
  "numbering map for such files exists or could be produced.")
w("- No domain annotation and no PTM annotation appear anywhere in the record.")
w("- No graph/network file for the interaction network; only the 2D plot data block.")
w("- Recorded as **not produced** - deliberately not filled in with the auto-compute fitness CSVs, which belong to a different "
  "task and different models.\n")
w("### Internal inconsistencies of the native record (left unmodified)\n")
w("- Homology entries are tagged `entity_id: 1` although their aligned sequence is chain B (the VHH).")
w("- `reasoning` says \"51 contacts\"; `meta.n_contacts` and the contact list both say 44.")
w("- `annotations.pdb` lists 5JDS/4DKA/4DK3 - reference hits only, never opened.\n")
w("## 4. Native auto-compute results (task `345488784917504`, SUCCEED)\n")
w("Seven files in `raw/autocompute_345488784917504/`, verbatim:\n")
w("| file | rows | content |")
w("|---|---|---|")
w("| affinity_scores.csv | 4674 | mos-diffaffinity: ddG_pred, score_ddg, rank |")
w("| evolutionary_scores.csv | 4920 | per-mutation evolutionary fitness |")
w("| sequence_scores.csv | 4920 | per-mutation sequence fitness |")
w("| struct_fitness_scores.csv | 4920 | per-mutation structure fitness |")
w("| similarity_results.json | - | mos-blast, 500 homolog rows |")
w("| all_sequences.fasta | - | 500 homolog sequences |")
w("| sequence_info.fasta | - | chain-role call: heavy_sequence = chain B, light_sequence = None |")
w("")
w("The three fitness tables contain 4920 = 246 x 20 rows: all 20 substitutions per position **including the wild type** "
  "(246 self-rows), unlike affinity_scores.csv which holds only the 19 non-native substitutions.\n")
w("The child task payload references producer-side filenames (`diffaffinity_scores.csv`, `msat_scores.csv`, "
  "`blast_results.json`, `esm_scores.csv`, `proteinmpnn_scores.csv`) that differ from the delivered filenames. That mapping "
  "is not evidenced in any returned artifact and is recorded as unresolved rather than guessed.\n")
w("## 5. Files\n")
w("```")
w("kn035_case02/")
w("  input/MMFold_1.cif                       byte-identical to the registered object")
w("  raw/autocompute_345488784917504/         7 native auto-compute outputs")
w("  raw/mmetrics_345489060729856/record.json native MMetrics record")
w("  payload/*.payload.json                   exact input payloads of both tasks")
w("  numbering-map.json                       246-residue MOS<->MMFold_1 map + token grammar")
w("  provenance.json                          object ids, hashes, verification evidence")
w("  task-ledger.json                         task ids, status, outputs, what is missing")
w("  build_metadata.py                        script that regenerates the three JSON files")
w("```")
open(f"{ROOT}/README.md", "w").write("\n".join(lines) + "\n")
print("README.md written", len(lines), "lines")
