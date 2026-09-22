'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { ManualVideo } from './manual-video';
export { ManualVideo } from './manual-video';
import parse, { Element, domToReact, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import type { ManualAsset } from '@/lib/manual-types';

export function ManualImage({src,alt='',width=1600,height=900,caption}:{src:string;alt?:string;width?:number;height?:number;caption?:string}){
  const t=useTranslations('manualUI'); const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const d=dialog.current;return()=>{if(d?.open)d.close();};},[]);
  return <figure className="manual-figure"><button className="manual-image-button" onClick={()=>dialog.current?.showModal()} aria-label={t('zoom')}><Image loading="lazy" src={src} alt={alt} width={Math.min(width,1600)} height={Math.round(height*Math.min(width,1600)/width)} sizes="(max-width: 1024px) 100vw, 920px"/></button>{caption&&<figcaption>{caption}</figcaption>}<dialog ref={dialog} className="manual-lightbox" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button className="manual-close" aria-label={t('close')} onClick={()=>dialog.current?.close()}><X size={22}/></button><Image loading="lazy" src={src} alt={alt} width={width} height={height} sizes="100vw"/><p>{caption||alt}</p></dialog></figure>;
}
export function ManualMissingVideo({reference}:{reference?:string}){const t=useTranslations('manualUI');return process.env.NODE_ENV==='production'?null:<aside className="manual-missing-video">{t('missingVideo')}<code>{reference}</code></aside>;}

/** HTML tables stay HTML through ingestion, so nested list/table semantics and spans aren't lost. */
export function ManualTable({html,assets}:{html:string;assets:ManualAsset[]}){
  const options:HTMLReactParserOptions={replace(node){
    if(!(node instanceof Element))return;
    if(node.name==='img'){const a=assets.find(a=>a.id===node.attribs['data-asset-id']);return a?.type==='video'?<ManualVideo {...a}/>:<ManualImage src={node.attribs.src} alt={node.attribs.alt} width={a?.width} height={a?.height} caption={a?.caption}/>;}
    if(node.name==='manual-media'){const a=assets.find(a=>a.id===node.attribs['data-id']);if(!a)return <></>;return a.type==='missing-video'?<ManualMissingVideo reference={a.originalFilename}/>:<ManualVideo {...a} external={a.type==='external-video'}/>;}
    if(node.name==='script'||node.name==='iframe')return <></>;
    if(node.name==='p'&&node.children.some(c=>c instanceof Element&&['img','manual-media'].includes(c.name)))return <div className="manual-image-paragraph">{domToReact(node.children as DOMNode[],options)}</div>;
    if(node.name==='a'&&node.attribs.href?.startsWith('http'))return <a href={node.attribs.href} target="_blank" rel="noopener noreferrer">{domToReact(node.children as DOMNode[],options)}</a>;
  }};
  return <div className="manual-table-scroll">{parse(html,options)}</div>;
}
export function ManualCode({children}:{children?:React.ReactNode}){
  const t=useTranslations('manualUI'); const ref=useRef<HTMLPreElement>(null);const [copied,setCopied]=useState(false);
  return <div className="manual-code"><button onClick={async()=>{await navigator.clipboard.writeText(ref.current?.textContent??'');setCopied(true);setTimeout(()=>setCopied(false),1600);}}>{t(copied?'copied':'copy')}</button><pre ref={ref}>{children}</pre></div>;
}
