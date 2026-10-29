'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, FolderKanban, Loader2, Moon, PanelLeft, PanelRight, Plus, Search, Share2, Sun } from 'lucide-react';
import type { Project } from './data';

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs><linearGradient id="wbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a6cf0" /><stop offset=".55" stopColor="#8a5cf0" /><stop offset="1" stopColor="#e45fb6" /></linearGradient></defs>
      <rect width="32" height="32" rx="9" fill="url(#wbg)" />
      <path d="M8 21 13 11l4 7 3-5 4 8" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return { open, setOpen, ref };
}

type Props = {
  projects: Project[]; project: Project; onProject: (id: string) => void;
  running: number; unread: number; onRuns: () => void; onPalette: () => void; onShare: () => void; onBell: () => void;
  theme: 'dark' | 'light'; onTheme: () => void;
  sideOpen: boolean; inspOpen: boolean; onSide: () => void; onInsp: () => void;
};

export function Topbar(p: Props) {
  const proj = usePopover();
  return (
    <header className="wb-top">
      <button className="wb-icon" onClick={p.onSide} aria-label="Toggle explorer" title="Toggle explorer"><PanelLeft size={17} className={p.sideOpen ? '' : 'wb-faint'} /></button>
      <div className="wb-brand"><Logo /><span>MOS</span><sup>BETA</sup></div>
      <div className="wb-proj" ref={proj.ref}>
        <button className="wb-proj-btn" onClick={() => proj.setOpen(!proj.open)} aria-expanded={proj.open}>
          <FolderKanban size={15} className="wb-muted" /><b>{p.project.name}</b>
          <span className="wb-pill">{p.project.role}</span><ChevronDown size={14} className="wb-muted" />
        </button>
        {proj.open && (
          <div className="wb-pop wb-proj-menu">
            <div className="wb-sec-head" style={{ paddingTop: 6 }}>Projects</div>
            {p.projects.map(item => (
              <button key={item.id} className={`wb-proj-item ${item.id === p.project.id ? 'on' : ''}`} onClick={() => { p.onProject(item.id); proj.setOpen(false); }}>
                <FolderKanban size={16} className="wb-muted" />
                <span className="meta"><b>{item.name}</b><span>{item.structures.length} structure · {item.role} · {item.updated}</span></span>
                {item.id === p.project.id && <Check size={15} className="wb-muted" />}
              </button>
            ))}
            <button className="wb-proj-item" onClick={() => proj.setOpen(false)}><Plus size={16} className="wb-muted" /><span className="meta"><b>Create project</b></span></button>
          </div>
        )}
      </div>
      <button className="wb-search" onClick={p.onPalette}>
        <Search size={15} /><span>Run a model, search homologs, or ask Mocha…</span><kbd className="wb-kbd">⌘K</kbd>
      </button>
      <div className="wb-top-right">
        {p.running > 0 && <button className="wb-runs" onClick={p.onRuns}><Loader2 size={14} className="wb-spin" />{p.running} running</button>}
        <button className="wb-btn" onClick={p.onShare}><Share2 size={14} />Share</button>
        <button className="wb-icon" style={{ position: 'relative' }} onClick={p.onBell} aria-label="Notifications" title="Notifications"><Bell size={17} />{p.unread > 0 && <i className="wb-badge" />}</button>
        <button className="wb-icon" onClick={p.onTheme} aria-label="Toggle theme" title="Toggle theme">{p.theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button className="wb-icon" onClick={p.onInsp} aria-label="Toggle panel" title="Toggle panel"><PanelRight size={17} className={p.inspOpen ? '' : 'wb-faint'} /></button>
        <div className="wb-avatar" title="You">Z</div>
      </div>
    </header>
  );
}
