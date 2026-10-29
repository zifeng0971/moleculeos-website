"""Audit native MMetrics files collected through Chrome; preserve earlier explicit analyses."""
from pathlib import Path
from collections import Counter,defaultdict
from datetime import datetime,timezone
import csv,json,re,hashlib,xml.etree.ElementTree as ET
R=Path(__file__).resolve().parents[2]; P=R/'02-mmetrics';N=P/'raw/native-ui'
mapping=json.loads((P/'raw/verified-residue-numbering.json').read_text());index={(x['chain'],x['label_seq_id']):x for x in mapping}
files={p.name:list(csv.DictReader(p.open())) for p in sorted(N.glob('*.csv'))};assert len(files)==10
full={};stats={};native_pos={}
for name,rows in files.items():
 full[name]={'columns':list(rows[0]),'rows':rows}
 st={'rows':len(rows),'columns':list(rows[0]),'sha256':hashlib.sha256((N/name).read_bytes()).hexdigest()}
 if name in ['MutXevo.csv','MutXseq.csv','MutXstruct.csv']:
  positions={};selfs=0;counter=Counter()
  for row in rows:
   wt,n,mut=re.fullmatch(r'([A-Z])(\d+)([A-Z])',row['mutation']).groups();key=(row['chain'],int(n));assert index[key]['aa']==wt
   positions[key]=wt;selfs+=wt==mut;counter[row['chain']]+=1;float(row['score'])
  assert len(rows)==8780 and len(positions)==439 and selfs==439
  st.update(WT_self_rows=selfs,nonself_rows=len(rows)-selfs,positions=len(positions),rows_by_chain=dict(counter),WT_numbering_audit='all match verified modeled 5GRJ label positions')
  native_pos=positions
 elif name=='MutXaff.csv':
  counter=Counter();selfs=0
  for row in rows:
   wt,c,n,mut=re.fullmatch(r'([A-Z])([A-Z])(\d+)([A-Z])',row['mutstr']).groups();assert index[(c,int(n))]['aa']==wt;counter[c]+=1;selfs+=wt==mut
   assert abs(float(row['score_ddg'])+float(row['ddG_pred']))<1e-6
  assert len(rows)==4294 and counter=={'A':2242,'B':2052} and not selfs
  ranked=sorted(rows,key=lambda x:float(x['ddG_pred']))
  st.update(rows_by_chain=dict(counter),WT_self_rows=selfs,best_10=ranked[:10],interpretation='Binder VH/VL only; 226 modeled residues x 19 nonself; ddG_pred lower more favorable, score_ddg=-ddG_pred. rank retained as raw column, not interpreted as probability.')
 stats[name]=st
# AbAn/humanness/ParaDt row indices are compact coordinate-sequence indices, unlike the main sequence display.
numbering=[]
for chain,tag in [('A','heavy'),('B','light')]:
 modeled=sorted((x for x in mapping if x['chain']==chain),key=lambda x:x['label_seq_id'])
 for kind in ['AbAn','ParaDt','AbScN']:
  name=f'{kind}_{tag}'+('..csv' if kind=='AbScN' and tag=='heavy' else '.csv');rows=files[name]
  assert len(rows)==len(modeled)
  for row,mp in zip(rows,modeled):assert row['aa']==mp['aa']
 for row,mp in zip(files[f'AbAn_{tag}.csv'],modeled):
  numbering.append({'native_csv_index':int(row['aa_index']),'native_csv_chain':chain,**mp,**{k:v for k,v in row.items() if k not in ['aa','aa_index']}})
 st=stats[f'AbScN_{tag}'+('..csv' if tag=='heavy' else '.csv')]
 st['sequence_humanness_scores']={k:float(v) for k,v in files[f'AbScN_{tag}'+('..csv' if tag=='heavy' else '.csv')][0].items() if k.startswith('sequence_humanness')}
# Native annotation button tooltip text and SVG geometry are preserved verbatim.
ann=json.loads((N/'annotations.json').read_text());assert [len(x['items']) for x in ann]==[43,38,3,4,1]
tables=json.loads((N/'interaction-tables.json').read_text());interactions=[]
for pair,t in zip(['A:C','A:B','B:C'],tables):
 for row in t['rows']:
  if len(row)==4:interactions.append({'chain_pair':pair,'type':row[0],'residue_a':row[1],'residue_b':row[2],'distance_A':float(row[3])})
for p in N.glob('interaction-plot-*.svg'):ET.parse(p)
cdr={}
for tag in ['heavy','light']:
 rows=files[f'AbAn_{tag}.csv'];cdr[tag]={}
 for scheme in ['imgt','kabat','chothia']:
  regions=[]
  for label in ['CDR1','CDR2','CDR3']:
   part=[r for r in rows if r['region_'+scheme]==label]
   regions.append({'region':label,'csv_indices':[int(r['aa_index']) for r in part],'numbering':[r['pos_'+scheme] for r in part],'sequence':''.join(r['aa'] for r in part)})
  cdr[tag][scheme]=regions
summary={'collected_utc':datetime.now(timezone.utc).isoformat(),'status':'native_MMetrics_available_UI_and_exports_collected','project_id':'342256011498496','project_url':'https://mos.moleculemind.com/?projectId=342256011498496','object_sequence_view_id':'342256189350912','prior_autocompute_task_id':'342256189539328','autocompute_final_task_status':'Not exposed in current project Task List; completion is evidenced by loaded native UI and ten downloaded outputs, not an invented Succeed task status.','source':'native MMetrics UI and its Download controls, observed through Chrome','description_confidence':'high (categorical description confidence, not pLDDT or model accuracy)','native_sections':['Description','Homologs','Annotations','Interaction Network','Mutation Scoring','Antibody Design'],'homologs_empty_text':'No significant homologs found.','annotations_counts':{'Paratope':43,'Epitope':38,'Domain_ranges':3,'PTM':4,'UniProt_Feature':1},'native_files':stats,'native_CDR_regions':cdr,'interaction_counts':dict(Counter(x['chain_pair'] for x in interactions)),'interaction_type_counts_by_pair':{pair:dict(Counter(x['type'] for x in interactions if x['chain_pair']==pair)) for pair in ['A:C','A:B','B:C']},'numbering_notes':['Main native matrices use modeled label positions, preserving B2-109 and the C168-170 coordinate gap.','Antibody CSV aa_index is compact: heavy 1-118 matches A1-118; light 1-108 matches B2-109. It is not identical to native structure numbering for VL.','Main visible sequence includes full entity sequences (A120/B110/C221), but native matrices only cover coordinate-bearing A118/B108/C213.','UniProt Feature C:ARG221 tooltip describes C→S; original label C221 is R and has no coordinates. Preserve observed UI for reproduction but do not promote this tooltip as a verified residue-specific scientific claim.'],'scope_limits':['No standalone Risk Sites or Recommended Mutations native section or dedicated export was present after the whole panel was explored. Earlier independent risk/recommendation files remain supplemental.','Native Homologs empty result is preserved separately from successful explicit homolog searches.','Paratope annotation and ParaDt prediction are native outputs; do not equate model prediction with experimental epitope validation.','Native scores are distinct from earlier explicit full-entity runs; do not merge score values or row counts.'],'paths':{'full_export_json':'02-mmetrics/raw/native-ui/native-datasets.json','numbering':'02-mmetrics/raw/native-ui/verified-antibody-csv-numbering.json','annotations':'02-mmetrics/raw/native-ui/annotations.json','interactions':'02-mmetrics/raw/native-ui/interactions.json','panel':'02-mmetrics/raw/native-ui/panel-dom.json','layout':'02-mmetrics/raw/native-ui/layout-and-typography.json'}}
(N/'native-datasets.json').write_text(json.dumps(full,ensure_ascii=False,indent=2)+'\n');(N/'verified-antibody-csv-numbering.json').write_text(json.dumps(numbering,ensure_ascii=False,indent=2)+'\n');(N/'interactions.json').write_text(json.dumps(interactions,ensure_ascii=False,indent=2)+'\n');(N/'verified-native-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
p=P/'results.json';d=json.loads(p.read_text());d.setdefault('prior_native_observation',{k:d[k] for k in ['status','observed_utc','native_mmetrics_ui_status'] if k in d});d.update(status='native_mmetrics_collected_with_documented_scope_limits',observed_utc=summary['collected_utc'],native_mmetrics_ui_status='Loaded native sections, all ten native CSVs downloaded and inspected; screenshots, DOM, SVG, pagination and selection states captured.',native_mmetrics=summary);d['source_kind']['native_MMetrics_modules']='Native UI and ten native output CSVs collected; see native_mmetrics section. Earlier explicit analyses retained separately.';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'files':len(files),'interactions':summary['interaction_counts'],'best_native_affinity':stats['MutXaff.csv']['best_10'][0],'human_scores':{k:v.get('sequence_humanness_scores') for k,v in stats.items() if k.startswith('AbScN')}},ensure_ascii=False,indent=2))
