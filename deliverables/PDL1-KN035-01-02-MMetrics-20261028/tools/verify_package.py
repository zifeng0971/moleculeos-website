from pathlib import Path
import hashlib, json, collections
BASE=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((BASE/'manifest.json').read_text())
errors=[]
for row in manifest['files']:
 p=BASE/row['path']
 if not p.is_file() or p.stat().st_size != row['bytes'] or sha(p)!=row['sha256']:
  errors.append(row['path'])
P=BASE/'archives/website-cases/pdl1'
C=P/'02-mmetrics-kn035/raw/mos-export/kn035_case02'
auto=C/'raw/native_task_342604299285504'
native=C/'raw/native_task_342604577018880'
inp=json.loads((P/'01-structure/input.json').read_text())
seq={x['id']:x['sequence'] for x in inp['chains']}
blast=json.loads((auto/'original_objects/mos-blast@blast_results.json').read_text())
record=json.loads((native/'record.json').read_text())
payload=json.loads((native/'task_payload.json').read_text())
structures=[P/'01-structure/raw/MMFold_1.cif',C/'raw/structure/MMFold_1.original.cif',C/'raw/structure/MMFold_1.sanitized.cif']
checks={
 'all_manifest_files_hash_verified':not errors,
 'structure_original_import_sanitized_identical':len({sha(p) for p in structures})==1,
 'native_raw_blast_matches_download':sha(auto/'similarity_results.json')==sha(auto/'original_objects/mos-blast@blast_results.json'),
 'blast_alignment_rows_503':len(blast['data'])==503,
 'blast_unique_hits_500':len({r['hit_id'] for r in blast['data']})==500,
 'all_blast_queries_chain_B':all(r['query_sequence_full']==seq['B'] for r in blast['data']),
 'no_chain_A_query_in_this_blast_file':all(r['query_sequence_full']!=seq['A'] for r in blast['data']),
 'native_homology_empty':record['annotations']['homology']==[],
 'payload_contains_blast_object':any(str(o['id'])=='342604574229504' for o in payload['autocomp_results']['result_data']['objects']),
}
print(json.dumps({'checks':checks,'manifest_files':len(manifest['files']),'invalid_files':errors},ensure_ascii=False,indent=2))
raise SystemExit(0 if all(checks.values()) else 1)
