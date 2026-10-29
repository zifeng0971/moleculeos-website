'use client';
import {useTranslations} from 'next-intl';
import {useManualPosition} from './manual-position';
export function ManualToc(){
  const t=useTranslations('manualUI');const {active,group,chapter}=useManualPosition();
  const anchors=chapter?.anchors??group?.overviewAnchors??[];
  return <aside className="manual-toc"><p>{t('onThisPage')}</p><nav>{anchors.map(a=><a key={a.id} href={'#'+a.id} aria-current={active===a.id?'location':undefined} className={a.level===4?'toc-nested':''}>{a.title}</a>)}</nav></aside>;
}
