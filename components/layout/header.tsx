'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { cn } from '@/lib/utils';
import { AuthButtons } from '@/components/ui/auth-buttons';
import { Logo } from './logo';
import { MobileCTABar } from './mobile-cta-bar';

function routeKey(pathname: string) {
  const path = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  if (path.startsWith('/platform')) return 'platform';
  return SITE_CONFIG.nav.find((item) => item.href !== '/platform' && path.startsWith(item.href))?.key;
}

// The validation entry is hidden from the navigation for now; the route itself stays live.
const HIDDEN_NAV = ['validation'];
// The hover menu under the platform entry is switched off: it is a plain link that sits after Pricing.
const SHOW_PLATFORM = false;
const shown = (item: { key: string }) => !HIDDEN_NAV.includes(item.key);
const EASE = [0.28, 0.11, 0.32, 1] as const;

/** Global navigation: one slim translucent bar. Logo left, sections centred, language and account right; the active page is simply brighter. */
export function Header({ locale, languageHref }: { locale: Locale; languageHref?: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherLocaleHref = languageHref ?? localizeHref(pathname.replace(/^\/en(?=\/|$)/, '') || '/', locale === 'en' ? 'zh' : 'en');
  const activeKey = routeKey(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const root = document.documentElement, previous = root.style.overflow;
    root.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { root.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const openPlatformMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPlatformOpen(true);
  };

  const schedulePlatformClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPlatformOpen(false), 150);
  };

  const navLink = (item: (typeof SITE_CONFIG.nav)[number]) => (
    <Link
      key={item.key}
      href={localizeHref(item.href, locale)}
      aria-current={activeKey === item.key ? 'page' : undefined}
      aria-haspopup={SHOW_PLATFORM && item.key === 'platform' ? 'menu' : undefined}
      aria-expanded={SHOW_PLATFORM && item.key === 'platform' ? platformOpen : undefined}
      className="gnav-link"
    >
      {t(item.key)}
    </Link>
  );

  return (
    <>
      <header className="gnav" data-scrolled={scrolled} data-open={open}>
        <div className="gnav-bg" aria-hidden="true" />
        <div className="gnav-inner">
          <Logo locale={locale} />
          <nav className="gnav-links" aria-label="Primary navigation">
            {SHOW_PLATFORM && <div className="relative flex h-full items-center" onMouseEnter={openPlatformMenu} onMouseLeave={schedulePlatformClose} onFocusCapture={openPlatformMenu} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) schedulePlatformClose(); }}>
              {navLink(SITE_CONFIG.nav.find(item => item.key === 'platform')!)}
              <ChevronDown className={cn('-ml-3 size-3 text-[var(--text-tertiary)] transition-transform duration-300', platformOpen && 'rotate-180')} aria-hidden="true" />
              <AnimatePresence>
                {platformOpen && (
                  <motion.div
                    role="menu"
                    className="dropdown-panel absolute left-0 top-full z-[70] w-max min-w-80 max-w-[32.5rem] p-5"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: EASE } }}
                    exit={{ opacity: 0, transition: { duration: 0.16 } }}
                  >
                    <div className="grid grid-cols-2 gap-6">
                      {[{ label: 'byTask', items: SITE_CONFIG.platformMenu.tasks }, { label: 'modelSystem', items: SITE_CONFIG.platformMenu.models }].map((group) => <div key={group.label}>
                        <p className="mb-2 text-xs text-[var(--text-tertiary)]">{t(group.label)}</p>
                        <ul className="space-y-1">{group.items.map(([key, slug]) => <li key={slug}>
                          <Link role="menuitem" onClick={() => setPlatformOpen(false)} className="block py-1 text-sm font-medium text-[var(--text-primary)] opacity-90 transition-opacity hover:opacity-100" href={localizeHref('/platform#' + slug, locale)}>{t(key)}</Link>
                        </li>)}</ul>
                      </div>)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>}
            {SITE_CONFIG.nav.filter(shown).map(navLink)}
          </nav>
          <div className="gnav-actions">
            <Link href={otherLocaleHref} className="gnav-lang">{t('language')}</Link>
            <AuthButtons />
          </div>
          <button className="gnav-toggle lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? t('close') : t('menu')}>
            <i aria-hidden="true" /><i aria-hidden="true" />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.nav className="gnav-sheet lg:hidden" aria-label="Mobile navigation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.3, ease: EASE }}>
              <ul>
                {SITE_CONFIG.nav.filter(shown).map((item, index) => (
                  <motion.li key={item.key} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 + index * 0.035, duration: 0.4, ease: EASE }}>
                    <Link onClick={() => setOpen(false)} aria-current={activeKey === item.key ? 'page' : undefined} href={localizeHref(item.href, locale)}>{t(item.key)}</Link>
                  </motion.li>
                ))}
              </ul>
              <motion.div className="gnav-sheet-foot" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }}>
                <Link href={otherLocaleHref} className="gnav-lang">{t('language')}</Link>
                <AuthButtons className="ml-auto" />
              </motion.div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <MobileCTABar />
    </>
  );
}
