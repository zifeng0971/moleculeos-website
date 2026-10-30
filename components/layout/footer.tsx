'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SITE_CONFIG, localizeHref, type Locale } from '@/lib/site-config';
import { Logo } from './logo';

/** Quiet, small-type directory: brand line, four link columns, legal line. */
export function Footer({ locale }: { locale: Locale }) {
  const t = useTranslations('footer');
  const columns = ['product', 'resources', 'company', 'legal'] as const;
  return (
    <footer className="gfooter">
      <div className="gfooter-inner">
        <div className="gfooter-brand">
          <Logo locale={locale} size="footer" href={SITE_CONFIG.companyUrl} />
        </div>
        <nav className="gfooter-cols" aria-label="Footer">
          {columns.map((column) => (
            <div key={column}>
              <h2>{t(column)}</h2>
              <ul>
                {SITE_CONFIG.footer[column].map(([key, rawHref]) => { const href = rawHref.replace('{lang}', locale); return <li key={key}><Link href={localizeHref(href, locale)} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{t(key)}</Link></li>; })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="gfooter-legal">
          <p>© {new Date().getFullYear()} MoleculeMind. All rights reserved.</p>
          <ul className="gfooter-social" aria-label={locale === 'zh' ? '关注我们' : 'Follow us'}>
            {social(locale).map(item => <li key={item.key}><a href={item.href} title={item.label} aria-label={item.label} {...(item.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{item.icon}</a></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}

/** The five follow marks as filled glyphs in one style (24-unit box), so the row reads as one set; the icon set has no Feishu
    or WeChat mark, and mixing its outline icons with filled brand marks looked uneven. */
const mark = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true } as const;
function FeishuGlyph() {
  return <svg {...mark}>
    <path d="M5.4 3.2h7.5c1.3 0 2.5.8 3.1 2l2.2 4.7c-1.7-.6-3.5-.4-5 .6l-1.9 1.3L5.4 3.2Z" />
    <path d="M1.8 9.2 10.5 15.6c1.5 1.1 3.6 1.2 5.2.2l7.2-4.9c-1.9-1.3-4.5-1.3-6.5 0l-3.1 2.1c-1 .7-2.4.7-3.4 0L1.8 9.2Z" />
    <path d="M1.8 9.2v6.4c0 3 2.5 5.4 5.5 5.4h4.4c2.8 0 5.3-1.6 6.5-4.1l.3-.6c-2 1.1-4.4 1-6.2-.4L1.8 9.2Z" opacity=".72" />
  </svg>;
}
function WeChatGlyph() {
  return <svg {...mark}>
    <path d="M8.7 2.4C4 2.4.2 5.6.2 9.6c0 2.2 1.2 4.2 3 5.5.2.1.3.4.2.7l-.4 1.5c0 .1-.1.2-.1.3 0 .2.1.3.3.3h.2l1.9-1.1c.2-.1.5-.2.7-.1.9.3 1.9.4 2.8.4h.8c-.8-2.6.2-5 2-6.5 1.7-1.4 3.9-2 5.9-1.8-.6-3.6-4.2-6.4-8.8-6.4ZM5.8 6.1c.6 0 1.2.5 1.2 1.2s-.5 1.2-1.2 1.2-1.2-.5-1.2-1.2.6-1.2 1.2-1.2Zm5.8 0c.6 0 1.2.5 1.2 1.2s-.5 1.2-1.2 1.2-1.2-.5-1.2-1.2.6-1.2 1.2-1.2Z" />
    <path d="M17 9c-3.6 0-6.8 2.6-6.8 5.9s3.1 5.9 6.8 5.9c.8 0 1.6-.1 2.4-.3.2-.1.4 0 .6.1l1.6.9h.1c.1 0 .2-.1.2-.2v-.2l-.3-1.2v-.2c0-.2.1-.3.2-.4 1.6-1.1 2.5-2.8 2.5-4.6 0-3.2-3.1-5.8-6.8-5.8Zm-2.4 3.4c.5 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Zm4.8 0c.5 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1Z" />
  </svg>;
}
function LinkedInGlyph() {
  return <svg {...mark}><path fillRule="evenodd" d="M4.2 2h15.6c1.2 0 2.2 1 2.2 2.2v15.6c0 1.2-1 2.2-2.2 2.2H4.2C3 22 2 21 2 19.8V4.2C2 3 3 2 4.2 2Zm2.3 7.6v9h2.9v-9H6.5Zm1.5-4.5a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Zm3.6 4.5v9h2.9v-4.7c0-1.3.6-2.1 1.7-2.1 1 0 1.5.7 1.5 2v4.8h2.9v-5.5c0-2.6-1.4-3.8-3.3-3.8-1.4 0-2.3.7-2.8 1.4V9.6h-2.9Z" /></svg>;
}
function YouTubeGlyph() {
  return <svg {...mark}><path fillRule="evenodd" d="M22.6 7.3a2.8 2.8 0 0 0-2-2C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5a2.8 2.8 0 0 0-2 2C.9 9 .9 12 .9 12s0 3 .5 4.7a2.8 2.8 0 0 0 2 2c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.8 2.8 0 0 0 2-2c.5-1.7.5-4.7.5-4.7s0-3-.5-4.7ZM9.8 15.2V8.8l5.6 3.2-5.6 3.2Z" /></svg>;
}
function MailGlyph() {
  return <svg {...mark}>
    <path d="M3.4 4.8h17.2c1 0 1.8.7 2 1.6L12 13.1 1.4 6.4c.2-.9 1-1.6 2-1.6Z" />
    <path d="m1.3 8.6 10.2 6.4c.3.2.7.2 1 0l10.2-6.4v8.6c0 1.1-.9 2-2.1 2H3.4c-1.2 0-2.1-.9-2.1-2V8.6Z" />
  </svg>;
}

/** Follow links, grey-white icons beside the legal line. WeChat and YouTube have no address yet: they lead to the community
    page's "follow us" section, which names the WeChat account; swap in direct links when they exist. */
function social(locale: Locale) {
  const zh = locale === 'zh', follow = localizeHref('/community#follow', locale);
  return [
    { key: 'feishu', label: zh ? '飞书交流群' : 'Feishu group', href: 'https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=a87lcd52-da47-435d-bb36-1038968da336', icon: <FeishuGlyph /> },
    { key: 'wechat', label: zh ? '微信公众号' : 'WeChat', href: follow, icon: <WeChatGlyph /> },
    { key: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/company/moleculemind/', icon: <LinkedInGlyph /> },
    { key: 'youtube', label: 'YouTube', href: follow, icon: <YouTubeGlyph /> },
    { key: 'mail', label: zh ? '邮件' : 'Email', href: 'mailto:mos@moleculemind.com', icon: <MailGlyph /> },
  ];
}
