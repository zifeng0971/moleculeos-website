/** Residue-level interaction as exported by MMetrics; distances are in Å. */
export type InteractionFocus = { a: string; b: string; category: string; distance: number };
export const interactionResidue = (key: string) => { const [name, chain] = key.split('.'); return `${chain}:${name.slice(3)}`; };
export const interactionKey = (link: Pick<InteractionFocus, 'a' | 'b' | 'category'>) => `${link.a}|${link.b}|${link.category}`;
