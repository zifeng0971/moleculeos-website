'use client';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { CTAButton } from '@/components/ui/cta-button';
import type { Locale } from '@/lib/site-config';
import { PageHero } from './page-hero';
import { Flow } from '@/components/ui/phrase-title';

const FEISHU_URL = 'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=a87lcd52-da47-435d-bb36-1038968da336';

/**
 * Community: one live channel first (the Feishu group), then the programs being prepared, then the public channels.
 * Only Feishu is open. Everything else is listed as "coming soon" without a link until its account is confirmed;
 * swap `data-link-todo` for a real href once it is.
 */
export function CommunityPage() {
  const t = useTranslations('placeholderPage.community');
  const ui = useTranslations('communityPage');
  const locale = useLocale() as Locale;
  const tags = ui.raw('feishuTags') as string[];
  const channels = ui.raw('channels') as Record<'cn' | 'global', [string, string, string?][]>;
  const programs = [{ id: 'forum', title: ui('forum'), desc: ui('forumDesc') }, { id: 'academic', title: ui('academic'), desc: ui('academicDesc') }];

  return <><PageHero fx eyebrow={t('eyebrow')} title={t('title')} description={t('description')}/>
    <div className="cm site-container">
      <section className="cm-block">
        <Reveal delay={0.05}><a id="feishu" href={FEISHU_URL} target="_blank" rel="noopener noreferrer" className="cm-feature">
          <div className="cm-feature-main">
            <p className="cm-live"><i aria-hidden="true" />{ui('feishuLive')}</p>
            <h3>{ui('feishu')}</h3>
            <p><Flow text={ui('feishuDesc')} /></p>
            <span className="cm-cta">{ui('feishuCta')}<ArrowUpRight size={16} aria-hidden="true"/></span>
          </div>
          <ul className="cm-feature-list">{tags.map(tag => <li key={tag}>{tag}</li>)}</ul>
        </a></Reveal>
      </section>

      <section className="cm-block">
        <Reveal><h2 className="cm-head">{ui('sectionPrograms')}</h2></Reveal>
        <div className="cm-programs">{programs.map((p, i) => <Reveal key={p.id} delay={staggerDelay(i, programs.length)}>
          <div id={p.id} className="cm-program" aria-disabled="true" data-link-todo="{{TODO: 待确认}}">
            <span className="cm-soon">{ui('soon')}</span>
            <h3>{p.title}</h3>
            <p><Flow text={p.desc} /></p>
          </div>
        </Reveal>)}</div>
      </section>

      <section className="cm-block">
        <Reveal><h2 className="cm-head">{ui('sectionFollow')}</h2></Reveal>
        <div className="cm-channels">{(['cn', 'global'] as const).map(group => <Reveal key={group}>
          <div className="cm-channel-group">
            <p className="cm-group">{ui(group === 'cn' ? 'groupCn' : 'groupGlobal')}</p>
            <ul>{channels[group].map(([name, desc, href]) => <li key={name}>
              {href
                ? <a href={href} target="_blank" rel="noopener noreferrer"><strong>{name}</strong><span><Flow text={desc} /></span><em>↗</em></a>
                : <><strong>{name}</strong><span><Flow text={desc} /></span>{href === '' && <em>{ui('soon')}</em>}</>}
            </li>)}</ul>
          </div>
        </Reveal>)}</div>
      </section>

      <Reveal><section className="cm-contact">
        <div><h2>{ui('contactTitle')}</h2><p><Flow text={ui('contactDesc')} /></p></div>
        <CTAButton locale={locale} kind="secondary" />
      </section></Reveal>
    </div></>;
}
