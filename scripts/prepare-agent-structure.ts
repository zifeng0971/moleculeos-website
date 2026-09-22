import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { CIF } from 'molstar/lib/commonjs/mol-io/reader/cif';

// Build-time acquisition only. Runtime viewers load the checked-in same-origin file.
async function main() {
const path = 'public/demo/2bdn.cif';
const checksum = '543e4349682062b6aedd4e93010e6710b3a9bda330f6330f16edc523c33b80fd';
if (!existsSync(path)) {
  const response = await fetch('https://files.rcsb.org/download/2BDN.cif');
  if (!response.ok) throw new Error(`RCSB: ${response.status}`);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}
const raw = readFileSync(path);
if (createHash('sha256').update(raw).digest('hex') !== checksum) throw new Error('2BDN source changed: review revision and checksum before replacing it.');
const parsed = await CIF.parseText(raw.toString()).run();
if (parsed.isError) throw new Error(parsed.message);
const atoms = parsed.result.blocks[0].categories.atom_site;
const field = (name: string) => atoms.getField(name)!;
const chainDefinitions = [
  { label: 'A', auth: 'A', role: 'antigen', color: '#18bba1' },
  { label: 'B', auth: 'L', role: 'light', color: '#a58aee' },
  { label: 'C', auth: 'H', role: 'heavy', color: '#f39838' },
];
const chains = chainDefinitions.map(chain => {
  const residues: { label: string; name: string; x: number; y: number; z: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < atoms.rowCount; i++) {
    if (field('group_PDB').str(i) !== 'ATOM' || field('label_atom_id').str(i) !== 'CA' || field('label_asym_id').str(i) !== chain.label) continue;
    if (field('auth_asym_id').str(i) !== chain.auth) throw new Error('Unexpected author-chain mapping');
    const label = `${chain.auth}:${field('auth_seq_id').str(i)}`;
    if (seen.has(label)) continue;
    seen.add(label);
    residues.push({ label, name: field('label_comp_id').str(i), x: field('Cartn_x').float(i), y: field('Cartn_y').float(i), z: field('Cartn_z').float(i) });
  }
  if (!residues.length) throw new Error(`Missing chain ${chain.label}`);
  return { ...chain, residues };
});
writeFileSync('content/agent-structure.json', JSON.stringify({ id: '2BDN', source: 'https://www.rcsb.org/structure/2BDN', fileSource: 'https://files.rcsb.org/download/2BDN.cif', revision: '1.5', revisionDate: '2024-11-20', sha256: checksum, chains }, null, 2) + '\n');
// Static fallback projected from the actual CA coordinates, not a generated protein illustration.
const points = chains.flatMap(chain => chain.residues);
const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
const scale = Math.min(640 / (maxX - minX), 640 / (maxY - minY));
const paths = chains.map(chain => `<polyline fill="none" stroke="${chain.color}" stroke-width="5" stroke-linejoin="round" points="${chain.residues.map(p => `${80 + (p.x - minX) * scale},${720 - (p.y - minY) * scale}`).join(' ')}"/>`).join('');
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="#1b1b20"/>${paths}</svg>`)).webp({ quality: 85 }).toFile('public/demo/2bdn-preview.webp');
console.log('2BDN verified: A→A antigen, B→L light, C→H heavy; assets prepared.');
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
