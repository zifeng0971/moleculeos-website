'use client';
import { Fragment, useState, type ReactNode } from 'react';
import { ArrowRight, Box, Check, ChevronRight, CircleDashed, Copy, FileSpreadsheet, Lightbulb, Loader2, ShieldAlert, X } from 'lucide-react';
import { CHAIN_COLORS, plddtColor, rampColor, ROLE_NAMES } from './model';
import { MODEL_ROWS, type Block, type Msg, type TabSpec } from './agent';

export type TranscriptHandlers = {
  onResidue: (label: string) => void;
  onOpen: (tab: TabSpec) => void;
  onApprove: (toolId: string, decision: 'once' | 'always' | 'deny') => void;
  onSuggest: (text: string) => void;
  /** Open the MMetrics dossier docked under the structure. */
  openDossier: () => void;
  /** Renders the MMetrics summary card (the app owns the chain data it needs). */
  renderMMetrics: () => ReactNode;
};

const AA = 'ACDEFGHIKLMNPQRSTVWY'.split('');
const ROLE_CHAIN = { heavy: 'H', light: 'L', antigen: 'V', other: 'X' } as const;

/** Minimal inline markup: **bold**, `code`, [[H:99]] residue chips, blank-line paragraphs. */
export function Rich({ md, onResidue }: { md: string; onResidue?: (l: string) => void }) {
  return (
    <>
      {md.split(/\n\n+/).map((para, i) => (
        <p key={i}>
          {para.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\[[A-Z]:\d+\]\])/g).map((part, k) => {
            if (part.startsWith('**')) return <strong key={k}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('`')) return <code key={k}>{part.slice(1, -1)}</code>;
            if (part.startsWith('[[')) {
              const label = part.slice(2, -2);
              return <button key={k} className="ag-res" style={{ ['--c' as string]: CHAIN_COLORS[label[0]] ?? '#9aa' }} onClick={() => onResidue?.(label)} title={`在结构中定位 ${label}`}>{label}</button>;
            }
            return <Fragment key={k}>{part}</Fragment>;
          })}
        </p>
      ))}
    </>
  );
}

export function Transcript({ msgs, busy, h }: { msgs: Msg[]; busy: boolean; h: TranscriptHandlers }) {
  return (
    <div className="ag-log">
      {msgs.map((m, i) => {
        if (m.role === 'user') return <UserMsg key={m.id} m={m} />;
        const live = busy && i === msgs.length - 1;
        const waiting = m.blocks.some(b => b.t === 'tool' && (b.status === 'running' || b.status === 'awaiting'));
        return (
          <div key={m.id} className={`ag-turn${live ? ' is-live' : ''}`}>
            <div className="ag-turn-head">
              <span className="ag-avatar" aria-hidden><span /></span>
              <b>Mocha</b>
              {live && <span className="ag-turn-state">{waiting ? '执行中' : '思考中'}</span>}
            </div>
            <div className="ag-turn-body">
              {m.blocks.map(b => <BlockView key={b.id} b={b} h={h} />)}
              {live && !waiting && <div className="ag-typing" aria-label="Mocha 正在生成"><i /><i /><i /></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserMsg({ m }: { m: Msg }) {
  const fasta = m.text?.trim().startsWith('>');
  return (
    <div className="ag-user">
      {m.context && m.context.length > 0 && <div className="ag-user-ctx">{m.context.map(c => <span key={c}><Box size={10} />{c}</span>)}</div>}
      {fasta ? <pre className="ag-user-fasta">{m.text!.split('\n').map(l => l.startsWith('>') ? l : l.slice(0, 60) + (l.length > 60 ? '…' : '')).join('\n')}</pre> : <div className="ag-user-text">{m.text}</div>}
    </div>
  );
}

function BlockView({ b, h }: { b: Block; h: TranscriptHandlers }) {
  switch (b.t) {
    case 'text': return <div className="ag-text"><Rich md={b.md} onResidue={h.onResidue} /></div>;
    case 'thinking': return <Thinking md={b.md} />;
    case 'plan': {
      const done = b.items.filter(it => it.state === 'done').length;
      return (
        <div className="ag-plan">
          <div className="ag-plan-head">
            <span>计划</span>
            <span className="ag-plan-count">{done}/{b.items.length}</span>
            <span className="ag-plan-meter"><i style={{ width: `${(done / Math.max(1, b.items.length)) * 100}%` }} /></span>
          </div>
          <ol className="ag-plan-list">
            {b.items.map((it, i) => (
              <li key={i} className={`ag-plan-item is-${it.state}`}>
                <span className="ag-plan-mark">{it.state === 'done' ? <Check size={11} strokeWidth={2.5} /> : it.state === 'doing' ? <Loader2 size={12} className="ag-spin" /> : <CircleDashed size={12} />}</span>
                <span>{it.text}</span>
              </li>
            ))}
          </ol>
        </div>
      );
    }
    case 'sequence': return (
      <div className="ag-seqs">
        {b.chains.map(c => {
          const chain = ROLE_CHAIN[c.role];
          const color = CHAIN_COLORS[chain] ?? '#9aa';
          return (
            <div key={c.id} className="ag-seq" style={{ ['--c' as string]: color }}>
              <div className="ag-seq-head"><i /><b>{c.name}</b><span className="ag-pill">{ROLE_NAMES[c.role]}</span><em>{c.seq.length} aa</em></div>
              <pre>{c.seq.match(/.{1,10}/g)!.slice(0, 6).map((chunk, k) => <span key={k}><sup>{k * 10 + 1}</sup>{chunk}</span>)}{c.seq.length > 60 && <span className="ag-seq-more">+{c.seq.length - 60}</span>}</pre>
            </div>
          );
        })}
      </div>
    );
    case 'tool': return <ToolCall b={b} h={h} />;
    case 'artifact': {
      const isStruct = b.tab.kind === 'structure';
      const Icon = isStruct ? Box : FileSpreadsheet;
      const ext = (b.tab.title.split('.').pop() ?? '').toUpperCase();
      return (
        <button className={`ag-artifact ${isStruct ? 'is-structure' : 'is-table'}`} onClick={() => h.onOpen(b.tab)}>
          <span className="ag-artifact-icon"><Icon size={15} /><em>{ext}</em></span>
          <span className="ag-artifact-body"><b>{b.tab.title}</b><span>{b.meta}</span></span>
          <span className="ag-artifact-open">打开<ArrowRight size={12} /></span>
        </button>
      );
    }
    case 'heatmap': return (
      <div className="ag-heat">
        <div className="ag-card-head"><b>突变扫描</b><span>{b.positions.length} 个位点 × 20 种氨基酸 · 点位点在结构中定位</span></div>
        <div className="ag-heat-scroll">
          <div className="ag-heat-grid" style={{ gridTemplateColumns: `64px repeat(${AA.length}, minmax(14px, 1fr))` }}>
            <span className="ag-heat-corner">位点 \ 替换</span>{AA.map(a => <span key={a} className="ag-heat-aa">{a}</span>)}
            {b.positions.map(p => (
              <Fragment key={p.label}>
                <button className="ag-heat-pos" onClick={() => h.onResidue(p.label)}><em>{p.label.split(':')[0]}</em>{p.from}{p.label.split(':')[1]}</button>
                {AA.map(a => {
                  const v = p.scores[a];
                  return <span key={a} className={`ag-heat-cell${v === undefined ? ' is-wt' : ''}`} style={v === undefined ? undefined : { background: rampColor((v + 2) / 3) }} title={v === undefined ? '野生型' : `${p.from}→${a}  ΔΔG ${v}`} />;
                })}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="ag-heat-legend">
          <span>结合 ΔΔG（kcal/mol）</span>
          <span className="ag-heat-ramp"><span>更强</span>{[0, 0.25, 0.5, 0.75, 1].map(t => <b key={t} style={{ background: rampColor(t) }} />)}<span>更弱</span></span>
          <span className="ag-heat-wt"><b />野生型</span>
        </div>
      </div>
    );
    case 'candidates': return (
      <div className="ag-tablecard">
        <div className="ag-card-head"><b>候选突变</b><span>{b.rows.length} 个 · 点行在结构中定位</span></div>
        <table className="ag-table">
          <thead><tr><th>突变</th><th className="is-num">结合 ΔΔG</th><th className="is-num">稳定性 ΔΔG</th><th className="is-num">保守性</th><th /></tr></thead>
          <tbody>{b.rows.map(r => (
            <tr key={r.label + r.to} onClick={() => h.onResidue(r.label)}>
              <td><span className="ag-mono"><em>{r.label[0]}:</em>{r.from}{r.label.split(':')[1]}{r.to}</span></td>
              <td className="is-num" style={{ color: rampColor((r.ddg + 2) / 3) }}>{r.ddg}</td>
              <td className="is-num" style={{ color: rampColor((r.stab + 1.2) / 2.4) }}>{r.stab > 0 ? '+' : ''}{r.stab}</td>
              <td className="is-num">{Math.round(r.cons * 100)}%</td>
              <td className="is-end">{r.stab > 0.6 ? <span className="ag-flag is-warn">可能失稳</span> : r.liability ? <span className="ag-flag is-warn" title={`MMetrics 可开发性规则：${r.liability}`}>留意 · {r.liability}</span> : <span className="ag-flag is-ok">推荐</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    );
    case 'suggest': return (
      <div className="ag-suggest">{b.items.map(s => <button key={s} onClick={() => h.onSuggest(s)}><span>{s}</span><ArrowRight size={12} /></button>)}</div>
    );
    case 'mmetrics': return <>{h.renderMMetrics()}</>;
    case 'proceed': return null;
  }
}

function Thinking({ md }: { md: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`ag-think${open ? ' is-open' : ''}`}>
      <button onClick={() => setOpen(o => !o)} aria-expanded={open}><Lightbulb size={13} /><span>推理过程</span><ChevronRight size={13} className="ag-chev" /></button>
      {open && <div className="ag-think-body">{md}</div>}
    </div>
  );
}

const TOOL_STATE: Record<Extract<Block, { t: 'tool' }>['status'], string> = { running: '运行中', done: '完成', awaiting: '待确认', denied: '已跳过' };

function ToolCall({ b, h }: { b: Extract<Block, { t: 'tool' }>; h: TranscriptHandlers }) {
  const [open, setOpen] = useState(false);
  const expanded = open || b.status === 'awaiting';
  const copy = () => navigator.clipboard?.writeText(JSON.stringify({ tool: b.name, ...Object.fromEntries(b.args) }, null, 2));
  const version = b.source?.split(' · ')[0];
  return (
    <div className={`ag-tool is-${b.status}`}>
      <button className="ag-tool-head" onClick={() => setOpen(o => !o)} aria-expanded={expanded}>
        <span className="ag-tool-state">
          {b.status === 'running' ? <Loader2 size={13} className="ag-spin" /> : b.status === 'done' ? <Check size={13} strokeWidth={2.5} /> : b.status === 'awaiting' ? <ShieldAlert size={13} /> : <X size={13} />}
        </span>
        <span className="ag-tool-text">
          <span className="ag-tool-title">{b.title}</span>
          <span className="ag-tool-sub"><code className="ag-tool-name">{b.name}</code>{version && version !== b.name && <span className="ag-tool-ver">{version}</span>}</span>
        </span>
        <span className="ag-tool-status">{TOOL_STATE[b.status]}</span>
        <span className="ag-tool-meta">{b.status === 'running' ? `${Math.round(b.progress)}%` : b.status === 'done' ? b.duration : b.status === 'awaiting' ? b.cost?.split(' · ').pop() : ''}</span>
        <ChevronRight size={13} className={`ag-chev${expanded ? ' is-open' : ''}`} />
      </button>
      {b.status === 'running' && <div className="ag-tool-bar"><i style={{ width: `${b.progress}%` }} /></div>}
      {expanded && (
        <div className="ag-tool-body">
          <div className="ag-args">{b.args.map(([k, v]) => <Fragment key={k}><span>{k}</span><code>{v}</code></Fragment>)}</div>
          {b.logs.length > 0 && b.status !== 'awaiting' && (
            <div className="ag-logs">{b.logs.map((l, i) => {
              const ok = b.status === 'done' || i < b.logs.length - 1;
              return <div key={i} className={ok ? 'is-ok' : 'is-now'}><span>{ok ? <Check size={11} strokeWidth={2.5} /> : <i />}</span>{l}</div>;
            })}</div>
          )}
          {b.status === 'done' && b.result?.kind === 'models' && (
            <table className="ag-table is-compact">
              <thead><tr><th>模型</th><th className="is-num">pLDDT</th><th className="is-num">ipTM</th><th>说明</th></tr></thead>
              <tbody>{MODEL_ROWS.map(m => <tr key={m.id}><td className="ag-mono">{m.name}</td><td className="is-num" style={{ color: plddtColor(m.plddt) }}>{m.plddt}</td><td className="is-num">{m.iptm}</td><td className="ag-faint is-text">{m.note}</td></tr>)}</tbody>
            </table>
          )}
          {b.status === 'done' && b.result?.kind === 'kv' && <div className="ag-args is-result">{b.result.rows.map(([k, v]) => <Fragment key={k}><span>{k}</span><b>{v}</b></Fragment>)}</div>}
          <div className="ag-tool-foot">
            {b.source ? <span>来源 · {b.source}</span> : <span />}
            <button onClick={copy}><Copy size={11} />复制参数</button>
          </div>
        </div>
      )}
      {b.status === 'awaiting' && (
        <div className="ag-approve">
          <div className="ag-approve-msg">
            <span className="ag-approve-icon"><ShieldAlert size={14} /></span>
            <span><b>运行 {b.name} 需要你确认</b>{b.cost && <em>预计消耗 {b.cost}</em>}</span>
          </div>
          <div className="ag-approve-actions">
            <button className="ag-btn is-ghost" onClick={() => h.onApprove(b.id, 'deny')}>跳过</button>
            <button className="ag-btn" onClick={() => h.onApprove(b.id, 'always')}>本会话都允许</button>
            <button className="ag-btn is-primary" onClick={() => h.onApprove(b.id, 'once')}>运行</button>
          </div>
        </div>
      )}
    </div>
  );
}
