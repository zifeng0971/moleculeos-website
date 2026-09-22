import { DEMO_STEP_INTERVAL } from '@/demo/tasks.config';
export { DEMO_TASKS as AGENT_TASKS, DEMO_PRESETS as AGENT_PROJECTS, DEMO_STEP_INTERVAL, DEMO_STRUCTURE } from '@/demo/tasks.config';
export type { DemoTask as AgentTask, DemoStep as AgentStep } from '@/demo/tasks.config';

export function taskDuration(stepCount: number) { return stepCount * DEMO_STEP_INTERVAL; }
export function agentStageAt(elapsed: number, stepCount: number) {
  return Math.min(stepCount, Math.floor(Math.max(0, elapsed) / DEMO_STEP_INTERVAL));
}
