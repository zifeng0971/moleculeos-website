"""Build canonical, source-separated scoring data; verify every WT and residue index."""
from pathlib import Path
import csv,json,re,hashlib
ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads(p.read_text())
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def rows(p):return list(csv.DictReader(p.open()))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
base=read(ROOT/'02-mmetrics-kn035/raw/local/master-validation.json');seqs={k:v['sequence'] for k,v in base['chains'].items()};mastersha=base['sha256']
res02=read(ROOT/'02-mmetrics-kn035/results.json');epi=res02['epitope']['label_seq_ids'];para=res02['paratope']['label_seq_ids'];cdr=res02['CDR_by_scheme'];protect=set(para)|{22,33,96,106}|{n for ranges in cdr.values() for r in ranges for n in range(r['start'],r['end']+1)}
def residue(ch,n,group,source,**extra):return {'chain':ch,'label_seq_id':n,'aa':seqs[ch][n-1],'group':group,'source_kind':source,**extra}
def output_res(case,rr):save(ROOT/case/'residues-on-mmfold1.json',{'schema_version':'1.0','master':'01-structure/raw/MMFold_1.cif','master_sha256':mastersha,'numbering':'MMFold_1 label_asym_id + label_seq_id','mapping_verified':True,'residues':rr})
def prompts(c):return {p.name:p.read_text() for p in (ROOT/c/'raw').glob('submitted-*.txt')}
def input_base(c,project,obj,work,derived):
 return {'case_id':c.split('-')[0]+'-kn035','project_id':project,'project_url':'https://mos.moleculemind.com/?projectId='+project,'mos_object_id':obj,'mos_work_id':work,'master':'01-structure/raw/MMFold_1.cif','master_sha256':mastersha,'input_file':derived,'input_file_sha256':sha(ROOT/derived),'chain_mapping':{'A':{'mmfold1':'A','role':'PD-L1','length':118},'B':{'mmfold1':'B','role':'KN035_VHH','length':128}},'submitted_prompts':prompts(c),'residue_mapping_file':'raw/residue-numbering-map.json'}
# Binding affinity: original task CSV, unchanged; all-A outputs are retained but never become candidates.
c='03-affinity-kn035';P=ROOT/c; E=P/'raw/mos-export/kn035_case03'
if not E.exists():E=P/'raw/mos-checkpoint/kn035_case03'
aff=E/'raw/bindmut/affinity_scores.csv'; arr=rows(aff);assert sha(aff)==sha(ROOT/'02-mmetrics-kn035/raw/native-ui/MutXaff.csv')
contact=read(ROOT/'02-mmetrics-kn035/raw/local/geometric-contacts.json')['pairs']; candidates=[]
for r in arr:
 m=re.fullmatch(r'([A-Z])([AB])(\d+)([A-Z])',r['mutstr']);assert m,r
 wt,ch,n,mut=m.groups();n=int(n);assert seqs[ch][n-1]==wt and mut!=wt
 if ch!='B':continue
 native=(n in para);nei=min(abs(n-j) for j in para)
 candidates.append({'mutation':f'{wt}{n}{mut}','chain':'B','label_seq_id':n,'wild_type':wt,'mutant':mut,'ddG_pred_raw':r['ddG_pred'],'ddG_pred':float(r['ddG_pred']),'unit':None,'unit_status':'not specified by MOS task schema or CSV','direction':'lower is predicted more favorable relative to WT; inference from score_ddg=-ddG_pred and platform scoring convention','score_ddg_raw':r['score_ddg'],'native_paratope':native,'sequence_distance_to_paratope':nei,'paratope_neighbour_within_3_sequence_positions':nei<=3,'PDL1_residues_facing_WT_at_4_5_A':sorted({p['residue_1'] for p in contact if p['residue_2']==n}),'disulfide_breaking':n in [22,33,96,106],'MMFold_structure_paths':[],'source_kind':'MOS_task_output','mos_task_id':'342605020787712','source_file':str(aff.relative_to(ROOT))})
candidates.sort(key=lambda x:x['ddG_pred'])
for i,x in enumerate(candidates):x['rank_all_chain_B']=i+1
interface=sorted([x for x in candidates if x['native_paratope'] and not x['disulfide_breaking']],key=lambda x:x['ddG_pred'])
save(P/'raw/candidates-all-chain-B.json',candidates);save(P/'raw/candidates-interface-priority.json',interface)
ledger=read(E/'task-ledger.json'); ib=input_base(c,'342604683428864','342604788900864','342604793074688','01-structure/raw/MMFold_1.cif');ib['task_payloads']=ledger['tasks'];
for task in ib['task_payloads']:
 for obsolete in ['best_sample_iptm','best_sample_plddt','best_sample_by_ranking_score']:task.pop(obsolete,None)
 if task.get('submitted_payload_file'):
  pf=E/task['submitted_payload_file'];task['actual_submitted_payload']=read(pf);task['actual_submitted_payload_source']=str(pf.relative_to(ROOT))
ib['chain_scoring_limit']='Task schema only accepts chain_ids A,B and exhaustively scores both chains; retain complete 4674 rows, select only B128*19=2432 candidates. A remains WT in every variant input.'
save(P/'input.json',ib);save(P/'raw/residue-numbering-map.json',{'source_file':str((E/'residue_numbering_map.csv').relative_to(ROOT)),'mapping':[{'mos_chain':ch,'mos_residue':n,'mmfold1_chain':ch,'mmfold1_label_seq_id':n,'aa':s[n-1]} for ch,s in seqs.items() for n in range(1,len(s)+1)],'verified_against_master_and_MOS_csv':True})
save(P/'results.json',{'case_id':'03-kn035','status':'affinity_scores_collected_variant_raw_collection_in_progress','tasks':ledger['tasks'],'all_score_rows':len(arr),'chain_B_substitution_rows':len(candidates),'metric':{'name':'ddG_pred','unit':None,'direction':'lower predicts stronger binding relative to WT','direction_source':'inferred from output score_ddg=-ddG_pred and ranking; unit is undocumented','experimental':False},'candidates_top10_allB':candidates[:10],'candidates_top10_interface':interface[:10],'candidate_files':['raw/candidates-all-chain-B.json','raw/candidates-interface-priority.json'],'native_paratope_source':'02-mmetrics-kn035/residues-on-mmfold1.json','variant_models':[],'limitations':['No experimental affinity supplied.','MOS exhaustive scan covers both chains; PD-L1 mutations are excluded from all candidate selections.','Two native/explicit CSVs are byte-identical outputs of the same model, not independent validation.','Raw task and analysis history retain excluded submissions, which never count as the requested variant.','Confidence summaries and atom-site B factors are retained separately; neither is affinity.']})
output_res(c,[residue('B',n,'scored_mutation_position','MOS_task_output') for n in range(1,129)]+[residue('B',x['label_seq_id'],'affinity_candidate','MOS_task_output',mutation=x['mutation'],ddG_pred_raw=x['ddG_pred_raw']) for x in candidates[:10]+interface[:10]]+[residue('B',n,'native_paratope','native_MMetrics_annotation') for n in para]+[residue('A',n,'native_epitope','native_MMetrics_annotation') for n in epi])
# Developability: local merge of separate tasks, including explicit generic sequence chain A -> master B.
c='04-developability-kn035';P=ROOT/c;E=P/'raw/mos-export/kn035_case04';ledger=read(E/'task_ledger.json');tasks=ledger['tasks']
score_tables={};source_info={}
for name,file,task in [('structural_fitness','struct_fitness_scores.csv','342605430273024'),('sequence_fitness','sequence_scores.csv','342605430948864'),('evolutionary_fitness','evolutionary_scores.csv','342605471151104')]:
 rr=rows(E/'raw'/file); assert len(rr)==2560; table={};wtbase={};maps=[]
 for r in rr:
  m=re.fullmatch(r'([A-Z])(\d+)([A-Z])',r['mutation']);assert m;wt,n,mut=m.groups();n=int(n);assert seqs['B'][n-1]==wt
  table[(n,mut)]={'raw':r['score'],'value':float(r['score']),'source_chain':r['chain']}
  if wt==mut:wtbase[n]=float(r['score'])
 for n in range(1,129):assert n in wtbase
 for (n,mut),v in table.items():v['delta_vs_WT_at_same_position']=v['value']-wtbase[n]
 score_tables[name]=table;source_info[name]={'file':str((E/'raw'/file).relative_to(ROOT)),'task_id':task,'row_count':len(rr),'unit':'dimensionless_model_score','direction':'higher is more favorable model fitness','comparison':'mutant score minus WT self-substitution score at same position','direction_evidence_file':str((E/'direction_evidence.json').relative_to(ROOT)),'source_chain_to_master':{'B':'B'} if name=='structural_fitness' else {'A':'B'}}
framework=[]
for x in rows(E/'candidates_final.csv'):
 n=int(x['pos']);assert seqs['B'][n-1]==x['wt'] and x['mut']!=x['wt']
 if n in protect:continue
 y={'mutation':x['wt']+str(n)+x['mut'],'chain':'B','label_seq_id':n,'wild_type':x['wt'],'mutant':x['mut'],'framework_definition':'outside the union of native IMGT, Kabat and Chothia CDR ranges','CDR_membership_by_scheme':{scheme:any(r['start']<=n<=r['end'] for r in ranges) for scheme,ranges in cdr.items()},'predicted_structure_available':False,'candidate_only':True,'source_kind':'local_screen_of_MOS_task_outputs','screen_notes':x,'scores':{name:table[(n,x['mut'])] for name,table in score_tables.items()}}
 framework.append(y)
assert len(framework)>=5
# Assess eleven affinity variants without confusing assessment with framework recommendation.
selected=candidates[:10]+[next(x for x in candidates if x['mutation']=='T105L')];cross=[]
base_risk=read(P/'raw/local-sequence-risks.json')
def motif(s):
 out=set()
 for i,a in enumerate(s):
  if a in 'MW':out.add((i+1,'oxidation_susceptible_'+a))
  if i+1<len(s) and a=='N' and s[i+1] in 'GST':out.add((i+1,'deamidation_motif'))
  if i+1<len(s) and a=='D' and s[i+1] in 'GST':out.add((i+1,'isomerization_motif'))
  if i+2<len(s) and a=='N' and s[i+1]!='P' and s[i+2] in 'ST':out.add((i+1,'N_glycosylation_sequon'))
 return out
for x in selected:
 n=x['label_seq_id'];mut=x['mutant'];s=seqs['B'][:n-1]+mut+seqs['B'][n:];assert len(s)==128
 cross.append({'mutation':x['mutation'],'chain':'B','label_seq_id':n,'ddG_pred':x['ddG_pred'],'ddG_pred_raw':x['ddG_pred_raw'],'affinity_unit':None,'affinity_unit_status':'not documented','native_paratope':n in para,'protected_developability_position':n in protect,'disulfide_breaking':n in [22,33,96,106],'scores':{name:table[(n,mut)] for name,table in score_tables.items()},'local_risk_motifs_added':sorted(motif(s)-motif(seqs['B'])),'local_risk_motifs_removed':sorted(motif(seqs['B'])-motif(s)),'structure_validation_status':'pending_local_CIF_verification','experimental_validation':False})
save(P/'affinity-candidates-x-developability.json',{'source_kind':'local_merge_of_case03_MOS_affinity_and_case04_MOS_scores','score_sources':source_info,'rows':cross})
flat=[]
for x in cross:
 flat.append({k:v for k,v in x.items() if k!='scores'}|{name+'_delta':s['delta_vs_WT_at_same_position'] for name,s in x['scores'].items()})
with (P/'affinity-candidates-x-developability.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=list(flat[0]));w.writeheader();w.writerows(flat)
save(P/'raw/framework-candidates.json',framework)
ib=input_base(c,'342605041570816','342605177943040','342605181223936',c+'/raw/MMFold_1_chain_B.cif');ib['chain_mapping']={'B':{'mmfold1':'B','role':'KN035_VHH','length':128}};ib['score_output_chain_mapping']={k:v['source_chain_to_master'] for k,v in source_info.items()};ib['task_payloads']=tasks;ib['extraction_provenance']=read(P/'raw/MMFold_1_chain_B.provenance.json');ib['MOS_import_sha256']=ledger['structure_object']['sha256'];ib['MOS_import_byte_identity_verified']=ib['input_file_sha256']==ib['MOS_import_sha256'];assert ib['MOS_import_byte_identity_verified'];save(P/'input.json',ib)
save(P/'raw/residue-numbering-map.json',{'coordinate_mapping':[{'mos_chain':'B','mos_residue':n,'mmfold1_chain':'B','mmfold1_label_seq_id':n,'aa':seqs['B'][n-1]} for n in range(1,129)],'sequence_score_mapping':[{'score_chain':'A','score_position':n,'mmfold1_chain':'B','mmfold1_label_seq_id':n,'aa':seqs['B'][n-1]} for n in range(1,129)],'all_7680_score_rows_WT_verified':True})
save(P/'results.json',{'case_id':'04-kn035','status':'scores_and_local_risk_screen_collected','tasks':tasks,'metric_semantics':source_info,'protected_positions':sorted(protect),'protected_CDR_scheme':'union of IMGT, Kabat and Chothia','other_CDR_schemes_available':'case02 native record; each candidate carries membership in all three schemes','protected_disulfide_pairs':[[22,96],[33,106]],'local_analysis':{'sequence_risks':'raw/local-sequence-risks.json','risk_flag_count':base_risk['risk_count']},'framework_candidate_count':len(framework),'framework_candidates':framework,'affinity_candidate_comparison':'affinity-candidates-x-developability.json','comparison_rows':len(cross),'limitations':['Scores are model fitness predictions, not measured stability, expression, or solubility.','WT self-substitution is the baseline; all WT self scores in these actual outputs are zero.','Extended candidates may trade one model against another; source screen notes retain this tradeoff.','Canonical framework candidates protect the union of all three native CDR schemes. L60Y and K50 variants in the MOS-export IMGT-only screen are excluded here because Kabat marks those positions as CDR2.','No new framework candidate has a validated predicted structure or experiment.','Local motif flags are heuristic; no reaction rate or clinical risk is inferred.']})
output_res(c,[residue('B',n,'scored_mutation_position','MOS_task_output') for n in range(1,129)]+[residue('B',n,'protected_CDR_paratope_disulfide','native_annotation_and_local_geometry') for n in sorted(protect)]+[residue('B',x['label_seq_id'],'framework_candidate','local_screen_of_MOS_scores',mutation=x['mutation']) for x in framework]+[residue('B',x['label_seq_id'],'local_sequence_risk','local_analysis',risk=x['kind']) for x in base_risk['risks']]+[residue('B',x['label_seq_id'],'affinity_crosscheck','MOS_task_outputs',mutation=x['mutation']) for x in cross])
print({'case03_candidates':len(candidates),'case04_framework':len(framework),'crosscheck_rows':len(cross),'case04_chainB_input_hash_verified':True})
