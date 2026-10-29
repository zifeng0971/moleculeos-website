'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef, type CSSProperties } from 'react';
import type { Locale } from '@/lib/site-config';
import { AgentDemo } from '@/components/hero/AgentDemo';
import { ProteinField } from '@/components/motion/protein-field';
import { Flow, Phrases } from '@/components/ui/phrase-title';

const delay = (seconds: number) => ({ '--enter-delay': `${seconds.toFixed(2)}s` }) as CSSProperties;

export function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero');
  const titleParts = t('title').split('\n');
  const sectionRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Apple-style "lid opening": the workbench tilts back, then settles flat as it scrolls into view.
  const { scrollYProgress } = useScroll({ target: demoRef, offset: ['start end', 'start 0.18'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const { scrollYProgress: heroProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const copyY = useTransform(heroProgress, [0, 0.4], [0, -60]);
  const copyOpacity = useTransform(heroProgress, [0, 0.32], [1, 0]);

  return (
    <section ref={sectionRef} className="hero-section relative overflow-hidden" data-nav-section="platform">
      <ProteinField className="hero-canvas" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-composition site-container relative">
        {/* Entrance runs in CSS so the headline paints before hydration; motion only drives the scroll fade. */}
        <motion.div className="hero-copy" style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }}>
          <p className="hero-pill hero-enter" style={delay(0.1)}>{t('eyebrow')}</p>
          <h1 className="hero-title text-balance [hyphens:none]" data-locale={locale} aria-label={titleParts.join(locale === 'en' ? ' ' : '')}>
            {titleParts.map((part, index) => (
              <span key={part} aria-hidden="true" style={delay(0.22 + index * 0.12)}
                className={`hero-title-line hero-enter ${index === titleParts.length - 1 ? 'hero-title-line-b' : 'hero-title-line-a'}`}>
                <Phrases text={part} />
              </span>
            ))}
          </h1>
          <p className="hero-description hero-enter" style={delay(0.46)}><Flow text={t('description')} /></p>
        </motion.div>
        <div ref={demoRef} className="hero-demo-column hero-demo-stage hero-enter min-w-0" style={delay(0.7)}>
          <div className="hero-demo-halo" aria-hidden="true" />
          <motion.div className="hero-demo-tilt" style={reduceMotion ? undefined : { rotateX, scale, y }}>
            <div className="demo-edge"><AgentDemo /></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
