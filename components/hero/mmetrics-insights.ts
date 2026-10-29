import { mmetrics, rangeIds } from './mmetrics-data';

export type Severity = 'high' | 'mid' | 'low';
export type Liability = { id: string; rule: string; chain: string; from: number; to: number; motif: string; region: string; severity: Severity; residues: string[] };

// Sequence-motif rules. `critical` motifs matter more wherever they sit; the rest only matter inside a CDR.
const RULES: { key: string; pattern: RegExp; critical: boolean; cdrOnly?: boolean }[] = [
  { key: 'glyc', pattern: /N[^P][ST]/g, critical: true },
  { key: 'deamG', pattern: /NG/g, critical: true },
  { key: 'deam', pattern: /N[STH]/g, critical: false },
  { key: 'isoG', pattern: /DG/g, critical: true },
  { key: 'iso', pattern: /D[STDH]/g, critical: false },
  { key: 'cleave', pattern: /DP/g, critical: false },
  { key: 'ox', pattern: /[MW]/g, critical: false, cdrOnly: true },
];
const FRAMEWORK = 'FR';

/** Scans the real VH / VL sequences for chemical-liability motifs; the region follows the chosen CDR numbering scheme. */
export function scanLiabilities(scheme: 'IMGT' | 'Kabat' | 'Chothia'): Liability[] {
  const cdr = mmetrics.cdr[scheme];
  const regionOf = (chain: string, i: number) => cdr.find(r => r.chain === chain && i >= r.from && i <= r.to)?.name ?? FRAMEWORK;
  const out: Liability[] = [];
  for (const chain of mmetrics.chains.filter(c => c.fragment)) {
    for (const rule of RULES) {
      for (const match of chain.sequence.matchAll(new RegExp(rule.pattern.source, 'g'))) {
        const from = (match.index ?? 0) + 1, to = from + match[0].length - 1, region = regionOf(chain.id, from), inCdr = region !== FRAMEWORK;
        if (rule.cdrOnly && !inCdr) continue;
        const severity: Severity = rule.critical && inCdr ? 'high' : rule.critical || inCdr ? 'mid' : 'low';
        out.push({ id: `${chain.id}${from}-${rule.key}`, rule: rule.key, chain: chain.id, from, to, motif: match[0], region, severity, residues: rangeIds(chain.id, from, to) });
      }
    }
  }
  const rank = { high: 0, mid: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || a.chain.localeCompare(b.chain) || a.from - b.from);
}

export type Suggestion = { id: string; kind: 'affinity' | 'risk' | 'keep'; site: string; wt: string; to?: string; partners: string[]; i18n: string };
// Example suggestions assembled from the real 4HT1 contacts and sequence motifs (see the `suggest.*` copy). They are not model scores.
export const SUGGESTIONS: Suggestion[] = [
  { id: 'A55', kind: 'affinity', site: 'A:55', wt: 'Gln', to: 'Arg', partners: ['C:89'], i18n: 'q55r' },
  { id: 'B31', kind: 'affinity', site: 'B:31', wt: 'Ser', to: 'Tyr', partners: ['C:81'], i18n: 's31y' },
  { id: 'A102', kind: 'affinity', site: 'A:102', wt: 'Asn', to: 'Asp', partners: ['C:130', 'C:132'], i18n: 'n102d' },
  { id: 'B95', kind: 'risk', site: 'B:95', wt: 'Ser', to: 'Ala', partners: ['B:94'], i18n: 's95a' },
  { id: 'A66', kind: 'risk', site: 'A:66', wt: 'Gly', to: 'Ala', partners: ['A:65'], i18n: 'g66a' },
  { id: 'A104', kind: 'keep', site: 'A:104', wt: 'Asp', partners: ['A:105', 'C:132'], i18n: 'd104' },
];

export const INTERACTION_TYPES = ['H-Bond', 'Ionic', 'π-π Stack', 'π-Cation', 'VdW Contact'] as const;
/** Residue ids (e.g. "A:54") taking part in links of the given categories, over every chain pair. */
export function residuesForTypes(types: readonly string[], record: { interactions: { left: { key: string; chain: string; number: number }[]; right: { key: string; chain: string; number: number }[]; links: { a: string; b: string; category: string }[] }[] } = mmetrics): string[] {
  const set = new Set<string>();
  for (const pair of record.interactions) {
    const byKey = new Map([...pair.left, ...pair.right].map(r => [r.key, r]));
    for (const link of pair.links) if (types.includes(link.category)) for (const k of [link.a, link.b]) { const r = byKey.get(k)!; set.add(`${r.chain}:${r.number}`); }
  }
  return [...set];
}
export const typeCounts = (record: { interactions: { links: { category: string }[] }[] } = mmetrics) => { const counts: Record<string, number> = {}; for (const pair of record.interactions) for (const l of pair.links) counts[l.category] = (counts[l.category] ?? 0) + 1; return counts; };
