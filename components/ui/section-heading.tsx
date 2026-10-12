import { cn } from '@/lib/utils';
import { Phrases } from '@/components/ui/phrase-title';

export function SectionHeading({ eyebrow, title, description, align = 'left', className }: { eyebrow?: string; title: string; description?: string; align?: 'left' | 'center'; className?: string }) {
  return (
    <div className={cn(align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className={cn('section-title', align === 'center' && 'mx-auto')}><Phrases text={title} /></h2>
      {description && <p className={cn('section-copy', align === 'center' && 'mx-auto')}>{description}</p>}
    </div>
  );
}
