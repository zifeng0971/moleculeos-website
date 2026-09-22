import type { ReactNode } from 'react';

/** Adapted from the upgrade repository's ChatBubble display primitive. */
export function ChatBubble({ variant, children }: { variant: 'user' | 'assistant'; children: ReactNode }) {
  return <div className={`mocha-upgrade-bubble mocha-upgrade-bubble-${variant}`}>{children}</div>;
}
