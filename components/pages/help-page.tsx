'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import manifest from '@/content/manual/manifest.json';
import { localizeHref, type Locale } from '@/lib/site-config';
import { HelpCenter } from '@/components/pages/help-center';

type Step = { title: string; body: string; chips: string[] };
type Kind = 'home' | 'getting-started' | 'faq' | 'changelog' | 'api';
// Manual group indexes are the same in the zh and en manifests.
const QUICK_START_GROUP = 3;

/**
 * Help center. The home page (and the /help/api and /help/faq entries) is `HelpCenter`: a sidebar hierarchy of core
 * features, user stories, API key, MCP service and FAQ. Getting-started and changelog stay single reading columns,
 * and the user manual keeps the docs shell with the left navigation.
 */
export function HelpPage({ locale, kind = 'home' }: { locale: Locale; kind?: Kind }) {
  const t = useTranslations('helpPage');
  const groups = manifest.languages[locale].groups;
  const manualHref = (index: number) => localizeHref('/help/manual', locale) + '#' + groups[index].slug;

  const Steps = ({ steps }: { steps: Step[] }) => <ol className="help-steps">{steps.map((step, i) => <li key={step.title}>
    <span className="help-step-no">{i + 1}</span>
    <div><h3>{step.title}</h3><p>{step.body}</p><div className="help-chips">{step.chips.map(chip => <span key={chip}>{chip}</span>)}</div></div>
  </li>)}</ol>;
  const Head = ({ crumb, eyebrow, title, lead }: { crumb: string; eyebrow: string; title: string; lead: string }) => <>
    <nav className="manual-breadcrumb" aria-label="breadcrumb"><Link href={localizeHref('/help', locale)}>{t('title')}</Link><span>/</span><span>{crumb}</span></nav>
    <p className="manual-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="manual-lead">{lead}</p>
  </>;

  if (kind === 'home' || kind === 'api' || kind === 'faq') return <HelpCenter locale={locale} initial={kind === 'home' ? undefined : kind} />;

  if (kind === 'getting-started') return <div className="site-container help-page"><article className="manual-article help-article">
    <Head crumb={t('start')} eyebrow={t('quick.eyebrow')} title={t('quick.title')} lead={t('quick.lead')} />
    <Steps steps={t.raw('quick.steps') as Step[]} />
    <Link href={manualHref(QUICK_START_GROUP)} className="help-more group">{t('quick.more')}<ArrowRight size={16} aria-hidden="true" /></Link>
  </article></div>;

  return <div className="site-container help-page"><article className="manual-article help-article">
    <Head crumb={t('more')} eyebrow="CHANGELOG" title={t('changelog')} lead={t('soonBody')} />
    <p className="help-soon">{t('soon')}</p>
  </article></div>;
}
