"""Extract reviewed rule literals without importing or running downloaded code."""
from pathlib import Path
import ast, json, re, hashlib, csv
from datetime import datetime, timezone
R=Path(__file__).resolve().parents[2]
S=R/'sources/developabilityliabilities'
repo=S/'developabilityliabilities-main'
scanner=repo/'backend/services/scanner.py'
tree=ast.parse(scanner.read_text())
rules=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='HOTSPOT_RULES' for t in n.targets))
seq=json.loads((R/'04-developability/input.json').read_text())['tasks'][1]['payload']['sequence']
source={'project':'DevelopabilityLiabilities','url':'https://code.moleculemind.com/xinxu/developabilityliabilities','project_id':503,'visibility':'internal','branch':'main','observed_commit':'c3e7fe6fd067390af479479ccfb00d30a0b9c8ac','archive_url':'https://code.moleculemind.com/xinxu/developabilityliabilities/-/archive/main/developabilityliabilities-main.zip','downloaded_at':datetime.now(timezone.utc).isoformat(),'archive_sha256':hashlib.sha256((S/'developabilityliabilities-main.zip').read_bytes()).hexdigest(),'download_method':'authenticated Chrome GitLab Download source code ZIP','archive_crc':'passed','archive_file_count':sum(f.is_file() for f in repo.rglob('*')),'rule_count':len(rules),'groups':list(dict.fromkeys(r['group'] for r in rules)),'svg_file_count':len(list(repo.rglob('*.svg'))),'license_file_found':any(f.name.lower().startswith(('license','copying')) for f in repo.rglob('*')),'execution':'Downloaded source was read as text; no dependencies installed or downloaded code executed.'}
(S/'source.json').write_text(json.dumps(source,ensure_ascii=False,indent=2)+'\n')
(S/'rules.json').write_text(json.dumps({'source':'source.json','extraction':'AST literal only from backend/services/scanner.py HOTSPOT_RULES','rules':rules},ensure_ascii=False,indent=2)+'\n')
hits=[]
for rule in rules:
 if rule['group']=='游离巯基' and seq.count('C')%2==0:continue
 for m in re.finditer(rule['pattern'],seq):
  start,end=m.start()+1,m.end()
  hits.append({'rule':rule['rule_name'],'group':rule['group'],'motif':m.group(),'start_1based':start,'end_1based_inclusive':end,'repository_base_risk':rule['risk'],'modeled_structure_chain':'A' if end<=127 else None,'original_5JDS_auth_chain':'B' if end<=127 else None,'positions_with_coordinates':list(range(start,min(end,127)+1)),'rsa':None})
out={'source_kind':'local sequence pattern annotation using internal GitLab rule literals; not MOS model output','source':'sources/developabilityliabilities/source.json','sequence':seq,'sequence_length':len(seq),'method':'Python re.finditer per source pattern, matching the scanner non-overlap behavior; even-Cys rule skipped as source does. No source code executed. No source approximate CDR/Fc or Critical escalation adopted.','numbering':'1-based KN035 domain sequence; positions 1-127 = working structure chain A and original 5JDS auth chain B; terminal S128 has no reference coordinate.','matches':hits,'limits':['Base risk labels reproduced from repository, not independently validated probabilities or measured modifications.','No RSA computed in this supplemental annotation.','O-glycosylation single S/T and KG/KE rules are broad screening labels; do not imply observed modification.','Even Cys count does not prove disulfide pairing. Use existing coordinate-derived disulfides.','S85N changes NS84-85 to NN84-85, which remains a medium deamidation motif in this library. WT already contains NN73-74.','No actual solubility, aggregation or stability measurement is supplied by motif counts.']}
(R/'04-developability/raw/supplementary-liability-matches.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
with (R/'04-developability/raw/supplementary-liability-matches.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['rule','group','motif','start_1based','end_1based_inclusive','repository_base_risk']);w.writeheader();w.writerows({k:h[k] for k in w.fieldnames} for h in hits)
print(json.dumps({'source_files':source['archive_file_count'],'rules':len(rules),'groups':source['groups'],'matches':len(hits),'focused_matches':[h for h in hits if h['group'] in ['脱酰胺','异构化','环化'] or h['motif'] in ['DP','M','W']]},ensure_ascii=False,indent=2))
