import fs from 'node:fs/promises';
import path from 'node:path';
// This one generated route exists only during local development. Never included in static exports.
const route=path.join(process.cwd(),'app/dev/manual-assets/page.tsx');
const marker='// GENERATED DEV-ONLY MANUAL ASSETS ROUTE';
async function main(){if(process.argv[2]==='dev'){
  await fs.mkdir(path.dirname(route),{recursive:true});
  await fs.writeFile(route,`${marker}\nimport { ManualAssetsGallery } from '@/components/docs/manual-assets-gallery';\nexport default function Page(){return <ManualAssetsGallery/>}\n`);
}else{
  const content=await fs.readFile(route,'utf8').catch(()=>null);
  if(content&&!content.startsWith(marker))throw new Error('Refusing to remove an unowned development route.');
  if(content)await fs.unlink(route);
}}
main().catch(error=>{console.error(error);process.exitCode=1;});
