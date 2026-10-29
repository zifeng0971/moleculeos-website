import csv, json, collections
A="analyses"
# IMGT mapping for 1FDL V domains: label number == domain index (V starts at 1)
num={}
for r in csv.DictReader(open(f"{A}/numbering_all_schemes.tsv"),delimiter="\t"):
    if r["scheme"]!="imgt": continue
    if r["fasta_id"]=="1FDL_1|Chain" and r["chain_type"]=="K": ch="A"
    elif r["fasta_id"]=="1FDL_2|Chain" and r["chain_type"]=="H": ch="B"
    else: continue
    if r["aa"]=="-": continue
    num[(ch,int(r["domain_index_1based"]))]=(r["pos"]+r["insertion"].replace("-",""),r["region"])
# interface residues
bsa={}
for r in csv.DictReader(open(f"{A}/interface_1FDL/residues.tsv"),delimiter="\t"):
    bsa[(r["chain"],int(r["res_num"]))]=float(r["bsa"])
# contacts per type (heterogeneous column layouts)
COLS={"ionic":("positive_chain","positive_pos","negative_chain","negative_pos"),
      "pistack":("pi1_chain","pi1_pos","pi2_chain","pi2_pos"),
      "pication":("pi_chain","pi_pos","cation_chain","cation_pos"),
      "pihbond":("pi_chain","pi_pos","donor_chain","donor_pos"),
      "vdw":("res1_chain","res1_pos","res2_chain","res2_pos")}
LABEL={"hbond":"hbond","ionic":"salt_bridge","pistack":"pi_stack","pication":"pi_cation","pihbond":"pi_hbond","vdw":"vdw"}
types=collections.defaultdict(set)
for t,(ka,kb,kc,kd) in COLS.items():
    try: rows=list(csv.DictReader(open(f"{A}/contacts_1FDL/{t}.tsv"),delimiter="\t"))
    except FileNotFoundError: continue
    for r in rows:
        for a,b in [((r[ka],int(r[kb])),(r[kc],int(r[kd]))),((r[kc],int(r[kd])),(r[ka],int(r[kb])))]:
            types[a].add(LABEL[t]); types[b].add(LABEL[t])
for r in csv.DictReader(open(f"{A}/interface_1FDL/hbond.tsv"),delimiter="\t"):
    for a,b in [((r["donor_chain"],int(r["donor_resnum"])),(r["acceptor_chain"],int(r["acceptor_resnum"]))),
                ((r["acceptor_chain"],int(r["acceptor_resnum"])),(r["donor_chain"],int(r["donor_resnum"])))]:
        if a[0]!=b[0]: types[a].add("hbond"); types[b].add("hbond")
# also record hbond partners
hb=collections.defaultdict(list)
for r in csv.DictReader(open(f"{A}/interface_1FDL/hbond.tsv"),delimiter="\t"):
    d=(r["donor_chain"],int(r["donor_resnum"])); a=(r["acceptor_chain"],int(r["acceptor_resnum"]))
    hb[d].append({"with":a,"role":"donor","atom":r["donor_atom"],"partner_atom":r["acceptor_atom"],"dist":float(r["distance"])})
    hb[a].append({"with":d,"role":"acceptor","atom":r["acceptor_atom"],"partner_atom":r["donor_atom"],"dist":float(r["distance"])})

out=[]
for (ch,n),b in sorted(bsa.items(), key=lambda x:-x[1]):
    if ch=="C":
        imgt=""; reg="antigen"
    else:
        imgt,reg=num.get((ch,n),("","outside_V_domain"))
    rec={"chain_label":ch,"res_num":n,"region":reg,"imgt_position":imgt,"bsa_A2":round(b,1),
         "contact_types":",".join(sorted(types.get((ch,n),[]))),
         "hbonds":hb.get((ch,n),[])}
    out.append(rec)
with open(f"{A}/interface_residues_1FDL.tsv","w",newline="") as f:
    w=csv.DictWriter(f,delimiter="\t",fieldnames=["chain_label","res_num","region","imgt_position","bsa_A2","contact_types","hbond_detail"])
    w.writeheader()
    for r in out:
        w.writerow({"chain_label":r["chain_label"],"res_num":r["res_num"],"region":r["region"],"imgt_position":r["imgt_position"],"bsa_A2":r["bsa_A2"],"contact_types":r["contact_types"],"hbond_detail":json.dumps(r["hbonds"])})
json.dump(out,open(f"{A}/interface_residues_1FDL.json","w"),indent=1)
# summarize paratope by region
reg_bsa=collections.defaultdict(float); reg_ct=collections.Counter()
for r in out:
    if r["chain_label"]!="C":
        reg_bsa[r["region"]]+=r["bsa_A2"]; reg_ct[r["region"]]+=1
print("Paratope burial by IMGT region (BSA A^2, n residues):")
for k in sorted(reg_bsa,key=lambda x:-reg_bsa[x]): print(f"  {k:10s} {reg_bsa[k]:8.1f}  n={reg_ct[k]}")
print("\nTop paratope residues:")
for r in [x for x in out if x["chain_label"]!="C"][:12]:
    print(f"  {r['chain_label']}{r['res_num']:>4} IMGT {r['imgt_position']:>5} {r['region']:6} BSA={r['bsa_A2']:6.1f} {r['contact_types']} nhb={len(r['hbonds'])}")
print("\nAntigen (lysozyme) epitope top:")
for r in [x for x in out if x["chain_label"]=="C"][:12]:
    print(f"  Y{r['res_num']:>4} BSA={r['bsa_A2']:6.1f} {r['contact_types']} nhb={len(r['hbonds'])}")
