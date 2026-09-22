'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import { localizeHref } from '@/lib/site-config';
import { buttonVariants } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHero } from './page-hero';

export function PlaceholderPage({locale,type}:{locale:Locale;type:'docs'|'community'}) { const t=useTranslations('placeholderPage'); return <><PageHero eyebrow={t(`${type}.eyebrow`)} title={t(`${type}.title`)} description={t(`${type}.description`)}/><section className="section-space"><div className="site-container"><GlassPanel className="flex min-h-72 flex-col items-center justify-center border-dashed p-6 text-center md:p-10"><p className="text-lg font-semibold">{t('coming')}</p><Link href={localizeHref('/',locale)} className={`${buttonVariants({variant:'secondary'})} mt-6`}>{t('browse')}</Link></GlassPanel></div></section></> }
