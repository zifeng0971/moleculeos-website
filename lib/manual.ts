import fs from 'node:fs/promises';
import path from 'node:path';
import manifest from '@/content/manual/manifest.json';
import type { ManualManifest } from './manual-types';
import type { Locale } from './site-config';

export const manualManifest = manifest as unknown as ManualManifest;
export function manualPages(locale:Locale){return manualManifest.languages[locale].groups.flatMap(g=>g.pages);}
export async function readManual(file:string){
  const base=path.join(process.cwd(),'content/manual');
  const target=path.resolve(base,file);
  if(!target.startsWith(base+path.sep))throw new Error('Invalid manual path');
  return fs.readFile(target,'utf8');
}
