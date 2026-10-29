"""Keep MOS SVG geometry intact; add only semantic bindings for 3D interaction.

Run from the repository root: python3 scripts/prepare-kn035-native-network.py
"""
from pathlib import Path
import collections
import hashlib
import json
import re
import xml.etree.ElementTree as ET

source = Path('website-cases/pdl1/02-mmetrics-kn035/raw/native-ui/interaction-plot-1.svg')
svg = ET.fromstring(source.read_text())
nodes = {}
for group in svg.iter('g'):
    circle = group.find('circle')
    if circle is None:
        continue
    name, label = [text.text for text in group.findall('text')]
    match = re.fullmatch(r'([AB])(\d+)', label)
    assert match, label
    chain, number = match.groups()
    key = f'{name}{number}.{chain}'
    group.set('data-residue-id', f'{chain}:{number}')
    group.set('data-residue-key', key)
    group.set('data-residue-name', name)
    nodes[(float(circle.get('cx')), float(circle.get('cy')))] = key

categories = {'#36cfc9': 'H-Bond', '#9aa0a6': 'VdW Contact', '#ff7a45': 'Ionic', '#ff9c6e': 'π-π Stack'}
edges = []
for group in svg.iter('g'):
    line = group.find('line')
    if line is None:
        continue
    a = nodes[(float(line.get('x1')) - 15, float(line.get('y1')))]
    b = nodes[(float(line.get('x2')) + 15, float(line.get('y2')))]
    category = categories[line.get('stroke')]
    distance = float(group.find('text').text.removesuffix('Å'))
    group.set('data-link-a', a)
    group.set('data-link-b', b)
    group.set('data-link-category', category)
    edges.append((category, a, b, distance))

record = json.loads(Path('content/mmetrics-kn035.json').read_text())['interactions'][0]
expected = [(link['category'], link['a'], link['b'], link['distance']) for link in record['links']]
assert collections.Counter(edges) == collections.Counter(expected), 'SVG and interaction table differ'
assert len(nodes) == 33 and len(edges) == 44
output = {
    'source': str(source),
    'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'nodeCount': len(nodes),
    'interactionCount': len(edges),
    'svg': ET.tostring(svg, encoding='unicode'),
}
Path('content/mmetrics-kn035-native-network.json').write_text(json.dumps(output, ensure_ascii=False, indent=2) + '\n')
print('MOS native network: 33 nodes and 44 interactions verified against the website data.')
