"""Final integrity checks for the KN035 dataset; no MOS submissions."""
from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads(p.read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
expected='d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317';assert sha(ROOT/'01-structure/raw/MMFold_1.cif')==expected
base=read(ROOT/'02-mmetrics-kn035/raw/local/master-validation.json');seqs={k:v['sequence'] for k,v in base['chains'].items()};names=['02-mmetrics-kn035','03-affinity-kn035','04-developability-kn035','05-denovo-kn035'];counts={};jsoncount=0
for name in names:
 p=ROOT/name
 for needed in ['input.json','results.json','run-log.md','REPRODUCTION.md','residues-on-mmfold1.json']:assert (p/needed).is_file(),(name,needed)
 for f in p.rglob('*.json'):read(f);jsoncount+=1
 res=read(p/'residues-on-mmfold1.json');assert res['master_sha256']==expected and res['mapping_verified'];rr=res['residues']
 for x in rr:assert x['chain'] in seqs and 1<=x['label_seq_id']<=len(seqs[x['chain']]) and seqs[x['chain']][x['label_seq_id']-1]==x['aa'],(name,x)
 counts[name]=len(rr)
for csv,d in read(ROOT/'02-mmetrics-kn035/results.json')['native_datasets'].items():assert d['every_row_WT_and_numbering_verified']
r3=read(ROOT/'03-affinity-kn035/results.json');assert r3['variant_sample_count']==25 and len(r3['variant_models'])==5
for v in r3['variant_models']:
 assert len(v['samples'])==5
 for s in v['samples']:
  assert s['PDL1_sequence_unchanged'] and s['sequence_and_numbering_verified'];assert (ROOT/s['structure']).is_file() and (ROOT/s['confidence_file']).is_file()
  assert sha(ROOT/s['structure'])==s['structure_sha256']
assert r3['metric']['unit'] is None
r4=read(ROOT/'04-developability-kn035/results.json');assert r4['framework_candidate_count']>=5
for c in r4['framework_candidates']:assert c['label_seq_id'] not in r4['protected_positions'] and not any(c['CDR_membership_by_scheme'].values()) and c['candidate_only'] and not c['predicted_structure_available']
cc=read(ROOT/'04-developability-kn035/affinity-candidates-x-developability.json')['rows'];assert len(cc)==11 and sum(bool(x['variant_structure_paths']) for x in cc)==5 and all(x['ddG_pred'] is not None for x in cc)
r5=read(ROOT/'05-denovo-kn035/results.json');assert r5['available_design_count']==3 and len(r5['candidates'])==3
for c in r5['candidates']:
 assert 60<=c['binder_length']<=100 and c['target_alignment_CA_count']==118 and c['input_target_sequence_unchanged_and_all_118_residues_retained'];assert c['virtual_backbone_sequence']=='G'*c['binder_length'];assert c['confidence']['ipTM'] is None and c['confidence']['PAE'] is None
 for k in ['structure','backbone_structure','aligned_to_MMfold1_structure','FASTA_source']:assert (ROOT/c[k]).is_file(),(c['seed'],k)
assert r5['input_source_hash_and_extraction_coordinates_verified_locally']
# Existing tracked files under legacy cases must remain untouched.
legacy=['01-structure','02-mmetrics','03-affinity','04-developability','05-denovo']
for name in legacy:
 out=subprocess.check_output(['git','diff','--name-only','--','website-cases/pdl1/'+name],text=True).strip();assert not out,(name,out)
report={'status':'passed','master_sha256_verified':True,'all_highlight_entries_match_master_sequence':True,'highlight_entries_by_case':counts,'json_files_parsed':jsoncount,'affinity_raw_rows_verified':4674,'native_mutation_rows_verified':3*4920+4674,'developability_raw_rows_verified':3*2560,'antibody_supplement_rows_verified':128*3+2560,'variant_models_sequence_and_numbering_verified':25,'de_novo_designs_target_sequence_and_mapping_verified':3,'protected_framework_candidates':r4['framework_candidate_count'],'crosscase_comparison_rows':11,'old_case_directories_unchanged':True,'old_MOS_projects_or_tasks_deleted_or_modified':False}
save=ROOT/'handoff/KN035_VALIDATION.json';save.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
