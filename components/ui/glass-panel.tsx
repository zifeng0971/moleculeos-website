import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function GlassPanel({ className, interactive = false, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={cn('glass', interactive && 'glass-interactive', className)} {...props} />;
}
