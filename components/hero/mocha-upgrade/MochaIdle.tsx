import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';

export type MochaStarter = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<LucideProps>;
};

type MochaIdleProps = {
  intro: string;
  title: string;
  samplesLabel: string;
  starters: MochaStarter[];
  onSelect: (id: string) => void;
};

/**
 * Adapted from Mocha-Component-Upgrade-Testing/src/components/mocha/MochaIdle.
 * The display contract is externalized so the marketing site owns copy and tasks.
 */
export function MochaIdle({ intro, title, samplesLabel, starters, onSelect }: MochaIdleProps) {
  return (
    <section className="mocha-upgrade-idle" aria-label={title}>
      <div className="mocha-upgrade-greeting">
        <p className="mocha-upgrade-banner">{intro}</p>
        <h2>{title}</h2>
        <p className="mocha-upgrade-section-label">{samplesLabel}</p>
      </div>
      <div className="mocha-upgrade-grid" role="list">
        {starters.map(({ id, title: itemTitle, description, icon: Icon }) => (
          <button key={id} type="button" role="listitem" className="mocha-upgrade-starter" onClick={() => onSelect(id)}>
            <span className="mocha-upgrade-starter-head"><Icon size={16} aria-hidden="true"/><strong>{itemTitle}</strong></span>
            <span className="mocha-upgrade-starter-description">{description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
