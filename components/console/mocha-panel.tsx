'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Dna, FlaskConical, Loader2, Paperclip, Search, SendHorizontal, Sparkles, Target } from 'lucide-react';
import { MOCHA_SAMPLES, type Task } from './data';

type Step = { label: string; detail: string; modelId?: string; taskId?: string; state: 'wait' | 'run' | 'done' };
type Msg = { id: number; role: 'user'; text: string } | { id: number; role: 'ai'; steps: Step[]; finished: boolean };

const PLAN = (structure: string): Step[] => [
  { label: 'Read your request', detail: `Using ${structure} as context`, state: 'wait' },
  { label: 'Predict the complex structure', detail: 'Structure prediction', modelId: 'mmfold', state: 'wait' },
  { label: 'Score every substitution', detail: 'Mutation effect · sequence fitness', modelId: 'seqfit', state: 'wait' },
  { label: 'Rank candidates', detail: 'Filter out interface residues, keep top 30', state: 'wait' },
];
const ICONS = { humanize: Dna, affinity: Target, homology: Search, epitope: FlaskConical } as const;
const CANDIDATES: Record<string, [string, number, string][]> = {
  '2FJG': [['H:S52Y', 2.14, 'Adds a contact to the epitope'], ['H:D56E', 1.82, 'Keeps the salt bridge'], ['L:S92T', 1.61, 'Fills a small cavity'], ['H:G98A', 1.37, 'Relieves backbone strain'], ['L:Y91W', 1.12, 'Extends the π stack']],
  default: [['A:S131A', 1.94, 'Opens the catalytic cleft'], ['A:W156F', 1.55, 'Relaxes ring packing'], ['A:M132L', 1.31, 'Keeps hydrophobic contact'], ['A:Y58F', 1.08, 'Removes a strained H-bond'], ['A:D177E', 0.9, 'Preserves the acid position']],
};

type Props = {
  tasks: Task[]; structure: string; selection: string[];
  addTask: (task: { modelId: string; name: string; input: string; by: 'mocha' }) => string;
  onSelect: (labels: string[]) => void; onShowTasks: () => void;
};

export function MochaPanel({ tasks, structure, selection, addTask, onSelect, onShowTasks }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const started = useRef(new Set<string>());
  const scroller = useRef<HTMLDivElement>(null);
  const next = useRef(1);
  const candidates = CANDIDATES[structure] ?? CANDIDATES.default;

  const send = (text: string) => {
    const t = text.trim(); if (!t) return;
    setMessages(m => [...m, { id: next.current++, role: 'user', text: t }, { id: next.current++, role: 'ai', steps: PLAN(structure), finished: false }]);
    setDraft('');
  };

  // Drive the plan: each model step becomes a real task and finishes when that task does.
  useEffect(() => {
    const ai = [...messages].reverse().find(m => m.role === 'ai' && !m.finished);
    if (!ai || ai.role !== 'ai') return;
    const index = ai.steps.findIndex(s => s.state !== 'done');
    if (index < 0) { setMessages(ms => ms.map(m => m.id === ai.id && m.role === 'ai' ? { ...m, finished: true } : m)); return; }
    const step = ai.steps[index];
    const key = `${ai.id}:${index}`;
    const patch = (change: Partial<Step>) => setMessages(ms => ms.map(m => m.id === ai.id && m.role === 'ai' ? { ...m, steps: m.steps.map((s, i) => i === index ? { ...s, ...change } : s) } : m));
    if (step.state === 'wait' && !started.current.has(key)) {
      started.current.add(key);
      if (step.modelId) {
        const taskId = addTask({ modelId: step.modelId, name: `${step.detail} · ${structure}`, input: structure, by: 'mocha' });
        patch({ state: 'run', taskId });
      } else { patch({ state: 'run' }); setTimeout(() => patch({ state: 'done' }), 1100); }
    } else if (step.state === 'run' && step.taskId && tasks.find(t => t.id === step.taskId)?.status === 'done') patch({ state: 'done' });
  }, [messages, tasks, addTask, structure]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  return (
    <div className="wb-panel">
      <div className="wb-chat" ref={scroller}>
        {messages.length === 0 && (
          <>
            <div className="wb-hero">
              <div className="wb-mark"><Sparkles size={20} /></div>
              <h3>What can I do for you?</h3>
              <p>I’m Mocha. Describe a goal; I’ll pick the models and run them in this project.</p>
            </div>
            <div className="wb-samples">
              {MOCHA_SAMPLES.map(s => { const Icon = ICONS[s.icon]; return (
                <button key={s.id} className="wb-sample" onClick={() => send(`${s.title}: ${s.body}`)}><Icon size={18} className="wb-muted" /><div><b>{s.title}</b><span>{s.body}</span></div></button>
              ); })}
            </div>
          </>
        )}
        {messages.map(m => m.role === 'user'
          ? <div key={m.id} className="wb-msg">{m.text}</div>
          : (
            <div key={m.id} className="wb-ai">
              <div className="wb-card wb-plan">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}><Sparkles size={14} color="var(--accent-text)" />Plan</div>
                {m.steps.map((s, i) => (
                  <div key={i} className={`wb-step ${s.state}`}>
                    <span className="ic">{s.state === 'done' ? <Check size={12} /> : s.state === 'run' ? <Loader2 size={12} className="wb-spin" /> : i + 1}</span>
                    <div><div>{s.label}</div><small>{s.detail}{s.modelId && s.state !== 'wait' ? ' · see Tasks' : ''}</small></div>
                  </div>
                ))}
                {m.steps.some(s => s.taskId) && <button className="wb-btn sm" style={{ justifySelf: 'start' }} onClick={onShowTasks}>Open tasks</button>}
              </div>
              {m.finished && (
                <div className="wb-card wb-plan">
                  <div style={{ fontWeight: 600 }}>Recommended mutations</div>
                  <table className="wb-table"><thead><tr><th>Mutation</th><th className="num">Score</th><th>Why</th></tr></thead>
                    <tbody>{candidates.map(([c, s, why]) => <tr key={c}><td style={{ fontFamily: 'var(--mono)' }}>{c}</td><td className="num">{s.toFixed(2)}</td><td className="wb-muted">{why}</td></tr>)}</tbody></table>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="wb-btn sm" onClick={() => onSelect(candidates.map(([c]) => c.replace(/^([A-Z]):[A-Z](\d+)[A-Z]$/, '$1:$2')))}>Highlight in structure</button>
                    <button className="wb-btn sm">Download report</button>
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
      <div className="wb-compose">
        <div className="wb-compose-box">
          <div className="wb-ctx"><span className="wb-pill"><Paperclip size={11} />{structure}</span>{selection.length > 0 && <span className="wb-pill accent">{selection.length} residues selected</span>}</div>
          <textarea placeholder="Ask Mocha to design, predict or analyse…" value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(draft); } }} />
          <div className="wb-compose-foot"><span className="wb-faint" style={{ flex: 1 }}>Enter to send · Shift+Enter for a new line</span>
            <button className="wb-send" disabled={!draft.trim()} onClick={() => send(draft)} aria-label="Send"><SendHorizontal size={15} /></button></div>
        </div>
      </div>
    </div>
  );
}
