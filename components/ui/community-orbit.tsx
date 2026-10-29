'use client';

import { useEffect, useRef } from 'react';
import { isLite } from '@/lib/perf-tier';

type Node = { name: string; hint: string };

// Official marks (Simple Icons, CC0 data) and brand colours per platform; the glyph is drawn white on a tinted glass orb.
const BRANDS: Record<string, { tone: [number, number, number]; path: string }> = {
  x: { tone: [200, 205, 225], path: 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z' },
  discord: { tone: [88, 101, 242], path: 'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z' },
  reddit: { tone: [255, 69, 0], path: 'M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0Zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595Zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.047-1.017-.553-1.841-1.338-1.841Zm7.406 0c-.786 0-1.385.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797Zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135Z' },
  quora: { tone: [185, 43, 39], path: 'M7.3799.9483A11.9628 11.9628 0 0 1 21.248 19.5397l2.4096 2.4225c.7322.7362.21 1.9905-.8272 1.9905l-10.7105.01a12.52 12.52 0 0 1-.304 0h-.02A11.9628 11.9628 0 0 1 7.3818.9503Zm7.3217 4.428a7.1717 7.1717 0 1 0-5.4873 13.2512 7.1717 7.1717 0 0 0 5.4883-13.2511Z' },
  facebook: { tone: [8, 102, 255], path: 'M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z' },
};
const FALLBACK: [number, number, number] = [210, 210, 215];
const brandOf = (name: string) => BRANDS[name.toLowerCase()];
const TONES = (name: string) => brandOf(name)?.tone ?? FALLBACK;
const paths = new Map<string, Path2D>();
const logoPath = (name: string) => { const b = brandOf(name); if (!b) return undefined; let p = paths.get(name); if (!p) { p = new Path2D(b.path); paths.set(name, p); } return p; };
// Two tilted orbits carry the platforms; a third, fainter one only carries a few satellites.
const ORBITS = [
  { r: 0.235, tilt: 1.0, rot: -0.5, speed: 0.34, nodes: [0, 1] },
  { r: 0.345, tilt: 0.85, rot: 0.35, speed: -0.2, nodes: [2, 3, 4] },
  { r: 0.29, tilt: 1.15, rot: 1.2, speed: 0.12, nodes: [] as number[] },
];
const RESIDUES = 'ACDEFGHIKLMNPQRSTVWY';
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

/**
 * A small 3D system drawn on a canvas: platforms circle a glowing MOS core on tilted orbits with comet trails, parallax
 * follows the pointer, and hovering a platform slows the system and lights its link to the core. Every node is a disabled
 * placeholder until its account is confirmed, so the list is also exposed to assistive tech as text.
 */
export function CommunityOrbit({ nodes, mark }: { nodes: Node[]; mark: string }) {
  const wrap = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const host = wrap.current!, cv = canvas.current!, context = cv.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let size = 0, dpr = 1, frame = 0, visible = true, last = 0, clock = 0, scale = 1;
    let yaw = 0, pitch = 0.5, hover = -1;
    const aim = { x: 0.5, y: 0.5, on: false };
    const dust = Array.from({ length: 70 }, (_, i) => { const a = Math.sin(i * 91.7) * 43758.5453, b = Math.sin(i * 12.3) * 24634.6345; return { x: (a - Math.floor(a)) * 2 - 1, y: (b - Math.floor(b)) * 2 - 1, z: (i % 5) / 5, ph: i * 1.7 }; });
    const spots: { x: number; y: number; r: number }[] = [];
    const logo = new Image(); logo.src = mark; logo.onload = () => { if (!frame) draw(); };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, isLite() ? 1.25 : 2);
      size = host.clientWidth;
      cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    // 3D → screen. Orbit plane tilt, in-plane rotation, then the shared yaw/pitch, then a light perspective.
    const project = (o: (typeof ORBITS)[number], theta: number) => {
      const lx = o.r * Math.cos(theta), ly = o.r * Math.sin(theta);
      const y1 = ly * Math.cos(o.tilt), z1 = ly * Math.sin(o.tilt);
      const x2 = lx * Math.cos(o.rot) - y1 * Math.sin(o.rot), y2 = lx * Math.sin(o.rot) + y1 * Math.cos(o.rot);
      const x3 = x2 * Math.cos(yaw) + z1 * Math.sin(yaw), z3 = -x2 * Math.sin(yaw) + z1 * Math.cos(yaw);
      const y4 = y2 * Math.cos(pitch) - z3 * Math.sin(pitch), z4 = y2 * Math.sin(pitch) + z3 * Math.cos(pitch);
      const s = 1 / (1 - z4 * 0.75);
      return { x: size / 2 + x3 * size * s, y: size / 2 + y4 * size * s, z: z4, s };
    };

    const draw = () => {
      const S = size, c = S / 2, t = clock;
      ctx.clearRect(0, 0, S, S);
      spots.length = 0;

      // Breathing halo and a faint disc the whole system sits on.
      const breathe = 1 + Math.sin(t * 0.9) * 0.05;
      const g = ctx.createRadialGradient(c, c, 0, c, c, S * 0.52 * breathe);
      g.addColorStop(0, 'rgba(255,255,255,.14)'); g.addColorStop(0.35, 'rgba(255,255,255,.05)'); g.addColorStop(0.7, 'rgba(255,255,255,.015)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);

      // Dust, with parallax.
      for (const d of dust) {
        const x = c + (d.x + yaw * 0.25 * (d.z - 0.4)) * c * 0.98, y = c + (d.y - (pitch - 0.5) * 0.2 * (d.z - 0.4)) * c * 0.98;
        const a = (0.15 + 0.35 * d.z) * (0.5 + 0.5 * Math.sin(t * 1.3 + d.ph));
        ctx.fillStyle = `rgba(220,220,226,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, 0.6 + d.z * 1.1, 0, 6.2832); ctx.fill();
      }

      // Sonar rings leaving the core.
      for (let k = 0; k < 3; k++) {
        const p = ((t / 4.5 + k / 3) % 1);
        ctx.strokeStyle = `rgba(255,255,255,${((1 - p) * 0.18).toFixed(3)})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(c, c, S * (0.12 + p * 0.4), S * (0.12 + p * 0.4) * Math.cos(pitch) * 0.9 + S * 0.02, 0, 0, 6.2832); ctx.stroke();
      }

      // Node positions for this frame.
      type Item = { i: number; x: number; y: number; z: number; s: number; o: (typeof ORBITS)[number]; th: number };
      const items: Item[] = [];
      ORBITS.forEach((o, oi) => o.nodes.forEach((ni, k) => {
        const th = (6.2832 / o.nodes.length) * k + oi * 0.9 + t * o.speed, p = project(o, th);
        items.push({ i: ni, ...p, o, th });
      }));

      // Orbit rings: glowing light-tubes. Near side brighter (so the tilt reads), tinted by the platforms riding the ring,
      // and brightest just behind each platform where its trail burns into the ring.
      const twoPi = 6.2832, N = isLite() ? 90 : 150;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      ORBITS.forEach((o, oi) => {
        const riders = items.filter(it => it.o === o), dir = Math.sign(o.speed) || 1;
        let prev = project(o, 0), prevTone: number[] = [185,174,240];
        for (let n = 1; n <= N; n++) {
          const th = (n / N) * twoPi, p = project(o, th), depth = 0.5 + p.z / (o.r * 2);
          // Tint: weighted mix of the riders' brand colours by angular closeness.
          let tone: number[] = oi === 2 ? [200, 195, 255] : [185,174,240], boost = 0;
          if (riders.length) {
            let wsum = 0.35; const mix = [190 * 0.35, 170 * 0.35, 255 * 0.35];
            for (const r of riders) {
              const d = Math.abs(((th - r.th + Math.PI * 3) % twoPi) - Math.PI), w = Math.exp(-(d * d) / 0.9), c3 = TONES(nodes[r.i].name);
              mix[0] += c3[0] * w; mix[1] += c3[1] * w; mix[2] += c3[2] * w; wsum += w;
              const behind = dir > 0 ? ((r.th - th) % twoPi + twoPi) % twoPi : ((th - r.th) % twoPi + twoPi) % twoPi;
              if (behind < 1.3) boost = Math.max(boost, 1 - behind / 1.3);
            }
            tone = [mix[0] / wsum, mix[1] / wsum, mix[2] / wsum];
          }
          const base = oi === 2 ? 0.05 + depth * 0.09 : 0.1 + depth * 0.34, a = Math.min(1, base + boost * 0.5);
          if (oi !== 2) { ctx.strokeStyle = rgba(tone, a * 0.22); ctx.lineWidth = (5 + boost * 5) * p.s; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
          const mixT = [(tone[0] + prevTone[0]) / 2, (tone[1] + prevTone[1]) / 2, (tone[2] + prevTone[2]) / 2];
          ctx.strokeStyle = rgba(mixT.map(v => v + (255 - v) * (0.25 + boost * 0.4)), a * (oi === 2 ? 1 : 0.9));
          ctx.lineWidth = (oi === 2 ? 0.8 : 1.3 + boost * 0.9) * p.s; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          prev = p; prevTone = tone;
        }
        // Light motes drifting along the ring against the platforms' direction.
        for (let k = 0; k < (oi === 2 ? 6 : 9); k++) {
          const p = project(o, k * (twoPi / (oi === 2 ? 6 : 9)) - t * o.speed * 1.6 + oi), depth = 0.5 + p.z / (o.r * 2);
          ctx.fillStyle = `rgba(235,228,255,${(0.2 + depth * 0.6).toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, (oi === 2 ? 1.5 : 1.9) * p.s, 0, twoPi); ctx.fill();
        }
      });
      ctx.restore();

      // Beams core → node (curved, with a travelling pulse); the hovered one is lit.
      const linkTo = (it: Item) => {
        const tone = TONES(nodes[it.i].name), lit = hover === it.i, mx = (c + it.x) / 2, my = (c + it.y) / 2;
        const nx = -(it.y - c), ny = it.x - c, nl = Math.hypot(nx, ny) || 1, bend = S * 0.05;
        const cx = mx + (nx / nl) * bend, cy = my + (ny / nl) * bend;
        const lg = ctx.createLinearGradient(c, c, it.x, it.y);
        lg.addColorStop(0, rgba(tone, 0)); lg.addColorStop(1, rgba(tone, lit ? 0.9 : 0.28));
        ctx.strokeStyle = lg; ctx.lineWidth = lit ? 1.8 : 1;
        ctx.beginPath(); ctx.moveTo(c, c); ctx.quadraticCurveTo(cx, cy, it.x, it.y); ctx.stroke();
        const u = (t * 0.45 + it.i * 0.21) % 1, ax = (1 - u) * (1 - u) * c + 2 * (1 - u) * u * cx + u * u * it.x, ay = (1 - u) * (1 - u) * c + 2 * (1 - u) * u * cy + u * u * it.y;
        ctx.fillStyle = rgba(tone, lit ? 1 : 0.55); ctx.beginPath(); ctx.arc(ax, ay, lit ? 2.6 : 1.7, 0, 6.2832); ctx.fill();
      };

      const orb = (it: Item) => {
        const tone = TONES(nodes[it.i].name), front = 0.5 + it.z / (it.o.r * 2), lit = hover === it.i, R = S * 0.052 * it.s * (lit ? 1.12 : 1);
        const alpha = 0.55 + 0.45 * front;
        // Comet trail.
        const dir = Math.sign(it.o.speed) || 1;
        let prev = { x: it.x, y: it.y };
        for (let k = 1; k <= 16; k++) {
          const p = project(it.o, it.th - dir * k * 0.045), f = 1 - k / 16;
          ctx.strokeStyle = rgba(tone, f * 0.55 * alpha); ctx.lineWidth = Math.max(0.5, R * 0.42 * f);
          ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); prev = p;
        }
        // Glow, glass body, rim, glyph.
        let gg = ctx.createRadialGradient(it.x, it.y, R * 0.4, it.x, it.y, R * (lit ? 3.4 : 2.4));
        gg.addColorStop(0, rgba(tone, (lit ? 0.55 : 0.3) * alpha)); gg.addColorStop(1, rgba(tone, 0));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(it.x, it.y, R * 3.4, 0, 6.2832); ctx.fill();
        gg = ctx.createRadialGradient(it.x - R * 0.35, it.y - R * 0.45, R * 0.1, it.x, it.y, R);
        gg.addColorStop(0, rgba([255, 255, 255], 0.95 * alpha)); gg.addColorStop(0.25, rgba(tone, alpha)); gg.addColorStop(1, rgba(tone.map(v => v * 0.38) as number[], alpha));
        ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(it.x, it.y, R, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = rgba([255, 255, 255], (lit ? 0.9 : 0.45) * alpha); ctx.lineWidth = 1; ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const glyph = logoPath(nodes[it.i].name);
        if (glyph) {
          const L = R * 1.1;
          ctx.save(); ctx.translate(it.x - L / 2, it.y - L / 2); ctx.scale(L / 24, L / 24);
          ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 6; ctx.fillStyle = `rgba(255,255,255,${(0.98 * alpha).toFixed(3)})`; ctx.fill(glyph); ctx.restore();
        } else {
          ctx.fillStyle = `rgba(255,255,255,${(0.95 * alpha).toFixed(3)})`; ctx.font = `700 ${R * 0.95}px ui-sans-serif, system-ui, sans-serif`; ctx.fillText(nodes[it.i].name.slice(0, 1), it.x, it.y);
        }
        // Label capsule below the orb.
        const label = lit ? `${nodes[it.i].name} · ${nodes[it.i].hint}` : nodes[it.i].name;
        ctx.font = `500 ${12.5 * Math.min(1.12, it.s)}px ui-sans-serif, system-ui, sans-serif`;
        const w = ctx.measureText(label).width + 20, h = 22 * Math.min(1.1, it.s), lx = it.x - w / 2, ly = it.y + R + 7;
        ctx.fillStyle = `rgba(16,13,36,${(0.72 * alpha).toFixed(3)})`; ctx.strokeStyle = rgba(tone, (lit ? 0.85 : 0.3) * alpha); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(lx, ly, w, h, h / 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${((lit ? 1 : 0.8) * alpha).toFixed(3)})`; ctx.fillText(label, it.x, ly + h / 2 + 0.5);
      };
      items.sort((a, b) => a.z - b.z);
      const back = items.filter(i => i.z < 0), front = items.filter(i => i.z >= 0);
      back.forEach(linkTo);
      back.forEach(orb);
      drawCore();
      front.forEach(linkTo);
      front.forEach(orb);
      // Hit-test spots, keyed by node index.
      items.forEach(it => spots[it.i] = { x: it.x, y: it.y, r: S * 0.07 * it.s });

      function drawCore() {
        const R = S * 0.105;
        // Ring of residues turning around the core.
        ctx.save(); ctx.translate(c, c); ctx.scale(1, Math.max(0.55, Math.cos(pitch * 0.6))); ctx.rotate(t * 0.12);
        ctx.font = `500 ${S * 0.021}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const n = 36, rr = R * 1.62;
        for (let k = 0; k < n; k++) {
          const a = (k / n) * 6.2832; ctx.save(); ctx.rotate(a); ctx.translate(0, -rr);
          const glow = 0.5 + 0.5 * Math.sin(t * 1.6 - k * 0.5);
          ctx.fillStyle = `rgba(${210 + glow * 30},${210 + glow * 30},${215 + glow * 30},${(0.22 + glow * 0.5).toFixed(3)})`;
          ctx.fillText(RESIDUES[(k * 7) % RESIDUES.length], 0, 0); ctx.restore();
        }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c, c, R * 1.38, R * 1.38 * Math.max(0.55, Math.cos(pitch * 0.6)), 0, 0, 6.2832); ctx.stroke();
        // The brand mark, undistorted, with highlights only: a soft halo, a glossy specular spot, a slow sweep and a glass rim.
        const glow = ctx.createRadialGradient(c, c, R * 0.7, c, c, R * 2.3);
        glow.addColorStop(0, 'rgba(255,255,255,.28)'); glow.addColorStop(0.5, 'rgba(255,255,255,.06)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(c, c, R * 2.3, 0, 6.2832); ctx.fill();

        ctx.save(); ctx.beginPath(); ctx.arc(c, c, R, 0, 6.2832); ctx.clip();
        if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, c - R, c - R, R * 2, R * 2);
        else { ctx.fillStyle = '#2C2C2E'; ctx.fillRect(c - R, c - R, R * 2, R * 2); }
        const sheen = ctx.createLinearGradient(c - R, c - R, c + R * 0.4, c + R * 0.9);
        sheen.addColorStop(0, 'rgba(255,255,255,.28)'); sheen.addColorStop(0.45, 'rgba(255,255,255,.04)'); sheen.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sheen; ctx.fillRect(c - R, c - R, R * 2, R * 2);
        const sx = c - R + ((t * 0.18) % 2.4) * R;
        const sw = ctx.createLinearGradient(sx - R * 0.2, c - R, sx + R * 0.5, c + R);
        sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(0.5, 'rgba(255,255,255,.22)'); sw.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sw; ctx.fillRect(c - R, c - R, R * 2, R * 2); ctx.restore();
        ctx.save(); ctx.translate(c - R * 0.38, c - R * 0.48); ctx.rotate(-0.75); ctx.scale(1, 0.5);
        const spec = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.4);
        spec.addColorStop(0, 'rgba(255,255,255,.85)'); spec.addColorStop(0.4, 'rgba(255,255,255,.28)'); spec.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = spec; ctx.beginPath(); ctx.arc(0, 0, R * 0.4, 0, 6.2832); ctx.fill(); ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(c, c, R, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(c, c, R * 1.08, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(c, c, R * 1.08, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke();
      }
    };

    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now;
      const slow = hover >= 0 ? 0.18 : 1; scale += (slow - scale) * Math.min(1, dt * 6);
      clock += dt * scale;
      const idleYaw = Math.sin(clock * 0.2) * 0.28, idlePitch = 0.5 + Math.sin(clock * 0.15 + 1) * 0.06;
      const ty = aim.on ? (aim.x - 0.5) * 0.9 : idleYaw, tp = aim.on ? 0.5 + (aim.y - 0.5) * 0.5 : idlePitch;
      yaw += (ty - yaw) * Math.min(1, dt * 3); pitch += (tp - pitch) * Math.min(1, dt * 3);
      draw();
      frame = requestAnimationFrame(tick);
    };
    const kick = () => { if (!still && !frame && visible) frame = requestAnimationFrame(tick); };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      aim.x = x / r.width; aim.y = y / r.height; aim.on = true;
      let found = -1;
      spots.forEach((s, i) => { if (s && Math.hypot(x - s.x, y - s.y) < s.r) found = i; });
      hover = found;
    };
    const onLeave = () => { aim.on = false; hover = -1; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(host);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = 0; kick(); }); io.observe(host);
    const onVis = () => { last = 0; kick(); };
    document.addEventListener('visibilitychange', onVis);
    if (!still) { cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerleave', onLeave); }
    kick();
    return () => { cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerleave', onLeave); };
  }, [nodes, mark]);
  return <div ref={wrap} className="px-orbit" role="group">
    <canvas ref={canvas} aria-hidden="true" />
    <ul className="sr-only">{nodes.map(node => <li key={node.name}>{node.name} · {node.hint}</li>)}</ul>
  </div>;
}
