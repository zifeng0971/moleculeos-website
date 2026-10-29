'use client';

/*
 * Step 02: the real MMetrics panel (native data for this complex) grows over the molecule, then fades away in step 03.
 * Hovering or picking a residue chip lights it on the stage underneath.
 */
import { useEffect, useRef, useState } from 'react';
import { Crosshair, Eye, Layers, Network, Ruler, Trash2, ZoomIn, ZoomOut } from 'lucide-react';
import { MMProvider, DATASETS, rangeIds } from '@/components/hero/mmetrics-dataset';
import { MMetricsSequence } from '@/components/hero/MMetricsSequence';
import { MMetricsPanel, type Scheme } from '@/components/hero/MMetricsPanel';
import { interactionResidue, type InteractionFocus } from '@/components/hero/interaction-focus';
import '@/components/hero/mmetrics.css';
import '@/components/hero/product-surface.css';

const DESIGN_WIDTH = 860;

export type MMHole = { left: number; top: number; width: number; height: number };

export default function OneProteinMM({ onHover, onSelect, onHole, onInteraction }: { onHover: (id: string | null) => void; onSelect: (ids: string[]) => void; onHole: (hole: MMHole) => void; onInteraction: (link: InteractionFocus | null) => void }) {
  const [tab, setTab] = useState('metrics'), [scheme, setScheme] = useState<Scheme>('IMGT');
  const [selected, setSelected] = useState<string[]>([]), [typeFilter, setTypeFilter] = useState<string[] | null>(null);
  const cdr = new Set(DATASETS.KN035.data.cdr[scheme].flatMap(r => rangeIds(r.chain, r.from, r.to)));
  const fit = useRef<HTMLDivElement>(null), root = useRef<HTMLDivElement>(null), touched = useRef(false);
  const [scale, setScale] = useState<{ zoom: number; height: number } | null>(null);
  // The workbench keeps MOS's own proportions: it is laid out at a fixed design width and scaled to the stage.
  useEffect(() => {
    const el = fit.current!;
    const update = () => {
      if (el.clientWidth < 10 || el.clientHeight < 10) return;
      const zoom = el.clientWidth / DESIGN_WIDTH; setScale({ zoom, height: el.clientHeight / zoom });
      // Where the viewport area sits, in stage pixels: the stage paints its dark viewport backing there, under the molecule.
      requestAnimationFrame(() => {
        const hole = el.querySelector<HTMLElement>('.op-mm-hole'), stage = el.closest('.op');
        if (!hole || !stage) return;
        const a = stage.getBoundingClientRect(), b = hole.getBoundingClientRect();
        // The stage can be mid-transform (it tilts and scales as it scrolls in), which scales every client rect: divide that out so the numbers are layout pixels.
        const sx = (stage as HTMLElement).offsetWidth ? a.width / (stage as HTMLElement).offsetWidth : 1, sy = (stage as HTMLElement).offsetHeight ? a.height / (stage as HTMLElement).offsetHeight : 1;
        const rect = { left: (b.left - a.left) / sx, top: (b.top - a.top) / sy, width: b.width / sx, height: b.height / sy };
        if (Object.values(rect).every(Number.isFinite) && rect.width > 0 && rect.height > 0) onHole(rect);
      });
    };
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, [onHole]);
  const choose = (next: string[]) => { setSelected(next); onSelect(next); };
  const interact = (link: InteractionFocus | null) => { choose(link ? [interactionResidue(link.a), interactionResidue(link.b)] : []); onInteraction(link); };
  const toggle = (value: string) => choose(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]);
  const toggleGroup = (values: string[]) => choose(values.every(v => selected.includes(v)) ? selected.filter(v => !values.includes(v)) : [...new Set([...selected, ...values])]);

  // A short guided scroll through the panel (annotations, then the interaction network); any touch by the viewer stops it.
  useEffect(() => {
    const scroller = () => root.current?.querySelector<HTMLElement>('.mm-panel-scroll');
    const to = (sec: string) => {
      const box = scroller(), el = root.current?.querySelector<HTMLElement>(`[data-sec="${sec}"]`);
      if (!box || !el || touched.current) return;
      box.scrollTo({ top: el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 6, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    const a = setTimeout(() => to('annotations'), 1400), b = setTimeout(() => to('network'), 5200);
    const stop = () => { touched.current = true; };
    const box = scroller();
    box?.addEventListener('wheel', stop, { passive: true }); box?.addEventListener('pointerdown', stop);
    return () => { clearTimeout(a); clearTimeout(b); box?.removeEventListener('wheel', stop); box?.removeEventListener('pointerdown', stop); };
  }, []);
  useEffect(() => () => { onHover(null); onSelect([]); }, [onHover, onSelect]);

  const tools = [ZoomIn, ZoomOut, Crosshair, Layers, Network, Ruler, Trash2, Eye];
  return <div ref={fit} className="op-mm-fit"><div ref={root} className="mm-mos mos-scale-inner op-mm-body" style={scale ? { width: DESIGN_WIDTH, height: scale.height, zoom: scale.zoom } : undefined}>
    <div className="mm-demo op-mm-demo"><MMProvider dataset={DATASETS.KN035}>
      <div className="mm-structure">
        <MMetricsSequence selected={selected} hover={onHover} toggle={toggle} cdr={cdr} />
        <div className="mm-viewport op-mm-hole" aria-hidden="true"><div className="mm-toolbar">{tools.map((Icon, i) => <Icon key={i} size={18} />)}</div></div>
      </div>
      <MMetricsPanel onInteraction={interact} tab={tab} setTab={setTab} selected={selected} toggle={toggle} toggleGroup={toggleGroup} scheme={scheme} setScheme={setScheme} setSelection={choose} focusResidue={() => {}}
        typeFilter={typeFilter} setTypeFilter={setTypeFilter} hover={onHover} notice={() => {}} />
    </MMProvider></div>
  </div></div>;
}
