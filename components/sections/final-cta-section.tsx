'use client';

import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';

export function FinalCTASection({ locale }: { locale: Locale }) { const t=useTranslations('home.final'); return <section className="relative overflow-hidden py-20 lg:py-24" data-nav-section="platform"><div className="section-atmosphere" aria-hidden="true"><div className="final-brand-glow pointer-events-none absolute -right-56 -top-72 size-[52rem] blur-3xl"/></div><div className="site-container relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end"><div><h2 className="section-title">{t('title')}</h2><p className="mt-6 max-w-[680px] text-muted-foreground">{t('description')}</p></div><div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row"><CTAButton locale={locale}/><CTAButton locale={locale} kind="secondary"/></div></div></section> }
