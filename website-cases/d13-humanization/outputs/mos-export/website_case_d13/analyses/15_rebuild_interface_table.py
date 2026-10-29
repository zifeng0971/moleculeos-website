"""Rebuild the machine-readable 1FDL interface table from the independent recomputation
(freesasa dSASA + direct coordinate contacts). The archived PPInterface/InteractionNet files are
NOT used for any conclusion (see logs/execution_log.md correction section)."""
import json, csv, collections
A="analyses"
bsa=json.load(open(f"{A}/bsa_recheck_1FDL.json"))["full_fab"]["per_residue"]
con=json.load(open(f"{A}/contacts_recheck_1FDL.json"))
pol=con["polar_4.0"]
# IMGT mapping for V domains
num={}
for r in csv.DictReader(open(f"{A}/numbering_all_schemes.tsv"),delimiter="\t"):
    if r["scheme"]!="imgt" or r["aa"]=="-": continue
    if r["fasta_id"]=="1FDL_1|Chain": ch="A"
    elif r["fasta_id"]=="1FDL_2|Chain": ch="B"
    else: continue
    num[(ch,int(r["domain_index_1based"]))]=(r["pos"]+r["insertion"].replace("-",""),r["region"])
contacts=collections.defaultdict(list)
for p in con["pairs_4.0"]:
    contacts[(p["fab_chain"],p["fab_res"])].append({"ag_res":p["ag_res"],"ag_resname":p["ag_resname"],"fab_atom":p["fab_atom"],"ag_atom":p["ag_atom"],"d":p["distance"]})
hbm=collections.defaultdict(list)
for p in pol:
    hbm[(p["fab_chain"],p["fab_res"])].append({"ag_res":p["ag_res"],"ag_resname":p["ag_resname"],"fab_atom":p["fab_atom"],"ag_atom":p["ag_atom"],"d":p["distance"]})
rows=[]
for r in bsa:
    ch,n=r["chain"],r["res_num"]
    if ch=="C":
        rows.append({"chain_label":ch,"res_num":n,"region":"antigen(lysozyme)","imgt_position":"","dSASA_A2":r["dSASA_A2"],
                     "in_contact_4A":False,"n_atom_contacts_4A":0,"polar_contacts":[],"contact_partners":[]})
        continue
    key=(ch,n)
    imgt,reg=(num.get(key) or ("","outside_V_domain"))
    rows.append({"chain_label":ch,"res_num":n,"region":reg,"imgt_position":imgt,"dSASA_A2":r["dSASA_A2"],
                 "in_contact_4A":key in contacts,"n_atom_contacts_4A":len(contacts.get(key,[])),
                 "polar_contacts":hbm.get(key,[]),"contact_partners":sorted({c["ag_res"] for c in contacts.get(key,[])})})
rows.sort(key=lambda x:-x["dSASA_A2"])
with open(f"{A}/interface_residues_1FDL.tsv","w",newline="") as f:
    w=csv.DictWriter(f,delimiter="\t",fieldnames=list(rows[0].keys())); w.writeheader()
    for r in rows: w.writerow({**r,"polar_contacts":json.dumps(r["polar_contacts"]),"contact_partners":",".join(str(x) for x in r["contact_partners"])})
json.dump(rows,open(f"{A}/interface_residues_1FDL.json","w"),indent=1)
par=[r for r in rows if r["chain_label"]!="C" and r["dSASA_A2"]>0.5]
print("paratope residues (dSASA>0.5):",len(par))
for r in sorted(par,key=lambda x:-x["dSASA_A2"]):
    print(f'  {r["chain_label"]}{r["res_num"]:>4} IMGT {r["imgt_position"]:>4} {r["region"]:6} dSASA {r["dSASA_A2"]:6.1f} contact4A={r["in_contact_4A"]} partners={r["contact_partners"]}')
epi=[r for r in rows if r["chain_label"]=="C" and r["dSASA_A2"]>0.5]
print("\nepitope residues:",len(epi))
for r in sorted(epi,key=lambda x:-x["dSASA_A2"])[:12]: print(f'  Y{r["res_num"]:>4} dSASA {r["dSASA_A2"]:6.1f}')
