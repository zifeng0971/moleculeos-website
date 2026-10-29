/*
 * Particle layer drawn over the Mol* canvas. Particles are placed on real Cα coordinates and projected through the
 * live Mol* camera every frame, so they stay locked to the structure while it spins:
 *   form  — a swirling cloud condenses onto a chain (or the cartoon dissolves back into a cloud),
 *   sites — pulsing glows on residues,
 *   arcs  — light travelling across the binding interface.
 */
import { isLite } from '@/lib/perf-tier';
type RGB = [number, number, number];
export type Projector = (src: ArrayLike<number>, out: Float32Array) => void;
export type FormSpec = {
  /** Flat x,y,z (Å) per chain and the colour the chain settles to. */
  chains: { points: ArrayLike<number>; color: string }[];
  dir: 'in' | 'out';
  duration: number;
  /** Draw the backbone thread between consecutive points (default true); off for loose point sets such as residue patches. */
  lines?: boolean;
  /** 0–1 progress of the whole effect, for UI that follows it. */
  onProgress?: (p: number) => void;
  /**
   * Hand-over to the real structure, called once with the length (ms) of the crossfade: "in" when the thread has formed and starts fading
   * while the cartoon should fade in; "out" at the start, while the cartoon should fade out and the thread takes its place.
   */
  onReveal?: (fadeMs: number) => void;
  /** Progress at which the "in" crossfade starts (default 0.7). */
  revealAt?: number;
  /**
   * Start every particle as a letter at a screen position (canvas CSS px), one per residue in chain order, then
   * carry it to its residue: text morphing into the fold. Without it the particles start on a loose ghost of the structure.
   */
  letters?: { x: number; y: number; ch: string; color: string }[];
};
export type SiteSpec = { points: ArrayLike<number>; color: string; size?: number; pulse?: boolean };

type Effect = { spec: FormSpec; start: number; n: number; target: Float32Array; seed: Float32Array; order: Float32Array; noise: Float32Array; turn: Float32Array; colors: RGB[]; broke: Uint8Array; colorIndex: Uint8Array; palette: RGB[]; centre: [number, number, number]; lines: boolean; revealed: boolean; origin: Float32Array | null; glyphs: string[] | null; glyphColors: RGB[] | null; killed: number; done: () => void };

const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
const NOISE: RGB = [150, 140, 200];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// Deterministic pseudo-random so every replay of a shape looks the same.
const rand = (i: number, k: number) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
// The loose ghost the particles start from (in) or drift back to (out): the structure itself, enlarged and turned a little about its centre, so every
// particle travels on its own short, smooth path and no two paths tangle.
const SPREAD = 0.65, TURN = 0.75;
// Timeline (fractions of the duration). The sweep runs along each chain (N→C), so the thread grows along the backbone like a stitch.
const SWEEP = 0.25, TRAVEL = 0.38, FADE_OUT = 0.28, KILL_MS = 320, REVEAL = 0.7;

export class ParticleForge {
  private ctx: CanvasRenderingContext2D;
  private effects: Effect[] = [];
  private sites: { spec: SiteSpec; color: RGB; src: Float32Array }[] = [];
  private arcPairs: Float32Array | null = null;
  private arcColor: RGB = [201, 255, 240];
  private sprites = new Map<number, HTMLCanvasElement>();
  private q = new Float32Array(0);
  private frame = 0;
  private visible = true;
  private w = 0;
  private h = 0;
  private scratch = new Float32Array(0);
  private screen = new Float32Array(0);
  private animate: boolean;

  constructor(private canvas: HTMLCanvasElement, private project: Projector, animate = true) {
    this.ctx = canvas.getContext('2d')!;
    this.animate = animate;
    this.resize();
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, isLite() ? 1.25 : 2);
    this.w = this.canvas.clientWidth; this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * dpr); this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.kick();
  }

  setVisible(visible: boolean) { this.visible = visible; this.kick(); }

  /** Condenses (or dissolves) chains; resolves when finished. */
  form(spec: FormSpec): Promise<void> {
    return new Promise(resolve => {
      // Weak devices get every other residue as a particle (the thread reads the same, at half the cost).
      const step = isLite() ? 2 : 1;
      const total = spec.chains.reduce((n, c) => n + Math.ceil(c.points.length / 3 / step), 0);
      const fadeMs = spec.dir === 'in' ? (1 - (spec.revealAt ?? REVEAL)) * spec.duration : FADE_OUT * spec.duration;
      if (!this.animate || !total) { spec.onProgress?.(1); spec.onReveal?.(0); resolve(); return; }
      const target = new Float32Array(total * 3), seed = new Float32Array(total), order = new Float32Array(total), noise = new Float32Array(total * 3), turn = new Float32Array(total);
      const colors: RGB[] = [], broke = new Uint8Array(total), colorIndex = new Uint8Array(total), palette: RGB[] = [];
      let o = 0;
      const centre: [number, number, number] = [0, 0, 0];
      for (const chain of spec.chains) {
        const rgb = hex(chain.color), count = Math.ceil(chain.points.length / 3 / step); palette.push(rgb);
        for (let i = 0, k = 0; i < chain.points.length; i += 3 * step, o++, k++) {
          target[o * 3] = chain.points[i]; target[o * 3 + 1] = chain.points[i + 1]; target[o * 3 + 2] = chain.points[i + 2];
          colors.push(rgb); colorIndex[o] = palette.length - 1; broke[o] = i === 0 ? 1 : 0; order[o] = count > 1 ? k / (count - 1) : 0;
          centre[0] += chain.points[i] / total; centre[1] += chain.points[i + 1] / total; centre[2] += chain.points[i + 2] / total;
        }
      }
      for (let i = 0; i < total; i++) {
        seed[i] = rand(i, 1); turn[i] = TURN * (0.75 + 0.5 * rand(i, 5));
        // A small fixed offset per particle (up to ~5 Å), so the ghost reads as loose particles rather than a scaled copy.
        const u = rand(i, 2) * 2 - 1, th = rand(i, 3) * Math.PI * 2, r = 1.5 + 3.5 * rand(i, 4), sq = Math.sqrt(1 - u * u);
        noise[i * 3] = r * sq * Math.cos(th); noise[i * 3 + 1] = r * u; noise[i * 3 + 2] = r * sq * Math.sin(th);
      }
      const L = spec.letters, usable = !!L && L.length === total;
      const origin = usable ? Float32Array.from(L!.flatMap(l => [l.x, l.y])) : null, glyphs = usable ? L!.map(l => l.ch) : null, glyphColors = usable ? L!.map(l => hex(l.color)) : null;
      const e: Effect = { spec, start: performance.now(), n: total, target, seed, order, noise, turn, colors, broke, colorIndex, palette, centre, lines: spec.lines ?? true, revealed: false, origin, glyphs, glyphColors, killed: 0, done: resolve };
      // "out" hands over at once: the cartoon fades while the thread appears in its place.
      if (spec.dir === 'out') { e.revealed = true; spec.onReveal?.(fadeMs); }
      this.effects.push(e);
      this.kick();
    });
  }

  setSites(items: SiteSpec[]) {
    this.sites = items.map(spec => ({ spec, color: hex(spec.color), src: Float32Array.from(spec.points as ArrayLike<number>) }));
    this.kick();
  }

  setArcs(pairs: ArrayLike<number> | null, color = '#C9FFF0') {
    this.arcPairs = pairs ? Float32Array.from(pairs) : null;
    this.arcColor = hex(color);
    this.kick();
  }

  /** Stops every running effect (their promises resolve at once); what is on screen fades out quickly instead of vanishing. */
  clear() {
    const now = performance.now();
    for (const e of this.effects) if (!e.killed) { e.killed = now; e.spec.onProgress?.(1); e.done(); }
    this.sites = []; this.arcPairs = null;
    this.kick();
  }

  dispose() { cancelAnimationFrame(this.frame); this.frame = 0; this.effects = []; }

  private get busy() { return this.effects.length > 0 || this.sites.length > 0 || !!this.arcPairs; }
  private kick() { if (!this.frame && this.visible && this.busy) this.frame = requestAnimationFrame(now => this.tick(now)); }
  private tick(now: number) {
    this.frame = 0;
    if (!this.visible) return;
    this.draw(now);
    if (this.busy) this.frame = requestAnimationFrame(t => this.tick(t));
    else this.ctx.clearRect(0, 0, this.w, this.h);
  }

  private sprite(c: RGB) {
    // Colours are quantised (steps of 8) so the cache stays small instead of growing with every blended shade.
    const qr = c[0] & 0xf8, qg = c[1] & 0xf8, qb = c[2] & 0xf8, key = (qr << 16) | (qg << 8) | qb;
    let s = this.sprites.get(key);
    if (!s) {
      c = [qr, qg, qb];
      s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d')!, grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,0.95)'); grad.addColorStop(0.1, `rgba(${(c[0] + 255) >> 1},${(c[1] + 255) >> 1},${(c[2] + 255) >> 1},0.9)`); grad.addColorStop(0.24, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.55)`);
      grad.addColorStop(0.55, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0.1)`); grad.addColorStop(1, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0)`);
      g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
      this.sprites.set(key, s);
    }
    return s;
  }

  private dot(x: number, y: number, r: number, c: RGB, a: number) {
    if (a <= 0.01) return;
    this.ctx.globalAlpha = Math.min(1, a);
    this.ctx.drawImage(this.sprite(c), x - r, y - r, r * 2, r * 2);
  }

  private draw(now: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    const time = now / 1000;

    for (let k = this.effects.length - 1; k >= 0; k--) {
      const e = this.effects[k], spec = e.spec, inward = spec.dir === 'in', n = e.n;
      const p = clamp((now - e.start) / spec.duration);
      const kill = e.killed ? 1 - clamp((now - e.killed) / KILL_MS) : 1;
      if (e.killed && kill <= 0) { this.effects.splice(k, 1); continue; }
      if (!e.killed) spec.onProgress?.(p);
      const X = spec.revealAt ?? REVEAL;
      if (!e.revealed && !e.killed && inward && p >= X) { e.revealed = true; spec.onReveal?.((1 - X) * spec.duration); }
      // Overall opacity: "in" fades up from nothing and hands over to the cartoon at the end; "out" takes over from the cartoon and fades as it drifts away.
      const env = (inward ? smooth(p / 0.12) * (1 - smooth((p - X - 0.06) / (1 - X - 0.06))) : smooth(p / (FADE_OUT * 0.8)) * (1 - smooth((p - 0.82) / 0.18))) * kill;
      if (this.scratch.length < n * 3) { this.scratch = new Float32Array(n * 3); this.screen = new Float32Array(n * 3); }
      if (this.q.length < n) this.q = new Float32Array(n);
      const q = this.q, sc = this.screen;
      for (let i = 0; i < n; i++) {
        // q: 0 = on the ghost (or the letter), 1 = on its residue.
        let s: number;
        if (e.origin) s = ease(clamp((p - 0.1 * e.order[i] - 0.1 * e.seed[i]) / 0.55));
        else if (inward) s = ease(clamp((p - SWEEP * e.order[i] - 0.05 * e.seed[i]) / TRAVEL));
        else s = 1 - ease(clamp((p - FADE_OUT * 0.8 - SWEEP * e.order[i] - 0.06 * e.seed[i]) / TRAVEL));
        q[i] = s;
        const tx = e.target[i * 3], ty = e.target[i * 3 + 1], tz = e.target[i * 3 + 2];
        if (e.origin) { this.scratch[i * 3] = tx; this.scratch[i * 3 + 1] = ty; this.scratch[i * 3 + 2] = tz; continue; }
        // Ghost → residue along a gentle spiral: the offset from the centre unwinds and shrinks back to scale, the per-particle offset melts away.
        const g = 1 - s, ang = e.turn[i] * g, cs = Math.cos(ang), sn = Math.sin(ang), grow = 1 + SPREAD * g, drift = g * (1 + 0.25 * Math.sin(time * 0.9 + e.seed[i] * 6.3));
        const rx = tx - e.centre[0], ry = ty - e.centre[1], rz = tz - e.centre[2];
        this.scratch[i * 3] = e.centre[0] + (rx * cs - rz * sn) * grow + e.noise[i * 3] * drift;
        this.scratch[i * 3 + 1] = e.centre[1] + ry * grow + e.noise[i * 3 + 1] * drift;
        this.scratch[i * 3 + 2] = e.centre[2] + (rx * sn + rz * cs) * grow + e.noise[i * 3 + 2] * drift;
      }
      this.project(this.scratch.subarray(0, n * 3), sc);
      if (e.origin) {
        // Text → fold: each letter leaves its place in the text on a gentle arc and lands on its residue.
        for (let i = 0; i < n; i++) {
          const s = q[i], ox = e.origin[i * 2], oy = e.origin[i * 2 + 1], dx = sc[i * 3] - ox, dy = sc[i * 3 + 1] - oy, len = Math.hypot(dx, dy) || 1;
          const bulge = Math.sin(Math.PI * s) * len * 0.16 * (e.seed[i] * 2 - 1);
          sc[i * 3] = ox + dx * s - (dy / len) * bulge;
          sc[i * 3 + 1] = oy + dy * s + (dx / len) * bulge;
        }
      }
      // The thread: one smooth curve through the particles (quadratic segments between midpoints), a segment appearing only once the particles at
      // both its ends have almost landed, so it is never stretched across the cloud. A soft wide glow under a thin core, batched per (colour, opacity step).
      if (e.lines && env > 0.01) {
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const STEPS = 12, glow = !isLite(), core = new Map<number, Path2D>(), halo = new Map<number, Path2D>();
        for (let i = 1; i < n - 1; i++) {
          if (e.broke[i] || e.broke[i + 1]) continue;
          const a = smooth((Math.min(q[i - 1], q[i], q[i + 1]) - 0.62) / 0.36) * env;
          if (a < 0.03) continue;
          const level = Math.min(STEPS, Math.max(1, Math.round(a * STEPS))), key = (e.colorIndex[i] * (STEPS + 1)) + level;
          const mx0 = (sc[(i - 1) * 3] + sc[i * 3]) / 2, my0 = (sc[(i - 1) * 3 + 1] + sc[i * 3 + 1]) / 2, mx1 = (sc[i * 3] + sc[(i + 1) * 3]) / 2, my1 = (sc[i * 3 + 1] + sc[(i + 1) * 3 + 1]) / 2;
          for (const m of glow ? [core, halo] : [core]) {
            let path = m.get(key);
            if (!path) { path = new Path2D(); m.set(key, path); }
            path.moveTo(mx0, my0); path.quadraticCurveTo(sc[i * 3], sc[i * 3 + 1], mx1, my1);
          }
        }
        const stroke = (m: Map<number, Path2D>, width: number, alpha: number, lift: number) => {
          ctx.lineWidth = width;
          m.forEach((path, key) => {
            const col = e.palette[Math.floor(key / (STEPS + 1))], level = key % (STEPS + 1);
            ctx.strokeStyle = `rgba(${(col[0] + (255 - col[0]) * lift) | 0},${(col[1] + (255 - col[1]) * lift) | 0},${(col[2] + (255 - col[2]) * lift) | 0},${((level / STEPS) * alpha).toFixed(3)})`;
            ctx.stroke(path);
          });
        };
        if (glow) stroke(halo, 5, 0.09, 0);
        stroke(core, 1.5, 0.78, 0.3);
      }
      for (let i = 0; i < n; i++) {
        const s = q[i], x = sc[i * 3], y = sc[i * 3 + 1], persp = clamp(1 / sc[i * 3 + 2], 0.5, 1.8);
        if (e.origin) {
          const glyph = clamp(1 - s / 0.5);
          if (glyph > 0.02) {
            const c = e.glyphColors![i];
            ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = glyph * env;
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.font = `600 ${(9.5 * (1 - 0.25 * s)).toFixed(2)}px ui-monospace, 'SF Mono', monospace`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.glyphs![i], x, y);
            ctx.globalCompositeOperation = 'lighter';
          }
        }
        // Particles are small and even. With a thread they melt into it as they land (the line takes over from the dots); a loose patch keeps glowing.
        const merge = e.lines ? 1 - 0.85 * smooth((s - 0.6) / 0.4) : 1;
        const away = inward ? 1 : 0.35 + 0.65 * smooth(s / 0.6);
        const alpha = env * merge * away * (e.origin ? clamp(s * 2.2) : 1) * 0.95;
        const r = (e.lines ? 3 + 2.6 * e.seed[i] : 2.6 + 2.6 * e.seed[i]) * persp;
        this.dot(x, y, r, mix(NOISE, e.colors[i], 0.35 + 0.65 * s), alpha);
      }
      if (!e.killed && p >= 1) { this.effects.splice(k, 1); e.done(); }
    }

    // Residue glows.
    for (const site of this.sites) {
      const n = site.src.length / 3;
      if (this.screen.length < n * 3) this.screen = new Float32Array(n * 3);
      this.project(site.src, this.screen);
      for (let i = 0; i < n; i++) {
        const pulse = site.spec.pulse && this.animate ? 0.65 + 0.35 * Math.sin(time * 3.2 + i * 1.7) : 1;
        const persp = clamp(1 / this.screen[i * 3 + 2], 0.5, 1.8);
        this.dot(this.screen[i * 3], this.screen[i * 3 + 1], (site.spec.size ?? 15) * persp * (0.8 + 0.4 * pulse), site.color, 0.75 * pulse);
      }
    }

    // Light travelling across the interface, from Fab side to antigen side.
    if (this.arcPairs) {
      const n = this.arcPairs.length / 6, flat = new Float32Array(n * 6);
      flat.set(this.arcPairs);
      if (this.screen.length < n * 6) this.screen = new Float32Array(n * 6);
      this.project(flat, this.screen);
      const c = this.arcColor;
      ctx.lineWidth = 1.2;
      for (let i = 0; i < n; i++) {
        const ax = this.screen[i * 6], ay = this.screen[i * 6 + 1], bx = this.screen[i * 6 + 3], by = this.screen[i * 6 + 4];
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},0.35)`;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        const t = this.animate ? (time * 0.55 + i * 0.173) % 1 : 0.5;
        this.dot(ax + (bx - ax) * t, ay + (by - ay) * t, 9, c, Math.sin(t * Math.PI));
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
