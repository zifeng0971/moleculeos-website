"""Check de novo provenance, output-chain swaps, full target identity and local geometry."""
from pathlib import Path
from datetime import datetime,timezone
import copy,hashlib,json,re,argparse
import numpy as np
from Bio.PDB import MMCIFParser,MMCIFIO,Superimposer,ShrakeRupley
from Bio.SeqUtils import seq1
ROOT=Path(__file__).resolve().parents[2];BASE=ROOT/'05-denovo-kn035'
ap=argparse.ArgumentParser();ap.add_argument('--round',type=int,default=1);ARGS=ap.parse_args()
assert ARGS.round in [1,2]
C=BASE if ARGS.round==1 else BASE/'round2'
export_name='kn035_case05' if ARGS.round==1 else 'kn035_case05_round2'
E=C/'raw/mos-export'/export_name
if not E.exists():E=C/('raw/mos-interim' if ARGS.round==1 else 'raw/mos-checkpoint')/export_name
RUNS=[(111,'342606137910272'),(222,'342606139298816'),(333,'342606141764608')] if ARGS.round==1 else [(444,'342610714428416'),(555,'342610715788288'),(666,'342610718331904')]
def read(p):return json.loads(p.read_text())
def save(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2,allow_nan=False)+'\n')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return MMCIFParser(QUIET=True,auth_chains=False,auth_residues=False).get_structure('d',p)
def seq(c):return ''.join(seq1(r.resname) for r in c)
def xyz(r):return np.array([a.coord for a in r if a.element!='H'])
def md(a,b):return float(np.sqrt(((xyz(a)[:,None]-xyz(b)[None,:])**2).sum(2)).min())
masterfile=ROOT/'01-structure/raw/MMFold_1.cif';master=load(masterfile)[0];targetseq=seq(master['A']);epitope=set(read(ROOT/'02-mmetrics-kn035/results.json')['epitope']['label_seq_ids']);wtgeom=set(read(ROOT/'02-mmetrics-kn035/raw/local/geometric-contacts.json')['epitope']);hotspots=read(BASE/'raw/hotspot-selection.json');hot={r['label_seq_id'] for r in hotspots['hotspots']};ledger=read(E/('tasks/task_ledger.json' if ARGS.round==1 else 'tasks/task_ledger_round2.json'));localinput=BASE/'raw/MMFold_1_chain_A.cif';imported=E/'inputs/object_check/MMFold_1_chain_A.cif'
if not imported.exists():imported=E/'inputs/MMFold_1_chain_A.cif'
if not imported.exists():imported=BASE/'raw/mos-export/kn035_case05/inputs/object_check/MMFold_1_chain_A.cif';assert sha(localinput)==sha(imported)
t=load(imported)[0];assert len(t)==1 and seq(t['A'])==targetseq
assert all(np.array_equal(a.coord,b.coord) for a,b in zip(master['A'].get_atoms(),t['A'].get_atoms()))
model_maps=[];candidates=[];res=[];metrics=[]
for seed,tid in RUNS:
 payload=read(E/f'payloads/payload_seed{seed}.json');assert payload['random_seed']==seed and payload['contigs']=='A1-118/0 60-100' and payload['compare_binder']==1 and payload['hotspot_res']=='A45,A40,A97,A107,A105,A38'
 assert '342605515027456_MMFold_1_chain_A.cif' in payload['input_structure'];assert 'binder_sequence' not in payload
 aligned=list((E/f'outputs/seed{seed}').glob('*_aligned.cif'));backbone=list((E/f'outputs/seed{seed}').glob('*_output.cif'))
 if not aligned:continue
 assert len(aligned)==len(backbone)==1
 st=load(aligned[0]);m=st[0];bb=load(backbone[0])[0];targetids=[c.id for c in m if seq(c)==targetseq];assert len(targetids)==1;tc=targetids[0];bc=next(c.id for c in m if c.id!=tc);bs=seq(m[bc]);assert 60<=len(bs)<=100;assert seq(bb[bc])=='G'*len(bs);assert seq(bb[tc])==targetseq
 assert [r.id[1] for r in m[tc]]==list(range(1,119));assert bs!=seq(master['B']);assert len(m)==2
 mapping=[{'output_chain':tc,'output_label_seq_id':r.id[1],'mmfold1_chain':'A','mmfold1_label_seq_id':i+1,'aa':seq1(r.resname)} for i,r in enumerate(m[tc])]
 model_maps.append({'seed':seed,'task_id':tid,'target_map':mapping,'binder':{'output_chain':bc,'length':len(bs),'mmfold1_chain':None,'mmfold1_label_seq_id':None,'reason':'New de novo binder has no homologous residue correspondence to KN035; never map binder output A onto master target A.'}})
 contact=[]
 for a in m[tc]:
  for b in m[bc]:
   d=md(a,b)
   if d<=4.5:contact.append({'target_output_chain':tc,'target_output_label_seq_id':a.id[1],'target_mmfold1_chain':'A','target_mmfold1_label_seq_id':a.id[1],'target_aa':seq1(a.resname),'binder_output_chain':bc,'binder_output_label_seq_id':b.id[1],'binder_aa':seq1(b.resname),'minimum_heavy_atom_distance_A':d})
 footprint={p['target_mmfold1_label_seq_id'] for p in contact};overlap=footprint&epitope
 hotdist=[{'chain':'A','label_seq_id':n,'aa':targetseq[n-1],'target_output_chain':tc,'target_output_label_seq_id':n,'minimum_heavy_atom_distance_to_new_binder_A':min(md(m[tc][n],r) for r in m[bc])} for n in sorted(hot)]
 sr=ShrakeRupley(probe_radius=1.4,n_points=960);sr.compute(m,level='R');bound={c.id:sum(r.sasa for r in c) for c in m};isolated={}
 for ch in [tc,bc]:
  single=copy.deepcopy(m)
  for other in list(single):
   if other.id!=ch:single.detach_child(other.id)
  sr.compute(single,level='R');isolated[ch]=sum(r.sasa for r in single[ch])
 totalburial=sum(isolated.values())-sum(bound.values());BSA=totalburial/2
 sup=Superimposer();sup.set_atoms([r['CA'] for r in master['A']],[r['CA'] for r in m[tc]]);sup.apply(list(st.get_atoms()));computed=float(np.sqrt(np.mean([np.sum((m[tc][n]['CA'].coord-master['A'][n]['CA'].coord)**2) for n in range(1,119)])));assert abs(computed-sup.rms)<1e-4
 out=C/f'raw/local/seed{seed}_target_A_aligned.cif';out.parent.mkdir(parents=True,exist_ok=True);io=MMCIFIO();io.set_structure(st);io.save(str(out))
 bf=[{'output_chain':ch.id,'output_label_seq_id':r.id[1],'atom_site_B_iso_or_equiv_CA':float(r['CA'].bfactor)} for ch in m for r in ch];save(C/f'raw/local/seed{seed}_atom_site_CA_B_values.json',{'source_kind':'MOS_CIF_atom_site_B_iso_or_equiv','semantic_label':'Raw B values; not promoted to calibrated pLDDT without an explicit output declaration.','rows':bf})
 save(C/f'raw/local/seed{seed}_contacts.json',{'source_kind':'local_geometry_of_designed_predicted_complex','cutoff_A':4.5,'pairs':contact});save(C/f'raw/local/seed{seed}_output-numbering-map.json',model_maps[-1])
 entry={'seed':seed,'task_id':tid,'status':'succeeded_output_collected','source_kind':'MOS_de_novo_backbone_then_sequence_design_and_complex_prediction','structure':str(aligned[0].relative_to(ROOT)),'backbone_structure':str(backbone[0].relative_to(ROOT)),'aligned_to_MMfold1_structure':str(out.relative_to(ROOT)),'output_chain_mapping':{'target_output_chain':tc,'target_master_chain':'A','new_binder_output_chain':bc,'new_binder_master_correspondence':None},'binder_length':len(bs),'designed_sequence':bs,'virtual_backbone_sequence':seq(bb[bc]),'designed_sequence_A_fraction':bs.count('A')/len(bs),'FASTA_source':str((E/f'outputs/seed{seed}/sequences.fasta').relative_to(ROOT)),'input_target_sequence_unchanged_and_all_118_residues_retained':True,'target_CA_RMSD_to_MMfold1_A':float(sup.rms),'target_alignment_CA_count':118,'hotspot_distances':hotdist,'hotspots_engaged_within_4_5_A':sum(x['minimum_heavy_atom_distance_to_new_binder_A']<=4.5 for x in hotdist),'local_interface_metrics':{'contact_cutoff_A':4.5,'buried_surface_area_A2':float(BSA),'buried_surface_area_definition':'(SASA_target_isolated + SASA_binder_isolated - SASA_complex)/2','total_buried_SASA_A2':float(totalburial),'SASA_method':'Biopython ShrakeRupley probe 1.4 A, 960 points per atom','target_contact_label_seq_ids':sorted(footprint),'native_epitope_count':len(epitope),'native_epitope_intersection_label_seq_ids':sorted(overlap),'native_epitope_overlap_fraction':len(overlap)/len(epitope),'native_epitope_Jaccard':len(overlap)/len(footprint|epitope),'geometric_WT_4_5_A_overlap_fraction':len(footprint&wtgeom)/len(wtgeom),'geometric_WT_4_5_A_Jaccard':len(footprint&wtgeom)/len(footprint|wtgeom),'note':'Native annotation uses its own structure annotation rule; same-threshold 4.5 A WT comparison is provided separately.'},'confidence':{'ipTM':None,'pLDDT':None,'PAE':None,'platform_interface_score':None,'status':'No confidence summary files/explicit confidence labels supplied; raw CIF atom_site B values retained separately.'},'ranking_basis':'local footprint overlap, hotspot engagement, BSA; no affinity or validated binding ranking','experimental':False}
 candidates.append(entry)
 for n in sorted(footprint):res.append({'chain':'A','label_seq_id':n,'aa':targetseq[n-1],'group':'new_binder_contact','seed':seed,'source_kind':'local_geometry_of_MOS_de_novo_complex'})
 for x in hotdist:res.append(dict(x,group='hotspot',seed=seed,source_kind='native_epitope_plus_local_geometry'))
ranked=sorted(candidates,key=lambda x:(x['local_interface_metrics']['native_epitope_Jaccard'],x['hotspots_engaged_within_4_5_A'],x['local_interface_metrics']['buried_surface_area_A2']),reverse=True)
for i,c in enumerate(ranked):c['local_geometry_rank']=i+1
save(C/'results.json',{'case_id':'05-kn035' if ARGS.round==1 else '05-kn035-round2','status':'completed_with_confidence_and_sequence_quality_limits' if len(candidates)==3 else 'partial_outputs_remaining_runs_in_progress','tasks':ledger['runs'],'candidates':ranked,'available_design_count':len(candidates),'master_sha256':sha(masterfile),'native_epitope_source':'02-mmetrics-kn035/residues-on-mmfold1.json','hotspot_selection':'raw/hotspot-selection.json','input_source_hash_and_extraction_coordinates_verified_locally':True,'output_target_mapping':'raw/residue-numbering-map.json','limitations':['These are newly generated backbones from a target-only input, not redesigned KN035 sequences.','Scores/rankings here are local geometry, not measured binding or experimental design success.','Platform output consists of backbone and aligned designed-complex CIFs, not confidence summary JSON; ipTM/PAE are unavailable.','Designed sequences have strong alanine bias; actual sequence composition is reported and candidates should not be presented as experimentally validated or mature leads.','New binder residues have no MMFold_1 residue counterpart; only target contacts/hotspots map back to master chain A.','MOS-side report did not possess master complex; local verification here closes the target extraction and C-alpha alignment evidence gap.']})
save(C/'raw/residue-numbering-map.json',{'input_mapping':[{'mos_chain':'A','mos_residue':n,'mmfold1_chain':'A','mmfold1_label_seq_id':n,'aa':targetseq[n-1]} for n in range(1,119)],'output_mappings':model_maps,'mapping_verification':'Full sequence equality, all target residues and labels present, master-derived atom coordinates bitwise equal before submission.'})
save(C/'residues-on-mmfold1.json',{'schema_version':'1.0','master':'01-structure/raw/MMFold_1.cif','master_sha256':sha(masterfile),'numbering':'MMFold_1 label_asym_id + label_seq_id','mapping_verified':True,'residues':res,'new_binder_residues':{'mapped':False,'reason':'No counterpart in the master structure; use separate design structure for the binder.'}})
save(C/'input.json',{'case_id':'05-kn035' if ARGS.round==1 else '05-kn035-round2','project_id':'342605363971072','project_url':'https://mos.moleculemind.com/?projectId=342605363971072','mos_object_id':'342605515027456','mos_work_id':'342605519696896','master':'01-structure/raw/MMFold_1.cif','master_sha256':sha(masterfile),'input_file':'05-denovo-kn035/raw/MMFold_1_chain_A.cif','input_file_sha256':sha(localinput),'MOS_import_sha256':sha(imported),'MOS_import_byte_identity_verified':True,'chain_mapping':{'A':{'mmfold1':'A','role':'PD-L1','length':118}},'extraction_provenance':read(BASE/'raw/MMFold_1_chain_A.provenance.json'),'submitted_prompts':{p.name:p.read_text() for p in (C/'raw').glob('submitted-*.txt')},'task_payloads':[{'task_id':tid,'seed':seed,'payload':read(E/f'payloads/payload_seed{seed}.json')} for seed,tid in RUNS],'actual_schema':str((E/'schema/protein_binder_design_schema.json').relative_to(ROOT)),'residue_mapping_file':'raw/residue-numbering-map.json','new_binder_input':None})
print(json.dumps([{'seed':x['seed'],'length':x['binder_length'],'CA_RMSD':x['target_CA_RMSD_to_MMfold1_A'],'BSA_A2':x['local_interface_metrics']['buried_surface_area_A2'],'overlap':x['local_interface_metrics']['native_epitope_overlap_fraction'],'A_fraction':x['designed_sequence_A_fraction']} for x in ranked],indent=2))
