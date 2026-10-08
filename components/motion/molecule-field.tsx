'use client';

import { useEffect, useRef } from 'react';

type Vec = [number, number, number];

// Deterministic PRNG so the server-independent canvas looks identical on every load.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
const norm = (a: Vec): Vec => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** A protein-like Cα trace: alpha-helices joined by persistent random-walk loops, folded toward its centre. */
function buildBackbone(): Vec[] {
  const rand = mulberry32(5);
  const unit = (): Vec => norm([rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1]);
  const points: Vec[] = [];
  let pos: Vec = [0, 0, 0];
  let dir = unit();
  for (let segment = 0; segment < 16; segment++) {
    if (segment % 2 === 0) {
      const length = 11 + Math.floor(rand() * 9);
      const u = norm(cross(dir, Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
      const v = cross(dir, u);
      for (let k = 0; k < length; k++) {
        const angle = k * 1.745; // 100° per residue
        points.push(add(add(pos, scale(dir, 1.5 * k)), add(scale(u, 2.3 * Math.cos(angle)), scale(v, 2.3 * Math.sin(angle)))));
      }
      pos = add(pos, scale(dir, 1.5 * length));
    } else {
      const length = 5 + Math.floor(rand() * 7);
      for (let k = 0; k < length; k++) {
        dir = norm(add(add(dir, scale(unit(), 0.75)), scale(pos, -0.012)));
        pos = add(pos, scale(dir, 3.8));
        points.push(pos);
      }
    }
    dir = norm(add(add(dir, scale(unit(), 1.1)), scale(pos, -0.03)));
  }
  const centre = scale(points.reduce(add, [0, 0, 0]), 1 / points.length);
  const centred = points.map(p => add(p, scale(centre, -1)));
  const radius = Math.max(...centred.map(p => Math.hypot(p[0], p[1], p[2])));
  return centred.map(p => scale(p, 1 / radius));
}

const PALETTE: [number, number, number][] = [[124, 92, 255], [192, 120, 255], [224, 123, 200], [90, 200, 250]];
function colorAt(t: number) {
  const x = t * (PALETTE.length - 1), i = Math.min(Math.floor(x), PALETTE.length - 2), f = x - i;
  const a = PALETTE[i], b = PALETTE[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f].map(Math.round) as [number, number, number];
}

function glowSprite(rgb: [number, number, number]) {
  const size = 64, sprite = document.createElement('canvas');
  sprite.width = sprite.height = size;
  const g = sprite.getContext('2d')!;
  const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.18, `rgba(${rgb.join(',')},0.9)`);
  gradient.addColorStop(0.5, `rgba(${rgb.join(',')},0.18)`);
  gradient.addColorStop(1, `rgba(${rgb.join(',')},0)`);
  g.fillStyle = gradient; g.fillRect(0, 0, size, size);
  return sprite;
}

/** Slowly rotating protein backbone with a travelling signal pulse; pauses off-screen and honours reduced motion. */
export function MoleculeField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const backbone = buildBackbone();
    const rand = mulberry32(11);
    const dust: Vec[] = Array.from({ length: 140 }, () => {
      const r = 0.9 + rand() * 1.1, theta = rand() * Math.PI * 2, phi = Math.acos(rand() * 2 - 1);
      return [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.7, r * Math.sin(phi) * Math.sin(theta)];
    });
    const colors = backbone.map((_, i) => colorAt(i / (backbone.length - 1)));
    const sprites = PALETTE.map(glowSprite);
    const spriteFor = (i: number) => sprites[Math.min(Math.round(i / (backbone.length - 1) * (sprites.length - 1)), sprites.length - 1)];
    let width = 0, height = 0, dpr = 1, frame = 0, visible = true;
    const start = performance.now();
    let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      easedX += (pointerX - easedX) * 0.04; easedY += (pointerY - easedY) * 0.04;
      const yaw = t * 0.11 + easedX * 0.5, pitch = 0.35 + easedY * 0.3 + Math.sin(t * 0.2) * 0.06;
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const radius = Math.min(width * 0.36, height * 0.46, 520);
      const ox = width / 2, oy = height * 0.42;
      const project = (p: Vec) => {
        const x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
        const y1 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
        const f = 3 / (3 + z2);
        return { x: ox + x1 * radius * f, y: oy + y1 * radius * f, z: z2, f };
      };
      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'source-over';
      for (const p of dust) {
        const q = project(p), depth = (1 - q.z) / 2;
        ctx.fillStyle = `rgba(200,190,255,${0.08 + depth * 0.32})`;
        ctx.fillRect(q.x, q.y, 1.4 * q.f, 1.4 * q.f);
      }

      const projected = backbone.map(project);
      ctx.lineCap = 'round';
      for (let i = 1; i < projected.length; i++) {
        const a = projected[i - 1], b = projected[i];
        const depth = (2 - a.z - b.z) / 4;
        const [r, g, bl] = colors[i];
        ctx.strokeStyle = `rgba(${r},${g},${bl},${0.1 + depth * 0.5})`;
        ctx.lineWidth = 0.6 + depth * 1.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      const head = reduce ? -100 : (t * 26) % (projected.length + 40);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < projected.length; i++) {
        const q = projected[i], depth = (1 - q.z) / 2;
        const distance = head - i;
        const pulse = distance >= 0 && distance < 14 ? 1 - distance / 14 : 0;
        const size = (7 + depth * 12) * q.f * (1 + pulse * 1.6);
        ctx.globalAlpha = Math.min(1, 0.18 + depth * 0.55 + pulse * 0.6);
        ctx.drawImage(spriteFor(i), q.x - size / 2, q.y - size / 2, size, size);
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

    resize();
    draw(start);
    kick();
    const resizeObserver = new ResizeObserver(() => { resize(); draw(performance.now()); });
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); });
    intersection.observe(canvas);
    const onPointer = (event: PointerEvent) => { pointerX = event.clientX / window.innerWidth * 2 - 1; pointerY = event.clientY / window.innerHeight * 2 - 1; };
    const onVisibility = () => { if (!document.hidden) kick(); };
    if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); intersection.disconnect();
      window.removeEventListener('pointermove', onPointer); document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
