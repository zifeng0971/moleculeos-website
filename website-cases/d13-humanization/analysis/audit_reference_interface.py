from Bio.PDB import PDBParser, ShrakeRupley, PDBIO, Select
from pathlib import Path
from copy import deepcopy
import numpy as np,json,hashlib
R=Path(__file__).resolve().parents[1];src=R/'source/1FDL.pdb';model=PDBParser(QUIET=True).get_structure('reference',str(src))[0]
ends={'H':116,'L':107};ag=np.array([a.coord for r in model['Y'] if r.id[0]==' ' for a in r if a.element!='H']);hits=[];counts={}
for c,end in ends.items():
 residues=[r for r in model[c] if r.id[0]==' ']
 for i,r in enumerate(residues,1):
  xyz=np.array([a.coord for a in r if a.element!='H']);dist=float(np.sqrt(((xyz[:,None,:]-ag[None,:,:])**2).sum(2)).min())
  if dist<4.5:hits.append({'auth_chain':c,'sequence_position':i,'auth_seq_id':r.id[1],'insertion':r.id[2].strip(),'resname':r.resname,'domain':'variable' if i<=end else 'constant','min_heavy_atom_distance_to_lysozyme_A':dist})
 counts[c]={'variable_contact_residues':sum(h['auth_chain']==c and h['domain']=='variable' for h in hits),'constant_contact_residues':sum(h['auth_chain']==c and h['domain']=='constant' for h in hits)}
assert counts=={'H':{'variable_contact_residues':10,'constant_contact_residues':0},'L':{'variable_contact_residues':7,'constant_contact_residues':0}}
# All ASA differences use an intact antibody (both chains) as one side.
def subset(chains,variable=False):
 m=deepcopy(model)
 for c in list(m):
  if c.id not in chains:m.detach_child(c.id);continue
  standard=[r for r in c if r.id[0]==' ']
  allowed=set(r.id for r in (standard[:ends[c.id]] if variable and c.id in ends else standard))
  for res in list(c):
   if res.id not in allowed:c.detach_child(res.id)
 return m
def area(chains,variable=False):
 m=subset(chains,variable);ShrakeRupley(probe_radius=1.4,n_points=960).compute(m,level='R');bychain={c.id:sum(r.sasa for r in c) for c in m};return {'total':sum(bychain.values()),'by_chain':bychain}
full_ab=area(['H','L']);fv_ab=area(['H','L'],True);antigen=area(['Y']);full_complex=area(['H','L','Y']);fv_complex=area(['H','L','Y'],True)
summary={'source_kind':'independent local geometry on public experimental reference; not MOS model prediction','input_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'contact_cutoff_A':4.5,'residue_counts':counts,'contacts':hits,'sasa_method':'Biopython ShrakeRupley; probe=1.4 A; 960 points/atom; solvent/hetero removed; both antibody chains treated together','raw_areas':{'full_antibody':full_ab,'fv_antibody':fv_ab,'antigen':antigen,'full_complex':full_complex,'fv_complex':fv_complex},'interfaces':{}}
for name,ab,complex in [('Fab',full_ab,full_complex),('Fv',fv_ab,fv_complex)]:
 abburial=ab['total']-complex['by_chain']['H']-complex['by_chain']['L'];agburial=antigen['total']-complex['by_chain']['Y'];summary['interfaces'][name]={'antibody_side_burial_A2':abburial,'antigen_side_burial_A2':agburial,'both_side_sum_A2':abburial+agburial,'mean_per_side_A2':(abburial+agburial)/2}
(R/'analysis/reference-interface-verified.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary['interfaces'],indent=2))
