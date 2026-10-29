"""Derived analysis of downloaded MOS outputs; run with Biopython/numpy/matplotlib.
Never substitutes reference coordinates for predictions.
"""
from pathlib import Path
import csv, json, re
import numpy as np
from Bio.PDB import MMCIFParser, PDBParser, PDBIO, Superimposer
from Bio.PDB.MMCIF2Dict import MMCIF2Dict
from Bio.SeqUtils import seq1
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
def save(path, obj): path.write_text(json.dumps(obj, indent=2, allow_nan=False)+'\n')
def residues(chain): return [r for r in chain if r.id[0]==' ' and 'CA' in r]
def sequence(chain): return ''.join(seq1(r.resname) for r in residues(chain))
def contacts(a,b,cutoff=4.5):
    pairs=[]
    for r in residues(a):
        x=np.array([t.coord for t in r if t.element!='H'])
        for s in residues(b):
            y=np.array([t.coord for t in s if t.element!='H'])
            d=float(np.sqrt(((x[:,None,:]-y[None,:,:])**2).sum(axis=2)).min())
            if d<=cutoff:pairs.append({'chain_1':a.id,'residue_1':r.id[1],'name_1':r.resname,'chain_2':b.id,'residue_2':s.id[1],'name_2':s.resname,'minimum_heavy_atom_distance_A':round(d,3)})
    return pairs

p=ROOT/'01-structure'; reference=PDBParser(QUIET=True).get_structure('5JDS',ROOT/'sources/5JDS.pdb')[0]
models=[]
for i in range(1,6):
    confidence=json.loads((p/f'raw/summary_confidences_sample_{i}.json').read_text())
    s=MMCIFParser(QUIET=True).get_structure(str(i),p/f'raw/MMFold_{i}.cif');m=s[0]
    pairs=contacts(m['A'],m['B']);save(p/f'raw/model-{i}-derived-contacts.json',{'source_kind':'local_geometry_of_MOS_prediction','cutoff_A':4.5,'pairs':pairs})
    mapping={};pred_atoms=[];ref_atoms=[]
    for pc,rc in [('A','A'),('B','B')]:
        ps,rs=sequence(m[pc]),sequence(reference[rc]);offset=ps.find(rs)
        assert offset>=0,(pc,ps,rs)
        pr=residues(m[pc]);rr=residues(reference[rc])
        mapping[pc]=[{'prediction_seq_id':pr[offset+j].id[1],'pdb_5jds_auth_chain':rc,'pdb_5jds_auth_seq_id':r.id[1],'residue':seq1(r.resname)} for j,r in enumerate(rr)]
        pred_atoms += [pr[offset+j]['CA'] for j in range(len(rr))];ref_atoms += [r['CA'] for r in rr]
    sup=Superimposer();sup.set_atoms(ref_atoms,pred_atoms)
    conf_per_res=[{'chain':c.id,'seq_id':r.id[1],'residue':seq1(r.resname),'ca_b_factor':float(r['CA'].bfactor)} for c in m for r in residues(c)]
    save(p/f'raw/model-{i}-residue-confidence.json',{'source_kind':'MOS_prediction_atom_site_B_iso_or_equiv','note':'CA B-factor values from predicted mmCIF; confidence summaries retain original platform scaling.','residues':conf_per_res})
    save(p/f'raw/model-{i}-reference-mapping.json',mapping)
    io=PDBIO();io.set_structure(s);io.save(str(p/f'raw/MMFold_{i}.pdb'))
    models.append({'sample':i,'structure':f'01-structure/raw/MMFold_{i}.cif','confidence_file':f'01-structure/raw/summary_confidences_sample_{i}.json',**confidence,'interchain_residue_pairs_within_4_5_A':len(pairs),'derived_complex_CA_RMSD_to_5JDS_A':float(sup.rms),'aligned_CA_count':len(ref_atoms)})
ranked=sorted(models,key=lambda x:x['ranking_score'],reverse=True)
save(p/'results.json',{'case_id':'01','status':'succeeded','source_kind':'MOS_prediction','mos_task_id':'342253805564928','best_sample':ranked[0]['sample'],'models':ranked,'available_outputs':['five mmCIF','five summary confidence JSON','derived PDB','derived contacts','reference residue mapping'],'limitations':['PAE matrix was not included in the task output.','Confidence is prediction quality, not measured binding affinity.','Reference RMSD and contacts were calculated locally from real downloaded outputs.']})
fig,ax=plt.subplots(figsize=(7.5,3.6));ax.bar([str(x['sample']) for x in models],[x['iptm'] for x in models],color=['#5764ef' if x['sample']==ranked[0]['sample'] else '#b9bdd9' for x in models]);ax.set(xlabel='MMFold sample',ylabel='ipTM',ylim=(0,1),title='PD-L1 + KN035: five MOS predictions');fig.tight_layout();fig.savefig(p/'visuals/model-confidence.png',dpi=220);plt.close(fig)

p=ROOT/'03-affinity';rows=list(csv.DictReader((p/'raw/MutXaff.csv').open()));cif=MMCIF2Dict(str(ROOT/'sources/7XYQ.cif'))
entity_seq={}
for eid,seq in zip(cif['_entity_poly.entity_id'],cif['_entity_poly.pdbx_seq_one_letter_code_can']):entity_seq[eid]=''.join(seq.split())
chain_entity=dict(zip(cif['_struct_asym.id'],cif['_struct_asym.entity_id']))
map_by_label={}
for label,seqid,auth,authid in zip(cif['_atom_site.label_asym_id'],cif['_atom_site.label_seq_id'],cif['_atom_site.auth_asym_id'],cif['_atom_site.auth_seq_id']):
    if seqid!='.':map_by_label[(label,int(seqid))]={'auth_chain':auth,'auth_seq_id':int(authid)}
binder=[];validation_errors=[]
for row in rows:
    mt=re.fullmatch(r'([A-Z])([A-Z])(-?\d+)([A-Z])',row['mutstr']);assert mt,row
    wt,chain,pos,mut=mt.groups();pos=int(pos);seq=entity_seq[chain_entity[chain]]
    if seq[pos-1]!=wt:validation_errors.append(row['mutstr'])
    if chain=='B':
        x={'mutation':row['mutstr'],'chain':chain,'position':pos,'wild_type':wt,'mutant':mut,'ddG_pred_kcal_mol':float(row['ddG_pred']),'score_ddg':float(row['score_ddg']),'platform_rank_fraction':float(row['rank']),**map_by_label[(chain,pos)]}
        newseq=seq[:pos-1]+mut+seq[pos:];x['sequence']=newseq;binder.append(x)
assert not validation_errors,validation_errors[:10]
binder.sort(key=lambda r:r['ddG_pred_kcal_mol'])
for n,x in enumerate(binder,1):x['binder_rank']=n
save(p/'raw/binder-ranked-candidates.json',binder)
save(p/'raw/residue-numbering-map.json',[{'label_chain':c,'label_seq_id':i,**v} for (c,i),v in sorted(map_by_label.items())])
top=binder[:10];seq=entity_seq[chain_entity['B']]
(p/'raw/baseline-and-top10.fasta').write_text('>DBL1_03_baseline_7XYQ_entity_sequence\n'+seq+'\n'+''.join(f">rank_{r['binder_rank']}|{r['mutation']}|ddG={r['ddG_pred_kcal_mol']}|PDB_auth_{r['auth_chain']}{r['auth_seq_id']}\n{r['sequence']}\n" for r in top))
with (p/'raw/binder-top10.csv').open('w') as f:
    w=csv.DictWriter(f,fieldnames=list(top[0]));w.writeheader();w.writerows(top)
save(p/'results.json',{'case_id':'03','status':'succeeded','source_kind':'MOS_mutation_prediction','mos_task_id':'342254431249408','target':'Human PD-L1','binder':'DBL1_03','baseline_sequence':seq,'baseline_ddG_kcal_mol':0,'baseline_definition':'Wild type has zero mutation delta by definition; no absolute Kd was calculated.','score_direction':'Lower ddG_pred is better; score_ddg is its negation.','raw_rows':len(rows),'binder_mutations':len(binder),'target_mutations_excluded':len(rows)-len(binder),'numbering':'CSV uses entity/label sequence positions; author mapping verified with original mmCIF. Every raw mutation WT letter checked against deposited entity sequence.','top_candidates':top,'limitations':['Candidates are single-mutation predictions, not experimental affinity measurements.','No absolute baseline or mutant Kd values.','Mutant side-chain or relaxed structures are not produced by this mutation-scoring task.','Do not multiply single-mutation gains or claim combinations were evaluated.']})
fig,ax=plt.subplots(figsize=(8,4.5));v=list(reversed(top[:5]));ax.barh([f"B:{r['wild_type']}{r['position']}{r['mutant']}" for r in v],[r['ddG_pred_kcal_mol'] for r in v],color='#5764ef');ax.axvline(0,color='#555',lw=1);ax.set(xlabel='Predicted binding ΔΔG (kcal/mol), lower is better',title='DBL1_03: five ranked binder mutations');fig.tight_layout();fig.savefig(p/'visuals/top-binder-mutations.png',dpi=220);plt.close(fig)
print('MMFold best',ranked[0]['sample'],ranked[0]['iptm'],'RMSD',ranked[0]['derived_complex_CA_RMSD_to_5JDS_A'])
print('Affinity top',top[0]['mutation'],top[0]['ddG_pred_kcal_mol'],'author',top[0]['auth_chain'],top[0]['auth_seq_id'])
