'use client';

import Link from 'next/link';
import { ArrowRight, Code2, DatabaseZap, FileKey2, Handshake, LockKeyhole, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal, staggerDelay } from '@/components/motion/reveal';
import { InteractiveCard } from '@/components/ui/InteractiveCard';
import { localizeHref, type Locale } from '@/lib/site-config';
import { Phrases } from '@/components/ui/phrase-title';

const securityIcons = [DatabaseZap, FileKey2, LockKeyhole];
const accessIcons = [Monitor, Code2, Handshake];
type Item = { title: string; description: string; compactDescription: string };

/** Enterprise readiness: data/IP pledges as a bento, then the four ways to work with MOS. */
export function EnterpriseSection({ locale }: { locale: Locale }) {
  const security = useTranslations('home.security');
  const access = useTranslations('home.access');
  const pledges = security.raw('items') as Item[];
  const modes = access.raw('items') as Item[];
  return <section className="enterprise home-section-pad" data-nav-section="docs">
    <div className="site-container">
      <Reveal className="text-center">
        <p className="eyebrow eyebrow-solid">{security('eyebrow')}</p>
        <h2 className="section-title mx-auto"><Phrases text={security('title')} /></h2>
        <p className="section-copy mx-auto">{security('description')}</p>
      </Reveal>
      <div className="enterprise-bento mt-14">
        {pledges.map((item, i) => { const Icon = securityIcons[i]; return <Reveal key={item.title} delay={staggerDelay(i, pledges.length)} className={i === 0 ? 'enterprise-feature' : undefined}>
          <InteractiveCard tilt={false} glowRadius={360} className="enterprise-card h-full">
            <span className="enterprise-icon"><Icon size={22} strokeWidth={1.6} /></span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {i === 0 && <div className="enterprise-vault" aria-hidden="true"><span /><span /><span /></div>}
          </InteractiveCard>
        </Reveal>; })}
      </div>
      <Reveal className="mt-6 flex justify-center">
        <Link href={localizeHref('/help', locale)} className="group inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[#B6A6FF] transition-colors hover:text-white">
          {security('whitepaper')}<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </Reveal>

      <Reveal className="enterprise-access-head">
        <p className="eyebrow eyebrow-solid">{access('eyebrow')}</p>
        <h3><Phrases text={access('title')} /></h3>
      </Reveal>
      <div className="enterprise-access">
        {modes.map((item, i) => { const Icon = accessIcons[i]; return <Reveal key={item.title} delay={staggerDelay(i, modes.length)} className="h-full">
          <Link href={localizeHref(i === 0 ? '/help' : '/contact', locale)} className="enterprise-mode">
            <Icon size={20} strokeWidth={1.6} />
            <strong>{item.title}</strong>
            <span>{item.compactDescription}</span>
            <ArrowRight size={16} className="enterprise-mode-arrow" />
          </Link>
        </Reveal>; })}
      </div>
    </div>
  </section>;
}
