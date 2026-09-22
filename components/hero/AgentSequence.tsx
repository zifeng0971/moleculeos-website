'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import data from '@/content/antibody-affinity-structure.json';

const letters: Record<string, string> = { ALA:'A', ARG:'R', ASN:'N', ASP:'D', CYS:'C', GLN:'Q', GLU:'E', GLY:'G', HIS:'H', ILE:'I', LEU:'L', LYS:'K', MET:'M', PHE:'F', PRO:'P', SER:'S', THR:'T', TRP:'W', TYR:'Y', VAL:'V' };
// Only modeled residues; retain author numbering, including gaps and insertion codes.
export function AgentSequence({ selected, select, hover }: { selected: string[]; select: (id: string) => void; hover: (id: string | null) => void }) {
  const t = useTranslations('agentDemo.structure');
  const [index, setIndex] = useState(0);
  const chain = data.chains[index];
  return <div className="agent-sequence-strip">
    <div className="agent-sequence-chains" role="group" aria-label={t('sequence')}>
      {data.chains.map((item, i) => <button key={item.auth} type="button" aria-pressed={index === i} onClick={() => setIndex(i)} title={`${t(item.role)} · ${item.auth}`}>{item.auth}</button>)}
    </div>
    <div className="agent-sequence-residues">{chain.residues.map((residue, i) => <button type="button" key={residue.label} aria-label={`${residue.name} · ${residue.label}`} title={`${residue.name} · ${residue.label}`} aria-pressed={selected.includes(residue.label)} onClick={() => select(residue.label)} onMouseEnter={() => hover(residue.label)} onMouseLeave={() => hover(null)} onFocus={() => hover(residue.label)} onBlur={() => hover(null)}><small>{i % 10 === 0 ? residue.label.split(':')[1] : '\u00a0'}</small>{letters[residue.name] ?? 'X'}</button>)}</div>
  </div>;
}
