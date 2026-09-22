'use client';

import { InteractiveCard } from '@/components/ui/InteractiveCard';
import Link from 'next/link';
import { DatabaseZap, FileKey2, LockKeyhole } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { localizeHref } from '@/lib/site-config';
import { buttonVariants } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, staggerDelay } from '@/components/motion/reveal';

const icons = [DatabaseZap, FileKey2, LockKeyhole];
type Item = { title: string; description: string };

export function SecuritySection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.security');
  const items = t.raw('items') as Item[];
  return <section className="section-space relative overflow-hidden border-y border-border text-white" data-nav-section="docs"><div className="ambient-glow -left-48 top-10 size-[38rem]"/><div className="site-container relative"><Reveal><SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/></Reveal><div className="mt-12 grid gap-8 md:grid-cols-3">{items.map((item,index)=>{const Icon=icons[index]; return <Reveal key={item.title} delay={staggerDelay(index, items.length)}><InteractiveCard tilt={false} glowRadius={320} className="h-full p-6 md:p-10"><Icon className="size-6 text-accent"/><h3 className="mt-6 text-lg font-semibold">{item.title}</h3><p className="mt-4 max-w-[680px] text-sm leading-[1.85] text-muted-foreground">{item.description}</p></InteractiveCard></Reveal>})}</div><Reveal delay={0.36}><Link href={localizeHref('/help', locale)} className={`${buttonVariants({variant:'secondary',size:'lg'})} mt-12`}>{t('whitepaper')}</Link></Reveal></div></section>;
}
