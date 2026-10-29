'use client';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Download, ListChecks, Loader2, Sparkles, X } from 'lucide-react';
import { AMINO, MODELS, scoreMatrix, type Task } from './data';

export const modelOf = (id: string) => MODELS.find(m => m.id === id);
export const isScore = (id: string) => modelOf(id)?.goal === 'score';
const ago = (t: number) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`; };

export function TasksPanel({ tasks, onOpen, onRun }: { tasks: Task[]; onOpen: (task: Task) => void; onRun: () => void }) {
  const [filter, setFilter] = useState<'all' | 'running' | 'done'>('all');
  const shown = tasks.filter(t => filter === 'all' || (filter === 'done' ? t.status === 'done' : t.status !== 'done'));
  return (
    <div className="wb-panel">
      <div style={{ padding: '12px 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="wb-seg">{(['all', 'running', 'done'] as const).map(f => <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
        <span className="wb-grow" />
        <button className="wb-btn sm" onClick={onRun}>New task</button>
      </div>
      <div className="wb-panel-scroll">
        {shown.length === 0 && <div className="wb-empty"><ListChecks size={20} style={{ margin: '0 auto 8px', display: 'block' }} />{tasks.length ? 'Nothing here.' : 'No tasks yet. Run a model from the dock, or ask Mocha.'}</div>}
        {shown.map(task => (
          <div key={task.id} className="wb-card wb-task">
            <div className="wb-task-top">
              {task.status === 'done' ? <CheckCircle2 size={16} color="var(--ok)" /> : task.status === 'running' ? <Loader2 size={16} className="wb-spin" color="var(--accent-text)" /> : <Clock size={16} className="wb-muted" />}
              <b title={task.name}>{task.name}</b>
              {task.by === 'mocha' && <span className="wb-pill accent"><Sparkles size={11} />Mocha</span>}
            </div>
            <small>{modelOf(task.modelId)?.name} · {task.input || task.structure} · {ago(task.created)}</small>
            {task.status !== 'done' && <div className="wb-meter"><i style={{ width: `${Math.max(4, task.progress)}%` }} /></div>}
            {task.status === 'done' && <div><button className="wb-btn sm" onClick={() => onOpen(task)}>View results</button></div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const heat = (v: number) => {
  const t = Math.max(0, Math.min(1, (v + 3) / 6));
  const stops = [[48, 63, 170], [74, 144, 226], [255, 245, 160], [255, 140, 70], [200, 30, 40]];
  const x = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
  return `rgb(${stops[i].map((c, k) => Math.round(c + (stops[i + 1][k] - c) * f)).join(',')})`;
};

export function ResultDialog({ task, sequence, onClose, onToast }: { task: Task; sequence: string; onClose: () => void; onToast: (text: string) => void }) {
  const model = modelOf(task.modelId);
  const cols = Math.min(48, sequence.length || 48);
  const canvas = useRef<HTMLCanvasElement>(null);
  const matrix = useRef(scoreMatrix(task.created % 9973, cols)).current;
  const [cell, setCell] = useState<string>('Hover a cell to read its score');
  const size = 18;
  useEffect(() => {
    if (!isScore(task.modelId)) return;
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    matrix.forEach((row, y) => row.forEach((v, x) => { ctx.fillStyle = heat(v); ctx.fillRect(x * size, y * size, size - 1, size - 1); }));
  }, [matrix, task.modelId]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  return (
    <div className="wb-scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="wb-dialog wide" role="dialog" aria-label="Task results">
        <div className="wb-dialog-head"><CheckCircle2 size={16} color="var(--ok)" /><h3>{task.name}</h3><span className="wb-pill">{model?.name}</span><button className="wb-icon sm" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        <div className="wb-dialog-body">
          {isScore(task.modelId) ? (<>
            <p className="wb-muted" style={{ marginTop: 0 }}>Score matrix. Rows are substitutions, columns are positions. Higher is better.</p>
            <div style={{ overflow: 'auto' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ display: 'grid', font: '10px var(--mono)', color: 'var(--faint)' }}>{AMINO.map(a => <span key={a} style={{ height: size, lineHeight: `${size}px` }}>{a}</span>)}</div>
                <canvas ref={canvas} className="wb-heat" width={cols * size} height={20 * size}
                  onMouseMove={event => { const r = event.currentTarget.getBoundingClientRect(); const x = Math.floor((event.clientX - r.left) / size), y = Math.floor((event.clientY - r.top) / size); if (matrix[y]?.[x] !== undefined) setCell(`${sequence[x] ?? '?'}${x + 1}${AMINO[y]} · score ${matrix[y][x].toFixed(2)}`); }} />
              </div>
              <div className="wb-faint" style={{ font: '10px var(--mono)', display: 'flex', gap: 0, marginLeft: 18, marginTop: 2 }}>{Array.from({ length: cols }, (_, i) => <span key={i} style={{ width: size, textAlign: 'center' }}>{sequence[i] ?? ''}</span>)}</div>
            </div>
            <p className="wb-pill accent" style={{ marginTop: 10 }}>{cell}</p>
          </>) : task.modelId === 'mmfold' ? (
            <table className="wb-table"><thead><tr><th>Candidate</th><th className="num">pLDDT</th><th className="num">pTM</th><th /></tr></thead>
              <tbody>{[['rank_1', 91.4, 0.88], ['rank_2', 89.7, 0.86], ['rank_3', 87.2, 0.83]].map(([n, a, b]) => (
                <tr key={n as string}><td>{n}.pdb</td><td className="num">{a}</td><td className="num">{b}</td><td style={{ textAlign: 'right' }}><button className="wb-btn sm" onClick={() => onToast(`${n}.pdb added to project`)}>Add to project</button></td></tr>))}</tbody></table>
          ) : (
            <table className="wb-table"><thead><tr><th>#</th><th>Candidate</th><th className="num">Score</th><th>Note</th></tr></thead>
              <tbody>{['H:S52Y', 'H:D56E', 'L:S92T', 'H:G98A', 'L:Y91W'].map((c, i) => (
                <tr key={c}><td>{i + 1}</td><td style={{ fontFamily: 'var(--mono)' }}>{c}</td><td className="num">{(2.1 - i * 0.31).toFixed(2)}</td><td className="wb-muted">{['Adds a contact to the epitope', 'Keeps the salt bridge', 'Fills a small cavity', 'Relieves backbone strain', 'Extends the π stack'][i]}</td></tr>))}</tbody></table>
          )}
        </div>
        <div className="wb-dialog-foot"><button className="wb-btn" onClick={() => onToast('results.csv downloaded (demo)')}><Download size={13} />Download CSV</button><button className="wb-btn primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}
