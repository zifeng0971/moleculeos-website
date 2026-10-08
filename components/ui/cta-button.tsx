'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

export function CTAButton({ kind = 'primary', locale, inverse = false, className, tabIndex }: { kind?: 'primary' | 'secondary'; locale: Locale; inverse?: boolean; className?: string; tabIndex?: number }) {
  const t = useTranslations('common');
  const isPrimary = kind === 'primary';
  const href = isPrimary ? SITE_CONFIG.platformUrl : localizeHref('/contact', locale);
  return (
    <Link
      href={href}
      target={isPrimary ? '_blank' : undefined}
      rel={isPrimary ? 'noreferrer' : undefined}
      tabIndex={tabIndex}
      className={cn(buttonVariants({ variant: inverse && isPrimary ? 'inverse' : isPrimary ? 'primary' : 'secondary', size: 'lg' }), 'group gap-2', className)}
    >
      {isPrimary ? t('start') : t('contact')}
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}
