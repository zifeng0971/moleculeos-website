from pathlib import Path
import csv,json,re,hashlib
ROOT=Path(__file__).resolve().parents[2];C=ROOT/'02-mmetrics-kn035';S=C/'raw/mos-export/kn035_case02_supplement'
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
seq=read(C/'raw/local/master-validation.json')['chains']['B']['sequence'];manifest=read(S/'supplement-manifest.json');results=read(C/'results.json');inp=read(C/'input.json');data={};maps=[];res=read(C/'residues-on-mmfold1.json')
for t in manifest['tasks']:
 p=S/t['dir']/t['csv'];assert hashlib.sha256(p.read_bytes()).hexdigest()==t['csv_sha256'];rows=list(csv.DictReader(p.open()));seen=set()
 for row in rows:
  if 'aa_index' in row:
   n=int(row['aa_index']);aa=row['aa'];assert seq[n-1]==aa
  else:
   wt,n,mut=re.fullmatch(r'([A-Z])(\d+)([A-Z])',row['mutation']).groups();n=int(n);assert seq[n-1]==wt
  seen.add(n)
 assert seen==set(range(1,129));data[t['csv']]={'source_kind':'independent_MOS_task_output','task_id':t['task_id'],'row_count':len(rows),'columns':list(rows[0]),'rows':rows,'path':str(p.relative_to(ROOT))}
 maps.append({'csv':t['csv'],'task_id':t['task_id'],'csv_source_chain':'H' if t['csv']=='ablang_heavy_scores.csv' else 'heavy','residues':[{'compact_aa_index':n,'mmfold1_chain':'B','mmfold1_label_seq_id':n,'aa':seq[n-1]} for n in range(1,129)]})
 for n in range(1,129):res['residues'].append({'chain':'B','label_seq_id':n,'aa':seq[n-1],'group':'independent_antibody_analysis','source_kind':'independent_MOS_task_output','task_id':t['task_id'],'source_file':str(p.relative_to(ROOT))})
 inp['task_payloads'].append({'task_id':t['task_id'],'task_type':t['task_type'],'source_kind':'independent_MOS_task','payload':read(S/t['dir']/'task_payload_actual.json')})
save(C/'raw/antibody-csv-compact-to-mmfold1.json',{'source_kind':'verified_mapping_of_independent_MOS_CSVs','chains':'heavy/H is the original KN035 chain B, never a light chain','maps':maps});save(C/'raw/independent-antibody-datasets.json',data)
results['independent_antibody_supplement_status']='completed';results['independent_antibody_tasks']=manifest['tasks'];results['independent_antibody_csv_rows']={k:v['row_count'] for k,v in data.items()};results['independent_antibody_mapping']='raw/antibody-csv-compact-to-mmfold1.json';results['independent_antibody_dataset']='raw/independent-antibody-datasets.json';results['status']='completed_with_native_UI_scope_limits';save(C/'results.json',results);save(C/'input.json',inp);save(C/'residues-on-mmfold1.json',res)
# All native CSV rows preserved as strings in one machine-readable export as well.
nd={}
for file in sorted((C/'raw/native-ui').glob('MutX*.csv')):
 rr=list(csv.DictReader(file.open()));nd[file.name]={'source_kind':'native_UI_download','columns':list(rr[0]),'row_count':len(rr),'rows':rr}
save(C/'raw/native-ui/native-datasets.json',nd)
print(results['independent_antibody_csv_rows'])
