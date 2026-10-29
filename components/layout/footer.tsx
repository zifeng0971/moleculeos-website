'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { Logo } from './logo';

/** Quiet, small-type directory: brand line, four link columns, legal line. */
export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations('footer');
  const columns = ['product', 'resources', 'company', 'legal'] as const;
  return (
    <footer className="gfooter">
      <div className="gfooter-inner">
        <div className="gfooter-brand">
          <Logo locale={locale} size="footer" href={SITE_CONFIG.companyUrl} />
        </div>
        <nav className="gfooter-cols" aria-label="Footer">
          {columns.map((column) => (
            <div key={column}>
              <h2>{t(column)}</h2>
              <ul>
                {SITE_CONFIG.footer[column].map(([key, rawHref]) => { const href = rawHref.replace('{lang}', locale); return <li key={key}><Link href={localizeHref(href, locale)} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{t(key)}</Link></li>; })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="gfooter-legal"><p>© {new Date().getFullYear()} MoleculeMind. All rights reserved.</p></div>
      </div>
    </footer>
  );
}
