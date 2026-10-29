'use client';
import type { Origin, EvidenceKind } from '../contracts';
import type { Evidence, Gate } from '../evidence/types';

export type Badge = 'S' | 'M' | 'P' | 'PAT' | 'R';
export const BADGE_OF_KIND: Record<EvidenceKind, Badge> = { structure: 'S', model: 'M', paper: 'P', patent: 'PAT', risk: 'R', lab: 'S' };
const BADGE_NAME: Record<Badge, string> = { S: '结构事实', M: '模型打分', P: '论文', PAT: '专利', R: '风险' };

/** Shape per kind: S disc, M diamond, P square, PAT hexagon, R ring with "!". Colour comes from CSS (--k). */
export function KindGlyph({ badge, size = 11 }: { badge: Badge; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 12 12', 'aria-hidden': true, focusable: false } as const;
  switch (badge) {
    case 'S': return <svg {...common}><circle cx="6" cy="6" r="5" fill="currentColor" /></svg>;
    case 'M': return <svg {...common}><path d="M6 .8 11.2 6 6 11.2.8 6z" fill="currentColor" /></svg>;
    case 'P': return <svg {...common}><rect x="1.2" y="1.2" width="9.6" height="9.6" rx="1.4" fill="currentColor" /></svg>;
    case 'PAT': return <svg {...common}><path d="M6 .6 10.7 3.3v5.4L6 11.4 1.3 8.7V3.3z" fill="currentColor" /></svg>;
    case 'R': return <svg {...common}><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M6 3.6v3M6 8.3v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  }
}

export function CiteChip(p: { badge: Badge; label: string; origin: Origin; unverified?: boolean; onClick?(): void; onHover?(on: boolean): void }) {
  const demo = p.origin === 'demo';
  const name = BADGE_NAME[p.badge];
  const aria = `${name} ${p.label}${demo ? '，演示数据' : p.origin === 'derived' ? '，由坐标派生' : ''}${p.unverified ? '，未核验' : ''}`;
  return (
    <button
      type="button"
      className="v3u-cite"
      data-badge={p.badge}
      data-origin={p.origin}
      data-unverified={p.unverified ? '' : undefined}
      aria-label={aria}
      onClick={p.onClick}
      onMouseEnter={() => p.onHover?.(true)}
      onMouseLeave={() => p.onHover?.(false)}
      onFocus={() => p.onHover?.(true)}
      onBlur={() => p.onHover?.(false)}
    >
      <span className="v3u-cite-glyph"><KindGlyph badge={p.badge} /></span>
      <span className="v3u-cite-letter" aria-hidden="true">{p.badge}</span>
      <span className="v3u-cite-label">{p.label}</span>
      {p.unverified && <span className="v3u-cite-unv" aria-hidden="true" title="未核验">?</span>}
      {demo && <span className="v3u-cite-demo" aria-hidden="true">演示</span>}
    </button>
  );
}

const ORIGIN_TEXT: Record<Origin, string> = { real: '真实', derived: '派生', demo: '演示' };
const ORIGIN_TITLE: Record<Origin, string> = {
  real: '真实：来自公开结构坐标或已核对的元数据',
  derived: '派生：由真实坐标直接计算得出',
  demo: '演示数据，请勿当作结论',
};
export function OriginMark(p: { origin: Origin; text?: boolean }) {
  const showText = p.text !== false;
  const o = p.origin;
  return (
    <span className="v3u-origin" data-origin={o} data-text={showText ? '' : undefined} role="img" aria-label={ORIGIN_TITLE[o]} title={ORIGIN_TITLE[o]}>
      {o === 'real' && <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.2" fill="currentColor" /></svg>}
      {o === 'derived' && <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="M5 .8a4.2 4.2 0 0 0 0 8.4z" fill="currentColor" /></svg>}
      {(o === 'demo' ? true : showText) && <span aria-hidden="true">{ORIGIN_TEXT[o]}</span>}
    </span>
  );
}

const GATE_TEXT: Record<Gate['state'], string> = { pass: '通过', doubt: '有疑问', fail: '不通过', nodata: '无数据' };
export function GateDots(p: { gates: Gate[] }) {
  return (
    <span className="v3u-gates" role="group" aria-label={p.gates.map(g => `${g.label}${GATE_TEXT[g.state]}`).join('，')}>
      {p.gates.map(g => (
        <span key={g.id} className="v3u-gate" data-state={g.state} title={`${g.label}：${GATE_TEXT[g.state]}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            {g.state === 'pass' && <circle cx="5" cy="5" r="4.2" fill="currentColor" />}
            {g.state === 'doubt' && <><circle cx="5" cy="5" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M5 1.9a3.1 3.1 0 0 0 0 6.2z" fill="currentColor" /></>}
            {g.state === 'fail' && <circle cx="5" cy="5" r="3.7" fill="none" stroke="currentColor" strokeWidth="1.9" />}
            {g.state === 'nodata' && <circle cx="5" cy="5" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.1" strokeDasharray="1.7 1.5" />}
          </svg>
        </span>
      ))}
    </span>
  );
}

export function BalanceBar(p: { supports: number; limits: number; gaps: number }) {
  const total = p.supports + p.limits + p.gaps;
  const desc = `支持 ${p.supports}，限制 ${p.limits}，空白 ${p.gaps}`;
  return (
    <span className="v3u-balance" role="img" aria-label={desc} title={desc}>
      <span className="v3u-balance-bar" data-empty={total === 0 ? '' : undefined}>
        {p.supports > 0 && <i data-k="supports" style={{ flexGrow: p.supports }} />}
        {p.limits > 0 && <i data-k="limits" style={{ flexGrow: p.limits }} />}
        {p.gaps > 0 && <i data-k="gaps" style={{ flexGrow: p.gaps }} />}
      </span>
      <span className="v3u-balance-legend" aria-hidden="true">
        <span data-k="supports"><i />支持 {p.supports}</span>
        <span data-k="limits"><i />限制 {p.limits}</span>
        <span data-k="gaps"><i />空白 {p.gaps}</span>
      </span>
    </span>
  );
}

const DISC: Record<'fto' | 'demo' | 'region-vs-claim' | 'absence', string> = {
  fto: '筛查级别，不构成法律意见',
  demo: '演示数据，请勿当作结论',
  'region-vs-claim': '区域覆盖 ≠ 权利要求覆盖',
  absence: '未见覆盖 ≠ 可自由实施',
};
export function Disclaimer(p: { kind: 'fto' | 'demo' | 'region-vs-claim' | 'absence'; scope?: string }) {
  return (
    <span className="v3u-disclaimer" data-kind={p.kind}>
      <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="9" r="6.5" /><path d="M9 8.2v4M9 5.8v.1" /></svg>
      <span>{DISC[p.kind]}{p.scope ? <em> · 检索范围：{p.scope}</em> : null}</span>
    </span>
  );
}

const VERIF = { none: '未核验', auto: '自动抽取', metadata: '仅核对编号', human: '人工核验' } as const;
const STANCE = { measured: '实测', 'author-inferred': '作者推断', 'review-cited': '综述转引' } as const;
const SUPPORT = { supports: '支持', limits: '限制', neutral: '中性' } as const;
const MAPPING = { exact: '精确映射', aligned: '比对映射', inferred: '推断映射', unmapped: '未映射' } as const;

/** Hover/popover card for one evidence item: source, locator, stance, verification, mapping, origin. */
export function EvidenceCard(p: { evidence: Evidence; onOpen?(): void }) {
  const e = p.evidence;
  const badge = BADGE_OF_KIND[e.kind];
  const m = e.anchors[0]?.mapping;
  const rows: [string, string][] = [];
  rows.push(['来源', `${e.source.refId}${e.source.locator ? ` · ${e.source.locator}` : ''}`]);
  rows.push(['检索', `${e.source.retrievedAt}${e.source.dbVersion ? ` · ${e.source.dbVersion}` : ''}`]);
  if (e.stance) rows.push(['性质', STANCE[e.stance]]);
  rows.push(['核验', VERIF[e.verification]]);
  if (m) rows.push(['映射', `${MAPPING[m.method]}${m.method === 'aligned' && m.identity != null ? ` · 一致性 ${Math.round(m.identity * 100)}%` : ''}`]);
  rows.push(['倾向', SUPPORT[e.support]]);
  return (
    <div className="v3u-evcard" data-badge={badge} data-origin={e.origin}>
      <div className="v3u-evcard-head">
        <span className="v3u-evcard-kind"><KindGlyph badge={badge} /><b>{badge}</b></span>
        <OriginMark origin={e.origin} />
      </div>
      <div className="v3u-evcard-title">{e.title}</div>
      <p className="v3u-evcard-claim">{e.claim}</p>
      <dl className="v3u-evcard-rows">
        {rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      {e.value && <div className="v3u-evcard-value v3-num"><span>{e.value.label}</span><b>{e.value.num}{e.value.unit ? ` ${e.value.unit}` : ''}</b></div>}
      {e.confidenceNote && <p className="v3u-evcard-note">{e.confidenceNote}</p>}
      {e.risk && <p className="v3u-evcard-risk" data-level={e.risk.level}>{e.risk.reason}</p>}
      {e.origin === 'demo' && <Disclaimer kind="demo" />}
      {e.kind === 'patent' && <Disclaimer kind="region-vs-claim" />}
      {p.onOpen && <button type="button" className="v3u-btn is-ghost v3u-evcard-open" onClick={p.onOpen}>在证据带中打开</button>}
    </div>
  );
}
