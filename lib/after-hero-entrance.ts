// The hero's text entrance runs ~2s after load and repaints on the main thread (blur + gradient text).
// Heavy one-off work (WebGL viewers, shader compiles) waits until it has finished, then for an idle slot.
const HERO_ENTRANCE_MS = 2000;

export function afterHeroEntrance(callback: () => void) {
  let idle = 0;
  const timer = window.setTimeout(() => {
    idle = window.requestIdleCallback ? window.requestIdleCallback(callback, { timeout: 600 }) : window.setTimeout(callback, 0);
  }, Math.max(0, HERO_ENTRANCE_MS - performance.now()));
  return () => {
    window.clearTimeout(timer);
    if (idle) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
  };
}
