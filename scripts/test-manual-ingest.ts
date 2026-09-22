/** Generated tiny DOCX fixtures test conversion without changing the real manuals. */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import ffmpeg from 'ffmpeg-static';
import type { ManualManifest } from '../lib/manual-types';

async function main(){
  const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'mos-manual-test-'));
  const root=process.cwd();
  const paragraph=(text:string,level?:number)=>`<w:p>${level?`<w:pPr><w:pStyle w:val="H${level}"/><w:outlineLvl w:val="${level-1}"/></w:pPr>`:''}<w:r><w:t>${text}</w:t></w:r></w:p>`;
  const drawing=(id:string)=>`<w:r><w:pict><v:shape><v:imagedata r:id="${id}"/></v:shape></w:pict></w:r>`;
  const png=await sharp({create:{width:1800,height:900,channels:3,background:'#141220'}}).png().toBuffer();
  const gif=await sharp({create:{width:256,height:192,channels:3,background:'#7C5CFF'}}).gif().toBuffer();
  for(const locale of ['zh','en']){
    const zip=new AdmZip();
    const body=paragraph('手册测试')+paragraph('分组',1)+paragraph('页面',2)+paragraph('原文加粗与列表')+`<w:p><w:r><w:rPr><w:b/><w:i/></w:rPr><w:t>保留格式</w:t></w:r></w:p>`+paragraph('媒体前')+`<w:p>${drawing('gif')}</w:p>`+paragraph('媒体后')+paragraph('[MMetrics_mutation scoring_1.mov]')+`<w:p><w:hyperlink r:id="online">${drawing('png')}</w:hyperlink></w:p>`+`<w:tbl><w:tr><w:tc>${paragraph('表内标题',3)}${paragraph('表内正文')}<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>列表第一层</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:ilvl w:val="1"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>列表第二层</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`+paragraph('页面',2)+paragraph('第二页内容')+(locale==='en'?paragraph('Third page',2)+paragraph('Unpaired content'):'')+`<w:tbl><w:tr><w:tc>${paragraph('表内末尾分组',1)}${paragraph('末尾原文保留')}</w:tc></w:tr></w:tbl>`;
    zip.addFile('[Content_Types].xml',Buffer.from('<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="gif" ContentType="image/gif"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'));
    zip.addFile('_rels/.rels',Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'));
    zip.addFile('word/document.xml',Buffer.from(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:body>${body}</w:body></w:document>`));
    zip.addFile('word/styles.xml',Buffer.from(`<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${[1,2,3].map(l=>`<w:style w:type="paragraph" w:styleId="H${l}"><w:name w:val="${locale==='zh'?'标题':'Heading'} ${l}"/></w:style>`).join('')}</w:styles>`));
    zip.addFile('word/_rels/document.xml.rels',Buffer.from('<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="gif" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/a.gif"/><Relationship Id="png" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/b.png"/><Relationship Id="online" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://www.youtube.com/watch?v=test" TargetMode="External"/><Relationship Id="numbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>'));
    zip.addFile('word/numbering.xml',Buffer.from('<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl><w:lvl w:ilvl="1"><w:numFmt w:val="decimal"/><w:lvlText w:val="%2."/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>'));
    zip.addFile('word/media/a.gif',gif);zip.addFile('word/media/b.png',png);
    zip.addFile('word/media/header.png',await sharp({create:{width:1800,height:900,channels:3,background:'#221122'}}).png().toBuffer());
    zip.addFile('word/media/banner.png',await sharp({create:{width:1800,height:120,channels:3,background:'#141220'}}).png().toBuffer());
    zip.addFile('word/media/tiny.png',await sharp({create:{width:32,height:32,channels:3,background:'#141220'}}).png().toBuffer());
    zip.addFile('word/_rels/header1.xml.rels',Buffer.from('<Relationships><Relationship Id="header-image" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/header.png"/></Relationships>'));
    zip.writeZip(path.join(temporary,`${locale}.docx`));
  }
  const env={...process.env,MANUAL_ZH:path.join(temporary,'zh.docx'),MANUAL_EN:path.join(temporary,'en.docx'),MANUAL_OUTPUT_ROOT:temporary};
  const execute=()=>spawnSync(process.execPath,[path.join(root,'node_modules/tsx/dist/cli.mjs'),path.join(root,'scripts/ingest-manual.ts')],{cwd:root,env,encoding:'utf8'});
  const first=execute();assert.equal(first.status,0,first.stderr);
  const manifestFile=path.join(temporary,'content/manual/manifest.json');const original=await fs.readFile(manifestFile,'utf8');const manifest=JSON.parse(original) as ManualManifest;
  assert.equal(manifest.languages.zh.pageCount,2);assert.equal(manifest.languages.en.pageCount,3);assert.equal(manifest.languages.zh.groups.length,2);
  const page=manifest.languages.zh.groups[0].pages[0];const mdx=await fs.readFile(path.join(temporary,'content/manual',page.file),'utf8');
  assert(page.href.includes('/help/manual#'));
  assert.equal(manifest.languages.zh.assets.filter(a=>a.filteredReason).length,3);
  assert(!mdx.includes('/filtered/'));
  assert(mdx.indexOf('媒体前')<mdx.indexOf('<ManualImage'));assert(mdx.indexOf('<ManualImage')<mdx.indexOf('媒体后'));
  assert(mdx.includes('保留格式'));assert(mdx.includes('列表第一层')&&mdx.includes('列表第二层'));
  assert.equal(page.anchors.length,1);assert(manifest.languages.zh.groups[0].pages[1].slug.endsWith('-2'));
  assert(manifest.languages.zh.assets.some(a=>a.type==='missing-video'&&a.originalFilename==='MMetrics_mutation scoring_1.mov'));
  const external=manifest.languages.zh.assets.find(a=>a.type==='external-video');assert(external?.poster);
  const bitmap=manifest.languages.zh.assets.find(a=>a.type==='image'&&a.original?.endsWith('.png'));assert(bitmap);assert(bitmap.original?.endsWith('.png'));assert.equal((await sharp(path.join(temporary,'public',bitmap.src)).metadata()).width,1600);
  assert(manifest.warnings.some(w=>w.includes('缺少对应页')));
  const repeat=execute();assert.equal(repeat.status,0,repeat.stderr);assert.equal(await fs.readFile(manifestFile,'utf8'),original,'Repeated output must be deterministic');
  for(const lang of ['zh','en']){
    const directory=path.join(temporary,'content/manual-source',lang,'video');await fs.mkdir(directory,{recursive:true});
    const movie=spawnSync(ffmpeg!,['-v','error','-f','lavfi','-i','testsrc=size=64x32:rate=2','-t','1','-c:v','libx264','-pix_fmt','yuv420p','-y',path.join(directory,'MMetrics_mutation scoring_1.mov')],{encoding:'utf8'});assert.equal(movie.status,0,movie.stderr);
  }
  const supplied=execute();assert.equal(supplied.status,0,supplied.stderr);
  const resolved=JSON.parse(await fs.readFile(manifestFile,'utf8')) as ManualManifest;
  assert(!resolved.languages.zh.assets.some(a=>a.type==='missing-video'));
  assert(resolved.languages.zh.assets.some(a=>a.type==='video'&&a.originalFilename==='MMetrics_mutation scoring_1.mov'));
  const published=await fs.readFile(manifestFile,'utf8');
  const invalid=new AdmZip(path.join(temporary,'zh.docx'));invalid.updateFile('word/document.xml',Buffer.from('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>只有手动加粗</w:t></w:r></w:p></w:body></w:document>'));invalid.writeZip(path.join(temporary,'zh.docx'));
  const failed=execute();assert.notEqual(failed.status,0);assert.match(failed.stderr,/标题/);assert.equal(await fs.readFile(manifestFile,'utf8'),published,'Failed validation must not replace published content');
  console.log('Manual ingestion fixtures passed: headings, nested tables/lists, static GIF position, missing-video warning, external poster, WebP sizing, ordinal pairing, repeatability, invalid-heading rejection.');
  // Keep generated fixtures in the named temporary directory for diagnostics; no source files touched.
  console.log(`Fixture output: ${temporary}`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
