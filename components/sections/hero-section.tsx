'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { AgentDemo } from '@/components/hero/AgentDemo';
import { MoleculeField } from '@/components/motion/molecule-field';

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero');
  const titleParts = t('title').split('\n');
  const sectionRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const item = {
    hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, filter: 'blur(12px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduceMotion ? 0.15 : 1.1, ease } },
  };

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
      <MoleculeField className="hero-canvas" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-composition site-container relative">
        <motion.div className="hero-copy" initial="hidden" animate="show" style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}>
          <motion.p className="hero-pill" variants={item}><span className="hero-pill-dot" aria-hidden="true" />{t('eyebrow')}</motion.p>
          <h1 className="hero-title text-balance [hyphens:none]" aria-label={titleParts.join(locale === 'en' ? ' ' : '')}>
            {titleParts.map((part, index) => (
              <motion.span key={part} aria-hidden="true" variants={item}
                className={`hero-title-line ${index === titleParts.length - 1 ? 'hero-title-line-b' : 'hero-title-line-a'}`}>
                {part}
              </motion.span>
            ))}
          </h1>
          <motion.p className="hero-description" variants={item}>{t('description')}</motion.p>
          <motion.div className="hero-actions flex flex-col gap-3 sm:flex-row" variants={item}>
            <CTAButton locale={locale} />
            <CTAButton locale={locale} kind="secondary" />
          </motion.div>
        </motion.div>
        <motion.div ref={demoRef} className="hero-demo-column hero-demo-stage min-w-0"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 60 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 1.4, delay: reduceMotion ? 0 : 0.55, ease }}>
          <div className="hero-demo-halo" aria-hidden="true" />
          <motion.div className="hero-demo-tilt" style={reduceMotion ? undefined : { rotateX, scale, y }}>
            <div className="device-frame"><AgentDemo /></div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
