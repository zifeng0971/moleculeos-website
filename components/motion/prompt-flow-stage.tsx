'use client';

/*
 * Step 01, shot 1: the Mocha prompt box takes a prompt and the two raw sequences; the box fades and the sequences
 * themselves condense into the predicted complex. No agent steps, no job timer.
 * The structure is real output: human PD-L1 + KN035 VHH predicted with MMFold on MOS (MMFold_1, the platform's top-ranked
 * sample, /demo/kn035-pdl1-mmfold.cif); ipTM 0.918 / pLDDT 93.7 come from that job's summary_confidences file.
 */
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp, Check } from 'lucide-react';
import pdl1 from '@/content/pdl1-kn035.json';
import { createViewer, type ViewerController } from '@/components/hero/molstar-controller';
import { ParticleForge } from '@/components/motion/particle-forge';
import mochaIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-mocha.svg';
import '@/components/hero/mocha-upgrade/vendor-tokens.css';
import './prompt-flow.css';

const COLORS = { target: '#7DF3C4', binder: '#F08BD0' };
const IPTM = pdl1.iptm, PLDDT = pdl1.plddt;
const SEQ_A = 'MAFTVTVPKDLYVVEYGSNMTIECKFPVEKQLDLAALIVYWEMEDKNIIQFVHGEEDLKVQHSSYRQRARLLKDQLSLGNAALQITDVKLQDAGVYRCMISYGGADYKRITVKVNALE';
const SEQ_B = 'QVQLQESGGGLVQPGGSLRLSCAASGKMSSRRCMAWFRQAPGKERERVAKLLTTSGSTYLADSVKGRFTISQNNAKSTVYLQMNSLKPEDTAMYYCAADSFEDPTCTLVTSSGAFQYWGQGTQVTVSS';
const labelsAll = [...Array.from({ length: pdl1.lenA }, (_, i) => `A:${i + 1}`), ...Array.from({ length: pdl1.lenB }, (_, i) => `B:${i + 1}`)];
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const COPY = {
  zh: { prompt: '用 MMFold 预测人 PD-L1 与 KN035 纳米抗体的复合物结构', placeholder: '粘贴 FASTA 序列、上传 PDB 文件，或直接提问…', result: '预测完成', chains: '链', target: 'PD-L1 · A', binder: 'KN035 · B' },
  en: { prompt: 'Predict the complex of human PD-L1 and the KN035 nanobody with MMFold', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…', result: 'Prediction ready', chains: 'chains', target: 'PD-L1 · A', binder: 'KN035 · B' },
} as const;

const trace = [{ points: pdl1.chainA as number[], color: COLORS.target }, { points: pdl1.chainB as number[], color: COLORS.binder }];

export default function PromptFlowStage({ locale, onReady, onFail }: { locale: string; onReady: () => void; onFail: () => void }) {
  const t = locale === 'en' ? COPY.en : COPY.zh;
  const root = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), fx = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerController | null>(null), forge = useRef<ParticleForge | null>(null);
  const run = useRef({ n: 0 }).current, touched = useRef(false), played = useRef(false), frameRef = useRef<() => void>();
  const callbacks = useRef({ onReady, onFail }); callbacks.current = { onReady, onFail };
  const [ready, setReady] = useState(false), [onScreen, setOnScreen] = useState(false);
  // `stage`: compose (prompt + sequences typed in) → docked (box fades, the sequences condense into the fold).
  const [typed, setTyped] = useState(''), [stage, setStage] = useState<'compose' | 'docked'>('compose');
  const [na, setNa] = useState(0), [nb, setNb] = useState(0);
  const [result, setResult] = useState(false), [fold, setFold] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    let instance: ViewerController | undefined;
    const el = host.current!;
    const intersect = new IntersectionObserver(([entry]) => { instance?.active(entry.isIntersecting); forge.current?.setVisible(entry.isIntersecting); });
    intersect.observe(el);
    const screen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    screen.observe(root.current!);
    let settle: ReturnType<typeof setTimeout> | undefined;
    // The initial view is fixed: whenever the stage changes size (layout, scroll-in transform, snapping) and nobody has touched the camera, it is framed again.
    const resize = new ResizeObserver(() => { forge.current?.resize(); clearTimeout(settle); settle = setTimeout(() => { if (!touched.current) frameRef.current?.(); }, 120); });
    resize.observe(el);
    const pointer = () => { touched.current = true; };
    el.addEventListener('pointerdown', pointer); el.addEventListener('wheel', pointer, { passive: true });
    void createViewer(canvas.current!, el, () => {}, () => {}, () => {}, abort.signal, undefined, {
      src: '/demo/kn035-pdl1-mmfold.cif', label: 'PD-L1 + KN035 · MMFold_1', showcase: true, startHidden: true, chains: [{ auth: 'A', color: COLORS.target }, { auth: 'B', color: COLORS.binder }],
    }).then(value => {
      if (abort.signal.aborted) { value.dispose(); return; }
      instance = value; viewer.current = value;
      forge.current = new ParticleForge(fx.current!, (src, out) => value.project(src, out), !reduced());
      setReady(true); callbacks.current.onReady();
    }).catch(() => { if (!abort.signal.aborted) callbacks.current.onFail(); });
    return () => {
      abort.abort(); run.n++; clearTimeout(settle); intersect.disconnect(); screen.disconnect(); resize.disconnect();
      el.removeEventListener('pointerdown', pointer); el.removeEventListener('wheel', pointer);
      forge.current?.dispose(); forge.current = null; viewer.current = null; instance?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` is a stable counter object
  }, []);

  useEffect(() => {
    const v = viewer.current, f = forge.current;
    if (!v || !f || !ready) return;
    const token = ++run.n, alive = () => run.n === token;
    // Sits left of centre so the result card in the corner never covers it.
    const frame = () => { touched.current = false; v.focusRegion(labelsAll, 20, 90, true, 0.3); };
    frameRef.current = frame;
    const reset = () => { setTyped(''); setNa(0); setNb(0); setStage('compose'); setResult(false); setFold(false); f.clear(); v.showChains([]); };
    const finalState = () => { setStage('docked'); setNa(SEQ_A.length); setNb(SEQ_B.length); setResult(true); setFold(true); v.showChains(undefined); frame(); };
    if (!onScreen && !played.current && !reduced()) { reset(); return () => { run.n++; }; }
    if (played.current || reduced()) { finalState(); if (onScreen) v.spin(true); return () => { run.n++; v.spin(false); }; }

    void (async () => {
      reset(); frame();
      await wait(900); if (!alive()) return;
      // About 2.8 s whatever the language: slow enough to read, without the longer English line dragging.
      const stroke = Math.min(70, 2800 / t.prompt.length);
      for (let i = 1; i <= t.prompt.length; i++) { setTyped(t.prompt.slice(0, i)); await wait(stroke + (i % 7 === 0 ? stroke : 0)); if (!alive()) return; }
      await wait(700); if (!alive()) return;
      // The two raw sequences go into the box at a pace the eye can follow; the condensing into the fold below keeps its own speed.
      for (let i = 4; i <= SEQ_A.length + 3; i += 4) { setNa(Math.min(i, SEQ_A.length)); await wait(50); if (!alive()) return; }
      await wait(350); if (!alive()) return;
      for (let i = 4; i <= SEQ_B.length + 3; i += 4) { setNb(Math.min(i, SEQ_B.length)); await wait(50); if (!alive()) return; }
      await wait(1000); if (!alive()) return;
      // The box fades and the sequence itself condenses into the structure.
      // Each letter's exact spot on screen: the canvas takes over from the DOM text without a visible jump.
      const box = fx.current!.getBoundingClientRect(), letters: { x: number; y: number; ch: string; color: string }[] = [];
      root.current!.querySelectorAll<HTMLElement>('.pf-fasta code > span').forEach((span, k) => {
        const node = span.firstChild as Text | null;
        if (!node) return;
        const range = document.createRange();
        for (let i = 0; i < node.length; i++) {
          range.setStart(node, i); range.setEnd(node, i + 1);
          const r = range.getBoundingClientRect();
          letters.push({ x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, ch: node.data[i], color: k === 0 ? COLORS.target : COLORS.binder });
        }
      });
      const morph = f.form({ chains: trace, dir: 'in', duration: 5200, letters, onReveal: () => { v.showChains(undefined); setFold(true); frame(); } });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      if (!alive()) return;
      setStage('docked');
      await morph;
      if (!alive()) return;
      await wait(700); if (!alive()) return;
      setResult(true);
      v.spin(true);
      // Plays once; it then rests on the finished result.
      played.current = true;
    })();
    return () => { run.n++; f.clear(); v.spin(false); };
  // `run` is a stable counter used only to cancel superseded scenes; the script is intentionally keyed to readiness and visibility.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onScreen, locale]);

  return <div ref={root} className="pf" data-ready={ready || undefined} data-stage={stage}>
    <div ref={host} className="pf-view" data-fold={fold || undefined} aria-label="PD-L1 + KN035 · MMFold">
      <canvas ref={canvas} />
      <canvas ref={fx} className="pf-fx" aria-hidden="true" />
    </div>

    <div className="pf-agent mocha-upgrade-root" data-stage={stage}>
      <header><Image src={mochaIcon} alt="" width={16} height={19} style={{ width: 16, height: 19 }} /><strong>Mocha</strong></header>
      <div className="pf-composer">
        <p data-empty={!typed || undefined}>{typed || t.placeholder}{typed && !na && <i className="pf-caret" />}</p>
        <div className="pf-fasta" aria-hidden="true" data-on={na > 0 || undefined}>
          <code><em>&gt;PDL1</em><span style={{ color: COLORS.target }}>{SEQ_A.slice(0, na)}</span>{na > 0 && !nb && <i className="pf-caret" />}</code>
          {nb > 0 && <code><em>&gt;KN035</em><span style={{ color: COLORS.binder }}>{SEQ_B.slice(0, nb)}</span>{nb < SEQ_B.length && <i className="pf-caret" />}</code>}
        </div>
        <button type="button" tabIndex={-1} aria-hidden="true" data-ready={nb >= SEQ_B.length || undefined}><ArrowUp size={15} /></button>
      </div>
    </div>

    <div className="pf-result" data-on={result || undefined}>
      <strong><Check size={13} />{t.result}</strong>
      <dl><div><dt>ipTM</dt><dd>{IPTM.toFixed(2)}</dd></div><div><dt>pLDDT</dt><dd>{PLDDT.toFixed(1)}</dd></div><div><dt>{t.chains}</dt><dd>2</dd></div></dl>
      <small><span style={{ color: COLORS.target }}>● {t.target}</span>　<span style={{ color: COLORS.binder }}>● {t.binder}</span></small>
    </div>
  </div>;
}
