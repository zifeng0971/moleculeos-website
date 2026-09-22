'use client';
import data from '@/content/mock/mmetrics-5xh3.json';
export function MMetricsSequence({ selected, hover, toggle }: { selected: string[]; hover: (value: string | null) => void; toggle: (value: string) => void }) {
  return <div className="mm-sequence"><div className="mm-sequence-name">5xh3 <span>1:</span> <b>A</b></div><div className="mm-sequence-scroll">{Array.from({ length: Math.ceil(data.protein.sequence.length / 10) }, (_, group) => <div key={group}><small>{group * 10 + 1}</small><div>{data.protein.sequence.slice(group * 10, group * 10 + 10).split('').map((aa, index) => { const residue = `A:${group * 10 + index + 1}`; return <button key={residue} aria-label={`${aa} · ${residue}`} aria-pressed={selected.includes(residue)} onMouseEnter={() => hover(residue)} onMouseLeave={() => hover(null)} onFocus={() => hover(residue)} onBlur={() => hover(null)} onClick={() => toggle(residue)}>{aa}</button>; })}</div></div>)}</div></div>;
}
