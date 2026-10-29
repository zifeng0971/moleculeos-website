import type { AbstractIntlMessages } from 'next-intl';

/** Text/layout edits made by teammates, layered over messages/*.json at runtime. */
export const STYLE_PROPS = ['fontSize', 'fontWeight', 'color', 'textAlign', 'lineHeight', 'letterSpacing', 'marginTop', 'marginBottom', 'hidden'] as const;
export type StyleProp = (typeof STYLE_PROPS)[number];
export type StyleMap = Partial<Record<StyleProp, string>>;
/** `o` is the original wording of free-text edits (keys starting "x."), which are not messages/*.json paths. */
export type Entry = { t?: string; o?: string; s?: StyleMap; by?: string; at?: number };
/** locale -> message path ("home.trust.label", arrays by index) -> edit */
export type Overrides = Record<string, Record<string, Entry>>;
export type Version = { at: number; by: string; locale: string; key: string; prev: Entry | null; next: Entry | null };
export type CollabDoc = { rev: number; overrides: Overrides };
export type Peer = { id: string; name: string; color: string; locale: string | null; key: string | null };

const CSS_PROP: Record<Exclude<StyleProp, 'hidden'>, string> = {
  fontSize: 'font-size', fontWeight: 'font-weight', color: 'color', textAlign: 'text-align',
  lineHeight: 'line-height', letterSpacing: 'letter-spacing', marginTop: 'margin-top', marginBottom: 'margin-bottom',
};
// Values arrive from other people's browsers, so only plain CSS value characters get into the stylesheet.
const SAFE_VALUE = /^[\w#%.,() -]{1,40}$/;
const SAFE_KEY = /^[\w.-]{1,200}$/;
export const isSafeKey = (key: string) => SAFE_KEY.test(key);
export const isSafeValue = (value: string) => SAFE_VALUE.test(value);

// Invisible markers that name the message path behind a string that several messages share (see tagSharedMessages).
const MARK = '\u2063';
const BIT = ['\u200b', '\u200c'];
const MARKER = /\u2063[\u200b\u200c]{16}\u2063/g;
const MARKER_OR_SPACE = /\s+|[\u2063\u200b\u200c]/g;
export const stripMarkers = (text: string) => text.replace(MARKER, '');
const encodeIndex = (i: number) => MARK + i.toString(2).padStart(16, '0').replace(/[01]/g, b => BIT[+b]) + MARK;
/** The message-table indices named by the markers inside `text`, in order. */
export const markedIndices = (text: string) => (text.match(MARKER) ?? []).map(m => parseInt([...m.slice(1, 17)].map(c => (c === BIT[1] ? '1' : '0')).join(''), 2));

/** Whitespace-free form used to match rendered text to message strings (line breaks in messages render as nothing or a space). */
export const normalizeText = (text: string) => text.replace(MARKER_OR_SPACE, '');

// A dot with only spaces around it, at either end of the text.
const TRAILING_DOT = /\s*[·・•∙][\s·・•∙]*$/;
const LEADING_DOT = /^[\s·・•∙]*[·・•∙]\s*/;
/**
 * A dangling separator dot ("设计分子·") is never wanted at the end of a label: drop it from the ends of an edit unless the
 * original wording has one there itself. Never reduces the text to nothing, so deleting a text still works.
 */
export function tidyText(text: string, original?: string): string {
  let out = text;
  if (!original || !TRAILING_DOT.test(original)) { const cut = out.replace(TRAILING_DOT, ''); if (cut.trim()) out = cut; }
  if (!original || !LEADING_DOT.test(original)) { const cut = out.replace(LEADING_DOT, ''); if (cut.trim()) out = cut; }
  return out;
}

/** Every string leaf of a messages tree, keyed by dotted path. */
export function flatten(node: unknown, prefix = '', out = new Map<string, string>()): Map<string, string> {
  if (typeof node === 'string') { if (prefix) out.set(prefix, node); }
  else if (Array.isArray(node)) node.forEach((item, i) => flatten(item, prefix ? `${prefix}.${i}` : String(i), out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) if (!k.includes('.')) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

/** Copy-on-write: only the objects along an edited path are cloned. */
export function applyOverrides(messages: AbstractIntlMessages, entries: Record<string, Entry> | undefined): AbstractIntlMessages {
  if (!entries) return messages;
  const edits = Object.entries(entries).filter(([, e]) => typeof e.t === 'string');
  if (!edits.length) return messages;
  const root: Record<string, unknown> = { ...messages };
  for (const [path, entry] of edits) {
    const parts = path.split('.');
    let cur: any = root;
    let ok = true;
    for (let i = 0; i < parts.length - 1 && ok; i++) {
      const next = cur[parts[i]];
      if (next && typeof next === 'object') cur = cur[parts[i]] = Array.isArray(next) ? [...next] : { ...next };
      else ok = false;
    }
    if (ok && typeof cur[parts[parts.length - 1]] === 'string') cur[parts[parts.length - 1]] = tidyText(entry.t as string, cur[parts[parts.length - 1]]);
  }
  return root as AbstractIntlMessages;
}

// Spacing, alignment and visibility belong to the outermost element that holds only this text (data-cblock);
// the glyph properties go on the innermost one (data-ckey), which is where the component sets its own font.
const BLOCK_PROPS = new Set<StyleProp>(['textAlign', 'lineHeight', 'marginTop', 'marginBottom', 'hidden']);

/** CSS for the layout edits; hidden text stays visible but faded while editing so it can be restored. */
export function styleCss(entries: Record<string, Entry> | undefined, editing: boolean): string {
  let css = '';
  for (const [path, entry] of Object.entries(entries ?? {})) {
    if (!entry.s || !isSafeKey(path)) continue;
    const glyph: string[] = [];
    const block: string[] = [];
    for (const [prop, value] of Object.entries(entry.s) as [StyleProp, string][]) {
      if (!value || !isSafeStyle(prop, value)) continue;
      const decl = prop === 'hidden' ? (editing ? 'opacity:.3' : 'display:none') : CSS_PROP[prop] && `${CSS_PROP[prop]}:${value}`;
      if (decl) (BLOCK_PROPS.has(prop) ? block : glyph).push(`${decl}!important`);
    }
    if (glyph.length) css += `[data-ckey="${path}"][data-ckey]{${glyph.join(';')}}\n`;
    if (block.length) css += `[data-cblock="${path}"][data-cblock]{${block.join(';')}}\n`;
  }
  return css;
}

/**
 * Texts that two or more messages share cannot be told apart from the page, so in edit mode each such string gets an invisible
 * prefix naming its own message path; the scanner reads it back to know exactly which message an element renders.
 */
export function tagSharedMessages(messages: AbstractIntlMessages, keys: string[]): AbstractIntlMessages {
  if (!keys.length) return messages;
  const root: Record<string, unknown> = { ...messages };
  keys.forEach((path, index) => {
    const parts = path.split('.');
    let cur: any = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const next = cur?.[parts[i]];
      if (!next || typeof next !== 'object') return;
      cur = cur[parts[i]] = Array.isArray(next) ? [...next] : { ...next };
    }
    const last = parts[parts.length - 1];
    if (typeof cur[last] === 'string' && cur[last]) cur[last] = encodeIndex(index) + cur[last];
  });
  return root as AbstractIntlMessages;
}

// A line height or font size typed digit by digit passes through values (0, 1) that wreck the page for everyone watching.
const MIN: Partial<Record<StyleProp, number>> = { lineHeight: 0.5, fontSize: 6 };
export function isSafeStyle(prop: string, value: string): boolean {
  if (!isSafeValue(value)) return false;
  const min = MIN[prop as StyleProp];
  return min === undefined || (parseFloat(value) >= min);
}
