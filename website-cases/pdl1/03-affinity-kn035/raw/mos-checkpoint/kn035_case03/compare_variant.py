#!/usr/bin/env python3
"""Align a variant complex onto MMFold_1 using chain A (PD-L1) CA atoms only,
then report how the mutated VHH position sits relative to its antigen neighbours."""
import sys, json, statistics, os
import gemmi

REF = 'inputs/MMFold_1.cif'
THREE2ONE = {'ALA':'A','ARG':'R','ASN':'N','ASP':'D','CYS':'C','GLN':'Q','GLU':'E','GLY':'G',
             'HIS':'H','ILE':'I','LEU':'L','LYS':'K','MET':'M','PHE':'F','PRO':'P','SER':'S',
             'THR':'T','TRP':'W','TYR':'Y','VAL':'V'}

def ca(chain):
    return [(r.seqid.num, r.find_atom('CA','*').pos) for r in chain if r.find_atom('CA','*') is not None]

def neighbour_A(pos_xyz, chainA, cut):
    out = []
    if isinstance(pos_xyz, gemmi.Residue):
        atoms = list(pos_xyz)
    else:
        atoms = None
    for r in chainA:
        if atoms is None:
            d = min((a.pos - pos_xyz).length() for a in r)
        else:
            d = min((a1.pos - a2.pos).length() for a1 in atoms for a2 in r)
        if d <= cut:
            out.append({'chain':'A','res':r.seqid.num,'aa':THREE2ONE.get(r.name,'X'),'min_dist':round(d,2)})
    return sorted(out, key=lambda x: x['min_dist'])

def main(vpath, pos, wt, mut, label):
    ref = gemmi.read_structure(REF); rm = ref[0]
    var = gemmi.read_structure(vpath); vm = var[0]
    res = {'label': label, 'variant_file': os.path.basename(vpath), 'mutation': f'B:{wt}{pos}{mut}'}

    refA = ca(rm['A']); varA = ca(vm['A'])
    assert [p for p,_ in refA] == [p for p,_ in varA], 'chain A numbering mismatch'
    pv = [p for _, p in varA]; pr = [p for _, p in refA]
    sup = gemmi.superpose_positions(pv, pr); tr = sup.transform; rmsdA = sup.rmsd
    res['chainA_ca_rmsd_A'] = round(rmsdA, 3)

    # apply transform to all variant atoms
    newpos = {}
    for ch in vm:
        for r in ch:
            for a in r:
                p = gemmi.Position(tr.apply(a.pos)); newpos[(ch.name, r.seqid.num, a.name)] = p
    def rmsd_chain(name, refname):
        ds = []
        for r in vm[name]:
            ra = r.find_atom('CA','*')
            rr = rm[refname][r.seqid.num - 1].find_atom('CA','*') if refname in [c.name for c in rm] else None
            if ra is not None and rr is not None:
                ds.append((newpos[(name, r.seqid.num, 'CA')] - rr.pos).length())
        return ds
    def ca_rmsd(name, refname):
        ds = rmsd_chain(name, refname)
        return round((sum(d*d for d in ds)/len(ds))**0.5, 3) if ds else None
    res['chainB_ca_rmsd_A_after_Aalign'] = ca_rmsd('B','B')

    # overall complex RMSD after A-alignment
    all_ds = []
    for ch in ['A','B']:
        for r in vm[ch]:
            rr = rm[ch][r.seqid.num - 1]
            for a in r:
                ra = rr.find_atom(a.name,'*')
                if ra is not None:
                    all_ds.append((newpos[(ch, r.seqid.num, a.name)] - ra.pos).length())
    res['complex_allatom_rmsd_A'] = round((sum(d*d for d in all_ds)/len(all_ds))**0.5, 3)

    # mutated position geometry
    vres = vm['B'][pos-1]
    res['variant_residue'] = THREE2ONE.get(vres.name,'X')
    res['variant_residue_matches_requested'] = (THREE2ONE.get(vres.name,'X') == mut)
    cpos = newpos[('B', pos, 'CA')]
    res['mutated_pos_min_dist_to_A'] = round(min((a.pos - cpos).length() for r in rm['A'] for a in r), 2)
    res['A_neighbours_within_4.5A'] = neighbour_A(vres, rm['A'], 4.5)
    res['A_neighbours_within_6A'] = neighbour_A(vres, rm['A'], 6.0)

    # reference (WT) same position for comparison
    wres = rm['B'][pos-1]
    res['reference_residue_at_position'] = THREE2ONE.get(wres.name,'X')
    refc = wres.find_atom('CA','*').pos
    res['reference_pos_min_dist_to_A'] = round(min((a.pos - refc).length() for r in rm['A'] for a in r), 2)
    res['reference_A_neighbours_within_6A'] = neighbour_A(wres, rm['A'], 6.0)

    # per-chain pLDDT of variant
    plddt = {}
    for ch in ['A','B']:
        bs = [r.find_atom('CA','*').b_iso for r in vm[ch] if r.find_atom('CA','*') is not None]
        plddt[ch] = {'mean_ca_plddt': round(statistics.mean(bs),2), 'min': round(min(bs),2)} if bs else None
    res['variant_plddt_from_bfactor'] = plddt
    bs = [r.find_atom('CA','*').b_iso for r in vm['B'] if r.find_atom('CA','*') is not None]
    if bs:
        res['variant_plddt_at_mutated_position'] = round(vm['B'][pos-1].find_atom('CA','*').b_iso, 2)

    # disulfide check in variant
    import itertools
    sg = [(ch.name, r.seqid.num, a.pos) for ch in vm for r in ch for a in r if a.name=='SG']
    ss = []
    for (c1,r1,p1),(c2,r2,p2) in itertools.combinations(sg,2):
        d = (p1-p2).length()
        if d < 2.5: ss.append([f'{c1}:{r1}', f'{c2}:{r2}', round(d,2)])
    res['variant_disulfides_SG_under_2.5A'] = sorted(ss)
    json.dump(res, open(f'variants/compare_{label}.json','w'), indent=1)
    print(json.dumps({k:res[k] for k in ['label','chainA_ca_rmsd_A','chainB_ca_rmsd_A_after_Aalign',
          'complex_allatom_rmsd_A','mutated_pos_min_dist_to_A','A_neighbours_within_4.5A',
          'variant_plddt_from_bfactor','variant_plddt_at_mutated_position','variant_disulfides_SG_under_2.5A']}, indent=1))

if __name__ == '__main__':
    main(sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5])
