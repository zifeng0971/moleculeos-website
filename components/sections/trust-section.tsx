'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { CountUpNumber } from '@/components/ui/count-up-number';
import { getMockContent } from '@/lib/mock-content';
import type { Locale } from '@/lib/site-config';

const marks = Array.from({ length: 8 }, (_, index) => `LOGO ${String(index + 1).padStart(2, "0")}`);

/** Evidence band: the headline numbers first, their exact conditions directly beneath, then partners. */
export function TrustSection({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations('home.trust');
  const condition = t('successCondition');
  const items = getMockContent(useLocale() as Locale).trust.items;
  return (
    <section className="proof-band" data-nav-section={embedded ? undefined : 'validation'}>
      <div className="site-container">
        <div className="proof-stats">
          {items.map((item, index) => <Reveal key={item.label} delay={staggerDelay(index, items.length)} className="proof-stat">
            <p className="stat-value"><CountUpNumber to={Number.parseInt(item.value)} suffix={item.value.replace(/^\d+/, '')}/></p>
            <p className="proof-stat-label">{item.label}</p>
          </Reveal>)}
        </div>
        {/* Keep the complete verified condition adjacent to the success-rate numbers. */}
        <Reveal><p className="proof-condition">{condition}</p></Reveal>
        <Reveal className="proof-partners">
          <p>{t('label')}</p>
          {/* Replace text marks with eight approved partner logos. These labels do not imply customer relationships. */}
          <div className="logo-marquee">
            <div className="logo-marquee-track">
              {[...marks, ...marks].map((mark, index) => <div key={index} className="logo-marquee-item" aria-hidden={index >= marks.length || undefined}>{mark}</div>)}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
