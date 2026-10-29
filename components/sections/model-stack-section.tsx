'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { localizeHref, type Locale } from '@/lib/site-config';
import { Reveal } from '@/components/motion/reveal';
import { Flow, Phrases } from '@/components/ui/phrase-title';

type Layer = { role: string; name: string; body: string; chips: string[] };

/**
 * Exploded view of the model system. On desktop the section pins while scrolling:
 * the three layers separate, then light up bottom-up (MMFold understands → MMDesign designs → MoleculeOS orchestrates).
 */
export function ModelStackSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.models');
  const copy = t.raw('layers') as Layer[];
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [pinned, setPinned] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    // Pinned, the whole scene must fit one screen; a shorter window gets the plain flowing layout instead.
    const media = matchMedia('(min-width: 1024px) and (min-height: 720px)');
    const update = () => setPinned(media.matches && !reduce);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [reduce]);

  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end end'] });
  const spread = useTransform(scrollYProgress, [0.02, 0.3], [0, 1]);
  const tilt = useTransform(scrollYProgress, [0, 1], [-34, -46]);
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (!pinned) return;
    setActive(value < 0.42 ? 0 : value < 0.7 ? 1 : 2);
  });

  // Steps follow the build-up order: understanding first, then design, then the system that runs both.
  // Module hues (lib/palette.ts): MMFold reads structure, MMDesign designs, MoleculeOS is the agent layer.
  const tones = ['structure', 'design', 'agent'];
  const art = ['mmfold', 'mmdesign', 'moleculeos'];
  const layers = copy.map((layer, i) => ({ key: layer.name, title: layer.role, body: layer.body, chips: layer.chips, name: layer.name, tone: tones[i] }));
  // Pinned, the lit layer follows the scroll, so choosing one means scrolling to its stop: layers already spread, that one lit.
  const STOPS = [0.3, 0.65, 1];
  const select = (i: number) => {
    setActive(i);
    const node = root.current;
    if (!pinned || !node) return;
    const top = node.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + STOPS[i] * (node.offsetHeight - innerHeight), behavior: 'smooth' });
  };
  const sceneStyle = (pinned ? { '--spread': spread, '--tilt': tilt } : { '--spread': 1, '--tilt': -40 }) as unknown as CSSProperties;

  return <section ref={root} className="model-stack" data-pinned={pinned || undefined} data-nav-section="models">
    {/* Snap stops, one per lit layer (scroll offsets 60vh, 130vh, 200vh of the pinned run, matching STOPS). */}
    {pinned && <div className="model-stack-snaps" aria-hidden="true"><span /><span /><span /></div>}
    <div className="model-stack-sticky">
      <div className="site-container model-stack-grid">
        <div className="model-stack-copy">
          <Reveal><p className="eyebrow eyebrow-solid">{t('eyebrow')}</p><h2 className="section-title"><Phrases text={t('title')} /></h2><p className="section-copy"><Flow text={t('description')} /></p></Reveal>
          {/* Listed top-down like the plates on the right (highest layer first); the highlight climbs from the bottom as you scroll. */}
          <ol className="model-stack-steps">
            {layers.map((layer, i) => <li key={layer.key} data-active={!pinned || active === i || undefined} data-tone={layer.tone} onClick={() => select(i)}>
              <h3><Phrases text={layer.title} /></h3>
              <p><Flow text={layer.body} /></p>
            </li>).reverse()}
          </ol>
          {/* Entry to the full model system is hidden for now; restore the link below to bring it back.
          <Link href={localizeHref('/platform#models', locale)} className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[var(--accent-text)] transition-colors hover:text-white">
            {t('viewSystem')}<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          */}
        </div>
        <div className="model-stack-scene" aria-hidden="true">
          <motion.div className="model-stack-rig" style={sceneStyle}>
            {layers.map((layer, i) => <div key={layer.key} className="model-plate" data-tone={layer.tone} data-active={!pinned || active === i || undefined} style={{ '--i': i } as CSSProperties} onClick={() => select(i)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="model-plate-art" src={`/brand/model-stack/${art[i]}.webp?v=2`} alt="" width={1200} height={750} loading="lazy" decoding="async" draggable={false} />
              <span className="model-plate-name">{layer.name}</span>
              <div className="model-plate-chips">{layer.chips.map(chip => <span key={chip}>{chip}</span>)}</div>
            </div>)}
          </motion.div>
          <div className="model-stack-floor" />
        </div>
      </div>
    </div>
  </section>;
}
