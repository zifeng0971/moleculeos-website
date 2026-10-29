'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';
import { preloadStructure } from '@/lib/structure-cache';
import { useTranslations } from 'next-intl';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { SITE_CONFIG, type Locale } from '@/lib/site-config';
import { mockContent, type CapabilityTask } from '@/lib/mock-content';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { Phrases } from '@/components/ui/phrase-title';
import { TaskStage } from '@/components/motion/task-stage';
import { PromptFlow } from '@/components/motion/prompt-flow';
import { AffinityFlow } from '@/components/motion/affinity-flow';
import { StabilityFlow } from '@/components/motion/stability-flow';
import { DenovoFlow } from '@/components/motion/denovo-flow';
import { MMetricsDemo } from '@/components/hero/MMetricsDemo';
import { MosScale } from '@/components/hero/MosScale';
import type { TaskVisualLabels } from '@/components/motion/task-visuals';
import type { StageLabels, VegfLabels } from '@/components/motion/vegf-stage';

// Story order for the running VEGF-A case. 'mmetrics' is the analysis view; the rest are live 2FJG stages.
const ORDER = ['structure', 'mmetrics', 'affinity', 'stability', 'denovo'];
// One accent per step; it tints the frame halo, the index and the line as it passes.
const ACCENT: Record<string, string> = { structure: '185,174,240', mmetrics: '147,201,236', affinity: '239,169,196', stability: '240,212,138', denovo: '163,221,191' };


/**
 * One zig-zag waterfall: five equally sized frames (four live 2FJG stages and the MMetrics analysis view) alternate
 * left and right, joined by a flowing line that fills as you scroll. Stages are mounted only near the viewport.
 */
export function CapabilityFlowSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.tasks');
  const flowCopy = useTranslations('home.flow');
  const copy = flowCopy.raw('items') as Record<string, { title: string; lead: string; body: string }>;
  const results = useTranslations('home.results');
  const mm = useTranslations('mmetricsDemo');
  const reduce = useReducedMotion();
  const translated = t.raw('selectorTasks') as CapabilityTask[];
  const source = locale === 'zh' ? mockContent.capabilities.tasks : translated;
  const tasks = ORDER.map(id => source.find(task => task.id === id)).filter((task): task is CapabilityTask => !!task);
  const stepOf = (id: string) => ORDER.indexOf(id) + 1;
  const visual = t.raw('visual') as TaskVisualLabels & Pick<StageLabels, 'candidates' | 'melting' | 'before' | 'after' | 'generating' | 'denoise' | 'illustrative'>;
  const vegf = t.raw('vegf') as VegfLabels & { caseKicker: string; caseTitle: string; caseStart: string; viewPdb: string };
  const stage: StageLabels = { vegf, candidates: visual.candidates, melting: visual.melting, before: visual.before, after: visual.after, generating: visual.generating, denoise: visual.denoise, illustrative: visual.illustrative };

  // Fetch the Mol* stage chunk while idle, so the first frame doesn't wait on it.
  // Everything a stage needs is fetched while the browser is idle (Mol* itself, each stage's code, each structure file),
  // so by the time a row scrolls in there is nothing left to wait for.
  useEffect(() => afterHeroEntrance(() => {
    ['/demo/kn035-pdl1-mmfold.cif', '/demo/5grj-avelumab-pdl1.cif', '/demo/dbl1-pdl1-7xyq.cif', '/demo/pdl1-denovo.cif'].forEach(src => preloadStructure(src).catch(() => {}));
    void import('@/components/hero/molstar-controller');
    void import('@/components/hero/MolstarViewer');
    void import('@/components/motion/prompt-flow-stage'); void import('@/components/motion/affinity-flow-stage');
    void import('@/components/motion/stability-flow-stage'); void import('@/components/motion/denovo-flow-stage');
  }), []);

  const copyText = (id: string, extra?: ReactNode) => <>
    <p className="wf-kicker"><span>{String(stepOf(id)).padStart(2, '0')}</span></p>
    <h3><Phrases text={copy[id].title} /></h3>
    <p className="wf-lead">{copy[id].lead}</p>
    <p className="wf-body">{copy[id].body}</p>
    {extra}
  </>;
  const taskRow = (task: CapabilityTask) => ({
    key: task.id,
    frame: (near: boolean) => <div className="wf-frame glow-frame"><div className="capability-media">{task.id === 'structure' ? <PromptFlow armed={near} locale={locale} /> : task.id === 'affinity' ? <AffinityFlow armed={near} locale={locale} /> : task.id === 'stability' ? <StabilityFlow armed={near} locale={locale} /> : task.id === 'denovo' ? <DenovoFlow armed={near} locale={locale} /> : <TaskStage id={task.id} armed={near} visual={visual} stage={stage} />}</div></div>,
    text: copyText(task.id),
  });
  const metricsRow = {
    key: 'mmetrics',
    frame: () => <div className="wf-frame glow-frame"><div className="wf-mm"><MosScale label={{ expand: mm('expand'), collapse: mm('collapse') }}><MMetricsDemo locale={locale} autoLoad dataset="5GRJ" /></MosScale></div></div>,
    text: copyText('mmetrics', <a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer" className="group wf-link">
      {results('link')}<ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
    </a>),
  };
  const rows = ORDER.map(id => (id === 'mmetrics' ? metricsRow : tasks.find(task => task.id === id) && taskRow(tasks.find(task => task.id === id)!))).filter((row): row is NonNullable<typeof row> => !!row);

  return <section className="wf-section home-section-pad" data-nav-section="platform">
    <div className="site-container">
      <Reveal><SectionHeading eyebrow={flowCopy('eyebrow')} title={flowCopy('title')} /></Reveal>
      <Reveal delay={0.05}><div className="vegf-case">
        <span className="vegf-case-kicker">{vegf.caseKicker}</span><strong>{vegf.caseTitle}</strong><span className="vegf-case-start">{vegf.caseStart}</span>
        <a href="https://www.rcsb.org/structure/2FJG" target="_blank" rel="noopener noreferrer">{vegf.viewPdb}<ArrowUpRight size={14} aria-hidden="true" /></a>
      </div></Reveal>
      {TRACKS.map((track, ti) => {
        const trackRows = rows.filter(row => track.ids.includes(row.key));
        return <div key={track.key} className="wf-track" data-track={track.key}>
          {ti > 0 && <div className="wf-fork" aria-hidden="true"><span>{flowCopy('tracks.or')}</span></div>}
          <div className="wf-track-head">
            <span className="wf-track-tag">{flowCopy(`tracks.${track.key}.label`)}</span>
            <div><strong>{flowCopy(`tracks.${track.key}.title`)}</strong><p>{flowCopy(`tracks.${track.key}.sub`)}</p></div>
            <span className="wf-track-range">{String(ORDER.indexOf(track.ids[0]) + 1).padStart(2, '0')}{track.ids.length > 1 ? ` – ${String(ORDER.indexOf(track.ids[track.ids.length - 1]) + 1).padStart(2, '0')}` : ''}</span>
          </div>
          <FlowTrack rows={trackRows} start={ORDER.indexOf(track.ids[0])} reduce={!!reduce} />
        </div>;
      })}
    </div>
  </section>;
}

// Two independent tracks: A refines a molecule you already have (steps 01–04), B designs one from scratch (step 05).
const TRACKS = [
  { key: 'a', ids: ['structure', 'mmetrics', 'affinity', 'stability'] },
  { key: 'b', ids: ['denovo'] },
];

type Row = { key: string; frame: (near: boolean) => ReactNode; text: ReactNode };

function FlowTrack({ rows, start, reduce }: { rows: Row[]; start: number; reduce: boolean }) {
  return <div className="wf-list">
    {rows.map((row, i) => <FlowRow key={row.key} index={start + i} accent={ACCENT[row.key] ?? '185,174,240'} flip={i % 2 === 1} reduce={reduce} frame={row.frame} text={row.text} />)}
  </div>;
}

function FlowRow({ index, accent, flip, reduce, frame, text }: { index: number; accent: string; flip: boolean; reduce: boolean; frame: (near: boolean) => ReactNode; text: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { margin: '70% 0px 70% 0px' });
  const lit = useInView(ref, { margin: '-44% 0px -44% 0px' });
  const [reached, setReached] = useState(false);
  useEffect(() => { if (lit) setReached(true); }, [lit]);

  // Scroll-scrubbed and spring-smoothed: the frame swings in from its side in 3D, the text rises after it.
  const { scrollYProgress: entry } = useScroll({ target: ref, offset: ['start end', 'center 58%'] });
  const { scrollYProgress: pass } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const enter = useSpring(entry, { stiffness: 70, damping: 22, mass: 0.7 });
  const drift = useSpring(pass, { stiffness: 60, damping: 24 });
  const dir = flip ? 1 : -1;
  // Narrow screens stack the rows, so the swing is kept small there.
  const [swing, setSwing] = useState(140);
  useEffect(() => setSwing(innerWidth < 1024 ? 36 : 140), []);
  const frameX = useTransform(enter, [0, 1], [dir * swing, 0]);
  const frameRotate = useTransform(enter, [0, 1], [dir * (swing > 60 ? -22 : -8), 0]);
  const frameScale = useTransform(enter, [0, 1], [0.86, 1]);
  const frameOpacity = useTransform(enter, [0, 0.55], [0, 1]);
  const frameY = useTransform(drift, [0, 1], [18, -18]);
  const textY = useTransform(enter, [0.15, 1], [70, 0]);
  const textOpacity = useTransform(enter, [0.25, 0.85], [0, 1]);
  const numeralY = useTransform(drift, [0, 1], [90, -90]);

  return <div ref={ref} className="wf-row" data-wf-row style={{ '--accent': accent } as CSSProperties} data-flip={flip || undefined} data-lit={lit || undefined} data-reached={reached || undefined}>
    <div className="wf-frame-col" data-wf-frame>
      <motion.div className="wf-frame-motion" style={reduce ? undefined : { x: frameX, y: frameY, rotateY: frameRotate, scale: frameScale, opacity: frameOpacity }}>
        <span className="wf-halo" aria-hidden="true" />
        {frame(near)}
      </motion.div>
    </div>
    <motion.div className="wf-text" data-wf-text style={reduce ? undefined : { y: textY, opacity: textOpacity }}>
      <motion.span className="wf-numeral" aria-hidden="true" style={reduce ? undefined : { y: numeralY }}>{String(index + 1).padStart(2, '0')}</motion.span>
      {text}
    </motion.div>
  </div>;
}
