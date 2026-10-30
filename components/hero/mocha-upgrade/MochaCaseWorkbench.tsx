'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Bell, ChevronDown, FileCode2, Mail, Plus, RotateCcw, Send, Settings, X } from 'lucide-react';
import mochaIcon from './vendor/src/assets/mocha/icon-mocha.svg';
import { MochaIdle } from './vendor/src/components/mocha/MochaIdle/MochaIdle';
import { MochaCaseFlow, type LocalChatMessage } from './MochaCaseFlow';
import { MochaWelcome } from './MochaWelcome';
import { ATTACHED_STRUCTURE_NAME, DEMO_TOTAL_MS, ENTRY_TASKS, PRESET_PROMPT, phaseAt } from './demoScript';
import { DEMO_SEQUENCES } from './demoSequences';
import './vendor-tokens.css';
import '../agent-demo.css';
import './mocha-upgrade.css';
import './mocha-case.css';
import '../product-surface.css';

const Structure = dynamic(() => import('./MochaStructurePane').then(module => module.MochaStructurePane), { ssr: false });

type TaskRun = {
  id: number;
  taskId: string;
  elapsed: number;
  draft: string;
  submittedPrompt: string;
  project: string;
  origin: 'preset' | 'created';
  structureReady: boolean;
  messages: LocalChatMessage[];
};
// The demo's own project carries the case; "Default" is an empty preset project that opens on the Mocha home (the four starter cards).
const PRESET_PROJECT = 'PD-L1 Nanobody Complex';
const EMPTY_PROJECT = 'Default';
const initialRun: TaskRun = {
  id: 0,
  taskId: 'structure',
  elapsed: -1,
  draft: PRESET_PROMPT,
  submittedPrompt: PRESET_PROMPT,
  project: PRESET_PROJECT,
  origin: 'preset',
  structureReady: true,
  messages: [],
};
const copy = {
  zh: { tasks: '任务', tasksBtn: 'Task', projects: 'Project Lists', createProject: 'Create Project', projectName: '项目名称', confirm: '创建', newTask: '新建任务', send: '发送', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…', attached: '已附加结构文件；点击查看 FASTA 序列', runHint: '点击发送，开始运行', runLabel: '发送并运行', restart: '重新运行', restartTitle: '重新开始', completeReply: '如需使用 Mocha 的完整分析能力，请前往 MoleculeOS 平台体验。' },
  en: { tasks: 'Tasks', tasksBtn: 'Task', projects: 'Project Lists', createProject: 'Create Project', projectName: 'Project name', confirm: 'Create', newTask: 'New task', send: 'Send', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…', attached: 'Structure attached; click to inspect FASTA sequences', runHint: 'Send to run the task', runLabel: 'Send and run', restart: 'Run again', restartTitle: 'Start over', completeReply: 'For Mocha’s full analysis capabilities, please continue in the MoleculeOS platform.' },
} as const;

// Idle nudge for the run button: first after 8 s without interaction, again every 8 s, at most three times.
const NUDGE_IDLE = 8000, NUDGE_MAX = 3;

export function MochaCaseWorkbench() {
  const locale = useLocale();
  const t = useTranslations('agentDemo');
  const text = locale === 'en' ? copy.en : copy.zh;
  const rootRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastFrame = useRef<number | null>(null);
  const serial = useRef(0);
  const [runs, setRuns] = useState<TaskRun[]>([initialRun]);
  const [activeId, setActiveId] = useState<number | null>(0);
  const [seen, setSeen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [project, setProject] = useState(PRESET_PROJECT);
  const [projects, setProjects] = useState([PRESET_PROJECT, EMPTY_PROJECT]);
  const [creating, setCreating] = useState(false);
  const [projName, setProjName] = useState('');
  const projRuns = runs.filter(run => run.project === project);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [hoverResidue, setHoverResidue] = useState<string | null>(null);
  const active = runs.find(run => run.id === activeId) ?? null;
  // Before the first send the composer shows one pill button, "发送并运行", with a breathing ring.
  const preRun = !!active && active.elapsed < 0 && !!active.draft.trim();
  const [nudging, setNudging] = useState(false);
  // The table guide (auto demo) runs once per visit; the restart pill starts breathing only after it.
  const [guided, setGuided] = useState(false);
  const stage = phaseAt(active?.elapsed ?? -1);
  const hasRunning = runs.some(run => run.elapsed >= 0 && run.elapsed < DEMO_TOTAL_MS);
  const hasStarted = Boolean(active && active.elapsed >= 0);
  const done = Boolean(active && active.elapsed >= DEMO_TOTAL_MS);
  const hasStructure = Boolean(active?.structureReady);

  const titleFor = (taskId: string) => taskId === 'structure' ? 'PD-L1 · KN035 Complex' : t(ENTRY_TASKS.find(item => item.id === taskId)?.titleKey ?? 'chatTitle');
  const sidebarTitleFor = (run: TaskRun) => {
    const ordinal = runs.filter(item => item.taskId === run.taskId && item.id <= run.id).length;
    return runs.some(item => item.taskId === run.taskId && item.id !== run.id) ? `${titleFor(run.taskId)} · ${ordinal}` : titleFor(run.taskId);
  };

  // Idle nudge: with the workbench on screen and no pointer, wheel or key activity over it for NUDGE_IDLE ms, the run button
  // gives one short shake (plus a vibration on devices that support it). At most NUDGE_MAX times, then it stays quiet.
  useEffect(() => {
    const root = rootRef.current;
    if (!preRun || !visible || !foreground || !root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let last = performance.now(), count = 0, stop = 0;
    const reset = () => { last = performance.now(); };
    const events = ['pointermove', 'pointerdown', 'wheel', 'keydown'] as const;
    events.forEach(name => root.addEventListener(name, reset, { passive: true }));
    const timer = window.setInterval(() => {
      if (count >= NUDGE_MAX || performance.now() - last < NUDGE_IDLE) return;
      count++; last = performance.now();
      setNudging(true); stop = window.setTimeout(() => setNudging(false), 600);
      try { navigator.vibrate?.(30); } catch { /* not supported, or no user activation yet */ }
    }, 500);
    return () => { window.clearInterval(timer); window.clearTimeout(stop); events.forEach(name => root.removeEventListener(name, reset)); setNudging(false); };
  }, [preRun, visible, foreground]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      // Gone from the screen (past screen 2, or back above screen 1's flat view): back to the preset welcome state, so every
      // return starts from the first frame (the structure stays loaded; only the task state resets).
      if (!entry.isIntersecting) {
        setRuns([initialRun]); setActiveId(0); setProject(PRESET_PROJECT); setProjects([PRESET_PROJECT, EMPTY_PROJECT]);
        setTaskOpen(false); setProjOpen(false); setCreating(false); setProjName(''); setGuided(false); setHoverResidue(null);
      }
      if (entry.isIntersecting) setSeen(true);
    }, { threshold: 0.08 });
    if (rootRef.current) observer.observe(rootRef.current);
    const update = () => setForeground(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);

  useEffect(() => {
    if (!visible || !foreground || !hasRunning) { lastFrame.current = null; return; }
    lastFrame.current = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const delta = now - (lastFrame.current ?? now);
      lastFrame.current = now;
      setRuns(current => current.map(run => {
        if (run.elapsed < 0 || run.elapsed >= DEMO_TOTAL_MS) return run;
        const elapsed = Math.min(DEMO_TOTAL_MS, run.elapsed + delta);
        return {
          ...run,
          elapsed,
          structureReady: run.structureReady || phaseAt(elapsed).index >= 5,
        };
      }));
    }, 50);
    return () => { window.clearInterval(timer); lastFrame.current = null; };
  }, [hasRunning, visible, foreground]);

  useEffect(() => {
    if (!hasStarted) return;
    const feed = feedRef.current;
    if (!feed) return;
    // Land on the result's first heading ("预测的复合物"). Layout offsets, not client rects: the workbench may be scaled and
    // tilted (the hero's flat-lying first screen), which would shrink a rect-based distance.
    const result = stage.index >= 5 ? feed.querySelector<HTMLElement>('.mocha-case-result :is(h2, h3), .mocha-case-result') : null;
    let top = feed.scrollHeight;
    if (result) { top = -8; for (let node: HTMLElement | null = result; node && node !== feed; node = node.offsetParent as HTMLElement | null) top += node.offsetTop; }
    feed.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [active?.messages.length, activeId, hasStarted, stage.index]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(200, Math.max(48, textarea.scrollHeight))}px`;
  }, [active?.draft, activeId, hasStructure]);

  // Back to the run's starting point (prompt in the composer, nothing run yet); other runs and projects are untouched.
  function restart() {
    if (!active) return;
    setHoverResidue(null);
    updateActive(run => ({ ...run, elapsed: -1, draft: run.submittedPrompt, messages: [], structureReady: run.origin === 'preset' }));
    feedRef.current?.scrollTo({ top: 0 });
  }

  function updateActive(change: (run: TaskRun) => TaskRun) {
    if (activeId === null) return;
    setRuns(current => current.map(run => run.id === activeId ? change(run) : run));
  }

  function switchProject(name: string) {
    setProject(name); setProjOpen(false); setCreating(false); setHoverResidue(null);
    setActiveId(runs.find(run => run.project === name)?.id ?? null);
    feedRef.current?.scrollTo({ top: 0 });
  }

  function createProject() {
    const name = projName.trim();
    if (!name) return;
    if (!projects.includes(name)) setProjects(current => [...current, name]);
    setProject(name); setProjOpen(false); setCreating(false); setProjName(''); setHoverResidue(null);
    setActiveId(runs.find(run => run.project === name)?.id ?? null);
    feedRef.current?.scrollTo({ top: 0 });
  }

  function createTask(taskId: string) {
    const config = ENTRY_TASKS.find(item => item.id === taskId);
    if (!config) return;
    const id = ++serial.current;
    const prompt = taskId === 'structure' ? PRESET_PROMPT : config.userInput.prompt;
    setRuns(current => [{
      id,
      taskId,
      elapsed: -1,
      draft: prompt,
      submittedPrompt: prompt,
      project,
      origin: 'created',
      structureReady: false,
      messages: [],
    }, ...current]);
    setActiveId(id);
    setHoverResidue(null);
    feedRef.current?.scrollTo({ top: 0 });
  }

  function submit() {
    const message = active?.draft.trim();
    if (!active || !message) return;
    if (active.elapsed < 0) {
      updateActive(run => ({ ...run, submittedPrompt: message, draft: '', elapsed: 0 }));
      return;
    }
    updateActive(run => ({
      ...run,
      draft: '',
      messages: [
        ...run.messages,
        { id: `${run.id}-user-${run.messages.length}`, role: 'user', content: message },
        { id: `${run.id}-assistant-${run.messages.length + 1}`, role: 'assistant', content: text.completeReply },
      ],
    }));
  }

  const idleItems = ENTRY_TASKS.map(item => ({ id: item.id, title: t(item.titleKey), description: t(item.subtitleKey) }));

  return <div id="mocha-workbench" className="agent-demo-slot mocha-case-slot">
    <div ref={rootRef} className="agent-demo agent-demo-live mocha-upgrade-root mocha-case-workbench" aria-label="Mocha workbench">
      <div className="agent-demo-top mocha-case-top">
        <span className="agent-brand">MoleculeOS <span className="agent-beta">BETA</span></span>
        <div className="agent-project-title mocha-case-project">
          <button type="button" aria-expanded={projOpen} onClick={() => { setProjOpen(v => !v); setTaskOpen(false); setCreating(false); setProjName(''); }}>{project}<ChevronDown size={14}/></button>
          {projOpen && <div className="mocha-case-proj-menu" role="menu">
            <span className="mocha-case-proj-label">{text.projects}</span>
            {projects.map(name => <button type="button" key={name} className={name === project ? 'is-on' : ''} onClick={() => switchProject(name)}>{name}</button>)}
            {creating
              ? <form className="mocha-case-proj-form" onSubmit={event => { event.preventDefault(); createProject(); }}>
                  <input autoFocus value={projName} maxLength={40} onChange={event => setProjName(event.target.value)} placeholder={text.projectName} aria-label={text.projectName}/>
                  <button type="submit" className="mocha-case-proj-create" disabled={!projName.trim()}>{text.confirm}</button>
                </form>
              : <button type="button" className="mocha-case-proj-create" onClick={() => setCreating(true)}>{text.createProject}</button>}
          </div>}
        </div>
        <nav className="mocha-case-tabs" aria-label={text.tasks}>
          <button type="button" className="mocha-case-task-btn" aria-expanded={taskOpen} onClick={() => { setTaskOpen(v => !v); setProjOpen(false); }}>{text.tasksBtn}</button>
          <Mail size={17} aria-hidden="true"/><Bell size={17} aria-hidden="true"/><Settings size={17} aria-hidden="true"/>
          {taskOpen && <div className="mocha-case-task-menu" role="menu">
            <button type="button" className="mocha-case-new" onClick={() => { setActiveId(null); setHoverResidue(null); setTaskOpen(false); feedRef.current?.scrollTo({ top: 0 }); }}><Plus size={15}/><span>{text.newTask}</span></button>
            <div className="mocha-case-run-list">{projRuns.map(run => <button type="button" className="mocha-case-run" aria-pressed={activeId === run.id} key={run.id} onClick={() => { setActiveId(run.id); setHoverResidue(null); setTaskOpen(false); }} title={sidebarTitleFor(run)}><strong>{sidebarTitleFor(run)}</strong></button>)}</div>
          </div>}
        </nav>
      </div>
      <div className={`mocha-case-grid${hasStructure ? ' has-structure' : ''}`}>
        <div className="mocha-case-structure" aria-hidden={!hasStructure}>
          {hasStructure && active && seen && <Structure key={active.id} title={titleFor(active.taskId)} phase={stage.phase} phaseProgress={stage.progress} running={visible && foreground} hoverResidue={hoverResidue}/>}
        </div>
        <section className="mocha-case-chat" aria-label="Mocha conversation">
          <header className="mocha-case-chat-head"><Image src={mochaIcon} alt="" width={22} height={26} style={{ width: 22, height: 26 }}/><strong>Mocha</strong>
            {hasStarted && <button type="button" className="mocha-case-restart" title={text.restartTitle} aria-label={text.restartTitle} onClick={restart}><RotateCcw size={15}/></button>}
          </header>
          <div className={`mocha-case-feed${!active ? ' is-idle' : active.elapsed < 0 ? ' is-welcome' : ''}`} ref={feedRef} aria-live="polite">
            {!active ? <MochaIdle banner={t('intro')} prompt={t('welcomeTitle')} sectionLabel={t('samples')} items={idleItems} onSelect={createTask}/> : active.elapsed < 0 ? <MochaWelcome/> : <MochaCaseFlow taskId={active.taskId} taskTitle={titleFor(active.taskId)} submittedPrompt={active.submittedPrompt} messages={active.messages} stage={stage} locale={locale} done={done} onHoverResidue={setHoverResidue} guide={!guided} onGuideEnd={() => setGuided(true)}/>} 
          </div>
          <div className="mocha-case-composer-zone"><div className="mocha-case-composer">
            {active && active.elapsed < 0 && <details className="mocha-case-attachment"><summary title={text.attached}><FileCode2 size={14}/><span>{ATTACHED_STRUCTURE_NAME}</span><X size={13} aria-hidden="true"/></summary><div className="mocha-case-fasta">{DEMO_SEQUENCES.map(item => <div key={item.chain}><strong>{item.name} · chain {item.chain} · {item.sequence.length} aa</strong><code>{item.sequence}</code></div>)}</div></details>}
            <textarea ref={textareaRef} aria-label={text.placeholder} placeholder={text.placeholder} value={active?.draft ?? ''} onChange={event => updateActive(run => ({ ...run, draft: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} disabled={!active} rows={2}/>
            <div className="mocha-case-composer-bottom">{preRun
              ? <button type="button" className={`mocha-case-run${nudging ? ' is-nudging' : ''}`} title={text.runHint} onClick={submit}>{text.runLabel}<Send size={14} aria-hidden="true"/></button>
              : done && !active?.draft.trim()
              ? <button type="button" className={`mocha-case-run is-restart${guided ? '' : ' is-quiet'}`} title={text.restartTitle} onClick={restart}><RotateCcw size={14} aria-hidden="true"/>{text.restart}</button>
              : <button type="button" className={active?.draft.trim() ? 'is-ready' : ''} aria-label={text.send} onClick={submit} disabled={!active?.draft.trim()}><Send size={16}/></button>}</div>
          </div></div>
        </section>
      </div>
    </div>
  </div>;
}
