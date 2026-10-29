'use client';
// PLACEHOLDER (owner: E). Replace wholesale (you may split into several files); keep the exports from ui/index.ts.
import type { ReactNode } from 'react';
import type { Origin } from '../contracts';
import type { Gate } from '../evidence/types';

export function CiteChip(p: { badge: 'S' | 'M' | 'P' | 'PAT' | 'R'; label: string; origin: Origin; unverified?: boolean; onClick?(): void; onHover?(on: boolean): void }) {
  return <button className="v3u-cite" onClick={p.onClick} onMouseEnter={() => p.onHover?.(true)} onMouseLeave={() => p.onHover?.(false)}>{p.badge}·{p.label}{p.origin === 'demo' ? '·演示' : ''}</button>;
}
export function OriginMark(p: { origin: Origin; text?: boolean }) { return <span className="v3u-origin">{p.origin === 'demo' ? '演示' : p.origin === 'derived' ? '派生' : '真实'}</span>; }
export function GateDots(p: { gates: Gate[] }) { return <span className="v3u-gates">{p.gates.map(g => <i key={g.id} title={g.label} data-state={g.state} />)}</span>; }
export function BalanceBar(p: { supports: number; limits: number; gaps: number }) { return <span className="v3u-balance">支持 {p.supports} · 限制 {p.limits} · 空白 {p.gaps}</span>; }
export function Disclaimer(p: { kind: 'fto' | 'demo' | 'region-vs-claim' | 'absence'; scope?: string }) {
  const text = { fto: '筛查级别，不构成法律意见', demo: '演示数据，请勿当作结论', 'region-vs-claim': '区域覆盖 ≠ 权利要求覆盖', absence: '未见覆盖 ≠ 可自由实施' }[p.kind];
  return <span className="v3u-disclaimer">{text}{p.scope ? ` · ${p.scope}` : ''}</span>;
}
export function Segmented<T extends string>(p: { value: T; options: { id: T; label: string }[]; onChange(v: T): void }) {
  return <span className="v3u-seg">{p.options.map(o => <button key={o.id} aria-pressed={o.id === p.value} onClick={() => p.onChange(o.id)}>{o.label}</button>)}</span>;
}
export function Kbd(p: { children: ReactNode }) { return <kbd className="v3u-kbd">{p.children}</kbd>; }

// ---- shared structural primitives: everyone (A/B/C/D) uses these instead of rolling their own ----
import type { Evidence } from '../evidence/types';

/** A trigger plus a floating panel. Outside click / Esc → onOpenChange(false). The wrapper is `position: relative`. */
export function Popover(p: { trigger: ReactNode; open: boolean; onOpenChange(open: boolean): void; side?: 'top' | 'bottom'; align?: 'start' | 'end'; width?: number; className?: string; children: ReactNode }) {
  return <span className="v3u-popover-root">{p.trigger}{p.open && <div className={`v3u-popover ${p.className ?? ''}`} style={{ width: p.width }}>{p.children}</div>}</span>;
}
export interface MenuItem { id: string; label: string; hint?: string; icon?: ReactNode; disabled?: boolean; danger?: boolean; divider?: boolean }
export function Menu(p: { items: MenuItem[]; onSelect(id: string): void }) {
  return <div className="v3u-menu" role="menu">{p.items.map(i => i.divider ? <hr key={i.id} /> : <button key={i.id} role="menuitem" disabled={i.disabled} onClick={() => p.onSelect(i.id)}>{i.icon}{i.label}{i.hint && <span>{i.hint}</span>}</button>)}</div>;
}
export function Tooltip(p: { label: ReactNode; children: ReactNode }) { return <span className="v3u-tip" title={typeof p.label === 'string' ? p.label : undefined}>{p.children}</span>; }
export function IconButton(p: { label: string; onClick?(): void; pressed?: boolean; disabled?: boolean; children: ReactNode }) {
  return <button className="v3u-iconbtn" aria-label={p.label} aria-pressed={p.pressed} disabled={p.disabled} onClick={p.onClick} title={p.label}>{p.children}</button>;
}
export function Toggle(p: { checked: boolean; onChange(v: boolean): void; label: string }) {
  return <label className="v3u-toggle"><input type="checkbox" checked={p.checked} onChange={e => p.onChange(e.target.checked)} />{p.label}</label>;
}
/** The hover/popover card describing one evidence item: source, locator, stance, verification, mapping, origin. */
export function EvidenceCard(p: { evidence: Evidence; onOpen?(): void }) {
  return <div className="v3u-evcard"><b>{p.evidence.title}</b><p>{p.evidence.claim}</p>{p.onOpen && <button onClick={p.onOpen}>在证据带中打开</button>}</div>;
}
