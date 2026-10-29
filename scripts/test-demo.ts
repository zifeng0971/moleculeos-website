import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { AGENT_PROJECTS, AGENT_TASKS, DEMO_STEP_INTERVAL, agentStageAt } from '../lib/agent-demo';
import { advanceRuns, appendLocalReply, createChatRun, createRun, ensurePresetRun, runStatus, updateRun, type AgentRun } from '../lib/agent-playback';
import { DEMO_INTERFACE_RESIDUES, DEMO_PAIRS, DEMO_PHASES, DEMO_SAMPLES, DEMO_TOTAL_MS, PRESET_PROMPT, phaseAt } from '../components/hero/mocha-upgrade/demoScript';
import { DEMO_SEQUENCES } from '../components/hero/mocha-upgrade/demoSequences';

assert.deepEqual(DEMO_SEQUENCES.map(item => [item.chain, item.sequence.length]), [['A', 118], ['B', 128]]);
assert.equal(DEMO_TOTAL_MS, 8100);
assert.equal(phaseAt(-1).phase, 'ready');
assert.equal(phaseAt(DEMO_TOTAL_MS).phase, 'complete');
assert.equal(DEMO_PHASES.length, 6);
assert.match(PRESET_PROMPT, /Predict the complex structure of human PD-L1/);
assert.doesNotMatch(PRESET_PROMPT, /direct contact/);
// Real MOS run (website-cases/pdl1/00-entry): five samples, only the first converged.
assert.equal(DEMO_SAMPLES.length, 5);
assert.deepEqual(DEMO_SAMPLES.filter(sample => sample.selected).map(sample => sample.n), [1]);
assert.ok(DEMO_SAMPLES[0].iptm > 0.9 && DEMO_SAMPLES.slice(1).every(sample => sample.iptm < 0.4));
assert.equal(DEMO_PAIRS.length, 6);
assert.equal(DEMO_INTERFACE_RESIDUES.filter(id => id.startsWith('A:')).length, 19);
assert.equal(DEMO_INTERFACE_RESIDUES.filter(id => id.startsWith('B:')).length, 21);
const entryCif = readFileSync('public/demo/kn035-pdl1-entry.cif', 'utf8');
assert.match(entryCif, /_atom_site\.auth_asym_id/);

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
const upgradedWorkbench = readFileSync('components/hero/mocha-upgrade/MochaWorkbench.tsx', 'utf8');
const upgradedPanel = readFileSync('components/hero/mocha-upgrade/vendor/src/pages/MochaPanel/MochaPanel.tsx', 'utf8');
const flowAdapter = readFileSync('components/hero/mocha-upgrade/flow-adapter.ts', 'utf8');
assert.match(upgradedWorkbench, /<MochaPanel/);
assert.doesNotMatch(upgradedWorkbench, /AgentWorkflowStep/);
assert.match(upgradedPanel, /renderReportSlot/);
assert.match(flowAdapter, /type: 'structure'/);
for (const source of [upgradedWorkbench, upgradedPanel, flowAdapter]) {
  assert.doesNotMatch(source, /mocha-component-upgrade-testing-sandy|\bfetch\s*\(|new WebSocket|axios\.|localStorage|sessionStorage/);
}
for (const path of ['components/hero/mocha-upgrade/MochaCaseWorkbench.tsx', 'components/hero/mocha-upgrade/MochaStructurePane.tsx', 'components/hero/mocha-upgrade/demoScript.ts']) {
  assert.doesNotMatch(readFileSync(path, 'utf8'), /mocha-component-upgrade-testing-sandy|new WebSocket|axios\.|localStorage|sessionStorage/);
}
const activeWorkbench = readFileSync('components/hero/mocha-upgrade/MochaCaseWorkbench.tsx', 'utf8');
const activeFlow = readFileSync('components/hero/mocha-upgrade/MochaCaseFlow.tsx', 'utf8');
assert.match(activeWorkbench, /<MochaIdle/);
assert.match(activeWorkbench, /<MochaCaseFlow/);
assert.match(activeWorkbench, /setActiveId\(null\)/);
assert.match(activeWorkbench, /ENTRY_TASKS\.map/);
assert.match(activeWorkbench, /origin: 'preset'/);
assert.match(activeWorkbench, /structureReady: true/);
assert.match(activeWorkbench, /origin: 'created'/);
assert.match(activeWorkbench, /structureReady: false/);
assert.match(activeWorkbench, /phaseAt\(elapsed\)\.index >= 5/);
assert.doesNotMatch(activeWorkbench, /AgentWorkflowStep|disclaimer|准备就绪/);
for (const component of ['ChatBubble', 'TaskRow', 'ReportBody']) assert.match(activeFlow, new RegExp(`<${component}`));
assert.doesNotMatch(activeFlow, /AgentWorkflowStep|disclaimer/);
console.log('Demo: six step types, task playback, upgraded panel slots, static assets and request guards passed.');
