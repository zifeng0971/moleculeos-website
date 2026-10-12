import { Fragment } from 'react';

/**
 * Keeps CJK headlines from breaking mid-word: each comma-delimited phrase stays together
 * (inline-block), so lines wrap at the punctuation instead of splitting a word like 成|果.
 */
export function Phrases({ text }: { text: string }) {
  const parts = text.split(/(?<=[，,、；;：:])/);
  if (parts.length < 2) return <>{text}</>;
  return <>{parts.map((part, i) => <Fragment key={i}><span className="phrase">{part}</span>{i < parts.length - 1 && <wbr />}</Fragment>)}</>;
}

/** Business placeholders render as this text; sections fall back to confirmed copy instead of showing it. */
export const isPlaceholder = (text: string) => /内容待补充|Content coming soon/.test(text);
