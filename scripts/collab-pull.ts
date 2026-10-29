import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Entry = { t?: string; o?: string; s?: Record<string, string> };

/** Publishes the teammates' shared draft: snapshots it into content/collab-overrides.json so the next build bakes it in. */
async function main() {
  const url = (process.env.NEXT_PUBLIC_COLLAB_URL ?? process.argv[2] ?? '').replace(/\/$/, '');
  if (!url) throw new Error('Set NEXT_PUBLIC_COLLAB_URL or pass the collab worker URL as the first argument.');
  const doc = await (await fetch(`${url}/doc`)).json() as { rev: number; overrides: Record<string, Record<string, Entry>> };
  const snapshot = Object.fromEntries(['zh', 'en'].map(locale => {
    const entries = doc.overrides[locale] ?? {};
    return [locale, Object.fromEntries(Object.keys(entries).sort().map(key => [key, { t: entries[key].t, o: entries[key].o, s: entries[key].s }]))];
  }));
  writeFileSync(resolve('content/collab-overrides.json'), JSON.stringify(snapshot, null, 2) + '\n');
  for (const [locale, entries] of Object.entries(snapshot)) {
    const list = Object.values(entries);
    console.log(`${locale}: ${list.filter(e => e.t !== undefined).length} text edits, ${list.filter(e => e.s).length} layout edits`);
  }
  console.log(`Saved revision ${doc.rev} to content/collab-overrides.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
