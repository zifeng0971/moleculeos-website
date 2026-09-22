'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';

export function FlywheelSection() {
  const t = useTranslations('home.flywheel');
  const reduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const nodes = [
    { x: 300, y: 160, dx: 0, dy: -1, anchor: 'middle' as const, key: 'design' },
    { x: 421.24, y: 370, dx: 0.866, dy: 0.5, anchor: 'start' as const, key: 'experiment' },
    { x: 178.76, y: 370, dx: -0.866, dy: 0.5, anchor: 'end' as const, key: 'evolve' },
  ];
  return (
    <section className="section-space relative overflow-hidden " data-nav-section="models">
      <div className="site-container grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        <Reveal className="[&_.eyebrow]:!bg-none [&_.eyebrow]:!text-brand"><SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('description')} /></Reveal>
        {/* 140px ring radius is 20% smaller; viewBox reserves 160px label safety margins. */}
        <motion.svg viewBox="0 0 600 600" className="mx-auto h-auto w-full max-w-[42rem]" role="img" aria-label={`${t('design')} → ${t('experiment')} → ${t('evolve')}`} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
          <defs>
            <linearGradient id={`${id}-brand`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#4A38E0"/><stop offset="52%" stopColor="#8164D2"/><stop offset="100%" stopColor="#C063B3"/></linearGradient>
            <linearGradient id={`${id}-subtle`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#6D4AFF" stopOpacity="0.16"/><stop offset="100%" stopColor="#C063B3" stopOpacity="0.16"/></linearGradient>
            <radialGradient id={`${id}-glow`}><stop stopColor="var(--accent-glow)"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></radialGradient>
            <filter id={`${id}-blur`} x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="60"/></filter>
          </defs>
          <circle cx="300" cy="300" r="95" fill={`url(#${id}-glow)`} filter={`url(#${id}-blur)`}/>
          <circle cx="300" cy="300" r="140" fill="none" stroke="var(--glass-border)"/>
          <motion.circle cx="300" cy="300" r="140" fill="none" stroke={`url(#${id}-brand)`} strokeWidth="2" strokeLinecap="round" strokeDasharray={2 * Math.PI * 140} variants={{ hidden: { strokeDashoffset: reduceMotion ? 0 : 2 * Math.PI * 140, opacity: reduceMotion ? 0 : 1 }, visible: { strokeDashoffset: 0, opacity: 1 } }} transition={{ duration: reduceMotion ? 0.15 : 1.4 }} transform="rotate(-90 300 300)"/>
          <circle cx="300" cy="300" r="83" fill={`url(#${id}-subtle)`} stroke={`url(#${id}-brand)`} strokeWidth="1"/>
          <text x="300" y="295" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="600">NewOrigin</text>
          <text x="300" y="324" textAnchor="middle" fill="var(--text-secondary)" fontSize="14">learning loop</text>
          {nodes.map((node, index) => {
            const lines = t.raw(`${node.key}Lines`) as string[];
            const labelX = node.x + node.dx * 84;
            const labelY = node.y + node.dy * 84;
            return <motion.g key={node.key} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} transition={{ duration: reduceMotion ? 0.15 : 0.5, delay: reduceMotion ? 0 : index * 0.2 }}>
              <line x1={node.x + node.dx * 28} y1={node.y + node.dy * 28} x2={node.x + node.dx * 68} y2={node.y + node.dy * 68} stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              <circle cx={node.x} cy={node.y} r="28" fill="var(--bg-elevated)" stroke="var(--accent)" strokeWidth="1"/>
              <text x={node.x} y={node.y + 5} textAnchor="middle" fill="var(--accent-text)" fontSize="15" fontWeight="600">0{index + 1}</text>
              <text x={labelX} y={labelY - (node.dy < 0 ? (lines.length - 1) * 22 : 0)} textAnchor={node.anchor} fill="var(--text-primary)" fontSize="16" fontWeight="600">{lines.map((line, lineIndex) => <tspan key={line} x={labelX} dy={lineIndex === 0 ? 0 : '1.4em'}>{line}</tspan>)}</text>
            </motion.g>;
          })}
        </motion.svg>
      </div>
    </section>
  );
}
