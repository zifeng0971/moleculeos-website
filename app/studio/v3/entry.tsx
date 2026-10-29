'use client';
import dynamic from 'next/dynamic';
const V3App = dynamic(() => import('@/components/studio-v3/v3-app').then(m => m.V3App), { ssr: false });
export default function V3Entry() { return <V3App />; }
