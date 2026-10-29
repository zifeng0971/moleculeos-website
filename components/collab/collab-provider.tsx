'use client';

import dynamic from 'next/dynamic';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { AbstractIntlMessages } from 'next-intl';
import committed from '@/content/collab-overrides.json';
import { freeOriginal, isFreeKey, isOverridden, scanEditable } from './collab-scanner';
import { applyOverrides, flatten, normalizeText, styleCss, tagSharedMessages, type Entry, type Overrides } from './collab-types';

const COLLAB_URL = (process.env.NEXT_PUBLIC_COLLAB_URL ?? '').replace(/\/$/, '');
const CollabEditor = dynamic(() => import('./collab-editor').then(m => m.CollabEditor), { ssr: false });

type CollabContext = {
  url: string;
  locale: string;
  overrides: Overrides;
  baseText(key: string): string | undefined;
  currentText(key: string): string | undefined;
  /** Every message path whose current text equals the text at `key`. */
  sameTextKeys(key: string): string[];
  setEntry(locale: string, key: string, entry: Entry | null): void;
  replaceAll(overrides: Overrides): void;
  exitEdit(): void;
  /** Re-tag the page now (the editor calls it before resolving a click). */
  rescan(): void;
};
const Ctx = createContext<CollabContext | null>(null);
export const useCollab = () => useContext(Ctx)!;

/**
 * Layers the teammates' edits over the site's messages. Everyone sees the shared draft (fetched from the collab worker);
 * the editor panel is on by default in internal builds, which writes through a live WebSocket.
 */
export function CollabProvider({ locale, base, children }: { locale: string; base: AbstractIntlMessages; children: (messages: AbstractIntlMessages) => React.ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>(committed as Overrides);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!COLLAB_URL) return;
    // Internal builds (collab URL set) are editable by default; "退出" only hides the panel until the pill is clicked.
    try { setEditing(sessionStorage.getItem('collab:off') !== '1'); } catch { setEditing(true); }
    fetch(`${COLLAB_URL}/doc`, { cache: 'no-store' }).then(r => r.json()).then(doc => setOverrides(doc.overrides ?? {})).catch(() => { /* keep the published copy */ });
  }, []);

  const entries = overrides[locale];
  const messages = useMemo(() => applyOverrides(base, entries), [base, entries]);
  const css = useMemo(() => styleCss(entries, editing), [entries, editing]);
  const flat = useMemo(() => flatten(messages), [messages]);
  const baseFlat = useMemo(() => flatten(base), [base]);
  // Message paths whose text is also another message's text: indistinguishable on the page, so they are tagged while editing.
  const tagKeys = useMemo(() => {
    const byText = new Map<string, string[]>();
    flat.forEach((text, key) => { const norm = normalizeText(text); if (norm) byText.set(norm, [...(byText.get(norm) ?? []), key]); });
    // Only wording that people read is tagged: codes, enums, links and ids (kind: "bars", href: "/pricing") are read by the page's logic and must stay exact.
    const readable = (key: string, text: string) => /[A-Z\u3400-\u9fff]|\s/.test(text.trim()) && !/^(\/|#|https?:|mailto:)/.test(text.trim()) && !/(^|\.)(href|url|id|kind|type|icon|src|slug|variant|tone|accent)$/i.test(key);
    return [...byText.values()].filter(keys => keys.length > 1).flat().filter(key => readable(key, flat.get(key) ?? '')).sort();
  }, [flat]);
  const shown = useMemo(() => (editing ? tagSharedMessages(messages, tagKeys) : messages), [editing, messages, tagKeys]);

  const scanRef = useRef<() => void>(() => {});
  const needScan = editing || (entries && Object.keys(entries).length > 0);
  useEffect(() => {
    if (!needScan) return;
    const textToKeys = new Map<string, string[]>();
    let maxLen = 0;
    flat.forEach((text, key) => {
      const norm = normalizeText(text);
      if (!norm) return;
      maxLen = Math.max(maxLen, norm.length);
      textToKeys.set(norm, [...(textToKeys.get(norm) ?? []), key]);
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => scanEditable(document.body, textToKeys, tagKeys, maxLen, entries);
    scanRef.current = run;
    const observer = new MutationObserver(records => {
      // Animated text changes constantly; only new elements, or a text edit of ours being overwritten, warrant a rescan.
      const relevant = records.some(r => {
        if (r.target.parentElement?.closest('[data-collab-ui]') || (r.target as Element).closest?.('[data-collab-ui]')) return false;
        return r.type === 'childList' ? [...r.addedNodes].some(n => n.nodeType === 1 && !(n as Element).closest('[data-collab-ui]')) : isOverridden(r.target);
      });
      if (!relevant) return;
      clearTimeout(timer);
      timer = setTimeout(run, 150);
    });
    run();
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [needScan, flat, entries, tagKeys]);

  const setEntry = useCallback((loc: string, key: string, entry: Entry | null) => setOverrides(prev => {
    const next = { ...prev, [loc]: { ...prev[loc] } };
    if (entry) next[loc][key] = entry; else delete next[loc][key];
    return next;
  }), []);
  const exitEdit = useCallback(() => {
    try { sessionStorage.setItem('collab:off', '1'); } catch { /* ignore */ }
    setEditing(false);
  }, []);
  const enterEdit = () => {
    try { sessionStorage.removeItem('collab:off'); } catch { /* ignore */ }
    setEditing(true);
  };

  const ctx = useMemo<CollabContext>(() => ({
    url: COLLAB_URL, locale, overrides,
    baseText: key => (isFreeKey(key) ? freeOriginal(key) : baseFlat.get(key)),
    currentText: key => (isFreeKey(key) ? entries?.[key]?.t ?? freeOriginal(key) : flat.get(key)),
    sameTextKeys: key => { if (isFreeKey(key)) return [key]; const text = normalizeText(flat.get(key) ?? ''); /* Emptied text is not a "same text" group: it would drag in every other blank message (and every other deleted one). */ if (!text) return [key]; return [...flat].filter(([, t]) => normalizeText(t) === text).map(([k]) => k); },
    setEntry, replaceAll: setOverrides, exitEdit, rescan: () => scanRef.current(),
  }), [locale, overrides, entries, baseFlat, flat, setEntry, exitEdit]);

  return (
    <Ctx.Provider value={ctx}>
      {css && <style data-collab-style dangerouslySetInnerHTML={{ __html: css }} />}
      {children(shown)}
      {editing && <CollabEditor />}
      {COLLAB_URL && !editing && <button data-collab-ui onClick={enterEdit} style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 2147483000, padding: '8px 14px', border: 0, borderRadius: 999, background: '#3e63dd', color: '#fff', font: '13px sans-serif', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>✎ 编辑</button>}
    </Ctx.Provider>
  );
}
