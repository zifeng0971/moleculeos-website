'use client';

import { useEffect, useRef, useState } from 'react';

export type FlywheelLabels = { design: string; experiment: string; evolve: string; round: (n: number) => string; precision: string; illustrative: string };

const TAU = Math.PI * 2;
const RADIUS = 2.4;
// Stage positions on the wheel (radians, world XZ plane); the data packet travels design → experiment → evolve.
const NODES = [
  { key: 'design', angle: (150 / 360) * TAU, color: [0.66, 0.55, 1.0] },
  { key: 'experiment', angle: (270 / 360) * TAU, color: [0.94, 0.55, 0.82] },
  { key: 'evolve', angle: (30 / 360) * TAU, color: [0.43, 0.83, 1.0] },
] as const;
const LAPS_TO_CONVERGE = 3;

const VERTEX = /* glsl */ `
uniform float uRot, uPrecision, uHead, uTime, uSize, uPixelRatio;
attribute float aAngle, aSize;
attribute vec3 aNoise;
varying vec3 vColor;
varying float vAlpha;
const float TAU = 6.28318530718;
const float PI = 3.14159265359;
vec3 sectorColor(float a) {
  vec3 cDesign = vec3(0.66, 0.55, 1.0), cExperiment = vec3(0.94, 0.55, 0.82), cEvolve = vec3(0.43, 0.83, 1.0);
  float t = mod(a - radians(150.0), TAU) / (TAU / 3.0);
  if (t < 1.0) return mix(cDesign, cExperiment, smoothstep(0.0, 1.0, t));
  if (t < 2.0) return mix(cExperiment, cEvolve, smoothstep(0.0, 1.0, t - 1.0));
  return mix(cEvolve, cDesign, smoothstep(0.0, 1.0, t - 2.0));
}
void main() {
  // Precision tightens the cloud into a crisp ring; every lap of experiments raises it.
  float spread = mix(0.46, 0.028, uPrecision);
  float a = aAngle + uRot;
  float r = ${RADIUS.toFixed(2)} + aNoise.x * spread + sin(uTime * 0.7 + aNoise.z * 9.0) * spread * 0.22;
  vec3 pos = vec3(cos(a) * r, aNoise.y * spread * 0.62, sin(a) * r);
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float wa = mod(a, TAU);
  // Data packet: a short bright front with a long fading tail.
  float d = mod(wa - uHead + PI, TAU) - PI;
  float head = d > 0.0 ? exp(-d * d * 140.0) : exp(d * 3.4);
  // Depth cue: the far side of the wheel recedes.
  float depth = smoothstep(-10.5, -5.5, mv.z);
  vColor = sectorColor(wa) * (0.62 + 0.85 * head);
  vAlpha = clamp((mix(0.3, 0.72, uPrecision) * (0.45 + 0.55 * aSize) + head * 0.5) * mix(0.4, 1.0, depth), 0.0, 1.0);
  gl_PointSize = aSize * (0.9 + head * 1.05) * uSize * uPixelRatio / -mv.z;
}`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 1.7) * vAlpha);
}`;

function gaussian(rand: () => number) {
  const u = Math.max(1e-6, rand()), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

/**
 * Data flywheel in WebGL: a particle ring that spins up and sharpens with every lap of design → experiment → evolve.
 * three.js is imported on demand, rendering pauses off-screen, and reduced motion gets a single settled frame.
 */
export function FlywheelScene({ labels }: { labels: FlywheelLabels }) {
  const host = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coreRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [round, setRound] = useState(1);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import('three');
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      } catch {
        setFailed(true);
        return;
      }
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const small = matchMedia('(max-width: 767px)').matches;
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.className = 'flywheel-canvas';
      el.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

      // Ring particles.
      const count = small ? 7000 : 16000;
      let seed = 11;
      const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      const angles = new Float32Array(count), sizes = new Float32Array(count), noise = new Float32Array(count * 3), positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        angles[i] = rand() * TAU;
        sizes[i] = 0.5 + Math.pow(rand(), 4) * 1.15;
        noise[i * 3] = gaussian(rand); noise[i * 3 + 1] = gaussian(rand); noise[i * 3 + 2] = rand();
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('aNoise', new THREE.BufferAttribute(noise, 3));
      geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);
      const uniforms = {
        uRot: { value: 0 }, uPrecision: { value: reduce ? 1 : 0 }, uHead: { value: NODES[0].angle }, uTime: { value: 0 },
        uSize: { value: 30 }, uPixelRatio: { value: 1 },
      };
      const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      scene.add(new THREE.Points(geometry, material));

      // Spokes from the NewOrigin core to each stage: learning flows back into the model.
      const spokes = NODES.map(node => {
        const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(Math.cos(node.angle) * RADIUS, 0, Math.sin(node.angle) * RADIUS)]);
        const m = new THREE.LineBasicMaterial({ color: new THREE.Color(...node.color), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false });
        scene.add(new THREE.Line(g, m));
        return { g, m };
      });

      // Faint depth dust.
      const dustCount = small ? 500 : 1200;
      const dust = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) { dust[i * 3] = (rand() - 0.5) * 14; dust[i * 3 + 1] = (rand() - 0.5) * 6; dust[i * 3 + 2] = (rand() - 0.5) * 10; }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
      const dustMaterial = new THREE.PointsMaterial({ color: 0x9d8cff, size: 0.018, transparent: true, opacity: 0.35, depthWrite: false });
      scene.add(new THREE.Points(dustGeometry, dustMaterial));

      let w = 0, h = 0, focusY = -0.25;
      const resize = () => {
        w = el.clientWidth; h = el.clientHeight;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Fit the wheel plus its side labels into the horizontal field of view (narrow screens pull back).
        const halfH = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
        const portrait = camera.aspect < 1;
        const distance = Math.max(7.1, (RADIUS * (portrait ? 1.32 : 1.45)) / Math.tan(halfH));
        // Portrait screens look down more steeply so the wheel reads as a full ring rather than a thin line.
        if (portrait) camera.position.set(0, distance * 0.72, distance * 0.7);
        else camera.position.set(0, distance * 0.42, distance);
        // Portrait: aim below the wheel so it sits in the upper part, leaving room for the legend.
        focusY = portrait ? -1.9 : -0.25;
        camera.lookAt(0, focusY, 0);
        camera.updateProjectionMatrix();
        uniforms.uPixelRatio.value = dpr;
        uniforms.uSize.value = Math.max(16, h * 0.046) * (distance / 7.1);
      };
      resize();

      const project = new THREE.Vector3();
      const place = (target: HTMLElement | null, x: number, y: number, z: number) => {
        if (!target) return;
        project.set(x, y, z).project(camera);
        target.style.transform = `translate(${((project.x + 1) / 2) * w}px, ${((1 - project.y) / 2) * h}px) translate(-50%, -50%)`;
      };

      let rot = 0, head = NODES[0].angle, laps = 0, travelled = 0, precision = reduce ? 1 : 0, last = performance.now();
      let frame = 0, visible = true, lastStage = 0, lastRound = 1;
      const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
      const draw = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!reduce) {
          const target = laps >= LAPS_TO_CONVERGE + 2 ? 0 : Math.min(1, laps / LAPS_TO_CONVERGE);
          precision += (target - precision) * Math.min(1, dt * (target < precision ? 1.8 : 2.6));
          const omega = 0.3 + precision * 0.5, headOmega = 2.9 + precision * 1.6;
          rot += omega * dt; head += headOmega * dt; travelled += headOmega * dt;
          if (travelled >= TAU) { travelled -= TAU; laps = laps >= LAPS_TO_CONVERGE + 2 ? 0 : laps + 1; }
          eased.x += (pointer.x - eased.x) * 0.05; eased.y += (pointer.y - eased.y) * 0.05;
          camera.position.x = eased.x * 0.7;
          camera.lookAt(0, focusY + eased.y * 0.15, 0);
        }
        uniforms.uRot.value = rot; uniforms.uHead.value = head % TAU; uniforms.uPrecision.value = precision; uniforms.uTime.value = now / 1000;
        // Which stage did the packet pass last? Light that stage and its spoke.
        const h0 = head % TAU;
        let stage = 0, best = Infinity;
        NODES.forEach((node, i) => { const behind = (h0 - node.angle + TAU) % TAU; if (behind < best) { best = behind; stage = i; } });
        spokes.forEach((spoke, i) => { spoke.m.opacity = 0.1 + (i === stage ? 0.35 * Math.exp(-best * 1.4) : 0); });
        if (stage !== lastStage) { lastStage = stage; setActive(stage); }
        const r = Math.min(laps + 1, LAPS_TO_CONVERGE + 1);
        if (r !== lastRound) { lastRound = r; setRound(r); }
        if (barRef.current) barRef.current.style.transform = `scaleX(${precision.toFixed(3)})`;
        coreRef.current?.style.setProperty('--pulse', String(stage === 2 ? Math.exp(-best * 2) : 0));
        renderer.render(scene, camera);
        NODES.forEach((node, i) => place(nodeRefs.current[i], Math.cos(node.angle) * RADIUS * 1.3, Math.sin(node.angle) < -0.5 ? 0.32 : 0, Math.sin(node.angle) * RADIUS * 1.3));
        place(coreRef.current, 0, 0, 0);
      };
      const loop = (now: number) => { frame = 0; if (!visible || document.hidden) return; draw(now); frame = requestAnimationFrame(loop); };
      const kick = () => { if (!reduce && !frame && visible) { last = performance.now(); frame = requestAnimationFrame(loop); } };
      draw(performance.now()); kick();
      const ro = new ResizeObserver(() => { resize(); draw(performance.now()); });
      ro.observe(el);
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); });
      io.observe(el);
      const onPointer = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      };
      if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('visibilitychange', kick);
      cleanup = () => {
        cancelAnimationFrame(frame); ro.disconnect(); io.disconnect();
        window.removeEventListener('pointermove', onPointer); document.removeEventListener('visibilitychange', kick);
        geometry.dispose(); material.dispose(); dustGeometry.dispose(); dustMaterial.dispose();
        spokes.forEach(s => { s.g.dispose(); s.m.dispose(); });
        renderer.dispose(); renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, []);

  const names = [labels.design, labels.experiment, labels.evolve];
  return <div ref={host} className="flywheel-scene" data-failed={failed || undefined}>
    <span className="flywheel-tag">{labels.illustrative}</span>
    <div ref={coreRef} className="flywheel-core" aria-hidden="true"><span>NewOrigin</span></div>
    {names.map((name, i) => <div key={name} ref={el => { nodeRefs.current[i] = el; }} className="flywheel-node" data-active={active === i || undefined} data-tone={NODES[i].key}>
      <span className="flywheel-node-index">0{i + 1}</span>{name}
    </div>)}
    <ol className="flywheel-legend" aria-hidden="true">
      {names.map((name, i) => <li key={name} data-active={active === i || undefined} data-tone={NODES[i].key}><span className="flywheel-node-index">0{i + 1}</span>{name}</li>)}
    </ol>
    <div className="flywheel-hud">
      <span className="flywheel-hud-round">{labels.round(round)}</span>
      <span className="flywheel-hud-label">{labels.precision}</span>
      <span className="flywheel-hud-bar"><span ref={barRef} /></span>
    </div>
  </div>;
}
