/** Deterministic DOCX-only ingestion. Source documents are never published or modified. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import AdmZip from 'adm-zip';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { load } from 'cheerio';
import TurndownService from 'turndown';
import { pinyin } from 'pinyin-pro';
import type { AnyNode } from 'domhandler';
import { ManualMediaProcessor } from './manual-media';
import type { ManualAsset, ManualGroup, ManualManifest, ManualPage } from '../lib/manual-types';
import type { Locale } from '../lib/site-config';
import { buildManualSearch } from '../lib/manual-search-index';

const root = path.resolve(process.env.MANUAL_OUTPUT_ROOT ?? process.cwd());
const output = path.join(root, 'content/manual');
const assetsOutput = path.join(root, 'public/manual-assets');
const warnings: string[] = [];
const used = new Map<string, number>();
const writtenAssets = new Set<string>();
function slug(text: string, lang: Locale, scope: string) {
  const base = (lang === 'zh' ? pinyin(text, { toneType: 'none', nonZh: 'consecutive' }) : text)
    .normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
  const key = `${lang}/${scope}/${base}`;
  const count = (used.get(key) ?? 0) + 1; used.set(key, count);
  return count === 1 ? base : `${base}-${count}`;
}
const xmlText = (value: string) => load(`<root>${value}</root>`, { xml: true })('root').text();
const attr = (xml: string, name: string) => xml.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const jsx = (name: string, props: Record<string, unknown>) => `<${name} ${Object.entries(props).filter(([,v]) => v !== undefined).map(([k,v]) => `${k}={${JSON.stringify(v)}}`).join(' ')} />`;
const normalizeText = (s: string) => s.replace(/\s/g, '');
function plainText(html:string){const body=load(html,null,false);body('br').replaceWith('\n');body('p,h1,h2,h3,h4,h5,h6,li,td,th,tr').each((_,node)=>{body(node).append('\n');});return body.root().text();}
async function ensureFile(relative: string, buffer: Buffer) {
  const target = path.join(assetsOutput, relative); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, buffer);
  writtenAssets.add(target);
  return `/manual-assets/${relative}`;
}
async function convert(source: string, lang: Locale) {
  const zip = new AdmZip(source);
  let documentXml = zip.readAsText('word/document.xml');
  const relationships = new Map<string, { target: string; external: boolean; type: string }>();
  for (const relation of zip.readAsText('word/_rels/document.xml.rels').matchAll(/<Relationship\b[^>]*\/>/g)) {
    relationships.set(attr(relation[0], 'Id')!, { target: xmlText(attr(relation[0], 'Target')!), external: attr(relation[0], 'TargetMode') === 'External', type: attr(relation[0], 'Type')! });
  }
  // Some DOCX exporters omit styles.xml definitions but retain explicit outlineLvl.
  // Restore only this authoritative metadata in memory; never infer levels from bold/font size.
  const definitions = new Map<string, number>();
  const paragraphs = [...documentXml.matchAll(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)].map(m => m[0]);
  paragraphs.forEach(p => {
    const id = p.match(/<w:pStyle[^>]*w:val="([^"]+)"/)?.[1];
    const level = p.match(/<w:outlineLvl[^>]*w:val="([0-8])"/)?.[1];
    if (id && level) definitions.set(id, Number(level) + 1);
  });
  let styles = zip.readAsText('word/styles.xml');
  styles=styles.replace(/<w:styles([^>]*)\/>/,'<w:styles$1></w:styles>');
  for (const [id, level] of definitions) if (!styles.includes(`w:styleId="${id}"`)) {
    styles = styles.replace('</w:styles>', `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="Heading ${level}"/><w:pPr><w:outlineLvl w:val="${level-1}"/></w:pPr></w:style></w:styles>`);
  }
  zip.updateFile('word/styles.xml', Buffer.from(styles));
  const headingMap = Array.from({length:6},(_,i)=>[`p[style-name='Heading ${i+1}'] => h${i+1}:fresh`,`p[style-name='标题 ${i+1}'] => h${i+1}:fresh`]).flat();
  const hierarchyCheck=await mammoth.convertToHtml({buffer:zip.toBuffer()},{styleMap:headingMap,convertImage:mammoth.images.imgElement(async()=>({src:''}))});
  const hierarchy=load(hierarchyCheck.value,null,false);
  if(!hierarchy('h1').length||!hierarchy('h2').length)throw new Error(`${lang}: 未检测到 H1/H2 标题，请应用 Word 标题样式，不能仅手动加粗。`);
  const assets: ManualAsset[] = [];
  // Header/footer relationships are independent of document.xml.rels. Resolve all
  // such parts, including orphaned exported decorations, before body conversion.
  const excludedTargets=new Set<string>();
  for(const entry of zip.getEntries().filter(e=>/^word\/_rels\/(?:header|footer)[^/]*\.xml\.rels$/i.test(e.entryName))){
    for(const rel of zip.readAsText(entry.entryName).matchAll(/<Relationship\b[^>]*\/>/g))if(attr(rel[0],'Type')?.endsWith('/image')&&attr(rel[0],'TargetMode')!=='External')excludedTargets.add(path.posix.normalize(`word/${xmlText(attr(rel[0],'Target')!)}`));
  }
  const filteredHashes=new Map<string,ManualAsset>();
  for(const entry of zip.getEntries().filter(e=>/^word\/media\/.*\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(e.entryName))){
    const buffer=entry.getData();const info=await sharp(buffer).metadata();const w=info.width??0,h=info.height??0;
    const reason=excludedTargets.has(entry.entryName)?'header/footer reference':w&&h&&(w/h>8||w/h<1/8)?'aspect ratio outside 1:8–8:1':w<100&&h<100?'image smaller than 100×100':undefined;
    if(reason){const src=await ensureFile(`${lang}/filtered/${path.basename(entry.entryName)}`,buffer);const a:ManualAsset={id:`filtered-${filteredHashes.size+1}`,type:'image',src,originalFilename:path.basename(entry.entryName),filteredReason:reason,width:w,height:h,paragraph:-1,context:''};assets.push(a);filteredHashes.set(createHash('sha256').update(buffer).digest('hex'),a);warnings.push(`${lang}: 已过滤 ${entry.entryName} (${w}×${h}): ${reason}`);}
  }
  const processor = new ManualMediaProcessor(root, lang, warnings); await processor.init();
  const mediaByTarget = new Map<string, ManualAsset>();
  const videoByHash = new Map<string, ManualAsset>();
  let imageIndex = 0;
  async function image(buffer: Buffer, extension: string, key: string, paragraph = -1) {
    const found = mediaByTarget.get(key); if (found) return found;
    const id = `image-${String(++imageIndex).padStart(3,'0')}`;
    const metadata = await sharp(buffer).metadata();
    const original = await ensureFile(`${lang}/img/${id}.${extension}`, buffer);
    // Preserve original PNG. Other image formats also get a PNG fallback, without upscaling.
    if (extension !== 'png') await ensureFile(`${lang}/img/${id}.png`, await sharp(buffer).png().toBuffer());
    const src = await ensureFile(`${lang}/img/${id}.webp`, await sharp(buffer).resize({ width:1600, withoutEnlargement:true }).webp({ quality:90 }).toBuffer());
    const asset: ManualAsset = { id, type:'image', src, original, width:metadata.width, height:metadata.height, paragraph, context:'' };
    assets.push(asset); mediaByTarget.set(key,asset); return asset;
  }
  let mediaIndex=0;
  for (const entry of zip.getEntries().filter(e => /^word\/media\/.*\.(mp4|mov|gif)$/i.test(e.entryName))) {
    const id = `video-${++mediaIndex}`;
    if(filteredHashes.has(createHash('sha256').update(entry.getData()).digest('hex')))continue;
    const asset = await processor.convert(entry.getData(), path.basename(entry.entryName), id);
    assets.push(asset); mediaByTarget.set(entry.entryName,asset); videoByHash.set(createHash('sha256').update(entry.getData()).digest('hex'),asset);
  }
  const markers = new Map<string, ManualAsset[]>();
  const imagePositions = new Map<string,{paragraph:number;context:string;occurrences:number[]}>();
  const videoHosts = /(?:youtube\.com|youtu\.be|vimeo\.com|bilibili\.com|youku\.com|video\.qq\.com|loom\.com)/i;
  let paragraphIndex = 0;
  documentXml = documentXml.replace(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g, p => {
    const ordinal = paragraphIndex++;
    const text = [...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>xmlText(m[1])).join('');
    const found: ManualAsset[] = [];
    for (const match of p.matchAll(/(?:r:embed|r:link|r:id)="([^"]+)"/g)) {
      const rel = relationships.get(match[1]); if (!rel) continue;
      const target = path.posix.normalize(`word/${rel.target}`);
      if(!rel.external&&rel.type.endsWith('/image')&&zip.getEntry(target)){
        const hash=createHash('sha256').update(zip.readFile(target)!).digest('hex');
        const existing=imagePositions.get(hash);
        if(existing){if(!existing.occurrences.includes(ordinal))existing.occurrences.push(ordinal);}
        else imagePositions.set(hash,{paragraph:ordinal,context:text,occurrences:[ordinal]});
      }
      if (rel.external && videoHosts.test(rel.target)) {
        const asset: ManualAsset = { id:`external-${assets.filter(a=>a.type==='external-video').length+1}`,type:'external-video',src:rel.target,paragraph:ordinal,context:text };
        assets.push(asset); found.push(asset);
      }
    }
    const unique = [...new Set(found)];
    if (!unique.length) return p;
    for (const a of unique) { if(a.paragraph<0)a.paragraph=ordinal; a.context ||= text; (a.occurrences??=[]).push(ordinal); }
    const marker = `MANUAL_MEDIA_${ordinal}_TOKEN`; markers.set(marker,unique);
    // Append a bookmark-like text marker within the same paragraph to retain nested-table/list position.
    return p.replace('</w:p>',`<w:r><w:t>${marker}</w:t></w:r></w:p>`);
  });
  zip.updateFile('word/document.xml',Buffer.from(documentXml));
  const styleMap = Array.from({length:6},(_,i)=>[`p[style-name='Heading ${i+1}'] => h${i+1}:fresh`,`p[style-name='标题 ${i+1}'] => h${i+1}:fresh`]).flat();
  const result = await mammoth.convertToHtml({buffer:zip.toBuffer()}, {
    styleMap: [...styleMap,"r[style-name='Code'] => code", "r[style-name='代码'] => code", "p[style-name='Code'] => pre:fresh > code", "p[style-name='代码'] => pre:fresh > code", "p[style-name='Caption'] => p.manual-caption:fresh", "p[style-name='题注'] => p.manual-caption:fresh"],
    convertImage:mammoth.images.imgElement(async img => {
      const buffer = await img.read();
      const filtered=filteredHashes.get(createHash('sha256').update(buffer).digest('hex'));
      if(filtered)return {src:filtered.src,'data-filtered-id':filtered.id};
      const video=videoByHash.get(createHash('sha256').update(buffer).digest('hex'));
      if(video){const position=imagePositions.get(createHash('sha256').update(buffer).digest('hex'));video.paragraph=position?.paragraph??-1;video.occurrences=position?.occurrences??[];return {src:video.poster!,'data-asset-id':video.id};}
      const hash=createHash('sha256').update(buffer).digest('hex');
      const position=imagePositions.get(hash);
      const asset = await image(buffer, img.contentType.split('/')[1].replace('jpeg','jpg'), hash,position?.paragraph);
      asset.context=position?.context??'';
      asset.occurrences=position?.occurrences??[];
      return {src:asset.src,'data-asset-id':asset.id};
    }),
  });
  const $ = load(result.value,null,false);
  $('img[data-filtered-id]').remove(); // Prose/captions remain untouched.
  if (!$('h1').length || !$('h2').length) throw new Error(`${lang}: 未检测到 H1/H2 标题。请在 Word 中使用“标题 1 / 标题 2”或“Heading 1 / Heading 2”样式；不能仅手动加粗。未覆盖任何现有输出。`);
  for (const [marker, media] of markers) {
    const textNodes = $('*').contents().filter((_,n)=>n.type==='text' && n.data.includes(marker));
    textNodes.each((_,node)=> {
      const parent = $(node).parent();
      for (const asset of media) {
        let preview = asset.type==='video' ? parent.find(`img[data-asset-id="${asset.id}"]`).first() : parent.find('img').first();
        // Mammoth may hoist VML/block images out of their source paragraph.
        if(!preview.length){const next=parent.next('img');if(asset.type!=='video'||next.attr('data-asset-id')===asset.id)preview=next;}
        if (asset.type==='external-video' && preview.length){asset.poster=preview.attr('src');const bitmap=assets.find(a=>a.id===preview.attr('data-asset-id'));asset.width=bitmap?.width;asset.height=bitmap?.height;}
        // GIF originals are emitted by mammoth as images: replace that preview at the exact location.
        if ((asset.type==='video'||asset.type==='external-video') && preview.length) {
          const duplicate = assets.find(a=>a.id===preview.attr('data-asset-id'));
          if (asset.type==='video'&&duplicate?.type==='image') { assets.splice(assets.indexOf(duplicate),1); }
          preview.replaceWith(`<manual-media data-id="${asset.id}"></manual-media>`);
        } else parent.append(`<manual-media data-id="${asset.id}"></manual-media>`);
      }
      if(node.type==='text')node.data=node.data.replace(marker,'');
    });
  }
  const originalBodyText = paragraphs.flatMap(p=>[...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>xmlText(m[1]))).join('');
  if(normalizeText(originalBodyText)!==normalizeText($.root().text())) throw new Error(`${lang}: 文本完整性校验失败，转换未保留全部原文；停止发布。`);
  // Bare media filenames are replaced in place, never reordered or matched across languages.
  const textNodes = $('*').contents().filter((_,node)=>node.type==='text'&&/\[[^\[\]\r\n]+\.(?:mov|mp4)\]/i.test(node.data)).toArray();
  for (const node of textNodes) {
    if(node.type!=='text')continue;
    const mediaTags:string[]=[];
    for(const match of node.data.matchAll(/\[([^\[\]\r\n]+\.(?:mov|mp4))\]/gi)){
      const filename=match[1];const id=`manual-video-${assets.filter(a=>a.id.startsWith('manual-video-')).length+1}`;
      let asset:ManualAsset|undefined=mediaByTarget.get(`word/media/${filename}`);
      if(!asset){const supplemental=path.join(root,'content/manual-source',lang,'video',path.basename(filename));const buffer=await fs.readFile(supplemental).catch(()=>null);if(buffer)asset=await processor.convert(buffer,filename,id);}
      if(!asset){asset={id,type:'missing-video',src:'',originalFilename:filename,paragraph:-1,context:node.data};warnings.push(`${lang}: 缺失视频 ${filename}；请放入 content/manual-source/${lang}/video/ 后重跑。`);}
      if(!assets.includes(asset))assets.push(asset);
      asset.paragraph=paragraphs.findIndex(p=>[...p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map(m=>xmlText(m[1])).join('').includes(match[0]));
      mediaTags.push(`<manual-media data-id="${asset.id}"></manual-media>`);
    }
    // Text is escaped separately so original angle brackets remain literal text.
    const escaped=(text:string)=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    let html='';let cursor=0;let index=0;
    for(const match of node.data.matchAll(/\[([^\[\]\r\n]+\.(?:mov|mp4))\]/gi)){html+=escaped(node.data.slice(cursor,match.index))+mediaTags[index];cursor=match.index!+match[0].length;index++;}
    $(node).replaceWith(html+escaped(node.data.slice(cursor)));
  }
  // A two-block image-only table cell followed by a short label is an unambiguous
  // figure caption in these exports; other ordinary following paragraphs stay prose.
  $('td').each((_,cell)=>{const children=$(cell).children();if(children.length===2&&children.last().is('p')&&children.last().text().length<=80&&children.first().find('img,manual-media').addBack('img,manual-media').length&&children.first().text().trim()==='')children.last().addClass('manual-caption');});
  $('p.manual-caption').each((_,caption)=>{const element=$(caption);const previous=element.prev().find('img,manual-media').addBack('img,manual-media').last();const asset=assets.find(a=>a.id===(previous.attr('data-asset-id')??previous.attr('data-id')));if(asset&&asset.type!=='missing-video'){asset.caption=element.text();element.remove();}});
  assets.sort((a,b)=>a.paragraph-b.paragraph||a.id.localeCompare(b.id,'en',{numeric:true}));
  const td = new TurndownService({headingStyle:'atx',codeBlockStyle:'fenced',bulletListMarker:'-',blankReplacement:(content,node)=>{
    if(node.nodeName==='MANUAL-MEDIA')return mediaJsx(assets.find(a=>a.id===(node as HTMLElement).getAttribute('data-id'))!);
    if(node.nodeName==='A'&&(node as HTMLElement).id)return `<span id="${(node as HTMLElement).id}"></span>`;
    return (node as HTMLElement & {isBlock:boolean}).isBlock?`\n\n${content}\n\n`:content;
  }});
  const originalEscape=td.escape.bind(td); td.escape=text=>originalEscape(text).replace(/[<>{}]/g,'\\$&');
  // CommonMark emphasis delimiters fail beside some CJK punctuation. Semantic JSX
  // preserves these runs exactly, including “选择模式：” immediately followed by Chinese.
  td.addRule('strong-jsx',{filter:['strong','b'],replacement:content=>`<strong>${content}</strong>`});
  td.addRule('em-jsx',{filter:['em','i'],replacement:content=>`<em>${content}</em>`});
  // Preserve tables as JSX rather than GFM: this retains nested paragraphs, lists, colspan/rowspan.
  td.addRule('table',{filter:'table',replacement:(_content,node)=> {
    return `\n\n${jsx('ManualTable',{html:(node as HTMLElement).outerHTML,assets:assets.filter(a=>(node as HTMLElement).outerHTML.includes(`"${a.id}"`))})}\n\n`;
  }});
  function mediaJsx(a:ManualAsset) { return jsx(a.type==='missing-video'?'ManualMissingVideo':'ManualVideo',{src:a.src,poster:a.poster,webm:a.webm,mp4:a.mp4,external:a.type==='external-video',caption:a.caption,reference:a.originalFilename}); }
  td.addRule('media',{filter:n=>n.nodeName==='MANUAL-MEDIA',replacement:(_c,n)=>mediaJsx(assets.find(a=>a.id===(n as HTMLElement).getAttribute('data-id'))!)});
  td.addRule('image',{filter:'img',replacement:(_c,n)=>{const a=assets.find(a=>a.id===(n as HTMLElement).getAttribute('data-asset-id'));return a?a.type==='image'?jsx('ManualImage',{src:a.src,width:a.width,height:a.height,alt:(n as HTMLElement).getAttribute('alt')??'',caption:a.caption}):mediaJsx(a):'';}});
  td.addRule('bookmarks',{filter:n=>n.nodeName==='A'&&!!(n as HTMLElement).id&&!n.textContent,replacement:(_c,n)=>`<span id="${(n as HTMLElement).id}"></span>`});
  td.addRule('headings',{filter:['h3','h4','h5','h6'],replacement:(_content,node)=>`\n\n${(node as HTMLElement).outerHTML.replace(/[{}]/g,m=>m==='{'?'&#123;':'&#125;').replace(/<br>/g,'<br />')}\n\n`});
  const groups:ManualGroup[]=[]; let current:ManualGroup|undefined; let page:ManualPage|undefined; let chunks:string[]=[]; let pageOrder=0;
  const files = new Map<string,string>();
  const htmlFiles = new Map<string,string>([[`${lang}/_front.mdx`,'']]);
  const bookmarkTargets = new Map<string,string>();
  function flush() {
    if (!current) return;
    const html=chunks.join(''); const plain=plainText(html);
    const file=page?.file ?? current.overviewFile; htmlFiles.set(file,html);
    const resourceIds=[...new Set([...load(html,null,false)('[data-asset-id],manual-media')].map(n=>$(n).attr('data-asset-id')??$(n).attr('data-id')!).filter(Boolean))];
    for(const id of [...resourceIds]){const a=assets.find(a=>a.id===id);const poster=assets.find(bitmap=>bitmap.type==='image'&&bitmap.src===a?.poster);if(poster&&!resourceIds.includes(poster.id))resourceIds.push(poster.id);}
    if(page){page.text=plain;page.assets=resourceIds;}else {current.assets=resourceIds;current.text=plain;}
    const fragment=load(html,null,false);
    resourceIds.forEach(id=>{const a=assets.find(a=>a.id===id);if(a){const element=fragment(`[data-asset-id="${id}"],[data-id="${id}"]`).first();const scope=element.parent().is('p')?element.parent():element;const previous=scope.prevAll().toArray().map(n=>fragment(n).text().trim()).find(Boolean);const following=scope.nextAll().toArray().map(n=>fragment(n).text().trim()).find(Boolean);const context=[previous,following].filter(Boolean).join(' ').slice(0,240)||plain.slice(0,240);(a.references??=[]).push({pageId:page?.id,groupSlug:current!.slug,context});if(!a.groupSlug){a.pageId=page?.id;a.groupSlug=current!.slug;a.context=context;}}});
    chunks=[];
  }
  const title = $('p').first().text();
  // Split H1/H2 even inside layout tables. Each content fragment retains its table/list
  // ancestors; no text is removed and fragments remain in their original sequence.
  function fragments(node: AnyNode): string[] {
    if(node.type!=='tag'||['h1','h2'].includes(node.name)||!$(node).find('h1,h2').length)return [$.html(node)];
    const result:string[]=[];let buffer='';
    const flushBuffer=()=>{if(buffer){const clone=$(node).clone();clone.empty();clone.append(buffer);result.push($.html(clone));buffer='';}};
    for(const child of node.children)for(const fragment of fragments(child)){if(/^<h[12](?:\s|>)/.test(fragment)){flushBuffer();result.push(fragment);}else buffer+=fragment;}
    flushBuffer();return result;
  }
  const ordered=$.root().children().toArray().flatMap(fragments);
  const splitAudit=ordered.map(html=>load(html,null,false).text()).join('');
  if(normalizeText(splitAudit)!==normalizeText($.root().text()))throw new Error(`${lang}: 拆分过程改变了原文顺序或内容。`);
  for (const html of ordered) {
    const node=load(html,null,false).root().children()[0];
    if(!node)continue;
    const el=$(node); const tag=node.type==='tag'?node.name:'';
    const bookmarks=el.find('a[id]').toArray().map(a=>$(a).attr('id')!);
    if(tag==='h1') { flush(); page=undefined;const heading=el.text();const groupSlug=slug(heading,lang,'groups'); current={title:heading,slug:groupSlug,overviewFile:`${lang}/${groupSlug}/_overview.mdx`,overviewAnchors:[],assets:[],pages:[],bookmarks};groups.push(current);bookmarks.forEach(id=>bookmarkTargets.set(id,`${lang==='en'?'/en':''}/help/manual#${groupSlug}`)); }
    else if(tag==='h2') {flush();if(!current)throw new Error(`${lang}: H2 出现在 H1 分组之前。`);const pageSlug=slug(el.text(),lang,current.slug);page={id:`${lang}-${pageOrder}`,title:el.text(),groupTitle:current.title,groupSlug:current.slug,slug:pageSlug,file:`${lang}/${current.slug}/${pageSlug}.mdx`,href:`${lang==='en'?'/en':''}/help/manual#${current.slug}-${pageSlug}`,order:pageOrder++,anchors:[],assets:[],text:'',bookmarks};current.pages.push(page);bookmarks.forEach(id=>bookmarkTargets.set(id,page!.href));}
    else {
      if(!current){ // Document title/front matter stays in the manual index, not discarded.
        htmlFiles.set(`${lang}/_front.mdx`, (htmlFiles.get(`${lang}/_front.mdx`)??'')+$.html(node));continue;
      }
      el.find('h3,h4,h5,h6').addBack('h3,h4,h5,h6').each((_,heading)=>{const h=$(heading);const id=`${current!.slug}-${page?.slug??'overview'}-${slug(h.text(),lang,page?.id??`${current!.slug}-overview`)}`;h.attr('id',id);h.find('a[id]').each((_,a)=>{bookmarkTargets.set($(a).attr('id')!,`${lang==='en'?'/en':''}/help/manual#${id}`);});const level=Number((heading as {name:string}).name.slice(1));if(level<=4)(page?.anchors??current!.overviewAnchors).push({id,title:h.text(),level});});
      chunks.push($.html(node));
    }
  }
  flush();
  for(const [file,html]of htmlFiles){const body=load(html,null,false);body('a[href^="#"]').each((_,a)=>{const el=body(a);const target=bookmarkTargets.get(el.attr('href')!.slice(1));if(target)el.attr('href',target);});files.set(file,td.turndown(body.html()));}
  // Fidelity gate compares all body text before/after splitting (format whitespace only ignored).
  const sourceText=$.root().text();
  const splitText=[...files.values()].join('');
  if (!sourceText.length || !splitText.length) throw new Error(`${lang}: 空文档。`);
  const {compile}=await import('@mdx-js/mdx');
  for(const [file,mdx]of files){try{await compile(mdx);}catch(error){throw new Error(`${file}: MDX 格式校验失败：${error}`);}}
  await processor.save();processor.files.forEach(file=>writtenAssets.add(file));
  console.log(`${lang} GIF 报告：${processor.totals.count} 个，缓存 ${processor.totals.cached} 个；原始 ${(processor.totals.original/1048576).toFixed(2)} MiB → ${(processor.totals.converted/1048576).toFixed(2)} MiB，压缩比 ${(processor.totals.original/Math.max(1,processor.totals.converted)).toFixed(2)}:1`);
  return {source:path.basename(source),title,groups,assets,pageCount:pageOrder,files,sourceTextLength:normalizeText(sourceText).length};
}

async function main() {
  const desktop=path.join(os.homedir(),'Desktop');
  const zh=process.env.MANUAL_ZH ?? path.join(desktop,'分子之心 MoleculeOS 用户操作手册.docx');
  const en=process.env.MANUAL_EN ?? path.join(desktop,'MoleculeMind - MoleculeOS User Guide.docx');
  for(const source of [zh,en])if(path.extname(source).toLowerCase()!=='.docx')throw new Error('仅支持 DOCX 源文件。');
  // Validate both input hierarchies before expensive conversion or output writes.
  for(const source of [zh,en]){const zip=new AdmZip(source);const xml=zip.readAsText('word/document.xml');if(!/<w:outlineLvl[^>]*w:val="[01]"/.test(xml)&&!/<w:pStyle/.test(xml))throw new Error(`${source}: 未检测到标题层级，请应用 Word 标题样式，不能仅手动加粗。`);}
  const data={zh:await convert(zh,'zh'),en:await convert(en,'en')};
  const pages={zh:data.zh.groups.flatMap(g=>g.pages),en:data.en.groups.flatMap(g=>g.pages)};
  for(const lang of ['zh','en'] as const)pages[lang].forEach((page,i)=>{page.counterpart=pages[lang==='zh'?'en':'zh'][i]?.href;if(!page.counterpart)warnings.push(`${lang}: 缺少对应页，序号 ${i+1}：${page.groupTitle} > ${page.title}`);});
  if(pages.zh.length!==pages.en.length)warnings.unshift(`中英页数不一致：中文 ${pages.zh.length}，英文 ${pages.en.length}。按出现顺序匹配，不进行翻译或补全。`);
  await fs.mkdir(output,{recursive:true});
  // Delete only this script's generated language directories, never source files.
  for(const lang of ['zh','en'] as const){await fs.rm(path.join(output,lang),{recursive:true,force:true});for(const[file,content]of data[lang].files){const dest=path.join(output,file);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,content);}}
  const manifest:ManualManifest={version:1,languages:{zh:{...data.zh,files:undefined} as unknown as ManualManifest['languages']['zh'],en:{...data.en,files:undefined} as unknown as ManualManifest['languages']['en']},warnings};
  await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2));
  await fs.writeFile(path.join(output,'missing-videos.json'),JSON.stringify(Object.entries(data).flatMap(([language,doc])=>doc.assets.filter(a=>a.type==='missing-video').map(a=>({language,filename:a.originalFilename,pageId:a.pageId,groupSlug:a.groupSlug}))),null,2));
  await buildManualSearch(manifest,root);
  // Prune obsolete, script-owned assets only after both languages pass validation.
  async function prune(directory:string){for(const entry of await fs.readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())await prune(file);else if(/^(?:image-\d+|video-\d+(?:-poster)?)\.[a-z0-9+]+$/i.test(entry.name)&&!writtenAssets.has(file))await fs.unlink(file);}}
  for(const lang of ['zh','en'] as const)await prune(path.join(assetsOutput,lang));
  console.log(`完成：中文 ${pages.zh.length} 页 / 英文 ${pages.en.length} 页；资源 ${data.zh.assets.length+data.en.assets.length} 个。`);
  const gifs=[...data.zh.assets,...data.en.assets].filter(a=>a.originalFilename?.toLowerCase().endsWith('.gif'));
  const originalBytes=gifs.reduce((sum,a)=>sum+(a.originalBytes??0),0);const convertedBytes=gifs.reduce((sum,a)=>sum+(a.convertedBytes??0),0);
  console.log(`GIF 总计：${gifs.length} 个；原始 ${(originalBytes/1048576).toFixed(2)} MiB → ${(convertedBytes/1048576).toFixed(2)} MiB；压缩比 ${(originalBytes/Math.max(1,convertedBytes)).toFixed(2)}:1；静图回退 ${gifs.filter(a=>a.fallbackReason).length} 个。`);
  warnings.forEach(w=>console.warn(w));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
