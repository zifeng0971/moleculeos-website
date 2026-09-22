'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { localizeHref } from '@/lib/site-config';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';

type Item = { title: string; description: string; link: string };
export function CommunitySection({locale}:{locale:Locale}) { const t=useTranslations('home.community'); const items=t.raw('items') as Item[]; return <section className="section-space " data-nav-section="community"><div className="site-container"><Reveal><SectionHeading eyebrow={t('eyebrow')} title={t('title')}/></Reveal><div className="mt-12 grid gap-8 md:grid-cols-3">{items.map((item,i)=><Reveal key={item.title} delay={staggerDelay(i, items.length)} className="h-full"><InteractiveCard as="a" href={localizeHref('/community',locale)} className="group h-full p-6 md:p-10"><span className="font-mono text-sm text-accent">0{i+1}</span><h3 className="mt-5 text-xl font-semibold">{item.title}</h3><p className="mt-4 min-h-20 text-sm leading-[1.85] text-muted-foreground">{item.description}</p><span className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand group-hover:text-white">{item.link}<ArrowRight className="size-4"/></span></InteractiveCard></Reveal>)}</div></div></section> }
