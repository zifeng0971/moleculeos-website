import fs from 'node:fs/promises';
import path from 'node:path';
import { buildManualSearch } from '../lib/manual-search-index';
async function main(){const root=process.cwd();const manifest=JSON.parse(await fs.readFile(path.join(root,'content/manual/manifest.json'),'utf8'));await buildManualSearch(manifest,root);console.log('Static manual search indexes rebuilt.');}
main().catch(error=>{console.error(error);process.exitCode=1;});
