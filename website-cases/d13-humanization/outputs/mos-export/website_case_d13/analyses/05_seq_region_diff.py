"""Region-wise sequence comparison between two Fv sequence sets using shared IMGT numbering."""
import json, sys, csv
sys.path.insert(0,"analyses")
from fv_compare import anarci, parse_numbering, region_of
def numbered(seq):
    return {x["pos"]:x["aa"] for x in parse_numbering(anarci(seq)) if x["aa"]!="-"}
def diff(ref, mob, ref_name, mob_name):
    out=[]
    for role in ["VH","VL"]:
        r=numbered(ref[role]); m=numbered(mob[role])
        for pos in sorted(set(r)|set(m), key=lambda p:(int(''.join(c for c in p if c.isdigit())), p)):
            ra=r.get(pos,"-"); ma=m.get(pos,"-")
            out.append({"role":role,"imgt_position":pos,"region":region_of(pos),
                        ref_name:ra, mob_name:ma, "changed":ra!=ma})
    return out
if __name__=="__main__":
    d=json.load(open("analyses/domains_meta.json"))
    parent={"VH":d["1FDL_2|Chain"]["imgt"]["domain_sequence"],"VL":d["1FDL_1|Chain"]["imgt"]["domain_sequence"]}
    ref={"VH":d["1BVL_1|Chains"]["imgt"]["domain_sequence"],"VL":d["1BVL_2|Chains"]["imgt"]["domain_sequence"]}
    rows=diff(parent,ref,"D13_parent","HuLys_1BVL")
    with open("analyses/seqdiff_parent_vs_1BVL.tsv","w",newline="") as f:
        w=csv.DictWriter(f,delimiter="\t",fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
    from collections import Counter
    c=Counter((r["role"],r["region"]) for r in rows if r["changed"])
    tot=Counter((r["role"],r["region"]) for r in rows)
    for k in sorted(tot): print(k, "changed",c[k],"of",tot[k], f"{100*c[k]/tot[k]:.0f}%")
    print("total changed:",sum(c.values()))
