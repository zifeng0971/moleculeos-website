'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { DEMO_TASKS } from '@/demo/tasks.config';
import mochaIcon from './vendor/src/assets/mocha/icon-mocha.svg';
import thinkingIcon from './vendor/src/assets/mocha/icon-thinking.svg';
import taskIcon from './vendor/src/assets/mocha/icon-mostask.svg';
import { ChatBubble } from './vendor/src/components/mocha/ChatBubble/ChatBubble';
import { TaskRow } from './vendor/src/components/mocha/TaskRow/TaskRow';
import { ReportBody } from './vendor/src/components/mocha/ReportBody/ReportBody';
import type { TaskRowData, StepResult } from './vendor/src/data/mochaFlow';
import { DEMO_PHASES, DEMO_RESULT_ROWS, phaseAt } from './demoScript';

type Props = {
  taskId: string;
  taskTitle: string;
  submittedPrompt: string;
  messages: LocalChatMessage[];
  stage: ReturnType<typeof phaseAt>;
  locale: string;
  done: boolean;
  onHoverResidue: (residue: string | null) => void;
};

export type LocalChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export function MochaCaseFlow({ taskId, taskTitle, submittedPrompt, messages, stage, locale, done, onHoverResidue }: Props) {
  const t = useTranslations('agentDemo');
  const task = DEMO_TASKS.find(item => item.id === taskId);
  const isAffinity = taskId === 'affinity';
  const labels = useMemo(() => isAffinity
    ? DEMO_PHASES.map(item => locale === 'en' ? item.titleEn : item.titleZh)
    : [
        locale === 'en' ? 'Thinking' : '思考中',
        t(`tasks.${taskId}.plan0`),
        t(`tasks.${taskId}.plan1`),
        t(`tasks.${taskId}.plan2`),
        locale === 'en' ? 'Prepare results' : '整理结果',
        t(`tasks.${taskId}.result`),
      ], [isAffinity, locale, t, taskId]);
  const descriptions = isAffinity
    ? [
        'Review the supplied antigen, light-chain and heavy-chain sequences.',
        'ListAvailableMOSTasks · GetMOSTaskSchema (MMFold) · A antigen / B light / C heavy',
        'AnalyzeInterface · inspect the antibody–antigen interface.',
        'SelectResidues · inspect candidate sites and their structural context.',
        'StartMOSTask · rank the supplied mutation panel.',
      ]
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
      { type: 'h2', text: isAffinity ? (locale === 'en' ? 'Recommended sites' : '推荐位点') : resultStep?.type === 'result' ? resultStep.title : taskTitle },
      ...(!isAffinity && resultStep?.type === 'result' && resultStep.note ? [{ type: 'p' as const, text: resultStep.note }] : []),
    ],
  };

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
      {isAffinity && <><div className="mocha-case-table-scroll"><table><thead><tr><th>rank</th><th>chain</th><th>position</th><th>wt→mut</th><th>region</th><th>ddG</th><th>confidence</th><th>mechanism</th></tr></thead><tbody>{DEMO_RESULT_ROWS.map(row => <tr key={row.rank} onMouseEnter={() => onHoverResidue(row.residue)} onMouseLeave={() => onHoverResidue(null)} onFocus={() => onHoverResidue(row.residue)} onBlur={() => onHoverResidue(null)} tabIndex={0}><td>{row.rank}</td><td>{row.chain}</td><td>{row.position}</td><td>{row.mutation}</td><td>{row.region}</td><td>{row.ddG}</td><td>{row.confidence}</td><td>{row.mechanism}</td></tr>)}</tbody></table></div><small className="mocha-case-more">+25 more</small></>}
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
