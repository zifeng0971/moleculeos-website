/**
 * Derives the VEGF-A / G6 Fab annotations used by the homepage capability stage from the public PDB entry 2FJG
 * (public/demo/2fjg.cif, RCSB, CC0). Contacts are measured on the coordinates, nothing is hand-entered.
 * Output: content/vegf-2fjg.json
 * Run: npx tsx scripts/prepare-vegf-2fjg.ts
 */
import fs from 'node:fs';
import path from 'node:path';

type Atom = { chain: string; seq: number; aa: string; name: string; x: number; y: number; z: number; b: number };
const THREE_TO_ONE: Record<string, string> = {
  ALA: 'A', ARG: 'R', ASN: 'N', ASP: 'D', CYS: 'C', GLN: 'Q', GLU: 'E', GLY: 'G', HIS: 'H', ILE: 'I',
  LEU: 'L', LYS: 'K', MET: 'M', PHE: 'F', PRO: 'P', SER: 'S', THR: 'T', TRP: 'W', TYR: 'Y', VAL: 'V',
};

function readAtoms(file: string): Atom[] {
  const header: string[] = [];
  const atoms: Atom[] = [];
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    if (raw.startsWith('_atom_site.')) { header.push(raw.trim().slice('_atom_site.'.length)); continue; }
    if (!raw.startsWith('ATOM')) continue;
    const c = raw.trim().split(/\s+/), get = (n: string) => c[header.indexOf(n)];
    const alt = get('label_alt_id');
    if (alt && alt !== '.' && alt !== 'A') continue;
    atoms.push({ chain: get('auth_asym_id'), seq: Number(get('auth_seq_id')), aa: THREE_TO_ONE[get('label_comp_id')] ?? 'X', name: get('label_atom_id'),
      x: Number(get('Cartn_x')), y: Number(get('Cartn_y')), z: Number(get('Cartn_z')), b: Number(get('B_iso_or_equiv')) });
  }
  return atoms;
}

const root = process.cwd();
const atoms = readAtoms(path.join(root, 'public/demo/2fjg.cif'));
const d2 = (a: Atom, b: Atom) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
const of = (chains: string[]) => atoms.filter(a => chains.includes(a.chain));
const label = (a: Atom) => `${a.chain}:${a.seq}`;

/** Residues of `from` with any heavy atom closer than `cut` Å to `to`, with their atom-contact counts. */
function contacts(from: Atom[], to: Atom[], cut = 4.5) {
  const counts = new Map<string, { label: string; aa: string; n: number }>();
  for (const a of from) {
    let n = 0;
    for (const b of to) if (d2(a, b) < cut * cut) n++;
    if (!n) continue;
    const key = label(a), cur = counts.get(key);
    counts.set(key, { label: key, aa: a.aa, n: (cur?.n ?? 0) + n });
  }
  return [...counts.values()].sort((p, q) => Number(p.label.split(':')[1]) - Number(q.label.split(':')[1]));
}

// Crystal assembly: one VEGF-A monomer is bound mainly by one Fab (V–L/H, W–A/B); a Fab sits across the dimer axis.
const PAIRS = [{ antigen: 'V', light: 'L', heavy: 'H' }, { antigen: 'W', light: 'A', heavy: 'B' }];
const pair = PAIRS[0];
const antigen = of([pair.antigen]), fab = of([pair.light, pair.heavy]);
const epitope = contacts(antigen, fab);
const paratope = contacts(fab, antigen);
// The second VEGF-A monomer carries the same epitope towards the second Fab (two-fold symmetry of the crystal assembly).
const mirror = PAIRS[1];
const epitopeMirror = contacts(of([mirror.antigen]), of([mirror.light, mirror.heavy]));
const paratopeMirror = contacts(of([mirror.light, mirror.heavy]), of([mirror.antigen]));

/** Closest heavy-atom pair for every contacting Fab residue: the lines drawn across the interface. Coordinates in Å, rounded to 0.1. */
function arcs(antigenChain: string, fabChains: string[], cut = 4.5) {
  const ag = of([antigenChain]), out: number[][] = [];
  const byResidue = new Map<string, Atom[]>();
  for (const a of of(fabChains)) { const k = label(a); byResidue.set(k, [...(byResidue.get(k) ?? []), a]); }
  for (const atoms of byResidue.values()) {
    let best: [Atom, Atom, number] | undefined;
    for (const a of atoms) for (const b of ag) { const d = d2(a, b); if (d < cut * cut && (!best || d < best[2])) best = [a, b, d]; }
    if (best) out.push([best[0], best[1]].flatMap(a => [a.x, a.y, a.z]).map(v => Math.round(v * 10) / 10));
  }
  return out;
}
const round1 = (v: number) => Math.round(v * 10) / 10;
/** Cα trace per chain (flat x,y,z in Å): the target positions the particle layer assembles into. */
const ca = Object.fromEntries(['V', 'W', 'L', 'H', 'A', 'B'].map(c => [c, atoms.filter(a => a.chain === c && a.name === 'CA').flatMap(a => [round1(a.x), round1(a.y), round1(a.z)])]));
/** Cα position of every labelled residue the stage highlights. */
const caOf = (l: string) => { const [c, n] = l.split(':'); const a = atoms.find(x => x.chain === c && x.seq === Number(n) && x.name === 'CA')!; return [round1(a.x), round1(a.y), round1(a.z)]; };
const strongest = (list: typeof epitope, k: number) => [...list].sort((p, q) => q.n - p.n).slice(0, k).map(r => r.label);

// Framework sites for stability work: variable domain only, far (>12 Å) from every antigen atom, flexible (high B), not Cys/Gly/Pro, spread along the chain.
const framework: string[] = [];
const far = (a: Atom) => a.seq > 3 && a.seq <= (a.chain === pair.heavy ? 120 : 108) && !'CGP'.includes(a.aa) && antigen.every(b => d2(a, b) > 144);
const cas = fab.filter(a => a.name === 'CA' && far(a)).sort((p, q) => q.b - p.b);
for (const a of cas) if (framework.length < 5 && framework.every(l => l.split(':')[0] !== a.chain || Math.abs(Number(l.split(':')[1]) - a.seq) > 15)) framework.push(label(a));

const sequence = (chain: string) => atoms.filter(a => a.chain === chain && a.name === 'CA').map(a => a.aa).join('');
const output = {
  _source: 'Generated by scripts/prepare-vegf-2fjg.ts from public/demo/2fjg.cif (PDB 2FJG, G6 Fab in complex with VEGF-A, X-ray 2.8 Å)',
  pdb: '2FJG',
  chains: { vegf: ['V', 'W'], light: ['L', 'A'], heavy: ['H', 'B'] },
  pair,
  epitope: epitope.map(r => r.label), epitopeAa: Object.fromEntries(epitope.map(r => [r.label, r.aa])),
  epitopeMirror: epitopeMirror.map(r => r.label),
  paratopeMirror: paratopeMirror.map(r => r.label),
  arcs: [...arcs(pair.antigen, [pair.light, pair.heavy]), ...arcs(mirror.antigen, [mirror.light, mirror.heavy])],
  ca,
  pos: Object.fromEntries([...epitope, ...epitopeMirror, ...paratope, ...paratopeMirror].map(r => r.label).concat(framework).map(l => [l, caOf(l)])),
  paratope: paratope.map(r => r.label), paratopeAa: Object.fromEntries(paratope.map(r => [r.label, r.aa])),
  hotspotsAntigen: strongest(epitope, 6),
  hotspotsFab: strongest(paratope, 8),
  framework,
  frameworkAa: Object.fromEntries(framework.map(l => { const [c, s] = l.split(':'); return [l, fab.find(a => a.chain === c && a.seq === Number(s))!.aa]; })),
  heavySeq: sequence(pair.heavy).slice(0, 120),
};
fs.writeFileSync(path.join(root, 'content/vegf-2fjg.json'), JSON.stringify(output, null, 1));
console.log(`epitope ${epitope.length}, paratope ${paratope.length}\nhotspots`, output.hotspotsAntigen, output.hotspotsFab, '\nframework', framework);
