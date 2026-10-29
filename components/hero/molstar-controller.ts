import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Color } from 'molstar/lib/mol-util/color';
import { Quat, Vec3, Vec4 } from 'molstar/lib/mol-math/linear-algebra';
import { Loci } from 'molstar/lib/mol-model/loci';
import { StructureElement, StructureSelection } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';
import { ElementSymbolColors } from 'molstar/lib/mol-theme/color/element-symbol';
import { residueLoci } from './molstar-selection';
import { CameraHelperParams } from 'molstar/lib/mol-canvas3d/helper/camera-helper';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { FocusLoci as CameraFocusLoci } from 'molstar/lib/mol-plugin/behavior/dynamic/camera';
import { FocusLoci as RepresentationFocusLoci } from 'molstar/lib/mol-plugin/behavior/dynamic/representation';
import { StructureFocusRepresentation } from 'molstar/lib/mol-plugin/behavior/dynamic/selection/structure-focus-representation';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { Camera } from 'molstar/lib/mol-canvas3d/camera';
import { PostprocessingParams } from 'molstar/lib/mol-canvas3d/passes/postprocessing';
import { SsaoParams } from 'molstar/lib/mol-canvas3d/passes/ssao';
import { OutlineParams } from 'molstar/lib/mol-canvas3d/passes/outline';
import { setSubtreeVisibility } from 'molstar/lib/mol-plugin/behavior/static/state';
import { now } from 'molstar/lib/mol-util/now';
import { frameMonitor, isLite, onLite } from '@/lib/perf-tier';
import { inTurn, preloadStructure } from '@/lib/structure-cache';
export type ViewerOptions = { src: string; label: string; /** Create every chain hidden, so the first painted frame is empty and the scene can build it up. */ startHidden?: boolean; chains?: { auth: string; color: string; /** Colour by B-factor as a pLDDT confidence scale (AlphaFold bands) instead of a uniform colour. */ plddt?: boolean; type?: 'cartoon' | 'gaussian-surface' | 'molecular-surface'; alpha?: number }[]; camera?: Partial<Camera.Snapshot>; showcase?: boolean; /** Extra room around the structure when framing (1 = tight). */ fit?: number; /** The part of the canvas (px, from its top-left) that plays the stage: framings are composed for it, and the canvas around it is extra room the molecule can grow into. */ frame?: () => Box | undefined };
type Box = { left: number; top: number; width: number; height: number };
// AlphaFold confidence bands. The theme reverses its scale, so the list runs high → low confidence.
const PLDDT_COLOR = { domain: [50, 100] as [number, number], list: { kind: 'interpolate' as const, colors: [Color(0x2F6BFF), Color(0x65CBF3), Color(0xFFDB13), Color(0xFF7D45)] } };
export type SiteGroup = { labels: readonly string[]; color: string };
export type ViewerController = Awaited<ReturnType<typeof buildViewer>>;
export type MeasurementLabel = { x: number; y: number; distance: string };
export function createViewer(...args: Parameters<typeof buildViewer>) { return inTurn(() => buildViewer(...args)); }
async function buildViewer(canvas: HTMLCanvasElement, container: HTMLDivElement, progress: (value: number) => void, message: (value: string) => void, labelsChanged: (labels: MeasurementLabel[]) => void, signal: AbortSignal, picked?: (label: string) => void, options?: ViewerOptions) {
  signal.throwIfAborted();
  // Start the download now so it overlaps with plugin and WebGL setup.
  const text = options ? preloadStructure(options.src) : undefined;
  const spec = DefaultPluginSpec();
  // A first measurement click must not move the second atom out from under the pointer.
  spec.behaviors = spec.behaviors.filter(behavior => behavior.transformer !== CameraFocusLoci);
  // Mol*'s click-to-focus draws the surrounding residues and contacts of the *whole* structure, so on a staged scene it
  // brings back the hidden chains (e.g. the de novo binders sitting on KN035's epitope) as a tangle of overlapping sticks.
  if (options?.showcase) spec.behaviors = spec.behaviors.filter(behavior => behavior.transformer !== RepresentationFocusLoci && behavior.transformer !== StructureFocusRepresentation);
  const plugin = new PluginContext(spec);
  const abort = () => plugin.dispose();
  signal.addEventListener('abort', abort, { once: true });
  try {
    await plugin.init(); signal.throwIfAborted();
    if (!plugin.initViewer(canvas, container)) throw new Error('WebGL unavailable');
    await plugin.canvas3dInitialized; signal.throwIfAborted(); progress(1);
    plugin.canvas3d!.setProps({ transparentBackground: true, camera: { helper: { axes: { name: 'on', params: { ...PD.getDefaultValues(CameraHelperParams).axes.params, scale: 0.25 } } } } });
    if (options?.showcase) {
      // Mol* clamps how far the camera may sit from the target using the bounding sphere of what is *visible*. The stages
      // hide chains while they build up, which collapsed that sphere and dragged the camera in close (the "way too zoomed"
      // views). Fixed limits keep framing independent of which chains are showing; the user can still zoom freely.
      plugin.canvas3d!.setProps({ trackball: { autoAdjustMinMaxDistance: { name: 'off', params: {} }, minDistance: 4, maxDistance: 2000 } });
      // Ambient occlusion + outline give the cartoon depth and a crisp silhouette on the transparent stage.
      const post = PD.getDefaultValues(PostprocessingParams);
      plugin.canvas3d!.setProps({ camera: { helper: { axes: { name: 'off', params: {} } } }, postprocessing: { ...post,
        occlusion: { name: 'on', params: { ...PD.getDefaultValues(SsaoParams), samples: isLite() ? 12 : 32, radius: 5, bias: 0.8 } },
        outline: { name: 'on', params: { ...PD.getDefaultValues(OutlineParams), scale: 0.8, threshold: 0.4, color: Color(0x0B0817) } } } });
    }
    if (options && (!options.src.startsWith('/demo/') || options.src.startsWith('//'))) throw new Error('Only same-origin static structures are allowed');
    const source = text ? await text : await (await fetch('/demo/5xh3.cif', { signal })).text();
    signal.throwIfAborted();
    const raw = await plugin.builders.data.rawData({ data: source, label: options?.label ?? '5XH3 · RCSB original' });
    signal.throwIfAborted(); progress(2);
    const trajectory = await plugin.builders.structure.parseTrajectory(raw, 'mmcif');
    const model = await plugin.builders.structure.createModel(trajectory);
    const structure = await plugin.builders.structure.createStructure(model, options ? { name: 'model', params: { dynamicBonds: false } } : undefined);
    const protein = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer');
    const ligand = await plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand');
    const water = await plugin.builders.structure.tryCreateComponentStatic(structure, 'water');
    const molecularColors = { color: 'element-symbol' as const, colorParams: { carbonColor: { name: 'uniform', params: { value: Color(0xAA612C) } }, colors: { name: 'custom', params: { ...ElementSymbolColors, O: Color(0xE33E31), S: Color(0xF2C343) } }, lightness: 0 } };
    let proteinRep = protein && await plugin.builders.structure.representation.addRepresentation(protein, { type: 'cartoon', color: 'uniform', colorParams: { value: Color(0x3E7A5E) } });
    const chainComponents: { component: NonNullable<Awaited<ReturnType<typeof plugin.builders.structure.tryCreateComponentFromExpression>>>; color: Color; auth: string }[] = [];
    let sitesRefs: string[] = [];
    const chainReps: Awaited<ReturnType<typeof plugin.builders.structure.representation.addRepresentation>>[] = [];
    if (options?.chains) {
      if (proteinRep) { await plugin.state.data.build().delete(proteinRep.ref).commit(); proteinRep = undefined; }
      for (const chain of options.chains) {
        const component = await plugin.builders.structure.tryCreateComponentFromExpression(structure, MS.struct.generator.atomGroups({ 'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain.auth]), 'entity-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.entityType(), 'polymer']) }), chain.auth);
        if (component) {
          const color = Color(parseInt(chain.color.slice(1), 16));
          chainComponents.push({ component, color, auth: chain.auth });
          chainReps.push(await plugin.builders.structure.representation.addRepresentation(component, { type: chain.type ?? 'cartoon', ...(chain.plddt ? { color: 'uncertainty' as const, colorParams: PLDDT_COLOR } : { color: 'uniform' as const, colorParams: { value: color } }), ...(chain.alpha !== undefined ? { typeParams: { alpha: chain.alpha } } : {}) }));
        }
      }
    }
    if (ligand && !options) await plugin.builders.structure.representation.addRepresentation(ligand, { type: 'ball-and-stick', ...molecularColors });
    if (water && !options) await plugin.builders.structure.representation.addRepresentation(water, { type: 'point', color: 'uniform', colorParams: { value: Color(0xE33E31) }, typeParams: { sizeFactor: 2, pointSizeAttenuation: false, pointStyle: 'circle' } });
    if (options?.startHidden) for (const item of chainComponents) setSubtreeVisibility(plugin.state.data, item.component.ref, true);
    // Per-chain cartoon opacity (alpha factor) for fades, and the running fade of each chain (calling it stops that fade).
    const alphas: number[] = [], fades = new Map<string, () => void>();
    const setAlpha = (i: number, alpha: number) => {
      if (alphas[i] === alpha) return;
      alphas[i] = alpha;
      const repr = chainReps[i]?.obj?.data.repr;
      if (!repr) return;
      repr.setState({ alphaFactor: alpha });
      // The scene caches whether anything is opaque / transparent: let it recompute, then draw.
      plugin.canvas3d?.update(repr, true);
      plugin.canvas3d?.requestDraw();
    };
    const visibleChain = (i: number) => !plugin.state.data.cells.get(chainComponents[i].component.ref)?.state.isHidden;
    signal.throwIfAborted(); progress(3);
    // Fixed camera for the original RCSB file; revise if a processed structure replaces it.
    // CA bounding-box center measured from the local CIF (not a platform camera API).
    const camera = { position: Vec3.create(30, 28, 57), target: Vec3.create(-9.22, -0.267, 4.21), up: Vec3.create(0, 1, 0), radius: 28 };
    plugin.canvas3d!.commit(true);
    plugin.canvas3d!.camera.setState(camera, 0);
    if (options) {
      const sphere = structure.obj!.data.boundary.sphere;
      plugin.canvas3d!.camera.setState(options.camera ?? plugin.canvas3d!.camera.getFocus(sphere.center, sphere.radius * (options.fit ?? 1)), 0);
    }
    const initialCamera = options ? plugin.canvas3d!.camera.getSnapshot() : camera;
    // The opening framing depends on the stage's aspect ratio, which changes with the device and the layout. While nobody has steered the
    // camera (touch, wheel, a residue focus), every resize frames the whole structure again, keeping the current viewing direction.
    // Showcase scenes and explicit cameras manage their own framing.
    let autoFit = !!options && !options.showcase && !options.camera;
    // The point rotation should turn about when a framing has moved the molecule off the stage centre (see the camera.update patch below); unset = turn about the camera target.
    let pivot: Vec3 | undefined;
    let fitTimer: ReturnType<typeof setTimeout> | undefined;
    const fitStructure = (ms = 0) => {
      if (!options || container.clientWidth < 40 || container.clientHeight < 40) return;
      plugin.canvas3d!.handleResize();
      const camera = plugin.canvas3d!.camera, sphere = structure.obj!.data.boundary.sphere, state = camera.state;
      const dir = Vec3.normalize(Vec3(), Vec3.sub(Vec3(), state.target, state.position));
      // getFocus fits the sphere to the vertical field of view only, so on a portrait stage the structure runs past the sides: back off by the aspect ratio.
      const { width, height } = camera.viewport, aspect = width > 0 && height > 0 ? width / height : 1;
      pivot = undefined;
      camera.setState(camera.getFocus(sphere.center, sphere.radius * (options.fit ?? 1) / Math.min(1, aspect), state.up, dir), ms);
    };
    const steer = () => { autoFit = false; };
    container.addEventListener('pointerdown', steer); container.addEventListener('wheel', steer, { passive: true });
    // The container's size, kept by the observer below: `project` runs every frame right after overlays move, and reading clientWidth there would force a layout each time.
    let boxW = container.clientWidth, boxH = container.clientHeight;
    const resize = new ResizeObserver(() => { boxW = container.clientWidth; boxH = container.clientHeight; plugin.canvas3d?.requestResize(); if (autoFit) { clearTimeout(fitTimer); fitTimer = setTimeout(() => { if (autoFit && !disposed) fitStructure(); }, 80); } }); resize.observe(container);
    if (autoFit) fitStructure();
    let measuring = false;
    let framing: { center: Vec3; distance: number } | undefined;
    // Camera distance of the last fixed framing: the reference the zoom limits are relative to.
    let framed = 0;
    let firstAtom: StructureElement.Loci | undefined;
    let interactionsRef: string | undefined;
    let residueSticksRef: string | undefined;
    let measurements: { center: Vec3; distance: string }[] = [], lastLabels = '';
    const redrawLabels = () => { const labels = measurements.map(item => { const projected = plugin.canvas3d!.camera.project(Vec4(), item.center); return { x: projected[0] * container.clientWidth / canvas.width, y: (canvas.height - projected[1]) * container.clientHeight / canvas.height, distance: item.distance }; }); const signature = JSON.stringify(labels); if (signature !== lastLabels) { lastLabels = signature; labelsChanged(labels); } };
    // Weak or struggling devices render at a lower resolution and drop ambient occlusion; capable ones are untouched.
    // Screens above 2× (phones at 3×) render at 2×: the difference is invisible there, the pixel count is 2.25× lower.
    const cap = Math.min(1, 2 / (window.devicePixelRatio || 1));
    const lighten = () => {
      plugin.canvas3dContext?.setProps({ pixelScale: 0.75 * cap });
      if (options?.showcase) plugin.canvas3d?.setProps({ postprocessing: { ...plugin.canvas3d.props.postprocessing, occlusion: { name: 'off', params: {} } } });
    };
    if (isLite() || cap < 1) plugin.canvas3dContext?.setProps({ pixelScale: (isLite() ? 0.85 : 1) * cap });
    const stopLite = onLite(lighten), watch = frameMonitor();
    const draw = plugin.canvas3d!.didDraw.subscribe(() => { watch(performance.now()); redrawLabels(); });
    const click = plugin.behaviors.interaction.click.subscribe(({ current }) => {
      if (!StructureElement.Loci.is(current.loci) || StructureElement.Loci.isEmpty(current.loci)) return;
      if (!measuring) {
        const location = StructureElement.Loci.getFirstLocation(current.loci);
        if (location) {
          const hierarchy = location.unit.model.atomicHierarchy;
          const residue = hierarchy.residueAtomSegments.index[location.element];
          const chain = hierarchy.chainAtomSegments.index[location.element];
          picked?.(`${hierarchy.chains.auth_asym_id.value(chain)}:${hierarchy.residues.auth_seq_id.value(residue)}`);
        }
        return;
      }
      const atom = StructureElement.Loci.firstElement(current.loci);
      if (!firstAtom) { firstAtom = atom; message('firstAtom'); } else {
        const a = Loci.getBoundingSphere(firstAtom)!.center, b = Loci.getBoundingSphere(atom)!.center;
        // Mol* owns the true-coordinate dashed measurement; its label is projected to an
        // 18px HTML overlay so it remains readable without changing size during zoom.
        void plugin.managers.structure.measurement.addDistance(firstAtom, atom, { visualParams: { visuals: ['lines'], unitLabel: 'Å', linesColor: Color(0xffffff), linesSize: 0.12 } }).then(() => { if (disposed) return; measurements.push({ center: Vec3.scale(Vec3(), Vec3.add(Vec3(), a, b), 0.5), distance: `${Vec3.distance(a, b).toFixed(2)} Å` }); redrawLabels(); }).catch(() => {});
        firstAtom = undefined; message('measure');
      }
    });
    const data = structure.obj!.data;
    let disposed = false, updating = Promise.resolve(), idleTick: ReturnType<typeof setInterval> | undefined;
    function enqueue(action: () => Promise<void>) { const next = updating.then(() => disposed ? undefined : action()); updating = next.catch(() => {}); return updating; }
    // Mol*'s own camera transition is linear in time. This one eases in and out and pulls the camera back a little on long moves
    // (a dolly arc), so a glide between two framings reads as one gesture. Touching the stage hands the camera back to the user.
    let tween = 0;
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const stopTween = () => { cancelAnimationFrame(tween); tween = 0; };
    container.addEventListener('pointerdown', stopTween); container.addEventListener('wheel', stopTween, { passive: true });
    function tweenTo(to: Partial<Camera.Snapshot>, ms: number) {
      stopTween();
      const cam = plugin.canvas3d!.camera;
      if (!ms || !to.position || !to.target) { cam.setState(to, 0); return; }
      const from = cam.getSnapshot(), tp = to.position, tt = to.target, tu = to.up ?? from.up;
      const d0 = Vec3.distance(from.position, from.target), d1 = Vec3.distance(tp, tt);
      const dir0 = Vec3.normalize(Vec3(), Vec3.sub(Vec3(), from.position, from.target)), dir1 = Vec3.normalize(Vec3(), Vec3.sub(Vec3(), tp, tt));
      const turn = Quat.rotationTo(Quat(), dir0, dir1);
      const bump = 0.14 * (Vec3.distance(from.target, tt) + Math.abs(d1 - d0));
      const r0 = from.radius, r1 = to.radius ?? r0, m0 = from.radiusMax, m1 = to.radiusMax ?? m0;
      const start = performance.now();
      const frame = (now: number) => {
        if (disposed) return;
        const t = Math.min(1, (now - start) / ms), e = ease(t);
        const target = Vec3.lerp(Vec3(), from.target, tt, e);
        const dir = Vec3.transformQuat(Vec3(), dir0, Quat.slerp(Quat(), Quat.Identity, turn, e));
        const dist = d0 + (d1 - d0) * e + bump * Math.sin(Math.PI * e);
        const up = Vec3.normalize(Vec3(), Vec3.lerp(Vec3(), from.up, tu, e));
        cam.setState({ position: Vec3.scaleAndAdd(Vec3(), target, dir, dist), target, up, radius: r0 + (r1 - r0) * e, radiusMax: m0 + (m1 - m0) * e }, 0);
        tween = t < 1 ? requestAnimationFrame(frame) : 0;
      };
      tween = requestAnimationFrame(frame);
    }
    // A framing that slides the molecule aside (`shift`, `into`, `frame`) aims the camera at an empty point, and the trackball turns about the aim, so the molecule would swing around
    // the stage centre. Each frame, a rotation the trackball applied is redone about the molecule instead: the same turn plus a sideways slide of the camera that keeps `pivot` still on screen.
    {
      const cam = plugin.canvas3d!.camera, update = cam.update.bind(cam);
      let last: { target: Vec3; dir: Vec3; up: Vec3 } | undefined;
      const read = () => ({ target: Vec3.clone(cam.target), dir: Vec3.normalize(Vec3(), Vec3.sub(Vec3(), cam.target, cam.position)), up: Vec3.clone(cam.up) });
      cam.update = () => {
        if (!pivot || tween) { last = undefined; return update(); }
        const now = read();
        if (last && Vec3.distance(last.target, now.target) < 1e-4) {
          const turn = Quat.rotationTo(Quat(), last.dir, now.dir);
          const rolled = Vec3.transformQuat(Vec3(), last.up, turn);
          const q = Quat.multiply(Quat(), Quat.rotationTo(Quat(), rolled, now.up), turn);
          // new target = pivot + R(target - pivot); the trackball left it at `target`, so slide by the difference.
          const arm = Vec3.sub(Vec3(), pivot, now.target), slide = Vec3.sub(Vec3(), arm, Vec3.transformQuat(Vec3(), arm, q));
          if (Vec3.magnitude(slide) > 1e-6) { Vec3.add(cam.position, cam.position, slide); Vec3.add(cam.target, cam.target, slide); }
        }
        last = read();
        return update();
      };
    }
    // Each lookup is a full MolScript query over the structure, and a framing can ask for every residue (~250) at once; the structure never changes, so each label is resolved once.
    const lociCache = new Map<string, StructureElement.Loci | undefined>(), sphereCache = new Map<string, ReturnType<typeof Loci.getBoundingSphere>>();
    function valid(label: string) {
      if (!lociCache.has(label)) { const loci = residueLoci(data, label); lociCache.set(label, loci && !StructureElement.Loci.isEmpty(loci) ? loci : undefined); }
      return lociCache.get(label);
    }
    function sphereOf(label: string) {
      if (!sphereCache.has(label)) { const loci = valid(label); sphereCache.set(label, loci && Loci.getBoundingSphere(loci)); }
      return sphereCache.get(label);
    }
    return {
      hasResidue(label: string) { return !!valid(label); },
      highlight(label: string | null) { const manager = plugin.managers.interactivity.lociHighlights; manager.clearHighlights(); if (label) { const loci = valid(label); if (loci) manager.highlightOnly({ loci }); } },
      highlightChain(chain: string | null) {
        const manager = plugin.managers.interactivity.lociHighlights;
        manager.clearHighlights();
        if (!chain) return;
        const loci = StructureSelection.toLociWithSourceUnits(Script.getStructureSelection(MS.struct.generator.atomGroups({ 'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain]) }), data));
        if (!StructureElement.Loci.isEmpty(loci)) manager.highlightOnly({ loci });
      },
      select(labels: string[]) { const manager = plugin.managers.interactivity.lociSelects; manager.deselectAll(); labels.forEach(label => { const loci = valid(label); if (loci) manager.select({ loci }); }); },
      focus(label: string) { const loci = valid(label); if (loci) { autoFit = false; pivot = undefined; plugin.managers.camera.focusLoci(loci, { durationMs: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300 }); message('selected'); } else message('missing'); },
      focusRegion(labels: string[], pad = 6, roll?: number, fixed = false, shift = 0, yaw = 0, ms = 500, into?: { left: number; top: number; width: number; height: number }, look?: { dir: readonly number[]; up: readonly number[] }) {
        autoFit = false; pivot = undefined;
        // The framing distance depends on the viewport's aspect ratio, so make sure the viewport is current first.
        plugin.canvas3d!.handleResize();
        // `fixed`: the view direction is the one the viewer opened with, and the distance is that of a landscape stage,
        // so the framing never depends on spin state, stage size or timing. The user can still zoom and rotate afterwards.
        const view = fixed ? initialCamera : plugin.canvas3d!.camera.state;
        const spheres = labels.map(sphereOf).filter((sphere): sphere is NonNullable<typeof sphere> => !!sphere);
        if (!spheres.length) return;
        const center = Vec3.create(0, 0, 0);
        spheres.forEach(sphere => Vec3.add(center, center, sphere.center));
        Vec3.scale(center, center, 1 / spheres.length);
        const radius = Math.max(10, ...spheres.map(sphere => Vec3.distance(center, sphere.center) + sphere.radius));
        const camera = plugin.canvas3d!.camera;
        // `roll` (degrees) turns the view about its axis relative to world-up, so an elongated assembly can lie across a wide stage.
        let up: Vec3 | undefined, dir: Vec3 | undefined;
        if (roll !== undefined) {
          dir = Vec3.normalize(Vec3(), Vec3.sub(Vec3(), view.target, view.position));
          const right = Vec3.normalize(Vec3(), Vec3.cross(Vec3(), dir, Vec3.create(0, 1, 0)));
          const base = Vec3.cross(Vec3(), right, dir), a = roll * Math.PI / 180;
          up = Vec3.add(Vec3(), Vec3.scale(Vec3(), base, Math.cos(a)), Vec3.scale(Vec3(), right, Math.sin(a)));
          // `yaw` (degrees) swings the view direction about `up`, so a stage can look at an assembly from the side instead of head-on.
          if (yaw) { const y = yaw * Math.PI / 180; dir = Vec3.normalize(Vec3(), Vec3.add(Vec3(), Vec3.scale(Vec3(), dir, Math.cos(y)), Vec3.scale(Vec3(), Vec3.cross(Vec3(), up, dir), Math.sin(y)))); }
        }
        // `look`: an explicit view (looking direction and up, in model coordinates) instead of the opening view turned by `roll` and `yaw`.
        if (look) { dir = Vec3.normalize(Vec3(), Vec3.create(look.dir[0], look.dir[1], look.dir[2])); up = Vec3.normalize(Vec3(), Vec3.create(look.up[0], look.up[1], look.up[2])); }
        // `shift`: slides the molecule left (positive) by that fraction of the framed extent, to leave room for an overlay on the right.
        if (shift) {
          pivot = Vec3.clone(center);
          const state = fixed ? initialCamera : camera.state, forward = dir ?? Vec3.normalize(Vec3(), Vec3.sub(Vec3(), state.target, state.position));
          Vec3.scaleAndAdd(center, center, Vec3.normalize(Vec3(), Vec3.cross(Vec3(), forward, up ?? state.up)), (radius + pad) * shift);
        }
        // `into`: a rectangle of the stage (px, from its top-left) the framed region must fit inside and be centred in, e.g. a viewport drawn by an overlay.
        // The region's real extent along the view's own right/up axes is measured, so the molecule fills the rectangle without crossing its edges at any stage size.
        const frame = options?.frame?.();
        if (fixed && into && frame) into = { ...into, left: into.left + frame.left, top: into.top + frame.top };
        if (fixed && into) {
          const stageW = container.clientWidth, stageH = container.clientHeight;
          if (stageW < 40 || stageH < 40 || into.width < 20 || into.height < 20) return;
          const forward = dir ?? Vec3.normalize(Vec3(), Vec3.sub(Vec3(), initialCamera.target, initialCamera.position)), top = up ?? initialCamera.up;
          const right = Vec3.normalize(Vec3(), Vec3.cross(Vec3(), forward, top)), lift = Vec3.normalize(Vec3(), Vec3.cross(Vec3(), right, forward));
          let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
          for (const sphere of spheres) {
            const x = Vec3.dot(sphere.center, right), y = Vec3.dot(sphere.center, lift);
            x0 = Math.min(x0, x - sphere.radius); x1 = Math.max(x1, x + sphere.radius); y0 = Math.min(y0, y - sphere.radius); y1 = Math.max(y1, y + sphere.radius);
          }
          // 0.9 leaves room for the depth the flat measurement ignores (nearer parts look larger under perspective).
          const width = x1 - x0 + 2 * pad, height = y1 - y0 + 2 * pad, scale = 0.9 * Math.min(into.width / width, into.height / height);
          const middle = Vec3.clone(center);
          pivot = middle;
          Vec3.scaleAndAdd(middle, middle, right, (x0 + x1) / 2 - Vec3.dot(center, right)); Vec3.scaleAndAdd(middle, middle, lift, (y0 + y1) / 2 - Vec3.dot(center, lift));
          // Looking at `middle` puts it mid-stage; look at a point offset the opposite way to move it to the rectangle's centre.
          const dx = into.left + into.width / 2 - stageW / 2, dy = into.top + into.height / 2 - stageH / 2;
          const aim = Vec3.clone(middle);
          Vec3.scaleAndAdd(aim, aim, right, -dx / scale); Vec3.scaleAndAdd(aim, aim, lift, dy / scale);
          // How far back the camera sits is measured, not assumed: take Mol*'s framing of a reference radius, then scale its distance so one world unit spans `scale` px
          // (perspective: px per unit = stage height / (2 · distance · tan(fov/2))).
          const probe = camera.getFocus(aim, radius, up, dir, initialCamera);
          const probed = Vec3.distance(probe.position!, probe.target!), wanted = stageH / (2 * scale * Math.tan(camera.state.fov / 2));
          framing = undefined;
          // getFocus may mirror `dir`/`up` to stay on the current camera's side (a coin toss when they are square to it), which would throw the molecule off to the
          // other side of the rectangle: the view is placed by hand so the offset above always lands where it was computed.
          const focus = camera.getFocus(aim, radius * wanted / probed, up, dir, initialCamera);
          if (dir && up && focus.position && focus.target) { focus.position = Vec3.scaleAndAdd(Vec3(), focus.target, dir, -Vec3.distance(focus.position, focus.target)); focus.up = up; }
          framed = Vec3.distance(focus.position!, focus.target!);
          tweenTo(focus, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms);
          return;
        }
        // A stage that is hidden or still being laid out would give a nonsense framing; the caller frames again once it has size.
        if (fixed && (container.clientWidth < 40 || container.clientHeight < 40)) return;
        if (fixed) { const { width, height } = frame ?? plugin.canvas3d!.camera.viewport, k = height < width ? 1 : width / height; framing = undefined;
          const focus = camera.getFocus(center, (radius + pad) * k * 0.78, up, dir, initialCamera);
          // getFocus keeps the new view on the same side as the current camera (it flips `dir`/`up` to match), so an explicit view is placed by hand.
          if (look && dir && up && focus.position && focus.target) { focus.position = Vec3.scaleAndAdd(Vec3(), focus.target, dir, -Vec3.distance(focus.position, focus.target)); focus.up = up; }
          // A frame inside a larger canvas: compose the view as if the canvas were the frame, then move it there. The distance keeps the molecule's size in px
          // (px per unit = canvas height / (2 · distance · tan(fov/2))), and the camera slides sideways so the target lands on the frame's centre.
          if (frame && focus.position && focus.target) {
            pivot = Vec3.clone(center);
            const W = container.clientWidth, H = container.clientHeight, half = Math.tan(camera.state.fov / 2);
            const distance = Camera.targetDistance((radius + pad) * k * 0.78, camera.state.mode, camera.state.fov, frame.width, frame.height) * H / frame.height;
            const forward = Vec3.normalize(Vec3(), Vec3.sub(Vec3(), focus.target, focus.position)), right = Vec3.normalize(Vec3(), Vec3.cross(Vec3(), forward, focus.up!)), lift = Vec3.cross(Vec3(), right, forward);
            const scale = H / (2 * distance * half), dx = frame.left + frame.width / 2 - W / 2, dy = frame.top + frame.height / 2 - H / 2;
            Vec3.scaleAndAdd(focus.target, focus.target, right, -dx / scale); Vec3.scaleAndAdd(focus.target, focus.target, lift, dy / scale);
            focus.position = Vec3.scaleAndAdd(Vec3(), focus.target, forward, -distance);
          }
          if (focus.position && focus.target) framed = Vec3.distance(focus.position, focus.target);
          tweenTo(focus, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms); return; }
        framing = { center, distance: radius + pad };
        if (container.clientWidth < 40 || container.clientHeight < 40) return; // hidden or collapsed: `refit` applies it once there is room
        camera.setState(camera.getFocus(center, radius + pad, up, dir), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500);
      },
      /** Re-fits the last framed region to the current viewport (keeps the current orientation); used when the stage is resized. */
      refit() {
        if (!framing || container.clientWidth < 40 || container.clientHeight < 40) return;
        plugin.canvas3d!.handleResize();
        const camera = plugin.canvas3d!.camera;
        camera.setState(camera.getFocus(framing.center, framing.distance), 0);
      },
      showResidueSticks(labels: readonly string[]) { return enqueue(async () => {
        if (residueSticksRef) { await plugin.state.data.build().delete(residueSticksRef).commit(); residueSticksRef = undefined; }
        if (!labels.length) return;
        const expressions = labels.map(label => {
          const match = /^([^:]+):(\d+)$/.exec(label);
          return match && MS.core.logic.and([
            MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), match[1]]),
            MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_seq_id(), Number(match[2])]),
          ]);
        }).filter((expr): expr is NonNullable<typeof expr> => !!expr);
        if (!expressions.length) return;
        const component = await plugin.builders.structure.tryCreateComponentFromExpression(structure, MS.struct.generator.atomGroups({ 'residue-test': MS.core.logic.or(expressions) }), 'Candidate sites');
        if (!component) return;
        residueSticksRef = component.ref;
        await plugin.builders.structure.representation.addRepresentation(component, { type: 'ball-and-stick', color: 'uniform', colorParams: { value: Color(0x94ea55) } });
      }); },
      /** Shows only the listed chains (all when omitted); used to stage the complex from target-only to full assembly. */
      showChains(auths?: readonly string[]) {
        chainComponents.forEach((item, i) => { fades.get(item.auth)?.(); setAlpha(i, 1); setSubtreeVisibility(plugin.state.data, item.component.ref, !!auths && !auths.includes(item.auth)); });
      },
      /**
       * Fades chains in (shown first, from transparent) or out (hidden once transparent) over `ms`, through the representation's alpha factor, so a
       * chain never pops. A new fade of the same chain takes over from wherever the last one was.
       */
      fadeChains(auths: readonly string[], show: boolean, ms: number) {
        return Promise.all(auths.map(auth => new Promise<void>(resolve => {
          const i = chainComponents.findIndex(item => item.auth === auth);
          if (i < 0) { resolve(); return; }
          fades.get(auth)?.();
          const ref = chainComponents[i].component.ref, from = show && !visibleChain(i) ? 0 : alphas[i] ?? 1, to = show ? 1 : 0;
          if (show) { setAlpha(i, from); setSubtreeVisibility(plugin.state.data, ref, false); }
          const start = performance.now();
          let raf = 0;
          const end = () => { cancelAnimationFrame(raf); fades.delete(auth); resolve(); };
          const tick = () => {
            if (disposed) { end(); return; }
            const t = ms > 0 ? Math.min(1, (performance.now() - start) / ms) : 1, k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
            setAlpha(i, from + (to - from) * k);
            if (t < 1) { raf = requestAnimationFrame(tick); return; }
            if (!show) { setSubtreeVisibility(plugin.state.data, ref, true); setAlpha(i, 1); }
            end();
          };
          fades.set(auth, end);
          tick();
        })));
      },
      /** Replaces the highlighted residue sticks with one coloured group per entry. */
      showSites(groups: readonly SiteGroup[]) { return enqueue(async () => {
        for (const ref of sitesRefs) await plugin.state.data.build().delete(ref).commit();
        sitesRefs = [];
        for (const group of groups) {
          const expressions = group.labels.map(label => {
            const match = /^([^:]+):(\d+)$/.exec(label);
            return match && MS.core.logic.and([
              MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), match[1]]),
              MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_seq_id(), Number(match[2])]),
            ]);
          }).filter((expr): expr is NonNullable<typeof expr> => !!expr);
          if (!expressions.length) continue;
          const component = await plugin.builders.structure.tryCreateComponentFromExpression(structure, MS.struct.generator.atomGroups({ 'residue-test': MS.core.logic.or(expressions) }), `Sites ${group.color}`);
          if (!component) continue;
          sitesRefs.push(component.ref);
          await plugin.builders.structure.representation.addRepresentation(component, { type: 'ball-and-stick', color: 'uniform', colorParams: { value: Color(parseInt(group.color.slice(1), 16)) }, typeParams: { sizeFactor: 0.28 } });
        }
      }); },
      /** Projects world-space points (flat x,y,z in Å) to stage pixels: out = x, y, relative distance from the camera (1 = at the target). */
      project(src: ArrayLike<number>, out: Float32Array) {
        const cam = plugin.canvas3d!.camera, v4 = Vec4(), p = Vec3();
        const sx = boxW / canvas.width, sy = boxH / canvas.height;
        const dist = Vec3.distance(cam.state.position, cam.state.target) || 1;
        for (let i = 0; i + 2 < src.length; i += 3) {
          Vec3.set(p, src[i], src[i + 1], src[i + 2]);
          cam.project(v4, p);
          out[i] = v4[0] * sx; out[i + 1] = (canvas.height - v4[1]) * sy; out[i + 2] = Vec3.distance(p, cam.state.position) / dist;
        }
      },
      /** Rotates the camera about the target (degrees): yaw about the up axis, pitch about the screen-right axis. Used for stills. */
      orbit(yawDeg: number, pitchDeg: number) {
        const cam = plugin.canvas3d!.camera, s0 = cam.getSnapshot(), rot = (v: Vec3, axis: Vec3, ang: number) => { const c = Math.cos(ang), n = Math.sin(ang), k = Vec3.normalize(Vec3(), axis); return Vec3.add(Vec3(), Vec3.add(Vec3(), Vec3.scale(Vec3(), v, c), Vec3.scale(Vec3(), Vec3.cross(Vec3(), k, v), n)), Vec3.scale(Vec3(), k, Vec3.dot(k, v) * (1 - c))); };
        let off = Vec3.sub(Vec3(), s0.position, s0.target), up = Vec3.clone(s0.up);
        off = rot(off, up, yawDeg * Math.PI / 180);
        const right = Vec3.cross(Vec3(), up, off); off = rot(off, right, pitchDeg * Math.PI / 180); up = rot(up, right, pitchDeg * Math.PI / 180);
        cam.setState({ position: Vec3.add(Vec3(), s0.target, off), up }, 0);
      },
      /** Pass-through for canvas props (lighting, post-processing) when rendering stills. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      canvasProps(props: any) { plugin.canvas3d!.setProps(props); },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      currentProps() { return plugin.canvas3d!.props as any; },
      /** PNG data URI of the current view at an explicit size, transparent background (offline rendering of help-center art). */
      async screenshot(width: number, height: number) {
        const helper = plugin.helpers.viewportScreenshot!;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (helper.behaviors as any).values.next({ ...helper.values, resolution: { name: 'custom', params: { width, height } }, transparent: true, axes: { name: 'off', params: {} } });
        return helper.getImageDataUri();
      },
      spin(enabled: boolean) { plugin.canvas3d?.setProps({ trackball: { animate: enabled ? { name: 'spin', params: { speed: 0.3 } } : { name: 'off', params: {} } } }); },
      snapshot() { return plugin.canvas3d!.camera.getSnapshot(); },
      // Off screen the plugin's per-frame loop stops (pausing only the canvas left it ticking every frame for nothing). A slow tick without drawing keeps
      // committing scene changes in the background, so a stage built while off screen is ready when it scrolls in; back on screen the loop restarts and redraws.
      active(enabled: boolean) {
        if (disposed) return;
        clearInterval(idleTick); idleTick = undefined;
        if (enabled) { if (!plugin.animationLoop.isAnimating) plugin.animationLoop.start(); else plugin.canvas3d?.resume(); return; }
        plugin.animationLoop.stop({ noDraw: true });
        idleTick = setInterval(() => { if (!disposed) plugin.canvas3d?.tick(now(), { manualDraw: true }); }, 200);
      },
      restore(snapshot: Camera.Snapshot) { autoFit = false; pivot = undefined; plugin.canvas3d!.camera.setState(snapshot, 0); },
      reset() {
        const ms = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250;
        // Re-frame for the stage as it is now; the snapshot from loading may predate the final layout.
        pivot = undefined;
        if (options && !options.showcase && !options.camera) { autoFit = true; fitStructure(ms); } else plugin.canvas3d?.camera.setState(initialCamera, ms);
      },
      /** Dollies by `factor` (< 1 = closer), kept between `closest` and `farthest` times the distance of the last fixed framing. With `at` (canvas px) the point under it stays put, as with a pinch. */
      zoomBy(factor: number, closest: number, farthest: number, ms = 0, at?: { x: number; y: number }) {
        stopTween(); autoFit = false;
        const c = plugin.canvas3d!.camera, { position, target, up } = c.state, now = Vec3.distance(position, target), base = framed || now;
        const next = Math.min(base * farthest, Math.max(base * closest, now * factor)), f = next / now;
        if (Math.abs(next - now) < 1e-3) return;
        const anchor = Vec3.clone(target);
        if (at) {
          // The world point under `at` on the target's plane (the target is mid-canvas; px per unit = canvas height / (2 · distance · tan(fov/2))).
          const forward = Vec3.normalize(Vec3(), Vec3.sub(Vec3(), target, position)), right = Vec3.normalize(Vec3(), Vec3.cross(Vec3(), forward, up)), lift = Vec3.cross(Vec3(), right, forward);
          const scale = container.clientHeight / (2 * now * Math.tan(c.state.fov / 2));
          Vec3.scaleAndAdd(anchor, anchor, right, (at.x - container.clientWidth / 2) / scale); Vec3.scaleAndAdd(anchor, anchor, lift, -(at.y - container.clientHeight / 2) / scale);
        }
        const nextTarget = Vec3.add(Vec3(), anchor, Vec3.scale(Vec3(), Vec3.sub(Vec3(), target, anchor), f));
        c.setState({ target: nextTarget, position: Vec3.scaleAndAdd(Vec3(), nextTarget, Vec3.sub(Vec3(), position, target), f) }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms);
      },
      zoom(factor: number) { const c = plugin.canvas3d!.camera; c.setState({ position: Vec3.scaleAndAdd(Vec3(), c.state.target, Vec3.sub(Vec3(), c.state.position, c.state.target), factor) }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150); },
      representation(type: 'cartoon' | 'molecular-surface' | 'ball-and-stick') { return enqueue(async () => {
        if (options?.chains) {
          for (const rep of chainReps) await plugin.state.data.build().delete(rep.ref).commit();
          chainReps.length = 0;
          for (const { component, color } of chainComponents) chainReps.push(await plugin.builders.structure.representation.addRepresentation(component, { type: plugin.representation.structure.registry.get(type), color: plugin.representation.structure.themes.colorThemeRegistry.get('uniform'), colorParams: { value: color } }));
          return;
        }
        if (!protein) return; if (proteinRep) await plugin.state.data.build().delete(proteinRep.ref).commit(); proteinRep = await plugin.builders.structure.representation.addRepresentation(protein, { type: plugin.representation.structure.registry.get(type), color: plugin.representation.structure.themes.colorThemeRegistry.get('uniform'), colorParams: { value: Color(0x3E7A5E) } });
      }); },
      interactions(show: boolean) { return enqueue(async () => { if (interactionsRef) { await plugin.state.data.build().delete(interactionsRef).commit(); interactionsRef = undefined; } if (show) { const rep = await plugin.builders.structure.representation.addRepresentation(structure, { type: plugin.representation.structure.registry.get('interactions'), color: plugin.representation.structure.themes.colorThemeRegistry.get('interaction-type') }); interactionsRef = rep.ref; } }); },
      measure(enabled: boolean) { measuring = enabled; firstAtom = undefined; plugin.managers.interactivity.setProps({ granularity: enabled ? 'element' : 'residue' }); message(enabled ? 'measure' : 'ready'); },
      async clear() { const refs = plugin.managers.structure.measurement.state.distances.map(cell => cell.transform.ref); for (const ref of refs) await plugin.state.data.build().delete(ref).commit(); firstAtom = undefined; measurements = []; redrawLabels(); },
      dispose() { disposed = true; clearTimeout(fitTimer); clearInterval(idleTick); container.removeEventListener('pointerdown', steer); container.removeEventListener('wheel', steer); stopTween(); container.removeEventListener('pointerdown', stopTween); container.removeEventListener('wheel', stopTween); stopLite(); resize.disconnect(); click.unsubscribe(); draw.unsubscribe(); signal.removeEventListener('abort', abort); plugin.dispose(); },
    };
  } catch (error) { signal.removeEventListener('abort', abort); if (!signal.aborted) plugin.dispose(); throw error; }
}
