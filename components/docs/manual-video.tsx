'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Play } from 'lucide-react';
import { releaseManualVideoOutsideViewport } from './manual-media-visibility';

interface VideoProps {
  src: string; poster?: string; webm?: string; mp4?: string; caption?: string;
  external?: boolean; width?: number; height?: number;
}
export function ManualVideo({src,poster,webm,mp4,caption,external=false,width=1600,height=900}:VideoProps) {
  const t=useTranslations('manualUI');
  const frame=useRef<HTMLDivElement>(null);
  const video=useRef<HTMLVideoElement>(null);
  const [enabled,setEnabled]=useState(false);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const element=frame.current;
    if(!element||external)return;
    return releaseManualVideoOutsideViewport(element,()=>setEnabled(false));
  },[external]);
  useEffect(()=>{
    const player=video.current;
    if(!enabled||!player)return;
    const hide=()=>{if(document.hidden)player.pause();};
    document.addEventListener('visibilitychange',hide);
    return()=>{player.pause();document.removeEventListener('visibilitychange',hide);};
  },[enabled]);
  const preview=poster&&<Image src={poster} alt="" width={width} height={height} loading="lazy" decoding="async" sizes="(max-width: 1024px) 100vw, 760px"/>;
  return <figure className="manual-video">
    {external?<a href={src} target="_blank" rel="noopener noreferrer" className="manual-play-card">{preview}<span><ExternalLink size={22}/>{t('externalVideo')}</span></a>:
      <div ref={frame} className="manual-video-frame" style={{aspectRatio:`${width} / ${height}`}}>
        {enabled?<video key={src} ref={video} controls autoPlay playsInline preload="metadata" poster={poster} width={width} height={height} aria-label={caption??t('play')} onError={()=>setFailed(true)} onPlay={event=>{document.querySelectorAll<HTMLVideoElement>('.manual-video video').forEach(other=>{if(other!==event.currentTarget)other.pause();});}}>
          <source src={mp4??webm??src} type={mp4||(!webm&&src.toLowerCase().endsWith('.mp4'))?'video/mp4':'video/webm'}/>
          {webm&&mp4&&<source src={webm} type="video/webm"/>}
        </video>:<button className="manual-video-preview" aria-label={caption?`${t('play')}: ${caption}`:t('play')} onClick={()=>{setFailed(false);setEnabled(true);}}>{preview}<span className="manual-video-start"><Play size={24}/></span></button>}
        {failed&&enabled&&<p className="manual-video-error" role="status">{t('videoFallback')}</p>}
      </div>}
    {caption&&<figcaption>{caption}</figcaption>}
  </figure>;
}
