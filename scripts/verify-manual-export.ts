import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import AdmZip from 'adm-zip';
import { load } from 'cheerio';
import type { ManualManifest } from '../lib/manual-types';

async function main(){
  const root=process.cwd();const manifest=JSON.parse(await fs.readFile(path.join(root,'content/manual/manifest.json'),'utf8')) as ManualManifest;
  for(const locale of ['zh','en'] as const){
    const input=locale==='zh'?(process.env.MANUAL_ZH??path.join(os.homedir(),'Desktop','分子之心 MoleculeOS 用户操作手册.docx')):(process.env.MANUAL_EN??path.join(os.homedir(),'Desktop','MoleculeMind - MoleculeOS User Guide.docx'));
    const xml=load(new AdmZip(input).readAsText('word/document.xml'),{xml:true});const original=xml('w\\:t').text().replace(/\[[^\[\]\r\n]+\.(?:mov|mp4)\]/gi,'').replace(/\s/g,'');
    const index=load(await fs.readFile(path.join(root,'out',locale==='en'?'en':'','help/manual/index.html'),'utf8'));
    const flow=index('[data-manual-flow]').clone();flow.find('button,script,dialog').remove();let actual=flow.text();
    assert.equal(index('.manual-pagination').length,0,'Continuous manual must not paginate');
    assert.equal(index('[data-manual-flow] img[src*="/filtered/"]').length,0,'Filtered resources must not appear in body');
    const ids=index('[data-manual-flow] [id]').map((_,e)=>index(e).attr('id')).get();assert.equal(new Set(ids).size,ids.length,'Continuous anchors must be globally unique');
    actual=actual.replace(/\s/g,'');
    if(actual!==original){let i=0;while(actual[i]===original[i]&&i<Math.min(actual.length,original.length))i++;throw new Error(`${locale}: 导出文字不一致，位置 ${i}；原文 ${original.slice(i,i+100)}；网页 ${actual.slice(i,i+100)}`);}
    console.log(`${locale}: exported web text matches DOCX body (${original.length} non-whitespace characters).`);
  }
  assert.equal(await fs.access(path.join(root,'out/dev/manual-assets/index.html')).then(()=>true,()=>false),false,'Dev gallery must not be exported');
  async function scan(dir:string):Promise<string[]>{const entries=await fs.readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?scan(path.join(dir,e.name)):Promise.resolve([path.join(dir,e.name)])))).flat();}
  const files=await scan(path.join(root,'out'));
  assert(!files.some(file=>file.toLowerCase().endsWith('.docx')),'Never publish source DOCX files');
  assert(!files.some(file=>file.includes('/gif-original/')),'Never deploy original GIF backups');
  console.log('Production checks passed: no developer gallery and no DOCX downloads.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
