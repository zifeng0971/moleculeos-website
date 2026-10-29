import pandas as pd, json, gemmi, csv

# ---------- load task output ----------
d = pd.read_csv('raw/bindmut/affinity_scores.csv')
d.columns = ['idx','mutstr','ddG_pred','score_ddg','rank']
d[['wt','chain','pos','mut']] = d.mutstr.str.extract(r'^([A-Z])([A-Z])(\d+)([A-Z])$')
d['pos'] = d.pos.astype(int)
seqs = json.load(open('inputs/sequences.json'))

# ---------- WT identity verification ----------
d['wt_from_seq'] = [seqs[c][p-1] for c,p in zip(d.chain,d.pos)]
wt_mismatch = d[d.wt != d.wt_from_seq]
same = d[d.wt == d.mut]
print('total rows', len(d))
print('WT-identity mismatches vs MMFold_1 sequence:', len(wt_mismatch))
print('rows where mutant == WT (must be excluded):', len(same), sorted(same.mutstr.unique())[:10])

# ---------- structural annotation ----------
st = gemmi.read_structure('inputs/MMFold_1.cif'); m = st[0]
A, B = m['A'], m['B']
minA = {}
for rb in B:
    minA[rb.seqid.num] = round(min((a.pos-bb.pos).length() for ra in A for a in ra for bb in rb), 2)
bbr = {int(r['res_num']): (float(r['bsa']), float(r['delta_g']))
       for r in csv.DictReader(open('raw/interface/residues.tsv'), delimiter='\t') if r['chain']=='B'}
hbn = set()
for r in csv.DictReader(open('raw/interface/hbond.tsv'), delimiter='\t'):
    for side in ('chain1','chain2'):
        if r.get(side)=='B': hbn.add(int(r['resnum1' if side=='chain1' else 'resnum2']))

def region(p):
    if 26 <= p <= 33: return 'IMGT-CDR1'
    if 51 <= p <= 58: return 'IMGT-CDR2'
    if 97 <= p <= 117: return 'IMGT-CDR3'
    if 34 <= p <= 50: return 'FR2'
    if 59 <= p <= 96: return 'FR3'
    if p < 26: return 'FR1'
    return 'FR4'

b = d[d.chain=='B'].copy()
b['mutant_equals_wt'] = b.wt == b.mut
b = b[~b.mutant_equals_wt].copy()
b['min_dist_to_A'] = b.pos.map(minA)
b['is_interface_45'] = b.min_dist_to_A <= 4.5
b['bsa_A2'] = b.pos.map(lambda p: bbr.get(p,(0.0,0.0))[0])
b['iface_delta_g'] = b.pos.map(lambda p: bbr.get(p,(0.0,0.0))[1])
b['has_iface_hbond'] = b.pos.isin(hbn)
b['imgt_region'] = b.pos.map(region)
b = b.sort_values('ddG_pred', kind='mergesort').reset_index(drop=True)
b['B_rank'] = b.index + 1

# one candidate per position for the independent shortlist
seen=set(); indep=[]
for _,r in b.iterrows():
    if r.pos in seen: continue
    seen.add(r.pos); indep.append(r.B_rank)
b['is_position_top'] = b.B_rank.isin(indep)

b.to_csv('raw/bindmut/chainB_candidates_ranked.csv', index=False)
print('B rows (WT excluded):', len(b), '| distinct B positions:', b.pos.nunique())
print()
print('TOP 12 B single-point candidates (native MN ΔDG, ascending = predicted stabilizing):')
cols=['B_rank','mutstr','ddG_pred','min_dist_to_A','is_interface_45','bsa_A2','has_iface_hbond','imgt_region']
print(b[cols].head(12).to_string(index=False))
print()
print('TOP 10 independent-position candidates:')
print(b[b.is_position_top][cols].head(10).to_string(index=False))
# interface-restricted view
bi = b[b.is_interface_45]
print()
print('TOP 10 interface-proximal B candidates (<=4.5A):')
print(bi[cols].head(10).to_string(index=False))
