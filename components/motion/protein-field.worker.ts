/// <reference lib="webworker" />
// Paints ProteinField's static residue grid off the main thread, so the hero entrance never stalls on it.
export type BaseRequest = {
  token: number; width: number; height: number; dpr: number; cols: number;
  letters: string; alpha: Float32Array; alphabet: string; font: string; cellW: number; cellH: number;
};

self.onmessage = async (event: MessageEvent<BaseRequest>) => {
  const { token, width, height, dpr, cols, letters, alpha, alphabet, font, cellW, cellH } = event.data;
  // Same white glyph row the main thread's atlas uses.
  const atlas = new OffscreenCanvas(alphabet.length * cellW * dpr, cellH * dpr);
  const a = atlas.getContext('2d')!;
  a.scale(dpr, dpr); a.font = font; a.textAlign = 'center'; a.textBaseline = 'middle'; a.fillStyle = '#ffffff';
  for (let i = 0; i < alphabet.length; i++) a.fillText(alphabet[i], i * cellW + cellW / 2, cellH / 2 + 0.5);
  const base = new OffscreenCanvas(width, height);
  const b = base.getContext('2d')!;
  for (let i = 0; i < letters.length; i++) {
    b.globalAlpha = alpha[i];
    b.drawImage(atlas, alphabet.indexOf(letters[i]) * cellW * dpr, 0, cellW * dpr, cellH * dpr, (i % cols) * cellW * dpr, Math.floor(i / cols) * cellH * dpr, cellW * dpr, cellH * dpr);
  }
  self.postMessage({ token, blob: await base.convertToBlob() });
};
