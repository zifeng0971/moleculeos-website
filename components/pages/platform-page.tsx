'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Atom, Dna } from 'lucide-react';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { CTAButton } from '@/components/ui/cta-button';
import { Reveal } from '@/components/motion/reveal';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { useSectionSpy } from '@/components/motion/use-section-spy';
import { cn } from '@/lib/utils';

type Model = { name: string; description: string; limitation: string };

export function PlatformPage({ locale }: { locale: Locale }) {
  const t = useTranslations('platformPage');
  const nav = useTranslations('nav');
  const m = useTranslations('home.models');
  const todo = t.raw('todo') as string;
  const items = [{name: nav('neworigin'), description: m('foundationDescription'), limitation: m('foundationLimitation')}, ...(m.raw('items') as Model[])];
  const anchors = [
    {id:'overview',label:t('overview')},
    ...SITE_CONFIG.platformMenu.tasks.map(([key,id])=>({id,label:nav(key)})),
    {id:'models',label:t('modelsTitle')}, {id:'compute',label:t('compute')},
  ];
  const [active, setActive] = useSectionSpy({ selector: '[data-platform-anchor]', initial: 'overview', top: 35, bottom: 45 });
  return <div className="site-container grid gap-10 pb-24 pt-10 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-12">
    <aside className="lg:sticky lg:top-28 lg:self-start">
      <nav aria-label={t('sidebar')} className="flex gap-2 overflow-x-auto pb-3 lg:flex-col lg:overflow-visible">
        {anchors.map(anchor=><a key={anchor.id} href={'#'+anchor.id} onClick={()=>setActive(anchor.id)} aria-current={active===anchor.id?'location':undefined} className={cn('flex min-h-11 shrink-0 items-center rounded-lg border-l-2 border-transparent px-3 text-sm text-muted-foreground transition-colors hover:text-white',active===anchor.id&&'border-accent bg-white/[0.05] text-white')}>{anchor.label}</a>)}
      </nav>
    </aside>
    <div className="min-w-0">
      <section id="overview" data-platform-anchor className="scroll-mt-28 border-b border-border pb-16">
        <Reveal><p className="eyebrow">{t('overview')}</p><h1 className="section-title">{t('title')}</h1><p className="section-copy">{t('description')}</p><div className="mt-8 flex flex-wrap gap-3"><CTAButton locale={locale}/><CTAButton locale={locale} kind="secondary"/></div></Reveal>
      </section>
      {SITE_CONFIG.platformMenu.tasks.map(([key,slug])=><section key={slug} id={slug} data-platform-anchor className="scroll-mt-28 border-b border-border py-16">
        <Reveal><p className="eyebrow eyebrow-solid">{nav('byTask')}</p><h2 className="text-3xl font-semibold">{nav(key)}</h2><p className="section-copy">{todo}</p></Reveal>
        <div className="mt-6"><h3 className="text-sm font-semibold">{t('applicable')}</h3><p className="mt-2 font-mono text-sm text-muted-foreground">{todo}</p><div className="mt-3 flex flex-wrap gap-2">{['antibody','peptide','enzyme','miniProtein'].map(molecule=><span key={molecule} className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground">{nav(molecule)}</span>)}</div></div>
        <h3 className="mt-8 text-xl font-semibold">{t('scenarios')}</h3><ul className="mt-4 space-y-2 text-sm text-muted-foreground">{[0,1,2].map(i=><li key={i}>— {todo}</li>)}</ul>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{['inputs','outputs'].map(field=><InteractiveCard key={field} tilt={false} glowRadius={320} className="p-6"><h3 className="text-lg font-semibold">{t(field)}</h3><ul className="mt-4 space-y-3 text-sm text-muted-foreground">{[0,1,2].map(i=><li key={i}>{todo}</li>)}</ul></InteractiveCard>)}</div>
        <div className="mt-8 grid gap-6 md:grid-cols-2"><div><h3 className="text-lg font-semibold">{t('models')}</h3><p className="mt-3 text-sm text-muted-foreground">{todo}</p><a href="#models" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-brand">{t('viewModels')}<ArrowRight size={16}/></a></div><InteractiveCard as="a" href={localizeHref('/validation',locale)} className="p-6"><h3 className="text-lg font-semibold">{t('validation')}</h3><p className="mt-3 text-sm text-muted-foreground">{todo}</p><span className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm text-brand">{t('viewValidation')}<ArrowRight size={16}/></span></InteractiveCard></div>
      </section>)}
      <section id="models" data-platform-anchor className="scroll-mt-28 border-b border-border py-16">
        <Reveal><p className="eyebrow">{m('eyebrow')}</p><h2 className="text-3xl font-semibold">{t('modelsTitle')}</h2><p className="section-copy">{m('description')}</p></Reveal>
        <div className="mt-8 grid gap-6 md:grid-cols-2">{items.map((model,i)=><div key={model.name} id={['neworigin','mmfold','mmdesign'][i]} className={cn('scroll-mt-28',i===0&&'md:col-span-2')}>
          <InteractiveCard tilt={false} glowRadius={320} className="h-full p-6 md:p-8"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{i===0?m('foundation'):m('taskModels')}</p><div className="mt-3 flex items-center gap-3"><Dna className="size-6 text-accent"/><h3 className="text-2xl font-semibold">{model.name}</h3></div><p className="mt-4 max-w-[680px] text-sm text-muted-foreground">{model.description}</p><dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">{['modelInput','modelOutput','modelMolecules','benchmark'].map(field=><div key={field}><dt className="text-xs font-semibold text-muted-foreground">{t(field)}</dt><dd className="mt-1 text-sm">{todo}</dd></div>)}<div className="sm:col-span-2"><dt className="text-xs font-semibold text-muted-foreground">{m('limitation')}</dt><dd className="mt-1 text-sm">{model.limitation}</dd></div></dl></InteractiveCard>
        </div>)}</div>
      </section>
      <section id="compute" data-platform-anchor className="scroll-mt-28 py-16"><Atom className="size-8 text-accent"/><h2 className="mt-4 text-3xl font-semibold">{t('compute')}</h2><p className="section-copy">{m('scienceDescription')}</p><div className="mt-8 flex flex-wrap gap-3"><CTAButton locale={locale}/><CTAButton locale={locale} kind="secondary"/></div></section>
    </div>
  </div>;
}
