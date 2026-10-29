'use client';
// PLACEHOLDER (owner: E).
export function EmptyStageCard(p: { onLoadSample(): void; onImport(text: string): void }) {
  return <div className="v3u-empty"><button onClick={p.onLoadSample}>载入示例 2FJG</button></div>;
}
export function StarterChips(p: { onPick(prompt: string): void }) {
  return <div className="v3u-starters"><button onClick={() => p.onPick('粘贴序列预测结构')}>粘贴序列预测结构</button></div>;
}
export function Hints(_props: { kind: 'selection-is-context' | 'origin-legend' }) { return null; }
