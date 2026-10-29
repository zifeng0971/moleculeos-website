#!/usr/bin/env python
"""Parse MOS Sequence Homology Search outputs into ranked homolog tables (CSV + JSON)."""
import json, csv, os, re, sys, glob

DOWN = "/workspace/downloads"
OUT = "/workspace/case02/analysis/homology"
os.makedirs(OUT, exist_ok=True)

TASKS = {
    "PD-L1": ("sequence_homology_search_342256475304960", "5GRJ_PDL1_homologs", "342256475304960"),
    "VH":    ("sequence_homology_search_342256475644928", "5GRJ_VH_homologs", "342256475644928"),
    "VL":    ("sequence_homology_search_342256477762560", "5GRJ_VL_homologs", "342256477762560"),
}

summary = {}
for label, (folder, task_name, task_id) in TASKS.items():
    path = os.path.join(DOWN, folder, "similarity_results.json")
    if not os.path.exists(path):
        summary[label] = {"status": "missing", "path": path}
        continue
    d = json.load(open(path))
    hits = d["data"]
    rows = []
    for h in hits:
        aln_len = len(h.get("midline") or "")
        ident = int(h.get("identity") or 0)
        rows.append({
            "hit_id": h.get("hit_id"),
            "hit_db": h.get("hit_db"),
            "description": (h.get("hit_desc") or "").split(" >")[0][:160],
            "hit_len": h.get("hit_len"),
            "alignment_length": aln_len,
            "identical_residues": ident,
            "identity_percent_derived": round(100.0 * ident / aln_len, 1) if aln_len else None,
            "identity_percent_reported": h.get("identity_percentage"),
            "positives": h.get("positive"),
            "gaps": h.get("gaps"),
            "e_value": h.get("e_value"),
            "bit_score": h.get("bit_score"),
            "query_coverage_percent": round(100.0 * (h.get("query_to", 0) - h.get("query_from", 0) + 1)
                                            / (h.get("query_to", 0) or 1), 1) if h.get("query_to") else None,
            "query_from": h.get("query_from"), "query_to": h.get("query_to"),
            "web_link": (h.get("links") or {}).get("web_link"),
        })
    rows.sort(key=lambda r: -(r["bit_score"] or 0))
    # de-duplicate by hit_id keeping best HSP
    seen, uniq = set(), []
    for r in rows:
        if r["hit_id"] in seen:
            continue
        seen.add(r["hit_id"]); uniq.append(r)
    with open(os.path.join(OUT, f"{label}_homologs.csv"), "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=list(uniq[0].keys()))
        w.writeheader(); w.writerows(uniq)
    summary[label] = {
        "task_name": task_name, "task_id": task_id,
        "raw_file": path, "n_raw_hits": len(hits), "n_unique_hits": len(uniq),
        "general": d.get("general"),
        "top20": uniq[:20],
        "query_coverage_of_top_hits": [r["query_coverage_percent"] for r in uniq[:10]],
    }

json.dump(summary, open(os.path.join(OUT, "homology_summary.json"), "w"), indent=2)
for label, s in summary.items():
    print(f"== {label}: {s.get('n_unique_hits')} unique hits")
    for r in s.get("top20", [])[:10]:
        print(f"   {r['hit_id']:<18} {str(r['identity_percent_derived']):>5}% id  len {r['alignment_length']:>4}  "
              f"E={r['e_value']:.1e}  bits={r['bit_score']}  {r['description'][:70]}")
