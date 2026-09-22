import { notFound } from 'next/navigation';
import { LegacyRedirect } from '@/components/pages/legacy-redirect';
import { SITE_CONFIG } from '@/lib/site-config';
export function generateStaticParams(){return SITE_CONFIG.platformMenu.tasks.map(([,slug])=>({slug}))}
export default function Page({params}:{params:{slug:string}}){if(!SITE_CONFIG.platformMenu.tasks.some(([,slug])=>slug===params.slug))notFound();return <LegacyRedirect href={'/platform#'+params.slug}/>;}
