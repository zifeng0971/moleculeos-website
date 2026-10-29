'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function staggerDelay(index: number, count: number) {
  return index * (count > 6 ? 0.06 : 0.09);
}

/** A quiet fade-up. `blur` opts back into the soft blur-in; it is off by default (and must stay off over WebGL canvases). */
export function Reveal({ children, className, delay = 0, blur = false }: { children: React.ReactNode; className?: string; delay?: number; blur?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={blur ? undefined : { filter: 'none' }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, ...(blur && { filter: 'blur(10px)' }) }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, ...(blur && { filter: 'blur(0px)' }) }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -8% 0px' }}
      transition={{ duration: reduceMotion ? 0.15 : 0.9, delay: reduceMotion ? 0 : delay, ease: [0.28, 0.11, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
