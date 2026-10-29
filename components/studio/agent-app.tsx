'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Box, ChevronDown, FileSpreadsheet, FolderClosed, Moon, PanelRight, Paperclip, Plus, Square, Sun, X, Check } from 'lucide-react';
import './agent.css';
import type { ChainInfo } from '../console/molstar-lite';
import type { StageHandle } from './stage';
import { Transcript, type TranscriptHandlers } from './transcript';
import { Workbench, type Dock } from './workbench';
import { MMetricsSummary } from './mmetrics';
import { REGIONS, compactLabels, residueName, type Mutation } from './model';
import { SLASH, STARTERS, route, type Block, type Ctx, type Mode, type Msg, type TabSpec } from './agent';

let n = 0;
const uid = (p: string) => `${p}${(n++).toString(36)}`;
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
class Stopped extends Error {}

const MODES: { id: Mode; name: string; hint: string }[] = [
  { id: 'ask', name: '计算前确认', hint: '调用消耗算力的模型前先问你' },
  { id: 'auto', name: '自动执行', hint: '按计划直接运行所有模型' },
  { id: 'plan', name: '只出计划', hint: '只给出计划，不运行任何模型' },
];

const SESSIONS = [
  { project: 'VEGF 抗体亲和力成熟', items: [{ id: 'cur', name: '新会话' }, { id: 's2', name: 'CDR-H3 设计 v1', state: 'done' }, { id: 's3', name: '表位文献整理', state: 'done' }] },
  { project: 'PET 水解酶热稳定性', items: [{ id: 's4', name: '热稳定突变组合', state: 'running' }, { id: 's5', name: '口袋对接 HEMT', state: 'done' }] },
];

export function AgentApp() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>('ask');
  const [modeOpen, setModeOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [tabs, setTabs] = useState<TabSpec[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [wbOpen, setWbOpen] = useState(true);
  const [lens, setLens] = useState<'plddt' | 'region' | 'interface' | 'ddg'>('plddt');
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [hover, setHover] = useState<string[] | null>(null);
  const [ddg, setDdg] = useState<Map<string, Mutation[]>>(new Map());
  const [dock, setDock] = useState<Dock>('seq');
  const [dossierReady, setDossierReady] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  // Theme is a per-viewer convenience; storage can be unavailable (file://, private mode), so never depend on it.
  useEffect(() => { try { const t = localStorage.getItem('mos-agent-theme'); if (t === 'light' || t === 'dark') setTheme(t); } catch { /* ignore */ } }, []);
  const toggleTheme = () => setTheme(t => { const next = t === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('mos-agent-theme', next); } catch { /* ignore */ } return next; });
  const [toast, setToast] = useState<string | null>(null);
  const stage = useRef<StageHandle>(null);
  const chainsRef = useRef<ChainInfo[]>([]); chainsRef.current = chains;
  const tabsRef = useRef<TabSpec[]>([]); tabsRef.current = tabs;
  const approvals = useRef(new Map<string, (ok: boolean) => void>());
  const allowAll = useRef(false);
  const stopRef = useRef(false);
  const modeRef = useRef(mode); modeRef.current = mode;
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  const flash = (t: string) => { setToast(t); setTimeout(() => setToast(null), 2600); };
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs]);

  // ---------- transcript mutation helpers ----------
  const patchLast = useCallback((fn: (blocks: Block[]) => Block[]) => {
    setMsgs(ms => { const last = ms[ms.length - 1]; return last?.role === 'agent' ? [...ms.slice(0, -1), { ...last, blocks: fn(last.blocks) }] : ms; });
  }, []);
  const push = useCallback((b: Block) => patchLast(bs => [...bs, b]), [patchLast]);
  const patch = useCallback(<T extends Block>(id: string, fn: (b: T) => T) => patchLast(bs => bs.map(b => b.id === id ? fn(b as T) : b)), [patchLast]);

  const openTab = useCallback((t: TabSpec) => {
    const ts = tabsRef.current;
    // Update the ref eagerly: a scenario may check for an open structure in the same tick.
    tabsRef.current = ts.some(x => x.id === t.id) ? ts.map(x => x.id === t.id ? t : x) : [...ts, t];
    setTabs(tabsRef.current);
    setActive(t.id); setWbOpen(true);
    if (t.kind === 'structure') setLens(t.lens);
  }, []);

  // ---------- scenario runner ----------
  const run = useCallback(async (scenario: (c: Ctx) => Promise<void>, runMode: Mode) => {
    stopRef.current = false;
    setBusy(true);
    setMsgs(ms => [...ms, { id: uid('m'), role: 'agent', blocks: [] }]);
    const guard = () => { if (stopRef.current) throw new Stopped(); };
    let planned = false;
    const ctx: Ctx = {
      sleep: async ms => { await sleep(ms); guard(); },
      say: async md => {
        guard();
        const id = uid('b');
        push({ id, t: 'text', md: '' });
        // Stream text in a few chunks so the agent feels live without being slow.
        for (let i = 1; i <= 6; i++) { await sleep(70); guard(); const cut = Math.ceil(md.length * i / 6); patch<Extract<Block, { t: 'text' }>>(id, b => ({ ...b, md: md.slice(0, cut) })); }
      },
      think: async md => { guard(); push({ id: uid('b'), t: 'thinking', md }); await sleep(500); },
      sequence: chains => push({ id: uid('b'), t: 'sequence', chains }),
      plan: items => {
        const id = uid('b');
        push({ id, t: 'plan', items: items.map(text => ({ text, state: 'todo' })) });
        planned = true;
        return (i, state) => patch<Extract<Block, { t: 'plan' }>>(id, b => ({ ...b, items: b.items.map((it, k) => k === i ? { ...it, state } : it) }));
      },
      tool: async spec => {
        guard();
        if (runMode === 'plan' && planned) throw new Stopped('plan');
        const id = uid('t');
        const needs = !!spec.cost && runMode === 'ask' && !allowAll.current;
        push({ id, t: 'tool', name: spec.name, title: spec.title, args: spec.args, cost: spec.cost, logs: [], progress: 0, status: needs ? 'awaiting' : 'running', source: spec.source, result: spec.result });
        if (needs) {
          const ok = await new Promise<boolean>(res => approvals.current.set(id, res));
          guard();
          if (!ok) { patch<Extract<Block, { t: 'tool' }>>(id, b => ({ ...b, status: 'denied' })); throw new Stopped('denied'); }
          patch<Extract<Block, { t: 'tool' }>>(id, b => ({ ...b, status: 'running' }));
        }
        const t0 = Date.now(), ticks = 20;
        for (let i = 1; i <= ticks; i++) {
          await sleep(spec.ms / ticks); guard();
          const logs = spec.logs.slice(0, Math.ceil(spec.logs.length * i / ticks));
          patch<Extract<Block, { t: 'tool' }>>(id, b => ({ ...b, progress: (i / ticks) * 100, logs }));
        }
        // Report the simulated wall-clock as if it were the real job length.
        const secs = Math.round((Date.now() - t0) / 1000 * (spec.cost ? 52 : 4));
        patch<Extract<Block, { t: 'tool' }>>(id, b => ({ ...b, status: 'done', duration: secs > 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s` }));
      },
      artifact: (tab, meta) => { push({ id: uid('b'), t: 'artifact', tab, meta }); openTab(tab); },
      heatmap: positions => push({ id: uid('b'), t: 'heatmap', positions }),
      candidates: rows => push({ id: uid('b'), t: 'candidates', rows }),
      suggest: items => push({ id: uid('b'), t: 'suggest', items }),
      setDdg: m => { setDdg(prev => new Map([...prev, ...m])); setLens('ddg'); },
      mmetrics: () => { push({ id: uid('b'), t: 'mmetrics' }); setDossierReady(true); setDock('mmetrics'); },
      dossier: () => { setDossierReady(true); setDock('mmetrics'); const t = tabsRef.current.find(x => x.kind === 'structure'); if (t) { setActive(t.id); setWbOpen(true); } },
      ensureStructure: async () => {
        if (!chainsRef.current.length) {
          if (!tabsRef.current.some(t => t.kind === 'structure')) openTab({ id: 'struct', kind: 'structure', title: '2fjg.cif', lens: 'region' });
          for (let i = 0; i < 100 && !chainsRef.current.length; i++) { await sleep(150); guard(); }
        }
        return { code: (l: string) => residueName(chainsRef.current, l)?.code ?? 'X', chains: chainsRef.current };
      },
    };
    try { await scenario(ctx); }
    catch (e) {
      if (e instanceof Stopped && e.message === 'plan') push({ id: uid('b'), t: 'suggest', items: ['按这个计划执行'] });
      else if (e instanceof Stopped && e.message === 'denied') push({ id: uid('b'), t: 'text', md: '好的，跳过这一步。需要时再告诉我，或换一个参数重新发起。' });
      else if (e instanceof Stopped) push({ id: uid('b'), t: 'text', md: '已停止。' });
      else { console.error(e); push({ id: uid('b'), t: 'text', md: '出错了，请重试。' }); }
    }
    setBusy(false);
  }, [push, patch, openTab]);

  const lastPrompt = useRef<{ text: string; ctx: string[] } | null>(null);
  const send = (text: string, viaSuggestion = false) => {
    if (busy || !text.trim()) return;
    const context = selection.length && !viaSuggestion ? [compactLabels(selection)] : [];
    let runMode = modeRef.current;
    let prompt = text, ctx = selection;
    if (text === '按这个计划执行' && lastPrompt.current) { prompt = lastPrompt.current.text; ctx = lastPrompt.current.ctx; runMode = 'ask'; }
    else lastPrompt.current = { text, ctx: selection };
    setMsgs(ms => [...ms, { id: uid('m'), role: 'user', blocks: [], text, context }]);
    setDraft('');
    void run(route(prompt, viaSuggestion ? [] : ctx, chainsRef.current.length > 0), runMode);
  };
  const stop = () => {
    stopRef.current = true;
    approvals.current.forEach(res => res(false)); approvals.current.clear();
  };

  const select = useCallback((labels: string[], additive = false) => {
    setSelection(prev => additive ? (labels.every(l => prev.includes(l)) ? prev.filter(l => !labels.includes(l)) : [...new Set([...prev, ...labels])]) : labels);
  }, []);

  const h: TranscriptHandlers = {
    onResidue: label => {
      const t = tabs.find(x => x.kind === 'structure');
      if (!t) return flash('还没有结构');
      setActive(t.id); setWbOpen(true); select([label]); stage.current?.focus([label]);
    },
    onOpen: openTab,
    renderMMetrics: () => <MMetricsSummary chains={chains} onResidue={label => h.onResidue(label)} onOpen={() => h.openDossier()} />,
    openDossier: () => { const t = tabs.find(x => x.kind === 'structure'); if (t) { setActive(t.id); setWbOpen(true); } setDock('mmetrics'); },
    onApprove: (id, decision) => {
      if (decision === 'always') allowAll.current = true;
      approvals.current.get(id)?.(decision !== 'deny'); approvals.current.delete(id);
    },
    onSuggest: s => send(s, true),
  };

  // ---------- composer menus ----------
  const token = draft.match(/(^|\s)([/@])([^\s]*)$/);
  const menu = useMemo(() => {
    if (!token) return null;
    const q = token[3].toLowerCase();
    if (token[2] === '/' && token[1] === '' ) return SLASH.filter(s => s.cmd.includes(q) || s.name.includes(q)).map(s => ({ key: s.cmd, label: s.cmd, sub: `${s.name} · ${s.model}`, insert: `${s.cmd} ` }));
    if (token[2] === '@') {
      const items = [
        ...chains.map(c => ({ key: c.auth, label: `链 ${c.auth}`, sub: `${c.entity || ''} · ${c.residues.length} aa`, labels: c.residues.map(r => `${c.auth}:${r.seq}`) })),
        ...REGIONS.map(r => ({ key: r.id, label: r.name, sub: `${r.labels.length} 个残基`, labels: r.labels })),
      ];
      return items.filter(i => i.label.toLowerCase().includes(q)).map(i => ({ key: i.key, label: `@${i.label}`, sub: i.sub, labels: i.labels }));
    }
    return null;
  }, [token, chains]);
  const [menuIdx, setMenuIdx] = useState(0);
  useEffect(() => setMenuIdx(0), [draft]);
  const pick = (item: NonNullable<typeof menu>[number]) => {
    if (!token) return;
    const head = draft.slice(0, draft.length - token[0].length) + token[1];
    if ('labels' in item && item.labels) { select(item.labels as string[]); setDraft(head); }
    else setDraft(head + (item as { insert: string }).insert);
    input.current?.focus();
  };

  const files = tabs;
  const empty = msgs.length === 0;

  const composer = (
    <div className={`ag-composer${empty ? ' is-hero' : ''}`}>
      {menu && menu.length > 0 && (
        <div className="ag-menu">{menu.slice(0, 8).map((m, i) => (
          <button key={m.key} className={i === menuIdx ? 'is-on' : ''} onMouseEnter={() => setMenuIdx(i)} onMouseDown={e => { e.preventDefault(); pick(m); }}><b>{m.label}</b><span>{m.sub}</span></button>
        ))}</div>
      )}
      {selection.length > 0 && (
        <div className="ag-ctx">
          <span className="ag-ctx-chip"><Box size={11} />{compactLabels(selection).slice(0, 36)}{selection.length > 1 ? ` · ${selection.length} 个残基` : ''}<button onClick={() => select([])} aria-label="移除"><X size={11} /></button></span>
          <em>来自结构选区，会作为上下文一起发送</em>
        </div>
      )}
      <textarea ref={input} rows={empty ? 3 : 2} value={draft} onChange={e => setDraft(e.target.value)}
        placeholder={empty ? '描述你的研究目标，或直接粘贴序列 / PDB ID…' : '继续追问，输入 / 调用模型，@ 引用链或区域'}
        onKeyDown={e => {
          if (menu && menu.length) {
            if (e.key === 'ArrowDown') { e.preventDefault(); setMenuIdx(i => Math.min(menu.length - 1, i + 1)); return; }
            if (e.key === 'ArrowUp') { e.preventDefault(); setMenuIdx(i => Math.max(0, i - 1)); return; }
            if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); pick(menu[menuIdx]); return; }
          }
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); }
        }} />
      <div className="ag-composer-bar">
        <button className="ag-icon" onClick={() => flash('原型中可直接粘贴序列或输入 PDB ID')} aria-label="上传结构或序列文件"><Paperclip size={15} /></button>
        <div className="ag-mode">
          <button onClick={() => setModeOpen(o => !o)}>{MODES.find(m => m.id === mode)!.name}<ChevronDown size={12} /></button>
          {modeOpen && (
            <div className="ag-mode-menu" onMouseLeave={() => setModeOpen(false)}>
              {MODES.map(m => <button key={m.id} onClick={() => { setMode(m.id); setModeOpen(false); }}><span><b>{m.name}</b><em>{m.hint}</em></span>{mode === m.id && <Check size={13} />}</button>)}
            </div>
          )}
        </div>
        <span className="ag-credits">本月剩余 184 积分</span>
        {busy
          ? <button className="ag-send is-stop" onClick={stop} aria-label="停止"><Square size={11} fill="currentColor" /></button>
          : <button className="ag-send" disabled={!draft.trim()} onClick={() => send(draft)} aria-label="发送"><ArrowUp size={15} /></button>}
      </div>
    </div>
  );

  return (
    <div className="ag" data-theme={theme}>
      <aside className="ag-side">
        <div className="ag-brand"><span className="ag-logo" />MoleculeOS</div>
        <button className="ag-new" onClick={() => { if (busy) stop(); setMsgs([]); setTabs([]); setActive(null); setSelection([]); setDdg(new Map()); setChains([]); setDossierReady(false); setDock('seq'); allowAll.current = false; }}><Plus size={14} />新会话</button>
        <div className="ag-side-scroll">
          {SESSIONS.map(g => (
            <div key={g.project} className="ag-side-group">
              <div className="ag-side-label"><FolderClosed size={12} />{g.project}</div>
              {g.items.map(s => (
                <button key={s.id} className={`ag-side-item${s.id === 'cur' ? ' is-on' : ''}`} onClick={() => s.id !== 'cur' && flash('原型中仅当前会话可用')}>
                  <span>{s.id === 'cur' && msgs[0]?.text ? (msgs[0].text.startsWith('>') ? '结构预测：G6 · VEGF-A' : msgs[0].text.slice(0, 18)) : s.name}</span>
                  {s.id === 'cur' ? (busy && <i className="ag-dot is-run" />) : 'state' in s && s.state === 'running' && <i className="ag-dot is-run" />}
                </button>
              ))}
              {g.items.some(s => s.id === 'cur') && files.length > 0 && (
                <div className="ag-files">
                  <div className="ag-side-label is-sub">产出文件</div>
                  {files.map(f => <button key={f.id} className="ag-side-item is-file" onClick={() => openTab(f)}>{f.kind === 'structure' ? <Box size={12} /> : <FileSpreadsheet size={12} />}<span>{f.title}</span></button>)}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="ag-me"><i>Z</i><span>zifeng · 分子之心</span></div>
      </aside>

      <main className="ag-main">
        <header className="ag-head">
          <span className="ag-head-title">{empty ? '新会话' : msgs[0].text?.startsWith('>') ? '结构预测：G6 · VEGF-A' : msgs[0].text?.slice(0, 30)}</span>
          <span className="ag-head-proj">VEGF 抗体亲和力成熟</span>
          <button className="ag-icon" onClick={toggleTheme} aria-label={theme === 'dark' ? '切换到浅色' : '切换到深色'} title={theme === 'dark' ? '浅色主题' : '深色主题'}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
          {tabs.length > 0 && <button className={`ag-icon${wbOpen ? ' is-on' : ''}`} onClick={() => setWbOpen(o => !o)} aria-label="切换工作台"><PanelRight size={15} /></button>}
        </header>
        {empty ? (
          <div className="ag-hero">
            <h1>今天想推进什么研究？</h1>
            <p>用自然语言描述目标，Mocha 会拆解步骤、调用合适的模型，并在每次消耗算力前和你确认。</p>
            {composer}
            <div className="ag-starters">
              {STARTERS.map(s => (
                <button key={s.title} onClick={() => { setDraft(s.prompt); input.current?.focus(); }}><b>{s.title}</b><span>{s.body}</span></button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="ag-scroll"><Transcript msgs={msgs} busy={busy} h={h} /><div ref={bottom} /></div>
            <div className="ag-dock">{composer}<div className="ag-disclaimer">AI 生成的研究辅助结果，建议实验验证</div></div>
          </>
        )}
      </main>

      {tabs.length > 0 && (
        <Workbench ref={stage} hidden={!wbOpen} tabs={tabs} active={active} setActive={setActive}
          close={id => { setTabs(ts => { const next = ts.filter(t => t.id !== id); if (active === id) setActive(next[next.length - 1]?.id ?? null); return next; }); if (id === 'struct') setChains([]); }}
          lens={lens} setLens={setLens} chains={chains} onLoaded={setChains} selection={selection} select={select} hover={hover} setHover={setHover} ddg={ddg}
          dock={dock} setDock={setDock} dossierReady={dossierReady} onOpenTable={t => openTab({ ...t, kind: 'table' })} />
      )}
      {toast && <div className="ag-toast">{toast}</div>}
    </div>
  );
}
