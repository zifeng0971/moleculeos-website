'use client';

import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { localizeHref, type Locale } from '@/lib/site-config';
import { Phrases } from '@/components/ui/phrase-title';

export type ValidationCase = { title: string; background: string; challenge: string; strategy: string; result: string; molecule: string; duration: string };

export function ValidationSection({ locale, page = false }: { locale: Locale; page?: boolean }) {
  const t = useTranslations('home.validation');
  const cases = t.raw('cases') as ValidationCase[];
  const Heading = page ? 'h1' : 'h2';
  return <section className="home-section-pad py-24" data-nav-section="validation">
    <div className="site-container">
      <Reveal className="text-center"><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><Heading className="section-title mx-auto max-w-[20ch]"><Phrases text={t('gridTitle')} /></Heading>
        {/* Never separate the verified result from its low-throughput conditions. On the homepage the evidence band carries both. */}
        {page && <p className="mx-auto mt-6 max-w-[40ch] text-[clamp(18px,1.6vw,22px)] font-medium leading-[1.6] text-[rgba(255,255,255,0.72)]">{t('successCondition')}</p>}
      </Reveal>
      <div className="case-grid mt-12" data-case-grid>
        {cases.map((item, i) => <Reveal key={item.title} delay={staggerDelay(i, cases.length)} className="h-full">
          <InteractiveCard as="a" href={localizeHref(`/validation/case-${i + 1}`, locale)} tiltMax={3} className="case-card h-full">
            <span className="case-card-badge" aria-label={t('details')}><ArrowUpRight size={14} aria-hidden="true"/></span>
            <p className="case-card-kicker">{item.title}</p>
            <h3>{item.result}</h3>
            <p className="case-card-meta"><span>{item.molecule}</span><span aria-hidden="true">·</span><span>{item.duration}</span></p>
          </InteractiveCard>
        </Reveal>)}
      </div>
    </div>
  </section>;
}
