'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import zh from '@/messages/zh.json';
import en from '@/messages/en.json';
import { presentationMessages } from '@/lib/mock-content';

// next-intl supports raw arrays at runtime; cast here because its recursive message type
// intentionally models string-keyed objects more narrowly than our structured content lists.
const messages = { zh: presentationMessages(zh, 'zh'), en: presentationMessages(en, 'en') } as unknown as Record<Locale, AbstractIntlMessages>;

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="America/Los_Angeles">
      {children}
    </NextIntlClientProvider>
  );
}
