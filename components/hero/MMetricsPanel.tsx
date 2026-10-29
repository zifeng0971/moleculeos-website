'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, ChartNoAxesCombined, ArrowUpRight, X, Copy, FolderOpen, History, CirclePlus, Upload, SendHorizontal, Atom, ListTree, Spline, Waypoints } from 'lucide-react';
import type { InteractionFocus } from './interaction-focus';
import { MMetricsNetwork } from './MMetricsNetwork';
import { rangeIds, useMM } from './mmetrics-dataset';
import { Liabilities, Suggestions } from './MMetricsInsights';

const SCHEMES = ['IMGT', 'Kabat', 'Chothia'] as const;
export type Scheme = (typeof SCHEMES)[number];

/** MOS-style analysis panel for the 4HT1 record; every residue chip drives the 3D viewer. */
export function MMetricsPanel({ tab, setTab, selected, toggle, toggleGroup, hover, notice, scheme, setScheme, setSelection, focusResidue, typeFilter, setTypeFilter, onInteraction }: {
  onInteraction?: (link: InteractionFocus | null) => void;
  setSelection: (values: string[]) => void; focusResidue: (value: string) => void; typeFilter: string[] | null; setTypeFilter: (types: string[] | null) => void
  tab: string; setTab: (tab: string) => void; selected: string[]; toggle: (value: string) => void; toggleGroup: (values: string[]) => void
  hover: (value: string | null) => void; notice: () => void; scheme: Scheme; setScheme: (scheme: Scheme) => void
}) {
  const t = useTranslations('mmetricsDemo');
  const { data: mmetrics, extras } = useMM();
  const panel = useRef<HTMLElement>(null);
  const [, force] = useState(0);
  useEffect(() => { const media = matchMedia('(min-width:1024px)'); const update = () => { const details = panel.current?.querySelector('details'); if (details) details.open = media.matches; force(n => n + 1); }; update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, [tab]);
  const chip = (value: string, label: string) => <button key={value} aria-pressed={selected.includes(value)} onClick={() => toggle(value)} onMouseEnter={() => hover(value)} onMouseLeave={() => hover(null)} onFocus={() => hover(value)} onBlur={() => hover(null)}>{label}</button>;
  const cdr = mmetrics.cdr[scheme];
  const fragment = (id: string) => mmetrics.chains.find(c => c.id === id)?.fragment;

  return <aside ref={panel} className="mm-panel">
    <div className="mm-tabs" role="tablist" aria-label="Analysis">
      <button role="tab" aria-selected={tab === 'mocha'} onClick={() => setTab('mocha')}><Bot size={17} aria-hidden="true" />Mocha</button>
      <button role="tab" aria-selected={tab === 'metrics'} onClick={() => setTab('metrics')}><ChartNoAxesCombined size={17} aria-hidden="true" />MMetrics</button>
      <X size={16} className="mm-tabs-close" aria-hidden="true" />
    </div>
    {tab === 'metrics' && <div className="mm-structures"><span data-on>{mmetrics.name.length > 17 ? `${mmetrics.name.slice(0, 17)}…` : mmetrics.name}</span></div>}
    {tab === 'mocha' ? <MochaPane notice={notice} /> : <div className="mm-panel-scroll" role="tabpanel"><>
      <section data-sec="desc"><p className="mm-section-label">DESCRIPTION</p><div className="mm-description-card">
        <div className="mm-tags"><span className="mm-category">● {mmetrics.description.category}</span><span className="mm-confidence">confidence: {mmetrics.description.confidence}</span></div>
        <p>{mmetrics.description.text}</p>
        <p className="mm-reasoning"><span>Reasoning</span>{mmetrics.description.reasoning}</p>
        <div className="mm-tags">{mmetrics.chains.map(c => <span key={c.id}><b>Chain {c.id}</b> · protein{c.fragment ? ` · ${c.fragment}` : ''}</span>)}</div>
      </div></section>
      <details className="mm-details" open><summary>{t('more')}</summary>
        <section data-sec="homologs"><p className="mm-section-label">HOMOLOGS</p><p className="mm-caption">{mmetrics.homologs.method}</p>
          {mmetrics.homologs.items.length === 0 && <div className="mm-annotation"><span className="mm-empty">{mmetrics.homologs.empty ?? 'No significant homologs found.'}</span></div>}
          {mmetrics.homologs.items.map(item => <div className="mm-homolog" key={item.id}><code>{item.id}</code>{item.type && <small>{item.type}</small>}<span>{item.identity}%</span>
            <a href={item.type ? `https://www.rcsb.org/structure/${item.id}` : `https://www.uniprot.org/uniprotkb/${item.id}/entry`} target="_blank" rel="noopener noreferrer">Reference <ArrowUpRight size={12} /></a></div>)}
        </section>
        <section data-sec="annotations"><p className="mm-section-label">ANNOTATIONS</p>
          <div className="mm-scheme"><span>CDR numbering</span>{SCHEMES.map(s => <button key={s} aria-pressed={scheme === s} onClick={() => setScheme(s)}>{s}</button>)}</div>
          <div className="mm-annotation"><strong>CDR</strong><small>{cdr.length} regions · {scheme}</small><div className="mm-chips">
            {cdr.map(region => { const ids = rangeIds(region.chain, region.from, region.to); const on = ids.every(v => selected.includes(v));
              return <button key={`${region.chain}${region.from}`} title={`${region.name}${fragment(region.chain) ? ` · ${fragment(region.chain)}` : ''}`} aria-pressed={on} onClick={() => toggleGroup(ids)} onMouseEnter={() => hover(ids[Math.floor(ids.length / 2)])} onMouseLeave={() => hover(null)}>{region.chain}:{region.from}–{region.to}</button>; })}
          </div></div>
          <div className="mm-annotation"><strong>Paratope</strong><small>{mmetrics.paratope.length} residues · structure</small><div className="mm-chips">{mmetrics.paratope.map(r => chip(r.id, r.label))}</div></div>
          <div className="mm-annotation"><strong>Epitope</strong><small>{mmetrics.epitope.length} residues · structure</small><div className="mm-chips">{mmetrics.epitope.map(r => chip(r.id, r.label))}</div></div>
          {(mmetrics.extraGroups ?? []).map(group => <div className="mm-annotation" key={group.title}><strong>{group.title}</strong><small>{(group.ranges?.length ?? group.residues?.length ?? 0)} residues · {group.unit}</small><div className="mm-chips">
            {group.ranges?.map(range => { const ids = rangeIds(range.chain, range.from, range.to); const on = ids.every(v => selected.includes(v)); return <button key={range.label} aria-pressed={on} onClick={() => toggleGroup(ids)} onMouseEnter={() => hover(ids[Math.floor(ids.length / 2)])} onMouseLeave={() => hover(null)}>{range.label}</button>; })}
            {group.residues?.map(r => chip(r.id, r.label))}
          </div></div>)}
        </section>
        {extras && <Liabilities scheme={scheme} selected={selected} toggleGroup={toggleGroup} hover={hover} />}
        <section data-sec="network"><MMetricsNetwork onInteraction={onInteraction} hover={hover} toggle={toggle} selected={selected} filter={typeFilter} setFilter={setTypeFilter} /></section>
        {extras && <Suggestions selected={selected} setSelectedSites={setSelection} focusSite={focusResidue} hover={hover} />}
      </details>
    </></div>}
  </aside>;
}

// Mocha as it appears in MOS: session header, greeting banner, the four starter functions and the composer.
const FUNCTIONS = [
  { icon: Atom, title: 'Predict Structure', desc: 'This module uses advanced deep learning methods to predict biomolecular structures and properties.' },
  { icon: ListTree, title: 'Sequence Redesign', desc: 'This module redesigns protein sequence based on the backbone structure.' },
  { icon: Spline, title: 'Mutation Effect', desc: 'This module uses structural fitness models to evaluate all potential mutations of a protein structure.' },
  { icon: Waypoints, title: 'Protein-Ligand Affinity', desc: 'This module uses statistical physics to estimate and adjust interatomic potentials.' },
];
function MochaPane({ notice }: { notice: () => void }) {
  const t = useTranslations('mmetricsDemo');
  const { data: mmetrics } = useMM();
  return <div className="mm-mocha" role="tabpanel">
    <div className="mm-mocha-head"><Bot size={18} /><strong>Mocha</strong><code>c40a5136-e</code><Copy size={13} className="mm-mocha-dim" />
      <span className="mm-mocha-actions"><FolderOpen size={15} /><History size={15} /><CirclePlus size={15} /></span></div>
    <div className="mm-mocha-body">
      <p className="mm-mocha-hello">I&apos;m <b>Mocha</b>, your AI assistant from MoleculeMind.</p>
      <p className="mm-mocha-label">YOU CAN START FROM THESE FUNCTIONS</p>
      <div className="mm-mocha-grid">{FUNCTIONS.map(({ icon: Icon, title, desc }) => <button key={title} className="mm-mocha-fn" onClick={notice}><strong><Icon size={14} />{title}</strong><span>{desc}</span></button>)}</div>
    </div>
    <div className="mm-mocha-composer" onClick={notice}>
      <span className="mm-mocha-tag">{mmetrics.name.length > 22 ? `${mmetrics.name.slice(0, 22)}…` : mmetrics.name}</span>
      <input readOnly aria-label={t('mochaInput')} placeholder="Paste a FASTA sequence, upload a PDB file, or ask me anything..." onKeyDown={event => { if (event.key === 'Enter') notice(); }} />
      <span className="mm-mocha-row"><span className="mm-mocha-upload"><Upload size={13} />Upload</span><span className="mm-mocha-send"><SendHorizontal size={14} /></span></span>
    </div>
  </div>;
}
