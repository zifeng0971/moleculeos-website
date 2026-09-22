import { notFound } from 'next/navigation';
import { manualPages } from '@/lib/manual';
import { ManualArticle } from '@/components/docs/manual-article';
export const dynamicParams=false;
export function generateStaticParams(){return manualPages('zh').map(p=>({group:p.groupSlug,slug:p.slug}));}
export function generateMetadata({params}:{params:{group:string;slug:string}}){return {title:manualPages('zh').find(p=>p.groupSlug===params.group&&p.slug===params.slug)?.title};}
export default function Page({params}:{params:{group:string;slug:string}}){if(!manualPages('zh').some(p=>p.groupSlug===params.group&&p.slug===params.slug))notFound();return <ManualArticle locale="zh" {...params}/>}
