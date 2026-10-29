import { Reveal } from '@/components/motion/reveal';
import { ProteinField } from '@/components/motion/protein-field';
import { Flow, Phrases } from '@/components/ui/phrase-title';

/** Sub-page opener: eyebrow, one large headline, one lead. `fx` adds the faint pointer-reactive residue field behind it. */
export function PageHero({ eyebrow, title, description, fx = false }: { eyebrow: string; title: string; description: string; fx?: boolean }) {
  return <section className="page-hero">
    {fx && <><ProteinField className="px-field" calmSelector=".px-hero-copy" /><div className="px-hero-fade" aria-hidden="true" /></>}
    <div className="site-container relative px-hero-copy"><Reveal><p className="eyebrow">{eyebrow}</p><h1 className="page-hero-title"><Phrases text={title} /></h1><p className="page-hero-lead"><Flow text={description} /></p></Reveal></div></section>;
}
