'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, X } from 'lucide-react';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { MMetricsPanel } from './MMetricsPanel';
import { MMetricsSequence } from './MMetricsSequence';
import { ViewerLoadBoundary } from './ViewerLoadBoundary';
import './mmetrics.css';
import './product-surface.css';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';
const Viewer = dynamic(() => import('./MolstarViewer'), { ssr: false, loading: () => <div className="mm-loading" role="status"><span className="mm-load-bar" /><LoadingLabel /></div> });
function LoadingLabel() { const t = useTranslations('mmetricsDemo'); return <span>{t('loading')}</span>; }
export function MMetricsDemo({ locale, autoLoad = false }: { locale: Locale; autoLoad?: boolean }) {
  const t = useTranslations('mmetricsDemo');
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState('metrics');
  const [selected, setSelected] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ residue: string; serial: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!autoLoad) return;
    const eligible = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    // Fetch and parse the Mol* chunk while the page is idle, so scrolling here doesn't stall on it.
    const cancelPrefetch = eligible.matches ? afterHeroEntrance(() => { void import('./MolstarViewer'); }) : () => {};
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && eligible.matches) { setActive(true); observer.disconnect(); }
    }, { threshold: 0.15 });
    observer.observe(frame.current!);
    return () => { observer.disconnect(); cancelPrefetch(); };
  }, [autoLoad]);
  function toggle(value: string) { setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); if (!selected.includes(value)) setFocus({ residue: value, serial: Date.now() }); }
  return <div ref={frame} className="mm-demo" aria-label={t('label')}><div className="mm-structure"><MMetricsSequence selected={selected} hover={setHovered} toggle={toggle} /><div className="mm-viewport">{active ? <ViewerLoadBoundary fallback={<><Image src="/demo/5xh3-platform-preview.png" alt={t('preview')} fill sizes="90vw" /><div className="mm-loading mm-error" role="alert"><p>{t('chunkError')}</p><button className="mm-enter" onClick={() => window.location.reload()}>{t('retry')}</button></div></>}><Viewer onInvalidSelected={invalid => setSelected(current => current.filter(label => !invalid.includes(label)))} hovered={hovered} selected={selected} focus={focus} onPick={value => setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} /></ViewerLoadBoundary> : <><Image src="/demo/5xh3-platform-preview.png" alt={t('preview')} fill sizes="(min-width:1280px) 28vw, (min-width:1024px) 34vw, 90vw" />{/* 首帧截图；激活后只加载同源 CIF，不嵌入线上服务。 */}<div className="mm-preview-cover"><span className="mm-preview-id">5xh3 · PETase</span><button className="mm-enter" onClick={() => setActive(true)}><Play size={16} />{t('enter')}</button><p className="mm-mobile-note">{t('mobile')}</p></div></>}</div></div><MMetricsPanel tab={tab} setTab={setTab} selected={selected} toggle={toggle} hover={setHovered} notice={() => dialog.current?.showModal()} /><dialog ref={dialog} className="mm-notice"><button className="mm-notice-close" aria-label={t('close')} onClick={() => dialog.current?.close()}><X size={20} /></button><p>{t('notice')}</p><CTAButton locale={locale} /></dialog></div>;
}
