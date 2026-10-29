'use client';

import parse, { attributesToProps, domToReact, Element, type DOMNode, type HTMLReactParserOptions } from 'html-react-parser';
import { useState } from 'react';
import { interactionKey, type InteractionFocus } from './interaction-focus';
import type { MMRecord } from './mmetrics-dataset';

/** Render the captured MOS SVG, changing interaction state only, never its layout. */
export function MMetricsNativeNetwork({ svg, pair, hover, toggle, selected, active, setActive, filtered, onInteraction }: {
  svg: string; pair: MMRecord['interactions'][number];
  hover: (id: string | null) => void; toggle: (id: string) => void;
  selected: string[]; active: string | null; setActive: (key: string | null) => void; filtered: boolean; onInteraction?: (link: InteractionFocus | null) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const visible = (a: string, b: string, category: string) => pair.links.some(link => link.a === a && link.b === b && link.category === category);
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return;
      const attrs = node.attribs;
      const children = () => domToReact(node.children as DOMNode[], options);
      if (node.name === 'svg') {
        return <svg {...attributesToProps(attrs)} className="mm-native-net" data-native-mos="KN035" aria-label={`Chain ${pair.a} – Chain ${pair.b} interactions`}>{children()}</svg>;
      }
      if (node.name === 'g' && attrs['data-residue-id']) {
        const residue = attrs['data-residue-id'], key = attrs['data-residue-key'];
        const used = pair.links.some(link => link.a === key || link.b === key);
        const neighbour = pair.links.some(link => (link.a === active && link.b === key) || (link.b === active && link.a === key));
        const dim = (filtered && !used) || (!!active && active !== key && !neighbour);
        const enter = () => { setActive(key); hover(residue); };
        const leave = () => { setActive(null); hover(null); };
        const activate = () => { setPicked(null); onInteraction?.(null); toggle(residue); };
        return <g {...attributesToProps(attrs)} className="mm-native-node" role="button" tabIndex={0}
          aria-label={`${attrs['data-residue-name']} ${residue.replace(':', '')}`} aria-pressed={selected.includes(residue)} opacity={dim ? 0.3 : attrs.opacity}
          onMouseEnter={enter} onMouseLeave={leave} onFocus={enter} onBlur={leave} onClick={activate}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }}>{children()}</g>;
      }
      if (node.name === 'g' && attrs['data-link-category']) {
        const a = attrs['data-link-a'], b = attrs['data-link-b'];
        if (!visible(a, b, attrs['data-link-category'])) return <g data-filtered-link={attrs['data-link-category']} />;
        const link = pair.links.find(link => link.a === a && link.b === b && link.category === attrs['data-link-category'])!;
        const key = interactionKey(link), on = picked === key;
        const lit = picked ? on : !active || active === a || active === b;
        const activate = () => { setPicked(on ? null : key); onInteraction?.(on ? null : link); };
        const line = node.children.find(child => child instanceof Element && child.name === 'line') as Element | undefined;
        return <g {...attributesToProps(attrs)} className="mm-native-link" role="button" tabIndex={0}
          aria-label={`${a} – ${b}, ${link.category}, ${link.distance.toFixed(2)} Å`} aria-pressed={on}
          opacity={lit ? attrs.opacity : 0.15} onClick={activate}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }}>
          {line && <line {...attributesToProps(line.attribs)} stroke="transparent" strokeWidth={16} className="mm-native-link-hit" />}
          {children()}
        </g>;
      }
    },
  };
  return <>{parse(svg, options)}</>;
}
