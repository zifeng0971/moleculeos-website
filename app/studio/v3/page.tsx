// PLACEHOLDER (owner: A). The Mol* stage needs `window`, so the whole app is client-only (AMENDMENTS §B.2).
import type { Metadata } from 'next';
import V3Entry from './entry';

export const metadata: Metadata = { title: 'MOS v3 (prototype)', robots: { index: false } };
export default function Page() { return <V3Entry />; }
