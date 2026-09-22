import { Reveal } from '@/components/motion/reveal';

export function PageHero({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <section className="relative overflow-hidden border-b border-border bg-surface py-24"><div className="ambient-glow -right-40 -top-36 size-[36rem]"/><div className="site-container relative"><Reveal><p className="eyebrow">{eyebrow}</p><h1 className="section-title">{title}</h1><p className="mt-6 max-w-[680px] text-lg leading-[1.85] text-muted-foreground">{description}</p></Reveal></div></section>;
}
