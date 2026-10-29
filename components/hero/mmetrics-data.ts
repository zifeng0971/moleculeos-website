import data from '@/content/mmetrics-4ht1.json';
import type { ViewerOptions } from './molstar-controller';

/** The structure shown in the homepage MMetrics demo: 4HT1 (TWEAK + rabbit Fv), exported from MOS. */
export const mmetrics = data;
export type FlowResidue = (typeof data.interactions)[number]['left'][number];

// Chain colours follow the MOS viewer for this entry: Fv chains gold / grey, antigen red.
export const CHAIN_COLORS: Record<string, string> = { A: '#D99A1E', B: '#8F8F8F', C: '#E0262B' };
export const STRUCTURE: ViewerOptions = { src: data.src, label: `${data.id} · ${data.name}`, chains: data.chains.map(c => ({ auth: c.id, color: CHAIN_COLORS[c.id] ?? '#8A8A8A' })), fit: 1.05 };
// No static first frame for 4HT1 yet: before the viewer loads the frame shows a quiet placeholder instead.
export const PREVIEW: string | undefined = undefined;

/** "A:31" → "A:THR31", using the residue names carried by the annotations and interaction data. */
const names = new Map<string, string>();
for (const r of [...data.paratope, ...data.epitope]) names.set(r.id, r.label);
for (const pair of data.interactions) for (const r of [...pair.left, ...pair.right]) names.set(`${r.chain}:${r.number}`, `${r.chain}:${r.name}${r.number}`);
export const residueLabel = (id: string) => names.get(id) ?? id;

/** All residue ids inside a CDR range. */
export const rangeIds = (chain: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${chain}:${from + i}`);
