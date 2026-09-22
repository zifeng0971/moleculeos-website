'use client';

import type { Locale } from '@/lib/site-config';
import { LocaleProvider } from './locale-provider';

export function SiteProviders({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleProvider locale={locale}>{children}</LocaleProvider>;
}
