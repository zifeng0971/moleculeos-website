from pathlib import Path
from collections import Counter
import csv,json,re,hashlib
import numpy as np
from Bio.PDB import PDBParser,MMCIFParser
from Bio.SeqUtils import seq1
R=Path(__file__).resolve().parents[1];P=R/'outputs/mos-export-v2/website_case_petase';O=R/'analysis';raw=json.loads((P/'results.json').read_text())
def fasta(p):
 out={};key=None
 for l in p.read_text().splitlines():
  if l.startswith('>'):key=l[1:].split()[0];out[key]=''
  elif key:out[key]+=l.strip()
 return out
def residues(path,c):
 parser=MMCIFParser(QUIET=True) if path.suffix=='.cif' else PDBParser(QUIET=True)
 return [r for r in parser.get_structure('s',str(path))[0][c] if r.id[0]==' ' and 'CA' in r]
def fit(fixed,moving):
 f=np.asarray(fixed);m=np.asarray(moving);fc=f.mean(0);mc=m.mean(0);u,s,v=np.linalg.svd((m-mc).T@(f-fc));rot=u@v
 if np.linalg.det(rot)<0:u[:,-1]*=-1;rot=u@v
 aligned=(m-mc)@rot+fc;dist=np.linalg.norm(aligned-f,axis=1)
 return rot,fc-mc@rot,dist
wtall=residues(R/'source/5XG0.pdb','C');wt=[r for r in wtall if r.id[1]>=1];wtseq=''.join(seq1(r.resname) for r in wt);assert len(wtseq)==261
construct=''.join(seq1(r.resname) for r in wtall);assert len(construct)==268 and construct[:7]=='GAGAGAM'
wtca=np.array([r['CA'].coord for r in wt]);xh=residues(R/'source/5XH3.pdb','A');xhca=np.array([r['CA'].coord for r in xh]);_,_,base_dist=fit(wtca,xhca)
variants=fasta(P/'native_tasks/redesign_342338944422912/redesign.fasta');assert len(variants)==10
allowed={130,156,157,179,209};mutations={}
for name,s in variants.items():
 assert len(s)==261
 diff=[{'position_AUTH':i,'position_construct':i+7,'position_UNP':i+29,'WT':a,'mut':b,'mutation':f'{a}{i}{b}'} for i,(a,b) in enumerate(zip(wtseq,s),1) if a!=b]
 assert all(d['position_AUTH'] in allowed for d in diff)
 assert all(s[i-1]==wtseq[i-1] for i in [58,131,132,174,177,208,210,244,260])
 mutations[name]=diff
axes={};axis_stats={}
for axis,folder,file in [('sequence','seqfitness_342337264870400','sequence_scores.csv'),('evolution','evomut_342337268093952','evolutionary_scores.csv'),('structure','structfitness_342337277858816','struct_fitness_scores.csv')]:
 rows=list(csv.DictReader((P/'native_tasks'/folder/file).open()));lookup={};selfs=0
 for row in rows:
  a,n,b=re.fullmatch(r'([A-Z])(\d+)([A-Z])',row['mutation']).groups();n=int(n);assert construct[n-1]==a;lookup[(n,a,b)]=float(row['score']);selfs+=a==b
 assert len(rows)==5360 and selfs==268 and len(lookup)==5360
 axes[axis]=lookup;axis_stats[axis]={'rows':len(rows),'WT_self':selfs,'nonself':len(rows)-selfs,'input_sequence_verified':True}
scored={}
for name,diff in mutations.items():
 scored[name]=[{**d,'WT_single_mutant_scores':{axis:table[(d['position_construct'],d['WT'],d['mut'])] for axis,table in axes.items()}} for d in diff]
# Experimental ligand coordinates, named atoms from original PDB. No predicted activity inferred.
xhm=PDBParser(QUIET=True).get_structure('xh',str(R/'source/5XH3.pdb'))[0];ligands=[r for c in xhm for r in c if r.resname=='856'];assert len(ligands)==1
lig=ligands[0];ligxyz=np.array([a.coord for a in lig]);assert len(ligxyz)==16
ligatoms=[a.name for a in lig];pocket=[];atom_contacts=[]
for i,r in enumerate(xh,1):
 pa=list(r);xyz=np.array([a.coord for a in pa]);d=np.linalg.norm(xyz[:,None,:]-ligxyz[None,:,:],axis=2)
 if d.min()<4:pocket.append({'AUTH':r.id[1],'UNP':r.id[1]+29,'aa':seq1(r.resname),'min_distance_A':float(d.min())})
 for pi,li in np.argwhere(d<4):atom_contacts.append({'protein_AUTH':r.id[1],'protein_atom':pa[pi].name,'ligand_atom':ligatoms[li],'distance_A':float(d[pi,li])})
assert len(pocket)==9 and len(atom_contacts)==69
models=[];ensemble=[]
for directory in sorted((P/'native_tasks').glob('mmfold_seq_*')):
 name=re.search(r'mmfold_(seq_\d+)_',directory.name)[1];s=variants[name];confs=[]
 for j in range(1,6):
  cf=directory/f'summary_confidences_sample_{j}.json';c=json.loads(cf.read_text());model=next(directory.glob(f'*model_sample_{j}.cif'));res=residues(model,'A');ms=''.join(seq1(r.resname) for r in res);assert ms==s,(name,j)
  xyz=np.array([r['CA'].coord for r in res]);rot,trans,dist=fit(wtca,xyz);_,_,to_xh=fit(xhca,xyz)
  ca_mean=float(np.mean([r['CA'].bfactor for r in res]));ranking=c.get('ranking_score',c.get('ptm',0));record={'candidate':name,'sample':j,'structure':str(model.relative_to(R)),'confidence_json':str(cf.relative_to(R)),'confidence':c,'ranking_score':ranking,'CA_mean_pLDDT':ca_mean,'global_CA_RMSD_vs_5XG0_A':float(np.sqrt(np.mean(dist**2))),'matched_CA':261,'pocket_CA_RMSD_after_global_fit_A':float(np.sqrt(np.mean(dist[[p['AUTH']-1 for p in pocket]]**2))),'designed_CA_RMSD_after_global_fit_A':float(np.sqrt(np.mean(dist[[i-1 for i in sorted(allowed)]]**2))),'catalytic_CA_RMSD_after_global_fit_A':float(np.sqrt(np.mean(dist[[i-1 for i in [131,177,208]]]**2)))}
  # Rigid alignment to 5XH3 frame is a transfer model, not a candidate-ligand prediction.
  rot2,t2,_=fit(xhca,xyz);allatoms=[a for rr in res for a in rr];allxyz=np.array([a.coord for a in allatoms])@rot2+t2;dd=np.linalg.norm(allxyz[:,None,:]-ligxyz[None,:,:],axis=2);idx=np.unravel_index(dd.argmin(),dd.shape);record['rigid_HEMT_transfer']={'min_heavy_atom_distance_A':float(dd.min()),'nearest_protein_AUTH':allatoms[idx[0]].parent.id[1],'protein_atom':allatoms[idx[0]].name,'ligand_atom':ligatoms[idx[1]],'atom_pairs_under_2A':int((dd<2).sum()),'atom_pairs_under_2_2A':int((dd<2.2).sum()),'method':'All 261 CAs aligned to original 5XH3, original ligand kept fixed; no relaxation, energy or affinity calculation.'}
  confs.append(record);ensemble.append(record)
 best=max(confs,key=lambda v:v['ranking_score']);models.append(best)
assert len(ensemble)==15
for f in ['5xh3_clean.pdb','5xh3_B_856.sdf']:assert (R/'source'/f).read_bytes()==(P/'inputs'/f).read_bytes()
aff=list(csv.DictReader((P/'native_tasks/affinity_342337422410752/predicted_sipobe_scores.csv').open()))[0];assert float(aff['score'])==-4.310292
assert abs(sum(float(aff[k]) for k in ['vdw','hbond','metal','hydrophobic'])-float(aff['score']))<1e-5
summary={'case_id':'PETase','source_labels':{'reference':'public experimental RCSB 5XH3/5XG0','scores':'actual registered MOS tasks; raw outputs preserved','geometry':'independent local audit of downloaded coordinates; not experimental activity'},'native_tasks_new_count':8,'WT_scan_audit':axis_stats,'redesign_count':len(variants),'unique_sequences':len(set(variants.values())),'sequence_groups':{s:[k for k,v in variants.items() if v==s] for s in dict.fromkeys(variants.values())},'all_mutations':scored,'fixed_sites_preserved':True,'experimental_ligand_contacts':{'cutoff_A':4,'residues':pocket,'atom_pairs':atom_contacts},'5XG0_vs_5XH3_CA_RMSD_A':float(np.sqrt(np.mean(base_dist**2))),'5XG0_vs_5XH3_matched_CA':261,'representative_models':models,'all_15_model_samples':ensemble,'affinity_manual_rerun':{'task_id':'342337422410752','raw':aff,'units':'Not stated in output CSV; retain native score label, not Kd, pKd or experimentally measured energy'},'native_MMetrics_status':json.loads((R/'tasks/native-ui-status.json').read_text()),'limitations':['10 outputs comprise repeated sequences; report actual unique count.','Best structures selected by native ranking_score, separate from engineering candidate choice.','All changes lie within five allowed mature positions; catalytic/oxyanion/disulfide sequence identities verified.','Design scaffold is a constructed mutant-bound WT-sequence model, not an experimental WT–HEMT complex.','Model disagreements and short rigid-ligand-transfer contacts do not prove improved enzymatic activity.']}
(O/'verified-results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
with (O/'all-candidate-mutations.csv').open('w') as f:
 fields=['candidate','AUTH','construct','UNP','mutation','sequence_score','evolution_score','structure_score'];w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
 for n,ds in scored.items():
  for d in ds:w.writerow({'candidate':n,'AUTH':d['position_AUTH'],'construct':d['position_construct'],'UNP':d['position_UNP'],'mutation':d['mutation'],'sequence_score':d['WT_single_mutant_scores']['sequence'],'evolution_score':d['WT_single_mutant_scores']['evolution'],'structure_score':d['WT_single_mutant_scores']['structure']})
print('Verified 10 designs,',len(set(variants.values())),'unique; 15 actual MMFold samples; all three 5360-row scans match WT; 69 experimental contacts.')
for m in models:print(m['candidate'],'best sample',m['sample'],'pLDDT',m['confidence'].get('plddt'), 'RMSD',m['global_CA_RMSD_vs_5XG0_A'],m['rigid_HEMT_transfer'])
