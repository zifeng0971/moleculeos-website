export type HitVariant = 'full' | 'gapped' | 'split';
export type HitSegment = { kind: 'match' | 'gap'; start: number; end: number };
export type TableRowData = {
  id: string; hit: HitVariant; score: string; eValue: string; bit: string; identity: string;
  reference: string; detail: string; name: string; queryLength: number; alignment: HitSegment[];
  composition: Array<{ label: string; value: number }>;
};
export const mochaHeader = { title: 'Mocha' };
export const composer = {
  placeholder: '向 Mocha 描述你的研发目标',
  conversationPlaceholder: 'Ask me to do anything',
  uploadLabel: 'Upload',
};
export const disclaimer = 'AI-generated research aid. Experimental validation advised';
export const tableRows: TableRowData[] = [];
export const resultTable = { title: 'Results' };
