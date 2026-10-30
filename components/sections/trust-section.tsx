'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { CountUpText } from '@/components/ui/count-up-number';
import { getMockContent } from '@/lib/mock-content';
import type { Locale } from '@/lib/site-config';
import { Flow } from '@/components/ui/phrase-title';

// Logo files in public/brand/partners (transparent PNGs, cropped to their artwork): each sits on a white tile so dark marks stay legible on the dark page.
const partners = [
  { src: 'qilu', zh: '齐鲁制药', en: 'Qilu Pharmaceutical' },
  { src: 'hengrui', zh: '恒瑞医药', en: 'Hengrui Pharma' },
  { src: 'cspc', zh: '石药集团', en: 'CSPC' },
  { src: 'cofco', zh: '中粮集团', en: 'COFCO' },
  { src: 'hansoh', zh: '豪森药业', en: 'Hansoh Pharma' },
  { src: 'henlius', zh: '复宏汉霖', en: 'Henlius' },
  { src: 'asymchem', zh: '凯莱英', en: 'Asymchem' },
  { src: 'genscigroup', zh: '金赛药业', en: 'GenSci' },
  { src: 'gensciences', zh: '晟斯生物', en: 'Gensciences' },
  { src: 'sungening', zh: '祥肽生物', en: 'Sungetide' },
  { src: 'jinhe', zh: '安徽金禾实业', en: 'Jinhe Industrial' },
  { src: 'cherami', zh: '谢诺投资', en: 'Cherami Investment' },
];
// Two identical halves: the track drifts by exactly one half, so the loop is seamless.
const loop = [...partners, ...partners];

/** MMDesign technical report (Zenodo), the source of the numbers above. */
const REPORT_URL = 'https://zenodo.org/records/23321531';

/** Evidence band: the headline numbers first, their exact conditions directly beneath, then partners. */
export function TrustSection({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations('home.trust');
  const condition = t('successCondition');
  const locale = useLocale() as Locale;
  const items = getMockContent(locale).trust.items;
  const feedback = t.raw('feedback.items') as { pre: string; hl: string; post: string }[];
  return (
    <section className="proof-band" data-nav-section={embedded ? undefined : 'validation'}>
      <div className="site-container">
        <Reveal><p className="eyebrow proof-eyebrow">{t('eyebrow')}</p></Reveal>
        <div className="proof-stats">
          {items.map((item, index) => <Reveal key={item.label} delay={staggerDelay(index, items.length)} className="proof-stat">
            <p className="stat-value"><CountUpText text={item.value}/></p>
            <p className="proof-stat-label">{item.label}</p>
          </Reveal>)}
        </div>
        {/* Keep the complete verified condition adjacent to the success-rate numbers. */}
        <Reveal><p className="proof-condition"><Flow text={condition} /></p>
          <p className="proof-source">{t('source')} <a href={REPORT_URL} target="_blank" rel="noopener noreferrer">{t('reportLabel')}<ArrowUpRight size={14} aria-hidden="true" /></a></p></Reveal>
        <Reveal className="proof-partners">
          {/* Partners and their feedback read as one block under one eyebrow; the two old labels stay in the copy, hidden on the homepage. */}
          <p className="eyebrow proof-eyebrow proof-partners-eyebrow">{t('partnersEyebrow')}</p>
          <p className="proof-partners-label">{t('label')}</p>
          {/* Partners drift by slowly, logos only; the loop pauses under the pointer. Only the first set is read out. */}
          <div className="partner-marquee">
            <ul className="partner-track">
              {loop.map((partner, index) => <li key={index} aria-hidden={index >= partners.length || undefined}>
                <span className="partner-logo"><Image src={`/brand/partners/${partner.src}.png`} alt={index < partners.length ? partner[locale === 'zh' ? 'zh' : 'en'] : ''} width={140} height={44} /></span>
              </li>)}
            </ul>
          </div>
        </Reveal>
        {/* Customer feedback: four short quotes under the partner logos, the key phrase of each lit up. */}
        <div className="proof-voices">
          <Reveal><p className="proof-voices-label">{t('feedback.label')}</p></Reveal>
          <Reveal><VoiceCarousel items={feedback} /></Reveal>
        </div>
      </div>
    </section>
  );
}

// How long each quote stays while the feedback plays on its own (ms).
const VOICE_HOLD = 5000;

/**
 * Customer feedback, one quote at a time: centred and larger, each new one rolling up from below, with a row of hairline segments
 * (the current one lit) to pick one. All quotes share one grid cell, so the block keeps the height of the longest. Pauses
 * under the pointer and off screen.
 */
function VoiceCarousel({ items }: { items: { pre: string; hl: string; post: string }[] }) {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0), [inView, setInView] = useState(false), [hovered, setHovered] = useState(false);
  useEffect(() => {
    // Each time it comes into view it starts again from the first quote.
    const observer = new IntersectionObserver(([entry]) => { setInView(entry.isIntersecting); if (entry.isIntersecting) setActive(0); }, { threshold: 0.5 });
    observer.observe(root.current!);
    return () => observer.disconnect();
  }, []);
  const playing = !reduce && inView && !hovered;
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setActive(i => (i + 1) % items.length), VOICE_HOLD);
    return () => window.clearTimeout(timer);
  }, [playing, active, items.length]);
  return <div ref={root} className="voice-carousel" onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}>
    <span className="proof-voice-mark" aria-hidden="true">“</span>
    <div className="voice-stage" aria-live="polite">
      {items.map((quote, i) => <p key={quote.hl} className="voice-quote" data-on={i === active || undefined} aria-hidden={i !== active || undefined}>
        <Flow text={quote.pre} /><em><Flow text={quote.hl} /></em><Flow text={quote.post} />
      </p>)}
    </div>
    <div className="voice-strip" role="tablist">
      {items.map((quote, i) => <button key={quote.hl} type="button" role="tab" aria-selected={i === active} aria-label={`${i + 1} / ${items.length}`} onClick={() => setActive(i)}>
        <i data-on={i === active || undefined} />
      </button>)}
    </div>
  </div>;
}
