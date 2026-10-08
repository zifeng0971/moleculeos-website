import { readFileSync, writeFileSync } from 'node:fs';
import { CIF } from 'molstar/lib/commonjs/mol-io/reader/cif';

// The supplied local model uses B=heavy and C=light. The workbench presents the
// product convention B=light and C=heavy, so swap chain IDs in a static copy.
const source = 'public/demo/antibody-affinity/structure.cif';
const target = 'public/demo/antibody-affinity/workbench.cif';
const raw = readFileSync(source, 'utf8');
const swap = (value: string) => value === 'B' ? 'C' : value === 'C' ? 'B' : value;
let category = '';
const remapped = raw.split('\n').map(line => {
  if (line.startsWith('_')) {
    category = line.slice(1).split('.')[0];
    return line;
  }
  if (line === '#' || line === 'loop_' || !line.trim()) {
    if (line === '#') category = '';
    return line;
  }
  if (category === 'entity_poly') {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 4) parts[2] = swap(parts[2]);
    return parts.join(' ');
  }
  if (category === 'struct_asym') {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 2) parts[0] = swap(parts[0]);
    return parts.join(' ');
  }
  if (category === 'atom_site' && line.startsWith('ATOM ')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 19) {
      parts[6] = swap(parts[6]);
      parts[17] = swap(parts[17]);
      return parts.join(' ');
    }
  }
  if (category === 'mos_mapping') {
    const parts = line.trim().split(/\s+/);
    if (parts.length === 6) {
      parts[0] = swap(parts[0]);
      parts[3] = swap(parts[3]);
      return parts.join(' ');
    }
  }
  return line;
}).join('\n');

async function main() {
  const parsed = await CIF.parseText(remapped).run();
  if (parsed.isError) throw new Error(parsed.message);
  const atoms = parsed.result.blocks[0].categories.atom_site;
  const entity = atoms.getField('label_entity_id')!;
  const chain = atoms.getField('auth_asym_id')!;
  const mapped = new Map<string, string>();
  for (let index = 0; index < atoms.rowCount; index++) {
    mapped.set(entity.str(index), chain.str(index));
  }
  if (mapped.get('1') !== 'A' || mapped.get('2') !== 'C' || mapped.get('3') !== 'B') {
    throw new Error('Workbench chain remap did not preserve antigen, heavy and light entities');
  }
  writeFileSync(target, remapped);

  // Real atom-to-atom proximity (<4.5 Å) for the scripted interface view.
  const coordinates = ['Cartn_x', 'Cartn_y', 'Cartn_z'].map(key => atoms.getField(key)!);
  const number = atoms.getField('auth_seq_id')!;
  const antigen: Array<[number, number, number]> = [];
  const antibody: Array<{ chain: string; residue: string; xyz: [number, number, number] }> = [];
  for (let index = 0; index < atoms.rowCount; index++) {
    if (atoms.getField('group_PDB')!.str(index) !== 'ATOM') continue;
    const xyz = coordinates.map(field => field.float(index)) as [number, number, number];
    if (chain.str(index) === 'A') antigen.push(xyz);
    else antibody.push({ chain: chain.str(index), residue: number.str(index), xyz });
  }
  const contacts = new Set<string>();
  for (const atom of antibody) {
    if (contacts.has(`${atom.chain}:${atom.residue}`)) continue;
    if (antigen.some(([x, y, z]) => (atom.xyz[0] - x) ** 2 + (atom.xyz[1] - y) ** 2 + (atom.xyz[2] - z) ** 2 < 4.5 ** 2)) {
      contacts.add(`${atom.chain}:${atom.residue}`);
    }
  }
  writeFileSync('content/mocha-workbench-contacts.json', JSON.stringify([...contacts].sort(), null, 2) + '\n');
  console.log(`Mocha workbench static structure prepared: A=antigen, B=light, C=heavy; ${contacts.size} antibody contact residues.`);
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
