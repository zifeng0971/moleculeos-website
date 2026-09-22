'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Circle, FileText, LoaderCircle, Plus } from 'lucide-react';
import { AGENT_PROJECTS, AGENT_TASKS } from '@/lib/agent-demo';
import { SITE_CONFIG } from '@/lib/site-config';
import { MutationPanel } from '../MutationPanel';
import structureData from '@/content/antibody-affinity-structure.json';
import { buildMochaFlow, type MochaFlowConfig } from './flow-adapter';
import { MochaPanel } from './vendor/src/pages/MochaPanel/MochaPanel';
import type { UnfoldStep } from './vendor/src/data/mochaFlow';
import './vendor-tokens.css';
import '../agent-demo.css';
import './mocha-upgrade.css';
import '../product-surface.css';

function StructureLoading() {
  const t = useTranslations('agentDemo.structure');
  return <div className="agent-structure-cover" role="status">{t('loading')}</div>;
}

const AgentStructure = dynamic(() => import('../AgentStructure'), { ssr: false, loading: StructureLoading });

type RunState = {
  id: number;
  taskId: string;
  ordinal: number;
  stepIndex: number;
  paused: boolean;
  complete: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
};

const EMPTY_SELECTION: string[] = [];

// Pure front-end product walkthrough. It has no service, session or telemetry client.
export function MochaWorkbench() {
  const t = useTranslations('agentDemo');
  const [runs, setRuns] = useState<RunState[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<UnfoldStep | null>(null);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [focus, setFocus] = useState<{ residue: string; serial: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const serial = useRef(0);

  const titleFor = (taskId: string) => taskId === 'affinity'
    ? 'Antibody Affinity Optimization'
    : t(AGENT_TASKS.find((item) => item.id === taskId)?.titleKey ?? 'chatTitle');

  const flows = useMemo(() => Object.fromEntries(AGENT_TASKS.map((task) => [
    task.id,
    buildMochaFlow(task, task.id === 'affinity' ? 'Antibody Affinity Optimization' : t(task.titleKey)),
  ])) as Record<string, MochaFlowConfig>, [t]);

  const active = runs.find((run) => run.id === activeId) ?? null;
  const activeFlow = active ? flows[active.taskId] : null;
  const activeStep = active && activeFlow ? activeFlow.steps[Math.min(active.stepIndex, activeFlow.steps.length - 1)] : undefined;
  const activePlaying = Boolean(active && !active.complete && !active.paused && visible && foreground && !reduced);
  const selected = active ? selections[active.id] ?? EMPTY_SELECTION : EMPTY_SELECTION;
  const presetRun = runs.find((run) => run.id === 0);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => setReduced(media.matches);
    syncMotion();
    media.addEventListener('change', syncMotion);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (frame.current) observer.observe(frame.current);
    const syncVisibility = () => setForeground(!document.hidden);
    syncVisibility();
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      observer.disconnect();
      media.removeEventListener('change', syncMotion);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  useEffect(() => {
    if (!visible || !foreground || reduced) return;
    const timer = window.setInterval(() => {
      setRuns((current) => current.map((run) => {
        if (run.id === activeId || run.paused || run.complete) return run;
        const flow = flows[run.taskId];
        const next = run.stepIndex + 1;
        return next >= flow.steps.length ? { ...run, complete: true } : { ...run, stepIndex: next };
      }));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [activeId, flows, foreground, reduced, visible]);

  useEffect(() => {
    if (!active || active.taskId !== 'affinity' || !active.complete) return;
    setSelections((current) => current[active.id]?.length ? current : { ...current, [active.id]: structureData.highlighted });
  }, [active]);

  function openTask(taskId: string) {
    const flow = flows[taskId];
    if (!flow) return;
    const existing = taskId === AGENT_PROJECTS[0].taskId ? runs.find((run) => run.id === 0) : undefined;
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const id = taskId === AGENT_PROJECTS[0].taskId ? 0 : ++serial.current;
    const ordinal = runs.filter((run) => run.taskId === taskId).length + 1;
    setRuns((current) => [{ id, taskId, ordinal, stepIndex: 0, paused: reduced, complete: false, messages: [] }, ...current]);
    setActiveId(id);
  }

  function advanceActive() {
    if (!active || !activeFlow) return;
    setRuns((current) => current.map((run) => {
      if (run.id !== active.id) return run;
      const next = run.stepIndex + 1;
      return next >= activeFlow.steps.length ? { ...run, complete: true, paused: false } : { ...run, stepIndex: next };
    }));
  }

  function submit() {
    const content = draft.trim();
    if (active && active.paused && !content) {
      if (reduced) {
        advanceActive();
        return;
      }
      setRuns((current) => current.map((run) => run.id === active.id ? { ...run, paused: false } : run));
      return;
    }
    if (!content) return;
    const reply = t('localReply');
    if (!active) {
      const id = ++serial.current;
      setRuns((current) => [{ id, taskId: 'humanization', ordinal: 1, stepIndex: flows.humanization.steps.length - 1, paused: false, complete: true, messages: [{ role: 'user', content }, { role: 'assistant', content: reply }] }, ...current]);
      setActiveId(id);
    } else {
      setRuns((current) => current.map((run) => run.id === active.id ? { ...run, messages: [...run.messages, { role: 'user', content }, { role: 'assistant', content: reply }] } : run));
    }
    setDraft('');
  }

  function selectResidue(label: string) {
    if (!active) return;
    setSelections((current) => {
      const values = current[active.id] ?? [];
      return { ...current, [active.id]: values.includes(label) ? values.filter((item) => item !== label) : [...values, label] };
    });
    setFocus({ residue: label, serial: Date.now() });
  }

  const idleItems = AGENT_TASKS.map((task) => ({ id: task.id, title: t(task.titleKey), description: t(task.subtitleKey) }));
  const renderSlot = (kind: 'structure' | 'mutationTable') => {
    if (kind === 'mutationTable') return <MutationPanel onSelect={selectResidue} />;
    if (!active) return null;
    return <div className="mocha-inline-structure"><AgentStructure taskId={active.id} prepared selected={selected} onSelect={selectResidue} focus={focus} running={visible && foreground}/></div>;
  };

  return <div className="agent-demo-slot">
    <div ref={frame} className={`agent-demo agent-demo-live agent-multitask mocha-upgrade mocha-upgrade-root ${active ? 'agent-has-task' : ''}`} aria-label={t('label')}>
      <div className="agent-demo-top"><span className="agent-brand">MOS <span className="agent-beta">BETA</span></span><span className="agent-project-title">{active ? titleFor(active.taskId) : 'Mocha'}</span></div>
      <div className="agent-workspace mocha-upgrade-workspace">
        <aside className="agent-run-sidebar" aria-label={t('tasksLabel')}>
          <div className="agent-sidebar-heading"><span>{t('tasksLabel')}</span><button type="button" className="agent-new-task" onClick={() => setActiveId(null)}><Plus size={14}/>{t('newTask')}</button></div>
          <div className="agent-run-list">
            {AGENT_PROJECTS.map((project) => <button type="button" className="agent-run agent-preset-project" aria-pressed={activeId === 0} key={project.title} onClick={() => openTask(project.taskId)}>
              {presetRun ? presetRun.complete ? <CheckCircle2 size={15}/> : presetRun.paused ? <Circle size={15}/> : <LoaderCircle size={15} className="agent-running-icon"/> : <FileText size={15}/>}<span><strong>{project.title}</strong>{presetRun && <small>{t(presetRun.complete ? 'complete' : presetRun.paused ? 'paused' : 'playing')}</small>}</span>
            </button>)}
            {runs.filter((run) => run.id !== 0).map((run) => <button type="button" className="agent-run" aria-pressed={activeId === run.id} key={run.id} onClick={() => setActiveId(run.id)}>
              {run.complete ? <CheckCircle2 size={15}/> : run.paused ? <Circle size={15}/> : <LoaderCircle size={15} className="agent-running-icon"/>}<span><strong>{titleFor(run.taskId)}{run.ordinal > 1 ? ` · ${run.ordinal}` : ''}</strong><small>{t(run.complete ? 'complete' : run.paused ? 'paused' : 'playing')}</small></span>
            </button>)}
          </div>
        </aside>
        <main className="mocha-upgrade-panel-shell">
          <MochaPanel
            header={{ title: 'Mocha' }}
            idle={!active}
            playing={Boolean(active && !active.complete)}
            paused={Boolean(active && (active.paused || reduced))}
            step={activeStep}
            flowSteps={activeFlow?.steps ?? []}
            paceScale={activeFlow?.paceScale ?? 0.25}
            draft={draft}
            onDraftChange={setDraft}
            onSubmit={submit}
            onPause={() => active && setRuns((current) => current.map((run) => run.id === active.id ? { ...run, paused: true } : run))}
            selectedThinkingStep={thinkingStep}
            onThinkingStepSelect={setThinkingStep}
            onFrameComplete={activePlaying ? advanceActive : undefined}
            idleContent={{ banner: t('intro'), prompt: t('welcomeTitle'), sectionLabel: t('samples'), items: idleItems }}
            onIdleSelect={openTask}
            composerPlaceholder={t('inputPlaceholder')}
            disclaimerText={t('disclaimer')}
            renderReportSlot={renderSlot}
          />
          {active?.messages.length ? <div className="mocha-local-messages" aria-live="polite">{active.messages.map((message, index) => <div key={index} data-role={message.role}><strong>{message.role === 'user' ? t('you') : 'Mocha'}</strong><p>{message.content}</p>{message.role === 'assistant' && <a href={SITE_CONFIG.platformUrl} target="_blank" rel="noopener noreferrer">{t('openPlatform')} ↗</a>}</div>)}</div> : null}
        </main>
      </div>
    </div>
  </div>;
}
