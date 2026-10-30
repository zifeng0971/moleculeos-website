'use client';

import { useEffect, useRef } from 'react';

// PD-L1 and the KN035 nanobody: the complex the homepage follows through the capability story
// (sequences from public/demo/kn035-pdl1-story.cif, chains A and B).
const CHAINS = [
  { name: 'PD-L1', seq: 'MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE' },
  { name: 'KN035', seq: 'QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS' },
];
const SEQUENCE = CHAINS.map(c => c.seq).join('');
// Sequence index → "PD-L1 · K9" style position, for the residue tip.
const residueAt = (index: number) => {
  for (const chain of CHAINS) { if (index < chain.seq.length) return { chain: chain.name, number: index + 1 }; index -= chain.seq.length; }
  return { chain: CHAINS[0].name, number: 1 };
};
const ALPHABET = 'ACDEFGHIKLMNPQRSTVWY';

// Residue classes drive the highlight colour, by chemistry: hydrophobic (lilac), polar (sky), positive (rose), negative (sage).
// Brighter and more saturated than the page palette on purpose: these are light-emitting glyphs on black, not surfaces.
const CLASS_COLORS = ['#B8A4FF', '#6EC6FF', '#FF8FBF', '#74F0B4'];
const classOf = (residue: string) => 'AVLIMFWC'.includes(residue) ? 0 : 'KRH'.includes(residue) ? 2 : 'DE'.includes(residue) ? 3 : 1;

const CELL_W = 15, CELL_H = 22, FONT = '500 12px ui-monospace, "SF Mono", Menlo, monospace';
const RADIUS = 210;
// Hero only: with the pointer idle (or off the page) the spotlight glides round the copy on a slow ellipse,
// smaller and softer than the pointer's, to draw the eye to the text without competing with it.
const ORBIT_IDLE = 3500, ORBIT_PERIOD = 24000, ORBIT_RADIUS = 140, ORBIT_STRENGTH = 0.6;
// Dim margin around the lines under the headline: full dim within LINE_PAD px of the text, back to full light LINE_FADE px later.
const LINE_PAD = 4, LINE_FADE = 22;
// Hero pulses keep this far (px) from the copy, the workbench and the screen edges.
const RUN_CLEAR = 56;
// How far below the description's bottom edge the orbiting glow passes.
const ORBIT_BELOW = 56;

type Box = { x: number; y: number; w: number; h: number };
// A pulse; with residueTip it picks out one residue (label = offset in its run) and carries that residue's name pill.
type Reader = { row: number; col: number; length: number; start: number; label?: number; pill?: Box; hovered?: boolean };
type Ripple = { x: number; y: number; start: number; lobes: { k: number; a: number; ph: number }[] };

// A pulse advances one residue per PULSE_STEP ms (slow enough to follow by eye); the hero's (HERO_PULSE_STEP) are slower still.
const PULSE_STEP = 45, HERO_PULSE_STEP = 68;
// With residue pills (the hero), a new pulse every PULSE_BEAT ms on average (±25%), leaving a quiet spell after each.
const PULSE_BEAT = 9000;
// How long (in pulse steps) a pulse's residue pill lingers after the pulse itself has gone, so it can be clicked.
const LABEL_HOLD = 32;
const PILL_H = 26;
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
 * Residues brighten and take their chemistry colour around the pointer (no idle drift, no flicker),
 * while sequencing read-heads sweep pulses along random rows. With residueTip every pulse picks out one residue and
 * shows its name pill; hovering a pill holds it, clicking it opens residueHref (sign in / sign up to design from it).
 * Pauses off-screen; static under reduced motion.
 */
export function ProteinField({ className, calmSelector = '.hero-copy', fadeWidthSelector, fadeHeightSelector, fieldBottomSelector, residueTip = false, residueHref, residueAction }: { className?: string; calmSelector?: string; fadeWidthSelector?: string; fadeHeightSelector?: string; fieldBottomSelector?: string; residueTip?: boolean; residueHref?: string; residueAction?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    let width = 0, height = 0, dpr = 1, cols = 0, rows = 0;
    let letters: string[] = [], original: string[] = [], seqIndex: Int32Array = new Int32Array(0), baseAlpha: Float32Array = new Float32Array(0), heat: Float32Array = new Float32Array(0), pulse: Float32Array = new Float32Array(0);
    let mutatedUntil: Float64Array = new Float64Array(0);
    let base: HTMLCanvasElement | null = null;
    // The static grid is painted once as the canvas's CSS background; each frame then only draws the lit residues.
    let baseUrl = '', baseReady = false, baseToken = 0;
    // Glyph atlas: one row per colour (grey + 4 classes), one column per residue.
    let atlas: HTMLCanvasElement | null = null;
    let frame = 0, visible = true;
    const pointer = { x: -9999, y: -9999 };
    let lastMove = -Infinity;
    const eased = { x: -9999, y: -9999 };
    const readers: Reader[] = [];
    const ripples: Ripple[] = [];
    const step = residueTip ? HERO_PULSE_STEP : PULSE_STEP;
    let nextReader = 0, retryAt = 0, quarter = Math.floor(Math.random() * 4);
    let lastFrame = 0, speed = 0;
    // Calm zone over the hero copy: highlights dim there so the headline and CTAs stay legible.
    const calm = { x: 0, y: 0, rx: 1, ry: 1 };
    let keepOut: { x0: number; y0: number; x1: number; y1: number }[] = [], visibleBottom = 0;
    // The dim zone for spotlight light: a flat ellipse over the headline (the fade area × 1.25 / 1.35; the whole copy block
    // when no fade selectors are given). Light eases back in from 0.9 to 1.25 of it; the orbit rides at 1.2.
    const orbit = { x: 0, y: 0, rx: 0, ry: 0, down: 0 };
    // The grid's fade behind the copy: an ellipse as wide as fadeWidthSelector's text and as tall as fadeHeightSelector's box
    // (centred on it), else the copy block.
    const fadeArea = { x: 0, y: 0, rx: 0, ry: 0 };
    // The other lines of copy (eyebrow, lead, button) each get a soft elliptical dim zone for spotlight light, so the orbit can
    // pass near them without lighting letters behind their text.
    let lineZones: { x: number; y: number; hw: number; hh: number }[] = [];
    const measureCalm = () => {
      const copy = canvas.parentElement?.querySelector<HTMLElement>(calmSelector);
      const host = canvas.getBoundingClientRect();
      if (!copy) { calm.rx = calm.ry = 1; calm.x = calm.y = -9999; return; }
      const rect = copy.getBoundingClientRect();
      calm.x = rect.left - host.left + rect.width / 2; calm.y = rect.top - host.top + rect.height / 2;
      calm.rx = rect.width * 0.62; calm.ry = rect.height * 0.62;
      // Tighter keep-out for residue pills: each line of copy (eyebrow, headline, lead, button) padded by 24px.
      keepOut = Array.from(copy.children, el => el.getBoundingClientRect()).filter(b => b.width && b.height)
        .map(b => ({ x0: b.left - host.left - 24, y0: b.top - host.top - 24, x1: b.right - host.left + 24, y1: b.bottom - host.top + 24 }));
      // Pills must also land inside the part of the canvas that is on screen.
      visibleBottom = Math.min(height, innerHeight - host.top);
      // Anything drawn over the field (e.g. the hero's flat-lying workbench) ends the usable area at its top edge.
      const cover = fieldBottomSelector ? document.querySelector(fieldBottomSelector)?.getBoundingClientRect() : undefined;
      if (cover && cover.height) visibleBottom = Math.min(visibleBottom, cover.top - host.top - 12);
      if (keepOut.length) {
        const x0 = Math.min(...keepOut.map(k => k.x0)), x1 = Math.max(...keepOut.map(k => k.x1));
        const y0 = Math.min(...keepOut.map(k => k.y0)), y1 = Math.max(...keepOut.map(k => k.y1));
        // keepOut boxes carry 24px padding; the fade uses the copy's own extent.
        // Measure the element's text (a Range), not its box: a block-level headline line spans the whole column.
        const widthNode = fadeWidthSelector ? copy.querySelector(fadeWidthSelector) : null;
        const range = widthNode ? document.createRange() : null;
        range?.selectNodeContents(widthNode!);
        const widthEl = range?.getBoundingClientRect();
        const heightEl = fadeHeightSelector ? copy.querySelector(fadeHeightSelector)?.getBoundingClientRect() : undefined;
        Object.assign(fadeArea, {
          x: (x0 + x1) / 2, y: heightEl ? heightEl.top - host.top + heightEl.height / 2 : (y0 + y1) / 2,
          rx: (widthEl ? widthEl.width : x1 - x0 - 48) / 2, ry: (heightEl ? heightEl.height : y1 - y0 - 48) / 2,
        });
        Object.assign(orbit, { x: fadeArea.x, y: fadeArea.y, rx: fadeArea.rx * 1.25, ry: fadeArea.ry * 1.35 });
        const headline = fadeHeightSelector ? copy.querySelector(fadeHeightSelector) : null;
        lineZones = Array.from(copy.children).filter(el => el !== headline).map(el => {
          // Text extent (a Range) for lines of text, the box for the button row.
          const range = document.createRange(); range.selectNodeContents(el);
          const b = range.getBoundingClientRect().width ? range.getBoundingClientRect() : el.getBoundingClientRect();
          return { x: b.left - host.left + b.width / 2, y: b.top - host.top + b.height / 2, hw: b.width / 2, hh: b.height / 2 };
        }).filter(z => z.hw > 0 && z.hh > 0);
        // The orbit's lower half runs ORBIT_BELOW px under the lowest line (the description) rather than across it.
        const lowest = Math.max(0, ...lineZones.map(z => z.y + z.hh));
        orbit.down = Math.max(orbit.ry * 1.2, lowest - orbit.y + ORBIT_BELOW);
      }
    };

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
      seqIndex = Int32Array.from({ length: count }, (_, i) => (i * 7 + Math.floor(i / cols) * 13) % SEQUENCE.length);
      letters = Array.from(seqIndex, k => SEQUENCE[k]);
      original = letters.slice();
      baseAlpha = new Float32Array(count); heat = new Float32Array(count); pulse = new Float32Array(count); mutatedUntil = new Float64Array(count);
      measureCalm();
      // With residue pills (the hero), the grid itself fades out in a flat ellipse behind the copy (fadeArea), in place of a
      // dark overlay that would also dim pulses unevenly: 35% across the inner 40%, easing to nothing at the ellipse's edge.
      const fade = (x: number, y: number) => {
        if (!residueTip || !fadeArea.rx) return 0;
        const q = Math.hypot((x - fadeArea.x) / fadeArea.rx, (y - fadeArea.y) / fadeArea.ry);
        const t = Math.max(0, Math.min(1, (q - 0.4) / 0.6));
        return 0.35 * (1 - t * t * (3 - 2 * t));
      };
      for (let i = 0; i < count; i++) {
        const h = Math.sin(i * 12.9898) * 43758.5453;
        // The hero's grid sits a little brighter (×1.4) than on other pages; it is the first screen's texture.
        baseAlpha[i] = (0.035 + (h - Math.floor(h)) * 0.075) * (residueTip ? 1.4 : 1) * (1 - fade((i % cols) * CELL_W + CELL_W / 2, Math.floor(i / cols) * CELL_H + CELL_H / 2));
      }
      buildAtlas();
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

    // Where the orbiting spotlight is at time t (clockwise, starting top-left). The lower half is deeper, passing under the description.
    const orbitAt = (t: number) => {
      const a = -2.4 + (t / ORBIT_PERIOD) * Math.PI * 2;
      const sin = Math.sin(a);
      return { x: orbit.x + orbit.rx * 1.2 * Math.cos(a), y: orbit.y + (sin > 0 ? orbit.down || orbit.ry * 1.2 : orbit.ry * 1.2) * sin };
    };
    const orbiting = (now: number) => residueTip && orbit.rx > 0 && (pointer.x < -9000 || now - lastMove > ORBIT_IDLE);
    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      if (base && !baseReady) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(base, 0, 0); ctx.restore(); }
      if (reduce) return;

      // The spotlight follows the pointer. Without one (or after a few idle seconds) the hero's spotlight orbits the copy;
      // elsewhere there is then no spotlight at all.
      const circling = orbiting(now), target = circling ? orbitAt(now) : pointer;
      if (eased.x < -9000 || target.x < -9000) { eased.x = target.x; eased.y = target.y; }
      // Frame-rate independent easing (a slow glide onto the orbit); the spotlight swells slightly while the pointer moves fast.
      const dt = Math.min(64, lastFrame ? now - lastFrame : 16); lastFrame = now;
      const follow = 1 - Math.exp(-dt / (circling ? 900 : 70));
      const px = eased.x, py = eased.y;
      eased.x += (target.x - eased.x) * follow; eased.y += (target.y - eased.y) * follow;
      speed += (Math.min(1, Math.hypot(eased.x - px, eased.y - py) / Math.max(dt, 1) / 1.2) - speed) * 0.12;
      const radius = (circling ? ORBIT_RADIUS : RADIUS) * (1 + 0.3 * speed), strength = circling ? ORBIT_STRENGTH : 1;

      // Spotlight: residues within RADIUS warm up; heat lingers briefly so the trail fades smoothly.
      const c0 = Math.max(0, Math.floor((eased.x - radius) / CELL_W)), c1 = Math.min(cols - 1, Math.ceil((eased.x + radius) / CELL_W));
      const r0 = Math.max(0, Math.floor((eased.y - radius) / CELL_H)), r1 = Math.min(rows - 1, Math.ceil((eased.y + radius) / CELL_H));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const dx = c * CELL_W + CELL_W / 2 - eased.x, dy = r * CELL_H + CELL_H / 2 - eased.y;
        const k = 1 - Math.hypot(dx, dy) / radius;
        if (k <= 0) continue;
        // No random "mutations" here: letters stay put so the field reads as calm texture, not flicker.
        const i = r * cols + c, s = k * k * (3 - 2 * k) * strength;
        if (s > heat[i]) heat[i] = s;
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

      // Sequencing read-heads: pulses sweep along random rows (dimmed behind the copy like everything else).
      if (now > nextReader && now > retryAt && rows > 0) {
        const reader = residueTip ? spawnLabelled(quarter) : spawn();
        // With residue pills, pulses keep a loose beat (every PULSE_BEAT ms, ±25%) counted from when each was due, so a
        // pulse that had to wait for room doesn't push the rest back; and they take turns round the screen's four quarters.
        if (reader) {
          readers.push(reader);
          if (residueTip) { nextReader = Math.max(nextReader + PULSE_BEAT * (0.75 + Math.random() * 0.5), now + PULSE_BEAT * 0.6); quarter = (quarter + 1) % 4; }
          else nextReader = now + 900 + Math.random() * 1400;
        }
        else if (residueTip) retryAt = now + 150; // no room right now: the beat stays due, try again shortly
        else nextReader = now + 200;
      }
      for (let n = readers.length - 1; n >= 0; n--) {
        const reader = readers[n];
        if (reader.hovered) reader.start += dt; // a hovered pill (and its pulse) holds still until the pointer leaves
        const head = (now - reader.start) / step;
        if (head > reader.length + 24 + (reader.label !== undefined ? LABEL_HOLD : 0)) { readers.splice(n, 1); continue; }
        for (let j = 0; j < reader.length; j++) {
          const behind = head - j;
          if (behind < 0 || behind > 24 || reader.col + j >= cols) continue;
          // In the hero, pulses never cross the copy, so they keep their own undimmed channel: every pulse glows alike.
          const i = reader.row * cols + reader.col + j, v = (1 - behind / 24) * 0.75, lit = residueTip ? pulse : heat;
          if (v > lit[i]) lit[i] = v;
        }
      }

      for (let i = 0; i < heat.length; i++) {
        const hs = heat[i], hp = pulse[i];
        if (hs < 0.02 && hp < 0.02) { heat[i] = pulse[i] = 0; continue; }
        const x = (i % cols) * CELL_W, y = Math.floor(i / cols) * CELL_H;
        const mutating = mutatedUntil[i] > now;
        const zx = (x + CELL_W / 2 - calm.x) / calm.rx, zy = (y + CELL_H / 2 - calm.y) / calm.ry;
        // Behind the copy the lit residues almost vanish, so the headline never competes with them.
        // In the hero one elliptical zone dims light over the headline (easing out from 0.6 to 0.85 of the orbit's radii, so
        // just the headline itself, and light can ring the text); elsewhere a wide ellipse.
        const cx = x + CELL_W / 2, cy = y + CELL_H / 2;
        let near = residueTip ? Math.max(0, Math.min(1, (Math.hypot((cx - orbit.x) / orbit.rx, (cy - orbit.y) / orbit.ry) - 0.6) / 0.25)) : 1;
        // ...and behind each other line: a tight rounded box that hugs the text, fully dim within LINE_PAD px of it
        // and easing back over LINE_FADE px.
        if (residueTip) for (const z of lineZones) {
          const d = Math.hypot(Math.max(0, Math.abs(cx - z.x) - z.hw), Math.max(0, Math.abs(cy - z.y) - z.hh));
          near = Math.min(near, Math.max(0, Math.min(1, (d - LINE_PAD) / LINE_FADE)));
        }
        const damp = residueTip ? 0.3 + 0.7 * near * near * (3 - 2 * near) : Math.min(1, 0.06 + 0.94 * (zx * zx + zy * zy));
        // Pointer, ripple and (off the hero) pulse light is dimmed near the copy; hero pulse light is not.
        const h = Math.max(hs * damp, hp);
        if (!mutating && letters[i] !== original[i]) letters[i] = original[i];
        let ox = 0, oy = 0;
        for (let n = 0; n < ripples.length; n++) {
          const rp = ripples[n], age = now - rp.start;
          const ddx = x + CELL_W / 2 - rp.x, ddy = y + CELL_H / 2 - rp.y, dist = Math.hypot(ddx, ddy) || 1;
          const push = rippleWave(rippleDist(rp, ddx, ddy, age), age).h * RIPPLE_PUSH;
          ox += (ddx / dist) * push; oy += (ddy / dist) * push;
        }
        ctx.globalAlpha = Math.min(1, h * 1.45);
        glyph(letters[i], mutating ? 3 : 1 + classOf(letters[i]), x + ox, y + oy);
        if (h > 0.55 && (hp >= hs * damp || damp > 0.8)) { ctx.globalAlpha = (h - 0.55) * 1.9; glyph(letters[i], 0, x + ox, y + oy); }
        heat[i] = hs * 0.92; pulse[i] = hp * 0.92;
      }
      ctx.globalAlpha = 1;
      if (residueTip) drawTips(now);
    };

    // Residue pills name a residue (chain, position, amino acid). Every pulse carries one; the pointer
    // gets its own when it is not over a pulse's pill. Hovering a pulse's pill adds the action; clicking opens residueHref.
    const TIP_FONT = '500 12px -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
    const PILL_PAD = 10, PILL_GAP = 8, PILL_DOT = 6;
    const describe = (i: number) => {
      const residue = letters[i], at = residueAt(seqIndex[i]);
      return { residue, chain: at.chain, number: at.number, head: `${at.chain} · ${residue}${at.number}`, tail: '', color: CLASS_COLORS[classOf(residue)] };
    };
    const pillWidth = (head: string, tail: string, action = false) => {
      ctx.font = TIP_FONT;
      const base = PILL_PAD + PILL_DOT + PILL_GAP + ctx.measureText(head).width + (tail ? PILL_GAP + ctx.measureText(tail).width : 0) + PILL_PAD;
      return action && residueAction ? base + PILL_GAP + ctx.measureText(`${residueAction} ↗`).width : base;
    };
    const clearOf = (b: Box, others: Box[], m = 8) => b.x >= m && b.x + b.w <= width - m && b.y >= m && b.y + b.h <= visibleBottom - m
      && [...keepOut.map(k => ({ x: k.x0, y: k.y0, w: k.x1 - k.x0, h: k.y1 - k.y0 })), ...others]
        .every(o => b.x + b.w + m < o.x || b.x > o.x + o.w + m || b.y + b.h + m < o.y || b.y > o.y + o.h + m);
    const spawn = (): Reader => ({ row: Math.floor(Math.random() * rows), col: Math.floor(Math.random() * cols * 0.6), length: 18 + Math.floor(Math.random() * 30), start: performance.now() });
    // A pulse starting in one quarter of the visible field (0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left; clockwise).
    const spawnIn = (q: number): Reader => {
      const shown = Math.max(1, Math.floor(visibleBottom / CELL_H)), half = Math.floor(shown / 2), top = q < 2;
      const row = (top ? 0 : half) + Math.floor(Math.random() * (top ? half : shown - half));
      // A run starts anywhere in its quarter's half of the screen; it is then cut short of whatever is ahead of it.
      const left = q === 0 || q === 3, span = cols / 2;
      const col = Math.floor((left ? 0 : span) + Math.random() * span);
      return { row, col, length: 18 + Math.floor(Math.random() * 30), start: performance.now() };
    };
    // A pulse whose run avoids the copy and whose picked residue has room for its pill (with the action, so hovering never pushes it into the copy)
    // above or below the row, clear of the copy, the screen edges and the other pills. Tries a few pulses, else none.
    const spawnLabelled = (q: number): Reader | undefined => {
      const others = readers.flatMap(r => r.pill ? [r.pill] : []);
      // Most tries in this pulse's quarter; if it has no room (the copy or the orbiting light is there), the opposite one, then the rest.
      for (let attempt = 0; attempt < 40; attempt++) {
        const reader = spawnIn((q + [0, 2, 1, 3][Math.floor(attempt / 10)]) % 4);
        // The run stops RUN_CLEAR px short of whatever is ahead of it in its row (the copy, the workbench, the right edge).
        let free = 0;
        while (free < reader.length && clearOf({ x: (reader.col + free) * CELL_W, y: reader.row * CELL_H, w: CELL_W, h: CELL_H }, [], RUN_CLEAR)) free++;
        reader.length = free;
        if (reader.length < 12) continue;
        const run = reader.length, mid = Math.floor(run * (0.4 + Math.random() * 0.2));
        // The whole run stays RUN_CLEAR px clear of the copy, the workbench and the screen edges, so the pulse never passes behind or close to them, and clear of the orbiting spotlight
        // for the pulse's whole life (sampled every 400 ms), so the two lights never overlap.
        const life = (reader.length + 24 + LABEL_HOLD) * step;
        const path = Array.from({ length: Math.ceil(life / 400) + 1 }, (_, k) => orbitAt(reader.start + k * 400));
        const offOrbit = (b: Box) => orbit.rx === 0 || path.every(o => Math.hypot(Math.max(b.x - o.x, 0, o.x - b.x - b.w), Math.max(b.y - o.y, 0, o.y - b.y - b.h)) > ORBIT_RADIUS + 40);
        const runBox = { x: reader.col * CELL_W, y: reader.row * CELL_H, w: run * CELL_W, h: CELL_H };
        if (!clearOf(runBox, [], RUN_CLEAR) || !offOrbit(runBox)) continue;
        for (let d = 0; d < run; d++) {
          const label = mid + (d % 2 ? -1 : 1) * Math.ceil(d / 2);
          if (label < 0 || label >= run) continue;
          const c = reader.col + label, { head, tail } = describe(reader.row * cols + c);
          const w = pillWidth(head, tail, true), cx = c * CELL_W + CELL_W / 2;
          const x = Math.max(8, Math.min(width - w - 8, cx - pillWidth(head, tail) / 2));
          for (const y of [reader.row * CELL_H - PILL_H - 6, (reader.row + 1) * CELL_H + 6]) {
            const pill = { x, y, w, h: PILL_H };
            const cell = { x: c * CELL_W - 2, y: reader.row * CELL_H, w: CELL_W + 4, h: CELL_H };
            if (clearOf(pill, others) && clearOf(cell, []) && offOrbit(pill)) return { ...reader, label, pill };
          }
        }
      }
    };
    const ring = (c: number, r: number, color: string, alpha: number) => {
      ctx.globalAlpha = 0.9 * alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(c * CELL_W - 1.5, r * CELL_H + 1.5, CELL_W + 3, CELL_H - 3, 4); ctx.stroke();
    };
    // "KN035 · Y52" in white (the amino-acid name, when given, in grey), with a chemistry-coloured dot; hovered, the action in violet.
    const pill = (i: number, x: number, y: number, alpha: number, hovered = false) => {
      const { head, tail, color } = describe(i), w = pillWidth(head, tail, hovered);
      const wHead = ctx.measureText(head).width, wTail = ctx.measureText(tail).width;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = hovered ? 'rgba(22, 20, 40, 0.94)' : 'rgba(14, 14, 20, 0.88)';
      ctx.strokeStyle = hovered ? 'rgba(111, 105, 199, 0.9)' : 'rgba(255, 255, 255, 0.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y, w, PILL_H, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + PILL_PAD + PILL_DOT / 2, y + PILL_H / 2, PILL_DOT / 2, 0, Math.PI * 2); ctx.fill();
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      let tx = x + PILL_PAD + PILL_DOT + PILL_GAP;
      ctx.fillStyle = '#f5f5f7'; ctx.fillText(head, tx, y + PILL_H / 2 + 0.5); tx += wHead + PILL_GAP;
      if (tail) { ctx.fillStyle = 'rgba(245, 245, 247, 0.55)'; ctx.fillText(tail, tx, y + PILL_H / 2 + 0.5); tx += wTail + PILL_GAP; }
      if (hovered && residueAction) { ctx.fillStyle = '#b9b4f2'; ctx.fillText(`${residueAction} ↗`, tx, y + PILL_H / 2 + 0.5); }
      ctx.globalAlpha = 1;
    };
    const inside = (b: Box, x: number, y: number) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
    // The pulse pill under (x, y): the pill itself or the ringed residue it names.
    const pillAt = (x: number, y: number) => readers.find(r => r.pill && r.label !== undefined && (performance.now() - r.start) / step >= r.label
      && (inside(r.pill, x, y) || inside({ x: (r.col + r.label) * CELL_W - 2, y: r.row * CELL_H, w: CELL_W + 4, h: CELL_H }, x, y)));
    const drawTips = (now: number) => {
      const hovered = pointer.x > -9000 ? pillAt(pointer.x, pointer.y) : undefined;
      for (const r of readers) r.hovered = r === hovered;
      if (canvas.parentElement) canvas.parentElement.style.cursor = hovered && residueHref ? 'pointer' : '';
      for (const r of readers) {
        if (!r.pill || r.label === undefined) continue;
        // The pill appears as the pulse reaches its residue, stays while the pulse runs on, and fades after it has gone.
        const since = (now - r.start) / step - r.label, end = r.length + 24 - r.label;
        const alpha = r.hovered ? 1 : Math.max(0, Math.min(1, since / 4, (end + LABEL_HOLD - since) / 16));
        if (since < 0 || alpha <= 0) continue;
        const i = r.row * cols + r.col + r.label;
        // The ring around the residue goes out with the pulse's glow there (24 steps after the head passes); the pill lingers.
        const ringAlpha = r.hovered ? 1 : Math.max(0, Math.min(alpha, (24 - since) / 8));
        if (ringAlpha > 0) ring(r.col + r.label, r.row, describe(i).color, ringAlpha);
        pill(i, r.pill.x, r.pill.y, alpha * (r.hovered ? 1 : 0.92), r.hovered);
      }
      // The pointer's own pill, when it is over the field but not over a pulse's pill or the copy.
      if (hovered || pointer.x < -9000) return;
      const c = Math.floor(pointer.x / CELL_W), r = Math.floor(pointer.y / CELL_H);
      if (c < 0 || r < 0 || c >= cols || r >= rows) return;
      const zx = (c * CELL_W + CELL_W / 2 - calm.x) / calm.rx, zy = (r * CELL_H + CELL_H / 2 - calm.y) / calm.ry;
      if (zx * zx + zy * zy < 1.15) return;
      const i = r * cols + c, { head, tail, color } = describe(i), w = pillWidth(head, tail);
      let x = c * CELL_W + CELL_W + 10, y = r * CELL_H + CELL_H + 6;
      if (x + w > width - 8) x = c * CELL_W - w - 10;
      if (y + PILL_H > height - 8) y = r * CELL_H - PILL_H - 6;
      ring(c, r, color, 1);
      pill(i, x, y, 1);
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
      // Outside the field (or off the page) the spotlight goes out rather than parking at the last position.
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) { pointer.x = pointer.y = -9999; return; }
      pointer.x = x; pointer.y = y; lastMove = performance.now();
    };
    const onLeave = () => { pointer.x = pointer.y = -9999; };
    const onClick = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element | null)?.closest?.('a, button, input, textarea, select, summary, [role="button"]')) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height || (residueHref && pillAt(x, y))) return;
      ripples.push({ x, y, start: performance.now(), lobes: makeLobes() });
      if (ripples.length > MAX_RIPPLES) ripples.shift();
      pointer.x = x; pointer.y = y;
      kick();
    };
    // Clicking a pulse's pill (or its residue) goes to sign in / sign up, to start designing from that residue:
    // the link carries it as ?target=<chain>&residue=<one-letter code><position>, e.g. ?target=KN035&residue=S57.
    const onOpen = (event: MouseEvent) => {
      if (!residueHref || (event.target as Element | null)?.closest?.('a, button, input, textarea, select, summary, [role="button"]')) return;
      const rect = canvas.getBoundingClientRect();
      const reader = pillAt(event.clientX - rect.left, event.clientY - rect.top);
      if (!reader || reader.label === undefined) return;
      const { chain, residue, number } = describe(reader.row * cols + reader.col + reader.label);
      const url = new URL(residueHref);
      url.searchParams.set('target', chain); url.searchParams.set('residue', `${residue}${number}`);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
    };
    const onVisibility = () => { if (!document.hidden) kick(); };
    if (!reduce && finePointer) { window.addEventListener('pointermove', onPointer, { passive: true }); window.addEventListener('pointerdown', onClick, { passive: true }); document.documentElement.addEventListener('pointerleave', onLeave); }
    if (residueTip && !reduce) window.addEventListener('click', onOpen);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect();
      baseToken++; worker?.terminate(); if (baseUrl) URL.revokeObjectURL(baseUrl);
      window.removeEventListener('pointermove', onPointer); window.removeEventListener('pointerdown', onClick); document.documentElement.removeEventListener('pointerleave', onLeave); document.removeEventListener('visibilitychange', onVisibility); window.removeEventListener('click', onOpen);
      if (canvas.parentElement) canvas.parentElement.style.cursor = '';
    };
  }, [calmSelector, fadeWidthSelector, fadeHeightSelector, fieldBottomSelector, residueTip, residueHref, residueAction]);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
