import Link from 'next/link';
import {MDXRemote} from 'next-mdx-remote/rsc';
import {manualPages,readManual,manualManifest} from '@/lib/manual';
import {localizeHref,type Locale} from '@/lib/site-config';
import {LegacyRedirect} from '@/components/pages/legacy-redirect';
import {ManualImage,ManualVideo,ManualMissingVideo,ManualTable,ManualCode} from './manual-media';
import {ManualToc} from './manual-toc';
import {getManualCopy} from './manual-copy';
const components={ManualImage,ManualVideo,ManualMissingVideo,ManualTable,pre:ManualCode};
// Repository-generated MDX only; literal props are allowed, dangerous JS remains blocked.
function ManualMdx({source}:{source:string}){return <MDXRemote source={source} components={components} options={{blockJS:false}}/>;}
export function ManualArticle({locale,group,slug}:{locale:Locale;group:string;slug:string}){const page=manualPages(locale).find(p=>p.groupSlug===group&&p.slug===slug);return page?<LegacyRedirect href={page.href}/>:null;}
export async function ManualIndex({locale}:{locale:Locale}){
  const data=manualManifest.languages[locale];const copy=getManualCopy(locale);
  return <div className="manual-reading-layout"><article className="manual-article"><nav className="manual-breadcrumb"><Link href={localizeHref('/help',locale)}>{copy.docs}</Link><span>/</span>{copy.manual}</nav><p className="manual-eyebrow">MOLECULEOS</p><h1>{data.title}</h1><p className="manual-lead">{copy.pages.replace('{count}',String(data.pageCount))}</p><div className="docs-content manual-flow" data-manual-flow><ManualMdx source={await readManual(`${locale}/_front.mdx`)}/>{await Promise.all(data.groups.map(async g=><section data-manual-group={g.slug} key={g.slug}><h1 id={g.slug}>{g.title}</h1><ManualMdx source={await readManual(g.overviewFile)}/>{await Promise.all(g.pages.map(async p=><section data-manual-chapter={p.id} key={p.id}><h2 id={p.href.split('#')[1]}>{p.title}</h2><ManualMdx source={await readManual(p.file)}/></section>))}</section>))}</div></article><ManualToc/></div>;
}
