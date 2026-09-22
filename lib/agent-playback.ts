import { DEMO_STEP_INTERVAL } from './agent-demo';
export type AgentRun = { id: number; taskId: string; ordinal: number; elapsed: number; duration: number; paused: boolean };
export type AgentMessage = { role: 'user' | 'assistant'; content: string };
export type AgentConversation = Record<number, AgentMessage[]>;

export function createChatRun(runs: AgentRun[], id: number): AgentRun {
  return { id, taskId: 'chat', ordinal: runs.filter(run => run.taskId === 'chat').length + 1, elapsed: 0, duration: 0, paused: true };
}

export function appendLocalReply(conversations: AgentConversation, id: number, message: string, reply: string): AgentConversation {
  const content = message.trim();
  if (!content) return conversations;
  return { ...conversations, [id]: [...(conversations[id] ?? []), { role: 'user', content }, { role: 'assistant', content: reply }] };
}
export function runStatus(run: AgentRun): 'playing' | 'paused' | 'complete' {
  return run.elapsed >= run.duration ? 'complete' : run.paused ? 'paused' : 'playing';
}
export function createRun(runs: AgentRun[], id: number, taskId: string, reduced: boolean, stepCount: number): AgentRun {
  return { id, taskId, ordinal: runs.filter(run => run.taskId === taskId).length + 1, elapsed: 0, duration: stepCount * DEMO_STEP_INTERVAL, paused: reduced };
}
export function ensurePresetRun(runs: AgentRun[], taskId: string, reduced: boolean, stepCount: number): AgentRun[] {
  return runs.some(run => run.id === 0) ? runs : [createRun(runs, 0, taskId, reduced, stepCount), ...runs];
}
export function advanceRuns(runs: AgentRun[], delta: number): AgentRun[] {
  return runs.map(run => runStatus(run) === 'playing' ? { ...run, elapsed: Math.min(run.elapsed + Math.max(0, delta), run.duration) } : run);
}
export function updateRun(runs: AgentRun[], id: number, action: 'toggle' | 'restart' | 'next', reduced: boolean): AgentRun[] {
  return runs.map(run => run.id !== id || run.taskId === 'chat' ? run : action === 'restart' ? { ...run, elapsed: 0, paused: reduced } : action === 'next' ? {
    ...run, elapsed: Math.min(run.duration, (Math.floor(run.elapsed / DEMO_STEP_INTERVAL) + 1) * DEMO_STEP_INTERVAL), paused: true,
  } : { ...run, paused: !run.paused });
}
