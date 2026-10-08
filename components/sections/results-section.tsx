'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { MMetricsDemo } from '@/components/hero/MMetricsDemo';
import { SITE_CONFIG, type Locale } from '@/lib/site-config';
import { Reveal } from '@/components/motion/reveal';

export function ResultsSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.results');
  return <section className="results-section py-24" data-nav-section="platform">
    <div className="site-container results-container">
      <Reveal className="min-w-0">
        <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>
        <h2 className="section-title">{t.raw('title') as string}</h2>
        <p className="section-copy">{t.raw('description') as string}</p>
        <a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer" className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[#B6A6FF] transition-colors hover:text-white">
          {t('link')}<ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </Reveal>
      <Reveal delay={0.15} className="results-viewer"><div className="glow-frame"><MMetricsDemo locale={locale} autoLoad /></div></Reveal>
    </div>
  </section>;
}
