from pathlib import Path
import json,csv,re,hashlib
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[2]; C=ROOT/'02-mmetrics-kn035'; E=C/'raw/mos-export/kn035_case02'; N=C/'raw/native-ui'
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
master=read(C/'raw/local/master-validation.json'); sha=master['sha256']; seqs={k:v['sequence'] for k,v in master['chains'].items()}
ledger=read(E/'task-ledger.json'); source='raw/mos-export/kn035_case02/derived/mmetrics/'
epi=read(E/'derived/mmetrics/epitope.json')['residue_numbers_sequential'];para=read(E/'derived/mmetrics/paratope.json')['residue_numbers_sequential'];cdr=read(E/'derived/mmetrics/cdr_annotations.json')['by_scheme'];mapping=read(E/'numbering-map.json')
save(C/'raw/residue-numbering-map.json',mapping)
res=[{'chain':ch,'label_seq_id':n,'aa':seq[n-1],'group':'native_MutX_scored_position','source_kind':'native_UI_download'} for ch,seq in seqs.items() for n in range(1,len(seq)+1)]
for group,chain,nums in [('epitope','A',epi),('paratope','B',para)]+[(f'CDR_{scheme}_{i+1}','B',list(range(r['start'],r['end']+1))) for scheme,ranges in cdr.items() for i,r in enumerate(ranges)]:
 for n in nums:res.append({'chain':chain,'label_seq_id':n,'aa':seqs[chain][n-1],'group':group,'source_kind':'native_MMetrics_annotation','source_file':source+('cdr_annotations.json' if group.startswith('CDR') else group+'.json')})
# Include every interaction endpoint, including residues beyond annotation lists, in 3D color data.
inter=read(N/'interactions.json')['rows']
for row in inter[1:]:
 for endpoint in row[1:3]:
  m=re.fullmatch(r'([AB]):([A-Z]{3})(\d+)',endpoint);assert m,endpoint
  ch,aa,n=m.groups();n=int(n);res.append({'chain':ch,'label_seq_id':n,'aa':seqs[ch][n-1],'group':'interaction_network','source_kind':'native_UI_DOM','source_file':'raw/native-ui/interactions.json'})
save(C/'residues-on-mmfold1.json',{'schema_version':'1.0','master':'01-structure/raw/MMFold_1.cif','master_sha256':sha,'numbering':'MMFold_1 label_asym_id + label_seq_id','mapping_verified':True,'residues':res})
datasets={}
for f in ['MutXevo.csv','MutXstruct.csv','MutXseq.csv','MutXaff.csv']:
 rows=list(csv.DictReader((N/f).open()));datasets[f]={'rows':len(rows),'columns':list(rows[0]),'sha256':hashlib.sha256((N/f).read_bytes()).hexdigest(),'source_kind':'native_UI_download'}
 # Never coerce source strings; validate every WT against master.
 for row in rows:
  if 'mutstr' in row:
   m=re.fullmatch(r'([A-Z])([AB])(\d+)([A-Z])',row['mutstr']);wt,ch,n,mut=m.groups()
  else:
   m=re.fullmatch(r'([A-Z])(\d+)([A-Z])',row['mutation']);wt,n,mut=m.groups();ch=row['chain']
  assert seqs[ch][int(n)-1]==wt,(f,row)
 datasets[f]['every_row_WT_and_numbering_verified']=True
save(N/'verified-native-datasets.json',datasets)
save(C/'input.json',{'case_id':'02-kn035','project_id':'342604060136448','project_url':'https://mos.moleculemind.com/?projectId=342604060136448','mos_object_id':'342604293768192','mos_work_id':'342604299084800','input_structure':'01-structure/raw/MMFold_1.cif','input_file_sha256':sha,'chain_mapping':{'A':{'mmfold1':'A','role':'PD-L1','length':118},'B':{'mmfold1':'B','role':'KN035_VHH','length':128}},'residue_mapping_file':'raw/residue-numbering-map.json','submitted_prompt':(C/'raw/submitted-prompt.txt').read_text(),'additional_prompts':{p.name:p.read_text() for p in C.glob('raw/submitted-*-prompt.txt')},'task_payloads':[{'task_id':t['task_id'],'payload':read(E/t['payload_file'])} for t in ledger['native_tasks']],'source_project_id':'342242986152960','source_task_id':'342253805564928'})
save(C/'results.json',{'case_id':'02-kn035','status':'native_data_collected_with_native_scope_limits','source_kind':'native_MMetrics_UI_and_tasks','native_tasks':ledger['native_tasks'],'description':read(E/'derived/mmetrics/description.json'),'homologs':{'native_UI_text':'No significant homologs found.','native_record':read(E/'derived/mmetrics/homologs.json'),'note':'Separate pre-analysis binder BLAST hits are retained in raw export, not substituted for antigen Homologs panel.'},'epitope':{'chain':'A','label_seq_ids':epi,'count':len(epi)},'paratope':{'chain':'B','label_seq_ids':para,'count':len(para)},'CDR_by_scheme':cdr,'interaction_table_count':len(inter)-1,'native_interaction_svg':'raw/native-ui/interaction-plot-1.svg','native_datasets':datasets,'native_missing_or_empty':['Domain absent','PTM absent','UniProt Feature empty','AbAn/AbScN/ParaDt CSV not produced by native task'],'independent_antibody_supplement_status':'pending_export','metrics':{'ddG_pred':{'direction':'lower predicts improved binding relative to WT','unit':None,'unit_status':'requires explicit schema or backend evidence; raw CSV has no unit column','experimental':False},'MutXstruct/MutXseq/MutXevo':{'unit':'dimensionless_model_score','direction':'must use corresponding task/model semantics; never experimental stability/expression/solubility'}},'limitations':['Native Description confidence high is classification confidence, not pLDDT.','Description says 51 contacts, typed interaction table has 44 records. Preserve both; local 5 A residue-pair geometry corroborates 51 separately.','Local 4.5 A contacts have 18 antigen and 17 binder residues, distinct from native annotation at 5 A.','Independent antibody CSV supplement is not original native UI output.']})
sasa=read(C/'raw/local/solvent-accessibility.json')['residues']; chosen=[45,40,97,107,105,38]
assert set(chosen)<=set(epi)
hotspots=[dict(r,mos_chain='A',mos_residue=r['label_seq_id'],native_epitope_member=True) for r in sasa if r['chain']=='A' and r['label_seq_id'] in chosen]
assert len(hotspots)==6 and all(r['isolated_sasa_A2']>=20 for r in hotspots)
save(ROOT/'05-denovo-kn035/raw/hotspot-selection.json',{'source_kind':'native_epitope_plus_local_SASA','epitope_source':'02-mmetrics-kn035/residues-on-mmfold1.json','selection_method':'Six residues within native Epitope, isolated-chain SASA >=20 A2, prioritized by interface burial; target chain numbering preserved at import.','native_epitope_label_seq_ids':epi,'hotspots':hotspots,'hotspot_res_string':'A45,A40,A97,A107,A105,A38','not_experimental':True})
(C/'MMETRICS_REPRODUCTION.md').write_text('''# KN035 MMetrics 原生复现\n\n项目：https://mos.moleculemind.com/?projectId=342604060136448 。唯一输入为案例01的 MMFold_1.cif，未重新预测。\n\n`raw/native-ui/panel-dom.json` 和 `full-dom.html` 是原生渲染后 DOM；`layout-and-typography.json` 为真实样式和边界。`complete-scroll-captures.json` 对应有重叠的六张 `native-complete-*.png`，记录 scrollTop、1470×713 CSS px 及 DPR=2。保留早期截图及索引作为历史，完整采集以 complete 前缀为准。\n\n原生 Paratope=18、Epitope=19；IMGT、Kabat、Chothia 三套 CDR 区间保存于原始 record 与 derived/mmetrics/cdr_annotations.json。`annotations.json` 保存每个 chip 的完整文案与 title tooltip。Domain/PTM 无条目、UniProt/Homologs 为空，不能挪用其他结构的条目。原生 typed interaction 表44行与Description正文51 contacts分别原样保留；2D SVG原生导出，没有重绘。\n\n四份 MutX CSV 所有行均核对 WT、链和 MMFold_1 编号，完整 CSV 与验证索引位于 `raw/native-ui/`。所有来源数值保留字符串，不截断成示例行。AbAn/AbScN/ParaDt 未由本次原生任务输出；追加独立任务作为补充，另列来源，不能称为已观察的原生 Antibody Design 区块。\n\n网站上色入口：`residues-on-mmfold1.json`。不要把 compact aa_index、IMGT 位置号或 UniProt 全长编号直接用于3D定位。\n''')
print({'epitope':len(epi),'paratope':len(para),'interactions':len(inter)-1,'datasets':{k:v['rows'] for k,v in datasets.items()},'highlight_entries':len(res)})
