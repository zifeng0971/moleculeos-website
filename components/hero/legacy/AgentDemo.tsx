'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Bot, CheckCircle2, Circle, Dna, FileText, GitBranch, LoaderCircle, Network, Plus, Send, Sparkles } from 'lucide-react';
import { AGENT_PROJECTS, AGENT_TASKS, DEMO_STEP_INTERVAL, agentStageAt } from '@/lib/agent-demo';
import { advanceRuns, appendLocalReply, createChatRun, createRun, ensurePresetRun, runStatus, type AgentConversation, type AgentRun } from '@/lib/agent-playback';
import { SITE_CONFIG } from '@/lib/site-config';
import { AgentWorkflowStep } from '../AgentWorkflowStep';
import { AgentUserInput } from '../AgentUserInput';
import structureData from '@/content/antibody-affinity-structure.json';
import '../agent-demo.css';
import '../product-surface.css';

function StructureLoading() { const t = useTranslations('agentDemo.structure'); return <div className="agent-structure-cover" role="status">{t('loading')}</div>; }
const Structure = dynamic(() => import('../AgentStructure'), { ssr: false, loading: StructureLoading });
const EMPTY_SELECTION: string[] = [];

// Pure front-end product walkthrough. It has no service, session or telemetry client.
export function LegacyAgentDemo() {
  const t = useTranslations('agentDemo');
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [conversations, setConversations] = useState<AgentConversation>({});
  const [draft, setDraft] = useState('');
  const [activeId, setActiveId] = useState<number | null>(null);
  const [reduced, setReduced] = useState(true);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [pane, setPane] = useState<'flow'|'structure'>('flow');
  const [viewerMounted, setViewerMounted] = useState(false);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [focus, setFocus] = useState<{ residue: string; serial: number } | null>(null);
  const serial = useRef(0);
  const frame = useRef<HTMLDivElement>(null);
  const transcript = useRef<HTMLDivElement>(null);
  const active = runs.find(run => run.id === activeId);
  const task = AGENT_TASKS.find(item => item.id === active?.taskId);
  const stage = agentStageAt(active?.elapsed ?? 0, task?.steps.length ?? 0);
  const hasStructure = !!active && !!task && runStatus(active) === 'complete' && task.steps.some(step => step.type === 'result' && (step.structure || step.structureHighlight));
  const hasRunning = runs.some(run => runStatus(run) === 'playing');
  const selected = active ? selections[active.id] ?? EMPTY_SELECTION : EMPTY_SELECTION;
  const presetRun = runs.find(run => run.id === 0);
  const icons = [Dna, GitBranch, Network, Sparkles];
  const taskTitle = (taskId: string) => taskId === 'affinity' ? 'Antibody Affinity Optimization' : t(AGENT_TASKS.find(item => item.id === taskId)?.titleKey ?? 'chatTitle');

  function selectResidue(label: string) {
    if (!active) return;
    setSelections(value => { const current = value[active.id] ?? []; return { ...value, [active.id]: current.includes(label) ? current.filter(item => item !== label) : [...current, label] }; });
    setFocus({ residue: label, serial: Date.now() });
    setPane('structure');
  }
  useEffect(() => { setFocus(null); }, [activeId]);
  useEffect(() => { setPane(hasStructure ? 'structure' : 'flow'); if (hasStructure) setViewerMounted(true); }, [activeId, hasStructure]);
  useEffect(() => {
    if (!active || !hasStructure || active.taskId !== 'affinity') return;
    setSelections(value => value[active.id]?.length ? value : { ...value, [active.id]: structureData.highlighted });
  }, [active, hasStructure]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(frame.current!);
    const visibility = () => setForeground(!document.hidden);
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  useEffect(() => {
    if (!visible || !foreground || !hasRunning) return;
    const clock = setInterval(() => setRuns(value => advanceRuns(value, DEMO_STEP_INTERVAL)), DEMO_STEP_INTERVAL);
    return () => clearInterval(clock);
  }, [visible, foreground, hasRunning]);
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' }); }, [stage, activeId, reduced, conversations]);

  function start(taskId: string) {
    const chosen = AGENT_TASKS.find(item => item.id === taskId);
    if (!chosen) return;
    if (taskId === AGENT_PROJECTS[0].taskId) {
      setRuns(value => ensurePresetRun(value, taskId, false, chosen.steps.length));
      setActiveId(0);
      return;
    }
    const id = ++serial.current;
    setRuns(value => [...value, createRun(value, id, taskId, false, chosen.steps.length)]);
    setActiveId(id);
  }
  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const message = draft.trim(); if (!message) return;
    if (activeId === null) {
      const id = ++serial.current;
      setRuns(value => [...value, createChatRun(value, id)]);
      setConversations(value => appendLocalReply(value, id, message, t('localReply')));
      setActiveId(id);
    } else setConversations(value => appendLocalReply(value, activeId, message, t('localReply')));
    setDraft('');
  }

  return <div className="agent-demo-slot"><div ref={frame} className={`agent-demo agent-demo-live agent-multitask ${active ? 'agent-has-task' : ''} ${hasStructure ? 'agent-has-structure' : ''}`} aria-label={t('label')}>
    <div className="agent-demo-top"><span className="agent-brand">MOS <span className="agent-beta">BETA</span></span><span className="agent-project-title">{task ? taskTitle(task.id) : 'Mocha'}</span></div>
    <div className="agent-workspace">
      <aside className="agent-run-sidebar" aria-label={t('tasksLabel')}><div className="agent-sidebar-heading"><span>{t('tasksLabel')}</span><button type="button" className="agent-new-task" onClick={() => setActiveId(null)}><Plus size={14}/>{t('newTask')}</button></div>
        <div className="agent-run-list">{AGENT_PROJECTS.map(project => <button type="button" className="agent-run agent-preset-project" aria-pressed={activeId === 0} key={project.title} onClick={() => start(project.taskId)}>{presetRun ? runStatus(presetRun) === 'complete' ? <CheckCircle2 size={15}/> : runStatus(presetRun) === 'paused' ? <Circle size={15}/> : <LoaderCircle size={15} className="agent-running-icon"/> : <FileText size={15}/>}<span><strong>{project.title}</strong>{presetRun && <small>{t(runStatus(presetRun))}</small>}</span></button>)}
          {runs.filter(run => run.id !== 0).map(run => { const status = runStatus(run); const runTask = AGENT_TASKS.find(item => item.id === run.taskId); return <button type="button" key={run.id} className="agent-run" aria-pressed={activeId === run.id} onClick={() => setActiveId(run.id)}>{status === 'complete' ? <CheckCircle2 size={15}/> : status === 'paused' ? <Circle size={15}/> : <LoaderCircle size={15} className="agent-running-icon"/>}<span><strong>{runTask ? taskTitle(runTask.id) : t('chatTitle')} · {run.ordinal}</strong><small>{run.taskId === 'chat' ? t('chatStatus') : t(status)}</small></span></button>; })}
        </div>
      </aside>
      {hasStructure && <div className="agent-pane-tabs"><button aria-pressed={pane === 'flow'} onClick={() => setPane('flow')}>Mocha</button><button aria-pressed={pane === 'structure'} onClick={() => setPane('structure')}>{t('structure.structure')}</button></div>}
      <div className={`agent-structure-pane ${!hasStructure ? 'agent-pane-absent' : ''} ${pane !== 'structure' ? 'agent-pane-mobile-hidden' : ''}`}>{viewerMounted && <Structure taskId={task ? activeId : null} prepared={hasStructure} selected={selected} onSelect={selectResidue} focus={focus} running={visible && foreground && hasStructure}/>}</div>
      <main className={`agent-main-pane ${hasStructure && pane !== 'flow' ? 'agent-pane-mobile-hidden' : ''}`}>
        {active && <div className="agent-panel-heading"><Bot size={18}/><span>Mocha</span><button type="button" onClick={() => setActiveId(null)}>{t('newTask')}</button></div>}
        {!active ? <div className="agent-welcome"><p className="agent-intro"><Sparkles size={14}/>{t('intro')}</p><h2 className="agent-view-title">{t('welcomeTitle')}</h2><p className="agent-samples-label">{t('samples')}</p><div className="agent-samples">{AGENT_TASKS.map((item, index) => { const Icon = icons[index]; return <button type="button" className="agent-sample" key={item.id} onClick={() => start(item.id)}><strong><Icon size={16}/>{t(item.titleKey)}</strong><small>{t(item.subtitleKey)}</small></button>; })}</div></div> : <>
          <div className="agent-session-heading"><h2 className="agent-view-title">{task ? taskTitle(task.id) : t('chatTitle')}{active.id === 0 ? '' : ` · ${active.ordinal}`}</h2><span role="status">{task ? t(runStatus(active)) : t('chatStatus')}</span></div>
          <div className="agent-transcript" ref={transcript}>{task && <><AgentUserInput task={task}/><div className="agent-speaker agent-beat"><Sparkles size={14}/>Assistant</div><div className="agent-assistant-body">{task.steps.slice(0, stage).map((step, index) => <AgentWorkflowStep key={`${active.id}-${index}`} step={step} onSelect={selectResidue}/>)}</div>{runStatus(active) === 'complete' && <div className="agent-workflow-end"><CheckCircle2 size={17}/><span>Workflow complete</span><button type="button" onClick={() => setActiveId(null)}>{t('newTask')}</button></div>}</>}
            {(conversations[active.id] ?? []).map((message, index) => message.role === 'user' ? <div className="agent-message agent-message-user" key={index}><small>{t('you')}</small><p>{message.content}</p></div> : <div className="agent-message agent-message-assistant" key={index}><div className="agent-speaker"><Sparkles size={14}/>Mocha</div><p>{message.content}</p><a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer">{t('openPlatform')} ↗</a></div>)}
          </div>
        </>}
        <form className="agent-demo-input" onSubmit={sendMessage}><div className="agent-composer-body">{hasStructure && <span className="agent-context-chip">complex</span>}<textarea value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={2000} rows={2} aria-label={t('inputPlaceholder')} placeholder={t('inputPlaceholder')}/></div><button type="submit" disabled={!draft.trim()} aria-label={t('send')}><Send size={17}/></button></form>
      </main>
    </div>
  </div></div>;
}

