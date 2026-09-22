'use client';

import Link from 'next/link';
import { ArrowRight, Check, FileInput, PackageCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/reveal';
import { CTAButton } from '@/components/ui/cta-button';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { GlassPanel } from '@/components/ui/glass-panel';
import { localizeHref, type Locale, type PlatformSlug } from '@/lib/site-config';
import { PageHero } from './page-hero';

type TaskCopy = { title: string; description: string };

export function PlatformTaskPage({ locale, slug }: { locale: Locale; slug: PlatformSlug }) {
  const t = useTranslations('platformPage');
  const nav = useTranslations('nav');
  const task = t.raw(`tasks.${slug}`) as TaskCopy;
  const todo = t.raw('todo') as string;
  const moleculeKeys = ['antibody', 'peptide', 'enzyme', 'miniProtein'] as const;

  return (
    <>
      <PageHero eyebrow={t('eyebrow')} title={task.title} description={task.description} />

      <section className="section-space border-b border-border">
        <div className="site-container">
          <Reveal>
            <p className="eyebrow">{t('applicable')}</p>
            <h2 className="section-title">{t('applicableNote')}</h2>
            <p className="section-copy font-mono text-accent">{todo}</p>
          </Reveal>
          <Reveal className="mt-12" delay={0.09}>
            <div className="flex flex-wrap gap-3" aria-label={t('applicable')}>
              {moleculeKeys.map((key) => <span key={key} className="rounded-lg border border-border bg-white/[0.035] px-4 py-2 text-sm text-muted-foreground">{nav(key)}</span>)}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section-space bg-surface">
        <div className="site-container">
          <Reveal><p className="eyebrow">02</p><h2 className="section-title">{t('scenarios')}</h2></Reveal>
          <div className="mt-12 divide-y divide-border border-y border-border">
            {[1, 2, 3].map((index) => (
              <Reveal key={index} delay={(index - 1) * 0.09}>
                <div className="grid gap-5 py-8 md:grid-cols-[5rem_1fr] md:items-center">
                  <span className="font-mono text-sm text-accent">0{index}</span>
                  <p className="max-w-[680px] font-mono text-muted-foreground">{todo}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space border-y border-border">
        <div className="site-container">
          <Reveal><p className="eyebrow">03</p><h2 className="section-title">{t('inputsOutputs')}</h2></Reveal>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {[
              { title: t('inputs'), Icon: FileInput },
              { title: t('outputs'), Icon: PackageCheck },
            ].map(({ title, Icon }, columnIndex) => (
              <Reveal key={title} delay={0.09 + columnIndex * 0.09}>
                <InteractiveCard tilt={false} glowRadius={320} className="p-6 md:p-10">
                  <div className="flex items-center gap-4"><Icon className="size-6 text-accent"/><h3 className="text-2xl font-semibold">{title}</h3></div>
                  <ul className="mt-8 space-y-5">
                    {[1, 2, 3].map((index) => <li key={index} className="flex gap-4"><Check className="mt-1 size-4 shrink-0 text-accent"/><span className="font-mono text-muted-foreground">{todo}</span></li>)}
                  </ul>
                </InteractiveCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-space bg-surface">
        <div className="site-container grid gap-8 lg:grid-cols-2">
          <Reveal>
            <GlassPanel className="h-full p-6 md:p-10">
              <p className="eyebrow">04</p><h2 className="text-3xl font-semibold">{t('models')}</h2>
              <p className="mt-6 text-sm font-semibold text-muted-foreground">{t('modelsDescription')}</p>
              <p className="mt-3 font-mono text-accent">{todo}</p>
              <Link href={localizeHref('/models#task-models', locale)} className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-white">{t('viewModels')}<ArrowRight className="size-4"/></Link>
            </GlassPanel>
          </Reveal>
          <Reveal delay={0.09}>
            <InteractiveCard as="a" href={localizeHref("/validation", locale)} className="h-full p-6 md:p-10">
              <p className="eyebrow">05</p><h2 className="text-3xl font-semibold">{t('validation')}</h2>
              <p className="mt-6 max-w-[680px] font-mono text-accent">{todo}</p>
              <span className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:text-white">{t('viewValidation')}<ArrowRight className="size-4"/></span>
            </InteractiveCard>
          </Reveal>
        </div>
      </section>

      <section className="section-space border-t border-border">
        <div className="site-container flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <Reveal><h2 className="section-title max-w-2xl">{t('ctaTitle')}</h2></Reveal>
          <Reveal delay={0.09} className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"><CTAButton locale={locale}/><CTAButton locale={locale} kind="secondary"/></Reveal>
        </div>
      </section>
    </>
  );
}
