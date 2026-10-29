'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {ManualNavigationGroup,ManualNavigationPage} from '@/lib/manual-types';
interface ReadingPosition {active:string;sidebarActive:string;groupSlug:string;chapterId:string}
const empty:ReadingPosition={active:'',sidebarActive:'',groupSlug:'',chapterId:''};
const Position=createContext<{active:string;sidebarActive:string;group?:ManualNavigationGroup;chapter?:ManualNavigationPage}>({active:'',sidebarActive:''});
export const useManualPosition=()=>useContext(Position);
export function ManualPosition({groups,children}:{groups:ManualNavigationGroup[];children:React.ReactNode}){
  const pathname=usePathname();
  const [position,setPosition]=useState<ReadingPosition>(empty);
  useEffect(()=>{
    const restoration=history.scrollRestoration;history.scrollRestoration='manual';
    const flow=document.querySelector<HTMLElement>('[data-manual-flow]');
    if(!flow){history.scrollRestoration=restoration;return;}
    const headings=Array.from(flow.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id],h4[id]'));
    let entries:{top:number;position:ReadingPosition}[]=[],frame=0,measurement=0,interacted=false,disposed=false;
    const offset=()=>Number.parseFloat(getComputedStyle(flow.closest('.docs-site')!).getPropertyValue('--manual-anchor-offset'))||88;
    let readingOffset=offset(),lastWidth=window.innerWidth,lastActive='';
    function update(){
      frame=0;
      if(!entries.length||window.innerWidth!==lastWidth)return;
      const line=window.scrollY+readingOffset+2;
      let low=0,high=entries.length-1;
      while(low<high){const middle=Math.ceil((low+high)/2);if(entries[middle].top<=line)low=middle;else high=middle-1;}
      const next=entries[low].position;lastActive=next.active;
      setPosition(previous=>previous.active===next.active?previous:next);
    }
    function measure(){
      const retain=window.innerWidth!==lastWidth?lastActive:'';
      measurement=0;readingOffset=offset();let sidebarActive='';
      entries=headings.map(h=>{
        if(h.tagName!=='H4')sidebarActive=h.id;
        return {top:h.getBoundingClientRect().top+window.scrollY,position:{active:h.id,sidebarActive,groupSlug:h.closest<HTMLElement>('[data-manual-group]')?.dataset.manualGroup??'',chapterId:h.closest<HTMLElement>('[data-manual-chapter]')?.dataset.manualChapter??''}};
      });
      lastWidth=window.innerWidth;
      const retained=entries.find(entry=>entry.position.active===retain);
      if(retained)window.scrollTo({top:Math.max(0,retained.top-readingOffset),behavior:'auto'});
      update();
    }
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const resize=()=>{if(!measurement)measurement=requestAnimationFrame(measure);};
    function jump(hash:string,push=false){
      let id:string;try{id=decodeURIComponent(hash.replace(/^#/,''));}catch{return;}
      const target=document.getElementById(id);
      if(!target||!flow!.contains(target))return;
      measure();
      if(push&&location.hash!==`#${encodeURIComponent(id)}`)location.hash=encodeURIComponent(id);
      // Do not start a long smooth scroll through hundreds of media blocks.
      window.scrollTo({top:Math.max(0,target.getBoundingClientRect().top+window.scrollY-readingOffset),behavior:'auto'});
      target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
      update();
      const group=target.closest<HTMLElement>('[data-manual-group]')?.dataset.manualGroup;
      if(group)window.dispatchEvent(new CustomEvent('manual-jump',{detail:group}));
    }
    function click(event:MouseEvent){
      if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const link=(event.target as Element).closest<HTMLAnchorElement>('.docs-site a[href], .docs-search-dialog a[href]');
      if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
      const url=new URL(link.href,location.href);
      if(url.origin!==location.origin||url.pathname.replace(/\/$/,'')!==location.pathname.replace(/\/$/,'')||!url.hash)return;
      let target:HTMLElement|null;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{return;}
      if(!target||!flow!.contains(target))return;
      event.preventDefault();event.stopPropagation();interacted=true;
      document.querySelectorAll<HTMLDialogElement>('.docs-site dialog[open],.docs-search-dialog[open]').forEach(dialog=>dialog.close());
      jump(url.hash,true);
    }
    const hash=()=>requestAnimationFrame(()=>{if(!disposed)jump(location.hash);});
    const interact=()=>{interacted=true;};
    const observer=new ResizeObserver(resize);observer.observe(flow);
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('hashchange',hash);window.addEventListener('popstate',hash);window.addEventListener('pageshow',hash);
    window.addEventListener('wheel',interact,{passive:true});window.addEventListener('touchstart',interact,{passive:true});
    document.addEventListener('click',click,true);
    measure();jump(location.hash);
    void document.fonts.ready.then(()=>{if(!disposed){measure();if(!interacted)jump(location.hash);}});
    return()=>{disposed=true;history.scrollRestoration=restoration;window.removeEventListener('pageshow',hash);observer.disconnect();cancelAnimationFrame(frame);cancelAnimationFrame(measurement);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',resize);window.removeEventListener('hashchange',hash);window.removeEventListener('popstate',hash);window.removeEventListener('wheel',interact);window.removeEventListener('touchstart',interact);document.removeEventListener('click',click,true);};
  },[pathname]);
  const value=useMemo(()=>{const group=groups.find(g=>g.slug===position.groupSlug);return {active:position.active,sidebarActive:position.sidebarActive,group,chapter:group?.pages.find(p=>p.id===position.chapterId)};},[groups,position]);
  return <Position.Provider value={value}>{children}</Position.Provider>;
}
