'use client';

/* eslint-disable @typescript-eslint/no-unused-vars -- Link, ArrowRight, localizeHref and locale belong to the hidden
   "view the model system" link below, kept so it can be restored as is. */
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
 * the stack is built up layer by layer, each plate dropping onto the one below and lighting up as it lands: MMFold (understands)
 * at the bottom → MMDesign (designs) → MoleculeOS (orchestrates) on top. The list reads in the same order, 01 to 03.
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

  // Autoplay: while the section is pinned on screen and the page has been still for a moment, the stack keeps building on its
  // own (01 → 02 → 03), lingers complete, then starts again from the bottom layer. Any scroll hands control back at once.
  const activeRef = useRef(active); activeRef.current = active;
  useEffect(() => {
    if (!pinned) return;
    const node = root.current!;
    // How long each stage holds (ms); the full stack lingers longer before it rebuilds.
    const HOLD = [2700, 2700, 4200], SETTLE = 1200;
    let still = performance.now(), due = 0;
    const wake = () => { still = performance.now(); due = 0; };
    addEventListener('scroll', wake, { passive: true });
    const timer = window.setInterval(() => {
      const box = node.getBoundingClientRect(), now = performance.now();
      if (document.hidden || box.top > 1 || box.bottom < innerHeight - 1 || now - still < SETTLE) { due = 0; return; }
      if (!due) { due = now + HOLD[activeRef.current]; return; }
      if (now >= due) { due = 0; setActive(i => (i + 1) % HOLD.length); }
    }, 250);
    return () => { window.clearInterval(timer); removeEventListener('scroll', wake); };
  }, [pinned]);

  // Leaving from the last layer takes a fresh scroll. A trackpad's momentum keeps sending wheel events after the page has snapped
  // to layer 03, and those used to carry straight on to screen 5. Chrome lets a page cancel only the first wheel event of a
  // gesture, so instead the page stops scrolling for as long as that gesture keeps going: when it settles on layer 03 while wheel
  // events are still arriving (or one arrives within 300ms), scrolling is paused until they stop for 200ms (at most 1.2s). The
  // next scroll then moves on.
  useEffect(() => {
    if (!pinned) return;
    const node = root.current!, html = document.documentElement;
    // At layer 03: its snap stop sits at the top of the viewport, below the nav (the page's scroll-padding).
    const stop = node.querySelector<HTMLElement>('.model-stack-snaps span:last-child');
    const atEnd = () => !!stop && Math.abs(stop.getBoundingClientRect().top - parseFloat(getComputedStyle(html).scrollPaddingTop || '0')) < 3;
    let last = 0, landed = -Infinity, held = 0, quiet = 0;
    const release = () => { window.clearTimeout(quiet); window.clearTimeout(held); held = 0; html.style.overflow = ''; };
    const hold = () => { html.style.overflow = 'hidden'; held = window.setTimeout(release, 1200); quiet = window.setTimeout(release, 200); };
    const settle = () => { if (!atEnd()) return; landed = performance.now(); if (!held && landed - last < 150) hold(); };
    const wheel = (event: WheelEvent) => {
      last = performance.now();
      // A wheel right after settling there is still the same flick, even if it arrived a beat late.
      if (!held && event.deltaY > 0 && last - landed < 300 && atEnd()) hold();
      if (!held) return;
      if (event.cancelable) event.preventDefault();
      window.clearTimeout(quiet); quiet = window.setTimeout(release, 200);
    };
    addEventListener('scrollend', settle);
    addEventListener('wheel', wheel, { passive: false });
    return () => { release(); removeEventListener('scrollend', settle); removeEventListener('wheel', wheel); };
  }, [pinned]);

  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end end'] });
  const spread = useTransform(scrollYProgress, [0.02, 0.3], [0, 1]);
  const tilt = useTransform(scrollYProgress, [0, 1], [-34, -46]);
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (!pinned) return;
    setActive(value < 0.42 ? 0 : value < 0.7 ? 1 : 2);
  });

  // Build-up order: understanding first, then design, then the system that runs both.
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
          {/* Listed in build-up order (01 understanding first) and lit in that order as you scroll, while the matching plate lands on
              the stack. Each item carries its plate's name, so the two sides can be matched at a glance. */}
          <ol className="model-stack-steps">
            {layers.map((layer, i) => <li key={layer.key} data-active={!pinned || active === i || undefined} data-tone={layer.tone} onClick={() => select(i)}>
              <p className="model-stack-kicker"><span>{String(i + 1).padStart(2, '0')}</span><em>{layer.name}</em></p>
              <h3><Phrases text={layer.title} /></h3>
              <p><Flow text={layer.body} /></p>
            </li>)}
          </ol>
          {/* Entry to the full model system is hidden for now; restore the link below to bring it back.
          <Link href={localizeHref('/platform#models', locale)} className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-[var(--accent-text)] transition-colors hover:text-white">
            {t('viewSystem')}<ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          */}
        </div>
        <div className="model-stack-scene" aria-hidden="true">
          <motion.div className="model-stack-rig" style={sceneStyle}>
            {layers.map((layer, i) => <div key={layer.key} className="model-plate" data-tone={layer.tone} data-active={!pinned || active === i || undefined} data-shown={!pinned || i <= active || undefined} style={{ '--i': i } as CSSProperties} onClick={() => select(i)}>
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
