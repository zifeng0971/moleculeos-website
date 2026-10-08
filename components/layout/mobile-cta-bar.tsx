'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/site-config';
import { CTAButton } from '@/components/ui/cta-button';

// Only shown when no other primary CTA is on screen: hidden over the hero buttons, the final CTA and the footer.
const COMPETING = '.hero-actions, .final-cta, footer';

export function MobileCTABar({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [competing, setCompeting] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 320);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target);
      }
      setCompeting(visible.size > 0);
    });
    const targets = document.querySelectorAll(COMPETING);
    targets.forEach(el => observer.observe(el));
    if (!targets.length) setCompeting(false);
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect(); };
  }, [pathname]);
  const shown = scrolled && !competing;
  return <div className="mobile-cta-bar lg:hidden" data-shown={shown} aria-hidden={!shown}>
    <CTAButton locale={locale} className="w-full" tabIndex={shown ? undefined : -1} />
  </div>;
}
