'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, Play, Search, X } from 'lucide-react';
import { GOALS, MODELS, type ModelDef, type StructureDef } from './data';
import type { ChainInfo, LigandInfo } from './molstar-lite';

type Props = {
  initial?: string; structure: StructureDef; chains: ChainInfo[]; ligands: LigandInfo[]; selection: string[];
  onSubmit: (task: { modelId: string; name: string; input: string }) => void; onClose: () => void;
};

const NEED_LABEL = { sequence: 'Sequence', structure: 'Structure', residues: 'Residues', ligand: 'Ligand' } as const;

export function RunDialog(p: Props) {
  const [query, setQuery] = useState('');
  const [modelId, setModelId] = useState(p.initial ?? 'mmfold');
  const model = MODELS.find(m => m.id === modelId) as ModelDef;
  const [chain, setChain] = useState(() => (p.selection[0]?.split(':')[0]) ?? p.chains[0]?.auth ?? '');
  const sequence = useMemo(() => p.chains.find(c => c.auth === chain)?.residues.map(r => r.code).join('') ?? '', [p.chains, chain]);
  const [seq, setSeq] = useState(sequence);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [ligand, setLigand] = useState(p.ligands[0]?.name ?? '');
  useEffect(() => setSeq(sequence), [sequence]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MODELS.filter(m => !q || (m.name + m.summary).toLowerCase().includes(q));
  }, [query]);
  const ligandNames = [...new Set(p.ligands.map(l => l.name))];
  const missing = (model.needs.includes('sequence') && !seq.trim())
    || (model.needs.includes('residues') && p.selection.length === 0)
    || (model.needs.includes('ligand') && ligandNames.length === 0);

  const submit = () => p.onSubmit({
    modelId, name: name.trim() || `${model.name} · ${p.structure.name}`,
    input: [model.needs.includes('sequence') ? `chain ${chain}, ${seq.trim().length} aa` : '', model.needs.includes('residues') ? `${p.selection.length} residues` : '', model.needs.includes('ligand') ? ligand : ''].filter(Boolean).join(' · '),
  });
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') p.onClose(); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [p]);

  return (
    <div className="wb-scrim" onMouseDown={event => { if (event.target === event.currentTarget) p.onClose(); }}>
      <div className="wb-dialog" role="dialog" aria-label="Run a model">
        <div className="wb-dialog-head"><Play size={16} className="wb-muted" /><h3>Run a model</h3><button className="wb-icon sm" onClick={p.onClose} aria-label="Close"><X size={16} /></button></div>
        <div className="wb-run">
          <div className="wb-run-list">
            <div style={{ position: 'relative' }}>
              <input className="wb-input" autoFocus placeholder="Search models…" value={query} onChange={event => setQuery(event.target.value)} style={{ paddingLeft: 30 }} />
              <Search size={14} className="wb-faint" style={{ position: 'absolute', left: 10, top: 11 }} />
            </div>
            {GOALS.map(goal => {
              const items = list.filter(m => m.goal === goal.id);
              if (!items.length) return null;
              return (
                <div key={goal.id}>
                  <div className="wb-goal">{goal.label}</div>
                  {items.map(m => <button key={m.id} className={`wb-model ${m.id === modelId ? 'on' : ''}`} onClick={() => setModelId(m.id)}><b>{m.name}</b><span>{m.eta}</span></button>)}
                </div>
              );
            })}
            {list.length === 0 && <div className="wb-empty" style={{ marginTop: 10 }}>No model matches “{query}”.</div>}
          </div>
          <div className="wb-run-form">
            <h4>{model.name}</h4>
            <p>{model.summary}</p>
            <div className="wb-needs">{model.needs.map(n => <span key={n} className="wb-pill accent">Needs {NEED_LABEL[n].toLowerCase()}</span>)}<span className="wb-pill">{model.eta}</span></div>

            <label className="wb-label" htmlFor="wb-task-name">Task name<small>optional</small></label>
            <input id="wb-task-name" className="wb-input" placeholder={`${model.name} · ${p.structure.name}`} value={name} onChange={event => setName(event.target.value)} />

            {model.needs.includes('structure') && (<>
              <label className="wb-label">Structure</label>
              <div className="wb-card" style={{ padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}><Check size={14} className="wb-muted" /><b>{p.structure.name}</b><span className="wb-muted">{p.structure.title}</span></div>
            </>)}
            {model.needs.includes('sequence') && (<>
              <label className="wb-label">Sequence<small>prefilled from {p.selection.length ? 'your selection' : 'the structure'}</small></label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <select className="wb-select" style={{ width: 150 }} value={chain} onChange={event => setChain(event.target.value)} aria-label="Chain">
                  {p.chains.map(c => <option key={c.auth} value={c.auth}>Chain {c.auth}</option>)}
                </select>
                <span className="wb-muted" style={{ alignSelf: 'center' }}>{seq.trim().length} aa</span>
              </div>
              <textarea className="wb-textarea" style={{ fontFamily: 'var(--mono)', fontSize: 12 }} rows={4} value={seq} onChange={event => setSeq(event.target.value.replace(/\s/g, '').toUpperCase())} />
            </>)}
            {model.needs.includes('residues') && (<>
              <label className="wb-label">Residues<small>from the viewer selection</small></label>
              {p.selection.length
                ? <div className="wb-res-list" style={{ maxHeight: 'none', marginTop: 0 }}>{p.selection.map(l => <span key={l}>{l}</span>)}</div>
                : <div className="wb-empty">Close this dialog, select residues in the structure or sequence, then run again.</div>}
            </>)}
            {model.needs.includes('ligand') && (<>
              <label className="wb-label">Ligand</label>
              {ligandNames.length
                ? <select className="wb-select" value={ligand} onChange={event => setLigand(event.target.value)}>{ligandNames.map(n => <option key={n}>{n}</option>)}</select>
                : <div className="wb-empty">This structure has no ligand.</div>}
            </>)}

            <label className="wb-label" htmlFor="wb-task-note">Description<small>optional</small></label>
            <textarea id="wb-task-note" className="wb-textarea" rows={2} maxLength={200} value={note} onChange={event => setNote(event.target.value)} />
          </div>
        </div>
        <div className="wb-dialog-foot">
          <button className="wb-btn" onClick={p.onClose}>Cancel</button>
          <button className="wb-btn primary" disabled={missing} onClick={submit}><Play size={13} />Run · {model.eta}</button>
        </div>
      </div>
    </div>
  );
}
