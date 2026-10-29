import { useEffect, useState } from 'react';
import { isLite } from '@/lib/perf-tier';

/**
 * Whether a waterfall stage's viewer should be mounted. A stage is created shortly before it scrolls into view and,
 * on capable devices, then kept alive (its viewer pauses rendering while off screen), so scrolling back never reloads it.
 * Weak devices unmount it again when it is far away, to free the WebGL context.
 */
export function useStageMount(armed: boolean) {
  const [kept, setKept] = useState(false);
  useEffect(() => { if (armed) setKept(true); else if (isLite()) setKept(false); }, [armed]);
  return armed || (kept && !isLite());
}
