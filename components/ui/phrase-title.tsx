'use client';

import { Fragment, useEffect, useState } from 'react';

/**
 * Natural Chinese line breaking.
 *
 * Browsers break CJK text between any two characters, which splits words ("生 | 命科学") and strands punctuation.
 * After mount we segment the text into words with Intl.Segmenter and keep each word on one line (`.w` is nowrap), so a line
 * can only end between words. Closing punctuation stays with the word before it and opening brackets with the word after;
 * Latin runs such as "PD-L1" or "7.2 nM" are single tokens. Before mount (and on the server) the plain text is rendered,
 * so there is no hydration mismatch.
 *
 * - `Phrases` is for headlines: clauses wrap as units, and a comma that would be left dangling at a line end is
 *   drawn as a small gap instead (still in the text for copy and screen readers); a closing comma of a line is dropped.
 * - `Flow` is for running text: words are kept whole, punctuation is left exactly as written.
 */
type Segmenter = { segment(text: string): Iterable<{ segment: string }> };
let segmenter: Segmenter | null | undefined;
const getSegmenter = (): Segmenter | null => {
  if (segmenter === undefined) {
    const Seg = (Intl as unknown as { Segmenter?: new (locale: string, options: { granularity: 'word' }) => Segmenter }).Segmenter;
    segmenter = Seg ? new Seg('zh-CN', { granularity: 'word' }) : null;
  }
  return segmenter;
};
function useSegmenter() {
  const [seg, setSeg] = useState<Segmenter | null>(null);
  useEffect(() => { setSeg(getSegmenter()); }, []);
  return seg;
}

const CJK = /[㐀-鿿]/;
const TOKEN = /([㐀-鿿]+)|(\s+)|([^\s㐀-鿿]+)/g;
const OPENING = /^[「『（《“‘(\[]+$/;
const CLAUSE_END = /[，、；：,;:]$/;
// Typographic rules for single characters the dictionary leaves on their own:
// particles belong to the word before them (的 地 了 …), prepositions and conjunctions to the word after (和 与 对 把 …),
// and any other run of single characters is one word the dictionary simply did not know (评|分, 优|化, 基|序).
const TRAIL = /^[的地得了着过吗呢吧啊嘛]$/;
const LEAD = /^[和与及对把将并在从向给被让用为以而或且]$/;

/** Words of one run of Chinese characters. */
function cjkWords(run: string, seg: Segmenter): string[] {
  const out: string[] = [];
  let loose = false, joinNext = false; // `loose`: the last item is made only of merged single characters
  for (const { segment: part } of seg.segment(run)) {
    if (joinNext && out.length) { out[out.length - 1] += part; joinNext = false; loose = false; continue; }
    if (part.length > 1) {
      // A lone character left in front of a longer word usually belongs to it (优|化能力 → 优化能力).
      if (loose && out.length && out[out.length - 1].length <= 2 && out[out.length - 1].length + part.length <= 6) out[out.length - 1] += part;
      else out.push(part);
      loose = false; continue;
    }
    if (TRAIL.test(part) && out.length) { out[out.length - 1] += part; continue; }
    if (LEAD.test(part)) { out.push(part); joinNext = true; loose = false; continue; }
    if (loose && out.length) { out[out.length - 1] += part; continue; }
    out.push(part); loose = true;
  }
  return out;
}

/** Words of one text run, as strings; whitespace entries are kept so the caller can leave line-break opportunities there. */
function words(text: string, seg: Segmenter): string[] {
  const items: string[] = [];
  let joinNext = false;
  const push = (piece: string) => {
    if (joinNext && items.length) { items[items.length - 1] += piece; joinNext = false; return; }
    items.push(piece);
  };
  for (const [token, cjk, space] of Array.from(text.matchAll(TOKEN), m => [m[0], m[1], m[2]] as const)) {
    if (space) { items.push(token); continue; }
    if (cjk) { for (const word of cjkWords(token, seg)) push(word); continue; }
    // A non-CJK token: opening brackets lead the next word; anything else (Latin, digits, closing marks) is a word of its own,
    // except bare punctuation, which joins the word before it.
    if (OPENING.test(token)) { push(token); joinNext = true; continue; }
    if (/^[^\w]+$/.test(token) && items.length && !/^\s+$/.test(items[items.length - 1])) { items[items.length - 1] += token; continue; }
    push(token);
  }
  return items;
}

/** `tail` rides inside the last word, so it can never wrap onto a line of its own. */
function Words({ text, seg, tail }: { text: string; seg: Segmenter; tail?: React.ReactNode }) {
  const list = words(text, seg);
  const last = list.map(w => /^\s+$/.test(w)).lastIndexOf(false);
  return <>{list.map((w, i) => /^\s+$/.test(w) ? <Fragment key={i}>{w}</Fragment> : <span key={i} className="w">{w}{i === last && tail}</span>)}</>;
}

/** Running text: whole words only. */
export function Flow({ text }: { text: string }) {
  const seg = useSegmenter();
  if (!seg || !CJK.test(text)) return <>{text}</>;
  return <Words text={text} seg={seg} />;
}

/** Headlines: clauses as units, commas as gaps, no comma at the end of a line. An explicit "\n" in the copy is a hard line break. */
export function Phrases({ text }: { text: string }) {
  const seg = useSegmenter();
  if (text.includes('\n')) return <>{text.split('\n').map((line, i) => <Fragment key={i}>{i > 0 && <br />}<Phrases text={line} /></Fragment>)}</>;
  // Only Chinese headlines get the comma-as-gap treatment; English keeps its commas and just wraps at them.
  const zh = CJK.test(text);
  const clauses = text.split(/(?<=[，,、；;：:])/).filter(Boolean);
  if (!zh) return clauses.length < 2 ? <>{text}</> : <>{clauses.map((c, i) => <Fragment key={i}><span className="phrase">{c}</span>{i < clauses.length - 1 && <wbr />}</Fragment>)}</>;
  if (!seg && clauses.length < 2) return <>{text}</>;
  // A headline of one clause needs no wrapper: it can wrap (and balance) freely between words.
  if (clauses.length < 2) { const body = CLAUSE_END.test(text) ? text.slice(0, -1) : text; return seg ? <Words text={body} seg={seg} /> : <>{body}</>; }
  return <>{clauses.map((clause, i) => {
    const last = i === clauses.length - 1, ends = CLAUSE_END.test(clause);
    const body = ends ? clause.slice(0, -1) : clause;
    // The gap that stands in for the comma stays glued to its clause: left on its own it wrapped to the start of the next line as a stray indent.
    const gap = ends && !last ? <span className="pause">{clause.slice(-1)}</span> : null;
    const inner = seg && CJK.test(body) ? <Words text={body} seg={seg} tail={gap} /> : <>{body}{gap}</>;
    return <Fragment key={i}>
      <span className="phrase">{inner}</span>
      {gap && <wbr />}
    </Fragment>;
  })}</>;
}

/** Business placeholders render as this text; sections fall back to confirmed copy instead of showing it. */
export const isPlaceholder = (text: string) => /内容待补充|Content coming soon/.test(text);
