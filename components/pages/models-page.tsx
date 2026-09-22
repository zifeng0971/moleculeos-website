'use client';

import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { ArrowRight, Atom, Box, Dna } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { localizeHref } from '@/lib/site-config';
import { MODEL_SLUGS } from '@/lib/content';
import type { ModelItem } from '@/components/sections/models-section';
import { PageHero } from './page-hero';

export function ModelsPage({ locale }: { locale: Locale }) {
  const t = useTranslations('modelsPage');
  const m = useTranslations('home.models');
  const items = m.raw('items') as ModelItem[];
  return <><PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/><section className="section-space relative overflow-hidden"><div className="ambient-glow -right-40 top-20 size-[32rem]"/><div className="site-container relative"><div id="neworigin" className="scroll-mt-28"><InteractiveCard as="a" href={localizeHref("/models#scientific-computing",locale)} className="scroll-mt-28 p-6 md:p-10"><p className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">{m('foundation')}</p><div className="mt-5 flex items-center gap-4"><Dna className="size-8 text-accent"/><h2 className="text-3xl font-semibold">NewOrigin <span className="text-muted-foreground">（达尔文）</span></h2></div><p className="mt-6 max-w-[680px] text-muted-foreground">{m('foundationDescription')}</p></InteractiveCard></div><div id="task-models" className="scroll-mt-28"><p className="mb-5 mt-12 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">{m('taskModels')}</p><div className="grid gap-8 md:grid-cols-2">{items.map((model,i)=><div id={MODEL_SLUGS[i]} key={model.name} className="scroll-mt-28"><InteractiveCard as="a" href={localizeHref(`/models/${MODEL_SLUGS[i]}`,locale)} className="scroll-mt-28 flex flex-col p-6 md:p-10"><Box className="size-6 text-accent"/><h2 className="mt-6 text-2xl font-semibold">{model.name}</h2><p className="mt-6 max-w-[680px] text-muted-foreground">{model.description}</p><div className="mt-8 border-t border-border pt-6"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{m('limitation')}</p><p className="mt-3 text-sm text-muted-foreground">{model.limitation}</p></div><span className="mt-7 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-brand hover:text-white">{t('detailTitle')}<ArrowRight className="size-4"/></span></InteractiveCard></div>)}</div></div><div id="scientific-computing" className="mt-12 scroll-mt-28 flex flex-col gap-4 border-y border-border py-8 md:flex-row md:items-center md:gap-8"><Atom className="size-7 text-accent"/><div><p className="font-semibold">{m('scienceLayer')}</p><p className="mt-2 max-w-[680px] text-muted-foreground">{m('scienceDescription')}</p></div></div></div></section></>;
}
