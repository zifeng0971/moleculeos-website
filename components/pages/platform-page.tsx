'use client';

import type { CSSProperties } from 'react';
import { CTAButton } from '@/components/ui/cta-button';
import { Reveal } from '@/components/motion/reveal';
import { type Locale } from '@/lib/site-config';
import { Flow, Phrases } from '@/components/ui/phrase-title';
import { PLATFORM_COPY } from '@/content/platform-models';
import './platform-page.css';

// The only colour on the page: a small key square beside each model (the site's module hues).
const TONE = { structure: 'var(--sky)', design: 'var(--sage)', agent: 'var(--lilac)' } as const;
// The watercolor plates (the first three are the homepage model stack's).
const ART: Record<string, string> = { mmfold: '/brand/model-stack/mmfold.webp?v=2', mmdesign: '/brand/model-stack/mmdesign.webp?v=2', moleculeos: '/brand/model-stack/moleculeos.webp?v=2', quantamind: '/brand/model-stack/quantamind.webp?v=2' };
const hue = (value: string) => ({ '--c': value }) as CSSProperties;

/** One page for the platform and its models: the stack, three core models, five engineering capabilities, MoleculeOS. */
export function PlatformPage({ locale }: { locale: Locale }) {
  const c = PLATFORM_COPY[locale];
  return <div className="site-container pm">
    <section id="overview">
      <Reveal className="pm-head">
        <p className="pm-eyebrow">{c.eyebrow}</p>
        <h1><Phrases text={c.title} /></h1>
        <p className="pm-lead">{c.lead.split('\n').map((line, i) => <span key={i} className="block"><Flow text={line} /></span>)}</p>
      </Reveal>
    </section>

    <section id="models" className="pm-section">
      <Reveal>
        <h2>{c.modelsTitle}</h2>
        <p className="pm-sub"><Flow text={c.modelsLead} /></p>
      </Reveal>
      <div className="pm-engines">
        {c.engines.map(engine => <article key={engine.id} id={engine.id} className="pm-engine" style={hue(TONE[engine.tone])}>
          <div>
            <h3>{engine.name}</h3>
            <span className="pm-engine-kind">{engine.kind}</span>
            {ART[engine.id] && <Reveal><img className="pm-art" src={ART[engine.id]} alt="" width={1200} height={750} loading="lazy" decoding="async" draggable={false} /></Reveal>}
          </div>
          <div>
            <p className="pm-engine-body">{engine.body}</p>
            <dl className="pm-stats">
              {engine.stats.map(stat => <div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
            </dl>
            {engine.note && <p className="pm-note">{engine.note}</p>}
            {engine.report && <a className="pm-report" href={engine.report.href} target="_blank" rel="noreferrer">{engine.report.label} ↗</a>}
          </div>
        </article>)}
      </div>
    </section>

    <section id="engineering" className="pm-section">
      <Reveal>
        <h2>{c.engineeringTitle}</h2>
        <p className="pm-sub"><Flow text={c.engineeringLead} /></p>
      </Reveal>
      <ul className="pm-skills">
        {c.skills.map(skill => <li key={skill.name} className="pm-skill">
          <div><small>{skill.kind}</small><h3>{skill.name}</h3></div>
          <p>{skill.body}</p>
          <em>{skill.result}</em>
        </li>)}
      </ul>
    </section>

    <section id="platform" className="pm-os">
      <div>
        <h2>{c.platformTitle}</h2>
        <Reveal><img className="pm-art" src={ART.moleculeos} alt="" width={1200} height={750} loading="lazy" decoding="async" draggable={false} /></Reveal>
      </div>
      <div>
        <p className="pm-sub"><Flow text={c.platformLead} /></p>
        <ul className="pm-os-points">{c.platformPoints.map(point => <li key={point}>{point}</li>)}</ul>
        <div className="pm-cta"><CTAButton locale={locale} kind="secondary" /></div>
      </div>
    </section>
  </div>;
}
