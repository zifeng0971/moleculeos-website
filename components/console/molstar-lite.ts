import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { Color } from 'molstar/lib/mol-util/color';
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra';
import { OrderedSet } from 'molstar/lib/mol-data/int';
import { Loci } from 'molstar/lib/mol-model/loci';
import { StructureElement, StructureSelection } from 'molstar/lib/mol-model/structure';
import { Script } from 'molstar/lib/mol-script/script';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { ElementSymbolColors } from 'molstar/lib/mol-theme/color/element-symbol';
import { getProteinOneLetterCode } from 'molstar/lib/mol-model/sequence/constants';
import { setSubtreeVisibility } from 'molstar/lib/mol-plugin/behavior/static/state';
import { FocusLoci } from 'molstar/lib/mol-plugin/behavior/dynamic/camera';
import { clearStructureOverpaint, setStructureOverpaint } from 'molstar/lib/mol-plugin-state/helpers/structure-overpaint';

/** A small, console-only wrapper around Mol*: chains as toggleable components, residue picking by "chain:seq" labels. */
export type Rep = 'cartoon' | 'sticks' | 'surface';
export type Residue = { seq: number; code: string; name: string };
export type ChainInfo = { auth: string; entity: string; residues: Residue[] };
export type LigandInfo = { chain: string; seq: number; name: string };
export type ViewerHooks = {
  onPick: (label: string | null, additive: boolean) => void;
  onHover: (label: string | null) => void;
  onProgress?: (message: string) => void;
};
export type Viewer = Awaited<ReturnType<typeof createViewer>>;

const PALETTE = ['#7c8cff', '#f4a340', '#ff6fae', '#37c8a0', '#5bc0ff', '#c58bff', '#e8d25b', '#ff8a5b'];

const REPS: Record<Rep, { type: string; params?: Record<string, unknown> }> = {
  cartoon: { type: 'cartoon' },
  sticks: { type: 'ball-and-stick', params: { sizeFactor: 0.18 } },
  surface: { type: 'gaussian-surface', params: { alpha: 0.82 } },
};

const parseLabel = (label: string) => { const [chain, seq] = label.split(':'); return { chain, seq: Number(seq) }; };

function residueTest(labels: string[]) {
  const tests = labels.map(label => {
    const { chain, seq } = parseLabel(label);
    return MS.core.logic.and([
      MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain]),
      MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_seq_id(), seq]),
    ]);
  });
  return tests.length === 1 ? tests[0] : MS.core.logic.or(tests);
}

/** Collapse "chain:seq" labels into contiguous runs so large paints stay one cheap query. */
function runs(labels: string[]) {
  const out: { chain: string; from: number; to: number }[] = [];
  const sorted = labels.map(parseLabel).sort((a, b) => a.chain.localeCompare(b.chain) || a.seq - b.seq);
  for (const { chain, seq } of sorted) {
    const last = out[out.length - 1];
    if (last && last.chain === chain && seq <= last.to + 1) last.to = Math.max(last.to, seq);
    else out.push({ chain, from: seq, to: seq });
  }
  return out;
}

function lociLabels(loci: StructureElement.Loci) {
  const out: { label: string; name: string }[] = [], seen = new Set<string>();
  for (const element of loci.elements) {
    const hierarchy = element.unit.model.atomicHierarchy;
    OrderedSet.forEach(element.indices, index => {
      const atom = element.unit.elements[index];
      const residue = hierarchy.residueAtomSegments.index[atom];
      const chain = hierarchy.chainAtomSegments.index[atom];
      const name = hierarchy.atoms.label_comp_id.value(atom);
      if (name === 'HOH') return;
      const label = `${hierarchy.chains.auth_asym_id.value(chain)}:${hierarchy.residues.auth_seq_id.value(residue)}`;
      if (!seen.has(label)) { seen.add(label); out.push({ label, name }); }
    });
  }
  return out;
}

export async function createViewer(canvas: HTMLCanvasElement, container: HTMLDivElement, src: string, format: 'mmcif' | 'pdb', colors: Record<string, string>, hooks: ViewerHooks, signal: AbortSignal) {
  const spec = DefaultPluginSpec();
  // We own picking and camera moves; Mol*'s click-to-focus would fight the sequence strip.
  spec.behaviors = spec.behaviors.filter(behavior => behavior.transformer !== FocusLoci);
  const plugin = new PluginContext(spec);
  signal.addEventListener('abort', () => plugin.dispose(), { once: true });
  await plugin.init(); signal.throwIfAborted();
  if (!plugin.initViewer(canvas, container)) throw new Error('WebGL unavailable');
  await plugin.canvas3dInitialized; signal.throwIfAborted();
  plugin.canvas3d!.setProps({ transparentBackground: true, camera: { helper: { axes: { name: 'off', params: {} } } } });

  hooks.onProgress?.('Fetching structure');
  const text = await (await fetch(src, { signal })).text();
  signal.throwIfAborted();
  const raw = await plugin.builders.data.rawData({ data: text, label: src });
  const trajectory = await plugin.builders.structure.parseTrajectory(raw, format);
  const model = await plugin.builders.structure.createModel(trajectory);
  const structure = await plugin.builders.structure.createStructure(model);
  const data = structure.obj!.data;

  // --- hierarchy -> chains / sequences / ligands ------------------------------------------------------------------
  const hierarchy = data.model.atomicHierarchy;
  const chains = new Map<string, ChainInfo>();
  const ligands: LigandInfo[] = [];
  for (let r = 0; r < hierarchy.residues._rowCount; r++) {
    const first = hierarchy.residueAtomSegments.offsets[r];
    const chainIndex = hierarchy.chainAtomSegments.index[first];
    const auth = hierarchy.chains.auth_asym_id.value(chainIndex);
    const name = hierarchy.atoms.label_comp_id.value(first);
    const seq = hierarchy.residues.auth_seq_id.value(r);
    if (hierarchy.derived.residue.moleculeType[r] === 5 /* MoleculeType.Protein */) {
      let info = chains.get(auth);
      if (!info) {
        let entity = '';
        try {
          const entities = data.model.entities;
          entity = entities.data.pdbx_description.value(entities.getEntityIndex(hierarchy.chains.label_entity_id.value(chainIndex))).join(', ');
        } catch { /* optional */ }
        info = { auth, entity, residues: [] }; chains.set(auth, info);
      }
      info.residues.push({ seq, code: getProteinOneLetterCode(name), name });
    } else if (name !== 'HOH') ligands.push({ chain: auth, seq, name });
  }

  // --- components & representations ------------------------------------------------------------------------------
  type Part = { component: { ref: string }; rep?: { ref: string } };
  const parts = new Map<string, Part>();
  let rep: Rep = 'cartoon';
  const hidden = new Set<string>();
  const resolved: Record<string, string> = { ...colors };
  let slot = 0;
  for (const auth of chains.keys()) resolved[auth] ??= PALETTE[slot++ % PALETTE.length];
  const color = (auth: string) => Color(parseInt(resolved[auth].slice(1), 16));
  const addRep = (auth: string, part: Part) => plugin.builders.structure.representation.addRepresentation(part.component as never, {
    type: REPS[rep].type as 'cartoon', color: 'uniform', colorParams: { value: color(auth) }, typeParams: REPS[rep].params as never,
  });
  for (const auth of chains.keys()) {
    const component = await plugin.builders.structure.tryCreateComponentFromExpression(structure,
      MS.struct.generator.atomGroups({ 'chain-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), auth]), 'entity-test': MS.core.rel.eq([MS.struct.atomProperty.macromolecular.entityType(), 'polymer']) }), `chain-${auth}`);
    if (!component) continue;
    const part: Part = { component };
    part.rep = await addRep(auth, part);
    parts.set(auth, part);
  }
  const ligand = await plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand');
  const elementColors = { color: 'element-symbol' as const, colorParams: { carbonColor: { name: 'uniform' as const, params: { value: Color(0xe0a458) } }, colors: { name: 'custom' as const, params: { ...ElementSymbolColors, O: Color(0xff5d5d), S: Color(0xf2c343) } }, lightness: 0 } };
  if (ligand) await plugin.builders.structure.representation.addRepresentation(ligand, { type: 'ball-and-stick', ...elementColors });
  signal.throwIfAborted();
  plugin.canvas3d!.commit(true);
  plugin.managers.camera.reset(undefined, 0);

  const ro = new ResizeObserver(() => plugin.canvas3d?.requestResize());
  ro.observe(container);

  // --- selection / hover ----------------------------------------------------------------------------------------
  const toLoci = (labels: string[]) => {
    const query = MS.struct.generator.atomGroups({ 'residue-test': residueTest(labels) });
    return StructureSelection.toLociWithSourceUnits(Script.getStructureSelection(query, data));
  };
  const labelOf = (loci: StructureElement.Loci) => { const first = lociLabels(loci)[0]; return first?.label ?? null; };
  const clickSub = plugin.behaviors.interaction.click.subscribe(({ current, modifiers }) => {
    if (!StructureElement.Loci.is(current.loci) || StructureElement.Loci.isEmpty(current.loci)) { hooks.onPick(null, false); return; }
    hooks.onPick(labelOf(current.loci), modifiers.shift || modifiers.control || modifiers.meta);
  });
  const hoverSub = plugin.behaviors.interaction.hover.subscribe(({ current }) => {
    hooks.onHover(StructureElement.Loci.is(current.loci) && !StructureElement.Loci.isEmpty(current.loci) ? labelOf(current.loci) : null);
  });

  let neighborRefs: string[] = [];
  let measureRefs: string[] = [];
  const drop = async (refs: string[]) => { if (!refs.length) return; const b = plugin.state.data.build(); refs.forEach(ref => b.delete(ref)); await b.commit(); };

  return {
    chains: [...chains.values()],
    ligands,
    colors: resolved,
    setRep: async (next: Rep) => {
      if (next === rep) return;
      rep = next;
      for (const [auth, part] of parts) {
        const b = plugin.state.data.build();
        if (part.rep) b.delete(part.rep.ref);
        await b.commit();
        part.rep = await addRep(auth, part);
        // A fresh representation is visible by default; keep hidden chains hidden.
        if (hidden.has(auth)) setSubtreeVisibility(plugin.state.data, part.component.ref, true);
      }
    },
    setChainVisible: (auth: string, visible: boolean) => {
      if (visible) hidden.delete(auth); else hidden.add(auth);
      const part = parts.get(auth); if (part) setSubtreeVisibility(plugin.state.data, part.component.ref, !visible);
    },
    select: (labels: string[]) => {
      const manager = plugin.managers.interactivity.lociSelects;
      manager.deselectAll();
      for (const label of labels) manager.select({ loci: toLoci([label]) });
    },
    highlight: (labels: string[] | null) => {
      const manager = plugin.managers.interactivity.lociHighlights;
      manager.clearHighlights();
      if (labels?.length) manager.highlightOnly({ loci: toLoci(labels) });
    },
    focus: (labels: string[]) => { const loci = toLoci(labels); if (!StructureElement.Loci.isEmpty(loci)) plugin.managers.camera.focusLoci(loci, { durationMs: 350 }); },
    /** Frame the chains that are currently visible (hidden ones would otherwise skew the bounding sphere). */
    reset: () => {
      const visible = [...parts.keys()].filter(auth => !hidden.has(auth));
      if (!visible.length) { plugin.managers.camera.reset(undefined, 350); return; }
      const chainTest = MS.core.logic.or(visible.map(auth => MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), auth])));
      const loci = StructureSelection.toLociWithSourceUnits(Script.getStructureSelection(MS.struct.generator.atomGroups({ 'chain-test': chainTest }), data));
      plugin.managers.camera.focusLoci(loci, { durationMs: 350, extraRadius: 2 });
    },
    zoom: (factor: number) => {
      const camera = plugin.canvas3d!.camera, s = camera.getSnapshot();
      const position = Vec3.scaleAndAdd(Vec3(), s.target, Vec3.sub(Vec3(), s.position, s.target), factor);
      camera.setState({ position, radius: s.radius * factor }, 200);
    },
    /** Residues within `radius` Å of the labels, drawn as sticks. Returns the neighbours (without the seed residues). */
    neighbors: async (labels: string[], radius: number) => {
      await drop(neighborRefs); neighborRefs = [];
      if (!labels.length) return [];
      const seed = MS.struct.generator.atomGroups({ 'residue-test': residueTest(labels) });
      const expr = MS.struct.modifier.union([MS.struct.modifier.includeSurroundings({ 0: seed, radius, 'as-whole-residues': true })]);
      const component = await plugin.builders.structure.tryCreateComponentFromExpression(structure, expr, 'neighbors');
      if (component) {
        neighborRefs = [component.ref];
        await plugin.builders.structure.representation.addRepresentation(component, { type: 'ball-and-stick', typeParams: { sizeFactor: 0.14 }, ...elementColors });
      }
      const found = lociLabels(StructureSelection.toLociWithSourceUnits(Script.getStructureSelection(expr, data)));
      const own = new Set(labels);
      return found.filter(item => !own.has(item.label));
    },
    clearNeighbors: async () => { await drop(neighborRefs); neighborRefs = []; },
    measure: async (a: string, b: string) => {
      const la = toLoci([a]), lb = toLoci([b]);
      const ca = Loci.getBoundingSphere(la)!.center, cb = Loci.getBoundingSphere(lb)!.center;
      const result = await plugin.managers.structure.measurement.addDistance(la, lb, { visualParams: { unitLabel: 'Å' } });
      if (result) measureRefs.push(result.selection.ref);
      return Vec3.distance(ca, cb);
    },
    clearMeasurements: async () => { await drop(measureRefs); measureRefs = []; },
    /** Overpaint residue groups on top of the chain colours (null clears). Used by the studio's colour lenses. */
    paint: async (groups: { color: string; labels?: string[]; chains?: string[] }[] | null) => {
      const components = plugin.managers.structure.hierarchy.current.structures[0]?.components ?? [];
      await clearStructureOverpaint(plugin, components);
      for (const group of groups ?? []) {
        const tests = [
          ...(group.chains ?? []).map(chain => MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain])),
          ...runs(group.labels ?? []).map(({ chain, from, to }) => MS.core.logic.and([
            MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), chain]),
            MS.core.rel.inRange([MS.struct.atomProperty.macromolecular.auth_seq_id(), from, to]),
          ])),
        ];
        if (!tests.length) continue;
        const query = MS.struct.generator.atomGroups({ 'residue-test': tests.length === 1 ? tests[0] : MS.core.logic.or(tests) });
        await setStructureOverpaint(plugin, components, Color(parseInt(group.color.slice(1), 16)),
          async s => StructureSelection.toLociWithSourceUnits(Script.getStructureSelection(query, s)));
      }
    },
    dispose: () => { clickSub.unsubscribe(); hoverSub.unsubscribe(); ro.disconnect(); plugin.dispose(); },
  };
}
