#!/usr/bin/env python
"""Per-residue SASA helper (Shrake-Rupley, probe 1.4 A, 960 points, single calc per process).

Called in a fresh process for every PDB because freeSASA segfaults when many
Structure/Result objects are created sequentially in one interpreter.
Output: JSON { "<chain>": {"<resnum>": area}, ... , "_total": area }
"""
import json, sys
import freesasa

freesasa.setVerbosity(freesasa.silent)
path = sys.argv[1]
s = freesasa.Structure(path)
p = freesasa.Parameters({"algorithm": freesasa.ShrakeRupley,
                         "n-points": 960, "probe-radius": 1.4})
r = freesasa.calc(s, p)
out = {"_total": round(r.totalArea(), 3)}
for i in range(s.nAtoms()):
    ch = s.chainLabel(i)
    rn = int(s.residueNumber(i))
    out.setdefault(ch, {})
    out[ch][rn] = round(out[ch].get(rn, 0.0) + r.atomArea(i), 3)
print(json.dumps(out))
