import { Charset } from 'flexsearch';
import type { Locale } from './site-config';
function englishTokens(text:string){
  const words=text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  // Protein sequences can be thousands of characters. Overlapping windows retain
  // every substring while preventing full-token indexing from growing quadratically.
  return words.flatMap(word=>word.length<=32?[word]:Array.from({length:word.length-31},(_,i)=>word.slice(i,i+32)));
}
export function manualSearchOptions(locale:Locale){return locale==='zh'?{tokenize:'full' as const,encoder:Charset.CJK}:{tokenize:'full' as const,encode:englishTokens};}
