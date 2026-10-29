import json, csv, re
A="/workspace/website_case_d13/analyses"
raw=json.load(open(f"{A}/anarci_raw.json"))
SCHEMES=["imgt","kabat","chothia"]
CDR_DEF={
 "imgt":{"FR1":(1,26),"CDR1":(27,38),"FR2":(39,55),"CDR2":(56,65),"FR3":(66,104),"CDR3":(105,117),"FR4":(118,128)},
 "kabat_H":{"FR1":(1,30),"CDR1":(31,"35B"),"FR2":(36,49),"CDR2":(50,65),"FR3":(66,94),"CDR3":(95,102),"FR4":(103,113)},
 "kabat_K":{"FR1":(1,23),"CDR1":(24,34),"FR2":(35,49),"CDR2":(50,56),"FR3":(57,88),"CDR3":(89,97),"FR4":(98,107)},
 "chothia_H":{"FR1":(1,25),"CDR1":(26,32),"FR2":(33,51),"CDR2":(52,56),"FR3":(57,94),"CDR3":(95,102),"FR4":(103,113)},
 "chothia_K":{"FR1":(1,23),"CDR1":(24,34),"FR2":(35,49),"CDR2":(50,56),"FR3":(57,88),"CDR3":(89,97),"FR4":(98,107)},
}
def defs(scheme, ct):
    key=f"{scheme}_{ct}"
    return CDR_DEF[key] if key in CDR_DEF else CDR_DEF[scheme]

def cmp_pos(num,ins,lo,hi):
    """compare numbering position (num,ins) with boundary"""
    def key(num,ins):
        return (num, ins if ins else "")
    if isinstance(lo,int): lo=(lo,"")
    else:
        m=re.match(r"(\d+)([A-Za-z]?)",lo); lo=(int(m.group(1)),m.group(2))
    if isinstance(hi,int): hi=(hi,"\uffff")
    else:
        m=re.match(r"(\d+)([A-Za-z]?)",hi); hi=(int(m.group(1)),m.group(2)+"\uffff" if m.group(2) else "\uffff")
    k=key(num,ins or "")
    return lo<=k<=hi

def region_of(scheme,ct,num,ins):
    d=defs(scheme,ct)
    for reg in ["FR1","CDR1","FR2","CDR2","FR3","CDR3","FR4"]:
        lo,hi=d[reg]
        if cmp_pos(num,ins,lo,hi): return reg
    return "OUTSIDE"

LINE=re.compile(r"^(\S+)\s+(\d+)([A-Za-z]?)\s+(?:([A-Za-z])\s+)?([A-Za-z-])\s*$")
def parse(txt):
    recs=[];hdr={}
    for line in txt.splitlines():
        if line.startswith("#"):
            continue
        m=LINE.match(line)
        if not m: continue
        tag,num,ins,ins2,aa=m.group(1),int(m.group(2)),m.group(3) or "",m.group(4) or "",m.group(5)
        ins=ins or ins2
        recs.append((tag,num,ins,aa))
    return recs

rows=[];domains={}
for tag in raw:
    domains[tag]={}
    for sc in SCHEMES:
        txt=raw[tag][sc]["stdout"]
        L=txt.splitlines()
        species=ct=vg=jg=None
        for i,line in enumerate(L):
            if "chain_type|e-value" in line or ("chain_type" in line and line.startswith("#|")):
                f=L[i+1].strip("#| ").split("|"); species,ct=f[0],f[1]
            if line.startswith("#|") and "v_gene" in line:
                f=L[i+1].strip("#| ").split("|"); vg,jg=f[1],f[3]
        recs=parse(txt)
        if ct is None or not recs:
            domains[tag][sc]={"chain_type":None,"species":species,"v_gene":None,"j_gene":None,
                              "domain_sequence":"","domain_length":0,"n_numbered_positions":0,
                              "note":"no immunoglobulin domain detected by ANARCI (non-Ig chain or below threshold)"}
            continue
        seq="".join(a for _,_,_,a in recs if a!="-")
        domains[tag][sc]={"chain_type":ct,"species":species,"v_gene":vg,"j_gene":jg,
                          "domain_sequence":seq,"domain_length":len(seq),"n_numbered_positions":len(recs)}
        idx=0
        for _,num,ins,aa in recs:
            if aa=="-":
                rows.append([tag,sc,ct,vg,jg,num,ins or "-","-","-","-",region_of(sc,ct,num,ins)])
            else:
                idx+=1
                rows.append([tag,sc,ct,vg,jg,num,ins or "-",aa,idx,region_of(sc,ct,num,ins)])
with open(f"{A}/numbering_all_schemes.tsv","w",newline="") as f:
    w=csv.writer(f,delimiter="\t"); w.writerow(["fasta_id","scheme","chain_type","v_gene","j_gene","pos","insertion","aa","domain_index_1based","region"]); w.writerows(rows)
json.dump(domains,open(f"{A}/domains_meta.json","w"),indent=1)
for k,v in domains.items():
    print(k, {s:(v[s]["chain_type"],v[s]["domain_length"],v[s]["v_gene"]) for s in SCHEMES})
