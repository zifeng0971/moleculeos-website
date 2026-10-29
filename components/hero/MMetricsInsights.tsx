'use client';
import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Crosshair, FlaskConical } from 'lucide-react';
import { mmetrics, residueLabel } from './mmetrics-data';
import { scanLiabilities, SUGGESTIONS, type Severity } from './mmetrics-insights';
import type { Scheme } from './MMetricsPanel';

const FRAGMENT: Record<string, string> = Object.fromEntries(mmetrics.chains.map(c => [c.id, c.fragment ?? '']));

/** Chemical-liability motifs found in the real VH / VL sequences. Click a row to light the residues in the 3D view. */
export function Liabilities({ scheme, selected, toggleGroup, hover }: { scheme: Scheme; selected: string[]; toggleGroup: (ids: string[]) => void; hover: (value: string | null) => void }) {
  const t = useTranslations('mmetricsDemo');
  const items = useMemo(() => scanLiabilities(scheme), [scheme]);
  const counts = (['high', 'mid', 'low'] as Severity[]).map(s => ({ s, n: items.filter(i => i.severity === s).length }));
  return <section aria-label="Liabilities" data-sec="liab"><p className="mm-section-label">{t('liabLabel')} <span className="mm-ins-badge">{t('example')}</span></p>
    <p className="mm-caption">{t('liabCaption')}</p>
    <div className="mm-ins-summary">{counts.map(({ s, n }) => <span key={s} data-sev={s}><i />{t(`sev.${s}`)} <b>{n}</b></span>)}</div>
    {items.length === 0 ? <p className="mm-ins-empty">{t('liabNone')}</p> : <ul className="mm-ins-list">{items.map(item => {
      const on = item.residues.every(r => selected.includes(r));
      return <li key={item.id}><button className="mm-liab" data-sev={item.severity} aria-pressed={on} onClick={() => toggleGroup(item.residues)} onMouseEnter={() => hover(item.residues[0])} onMouseLeave={() => hover(null)} onFocus={() => hover(item.residues[0])} onBlur={() => hover(null)}>
        <i aria-hidden="true" /><span className="mm-liab-main"><strong>{t(`rule.${item.rule}`)}</strong><small>{item.chain}:{item.from}{item.to > item.from ? `–${item.to}` : ''} · <code>{item.motif}</code></small></span>
        <em>{item.region === 'FR' ? t('framework') : item.region}</em><span className="mm-liab-sev">{t(`sev.${item.severity}`)}</span>
      </button></li>; })}</ul>}
  </section>;
}

/** Example mutation suggestions, built from real 4HT1 contacts and sequence motifs; clicking one frames it in the structure. */
export function Suggestions({ selected, setSelectedSites, focusSite, hover }: { selected: string[]; setSelectedSites: (ids: string[]) => void; focusSite: (id: string) => void; hover: (value: string | null) => void }) {
  const t = useTranslations('mmetricsDemo');
  const [open, setOpen] = useState<string | null>(SUGGESTIONS[0].id);
  return <section aria-label="Suggested mutations" data-sec="sug"><p className="mm-section-label">{t('sugLabel')} <span className="mm-ins-badge">{t('example')}</span></p>
    <p className="mm-caption">{t('sugCaption')}</p>
    <ul className="mm-ins-list">{SUGGESTIONS.map(s => {
      const copy = (k: string) => t(`suggest.${s.i18n}.${k}`);
      const isOpen = open === s.id, ids = [s.site, ...s.partners], on = ids.every(r => selected.includes(r));
      return <li key={s.id} className="mm-sug" data-kind={s.kind} data-open={isOpen || undefined}>
        <button className="mm-sug-head" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : s.id); if (!isOpen) { setSelectedSites(ids); focusSite(s.site); } }} onMouseEnter={() => hover(s.site)} onMouseLeave={() => hover(null)}>
          <span className="mm-sug-site"><b>{residueLabel(s.site).replace(/^[A-Z]:/, '')}</b><small>{FRAGMENT[s.site[0]]} · {s.site}</small></span>
          <span className="mm-sug-change">{s.to ? <><code>{s.wt}</code><span aria-hidden="true">→</span><code data-to>{s.to}</code></> : <code>{s.wt}</code>}</span>
          <span className="mm-sug-kind">{t(`kind.${s.kind}`)}</span><ChevronDown size={14} aria-hidden="true" />
        </button>
        {isOpen && <div className="mm-sug-body">
          <p><b>{t('basisLabel')}</b>{copy('basis')}</p>
          <p className="mm-sug-how">{copy('how')}</p>
          <p><b>{t('riskLabel')}</b>{copy('risk')}</p>
          <p><b><FlaskConical size={11} aria-hidden="true" />{t('expLabel')}</b>{copy('exp')}</p>
          <button className="mm-sug-view" aria-pressed={on} onClick={() => { setSelectedSites(ids); focusSite(s.site); }}><Crosshair size={12} aria-hidden="true" />{t('viewSite')}</button>
        </div>}
      </li>; })}</ul>
  </section>;
}
