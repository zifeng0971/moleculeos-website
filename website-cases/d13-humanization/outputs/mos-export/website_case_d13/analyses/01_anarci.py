import subprocess, json, os, tempfile
from Bio import SeqIO
IN="/workspace/website_case_d13/inputs"; OUT="/workspace/website_case_d13/analyses"
fas={}
for rec in SeqIO.parse(f"{IN}/1FDL_fasta.txt","fasta"): fas[rec.id]=str(rec.seq)
for rec in SeqIO.parse(f"{IN}/1BVL_fasta.txt","fasta"): fas[rec.id]=str(rec.seq)
SCHEMES=["imgt","kabat","chothia"]
results={}
for tag,seq in fas.items():
    results[tag]={}
    for sc in SCHEMES:
        with tempfile.NamedTemporaryFile("w",suffix=".fa",delete=False) as f:
            f.write(f">{tag}\n{seq}\n"); p=f.name
        r=subprocess.run(["ANARCI","-i",p,"-s",sc,"-r","ig","--assign_germline"],capture_output=True,text=True)
        os.unlink(p)
        results[tag][sc]={"stdout":r.stdout,"stderr":r.stderr}
json.dump(results,open(f"{OUT}/anarci_raw.json","w"),indent=1)
print(results["1FDL_2|Chain"]["imgt"]["stdout"][:900])
print(".....KABAT.....")
print(results["1FDL_2|Chain"]["kabat"]["stdout"][:400])
