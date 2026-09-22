/** Generate real HTTP 301 hosting rules from the same manifest used by navigation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import type {ManualManifest} from '../lib/manual-types';
async function main(){
  const root=process.cwd();const manifest=JSON.parse(await fs.readFile(path.join(root,'content/manual/manifest.json'),'utf8')) as ManualManifest;
  const modulePath='../lib/legacy-redirects.mjs';const {legacyRedirects}=await import(modulePath) as {legacyRedirects:{source:string;destination:string}[]};
  const manual=Object.entries(manifest.languages).flatMap(([lang,data])=>data.groups.flatMap(g=>g.pages.map(p=>({source:`${lang==='en'?'/en':''}/docs/manual/${g.slug}/${p.slug}`,destination:p.href}))));
  const rules=[...legacyRedirects,...manual];
  await fs.writeFile(path.join(root,'public/_redirects'),rules.flatMap(r=>[`${r.source} ${r.destination} 301`,`${r.source}/ ${r.destination} 301`]).join('\n')+'\n');
  const config=JSON.parse(await fs.readFile(path.join(root,'vercel.json'),'utf8'));config.redirects=rules.flatMap(r=>[{...r,statusCode:301},{source:r.source+'/',destination:r.destination,statusCode:301}]);await fs.writeFile(path.join(root,'vercel.json'),JSON.stringify(config,null,2)+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
