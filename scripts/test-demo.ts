import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { AGENT_PROJECTS, AGENT_TASKS, DEMO_STEP_INTERVAL, agentStageAt } from '../lib/agent-demo';
import { advanceRuns, appendLocalReply, createChatRun, createRun, ensurePresetRun, runStatus, updateRun, type AgentRun } from '../lib/agent-playback';

const structure = JSON.parse(readFileSync('content/antibody-affinity-structure.json', 'utf8'));
const panel = JSON.parse(readFileSync('public/demo/antibody-affinity/panel.json', 'utf8'));
assert.equal(createHash('sha256').update(readFileSync('public/demo/antibody-affinity/structure.cif')).digest('hex'), structure.sha256);
assert.deepEqual(structure.chains.map((chain: { auth: string; role: string }) => [chain.auth, chain.role]), [['A','antigen'],['B','heavy'],['C','light']]);
assert.equal(structure.highlighted.length, 21);
assert.equal(panel.length, 30);
assert.equal(panel.filter((row: {tier:string}) => row.tier === 'STRONG').length, 8);

assert.equal(AGENT_TASKS.length, 4);
assert.equal(AGENT_PROJECTS.length, 1);
assert.equal(AGENT_PROJECTS[0].taskId, 'affinity');
assert.equal(new Set(AGENT_TASKS.map(task => task.id)).size, 4);
for (const task of AGENT_TASKS) {
  assert.ok(task.steps.length >= 6);
  assert.ok(task.steps.some(step => step.type === 'thinking'));
  assert.ok(task.steps.some(step => step.type === 'tool'));
  assert.equal(task.steps.at(-1)?.type, 'summary');
}
const affinity = AGENT_TASKS.find(task => task.id === 'affinity')!;
for (const kind of ['thinking','tool','text','clarify','result','summary']) assert.ok(affinity.steps.some(step => step.type === kind), `missing ${kind}`);

let runs: AgentRun[] = [];
const withPreset = ensurePresetRun(runs, 'affinity', false, affinity.steps.length);
assert.equal(withPreset[0].id, 0);
assert.equal(withPreset[0].taskId, 'affinity');
assert.equal(ensurePresetRun(withPreset, 'affinity', false, affinity.steps.length), withPreset);
runs = [...runs, createRun(runs, 1, 'humanization', false, AGENT_TASKS[0].steps.length)];
runs = advanceRuns(runs, 1200);
runs = [...runs, createRun(runs, 2, 'affinity', false, affinity.steps.length)];
runs = advanceRuns(runs, 800);
assert.deepEqual(runs.map(run => run.elapsed), [2000, 800]);
runs = updateRun(runs, 1, 'toggle', false);
runs = advanceRuns(runs, 1000);
assert.deepEqual(runs.map(run => run.elapsed), [2000, 1800]);
assert.equal(runStatus(runs[0]), 'paused');
runs = updateRun(runs, 2, 'restart', false);
assert.equal(runs[1].elapsed, 0);
runs = [...runs, createRun(runs, 3, 'humanization', false, AGENT_TASKS[0].steps.length)];
assert.equal(runs[2].ordinal, 2);
runs = advanceRuns(runs, 99999);
assert.equal(runStatus(runs[1]), 'complete');
assert.equal(runStatus(runs[2]), 'complete');
const reduced = createRun([], 4, 'epitope', true, AGENT_TASKS[3].steps.length);
assert.equal(advanceRuns([reduced], 99999)[0].elapsed, 0);
assert.equal(updateRun([reduced], 4, 'next', true)[0].elapsed, DEMO_STEP_INTERVAL);
assert.equal(agentStageAt(499, 6), 0);
assert.equal(agentStageAt(500, 6), 1);
assert.equal(agentStageAt(99999, 6), 6);

const chat = createChatRun(runs, 5);
assert.equal(runStatus(chat), 'complete');
const conversation = appendLocalReply({}, chat.id, '  Test question  ', 'Open MOS');
assert.deepEqual(conversation[chat.id], [{ role:'user', content:'Test question' }, { role:'assistant', content:'Open MOS' }]);

for (const path of ['components/hero/AgentDemo.tsx','components/hero/AgentWorkflowStep.tsx','demo/tasks.config.ts','lib/agent-playback.ts']) {
  const source = readFileSync(path, 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|new WebSocket|axios\.|localStorage|sessionStorage|projectId|work ID|session ID|\/app\/src\/|\/workspace\/|feishu|wiki/i);
}
assert.doesNotMatch(readFileSync('components/hero/AgentStructure.tsx', 'utf8'), /\bfetch\s*\(|new WebSocket|axios\.|localStorage|sessionStorage/);
console.log('Demo: six step types, task playback, static assets and request guards passed.');
