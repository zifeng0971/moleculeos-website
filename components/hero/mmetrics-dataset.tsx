'use client';
import { createContext, useContext, type ReactNode } from 'react';
import data4ht1 from '@/content/mmetrics-4ht1.json';
import data5grj from '@/content/mmetrics-5grj.json';
import dataKn035 from '@/content/mmetrics-kn035.json';
import nativeKn035Network from '@/content/mmetrics-kn035-native-network.json';
import type { ViewerOptions } from './molstar-controller';

export type FlowNode = { key: string; name: string; number: number; chain: string; property?: string };
export type MMRecord = {
  id: string; name: string; src: string;
  chains: { id: string; fragment: string | null; sequence: string }[];
  description: { category: string; confidence: string; text: string; reasoning: string };
  homologs: { method: string; empty?: string; items: { id: string; type: string | null; identity: number }[] };
  cdr: Record<'IMGT' | 'Kabat' | 'Chothia', { chain: string; from: number; to: number; name: string }[]>;
  paratope: { id: string; label: string }[]; epitope: { id: string; label: string }[];
  extraGroups?: { title: string; unit: string; ranges?: { chain: string; from: number; to: number; label: string }[]; residues?: { id: string; label: string }[] }[];
  interactions: { key: string; a: string; b: string; left: FlowNode[]; right: FlowNode[]; links: { a: string; b: string; category: string; distance: number }[] }[];
  mutationScoring: string[]; antibodyDesign: string[];
};

export type MMDataset = {
  data: MMRecord; structure: ViewerOptions; preview?: string; tag: string;
  nativeNetworkSvg?: string;
  /** Sections that exist only on the homepage's own 4HT1 demo (motif scan, example suggestions), not in the native MOS panel. */
  extras: boolean;
  linkColors: Record<string, string>; propertyColors: Record<string, string>;
};

const PROPERTY_COLORS = { Polar: '#26B3A8', Aliphatic: '#6CC04A', Aromatic: '#2BB7C9', Acidic: '#E26A3D', Basic: '#5B7CE6' };
export const DATASETS: Record<'4HT1' | '5GRJ' | 'KN035', MMDataset> = {
  '4HT1': {
    data: data4ht1 as unknown as MMRecord, tag: 'TWEAK–Fv', extras: true,
    structure: { src: data4ht1.src, label: `${data4ht1.id} · ${data4ht1.name}`, chains: data4ht1.chains.map(c => ({ auth: c.id, color: ({ A: '#D99A1E', B: '#8F8F8F', C: '#E0262B' } as Record<string, string>)[c.id] ?? '#8A8A8A' })), fit: 1.05 },
    linkColors: { 'H-Bond': '#4DBBA8', 'VdW Contact': '#8A8A8A', 'π-π Stack': '#E2804A', Ionic: '#E0603E', 'π-Cation': '#D9A53B' }, propertyColors: PROPERTY_COLORS,
  },
  // Native MOS panel for PD-L1 + avelumab: chain colours and link colours as the MOS viewer / plot draw them.
  '5GRJ': {
    data: data5grj as unknown as MMRecord, tag: 'PD-L1 · avelumab', extras: false,
    structure: { src: data5grj.src, label: '5GRJ · PD-L1 + avelumab VH/VL', chains: [{ auth: 'A', color: '#8E83D6' }, { auth: 'B', color: '#C75A1F' }, { auth: 'C', color: '#3B9C77' }], fit: 1.05 },
    linkColors: { 'H-Bond': '#36CFC9', 'VdW Contact': '#9AA0A6', 'π-π Stack': '#FF9C6E', Ionic: '#E0603E', 'π-Cation': '#FFC53D' }, propertyColors: { ...PROPERTY_COLORS, Polar: '#13C2C2', Aliphatic: '#73D13D', Aromatic: '#36CFC9', Acidic: '#FF7A45', Basic: '#597EF7', Sulfur: '#FFC53D' },
  },
  // Native MOS panel for the homepage's running molecule: PD-L1 (A) + KN035 VHH (B), the MMFold_1 complex of step 01.
  KN035: {
    data: dataKn035 as unknown as MMRecord, tag: 'PD-L1 · KN035', extras: false,
    nativeNetworkSvg: nativeKn035Network.svg,
    structure: { src: dataKn035.src, label: 'PD-L1 + KN035 · MMFold_1', chains: [{ auth: 'A', color: '#3B9C77' }, { auth: 'B', color: '#8E83D6' }], fit: 1.05 },
    linkColors: { 'H-Bond': '#36CFC9', 'VdW Contact': '#9AA0A6', 'π-π Stack': '#FF9C6E', Ionic: '#FF7A45', 'π-Cation': '#FFC53D' }, propertyColors: { ...PROPERTY_COLORS, Polar: '#13C2C2', Aliphatic: '#73D13D', Aromatic: '#36CFC9', Acidic: '#FF7A45', Basic: '#597EF7', Sulfur: '#FFC53D' },
  },
};

const Context = createContext<MMDataset>(DATASETS['4HT1']);
export const MMProvider = ({ dataset, children }: { dataset: MMDataset; children: ReactNode }) => <Context.Provider value={dataset}>{children}</Context.Provider>;
export const useMM = () => useContext(Context);

/** All residue ids inside a CDR range. */
export const rangeIds = (chain: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${chain}:${from + i}`);
