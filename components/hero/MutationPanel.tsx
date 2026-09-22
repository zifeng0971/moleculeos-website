'use client';
import { useState } from 'react';
import panel from '@/public/demo/antibody-affinity/panel.json';

type Mutation = (typeof panel)[number];
const percent = (value: number) => `${Math.round(value * 100)}%`;
const signed = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;

export function MutationPanel({ initialRows = 8, onSelect }: { initialRows?: number; onSelect: (label: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const rows = (expanded ? panel : panel.slice(0, initialRows)) as Mutation[];
  return <div className="agent-mutation-panel">
    <div className="agent-mutation-scroll"><table>
      <thead><tr><th>Mutation</th><th>Tier</th><th>Binding affinity ddG</th><th>Structural fitness</th><th>Sequence fitness</th><th>Context</th><th>Rationale</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.key}>
        <td><button type="button" onClick={() => onSelect(`${row.chain}:${row.position}`)}><strong>{row.chain}:{row.wildType}{row.position}{row.mutation}</strong></button></td>
        <td><span data-tier={row.tier}>{row.tier}</span></td>
        <td>{signed(row.bindingAffinity.score)} <small>{percent(row.bindingAffinity.percentile)}</small></td>
        <td>{signed(row.structuralFitness.score)} <small>{percent(row.structuralFitness.percentile)}</small></td>
        <td>{signed(row.sequenceFitness.score)} <small>{percent(row.sequenceFitness.percentile)}</small></td>
        <td>{row.context.region} · {row.context.paratopeDistance} Å</td>
        <td>{row.rationale}</td>
      </tr>)}</tbody>
    </table></div>
    <button type="button" className="agent-table-toggle" onClick={() => setExpanded(value => !value)}>{expanded ? 'Show top 8' : 'View all 30'}</button>
  </div>;
}
