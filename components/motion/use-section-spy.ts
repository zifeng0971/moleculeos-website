'use client';

import { useEffect, useState } from 'react';

export function useSectionSpy({ selector, attribute = 'id', initial, enabled = true, top = 45, bottom = 45 }: {
  selector: string; attribute?: string; initial: string; enabled?: boolean; top?: number; bottom?: number;
}) {
  const [active, setActive] = useState(initial);
  useEffect(() => {
    if (!enabled) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    let observer: IntersectionObserver;
    const createObserver = () => {
      observer?.disconnect();
      const visible = new Set<HTMLElement>();
      const middle = innerHeight * (top + 100 - bottom) / 200;
      const distance = (node: HTMLElement) => {
        const rect = node.getBoundingClientRect();
        return rect.top <= middle && rect.bottom >= middle ? 0 : Math.min(Math.abs(rect.top-middle),Math.abs(rect.bottom-middle));
      };
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {if(entry.isIntersecting) visible.add(entry.target as HTMLElement); else visible.delete(entry.target as HTMLElement);});
        const closest = [...visible].sort((a,b)=>distance(a)-distance(b))[0];
        if (closest) setActive(closest.getAttribute(attribute) ?? initial);
      }, {
        // IO percentage margins resolve against root width, not height. Pixel equivalents
        // preserve the intended central 45% / 45% viewport-height band on wide screens.
        rootMargin: `${-innerHeight * top / 100}px 0px ${-innerHeight * bottom / 100}px 0px`, threshold: 0,
      });
      nodes.forEach(node=>observer.observe(node));
    };
    createObserver();
    window.addEventListener('resize',createObserver);
    return ()=>{observer.disconnect();window.removeEventListener('resize',createObserver);};
  }, [selector, attribute, initial, enabled, top, bottom]);
  return [active, setActive] as const;
}
