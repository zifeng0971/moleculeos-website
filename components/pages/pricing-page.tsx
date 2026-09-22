'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import Link from 'next/link';
import { localizeHref } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHero } from './page-hero';

type Plan = { name: string; audience: string; price: string; features: string[] };

export function PricingPage({ locale }: { locale: Locale }) {
  const t = useTranslations('pricingPage');
  const plans = t.raw('plans') as Plan[];
  const rows = t.raw('rows') as string[][];
  return <><PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/><section className="section-space relative overflow-hidden"><div className="ambient-glow -left-48 top-20 size-[36rem]"/><div className="site-container relative"><div className="grid gap-8 lg:grid-cols-3">{plans.map((plan,i)=><InteractiveCard key={plan.name} tilt={false} glowRadius={320} className={i===1 ? 'flex flex-col border-accent/60 bg-accent/[0.08] p-6 md:p-10' : 'flex flex-col p-6 md:p-10'}><p className="text-sm font-semibold text-accent">{plan.name}</p><h2 className="mt-6 break-words font-mono text-2xl font-semibold">{plan.price}</h2><p className="mt-4 min-h-14 text-sm leading-[1.85] text-muted-foreground">{plan.audience}</p><ul className="mt-8 space-y-4 border-t border-border pt-7">{plan.features.map(f=><li key={f} className="flex gap-3 text-sm"><Check className="mt-1 size-4 shrink-0 text-accent"/>{f}</li>)}</ul><CTAButton locale={locale} kind="secondary" className="mt-8 w-full"/></InteractiveCard>)}</div><div className="mt-40"><h2 className="section-title">{t('credits')}</h2><p className="section-copy">{t('creditDescription')}</p><GlassPanel className="mt-12 overflow-x-auto p-0"><table className="w-full min-w-[42rem] text-left text-sm"><thead className="bg-white/[0.045]"><tr>{['task','consumption','duration'].map(k=><th key={k} className="px-6 py-5 font-semibold">{t(k)}</th>)}</tr></thead><tbody className="divide-y divide-border">{rows.map((row,rowIndex)=><tr key={row[0]}>{row.map((cell,cellIndex)=><td key={`${rowIndex}-${cellIndex}`} className="px-6 py-5 text-muted-foreground">{cell}</td>)}</tr>)}</tbody></table></GlassPanel></div><div className="mt-12 border-t border-border pt-8"><Link href={localizeHref('/help/faq',locale)} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand">{t('moreQuestions')} →</Link></div></div></section></>;
}
