from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent
manifest=json.loads((p/'manifest.json').read_text())
bad=[]
for r in manifest['files']:
 f=p/r['path']
 if not f.is_file() or hashlib.sha256(f.read_bytes()).hexdigest()!=r['sha256']:bad.append(r['path'])
print(json.dumps({'files_checked':len(manifest['files']),'invalid_files':bad},ensure_ascii=False,indent=2))
raise SystemExit(bool(bad))
