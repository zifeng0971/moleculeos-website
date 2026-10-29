'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { Copy, GitCompare, Link2, X } from 'lucide-react';
import type { StructureDef } from './data';

function Shell({ title, icon, onClose, children, foot }: { title: string; icon: ReactNode; onClose: () => void; children: ReactNode; foot?: ReactNode }) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  return (
    <div className="wb-scrim" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="wb-dialog narrow" role="dialog" aria-label={title}>
        <div className="wb-dialog-head">{icon}<h3>{title}</h3><button className="wb-icon sm" onClick={onClose} aria-label="Close"><X size={16} /></button></div>
        <div className="wb-dialog-body">{children}</div>
        {foot && <div className="wb-dialog-foot">{foot}</div>}
      </div>
    </div>
  );
}

export function SuperimposeDialog({ structures, onClose, onConfirm, onAdd }: { structures: StructureDef[]; onClose: () => void; onConfirm: (names: string[]) => void; onAdd: () => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [fixed, setFixed] = useState<string | null>(null);
  const toggle = (id: string) => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const base = fixed && picked.includes(fixed) ? fixed : picked[0];
  return (
    <Shell title="Superimpose" icon={<GitCompare size={16} className="wb-muted" />} onClose={onClose}
      foot={<><button className="wb-btn" onClick={onClose}>Cancel</button><button className="wb-btn primary" disabled={picked.length < 2} onClick={() => onConfirm(structures.filter(s => picked.includes(s.id)).map(s => s.name))}>Align {picked.length || ''} structures</button></>}>
      {structures.length < 2 && <div className="wb-empty" style={{ marginBottom: 12 }}>Superimpose needs two or more structures. This project has {structures.length}.<br /><button className="wb-btn sm" style={{ marginTop: 8 }} onClick={() => { onClose(); onAdd(); }}>Add a structure</button></div>}
      <p className="wb-muted" style={{ marginTop: 0 }}>Pick structures to align. The <b>Fixed</b> one stays in place; the others move onto it.</p>
      {structures.map(s => (
        <label key={s.id} className="wb-row" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
          <b>{s.name}</b><span className="wb-muted" style={{ flex: 1 }}>{s.title}</span>
          {picked.includes(s.id) && <button className={`wb-pill ${base === s.id ? 'accent' : ''}`} onClick={event => { event.preventDefault(); setFixed(s.id); }}>{base === s.id ? 'Fixed' : 'Moving'}</button>}
        </label>
      ))}
    </Shell>
  );
}

export function ShareDialog({ project, onClose, onCopy }: { project: string; onClose: () => void; onCopy: () => void }) {
  const people: [string, string, string][] = [['You', 'zifengye', 'Owner'], ['mt', 'collaborator', 'Editor'], ['Lab reviewer', 'viewer', 'Viewer']];
  return (
    <Shell title={`Share “${project}”`} icon={<Link2 size={16} className="wb-muted" />} onClose={onClose} foot={<button className="wb-btn primary" onClick={onClose}>Done</button>}>
      <div style={{ display: 'flex', gap: 8 }}><input className="wb-input" placeholder="Invite by email or username" /><select className="wb-select" style={{ width: 110 }} defaultValue="Viewer"><option>Editor</option><option>Viewer</option></select><button className="wb-btn">Invite</button></div>
      <div className="wb-sec-head" style={{ paddingLeft: 0 }}>People with access</div>
      {people.map(([name, handle, role]) => <div key={name} className="wb-row"><span className="wb-avatar" style={{ margin: 0 }}>{name[0]}</span><span style={{ flex: 1 }}><b>{name}</b><br /><span className="wb-muted">{handle}</span></span><span className="wb-pill">{role}</span></div>)}
      <button className="wb-btn" style={{ marginTop: 14 }} onClick={onCopy}><Copy size={13} />Copy project link</button>
      <p className="wb-faint" style={{ marginBottom: 0 }}>Owners and editors can annotate and run tasks. Viewers see everything but cannot change it.</p>
    </Shell>
  );
}
