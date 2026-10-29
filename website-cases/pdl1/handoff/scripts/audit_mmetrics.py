from pathlib import Path
from datetime import datetime,timezone
import json,csv,re,math
from Bio.PDB.MMCIF2Dict import MMCIF2Dict
from Bio.SeqUtils import seq1
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root=Path(__file__).resolve().parents[2];p=root/'02-mmetrics';q=p/'raw/mos-export/case02_complete'
src=MMCIF2Dict(str(root/'sources/5GRJ.cif'));mos=MMCIF2Dict(str(q/'00_structure/5GRJ_mos_sanitized.cif'))
seqs={e:''.join(s.split()) for e,s in zip(src['_entity_poly.entity_id'],src['_entity_poly.pdbx_seq_one_letter_code_can'])}
ce=dict(zip(src['_struct_asym.id'],src['_struct_asym.entity_id']));seqs={c:seqs[ce[c]] for c in ['A','B','C']}
maps={};mos_atoms={}
for d,dest in [(src,maps),(mos,mos_atoms)]:
    for c,pos,auth,num,aa in zip(d['_atom_site.label_asym_id'],d['_atom_site.label_seq_id'],d['_atom_site.auth_asym_id'],d['_atom_site.auth_seq_id'],d['_atom_site.label_comp_id']):
        if pos!='.':dest[(c,int(pos))]={'chain':c,'label_seq_id':int(pos),'auth_chain':auth,'auth_seq_id':int(num),'aa':seq1(aa)}
assert set(maps)==set(mos_atoms)
for key,x in maps.items():assert x['aa']==seqs[key[0]][key[1]-1] and x['aa']==mos_atoms[key]['aa']
canonical=[]
for c,role in [('A','VH'),('B','VL'),('C','PD-L1')]:
    observed=sorted(n for ch,n in maps if ch==c);missing=[i for i in range(1,len(seqs[c])+1) if (c,i) not in maps]
    canonical.append({'mos_chain':c,'original_auth_chain':maps[(c,observed[0])]['auth_chain'],'role':role,'entity_sequence':seqs[c],'entity_length':len(seqs[c]),'modeled_residue_count':len(observed),'modeled_label_min':min(observed),'modeled_label_max':max(observed),'unmodeled_label_positions':missing})
ledger=json.loads((q/'07_provenance/task_ledger.json').read_text());rows=list(csv.DictReader((q/'06_mutations/all_scores_long.csv').open()))
for r in rows:assert seqs[r['chain']][int(r['position'])-1]==r['wt']
raw_axes={k:{} for k in ['seqfit','evolve','struct','affinity_ddG']};raw_counts={}
for t in ledger['tasks']:
    for filename in t.get('raw_files',[]):
        axis={'sequence_scores.csv':'seqfit','evolutionary_scores.csv':'evolve','struct_fitness_scores.csv':'struct','affinity_scores.csv':'affinity_ddG'}.get(filename)
        if not axis:continue
        f=next((q/'08_tasks').glob(f"{t['task_id']}_*/{filename}"));raw=list(csv.DictReader(f.open()));raw_counts[t['task_id']]=len(raw)
        for r in raw:
            if axis=='affinity_ddG':
                m=re.fullmatch(r'([A-Z])([A-Z])(\d+)([A-Z])',r['mutstr']);wt,c,n,mut=m.groups();value=float(r['ddG_pred'])
            else:
                m=re.fullmatch(r'([A-Z])(\d+)([A-Z])',r['mutation']);wt,n,mut=m.groups();c=t['chain'] if axis in ['seqfit','evolve'] else r['chain'];value=float(r['score'])
            assert seqs[c][int(n)-1]==wt
            raw_axes[axis][(c,int(n),wt,mut)]=value
errors=[]
for r in rows:
    key=(r['chain'],int(r['position']),r['wt'],r['mut'])
    for axis,lookup in raw_axes.items():
        if r[axis] not in ('','nan','NaN'):
            if key not in lookup or abs(float(r[axis])-lookup[key])>1e-6:errors.append((key,axis))
assert not errors,errors[:5]
self_rows=sum(r['wt']==r['mut'] for r in rows);nonself=len(rows)-self_rows
cdr=list(csv.DictReader((q/'03_antibody_annotation/imgt_cdr_summary.csv').open()));cdr=[x for x in cdr if x['element'].startswith('CDR')]
for c in cdr:assert seqs[c['chain']][int(c['mos_start'])-1:int(c['mos_end'])]==c['sequence_or_length']
annotation=list(csv.DictReader((q/'03_antibody_annotation/imgt_residue_mapping.csv').open()))
for r in annotation:assert seqs[r['chain']][int(r['entity_position'])-1]==r['aa']
interface=json.loads((q/'05_interactions/epitope_paratope.json').read_text())
highlight=[]
for r in csv.DictReader((q/'05_interactions/epitope_paratope.csv').open()):
    key=(r['chain'],int(r['mos_residue']))
    assert key in maps
    highlight.append({**r,'verified_original_auth_chain':maps[key]['auth_chain'],'verified_original_auth_seq_id':maps[key]['auth_seq_id']})
homology=json.loads((q/'02_homologs/homology_summary.json').read_text())
status=json.loads((q/'07_provenance/module_status.json').read_text())
summary={'case_id':'02','status':'analysis_delivered_native_mmetrics_incomplete','observed_utc':datetime.now(timezone.utc).isoformat(),'native_mmetrics_ui_status':'Generating description / Analyzing structure / Model Computing; no native output retrieved','native_autocompute_task_id':'342256189539328','explicit_task_count':11,'explicit_tasks_succeeded':11,'tasks':ledger['tasks'],'construct':'Avelumab VH/VL variable fragments plus PD-L1 ectodomain. No antibody constant/Fc domains are present in 5GRJ input sequences.','chains':canonical,'module_status':status['modules'],'score_matrix':{'total_rows_including_WT':len(rows),'WT_self_substitution_rows':self_rows,'nonself_substitutions':nonself,'positions':len({(r['chain'],r['position']) for r in rows}),'raw_rows_by_task':raw_counts,'available_values':{a:len(v) for a,v in raw_axes.items()},'audit':'Every WT residue checked against deposited entity sequence; every populated merged score checked against its raw task CSV.'},'cdr_regions':cdr,'homologs':{k:{'unique_hits':v['n_unique_hits'],'top5':v['top20'][:5]} for k,v in homology.items()},'interfaces':interface['interfaces'],'source_kind':{'structure':'experimental 5GRJ','scores':'MOS tasks','homologs':'MOS search outputs','CDR_IMGT':'Mocha built-in ANARCI','geometry_and_risks':'Mocha built-in deterministic structural and motif analyses','native_MMetrics_modules':'not completed'},'canonical_paths':{'structure':str((q/'00_structure/5GRJ_mos_sanitized.cif').relative_to(root)),'annotation':str((q/'03_antibody_annotation/imgt_residue_mapping.csv').relative_to(root)),'mutations':str((q/'06_mutations/all_scores_long.csv').relative_to(root)),'recommended_mutations':str((q/'06_mutations/recommended_mutations.csv').relative_to(root)),'risks':str((q/'04_liabilities/liability_sites.json').relative_to(root)),'numbering_map':'02-mmetrics/raw/verified-residue-numbering.json','highlight_data':'02-mmetrics/raw/verified-epitope-paratope.json'},'audit_notes':['9020 matrix rows include 451 WT-to-WT rows; 8569 are nonself substitutions.','Original source target has modeled entity positions 1-167 and 171-216. Missing entity positions 168-170 and 217-221 must not be collapsed when highlighting this MOS object.','Original auth PD-L1 numbering is label_seq_id + 17 (e.g. C44 maps to auth A61). The raw overview contains a contradictory +18 note and incorrect modeled-span lists; use this verified atom-site map.','Original VL modeled positions are 2-109, not 2-108.','Raw narrative calls 2293 square A burial on PD-L1; that figure sums both sides of the VH–PD-L1 pair. Use explicit per-side numbers or their mean.','ANARCI best-hit species is an HMM classification signal and is not the actual origin of the therapeutic antibody.','Recommended mutations and composite scores are computational heuristics, not experimentally validated improvements.']}
(p/'results.json').write_text(json.dumps(summary,indent=2)+'\n');(p/'raw/verified-residue-numbering.json').write_text(json.dumps(list(maps.values()),indent=2)+'\n');(p/'raw/verified-epitope-paratope.json').write_text(json.dumps(highlight,indent=2)+'\n')
x=json.loads((p/'input.json').read_text());x['analysis_project_id']='342256011498496';x['mos_object_id']='342256182768640';x['tasks']=ledger['tasks'];x['parameters_status']='Exact sequences, task payloads and raw files retained in case02_complete.zip';(p/'input.json').write_text(json.dumps(x,indent=2)+'\n')
fig,ax=plt.subplots(figsize=(7,3.5));names=[];areas=[]
for key in ['A:C','B:C']:
    z=interface['interfaces'][key];names.append('VH–PD-L1' if key=='A:C' else 'VL–PD-L1');areas.append(z['bsa_total_A2']/2)
ax.barh(names,areas,color=['#5764ef','#ad96db']);ax.invert_yaxis();ax.set(xlabel='Pairwise mean buried area per side (Å²)',title='Avelumab contacts in experimental 5GRJ');fig.tight_layout();fig.savefig(p/'visuals/chain-interface-burial.png',dpi=220);plt.close(fig)
print('Verified',len(rows),'matrix rows;',self_rows,'WT-self;',nonself,'nonself; raw scores all match; CDR sequences and original numbering checked.')

# Preserve the later native UI collection when regenerating the earlier independent audit.
if (p/'raw/native-ui/verified-native-summary.json').exists():
    import runpy
    runpy.run_path(str(Path(__file__).with_name('audit_native_mmetrics.py')))
