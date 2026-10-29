from pathlib import Path
from collections import Counter
import csv,json,re,hashlib
import numpy as np
from Bio.PDB import PDBParser,MMCIFParser
from Bio.SeqUtils import seq1
R=Path(__file__).resolve().parents[1];P=R/'outputs/mos-export/website_case_d13';O=R/'analysis';raw=json.loads((P/'results.json').read_text());cache=json.loads((P/'analyses/anarci_cache.json').read_text())
def fasta(p):
 out={};k=None
 for l in p.read_text().splitlines():
  if l.startswith('>'):k=l[1:].split()[0];out[k]=''
  elif k:out[k]+=l.strip()
 return out
def res(path,c):
 parser=MMCIFParser(QUIET=True) if path.suffix=='.cif' else PDBParser(QUIET=True)
 return [r for r in parser.get_structure('s',str(path))[0][c] if r.id[0]==' ' and 'CA' in r]
def fit(f,m):
 f=np.asarray(f,dtype=float);m=np.asarray(m,dtype=float);fc=f.mean(0);mc=m.mean(0);u,sv,v=np.linalg.svd((m-mc).T@(f-fc));rot=u@v
 if np.linalg.det(rot)<0:u[:,-1]*=-1;rot=u@v
 return rot,fc-mc@rot,np.linalg.norm((m-mc)@rot+fc-f,axis=1)
def region(pos):
 n=int(re.match(r'\d+',pos)[0])
 for lo,hi,label in [(1,26,'FR1'),(27,38,'CDR1'),(39,55,'FR2'),(56,65,'CDR2'),(66,104,'FR3'),(105,117,'CDR3'),(118,128,'FR4')]:
  if lo<=n<=hi:return label
 raise ValueError(pos)
def numbering(seq):
 text=cache[hashlib.md5(seq.encode()).hexdigest()];rows=[]
 for line in text.splitlines():
  m=re.fullmatch(r'[HL]\s+(\d+)([A-Za-z]?)\s+(?:([A-Za-z])\s+)?([A-Za-z-])\s*',line)
  if m:
   n,ins,ins2,aa=m.groups()
   if aa!='-':rows.append({'pos':n+(ins or ins2 or ''),'aa':aa})
 assert ''.join(x['aa'] for x in rows)==seq[:len(rows)]
 return rows
def mapping(role_res):
 out={}
 for role,rr in role_res.items():
  seq=''.join(seq1(r.resname) for r in rr);rows=numbering(seq)
  for i,row in enumerate(rows):out[(role,row['pos'])]={'aa':row['aa'],'ca':rr[i]['CA'].coord,'region':region(row['pos']),'sequence_position':i+1,'auth_seq_id':rr[i].id[1],'auth_ins_code':rr[i].id[2].strip()}
 return out
def comparison(ref,mob):
 keys=sorted(ref.keys()&mob.keys(),key=lambda k:(k[0],int(re.match(r'\d+',k[1])[0]),k[1]));f=np.array([ref[k]['ca'] for k in keys]);m=np.array([mob[k]['ca'] for k in keys]);fr=[i for i,k in enumerate(keys) if ref[k]['region'].startswith('FR')];rot,t,d=fit(f,m);rf,tf,df=fit(f[fr],m[fr]);afterfr=np.linalg.norm(m@rf+tf-f,axis=1)
 out={'global_CA_RMSD_A':float(np.sqrt(np.mean(d*d))),'FR_fit_CA_RMSD_A':float(np.sqrt(np.mean(df*df))),'matched_CA':len(keys),'matched_FR_CA':len(fr),'CDRs':{}}
 for role in ['VH','VL']:
  for reg in ['CDR1','CDR2','CDR3']:
   idx=[i for i,k in enumerate(keys) if k[0]==role and ref[k]['region']==reg];_,_,ld=fit(f[idx],m[idx]);out['CDRs'][role+'_'+reg]={'n_CA':len(idx),'RMSD_after_global_fit_A':float(np.sqrt(np.mean(d[idx]**2))),'RMSD_after_FR_fit_A':float(np.sqrt(np.mean(afterfr[idx]**2))),'mean_displacement_after_FR_fit_A':float(np.mean(afterfr[idx])),'local_CA_RMSD_A':float(np.sqrt(np.mean(ld**2)))}
 return out
parentres={'VH':res(R/'source/1FDL.pdb','H')[:116],'VL':res(R/'source/1FDL.pdb','L')[:107]};parent=mapping(parentres);reference=mapping({'VH':res(R/'source/1BVL.pdb','A'),'VL':res(R/'source/1BVL.pdb','B')});assert len(parent)==223 and len(reference)==223
variants=fasta(P/'native_tasks/humanization/result.fasta');assert len(variants)==10;scores={r['id']:r for r in csv.DictReader((P/'native_tasks/humanization/final_ranked_summary.csv').open())};assert len(scores)==11
results=[];all_samples=[];comparison_discrepancies=[]
for name,pair in variants.items():
 vh,vl=pair.split(':');assert vh==scores[name]['heavy_sequence'] and vl==scores[name]['light_sequence'];assert len(vh)==116 and len(vl) in [106,107]
 nr={role:{x['pos']:{**x,'sequence_position':i+1} for i,x in enumerate(numbering(s))} for role,s in [('VH',vh),('VL',vl)]};diff=[]
 for k,pr in parent.items():
  role,pos=k;mut=nr[role].get(pos,{}).get('aa','-')
  if mut!=pr['aa']:diff.append({'role':role,'IMGT':pos,'region_IMGT':pr['region'],'parent_sequence_position':pr['sequence_position'],'parent_auth_chain':'H' if role=='VH' else 'L','parent_auth_seq_id':pr['auth_seq_id'],'WT':pr['aa'],'mut':mut,'type':'deletion' if mut=='-' else 'substitution'})
 assert all(d['region_IMGT'].startswith('FR') for d in diff)
 samples=[]
 for j in range(1,6):
  directory=P/'native_tasks/mmfold'/name;cf=directory/f'summary_confidences_sample_{j}.json';confidence=json.loads(cf.read_text());model=next(directory.glob(f'*model_sample_{j}.cif'));rr={'VH':res(model,'A'),'VL':res(model,'B')}
  assert ''.join(seq1(r.resname) for r in rr['VH'])==vh and ''.join(seq1(r.resname) for r in rr['VL'])==vl
  mp=mapping(rr);record={'candidate':name,'sample':j,'model':str(model.relative_to(R)),'confidence_file':str(cf.relative_to(R)),'confidence':confidence,'vs_parent':comparison(parent,mp),'vs_1BVL_authAB':comparison(reference,mp)};samples.append(record);all_samples.append(record)
 best=max(samples,key=lambda v:v['confidence']['ranking_score']);platform=next(c for c in raw['candidates'] if c['id']==name)
 if abs(best['vs_parent']['global_CA_RMSD_A']-platform['vs_parent']['structure']['global_fit']['ca_rmsd'])>=.001:
  comparison_discrepancies.append({'candidate':name,'canonical_best_sample':best['sample'],'canonical_rmsd':best['vs_parent']['global_CA_RMSD_A'],'raw_report_rmsd':platform['vs_parent']['structure']['global_fit']['ca_rmsd'],'raw_report_model':platform['vs_parent']['structure'].get('mob'),'reason':'Raw comparison used a different sample while reporting the highest-ranked confidence. Canonical selection uses exact ranking_score plus matching sample filename.'})
 results.append({'id':name,'VH':vh,'VL':vl,'VH_length':len(vh),'VL_length':len(vl),'framework_changes':len(diff),'framework_substitutions':sum(d['type']=='substitution' for d in diff),'framework_deletions':sum(d['type']=='deletion' for d in diff),'CDR_changes_IMGT':0,'mutations':diff,'MOS_humanization_scores':{k:v for k,v in scores[name].items() if k not in ['heavy_sequence','light_sequence']},'best_model':best,'all_sample_paths':[r['model'] for r in samples]})
original=[]
for model in (P/'native_tasks/humanization').glob('*model_sample_*.cif'):
 assert ''.join(seq1(r.resname) for r in res(model,'A'))==variants['humanization_9'].split(':')[0]
 assert ''.join(seq1(r.resname) for r in res(model,'B'))==variants['humanization_9'].split(':')[1];original.append(str(model.relative_to(R)))
assert len(original)==5 and len(all_samples)==50
for code in ['1FDL','1BVL']:
 for suffix in ['pdb','cif']:assert (R/'source'/f'{code}.{suffix}').read_bytes()==(P/'inputs'/f'{code}.{suffix}').read_bytes()
summary={'case_id':'D1.3','source_labels':{'source':'RCSB experimental 1FDL and 1BVL','humanization_and_structure_confidence':'actual registered MOS task outputs','geometry':'independent local Kabsch audit; paired by archived ANARCI IMGT identifiers, residue letters checked against actual sequences; not native Superimpose or experimental affinity'},'humanization_task_id':'342335722341376','new_tasks_succeeded':11,'designs':10,'unique_pairs':len(set(variants.values())),'independent_MMfold_models':50,'humanization_task_additional_models':original,'all_CDRs_preserved_IMGT':True,'framework_change_range':[min(x['framework_changes'] for x in results),max(x['framework_changes'] for x in results)],'parent_vs_experimental_humanized_reference':comparison(parent,reference),'reference_pair':'original 1BVL author A(VH)+B(VL); MOS sanitizer labels A+C; validated by source coordinate identity','representatives':['humanization_3','humanization_2','humanization_9'],'representative_reasons':{'humanization_3':'best parent global/FR geometry among representative best-ranked models','humanization_2':'high MMFold confidence and close parent geometry','humanization_9':'highest native composite humanization score; CDR1 sample variability retained'},'candidates':results,'all_50_samples':all_samples,'raw_comparison_discrepancies':comparison_discrepancies,'parent_score_row':next(r for name,r in scores.items() if name not in variants),'native_MMetrics_status':json.loads((R/'tasks/native-ui-status.json').read_text()),'audit_notes':['Candidate 7 VL has 106 residues, with a framework deletion. It uses 222 matched CAs /179 FR CAs; others use 223/180.','Best samples are selected from exact unrounded ranking_score. Candidate 7 best is sample1; raw comparison used sample3 and is corrected here. See raw_comparison_discrepancies.','All 55 downloaded model sequences match their submitted candidate sequences.','Original PPInterface table failed independent coordinate validation; raw and retraction retained.','Independent ShrakeRupley surface estimates and Mocha freesasa differ slightly by algorithm/radii, both show zero constant-domain contribution.','Confidence is not affinity, immunogenicity, expression or experimental validation.']}
(O/'verified-results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print('Verified',len(results),'pairs; models50+5; framework changes',summary['framework_change_range'])
for c in results:
 if c['id'] in summary['representatives'] or c['VL_length']!=107:print(c['id'],c['VL_length'],c['framework_changes'],'best',c['best_model']['sample'],'RMSD',c['best_model']['vs_parent']['global_CA_RMSD_A'],'reference',c['best_model']['vs_1BVL_authAB']['global_CA_RMSD_A'])
