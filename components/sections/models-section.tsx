'use client';

import Link from 'next/link';
import { ArrowRight, Atom, Boxes, Dna } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { localizeHref } from '@/lib/site-config';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { GlassPanel } from '@/components/ui/glass-panel';
import { SectionHeading } from '@/components/ui/section-heading';

export type ModelItem = { name: string; description: string; limitation: string };

export function ModelsSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.models');
  const items = t.raw('items') as ModelItem[];
  return (
    <section className="section-space relative overflow-hidden " data-nav-section="models">
      <div className="ambient-glow -right-40 top-20 size-[34rem]" />
      <div className="site-container relative">
        <Reveal><SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')} /></Reveal>
        <Reveal className="mt-12" delay={0.09}>
          <GlassPanel className="relative overflow-hidden p-6 md:p-10">
            <div className="absolute -right-20 -top-32 size-80 rounded-full bg-accent/[0.10] blur-[90px]" />
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('foundation')}</p>
            <div className="mt-5 flex items-center gap-4"><Dna className="size-9 text-accent" /><h3 className="text-3xl font-semibold md:text-4xl">NewOrigin <span className="text-muted-foreground">（达尔文）</span></h3></div>
            <p className="mt-6 max-w-[680px] text-base leading-[1.85] text-muted-foreground">{t('foundationDescription')}</p>
          </GlassPanel>
        </Reveal>
        <p className="mb-5 mt-12 text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('taskModels')}</p>
        <div className="grid gap-8 md:grid-cols-2">
          {items.map((model, i) => (
            <Reveal key={model.name} delay={staggerDelay(i, items.length)} className="h-full">
              <GlassPanel interactive className="h-full p-6 md:p-10">
                <div className="flex items-center gap-3"><Boxes className="size-5 text-accent" /><h3 className="text-2xl font-semibold">{model.name}</h3></div>
                <p className="mt-6 max-w-[680px] text-base leading-[1.85] text-muted-foreground">{model.description}</p>
                <div className="mt-8 border-t border-border pt-6"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">{t('limitation')}</p><p className="mt-3 text-sm text-muted-foreground">{model.limitation}</p></div>
              </GlassPanel>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.36} className="mt-12">
          <div className="flex flex-col gap-4 border-y border-border py-8 md:flex-row md:items-center md:gap-8"><Atom className="size-7 shrink-0 text-accent"/><div><p className="font-semibold">{t('scienceLayer')}</p><p className="mt-2 max-w-[680px] text-muted-foreground">{t('scienceDescription')}</p></div></div>
        </Reveal>
        <Link href={localizeHref('/models', locale)} className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-white">{t('viewAll')}<ArrowRight className="size-4" /></Link>
      </div>
    </section>
  );
}
