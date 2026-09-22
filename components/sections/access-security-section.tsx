'use client';

import Link from 'next/link';
import { Building2, Code2, DatabaseZap, FileKey2, Handshake, LockKeyhole, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { buttonVariants } from '@/components/ui/button';
import { localizeHref, type Locale } from '@/lib/site-config';

const accessIcons = [Monitor, Code2, Building2, Handshake];
const securityIcons = [DatabaseZap, FileKey2, LockKeyhole];
type Item = { title: string; compactDescription: string };

export function AccessSecuritySection({ locale }: { locale: Locale }) {
  const access = useTranslations('home.access');
  const security = useTranslations('home.security');
  return <section className="border-t border-border py-16 lg:py-20" data-nav-section="docs">
    <div className="site-container">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        {[{ t: access, icons: accessIcons }, { t: security, icons: securityIcons }].map(({t, icons}, column) => <div key={column}>
          <Reveal><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><h2 className="text-2xl font-semibold md:text-3xl">{t('title')}</h2></Reveal>
          <ul className="mt-6 divide-y divide-border">
            {(t.raw('items') as Item[]).map((item, i) => { const Icon = icons[i]; return <li key={item.title}>
              <Reveal delay={staggerDelay(i, icons.length)} className="flex gap-4 py-4"><Icon className="mt-1 size-5 shrink-0 text-accent" strokeWidth={1.5}/><div><h3 className="text-base font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.compactDescription}</p></div></Reveal>
            </li>; })}
          </ul>
        </div>)}
      </div>
      <Reveal className="mt-6"><Link href={localizeHref('/help/manual', locale)} className={buttonVariants({variant:'secondary',size:'lg'})}>{security('whitepaper')}</Link></Reveal>
    </div>
  </section>;
}
