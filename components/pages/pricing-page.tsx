'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { MODULE } from '@/lib/palette';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { PageHero } from './page-hero';
import { Flow } from '@/components/ui/phrase-title';

type Plan = { id: 'free' | 'individual' | 'pro' | 'team'; name: string; tagline: string; price: string; eduPrice: string; mcu: number; mcuNote: string; cta: string; features: string[] };
type Spec = { value: string; label: string };
type ModelRow = { name: string; fn: string; secs: number; mcu: number; mod: keyof typeof MODULE };
const LONGEST = 300; // seconds: the bar of the slowest model (MMFold) is full width

// The compute meter: 20 cells of 40 MCU each, so Free fills 1, Individual 3 and Pro all 20.
// Filled cells run through the module hues in pipeline order (structure → sequence → affinity → stability → design):
// the more compute a plan carries, the further along the design pipeline it reaches.
const CELLS = 20, PER_CELL = 40;
const PIPELINE = [MODULE.structure, MODULE.sequence, MODULE.affinity, MODULE.stability, MODULE.design];
const cellHue = (k: number) => PIPELINE[Math.min(PIPELINE.length - 1, Math.floor((k / CELLS) * PIPELINE.length))];

/** Pricing (MOS pricing framework V1, core only): four plans with a compute meter, then one strip of MCU facts. */
export function PricingPage({ locale }: { locale: Locale }) {
  const t = useTranslations('pricingPage');
  const [edu, setEdu] = useState(false);
  const plans = t.raw('plans') as Plan[];
  const specs = t.raw('specs') as Spec[];
  const models = t.raw('models.rows') as ModelRow[];

  return <><PageHero fx eyebrow={t('eyebrow')} title={t('title')} description={t('description')} />
    <div className="pr site-container">
      <div className="pr-billing">
        <div className="hc-switch" role="tablist" aria-label={t('billing.standard') + ' / ' + t('billing.edu')}>
          <button role="tab" aria-selected={!edu} data-active={!edu || undefined} onClick={() => setEdu(false)}>{t('billing.standard')}</button>
          <button role="tab" aria-selected={edu} data-active={edu || undefined} onClick={() => setEdu(true)}>{t('billing.edu')}</button>
        </div>
        <p>{edu ? t('billing.eduNote') : ' '}</p>
      </div>

      <div className="pr-plans">{plans.map((plan, i) => {
        const team = plan.id === 'team', price = edu ? plan.eduPrice : plan.price, filled = Math.round(plan.mcu / PER_CELL);
        const href = team ? localizeHref('/contact', locale) : SITE_CONFIG.platformUrl;
        return <Reveal key={plan.id} delay={staggerDelay(i, plans.length)} className="h-full">
          <article className="pr-plan" data-plan={plan.id}>
            <header><h2>{plan.name}{plan.id === 'pro' && <em>{t('recommended')}</em>}</h2><p><Flow text={plan.tagline} /></p></header>
            <p className="pr-price" data-text={team || undefined}><strong>{price}</strong>{!team && <span>{t('perMonth')}</span>}</p>
            <div className="pr-meter" data-pooled={team || undefined} role="img" aria-label={team ? plan.mcuNote : `${plan.mcu} ${t('mcuUnit')}`}>
              {Array.from({ length: CELLS }, (_, k) => <i key={k} data-on={(team || k < filled) || undefined} style={{ '--m': cellHue(k) } as CSSProperties} />)}
            </div>
            <p className="pr-mcu">{team ? <span>{plan.mcuNote}</span> : <><b>{plan.mcu}</b> {t('mcuUnit')}<span> · {plan.mcuNote}</span></>}</p>
            <ul>{plan.features.map(f => <li key={f}><Flow text={f} /></li>)}</ul>
            <Link href={href} target={team ? undefined : '_blank'} rel={team ? undefined : 'noreferrer'} className={plan.id === 'pro' ? 'pr-cta pr-cta-primary' : 'pr-cta'}>{plan.cta}<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </article>
        </Reveal>;
      })}</div>

      <Reveal><dl className="pr-specs">{specs.map(s => <div key={s.label}><dt>{s.value}</dt><dd><Flow text={s.label} /></dd></div>)}</dl></Reveal>
      <section className="pr-models">
        <Reveal><h2 className="pr-models-head">{t('models.title')}</h2><p className="pr-models-lead"><Flow text={t('models.lead')} /></p></Reveal>
        <Reveal delay={0.05}><ul className="pr-model-list">{models.map(m => <li key={m.name} style={{ '--m': MODULE[m.mod] } as CSSProperties}>
          <span className="pr-model-name"><i aria-hidden="true" />{m.name}</span>
          <span className="pr-model-fn">{m.fn}</span>
          {/* Bar length follows MCU (square-root scale, so the quarter-MCU models stay visible next to MMFold). */}
          <span className="pr-model-bar" aria-hidden="true"><b style={{ width: `${Math.max(6, Math.sqrt(m.secs / LONGEST) * 100)}%` }} /></span>
          <span className="pr-model-time">{t('models.approx')}{+m.mcu.toFixed(2)} <small>{t('models.unit')}</small></span>
        </li>)}</ul></Reveal>
      </section>
      <p className="pr-foot">{t('footnote')} <Link href={localizeHref('/help/faq', locale)}>{t('moreQuestions')} →</Link></p>
    </div>
  </>;
}
