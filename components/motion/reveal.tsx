'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function staggerDelay(index: number, count: number) {
  return index * (count > 6 ? 0.06 : 0.09);
}

/** `blur: false` skips the blur-in, for content (like WebGL canvases) that composites badly under an animated filter. */
export function Reveal({ children, className, delay = 0, blur = true }: { children: React.ReactNode; className?: string; delay?: number; blur?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={blur ? undefined : { filter: 'none' }}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, ...(blur && { filter: 'blur(10px)' }) }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, ...(blur && { filter: 'blur(0px)' }) }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -8% 0px' }}
      transition={{ duration: reduceMotion ? 0.15 : 1.05, delay: reduceMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
