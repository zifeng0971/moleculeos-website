'use client';

import { useEffect, useRef } from 'react';

// PETase (PDB 5XH3), the same protein used by the on-page MMetrics demo.
const SEQUENCE = 'NPYARGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALGQVASLNGTSSSPIYGKVDTARMGVMGWAMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCS';
const ALPHABET = 'ACDEFGHIKLMNPQRSTVWY';

// Residue classes drive the highlight colour: hydrophobic, polar, positive, negative.
const CLASS_COLORS = ['#A88BFF', '#6FD3FF', '#F08BD0', '#7EE0C3'];
const classOf = (residue: string) => 'AVLIMFWC'.includes(residue) ? 0 : 'KRH'.includes(residue) ? 2 : 'DE'.includes(residue) ? 3 : 1;

const CELL_W = 15, CELL_H = 22, FONT = '500 12px ui-monospace, "SF Mono", Menlo, monospace';
const RADIUS = 210;

type Reader = { row: number; col: number; length: number; start: number };

/**
 * Codex-style character field built from a real protein sequence.
 * Residues brighten and take their chemistry colour around the pointer, occasionally "mutating",
 * while sequencing read-heads sweep across random rows. Pauses off-screen; static under reduced motion.
 */
export function ProteinField({ className, calmSelector = '.hero-copy' }: { className?: string; calmSelector?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    let width = 0, height = 0, dpr = 1, cols = 0, rows = 0;
    let letters: string[] = [], original: string[] = [], baseAlpha: Float32Array = new Float32Array(0), heat: Float32Array = new Float32Array(0);
    let mutatedUntil: Float64Array = new Float64Array(0);
    let base: HTMLCanvasElement | null = null;
    // The static grid is painted once as the canvas's CSS background; each frame then only draws the lit residues.
    let baseUrl = '', baseReady = false, baseToken = 0;
    // Glyph atlas: one row per colour (grey + 4 classes), one column per residue.
    let atlas: HTMLCanvasElement | null = null;
    let frame = 0, visible = true, lastPointer = -Infinity;
    const pointer = { x: -9999, y: -9999 };
    const eased = { x: -9999, y: -9999 };
    const readers: Reader[] = [];
    // Calm zone over the hero copy: highlights dim there so the headline and CTAs stay legible.
    const calm = { x: 0, y: 0, rx: 1, ry: 1 };
    const measureCalm = () => {
      const copy = canvas.parentElement?.querySelector<HTMLElement>(calmSelector);
      const host = canvas.getBoundingClientRect();
      if (!copy) { calm.rx = calm.ry = 1; calm.x = calm.y = -9999; return; }
      const rect = copy.getBoundingClientRect();
      calm.x = rect.left - host.left + rect.width / 2; calm.y = rect.top - host.top + rect.height / 2;
      calm.rx = rect.width * 0.62; calm.ry = rect.height * 0.62;
    };
    let nextReader = 0;

    const buildAtlas = () => {
      atlas = document.createElement('canvas');
      atlas.width = ALPHABET.length * CELL_W * dpr; atlas.height = 5 * CELL_H * dpr;
      const a = atlas.getContext('2d')!;
      a.scale(dpr, dpr); a.font = FONT; a.textAlign = 'center'; a.textBaseline = 'middle';
      ['#ffffff', ...CLASS_COLORS].forEach((color, row) => {
        a.fillStyle = color;
        if (row > 0) { a.shadowColor = color; a.shadowBlur = 8; }
        for (let i = 0; i < ALPHABET.length; i++) a.fillText(ALPHABET[i], i * CELL_W + CELL_W / 2, row * CELL_H + CELL_H / 2 + 0.5);
      });
    };
    const glyph = (residue: string, colorRow: number, x: number, y: number) => {
      const i = ALPHABET.indexOf(residue);
      if (i < 0 || !atlas) return;
      ctx.drawImage(atlas, i * CELL_W * dpr, colorRow * CELL_H * dpr, CELL_W * dpr, CELL_H * dpr, x, y, CELL_W, CELL_H);
    };

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL_W); rows = Math.ceil(height / CELL_H);
      const count = cols * rows;
      letters = Array.from({ length: count }, (_, i) => SEQUENCE[(i * 7 + Math.floor(i / cols) * 13) % SEQUENCE.length]);
      original = letters.slice();
      baseAlpha = new Float32Array(count); heat = new Float32Array(count); mutatedUntil = new Float64Array(count);
      for (let i = 0; i < count; i++) {
        const h = Math.sin(i * 12.9898) * 43758.5453;
        baseAlpha[i] = 0.035 + (h - Math.floor(h)) * 0.075;
      }
      buildAtlas();
      measureCalm();
      baseReady = false; base = null;
      const token = ++baseToken;
      if (worker) {
        worker.postMessage({ token, width: canvas.width, height: canvas.height, dpr, cols, letters: letters.join(''), alpha: baseAlpha, alphabet: ALPHABET, font: FONT, cellW: CELL_W, cellH: CELL_H });
        return;
      }
      base = document.createElement('canvas');
      base.width = canvas.width; base.height = canvas.height;
      const b = base.getContext('2d')!;
      for (let i = 0; i < count; i++) {
        const idx = ALPHABET.indexOf(letters[i]);
        b.globalAlpha = baseAlpha[i];
        b.drawImage(atlas!, idx * CELL_W * dpr, 0, CELL_W * dpr, CELL_H * dpr, (i % cols) * CELL_W * dpr, Math.floor(i / cols) * CELL_H * dpr, CELL_W * dpr, CELL_H * dpr);
      }
      base.toBlob(blob => { if (blob) showBase(token, blob); });
    };
    const showBase = (token: number, blob: Blob) => {
      if (token !== baseToken) return;
      if (baseUrl) URL.revokeObjectURL(baseUrl);
      baseUrl = URL.createObjectURL(blob);
      canvas.style.backgroundImage = `url(${baseUrl})`;
      canvas.style.backgroundSize = '100% 100%';
      baseReady = true; base = null;
      draw(performance.now());
    };
    // Paint the static grid in a worker when OffscreenCanvas is available; otherwise fall back to the main thread.
    let worker: Worker | null = null;
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        worker = new Worker(new URL('./protein-field.worker.ts', import.meta.url));
        worker.onmessage = (event: MessageEvent<{ token: number; blob: Blob }>) => showBase(event.data.token, event.data.blob);
        worker.onerror = () => { worker?.terminate(); worker = null; layout(); draw(performance.now()); };
      } catch { worker = null; }
    }

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      if (base && !baseReady) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0); ctx.restore(); }
      if (reduce) return;

      // Without a recent pointer, a spotlight drifts on its own (touch devices, or pointer elsewhere).
      const idle = now - lastPointer > 2500;
      const target = idle
        ? { x: width * (0.5 + 0.32 * Math.sin(now / 5200)), y: height * (0.42 + 0.22 * Math.sin(now / 3700 + 1)) }
        : pointer;
      if (eased.x < -9000) { eased.x = target.x; eased.y = target.y; }
      const follow = idle ? 0.02 : 0.18;
      eased.x += (target.x - eased.x) * follow; eased.y += (target.y - eased.y) * follow;

      // Spotlight: residues within RADIUS warm up; heat lingers briefly so the trail fades smoothly.
      const c0 = Math.max(0, Math.floor((eased.x - RADIUS) / CELL_W)), c1 = Math.min(cols - 1, Math.ceil((eased.x + RADIUS) / CELL_W));
      const r0 = Math.max(0, Math.floor((eased.y - RADIUS) / CELL_H)), r1 = Math.min(rows - 1, Math.ceil((eased.y + RADIUS) / CELL_H));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const dx = c * CELL_W + CELL_W / 2 - eased.x, dy = r * CELL_H + CELL_H / 2 - eased.y;
        const k = 1 - Math.hypot(dx, dy) / RADIUS;
        if (k <= 0) continue;
        const i = r * cols + c, s = k * k * (3 - 2 * k);
        if (s > heat[i]) heat[i] = s;
        if (s > 0.55 && Math.random() < 0.012) {
          letters[i] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
          mutatedUntil[i] = now + 700;
        }
      }

      // Sequencing read-heads sweep along random rows.
      if (now > nextReader && rows > 0) {
        readers.push({ row: Math.floor(Math.random() * rows), col: Math.floor(Math.random() * cols * 0.6), length: 18 + Math.floor(Math.random() * 30), start: now });
        nextReader = now + 900 + Math.random() * 1400;
      }
      for (let n = readers.length - 1; n >= 0; n--) {
        const reader = readers[n], head = (now - reader.start) / 28;
        if (head > reader.length + 24) { readers.splice(n, 1); continue; }
        for (let j = 0; j < reader.length; j++) {
          const behind = head - j;
          if (behind < 0 || behind > 24 || reader.col + j >= cols) continue;
          const i = reader.row * cols + reader.col + j, v = (1 - behind / 24) * 0.75;
          if (v > heat[i]) heat[i] = v;
        }
      }

      for (let i = 0; i < heat.length; i++) {
        const h = heat[i];
        if (h < 0.02) { heat[i] = 0; continue; }
        const x = (i % cols) * CELL_W, y = Math.floor(i / cols) * CELL_H;
        const mutating = mutatedUntil[i] > now;
        const zx = (x + CELL_W / 2 - calm.x) / calm.rx, zy = (y + CELL_H / 2 - calm.y) / calm.ry;
        const damp = Math.min(1, 0.22 + 0.78 * (zx * zx + zy * zy));
        if (!mutating && letters[i] !== original[i]) letters[i] = original[i];
        ctx.globalAlpha = Math.min(1, h * (mutating ? 1 : 0.9) * damp);
        glyph(letters[i], mutating ? 3 : 1 + classOf(letters[i]), x, y);
        if (h > 0.7 && damp > 0.8) { ctx.globalAlpha = (h - 0.7) * 1.6 * damp; glyph(letters[i], 0, x, y); }
        heat[i] = h * 0.92;
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const kick = () => { if (!reduce && !frame && visible) frame = requestAnimationFrame(loop); };

    layout();
    draw(performance.now());
    kick();
    const resizeObserver = new ResizeObserver(() => { layout(); draw(performance.now()); });
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); });
    intersection.observe(canvas);
    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      pointer.x = x; pointer.y = y; lastPointer = performance.now();
    };
    const onVisibility = () => { if (!document.hidden) kick(); };
    if (!reduce && finePointer) window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect();
      baseToken++; worker?.terminate(); if (baseUrl) URL.revokeObjectURL(baseUrl);
      window.removeEventListener('pointermove', onPointer); document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [calmSelector]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
