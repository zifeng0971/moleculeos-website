// Shared by the Mol* viewers; kept free of Mol* imports so pages can prefetch without pulling the viewer bundle.
// One fetch per structure file, shared by every viewer (and started early by `preloadStructure`).
const structureText = new Map<string, Promise<string>>();
export function preloadStructure(src: string) {
  let pending = structureText.get(src);
  if (!pending) {
    pending = fetch(src).then(response => { if (!response.ok) throw new Error(`${src}: HTTP ${response.status}`); return response.text(); });
    pending.catch(() => structureText.delete(src));
    structureText.set(src, pending);
  }
  return pending;
}
// Mol* plugins initialise one at a time: several stages mounting together would otherwise stall the main thread.
let queue: Promise<unknown> = Promise.resolve();
export const inTurn = <T>(task: () => Promise<T>) => { const run = queue.then(task, task); queue = run.catch(() => {}); return run; };
