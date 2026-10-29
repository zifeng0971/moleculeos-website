'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

export function HomePosition() {
  const t = useTranslations('home.position');
  const labels = t.raw('labels') as string[];
  const [active, setActive] = useState(0);
  // Page-level snapping on the homepage only (desktop, motion allowed): wheel scrolling settles on the next screen.
  useEffect(() => {
    const root = document.documentElement;
    const media = matchMedia('(min-width: 1024px) and (prefers-reduced-motion: no-preference)');
    const apply = () => root.classList.toggle('home-snap', media.matches);
    apply(); media.addEventListener('change', apply);
    return () => { media.removeEventListener('change', apply); root.classList.remove('home-snap'); };
  }, []);
  // A section that fits on one screen settles centred in the viewport. A taller one is cut into screen-high pages with
  // invisible snap anchors (its own rows, like the capability waterfall, bring their own), so mandatory snapping never hides content.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-home-section]'));
    const anchors: HTMLElement[] = [];
    const measure = () => {
      anchors.splice(0).forEach(el => el.remove());
      sections.forEach((el, index) => {
        // The first screen and the case cards are left alone: no snapping there.
        if (index === 0 || el.querySelector('[data-nav-section="validation"]')) { el.dataset.snap = 'none'; return; }
        const tall = el.offsetHeight > innerHeight * 0.96;
        el.dataset.snap = tall ? 'start' : 'center';
        if (!tall || el.querySelector('.wf-row, .model-stack-snaps, .op-step')) return;
        const pages = Math.ceil(el.offsetHeight / innerHeight), step = (el.offsetHeight - innerHeight) / Math.max(1, pages - 1);
        for (let i = 1; i < pages; i++) {
          const anchor = document.createElement('span');
          anchor.className = 'home-snap-anchor'; anchor.setAttribute('aria-hidden', 'true'); anchor.style.top = `${Math.round(step * i)}px`;
          el.appendChild(anchor); anchors.push(anchor);
        }
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    sections.forEach(el => observer.observe(el)); addEventListener('resize', measure);
    return () => { observer.disconnect(); removeEventListener('resize', measure); anchors.forEach(el => el.remove()); };
  }, []);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-home-section]'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.homeSection));
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <nav className="home-position" aria-label={t('label')} style={{ '--i': active } as CSSProperties}>
    <span className="home-position-line" aria-hidden="true" />
    <span className="home-position-indicator" aria-hidden="true" />
    {labels.map((label, i) => <button key={label} className="home-position-button" aria-label={label} data-passed={i < active || undefined} aria-current={i === active ? 'location' : undefined} onClick={() => {
      document.querySelector(`[data-home-section="${i}"]`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }}><span className="home-position-tooltip">{label}</span><span className="home-position-dot" /></button>)}
  </nav>;
}
