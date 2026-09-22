'use client';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ExternalLink, Pause, Play } from 'lucide-react';

export function ManualVideo({src,poster,webm,mp4,caption,external=false}:{src:string;poster?:string;webm?:string;mp4?:string;caption?:string;external?:boolean}) {
  const t=useTranslations('manualUI');
  const ref=useRef<HTMLVideoElement>(null);
  const userPaused=useRef(false);
  const [playing,setPlaying]=useState(false);
  const [progress,setProgress]=useState(0);
  const [duration,setDuration]=useState(0);
  const [failed,setFailed]=useState(false);
  const [mounted,setMounted]=useState(false);
  const visible=useRef(false);
  useEffect(()=>{
    const video=ref.current;if(!video||external)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>{if(visible.current&&!reduced.matches&&!userPaused.current)void video.play().catch(()=>{});else video.pause();};
    const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting)setMounted(true);visible.current=entry.isIntersecting&&entry.intersectionRatio>=.5;update();},{threshold:[0,.5]});
    let retention:IntersectionObserver;
    const retain=()=>{retention?.disconnect();retention=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting){video.pause();setMounted(false);}},{rootMargin:`${window.innerHeight*2}px 0px`});retention.observe(video);};
    retain();window.addEventListener('resize',retain);
    observer.observe(video);reduced.addEventListener('change',update);
    return()=>{observer.disconnect();retention.disconnect();window.removeEventListener('resize',retain);reduced.removeEventListener('change',update);video.pause();};
  },[external,src]);
  useEffect(()=>{const video=ref.current;if(!video||external)return;video.load();if(!mounted){setProgress(0);setDuration(0);}setFailed(false);},[mounted,external]);
  const toggle=()=>{const video=ref.current;if(!video)return;if(video.paused){userPaused.current=false;void video.play().catch(()=>{});}else {userPaused.current=true;video.pause();}};
  return <figure className="manual-video">{external?<a href={src} target="_blank" rel="noopener noreferrer" className="manual-play-card">{poster&&<Image loading="lazy" src={poster} alt="" width={1600} height={900} sizes="100vw"/>}<span><ExternalLink size={22}/>{t('externalVideo')}</span></a>:<div className="manual-video-frame"><video {...{loading:'lazy'}} ref={ref} muted loop playsInline preload="none" poster={poster} aria-label={caption??t('play')} onLoadedMetadata={e=>setDuration(e.currentTarget.duration)} onCanPlay={e=>{if(visible.current&&!userPaused.current&&!matchMedia('(prefers-reduced-motion: reduce)').matches)void e.currentTarget.play().catch(()=>{});}} onError={()=>{if(mounted)setFailed(true);}} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onTimeUpdate={e=>{const video=e.currentTarget;setProgress(video.duration?video.currentTime/video.duration*100:0);}}>{mounted&&<><source src={webm??src} type="video/webm"/>{mp4&&<source src={mp4} type="video/mp4"/>}</>}</video>{failed&&<p className="manual-video-error" role="status">{t('videoFallback')}</p>}<div className="manual-video-controls"><button onClick={toggle} aria-label={t(playing?'pause':'play')}>{playing?<Pause size={17}/>:<Play size={17}/>}</button><span className="manual-video-progress" style={{'--video-progress':`${progress}%`} as React.CSSProperties}><input disabled={!duration||failed} type="range" min="0" max="100" step="0.1" value={progress} aria-label={t('seek')} onChange={e=>{const video=ref.current;const value=Number(e.target.value);if(video&&Number.isFinite(video.duration)){video.currentTime=video.duration*value/100;setProgress(value);}}}/></span></div></div>}{caption&&<figcaption>{caption}</figcaption>}</figure>;
}
