'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { MMetricsDemo } from '@/components/hero/MMetricsDemo';
import { SITE_CONFIG, type Locale } from '@/lib/site-config';
import { Reveal } from '@/components/motion/reveal';
import { Phrases, isPlaceholder } from '@/components/ui/phrase-title';

/** Product proof: a centred headline over a full-width, live MMetrics surface. */
export function ResultsSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.results');
  const title = t.raw('title') as string;
  const description = t.raw('description') as string;
  // Until business copy is confirmed, the confirmed eyebrow becomes the headline rather than showing a placeholder.
  const pending = isPlaceholder(title);
  return <section className="results-section" data-nav-section="platform">
    <div className="site-container results-stack">
      <Reveal className="text-center">
        {!pending && <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>}
        <h2 className="section-title mx-auto"><Phrases text={pending ? t('eyebrow') : title} /></h2>
        {!isPlaceholder(description) && <p className="section-copy mx-auto">{description}</p>}
      </Reveal>
      <Reveal delay={0.15} className="results-viewer"><div className="glow-frame"><MMetricsDemo locale={locale} autoLoad /></div></Reveal>
      <Reveal className="flex justify-center">
        <a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[#B6A6FF] transition-colors hover:text-white">
          {t('link')}<ArrowRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </Reveal>
    </div>
  </section>;
}
