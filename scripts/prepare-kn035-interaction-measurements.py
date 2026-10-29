"""Recover 3D measurement loci locally from the immutable MMFold_1 coordinates.

MOS exports residue pairs and distances, not atom identifiers. Atom pairs below
are inferred by matching those distances (within the export's 0.001 A precision),
not claimed as exported MOS atom assignments. Ionic and aromatic interactions
use the charge-group and ring centroids. No coordinates or distances are fitted.
"""
from pathlib import Path
import collections
import hashlib
import json
import math
import shlex

master = Path('website-cases/pdl1/01-structure/raw/MMFold_1.cif')
source = Path('website-cases/pdl1/02-mmetrics-kn035/raw/mos-export/kn035_case02/raw/native_task_342604577018880/record.json')
assert hashlib.sha256(master.read_bytes()).hexdigest() == 'd32305d7574f2013471f1c5844c24f7e47473e03f580201b5241218044822317'
headers, residues = [], collections.defaultdict(dict)
for line in master.read_text().splitlines():
    if line.startswith('_atom_site.'):
        headers.append(line.split('.')[1])
    elif line.startswith('ATOM '):
        atom = dict(zip(headers, shlex.split(line)))
        assert atom['auth_seq_id'] == atom['label_seq_id'] and atom['auth_asym_id'] == atom['label_asym_id']
        residues[f"{atom['auth_asym_id']}:{atom['auth_seq_id']}"][atom['label_atom_id']] = [float(atom[f'Cartn_{axis}']) for axis in 'xyz']

def residue(key):
    name, chain = key.split('.')
    return f'{chain}:{name[3:]}'

def center(label, names):
    return [sum(residues[label][name][axis] for name in names) / len(names) for axis in range(3)]

rows = []
for link in json.loads(source.read_text())['interactions']['2d_plot_data'][0]['interactions']:
    a, b = residue(link['residue_key_a']), residue(link['residue_key_b'])
    category, distance = link['category'], link['distance']
    if category == 'Ionic':
        names_a, names_b = ['NE', 'CZ', 'NH1', 'NH2'], ['CG', 'OD1', 'OD2']
        method = 'charge-group-centroids'
    elif category == 'π-π Stack':
        names_a = names_b = ['CG', 'CD1', 'CD2', 'CE1', 'CE2', 'CZ']
        method = 'aromatic-ring-centroids'
    else:
        _, na, nb = min((abs(math.dist(pa, pb) - distance), na, nb) for na, pa in residues[a].items() for nb, pb in residues[b].items())
        names_a, names_b = [na], [nb]
        method = 'atom-pair-matched-to-exported-distance'
    measured = math.dist(center(a, names_a), center(b, names_b))
    assert abs(measured - distance) <= 0.00051, (a, b, category, measured, distance)
    rows.append({'a': link['residue_key_a'], 'b': link['residue_key_b'], 'category': category,
                 'residues': [a, b], 'atoms': [names_a, names_b], 'sourceDistance': distance,
                 'coordinateDistance': measured, 'points': [center(a, names_a), center(b, names_b)], 'method': method})
output = {'source': str(source), 'structure': str(master), 'structureSha256': hashlib.sha256(master.read_bytes()).hexdigest(),
          'provenance': 'Local reconstruction of measurement loci from MMFold_1; MOS provides residue pairs and distances only. Atom identities are inferred, not native exported assignments.',
          'toleranceAngstrom': 0.00051, 'interactions': rows}
Path('content/kn035-interaction-measurements.json').write_text(json.dumps(output, indent=2, ensure_ascii=False) + '\n')
print(f'{len(rows)} measurements verified against MMFold_1 and native MOS distances.')
