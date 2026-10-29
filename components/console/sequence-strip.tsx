'use client';
import { useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ChainInfo } from './molstar-lite';

type Props = {
  chains: ChainInfo[]; colors: Record<string, string>; chainNames: Record<string, string>; chainVisible: Record<string, boolean>;
  selection: string[]; highlight: string[] | null; marks: Record<string, string>;
  onSelect: (label: string, mode: 'replace' | 'toggle' | 'range', range?: string[]) => void;
  onHover: (labels: string[] | null) => void;
  open: boolean; onToggle: () => void;
};

export function SequenceStrip(p: Props) {
  const visible = p.chains.filter(chain => p.chainVisible[chain.auth] !== false);
  const [picked, setPicked] = useState<string | null>(null);
  const current = visible.find(chain => chain.auth === picked) ?? visible[0];
  const anchor = useRef<string | null>(null);
  const selected = useMemo(() => new Set(p.selection), [p.selection]);
  const highlighted = useMemo(() => new Set(p.highlight ?? []), [p.highlight]);

  const click = (label: string, index: number, event: React.MouseEvent) => {
    if (event.shiftKey && anchor.current && current) {
      const start = current.residues.findIndex(r => `${current.auth}:${r.seq}` === anchor.current);
      if (start >= 0) {
        const [a, b] = start < index ? [start, index] : [index, start];
        p.onSelect(label, 'range', current.residues.slice(a, b + 1).map(r => `${current.auth}:${r.seq}`));
        return;
      }
    }
    anchor.current = label;
    p.onSelect(label, event.metaKey || event.ctrlKey ? 'toggle' : 'replace');
  };

  return (
    <section className="wb-seq" aria-label="Sequence">
      <div className="wb-seq-head">
        <div className="wb-seq-tabs" role="tablist">
          {visible.map(chain => (
            <button key={chain.auth} role="tab" aria-selected={chain === current} className={`wb-seq-tab ${chain === current ? 'on' : ''}`} onClick={() => setPicked(chain.auth)}>
              <span className="wb-dot" style={{ background: p.colors[chain.auth] }} />
              Chain {chain.auth}<span className="wb-faint">{p.chainNames[chain.auth] ?? chain.entity} · {chain.residues.length}</span>
            </button>
          ))}
        </div>
        <span className="wb-faint" style={{ fontSize: 11 }}>click · ⇧ range · ⌘ add</span>
        <button className="wb-icon sm" onClick={p.onToggle} aria-label={p.open ? 'Collapse sequence' : 'Expand sequence'}>{p.open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
      </div>
      {p.open && current && (
        <div className="wb-seq-scroll">
          <div className="wb-seq-grid">
            {current.residues.map((residue, index) => {
              const label = `${current.auth}:${residue.seq}`;
              const mark = p.marks[label];
              return (
                <span key={label} className={`wb-res ${selected.has(label) ? 'sel' : ''} ${highlighted.has(label) ? 'hl' : ''} ${mark ? 'mark' : ''}`}
                  style={mark ? ({ '--mark': mark } as React.CSSProperties) : undefined}
                  title={`${residue.name} ${residue.seq}`} onClick={event => click(label, index, event)}
                  onMouseEnter={() => p.onHover([label])} onMouseLeave={() => p.onHover(null)}>
                  {index % 10 === 0 && <i>{residue.seq}</i>}{residue.code}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
