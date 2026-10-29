import Image from 'next/image';
import mochaWelcomeIcon from './assets/welcome/icon-mocha-welcome.svg';
import predictStructureIcon from './assets/welcome/icon-predict-structure.svg';
import sequenceRedesignIcon from './assets/welcome/icon-sequence-redesign.svg';
import mutationEffectIcon from './assets/welcome/icon-mutation-effect.svg';
import ligandAffinityIcon from './assets/welcome/icon-ligand-affinity.svg';

// Mocha's welcome in the workbench's initial state (Figma "MOS 2026", node 1652:8057).
// Product UI copy: shown in English on both locales, like the rest of the workbench chrome.
const MODULES = [
  { icon: predictStructureIcon, title: 'Predict Structure', body: 'This module uses advanced deep learning methods to predict biomolecular structures and properties.' },
  { icon: sequenceRedesignIcon, title: 'Sequence Redesign', body: 'This module redesigns protein sequence based on the backbone structure.' },
  { icon: mutationEffectIcon, title: 'Mutation Effect', body: 'This module uses structural fitness models to evaluate all potential mutations of a protein structure.' },
  { icon: ligandAffinityIcon, title: 'Protein-Ligand Affinity', body: 'This module uses statistical physics to estimate and adjust interatomic potentials.' },
];

export function MochaWelcome() {
  return <div className="mocha-welcome">
    <div className="mocha-welcome-head">
      <span className="mocha-welcome-mark"><Image src={mochaWelcomeIcon} alt="" width={20} height={26} /></span>
      <h3>What can I do for you?</h3>
    </div>
    <ul className="mocha-welcome-modules">
      {MODULES.map(module => <li key={module.title}>
        <p className="mocha-welcome-module-title"><Image src={module.icon} alt="" width={16} height={16} />{module.title}</p>
        <p className="mocha-welcome-module-body">{module.body}</p>
      </li>)}
    </ul>
  </div>;
}
