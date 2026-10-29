'use client';
import { useState } from 'react';
import { useMM } from './mmetrics-dataset';

/** MOS-style sequence header: structure name bar, entity/chain chips, numbered residue rows. Ids are "A:31". */
export function MMetricsSequence({ selected, hover, toggle, cdr }: { selected: string[]; hover: (value: string | null) => void; toggle: (value: string) => void; cdr: Set<string> }) {
  const { data: mmetrics } = useMM();
  const [chainId, setChainId] = useState(mmetrics.chains[0].id);
  const index = mmetrics.chains.findIndex(c => c.id === chainId);
  const chain = mmetrics.chains[index];
  return <div className="mm-sequence">
    <div className="mm-sequence-name">{mmetrics.name}</div>
    <div className="mm-chain-chips" role="tablist" aria-label="Chains">
      <span className="mm-entity">{index + 1}:</span>
      {mmetrics.chains.map(c => <button key={c.id} role="tab" aria-selected={c.id === chainId} title={c.fragment ?? 'antigen'} onClick={() => setChainId(c.id)}>{c.id}</button>)}
    </div>
    <div className="mm-sequence-scroll">{Array.from({ length: Math.ceil(chain.sequence.length / 10) }, (_, group) => <div key={group}><small>{group * 10 + 1}</small><div>{chain.sequence.slice(group * 10, group * 10 + 10).split('').map((aa, i) => {
      const residue = `${chain.id}:${group * 10 + i + 1}`;
      return <button key={residue} data-cdr={cdr.has(residue) || undefined} aria-label={`${aa} · ${residue}`} aria-pressed={selected.includes(residue)} onMouseEnter={() => hover(residue)} onMouseLeave={() => hover(null)} onFocus={() => hover(residue)} onBlur={() => hover(null)} onClick={() => toggle(residue)}>{aa}</button>;
    })}</div></div>)}</div>
  </div>;
}
