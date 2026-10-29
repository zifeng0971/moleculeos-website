'use client';

import { useState } from 'react';
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
  return <section className="home-section-pad py-24" data-nav-section="validation">
    <div className="site-container">
      <Reveal className="text-center"><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><Heading className="section-title mx-auto"><Phrases text={t('gridTitle')} /></Heading>
        <p className="mx-auto mt-5 max-w-[46ch] text-[clamp(16px,1.4vw,19px)] leading-[1.7] text-[rgba(255,255,255,0.66)]">{t('description')}</p>
        {/* Never separate the verified result from its low-throughput conditions. On the homepage the evidence band carries both. */}
        {page && <p className="mx-auto mt-6 max-w-[40ch] text-[clamp(18px,1.6vw,22px)] font-medium leading-[1.6] text-[rgba(255,255,255,0.72)]">{t('successCondition')}</p>}
      </Reveal>
      <Reveal delay={0.1} blur={false}><CaseExplorer cases={cases} /></Reveal>
    </div>
  </section>;
}

/** "51 pM" → value "51", unit "pM": the unit is set smaller. The text itself is shown exactly as written; "30/30" has no unit. */
function splitFigure(figure: string) {
  const match = /^([\d.,/]+)\s*(.*)$/.exec(figure);
  return match ? { value: match[1], unit: match[2], spaced: /^[A-Za-z]/.test(match[2]) } : { value: figure, unit: '', spaced: false };
}

// Each case wears the hue of the kind of work it proves (lib/palette.ts): three de novo designs, one affinity case, one stability, one sequence.
// (The PD-L1 de novo case is parked, so this list starts at NK3R; put a third `design` back in front when it returns.)
const ACCENTS = [MODULE.design, MODULE.design, MODULE.affinity, MODULE.stability, MODULE.sequence];

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

/** One case at a time on a lit stage, its key figure large; the index on the left steps through all six. */
function CaseExplorer({ cases }: { cases: ValidationCase[] }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  // Click-only: a case stays on stage while it is being read. The rail is a static marker of the selection.
  const item = cases[active];
  const figure = splitFigure(item.figure);
  return <div className="case-explorer mt-12" style={{ ['--c' as string]: ACCENTS[active] }}>
    <div className="case-index" role="tablist" aria-orientation="vertical">
      {cases.map((c, i) => { const f = splitFigure(c.figure); return <button key={c.title} role="tab" aria-selected={i === active} className="case-index-item" style={{ ['--c' as string]: ACCENTS[i] }} onClick={() => setActive(i)} onFocus={() => setActive(i)}>
        <span className="case-index-dot" aria-hidden="true" />
        <span className="case-index-text"><strong>{c.title}</strong><small>{c.subtitle}</small></span>
        <span className="case-index-figure">{f.value}<i data-spaced={f.spaced || undefined}>{f.unit}</i></span>
        {i === active && <motion.span layoutId="case-index-hl" className="case-index-hl" aria-hidden="true" style={{ borderRadius: 16 }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 36, mass: 0.9 }}>
          <span className="case-index-bar"><i data-static /></span>
        </motion.span>}
      </button>; })}
    </div>
    <div className="case-stage" role="tabpanel">
      <span className="case-stage-glow" aria-hidden="true" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={active} className="case-stage-body" initial={{ opacity: 0, y: reduce ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduce ? 0 : -6, transition: { duration: 0.16, ease: 'easeIn' } }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}>
          <header className="cs-head"><strong>{item.title}</strong><small>{item.subtitle}</small></header>
          <div className="cs-hero">
            <p className="case-stage-figure" aria-label={item.figure}>{figure.value}<span data-spaced={figure.spaced || undefined}>{figure.unit}</span></p>
            <h3 className="case-stage-result"><Flow text={item.result} /></h3>
          </div>
          <CaseChart viz={item.viz} />
          <p className="case-stage-text"><Flow text={item.body} /></p>
          <div className="case-stage-foot">{item.tags.map(tag => <span key={tag} className="case-chip">{tag}</span>)}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>;
}
