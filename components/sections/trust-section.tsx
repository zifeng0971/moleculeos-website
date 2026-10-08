'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { CountUpNumber } from '@/components/ui/count-up-number';
import { getMockContent } from '@/lib/mock-content';
import type { Locale } from '@/lib/site-config';

const marks = Array.from({ length: 8 }, (_, index) => `LOGO ${String(index + 1).padStart(2, "0")}`);

export function TrustSection({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations('home.trust');
  const condition = t('successCondition');
  const items = getMockContent(useLocale() as Locale).trust.items;
  return (
    <div className="relative pb-20 pt-10" data-nav-section={embedded ? undefined : 'validation'}>
      <div className="site-container">
        <Reveal><p className="text-center text-sm text-muted-foreground">{t('label')}</p></Reveal>
        {/* Replace text marks with eight approved partner logos. These labels do not imply customer relationships. */}
        <Reveal className="mx-auto mt-6 max-w-[1100px]">
          <div className="logo-marquee">
            <div className="logo-marquee-track">
              {[...marks, ...marks].map((mark, index) => <div key={index} className="logo-marquee-item" aria-hidden={index >= marks.length || undefined}>{mark}</div>)}
            </div>
          </div>
        </Reveal>
        <div className="mx-auto mt-10 grid max-w-[960px] gap-5 md:grid-cols-3">
          {items.map((item, index) => <Reveal key={item.label} delay={staggerDelay(index, items.length)} className="h-full"><InteractiveCard tilt={false} glowRadius={320} className="flex h-full flex-col items-center justify-center px-6 py-10 text-center"><p className="stat-value"><CountUpNumber to={Number.parseInt(item.value)} suffix={item.value.replace(/^\d+/, '')}/></p><p className="mt-4 text-[15px] text-muted-foreground">{item.label}</p></InteractiveCard></Reveal>)}
        </div>
        {/* Keep the complete verified condition adjacent to the success-rate cards. */}
        <Reveal><p className="mx-auto mt-5 max-w-[680px] text-center text-sm leading-[1.85] text-muted-foreground">{condition}</p></Reveal>
      </div>
    </div>
  );
}
