// PLACEHOLDER (owner: B).
import type { PaintGroup } from '../../studio/stage';
import type { ChainInfo } from '../../console/molstar-lite';
import type { Focus, LayerState, PaintLensId } from '../contracts';
import type { Ledger } from '../evidence/types';

export const PAINT_LENSES: { id: PaintLensId; name: string; hint: string; group: 'structure' | 'evidence' }[] = [
  { id: 'chain', name: '链', hint: '按链着色', group: 'structure' },
  { id: 'region', name: '区域', hint: 'CDR 与表位', group: 'structure' },
];
export function computePaint(_layer: LayerState, _focus: Focus, _ledger: Ledger, _chains: ChainInfo[]): PaintGroup[] | null { return null; }
