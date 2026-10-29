'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHero } from './page-hero';

export function ContactPage() {
  const t=useTranslations('contactPage'); const options=t.raw('options') as string[];
  const [phase,setPhase]=useState<'idle'|'sending'|'done'>('idle');
  const timer=useRef<ReturnType<typeof setTimeout>>();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  // TODO: Connect this handler to the approved form service or CRM when backend scope is confirmed; for now only the animation plays.
  const onSubmit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(phase!=='idle')return;setPhase('sending');timer.current=setTimeout(()=>setPhase('done'),1200);};
  const input='mt-2 min-h-12 w-full rounded-md border border-border bg-white/[0.04] px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent';
  return <><PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/><section className="section-space relative"><div className="site-container relative"><GlassPanel className="mx-auto max-w-3xl p-6 md:p-10">{phase==='done'?<div className="contact-done" role="status"><svg className="contact-done-mark" viewBox="0 0 52 52" aria-hidden="true"><circle className="contact-done-ring" cx="26" cy="26" r="24" fill="none"/><path className="contact-done-tick" d="M15 27.5l8 8L37.5 18" fill="none"/></svg><h2>{t('doneTitle')}</h2><p>{t('doneBody')}</p><button type="button" className="contact-done-again" onClick={()=>setPhase('idle')}>{t('again')}</button></div>:<form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-2" aria-busy={phase==='sending'}><label className="font-medium">{t('name')}<span className="text-accent" aria-hidden="true"> *</span><input name="name" required className={input}/></label><label className="font-medium">{t('organization')}<input name="organization" className={input}/></label><label className="font-medium">{t('email')}<span className="text-accent" aria-hidden="true"> *</span><input name="email" type="email" required autoComplete="email" className={input}/></label><label className="font-medium">{t('phone')}<input name="phone" type="tel" autoComplete="tel" inputMode="tel" className={input}/></label><label className="font-medium md:col-span-2">{t('type')}<span className="text-accent" aria-hidden="true"> *</span><select name="type" required defaultValue="" className={input}><option value="" disabled>{t('select')}</option>{options.map(o=><option key={o}>{o}</option>)}</select></label><label className="font-medium md:col-span-2">{t('message')}<textarea name="message" rows={6} className={`${input} py-3`}/></label><div className="md:col-span-2"><Button type="submit" size="lg" disabled={phase==='sending'} className={phase==='sending'?'contact-sending':undefined}>{phase==='sending'?<><span className="contact-spinner" aria-hidden="true"/>{t('sending')}</>:t('submit')}</Button><p className="mt-4 text-xs text-muted-foreground">{t('privacy')}</p></div></form>}</GlassPanel></div></section></>;
}
