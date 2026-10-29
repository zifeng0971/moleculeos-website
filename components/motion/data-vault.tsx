'use client';

/*
 * "Your sequences stay in your project", drawn as a live system instead of cards:
 *   sequences leave a helix emitter as residue letters, turn into ciphertext inside a glass tunnel, cross the membrane of a
 *   rotating geodesic vault where they stay readable, and leave as designs that end at the customer's lock.
 *   Probes aimed at the general-model node hit an energy barrier and bounce.
 * The `active` promise (0 training, 1 IP, 2 encryption/isolation) lights up its part of the scene.
 */
import { useEffect, useRef } from 'react';

const W = 1000, H = 396, CY = 222, VX = 500, R = 98, SRC_X = 110, LOCK_X = 890, TUNNEL_X = 178, BARRIER_R = R + 38;
const AMINO = 'ACDEFGHIKLMNPQRSTVWY';
const HEX = '0123456789ABCDEF';
const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
type RGB = [number, number, number];
const C = { violet: [185,174,240] as RGB, cyan: [147,201,236] as RGB, mint: [163,221,191] as RGB, pink: [239,169,196] as RGB, white: [255, 255, 255] as RGB };
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

// ----- geodesic sphere (icosahedron subdivided once: 42 vertices, 120 edges) -----
function geodesic() {
  const t = (1 + Math.sqrt(5)) / 2;
  const norm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const verts = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
  const faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const cache = new Map<string, number>();
  const mid = (a: number, b: number) => {
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    let i = cache.get(key);
    if (i === undefined) { verts.push(norm(verts[a].map((v, k) => (v + verts[b][k]) / 2))); i = verts.length - 1; cache.set(key, i); }
    return i;
  };
  const edges = new Set<string>();
  for (const [a, b, c] of faces) {
    const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    for (const [p, q, r] of [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]) for (const [m, n] of [[p, q], [q, r], [r, p]]) edges.add(m < n ? `${m}-${n}` : `${n}-${m}`);
  }
  return { verts, edges: [...edges].map(e => e.split('-').map(Number) as [number, number]) };
}
const GEO = geodesic();

type Flow = { t: number; speed: number; y: number; ch: string; flip: number; seed: number };
type Out = { t: number; speed: number; seed: number };
type Probe = { ang: number; t: number; hit: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number };
type Ripple = { x: number; y: number; t: number; c: RGB; kind: 'entry' | 'lock' | 'barrier'; ang?: number };
type Orbiter = { a: number; r: number; w: number; inc: number; node: number; ch: string };
type Dust = { x: number; y: number; vx: number; vy: number; ph: number; c: RGB };

export function DataVault({ active }: { active: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const el = canvas.current!, ctx = el.getContext('2d')!;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scale = 1, dpr = 1, frame = 0, visible = true, last = performance.now(), clock = 0;
    const flows: Flow[] = [], outs: Out[] = [], probes: Probe[] = [], sparks: Spark[] = [], ripples: Ripple[] = [];
    const orbit: Orbiter[] = Array.from({ length: 24 }, (_, i) => ({ a: i * 0.9, r: 0.42 + (i % 6) * 0.1, w: (i % 2 ? 1 : -1) * (0.35 + (i % 5) * 0.08), inc: (i * 0.7) % Math.PI, node: i * 1.3, ch: pick(AMINO) }));
    const dust: Dust[] = Array.from({ length: 46 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4, ph: Math.random() * 6.28, c: i % 3 ? C.violet : C.cyan }));
    let spawnFlow = 0, spawnOut = 0, spawnProbe = 0, barrierGlow = 0, hitAng = -Math.PI / 2;
    const sprites = new Map<string, HTMLCanvasElement>();
    const xe = VX - R * 0.96;

    const sprite = (c: RGB) => {
      const key = c.join(',');
      let s = sprites.get(key);
      if (!s) {
        s = document.createElement('canvas'); s.width = s.height = 64;
        const g = s.getContext('2d')!, grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,.95)'); grad.addColorStop(0.16, rgba(c, 0.85)); grad.addColorStop(0.5, rgba(c, 0.16)); grad.addColorStop(1, rgba(c, 0));
        g.fillStyle = grad; g.fillRect(0, 0, 64, 64); sprites.set(key, s);
      }
      return s;
    };
    const glow = (x: number, y: number, r: number, c: RGB, a: number) => { if (a <= 0.01) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprite(c), x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2); scale = el.clientWidth / W;
      el.width = Math.round(el.clientWidth * dpr); el.height = Math.round(el.clientHeight * dpr);
    };

    const step = (dt: number) => {
      clock += dt;
      const act = activeRef.current;
      spawnFlow -= dt; spawnOut -= dt; spawnProbe -= dt;
      if (spawnFlow <= 0) { flows.push({ t: 0, speed: 0.16 + Math.random() * 0.05, y: CY + (Math.random() - 0.5) * 44, ch: pick(AMINO), flip: 0, seed: Math.random() * 6.28 }); spawnFlow = act === 2 ? 0.2 : 0.32; }
      if (spawnOut <= 0) { outs.push({ t: 0, speed: 0.2, seed: Math.random() * 6.28 }); spawnOut = act === 1 ? 0.5 : 1.1; }
      if (spawnProbe <= 0) { probes.push({ ang: -Math.PI / 2 + (Math.random() - 0.5) * 1.0, t: 0, hit: 0 }); spawnProbe = act === 0 ? 0.5 : 1.4; }
      for (const f of flows) { f.t += f.speed * dt; f.flip -= dt; if (f.flip <= 0) { f.ch = pick(f.t > 0.2 && f.t < 0.8 ? HEX : AMINO); f.flip = 0.09; } }
      for (let i = flows.length - 1; i >= 0; i--) if (flows[i].t >= 1) { ripples.push({ x: xe, y: CY + (flows[i].y - CY) * 0.25, t: 0, c: C.cyan, kind: 'entry' }); flows.splice(i, 1); }
      for (const o of outs) o.t += o.speed * dt;
      for (let i = outs.length - 1; i >= 0; i--) if (outs[i].t >= 1) { ripples.push({ x: LOCK_X, y: CY, t: 0, c: C.mint, kind: 'lock' }); outs.splice(i, 1); }
      for (const p of probes) {
        if (p.hit > 0) { p.hit += dt * 1.8; continue; }
        p.t += dt * 0.5;
        if (p.t >= 1) {
          p.hit = 0.001; barrierGlow = 1; hitAng = p.ang; ripples.push({ x: 0, y: 0, t: 0, c: C.pink, kind: 'barrier', ang: p.ang });
          for (let k = 0; k < 9; k++) { const a = p.ang + (Math.random() - 0.5) * 2.2; const sp = 50 + Math.random() * 80; sparks.push({ x: VX + Math.cos(p.ang) * BARRIER_R, y: CY + Math.sin(p.ang) * BARRIER_R, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1 }); }
        }
      }
      for (let i = probes.length - 1; i >= 0; i--) if (probes[i].hit > 1) probes.splice(i, 1);
      for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.97; s.vy *= 0.97; s.life -= dt * 1.7; }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1);
      for (const r of ripples) r.t += dt * (r.kind === 'barrier' ? 1.6 : 1.3);
      for (let i = ripples.length - 1; i >= 0; i--) if (ripples[i].t >= 1) ripples.splice(i, 1);
      for (const o of orbit) { o.a += o.w * dt; if (Math.random() < dt * 0.35) o.ch = pick(AMINO); }
      for (const d of dust) { d.x = (d.x + d.vx * dt + W) % W; d.y = (d.y + d.vy * dt + H) % H; }
      barrierGlow = Math.max(0, barrierGlow - dt * 1.8);
    };

    // 3D → screen for the vault: yaw about Y, fixed pitch, mild perspective.
    const yaw = () => clock * 0.26, pitch = 0.46;
    const rot = (x: number, y: number, z: number, ya: number) => {
      const cy = Math.cos(ya), sy = Math.sin(ya), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const persp = 1 / (1 - z2 * 0.16);
      return { x: VX + x1 * R * persp, y: CY + y2 * R * persp, z: z2, p: persp };
    };

    const drawLock = (x: number, y: number, a: number, act: boolean) => {
      // rotating tick ring + glow disc + body/shackle
      glow(x, y, act ? 80 : 58, C.mint, 0.28 * a);
      ctx.save(); ctx.translate(x, y); ctx.rotate(clock * 0.35);
      ctx.strokeStyle = rgba(C.mint, 0.5 * a); ctx.lineWidth = 1.2;
      for (let i = 0; i < 28; i++) { const ang = i * Math.PI * 2 / 28, len = i % 7 === 0 ? 7 : 3.5; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * 47, Math.sin(ang) * 47); ctx.lineTo(Math.cos(ang) * (47 + len), Math.sin(ang) * (47 + len)); ctx.stroke(); }
      ctx.restore();
      const g = ctx.createRadialGradient(x, y - 10, 4, x, y, 36);
      g.addColorStop(0, rgba(C.mint, 0.32 * a)); g.addColorStop(1, rgba(C.mint, 0.05 * a));
      ctx.fillStyle = g; ctx.strokeStyle = rgba(C.mint, 0.85 * a); ctx.lineWidth = 1.6; ctx.shadowColor = rgba(C.mint, 0.9); ctx.shadowBlur = act ? 20 : 8;
      ctx.beginPath(); ctx.arc(x, y, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.strokeStyle = rgba([220, 255, 240], 0.95 * a); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y - 6, 9, Math.PI, 0); ctx.stroke();
      const body = ctx.createLinearGradient(0, y - 6, 0, y + 15);
      body.addColorStop(0, rgba([210, 255, 236], 0.98 * a)); body.addColorStop(1, rgba(C.mint, 0.9 * a));
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(x - 13, y - 6, 26, 21, 5); ctx.fill();
      ctx.fillStyle = 'rgba(10,22,30,.85)'; ctx.beginPath(); ctx.arc(x, y + 3.2, 2.8, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 1.1, y + 4, 2.2, 6);
    };

    const draw = () => {
      const act = activeRef.current;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const dim = (i: number) => (act === i ? 1 : 0.4);
      const tr = 0.4 + 0.6 * dim(0), ip = 0.4 + 0.6 * dim(1), en = 0.4 + 0.6 * dim(2);

      ctx.globalCompositeOperation = 'lighter';
      // ambient dust
      for (const d of dust) glow(d.x, d.y, 3 + 1.5 * Math.sin(clock + d.ph), d.c, 0.25 + 0.2 * Math.sin(clock * 1.3 + d.ph));

      // ground platform under the vault
      const py = CY + R + 8;
      ctx.save(); ctx.translate(VX, py); ctx.scale(1, 0.2);
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 1.9); pg.addColorStop(0, rgba(C.violet, 0.34 * (0.6 + 0.4 * en))); pg.addColorStop(0.55, rgba(C.violet, 0.1)); pg.addColorStop(1, rgba(C.violet, 0));
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, R * 1.9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      [[1.55, 0.5, C.violet], [1.22, 0.38, C.cyan], [0.9, 0.28, C.violet]].forEach(([k, a, c], i) => {
        ctx.strokeStyle = rgba(c as RGB, (a as number) * (0.6 + 0.4 * en)); ctx.lineWidth = 1.2; ctx.setLineDash(i === 1 ? [3, 7] : []); ctx.lineDashOffset = -clock * 14 * (i === 1 ? 1 : 0);
        ctx.beginPath(); ctx.ellipse(VX, py, R * (k as number), R * (k as number) * 0.2, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // orbiting beacon on the outer ring
      { const a = clock * 0.8, bx = VX + Math.cos(a) * R * 1.55, by = py + Math.sin(a) * R * 0.31; glow(bx, by, 12, C.cyan, 0.9 * en); }

      // encrypted glass tunnel
      const wall = (u: number) => 28 * (1 - 0.5 * u);
      const tx = (u: number) => TUNNEL_X + (xe - TUNNEL_X) * u;
      for (const sgn of [-1, 1]) {
        const g = ctx.createLinearGradient(TUNNEL_X, 0, xe, 0); g.addColorStop(0, rgba(C.cyan, 0)); g.addColorStop(0.3, rgba(C.cyan, 0.5 * en)); g.addColorStop(1, rgba(C.violet, 0.55 * en));
        ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.beginPath();
        for (let k = 0; k <= 24; k++) { const u = k / 24; ctx[k ? 'lineTo' : 'moveTo'](tx(u), CY + sgn * wall(u)); }
        ctx.stroke();
      }
      ctx.fillStyle = rgba(C.cyan, 0.05 * en); ctx.beginPath();
      for (let k = 0; k <= 24; k++) ctx.lineTo(tx(k / 24), CY - wall(k / 24));
      for (let k = 24; k >= 0; k--) ctx.lineTo(tx(k / 24), CY + wall(k / 24));
      ctx.fill();
      for (let k = 0; k < 9; k++) {
        const u = (k / 9 + clock * 0.12) % 1, a = Math.sin(u * Math.PI) * 0.55 * en;
        ctx.strokeStyle = rgba(C.cyan, a); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(tx(u), CY, 4 + 2 * u, wall(u), 0, 0, Math.PI * 2); ctx.stroke();
      }

      // helix emitter (your sequences)
      glow(SRC_X, CY, 74, C.violet, 0.3);
      ctx.save(); ctx.translate(SRC_X, CY); ctx.scale(1.2, 1.2);
      ctx.strokeStyle = rgba(C.violet, 0.8); ctx.lineWidth = 2; ctx.shadowColor = rgba(C.violet, 0.9); ctx.shadowBlur = 10;
      for (let i = 0; i < 3; i++) { const a0 = clock * 0.9 + i * 2.09; ctx.beginPath(); ctx.arc(0, 0, 36, a0, a0 + 1.45); ctx.stroke(); }
      ctx.shadowBlur = 0; ctx.strokeStyle = rgba(C.cyan, 0.4); ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.arc(0, 0, 45, -clock * 0.5, -clock * 0.5 + Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      for (let k = 0; k <= 20; k++) {
        const yy = -24 + k * 2.4, amp = 15 * Math.sin((k / 20) * Math.PI), ph = k * 0.62 + clock * 2.6;
        const xa = Math.sin(ph) * amp, xb = -xa, za = Math.cos(ph);
        if (k % 3 === 0) { ctx.strokeStyle = rgba(C.white, 0.2); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa, yy); ctx.lineTo(xb, yy); ctx.stroke(); }
        glow(xa, yy, 4.5 + za * 1.3, C.violet, 0.9); glow(xb, yy, 4.5 - za * 1.3, C.cyan, 0.9);
      }
      ctx.restore();

      // sequences streaming into the tunnel
      for (const f of flows) {
        const u = f.t, x = TUNNEL_X + (xe - TUNNEL_X) * u, y = CY + (f.y - CY) * (1 - 0.8 * u) + Math.sin(u * 11 + f.seed) * 4 * (1 - u);
        const cipher = u > 0.2 && u < 0.82, a = Math.min(1, u * 8) * Math.min(1, (1 - u) * 7);
        const c = cipher ? C.cyan : C.violet;
        // light streak
        const len = 26 + 14 * u, grad = ctx.createLinearGradient(x - len, y, x, y); grad.addColorStop(0, rgba(c, 0)); grad.addColorStop(1, rgba(c, 0.55 * a * en));
        ctx.strokeStyle = grad; ctx.lineWidth = cipher ? 2.2 : 1.4; ctx.beginPath(); ctx.moveTo(x - len, y); ctx.lineTo(x, y); ctx.stroke();
        glow(x, y, cipher ? 8 : 6, c, 0.95 * a * (cipher ? en : 0.9));
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = `700 14px ${MONO}`;
      for (const f of flows) {
        const u = f.t, x = TUNNEL_X + (xe - TUNNEL_X) * u, y = CY + (f.y - CY) * (1 - 0.8 * u) + Math.sin(u * 11 + f.seed) * 4 * (1 - u);
        const cipher = u > 0.2 && u < 0.82, a = Math.min(1, u * 8) * Math.min(1, (1 - u) * 7);
        ctx.fillStyle = cipher ? rgba(C.cyan, 0.95 * a * en) : rgba([235, 228, 255], 0.95 * a);
        ctx.fillText(f.ch, x, y - (cipher ? 10 : 9));
      }
      ctx.globalCompositeOperation = 'lighter';

      // vault: back half, core, orbiting residues, front half
      const ya = yaw();
      const pts = GEO.verts.map(v => rot(v[0], v[1], v[2], ya));
      const memb = ctx.createRadialGradient(VX, CY, R * 0.5, VX, CY, R * 1.04);
      memb.addColorStop(0, rgba(C.violet, 0.02)); memb.addColorStop(0.8, rgba(C.violet, 0.1 + 0.08 * en)); memb.addColorStop(0.97, rgba(C.cyan, 0.32 * en)); memb.addColorStop(1, rgba(C.cyan, 0));
      ctx.fillStyle = memb; ctx.beginPath(); ctx.arc(VX, CY, R * 1.06, 0, Math.PI * 2); ctx.fill();
      glow(VX, CY, 34 + 5 * Math.sin(clock * 2), C.violet, 0.95); glow(VX, CY, 15, C.white, 0.9);
      const edgeList = GEO.edges.map(([a, b]) => ({ a: pts[a], b: pts[b], z: (pts[a].z + pts[b].z) / 2 })).sort((p, q) => p.z - q.z);
      const orbPts = orbit.map(o => {
        const x0 = Math.cos(o.a) * o.r, z0 = Math.sin(o.a) * o.r;
        const y1 = -z0 * Math.sin(o.inc), z1 = z0 * Math.cos(o.inc);
        const p = rot(x0 * Math.cos(o.node) + z1 * Math.sin(o.node), y1, -x0 * Math.sin(o.node) + z1 * Math.cos(o.node), ya * 0.6);
        return { ...p, ch: o.ch };
      });
      const drawEdges = (front: boolean) => {
        for (const e of edgeList) {
          if ((e.z >= 0) !== front) continue;
          const d = (e.z + 1) / 2, a = (front ? 0.2 + 0.55 * d : 0.08 + 0.2 * d) * (0.55 + 0.45 * en);
          ctx.strokeStyle = rgba(front ? C.violet : C.cyan, a); ctx.lineWidth = front ? 1.15 : 0.8;
          ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
        }
      };
      drawEdges(false);
      for (const p of pts) if (p.z < 0) glow(p.x, p.y, 3.2, C.cyan, 0.4 * en);
      ctx.globalCompositeOperation = 'source-over';
      const letters = (front: boolean) => {
        for (const o of orbPts) {
          if ((o.z >= 0) !== front) continue;
          ctx.font = `700 ${Math.round(10 + 5 * o.p)}px ${MONO}`;
          ctx.fillStyle = rgba([232, 226, 255], (front ? 0.95 : 0.4) * (0.6 + 0.4 * en)); ctx.fillText(o.ch, o.x, o.y);
        }
      };
      letters(false);
      ctx.globalCompositeOperation = 'lighter';
      drawEdges(true);
      for (const p of pts) if (p.z >= 0) glow(p.x, p.y, 4 + 2.4 * p.z, C.mint, (0.55 + 0.4 * p.z) * (0.6 + 0.4 * en));
      ctx.globalCompositeOperation = 'source-over';
      letters(true);
      ctx.globalCompositeOperation = 'lighter';
      // membrane rim light
      const rim = ctx.createLinearGradient(VX - R, CY - R, VX + R, CY + R); rim.addColorStop(0, rgba(C.cyan, 0.8 * en)); rim.addColorStop(0.5, rgba(C.violet, 0.35)); rim.addColorStop(1, rgba(C.pink, 0.6 * en));
      ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.shadowColor = rgba(C.violet, 0.9); ctx.shadowBlur = act === 2 ? 22 : 10;
      ctx.beginPath(); ctx.arc(VX, CY, R * 1.02, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;

      // designs leaving the vault
      const xs = VX + R * 0.98, xl = LOCK_X - 46;
      ctx.strokeStyle = rgba(C.mint, 0.22 * ip); ctx.lineWidth = 1.2; ctx.setLineDash([3, 7]); ctx.lineDashOffset = -clock * 26;
      ctx.beginPath(); ctx.moveTo(xs, CY); ctx.lineTo(xl, CY); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      for (const o of outs) {
        const x = xs + (xl - xs) * o.t, y = CY + Math.sin(o.t * 7 + o.seed) * 6, a = Math.min(1, o.t * 6) * Math.min(1, (1 - o.t) * 5) * ip;
        const grad = ctx.createLinearGradient(x - 34, y, x, y); grad.addColorStop(0, rgba(C.mint, 0)); grad.addColorStop(1, rgba(C.mint, 0.5 * a));
        ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x, y); ctx.stroke();
        glow(x, y, 12, C.mint, 0.75 * a);
        ctx.save(); ctx.translate(x, y); ctx.rotate(clock * 1.4 + o.seed);
        ctx.strokeStyle = rgba([225, 255, 244], 0.95 * a); ctx.lineWidth = 1.5; ctx.beginPath();
        for (let i = 0; i < 6; i++) { const ang = i * Math.PI / 3; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * 6.5, Math.sin(ang) * 6.5); }
        ctx.closePath(); ctx.stroke(); ctx.restore();
      }
      drawLock(LOCK_X, CY, 0.5 + 0.5 * dim(1), act === 1);

      // general-model node (a quiet network) and the energy barrier
            const net = [[-52, 30], [-30, 18], [-8, 34], [14, 16], [36, 32], [54, 20], [0, 22]];
      ctx.strokeStyle = rgba([170, 165, 190], 0.2 * tr);
      [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 6], [6, 3], [2, 6]].forEach(([i, j]) => { ctx.beginPath(); ctx.moveTo(VX + net[i][0], net[i][1]); ctx.lineTo(VX + net[j][0], net[j][1]); ctx.stroke(); });
      net.forEach(([x, y], i) => glow(VX + x, y, 4 + Math.sin(clock * 1.4 + i), [190, 180, 215], 0.35 * tr));
      ctx.strokeStyle = rgba(C.pink, 0.2 * tr); ctx.lineWidth = 1; ctx.setLineDash([2, 6]); ctx.beginPath(); ctx.moveTo(VX, 52); ctx.lineTo(VX, CY - BARRIER_R + 2); ctx.stroke(); ctx.setLineDash([]);
      // barrier: a shield arc made of fine radial cells, brightest at the last impact
      for (let k = -42; k <= 42; k++) {
        const ang = -Math.PI / 2 + k * 0.0145, fall = 1 - Math.abs(k) / 48, near = Math.max(0, 1 - Math.abs(ang - hitAng) / 0.28);
        const a = (0.16 + 0.34 * fall + 0.7 * near * barrierGlow) * tr;
        ctx.strokeStyle = rgba(C.pink, a); ctx.lineWidth = k % 4 === 0 ? 1.6 : 1;
        const len = k % 4 === 0 ? 6 : 3.5;
        ctx.beginPath(); ctx.moveTo(VX + Math.cos(ang) * (BARRIER_R - len), CY + Math.sin(ang) * (BARRIER_R - len)); ctx.lineTo(VX + Math.cos(ang) * (BARRIER_R + len), CY + Math.sin(ang) * (BARRIER_R + len)); ctx.stroke();
      }
      ctx.strokeStyle = rgba(C.pink, (0.45 + 0.4 * barrierGlow) * tr); ctx.lineWidth = 2; ctx.shadowColor = rgba(C.pink, 0.9); ctx.shadowBlur = 8 + 16 * barrierGlow;
      ctx.beginPath(); ctx.arc(VX, CY, BARRIER_R, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62); ctx.stroke(); ctx.shadowBlur = 0;
      for (const p of probes) {
        const inner = R * 1.04, r = p.hit > 0 ? BARRIER_R - (BARRIER_R - inner) * Math.min(1, p.hit) * 0.9 : inner + (BARRIER_R - 3 - inner) * p.t;
        const x = VX + Math.cos(p.ang) * r, y = CY + Math.sin(p.ang) * r, a = (p.hit > 0 ? 1 - Math.min(1, p.hit) : 1) * tr;
        const tail = p.hit > 0 ? -1 : 1, tx2 = VX + Math.cos(p.ang) * (r - tail * 22), ty2 = CY + Math.sin(p.ang) * (r - tail * 22);
        const grad = ctx.createLinearGradient(tx2, ty2, x, y); grad.addColorStop(0, rgba(C.pink, 0)); grad.addColorStop(1, rgba(C.pink, 0.7 * a));
        ctx.strokeStyle = grad; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(x, y); ctx.stroke();
        glow(x, y, 8, C.pink, 0.95 * a);
      }
      for (const s of sparks) glow(s.x, s.y, 3.5, [239,169,196], Math.max(0, s.life) * tr);

      // ripples: membrane entry, barrier impact, ownership lock
      for (const r of ripples) {
        const fade = 1 - r.t;
        if (r.kind === 'entry') { ctx.strokeStyle = rgba(r.c, 0.8 * fade * en); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(r.x, r.y, 3 + 14 * r.t, 8 + 30 * r.t, 0, 0, Math.PI * 2); ctx.stroke(); }
        else if (r.kind === 'lock') { ctx.strokeStyle = rgba(r.c, 0.7 * fade * ip); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(r.x, r.y, 40 + 34 * r.t, 0, Math.PI * 2); ctx.stroke(); }
        else { ctx.strokeStyle = rgba(r.c, 0.8 * fade * tr); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(VX, CY, BARRIER_R + 2 + 10 * r.t, (r.ang ?? 0) - 0.12 - 0.5 * r.t, (r.ang ?? 0) + 0.12 + 0.5 * r.t); ctx.stroke(); }
      }
      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      step(Math.min(0.05, (now - last) / 1000)); last = now; draw();
      frame = requestAnimationFrame(loop);
    };
    const kick = () => { if (!frame && visible && !reduce) { last = performance.now(); frame = requestAnimationFrame(loop); } };

    resize();
    // Reduced motion: simulate a few seconds, then hold one still frame.
    if (reduce) { for (let i = 0; i < 200; i++) step(1 / 30); draw(); } else kick();
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    io.observe(el);
    document.addEventListener('visibilitychange', kick);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', kick); };
  }, []);

  return <canvas ref={canvas} className="vault-canvas" aria-hidden="true" />;
}
