'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { TaskVisual, type TaskVisualLabels } from '@/components/motion/task-visuals';
import type { StageLabels } from '@/components/motion/vegf-stage';

// Mol* is large: it is only fetched once the section scrolls into view, and never on the server.
const VegfStage = dynamic(() => import('@/components/motion/vegf-stage'), { ssr: false });

/** Live 2FJG stage. A quiet loader holds the frame while Mol* loads; the Cα illustration is only the no-WebGL fallback. */
export function TaskStage({ id, armed, visual, stage, onReady }: { id: string; armed: boolean; visual: TaskVisualLabels; stage: StageLabels; onReady?: () => void }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // Rows far from the viewport unmount their viewer to free the WebGL context; the placeholder takes over again.
  useEffect(() => { if (!armed) { setReady(false); setFailed(false); } }, [armed]);
  return <div className="stage-swap">
    {armed && !failed && <div className="stage-layer vegf-layer" data-ready={ready || undefined}><VegfStage id={id} labels={stage} onReady={() => { setReady(true); onReady?.(); }} onFail={() => setFailed(true)} /></div>}
    <AnimatePresence>
      {!ready && <motion.div key={failed ? 'fallback' : 'loader'} className="stage-layer" exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
        {failed ? <TaskVisual id={id} labels={visual} /> : <div className="stage-loader" role="status"><span className="stage-loader-orbit" aria-hidden="true"><i /><i /><i /></span><span>{stage.vegf.loading}</span><code>PDB 2FJG</code></div>}
      </motion.div>}
    </AnimatePresence>
  </div>;
}
