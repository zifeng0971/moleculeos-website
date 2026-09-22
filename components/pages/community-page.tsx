'use client';
import { useTranslations } from 'next-intl';
import { MessageCircle, Users } from 'lucide-react';
import { PageHero } from './page-hero';

export function CommunityPage() {
  const t = useTranslations('placeholderPage.community');
  const ui = useTranslations('communityPage');
  // 账号尚未确认是否全部开通，上线前需逐个核实，未开通的不要展示。
  // 本轮全部链接保留 TODO；确认后才将禁用入口替换为外链。
  const social = ['X', 'Discord', 'Reddit', 'Quora', 'Facebook'];
  return <><PageHero eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/>
    <div className="site-container py-24"><h2 className="text-xl font-semibold">{ui('owned')}</h2>
      <div className="mt-8 grid gap-8 md:grid-cols-2">{[{key:'forum',Icon:MessageCircle},{key:'feishu',Icon:Users}].map(({key,Icon}) => <div key={key} id={key} className="rounded-2xl border border-border p-8" aria-disabled="true" data-link-todo="{{TODO: 待确认}}"><Icon size={28} strokeWidth={1.5}/><h3 className="mt-5 text-2xl font-semibold">{ui(key)}</h3><p className="mt-4 text-muted-foreground">{ui.raw('todo') as string}</p></div>)}</div>
      <h2 className="mt-12 text-xl font-semibold">{ui('social')}</h2><div className="mt-6 flex flex-wrap gap-6">{social.map(name => <span key={name} className="inline-flex items-center gap-2 text-sm text-muted-foreground" aria-disabled="true" title={ui.raw('todo') as string}><MessageCircle size={18} strokeWidth={1.5} aria-hidden="true"/>{name}<span>{ui.raw('todo') as string}</span></span>)}</div>
    </div></>;
}
