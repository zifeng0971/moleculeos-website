"""Compare both real de novo rounds on identical local geometry and composition definitions."""
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
import csv,hashlib,itertools,json,math
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'05-denovo-kn035';R2=BASE/'round2'
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
first=read(BASE/'results.json');second=read(R2/'results.json');assert first['available_design_count']==second['available_design_count']==3
baseline=read(R2/'raw/round1-before-rerun-hashes.json')
for path,h in baseline.items():assert sha(BASE/path)==h,('round1 modified',path)
oldpayload=read(BASE/'raw/mos-export/kn035_case05/payloads/payload_seed111.json');newinput=read(R2/'input.json')
for t in newinput['task_payloads']:
 p=t['payload'];assert {k:v for k,v in p.items() if k!='random_seed'}=={k:v for k,v in oldpayload.items() if k!='random_seed'}
assert [x['seed'] for x in newinput['task_payloads']]==[444,555,666]
rows=[]
for rn,d in [(1,first),(2,second)]:
 for c in sorted(d['candidates'],key=lambda x:x['seed']):
  s=c['designed_sequence'];freq=Counter(s);entropy=-sum(n/len(s)*math.log2(n/len(s)) for n in freq.values());g=c['local_interface_metrics'];maxrun=max(sum(1 for _ in grp) for a,grp in itertools.groupby(s));dist=c['hotspot_distances']
  r={'round':rn,'seed':c['seed'],'task_id':c['task_id'],'binder_length':len(s),'designed_sequence':s,'Ala_fraction':s.count('A')/len(s),'unique_amino_acid_count':len(freq),'sequence_entropy_bits_per_residue':entropy,'maximum_identical_residue_run':maxrun,'target_CA_RMSD_A':c['target_CA_RMSD_to_MMfold1_A'],'BSA_A2':g['buried_surface_area_A2'],'epitope_contact_count_4_5_A':len(g['native_epitope_intersection_label_seq_ids']),'epitope_total':19,'native_epitope_overlap_fraction':g['native_epitope_overlap_fraction'],'native_epitope_Jaccard':g['native_epitope_Jaccard'],'hotspots_contacted_4_5_A':c['hotspots_engaged_within_4_5_A'],'hotspot_count':6,'minimum_hotspot_distance_A':min(x['minimum_heavy_atom_distance_to_new_binder_A'] for x in dist),'maximum_hotspot_distance_A':max(x['minimum_heavy_atom_distance_to_new_binder_A'] for x in dist),'structure':c['structure'],'backbone_structure':c['backbone_structure'],'iptm':c['confidence']['ipTM'],'PAE':c['confidence']['PAE'],'source_kind':'MOS_de_novo_output_plus_identical_local_analysis','experimental_validation':False}
  rows.append(r)
pairs=[]
for a,b in itertools.combinations(rows,2):
 pairs.append({'seed_a':a['seed'],'seed_b':b['seed'],'sequences_identical':a['designed_sequence']==b['designed_sequence'],'structures_byte_identical':sha(ROOT/a['structure'])==sha(ROOT/b['structure'])})
firststats={'best_epitope_contact_count':max(x['epitope_contact_count_4_5_A'] for x in rows if x['round']==1),'lowest_Ala_fraction':min(x['Ala_fraction'] for x in rows if x['round']==1),'highest_hotspot_contact_count':max(x['hotspots_contacted_4_5_A'] for x in rows if x['round']==1)}
secondstats={'best_epitope_contact_count':max(x['epitope_contact_count_4_5_A'] for x in rows if x['round']==2),'lowest_Ala_fraction':min(x['Ala_fraction'] for x in rows if x['round']==2),'highest_hotspot_contact_count':max(x['hotspots_contacted_4_5_A'] for x in rows if x['round']==2)}
report={'observed_utc':datetime.now(timezone.utc).isoformat(),'project_url':'https://mos.moleculemind.com/?projectId=342605363971072','round1_preserved_byte_for_byte':True,'round1_files_verified_unchanged':len(baseline),'control':'Same target object/hash, hotspot set, length range, sequence generation and complex prediction; only seeds differ.','score_definitions':{'contacts':'Minimum inter-residue heavy atom distance <=4.5 A','BSA':'(sum isolated chain SASA - complex SASA)/2; Biopython ShrakeRupley probe1.4A,960 points','target_alignment':'All 118 PD-L1 C-alpha atoms fitted to master MMFold_1 chain A','sequence_composition':'Ala fraction, distinct amino acids, Shannon entropy, longest identical-residue run; descriptors only, not validated developability scores'},'round1_summary':firststats,'round2_summary':secondstats,'rows':rows,'pairwise_duplicates':pairs,'limitations':['No measured binding. Local geometry and sequence descriptors cannot establish affinity, expression or folding stability.','Confidence summaries remain unavailable if not emitted by MOS; no invented scores.','Both rounds and all three new runs are retained even if quality does not improve.']}
save(BASE/'round-comparison.json',report)
with (BASE/'round-comparison.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
md='# PD-L1 de novo 第二轮与首轮对比\n\n同一PD-L1目标对象、同一六热点、60–100aa及compare_binder=1，仅随机seed不同。首轮'+str(len(baseline))+'个文件逐字节未改。下表全部采用一致的4.5Å接触、按PD-L1 118个CA对齐及单侧BSA定义。\n\n|轮次|seed|任务ID|长度|Ala比例|连续相同残基最大长度|原生表位覆盖|热点参与|BSA Å²|靶点CA RMSD Å|\n|---|---|---|---:|---:|---:|---|---|---:|---:|\n'
for x in rows:md+=f"|{x['round']}|{x['seed']}|{x['task_id']}|{x['binder_length']}|{x['Ala_fraction']:.1%}|{x['maximum_identical_residue_run']}|{x['epitope_contact_count_4_5_A']}/19|{x['hotspots_contacted_4_5_A']}/6|{x['BSA_A2']:.1f}|{x['target_CA_RMSD_A']:.3f}|\n"
md+='\n几何覆盖和序列组成分别比较，不合成为未经验证的“质量分”。全部真实设计序列、结构、热点距离、SASA与逐残基映射见round2/results.json及round-comparison.json。全G虚拟骨架从不当成真实设计序列。\n\n'
md+=f"首轮最好表位覆盖{firststats['best_epitope_contact_count']}/19，第二轮最好{secondstats['best_epitope_contact_count']}/19；首轮最低Ala比例{firststats['lowest_Ala_fraction']:.1%}，第二轮最低{secondstats['lowest_Ala_fraction']:.1%}。这些只是观察值；是否真正结合更强仍没有实验证据。\n"
(BASE/'ROUND2_COMPARISON.md').write_text(md)
validation={'status':'passed','round1_preserved_byte_for_byte':True,'round1_file_count':len(baseline),'all_three_payloads_differ_only_in_seed':True,'round2_designs':3,'full_target_sequences_and_mapping_verified':True,'input_master_sha256':first['master_sha256'],'new_binder_sequences_identical_to_any_round1':any(p['sequences_identical'] for p in pairs if p['seed_a']<=333 and p['seed_b']>=444),'raw_inputs_and_outputs_retained':True}
save(R2/'validation.json',validation)
# Plot the actual six observations; no combined or simulated quality score.
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
fig,ax=plt.subplots(figsize=(7.6,4.6))
for rn,color,label in [(1,'#9699a3','Round 1'),(2,'#208c7b','Round 2')]:
 group=[x for x in rows if x['round']==rn]
 ax.scatter([100*x['Ala_fraction'] for x in group],[x['epitope_contact_count_4_5_A'] for x in group],color=color,s=65,label=label)
 for i,x in enumerate(group):ax.annotate(str(x['seed']),(100*x['Ala_fraction'],x['epitope_contact_count_4_5_A']),xytext=(5,7+6*(i%2)),textcoords='offset points',fontsize=9,color=color)
ax.set(xlabel='Alanine content in designed sequence (%)',ylabel='Native epitope residues contacted (of 19)',ylim=(-.5,20.3),xlim=(0,100),title='Same PD-L1 target: six independent de novo runs')
ax.set_yticks([0,5,10,15,19]);ax.spines[['top','right']].set_visible(False);ax.legend(frameon=False);fig.text(.12,.015,'Local 4.5 A contacts and sequence composition; no experimental binding claim.',fontsize=8.5,color='#555');fig.tight_layout(rect=(0,.04,1,1));fig.savefig(R2/'visuals/round-comparison.png',dpi=180);plt.close(fig)

# Append the second round without rebuilding or changing first-round case files.
now=datetime.now(ZoneInfo('Asia/Jakarta'));r2input=read(R2/'input.json');r2result=read(R2/'results.json');marker='\n<!-- KN035_DENOVO_ROUND2 -->\n'
narrpath=ROOT/'handoff/KN035_NARRATIVE.md';old=narrpath.read_text().split(marker)[0];narrpath.write_text(old+marker+'\n## 用户授权追加：de novo第二轮\n\n首轮全部保留，第二轮seed444/555/666已独立完成；仍使用同一PD-L1输入和六热点，只有随机种子改变。第二轮规范结果位于`05-denovo-kn035/round2/results.json`，两轮六设计的同口径对比位于`05-denovo-kn035/ROUND2_COMPARISON.md`及`round-comparison.json`。原生文件与映射单独留在round2，未覆盖首轮。\n')
statuspath=ROOT/'handoff/KN035_STATUS.md';old=statuspath.read_text().split(marker)[0];extra='\n## de novo第二轮状态\n\n|seed|任务ID|状态|真实输出|主结构映射|\n|---|---|---|---|---|\n'
for c in sorted(r2result['candidates'],key=lambda x:x['seed']):extra+=f"|{c['seed']}|{c['task_id']}|Succeed，输出已下载|虚拟骨架CIF、设计复合物CIF、分类FASTA|靶点118/118；新binder无主结构对应|\n"
statuspath.write_text(old+marker+extra+'\n两轮对比见`../05-denovo-kn035/ROUND2_COMPARISON.md`；第二轮原始payload仅seed不同，首轮文件hash核验未变。\n')
p=ROOT/'handoff/KN035_STATUS.json';d=read(p);d['de_novo_round2']={'observed_local':now.isoformat(),'status':'three_runs_completed_and_locally_verified','seeds':[444,555,666],'task_ids':[x['task_id'] for x in r2result['candidates']],'results':'05-denovo-kn035/round2/results.json','comparison':'05-denovo-kn035/round-comparison.json'};save(p,d)
log='# de novo第二轮执行记录\n\n用户授权追加三次随机运行；seed444/555/666。项目：'+r2input['project_url']+'。\n\n首轮参数程序化复制，仅改变seed。真实输入payload和提交prompt在input.json及raw/submitted-prompt.txt；原始schema、task ledger、运行/排队及完成快照保留于raw/mos-export。平台等待时间按原始ledger和Task List记录，不把中间Pending/Running称为完成。\n\n首轮'+str(len(baseline))+'个文件全部hash核验未改，第二轮六份CIF与FASTA独立保存。输入目标仍为主MMFold_1的链A，输出B映回主A1–118，新binder输出A无主结构残基对应。虚拟全G骨架和设计序列分开。\n\n本地沿用首轮算法复核三份复合物：完整118aa靶点、全部编号映射、118个CA对齐、4.5Å重原子接触、六热点距离与ShrakeRupley SASA/BSA。结果在results.json，跨轮六设计对比在../round-comparison.json。没有用本地几何值冒充MOS原生评分，置信度没有则为空。\n\n'
for x in r2result['tasks']:log+='任务 '+x['task_id']+'：'+str(x.get('status','see raw status snapshots'))+'；平台记录用时 '+str(x.get('duration',x.get('elapsed','see task ledger')))+'。\n\n'
log+='复算：`python website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py --round 2`，再运行`compare_kn035_denovo_rounds.py`。\n';(R2/'run-log.md').write_text(log)
(R2/'REPRODUCTION.md').write_text('# 第二轮复现\n\n输入目标与首轮相同，唯一改变random_seed为444/555/666。input.json保留每个真实提交payload与来源，raw/mos-export保留平台输出，不需要重新提交即可复核：\n\n```sh\npython website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py --round 2\npython website-cases/pdl1/handoff/scripts/compare_kn035_denovo_rounds.py\n```\n\nBiopython1.88/numpy2.4.6。比较文件显示全部六个设计，避免仅保留最好结果。\n')
p=ROOT/'manifest.json';m=read(p);entry={'id':'05-kn035-round2','directory':'05-denovo-kn035/round2','status':r2result['status'],'input':'05-denovo-kn035/round2/input.json','results':'05-denovo-kn035/round2/results.json','residues':'05-denovo-kn035/round2/residues-on-mmfold1.json','run_log':'05-denovo-kn035/round2/run-log.md','reproduction':'05-denovo-kn035/round2/REPRODUCTION.md','project_url':r2input['project_url'],'narrative':'kn035_mmfold1','master_structure':'01-structure/raw/MMFold_1.cif','round':2,'seeds':[444,555,666]};idx=next((i for i,c in enumerate(m['cases']) if c['id']==entry['id']),None)
if idx is None:m['cases'].append(entry)
else:m['cases'][idx]=entry
m['narratives']['kn035_mmfold1']['additional_de_novo_rounds']=['05-kn035-round2'];m['narratives']['kn035_mmfold1']['de_novo_comparison']='05-denovo-kn035/round-comparison.json';m['generated_at']=now.isoformat();m['files']=[]
for f in sorted(ROOT.rglob('*')):
 if not f.is_file() or f==p or f.name=='.DS_Store' or '__pycache__' in f.parts:continue
 b=f.read_bytes();m['files'].append({'path':str(f.relative_to(ROOT)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
m['file_count']=len(m['files']);m['total_bytes']=sum(x['bytes'] for x in m['files']);save(p,m)
print(json.dumps({'round1_summary':firststats,'round2_summary':secondstats,'round1_files_unchanged':len(baseline),'new_seeds':[(x['seed'],x['Ala_fraction'],x['epitope_contact_count_4_5_A']) for x in rows if x['round']==2]},indent=2))
