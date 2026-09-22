'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import type {ManualGroup,ManualPage} from '@/lib/manual-types';
const Position=createContext<{active:string;sidebarActive:string;group?:ManualGroup;chapter?:ManualPage}>({active:'',sidebarActive:''});
export const useManualPosition=()=>useContext(Position);
export function ManualPosition({groups,children}:{groups:ManualGroup[];children:React.ReactNode}){
  const pathname=usePathname();
  const [active,setActive]=useState('');const [sidebarActive,setSidebarActive]=useState('');const [groupSlug,setGroupSlug]=useState('');const [chapterId,setChapterId]=useState('');
  useEffect(()=>{
    let frame=0;const headings=Array.from(document.querySelectorAll<HTMLElement>('[data-manual-flow] h1[id], [data-manual-flow] h2[id], [data-manual-flow] h3[id], [data-manual-flow] h4[id]'));
    const update=()=>{frame=0;let current=headings[0],left=headings[0];for(const h of headings){if(h.getBoundingClientRect().top<=140){current=h;if(h.tagName!=='H4')left=h;}else break;}if(!current)return;setActive(current.id);setSidebarActive(left?.id??'');setGroupSlug(current.closest<HTMLElement>('[data-manual-group]')?.dataset.manualGroup??'');setChapterId(current.closest<HTMLElement>('[data-manual-chapter]')?.dataset.manualChapter??'');};
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const observer=new IntersectionObserver(schedule,{rootMargin:'-120px 0px -70% 0px'});headings.forEach(h=>observer.observe(h));window.addEventListener('scroll',schedule,{passive:true});update();
    return()=>{observer.disconnect();window.removeEventListener('scroll',schedule);cancelAnimationFrame(frame);};
  },[groups,pathname]);
  const group=groups.find(g=>g.slug===groupSlug);const chapter=group?.pages.find(p=>p.id===chapterId);
  return <Position.Provider value={{active,sidebarActive,group,chapter}}>{children}</Position.Provider>;
}
