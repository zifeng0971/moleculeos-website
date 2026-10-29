from pathlib import Path
import json,csv,re
from datetime import datetime,timezone
from Bio.PDB.MMCIF2Dict import MMCIF2Dict
from Bio.SeqUtils.ProtParam import ProteinAnalysis
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root=Path(__file__).resolve().parents[2];p=root/'04-developability';q=p/'raw/mos-export/case04_pkg'
d=json.loads((q/'results/results.json').read_text());tasks=json.loads((q/'tasks/tasks.json').read_text())['tasks']
wt=d['input_files']['wt_sequence'];assert len(wt)==128
cif=MMCIF2Dict(str(root/'sources/5JDS.cif'));mapping={}
for label,pos,auth,num in zip(cif['_atom_site.label_asym_id'],cif['_atom_site.label_seq_id'],cif['_atom_site.auth_asym_id'],cif['_atom_site.auth_seq_id']):
    if label=='A' and pos!='.':mapping[int(pos)-2]={'pdb_auth_chain':auth,'pdb_auth_seq_id':int(num),'pdb_label_chain':label,'pdb_label_seq_id':int(pos),'mos_renumbered_chain':'A','mos_renumbered_seq_id':int(pos)-2}
assert mapping[1]['pdb_auth_chain']=='B' and mapping[1]['pdb_auth_seq_id']==1
scorefiles={name:next(q.glob(pattern)) for name,pattern in [('structural_stability','raw/structural*/*.csv'),('sequence_fitness','raw/sequence_fitness*/*.csv'),('evolutionary','raw/evolutionary*/*.csv'),('binding_ddg_pred','raw/binding_affinity*/*.csv')]}
tables={};raw_counts={}
for name,file in scorefiles.items():
    rows=list(csv.DictReader(file.open()));raw_counts[name]=len(rows);tab={}
    for row in rows:
        if name=='binding_ddg_pred':
            m=re.fullmatch(r'([A-Z])([A-Z])(\d+)([A-Z])',row['mutstr']);a,c,n,b=m.groups();mutation=a+n+b;score=float(row['ddG_pred'])
        else:c=row['chain'];mutation=row['mutation'];score=float(row['score'])
        if c=='A':tab[mutation]=score
    tables[name]=tab
for candidate in d['candidates']:
    mutation=candidate['mutation'];i=candidate['position_domain'];s=candidate['fasta'];assert wt[i-1]==mutation[0] and s[i-1]==mutation[-1]
    assert sum(a!=b for a,b in zip(wt,s))==1 and len(s)==len(wt)
    for name,tab in tables.items():assert abs(candidate['scores'][name]-tab[mutation])<0.0011,(mutation,name)
    candidate['scores']={name:tab[mutation] for name,tab in tables.items()}
    candidate['source_claimed_author_seq_id']=candidate.pop('position_5JDS_author_numbering')
    candidate['numbering']=mapping[i]
    pa=ProteinAnalysis(s);candidate['verified_theoretical_pI']=pa.isoelectric_point();candidate['verified_methionine_count']=s.count('M')
    # The narrow motif screen cannot establish that all deamidation risk vanished.
    candidate['defined_deamidation_motif_matches']=[{'motif':m.group(),'start_domain':m.start()+1} for m in re.finditer(r'N[SGHT]',s)]
d['case_id']='04';d['status']='succeeded_with_metric_limits';d['observed_utc']=datetime.now(timezone.utc).isoformat();d['mos_export_results_path']='04-developability/raw/mos-export/case04_pkg/results/results.json';d['raw_row_counts_including_WT']=raw_counts
d['source_kind']={'scores':'MOS model outputs','annotations':'Mocha built-in ANARCI and structural geometry on experimental 5JDS','sequence_metrics':'local/BioPython theoretical calculations and explicitly defined motif counts','ranking':'Mocha heuristic weighted screening, not a native calibrated MOS probability'}
d['numbering_audit']={'correction':'Raw Mocha export labels domain+2 as original author numbering. That is original label_seq_id. Original RCSB 5JDS author numbering for VHH is chain B, seq_id equal to domain position. Top-level candidates contain verified mappings; raw export retained unchanged.','mapping_file':'04-developability/raw/verified-residue-mapping.json'}
d['limitations'] += ['Original author numbering corrected against RCSB atom_site mapping; use canonical candidate numbering in this top-level file.','S85N changes NS to NN. Count 1 to 0 refers only to N[SGHT] motifs, not elimination of deamidation risk.','Met count 4 to 3 is a sequence property, not an experimentally demonstrated oxidation improvement.','Combined seven-mutation variant is unscored as a combination and excluded from website recommendations.','Percentile/composite values are heuristic screening values; do not portray them as stability probabilities, percent improvement, or physical units.','Raw task timestamps supplied by Mocha are not independently verified; observed_utc is the artifact-audit time.']
d['website_recommended_result']={'headline':'Screen 1,425 framework substitutions while preserving CDRs and disulfides','candidate_example':'M34L','binding_ddg_pred_kcal_mol':tables['binding_ddg_pred']['M34L'],'theoretical_methionine_count_before':wt.count('M'),'theoretical_methionine_count_after':wt.count('M')-1,'note':'Four model axes support a shortlist with explicit tradeoffs; no solubility, aggregation, Tm or expression claim.'}
(p/'results.json').write_text(json.dumps(d,indent=2)+'\n');(p/'raw/verified-residue-mapping.json').write_text(json.dumps(mapping,indent=2)+'\n')
x=json.loads((p/'input.json').read_text());x.update({'tasks':tasks,'baseline_sequence':wt,'baseline_sequence_length':128,'modelled_vhh_length':127,'exact_inputs_root':'04-developability/raw/mos-export/case04_pkg/inputs','parameters_status':'Exact task payloads downloaded and retained; raw export numbering corrected in results.json'});(p/'input.json').write_text(json.dumps(x,indent=2)+'\n')
fig,axs=plt.subplots(1,2,figsize=(10,4.5));names=[r['mutation'] for r in d['candidates']]
for ax,key,title in zip(axs,['structural_stability','sequence_fitness'],['Structural fitness effect','Sequence fitness effect']):
    vals=[r['scores'][key] for r in d['candidates']];ax.barh(names,vals,color=['#5764ef' if v>=0 else '#a785c8' for v in vals]);ax.axvline(0,color='#777',lw=1);ax.invert_yaxis();ax.set_title(title);ax.set_xlabel('Model score (arbitrary units); WT-relative')
fig.suptitle('KN035 developability shortlist: model axes show tradeoffs');fig.tight_layout();fig.savefig(p/'visuals/candidate-score-tradeoffs.png',dpi=220);plt.close(fig)
print('Verified seven single mutants, all four raw score axes, and original author numbering.')
