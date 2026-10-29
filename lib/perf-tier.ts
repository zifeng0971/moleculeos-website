// Device tier for the WebGL / canvas scenes. Capable devices keep the full-fidelity look; weak ones (few cores, little
// memory, Save-Data) start in "lite" mode, and any device that measures as janky is downgraded once, for good.
type Hints = { deviceMemory?: number; connection?: { saveData?: boolean } };
const listeners = new Set<() => void>();
let lite: boolean | undefined;

function detect() {
  if (typeof navigator === 'undefined') return false;
  const hints = navigator as Navigator & Hints;
  return (navigator.hardwareConcurrency ?? 8) <= 4 || (hints.deviceMemory ?? 8) <= 4 || !!hints.connection?.saveData;
}

export const isLite = () => (lite ??= detect());
export function degrade() { if (isLite()) return; lite = true; listeners.forEach(listener => listener()); }
export function onLite(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

/** Watches frame spacing while something is continuously animating; downgrades if most frames are slow. */
export function frameMonitor(slowMs = 42) {
  let last = 0, slow = 0, total = 0;
  return (now: number) => {
    const gap = now - last; last = now;
    if (gap > 250 || gap <= 0) return; // idle gaps are not slow frames
    total++; if (gap > slowMs) slow++;
    if (total >= 45) { if (slow / total > 0.6) degrade(); total = slow = 0; }
  };
}
