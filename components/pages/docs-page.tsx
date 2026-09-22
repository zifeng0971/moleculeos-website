'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { BookOpen, ArrowUpRight, HelpCircle, Zap } from 'lucide-react';
import manifest from '@/content/manual/manifest.json';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { localizeHref,type Locale } from '@/lib/site-config';

export function DocsPage({locale}:{locale:Locale}){
  const t=useTranslations('docsPage');const ui=useTranslations('manualUI');const faqs=t.raw('faqs') as string[][];
  const count=manifest.languages[locale].pageCount;
  return <article className="manual-article docs-home"><p className="manual-eyebrow">MOLECULEOS DOCUMENTATION</p><h1>{t('title')}</h1><p className="manual-lead">{t('description')}</p><div className="docs-entry-grid">{[{title:t('quickStart'),description:ui('quickStartDescription'),href:'#quick-start',Icon:Zap},{title:t('manual'),description:ui('manualDescription'),href:localizeHref('/help/manual',locale),Icon:BookOpen},{title:t('faq'),description:ui('faqDescription'),href:'#faq',Icon:HelpCircle}].map(({title,description,href,Icon},i)=><Link href={href} key={href}><Icon size={22} strokeWidth={1.5}/><h2>{title}</h2><p>{description}</p><span>{i===1?ui('pages',{count}):'→'}</span></Link>)}</div><section id="quick-start" className="docs-home-section"><h2>{t('quickStart')}</h2><p>{t('quickDescription')}</p><Link href={localizeHref('/help/manual',locale)} className="docs-text-link">{ui('openManual')}<ArrowUpRight size={16}/></Link></section><section id="faq" className="docs-home-section"><h2>{t('faq')}</h2><Accordion type="single" collapsible>{faqs.map((faq,i)=><AccordionItem key={faq[0]} value={'faq-'+i}><AccordionTrigger>{faq[0]}</AccordionTrigger><AccordionContent>{faq[1]}</AccordionContent></AccordionItem>)}</Accordion></section></article>;
}
