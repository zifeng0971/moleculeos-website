import { notFound } from 'next/navigation';
import { manualPages } from '@/lib/manual';
import { ManualArticle } from '@/components/docs/manual-article';
export const dynamicParams=false;
export function generateStaticParams(){return manualPages('en').map(p=>({group:p.groupSlug,slug:p.slug}));}
export function generateMetadata({params}:{params:{group:string;slug:string}}){return {title:manualPages('en').find(p=>p.groupSlug===params.group&&p.slug===params.slug)?.title};}
export default function Page({params}:{params:{group:string;slug:string}}){if(!manualPages('en').some(p=>p.groupSlug===params.group&&p.slug===params.slug))notFound();return <ManualArticle locale="en" {...params}/>}
