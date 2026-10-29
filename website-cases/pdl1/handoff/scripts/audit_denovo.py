from pathlib import Path
import json,copy,math
from collections import Counter
from datetime import datetime,timezone
import numpy as np
from Bio.PDB import MMCIFParser,PDBParser,PDBIO
from Bio.PDB.SASA import ShrakeRupley
from Bio.SeqUtils import seq1
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root=Path(__file__).resolve().parents[2];p=root/'05-denovo'
q=p/'raw/mos-export/case05'
if not q.exists():q=p/'raw/two-candidate-export/case05'
export=json.loads((q/'results.json').read_text());reference=PDBParser(QUIET=True).get_structure('5GRJ',root/'sources/5GRJ.pdb')[0]
def residues(c):return [r for r in c if r.id[0]==' ' and 'CA' in r]
rr=residues(reference['A']);refseq=''.join(seq1(r.resname) for r in rr)
def heavy(res):return [a for a in res.get_atoms() if a.element not in ('H','D')]
def distance(a,b):
    x=np.array([v.coord for v in heavy(a)]);y=np.array([v.coord for v in heavy(b)])
    return float(np.sqrt(((x[:,None,:]-y[None,:,:])**2).sum(axis=2)).min())
refcontacts=json.loads((root/'sources/5GRJ-reference-contacts.json').read_text())['residue_contact_pairs']
footprint=set()
for row in refcontacts:
    for side in ['1','2']:
        if row['chain_'+side]=='A':footprint.add(row['residue_'+side]['auth_seq_id'])
hotspots=[54,56,58,68,113,123];candidates=[];sequences=[]
design_dirs=list((q/'designs').iterdir())
direct=p/'raw/direct-task-exports'
if direct.exists():design_dirs.extend(direct.iterdir())
for design in sorted(design_dirs):
    if not design.is_dir():continue
    files=list((design/'raw').glob('*aligned.cif'))
    if not files:continue
    f=files[0];s=MMCIFParser(QUIET=True).get_structure(design.name,f);m=s[0]
    chains={c.id:''.join(seq1(r.resname) for r in residues(c)) for c in m}
    tc=next(c for c,seq in chains.items() if seq==refseq);bc=next(c for c in chains if c!=tc);tr=residues(m[tc]);br=residues(m[bc]);seq=chains[bc]
    assert 60<=len(seq)<=100 and len(set(seq))>2
    mapping={r.id[1]:{'target_output_chain':tc,'target_output_seq_id':tr[i].id[1],'pdb_5grj_auth_chain':'A','pdb_5grj_auth_seq_id':r.id[1],'residue':seq1(r.resname)} for i,r in enumerate(rr)}
    byauth={r.id[1]:tr[i] for i,r in enumerate(rr)}
    hs=[{**mapping[h],'minimum_heavy_atom_distance_to_binder_A':distance(byauth[h],m[bc])} for h in hotspots]
    pairs=[];ionic=[];clashes=[]
    for a in br:
        for b in tr:
            dist=distance(a,b)
            if dist<=4.5:pairs.append({'binder_chain':bc,'binder_seq_id':a.id[1],'binder_residue':seq1(a.resname),'target_chain':tc,'target_seq_id':b.id[1],'target_residue':seq1(b.resname),'target_pdb_auth_seq_id':next(k for k,v in mapping.items() if v['target_output_seq_id']==b.id[1]),'min_distance_A':dist})
            if dist<2.0:clashes.append({'binder_seq_id':a.id[1],'target_seq_id':b.id[1],'minimum_heavy_atom_distance_A':dist})
            acid={'ASP':['OD1','OD2'],'GLU':['OE1','OE2']};base={'ARG':['NE','NH1','NH2'],'LYS':['NZ']}
            if a.resname in acid and b.resname in base:aa=[a[x] for x in acid[a.resname] if x in a];bb=[b[x] for x in base[b.resname] if x in b]
            elif b.resname in acid and a.resname in base:aa=[a[x] for x in base[a.resname] if x in a];bb=[b[x] for x in acid[b.resname] if x in b]
            else:continue
            dd=min(float(np.linalg.norm(x.coord-y.coord)) for x in aa for y in bb)
            if dd<=4:ionic.append({'binder_chain':bc,'binder_seq_id':a.id[1],'binder_residue':a.resname,'target_chain':tc,'target_seq_id':b.id[1],'target_residue':b.resname,'charged_atom_min_distance_A':dd})
    sr=ShrakeRupley(probe_radius=1.4,n_points=200);sr.compute(m,level='C');complex_sasa=sum(c.sasa for c in m)
    isolated=[]
    for cid in [bc,tc]:
        z=copy.deepcopy(m)
        for c in list(z):
            if c.id!=cid:z.detach_child(c.id)
        sr.compute(z,level='C');isolated.append(sum(c.sasa for c in z))
    delta=sum(isolated)-complex_sasa
    confidence=[{'seq_id':r.id[1],'residue':seq1(r.resname),'ca_b_factor':float(r['CA'].bfactor)} for r in br];plddt=float(np.mean([r['ca_b_factor'] for r in confidence]))
    counts=Counter(seq);entropy=-sum((v/len(seq))*math.log2(v/len(seq)) for v in counts.values())
    overlap=sorted(footprint & {r['target_pdb_auth_seq_id'] for r in pairs})
    out={'label':design.name,'status':'succeeded','source_kind':'MOS_designed_sequence_and_repredicted_complex','binder_sequence':seq,'binder_length':len(seq),'binder_chain':bc,'target_chain':tc,'structure':str(f.relative_to(root)),'binder_CA_mean_plddt':plddt,'hotspots_engaged_within_4_5_A':sum(h['minimum_heavy_atom_distance_to_binder_A']<=4.5 for h in hs),'hotspots':hs,'local_geometry':{'residue_contact_pair_count_4_5_A':len(pairs),'potential_ionic_residue_pairs_4_A':ionic,'heavy_atom_clash_residue_pairs_below_2_A':clashes,'sasa_probe_radius_A':1.4,'sasa_points':200,'delta_sasa_both_sides_A2':delta,'mean_buried_area_per_side_A2':delta/2,'avelumab_reference_footprint_residue_count':len(footprint),'avelumab_footprint_overlap_residue_count':len(overlap),'avelumab_footprint_overlap_auth_seq_ids':overlap},'sequence_properties':{'alanine_fraction':seq.count('A')/len(seq),'composition':counts,'entropy_bits':entropy},'confidence_scope':'Binder CA B factors of aligned.cif; no complex ipTM/pTM/PAE delivered.'}
    path=p/f'raw/{design.name}-verified-analysis.json';path.write_text(json.dumps({'candidate':out,'contacts':pairs,'target_numbering_map':mapping,'residue_confidence':confidence},indent=2)+'\n');out['verified_analysis']=str(path.relative_to(root));candidates.append(out);sequences.append(f'>{design.name}|MOS_de_novo|binder_chain_{bc}\n{seq}\n')
    io=PDBIO();io.set_structure(s);io.save(str(p/f'raw/{design.name}-designed-complex.pdb'))
    print(design.name,len(seq),'pLDDT',round(plddt,2),'hotspots',out['hotspots_engaged_within_4_5_A'],'ionic',ionic,'BSA',delta/2)
candidates.sort(key=lambda x:(-x['hotspots_engaged_within_4_5_A'],-x['local_geometry']['mean_buried_area_per_side_A2'],-x['binder_CA_mean_plddt']))
for i,c in enumerate(candidates,1):c['geometry_review_rank']=i
task_status=export['tasks']
if (p/'raw/task-status-final.json').exists():task_status=json.loads((p/'raw/task-status-final.json').read_text())['tasks']
result={'case_id':'05','status':'succeeded_with_quality_limits' if len(candidates)==3 else 'two_succeeded_third_pending','observed_utc':datetime.now(timezone.utc).isoformat(),'tasks':task_status,'candidates':candidates,'ranking_method':'Local review: hotspot coverage, then mean buried area per side, then binder CA pLDDT. Not native MOS confidence rank or affinity rank.','virtual_backbone_policy':'output.cif is retained as a backbone intermediate; its poly-Gly residues and 0/1 B factors are not designed sequence or pLDDT. Use aligned.cif for final designed complex.','limitations':['These are unvalidated computational designs, not demonstrated binders.','Binder confidence is modest; show actual pLDDT alongside structural coverage.','No ipTM, pTM, PAE, Kd or experimentally validated affinity supplied.','Potential ionic pairs and interface geometry are locally derived, not measured binding energy.','Low sequence complexity and very close interchain heavy-atom distances require further relaxation and validation.','Mocha earlier called binder residue 8 Arg in prose; it is Glu in seed111. Canonical verified ionic residue identities are provided here.','Avelumab footprint overlap describes geometric epitope overlap, not biological competition demonstrated in an assay.']}
(p/'results.json').write_text(json.dumps(result,indent=2)+'\n');(p/'raw/designed-binders.fasta').write_text(''.join(sequences))
x=json.loads((p/'input.json').read_text());x['exact_exported_parameters']=json.loads((q/'input.json').read_text());x['task_ids_export']=json.loads((q/'task_ids.json').read_text());x['target_construct']='213 modeled extracellular residues from 5GRJ auth chain A; excludes membrane/cytoplasmic regions and unmodeled residues, no antibody or glycan';(p/'input.json').write_text(json.dumps(x,indent=2)+'\n')
fig,axs=plt.subplots(1,2,figsize=(9,3.8));names=[x['label'] for x in candidates];axs[0].bar(names,[x['binder_CA_mean_plddt'] for x in candidates],color='#5764ef');axs[0].set(ylim=(0,100),ylabel='Binder mean CA pLDDT',title='Confidence of designed sequence');axs[1].bar(names,[x['hotspots_engaged_within_4_5_A'] for x in candidates],color='#9472cf');axs[1].set(ylim=(0,6.5),ylabel='Hotspots within 4.5 Å (of 6)',title='Geometry coverage');fig.tight_layout();fig.savefig(p/'visuals/candidate-comparison.png',dpi=220);plt.close(fig)
