import type { Metadata } from 'next';
import { ConsoleApp } from '@/components/console/console-app';

// Prototype of the MOS workbench. Not part of the marketing site's navigation.
export const metadata: Metadata = { title: 'MOS Console (prototype)', robots: { index: false } };
export default function Page() { return <ConsoleApp />; }
