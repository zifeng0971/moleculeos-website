import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';
import { Script } from 'molstar/lib/mol-script/script';
import { Structure, StructureSelection } from 'molstar/lib/mol-model/structure';
// Author numbering is authoritative. Do not silently renumber a mismatched annotation.
export function residueLoci(structure: Structure, label: string) {
  const match = /^([^:]+):([A-Z]{3})?(\d+)$/.exec(label);
  if (!match) return undefined;
  const tests = [MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_asym_id(), match[1]]), MS.core.rel.eq([MS.struct.atomProperty.macromolecular.auth_seq_id(), Number(match[3])])];
  if (match[2]) tests.push(MS.core.rel.eq([MS.struct.atomProperty.macromolecular.label_comp_id(), match[2]]));
  return StructureSelection.toLociWithSourceUnits(Script.getStructureSelection(MS.struct.generator.atomGroups({ 'residue-test': MS.core.logic.and(tests) }), structure));
}
