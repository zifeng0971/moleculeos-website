'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { MMetricsDemo } from '@/components/hero/MMetricsDemo';
import { SITE_CONFIG, type Locale } from '@/lib/site-config';

export function ResultsSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.results');
  return <section className="results-section py-24" data-nav-section="platform">
    <div className="site-container results-container">
      <div className="min-w-0">
        <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>
        <h2 className="section-title">{t.raw('title') as string}</h2>
        <p className="mt-6 max-w-[680px] text-lg text-muted-foreground">{t.raw('description') as string}</p>
        <a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--accent-text)] hover:text-white">
          {t('link')}<ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
      <div className="results-viewer"><MMetricsDemo locale={locale} autoLoad /></div>
    </div>
  </section>;
}
