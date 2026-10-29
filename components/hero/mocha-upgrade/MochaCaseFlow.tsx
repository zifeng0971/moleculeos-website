'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LocateFixed } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import mochaIcon from './vendor/src/assets/mocha/icon-mocha.svg';
import thinkingIcon from './vendor/src/assets/mocha/icon-thinking.svg';
import taskIcon from './vendor/src/assets/mocha/icon-mostask.svg';
import { ChatBubble } from './vendor/src/components/mocha/ChatBubble/ChatBubble';
import { TaskRow } from './vendor/src/components/mocha/TaskRow/TaskRow';
import { ReportBody } from './vendor/src/components/mocha/ReportBody/ReportBody';
import type { TaskRowData, StepResult } from './vendor/src/data/mochaFlow';
import { DEMO_PAIRS, DEMO_PHASES, DEMO_SAMPLES, DEMO_STEP_NOTES, DEMO_SUMMARY, DEMO_VS_CRYSTAL, ENTRY_TASKS, phaseAt } from './demoScript';

type Props = {
  taskId: string;
  taskTitle: string;
  submittedPrompt: string;
  messages: LocalChatMessage[];
  stage: ReturnType<typeof phaseAt>;
  locale: string;
  done: boolean;
  onHoverResidue: (residue: string | null) => void;
  /** Run the table guide (auto demo) for this result; false once it has run this visit. */
  guide?: boolean;
  onGuideEnd?: () => void;
};

export type LocalChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

// Table guide timing: wait after the result appears, then light this many residues for this long each; the guide counts as
// done after its demo plus a grace period, or at the visitor's first own hover.
const GUIDE_DELAY = 1000, GUIDE_STEPS = 3, GUIDE_STEP_MS = 1200, GUIDE_GRACE = 6000;

export function MochaCaseFlow({ taskId, taskTitle, submittedPrompt, messages, stage, locale, done, onHoverResidue, guide = false, onGuideEnd }: Props) {
  const t = useTranslations('agentDemo');
  const task = ENTRY_TASKS.find(item => item.id === taskId);
  const isEntry = taskId === 'structure';
  // Interface-table guide: once the finished result shows, light the first few PD-L1 residues one by one (each also lights
  // up in the 3D structure). The demo stops as soon as the visitor enters the table, clicks or scrolls the conversation.
  const pairsRef = useRef<HTMLDivElement>(null);
  const [demoCell, setDemoCell] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);
  const showGuide = guide && done && isEntry;
  const onGuideEndRef = useRef(onGuideEnd); onGuideEndRef.current = onGuideEnd;
  const hoverRef = useRef(onHoverResidue); hoverRef.current = onHoverResidue;
  useEffect(() => {
    const table = pairsRef.current;
    if (!showGuide || !table) return;
    const timers: number[] = [];
    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true; timers.forEach(window.clearTimeout); setDemoCell(null); hoverRef.current(null);
      timers.push(window.setTimeout(() => onGuideEndRef.current?.(), GUIDE_GRACE));
    };
    const feed = table.closest<HTMLElement>('.mocha-case-feed');
    timers.push(window.setTimeout(() => {
      // Bring the table into the conversation's view (layout offsets: the workbench may be transformed).
      if (feed) { let top = -12; for (let node: HTMLElement | null = table; node && node !== feed; node = node.offsetParent as HTMLElement | null) top += node.offsetTop; feed.scrollTo({ top, behavior: 'smooth' }); }
      DEMO_PAIRS.slice(0, GUIDE_STEPS).forEach((pair, i) => timers.push(window.setTimeout(() => {
        if (stopped) return;
        setDemoCell(pair.a); hoverRef.current(pair.aResidue);
      }, 500 + i * GUIDE_STEP_MS)));
      timers.push(window.setTimeout(stop, 500 + GUIDE_STEPS * GUIDE_STEP_MS));
    }, GUIDE_DELAY));
    table.addEventListener('pointerenter', stop);
    feed?.addEventListener('wheel', stop, { passive: true }); feed?.addEventListener('pointerdown', stop);
    return () => { timers.forEach(window.clearTimeout); table.removeEventListener('pointerenter', stop); feed?.removeEventListener('wheel', stop); feed?.removeEventListener('pointerdown', stop); };
  }, [showGuide]);
  // A real hover ends the guide right away.
  const userHover = (residue: string | null) => {
    onHoverResidue(residue);
    if (residue && !hovered) { setHovered(true); onGuideEndRef.current?.(); }
  };
  const en = locale === 'en';
  const labels = useMemo(() => isEntry
    ? DEMO_PHASES.map(item => locale === 'en' ? item.titleEn : item.titleZh)
    : [
        locale === 'en' ? 'Thinking' : '思考中',
        t(`tasks.${taskId}.plan0`),
        t(`tasks.${taskId}.plan1`),
        t(`tasks.${taskId}.plan2`),
        locale === 'en' ? 'Prepare results' : '整理结果',
        t(`tasks.${taskId}.result`),
      ], [isEntry, locale, t, taskId]);
  const descriptions = isEntry
    ? [...DEMO_STEP_NOTES]
    : [
        task?.steps.find(step => step.type === 'thinking')?.text ?? '',
        task?.steps.find(step => step.type === 'tool')?.name ?? '',
        task?.steps.filter(step => step.type === 'tool')[1]?.name ?? '',
        task?.steps.find(step => step.type === 'text')?.text ?? '',
        task?.steps.find(step => step.type === 'result')?.note ?? '',
      ];

  const resultStep = task?.steps.find(step => step.type === 'result');
  const result: StepResult = {
    paragraphs: [],
    blocks: [
      { type: 'h2', text: isEntry ? (en ? 'Predicted complex' : '预测的复合物') : resultStep?.type === 'result' ? resultStep.title : taskTitle },
      ...(isEntry ? [{ type: 'p' as const, text: en
        ? 'MMFold produced five samples; only sample 1 converged on an assembled complex (interface ipTM 0.92, mean pLDDT 93.7). The other four docked the nanobody inconsistently.'
        : 'MMFold 生成 5 个样本，只有 1 号样本收敛为完整复合物（界面 ipTM 0.92，平均 pLDDT 93.7）；其余四个对接姿态互相不一致。' }]
        : resultStep?.type === 'result' && resultStep.note ? [{ type: 'p' as const, text: resultStep.note }] : []),
    ],
  };
  const interfaceResult: StepResult = {
    paragraphs: [],
    blocks: [
      { type: 'h2', text: en ? 'Binding interface' : '结合界面' },
      { type: 'p', text: en
        ? `Buries ${DEMO_SUMMARY.bsa.toLocaleString()} Å² (${DEMO_SUMMARY.bsaA} on PD-L1, ${DEMO_SUMMARY.bsaB} on KN035) with ${DEMO_SUMMARY.hbonds} hydrogen bonds, ${DEMO_SUMMARY.salt} salt bridge and ${DEMO_SUMMARY.stack} aromatic stacking contact. Epitope ${DEMO_SUMMARY.epitopeTotal} residues on PD-L1; paratope ${DEMO_SUMMARY.paratopeTotal} on KN035, mostly CDR3. Checked against crystal structure 5JDS: ${DEMO_VS_CRYSTAL.epitope[0]}/${DEMO_VS_CRYSTAL.epitope[1]} epitope and ${DEMO_VS_CRYSTAL.paratope[0]}/${DEMO_VS_CRYSTAL.paratope[1]} paratope residues reproduced.`
        : `界面共埋藏 ${DEMO_SUMMARY.bsa.toLocaleString()} Å²（PD-L1 ${DEMO_SUMMARY.bsaA}，KN035 ${DEMO_SUMMARY.bsaB}），含 ${DEMO_SUMMARY.hbonds} 个氢键、${DEMO_SUMMARY.salt} 个盐桥和 ${DEMO_SUMMARY.stack} 处芳香堆积。PD-L1 上的表位 ${DEMO_SUMMARY.epitopeTotal} 个残基，KN035 上的互补位 ${DEMO_SUMMARY.paratopeTotal} 个，主要来自 CDR3。与晶体结构 5JDS 对照：表位复现 ${DEMO_VS_CRYSTAL.epitope[0]}/${DEMO_VS_CRYSTAL.epitope[1]}，互补位复现 ${DEMO_VS_CRYSTAL.paratope[0]}/${DEMO_VS_CRYSTAL.paratope[1]}。` },
    ],
  };
  const kinds = en
    ? { stack: 'π stacking', hbond: 'H-bond', salt: 'Salt bridge' }
    : { stack: '芳香堆积', hbond: '氢键', salt: '盐桥' };

  return <div className="mocha-case-flow" data-task={taskId}>
    <div className="mocha-case-user-block"><ChatBubble variant="user">{submittedPrompt}</ChatBubble></div>
    <div className="mocha-case-assistant"><Image src={mochaIcon} alt="" width={18} height={22} style={{ width: 18, height: 22 }}/><strong>Mocha</strong></div>
    <div className="mocha-case-vendor-steps">
      {DEMO_PHASES.slice(0, 5).map((phase, index) => {
        if (stage.index < index) return null;
        const row: TaskRowData = {
          type: index === 0 ? 'thinking' : 'mostask',
          icon: index === 0 ? thinkingIcon : taskIcon,
          mode: stage.index > index ? 'completed' : 'processing',
          label: labels[index],
          completedStatus: locale === 'en' ? 'Done' : '完成',
          unfoldSteps: [{ text: descriptions[index] || labels[index], durationMs: 900 }],
        };
        return <TaskRow key={`${taskId}-${phase.id}`} task={row} paused paceScale={0.2}/>;
      })}
    </div>
    {stage.index >= 2 && stage.index < 5 && <div className="mocha-case-assistant-message"><ChatBubble variant="assistant">{task?.steps.find(step => step.type === 'text')?.text ?? taskTitle}</ChatBubble></div>}
    {stage.index >= 5 && <div className="mocha-case-result"><ReportBody result={result}/>
      {isEntry && <>
        <div className="mocha-case-table-scroll"><table><thead><tr><th>sample</th><th>ipTM</th><th>pTM</th><th>pLDDT</th><th/></tr></thead><tbody>{DEMO_SAMPLES.map(sample => <tr key={sample.n} data-selected={sample.selected || undefined}><td>{sample.n}</td><td>{sample.iptm.toFixed(2)}</td><td>{sample.ptm.toFixed(2)}</td><td>{sample.plddt.toFixed(1)}</td><td>{sample.selected ? (en ? 'selected' : '采用') : ''}</td></tr>)}</tbody></table></div>
        <ReportBody result={interfaceResult}/>
        <div ref={pairsRef} className="mocha-case-table-scroll mocha-case-pairs"><table><thead><tr><th>PD-L1 (A)</th><th>KN035 (B)</th><th>{en ? 'contact' : '相互作用'}</th></tr></thead><tbody>{DEMO_PAIRS.map(pair => <tr key={pair.a}>
          <td tabIndex={0} data-demo={demoCell === pair.a || undefined} onMouseEnter={() => userHover(pair.aResidue)} onMouseLeave={() => onHoverResidue(null)} onFocus={() => userHover(pair.aResidue)} onBlur={() => onHoverResidue(null)}>{pair.a}<LocateFixed className="mocha-case-locate" size={11} aria-hidden="true"/></td>
          <td tabIndex={0} onMouseEnter={() => userHover(pair.bResidue)} onMouseLeave={() => onHoverResidue(null)} onFocus={() => userHover(pair.bResidue)} onBlur={() => onHoverResidue(null)}>{pair.b}<LocateFixed className="mocha-case-locate" size={11} aria-hidden="true"/></td>
          <td>{kinds[pair.kind as keyof typeof kinds]}</td></tr>)}</tbody></table></div></>}
    </div>}
    {messages.map(message => message.role === 'user' ? (
      <div className="mocha-case-user-block mocha-case-followup" key={message.id}>
        <ChatBubble variant="user">{message.content}</ChatBubble>
      </div>
    ) : (
      <div className="mocha-case-followup" key={message.id}>
        <div className="mocha-case-assistant"><Image src={mochaIcon} alt="" width={18} height={22} style={{ width: 18, height: 22 }}/><strong>Mocha</strong></div>
        <ChatBubble variant="assistant">{message.content}</ChatBubble>
      </div>
    ))}
    {done && <span className="sr-only">{locale === 'en' ? 'Task completed' : '任务已完成'}</span>}
  </div>;
}
