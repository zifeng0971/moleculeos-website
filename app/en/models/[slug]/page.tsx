import { notFound } from 'next/navigation';
import { MODEL_SLUGS } from '@/lib/content';
import { LegacyRedirect } from '@/components/pages/legacy-redirect';
export function generateStaticParams(){return MODEL_SLUGS.map(slug=>({slug}))}
export default function Page({params}:{params:{slug:string}}){if(!MODEL_SLUGS.some(slug=>slug===params.slug))notFound();return <LegacyRedirect href={'/en/platform#'+params.slug}/>;}
