'use client';
import Link from 'next/link';
import {createPortal} from 'react-dom';
import { useEffect,useRef,useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {SITE_CONFIG,type Locale} from '@/lib/site-config';
interface SearchRecord {id:number;href:string;title:string;group:string;text:string}
function Highlight({text,query}:{text:string;query:string}){if(!query)return <>{text}</>;const parts=text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'ig'));return <>{parts.map((p,i)=>p.toLowerCase()===query.toLowerCase()?<mark key={i}>{p}</mark>:p)}</>;}
/** The shortcut modifier to print: ⌘ on Apple devices, "Ctrl " elsewhere (the server render assumes ⌘ and the client corrects it). */
export function useModKey(){const [mod,setMod]=useState('⌘');useEffect(()=>{if(!/Mac|iPhone|iPad|iPod/.test(navigator.platform||navigator.userAgent))setMod('Ctrl ');},[]);return mod;}
export function DocsSearch({locale}:{locale:Locale}){
  const [requested,setRequested]=useState(false);
  const [portal,setPortal]=useState<HTMLElement|null>(null);
  useEffect(()=>{setPortal(document.body);},[]);
  const t=useTranslations('manualUI');const dialog=useRef<HTMLDialogElement>(null);const input=useRef<HTMLInputElement>(null);const records=useRef<SearchRecord[]>([]);
  const [query,setQuery]=useState('');const [results,setResults]=useState<SearchRecord[]>([]);const [ready,setReady]=useState(false);const [error,setError]=useState(false);
  const trigger=useRef<HTMLButtonElement>(null);
  const mod=useModKey();
  const open=()=>{setRequested(true);const rect=trigger.current?.getBoundingClientRect();if(dialog.current&&!dialog.current.open){dialog.current.style.left=`${Math.max(12,Math.min(rect?.left??12,window.innerWidth-492))}px`;dialog.current.style.top=`${Math.min(rect?.width?rect.top:100,window.innerHeight*.3)}px`;dialog.current.showModal();input.current?.focus();}};
  useEffect(()=>{const handler=()=>open();window.addEventListener('manual-search',handler);return()=>window.removeEventListener('manual-search',handler);},[]);
  useEffect(()=>{if(!requested)return;let cancelled=false;setReady(false);setError(false);fetch(`/search-index-${locale}.json`).then(r=>{if(!r.ok)throw new Error('Search unavailable');return r.json();}).then(data=>{if(!cancelled){records.current=data.records;setReady(true);}}).catch(()=>{if(!cancelled)setError(true);});return()=>{cancelled=true;};},[locale,requested]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(dialog.current?.open)dialog.current.close();else open();}};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key);},[]);
  useEffect(()=>{
    if(!query.trim()||!ready){setResults([]);return;}
    const q=query.trim().toLowerCase();const words=q.split(/\s+/);
    const score=(record:SearchRecord)=>{const title=record.title.toLowerCase();return (title.includes(q)?4:0)+words.filter(word=>title.includes(word)).length;};
    const matches=records.current.filter(record=>words.every(word=>record.text.toLowerCase().includes(word)));
    matches.sort((a,b)=>score(b)-score(a)||a.text.length-b.text.length);
    setResults(matches.slice(0,20));
  },[query,ready]);
  function snippet(record:SearchRecord){const position=record.text.toLowerCase().indexOf(query.toLowerCase());const start=Math.max(0,position-45);return (start?'…':'')+record.text.slice(start,start+180)+(record.text.length>start+180?'…':'');}
  const placeholder=t('searchPlaceholder');
  return <><button ref={trigger} className="docs-search-trigger" onClick={open}><Search size={14}/><span>{placeholder}</span><kbd>{mod}K</kbd></button>{portal&&createPortal(<dialog ref={dialog} className="docs-search-dialog" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><div className="docs-search-input"><Search size={20}/><input ref={input} value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder} aria-label={t('search')}/><button onClick={()=>dialog.current?.close()} aria-label={t('close')}><X size={20}/></button></div><div className="docs-search-results" aria-live="polite">{error?<p>{t('searchError')}</p>:!ready?<p>{t('loading')}</p>:!query?<p>{t('searchHint')}</p>:results.length===0?<><p>{t('noResults')}</p><a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer">{t('mochaHelp')}</a></>:results.map(r=><Link href={r.href} key={r.id} onClick={()=>dialog.current?.close()}><small>{r.group} &gt; {r.title}</small><strong><Highlight text={r.title} query={query}/></strong><p><Highlight text={snippet(r)} query={query}/></p></Link>)}</div></dialog>,portal)}</>;
}
