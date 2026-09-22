import type { DemoTask } from '@/demo/tasks.config';
export function AgentUserInput({ task }: { task: DemoTask }) {
  return <div className="agent-message agent-message-user"><small>You</small><p>{task.userInput.prompt}</p><details className="agent-input-sequences"><summary>{task.userInput.sequences.length} sequences attached</summary>{task.userInput.sequences.map(sequence => <div key={sequence.name}><strong>{sequence.name}</strong><span>{sequence.length}</span><code>{sequence.sequence}</code></div>)}</details></div>;
}
