'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {useTranslations} from 'next-intl';
import {Menu,X,ChevronDown} from 'lucide-react';
import manifest from '@/content/manual/navigation.json';
import type {ManualNavigation} from '@/lib/manual-types';
import {localizeHref,type Locale} from '@/lib/site-config';
import {Header} from '@/components/layout/header';
import {DocsSearch,useModKey} from './docs-search';
import {ManualPosition,useManualPosition} from './manual-position';
const data=manifest as unknown as ManualNavigation;
function ReadingShell({locale,children}:{locale:Locale;children:React.ReactNode}){
  const t=useTranslations('manualUI');const pathname=usePathname();const drawer=useRef<HTMLDialogElement>(null);const sidebar=useRef<HTMLElement>(null);const {active:heading,sidebarActive:active,group,chapter}=useManualPosition();const [expanded,setExpanded]=useState('');const [notice,setNotice]=useState(false);
  const other=locale==='zh'?'en':'zh';const isManual=pathname.includes('/manual');const fallback=!!chapter&&!chapter.counterpart;const switchHref=data.languages[locale].anchorCounterparts[heading]??chapter?.counterpart??localizeHref(isManual?'/help/manual':'/help',other);
  const initialized=useRef(false);const mod=useModKey();
  useEffect(()=>{if(group&&!initialized.current){initialized.current=true;setExpanded(group.slug);}},[group]);
  useEffect(()=>{const jump=(event:Event)=>setExpanded((event as CustomEvent<string>).detail);window.addEventListener('manual-jump',jump);return()=>window.removeEventListener('manual-jump',jump);},[]);
  useEffect(()=>{setNotice(new URLSearchParams(window.location.search).has('manual-fallback'));},[pathname]);
  function Tree({mobile=false}:{mobile?:boolean}){return <nav className="manual-sidebar-nav" aria-label={t('manual')}><Link href={localizeHref('/help',locale)} className="docs-home-link">← {t('docs')}</Link>{mobile?<button className="docs-search-trigger" onClick={()=>{drawer.current?.close();window.dispatchEvent(new Event('manual-search'));}}>{t('searchPlaceholder')} <kbd>{mod}K</kbd></button>:<DocsSearch locale={locale}/>}<Link href={localizeHref('/help/manual',locale)}>{t('manual')}</Link>{data.languages[locale].groups.map(g=><div className="manual-nav-group" key={g.slug}><div className="manual-group-toggle"><a href={localizeHref('/help/manual',locale)+'#'+g.slug} aria-current={active===g.slug||(group?.slug===g.slug&&expanded!==g.slug)?'location':undefined}>{g.title}</a><button onClick={()=>setExpanded(expanded===g.slug?'':g.slug)} aria-label={g.title} aria-expanded={expanded===g.slug}><ChevronDown size={14}/></button></div>{expanded===g.slug&&<div>{g.overviewAnchors.filter(a=>a.level===3).map(a=><a key={a.id} href={localizeHref('/help/manual',locale)+'#'+a.id} aria-current={active===a.id?'location':undefined} onClick={()=>drawer.current?.close()}>{a.title}</a>)}{g.pages.map(p=><div key={p.id}><Link href={p.href} aria-current={active===p.href.split('#')[1]?'location':undefined} onClick={()=>drawer.current?.close()}>{p.title}</Link>{p.anchors.filter(a=>a.level===3).map(a=><a className="manual-nav-subsection" key={a.id} href={localizeHref('/help/manual',locale)+'#'+a.id} aria-current={active===a.id?'location':undefined} onClick={()=>drawer.current?.close()}>{a.title}</a>)}</div>)}</div>}</div>)}</nav>;}
  return <div className="docs-site"><Header locale={locale} languageHref={fallback?switchHref.replace('#','?manual-fallback=1#'):switchHref}/><div className="docs-mobile-toolbar"><button onClick={()=>drawer.current?.showModal()}><Menu size={18}/>{t('chapters')}</button><span>{chapter?.title??t('docs')}</span></div>{notice&&<p className="manual-language-notice" role="status">{t('missingTranslation')}</p>}<div className="docs-layout"><aside ref={sidebar} className="manual-sidebar">{Tree({})}</aside><main className="docs-main">{children}</main></div><dialog ref={drawer} className="docs-sidebar-drawer"><button className="manual-close" onClick={()=>drawer.current?.close()} aria-label={t('close')}><X size={22}/></button>{Tree({mobile:true})}</dialog></div>;
}
export function DocsShell(props:{locale:Locale;children:React.ReactNode}){return <ManualPosition groups={data.languages[props.locale].groups}><ReadingShell {...props}/></ManualPosition>;}
