'use client';
import {useTranslations} from 'next-intl';
import {AnimatePresence,motion} from 'framer-motion';
import {useManualPosition} from './manual-position';
export function ManualToc(){const t=useTranslations('manualUI');const {active,chapter}=useManualPosition();return <aside className="manual-toc"><p>{t('onThisPage')}</p><AnimatePresence mode="wait"><motion.nav key={chapter?.id??'none'} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:.15}}>{chapter?.anchors.map(a=><a key={a.id} href={'#'+a.id} aria-current={active===a.id?'location':undefined} className={a.level===4?'toc-nested':''}>{a.title}</a>)}</motion.nav></AnimatePresence></aside>;}
