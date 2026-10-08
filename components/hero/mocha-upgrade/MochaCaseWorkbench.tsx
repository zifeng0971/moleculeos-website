'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileCode2, Plus, Send, X } from 'lucide-react';
import { DEMO_TASKS } from '@/demo/tasks.config';
import mochaIcon from './vendor/src/assets/mocha/icon-mocha.svg';
import { MochaIdle } from './vendor/src/components/mocha/MochaIdle/MochaIdle';
import { MochaCaseFlow, type LocalChatMessage } from './MochaCaseFlow';
import { ATTACHED_STRUCTURE_NAME, DEMO_TOTAL_MS, PRESET_PROMPT, phaseAt } from './demoScript';
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
  origin: 'preset' | 'created';
  structureReady: boolean;
  messages: LocalChatMessage[];
};
const initialRun: TaskRun = {
  id: 0,
  taskId: 'affinity',
  elapsed: -1,
  draft: PRESET_PROMPT,
  submittedPrompt: PRESET_PROMPT,
  origin: 'preset',
  structureReady: true,
  messages: [],
};
const copy = {
  zh: { tasks: '任务', newTask: '新建任务', send: '发送', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…', attached: '已附加结构文件；点击查看 FASTA 序列', completeReply: '如需使用 Mocha 的完整分析能力，请前往 MOS 平台体验。' },
  en: { tasks: 'Tasks', newTask: 'New task', send: 'Send', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…', attached: 'Structure attached; click to inspect FASTA sequences', completeReply: 'For Mocha’s full analysis capabilities, please continue in the MOS platform.' },
} as const;

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
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [hoverResidue, setHoverResidue] = useState<string | null>(null);
  const active = runs.find(run => run.id === activeId) ?? null;
  const stage = phaseAt(active?.elapsed ?? -1);
  const hasRunning = runs.some(run => run.elapsed >= 0 && run.elapsed < DEMO_TOTAL_MS);
  const hasStarted = Boolean(active && active.elapsed >= 0);
  const done = Boolean(active && active.elapsed >= DEMO_TOTAL_MS);
  const hasStructure = Boolean(active?.structureReady);

  const titleFor = (taskId: string) => taskId === 'affinity' ? 'Antibody Affinity Optimization' : t(DEMO_TASKS.find(item => item.id === taskId)?.titleKey ?? 'chatTitle');
  const sidebarTitleFor = (run: TaskRun) => {
    const ordinal = runs.filter(item => item.taskId === run.taskId && item.id <= run.id).length;
    return runs.some(item => item.taskId === run.taskId && item.id !== run.id) ? `${titleFor(run.taskId)} · ${ordinal}` : titleFor(run.taskId);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
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
    const result = stage.index >= 5 ? feed.querySelector('.mocha-case-result') : null;
    const top = result ? result.getBoundingClientRect().top - feed.getBoundingClientRect().top + feed.scrollTop : feed.scrollHeight;
    feed.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [active?.messages.length, activeId, hasStarted, stage.index]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(200, Math.max(76, textarea.scrollHeight))}px`;
  }, [active?.draft, activeId, hasStructure]);

  function updateActive(change: (run: TaskRun) => TaskRun) {
    if (activeId === null) return;
    setRuns(current => current.map(run => run.id === activeId ? change(run) : run));
  }

  function createTask(taskId: string) {
    const config = DEMO_TASKS.find(item => item.id === taskId);
    if (!config) return;
    const id = ++serial.current;
    const prompt = taskId === 'affinity' ? PRESET_PROMPT : config.userInput.prompt;
    setRuns(current => [{
      id,
      taskId,
      elapsed: -1,
      draft: prompt,
      submittedPrompt: prompt,
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

  const idleItems = DEMO_TASKS.map(item => ({ id: item.id, title: t(item.titleKey), description: t(item.subtitleKey) }));

  return <div id="mocha-workbench" className="agent-demo-slot mocha-case-slot">
    <div ref={rootRef} className="agent-demo agent-demo-live mocha-upgrade-root mocha-case-workbench" aria-label="Mocha workbench">
      <div className="agent-demo-top mocha-case-top"><span className="agent-brand">MOS <span className="agent-beta">BETA</span></span><span className="agent-project-title">{active ? titleFor(active.taskId) : 'Mocha'}</span></div>
      <div className={`mocha-case-grid${hasStructure ? ' has-structure' : ''}`}>
        <aside className="mocha-case-sidebar" aria-label={text.tasks}>
          <span className="mocha-case-sidebar-title">{text.tasks}</span>
          <button type="button" className="mocha-case-new" onClick={() => { setActiveId(null); setHoverResidue(null); feedRef.current?.scrollTo({ top: 0 }); }}><Plus size={15}/>{text.newTask}</button>
          <div className="mocha-case-run-list">{runs.map(run => <button type="button" className="mocha-case-run" aria-pressed={activeId === run.id} key={run.id} onClick={() => { setActiveId(run.id); setHoverResidue(null); }} title={sidebarTitleFor(run)}><span className="mocha-case-selected-marker"/><strong>{sidebarTitleFor(run)}</strong></button>)}</div>
        </aside>
        <div className="mocha-case-structure" aria-hidden={!hasStructure}>
          {hasStructure && active && seen && <Structure key={active.id} title={titleFor(active.taskId)} phase={stage.phase} phaseProgress={stage.progress} running={visible && foreground} hoverResidue={hoverResidue}/>}
        </div>
        <section className="mocha-case-chat" aria-label="Mocha conversation">
          <header className="mocha-case-chat-head"><Image src={mochaIcon} alt="" width={22} height={26} style={{ width: 22, height: 26 }}/><strong>Mocha</strong></header>
          <div className={`mocha-case-feed${!active ? ' is-idle' : ''}`} ref={feedRef} aria-live="polite">
            {!active ? <MochaIdle banner={t('intro')} prompt={t('welcomeTitle')} sectionLabel={t('samples')} items={idleItems} onSelect={createTask}/> : active.elapsed < 0 ? null : <MochaCaseFlow taskId={active.taskId} taskTitle={titleFor(active.taskId)} submittedPrompt={active.submittedPrompt} messages={active.messages} stage={stage} locale={locale} done={done} onHoverResidue={setHoverResidue}/>} 
          </div>
          <div className="mocha-case-composer-zone"><div className="mocha-case-composer">
            {active && active.elapsed < 0 && <details className="mocha-case-attachment"><summary title={text.attached}><FileCode2 size={14}/><span>{ATTACHED_STRUCTURE_NAME}</span><X size={13} aria-hidden="true"/></summary><div className="mocha-case-fasta">{DEMO_SEQUENCES.map(item => <div key={item.chain}><strong>{item.name} · chain {item.chain} · {item.sequence.length} aa</strong><code>{item.sequence}</code></div>)}</div></details>}
            <textarea ref={textareaRef} aria-label={text.placeholder} placeholder={text.placeholder} value={active?.draft ?? ''} onChange={event => updateActive(run => ({ ...run, draft: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} disabled={!active} rows={5}/>
            <div className="mocha-case-composer-bottom"><span>MOS · Mocha</span><button type="button" className={active?.draft.trim() ? 'is-ready' : ''} aria-label={text.send} onClick={submit} disabled={!active?.draft.trim()}><Send size={16}/></button></div>
          </div></div>
        </section>
      </div>
    </div>
  </div>;
}
