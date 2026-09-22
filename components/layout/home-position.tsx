'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function HomePosition() {
  const t = useTranslations('home.position');
  const labels = t.raw('labels') as string[];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-home-section]'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.homeSection));
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return <nav className="home-position" aria-label={t('label')}>
    {labels.map((label, i) => <button key={label} className="home-position-button" aria-label={label} aria-current={i === active ? 'location' : undefined} onClick={() => {
      document.querySelector(`[data-home-section="${i}"]`)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }}><span className="home-position-tooltip">{label}</span><span className="home-position-dot" /></button>)}
  </nav>;
}
