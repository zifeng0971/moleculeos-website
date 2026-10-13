'use client';

import { useEffect, useRef, useState } from 'react';
import { afterHeroEntrance } from '@/lib/after-hero-entrance';

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

// Fade particles out before they reach the canvas edge, so nothing is ever clipped into a hard line.
// Done in the shader rather than with a CSS mask, which Chrome can drop while an ancestor animates a filter.
const EDGE_FADE = /* glsl */ `
float edgeFade(vec4 clip) {
  vec2 ndc = abs(clip.xy / clip.w);
  return smoothstep(1.0, 0.68, ndc.y) * smoothstep(1.0, 0.8, ndc.x);
}`;

const VERTEX = /* glsl */ `
${EDGE_FADE}
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
  vColor = sectorColor(wa) * (0.62 + (0.85 - 0.4 * uPrecision) * head);
  vAlpha = clamp((mix(0.3, 0.72, uPrecision) * (0.45 + 0.55 * aSize) + head * 0.5) * mix(0.4, 1.0, depth), 0.0, 1.0) * edgeFade(gl_Position);
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

// NewOrigin core: a slowly turning particle sphere that grows denser and brighter as precision rises.
const CORE_VERTEX = /* glsl */ `
${EDGE_FADE}
uniform float uTime, uPrecision, uPulse, uSize, uPixelRatio;
attribute float aSize;
varying float vAlpha;
varying vec3 vColor;
void main() {
  float a = uTime * 0.35;
  vec3 p = position * (0.86 + 0.14 * uPrecision + 0.08 * uPulse);
  p = vec3(p.x * cos(a) - p.z * sin(a), p.y, p.x * sin(a) + p.z * cos(a));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float rim = 1.0 - abs(normalize(p).z);
  vColor = mix(vec3(0.75, 0.66, 1.0), vec3(1.0), 0.3 + 0.55 * uPulse);
  vAlpha = (0.38 + 0.5 * uPrecision + 0.6 * uPulse) * (0.55 + 0.45 * rim) * edgeFade(gl_Position);
  gl_PointSize = aSize * (1.0 + uPulse * 0.6) * uSize * uPixelRatio / -mv.z;
}`;

// Flows: particles travel along an arc. Flow 0 carries experimental results from "evolve" into the core;
// flow 1 carries the updated model from the core out to "design".
const FLOW_VERTEX = /* glsl */ `
${EDGE_FADE}
uniform float uTime, uIn, uOut, uSize, uPixelRatio;
uniform vec3 uFrom, uTo;
attribute float aFlow, aT;
attribute vec3 aJitter;
varying float vAlpha;
varying vec3 vColor;
void main() {
  bool incoming = aFlow < 0.5;
  vec3 A = incoming ? uFrom : vec3(0.0);
  vec3 B = incoming ? vec3(0.0) : uTo;
  vec3 C = (A + B) * 0.5 + vec3(0.0, 1.45, 0.0);
  float t = fract(aT + uTime * 1.0);
  vec3 p = mix(mix(A, C, t), mix(C, B, t), t) + aJitter * 0.16 * sin(3.14159 * t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float strength = incoming ? uIn : uOut;
  vec3 core = vec3(0.85, 0.8, 1.0);
  vColor = incoming ? mix(vec3(0.43, 0.83, 1.0), core, t) : mix(core, vec3(0.66, 0.55, 1.0), t);
  vAlpha = strength * sin(3.14159 * t) * edgeFade(gl_Position);
  gl_PointSize = (1.1 + aJitter.z * 0.9) * uSize * uPixelRatio / -mv.z;
}`;

const SOFT_FRAGMENT = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  gl_FragColor = vec4(vColor, pow(1.0 - d * 2.0, 1.6) * vAlpha);
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
    // The wheel sits far below the fold: build it after the hero entrance so load stays smooth.
    const cancelStart = afterHeroEntrance(() => void (async () => {
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

      const nodePoint = (i: number) => new THREE.Vector3(Math.cos(NODES[i].angle) * RADIUS, 0, Math.sin(NODES[i].angle) * RADIUS);

      // NewOrigin core: Fibonacci-sphere particles.
      const coreCount = small ? 700 : 1400;
      const corePositions = new Float32Array(coreCount * 3), coreSizes = new Float32Array(coreCount);
      for (let i = 0; i < coreCount; i++) {
        const y = 1 - (i / (coreCount - 1)) * 2, r = Math.sqrt(1 - y * y), phi = i * 2.399963;
        const radius = 0.42 * (0.82 + rand() * 0.18);
        corePositions[i * 3] = Math.cos(phi) * r * radius; corePositions[i * 3 + 1] = y * radius; corePositions[i * 3 + 2] = Math.sin(phi) * r * radius;
        coreSizes[i] = 0.35 + rand() * 0.45;
      }
      const coreGeometry = new THREE.BufferGeometry();
      coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
      coreGeometry.setAttribute('aSize', new THREE.BufferAttribute(coreSizes, 1));
      const coreUniforms = { uTime: uniforms.uTime, uPrecision: uniforms.uPrecision, uPulse: { value: 0 }, uSize: uniforms.uSize, uPixelRatio: uniforms.uPixelRatio };
      const coreMaterial = new THREE.ShaderMaterial({ vertexShader: CORE_VERTEX, fragmentShader: SOFT_FRAGMENT, uniforms: coreUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      scene.add(new THREE.Points(coreGeometry, coreMaterial));

      // Learning flow (evolve → core) and design flow (core → design).
      const flowCount = small ? 420 : 900;
      const flowKinds = new Float32Array(flowCount * 2), flowT = new Float32Array(flowCount * 2), flowJitter = new Float32Array(flowCount * 6);
      for (let i = 0; i < flowCount * 2; i++) {
        flowKinds[i] = i < flowCount ? 0 : 1; flowT[i] = rand();
        flowJitter[i * 3] = gaussian(rand); flowJitter[i * 3 + 1] = gaussian(rand); flowJitter[i * 3 + 2] = rand();
      }
      const flowGeometry = new THREE.BufferGeometry();
      flowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(flowCount * 6), 3));
      flowGeometry.setAttribute('aFlow', new THREE.BufferAttribute(flowKinds, 1));
      flowGeometry.setAttribute('aT', new THREE.BufferAttribute(flowT, 1));
      flowGeometry.setAttribute('aJitter', new THREE.BufferAttribute(flowJitter, 3));
      flowGeometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 5);
      const flowUniforms = { uTime: uniforms.uTime, uIn: { value: 0 }, uOut: { value: 0 }, uSize: uniforms.uSize, uPixelRatio: uniforms.uPixelRatio, uFrom: { value: nodePoint(2) }, uTo: { value: nodePoint(0) } };
      const flowMaterial = new THREE.ShaderMaterial({ vertexShader: FLOW_VERTEX, fragmentShader: SOFT_FRAGMENT, uniforms: flowUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      scene.add(new THREE.Points(flowGeometry, flowMaterial));

      // Faint depth dust.
      const dustCount = small ? 500 : 1200;
      const dust = new Float32Array(dustCount * 3);
      for (let i = 0; i < dustCount; i++) { dust[i * 3] = (rand() - 0.5) * 14; dust[i * 3 + 1] = (rand() - 0.5) * 6; dust[i * 3 + 2] = (rand() - 0.5) * 10; }
      const dustGeometry = new THREE.BufferGeometry();
      dustGeometry.setAttribute('position', new THREE.BufferAttribute(dust, 3));
      const dustMaterial = new THREE.PointsMaterial({ color: 0x9d8cff, size: 0.018, transparent: true, opacity: 0.35, depthWrite: false });
      scene.add(new THREE.Points(dustGeometry, dustMaterial));

      let w = 0, h = 0;
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
        camera.lookAt(0, portrait ? -1.9 : -0.25, 0);
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
      const passedAt = [-1e9, -1e9, -1e9];
      const draw = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!reduce) {
          const target = laps >= LAPS_TO_CONVERGE + 2 ? 0 : Math.min(1, laps / LAPS_TO_CONVERGE);
          precision += (target - precision) * Math.min(1, dt * (target < precision ? 1.8 : 2.6));
          const omega = 0.3 + precision * 0.5, headOmega = 2.9 + precision * 1.6;
          rot += omega * dt; head += headOmega * dt; travelled += headOmega * dt;
          if (travelled >= TAU) { travelled -= TAU; laps = laps >= LAPS_TO_CONVERGE + 2 ? 0 : laps + 1; }
        }
        uniforms.uRot.value = rot; uniforms.uHead.value = head % TAU; uniforms.uPrecision.value = precision; uniforms.uTime.value = now / 1000;
        // Highlight the stage nearest the packet. Passing "evolve" feeds the core; passing "design" draws from it.
        const h0 = head % TAU;
        let stage = 0, nearest = Infinity;
        NODES.forEach((node, i) => {
          const gap = Math.abs(((h0 - node.angle + TAU * 1.5) % TAU) - Math.PI);
          if (gap < nearest) { nearest = gap; stage = i; }
          const behind = (h0 - node.angle + TAU) % TAU;
          if (behind < 0.25 && now - passedAt[i] > 600) passedAt[i] = now;
        });
        const since = (i: number) => Math.exp(-(now - passedAt[i]) / 1300);
        flowUniforms.uIn.value = reduce ? 0.6 : since(2);
        flowUniforms.uOut.value = reduce ? 0.6 : since(0);
        // The core brightens as the learning flow arrives (about half a second after "evolve").
        coreUniforms.uPulse.value = reduce ? 0 : Math.exp(-Math.pow((now - passedAt[2] - 700) / 450, 2));
        if (stage !== lastStage) { lastStage = stage; setActive(stage); }
        const r = Math.min(laps + 1, LAPS_TO_CONVERGE + 1);
        if (r !== lastRound) { lastRound = r; setRound(r); }
        if (barRef.current) barRef.current.style.transform = `scaleX(${precision.toFixed(3)})`;
        renderer.render(scene, camera);
      };
      // The camera is fixed, so labels only move when the canvas resizes.
      const placeLabels = () => {
        NODES.forEach((node, i) => place(nodeRefs.current[i], Math.cos(node.angle) * RADIUS * 1.3, Math.sin(node.angle) < -0.5 ? 0.32 : 0, Math.sin(node.angle) * RADIUS * 1.3));
        place(coreRef.current, 0, -0.72, 0);
      };
      const loop = (now: number) => { frame = 0; if (!visible || document.hidden) return; draw(now); frame = requestAnimationFrame(loop); };
      const kick = () => { if (!reduce && !frame && visible) { last = performance.now(); frame = requestAnimationFrame(loop); } };
      draw(performance.now()); placeLabels(); kick();
      const ro = new ResizeObserver(() => { resize(); draw(performance.now()); placeLabels(); });
      ro.observe(el);
      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); });
      io.observe(el);
      document.addEventListener('visibilitychange', kick);
      cleanup = () => {
        cancelAnimationFrame(frame); ro.disconnect(); io.disconnect();
        document.removeEventListener('visibilitychange', kick);
        geometry.dispose(); material.dispose(); dustGeometry.dispose(); dustMaterial.dispose();
        coreGeometry.dispose(); coreMaterial.dispose(); flowGeometry.dispose(); flowMaterial.dispose();
        renderer.dispose(); renderer.domElement.remove();
      };
    })());
    return () => { disposed = true; cancelStart(); cleanup(); };
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
