'use client';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { Locale } from '@/lib/site-config';
import { mockContent, type CapabilityTask } from '@/lib/mock-content';
import { SectionHeading } from '@/components/ui/section-heading';
import { Reveal } from '@/components/motion/reveal';
import { TaskVisual, type TaskVisualLabels } from '@/components/motion/task-visuals';

function CapabilityMedia({ task, available, labels }: { task: CapabilityTask; available: boolean; labels: TaskVisualLabels }) {
  const [failed, setFailed] = useState(false);
  return <div className="capability-media">
    {!available || failed ? <TaskVisual id={task.id} labels={labels}/> : /\.(webp|png|jpe?g|gif|svg)$/i.test(task.media) ?
      <Image src={task.media} alt={task.title} fill sizes="(min-width:1024px) 840px, 100vw" className="object-contain" onError={() => setFailed(true)}/> :
      <video src={task.media} controls playsInline preload="metadata" aria-label={task.title} onError={() => setFailed(true)}/>}
  </div>;
}

export function TasksSection({ locale, availableMedia = [] }: { locale: Locale; availableMedia?: string[] }) {
  const t = useTranslations('home.tasks');
  const translated = t.raw('selectorTasks') as CapabilityTask[];
  const tasks = locale === 'zh' ? mockContent.capabilities.tasks : translated;
  const [selected, setSelected] = useState(0);
  const [manual, setManual] = useState(false);
  const [visible, setVisible] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [hovering, setHovering] = useState(false);
  const root = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const media = matchMedia('(min-width: 1024px)');
    const update = () => setDesktop(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (desktop) return;
    const tabs = root.current?.querySelector<HTMLElement>('.capability-tabs');
    const button = tabs?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (tabs && button) tabs.scrollTo({left: button.offsetLeft - tabs.offsetLeft, behavior: reduce ? 'auto' : 'smooth'});
  }, [selected, desktop, reduce]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.15 });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  // Autoplay is driven by the visible progress bar so the bar and the tab change never drift apart.
  const autoplay = !manual && !reduce && visible && !hovering;
  const advance = () => setSelected(index => (index + 1) % tasks.length);
  const choose = (index: number) => { setManual(true); setSelected(index); };
  const keyboard = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (['ArrowDown','ArrowRight'].includes(event.key)) next = (index + 1) % tasks.length;
    else if (['ArrowUp','ArrowLeft'].includes(event.key)) next = (index + tasks.length - 1) % tasks.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tasks.length - 1;
    else return;
    event.preventDefault(); choose(next);
    root.current?.querySelector<HTMLButtonElement>(`#capability-tab-${tasks[next].id}`)?.focus();
  };
  const task = tasks[selected];
  return <section ref={root} className="home-section-pad py-24" data-nav-section="platform">
    <div className="site-container">
      <Reveal><SectionHeading eyebrow={t('eyebrow')} title={t('title')} description={t('selectorDescription')}/></Reveal>
      <div className="capability-selector mt-12" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
        <div className="capability-tabs" role="tablist" aria-label={t('title')} aria-orientation={desktop ? 'vertical' : 'horizontal'}>
          {tasks.map((item, i) => <button id={`capability-tab-${item.id}`} title={item.title} role="tab" aria-selected={selected === i} aria-controls={`capability-panel-${item.id}`} tabIndex={selected === i ? 0 : -1} key={item.id} className="capability-tab" onClick={() => choose(i)} onKeyDown={event => keyboard(event, i)}>
            {selected === i && <motion.span className="capability-selected-indicator" layoutId="capability-selected-indicator" transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 380, damping: 34 }} aria-hidden="true"/>}
            <strong>{item.title}</strong>{selected === i && <small>{item.brief}</small>}
            {selected === i && autoplay && <span className="capability-progress" aria-hidden="true"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 6, ease: 'linear' }} onAnimationComplete={advance}/></span>}
          </button>)}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={task.id} role="tabpanel" id={`capability-panel-${task.id}`} aria-labelledby={`capability-tab-${task.id}`} className="min-w-0" initial={{opacity:0,y:reduce?0:16,filter:reduce?'none':'blur(8px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,y:reduce?0:-8,filter:reduce?'none':'blur(6px)'}} transition={{duration:reduce?0.15:0.45,ease:[0.16,1,0.3,1]}}>
            <CapabilityMedia key={task.media} task={task} available={availableMedia.includes(task.media)} labels={t.raw('visual') as TaskVisualLabels}/>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  </section>;
}
