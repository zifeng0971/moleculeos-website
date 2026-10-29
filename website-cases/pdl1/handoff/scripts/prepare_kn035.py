"""Local, reproducible preprocessing of the sole MMFold_1 input. No MOS score simulation."""
from pathlib import Path
import copy, hashlib, json, math
from datetime import datetime, timezone
import numpy as np
from Bio.PDB import MMCIFParser, MMCIFIO, PDBIO, ShrakeRupley
from Bio.PDB.MMCIF2Dict import MMCIF2Dict
from Bio.SeqUtils import seq1
ROOT=Path(__file__).resolve().parents[2]
MASTER=ROOT/'01-structure/raw/MMFold_1.cif'
EXPECTED='d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317'
assert hashlib.sha256(MASTER.read_bytes()).hexdigest()==EXPECTED
STAMP=datetime.now(timezone.utc).isoformat()
def save(p,d):
 p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(d,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
structure=MMCIFParser(QUIET=True,auth_chains=False,auth_residues=False).get_structure('MMFold_1',MASTER)
model=structure[0]; chains={c.id:c for c in model}; seqs={k:''.join(seq1(r.resname) for r in c) for k,c in chains.items()}
assert {k:len(v) for k,v in seqs.items()}=={'A':118,'B':128}
d=MMCIF2Dict(str(MASTER)); rows=[]; seen=set()
for i in range(len(d['_atom_site.id'])):
 key=(d['_atom_site.label_asym_id'][i],int(d['_atom_site.label_seq_id'][i]))
 if key in seen:continue
 seen.add(key); rows.append({'label_chain':key[0],'label_seq_id':key[1],'auth_chain':d['_atom_site.auth_asym_id'][i],'auth_seq_id':int(d['_atom_site.auth_seq_id'][i]),'residue':seqs[key[0]][key[1]-1]})
shared=ROOT/'02-mmetrics-kn035/raw/local'
save(shared/'master-residue-numbering-map.json',{'source':'MMFold_1.cif atom_site','sha256':EXPECTED,'residues':rows})
save(shared/'master-validation.json',{'sha256':EXPECTED,'chains':{k:{'sequence':v,'length':len(v),'label_seq_ids':[r.id[1] for r in chains[k]]} for k,v in seqs.items()},'atom_count':len(list(model.get_atoms())),'verified_at':STAMP})
# Preserve original atom columns and all label/auth numbering when extracting one chain.
for cid,outcase in [('A','05-denovo-kn035'),('B','04-developability-kn035')]:
 eid=dict(zip(d['_struct_asym.id'],d['_struct_asym.entity_id']))[cid]; out=copy.deepcopy(d)
 for prefix,field,value in [('_atom_site.','label_asym_id',cid),('_struct_asym.','id',cid),('_entity.','id',eid),('_entity_poly.','entity_id',eid),('_entity_poly_seq.','entity_id',eid)]:
  ids=[i for i,v in enumerate(d[prefix+field]) if v==value]
  for key in d:
   if key.startswith(prefix):out[key]=[d[key][i] for i in ids]
 target=ROOT/outcase/'raw'/f'MMFold_1_chain_{cid}.cif'; io=MMCIFIO();io.set_dict(out);io.save(str(target))
 reloaded=MMCIFParser(QUIET=True,auth_chains=False,auth_residues=False).get_structure('derived',target)[0]
 assert len(list(reloaded))==1 and ''.join(seq1(r.resname) for r in reloaded[cid])==seqs[cid]
 assert all(np.array_equal(a.coord,b.coord) for a,b in zip(chains[cid].get_atoms(),reloaded[cid].get_atoms()))
 pio=PDBIO();pio.set_structure(reloaded);pio.save(str(target.with_suffix('.pdb')))
 save(target.with_suffix('.provenance.json'),{'source':'local_extraction','parent':'01-structure/raw/MMFold_1.cif','parent_sha256':EXPECTED,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'chain':cid,'length':len(seqs[cid]),'method':'Filter mmCIF atom_site and entity/sequence/asym rows by original chain/entity; no atom-coordinate or label/auth-number changes. PDB is auxiliary. CIF is canonical.','coordinate_equality_verified':True,'sequence':seqs[cid]})
# Heavy-atom geometry, separate from native annotations.
pairs=[]
for a in chains['A']:
 x=np.array([t.coord for t in a if t.element!='H'])
 for b in chains['B']:
  y=np.array([t.coord for t in b if t.element!='H']); dist=float(np.sqrt(((x[:,None]-y[None,:])**2).sum(2)).min())
  if dist<=4.5:pairs.append({'chain_1':'A','residue_1':a.id[1],'aa_1':seq1(a.resname),'chain_2':'B','residue_2':b.id[1],'aa_2':seq1(b.resname),'minimum_heavy_atom_distance_A':dist})
epi=sorted({p['residue_1'] for p in pairs}); para=sorted({p['residue_2'] for p in pairs})
save(shared/'geometric-contacts.json',{'source_kind':'local_geometry','cutoff_A':4.5,'epitope':epi,'paratope':para,'pairs':pairs,'note':'Geometric contacts of the predicted model; not native MMetrics annotations or experimental epitope.'})
sr=ShrakeRupley(probe_radius=1.4,n_points=960); sr.compute(model,level='R'); bound={c.id:{r.id[1]:r.sasa for r in c} for c in model}
isolated={}
for cid in ['A','B']:
 single=copy.deepcopy(model)
 for other in list(single):
  if other.id!=cid:single.detach_child(other.id)
 sr.compute(single,level='R'); isolated[cid]={r.id[1]:r.sasa for r in single[cid]}
sasa=[]
for cid,c in chains.items():
 for r in c:sasa.append({'chain':cid,'label_seq_id':r.id[1],'aa':seq1(r.resname),'isolated_sasa_A2':float(isolated[cid][r.id[1]]),'complex_sasa_A2':float(bound[cid][r.id[1]]),'buried_sasa_A2':float(isolated[cid][r.id[1]]-bound[cid][r.id[1]])})
save(shared/'solvent-accessibility.json',{'source_kind':'local_geometry','method':'Biopython ShrakeRupley, probe 1.4 A, 960 sphere points per atom, heavy atoms from prediction','buried_interface_area_A2':sum(r['buried_sasa_A2'] for r in sasa)/2,'residues':sasa})
# Eligibility preview only; final hotspots MUST be gated on native case02 Epitope.
preview=sorted([r for r in sasa if r['chain']=='A' and r['label_seq_id'] in epi and r['isolated_sasa_A2']>=20],key=lambda r:r['buried_sasa_A2'],reverse=True)[:8]
save(ROOT/'05-denovo-kn035/raw/local-hotspot-preview.json',{'status':'preview_not_submitted','source_kind':'local_geometry','native_epitope_verified':False,'selection':'Geometric contact, isolated SASA >=20 A2, ranked by interface burial; require native Epitope intersection and spatial review before submission.','candidates':preview})
# Enumerate motifs and observed SG distances, without inferring reaction probability.
risks=[]; s=seqs['B']
for i,aa in enumerate(s):
 kinds=[]
 if aa=='N' and i+1<len(s) and s[i+1] in 'GST':kinds.append('deamidation_sequence_motif')
 if aa=='D' and i+1<len(s) and s[i+1] in 'GST':kinds.append('isomerization_sequence_motif')
 if aa in 'MW':kinds.append('oxidation_susceptible_residue')
 if aa=='N' and i+2<len(s) and s[i+1]!='P' and s[i+2] in 'ST':kinds.append('N_linked_glycosylation_sequon')
 for kind in kinds:risks.append({'chain':'B','label_seq_id':i+1,'aa':aa,'kind':kind,'sequence_context':s[max(0,i-2):min(len(s),i+4)],'source_kind':'local_sequence_motif','experimental_risk':None})
cys=[r for r in chains['B'] if r.resname=='CYS']; bridges=[]
for i,a in enumerate(cys):
 for b in cys[i+1:]:
  dist=float(np.linalg.norm(a['SG'].coord-b['SG'].coord));bridges.append({'chain':'B','positions':[a.id[1],b.id[1]],'SG_distance_A':dist,'geometric_disulfide_candidate':dist<=2.5,'experimentally_confirmed':False})
save(ROOT/'04-developability-kn035/raw/local-sequence-risks.json',{'source_kind':'local_analysis','sequence':s,'risk_count':len(risks),'risks':risks,'limitations':['Motif flags are heuristic screening only; no probability, expression, solubility, or experimental stability is inferred.','N-glycosylation depends on expression system and accessibility.'],'cysteine_pairs':bridges,'protected_cysteines':[r.id[1] for r in cys],'native_CDR_annotation_status':'pending_case02_AbAn','native_paratope_status':'pending_case02_annotations'})
for name in ['02-mmetrics-kn035','03-affinity-kn035','04-developability-kn035','05-denovo-kn035']:
 p=ROOT/name; (p/'visuals').mkdir(exist_ok=True)
 (p/'raw/master-sequences.fasta').write_text(''.join(f'>MMFold_1_chain_{cid}\n{seq}\n' for cid,seq in seqs.items()))
print(json.dumps({'chain_lengths':{k:len(v) for k,v in seqs.items()},'geometric_epitope':epi,'geometric_paratope':para,'contact_pairs':len(pairs),'local_risk_flags':len(risks),'disulfide_geometry_candidates':[b for b in bridges if b['geometric_disulfide_candidate']],'hotspot_preview':[r['label_seq_id'] for r in preview]},indent=2))
