'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

// Static HTML fallback only. HTTP 301 is performed by the supplied hosting rules.
export function LegacyRedirect({ href }: { href: string }) {
  const t = useTranslations('common');
  useEffect(() => { window.location.replace(href); }, [href]);
  return <div className="site-container py-24"><p>{t('redirect')}</p><a href={href} className="mt-6 inline-flex min-h-11 items-center text-brand">{t('continue')} →</a></div>;
}
