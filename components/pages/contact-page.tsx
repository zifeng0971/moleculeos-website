'use client';

import { FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHero } from './page-hero';

export function ContactPage() {
  const t=useTranslations('contactPage'); const options=t.raw('options') as string[];
  // TODO: Connect this handler to the approved form service or CRM when backend scope is confirmed.
  const onSubmit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();};
  const input='mt-2 min-h-12 w-full rounded-md border border-border bg-white/[0.04] px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent';
  return <><PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/><section className="section-space relative"><div className="ambient-glow -right-40 top-10 size-[32rem]"/><div className="site-container relative"><GlassPanel className="mx-auto max-w-3xl p-6 md:p-10"><form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-2"><label className="font-medium">{t('name')}<input name="name" required className={input}/></label><label className="font-medium">{t('organization')}<input name="organization" required className={input}/></label><label className="font-medium">{t('email')}<input name="email" type="email" required className={input}/></label><label className="font-medium">{t('type')}<select name="type" required defaultValue="" className={input}><option value="" disabled>{t('select')}</option>{options.map(o=><option key={o}>{o}</option>)}</select></label><label className="font-medium md:col-span-2">{t('message')}<textarea name="message" rows={6} className={`${input} py-3`}/></label><div className="md:col-span-2"><Button type="submit" size="lg">{t('submit')}</Button><p className="mt-4 text-xs text-muted-foreground">{t('privacy')}</p></div></form></GlassPanel></div></section></>;
}
