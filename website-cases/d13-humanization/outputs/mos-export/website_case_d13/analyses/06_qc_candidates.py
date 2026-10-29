import json, csv, sys
sys.path.insert(0,"analyses")
from fv_compare import anarci, parse_numbering, region_of
from Bio import SeqIO
recs={}
for r in SeqIO.parse("native_tasks/humanization/result.fasta","fasta"):
    h,l=r.description.split(":") if False else (None,None)
    h,l=str(r.seq).split(":")
    recs[r.id]={"VH":h,"VL":l}
print("n candidates",len(recs))
parent={"VH":"QVQLKESGPGLVAPSQSLSITCTVSGFSLTGYGVNWVRQPPGKGLEWLGMIWGDGNTDYNSALKSRLSISKDNSKSQVFLKMNSLHTDDTARYYCARERDYRLDYWGQGTTLTVSS",
        "VL":"DIQMTQSPASLSASVGETVTITCRASGNIHNYLAWYQQKQGKSPQLLVYYTTTLADGVPSRFSGSGSGTQYSLKINSLQPEDFGSYYCQHFWSTPRTFGGGTKLEIK"}
def num(seq):
    d={}
    for x in parse_numbering(anarci(seq)):
        if x["aa"]!="-": d[x["pos"]]=x["aa"]
    return d
pd={r:num(parent[r]) for r in parent}
print("parent VH len",len(parent["VH"]),"VL len",len(parent["VL"]),"IMGT positions",len(pd["VH"]),len(pd["VL"]))
qc={}
for cid,v in recs.items():
    qc[cid]={"VH_len":len(v["VH"]),"VL_len":len(v["VL"]),"cdr":{},"frameworks_same_len":True}
    for role in ["VH","VL"]:
        d=num(v[role])
        qc[cid][f"{role}_imgt_positions"]=len(d)
        for reg in ["CDR1","CDR2","CDR3"]:
            seg="".join(d[p] for p in sorted(d,key=lambda x:int(''.join(c for c in x if c.isdigit()))) if region_of(p)==reg)
            pseg="".join(pd[role][p] for p in sorted(pd[role],key=lambda x:int(''.join(c for c in x if c.isdigit()))) if region_of(p)==reg)
            qc[cid]["cdr"][f"{role}_{reg}"]={"cand":seg,"parent":pseg,"same":seg==pseg}
json.dump(qc,open("analyses/candidate_qc.json","w"),indent=1)
for cid in recs:
    q=qc[cid]
    same=sum(1 for k,x in q["cdr"].items() if x["same"])
    print(cid, q["VH_len"],q["VL_len"], "IMGTpos",q["VH_imgt_positions"],q["VL_imgt_positions"], f"CDRs unchanged {same}/6",
          [ (k,x["cand"]) for k,x in q["cdr"].items() if not x["same"]])
