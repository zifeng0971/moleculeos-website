'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';
import { preloadStructure } from '@/lib/structure-cache';
import { localizeHref, type Locale } from '@/lib/site-config';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { Flow, Phrases } from '@/components/ui/phrase-title';
import { OneProtein } from '@/components/motion/one-protein';
import { MODULE } from '@/lib/palette';

const ORDER = ['structure', 'mmetrics', 'affinity', 'stability', 'denovo'] as const;
// Each step wears the hue of the module it uses (lib/palette.ts); it tints the step index.
const ACCENT: Record<(typeof ORDER)[number], string> = { structure: MODULE.structure, mmetrics: MODULE.sequence, affinity: MODULE.affinity, stability: MODULE.stability, denovo: MODULE.design };

/**
 * One molecule for the whole story: a single sticky PD-L1 / KN035 stage with the five steps scrolling beside it.
 * The Mocha box appears once, in step 01; every later step is a different view of the same structure.
 */
export function OneProteinSection({ locale }: { locale: Locale }) {
  const s = useTranslations('home.story');
  const nav = useTranslations('nav');
  const common = useTranslations('common');
  // Module names for the kicker; MMetrics is a product name and stays as is.
  // The nav labels carry a "| model" suffix; the kicker wants just the module name.
  const plain = (label: string) => label.split(/\s*[|｜]\s*/)[0];
  const moduleName: Record<(typeof ORDER)[number], string> = { structure: plain(nav('structurePrediction')), mmetrics: 'MMetrics', affinity: plain(nav('affinityOptimization')), stability: plain(nav('stabilityEngineering')), denovo: plain(nav('deNovoDesign')) };
  const items = s.raw('items') as Record<(typeof ORDER)[number], { title: string; lead: string; body: string; verdict?: string; note?: string }>;
  const layout = useRef<HTMLDivElement>(null);
  const steps = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0), [armed, setArmed] = useState(false);

  // Fetch Mol* and the structure while the browser is idle, so the stage doesn't wait when it scrolls in.
  useEffect(() => afterHeroEntrance(() => {
    preloadStructure('/demo/kn035-pdl1-story.cif').catch(() => {});
    void import('@/components/hero/molstar-controller');
    void import('@/components/motion/one-protein-stage');
    void import('@/components/motion/one-protein-mm');
  }), []);

  useEffect(() => {
    const near = new IntersectionObserver(([entry]) => setArmed(entry.isIntersecting), { rootMargin: '70% 0px 70% 0px' });
    near.observe(layout.current!);
    // The step crossing the middle of the viewport is the one the stage shows.
    const mid = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step)); }), { rootMargin: '-45% 0px -45% 0px' });
    steps.current.forEach(node => node && mid.observe(node));
    // While the waterfall is on screen the page snaps strictly to its steps, so a quick flick can't skip one.
    const root = document.documentElement;
    const update = () => {
      const r = layout.current!.getBoundingClientRect();
      if (r.bottom > innerHeight * 0.3 && r.top < innerHeight * 0.7) root.dataset.opSnap = 'on'; else delete root.dataset.opSnap;
    };
    addEventListener('scroll', update, { passive: true }); update();
    return () => { near.disconnect(); mid.disconnect(); removeEventListener('scroll', update); delete root.dataset.opSnap; };
  }, []);


  return <section className="op-section" data-nav-section="platform">
    <div className="site-container">
      <Reveal><SectionHeading eyebrow={s('eyebrow')} title={s('title')} /></Reveal>
      <Reveal delay={0.05}><div className="vegf-case">
        <span className="vegf-case-start">{s('case.start')}</span>
      </div></Reveal>
      <div ref={layout} className="op-layout">
        <div className="op-stage-col" style={{ '--accent': ACCENT[ORDER[active]], '--accent-c': `rgb(${ACCENT[ORDER[active]]})` } as CSSProperties}>
          <div className="op-media"><OneProtein armed={armed} step={active} locale={locale} /></div>
        </div>
        <div className="op-steps">
          {ORDER.map((id, i) => <article key={id} ref={node => { steps.current[i] = node; }} className="op-step" data-step={i} data-on={i === active || undefined} style={{ '--accent': ACCENT[id] } as CSSProperties}>
            <div className="wf-text">
              <p className="wf-kicker">
                {/* The pipeline as five segments in their module hues; this step's segment is lit. It is also the colour key. */}
                <span className="op-strip" aria-hidden="true">{ORDER.map((k, j) => <i key={k} style={{ '--m': ACCENT[k] } as CSSProperties} data-on={j === i || undefined} />)}</span>
                <span>{String(i + 1).padStart(2, '0')}</span><em>{moduleName[id]}</em>
              </p>
              <h3><Phrases text={items[id].title} /></h3>
              <p className="wf-lead"><Flow text={items[id].lead} /></p>
              <p className="wf-body"><Flow text={items[id].body} /></p>
              {items[id].verdict && <p className="wf-verdict"><Flow text={items[id].verdict!} /></p>}
              {items[id].note && <div className="wf-foot">
                <p className="wf-note"><Flow text={items[id].note!} /></p>
                {id === 'denovo' && <Link href={localizeHref('/contact', locale)} className="wf-contact">{common('contact')}<ArrowUpRight size={14} aria-hidden="true" /></Link>}
              </div>}
            </div>
          </article>)}
        </div>
      </div>
    </div>
  </section>;
}
