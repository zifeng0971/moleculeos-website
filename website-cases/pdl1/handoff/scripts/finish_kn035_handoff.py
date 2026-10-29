"""Generate final run logs, narrative, module status matrix, and additive manifest entries."""
from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
import csv,json,hashlib
ROOT=Path(__file__).resolve().parents[2];NOW=datetime.now(timezone.utc); LOCAL=NOW.astimezone(ZoneInfo('Asia/Jakarta'))
def read(p):return json.loads(p.read_text())
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
names=['02-mmetrics-kn035','03-affinity-kn035','04-developability-kn035','05-denovo-kn035'];D={n:read(ROOT/n/'results.json') for n in names};I={n:read(ROOT/n/'input.json') for n in names}
# Record shared numbering contract and actual input snapshots for web consumption.
for n in names:
 d=D[n];d['observed_utc']=NOW.isoformat();d['time_zone']='Asia/Jakarta';d['residue_highlights']='residues-on-mmfold1.json';d['numbering_contract']='MMFold_1 label_asym_id + label_seq_id; never compact antibody/UniProt/IMGT identifiers';save(ROOT/n/'results.json',d)
status=[]
def st(case,module,source,count,limit=''):
 status.append({'case':case,'module':module,'real_data':True,'source':source,'entry_count':count,'mapped_to_MMfold1':True,'limitation':limit})
st('02','Description','native_UI_and_MMetrics_task',1,'confidence high is classification confidence, not structure confidence')
st('02','Homologs','native_UI_and_MMetrics_task',0,'Native empty result preserved; separate binder pre-analysis BLAST is not substituted')
for section in ['Domain','PTM','UniProt Feature']:
 st('02',section,'native_UI_and_MMetrics_record',0,'Absent/empty in the actual native result; no fabricated entries')
 status[-1]['real_data']=False;status[-1]['mapped_to_MMfold1']=None
st('02','Epitope','native_UI_and_MMetrics_task',19);st('02','Paratope','native_UI_and_MMetrics_task',18);st('02','CDR ranges','native_MMetrics_task',9,'3 schemes x 3 ranges')
st('02','Interaction Network','native_UI_table_and_SVG',44,'Description 51 contacts differs from 44 typed records; local 5 A contact pairs corroborate 51')
for f,d in D['02-mmetrics-kn035']['native_datasets'].items():st('02',f,'native_UI_download',d['rows'])
for f,count in D['02-mmetrics-kn035']['independent_antibody_csv_rows'].items():st('02',f,'independent_MOS_task',count,'Original native panel did not produce these CSVs; supplemental tasks are explicitly separate')
status.append({'case':'02','module':'Native Antibody Design CSVs','real_data':False,'source':'not_emitted_by_native_task','entry_count':0,'mapped_to_MMfold1':None,'limitation':'Original native task did not emit AbAn/AbScN/ParaDt CSVs; separate real supplemental tasks supply the requested data.'})
st('02','Native capture','native_UI_screenshots_DOM_SVG',6,'6 overlapping complete screenshots, full DOM, all tooltip/title attributes, style/viewport/DPR/scrollTop; early captures retained as history')
st('03','Affinity scan','MOS_task',4674,'Schema scores A+B; all A substitutions excluded from candidates. Delta score unit unknown')
st('03','KN035 mutations','filtered_MOS_task',2432);st('03','Variant structures','MOS_MMfold_plus_local_sequence_geometry_audit',25,'5 variants x 5 samples; confidence is not affinity; erroneous S128W task excluded')
for label in ['Structural Stability','Sequence Fitness','Evolutionary Effect']:st('04',label,'MOS_task',2560,'Dimensionless model fitness; mutant minus same-site WT; generic sequence score chain A maps to master B')
st('04','Local sequence risk','local_analysis',D['04-developability-kn035']['local_analysis']['risk_flag_count'],'Motif flags, not measured degradation probability')
st('04','Framework candidates','local_screen_of_MOS_scores',6,'Protect union of all 3 CDR schemes, paratope and 4 cysteines; candidates have no new validated structures')
st('04','Affinity x Developability','local_merge_of_MOS_outputs',11,'5 mutation types have sequence-verified predicted structures; all are experimentally unverified')
st('05','De novo runs','MOS_Protein_Binder_Design',3,'Seeds111/222/333; no existing binder input; 60-100 aa design range')
st('05','Raw complexes','MOS_task',6,'3 virtual GLY backbone CIFs + 3 designed-sequence complex CIFs')
st('05','Hotspots','native_epitope_plus_local_SASA',6,'Target-only input retains all 118 residues; output target B maps to master A')
st('05','Alignment/contact/BSA/rank','local_geometry',3,'BSA=(isolated SASA sum-complex SASA)/2; 4.5 A contacts; geometry ranking only')
status.append({'case':'05','module':'Explicit ipTM / pLDDT / PAE summary','real_data':False,'source':'not_supplied_by_MOS','entry_count':0,'mapped_to_MMfold1':None,'limitation':'No confidence summary supplied. Raw CIF atom-site B values retained without assigning an unverified confidence meaning.'})
save(ROOT/'handoff/KN035_STATUS.json',{'observed_utc':NOW.isoformat(),'local_time':LOCAL.isoformat(),'modules':status,'all_tasks_for_used_data_complete':True,'required_native_scope_exceptions':['Original MMetrics Antibody Design CSVs missing; four independent supplemental tasks supplied instead','Original Domain/PTM absent and UniProt/Homologs empty'],'excluded_tasks':['342605442536448 (wrong MMFold sequence S128W)','342605433852928 (mis-transcribed evolutionary sequence)']})
md='# KN035 任务与数据状态\n\n截至 '+LOCAL.strftime('%Y-%m-%d %H:%M:%S')+'（Asia/Jakarta）。用于交付的数据任务均已完成并下载；没有仍在运行的任务被标为完成。\n\n|案例|模块|取得真实数据|来源|条目数|回到 MMFold_1 编号|限制|\n|---|---|---|---|---:|---|---|\n'
for x in status:md+=f"|{x['case']}|{x['module']}|{'是' if x['real_data'] else '无条目或缺失'}|{x['source']}|{x['entry_count']}|{'是' if x['mapped_to_MMfold1'] else '不适用'}|{x['limitation']}|\n"
md+='\n原生缺项保留为空；独立补充任务不算作原生面板文件。完整模块状态也见 `KN035_STATUS.json`。\n\n错误任务342605442536448、342605433852928保留在MOS，已明确排除其数据。没有修改或删除旧项目、旧任务、旧案例目录。\n'
md+='\n## 实际任务ID索引\n\n|案例|任务|ID|结果使用状态|\n|---|---|---|---|\n'
for n in names:
 d=D[n]; ts=(d.get('native_tasks',[])+d.get('independent_antibody_tasks',[])) if n.startswith('02') else d['tasks']
 for task in ts:
  label=task.get('task_type',task.get('task_name','de novo seed '+str(task.get('random_seed',''))))
  excluded=('EXCLUDED' in str(task) or 'VOID' in str(task))
  md+=f"|{n.split('-')[0]}|{label}|{task['task_id']}|{'排除错误输入，任务保留' if excluded else '使用真实完成输出'}|\n"
(ROOT/'handoff/KN035_STATUS.md').write_text(md)
# Every case has a reproducible entrypoint and source-separated results.
for n in names:
 p=ROOT/n;inp=I[n];tasks=D[n].get('tasks',D[n].get('native_tasks',[]));log='# '+n+' 执行记录\n\n'
 log+=f"项目：{inp['project_url']}\n\n对象：{inp['mos_object_id']}；work：{inp['mos_work_id']}。\n\n唯一主结构：`01-structure/raw/MMFold_1.cif`，SHA256 `{inp.get('master_sha256',inp.get('input_file_sha256'))}`。原始主文件未改动、未重新预测。\n\n"
 log+='提交 prompt 原文在本目录 `raw/submitted-*.txt`，并嵌入 input.json；实际任务 payload、对象与输入 hash、链映射均见 input.json。任务的 schema、原始输出、MOS端导出分析分别保留在 raw/mos-export。最终规范结果使用顶层 results.json，本地审计见 raw/local。历史 checkpoint 保留原时点状态，不能取代最终 results.json。\n\n'
 if n.startswith('02'):
  log+='主结构导入后核对链A118/链B128及完整序列。自动任务342604299285504用时1.1min；原生MMetrics任务342604577018880用时3s。首次面板显示Generating/Computing，随后实际完成，捕获记录见visuals/native-initial.png及native-complete-*.png。\n\n独立补充：AbAn342606092895232（20s）、AbLang342606094599168（3s）、AbNatiV342606097245184（3s）、ParaDt342606100722688（25s），全部succeed。四份原生MutX和四份独立抗体CSV全行保留，逐行WT及编号核验通过。Domain/PTM/UniProt等原生缺项如实为空。\n\n'
 elif n.startswith('03'):
  log+='真实亲和力任务342605020787712，37s。全表4674行；仅2432条B链替换进入排名，A始终保留原序列。界面优先按位点去重前三为V109L、Q116M、T105L。另保留A35W远端命中和C33Y二硫键破坏的反例预测。五个变体共25份结构与25份confidence JSON，全部核对完整A序列和B唯一替换。\n\n错误任务342605442536448实际提交S128W而非A35W，保留MOS任务但排除结果。采用正确A35W任务342605501072384。所有结构对齐与接触在本地重新计算，不能直接使用MOS端对话里的早期调试数字。原始C33Y confidence JSON的pTM=0.598656、ipTM=0.260212，raw ledger早期把两者混淆；规范results使用原始JSON。\n\n'
 elif n.startswith('04'):
  log+='使用本地按链精确提取的B结构，坐标与主文件逐原子相等，导入hash与本地派生文件相同。三项评分2560行/项，全行WT验证；sequence/evolution输出泛称链A，明确映射为主结构B。稳定性342605430273024（2s）、序列342605430948864（3s）、正确进化任务342605471151104（1.2min；任务列表09:25:14→09:26:25）。错误125aa进化输入342605433852928排除，未删任务。\n\n规范筛选保护IMGT/Kabat/Chothia的CDR并集、原生Paratope及B22/B33/B96/B106，最后6个候选。MOS端IMGT-only分析中的L60Y、K50S/A属于Kabat CDR2，不列入最终框架清单。11行亲和力交叉表已回填T105L ΔΔG，5个变体类型的结构状态由本地25份CIF核验后更新；候选与实验验证严格区分。\n\n'
 else:
  log+='靶点仅来自MMFold_1链A，118残基全部保留；六个热点来自02原生Epitope并经本地暴露/埋藏面积筛选。schema支持compare_binder=1，三次独立seed111/222/333均已完成：平台报告等待至完成分别3.7/6.7/9.7min，Task List的创建→更新分别09:27:57→09:31:37、09:27:57→09:34:36、09:27:58→09:37:39（Asia/Jakarta）。中间RUNNING/PENDING原文快照完整保留。\n\n输入A=PD-L1；输出B=PD-L1、输出A=新binder，118行输出靶点映射已保存；新binder无MMFold_1同源位置，不强行映射。虚拟全G骨架与真实设计FASTA分开。三次仅有两份CIF/次，没有显式ipTM/pLDDT/PAE汇总；原始CA B值另存。\n\n本地按残基ID重新计算热点距离、4.5Å接触、118个CA对齐和BSA，规范值见results.json。MOS导出分析中的热点索引/混合界面定义不作为规范结果：Gemmi的整数链索引与残基ID不同，raw报告的BSA total是双侧SASA损失之和，顶层BSA定义为其一半；接触重合只用明确4.5Å阈值，不混入SASA损失位点。\n\n'
 log+='最终状态：'+D[n]['status']+'。\n\n完整逐模块总表见 `../handoff/KN035_STATUS.md`。\n';(p/'run-log.md').write_text(log)
 repro='# 复现说明\n\n使用保留的原始下载数据复算，不会重新提交MOS任务。环境为Biopython 1.88、numpy 2.4.6；可视化额外使用matplotlib 3.11.2，与既有handoff/analysis-requirements.txt一致。\n\n从仓库根目录按顺序运行：\n\n```sh\npython website-cases/pdl1/handoff/scripts/prepare_kn035.py\npython website-cases/pdl1/handoff/scripts/build_kn035_case02.py\npython website-cases/pdl1/handoff/scripts/finish_kn035_antibody.py\npython website-cases/pdl1/handoff/scripts/build_kn035_scoring.py\npython website-cases/pdl1/handoff/scripts/audit_kn035_structures.py\npython website-cases/pdl1/handoff/scripts/audit_kn035_denovo.py\n```\n\n脚本校验唯一主文件hash、全部序列、WT身份、逐残基映射和派生文件坐标。源数据的数值字符串完整保留。GUI复现须在本案例新项目中使用input.json的真实输入、prompt、schema及payload；原生面板缺失项不人工补造。\n\n'+('详细原生采集口径见 `MMETRICS_REPRODUCTION.md`。\n' if n.startswith('02') else '规范分析以顶层results.json及raw/local为准；raw/mos-export保留当时的真实平台输出及调试分析，个别早期摘要已被本地审计更正。\n')
 (p/'REPRODUCTION.md').write_text(repro)
# Narrative links describe actual dependency files rather than claiming experimental improvement.
v03=D['03-affinity-kn035']['variant_models'];v05=D['05-denovo-kn035']['candidates'];fr=D['04-developability-kn035']['framework_candidates']
narr='''# 一个复合物贯穿01–05：PD-L1 / KN035\n\n唯一主结构是 `01-structure/raw/MMFold_1.cif`，SHA256 `d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317`。来自MOS项目342242986152960、MMFold任务342253805564928；A=人PD-L1构建体118 aa、B=KN035 VHH128 aa，无轻链。此文件未修改、未替换、未重新预测。所有新任务只读此文件或原样提取链A/B；未以5GRJ、7XYQ、5JDS作输入。BLAST输出可包含5JDS命中名称，那是原生检索返回，不是任务输入结构。\n\n## 01 → 02：从预测复合物到界面解读\n\n01的同一个MMFold_1直接导入02新项目。链、序列、246个label/auth编号与MOS编号逐位一致；完整映射在`02-mmetrics-kn035/raw/residue-numbering-map.json`。原生MMetrics给出A链Epitope19位点、B链Paratope18位点、三套CDR范围和44条带类型相互作用。原生Homologs为空；Domain/PTM缺失、UniProt为空，按实际输出保留。AbAn/AbScN/ParaDt CSV原生未产出，四个独立任务补齐，明确另标来源。\n\n02→03/04/05的共同消费文件是`02-mmetrics-kn035/residues-on-mmfold1.json`；原生列表来源可追溯到`raw/mos-export/kn035_case02/raw/native_task_342604577018880/record.json`，不能用本地4.5Å接触替代原生列表。抗体CSV紧凑号映射另见`02-mmetrics-kn035/raw/antibody-csv-compact-to-mmfold1.json`。\n\n## 02 → 03：在原有界面上比较更强结合的预测候选\n\n03输入仍为同一MMFold_1；A序列不变，仅推荐B替换。工具schema会枚举双方全表，4674行全部保留，2432条B链替换单独排序。两个排名分别是全B和原生Paratope优先；按界面位点去重的前三是V109L、Q116M、T105L，均有5份真实MMFold变体复合物。另有A35W远端命中和C33Y破坏二硫键的诊断性反例。\n\n03不是“已实测变强”：ΔΔG列只有预测方向，单位未被本次schema/CSV声明，保留unknown；置信度只是预测结构自信程度。网站应使用`03-affinity-kn035/results.json`和两份候选JSON，突变位置/它面对的A残基使用`residues-on-mmfold1.json`。25份结构逐一验证：A原序列118aa不变、B128aa只改一个指定位点、label编号1:1。\n\n'''
narr+='|变体|任务ID|best ipTM|best pLDDT|全B链CA RMSD（按PD-L1对齐，Å）|\n|---|---|---:|---:|---:|\n'
for v in v03:
 best=next(x for x in v['samples'] if x['sample']==v['best_sample']);narr+=f"|{v['mutation']}|{v['task_id']}|{v['best_confidence_raw']['iptm']:.4f}|{v['best_confidence_raw']['plddt']:.2f}|{best['local_geometry']['binder_B_CA_RMSD_after_A_alignment_A']:.3f}|\n"
narr+='''\nbest按原始ranking_score选；V109L另外4个样本ipTM低，不能只展示最好一份。A35W/C33Y的低界面置信度及明显重排不是原界面亲和力已提升的证据。所有样本、原始confidence、对齐结果都保留。\n\n## 03 → 04：亲和力与可开发性同时看\n\n04输入是原主结构B单链，提取脚本/坐标等同性/文件hash见`04-developability-kn035/raw/MMFold_1_chain_B.provenance.json`。三项评分各2560行。序列模型输出链A只是单序列工具的默认标签，逐位映射到主结构B；不能上色到PD-L1。\n\n03真实MutXaff候选与04三项评分按B链位置、WT与mutant精确连接，输出`04-developability-kn035/affinity-candidates-x-developability.json`及CSV（11行）。T105L ΔΔG已回填；5个变体类型标记“预测结构的序列已核验”，其他仅有分数，没有实验验证。C33Y虽亲和力列看似有利，却破坏B33–B106，明确排除开发推荐。\n\n开发筛选保护三套CDR并集、原生Paratope和B22/B33/B96/B106；两对SG几何距离为2.066Å和2.180Å。用同位点WT→WT为基线比较mutant−WT，三模型是无量纲fitness，不是假造的稳定性ΔΔG/表达量/溶解度。当地序列风险分析另标“本地分析”，只是motif筛查。\n\n最终框架单点候选：'''+', '.join(v['mutation'] for v in fr)+'''。它们尚无新结构或实验验证；保留每个模型正负取舍及R47 hallmark/界面邻近风险。MOS端IMGT-only的9候选为历史导出，规范结果采用更严格并集后的6个。\n\n## 02 → 05：在KN035占据的同一PD-L1面上设计全新binder\n\n05从同一MMFold_1删去B，保留全部A1–118及原坐标。用02原生Epitope，再按游离靶点溶剂暴露（SASA≥20Å²）和界面埋藏筛选6个热点A45/A40/A97/A107/A105/A38，详见`05-denovo-kn035/raw/hotspot-selection.json`。三次真实Protein Binder Design输入都只有此靶点，不含KN035或任何既有binder；contigs=A1-118/0 60-100、compare_binder=1、seed111/222/333。\n\n输出链角色交换：输出B=PD-L1，对回主结构A1–118；输出A=新binder，其残基在MMFold_1没有对应物。逐残基映射在`05-denovo-kn035/raw/residue-numbering-map.json`，网站只把靶点热点/接触映回主结构；展示新binder必须加载经PD-L1对齐后的设计结构，不能把新binder的A链误涂到主结构A链。全G虚拟骨架与真实设计序列的FASTA/CIF明确分开。\n\n'''
narr+='|seed|任务ID|binder aa|PD-L1 CA RMSD Å|BSA Å²|4.5Å接触覆盖原生表位|Ala比例|\n|---|---|---:|---:|---:|---|---:|\n'
for v in sorted(v05,key=lambda x:x['seed']):
 g=v['local_interface_metrics'];narr+=f"|{v['seed']}|{v['task_id']}|{v['binder_length']}|{v['target_CA_RMSD_to_MMfold1_A']:.3f}|{g['buried_surface_area_A2']:.1f}|{len(g['native_epitope_intersection_label_seq_ids'])}/19|{v['designed_sequence_A_fraction']:.1%}|\n"
narr+='''\n本地BSA统一为(两条游离链SASA之和−复合物SASA)/2，接触阈值4.5Å。MOS端早期报告按总SASA损失/混合SASA界面算出的数字保留在raw中，不与规范口径混用。排名按接触重合Jaccard、热点参与和BSA排序，仅为几何排序。3个binder都在同一表位区域，但各有偏移，未声称完整覆盖全部热点。\n\n平台没有给ipTM/PAE或显式pLDDT汇总；原始CIF CA B字段另存，未自行解释为置信度。序列存在明显Ala偏高（尤其seed222），不能把这三条讲成成熟、验证有效的binder。\n\n## 网站读取契约与交付边界\n\n每个新目录的`input.json`记录实际项目URL、对象、hash、链映射、提交prompt及任务payload；`results.json`是规范数值，`residues-on-mmfold1.json`是3D上色入口；raw/native-ui、raw/mos-export、raw/local严格标注来源，历史checkpoint不作为最终状态。\n\nmanifest保留原01–05记录，追加4条-kn035记录，KN035 narrative列出01原记录和4条新记录。前端应明确选用KN035这一组，不能继续把旧02–05混入本叙事。本次交付是案例数据及交接文件，没有把旧前端数据引用自动改成新引用。\n\n完整逐模块数据量、映射与限制见`KN035_STATUS.md`和`KN035_STATUS.json`。所有真实输入输出均保留；唯一主文件及旧目录未改动，旧MOS项目/任务未修改或删除。\n'''
(ROOT/'handoff/KN035_NARRATIVE.md').write_text(narr)
# Add records; retain old case definitions exactly.
p=ROOT/'manifest.json';manifest=read(p)
for n in names:
 cid=n.split('-')[0]+'-kn035';entry={'id':cid,'directory':n,'status':D[n]['status'],'input':n+'/input.json','results':n+'/results.json','residues':n+'/residues-on-mmfold1.json','run_log':n+'/run-log.md','reproduction':n+'/REPRODUCTION.md','project_url':I[n]['project_url'],'narrative':'kn035_mmfold1','master_structure':'01-structure/raw/MMFold_1.cif'}
 existing=next((j for j,x in enumerate(manifest['cases']) if x['id']==cid),None)
 if existing is None:manifest['cases'].append(entry)
 else:manifest['cases'][existing]=entry
manifest['narratives']=manifest.get('narratives',{});manifest['narratives']['kn035_mmfold1']={'case_ids':['01','02-kn035','03-kn035','04-kn035','05-kn035'],'master_structure':'01-structure/raw/MMFold_1.cif','master_sha256':'d32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317','handoff':'handoff/KN035_NARRATIVE.md','status':'completed_with_documented_native_scope_model_and_unit_limits','module_status':'handoff/KN035_STATUS.json'}
for f in ['handoff/KN035_NARRATIVE.md','handoff/KN035_STATUS.md','handoff/KN035_STATUS.json']:
 if f not in manifest['handoff']:manifest['handoff'].append(f)
manifest['generated_at']=LOCAL.isoformat();manifest['status']='historical_cases_preserved_plus_KN035_narrative_with_documented_limits';manifest['notes']+=[]
notes=['KN035 canonical data uses each new top-level results.json and residues-on-mmfold1.json; historical checkpoints and MOS-side exploratory analyses remain raw audit material.','De novo novel binder residues have no MMFold_1 correspondence. Output target chain B maps to master chain A.']
for x in notes:
 if x not in manifest['notes']:manifest['notes'].append(x)
# Full inventory, excluding manifest itself and OS metadata, with current hashes.
files=[]
for f in sorted(ROOT.rglob('*')):
 if not f.is_file() or f==p or f.name=='.DS_Store':continue
 b=f.read_bytes();files.append({'path':str(f.relative_to(ROOT)),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
manifest['files']=files;manifest['file_count']=len(files);manifest['total_bytes']=sum(f['bytes'] for f in files);save(p,manifest)
print({'cases':len(manifest['cases']),'modules':len(status),'files':len(files),'total_bytes':manifest['total_bytes']})
