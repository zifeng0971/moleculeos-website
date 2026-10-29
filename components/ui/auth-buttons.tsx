'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG } from '@/lib/site-config';
import { cn } from '@/lib/utils';

/**
 * Sign in / Sign up on MOS (登录 / 注册 on the Chinese site), as one capsule: sign-in is quiet text,
 * sign-up is the lit pill inside it. `stretch` lets the capsule fill its row (mobile bar).
 */
export function AuthButtons({ className, stretch = false, tabIndex }: { className?: string; stretch?: boolean; tabIndex?: number }) {
  const t = useTranslations('common');
  return <div className={cn('auth-capsule', stretch && 'auth-capsule-stretch', className)}>
    <Link href={SITE_CONFIG.platformUrl} target="_blank" rel="noreferrer" tabIndex={tabIndex} className="auth-signin">{t('signIn')}</Link>
    <Link href={SITE_CONFIG.platformUrl} target="_blank" rel="noreferrer" tabIndex={tabIndex} className="auth-signup group">
      {t('signUp')}<ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  </div>;
}
