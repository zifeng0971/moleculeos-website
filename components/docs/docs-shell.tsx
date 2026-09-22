'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {useTranslations} from 'next-intl';
import {Menu,X,ChevronDown} from 'lucide-react';
import manifest from '@/content/manual/manifest.json';
import type {ManualManifest} from '@/lib/manual-types';
import {localizeHref,type Locale} from '@/lib/site-config';
import {Header} from '@/components/layout/header';
import {DocsSearch} from './docs-search';
import {ManualPosition,useManualPosition} from './manual-position';
const data=manifest as unknown as ManualManifest;
function ReadingShell({locale,children}:{locale:Locale;children:React.ReactNode}){
  const t=useTranslations('manualUI');const pathname=usePathname();const drawer=useRef<HTMLDialogElement>(null);const sidebar=useRef<HTMLElement>(null);const pauseUntil=useRef(0);const {sidebarActive:active,group,chapter}=useManualPosition();const [expanded,setExpanded]=useState('');const [notice,setNotice]=useState(false);
  const other=locale==='zh'?'en':'zh';const isManual=pathname.includes('/manual');const fallback=!!chapter&&!chapter.counterpart;const switchHref=chapter?.counterpart??localizeHref(isManual?'/help/manual':'/help',other);
  useEffect(()=>{setExpanded(group?.slug??'');},[group?.slug]);
  useEffect(()=>{setNotice(new URLSearchParams(window.location.search).has('manual-fallback'));},[pathname]);
  const resumeTimer=useRef<ReturnType<typeof setTimeout>>();
  function follow(){const pane=sidebar.current;const target=pane?.querySelector<HTMLElement>('[aria-current="location"]');if(!pane||!target||Date.now()<pauseUntil.current)return;const p=pane.getBoundingClientRect(),r=target.getBoundingClientRect();if(r.top<p.top||r.bottom>p.bottom)pane.scrollTo({top:pane.scrollTop+r.top-p.top-pane.clientHeight/2+r.height/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  function pauseFollow(){pauseUntil.current=Date.now()+3000;clearTimeout(resumeTimer.current);resumeTimer.current=setTimeout(follow,3010);}
  useEffect(()=>{follow();},[active,expanded]);
  useEffect(()=>()=>clearTimeout(resumeTimer.current),[]);
  function Tree({mobile=false}:{mobile?:boolean}){return <nav className="manual-sidebar-nav" aria-label={t('manual')}><Link href={localizeHref('/help',locale)} className="docs-home-link">← {t('docs')}</Link>{mobile?<button className="docs-search-trigger" onClick={()=>{drawer.current?.close();window.dispatchEvent(new Event('manual-search'));}}>{t('searchPlaceholder')} <kbd>⌘K</kbd></button>:<DocsSearch locale={locale}/>}<Link href={localizeHref('/help/manual',locale)}>{t('manual')}</Link>{data.languages[locale].groups.map(g=><div className="manual-nav-group" key={g.slug}><div className="manual-group-toggle"><a href={localizeHref('/help/manual',locale)+'#'+g.slug} aria-current={active===g.slug?'location':undefined}>{g.title}</a><button onClick={()=>setExpanded(expanded===g.slug?'':g.slug)} aria-label={g.title} aria-expanded={expanded===g.slug}><ChevronDown size={14}/></button></div>{expanded===g.slug&&<div>{g.overviewAnchors.filter(a=>a.level===3).map(a=><a key={a.id} href={localizeHref('/help/manual',locale)+'#'+a.id} aria-current={active===a.id?'location':undefined} onClick={()=>drawer.current?.close()}>{a.title}</a>)}{g.pages.map(p=><div key={p.id}><Link href={p.href} aria-current={active===p.href.split('#')[1]?'location':undefined} onClick={()=>drawer.current?.close()}>{p.title}</Link>{chapter?.id===p.id&&p.anchors.filter(a=>a.level===3).map(a=><a className="manual-nav-subsection" key={a.id} href={localizeHref('/help/manual',locale)+'#'+a.id} aria-current={active===a.id?'location':undefined} onClick={()=>drawer.current?.close()}>{a.title}</a>)}</div>)}</div>}</div>)}</nav>;}
  return <div className="docs-site"><Header locale={locale} languageHref={switchHref+(fallback?'?manual-fallback=1':'')}/><div className="docs-mobile-toolbar"><button onClick={()=>drawer.current?.showModal()}><Menu size={18}/>{t('chapters')}</button><span>{chapter?.title??t('docs')}</span></div>{notice&&<p className="manual-language-notice" role="status">{t('missingTranslation')}</p>}<div className="docs-layout"><aside ref={sidebar} className="manual-sidebar" onWheel={pauseFollow} onTouchMove={pauseFollow} onPointerDown={pauseFollow} onKeyDown={e=>{if(["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"].includes(e.key))pauseFollow();}}>{Tree({})}</aside><main className="docs-main">{children}</main></div><dialog ref={drawer} className="docs-sidebar-drawer"><button className="manual-close" onClick={()=>drawer.current?.close()} aria-label={t('close')}><X size={22}/></button>{Tree({mobile:true})}</dialog></div>;
}
export function DocsShell(props:{locale:Locale;children:React.ReactNode}){return <ManualPosition groups={data.languages[props.locale].groups}><ReadingShell {...props}/></ManualPosition>;}
