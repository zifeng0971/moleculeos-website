'use client';
import { useRef } from 'react';
import { Box, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Plus, Tags, Trash2, Upload } from 'lucide-react';
import type { Group, Project, StructureDef } from './data';
import type { ChainInfo, LigandInfo } from './molstar-lite';

type Props = {
  project: Project; active: string; structures: StructureDef[];
  chains: ChainInfo[]; ligands: LigandInfo[]; chainVisible: Record<string, boolean>;
  onStructure: (id: string) => void; onToggleChain: (chain: string) => void; onUpload: (file: File) => void;
  groups: Group[]; onGroupHover: (labels: string[] | null) => void; onGroupOpen: (group: Group) => void; onGroupDelete: (id: string) => void; onGroupCopy: (group: Group) => void;
};

export function Explorer(p: Props) {
  const file = useRef<HTMLInputElement>(null);
  return (
    <aside className="wb-side-scroll" aria-label="Project explorer">
      <div className="wb-sec-head">
        <span className="grow">Structures</span>
        <button className="wb-btn sm ghost" onClick={() => file.current?.click()}><Plus size={13} />Add</button>
        <input ref={file} type="file" accept=".pdb,.cif,.mmcif,.ent" hidden onChange={event => { const f = event.target.files?.[0]; if (f) p.onUpload(f); event.target.value = ''; }} />
      </div>
      {p.structures.map(structure => {
        const on = structure.id === p.active;
        return (
          <div key={structure.id} className={`wb-struct ${on ? 'on' : ''}`}>
            <button className="wb-struct-row" onClick={() => p.onStructure(structure.id)} aria-expanded={on}>
              <span className="wb-struct-ic"><Box size={16} /></span>
              <span className="meta"><b>{structure.name}</b><small>{structure.title}</small></span>
              {on ? <ChevronDown size={14} className="wb-muted" /> : <ChevronRight size={14} className="wb-faint" />}
            </button>
            {on && (
              <div className="wb-chains">
                {p.chains.map(chain => {
                  const visible = p.chainVisible[chain.auth] !== false;
                  return (
                    <div key={chain.auth} className={`wb-chain ${visible ? '' : 'off'}`}>
                      <span className="wb-dot" style={{ background: structure.colors[chain.auth] ?? '#8b93ff', opacity: visible ? 1 : .35 }} />
                      <span className="id">{chain.auth}</span>
                      <span className="name" title={structure.chainNames[chain.auth] ?? chain.entity}>{structure.chainNames[chain.auth] ?? (chain.entity || 'Polymer chain')}</span>
                      <span className="len">{chain.residues.length}</span>
                      <button className="wb-icon sm" onClick={() => p.onToggleChain(chain.auth)} aria-label={`${visible ? 'Hide' : 'Show'} chain ${chain.auth}`}>{visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                    </div>
                  );
                })}
                {p.ligands.length > 0 && (
                  <div className="wb-ligs">{[...new Set(p.ligands.map(l => l.name))].map(name => <span key={name} className="wb-pill">{name}</span>)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {p.structures.length === 0 && <div className="wb-empty">No structures yet.<br />Upload a .pdb or .cif file.</div>}

      <div className="wb-sec-head"><span className="grow">Residue groups</span><Tags size={13} /></div>
      {p.groups.length === 0 && <div className="wb-empty">Select residues in the structure, then choose <b>Save as group</b>.</div>}
      {p.groups.map(group => (
        <div key={group.id} className="wb-group" role="button" tabIndex={0}
          onMouseEnter={() => p.onGroupHover(group.labels)} onMouseLeave={() => p.onGroupHover(null)}
          onClick={() => p.onGroupOpen(group)} onKeyDown={event => { if (event.key === 'Enter') p.onGroupOpen(group); }}>
          <span className="wb-dot" style={{ background: group.kind === 'neighbors' ? '#f4a340' : '#e45fb6' }} />
          <span className="meta"><b>{group.name}</b><small>{group.labels.length} residues · {group.desc}</small></span>
          <button className="wb-icon sm" onClick={event => { event.stopPropagation(); p.onGroupCopy(group); }} aria-label="Copy residues"><Copy size={13} /></button>
          <button className="wb-icon sm" onClick={event => { event.stopPropagation(); p.onGroupDelete(group.id); }} aria-label="Delete group"><Trash2 size={13} /></button>
        </div>
      ))}
      <div className="wb-sec-head" style={{ paddingTop: 18 }}><span className="grow">Supported files</span></div>
      <p className="wb-faint" style={{ margin: '0 4px', fontSize: 12 }}><Upload size={12} style={{ display: 'inline', marginRight: 4 }} />PDB and mmCIF. Files load in your browser; nothing is uploaded.</p>
    </aside>
  );
}
