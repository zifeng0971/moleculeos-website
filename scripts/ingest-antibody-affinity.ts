import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CIF } from 'molstar/lib/commonjs/mol-io/reader/cif';
import sharp from 'sharp';

type Row = Record<string, string>;

function csvRows(source: string): Row[] {
  const [header, ...lines] = source.trim().split(/\r?\n/);
  const fields = header.split(',');
  return lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [fields[index], value])));
}

function rationales(source: string) {
  const map = new Map<string, string>();
  for (const line of source.split(/\r?\n/)) {
    if (!/^\| [BC] \|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length !== 10 || !/^\d+$/.test(cells[2])) continue;
    map.set(`${cells[0]}:${cells[2]}${cells[3]}`, cells[9]);
  }
  return map;
}

async function main() {
const args = process.argv.slice(2);
if (args.length !== 3) {
  throw new Error('Usage: npm run ingest:affinity -- <final-panel.csv> <analysis.md> <structure.cif>');
}
const [csvPath, analysisPath, structurePath] = args;
const output = 'public/demo/antibody-affinity';
mkdirSync(output, { recursive: true });

const rows = csvRows(readFileSync(csvPath, 'utf8'));
const rationaleByKey = rationales(readFileSync(analysisPath, 'utf8'));
const panel = rows.map(row => {
  const rationale = rationaleByKey.get(row.key);
  if (!rationale) throw new Error(`Missing rationale for ${row.key}`);
  return {
    chain: row.chain,
    position: Number(row.pos),
    wildType: row.wt,
    mutation: row.mut,
    key: row.key,
    tier: row.tier,
    rank: Number(row.rank_ddg),
    bindingAffinity: { score: Number(row.ddG), percentile: Number(row.p_aff) },
    structuralFitness: { score: Number(row.struct), percentile: Number(row.p_str) },
    sequenceFitness: { score: Number(row.seq), percentile: Number(row.p_seq) },
    context: { region: row.region, antigenDistance: Number(row.d_ag), paratopeDistance: Number(row.d_par) },
    plddt: Number(row.plddt),
    rationale,
  };
}).sort((a, b) => (a.tier === b.tier ? a.rank - b.rank : a.tier === 'STRONG' ? -1 : 1));

if (panel.length !== 30 || panel.filter(row => row.tier === 'STRONG').length !== 8) {
  throw new Error('Expected 30 recommendations: 8 STRONG and 22 RECOMMEND.');
}
writeFileSync(`${output}/panel.json`, JSON.stringify(panel, null, 2) + '\n');

const unsafeCif = readFileSync(structurePath, 'utf8');
const safeCif = unsafeCif.replace(/\d{12,}_model_sample_\d+/g, 'antibody_affinity_complex');
if (/\d{12,}_model_sample_\d+/.test(safeCif)) throw new Error('Structure identifier was not sanitized.');
writeFileSync(`${output}/structure.cif`, safeCif);

const parsed = await CIF.parseText(safeCif).run();
if (parsed.isError) throw new Error(parsed.message);
const block = parsed.result.blocks[0];
const atomSite = block.categories.atom_site;
const atom = (name: string) => atomSite.getField(name)!;
const definitions = [
  { label: 'A', auth: 'A', role: 'antigen', color: '#18bba1' },
  { label: 'B', auth: 'B', role: 'heavy', color: '#a58aee' },
  { label: 'C', auth: 'C', role: 'light', color: '#f39838' },
] as const;
const chains = definitions.map(chain => {
  const residues: { label: string; name: string; x: number; y: number; z: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < atomSite.rowCount; i++) {
    if (atom('group_PDB').str(i) !== 'ATOM' || atom('label_atom_id').str(i) !== 'CA') continue;
    if (atom('label_asym_id').str(i) !== chain.label || atom('auth_asym_id').str(i) !== chain.auth) continue;
    const label = `${chain.auth}:${atom('auth_seq_id').str(i)}`;
    if (seen.has(label)) continue;
    seen.add(label);
    residues.push({ label, name: atom('label_comp_id').str(i), x: atom('Cartn_x').float(i), y: atom('Cartn_y').float(i), z: atom('Cartn_z').float(i) });
  }
  if (!residues.length) throw new Error(`Missing expected chain ${chain.auth}`);
  return { ...chain, residues };
});

const oneLetter: Record<string, string> = { ALA:'A',ARG:'R',ASN:'N',ASP:'D',CYS:'C',GLN:'Q',GLU:'E',GLY:'G',HIS:'H',ILE:'I',LEU:'L',LYS:'K',MET:'M',PHE:'F',PRO:'P',SER:'S',THR:'T',TRP:'W',TYR:'Y',VAL:'V' };
for (const item of panel) {
  const residue = chains.find(chain => chain.auth === item.chain)?.residues.find(residue => residue.label === `${item.chain}:${item.position}`);
  if (!residue || oneLetter[residue.name] !== item.wildType) throw new Error(`WT mismatch for ${item.key}`);
}
const fasta = chains.map(chain => `>${chain.role}|chain_${chain.auth}|${chain.residues.length}_aa\n${chain.residues.map(residue => oneLetter[residue.name] ?? 'X').join('')}`).join('\n') + '\n';
writeFileSync(`${output}/input.fasta`, fasta);

const highlighted = [29,30,31,48,58,59,61,62,67,69,71,95,104].map(position => `B:${position}`)
  .concat([32,34,56,70,71,89,91,103].map(position => `C:${position}`));
const sha256 = createHash('sha256').update(safeCif).digest('hex');
writeFileSync('content/antibody-affinity-structure.json', JSON.stringify({ id: 'antibody-affinity-complex', sha256, highlighted, chains }, null, 2) + '\n');

const points = chains.flatMap(chain => chain.residues);
const minX = Math.min(...points.map(point => point.x)), maxX = Math.max(...points.map(point => point.x));
const minY = Math.min(...points.map(point => point.y)), maxY = Math.max(...points.map(point => point.y));
const scale = Math.min(720 / (maxX - minX), 720 / (maxY - minY));
const xy = (point: {x:number;y:number}) => `${80 + (point.x - minX) * scale},${800 - (point.y - minY) * scale}`;
const paths = chains.map(chain => `<polyline fill="none" stroke="${chain.color}" stroke-width="7" stroke-linejoin="round" points="${chain.residues.map(xy).join(' ')}"/>`).join('');
const marks = points.filter(point => highlighted.includes(point.label)).map(point => `<circle cx="${80 + (point.x - minX) * scale}" cy="${800 - (point.y - minY) * scale}" r="6" fill="#63e66c"/>`).join('');
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" fill="#1e1e1e"/>${paths}${marks}</svg>`)).png().toFile(`${output}/preview.png`);
console.log(`Prepared ${panel.length} recommendations, ${chains.length} chains and ${highlighted.length} highlighted residues.`);
}

void main().catch(error => { console.error(error); process.exitCode = 1; });
