'use client';

import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { cn } from '@/lib/utils';
import { CTAButton } from '@/components/ui/cta-button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Logo } from './logo';
import { MobileCTABar } from './mobile-cta-bar';

function routeKey(pathname: string) {
  const path = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  if (path.startsWith('/platform')) return 'platform';
  return SITE_CONFIG.nav.find((item) => item.href !== '/platform' && path.startsWith(item.href))?.key;
}

export function Header({ locale, languageHref }: { locale: Locale; languageHref?: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [menuHover, setMenuHover] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const otherLocaleHref = languageHref ?? localizeHref(pathname.replace(/^\/en(?=\/|$)/, '') || '/', locale === 'en' ? 'zh' : 'en');
  const activeKey = routeKey(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

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
    setHoverKey('platform');
  };

  const schedulePlatformClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setPlatformOpen(false);
      setHoverKey(null);
    }, 150);
  };

  const navLink = (item: (typeof SITE_CONFIG.nav)[number]) => {
    const active = activeKey === item.key;
    return (
      <Link
        key={item.key}
        href={localizeHref(item.href, locale)}
        aria-current={active ? 'page' : undefined}
        aria-haspopup={item.key === 'platform' ? 'menu' : undefined}
        aria-expanded={item.key === 'platform' ? platformOpen : undefined}
        className={cn('relative flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-white', (active || hoverKey === item.key) && 'text-white')}
        onMouseEnter={item.key === 'platform' ? undefined : () => setHoverKey(item.key)}
        onMouseLeave={item.key === 'platform' ? undefined : () => setHoverKey(null)}
      >
        <span className="relative">{t(item.key)}
        {active && <motion.span layoutId="desktop-nav-indicator" className="absolute inset-x-0 -bottom-3 h-0.5 rounded-full bg-accent" transition={{ type: 'spring', stiffness: 440, damping: 38 }} />}</span>
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-transparent px-0 transition-all duration-300 lg:px-3 lg:pt-3">
        <GlassPanel data-scrolled={scrolled} className={cn('site-header-panel mx-auto max-w-[1240px] rounded-none border-x-0 transition-all duration-300 lg:rounded-[1.25rem] lg:border-x', scrolled ? 'bg-[rgba(10,9,16,0.58)] backdrop-blur-[40px]' : 'border-transparent bg-transparent shadow-none backdrop-blur-none')}>
          <div className="site-container flex h-16 items-center justify-between gap-5 xl:h-[4.5rem]">
            <Logo locale={locale} />
            <nav className="hidden h-full items-center gap-1 lg:flex" aria-label="Primary navigation">
              <div className="relative flex h-full items-center" onMouseEnter={openPlatformMenu} onMouseLeave={schedulePlatformClose} onFocusCapture={openPlatformMenu} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) schedulePlatformClose(); }}>
                {navLink(SITE_CONFIG.nav[0])}
                <ChevronDown className={cn('-ml-2 size-3.5 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]', platformOpen && 'rotate-180 text-white')} aria-hidden="true" />
                <AnimatePresence>
                  {platformOpen && (
                    <motion.div
                      role="menu"
                      className="dropdown-panel absolute left-0 top-full z-[70] mt-3 w-max min-w-80 max-w-[32.5rem] p-4"
                      style={{ transformOrigin: '24px top' }}
                      initial={{ opacity: 0, y: -10, scale: 0.96, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 420, damping: 34, mass: 0.8, opacity: { duration: 0.2 }, filter: { duration: 0.25 } } }}
                      exit={{ opacity: 0, y: -6, scale: 0.98, filter: 'blur(4px)', transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
                      onMouseLeave={() => setMenuHover(null)}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {[{ label: 'byTask', items: SITE_CONFIG.platformMenu.tasks }, { label: 'modelSystem', items: SITE_CONFIG.platformMenu.models }].map((group, column) => <div key={group.label}>
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.04 + column * 0.04 } }} className="mb-2 px-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{t(group.label)}</motion.p>
                          <ul className="space-y-0.5">{group.items.map(([key, slug], row) => <motion.li key={slug} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + row * 0.035 + column * 0.03, duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}>
                            <Link role="menuitem" onMouseEnter={() => setMenuHover(slug)} onFocus={() => setMenuHover(slug)} onClick={() => {setPlatformOpen(false); setHoverKey(null);}} className="relative isolate flex min-h-11 items-center rounded-[0.75rem] px-3.5 py-2.5 text-sm font-medium text-[rgba(255,255,255,0.78)] transition-colors duration-200 hover:text-white focus-visible:text-white" href={localizeHref('/platform#' + slug, locale)}>
                              {menuHover === slug && <motion.span layoutId="platform-menu-hover" className="absolute inset-0 -z-10 rounded-[0.75rem] bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                              {t(key)}
                            </Link>
                          </motion.li>)}</ul>
                        </div>)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {SITE_CONFIG.nav.slice(1).map(navLink)}
            </nav>
            <div className="hidden items-center gap-1 lg:flex">
              <Link href={otherLocaleHref} className="flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground transition hover:text-white">{t('language')}</Link>
              <CTAButton locale={locale} className="ml-1 min-h-10 px-4 text-sm" />
            </div>
            <button className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/[0.06] hover:text-white lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? t('close') : t('menu')}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
          <AnimatePresence initial={false}>
          {open && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="site-container max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-border py-4 pb-24 lg:hidden" aria-label="Mobile navigation">
              <ul className="space-y-1">
                {SITE_CONFIG.nav.map((item, index) => {
                  const active = activeKey === item.key;
                  return <motion.li key={item.key} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + index * 0.04, duration: 0.35 }}><Link onClick={() => setOpen(false)} className={cn('flex min-h-12 items-center rounded-md border-l-2 border-transparent px-3 font-medium text-muted-foreground', active && 'border-accent bg-white/[0.05] text-white')} href={localizeHref(item.href, locale)}>{t(item.key)}</Link></motion.li>;
                })}
              </ul>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <Link href={otherLocaleHref} className="flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium">{t('language')}</Link>
              </div>
            </motion.nav>
          )}
          </AnimatePresence>
        </GlassPanel>
      </header>
      <MobileCTABar locale={locale} />
    </>
  );
}
