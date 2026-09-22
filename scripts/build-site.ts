/** Keep original GIF backups completely outside the static export, even on failed builds. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
const root=process.cwd();
async function main(){
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'mos-gif-build-'));
  const moved:{source:string;backup:string}[]=[];
  try {
    for(const lang of ['zh','en']){
      const source=path.join(root,'public/manual-assets',lang,'gif-original');
      if(await fs.access(source).then(()=>true,()=>false)){const backup=path.join(temporary,lang);await fs.rename(source,backup);moved.push({source,backup});}
    }
    const result=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{stdio:'inherit'});
    if(result.status!==0)throw new Error(`Next build exited ${result.status}`);
  } finally {for(const item of moved)await fs.rename(item.backup,item.source);await fs.rmdir(temporary);}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
