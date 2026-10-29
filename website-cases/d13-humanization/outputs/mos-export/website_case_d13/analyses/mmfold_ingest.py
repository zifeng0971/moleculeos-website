"""Ingest MMFold output for one candidate: keep raw files, verify chain identity against the
submitted payload, and record per-sample confidence + sequence check in a manifest."""
import json, glob, os, sys, hashlib
import gemmi
from Bio import SeqIO
CASE="/workspace/website_case_d13"
def ingest(cid):
    d=f"{CASE}/native_tasks/mmfold/{cid}"
    files=sorted(glob.glob(f"{d}/*model_sample_*.cif"))
    confs={}
    for f in glob.glob(f"{d}/summary_confidences_*.json"):
        s=os.path.basename(f).replace("summary_confidences_","").replace(".json","").replace("sample_","")
        confs[s]=json.load(open(f))
    payload=json.load(open(f"{CASE}/native_tasks/mmfold_payloads/{cid}.json"))
    want={s["protein"]["id"]:s["protein"]["sequence"] for s in payload["sequences"]}
    samples=[]
    for f in files:
        s=os.path.basename(f).split("_sample_")[1].replace(".cif","")
        st=gemmi.read_structure(f); st.setup_entities()
        got={ch.name:"".join(gemmi.find_tabulated_residue(r.name).one_letter_code for r in ch.get_polymer()) for ch in st[0]}
        ok=all(got.get(k)==v for k,v in want.items())
        c=confs.get(s,{})
        samples.append({"sample":int(s),"file":os.path.basename(f),"chains":{k:len(v) for k,v in got.items()},
                        "sequence_matches_payload":ok,"plddt":c.get("plddt"),"ptm":c.get("ptm"),
                        "iptm":c.get("iptm"),"ranking_score":c.get("ranking_score"),
                        "chain_plddt":c.get("chain_plddt")})
    samples.sort(key=lambda x:x["sample"])
    best=max(samples,key=lambda x:x["ranking_score"] or 0) if samples else None
    man={"candidate":cid,"n_samples":len(samples),"samples":samples,
         "best_sample":best["sample"] if best else None,
         "best_by":"highest ranking_score in summary_confidences",
         "chain_roles":{"A":"VH","B":"VL"}}
    json.dump(man,open(f"{d}/manifest.json","w"),indent=1)
    return man
if __name__=="__main__":
    for cid in sys.argv[1:]:
        m=ingest(cid)
        print(cid, m["n_samples"], "best",m["best_sample"],
              "all_seq_ok", all(s["sequence_matches_payload"] for s in m["samples"]),
              "plddt_best", [s["plddt"] for s in m["samples"] if s["sample"]==m["best_sample"]])
