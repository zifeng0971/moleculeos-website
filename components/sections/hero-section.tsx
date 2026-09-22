'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Fragment, useRef } from 'react';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { AgentDemo } from '@/components/hero/AgentDemo';

export function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero');
  const titleParts = t('title').split('\n');
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const item = { hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 28, filter: 'blur(6px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduceMotion ? 0.15 : 0.85, ease: [0.16, 1, 0.3, 1] as const } } };
  return (
    <section ref={sectionRef} className="hero-section relative overflow-hidden" data-nav-section="platform">
      <div className="section-atmosphere" aria-hidden="true"><div className="ambient-glow -left-40 top-16 size-[38rem] opacity-[0.10]" /></div>
      <div className="section-atmosphere" aria-hidden="true"><div className="ambient-glow -right-48 bottom-10 size-[42rem] opacity-[0.07]" /></div>
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:4rem_4rem] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
      <div className="hero-composition site-container relative">
        <motion.div className="hero-copy" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}>
          {/* Keep this eyebrow solid: the hero already has a gradient line and primary CTA. */}
          <motion.p className="eyebrow eyebrow-solid" variants={item}>{t('eyebrow')}</motion.p>
          <motion.h1
            className="hero-title text-balance [hyphens:none] font-semibold leading-[1.2] tracking-[-0.01em]"
            variants={item}
            aria-label={titleParts.join(locale === 'en' ? ' ' : '')}
          >
            {locale === 'en'
              ? titleParts.join(' ')
              : titleParts.map((part, index) => (
                  <Fragment key={part}>
                    {index > 0 ? <wbr /> : null}
                    <span className="inline-block whitespace-nowrap">{part}</span>
                  </Fragment>
                ))}
          </motion.h1>
          <motion.div className="hero-brand-line h-0.5 w-[7.5rem]" variants={item} aria-hidden="true" />
          <motion.p className="hero-description max-w-[680px] text-muted-foreground" variants={item}>{t('description')}</motion.p>
          <motion.div className="hero-actions flex flex-col gap-3 sm:flex-row" variants={item}>
            <CTAButton locale={locale} />
            <CTAButton locale={locale} kind="secondary" />
          </motion.div>
        </motion.div>
        <motion.div className="hero-demo-column relative min-w-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0.15 : 0.85, delay: reduceMotion ? 0 : 0.27 }}>
          <AgentDemo />
        </motion.div>
      </div>
    </section>
  );
}
