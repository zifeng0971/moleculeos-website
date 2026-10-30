'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/reveal';
import type { Locale } from '@/lib/site-config';
import { Flow, Phrases } from '@/components/ui/phrase-title';
import { MODULE } from '@/lib/palette';

export type CaseViz = { kind: 'dots'; total: number; hits: number; caption: string; extra: string } | { kind: 'bars'; caption: string; extra: string; bars: { label: string; value: number; text: string }[] };
export type ValidationCase = { title: string; subtitle: string; figure: string; result: string; body: string; tags: string[]; viz: CaseViz; background: string; challenge: string; strategy: string; molecule: string; duration: string };

export function ValidationSection({ page = false }: { locale?: Locale; page?: boolean }) {
  const t = useTranslations('home.validation');
  const cases = t.raw('cases') as ValidationCase[];
  const Heading = page ? 'h1' : 'h2';
  // On the homepage (wide screens, motion allowed) the section pins and scrolls through the cases one stop each, then moves on.
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (page) return;
    const media = matchMedia('(min-width: 1024px) and (min-height: 720px)');
    const update = () => setPinned(media.matches && !reduce);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [page, reduce]);
  return <section className="home-section-pad py-24" data-nav-section="validation" data-pinned={pinned || undefined} style={{ ['--case-n' as string]: cases.length }}>
    {/* Snap stops, one per case, a screen apart (the content above them stays pinned). */}
    {pinned && <div className="case-snaps" aria-hidden="true">{cases.map((c, i) => <span key={c.title} style={{ top: `calc(${i} * (100svh - var(--nav-h)))` }} />)}</div>}
    <div className="site-container">
      <Reveal className="text-center"><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><Heading className="section-title mx-auto"><Phrases text={t('gridTitle')} /></Heading>
        <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(16px,1.4vw,19px)] leading-[1.7] text-[rgba(255,255,255,0.66)]">{t('description')}</p>
        {/* Never separate the verified result from its low-throughput conditions. On the homepage the evidence band carries both. */}
        {page && <p className="mx-auto mt-6 max-w-[40ch] text-[clamp(18px,1.6vw,22px)] font-medium leading-[1.6] text-[rgba(255,255,255,0.72)]">{t('successCondition')}</p>}
      </Reveal>
      <Reveal delay={0.1} blur={false}><CaseExplorer cases={cases} pinned={pinned} /></Reveal>
    </div>
  </section>;
}

/** "51 pM" → value "51", unit "pM": the unit is set smaller. A ratio is split the same way, "30/30" → "30" + "/30", so its
    denominator is set like a unit. The text itself is shown exactly as written. */
function splitFigure(figure: string) {
  const ratio = /^([\d.,]+)(\/[\d.,]+)$/.exec(figure);
  if (ratio) return { value: ratio[1], unit: ratio[2], spaced: false };
  const match = /^([\d.,]+)\s*(.*)$/.exec(figure);
  return match ? { value: match[1], unit: match[2], spaced: /^[A-Za-z]/.test(match[2]) } : { value: figure, unit: '', spaced: false };
}

// Each case wears the hue of the kind of work it proves (lib/palette.ts): de novo designs, one affinity case, one stability, one
// sequence. The two de novo nanobody cases sit next to each other, so the second takes the palette's sky blue to tell them apart.
// (The PD-L1 de novo case is parked, so this list starts at NK3R; put a `design` back in front when it returns.)
const ACCENTS = [MODULE.design, MODULE.structure, MODULE.affinity, MODULE.stability, MODULE.sequence];

/** The numbers of the case drawn as they are: hit dots for "k of n", bars for a before / after ratio. Nothing here is invented. */
function CaseChart({ viz }: { viz: CaseViz }) {
  if (viz.kind === 'dots') {
    return <div className="cs-chart" data-kind="dots">
      <div className="cs-dots" aria-hidden="true">{Array.from({ length: viz.total }, (_, i) => <i key={i} data-hit={i < viz.hits || undefined} style={{ animationDelay: `${180 + i * 28}ms` }} />)}</div>
      <p className="cs-chart-row"><span>{viz.caption}</span><b>{viz.extra}</b></p>
    </div>;
  }
  const max = Math.max(...viz.bars.map(b => b.value));
  return <div className="cs-chart" data-kind="bars">
    <div className="cs-bars">{viz.bars.map((b, i) => <div key={b.label} className="cs-bar"><span>{b.label}</span><u><i style={{ width: `${Math.max(2.5, (b.value / max) * 100)}%`, animationDelay: `${200 + i * 160}ms` }} data-top={i === viz.bars.length - 1 || undefined} /></u><b>{b.text}</b></div>)}</div>
    <p className="cs-chart-row"><span>{viz.caption}</span><b>{viz.extra}</b></p>
  </div>;
}

// How long each case stays on stage while the explorer plays on its own (ms).
const CASE_HOLD = 4500;

/** One case at a time, its key figure large; the index on the left steps through all of them. */
function CaseExplorer({ cases, pinned }: { cases: ValidationCase[]; pinned: boolean }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  // Autoplay: while the explorer is on screen it moves to the next case every CASE_HOLD, the current item's rail filling as the
  // time runs. It pauses while the pointer is over it (to read or pick a case) and resumes, from the case on stage, when it leaves.
  const root = useRef<HTMLDivElement>(null);
  // Pinned, the case on stage is the scroll position's: stop i (a screen apart) shows case i. Picking a case or the autoplay
  // moving on scrolls to that stop, which looks the same since the content stays put, so scrolling and the stage never disagree.
  const stops = () => {
    const section = root.current?.closest('section'), nav = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 0;
    return section ? { top: section.getBoundingClientRect().top + scrollY - nav, step: innerHeight - nav } : null;
  };
  useEffect(() => {
    if (!pinned) return;
    const update = () => { const s = stops(); if (s) setActive(Math.max(0, Math.min(cases.length - 1, Math.round((scrollY - s.top) / s.step)))); };
    update(); addEventListener('scroll', update, { passive: true });
    return () => removeEventListener('scroll', update);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `stops` reads the DOM live
  }, [pinned, cases.length]);
  // Neighbouring cases glide; a longer jump (autoplay looping back to the first, a click further down the list) is instant, or the
  // stage would flash every case in between on the way.
  const show = (i: number) => {
    const s = pinned && stops();
    if (s) scrollTo({ top: s.top + i * s.step, behavior: reduce || Math.abs(i - active) > 1 ? 'instant' : 'smooth' }); else setActive(i);
  };
  const [inView, setInView] = useState(false), [hovered, setHovered] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  const playing = !reduce && inView && !hovered;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => show((active + 1) % cases.length), CASE_HOLD);
    return () => window.clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `show` reads the DOM live
  }, [playing, active, cases.length]);
  const item = cases[active];
  // One case's content; the stage also lays every case out invisibly in one cell, so it is always as tall as the tallest case and
  // switching never changes its height (bar charts run taller than dot charts).
  const body = (c: ValidationCase) => { const f = splitFigure(c.figure); return <>
    <header className="cs-head"><strong>{c.title}</strong><small>{c.subtitle}</small></header>
    <div className="cs-hero">
      <p className="case-stage-figure" aria-label={c.figure}>{f.value}<span data-spaced={f.spaced || undefined}>{f.unit}</span></p>
      <h3 className="case-stage-result"><Flow text={c.result} /></h3>
    </div>
    <CaseChart viz={c.viz} />
    <p className="case-stage-text"><Flow text={c.body} /></p>
    <div className="case-stage-foot">{c.tags.map(tag => <span key={tag} className="case-chip">{tag}</span>)}</div>
  </>; };
  return <div ref={root} className="case-explorer mt-12" style={{ ['--c' as string]: ACCENTS[active] }} onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    <div className="case-index" role="tablist" aria-orientation="vertical">
      {cases.map((c, i) => { const f = splitFigure(c.figure); return <button key={c.title} role="tab" aria-selected={i === active} className="case-index-item" style={{ ['--c' as string]: ACCENTS[i] }} onClick={() => show(i)}>
        <span className="case-index-dot" aria-hidden="true" />
        <span className="case-index-text"><strong>{c.title}</strong><small>{c.subtitle}</small></span>
        <span className="case-index-figure">{f.value}<i data-spaced={f.spaced || undefined}>{f.unit}</i></span>
        {i === active && <motion.span layoutId="case-index-hl" className="case-index-hl" aria-hidden="true" style={{ borderRadius: 16 }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 36, mass: 0.9 }}>
          <span className="case-index-bar"><i key={`${active}-${playing}`} data-static={!playing || undefined} style={{ animationDuration: `${CASE_HOLD}ms` }} /></span>
        </motion.span>}
      </button>; })}
    </div>
    <div className="case-stage" role="tabpanel">
      <span className="case-stage-glow" aria-hidden="true" />
      <div className="case-stage-sizer" aria-hidden="true">{cases.map(c => <div key={c.title} className="case-stage-body">{body(c)}</div>)}</div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} className="case-stage-body case-stage-live" initial={{ opacity: 0, y: reduce ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.16, ease: 'easeIn' } }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          {body(item)}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>;
}
