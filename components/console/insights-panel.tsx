'use client';
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, FileText, FileSpreadsheet, Box } from 'lucide-react';
import type { Insights, Task } from './data';
import { modelOf } from './tasks-panel';

function Acc({ title, children, open: initial = true, count }: { title: string; children: ReactNode; open?: boolean; count?: number }) {
  const [open, setOpen] = useState(initial);
  return (
    <section className="wb-acc">
      <button onClick={() => setOpen(!open)} aria-expanded={open}><span>{title}</span>{count !== undefined && <span className="wb-pill" style={{ flex: 'none' }}>{count}</span>}{open ? <ChevronDown size={15} className="wb-muted" /> : <ChevronRight size={15} className="wb-muted" />}</button>
      {open && <div className="wb-acc-body">{children}</div>}
    </section>
  );
}

export function InsightsPanel({ data, onRegion, onHover }: { data: Insights; onRegion: (labels: string[]) => void; onHover: (labels: string[] | null) => void }) {
  const [view, setView] = useState<'table' | 'list'>('table');
  return (
    <div className="wb-panel"><div className="wb-panel-scroll">
      <Acc title="Overview">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span className="wb-pill accent">{data.kind}</span><span className="wb-muted">confidence {(data.confidence * 100).toFixed(0)}%</span></div>
        <div className="wb-meter" style={{ marginBottom: 10 }}><i style={{ width: `${data.confidence * 100}%` }} /></div>
        <p style={{ margin: '0 0 8px' }}>{data.summary}</p>
        <ul className="wb-muted" style={{ margin: 0, paddingLeft: 18 }}>{data.basis.map(b => <li key={b}>{b}</li>)}</ul>
      </Acc>
      <Acc title="Regions" count={data.regions.length}>
        <p className="wb-muted" style={{ marginTop: 0 }}>Click a region to select and focus it.</p>
        <div className="wb-regions">{data.regions.map(r => (
          <button key={r.name} className="wb-region" onClick={() => onRegion(r.labels)} onMouseEnter={() => onHover(r.labels)} onMouseLeave={() => onHover(null)}>
            <span className="wb-dot" style={{ background: r.tone }} />{r.name}<span className="wb-faint">{r.labels.length}</span>
          </button>))}</div>
      </Acc>
      <Acc title="Interactions" count={data.contacts.length}>
        <div className="wb-seg" style={{ marginBottom: 8 }}>{(['table', 'list'] as const).map(v => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{v === 'table' ? 'Table' : 'List'}</button>)}</div>
        {view === 'table'
          ? <table className="wb-table"><thead><tr><th>Type</th><th>Pair</th><th className="num">Å</th></tr></thead><tbody>{data.contacts.map((c, i) => <tr key={i}><td>{c.type}</td><td>{c.a} ↔ {c.b}</td><td className="num">{c.dist.toFixed(1)}</td></tr>)}</tbody></table>
          : data.contacts.map((c, i) => <div key={i} className="wb-row"><span className="wb-pill">{c.type}</span><span style={{ flex: 1 }}>{c.a} ↔ {c.b}</span><span className="wb-muted">{c.dist.toFixed(1)} Å</span></div>)}
      </Acc>
      <Acc title="Homologous proteins" count={data.homologs.length} open={false}>
        {data.homologs.map(h => <div key={h.id} className="wb-row"><b style={{ width: 84 }}>{h.id}</b><span className="wb-muted" style={{ flex: 1 }}>{h.note ?? ''} · {h.ref}</span><span>{h.identity.toFixed(1)}%</span></div>)}
      </Acc>
    </div></div>
  );
}

export function FilesPanel({ tasks, structures }: { tasks: Task[]; structures: { name: string; title: string }[] }) {
  const done = tasks.filter(t => t.status === 'done');
  return (
    <div className="wb-panel"><div className="wb-panel-scroll">
      <Acc title="Structures" count={structures.length}>
        {structures.map(s => <div key={s.name} className="wb-row"><Box size={15} className="wb-muted" /><b>{s.name}</b><span className="wb-muted" style={{ flex: 1 }}>{s.title}</span></div>)}
      </Acc>
      <Acc title="Task outputs" count={done.length}>
        {done.length === 0 && <div className="wb-empty">Finished tasks leave reports and tables here.</div>}
        {done.map(t => (
          <div key={t.id} className="wb-row">{modelOf(t.modelId)?.goal === 'score' ? <FileSpreadsheet size={15} className="wb-muted" /> : <FileText size={15} className="wb-muted" />}
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span><span className="wb-faint">{modelOf(t.modelId)?.goal === 'score' ? '.csv' : '.pdf'}</span></div>
        ))}
      </Acc>
    </div></div>
  );
}
