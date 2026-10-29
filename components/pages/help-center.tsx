'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, BookOpen, Code2, PlugZap } from 'lucide-react';
import { localizeHref, type Locale } from '@/lib/site-config';
import { DocsSearch } from '@/components/docs/docs-search';
import { ProteinField } from '@/components/motion/protein-field';
import { Reveal } from '@/components/motion/reveal';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpStories } from '@/components/pages/help-stories';
import { MMetricsDemo } from '@/components/hero/MMetricsDemo';
import { MosScale } from '@/components/hero/MosScale';
import { MODULE } from '@/lib/palette';
import { Flow, Phrases } from '@/components/ui/phrase-title';

type Case = { nav: string; title: string; tags: string[]; lead: string; body?: string[]; prompt?: string; after?: string[]; steps?: string[] };
// Each core feature wears the hue of the module it belongs to (lib/palette.ts): goal → agent, sequence → structure, overview and homologs → sequence,
// site location → structure, redesign → affinity, collaboration → agent.
const ACCENTS = [MODULE.agent, MODULE.structure, MODULE.sequence, MODULE.sequence, MODULE.structure, MODULE.affinity, MODULE.agent];

/**
 * Four views, one on screen at a time: core features, user stories, developers (API key + MCP) and FAQ.
 * The URL hash names the view (#guide, #stories, #dev, #faq); #case-N opens feature N, and the old #cases / #api / #mcp still resolve.
 */
/** Real MOS screenshots (2x, dark theme) that replace the illustration for a core feature. */
const SHOTS: Record<number, { src: string; zh: string; en: string }[]> = {
  0: [{ src: '01-mocha', zh: 'Mocha 接收目标，拆解任务并调用模型', en: 'Mocha taking the goal, breaking it down and calling models' }, { src: '01b-task', zh: 'Task：查看任务状态与类型', en: 'Task: status and type of each job' }],
  1: [{ src: '02-mmfold', zh: 'MMFold 任务详情：返回的结构文件与置信度', en: 'MMFold job details: returned structures and confidences' }, { src: '02b-residue', zh: '点击序列残基，三维视图中同步高亮', en: 'Clicking a residue highlights it in the 3D view' }],
  2: [{ src: '03c-prediction-description', zh: 'MMetrics · Description：蛋白类型与链组成', en: 'MMetrics · Description: protein type and chain composition' }, { src: '03b-annotations', zh: 'MMetrics · Annotations：选中 CDR 区域，结构同步高亮', en: 'MMetrics · Annotations: a selected CDR highlighted in the structure' }],
  3: [{ src: '04-seqsim', zh: 'SeqSim Search 结果：展开命中序列，含 Filter 与 Align', en: 'SeqSim Search results: an expanded hit, with Filter and Align' }, { src: '04b-align', zh: '多序列比对（Align）', en: 'Multiple sequence alignment (Align)' }],
  4: [{ src: '05-site', zh: 'Non-Covalent Bond：选中残基的氢键', en: 'Non-Covalent Bond: the hydrogen bond of a selected residue' }, { src: '05a-5a-filter', zh: '5Å：按距离和氨基酸种类筛选周围残基', en: '5Å: filtering nearby residues by distance and amino-acid type' }, { src: '05b-superimpose', zh: 'Superimpose：设置 Fixed 与 Moving 后叠合', en: 'Superimpose: setting Fixed and Moving structures' }, { src: '05c-annotation', zh: 'Annotation：保存位点与观察', en: 'Annotation: a saved site with notes' }],
  5: [{ src: '06-mutation', zh: 'Mutation Scoring：评分文件的查看与下载', en: 'Mutation Scoring: view and download the score files' }, { src: '06a-mutxseq-table', zh: 'MutXseq.csv 预览：链、突变与分数', en: 'MutXseq.csv preview: chain, mutation and score' }, { src: '06b-redesign', zh: 'Protein Redesign：输入残基与输出 FASTA', en: 'Protein Redesign: input residues and the output FASTA' }],
  6: [{ src: '07-share', zh: 'Share：邀请成员并设置 Read / Edit', en: 'Share: inviting a member with Read / Edit' }, { src: '07b-workspace', zh: 'Workspace：报告、数据表与结构文件', en: 'Workspace: reports, tables and structure files' }],
};
const VIEWS = ['guide', 'stories', 'dev', 'faq'] as const;
type View = (typeof VIEWS)[number];
const MCP_CONFIG = `{
  "mcpServers": {
    "mos-http-mcp": {
      "url": "https://mos.moleculemind.com/mcp",
      "headers": { "Authorization": "Bearer mos-sk-xxx" }
    }
  }
}`;
const ALIAS: Record<string, View> = { guide: 'guide', cases: 'guide', stories: 'stories', dev: 'dev', api: 'dev', mcp: 'dev', faq: 'faq' };

/** **bold** and `code` inside copy. */
function Rich({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => part.startsWith('**') ? <strong key={i}><Flow text={part.slice(2, -2)} /></strong> : part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}><Flow text={part} /></Fragment>)}</>;
}

/**
 * The screenshots of one feature: one large frame and a row of thumbnails that switch it, so every feature has the same
 * figure whether it has two shots or five. The caption of the shown shot sits under the frame.
 */
function ShotViewer({ shots, locale }: { shots: { src: string; zh: string; en: string }[]; locale: Locale }) {
  const [i, setI] = useState(0);
  const cap = (h: { zh: string; en: string }) => h[locale === 'en' ? 'en' : 'zh'];
  const shown = shots[Math.min(i, shots.length - 1)];
  return <div className="hc-case-figure">
    <figure className="hc-frame">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={shown.src} src={`/help-shots/${shown.src}.jpg`} alt={cap(shown)} width={1920} height={1200} decoding="async" />
      <figcaption><span>{String(i + 1).padStart(2, '0')}<small> / {String(shots.length).padStart(2, '0')}</small></span><p><Flow text={cap(shown)} /></p></figcaption>
    </figure>
    {shots.length > 1 && <ul className="hc-thumbs" role="tablist">{shots.map((h, k) => <li key={h.src}>
      <button role="tab" aria-selected={k === i} data-active={k === i || undefined} onClick={() => setI(k)} aria-label={cap(h)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/help-shots/${h.src}.jpg`} alt="" width={1920} height={1200} loading="lazy" decoding="async" />
      </button>
    </li>)}</ul>}
  </div>;
}

/** The example prompt types itself out once it scrolls into view. */
function Prompt({ label, text }: { label: string; text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(text.length); return; }
    let i = 0; const timer = setInterval(() => { i += 2; setN(Math.min(i, text.length)); if (i >= text.length) clearInterval(timer); }, 38);
    return () => clearInterval(timer);
  }, [seen, text]);
  return <div ref={ref} className="hc-prompt"><span className="hc-prompt-bar"><em>{label}</em></span><p aria-label={text}><span aria-hidden="true">{text.slice(0, n)}<b data-done={n >= text.length || undefined} /></span></p></div>;
}

export function HelpCenter({ locale, initial }: { locale: Locale; initial?: string }) {
  const t = useTranslations('helpCenter');
  const docs = useTranslations('docsPage');
  const mm = useTranslations('mmetricsDemo');
  const cases = t.raw('cases') as Case[];
  const [view, setView] = useState<View>(ALIAS[initial ?? ''] ?? 'guide');
  const [sel, setSel] = useState(0);
  const top = useRef<HTMLDivElement>(null);
  const view_ = useRef<HTMLDivElement>(null);

  // Brings the view switch to the top of the screen, so a change of view always starts from its beginning.
  // After switching view or feature, the new content starts at the top of the screen (below the sticky bars), never mid-way.
  // Nothing moves if the visitor is still near the page top and can see its start anyway.
  const toTop = () => requestAnimationFrame(() => {
    const el = view_.current; if (!el) return;
    if (el.getBoundingClientRect().top > 130) return;
    el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  const go = useCallback((next: View, feature?: number) => {
    setView(next);
    if (feature !== undefined) setSel(feature);
    history.replaceState(null, '', '#' + (next === 'guide' && feature !== undefined ? `case-${feature + 1}` : next));
    toTop();
  }, []);

  useEffect(() => {
    const open = (hash: string) => {
      const m = /^#case-(\d)$/.exec(hash);
      if (m && +m[1] >= 1 && +m[1] <= cases.length) { setView('guide'); setSel(+m[1] - 1); return true; }
      const v = ALIAS[hash.slice(1)]; if (v) { setView(v); return true; }
      return false;
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]'); const href = a?.getAttribute('href');
      if (href && open(href)) { e.preventDefault(); history.replaceState(null, '', href); toTop(); }
    };
    const onHash = () => open(location.hash);
    open(location.hash);
    document.addEventListener('click', onClick);
    addEventListener('hashchange', onHash);
    return () => { document.removeEventListener('click', onClick); removeEventListener('hashchange', onHash); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const labels: Record<View, string> = { guide: t('navCore'), stories: t('navCases'), dev: t('navDev'), faq: t('navFaq') };
  const c = cases[sel];

  return <div className="hc">
    <section className="hc-hero">
      <ProteinField className="px-field" calmSelector=".hc-hero-copy" />
      <div className="px-hero-fade" aria-hidden="true" />
      <div className="site-container hc-hero-copy">
        <Reveal>
          <p className="eyebrow eyebrow-solid">{t('eyebrow')}</p>
          <h1 className="px-title hc-title"><Phrases text={t('title')} /></h1>
          <p className="hc-lead"><Flow text={t('lead')} /></p>
          <div className="hc-search"><DocsSearch locale={locale} /></div>
        </Reveal>
      </div>
    </section>

    <div ref={top} className="hc-switch-bar">
      <div className="site-container hc-switch-row">
        <div className="hc-switch" role="tablist" aria-label={t('eyebrow')}>
          {VIEWS.map(v => <button key={v} role="tab" aria-selected={view === v} data-active={view === v || undefined} onClick={() => go(v)}>{labels[v]}</button>)}
        </div>
        <Link href={localizeHref('/help/manual', locale)} className="hc-switch-out"><BookOpen size={14} aria-hidden="true" />{t('more.manual')}<ArrowUpRight size={13} aria-hidden="true" /></Link>
      </div>
    </div>

    <div ref={view_} className="site-container hc-view" role="tabpanel" aria-label={labels[view]}>
      {view === 'guide' && <div className="hc-guide">
        <nav className="hc-index" aria-label={t('navCore')}>
          <p className="hc-index-title">{t('flowLabel')}</p>
          <ol>{cases.map((x, i) => <li key={x.nav}><button data-active={sel === i || undefined} style={{ '--c': ACCENTS[i] } as CSSProperties} onClick={() => go('guide', i)}><i>{String(i + 1).padStart(2, '0')}</i>{x.nav}</button></li>)}</ol>
          <Link href={localizeHref('/help/manual', locale)} className="hc-index-manual"><BookOpen size={15} aria-hidden="true" />{t('indexManual')}<ArrowUpRight size={13} aria-hidden="true" /></Link>
        </nav>
        <Reveal key={sel}><article id={`case-${sel + 1}`} className="hc-case" style={{ '--c': ACCENTS[sel] } as CSSProperties}>
          <header>
            <p className="hc-kicker"><span>{t('caseLabel')} {String(sel + 1).padStart(2, '0')}</span>{c.tags.map(tag => <em key={tag}>{tag}</em>)}</p>
            <h2><Phrases text={c.title} /></h2>
            <p className="hc-case-lead"><Flow text={c.lead} /></p>
          </header>
          <ShotViewer key={sel} shots={SHOTS[sel]} locale={locale} />
          <div className="hc-case-text">
            {c.body?.map(p => <p key={p}><Rich text={p} /></p>)}
            {c.prompt && <Prompt label={t('exampleLabel')} text={c.prompt} />}
            {c.after?.map(p => <p key={p}><Rich text={p} /></p>)}
            {c.steps && <><p className="hc-path-label">{t('pathLabel')}</p><ol className="hc-steps">{c.steps.map((s, k) => <li key={k}><span>{k + 1}</span><p><Rich text={s} /></p></li>)}</ol></>}
          </div>
          <nav className="hc-detail-nav">
            {sel > 0 ? <button onClick={() => go('guide', sel - 1)}><small>←</small>{cases[sel - 1].nav}</button> : <span />}
            {sel < cases.length - 1 && <button onClick={() => go('guide', sel + 1)}>{cases[sel + 1].nav}<small>→</small></button>}
          </nav>
        </article></Reveal>
      </div>}

      {view === 'stories' && <section className="hc-stories">
        <header className="hc-view-head"><h2><Phrases text={t('stories.title')} /></h2><p><Flow text={t('stories.lead')} /></p></header>
        <HelpStories locale={locale} mm={<div className="hc-demo"><div className="wf-mm"><MosScale label={{ expand: mm('expand'), collapse: mm('collapse') }}><MMetricsDemo locale={locale} autoLoad /></MosScale></div></div>} />
      </section>}

      {view === 'dev' && <Reveal><div className="hc-dev">{(['api', 'mcp'] as const).map(k => <section key={k} id={k} className="hc-dev-card">
        <span className="hc-dev-icon">{k === 'api' ? <Code2 size={20} aria-hidden="true" /> : <PlugZap size={20} aria-hidden="true" />}</span>
        {k === 'api' && <span className="hc-badge">{t('soon')}</span>}
        <h2><Phrases text={t(`${k}.title`)} /></h2><p><Flow text={t(`${k}.lead`)} /></p><em><Flow text={t(`${k}.body`)} /></em>
        {k === 'mcp' && <div className="hc-mcp">
          <h3>{t('mcp.configLabel')}</h3>
          <pre>{MCP_CONFIG}</pre>
          <h3>{t('mcp.exampleLabel')}</h3>
          <pre>{t('mcp.example')}</pre>
          <h3>{t('mcp.toolsLabel')}</h3>
          <dl>{(t.raw('mcp.tools') as { name: string; desc: string }[]).map(tool => <div key={tool.name}><dt>{tool.name}</dt><dd>{tool.desc}</dd></div>)}</dl>
        </div>}
      </section>)}</div></Reveal>}

      {view === 'faq' && <Reveal><section className="hc-faq">
        <header className="hc-view-head"><h2><Phrases text={t('faq.title')} /></h2><p><Flow text={t('faq.lead')} /></p></header>
        <Accordion type="single" collapsible defaultValue="group-0" className="help-faq help-faq-groups">{(t.raw('faq.groups') as { title: string; items: number[] }[]).map((group, g) => <AccordionItem key={g} value={'group-' + g}>
          <AccordionTrigger><span className="help-faq-group-title">{group.title}</span></AccordionTrigger>
          <AccordionContent><Accordion type="single" collapsible className="help-faq help-faq-inner">{group.items.map(i => { const faq = (docs.raw('faqs') as string[][])[i]; return <AccordionItem key={i} value={'faq-' + i}><AccordionTrigger>{faq[0]}</AccordionTrigger><AccordionContent className="whitespace-pre-line">{faq[1]}</AccordionContent></AccordionItem>; })}</Accordion></AccordionContent>
        </AccordionItem>)}</Accordion>
      </section></Reveal>}
    </div>

    <section className="hc-more">
      <div className="site-container">
        <h2>{t('more.title')}</h2>
        <div className="hc-more-grid">
          <Link href={localizeHref('/help/manual', locale)} className="hc-more-card group"><BookOpen size={18} aria-hidden="true" /><strong>{t('more.manual')}</strong><span>{t('more.manualBody')}</span><ArrowUpRight size={15} className="hc-more-go" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  </div>;
}
