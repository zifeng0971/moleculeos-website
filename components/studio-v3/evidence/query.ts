// PLACEHOLDER (owner: C).
import type { Balance, Citation, Evidence, FtoVerdict, Gate, Ledger, LedgerQuery, MutationRef, Paper, Patent } from './types';
import type { Candidate } from '../contracts';
import { LEDGER } from './data';

export function queryEvidence(_q: LedgerQuery, ledger: Ledger = LEDGER): Evidence[] { return ledger.evidence; }
export function balanceOf(_items: Evidence[]): Balance { return { supports: 0, limits: 0, gaps: [] }; }
export function evaluateFto(mutants: MutationRef[], _ledger: Ledger = LEDGER): FtoVerdict {
  return { mutant: mutants, perClaim: [], level: 'unsearched', scopeText: '检索范围：未检索', disclaimer: 'screening-only' };
}
export function demoCount(ledger: Ledger = LEDGER): number { return ledger.evidence.filter(e => e.origin === 'demo').length; }
export function ledgerVersion(ledger: Ledger = LEDGER): string { return ledger.version; }
export function getEvidence(id: string, ledger: Ledger = LEDGER): Evidence | undefined { return ledger.evidence.find(e => e.id === id); }
export function getPaper(id: string, ledger: Ledger = LEDGER): Paper | undefined { return ledger.papers.find(p => p.id === id); }
export function getPatent(id: string, ledger: Ledger = LEDGER): Patent | undefined { return ledger.patents.find(p => p.id === id); }
export function assertDemoRules(_ledger: Ledger = LEDGER): void {}
export function assertRealWhitelist(_ledger: Ledger = LEDGER): void {}
export function citationOf(id: string, ledger: Ledger = LEDGER): Citation | null { const e = getEvidence(id, ledger); return e ? { evidenceId: id, badge: 'S' } : null; }
export function gatesOf(_c: Candidate, _ledger: Ledger = LEDGER, _opts?: { realOnly: boolean }): Gate[] { return []; }
