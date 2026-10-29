"""Package captured MOS data and explicitly separate local validation."""
from pathlib import Path
import json, re, shutil, hashlib, datetime
from html.parser import HTMLParser

D=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')

class Node:
    def __init__(self,tag='',attrs=()):self.tag=tag;self.attrs=dict(attrs);self.children=[]
class Parse(HTMLParser):
    def __init__(self,html):
        super().__init__(convert_charrefs=True);self.root=Node();self.stack=[self.root];self.feed(html)
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs);self.stack[-1].children.append(n)
        if tag not in ['br','hr','img']:self.stack.append(n)
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,0,-1):
            if self.stack[i].tag==tag:self.stack=self.stack[:i];break
    def handle_data(self,s):self.stack[-1].children.append(s)
def md(n):
    if isinstance(n,str):return n
    inside=''.join(md(c) for c in n.children);t=n.tag
    if t in ['strong','b']:return '**'+inside+'**'
    if t in ['em','i']:return '*'+inside+'*'
    if t=='code':return '`'+inside+'`'
    if t=='p':return inside.strip()+'\n\n'
    if re.fullmatch('h[1-6]',t):return '#'*int(t[1])+' '+inside.strip()+'\n\n'
    if t in ['ul','ol']:
        items=[c for c in n.children if isinstance(c,Node) and c.tag=='li']
        return '\n'+'\n'.join((f'{i+1}. ' if t=='ol' else '- ')+md(c).strip() for i,c in enumerate(items))+'\n\n'
    if t=='table':
        def rows(x):
            if isinstance(x,str):return []
            if x.tag=='tr':return [[md(c).strip().replace('|','\\|') for c in x.children if isinstance(c,Node) and c.tag in ['th','td']]]
            return sum((rows(c) for c in x.children),[])
        rr=rows(n)
        if not rr:return ''
        return '\n'+'\n'.join(['| '+' | '.join(rr[0])+' |','| '+' | '.join(['---']*len(rr[0]))+' |']+['| '+' | '.join(r)+' |' for r in rr[1:]])+'\n\n'
    if t=='a':return '['+inside+']('+n.attrs.get('href','')+')'
    if t=='br':return '\n'
    if t=='hr':return '\n---\n'
    return inside

# Download only the files observed in this new project's Workspace.
receipts=[]
for name in ['pdl1_kn035_view.cif','pdl1_kn035_view.cif.mapping','report.jsonl','step1.json','contacts.log','interface.log','interface_results.md']:
    p=Path('/Users/zifengye/Downloads')/name
    ts=datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat()
    assert ts.startswith('2026-10-22T01:51:'),(name,ts)
    shutil.copyfile(p,D/'raw/agent-analysis'/name)
    receipts.append({'source':str(p),'destination':'raw/agent-analysis/'+name,'mtime_utc':ts,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
save(D/'raw/agent-analysis/final-download-receipts.json',receipts)

first=read(D/'raw/first-turn-reply.json')[0]
second=read(D/'raw/replies-through-turn2.json')
# Preserve the final reply from each turn; progress paragraphs remain in raw captures.
second_final=next(x for x in second if x['text'].startswith('The analysis toolchain is ready'))
last_html=(D/'raw/final-reply.html').read_text()
final_md=md(Parse(last_html).root).strip()+'\n'
(D/'raw/final-reply.md').write_text(final_md)

source=(D/'raw/first-turn-expanded-commands.txt').read_text()
title_pattern=r'^(?:Thinking|Execution details(?: \d+ items)?|File operations|Run commands(?: \d+ items)?|Tool calls(?: \d+ items)?|Search sources|3D Viewer(?: \d+ items)?)$'
turns=[]
for title,part,duration in [('Worked for 44s',source.split('- button "Worked for 44s"')[1].split('- button "Worked for 7s"')[0],44),('Worked for 7s',source.split('- button "Worked for 7s"')[1],7)]:
    titles=[x for x in re.findall(r'^- button "([^"]+)"',part,re.M) if re.match(title_pattern,x)]
    turns.append({'title':title,'duration_seconds':duration,'steps':[{'title':x,'start_seconds':'unknown','end_seconds':'unknown','duration_seconds':'unknown'} for x in titles]})
third=read(D/'raw/final-turn-step-titles.json')[0];third['duration_seconds']=454;turns.append(third)
save(D/'raw/steps.json',turns)

transcript='# MOS agent transcript — case 00\n\nProject `342947812647936`; task `342948473701376`.\n\nThe text below is captured from the real UI, without correcting the agent. Raw rendered HTML/text, tool inputs/results, and observation timestamps are in `raw/`. Exact per-step start/end times are **unknown**: the UI exposes total turn time, and the network capture failed. Observation timestamps must not be treated as backend execution timestamps.\n\n'
for i,(turn,reply) in enumerate(zip(turns,[md(Parse(first['html']).root),md(Parse(second_final['html']).root),final_md]),1):
    transcript+=f'## Turn {i}: {turn["title"]}\n\n'
    if i>1:transcript+='User follow-up (verbatim): `continue`\n\n'
    transcript+='| Order | UI step title | Start (s) | End (s) | Duration (s) |\n| --- | --- | --- | --- | --- |\n'
    for j,s in enumerate(turn['steps'],1):transcript+=f'| {j} | {s["title"]} | unknown | unknown | unknown |\n'
    transcript+='\n### Agent reply (verbatim)\n\n'+reply.strip()+'\n\n'
(D/'agent-transcript.md').write_text(transcript)

inp=read(D/'input.json');inp['status']='completed_with_capture_gaps';save(D/'input.json',inp)
r=read(D/'results.json');r['status']='completed_with_capture_gaps';r['prediction_status']='succeeded';r['agent_status']='completed';r['selected_sample']=1
r['agent_interface']={'source_kind':'MOS agent final reply and agent-authored interface_results.md','source':'raw/final-reply.md','definition':'PPInterface buried surface interface; final biological epitope excludes artificial Met1. Agent report labels chain A BSA >5 A^2; chain B lists all 21 interface residues. This differs from local distance contacts.','A':{'numbering_scheme':'standard PD-L1 / UniProt Q9NZQ7 numbering, as stated by agent','positions':[54,56,58,61,63,66,68,69,73,76,113,115,117,119,120,121,122,123,125],'model_label_seq_id_mapping_source':'Agent report: model n -> UniProt n+16; also verified by local sequence alignment','model_label_seq_ids':[38,40,42,45,47,50,52,53,57,60,97,99,101,103,104,105,106,107,109]},'B':{'numbering_scheme':'sequential model numbering from Q1; matches raw label_seq_id and MOS sequence index, not IMGT residue numbering','numbering_evidence':'Agent-authored interface_results.md: Chain B = KN035, model numbering is sequential from Q1','positions':[27,29,30,32,44,99,100,101,102,103,104,105,108,109,110,111,113,114,115,116,117]},'CDR_annotation':'Agent used --numbering imgt to identify regions; reported residue positions are mapped back to model sequence indices. CDR regions in model indices: 26-33, 51-58, 97-117.','excluded_artifact':{'chain':'A','label_seq_id':1,'aa':'M','reason_verbatim':'the artificial Met1 accounts for 42 Å² of the apparent interface, forming a spurious salt bridge to Glu44 of the nanobody; I excluded it from the epitope above'}}
geo=read(D/'raw/local-geometry.json');a=set(r['agent_interface']['A']['model_label_seq_ids']);b=set(r['agent_interface']['B']['positions']);la=set(geo['interface']['A']);lb=set(geo['interface']['B'])
geo['comparison_to_agent']={'all_positions_below_are_original_model_label_seq_id':True,'A':{'shared':sorted(a&la),'agent_only':sorted(a-la),'local_only':sorted(la-a)},'B':{'shared':sorted(b&lb),'agent_only':sorted(b-lb),'local_only':sorted(lb-b)},'local_A_excluding_artificial_Met1':sorted(la-{1}),'explanation':'Agent uses surface burial, whereas local geometry uses <=4.5 angstrom heavy-atom distances. Artificial A:Met1 is explicitly excluded by agent from biological epitope but remains a physical distance contact in local geometry.'}
# Quantify the nearest opposing-chain distance for every discrepancy.
import importlib.util,contextlib,io
spec=importlib.util.spec_from_file_location('lv',D/'raw/local_validate.py');m=importlib.util.module_from_spec(spec)
with contextlib.redirect_stdout(io.StringIO()):spec.loader.exec_module(m)
nearest=[]
for chain,nums in [('A',sorted(a-la)),('B',sorted(b-lb))]:
    other='B' if chain=='A' else 'A'
    for n in nums:
        rr=next(v for v in m.chains[chain] if v['label_seq_id']==n)
        xx=m.np.array([m.coord(v) for v in rr['atoms'].values()])
        yy=m.np.array([m.coord(v) for q in m.chains[other] for v in q['atoms'].values()])
        distance=float(m.np.sqrt(((xx[:,None,:]-yy[None,:,:])**2).sum(2)).min())
        nearest.append({'chain':chain,'label_seq_id':n,'aa':rr['aa'],'nearest_opposing_chain_heavy_atom_distance_angstrom':distance})
geo['comparison_to_agent']['agent_only_nearest_distances']=nearest
save(D/'raw/local-geometry.json',geo);r['local_geometry']=geo
r['agent_turns']=[{'title':t['title'],'duration_seconds':t['duration_seconds'],'step_count':len(t['steps'])} for t in turns]
r['screenshots']={'before_submit':{'status':'missing_capture_failed','replacement':'raw/pre-submit-dom.txt (text evidence only)'},'running':'visuals/02-running-wide.jpg','final_reply_and_3d':'visuals/03-final-reply-and-3d-1920.jpg','zoom':'100% requested via Cmd+0; final viewport 1920x1080, devicePixelRatio 1','exact_per_step_timing':'unknown; UI total turn duration and timestamped snapshots retained'}
save(D/'results.json',r)

comparison='# Independent local geometry validation\n\nThis file is local analysis of the newly downloaded selected sample, not MOS agent output.\n\n'
comparison+=f"A-chain C-alpha RMSD to 5JDS: **{geo['A_CA_RMSD_angstrom']:.6f} Å**, using {geo['A_CA_pairs']} identical sequence-matched C-alpha pairs, no outlier rejection. Predicted A positions 2–116 correspond to reference author chain A (label chain B), author positions 18–132. Reference label chain A is KN035; it must not be fitted as PD-L1.\n\n"
comparison+=f"KN035 C-alpha RMSD after the same PD-L1 fit: {geo['B_CA_RMSD_after_A_fit_angstrom']:.6f} Å over {geo['B_CA_pairs']} pairs.\n\n"
comparison+='4.5 Å heavy-atom contact residues, original prediction label_seq_id:\n\n- A: '+', '.join(map(str,sorted(la)))+'\n- B: '+', '.join(map(str,sorted(lb)))+'\n\n'
comparison+='Agent final epitope A has 19 residues in UniProt numbering; mapping to original model indices gives '+', '.join(map(str,sorted(a)))+'. Agent B has 21 model-index residues.\n\n'
comparison+='| Chain | Agent only | Local only | Shared |\n| --- | --- | --- | --- |\n'
for c,aa,ll in [('A',a,la),('B',b,lb)]:comparison+=f'| {c} | '+(', '.join(map(str,sorted(aa-ll))) or 'none')+' | '+(', '.join(map(str,sorted(ll-aa))) or 'none')+f' | {len(aa&ll)} |\n'
comparison+='\nA:1 (Met1) is the artificial terminal contact explicitly excluded by the agent. Removing that artifact leaves 18 biological A contacts locally, all within the agent list; agent-only A:47 is Asn63 in UniProt numbering. Agent-only B positions are Lys27, Thr110, Tyr117. Their closest heavy-atom distances are:\n\n'
for q in nearest:comparison+=f'- {q["chain"]}:{q["aa"]}{q["label_seq_id"]}: {q["nearest_opposing_chain_heavy_atom_distance_angstrom"]:.6f} Å\n'
comparison+='\nThese are different operational interface definitions (surface burial versus distance), not fields to silently overwrite. Raw coordinates were not changed for the local fit or contact calculation.\n'
(D/'local-validation.md').write_text(comparison)

with (D/'run-log.md').open('a') as f:
    f.write('\n## Final status and deviations\n\n- New MMFold task succeeded. Agent turns reported `Worked for 44s`, `Worked for 7s`, `Worked for 7m 34s` (454 s); only two follow-ups, both exactly `continue`. No steering/model/seed instruction was added.\n- Task tool UI reports start `2026-10-22 01:40:55` and duration `2.0min`; task-list UI local time was `2026-10-22 8:40:55`. The rounded duration is retained as shown, not treated as an exact end timestamp.\n- Final output: sample 1 selected; all five CIFs and confidence JSONs downloaded from this new project, with explicit download receipt hashes and timestamps. All five chain sequences independently verified.\n- Agent did output interface residues: A uses standard PD-L1/UniProt numbering; B uses model indices from Q1. IMGT was used for CDR-region annotation, not the final residue position numbering.\n- Agent independently looked up 5JDS after prediction submission, and downloaded reference coordinates after success for comparison. Prediction payload contains no template. Its intermediate statements are retained without correction in raw UI captures.\n- Agent retries: original CIF import refused because `_mos_mapping` already existed; an initial sanitize command failed; agent stripped mapping metadata, sanitized a viewer-only copy and imported it successfully as work `342949239514112`. Original predicted CIFs retained untouched.\n- Agent comparison retries included failed shell commands, reversed SASA subtraction returning empty sets, water/environment contamination, and an intermediate claim about multiple complexes. These are historical agent claims, not independently endorsed conclusions. Final answer and full command/results captures retained separately.\n- Agent final epitope intentionally omits artificial A:Met1. Local physical 4.5 Å contacts retain it; local biology-only set is separately listed. Differences: agent-only A:47; B:27,110,117. See local-validation.md.\n- Missing required capture: pre-submit screenshot. Multiple screenshot attempts timed out before submission; only pre-submit DOM text exists. The input screenshot was not recreated later.\n- Missing required capture: exact start/end/duration of each individual step. UI exposes only total turn durations; raw CDP was unavailable while resolving a paused document response. All per-step exact timings are `unknown`; timestamped UI observations are retained separately.\n- Initial native wide capture followed a different foreground window; that accidental capture was removed and not used. Later direct browser capture worked after viewport override. Verified running capture is 02-running-wide.jpg (1440 width); final capture is 03-final-reply-and-3d-1920.jpg (1920x1080). The initial native running capture is historical evidence only.\n- The initial 1440 final screenshot clipped the right edge; the 1920x1080 final screenshot was visually verified. No screenshot pixels were edited.\n- No website source code changed. No existing MOS project/task modified, deleted or cancelled. Manifest only receives case 00; existing entries/other values are preserved.\n\n## Timestamped observations\n\n')
    for line in (D/'raw/ui-timeline.jsonl').read_text().splitlines():
        e=json.loads(line);counter=re.findall(r'- button "((?:Working|Worked for)[^"]+)"',e['snapshot'])
        f.write('- '+e['observed_at']+' — '+('; '.join(counter) or 'UI observation')+'\n')

# Update only the newly appended entry, preserving every other manifest value.
manifest=D.parent/'manifest.json';text=manifest.read_text();start=text.index('[',text.index('"cases"'));cases,end=json.JSONDecoder().raw_decode(text,start);assert cases[-1]['id']=='00';old=cases[-1];old_text=json.dumps(old,indent=2);new=dict(old,status=r['status']);new['local_validation']='00-entry/local-validation.md'
# Find final case object with balanced JSON decoding rather than rewriting the manifest.
pos=text.rfind('    {',start,end)
obj_start=text.index('{',pos);found,obj_end=json.JSONDecoder().raw_decode(text,obj_start);assert found['id']=='00'
replacement=json.dumps(new,ensure_ascii=False,indent=2).replace('\n','\n    ')
text=text[:obj_start]+replacement+text[obj_end:];manifest.write_text(text)
before=read(D/'raw/manifest-before.json');after=read(manifest);assert after['cases'][:-1]==before['cases'];a2=dict(after);a2['cases']=a2['cases'][:-1];assert a2==before
save(D/'raw/artifact-inventory.json',[{'path':str(p.relative_to(D)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(D.rglob('*')) if p.is_file() and p.name!='artifact-inventory.json'])
print(json.dumps({'status':r['status'],'step_counts':[len(t['steps']) for t in turns],'A_RMSD':geo['A_CA_RMSD_angstrom'],'comparison':geo['comparison_to_agent']},indent=2))
