'use client';

import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { localizeHref, type Locale } from '@/lib/site-config';

export type ValidationCase = { title: string; background: string; challenge: string; strategy: string; result: string; molecule: string; duration: string };

export function ValidationSection({ locale, page = false }: { locale: Locale; page?: boolean }) {
  const t = useTranslations('home.validation');
  const cases = t.raw('cases') as ValidationCase[];
  const Heading = page ? 'h1' : 'h2';
  return <section className="py-24" data-nav-section="validation">
    <div className="site-container">
      <Reveal className="text-center"><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><Heading className="section-title mx-auto max-w-[20ch]">{t('gridTitle')}</Heading>
        {/* Never separate the verified result from its low-throughput conditions. */}
        <p className="mx-auto mt-6 max-w-[40ch] text-[22px] font-semibold text-foreground">{t('successCondition')}</p>
      </Reveal>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-case-grid>
        {cases.map((item, i) => <Reveal key={item.title} delay={staggerDelay(i, cases.length)} className="h-full">
          <InteractiveCard as="a" href={localizeHref(`/validation/case-${i + 1}`, locale)} className="flex h-full flex-col p-6 md:p-8">
            <p className="text-sm font-semibold text-brand">{item.title}</p>
            <h3 className="mt-4 text-xl font-semibold leading-[1.3]">{item.result}</h3>
            <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{t('challenge')}：{item.challenge}</p>
            <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground"><span>{t('molecule')}：{item.molecule}</span><span className="mx-2">·</span><span>{t('duration')}：{item.duration}</span></div>
          </InteractiveCard>
        </Reveal>)}
      </div>
    </div>
  </section>;
}
