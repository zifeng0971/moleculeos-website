import { CaseDetailPage } from '@/components/pages/case-detail-page';
import { CASE_SLUGS } from '@/lib/content';
import { notFound } from 'next/navigation';
export function generateStaticParams(){return CASE_SLUGS.map(slug=>({slug}))}
export default function Page({params}:{params:{slug:string}}){if(!CASE_SLUGS.some(slug=>slug===params.slug))notFound();return <CaseDetailPage locale="en" slug={params.slug}/>}
