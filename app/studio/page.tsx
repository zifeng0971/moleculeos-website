import type { Metadata } from 'next';
import { AgentApp } from '@/components/studio/agent-app';

// Agent-style redesign prototype of the MOS workbench (see docs/STUDIO-CONCEPT.md). Not linked from the marketing site.
export const metadata: Metadata = { title: 'MOS Agent (prototype)', robots: { index: false } };
export default function Page() { return <AgentApp />; }
