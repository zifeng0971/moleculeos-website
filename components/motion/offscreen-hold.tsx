'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NEAR = '25% 0px 25% 0px';
// Which box of an element an animation runs on, as the token the hold rules in globals.css match.
const part = (pseudo: string | null | undefined) => (pseudo === '::before' ? 'before' : pseudo === '::after' ? 'after' : 'el');

/**
 * Looping CSS animations keep costing style (and sometimes layout) work every frame even when their section is far off screen.
 * While a section is out of reach, each of its infinite CSS animations is held (animation-play-state: paused via data-hold) and
 * released as it comes back, where it simply carries on. One-shot animations are left alone, so entrances look exactly as before.
 */
export function OffscreenHold() {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || typeof document.getAnimations !== 'function') return;
    const held = new Map<Element, Element[]>();
    const release = (section: Element) => { held.get(section)?.forEach(el => el.removeAttribute('data-hold')); held.delete(section); };
    const hold = (section: Element) => {
      release(section);
      const marks = new Map<Element, Set<string>>();
      for (const anim of section.getAnimations({ subtree: true })) {
        if (!(anim instanceof CSSAnimation) || anim.playState !== 'running') continue;
        const effect = anim.effect as KeyframeEffect | null;
        if (!effect?.target || effect.getTiming().iterations !== Infinity) continue;
        const tokens = marks.get(effect.target) ?? new Set<string>();
        tokens.add(part(effect.pseudoElement)); marks.set(effect.target, tokens);
      }
      marks.forEach((tokens, el) => el.setAttribute('data-hold', [...tokens].join(' ')));
      held.set(section, [...marks.keys()]);
    };
    const observer = new IntersectionObserver(entries => entries.forEach(entry => (entry.isIntersecting ? release : hold)(entry.target)), { rootMargin: NEAR });
    // Top-level sections only (nested ones are covered by their parent), plus the footer.
    const sections = [...document.querySelectorAll('main section, footer.gfooter')].filter(el => !el.parentElement?.closest('main section'));
    sections.forEach(el => observer.observe(el));
    return () => { observer.disconnect(); [...held.keys()].forEach(release); };
  }, [pathname]);
  return null;
}
