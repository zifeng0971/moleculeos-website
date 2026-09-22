// Adapted from Mocha V3 web/src/features/tool/components/display-content.tsx,
// TodoContent (Apache-2.0). See content/demo-reuse.md and THIRD_PARTY_NOTICES.md.
import { CircleCheck, CircleDashed, Circle } from 'lucide-react';
export type DemoTodo = { title: string; status: 'completed' | 'in_progress' | 'pending' };
export function AgentTaskList({ items, statusLabels }: { items: DemoTodo[]; statusLabels: Record<DemoTodo['status'], string> }) {
  return <ol className="agent-plan">{items.map((item, index) => {
    const done = item.status === 'completed';
    const Icon = done ? CircleCheck : item.status === 'in_progress' ? CircleDashed : Circle;
    return <li key={`${index}-${item.title}`} data-status={item.status}><Icon size={14} aria-hidden="true" /><span>{item.title}</span><span className="sr-only"> · {statusLabels[item.status]}</span></li>;
  })}</ol>;
}
