'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useStageMount } from './use-stage-mount';

// Mol* is only fetched once the row is near the viewport, and never on the server.
const Stage = dynamic(() => import('./prompt-flow-stage'), { ssr: false });

/** Step 01. No loading prompt: the stage is simply empty until the structure is ready. */
export function PromptFlow({ armed, locale }: { armed: boolean; locale: string }) {
  const mount = useStageMount(armed);
  const [failed, setFailed] = useState(false);
  useEffect(() => { if (!mount) setFailed(false); }, [mount]);
  return <div className="stage-swap">
    {mount && !failed && <Stage locale={locale} onReady={() => {}} onFail={() => setFailed(true)} />}
    {failed && <div className="stage-layer"><div className="stage-loader" role="status"><span>{locale === 'en' ? 'Unable to load structure' : '结构加载失败'}</span><button type="button" onClick={() => setFailed(false)}>{locale === 'en' ? 'Retry' : '重试'}</button></div></div>}
  </div>;
}
