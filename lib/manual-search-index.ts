import fs from 'node:fs/promises';
import path from 'node:path';
import { load } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { ManualAnchor, ManualManifest, ManualNavigation } from './manual-types';

/** Index the published content, with each heading bounded by its own section. */
function searchable(source:string){
  const html=source.replace(/<ManualTable html=\{("(?:[^"\\]|\\.)*")\} assets=\{[^\n]*\} \/>/g,(_,value)=>JSON.parse(value))
    .replace(/<Manual\w+\s+[^\n]*?\/>/g,tag=>{const caption=tag.match(/caption=\{("(?:[^"\\]|\\.)*")\}/)?.[1];return caption?JSON.parse(caption):'';});
  const $=load(html,null,false);let text='';
  const headings:{id:string;level:number;start:number}[]=[];
  function walk(node:AnyNode){
    if(node.type==='text'){text+=node.data;return;}
    if(node.type!=='tag')return;
    const block=/^(?:h[1-6]|p|li|tr|div|pre|br)$/.test(node.name);
    if(block)text+='\n';
    if(/^h[1-6]$/.test(node.name)&&node.attribs.id)headings.push({id:node.attribs.id,level:Number(node.name[1]),start:text.length});
    node.children.forEach(walk);
    if(block)text+='\n';
  }
  $.root().contents().toArray().forEach(walk);
  const section=(anchor:ManualAnchor)=>{const index=headings.findIndex(h=>h.id===anchor.id);if(index<0)return anchor.title;const start=headings[index],end=headings.slice(index+1).find(h=>h.level<=start.level);return text.slice(start.start,end?.start??text.length).trim();};
  return {text:text.trim(),section};
}

export async function buildManualSearch(manifest:ManualManifest,root:string){
  const navigation={languages:{}} as ManualNavigation;
  for(const locale of ['zh','en'] as const){
    const other=locale==='zh'?'en':'zh';const prefix=locale==='en'?'/en':'';
    const anchorCounterparts:Record<string,string>={};
    const groups=manifest.languages[locale].groups.map((group,index)=>{
      const peer=manifest.languages[other].groups[index];const peerHref=peer?`${other==='en'?'/en':''}/help/manual#${peer.slug}`:undefined;
      if(peer&&peerHref){
        anchorCounterparts[group.slug]=peerHref;
        group.overviewAnchors.forEach((a,i)=>{const b=peer.overviewAnchors[i];if(b&&a.level===b.level)anchorCounterparts[a.id]=`${other==='en'?'/en':''}/help/manual#${b.id}`;});
      }
      return {title:group.title,slug:group.slug,overviewAnchors:group.overviewAnchors,pages:group.pages.map((page,j)=>{
        const counterpart=peer?.pages[j];
        if(counterpart){anchorCounterparts[page.href.split('#')[1]]=counterpart.href;page.anchors.forEach((a,i)=>{const b=counterpart.anchors[i];if(b&&a.level===b.level)anchorCounterparts[a.id]=`${other==='en'?'/en':''}/help/manual#${b.id}`;});}
        else if(peerHref)anchorCounterparts[page.href.split('#')[1]]=peerHref;
        return {id:page.id,title:page.title,href:page.href,groupSlug:page.groupSlug,anchors:page.anchors,counterpart:counterpart?.href??peerHref};
      })};
    });
    navigation.languages[locale]={groups,anchorCounterparts};
    const records:{id:number;href:string;title:string;group:string;text:string}[]=[];
    for(const group of manifest.languages[locale].groups){
      const owners=[{title:group.title,href:`${prefix}/help/manual#${group.slug}`,file:group.overviewFile,anchors:group.overviewAnchors},...group.pages];
      const contents=await Promise.all(owners.map(owner=>fs.readFile(path.join(root,'content/manual',owner.file),'utf8').then(searchable)));
      owners.forEach((owner,i)=>{
        const content=contents[i];
        if(content.text)records.push({id:records.length,href:owner.href,title:owner.title,group:group.title,text:[owner.title,group.title,content.text].join('\n')});
        for(const anchor of owner.anchors)records.push({id:records.length,href:`${prefix}/help/manual#${anchor.id}`,title:anchor.title,group:owner.title,text:content.section(anchor)});
      });
    }
    await fs.mkdir(path.join(root,'public'),{recursive:true});
    await fs.writeFile(path.join(root,`public/search-index-${locale}.json`),JSON.stringify({records}));
  }
  await fs.mkdir(path.join(root,'content/manual'),{recursive:true});
  await fs.writeFile(path.join(root,'content/manual/navigation.json'),JSON.stringify(navigation));
}
