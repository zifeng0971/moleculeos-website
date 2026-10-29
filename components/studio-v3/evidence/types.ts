/** MOS v3 evidence layer types. FROZEN (orchestrator-owned). Data lives in evidence/data.ts (owner C). */
import type { Addr, EvidenceKind, MutationRef, Origin, SchemeId } from '../contracts';

export type { Addr, EvidenceKind, MutationRef, Origin, SchemeId };

/** How the item came to exist. */
export type Provenance = 'computed' | 'extracted' | 'curated' | 'database' | 'demo';
/** Who checked it. `metadata` = only identifiers (PMID/DOI) were verified. */
export type Verification = 'none' | 'auto' | 'metadata' | 'human';
export type Stance = 'measured' | 'author-inferred' | 'review-cited';
export type Support = 'supports' | 'limits' | 'neutral';

/** How confidently the item lands on THIS structure's residues. Not source reliability. */
export interface Mapping {
  method: 'exact' | 'aligned' | 'inferred' | 'unmapped';
  fromScheme: SchemeId;
  toScheme: 'auth';
  identity?: number;                    // 0–1, required when method = 'aligned'
  note?: string;
}

export type AnchorScope = 'residue' | 'range' | 'region' | 'mutation' | 'pair' | 'interface' | 'chain' | 'structure';
export interface Anchor {
  scope: AnchorScope;
  addrs: Addr[];                        // expanded residue set; empty for 'structure'
  regionId?: string;
  mutation?: MutationRef;
  pair?: [Addr, Addr];
  mapping: Mapping;
}

export interface SourceRef {
  refId: string;                        // Paper.id | Patent.id | 'MMETRICS' | 'MODEL:xxx' | 'COORD:2FJG'
  locator?: string;                     // 'Fig. 3' | '权利要求 1'
  quote?: string;                       // ≤ 15 words, or an obvious demo placeholder; never invented real text
  url?: string;
  retrievedAt: string;                  // ISO date; demo data uses the literal '20XX-XX-XX'
  dbVersion?: string;
}

export type RiskLevel = 'info' | 'low' | 'medium' | 'high';
export interface RiskFlag {
  type: 'liability' | 'fto' | 'conflict';
  level: RiskLevel;
  reason: string;
  suggestion?: string;
}

export interface Evidence {
  id: string;                           // 'EV-STR-001' | 'DEMO-EV-PAP-002' …
  kind: EvidenceKind;
  origin: Origin;
  provenance: Provenance;
  verification: Verification;
  stance?: Stance;
  support: Support;
  title: string;                        // paper/patent demo items must start with「示例：」
  claim: string;                        // one-sentence assertion
  anchors: Anchor[];
  source: SourceRef;
  /** The BASIS of trust in words (e.g. "基于 2.80 Å 坐标计算"). Never a numeric score. */
  confidenceNote?: string;
  value?: { label: string; num: number; unit?: string };
  risk?: RiskFlag;
  ref?: { paperId?: string; patentId?: string; claimId?: string };
}

export interface ReportedFinding {
  id: string;                           // 'DEMO-RF-001'
  mutation?: MutationRef;
  summary: string;                      // demo items start with「示例：」; real papers: metadata-level facts only
  effect?: 'improves' | 'reduces' | 'neutral' | 'unknown';
  stance: Stance;
  evidenceId: string;
}
export interface Paper {
  id: string;                           // 'PAP-FUH-2006' | 'DEMO-PAP-001'
  origin: Origin;
  title: string;
  authors: string;
  venue: string;
  year: number;
  pmid?: string;
  doi?: string;
  verification: Verification;
  reported: ReportedFinding[];
}

/** One position constraint: residue at `addr` ∈ anyOf (one-letter codes). */
export interface Predicate { addr: Addr; anyOf: string[] }
export interface CoverageRule { mode: 'all' | 'any'; clauses: Predicate[]; regionHint?: string }
export interface Claim {
  id: string;                           // 'DEMO-PAT-001#1'
  kind: 'independent' | 'dependent';
  text: string;
  rule: CoverageRule;
  ruleVerification: 'unverified' | 'human-reviewed';
}
export interface Patent {
  id: string;                           // 'DEMO-PAT-001' — never a real patent-number format
  origin: 'demo';
  title: string;                        // '示例：…'
  assignee: string;                     // '示例权利人 A' — never a real company
  legalStatus: 'unknown' | 'pending' | 'granted' | 'lapsed' | 'demo';
  jurisdiction: string;
  priorityDate: string;                 // '20XX-XX-XX'
  family?: string[];
  claims: Claim[];
  searchScope: { database: string; searchedAt: string; query: string };   // always displayed
}

export type CoverageType = 'identical' | 'mutation-in' | 'possibly-equivalent' | 'not-found';
export interface FtoVerdict {
  mutant: MutationRef[];
  perClaim: { claimId: string; coverage: CoverageType; matched: Addr[] }[];
  level: RiskLevel | 'unsearched';
  /** Always rendered next to the verdict, e.g. "检索范围：示例库 · 20XX-XX-XX". */
  scopeText: string;
  disclaimer: 'screening-only';
  workaround?: { mutation: MutationRef; tradeoff: string };
}

export interface Citation {
  evidenceId: string;
  badge: 'S' | 'M' | 'P' | 'PAT' | 'R';
}

export interface Ledger {
  evidence: Evidence[];
  papers: Paper[];
  patents: Patent[];
  version: string;
}
export interface LedgerQuery {
  addrs?: Addr[];
  regionId?: string;
  mutation?: MutationRef;
  kinds?: EvidenceKind[];
  realOnly?: boolean;                   // origin !== 'demo'
}
export interface Balance { supports: number; limits: number; gaps: string[] }

export type GateId = 'affinity' | 'stability' | 'liability' | 'literature' | 'patent';
export interface Gate { id: GateId; state: 'pass' | 'doubt' | 'fail' | 'nodata'; label: string }
