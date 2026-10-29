import type { ReactNode } from 'react';

const P: Record<string, ReactNode> = {
  paste: <><rect x="5" y="4" width="8" height="10" rx="1.5" /><path d="M7 4V3h4v1" /></>,
  pdb: <><path d="M3 5.5 9 2.5l6 3v7l-6 3-6-3z" /><path d="M3 5.5 9 8.5l6-3M9 8.5v7" /></>,
  upload: <><path d="M9 12V3M5.5 6.5 9 3l3.5 3.5" /><path d="M3 12.5v1.5h12v-1.5" /></>,
  sample: <><circle cx="9" cy="9" r="6" /><path d="M6.5 9.5 8.3 11.3 11.6 7" /></>,
  evidence: <><path d="M4 3h7l3 3v9H4z" /><path d="M11 3v3h3M6.5 9h5M6.5 11.5h5" /></>,
  predict: <><path d="M3 13c2-6 4-8 6-4s4 2 6-5" /></>,
  close: <path d="M5 5l8 8M13 5l-8 8" />,
  info: <><circle cx="9" cy="9" r="6" /><path d="M9 8.2v4M9 5.9v.1" /></>,
  check: <path d="M4 9.5 7.5 13 14 5.5" />,
  chevron: <path d="M5 7l4 4 4-4" />,
};
export type IconName = keyof typeof P;

/** 18px stroke icon set shared by the product. `size` defaults to 16. */
export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {P[name]}
    </svg>
  );
}
