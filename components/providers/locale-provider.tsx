'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import type { Locale } from '@/lib/site-config';
import zh from '@/messages/zh.json';
import en from '@/messages/en.json';
import { presentationMessages } from '@/lib/mock-content';
import { CollabProvider } from '@/components/collab/collab-provider';

// next-intl supports raw arrays at runtime; cast here because its recursive message type
// intentionally models string-keyed objects more narrowly than our structured content lists.
const messages = { zh: presentationMessages(zh, 'zh'), en: presentationMessages(en, 'en') } as unknown as Record<Locale, AbstractIntlMessages>;

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <CollabProvider locale={locale} base={messages[locale]}>
      {merged => (
        <NextIntlClientProvider locale={locale} messages={merged} timeZone="America/Los_Angeles">
          {children}
        </NextIntlClientProvider>
      )}
    </CollabProvider>
  );
}
