/** One observer for the entire manual, independent of the number of recordings. */
const listeners = new Map<Element, () => void>();
let observer: IntersectionObserver | undefined;
export function releaseManualVideoOutsideViewport(element: Element, release: () => void) {
  if (!observer) observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (!entry.isIntersecting) listeners.get(entry.target)?.();
  }, { rootMargin: '240px 0px' });
  listeners.set(element, release);
  observer.observe(element);
  return () => {
    observer?.unobserve(element);
    listeners.delete(element);
    if (!listeners.size) { observer?.disconnect(); observer = undefined; }
  };
}
