'use client';

import { FormEvent, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';
import { PageHero } from './page-hero';

// The request types cycle through the brand's three hues (sky, lilac, rose), so the chips read as a set.
const HUES=['156,205,240','188,178,244','230,179,205'];

export function ContactPage() {
  const t=useTranslations('contactPage'); const options=t.raw('options') as string[];
  const [phase,setPhase]=useState<'idle'|'sending'|'done'>('idle');
  const [count,setCount]=useState(0); // required fields filled, out of 3: drives the progress line, and the button stays grey until all are
  const valid=count===3;
  const [emailBad,setEmailBad]=useState(false); // the email format is checked on submit, so a half-typed address doesn't keep the button grey
  const filled=(form:HTMLFormElement)=>{const data=new FormData(form);return ['name','email','type'].filter(k=>String(data.get(k)??'').trim()!=='').length;};
  const timer=useRef<ReturnType<typeof setTimeout>>();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  // TODO: Connect this handler to the approved form service or CRM when backend scope is confirmed; for now only the animation plays.
  const onSubmit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(phase!=='idle')return;const email=event.currentTarget.elements.namedItem('email') as HTMLInputElement;if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())){setEmailBad(true);email.focus();return;}setPhase('sending');timer.current=setTimeout(()=>setPhase('done'),1200);};
  const input='mt-2 min-h-12 w-full rounded-md border border-border bg-white/[0.04] px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-accent';
  return <><PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/><section className="section-space relative"><div className="site-container relative"><GlassPanel className="contact-panel mx-auto max-w-3xl p-6 md:p-10">{phase!=='done'&&<span className="contact-progress" style={{'--p':count/3} as CSSProperties} aria-hidden="true"/>}{phase==='done'?<div className="contact-done" role="status"><svg className="contact-done-mark" viewBox="0 0 52 52" aria-hidden="true"><circle className="contact-done-ring" cx="26" cy="26" r="24" fill="none"/><path className="contact-done-tick" d="M15 27.5l8 8L37.5 18" fill="none"/></svg><h2>{t('doneTitle')}</h2><p>{t('doneBody')}</p><button type="button" className="contact-done-again" onClick={()=>{setCount(0);setPhase('idle');}}>{t('again')}</button></div>:<form onSubmit={onSubmit} noValidate onInput={e=>{setCount(filled(e.currentTarget));setEmailBad(false);}} className="contact-form grid gap-8 md:grid-cols-2" aria-busy={phase==='sending'}><label className="font-medium">{t('name')}<span className="text-accent" aria-hidden="true"> *</span><input name="name" required className={input}/></label><label className="font-medium">{t('organization')}<input name="organization" className={input}/></label><label className="font-medium" data-error={emailBad||undefined}>{t('email')}<span className="text-accent" aria-hidden="true"> *</span><input name="email" type="email" required autoComplete="email" aria-invalid={emailBad||undefined} className={input}/>{emailBad&&<em className="contact-hint" role="alert">{t('emailInvalid')}</em>}</label><label className="font-medium">{t('phone')}<input name="phone" type="tel" autoComplete="tel" inputMode="tel" className={input}/></label><fieldset className="contact-chips md:col-span-2"><legend>{t('type')}<span aria-hidden="true"> *</span></legend><div>{options.map((o,i)=><label key={o} style={{'--h':HUES[i%3]} as CSSProperties}><input type="radio" name="type" value={o} required/><i>{o}</i></label>)}</div></fieldset><label className="font-medium md:col-span-2">{t('message')}<textarea name="message" rows={2} className={`${input} py-3`}/></label><div className="contact-actions md:col-span-2"><Button type="submit" size="lg" disabled={!valid||phase==='sending'} className={phase==='sending'?'contact-submit contact-sending':'contact-submit'}>{phase==='sending'?<><span className="contact-spinner" aria-hidden="true"/>{t('sending')}</>:t('submit')}</Button><p className="mt-4 text-xs text-muted-foreground">{t('privacy')}</p></div></form>}</GlassPanel></div></section></>;
}
