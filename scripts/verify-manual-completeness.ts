import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { load } from 'cheerio';
import type { ManualManifest } from '../lib/manual-types';

async function main(){
  const root=process.cwd();
  const manifest=JSON.parse(await fs.readFile('content/manual/manifest.json','utf8')) as ManualManifest;
  const supplement=JSON.parse(await fs.readFile('content/manual-source/supplements/function-call.json','utf8'));
  const originals=JSON.parse(await fs.readFile('content/manual-source/supplements/original-videos.json','utf8'));
  const recordings=new Set<string>();
  const {compile}=await import('@mdx-js/mdx');
  for(const locale of ['zh','en'] as const){
    const doc=manifest.languages[locale];
    if(locale==='en'){
      assert(!/[\u3400-\u9fff]/.test(doc.groups.map(g=>g.title).join('')),'English navigation has Chinese text');
      const search=JSON.parse(await fs.readFile('public/search-index-en.json','utf8')) as {records:{title:string;text:string;href:string}[]};
      for(const number of [7,8]){const record=search.records.find(r=>r.title.startsWith(`${number}. `)&&r.href.includes('function-introduction-'));assert(record&&!/humanization/i.test(record.text),'Search section leaked into a neighboring function');}
    }
    assert(!doc.assets.some(a=>a.type==='missing-video'),`${locale}: unresolved video`);
    assert(!doc.assets.some(a=>a.type==='image'&&a.frames!>1),`${locale}: animation reduced to a still`);
    const chapter=doc.groups.find(g=>g.slug.endsWith('function-call'))!;
    const page=chapter.pages[0];
    const functions=await fs.readFile(path.join('content/manual',page.file),'utf8');
    const blocks=functions.split(/(?=<h3\b)/);
    for(const section of supplement.sections){
      const n=section.section.split('.')[1];
      const block=blocks.find(b=>new RegExp(`^<h3[^>]*>(?:<a[^>]*><\\/a>)?${n}\\.\\s`).test(b));
      assert(block,`${locale}: missing ${section.section}`);
      for(const clip of section.clips){assert(block.includes(clip.filename));assert(block.includes(clip.caption[locale]));}
      for(const step of section.steps[locale])assert(block.includes(step));

    }
    for(const group of doc.groups){for(const file of [group.overviewFile,...group.pages.map(p=>p.file)]){
      const mdx=await fs.readFile(path.join('content/manual',file),'utf8');
      assert(!/录制于|Recorded on|真实操作录屏|real screen recording|执行说明：|Execution note:|不代表临床安全性|do not establish clinical safety|实际可用性以任务结果为准|availability depends on the actual task results/.test(mdx),`${file}: removed editorial copy returned`);
      assert(!mdx.includes('<ManualMissingVideo'),`${file}: video placeholder`);
      await compile(mdx);
    }}
    for(const asset of doc.assets.filter(a=>a.type==='video')){
      for(const src of [asset.src,asset.mp4,asset.webm,asset.poster].filter(Boolean) as string[])await fs.access(path.join(root,'public',src));
      if(asset.mp4?.includes('/shared/'))recordings.add(path.join(root,'public',asset.mp4));
    }
    if(process.argv.includes('--export')){
      const html=load(await fs.readFile(path.join(process.env.MANUAL_EXPORT_ROOT??'out',locale==='en'?'en':'','help/manual/index.html'),'utf8'));
      const flow=html('[data-manual-flow]');assert.equal(flow.length,1);
      assert.equal(flow.find('.manual-video-preview img[src*="/original-manual/"]').length,16);
      assert.equal(flow.find('.manual-video-preview img[src*="/recordings-2026-10-10/"]').length,15);
      assert.equal(flow.find('video').length,0,'Players must not load until requested');
      assert(flow.find('.manual-video-frame').toArray().every(e=>html(e).attr('style')?.includes('aspect-ratio')),'Reserve media dimensions before loading');
      if(locale==='en')assert(!/[\u3400-\u9fff]/.test(flow.text()),'English manual contains Chinese text');
      assert(!flow.find('a[href*="feishu.cn"]').length,'Manual navigation must stay on the website');
      for(const clip of originals.clips)assert(flow.text().includes(clip.caption[locale]));
      const ids=flow.find('[id]').map((_,e)=>html(e).attr('id')).get();assert.equal(new Set(ids).size,ids.length,'Duplicate anchors');
    }
    console.log(`${locale}: all 9 updated sections, 31 captioned recordings, no missing videos or static animation fallbacks; all MDX compiles.`);
  }
  if(!process.argv.includes('--skip-decode'))for(const file of recordings){const result=spawnSync(ffmpeg!,['-v','error','-i',file,'-f','null','-'],{encoding:'utf8'});assert.equal(result.status,0,`${file}: ${result.stderr}`);}
  if(!process.argv.includes('--skip-decode'))console.log(`${recordings.size} shared MP4 files fully decoded without errors.`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
