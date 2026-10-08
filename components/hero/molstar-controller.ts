import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Color } from 'molstar/lib/mol-util/color';
import { Vec3, Vec4 } from 'molstar/lib/mol-math/linear-algebra';
import { Loci } from 'molstar/lib/mol-model/loci';
import { StructureElement, StructureSelection } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';
import { ElementSymbolColors } from 'molstar/lib/mol-theme/color/element-symbol';
import { residueLoci } from './molstar-selection';
import { CameraHelperParams } from 'molstar/lib/mol-canvas3d/helper/camera-helper';
import { ParamDefinition as PD } from 'molstar/lib/mol-util/param-definition';
import { FocusLoci as CameraFocusLoci } from 'molstar/lib/mol-plugin/behavior/dynamic/camera';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import type { Camera } from 'molstar/lib/mol-canvas3d/camera';
export type ViewerOptions = { src: string; label: string; chains?: { auth: string; color: string }[]; camera?: Partial<Camera.Snapshot> };
export type ViewerController = Awaited<ReturnType<typeof createViewer>>;
export type MeasurementLabel = { x: number; y: number; distance: string };
export async function createViewer(canvas: HTMLCanvasElement, container: HTMLDivElement, progress: (value: number) => void, message: (value: string) => void, labelsChanged: (labels: MeasurementLabel[]) => void, signal: AbortSignal, picked?: (label: string) => void, options?: ViewerOptions) {
  const spec = DefaultPluginSpec();
  // A first measurement click must not move the second atom out from under the pointer.
  spec.behaviors = spec.behaviors.filter(behavior => behavior.transformer !== CameraFocusLoci);
  const plugin = new PluginContext(spec);
  const abort = () => plugin.dispose();
  signal.addEventListener('abort', abort, { once: true });
  try {
    await plugin.init(); signal.throwIfAborted();
    if (!plugin.initViewer(canvas, container)) throw new Error('WebGL unavailable');
    await plugin.canvas3dInitialized; signal.throwIfAborted(); progress(1);
    plugin.canvas3d!.setProps({ transparentBackground: true, camera: { helper: { axes: { name: 'on', params: { ...PD.getDefaultValues(CameraHelperParams).axes.params, scale: 0.25 } } } } });
    if (options && (!options.src.startsWith('/demo/') || options.src.startsWith('//'))) throw new Error('Only same-origin static structures are allowed');
    const response = options ? await fetch(options.src, { signal }) : await fetch('/demo/5xh3.cif', { signal });
    if (!response.ok) throw new Error(`5XH3: HTTP ${response.status}`);
    const raw = await plugin.builders.data.rawData({ data: await response.text(), label: options?.label ?? '5XH3 · RCSB original' });
    signal.throwIfAborted(); progress(2);
    const trajectory = await plugin.builders.structure.parseTrajectory(raw, 'mmcif');
    const model = await plugin.builders.structure.createModel(trajectory);
    const structure = await plugin.builders.structure.createStructure(model, options ? { name: 'model', params: { dynamicBonds: false } } : undefined);
    const protein = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer');
    const ligand = await plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand');
    const water = await plugin.builders.structure.tryCreateComponentStatic(structure, 'water');
    const molecularColors = { color: 'element-symbol' as const, colorParams: { carbonColor: { name: 'uniform', params: { value: Color(0xAA612C) } }, colors: { name: 'custom', params: { ...ElementSymbolColors, O: Color(0xE33E31), S: Color(0xF2C343) } }, lightness: 0 } };
    let proteinRep = protein && await plugin.builders.structure.representation.addRepresentation(protein, { type: 'cartoon', color: 'uniform', colorParams: { value: Color(0x3E7A5E) } });
    const chainComponents: { component: NonNullable<Awaited<ReturnType<typeof plugin.builders.structure.tryCreateComponentFromExpression>>>; color: Color }[] = [];
    const chainReps: Awaited<ReturnType<typeof plugin.builders.structure.representation.addRepresentation>>[] = [];
    if (options?.chains) {
      if (proteinRep) { await plugin.state.data.build().delete(proteinRep.ref).commit(); proteinRep = undefined; }
      for (const chain of options.chains) {
        const component = await plugin.builders.structure.tryCreateComponentFromExpression(structure, MS.struct.generator.atomGroups({ 'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain.auth]), 'entity-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.entityType(), 'polymer']) }), chain.auth);
        if (component) {
          const color = Color(parseInt(chain.color.slice(1), 16));
          chainComponents.push({ component, color });
          chainReps.push(await plugin.builders.structure.representation.addRepresentation(component, { type: 'cartoon', color: 'uniform', colorParams: { value: color } }));
        }
      }
    }
    if (ligand && !options) await plugin.builders.structure.representation.addRepresentation(ligand, { type: 'ball-and-stick', ...molecularColors });
    if (water && !options) await plugin.builders.structure.representation.addRepresentation(water, { type: 'point', color: 'uniform', colorParams: { value: Color(0xE33E31) }, typeParams: { sizeFactor: 2, pointSizeAttenuation: false, pointStyle: 'circle' } });
    signal.throwIfAborted(); progress(3);
    // Fixed camera for the original RCSB file; revise if a processed structure replaces it.
    // CA bounding-box center measured from the local CIF (not a platform camera API).
    const camera = { position: Vec3.create(30, 28, 57), target: Vec3.create(-9.22, -0.267, 4.21), up: Vec3.create(0, 1, 0), radius: 28 };
    plugin.canvas3d!.commit(true);
    plugin.canvas3d!.camera.setState(camera, 0);
    if (options) {
      const sphere = structure.obj!.data.boundary.sphere;
      plugin.canvas3d!.camera.setState(options.camera ?? plugin.canvas3d!.camera.getFocus(sphere.center, sphere.radius), 0);
    }
    const initialCamera = options ? plugin.canvas3d!.camera.getSnapshot() : camera;
    const resize = new ResizeObserver(() => plugin.canvas3d?.requestResize()); resize.observe(container);
    let measuring = false;
    let firstAtom: StructureElement.Loci | undefined;
    let interactionsRef: string | undefined;
    let residueSticksRef: string | undefined;
    let measurements: { center: Vec3; distance: string }[] = [], lastLabels = '';
    const redrawLabels = () => { const labels = measurements.map(item => { const projected = plugin.canvas3d!.camera.project(Vec4(), item.center); return { x: projected[0] * container.clientWidth / canvas.width, y: (canvas.height - projected[1]) * container.clientHeight / canvas.height, distance: item.distance }; }); const signature = JSON.stringify(labels); if (signature !== lastLabels) { lastLabels = signature; labelsChanged(labels); } };
    const draw = plugin.canvas3d!.didDraw.subscribe(redrawLabels);
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
    let disposed = false, updating = Promise.resolve();
    function enqueue(action: () => Promise<void>) { const next = updating.then(() => disposed ? undefined : action()); updating = next.catch(() => {}); return updating; }
    function valid(label: string) { const loci = residueLoci(data, label); return loci && !StructureElement.Loci.isEmpty(loci) ? loci : undefined; }
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
      focus(label: string) { const loci = valid(label); if (loci) { plugin.managers.camera.focusLoci(loci, { durationMs: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300 }); message('selected'); } else message('missing'); },
      focusRegion(labels: string[]) {
        const spheres = labels.map(label => valid(label)).filter((loci): loci is StructureElement.Loci => !!loci).map(loci => Loci.getBoundingSphere(loci)).filter((sphere): sphere is NonNullable<typeof sphere> => !!sphere);
        if (!spheres.length) return;
        const center = Vec3.create(0, 0, 0);
        spheres.forEach(sphere => Vec3.add(center, center, sphere.center));
        Vec3.scale(center, center, 1 / spheres.length);
        const radius = Math.max(10, ...spheres.map(sphere => Vec3.distance(center, sphere.center) + sphere.radius));
        plugin.canvas3d!.camera.setState(plugin.canvas3d!.camera.getFocus(center, radius + 6), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500);
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
      spin(enabled: boolean) { plugin.canvas3d?.setProps({ trackball: { animate: enabled ? { name: 'spin', params: { speed: 0.3 } } : { name: 'off', params: {} } } }); },
      snapshot() { return plugin.canvas3d!.camera.getSnapshot(); },
      active(enabled: boolean) { if (enabled) plugin.canvas3d?.resume(); else plugin.canvas3d?.pause(true); },
      restore(snapshot: Camera.Snapshot) { plugin.canvas3d!.camera.setState(snapshot, 0); },
      reset() { plugin.canvas3d?.camera.setState(initialCamera, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250); },
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
      dispose() { disposed = true; resize.disconnect(); click.unsubscribe(); draw.unsubscribe(); signal.removeEventListener('abort', abort); plugin.dispose(); },
    };
  } catch (error) { signal.removeEventListener('abort', abort); if (!signal.aborted) plugin.dispose(); throw error; }
}
