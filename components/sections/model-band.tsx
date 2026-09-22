'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { localizeHref, type Locale } from '@/lib/site-config';

export function ModelBand({ locale }: { locale: Locale }) {
  const t = useTranslations('home.models');
  const models = t.raw('band') as { name: string; description: string; anchor: string }[];
  return <div className="mt-10 border-y border-border py-6" data-model-band>
    <div className="grid grid-cols-3 gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center md:gap-6">
      {models.map((model, i) => <Reveal key={model.anchor} delay={staggerDelay(i, 3)}>
        <Link href={localizeHref(`/platform#${model.anchor}`, locale)} className="block min-h-11 rounded-lg hover:text-brand">
          <h3 className="text-base font-semibold">{model.name}</h3><p className="mt-1 text-sm text-muted-foreground">{model.description}</p>
        </Link>
      </Reveal>)}
      <Link href={localizeHref('/platform#models', locale)} className="col-span-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand md:col-span-1">{t('viewSystem')}<ArrowRight size={16}/></Link>
    </div>
  </div>;
}
