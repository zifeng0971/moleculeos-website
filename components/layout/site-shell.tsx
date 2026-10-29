'use client';
import { usePathname } from 'next/navigation';
import type { Locale } from '@/lib/site-config';
import { SiteProviders } from '@/components/providers/site-providers';
import { Header } from './header';
import { Footer } from './footer';
import { DocsShell } from '@/components/docs/docs-shell';
import { OffscreenHold } from '@/components/motion/offscreen-hold';

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname=usePathname();
  const docs=/^(\/en)?\/help\/manual(?:\/|$)/.test(pathname);
  return (
    <SiteProviders locale={locale}>
      {docs ? <DocsShell locale={locale}>{children}</DocsShell> : <>
      <Header locale={locale} />
      <main>{children}</main>
      <Footer locale={locale} />
      <OffscreenHold />
      </>}
    </SiteProviders>
  );
}
