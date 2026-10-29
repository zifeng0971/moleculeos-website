'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useStageMount } from './use-stage-mount';

// Mol* is only fetched once the waterfall is near the viewport, and never on the server.
const Stage = dynamic(() => import('./one-protein-stage'), { ssr: false });

/** The single PD-L1 / KN035 stage the whole waterfall is drawn on. */
export function OneProtein({ armed, step, locale }: { armed: boolean; step: number; locale: string }) {
  const mount = useStageMount(armed);
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (!mount) setFailed(false); }, [mount]);
  return <div className="stage-swap">
    {mount && !failed && <Stage step={step} locale={locale} onReady={() => {}} onFail={() => setFailed(true)} />}
    {failed && <div className="stage-layer"><div className="stage-loader" role="status"><span>{locale === 'en' ? 'Unable to load structure' : '结构加载失败'}</span><button type="button" onClick={() => setFailed(false)}>{locale === 'en' ? 'Retry' : '重试'}</button></div></div>}
  </div>;
}
