import { markedIndices, normalizeText, stripMarkers, tidyText, type Entry } from './collab-types';

const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'IFRAME', 'VIDEO', 'AUDIO']);
const INLINE = new Set(['SPAN', 'B', 'I', 'EM', 'STRONG', 'A', 'BR', 'WBR', 'SUP', 'SUB', 'CODE', 'MARK', 'SMALL', 'U', 'S', 'DEL', 'INS', 'ABBR', 'TIME', 'KBD', 'LABEL']);
const MAX_FREE_TEXT = 3000;

/** A piece of rendered text that is not (or not only) a messages/*.json string: keyed by a hash of its original text. */
type Unit = { key: string; orig: string; applied?: string; saved?: [Text, string][] };
const units = new WeakMap<Element, Unit>();
const originals = new Map<string, string>();
/** Original (published) wording of a free-text unit, for the editor's "restore" and for display. */
export const freeOriginal = (key: string) => originals.get(key);
export const isFreeKey = (key: string) => key.startsWith('x.');
/** True when `node` sits in a unit whose wording is currently replaced by an edit. */
export const isOverridden = (node: Node) => {
  const el = (node.nodeType === 1 ? node as Element : node.parentElement)?.closest('[data-ckey^="x."]');
  return !!el && units.get(el)?.applied !== undefined;
};

function hash(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16) + text.length.toString(36);
}
// Short texts ("40", "·", "A") repeat all over a page, so they are also keyed by where they sit.
const where = (el: Element) => { const out: string[] = []; for (let p: Element | null = el, i = 0; p && i < 4; p = p.parentElement, i++) out.push(p.tagName + '.' + String(p.className).replace(/\s+/g, '.')); return out.join('>'); };
// The same wording in several places (a repeated button label) gets one key per occurrence, in page order; the first keeps the plain key.
function keyFor(el: Element, text: string, used: Set<string>) {
  const base = text.length < 6 ? text + '@' + where(el) : text;
  for (let n = 1; ; n++) { const key = 'x.' + hash(n > 1 ? base + '#' + n : base); if (!used.has(key)) return key; }
}

const textNodes = (el: Element, directOnly: boolean) => {
  const out: Text[] = [];
  if (directOnly) el.childNodes.forEach(n => { if (n.nodeType === 3 && n.nodeValue!.trim()) out.push(n as Text); });
  else { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) if (n.nodeValue!.trim()) out.push(n as Text); }
  return out;
};
const isFlexOrGrid = (el: Element) => { const d = getComputedStyle(el).display; return d.includes('flex') || d.includes('grid'); };

/** All the element's descendants are inline-level text formatting, so the element is one run of text. */
function isTextRun(el: Element) {
  if (el.querySelector('[data-ckey]')) return false;
  for (const d of el.querySelectorAll('*')) {
    if (!INLINE.has(d.tagName) || SKIP.has(d.tagName)) return false;
    const display = getComputedStyle(d).display;
    if (display.includes('flex') || display.includes('grid') || display === 'block') return false;
  }
  return true;
}

/**
 * Makes rendered text editable without touching any component.
 * 1. Elements whose whole text (or aria-label) equals a message string are tagged `data-ckey="<message path>"`;
 *    text shared by several message paths gets the first path and the editor updates all of them together.
 * 2. Everything else (hardcoded strings, content files, demo UI) becomes a free-text unit `data-ckey="x.<hash>"`.
 *    Its edit replaces the text nodes' values in place, so React's DOM structure is never altered.
 */
export function scanEditable(root: ParentNode, textToKeys: Map<string, string[]>, tagKeys: string[], maxLen: number, freeEntries: Record<string, Entry> = {}) {
  root.querySelectorAll('[data-ckey],[data-cblock]').forEach(el => { el.removeAttribute('data-ckey'); el.removeAttribute('data-cblock'); });
  const inUi = (el: Element) => !!el.closest('[data-collab-ui]');
  const marked: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: node => (SKIP.has((node as Element).tagName.toUpperCase()) || inUi(node as Element) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let node = walker.nextNode() as HTMLElement | null; node; node = walker.nextNode() as HTMLElement | null) {
    // Headlines that are split into per-line spans carry the full sentence in aria-label.
    const label = node.getAttribute('aria-label');
    const raw = node.textContent;
    const keys = (label && textToKeys.get(normalizeText(label))) || (raw && raw.length <= maxLen * 2 + 40 ? textToKeys.get(normalizeText(raw)) : undefined);
    if (keys) {
      // Strings shared by several messages carry an invisible marker naming the one this element really renders.
      const named = markedIndices((label ?? '') + (raw ?? '')).map(i => tagKeys[i]).find(k => k && keys.includes(k));
      node.setAttribute('data-ckey', named ?? keys[0]);
      marked.push(node);
    }
  }
  // An outer wrapper with the same text as an inner element is not the text itself...
  for (const el of marked) if (el.querySelector(`[data-ckey="${el.getAttribute('data-ckey')}"]`)) el.removeAttribute('data-ckey');
  // ...but it is where spacing and alignment must go: climb to the outermost element holding exactly this text.
  for (const el of marked) {
    const key = el.getAttribute('data-ckey');
    if (!key) continue;
    const text = normalizeText(el.textContent ?? '');
    let outer = el;
    while (outer.parentElement && outer.parentElement !== document.body && normalizeText(outer.parentElement.textContent ?? '') === text) outer = outer.parentElement;
    outer.setAttribute('data-cblock', key);
  }

  const free = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode: node => {
      const el = node as Element;
      if (SKIP.has(el.tagName.toUpperCase()) || el.hasAttribute('data-ckey') || inUi(el)) return NodeFilter.FILTER_REJECT;
      if (getComputedStyle(el).display === 'none') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const used = new Set<string>();
  for (let el = free.nextNode() as Element | null; el; el = free.nextNode() as Element | null) {
    const direct = textNodes(el, true);
    const wholeRun = !!el.textContent?.trim() && isTextRun(el) && (!isFlexOrGrid(el) || direct.length > 0);
    // A run owns all its text; otherwise the element only owns the text nodes directly inside it.
    let nodes = wholeRun ? textNodes(el, false) : direct;
    // A text that was emptied by an edit has no visible text nodes left; its unit must stay selectable so the edit can be undone.
    const held = units.get(el);
    if (!nodes.length && held?.saved) nodes = held.saved.map(([n]) => n).filter(n => n.isConnected);
    if (!nodes.length) continue;
    const text = stripMarkers(nodes.map(n => n.nodeValue).join(''));
    const prev = units.get(el);
    const known = prev && (normalizeText(text) === normalizeText(prev.orig) || (prev.applied !== undefined && normalizeText(text) === normalizeText(prev.applied)));
    const unit: Unit = known ? prev : { key: keyFor(el, normalizeText(text), used), orig: text.replace(/\s+/g, ' ').trim() };
    if (unit.orig.length > MAX_FREE_TEXT) continue;
    units.set(el, unit);
    used.add(unit.key);
    originals.set(unit.key, unit.orig);
    const raw = freeEntries[unit.key]?.t;
    const desired = raw === undefined ? undefined : tidyText(raw, unit.orig);
    if (desired !== undefined && normalizeText(desired) !== normalizeText(text)) {
      unit.saved ??= nodes.map(n => [n, n.nodeValue!]);
      nodes[0].nodeValue = desired;
      for (let i = 1; i < nodes.length; i++) nodes[i].nodeValue = '';
      unit.applied = desired;
    } else if (desired === undefined && unit.applied !== undefined) {
      unit.saved?.forEach(([n, v]) => { n.nodeValue = v; });
      unit.saved = undefined;
      unit.applied = undefined;
    }
    el.setAttribute('data-ckey', unit.key);
    if (wholeRun) {
      el.setAttribute('data-cblock', unit.key);
      // The run's descendants belong to this unit: resume the walk after the last of them.
      let last: Node = el;
      while (last.lastChild) last = last.lastChild;
      free.currentNode = last;
    }
  }
}
