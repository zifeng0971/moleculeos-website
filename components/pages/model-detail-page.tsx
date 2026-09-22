'use client';

import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import type { ModelItem } from '@/components/sections/models-section';
import { CTAButton } from '@/components/ui/cta-button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { MODEL_SLUGS } from '@/lib/content';
import { PageHero } from './page-hero';

export function ModelDetailPage({ locale, slug }: { locale: Locale; slug: string }) {
  const t = useTranslations('modelsPage');
  const m = useTranslations('home.models');
  const items = m.raw('items') as ModelItem[];
  const model = items[Math.max(0, MODEL_SLUGS.indexOf(slug as (typeof MODEL_SLUGS)[number]))];
  return <><PageHero eyebrow={t('eyebrow')} title={model.name} description={model.description}/><section className="section-space"><div className="site-container grid gap-12 lg:grid-cols-12"><div className="lg:col-span-8"><h2 className="section-title">{t('detailTitle')}</h2><div className="mt-12 border-y border-border py-8"><p className="text-sm font-semibold">{t('how')}</p><p className="mt-4 max-w-[680px] text-muted-foreground">{model.description}</p></div><h2 className="mt-16 text-2xl font-semibold">{t('limits')}</h2><p className="mt-6 max-w-[680px] text-muted-foreground">{model.limitation}</p></div><aside className="lg:col-span-4"><GlassPanel className="sticky top-28 p-6 md:p-10"><p className="text-sm font-semibold">{t('how')}</p><p className="mt-4 text-sm text-muted-foreground">{model.description}</p><CTAButton locale={locale} className="mt-8 w-full"/></GlassPanel></aside></div></section></>;
}
