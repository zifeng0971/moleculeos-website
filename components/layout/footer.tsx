'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { Logo } from './logo';

export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations('footer');
  const columns = ['product', 'resources', 'company', 'legal'] as const;
  return (
    <footer className="section-divider pb-24 pt-16 lg:pb-8">
      <div className="site-container">
        <div className="grid gap-12 border-b border-border pb-14 md:grid-cols-12">
          <div className="md:col-span-4"><Logo locale={locale} size="footer" href={SITE_CONFIG.companyUrl}/><p className="mt-3 max-w-xs text-xs text-muted-foreground">{t('developedBefore')}<a href={SITE_CONFIG.companyUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-white">{t('developer')}</a>{t('developedAfter')}</p><p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">{t('tagline')}</p></div>
          <div className="grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            {columns.map((column) => (
              <div key={column}>
                <h2 className="text-sm font-semibold">{t(column)}</h2>
                <ul className="mt-4 space-y-3">
                  {SITE_CONFIG.footer[column].map(([key, href]) => <li key={key}><Link className="text-sm text-muted-foreground hover:text-brand" href={localizeHref(href, locale)} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{t(key)}</Link></li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between"><p>© {new Date().getFullYear()} MoleculeMind. All rights reserved.</p><p>{t.raw('filing') as string}</p></div>
      </div>
    </footer>
  );
}
