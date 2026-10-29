"""Independent local geometry; never presented as MOS agent output."""
from pathlib import Path
import json, shlex, hashlib
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
AA = dict(zip('ALA ARG ASN ASP CYS GLN GLU GLY HIS ILE LEU LYS MET PHE PRO SER THR TRP TYR VAL'.split(), 'ARNDCQEGHILKMFPSTWYV'))

def atoms(path):
    lines = path.read_text().splitlines(); headers = []; result = []
    for line in lines:
        if line.startswith('_atom_site.'):
            headers.append(line.strip().split('.')[1]); continue
        if not line.startswith(('ATOM ', 'HETATM ')) or not headers:
            continue
        row = dict(zip(headers, shlex.split(line)))
        if row.get('pdbx_PDB_model_num', '1') != '1' or row['group_PDB'] != 'ATOM': continue
        if row['type_symbol'] in ('H', 'D'): continue
        result.append(row)
    return result

def residues(rows, chain, key='label_asym_id'):
    groups = {}
    for a in rows:
        if a[key] != chain: continue
        ident = (a['label_asym_id'], a['label_seq_id'])
        groups.setdefault(ident, []).append(a)
    out = []
    for group in groups.values():
        # Highest occupancy per atom; break ties by blank/A alternate.
        selected = {}
        for a in sorted(group, key=lambda x:(-float(x['occupancy']), x['label_alt_id'] not in ('.','A'), x['label_alt_id'])):
            selected.setdefault(a['label_atom_id'], a)
        a = group[0]
        out.append({'label_seq_id':int(a['label_seq_id']), 'auth_seq_id':a['auth_seq_id'], 'label_asym_id':a['label_asym_id'], 'auth_asym_id':a['auth_asym_id'], 'aa':AA[a['label_comp_id']], 'atoms':selected})
    return out

def coord(a): return np.array([float(a[k]) for k in ['Cartn_x','Cartn_y','Cartn_z']])
def ca(r): return coord(r['atoms']['CA'])

def align(a, b):
    n,m=len(a),len(b); score=np.zeros((n+1,m+1)); trace={}
    score[:,0]=np.arange(n+1)*-3;score[0,:]=np.arange(m+1)*-3
    for i in range(1,n+1):
        for j in range(1,m+1):
            options=[score[i-1,j-1]+(3 if a[i-1]['aa']==b[j-1]['aa'] else -2),score[i-1,j]-3,score[i,j-1]-3]
            k=int(np.argmax(options));score[i,j]=options[k];trace[i,j]=k
    i,j=n,m;pairs=[]
    while i or j:
        k=trace.get((i,j),1 if i else 2)
        if k==0:pairs.append((i-1,j-1));i-=1;j-=1
        elif k==1:i-=1
        else:j-=1
    return list(reversed(pairs))

model_path=next((ROOT/'raw').glob('*_model_sample_1.cif'))
reference_path=ROOT.parent/'sources/5JDS.cif'
pred=atoms(model_path); ref=atoms(reference_path)
chains={c:residues(pred,c) for c in ['A','B']}
inputs=json.loads((ROOT/'input.json').read_text())['chains']
for c in inputs:
    assert ''.join(r['aa'] for r in chains[c['id']])==c['sequence']

# 5JDS PD-L1 is author chain A / label chain B; label chain A is KN035.
refA=residues(ref,'A','auth_asym_id'); refB=residues(ref,'B','auth_asym_id')
mapping=align(chains['A'],refA)
P=np.array([ca(chains['A'][i]) for i,j in mapping]);Q=np.array([ca(refA[j]) for i,j in mapping])
pc=P.mean(0);qc=Q.mean(0);u,s,vt=np.linalg.svd((P-pc).T@(Q-qc));rot=u@np.diag([1,1,np.linalg.det(u@vt)])@vt
rmsd=float(np.sqrt(np.mean(np.sum(((P-pc)@rot+qc-Q)**2,axis=1))))
same=[(i,j) for i,j in mapping if chains['A'][i]['aa']==refA[j]['aa']]
assert len(same)>100
bp=align(chains['B'],refB);binder_rmsd=float(np.sqrt(np.mean([np.sum(((ca(chains['B'][i])-pc)@rot+qc-ca(refB[j]))**2) for i,j in bp])))
pairs=[]
for a in chains['A']:
    x=np.array([coord(v) for v in a['atoms'].values()])
    for b in chains['B']:
        y=np.array([coord(v) for v in b['atoms'].values()]); distance=float(np.sqrt(((x[:,None,:]-y[None,:,:])**2).sum(2).min()))
        if distance<=4.5:pairs.append({'A':a['label_seq_id'],'B':b['label_seq_id'],'minimum_heavy_atom_distance_angstrom':distance})
output={'source_kind':'local geometry','model':model_path.name,'model_sha256':hashlib.sha256(model_path.read_bytes()).hexdigest(),'reference':str(reference_path),'reference_sha256':hashlib.sha256(reference_path.read_bytes()).hexdigest(),'method':'Global sequence alignment (match 3, mismatch -2, gap -3); Kabsch least squares over corresponding C-alpha atoms of predicted A and reference author chain A; no outlier rejection. Heavy atoms: first model, protein ATOM records, highest occupancy alternate, inclusive distance <=4.5 angstrom.','reference_chain_mapping':{'PDL1':{'auth_asym_id':'A','label_asym_id':refA[0]['label_asym_id']},'KN035':{'auth_asym_id':'B','label_asym_id':refB[0]['label_asym_id']}},'A_CA_RMSD_angstrom':rmsd,'A_CA_pairs':len(mapping),'A_identical_residue_pairs':len(same),'B_CA_RMSD_after_A_fit_angstrom':binder_rmsd,'B_CA_pairs':len(bp),'alignment':[{'model_label_seq_id':chains['A'][i]['label_seq_id'],'reference_label_seq_id':refA[j]['label_seq_id'],'reference_auth_seq_id':refA[j]['auth_seq_id'],'model_aa':chains['A'][i]['aa'],'reference_aa':refA[j]['aa']} for i,j in mapping],'interface':{'numbering':'original prediction label_seq_id, verified 1-based input sequence positions','cutoff_angstrom':4.5,'A':sorted({x['A'] for x in pairs}),'B':sorted({x['B'] for x in pairs}),'pairs':pairs},'comparison_to_agent':'pending final agent reply'}
(ROOT/'raw/local-geometry.json').write_text(json.dumps(output,indent=2)+'\n')
print(json.dumps({k:v for k,v in output.items() if k in ['A_CA_RMSD_angstrom','A_CA_pairs','B_CA_RMSD_after_A_fit_angstrom','reference_chain_mapping']}))
print(json.dumps(output['interface']))
