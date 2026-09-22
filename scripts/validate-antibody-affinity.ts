import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const root = 'public/demo/antibody-affinity';
const panel = JSON.parse(readFileSync(`${root}/panel.json`, 'utf8')) as Array<{ key:string;tier:string;rank:number;rationale:string }>;
const meta = JSON.parse(readFileSync('content/antibody-affinity-structure.json', 'utf8')) as { sha256:string;highlighted:string[];chains:Array<{auth:string;residues:unknown[]}> };
const cif = readFileSync(`${root}/structure.cif`, 'utf8');
assert.equal(panel.length, 30);
assert.equal(panel.filter(item => item.tier === 'STRONG').length, 8);
assert.equal(panel.filter(item => item.tier === 'RECOMMEND').length, 22);
assert.equal(new Set(panel.map(item => item.key)).size, 30);
assert.ok(panel.every(item => item.rationale && Number.isFinite(item.rank)));
assert.equal(createHash('sha256').update(cif).digest('hex'), meta.sha256);
assert.deepEqual(meta.chains.map(chain => chain.auth), ['A', 'B', 'C']);
assert.equal(meta.highlighted.length, 21);
for (const text of [cif, readFileSync(`${root}/input.fasta`, 'utf8'), JSON.stringify(panel)]) {
  assert.doesNotMatch(text, /\d{12,}_model_sample_\d+|projectId|work ID|session ID|\/app\/src\/|\/workspace\/|feishu|wiki/i);
}
console.log('Antibody affinity assets: counts, checksum, chain mapping and sanitization passed.');
