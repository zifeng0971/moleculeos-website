import gemmi, json, statistics, sys
REF='inputs/MMFold_1.cif'
EPI=[38,40,42,45,47,50,52,53,57,60,97,99,101,103,104,105,106,107,109]
PAR=[27,29,30,32,99,100,101,102,103,104,105,108,109,111,113,114,115,116]
def cas(ch):
    return [(r.seqid.num, r.find_atom('CA','*').pos) for r in ch if r.find_atom('CA','*') is not None]
def run(path,label):
    ref=gemmi.read_structure(REF); rm=ref[0]
    var=gemmi.read_structure(path); vm=var[0]
    rA=cas(rm['A']); vA=cas(vm['A'])
    sup=gemmi.superpose_positions([p for _,p in rA],[p for _,p in vA])  # maps var A onto ref A
    tr=sup.transform
    tp=lambda p: gemmi.Position(tr.apply(p))
    vB={n:tp(p) for n,p in cas(vm['B'])}
    rB={n:p for n,p in cas(rm['B'])}
    vA_t={n:tp(p) for n,p in cas(vm['A'])}
    rA_d={n:p for n,p in cas(rm['A'])}
    def rmsd(pairs):
        ds=[(v-r).length() for v,r in pairs]
        return round((sum(d*d for d in ds)/len(ds))**0.5,2), len(ds)
    out={}
    out['iface_CA_rmsd']=rmsd([(vB[n],rB[n]) for n in PAR]+[(vA_t[n],rA_d[n]) for n in EPI])
    out['paratope_only_CA_rmsd']=rmsd([(vB[n],rB[n]) for n in PAR])
    out['epitope_only_CA_rmsd']=rmsd([(vA_t[n],rA_d[n]) for n in EPI])
    out['framework_B_only_CA_rmsd']=rmsd([(vB[n],rB[n]) for n in rB if n not in PAR])
    # VHH centroid displacement
    vb=[vB[n] for n in vB]; rb=[rB[n] for n in rB]
    cv=gemmi.Position(sum(p.x for p in vb)/len(vb), sum(p.y for p in vb)/len(vb), sum(p.z for p in vb)/len(vb))
    cr=gemmi.Position(sum(p.x for p in rb)/len(rb), sum(p.y for p in rb)/len(rb), sum(p.z for p in rb)/len(rb))
    out['B_centroid_shift_A']=round((cv-cr).length(),2)
    json.dump(out, open(f'variants/iface_rmsd_{label}.json','w'), indent=1)
    print(label, out)
if __name__=='__main__':
    run(sys.argv[1], sys.argv[2])
