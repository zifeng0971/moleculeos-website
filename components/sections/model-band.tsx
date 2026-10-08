'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { localizeHref, type Locale } from '@/lib/site-config';

const ORBS = ['rgba(124,92,255,.45)', 'rgba(224,123,200,.38)', 'rgba(90,200,250,.35)'];

export function ModelBand({ locale }: { locale: Locale }) {
  const t = useTranslations('home.models');
  const models = t.raw('band') as { name: string; description: string; anchor: string }[];
  return <div className="home-section-pad" data-model-band>
    <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><h2 className="section-title">{t('title')}</h2></div>
      <Link href={localizeHref('/platform#models', locale)} className="group inline-flex min-h-11 shrink-0 items-center gap-2 text-[15px] font-semibold text-[#B6A6FF] transition-colors hover:text-white">
        {t('viewSystem')}<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </Reveal>
    <div className="mt-12 grid gap-5 md:grid-cols-3">
      {models.map((model, i) => <Reveal key={model.anchor} delay={staggerDelay(i, 3)} className="h-full">
        <InteractiveCard as="a" href={localizeHref(`/platform#${model.anchor}`, locale)} className="h-full overflow-hidden">
          <div className="model-card">
            <span className="model-card-orb" style={{ '--orb': ORBS[i % ORBS.length] } as React.CSSProperties} aria-hidden="true" />
            <span className="model-card-index">{String(i + 1).padStart(2, '0')}</span>
            <span className="model-card-arrow" aria-hidden="true"><ArrowUpRight size={16} /></span>
            <h3>{model.name}</h3>
            <p>{model.description}</p>
          </div>
        </InteractiveCard>
      </Reveal>)}
    </div>
  </div>;
}
