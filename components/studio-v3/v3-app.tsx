'use client';
// PLACEHOLDER (owner: A). Replace wholesale. Root order of CSS imports is fixed by AMENDMENTS §A.5.
import './tokens.css'; import './base.css'; import './motion.css'; import './ui/ui.css'; import './shell/shell.css'; import './stage/stage.css';
import './evidence/evidence.css'; import './agent/agent.css'; import './onboarding/onboarding.css';
import { ThemeProvider } from './theme';
import { StageLayer } from './stage';
import { MochaPane } from './agent';

export function V3App() {
  return (
    <ThemeProvider>
      <div style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateColumns: '1fr 360px' }}>
        <div style={{ position: 'relative' }}><StageLayer /></div>
        <MochaPane />
      </div>
    </ThemeProvider>
  );
}
