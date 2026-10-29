// PLACEHOLDER (owner: D). Module-level singleton engine: no React state of its own, writes the store's `agent`, `runs`,
// `files`, `notices`, `scores`, `candidates` slices (see AMENDMENTS §A.1).
import type { Mode } from '../contracts';
export const engine = {
  send(_text: string): void {},
  stop(): void {},
  approve(_blockId: string): void {},
  deny(_blockId: string): void {},
  setMode(_m: Mode): void {},
  /** Open the task-configuration card for a catalog model, prefilled from the current selection. */
  openForm(_modelId: string): void {},
  submitForm(_blockId: string): void {},
  /** Re-run a failed/finished run with the same parameters. */
  retry(_runId: string): void {},
  cancel(_runId: string): void {},
  newSession(): void {},
  loadSampleAndAnalyze(): void {},
};
