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
                <ChevronDown className={cn('-ml-2 size-3.5 text-muted-foreground transition-transform duration-200', platformOpen && 'rotate-180 text-white')} aria-hidden="true" />
                <AnimatePresence>
                  {platformOpen && (
                    <motion.div
                      role="menu"
                      className="dropdown-panel absolute left-0 top-full z-[70] mt-3 w-max min-w-80 max-w-[32.5rem] p-5"
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="grid grid-cols-2 gap-5">
                        {[{ label: 'byTask', items: SITE_CONFIG.platformMenu.tasks }, { label: 'modelSystem', items: SITE_CONFIG.platformMenu.models }].map((group) => <div key={group.label}>
                          <p className="mb-2 px-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-tertiary)]">{t(group.label)}</p>
                          <ul className="space-y-1">{group.items.map(([key, slug]) => <li key={slug}>
                            <Link role="menuitem" onClick={() => {setPlatformOpen(false); setHoverKey(null);}} className="group/menu relative flex min-h-11 items-center rounded-[0.625rem] px-3.5 py-2.5 pl-5 text-sm font-medium text-foreground transition-colors duration-200 before:absolute before:left-2 before:h-4 before:w-0.5 before:scale-y-0 before:rounded-full before:bg-accent before:transition-transform hover:bg-white/[0.07] hover:text-white hover:before:scale-y-100 focus-visible:bg-white/[0.07] focus-visible:before:scale-y-100" href={localizeHref('/platform#' + slug, locale)}>{t(key)}</Link>
                          </li>)}</ul>
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
          {open && (
            <nav className="site-container max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-border py-4 pb-24 lg:hidden" aria-label="Mobile navigation">
              <ul className="space-y-1">
                {SITE_CONFIG.nav.map((item) => {
                  const active = activeKey === item.key;
                  return <li key={item.key}><Link onClick={() => setOpen(false)} className={cn('flex min-h-12 items-center rounded-md border-l-2 border-transparent px-3 font-medium text-muted-foreground', active && 'border-accent bg-white/[0.05] text-white')} href={localizeHref(item.href, locale)}>{t(item.key)}</Link></li>;
                })}
              </ul>
              <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
                <Link href={otherLocaleHref} className="flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium">{t('language')}</Link>
              </div>
            </nav>
          )}
        </GlassPanel>
      </header>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-[rgba(10,9,16,0.78)] p-3 backdrop-blur-[24px] lg:hidden">
        <CTAButton locale={locale} className="w-full" />
      </div>
    </>
  );
}
