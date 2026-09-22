'use client';

import Link from 'next/link';
import { ArrowRight, Building2, Code2, Handshake, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { localizeHref } from '@/lib/site-config';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

const icons = [Monitor, Code2, Building2, Handshake];
type Item = { title: string; description: string };

export function AccessSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.access');
  const items = t.raw('items') as Item[];
  return <section className="section-space border-y border-border " data-nav-section="platform"><div className="site-container"><Reveal><SectionHeading eyebrow={t('eyebrow')} title={t('title')} /></Reveal><div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{items.map((item,i) => { const Icon=icons[i]; return <Reveal key={item.title} delay={staggerDelay(i, items.length)} className="h-full"><InteractiveCard tilt={false} glowRadius={320} className="flex min-h-72 h-full flex-col p-6 md:p-10"><Icon className="size-6 text-accent"/><h3 className="mt-8 text-lg font-semibold">{item.title}</h3><p className="mt-4 text-sm leading-[1.85] text-muted-foreground">{item.description}</p><Link href={localizeHref(i === 0 ? '/help' : '/contact', locale)} className="mt-auto inline-flex min-h-11 items-end gap-2 pt-6 text-sm font-semibold text-brand hover:text-white">{t('learn')}<ArrowRight className="mb-0.5 size-4"/></Link></InteractiveCard></Reveal>})}</div></div></section>;
}
