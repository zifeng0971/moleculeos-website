'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { localizeHref, type Locale } from '@/lib/site-config';

export type ValidationCase = { title: string; background: string; challenge: string; strategy: string; result: string; molecule: string; duration: string };

export function ValidationSection({ locale, page = false }: { locale: Locale; page?: boolean }) {
  const t = useTranslations('home.validation');
  const cases = t.raw('cases') as ValidationCase[];
  const Heading = page ? 'h1' : 'h2';
  return <section className="home-section-pad py-24" data-nav-section="validation">
    <div className="site-container">
      <Reveal className="text-center"><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><Heading className="section-title mx-auto max-w-[20ch]">{t('gridTitle')}</Heading>
        {/* Never separate the verified result from its low-throughput conditions. */}
        <p className="mx-auto mt-6 max-w-[40ch] text-[clamp(18px,1.6vw,22px)] font-medium leading-[1.6] text-[rgba(255,255,255,0.72)]">{t('successCondition')}</p>
      </Reveal>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-case-grid>
        {cases.map((item, i) => <Reveal key={item.title} delay={staggerDelay(i, cases.length)} className="h-full">
          <InteractiveCard as="a" href={localizeHref(`/validation/case-${i + 1}`, locale)} className="flex h-full flex-col p-6 md:p-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#B6A6FF]">{item.title}</p>
            <h3 className="mt-5 text-[22px] font-bold leading-[1.3] tracking-[-0.01em]">{item.result}</h3>
            <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{t('challenge')}：{item.challenge}</p>
            <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground"><span>{t('molecule')}：{item.molecule}</span><span className="mx-2">·</span><span>{t('duration')}：{item.duration}</span></div>
            <span className="case-card-more">{t('details')}<ArrowRight size={14} aria-hidden="true"/></span>
          </InteractiveCard>
        </Reveal>)}
      </div>
    </div>
  </section>;
}
