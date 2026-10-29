/**
 * Semantic palette. Colour on the site means something: each hue names one kind of work in MOS,
 * so the same module reads in the same colour on the homepage, in cases and in the help center.
 * Values are "r,g,b" strings for use inside rgb()/rgba(); the CSS twins live in app/calm.css (--mod-*).
 */
export const MODULE = {
  /** Sequence and analysis: reading the molecule (MMetrics, homologs, codons). Lilac. */
  sequence: '185,174,240',
  /** Structure prediction and comparison (MMFold, Superimpose). Sky. */
  structure: '147,201,236',
  /** Binding and affinity optimisation. Rose. */
  affinity: '239,169,196',
  /** Stability and developability. Butter. */
  stability: '240,212,138',
  /** De novo design (MMDesign). Sage. */
  design: '163,221,191',
  /** The agent and the operating system around it (Mocha, MoleculeOS, projects). Apricot, the brand accent. */
  agent: '244,179,147',
} as const;

export type Module = keyof typeof MODULE;
