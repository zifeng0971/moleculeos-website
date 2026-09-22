'use client';

import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHero } from './page-hero';
import type { ValidationCase } from '@/components/sections/validation-section';

export function CaseDetailPage({ slug }: { locale: Locale; slug: string }) {
  const t = useTranslations('validationPage');
  const v = useTranslations('home.validation');
  const cases = v.raw('cases') as ValidationCase[];
  const index = Math.max(0, Number(slug.split('-').at(-1)) - 1);
  const item = cases[index] ?? cases[0];
  // Only show fields supplied in the case source; do not invent a strategy or background.
  return <><PageHero eyebrow={t('eyebrow')} title={item.title} description={item.result}/>
    <section className="section-space"><div className="site-container max-w-4xl"><GlassPanel className="p-6 md:p-10"><h2 className="text-2xl font-semibold">{v('challenge')}</h2><p className="mt-6 max-w-[680px] text-muted-foreground">{item.challenge}</p><dl className="mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">{v('molecule')}</dt><dd className="mt-2">{item.molecule}</dd></div><div><dt className="text-xs text-muted-foreground">{v('duration')}</dt><dd className="mt-2">{item.duration}</dd></div></dl></GlassPanel></div></section>
  </>;
}
