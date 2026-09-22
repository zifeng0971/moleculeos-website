'use client';

import type { Locale } from '@/lib/site-config';
import { ValidationSection } from '@/components/sections/validation-section';

export function ValidationPage({locale}:{locale:Locale}) {
  return <ValidationSection locale={locale} page/>;
}
