'use client';

import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { Reveal } from '@/components/motion/reveal';

export function FinalCTASection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.final');
  return <section className="final-cta" data-nav-section="platform">
    <div className="final-atmosphere" aria-hidden="true"><div className="final-orb" /></div>
    <div className="site-container relative flex flex-col items-center">
      <Reveal><h2 className="section-title">{t('title')}</h2></Reveal>
      <Reveal delay={0.1}><p className="section-copy mx-auto">{t('description')}</p></Reveal>
      <Reveal delay={0.2} className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <CTAButton locale={locale} /><CTAButton locale={locale} kind="secondary" />
      </Reveal>
    </div>
  </section>;
}
