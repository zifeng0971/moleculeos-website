"""Independently verify downloaded variant structures and calculate same-frame geometry."""
from pathlib import Path
import copy,csv,json,re,hashlib
import numpy as np
from Bio.PDB import MMCIFParser,MMCIFIO,Superimposer
from Bio.SeqUtils import seq1
ROOT=Path(__file__).resolve().parents[2];C=ROOT/'03-affinity-kn035';E=C/'raw/mos-export/kn035_case03'
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def read(p):return json.loads(p.read_text())
def load(p):return MMCIFParser(QUIET=True,auth_chains=False,auth_residues=False).get_structure('m',p)
def seq(c):return ''.join(seq1(r.resname) for r in c)
def xyz(r):return np.array([a.coord for a in r if a.element!='H'])
def mindist(r,s):return float(np.sqrt(((xyz(r)[:,None]-xyz(s)[None,:])**2).sum(2)).min())
def neighbours(r,c):return [{'chain':'A','label_seq_id':s.id[1],'aa':seq1(s.resname),'minimum_heavy_atom_distance_A':mindist(r,s)} for s in c if mindist(r,s)<=4.5]
master=load(ROOT/'01-structure/raw/MMFold_1.cif');wt=master[0];seqs={c.id:seq(c) for c in wt};epi=read(ROOT/'02-mmetrics-kn035/results.json')['epitope']['label_seq_ids'];para=read(ROOT/'02-mmetrics-kn035/results.json')['paratope']['label_seq_ids'];base_conf=read(ROOT/'01-structure/raw/summary_confidences_sample_1.json')
ids={'A35W':'342605501072384','V109L':'342605511136256','C33Y':'342605520978944','Q116M':'342606341129216','T105L':'342606351508480'}
aff={x['mutation']:x for x in read(C/'raw/candidates-all-chain-B.json')};models=[];variants=[]
for mutation,tid in ids.items():
 wt_aa,n,mut=re.fullmatch(r'([A-Z])(\d+)([A-Z])',mutation).groups();n=int(n);expected=seqs['B'][:n-1]+mut+seqs['B'][n:];assert seqs['B'][n-1]==wt_aa
 payload=read(E/f'variants/payload_{mutation}.json'); ps={x['protein']['id']:x['protein']['sequence'] for x in payload['sequences']};assert ps=={'A':seqs['A'],'B':expected},mutation
 files=sorted((E/f'raw/variants/{mutation}').glob('*_model_sample_*.cif'));assert len(files)==5,(mutation,files)
 sm=[]
 for file in files:
  sample=int(re.search(r'_model_sample_(\d+)\.cif$',file.name).group(1));conf_file=file.parent/f'summary_confidences_sample_{sample}.json';conf=read(conf_file);structure=load(file);m=structure[0]
  assert set(c.id for c in m)=={'A','B'} and seq(m['A'])==seqs['A'] and seq(m['B'])==expected,(mutation,file)
  assert [r.id[1] for r in m['A']]==list(range(1,119));assert [r.id[1] for r in m['B']]==list(range(1,129))
  changes=[{'label_seq_id':i+1,'WT':a,'mutant':b} for i,(a,b) in enumerate(zip(seqs['B'],seq(m['B']))) if a!=b];assert changes==[{'label_seq_id':n,'WT':wt_aa,'mutant':mut}]
  sup=Superimposer();sup.set_atoms([r['CA'] for r in wt['A']],[r['CA'] for r in m['A']]);sup.apply(list(structure.get_atoms()))
  ca_rmsd=lambda ch,nums:float(np.sqrt(np.mean([np.sum((m[ch][i]['CA'].coord-wt[ch][i]['CA'].coord)**2) for i in nums])))
  check=ca_rmsd('A',range(1,119));assert abs(check-sup.rms)<1e-4
  faced=neighbours(m['B'][n],m['A']);pairs=[(a.id[1],b.id[1]) for a in m['A'] for b in m['B'] if mindist(a,b)<=4.5];targetcontacts=sorted({a for a,b in pairs})
  x={'mutation':mutation,'task_id':tid,'sample':sample,'structure':str(file.relative_to(ROOT)),'structure_sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'confidence_file':str(conf_file.relative_to(ROOT)),'confidence_raw':conf,'sequence_and_numbering_verified':True,'PDL1_sequence_unchanged':True,'B_single_substitution':changes,'source_kind':'MOS_variant_prediction_plus_local_geometry','local_geometry':{'method':'Biopython Superimposer fitted on all 118 target C-alpha atoms; distances computed within transformed variant complex','target_A_CA_RMSD_A':float(sup.rms),'binder_B_CA_RMSD_after_A_alignment_A':ca_rmsd('B',range(1,129)),'native_epitope_CA_RMSD_A':ca_rmsd('A',epi),'native_paratope_CA_RMSD_A':ca_rmsd('B',para),'mutation_facing_PDL1_residues_within_4_5_A':faced,'WT_mutation_facing_PDL1_residues_within_4_5_A':neighbours(wt['B'][n],wt['A']),'target_contact_label_seq_ids':targetcontacts,'residue_contact_pairs_4_5_A':len(pairs)},'disulfide_breaking':n in [22,33,96,106]}
  sm.append(x);models.append(x)
 best=max(sm,key=lambda x:x['confidence_raw']['ranking_score']);aligned=C/f'raw/local/variants/{mutation}_best_A_aligned.cif';aligned.parent.mkdir(parents=True,exist_ok=True)
 st=load(ROOT/best['structure']);s=Superimposer();s.set_atoms([r['CA'] for r in wt['A']],[r['CA'] for r in st[0]['A']]);s.apply(list(st.get_atoms()));io=MMCIFIO();io.set_structure(st);io.save(str(aligned))
 v={'mutation':mutation,'task_id':tid,'ddG_pred':aff[mutation]['ddG_pred'],'ddG_pred_raw':aff[mutation]['ddG_pred_raw'],'affinity_unit':None,'best_sample_selection':'highest raw ranking_score','best_sample':best['sample'],'best_structure':best['structure'],'best_aligned_structure':str(aligned.relative_to(ROOT)),'best_confidence_raw':best['confidence_raw'],'samples':sm,'sample_count':5,'sample_ipTM_range':[min(x['confidence_raw']['iptm'] for x in sm),max(x['confidence_raw']['iptm'] for x in sm)],'experimental':False,'disulfide_breaking':best['disulfide_breaking']};variants.append(v)
results=read(C/'results.json')
for task in results['tasks']:
 variant=next((v for v in variants if v['task_id']==task['task_id']),None)
 if variant:
  task['best_sample']=variant['best_sample'];task['best_sample_iptm']=variant['best_confidence_raw']['iptm'];task['best_sample_plddt']=variant['best_confidence_raw']['plddt'];task['confidence_source']='raw summary_confidences JSON independently verified locally'
results['status']='completed_with_model_and_unit_limits';results['variant_models']=variants;results['variant_sample_count']=len(models);results['master_confidence_raw']=base_conf;results['master_confidence_source']='01-structure/raw/summary_confidences_sample_1.json';results['local_reaudit']='handoff/scripts/audit_kn035_structures.py';results['limitations']+=['MOS-export task ledger lists C33Y best_sample_iptm=0.5987, but raw summary says pTM=0.598656 and ipTM=0.260212. Canonical data uses raw confidence JSON.','Native Paratope has 18 residues; local 4.5 A has 17, not an exact match of the whole native list. Canonical provenance uses case02 raw native record.','A35W is a distant/framework hit by IMGT but CDR1 by Kabat; it is not treated as evidence of improved original-interface binding.','V109L has one high-ipTM sample and four much lower-ipTM samples; keep all five.']
seen=set();distinct=[]
for candidate in read(C/'raw/candidates-interface-priority.json'):
 if candidate['label_seq_id'] not in seen:seen.add(candidate['label_seq_id']);distinct.append(candidate)
results['interface_candidates_top10_distinct_sites']=distinct[:10]
results['structural_selection_method']='Validate three best native-paratope substitutions after deduplicating sites (V109L,Q116M,T105L); retain A35W and C33Y as diagnostic counterexamples, not validated affinity improvements.'
save(C/'results.json',results);save(C/'raw/local/structure-audit.json',{'variants':variants,'models_verified':len(models),'all_task_payloads_verified_against_master':True,'all_25_sequences_and_numbering_verified':True,'excluded_task_ids':['342605442536448'],'confidence_not_affinity':True})
for file in ['raw/candidates-all-chain-B.json','raw/candidates-interface-priority.json']:
 data=read(C/file)
 for x in data:
  v=next((v for v in variants if v['mutation']==x['mutation']),None)
  if v:x['MMFold_structure_paths']=[s['structure'] for s in v['samples']];x['MMFold_task_id']=v['task_id'];x['prediction_completed']=True
  else:x['prediction_completed']=False
 save(C/file,data)
for key in ['candidates_top10_allB','candidates_top10_interface']:
 for x in results[key]:
  v=next((v for v in variants if v['mutation']==x['mutation']),None)
  x['MMFold_structure_paths']=[s['structure'] for s in v['samples']] if v else [];x['prediction_completed']=v is not None
save(C/'results.json',results)
# Update cross-case table exclusively from independently verified structures.
p=ROOT/'04-developability-kn035/affinity-candidates-x-developability.json';cross=read(p)
for x in cross['rows']:
 v=next((v for v in variants if v['mutation']==x['mutation']),None)
 x['structure_validation_status']='predicted_structure_sequence_verified' if v else 'score_only_no_variant_structure'
 x['variant_structure_paths']=[s['structure'] for s in v['samples']] if v else []
 if v:x['MMFold_best_confidence_raw']=v['best_confidence_raw'];x['MMFold_task_id']=v['task_id']
save(p,cross)
flat=[{k:v for k,v in x.items() if k not in ['scores','MMFold_best_confidence_raw']}|{name+'_delta':s['delta_vs_WT_at_same_position'] for name,s in x['scores'].items()} for x in cross['rows']]
keys=list(dict.fromkeys(k for x in flat for k in x))
with p.with_suffix('.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=keys);w.writeheader();w.writerows(flat)
rr=read(C/'residues-on-mmfold1.json')
for v in variants:
 n=int(re.fullmatch(r'[A-Z](\d+)[A-Z]',v['mutation']).group(1));rr['residues'].append({'chain':'B','label_seq_id':n,'aa':seqs['B'][n-1],'group':'MMFold_predicted_mutation','mutation':v['mutation'],'source_kind':'MOS_variant_prediction'})
 for a in next(s for s in v['samples'] if s['sample']==v['best_sample'])['local_geometry']['mutation_facing_PDL1_residues_within_4_5_A']:rr['residues'].append(dict(a,group='facing_variant_mutation',mutation=v['mutation'],source_kind='local_geometry_of_MOS_variant'))
save(C/'residues-on-mmfold1.json',rr)
print(json.dumps([{'mutation':v['mutation'],'iptm':v['best_confidence_raw']['iptm'],'plddt':v['best_confidence_raw']['plddt'],'sample':v['best_sample'],'binder_RMSD_A':next(s for s in v['samples'] if s['sample']==v['best_sample'])['local_geometry']['binder_B_CA_RMSD_after_A_alignment_A']} for v in variants],indent=2))
