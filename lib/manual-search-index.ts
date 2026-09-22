import fs from 'node:fs/promises';
import path from 'node:path';
import { Index } from 'flexsearch';
import { manualSearchOptions } from './manual-search-config';
import type { ManualManifest } from './manual-types';

export async function buildManualSearch(manifest:ManualManifest,root:string){
  for(const locale of ['zh','en'] as const){
    const data=manifest.languages[locale];const pages=data.groups.flatMap(g=>g.pages);
    const records=[...pages.map((p,i)=>({id:i,href:p.href,title:p.title,group:p.groupTitle,text:[p.title,p.groupTitle,...p.anchors.map(a=>a.title),p.text,...p.assets.map(id=>data.assets.find(a=>a.id===id)?.caption??'')].join('\n')})),...data.groups.filter(g=>g.text?.trim()).map((g,i)=>({id:pages.length+i,href:`${locale==='en'?'/en':''}/help/manual#${g.slug}`,title:g.title,group:g.title,text:[g.title,...g.overviewAnchors.map(a=>a.title),g.text,...g.assets.map(id=>data.assets.find(a=>a.id===id)?.caption??'')].join('\n')}))];
    // Chapter and subsection results all resolve to the continuous manual.
    for(const group of data.groups){for(const owner of [{title:group.title,anchors:group.overviewAnchors,text:group.text??''},...group.pages]){for(const a of owner.anchors){const start=owner.text.indexOf(a.title);records.push({id:records.length,href:`${locale==='en'?'/en':''}/help/manual#${a.id}`,title:a.title,group:owner.title,text:[a.title,owner.text.slice(Math.max(0,start),Math.max(0,start)+2400)].join('\n')});}}}
    const index=new Index(manualSearchOptions(locale));records.forEach(r=>index.add(r.id,r.text));
    const exported:Record<string,string>={};await index.export((key,value)=>{exported[key]=value;});
    await fs.mkdir(path.join(root,'public'),{recursive:true});
    await fs.writeFile(path.join(root,`public/search-index-${locale}.json`),JSON.stringify({records,index:exported}));
  }
}
