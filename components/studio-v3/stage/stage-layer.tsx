'use client';
// PLACEHOLDER (owner: B). Replace wholesale; keep the exports.
import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react';
import type { ChainInfo } from '../../console/molstar-lite';
import { Stage, type StageHandle } from '../../studio/stage';
import { store, useV3 } from '../store';
import type { Addr } from '../contracts';

export interface StageLayerProps { onLoaded?(chains: ChainInfo[]): void; mochaCursor?: { label: string; addrs: Addr[] } | null; emptySlot?: ReactNode }
export const StageLayer = forwardRef<StageHandle, StageLayerProps>(function StageLayer(props, ref) {
  const sel = useV3(s => s.focus.sel);
  const hover = useV3(s => s.hover.addrs);
  const inner = useRef<StageHandle>(null);
  useImperativeHandle(ref, () => inner.current as StageHandle, []);
  useEffect(() => { store.registerStage(inner.current); return () => store.registerStage(null); }, []);
  return (
    <Stage ref={inner} selection={sel} highlight={hover} paint={null}
      onLoaded={chains => { store.setChains(chains); props.onLoaded?.(chains); }}
      onPick={(l, add) => { if (l) { if (add) store.toggleSel(l, 'stage'); else store.setSel([l], 'stage'); } else if (!add) store.setSel([], 'stage'); }}
      onHover={l => store.setHover(l ? [l] : null, 'stage')}>
      {props.emptySlot}
    </Stage>
  );
});
