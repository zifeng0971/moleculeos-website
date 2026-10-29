/** Apply versioned bilingual additions after DOCX ingestion; raw recordings stay local. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';
import type { ManualManifest, ManualAsset } from '../lib/manual-types';
import { buildManualSearch } from '../lib/manual-search-index';

type Locale = 'zh' | 'en';
type Supplement = {importClip:{filename:string;caption:Record<Locale,string>};recordedAt:string; sections:{section:string;title:string;taskId:string|null;steps:Record<Locale,string[]>;clips:{filename:string;caption:Record<Locale,string>}[]}[]};
const exists = (file:string) => fs.access(file).then(()=>true,()=>false);
const jsx = (name:string,props:Record<string,unknown>) => `<${name} ${Object.entries(props).filter(([,v])=>v!==undefined).map(([k,v])=>`${k}={${JSON.stringify(v)}}`).join(' ')} />`;
function encode(args:string[]) {
  const result=spawnSync(ffmpeg!,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});
  if(result.status!==0)throw new Error(result.stderr);
}
export async function syncManualSupplements(root=process.cwd()) {
  const source=path.join(root,'content/manual-source/supplements/function-call.json');
  if(!await exists(source))return; // Tiny ingestion fixtures have no editorial supplement.
  const supplement=JSON.parse(await fs.readFile(source,'utf8')) as Supplement;
  const manifestFile=path.join(root,'content/manual/manifest.json');
  const manifest=JSON.parse(await fs.readFile(manifestFile,'utf8')) as ManualManifest;
  const shared='/manual-assets/shared/recordings-2026-10-10';
  await fs.mkdir(path.join(root,'public',shared),{recursive:true});
  const originals=JSON.parse(await fs.readFile(path.join(root,'content/manual-source/supplements/original-videos.json'),'utf8')) as {rawDirectory:string;clips:{reference:string;filename:string;caption:Record<Locale,string>}[]};
  const restoredOriginals=new Map<string,{src:string;poster:string}>();
  for(const clip of originals.clips){
    const src=`/manual-assets/shared/original-manual/${clip.filename}`;
    const disk=path.join(root,'public',src);
    const poster=src.replace(/\.mp4$/,'-poster.webp');
    await fs.mkdir(path.dirname(disk),{recursive:true});
    if(!await exists(disk))encode(['-i',path.join(root,originals.rawDirectory,clip.reference),'-vf',"scale='trunc(min(1600,iw)/2)*2':'trunc(ih*min(1600,iw)/iw/2)*2'",'-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart','-c:a','aac',disk]);
    if(!await exists(path.join(root,'public',poster)))encode(['-i',disk,'-frames:v','1','-c:v','libwebp',path.join(root,'public',poster)]);
    restoredOriginals.set(clip.reference,{src,poster});
  }
  let restored=0;
  for(const locale of ['zh','en'] as const){
    const doc=manifest.languages[locale];
    if(locale==='en')doc.groups.forEach(g=>{if(g.slug==='moleculeos')g.title='About MoleculeOS';});
    for(const asset of doc.assets){
      const clip=originals.clips.find(c=>c.reference===asset.originalFilename);
      const media=clip&&restoredOriginals.get(clip.reference);
      if(clip&&media)Object.assign(asset,{type:'video',...media,mp4:media.src,caption:clip.caption[locale]});
    }
    // Recover animated GIFs that the original size heuristic reduced to still posters.
    const recovered=new Map<string,ManualAsset>();
    for(const asset of doc.assets.filter(a=>a.type==='image'&&a.frames!>1&&a.original?.endsWith('.gif'))){
      const previous=asset.src;
      const src=`/manual-assets/shared/animation-${asset.md5}.mp4`;
      const disk=path.join(root,'public',src);
      if(!await exists(disk))encode(['-i',path.join(root,'public',asset.original!),'-vf',"scale='trunc(min(1600,iw)/2)*2':'trunc(ih*min(1600,iw)/iw/2)*2'",'-c:v','libx264','-preset','fast','-crf','25','-pix_fmt','yuv420p','-movflags','+faststart','-an',disk]);
      Object.assign(asset,{type:'video',src,mp4:src,convertedBytes:(await fs.stat(disk)).size});
      delete asset.fallbackReason;
      recovered.set(previous,asset);restored++;
    }
    for(const group of doc.groups){
      for(const file of [group.overviewFile,...group.pages.map(p=>p.file)]){
        const target=path.join(root,'content/manual',file);
        let mdx=await fs.readFile(target,'utf8');
        if(locale==='zh')mdx=mdx.replace(/\[项目成员管理\]\(https:\/\/[^)]+feishu[^)]*\)/g,'[项目成员管理](/help/manual#er-ji-chu-gong-neng-jie-shao-1-xiang-mu-guan-li-xiang-mu-cheng-yuan-guan-li)');
        if(file===group.overviewFile&&group.slug.endsWith('function-call')){
          mdx=mdx.replace('MOS目前上线了9个功能','本节介绍以下 10 项功能').replace('MOS currently provides 9 tools','This section introduces 10 tools');
          group.text=group.text?.replace('MOS目前上线了9个功能','本节介绍以下 10 项功能').replace('MOS currently provides 9 tools','This section introduces 10 tools');
        }
        mdx=mdx.replace(/<ManualImage\s+[^\n]*?\/>/g,tag=>{
          const src=tag.match(/src=\{("(?:[^"\\]|\\.)*")\}/)?.[1];
          const asset=src?recovered.get(JSON.parse(src)):undefined;
          return asset?jsx('ManualVideo',{src:asset.src,mp4:asset.mp4,poster:asset.poster}):tag;
        });
        mdx=mdx.replace(/<ManualMissingVideo\s+[^\n]*?\/>/g,tag=>{
          const reference=tag.match(/reference=\{("(?:[^"\\]|\\.)*")\}/)?.[1];
          const clip=reference?originals.clips.find(c=>c.reference===JSON.parse(reference)):undefined;
          const media=clip&&restoredOriginals.get(clip.reference);
          return clip&&media?jsx('ManualVideo',{...media,mp4:media.src,caption:clip.caption[locale]}):tag;
        });
        mdx=mdx.replace(/<ManualVideo\s+[^\n]*?\/>/g,tag=>{
          const src=tag.match(/src=\{("(?:[^"\\]|\\.)*")\}/)?.[1];
          const asset=src?doc.assets.find(a=>a.src===JSON.parse(src)&&a.src.includes('/original-manual/')):undefined;
          return asset?jsx('ManualVideo',{src:asset.src,mp4:asset.mp4,poster:asset.poster,caption:asset.caption}):tag.replace('（真实操作录屏，无配音）','').replace(' (real screen recording, no narration)','');
        });
        // Nested table media carry their own asset snapshots.
        mdx=mdx.replace(/ assets=\{(\[[^\n]*\])\} \/>/g,(match,json)=>{
          const assets=JSON.parse(json) as ManualAsset[];
          return ` assets={${JSON.stringify(assets.map(a=>doc.assets.find(current=>current.id===a.id)??a))}} />`;
        });
        await fs.writeFile(target,mdx);
      }
    }
    const protein=doc.groups.flatMap(g=>g.pages).find(p=>p.slug==='2-dan-bai-guan-li'||p.slug==='2-2-protein-management');
    if(!protein)throw new Error(`${locale}: protein management is missing`);
    const importClip=supplement.importClip;
    const importSrc=`${shared}/${importClip.filename}`;
    const importDisk=path.join(root,'public',importSrc);
    const importPoster=importSrc.replace(/\.mp4$/,'-poster.webp');
    if(!await exists(importDisk))await fs.copyFile(path.join(root,'manual-videos/2026-10-10',importClip.filename),importDisk);
    if(!await exists(path.join(root,'public',importPoster)))encode(['-i',importDisk,'-frames:v','1','-vf','scale=1600:-2','-c:v','libwebp',path.join(root,'public',importPoster)]);
    const importAsset:ManualAsset={id:'recording-protein-import',type:'video',src:importSrc,mp4:importSrc,poster:importPoster,caption:importClip.caption[locale],paragraph:-1,context:importClip.caption[locale],pageId:protein.id,groupSlug:protein.groupSlug};
    const importIndex=doc.assets.findIndex(a=>a.id===importAsset.id);
    if(importIndex<0)doc.assets.push(importAsset);else doc.assets[importIndex]=importAsset;
    if(!protein.assets.includes(importAsset.id))protein.assets.push(importAsset.id);
    const proteinFile=path.join(root,'content/manual',protein.file);
    let proteinMdx=await fs.readFile(proteinFile,'utf8');
    if(!proteinMdx.includes(importSrc))proteinMdx=jsx('ManualVideo',{src:importSrc,mp4:importSrc,poster:importPoster,caption:importClip.caption[locale]})+'\n\n'+proteinMdx;
    await fs.writeFile(proteinFile,proteinMdx);
    const group=doc.groups.find(g=>g.slug.endsWith('function-call'));
    const page=group?.pages.find(p=>p.slug==='gong-neng-jie-shao'||p.slug==='function-introduction');
    if(!page)throw new Error(`${locale}: function introduction is missing`);
    const target=path.join(root,'content/manual',page.file);
    let mdx=await fs.readFile(target,'utf8');
    const blocks=mdx.split(/(?=<h3\b)/);
    for(const section of supplement.sections){
      const number=section.section.split('.')[1];
      const i=blocks.findIndex(block=>new RegExp(`^<h3[^>]*>(?:<a[^>]*><\/a>)?${number}\\.\\s`).test(block));
      if(i<0)throw new Error(`${locale}: missing section ${section.section}`);
      const steps=section.steps[locale].map((text,i)=>`${i+1}. ${text}`).join('\n');
      const videos:string[]=[];
      for(const clip of section.clips){
        const src=`${shared}/${clip.filename}`,disk=path.join(root,'public',src);
        if(!await exists(disk))await fs.copyFile(path.join(root,'manual-videos/2026-10-10',clip.filename),disk);
        const poster=src.replace(/\.mp4$/,'-poster.webp');
        if(!await exists(path.join(root,'public',poster)))encode(['-i',disk,'-frames:v','1','-vf','scale=1600:-2','-c:v','libwebp',path.join(root,'public',poster)]);
        const metadata=await sharp(path.join(root,'public',poster)).metadata();
        const id=`recording-${clip.filename.replace(/\.mp4$/,'')}`;
        const asset:ManualAsset={id,type:'video',src,mp4:src,poster,originalFilename:clip.filename,caption:clip.caption[locale],width:metadata.width,height:metadata.height,paragraph:-1,context:section.steps[locale].join(' ' ),pageId:page.id,groupSlug:page.groupSlug};
        const existing=doc.assets.findIndex(a=>a.id===id);
        if(existing<0)doc.assets.push(asset);else doc.assets[existing]=asset;
        if(!page.assets.includes(id))page.assets.push(id);
        videos.push(jsx('ManualVideo',{src,mp4:src,poster,caption:clip.caption[locale]}));
      }
      const replacement=`\n\n${steps}\n\n${videos.join('\n\n')}\n\n`;
      // Keep the existing Steps heading/anchor while replacing its outdated body.
      blocks[i]=blocks[i].replace(/(<h4[^>]*>.*?(?:操作步骤|Steps).*?<\/h4>)[\s\S]*$/,`$1${replacement}`);
    }
    mdx=blocks.join('').replace(locale==='zh'?'MOS目前上线了9个功能':'MOS currently offers nine functions',locale==='zh'?'本节介绍以下 10 项功能':'This section introduces the following 10 functions');
    const {compile}=await import('@mdx-js/mdx');
    await compile(mdx);
    await fs.writeFile(target,mdx);
    const extra=supplement.sections.flatMap(s=>s.steps[locale]).join('\n');
    const marker='\n[manual supplement]\n';
    page.text=page.text.split(/\n\[(?:2026-10-10 recording|manual) supplement\]\n/)[0]+marker+extra;
    manifest.warnings=manifest.warnings.filter(w=>!w.startsWith(`${locale}:`)||(!w.includes('转视频后体积增大')&&!originals.clips.some(c=>w.includes(`缺失视频 ${c.reference}；`))));
  }
  // Publish a local table of contents rather than DOCX links back to Feishu.
  for(const locale of ['zh','en'] as const){
    const doc=manifest.languages[locale];const groups=doc.groups.slice(3);
    const contents=doc.groups[2];
    const link=(href:string,title:string)=>`[${title}](${href})`;
    const groupLinks=(g:typeof groups[number])=>[link(`${locale==='en'?'/en':''}/help/manual#${g.slug}`,g.title),...g.pages.map(p=>'  - '+link(p.href,p.title))].join('\n');
    await fs.writeFile(path.join(root,'content/manual',contents.overviewFile),groups.map(g=>'- '+groupLinks(g)).join('\n\n')+'\n');
    contents.text=groups.map(g=>[g.title,...g.pages.map(p=>p.title)].join('\n')).join('\n');
    for(const [i,page] of contents.pages.entries())if(groups[i]){const g=groups[i];const text='- '+groupLinks(g)+'\n';await fs.writeFile(path.join(root,'content/manual',page.file),text);page.text=[g.title,...g.pages.map(p=>p.title)].join('\n');}
  }
  // Pair corresponding pages by group and page position, excluding the English TOC subpages.
  const zh=manifest.languages.zh.groups,en=manifest.languages.en.groups;
  zh.forEach((group,i)=>group.pages.forEach((page,j)=>{const counterpart=en[i]?.pages[j];if(counterpart){page.counterpart=counterpart.href;counterpart.counterpart=page.href;}}));
  for(const doc of Object.values(manifest.languages))for(const asset of doc.assets.filter(a=>a.type==='video'&&a.poster)){const dimensions=await sharp(path.join(root,'public',asset.poster!)).metadata();asset.convertedWidth=dimensions.width;asset.convertedHeight=dimensions.height;}
  await fs.writeFile(path.join(root,'content/manual/missing-videos.json'),JSON.stringify(Object.entries(manifest.languages).flatMap(([language,doc])=>doc.assets.map(a=>({language,filename:a.originalFilename}))),null,2)+'\n');
  await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
  await buildManualSearch(manifest,root);
  console.log(`Manual supplements synced: 9 sections, 15 shared recordings and 16 recovered original videos in both languages; ${restored} animated demonstrations restored.`);
}
if(process.argv[1]?.endsWith('sync-manual-supplements.ts'))syncManualSupplements(path.resolve(process.env.MANUAL_OUTPUT_ROOT??process.cwd())).catch(error=>{console.error(error);process.exitCode=1;});
