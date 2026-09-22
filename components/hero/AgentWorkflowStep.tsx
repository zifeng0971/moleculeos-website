'use client';
import { Check, ChevronDown, FileText, Sparkles } from 'lucide-react';
import type { DemoStep } from '@/demo/tasks.config';
import { MutationPanel } from './MutationPanel';

export function AgentWorkflowStep({ step, onSelect }: { step: DemoStep; onSelect: (label: string) => void }) {
  if (step.type === 'thinking') return <details className="agent-thinking agent-beat" open>
    <summary><span><Sparkles size={13}/>Thinking</span><span>{step.duration}</span></summary><p>{step.text}</p>
  </details>;
  if (step.type === 'tool') return <details className="agent-tool-record agent-beat"><summary className="agent-tool">
    <span className="agent-tool-marker"/><code>{step.name}</code>{step.args && <span>{step.args}</span>}<Check size={13}/><ChevronDown size={13}/>
  </summary></details>;
  if (step.type === 'text') return <p className="agent-text-step agent-beat">{step.text}</p>;
  if (step.type === 'clarify') return <section className="agent-clarify agent-beat"><strong>{step.question}</strong><div>{step.options.map(option => <div key={option.label} data-selected={option.selected || undefined}><span>{option.selected ? <Check size={14}/> : null}</span><p><b>{option.label}</b><small>{option.desc}</small></p></div>)}</div></section>;
  if (step.type === 'summary') return <section className="agent-summary agent-beat"><h3>{step.title}</h3><ul>{step.items.map(item => <li key={item}>{item}</li>)}</ul></section>;
  return <section className="agent-result-card agent-beat">
    <header><FileText size={16}/><h3>{step.title}</h3><Check size={15}/></header>
    {step.metrics && <div className="agent-result-metrics">{step.metrics.map(metric => <div key={metric.label} data-highlight={metric.highlight || undefined}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}</div>}
    {step.tiers && <div className="agent-result-tiers">{step.tiers.map(tier => <span key={tier.label}><b>{tier.count}</b> {tier.label}</span>)}</div>}
    {step.note && <p>{step.note}</p>}{step.detail && <p className="agent-result-detail">{step.detail}</p>}
    {step.table && <MutationPanel initialRows={step.table.initialRows} onSelect={onSelect}/>} 
  </section>;
}
