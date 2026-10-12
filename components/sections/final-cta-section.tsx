'use client';

import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { Reveal } from '@/components/motion/reveal';
import { ProteinField } from '@/components/motion/protein-field';
import { Phrases } from '@/components/ui/phrase-title';

export function FinalCTASection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.final');
  return <section className="final-cta" data-nav-section="platform">
    <div className="final-atmosphere" aria-hidden="true"><div className="final-orb" /></div>
    {/* Bookend: the hero's sequence field returns behind the closing call to action. */}
    <ProteinField className="final-field" calmSelector=".final-copy" />
    <div className="final-copy site-container relative flex flex-col items-center">
      <Reveal><h2 className="section-title"><Phrases text={t('title')} /></h2></Reveal>
      <Reveal delay={0.1}><p className="section-copy mx-auto">{t('description')}</p></Reveal>
      <Reveal delay={0.2} className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <CTAButton locale={locale} /><CTAButton locale={locale} kind="secondary" />
      </Reveal>
    </div>
  </section>;
}
