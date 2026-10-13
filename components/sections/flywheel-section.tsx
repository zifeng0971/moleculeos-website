'use client';

import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/reveal';
import { Phrases } from '@/components/ui/phrase-title';
import { FlywheelScene } from '@/components/motion/flywheel-scene';

/** Data flywheel: each lap of design → experiment → evolve spins the wheel faster and sharpens its precision. */
export function FlywheelSection() {
  const t = useTranslations('home.flywheel');
  return <section className="flywheel home-section-pad" data-nav-section="models">
    <div className="site-container">
      <Reveal className="text-center">
        <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>
        <h2 className="section-title mx-auto"><Phrases text={t('title')} /></h2>
        <p className="section-copy mx-auto">{t('description')}</p>
      </Reveal>
      <Reveal delay={0.1} blur={false}>
        <FlywheelScene labels={{ design: t('design'), experiment: t('experiment'), evolve: t('evolve'), round: n => t('round', { n }), precision: t('precision'), illustrative: t('illustrative') }} />
      </Reveal>
      <ol className="sr-only">{(['design', 'experiment', 'evolve'] as const).map(key => <li key={key}>{t(key)}</li>)}</ol>
    </div>
  </section>;
}
