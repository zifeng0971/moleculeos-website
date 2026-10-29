'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SITE_CONFIG, type Locale } from '@/lib/site-config';
import { AgentDemo } from '@/components/hero/AgentDemo';
import { ProteinField } from '@/components/motion/protein-field';
import { Flow, Phrases } from '@/components/ui/phrase-title';
import { CTAButton } from '@/components/ui/cta-button';

const delay = (seconds: number) => ({ '--enter-delay': `${seconds.toFixed(2)}s` }) as CSSProperties;

export function HeroSection({ locale }: { locale: Locale }) {
  const t = useTranslations('home.hero');
  const common = useTranslations('common');
  const titleParts = t('title').split('\n');
  const sectionRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // On the first screen the workbench lies on the floor under the copy like a mat seen from above, its far edge tilted away.
  // Scrolling to the second screen lifts it into place full size and stands it upright. Same state on both screens.
  const { scrollYProgress: lift } = useScroll({ target: demoRef, offset: ['start end', 'start start'] });
  const FLAT_TILT = 42;
  // Vertical compression while flat (gentle, so the content keeps its look). The workbench is placed so Mocha's four module
  // cards end CARDS_CLEAR px above the bottom of the screen; the rest simply runs past it.
  const SQUASH = 0.55, CARDS_CLEAR = 20;
  // While flat it keeps its full width (the near edge, on the tilt axis, is as wide as the upright workbench) and is compressed
  // vertically (nothing cropped) to fit the space; it regains its proportions as it stands.
  // Fit on the first screen: start from a rough lift, then measure the painted (projected) cards and shift the workbench so
  // they end CARDS_CLEAR px above the bottom of the screen. Only while fully flat.
  const [flatY, setFlatY] = useState(-400);
  useEffect(() => {
    let raf = 0, tries = 0;
    const settle = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { raf = requestAnimationFrame(correct); }); };
    const correct = () => {
      const cards = document.querySelector('.hero-demo-squash .mocha-welcome-modules')?.getBoundingClientRect();
      if (!cards || lift.get() > 0.01 || tries++ > 10) return;
      const off = innerHeight - CARDS_CLEAR - cards.bottom;
      if (Math.abs(off) > 1) { setFlatY(current => current + off); settle(); }
    };
    const fit = () => {
      const stage = demoRef.current;
      if (!stage) return;
      const box = stage.getBoundingClientRect(), top = box.top + scrollY;
      tries = 0;
      setFlatY(innerHeight - (top + box.height * 0.7));
      settle();
    };
    fit(); addEventListener('resize', fit);
    // Back at the very top (e.g. after a restored scroll position skipped the first fit), check again.
    const unsubscribe = lift.on('change', value => { if (value < 0.005) { tries = 0; settle(); } });
    // The copy settles after its entrance animation; re-check then.
    const late = window.setTimeout(() => { tries = 0; correct(); }, 1600);
    return () => { removeEventListener('resize', fit); unsubscribe(); cancelAnimationFrame(raf); window.clearTimeout(late); };
  }, [lift]);
  const rotateX = useTransform(lift, [0, 0.9], [FLAT_TILT, 0]);
  const y = useTransform(lift, [0, 0.9], [flatY, 0]);
  const scaleY = useTransform(lift, [0, 0.9], [SQUASH, 1]);
  const { scrollYProgress: heroProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const copyY = useTransform(heroProgress, [0, 0.4], [0, -60]);
  const copyOpacity = useTransform(heroProgress, [0, 0.32], [1, 0]);

  return (
    <section ref={sectionRef} className="hero-section relative overflow-clip" data-nav-section="platform">
      <ProteinField className="hero-canvas" fieldBottomSelector=".hero-demo-tilt" fadeWidthSelector=".hero-title-line-a" fadeHeightSelector=".hero-title" residueTip residueHref={SITE_CONFIG.platformUrl} residueAction={common('start')} />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-composition site-container relative">
        {/* Two screens: the headline alone first, then the workbench on its own. Each is a snap stop. */}
        <div className="hero-screen">
        {/* Entrance runs in CSS so the headline paints before hydration; motion only drives the scroll fade. */}
        <motion.div className="hero-copy" style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity }}>
          {/* The product name is set as the wordmark; the tagline after " · " stays quiet. */}
          <p className="hero-pill hero-enter" style={delay(0.1)}>
            <span className="hero-pill-brand"><span>Molecule</span><b>OS</b></span>
            <span className="hero-pill-tag">{t('eyebrow').split(' · ').slice(1).join(' · ')}</span>
          </p>
          <h1 className="hero-title text-balance [hyphens:none]" data-locale={locale} aria-label={titleParts.join(locale === 'en' ? ' ' : '')}>
            {titleParts.map((part, index) => (
              <span key={part} aria-hidden="true" style={delay(0.22 + index * 0.12)}
                className={`hero-title-line hero-enter ${index === titleParts.length - 1 ? 'hero-title-line-b' : 'hero-title-line-a'}`}>
                <Phrases text={part} />
              </span>
            ))}
          </h1>
          <p className="hero-description hero-enter" style={delay(0.46)}><Flow text={t('description')} /></p>
          <div className="hero-cta hero-enter" style={delay(0.58)}><CTAButton locale={locale} /></div>
        </motion.div>
        </div>
        <div className="hero-demo-screen">
          <div ref={demoRef} className="hero-demo-column hero-demo-stage min-w-0">
            <div className="hero-demo-halo" aria-hidden="true" />
            {/* Outer: position (it carries the perspective, viewed from above). Then the tilt about the bottom edge. */}
            <motion.div className="hero-demo-tilt" style={reduceMotion ? undefined : { y }}>
              <motion.div className="hero-demo-plane" style={reduceMotion ? undefined : { rotateX }}>
                {/* Squashed before the tilt (an inner layer), so the mat is physically shorter rather than flattened on screen. */}
                <motion.div className="hero-demo-squash" style={reduceMotion ? undefined : { scaleY }}>
                  <div className="demo-edge"><AgentDemo /></div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
