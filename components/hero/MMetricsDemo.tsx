'use client';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Play, X } from 'lucide-react';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { MMetricsPanel } from './MMetricsPanel';
import { MMetricsSequence } from './MMetricsSequence';
import { DATASETS, MMProvider, rangeIds } from './mmetrics-dataset';
import { residuesForTypes } from './mmetrics-insights';
import type { Scheme } from './MMetricsPanel';
import { ViewerLoadBoundary } from './ViewerLoadBoundary';
import './mmetrics.css';
import './product-surface.css';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';
import { preloadStructure } from '@/lib/structure-cache';
const Viewer = dynamic(() => import('./MolstarViewer'), { ssr: false });
export function MMetricsDemo({ locale, autoLoad = false, dataset = '4HT1' }: { locale: Locale; autoLoad?: boolean; dataset?: keyof typeof DATASETS }) {
  const t = useTranslations('mmetricsDemo');
  const ds = DATASETS[dataset], mmetrics = ds.data, STRUCTURE = ds.structure, PREVIEW = ds.preview;
  const [active, setActive] = useState(false);
  const [tab, setTab] = useState('metrics');
  const [selected, setSelected] = useState<string[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ residue: string; serial: number } | null>(null);
  const [scheme, setScheme] = useState<Scheme>('IMGT');
  // Interaction-type filter (null = every type). The matching residues are drawn as sticks in the viewer.
  const [typeFilter, setTypeFilter] = useState<string[] | null>(null);
  const sticks = useMemo(() => (typeFilter ? residuesForTypes(typeFilter, mmetrics) : []), [typeFilter, mmetrics]);
  const cdr = new Set(mmetrics.cdr[scheme].flatMap(r => rangeIds(r.chain, r.from, r.to)));
  function toggleGroup(values: string[]) { const all = values.every(v => selected.includes(v)); setSelected(current => all ? current.filter(v => !values.includes(v)) : [...new Set([...current, ...values])]); if (!all) setFocus({ residue: values[Math.floor(values.length / 2)], serial: Date.now() }); }
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!autoLoad) return;
    const eligible = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    // Fetch and parse the Mol* chunk while the page is idle, so scrolling here doesn't stall on it.
    const cancelPrefetch = eligible.matches ? afterHeroEntrance(() => { void import('./MolstarViewer'); preloadStructure(STRUCTURE.src).catch(() => {}); }) : () => {};
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && eligible.matches) { setActive(true); observer.disconnect(); }
    }, { rootMargin: '60% 0px', threshold: 0 });
    observer.observe(frame.current!);
    return () => { observer.disconnect(); cancelPrefetch(); };
  }, [autoLoad, STRUCTURE.src]);
  function toggle(value: string) { setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]); if (!selected.includes(value)) setFocus({ residue: value, serial: Date.now() }); }
  return <MMProvider dataset={ds}><div ref={frame} className="mm-demo" aria-label={t('label')}><div className="mm-structure"><MMetricsSequence selected={selected} hover={setHovered} toggle={toggle} cdr={cdr} /><div className="mm-viewport">{active ? <ViewerLoadBoundary fallback={<>{PREVIEW && <Image src={PREVIEW} alt={t('preview')} fill sizes="90vw" />}<div className="mm-loading mm-error" role="alert"><p>{t('chunkError')}</p><button className="mm-enter" onClick={() => window.location.reload()}>{t('retry')}</button></div></>}><Viewer structure={STRUCTURE} preview={PREVIEW} onInvalidSelected={invalid => setSelected(current => current.filter(label => !invalid.includes(label)))} hovered={hovered} selected={selected} sticks={sticks} focus={focus} onPick={value => setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])} /></ViewerLoadBoundary> : <>{PREVIEW && <Image src={PREVIEW} alt={t('preview')} fill sizes="(min-width:1280px) 28vw, (min-width:1024px) 34vw, 90vw" />}{/* 首帧截图；激活后只加载同源 CIF，不嵌入线上服务。 */}<div className="mm-preview-cover"><span className="mm-preview-id">{mmetrics.id} · {ds.tag}</span><button className="mm-enter" onClick={() => setActive(true)}><Play size={16} />{t('enter')}</button><p className="mm-mobile-note">{t('mobile')}</p></div></>}</div></div><MMetricsPanel tab={tab} setTab={setTab} selected={selected} toggle={toggle} toggleGroup={toggleGroup} scheme={scheme} setScheme={setScheme} setSelection={setSelected} focusResidue={residue => setFocus({ residue, serial: Date.now() })} typeFilter={typeFilter} setTypeFilter={setTypeFilter} hover={setHovered} notice={() => dialog.current?.showModal()} /><dialog ref={dialog} className="mm-notice"><button className="mm-notice-close" aria-label={t('close')} onClick={() => dialog.current?.close()}><X size={20} /></button><p>{t('notice')}</p><CTAButton locale={locale} /></dialog></div></MMProvider>;
}
