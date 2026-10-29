from pathlib import Path
import json,hashlib
from Bio.PDB import MMCIFParser
from Bio.PDB.MMCIF2Dict import MMCIF2Dict
from Bio.SeqUtils import seq1

root=Path(__file__).resolve().parents[2];p=root/'03-affinity';q=p/'raw/variant-structure-export/case03_variant_structures'
raw=json.loads((q/'variant_results.json').read_text());src=MMCIF2Dict(str(root/'sources/7XYQ.cif'))
seqs={e:''.join(s.split()) for e,s in zip(src['_entity_poly.entity_id'],src['_entity_poly.pdbx_seq_one_letter_code_can'])};target=seqs['1'];wt=seqs['2']
out=[]
for name,v in raw['variants'].items():
    pos=v['position_MOS'];seq=v['binder_sequence'];assert len(seq)==124 and sum(a!=b for a,b in zip(seq,wt))==1 and seq[pos-1]==name[-1] and wt[pos-1]==name[0]
    inputs=v['submitted_payload']['sequences'];assert inputs[0]['protein']['sequence']==target and inputs[1]['protein']['sequence']==seq
    samples=[]
    for i in range(1,6):
        f=next((q/name/'cif').glob(f'*sample_{i}.cif'));conf=q/name/f'confidence/summary_confidences_sample_{i}.json';d=json.loads(conf.read_text())
        m=MMCIFParser(QUIET=True).get_structure(name+str(i),f)[0]
        for chain,expected in [('A',target),('B',seq)]:
            observed=''.join(seq1(r.resname) for r in m[chain] if r.id[0]==' ')
            assert observed==expected,(name,i,chain,len(observed),len(expected))
        assert seq1(m['B'][pos].resname)==name[-1]
        samples.append({'sample':i,'structure':str(f.relative_to(root)),'confidence_file':str(conf.relative_to(root)),**d,'mutant_residue_CA_b_factor':float(m['B'][pos]['CA'].bfactor),'structure_sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
    samples.sort(key=lambda x:x['ranking_score'],reverse=True);best=samples[0]
    out.append({'variant':name,'original_author_position':pos-5,'task_id':v['task_id'],'status':'succeeded','antigen_sequence':target,'binder_sequence':seq,'best_sample':best['sample'],'best_structure':best['structure'],'best_confidence':best['confidence_file'],'best_iptm':best['iptm'],'best_global_plddt':best['plddt'],'samples':samples,'payload':v['submitted_payload']})
result={'status':'both_succeeded','method':'Two sequence-only MMFold jobs; five samples each; every coordinate residue verified against the exact submitted mutant sequences; best sample selected by ranking_score.','variants':out,'limitations':['Structure confidence is separate from affinity ddG and does not establish improved affinity.','No absolute binding energy, experimental Kd, MD relaxation or joint-mutation evaluation was performed.','Do not compare predicted variant pLDDT against the experimental baseline, which has crystallographic B factors rather than pLDDT.']}
(p/'raw/candidate-structures.json').write_text(json.dumps(result,indent=2)+'\n')
d=json.loads((p/'results.json').read_text());d['candidate_structure_predictions']={'summary_file':'03-affinity/raw/candidate-structures.json','variants':[{'variant':v['variant'],'task_id':v['task_id'],'samples':5,'best_structure':v['best_structure'],'best_confidence':v['best_confidence'],'best_iptm':v['best_iptm'],'best_global_plddt':v['best_global_plddt']} for v in out]};d['limitations']=[x for x in d['limitations'] if not x.startswith('Mutant side-chain')];d['limitations']+=result['limitations'];(p/'results.json').write_text(json.dumps(d,indent=2)+'\n')
x=json.loads((p/'input.json').read_text());x['variant_structure_tasks']=[{'variant':v['variant'],'task_id':v['task_id'],'payload':v['payload']} for v in out];(p/'input.json').write_text(json.dumps(x,indent=2)+'\n')
with (p/'run-log.md').open('a') as f:f.write('\n## Additional variant structures\n\n- Two separate MMFold jobs for Q18Y (task 342259574002688) and V17I (task 342259585696768) both Succeeded. Each generated five predicted complexes and five confidence JSONs.\n- Target sequence is unchanged 207-aa 7XYQ entity sequence; binder is a single mutant of the 124-aa original. Every atom-coordinate residue in all ten models matches the expected input sequence.\n- Downloaded 35-file ZIP through Workspace; CRC passed. Best samples selected by platform ranking_score; Q18Y ipTM 0.8214, V17I ipTM 0.7760.\n- These are structure predictions, not new binding-energy predictions or experimental validation.\n')
print('Verified all ten variant structures and ten confidence JSONs:',[(v['variant'],v['best_iptm']) for v in out])
