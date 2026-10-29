'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Code2, DatabaseZap, FileKey2, Handshake, LockKeyhole, Monitor } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/reveal';
import { DataVault } from '@/components/motion/data-vault';
import { localizeHref, SITE_CONFIG, type Locale } from '@/lib/site-config';
import { Flow, Phrases } from '@/components/ui/phrase-title';

const securityIcons = [DatabaseZap, FileKey2, LockKeyhole];
const accessIcons = [Monitor, Code2, Handshake];
type Item = { title?: string; description: string; compactDescription: string };
type Diagram = { source: string; models: string; output: string; vault: string; tunnel: string };

const HOLD_SECONDS = 4.5;
// The data/IP vault diagram is parked for now (too busy); the ways-to-work deck then opens the section on its own.
const SHOW_VAULT = false;

/** Enterprise readiness: the data/IP pledges as a live diagram, then the ways to work with MOS as a depth track. */
export function EnterpriseSection({ locale }: { locale: Locale }) {
  const security = useTranslations('home.security');
  const access = useTranslations('home.access');
  const pledges = security.raw('items') as Item[];
  const diagram = security.raw('diagram') as Diagram;
  const modes = access.raw('items') as Item[];
  const scale = access.raw('scale') as string[];
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);
  useEffect(() => {
    if (!SHOW_VAULT || manual || reduce) return;
    const timer = setTimeout(() => setActive(index => (index + 1) % pledges.length), HOLD_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [active, manual, reduce, pledges.length]);
  const choose = (index: number) => { setManual(true); setActive(index); };

  return <section className="enterprise home-section-pad" data-nav-section="docs">
    <div className="site-container">
      {SHOW_VAULT && <><Reveal className="text-center">
        <p className="eyebrow eyebrow-solid">{security('eyebrow')}</p>
        <h2 className="section-title mx-auto"><Phrases text={security('title')} /></h2>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="vault">
          <div className="vault-stage">
            <DataVault active={active} />
            <span className="vault-label" data-tone="violet" style={{ left: '11%', top: '74%' }}>{diagram.source}</span>
            <span className="vault-label" data-tone="pink" data-on={active === 0 || undefined} style={{ left: '50%', top: '7%' }}>{diagram.models}</span>
            <span className="vault-label" data-tone="cyan" data-on={active === 2 || undefined} style={{ left: '28%', top: '40%' }}>{diagram.tunnel}</span>
            <span className="vault-label" data-tone="violet" data-on={active === 2 || undefined} style={{ left: '50%', top: '93%' }}>{diagram.vault}</span>
            <span className="vault-label" data-tone="mint" data-on={active === 1 || undefined} style={{ left: '89%', top: '74%' }}>{diagram.output}</span>
          </div>
          <div className="vault-promises" role="tablist">
            {pledges.map((item, i) => { const Icon = securityIcons[i]; return <button key={item.description} role="tab" aria-selected={active === i} className="vault-promise" data-tone={['pink', 'mint', 'cyan'][i]} data-active={active === i || undefined} onClick={() => choose(i)}>
              <span className="vault-promise-bar" aria-hidden="true">{active === i && !manual && !reduce && <i style={{ animationDuration: `${HOLD_SECONDS}s` }} />}{active === i && (manual || reduce) && <i className="vault-bar-full" />}</span>
              <span className="vault-promise-icon"><Icon size={18} strokeWidth={1.7} /></span>
              <strong>{item.title ?? item.compactDescription}</strong>
              <span>{item.title ? item.compactDescription : item.description}</span>
            </button>; })}
          </div>
          <Link href={localizeHref('/help', locale)} className="vault-link group">{security('whitepaper')}<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" /></Link>
        </div>
      </Reveal></>}

      <Reveal className={SHOW_VAULT ? "enterprise-access-head" : "enterprise-access-head enterprise-access-solo"}>
        <p className="eyebrow eyebrow-solid">{access('eyebrow')}</p>
        {SHOW_VAULT ? <h3><Phrases text={access('title')} /></h3> : <h2 className="section-title mx-auto"><Phrases text={access('title')} /></h2>}
      </Reveal>
      <Reveal delay={0.1}>
        {/* Three ways in, side by side and still: each with its sketch, title and full description; each carries a short tag. */}
        <div className="access-grid">
          {modes.map((item, i) => { const Icon = accessIcons[i]; return <Link key={item.description} href={i === 0 ? SITE_CONFIG.platformUrl : localizeHref(i === 1 ? '/help#mcp' : '/contact', locale)} {...(i === 0 ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="access-card">
            <span className="access-visual" aria-hidden="true">{i === 0 ? <BrowserSketch /> : i === 1 ? <ApiSketch /> : <OrbitSketch />}</span>
            <span className="access-card-head"><Icon size={18} strokeWidth={1.7} aria-hidden="true" />{scale[i] ? <em>{scale[i]}</em> : null}</span>
            <strong><Phrases text={item.title ?? item.compactDescription} /></strong>
            <span className="access-desc"><Flow text={item.title ? item.compactDescription : item.description} /></span>
            <ArrowUpRight size={18} className="access-go" aria-hidden="true" />
          </Link>; })}
        </div>
      </Reveal>
    </div>
  </section>;
}

function BrowserSketch() {
  return <span className="sk-browser">
    <span className="sk-bar"><i /><i /><i /><em>mos.moleculemind.com</em></span>
    <span className="sk-body">
      <span className="sk-mol">{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ '--k': k } as React.CSSProperties} />)}</span>
      <span className="sk-side"><b /><b /><b /><span className="sk-run" /></span>
    </span>
  </span>;
}

function ApiSketch() {
  const lines = ['POST /v1/tasks', '{ "target": "PD-L1",', '  "task": "affinity" }', '→ 200  candidates: 48'];
  return <span className="sk-code">{lines.map((line, k) => <code key={line} style={{ '--k': k } as React.CSSProperties}>{line}</code>)}<span className="sk-caret" /></span>;
}

/**
 * Joint R&D as a double helix: two strands (the two teams) bound by base pairs (the shared work), turning slowly.
 * Monochrome; depth is brightness only. Translating the group by one wavelength reads as rotation, so the loop is seamless.
 */
const HX = { lambda: 120, amp: 36, cy: 85, x0: -120, x1: 380, step: 2 };
const helixY = (x: number, strand: 1 | -1) => HX.cy + strand * HX.amp * Math.sin((2 * Math.PI * x) / HX.lambda);
const helixZ = (x: number) => Math.cos((2 * Math.PI * x) / HX.lambda);
// Strand segments split where depth changes sign (the peaks), so the front half of each turn can be drawn brighter.
const HELIX_SEGMENTS = (() => {
  const out: { d: string; strand: 1 | -1; front: boolean }[] = [];
  for (const strand of [1, -1] as const) {
    for (let a = HX.x0 - HX.lambda / 4; a < HX.x1; a += HX.lambda / 2) {
      const pts: string[] = [];
      for (let x = a; x <= a + HX.lambda / 2 + 0.01; x += HX.step) pts.push(`${x.toFixed(1)},${helixY(x, strand).toFixed(1)}`);
      out.push({ d: 'M' + pts.join(' L'), strand, front: helixZ(a + HX.lambda / 4) * strand > 0 });
    }
  }
  return out;
})();
const HELIX_RUNGS = Array.from({ length: Math.round((HX.x1 - HX.x0) / 10) }, (_, k) => HX.x0 + k * 10 + 5);

function OrbitSketch() {
  return <svg className="sk-helix" viewBox="0 0 260 170" aria-hidden="true">
    <defs>
      <linearGradient id="sk-helix-fade" x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".18" stopColor="#fff" /><stop offset=".82" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <mask id="sk-helix-mask"><rect width="260" height="170" fill="url(#sk-helix-fade)" /></mask>
    </defs>
    <g mask="url(#sk-helix-mask)">
      <g className="sk-helix-turn">
        {HELIX_RUNGS.map(x => { const z = helixZ(x); return <line key={x} x1={x} x2={x} y1={helixY(x, 1)} y2={helixY(x, -1)} stroke="#fff" strokeOpacity={(0.06 + 0.16 * Math.abs(z)).toFixed(3)} strokeWidth="1" />; })}
        {HELIX_SEGMENTS.filter(s => !s.front).map((s, k) => <path key={'b' + k} d={s.d} fill="none" stroke={s.strand > 0 ? '#F5F5F7' : '#8E8E93'} strokeOpacity=".28" strokeWidth="1.2" strokeLinecap="round" />)}
        {HELIX_SEGMENTS.filter(s => s.front).map((s, k) => <path key={'f' + k} d={s.d} fill="none" stroke={s.strand > 0 ? '#F5F5F7' : '#AEAEB2'} strokeWidth="1.8" strokeLinecap="round" />)}
        {HELIX_RUNGS.filter((_, k) => k % 2 === 0).map(x => { const z = helixZ(x); return <g key={'n' + x}>
          <circle cx={x} cy={helixY(x, 1)} r="1.9" fill="#F5F5F7" fillOpacity={(0.25 + 0.75 * Math.max(0, z)).toFixed(3)} />
          <circle cx={x} cy={helixY(x, -1)} r="1.9" fill="#AEAEB2" fillOpacity={(0.25 + 0.75 * Math.max(0, -z)).toFixed(3)} />
        </g>; })}
      </g>
    </g>
  </svg>;
}
