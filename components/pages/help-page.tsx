'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, HelpCircle, Zap, History, Code } from 'lucide-react';
import manifest from '@/content/manual/manifest.json';
import { localizeHref, type Locale } from '@/lib/site-config';
import { DocsSearch } from '@/components/docs/docs-search';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function HelpPage({ locale, kind = 'home' }: { locale: Locale; kind?: 'home' | 'getting-started' | 'faq' | 'changelog' | 'api' }) {
  const t = useTranslations('helpPage');
  const docs = useTranslations('docsPage');
  const ui = useTranslations('manualUI');
  const entries = [{ key: 'getting-started', title: docs('quickStart'), description: ui('quickStartDescription'), Icon: Zap }, { key: 'manual', title: docs('manual'), description: ui('manualDescription'), Icon: BookOpen }, { key: 'faq', title: docs('faq'), description: ui('faqDescription'), Icon: HelpCircle }, { key: 'changelog', title: t('changelog'), description: t.raw('todo') as string, Icon: History }, { key: 'api', title: t('api'), description: t.raw('todo') as string, Icon: Code }];
  const selected = entries.find(e => e.key === kind);
  return <article className="site-container py-24">
    {kind !== 'home' && <Link href={localizeHref('/help', locale)} className="mb-6 inline-flex text-sm text-muted-foreground">← {t('title')}</Link>}
    <h1 className="section-title">{selected?.title ?? t('title')}</h1>
    <p className="section-copy">{kind === 'home' ? docs('description') : kind === 'getting-started' ? docs('quickDescription') : selected?.description}</p>
    {kind === 'home' && <div className="help-entry-grid mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">{entries.map(({ key, title, description, Icon }, i) => {
      const content = <><Icon size={24} strokeWidth={1.5} aria-hidden="true"/><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-3 text-sm text-muted-foreground">{description}</p><p className="mt-5 text-sm">{i > 2 ? t('soon') : i === 1 ? ui('pages', { count: manifest.languages[locale].pageCount }) : '→'}</p></>;
      return i > 2 ? <div key={key} className="rounded-2xl border border-border p-8 opacity-50" aria-disabled="true">{content}</div> : <Link id={key} key={key} href={localizeHref('/help/' + key, locale)} className="rounded-2xl border border-border p-8 transition hover:border-accent">{content}</Link>;
    })}</div>}
    {kind === 'getting-started' && <Link href={localizeHref('/help/manual', locale)} className="mt-8 inline-flex min-h-11 items-center text-[var(--accent-text)]">{ui('openManual')}</Link>}
    {kind === 'faq' && <div className="mt-12 max-w-[760px]"><Accordion type="single" collapsible>{(docs.raw('faqs') as string[][]).map((faq, i) => <AccordionItem key={i} value={'faq-' + i}><AccordionTrigger>{faq[0]}</AccordionTrigger><AccordionContent>{faq[1]}</AccordionContent></AccordionItem>)}</Accordion></div>}
    {(kind === 'api' || kind === 'changelog') && <p className="mt-8 text-muted-foreground">{t('soon')}</p>}
    {kind === 'home' && <div className="mt-12 max-w-[480px]"><DocsSearch locale={locale}/></div>}
  </article>;
}
