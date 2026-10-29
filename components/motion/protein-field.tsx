'use client';

import { useEffect, useRef } from 'react';

// PETase (PDB 5XH3), the same protein used by the on-page MMetrics demo.
const SEQUENCE = 'NPYARGPNPTAASLEASAGPFTVRSFTVSRPSGYGAGTVYYPTNAGGTVGAIAIVPGYTARQSSIKWWGPRLASHGFVVITIDTNSTLDQPSSRSSQQMAALGQVASLNGTSSSPIYGKVDTARMGVMGWAMGGGGSLISAANNPSLKAAAPQAPWDSSTNFSSVTVPTLIFACENDSIAPVNSSALPIYDSMSRNAKQFLEINGGSHSCANSGNSNQALIGKKGVAWMKRFMDNDTRYSTFACENPNSTRVSDFRTANCS';
const ALPHABET = 'ACDEFGHIKLMNPQRSTVWY';

// Residue classes drive the highlight colour, by chemistry: hydrophobic (lilac), polar (sky), positive (rose), negative (sage).
// Brighter and more saturated than the page palette on purpose: these are light-emitting glyphs on black, not surfaces.
const CLASS_COLORS = ['#B8A4FF', '#6EC6FF', '#FF8FBF', '#74F0B4'];
const classOf = (residue: string) => 'AVLIMFWC'.includes(residue) ? 0 : 'KRH'.includes(residue) ? 2 : 'DE'.includes(residue) ? 3 : 1;

const CELL_W = 15, CELL_H = 22, FONT = '500 12px ui-monospace, "SF Mono", Menlo, monospace';
const RADIUS = 210;

type Reader = { row: number; col: number; length: number; start: number };
type Ripple = { x: number; y: number; start: number; lobes: { k: number; a: number; ph: number }[] };

// Click ripple: a ring expands from the click, shoving residues outward as it passes.
const RIPPLE_LIFE = 4200, RIPPLE_REACH = 380, RIPPLE_WAVELENGTH = 52, RIPPLE_PUSH = 13, MAX_RIPPLES = 5;
// The front decelerates like a real surface wave; a damped train of crests and troughs trails behind it.
const rippleFront = (age: number) => RIPPLE_REACH * (1 - Math.exp(-age / 1300));
// Irregular front: each click gets a few random angular lobes, so the ring is a lopsided blob rather than a circle.
const RIPPLE_IRREGULARITY = 0.3;
const makeLobes = () => [2, 3, 5].map(k => ({ k, a: (0.35 + Math.random() * 0.65) * RIPPLE_IRREGULARITY / Math.sqrt(k - 1), ph: Math.random() * Math.PI * 2 }));
// Distance from the click as the wave sees it: stretched or squeezed along the lobes, with a slow wobble over time.
const rippleDist = (rp: Ripple, dx: number, dy: number, age: number) => {
  const th = Math.atan2(dy, dx);
  let f = 1;
  for (const l of rp.lobes) f += l.a * Math.sin(l.k * th + l.ph + age * 0.0012 * (l.k % 2 ? 1 : -1));
  return Math.hypot(dx, dy) / f;
};
// Signed wave height (-1..1) and envelope (0..1) at distance `dist` from the click.
const rippleWave = (dist: number, age: number) => {
  const d = dist - rippleFront(age);
  const env = d > 0 ? Math.exp(-(d * d) / 700) : Math.exp(-(d * d) / 9000);
  const life = Math.pow(1 - age / RIPPLE_LIFE, 1.5), spread = 1 / Math.sqrt(1 + dist / 70);
  const amp = env * life * spread * 1.6;
  return { amp, h: amp * Math.cos((d / RIPPLE_WAVELENGTH) * Math.PI * 2) };
};

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
    const ripples: Ripple[] = [];
    let lastFrame = 0, speed = 0;
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
        if (row > 0) { a.shadowColor = color; a.shadowBlur = 12; }
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
      // Frame-rate independent easing; the spotlight swells slightly while the pointer moves fast.
      const dt = Math.min(64, lastFrame ? now - lastFrame : 16); lastFrame = now;
      const follow = 1 - Math.exp(-dt / (idle ? 700 : 70));
      const px = eased.x, py = eased.y;
      eased.x += (target.x - eased.x) * follow; eased.y += (target.y - eased.y) * follow;
      speed += (Math.min(1, Math.hypot(eased.x - px, eased.y - py) / Math.max(dt, 1) / 1.2) - speed) * 0.12;
      const radius = RADIUS * (1 + 0.3 * speed);

      // Spotlight: residues within RADIUS warm up; heat lingers briefly so the trail fades smoothly.
      const c0 = Math.max(0, Math.floor((eased.x - radius) / CELL_W)), c1 = Math.min(cols - 1, Math.ceil((eased.x + radius) / CELL_W));
      const r0 = Math.max(0, Math.floor((eased.y - radius) / CELL_H)), r1 = Math.min(rows - 1, Math.ceil((eased.y + radius) / CELL_H));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const dx = c * CELL_W + CELL_W / 2 - eased.x, dy = r * CELL_H + CELL_H / 2 - eased.y;
        const k = 1 - Math.hypot(dx, dy) / radius;
        if (k <= 0) continue;
        const i = r * cols + c, s = k * k * (3 - 2 * k);
        if (s > heat[i]) heat[i] = s;
        if (s > 0.55 && Math.random() < 0.012) {
          letters[i] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
          mutatedUntil[i] = now + 700;
        }
      }

      // Ripples: crests light up; displacement is applied when drawing.
      for (let n = ripples.length - 1; n >= 0; n--) {
        const rp = ripples[n], age = now - rp.start;
        if (age > RIPPLE_LIFE) { ripples.splice(n, 1); continue; }
        const reach = (rippleFront(age) + 60) * (1 + 2 * RIPPLE_IRREGULARITY);
        const rc0 = Math.max(0, Math.floor((rp.x - reach) / CELL_W)), rc1 = Math.min(cols - 1, Math.ceil((rp.x + reach) / CELL_W));
        const rr0 = Math.max(0, Math.floor((rp.y - reach) / CELL_H)), rr1 = Math.min(rows - 1, Math.ceil((rp.y + reach) / CELL_H));
        for (let r = rr0; r <= rr1; r++) for (let c = rc0; c <= rc1; c++) {
          const { amp, h } = rippleWave(rippleDist(rp, c * CELL_W + CELL_W / 2 - rp.x, r * CELL_H + CELL_H / 2 - rp.y, age), age);
          const v = Math.min(1, 0.25 * amp + Math.max(0, h) * 0.85), i = r * cols + c;
          if (v > heat[i]) heat[i] = v;
        }
      }

      // Interference: where two fronts overlap, crests add (bright flash) and a crest meeting a trough cancels (dark seam).
      if (ripples.length > 1) {
        let c0 = cols, c1 = -1, r0 = rows, r1 = -1;
        for (const rp of ripples) {
          const reach = (rippleFront(now - rp.start) + 60) * (1 + 2 * RIPPLE_IRREGULARITY);
          c0 = Math.min(c0, Math.floor((rp.x - reach) / CELL_W)); c1 = Math.max(c1, Math.ceil((rp.x + reach) / CELL_W));
          r0 = Math.min(r0, Math.floor((rp.y - reach) / CELL_H)); r1 = Math.max(r1, Math.ceil((rp.y + reach) / CELL_H));
        }
        c0 = Math.max(0, c0); c1 = Math.min(cols - 1, c1); r0 = Math.max(0, r0); r1 = Math.min(rows - 1, r1);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
          const cx = c * CELL_W + CELL_W / 2, cy = r * CELL_H + CELL_H / 2;
          let sum = 0, strong = 0, second = 0;
          for (const rp of ripples) {
            const w = rippleWave(rippleDist(rp, cx - rp.x, cy - rp.y, now - rp.start), now - rp.start);
            sum += w.h;
            if (w.amp > strong) { second = strong; strong = w.amp; } else if (w.amp > second) second = w.amp;
          }
          const overlap = Math.min(1, second * 2.2);
          if (overlap < 0.05) continue;
          const i = r * cols + c;
          if (sum > 0) { const v = Math.min(1, sum * 0.7 * overlap + 0.25 * overlap); if (v > heat[i]) heat[i] = v; }
          else heat[i] *= 1 - Math.min(0.85, -sum * 0.6 * overlap);
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
        let ox = 0, oy = 0;
        for (let n = 0; n < ripples.length; n++) {
          const rp = ripples[n], age = now - rp.start;
          const ddx = x + CELL_W / 2 - rp.x, ddy = y + CELL_H / 2 - rp.y, dist = Math.hypot(ddx, ddy) || 1;
          const push = rippleWave(rippleDist(rp, ddx, ddy, age), age).h * RIPPLE_PUSH;
          ox += (ddx / dist) * push; oy += (ddy / dist) * push;
        }
        ctx.globalAlpha = Math.min(1, h * 1.45 * damp);
        glyph(letters[i], mutating ? 3 : 1 + classOf(letters[i]), x + ox, y + oy);
        if (h > 0.55 && damp > 0.8) { ctx.globalAlpha = (h - 0.55) * 1.9 * damp; glyph(letters[i], 0, x + ox, y + oy); }
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
    const onClick = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element | null)?.closest?.('a, button, input, textarea, select, summary, [role="button"]')) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      ripples.push({ x, y, start: performance.now(), lobes: makeLobes() });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      pointer.x = x; pointer.y = y; lastPointer = performance.now();
      kick();
    };
    const onVisibility = () => { if (!document.hidden) kick(); };
    if (!reduce && finePointer) { window.addEventListener('pointermove', onPointer, { passive: true }); window.addEventListener('pointerdown', onClick, { passive: true }); }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect();
      baseToken++; worker?.terminate(); if (baseUrl) URL.revokeObjectURL(baseUrl);
      window.removeEventListener('pointermove', onPointer); window.removeEventListener('pointerdown', onClick); document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [calmSelector]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
