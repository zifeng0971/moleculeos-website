import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../content/manual/manifest.json',import.meta.url),'utf8'));
export const manualRedirects=Object.entries(manifest.languages).flatMap(([lang,data])=>data.groups.flatMap(g=>g.pages.map(p=>({source:`${lang==='en'?'/en':''}/docs/manual/${g.slug}/${p.slug}`,destination:p.href}))));
