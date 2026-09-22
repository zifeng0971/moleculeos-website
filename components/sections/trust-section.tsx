'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { GlassPanel } from '@/components/ui/glass-panel';
import { CountUpNumber } from '@/components/ui/count-up-number';
import { getMockContent } from '@/lib/mock-content';
import type { Locale } from '@/lib/site-config';

const marks = Array.from({ length: 8 }, (_, index) => `LOGO ${String(index + 1).padStart(2, "0")}`);

export function TrustSection({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations('home.trust');
  const condition = t('successCondition');
  const items = getMockContent(useLocale() as Locale).trust.items;
  return (
    <div className="relative pb-12 pt-4" data-nav-section={embedded ? undefined : 'validation'}>
      <div className="site-container">
        <Reveal><p className="text-center text-sm text-muted-foreground">{t('label')}</p></Reveal>
        {/* Replace text marks with eight approved partner logos. These labels do not imply customer relationships. */}
        <div className="mx-auto mt-5 max-w-[960px]">
          <GlassPanel className="grid grid-cols-2 overflow-hidden p-0 sm:grid-cols-4 lg:grid-cols-8">
            {marks.map((mark, index) => <Reveal key={mark} delay={staggerDelay(index, marks.length)}><div className="flex h-12 items-center justify-center border-b border-r border-border px-4 text-center text-xs font-semibold tracking-wide text-muted-foreground grayscale transition hover:bg-white/[0.04] hover:text-white hover:grayscale-0">{mark}</div></Reveal>)}
          </GlassPanel>
        </div>
        <div className="mx-auto mt-6 grid max-w-[840px] gap-4 md:grid-cols-3">
          {items.map((item, index) => <Reveal key={item.label} delay={staggerDelay(index, items.length)} className="h-full"><InteractiveCard tilt={false} glowRadius={320} className="flex h-full flex-col items-center justify-center px-6 py-7 text-center"><p className="font-mono text-4xl font-semibold leading-tight text-accent"><CountUpNumber to={Number.parseInt(item.value)} suffix={item.value.replace(/^\d+/, '')}/></p><p className="mt-3 text-sm text-muted-foreground">{item.label}</p></InteractiveCard></Reveal>)}
        </div>
        {/* Keep the complete verified condition adjacent to the success-rate cards. */}
        <Reveal><p className="mx-auto mt-5 max-w-[680px] text-center text-sm leading-[1.85] text-muted-foreground">{condition}</p></Reveal>
      </div>
    </div>
  );
}
