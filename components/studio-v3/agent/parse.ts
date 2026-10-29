// PLACEHOLDER (owner: D). Shared by the Mocha composer and ⌘K so both entry points parse / and @ identically.
import type { Addr } from '../contracts';
export type Mention = { raw: string; kind: 'residue' | 'region' | 'chain' | 'evidence' | 'candidate' | 'file'; addrs: Addr[]; id?: string };
export function parseInput(text: string): { slash?: string; mentions: Mention[]; rest: string } {
  const m = text.match(/^\/(\S+)\s*([\s\S]*)$/);
  return m ? { slash: m[1], mentions: [], rest: m[2] } : { mentions: [], rest: text };
}
