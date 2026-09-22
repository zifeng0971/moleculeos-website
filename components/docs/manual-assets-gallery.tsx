'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import manifest from '@/content/manual/manifest.json';
import type { ManualManifest } from '@/lib/manual-types';
import type { Locale } from '@/lib/site-config';
const data=manifest as unknown as ManualManifest;
export function ManualAssetsGallery(){
  const [locale,setLocale]=useState<Locale>('zh');const [group,setGroup]=useState('');const [copied,setCopied]=useState('');const doc=data.languages[locale];const pages=doc.groups.flatMap(g=>g.pages);
  return <div className="manual-assets-gallery"><h1>手册素材索引 · Development only</h1><p>仅供选择素材，不自动替换营销页图片。</p><div className="manual-assets-filters"><select aria-label="语言" value={locale} onChange={e=>{setLocale(e.target.value as Locale);setGroup('');}}><option value="zh">中文</option><option value="en">English</option></select><select value={group} aria-label="分组" onChange={e=>setGroup(e.target.value)}><option value="">全部分组</option>{doc.groups.map(g=><option key={g.slug} value={g.slug}>{g.title}</option>)}</select></div><div className="manual-assets-grid">{doc.assets.filter(a=>a.type!=='missing-video'&&(!group||a.groupSlug===group||a.references?.some(r=>r.groupSlug===group))).map(asset=>{const page=pages.find(p=>p.id===asset.pageId);return <article key={asset.id}>{(asset.poster||asset.src)&&<Image src={asset.poster??asset.src} alt="" width={asset.width??800} height={asset.height??450} sizes="(max-width: 768px) 100vw, 33vw"/>}<strong>{asset.type} · {asset.width} × {asset.height}</strong><Link href={page?.href??`${locale==='en'?'/en':''}/help/manual#${asset.groupSlug}`}>{page?.title??doc.groups.find(g=>g.slug===asset.groupSlug)?.title}</Link><p>{asset.context}</p><code>{asset.src}</code><button onClick={async()=>{await navigator.clipboard.writeText(asset.src);setCopied(asset.id);}}>{copied===asset.id?'已复制':'复制路径'}</button></article>;})}</div></div>;
}
