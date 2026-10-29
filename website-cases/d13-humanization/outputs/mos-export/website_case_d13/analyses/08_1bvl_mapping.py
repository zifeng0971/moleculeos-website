"""Establish and VERIFY 1BVL author-chain <-> MOS-label chain mapping from the files themselves.
No assumption from chain-name ordering: identity is assigned by exact sequence match of the
parser-reported author chains to the sanitized label chains, plus the deposited assembly definition."""
import gemmi, json, csv
from Bio.PDB import PDBParser
AA3={'ALA':'A','ARG':'R','ASN':'N','ASP':'D','CYS':'C','GLN':'Q','GLU':'E','GLY':'G','HIS':'H','ILE':'I',
     'LEU':'L','LYS':'K','MET':'M','PHE':'F','PRO':'P','SER':'S','THR':'T','TRP':'W','TYR':'Y','VAL':'V','MSE':'M'}
def auth_seqs(pdb):
    st=PDBParser(QUIET=True).get_structure("x",pdb); out={}
    for ch in st[0]:
        res=[r for r in ch if r.id[0]==" "]
        out[ch.id]="".join(AA3.get(r.resname,"X") for r in res)
    return out
def label_seqs(cif):
    st=gemmi.read_structure(cif); st.setup_entities(); out={}
    for ch in st[0]:
        pol=ch.get_polymer()
        out[ch.name]="".join(gemmi.find_tabulated_residue(r.name).one_letter_code for r in pol)
    return out
A=auth_seqs("inputs/1BVL.pdb")
L=label_seqs("structures/1BVL_sanitized.cif")
LM=label_seqs("/workspace/protein_data/protein_342337097393152/179248399055359_1BVL.cif")
blk=gemmi.cif.read("inputs/1BVL.cif").sole_block()
ent_chain=list(blk.find_values("_entity_poly.pdbx_strand_id"))
ent_seq=[s.strip().strip(";").replace("\n","") for s in blk.find_values("_entity_poly.pdbx_seq_one_letter_code_can")]
assembly=[str(x).strip("'\"") for x in list(blk.find_values("_pdbx_struct_assembly_gen.asym_id_list"))]
rows=[]
for lab,seq in L.items():
    matches=[a for a,s in A.items() if s==seq]
    rows.append({"mos_label":lab,"mos_len":len(seq),"auth_match":",".join(matches),
                 "role":"VH" if seq.startswith("QVQL") else ("VL" if seq.startswith("DIQM") else "?"),
                 "mos_object_len":len(LM.get(lab,""))})
print("author chains:",{k:(len(v),v[:12]) for k,v in A.items()})
print("entity strands:",ent_chain,"entity seq lengths:",[len(s) for s in ent_seq])
print("assembly asym_id_list:",assembly)
for r in rows: print(r)
json.dump({"author_chains":{k:{"len":len(v),"seq":v} for k,v in A.items()},
           "label_chains":{k:{"len":len(v),"seq":v} for k,v in L.items()},
           "entity_strand_ids":ent_chain,"entity_seq_lengths":[len(s) for s in ent_seq],
           "assembly_asym_id_list":assembly,"mapping":rows},open("analyses/1BVL_chain_mapping.json","w"),indent=1)
with open("analyses/1BVL_chain_mapping.tsv","w",newline="") as f:
    w=csv.DictWriter(f,delimiter="\t",fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)
