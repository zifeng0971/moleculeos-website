'use client';

/*
 * Step 03: the Mocha box takes a prompt, the agent runs in the middle of the stage, then the card dissolves into the
 * PD-L1 / DBL1_03 complex (7XYQ). The molecule sits left; the right-hand list is the real top of a MOS
 * "Binding Affinity Mutation Effect" scan (task 342254431249408). Selecting a candidate (it also cycles on its own)
 * moves the camera to the residue, lights it and the PD-L1 residue it faces, and draws the contact between them.
 * Scores are predicted ΔΔG vs the wild type (kcal/mol, lower is more favourable); they are not measured affinities.
 */
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUp, Check, Paperclip } from 'lucide-react';
import data from '@/content/pdl1-dbl1-affinity.json';
import { createViewer, type ViewerController } from '@/components/hero/molstar-controller';
import { ParticleForge } from './particle-forge';
import { ChatBubble } from '@/components/hero/mocha-upgrade/vendor/src/components/mocha/ChatBubble/ChatBubble';
import { TaskRow } from '@/components/hero/mocha-upgrade/vendor/src/components/mocha/TaskRow/TaskRow';
import mochaIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-mocha.svg';
import thinkingIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-thinking.svg';
import taskIcon from '@/components/hero/mocha-upgrade/vendor/src/assets/mocha/icon-mostask.svg';
import type { TaskRowData, UnfoldStep } from '@/components/hero/mocha-upgrade/vendor/src/data/mochaFlow';
import '@/components/hero/mocha-upgrade/vendor-tokens.css';
import './prompt-flow.css';
import './affinity-case.css';

type Contact = { type: 'hbond' | 'hydrophobic' | 'pi' | 'near'; d: number; a: number[]; b: number[]; aAtom?: string; bAtom?: string; partner: number; partnerRes: string };
type Pos = { ca: number[]; side?: number[]; contacts?: Contact[] };
const POS = data.pos as Record<string, Pos>;
const COLORS = { target: '#7DF3C4', binder: '#B5A1FA', pick: '#FFCD5A', partner: '#6FD3FF' };
const KIND_COLOR = { hbond: '#6FD3FF', hydrophobic: '#F5A8E0', pi: '#C9A8FF', near: '#B9B3C4' } as const;
const labelsAll = [...Array.from({ length: data.lenA }, (_, i) => `A:${i + 1}`), ...Array.from({ length: data.lenB }, (_, i) => `B:${i + 1}`)];
const trace = [{ points: data.chainA as number[], color: COLORS.target }, { points: data.chainB as number[], color: COLORS.binder }];
const best = Math.abs(data.top[0].ddg);
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const COPY = {
  zh: {
    prompt: '对 PD-L1 结合蛋白 DBL1_03（7XYQ）做单点突变扫描，找出预测结合更强的突变', attach: '7XYQ.cif · 链 A, B', placeholder: '粘贴 FASTA 序列、上传 PDB 文件，或直接提问…',
    done: '完成', title: '推荐突变', note: '预测 ΔΔG · kcal/mol · 相对野生型，越低越有利', sub: (n: string) => `结合蛋白链共评分 ${n} 个单点突变`, hint: '选择一个突变，在结构上定位',
    contact: (d: number, r: number) => `与 PD-L1 A:${r} 直接接触 · ${d} Å`, shell: (d: number, r: number) => `靠近 PD-L1 A:${r} · ${d} Å`, target: 'PD-L1 · A', binder: 'DBL1_03 · B', site: '位点',
    kinds: { hbond: '氢键', hydrophobic: '疏水接触', pi: 'π–π 堆积', near: '最近距离' } as Record<string, string>, wt: '野生型几何',
  },
  en: {
    prompt: 'Scan single-point mutations on the PD-L1 binder DBL1_03 (7XYQ) and find the ones predicted to bind stronger', attach: '7XYQ.cif · chains A, B', placeholder: 'Paste a FASTA sequence, upload a PDB file, or ask me anything…',
    done: 'Done', title: 'Recommended mutations', note: 'Predicted ΔΔG · kcal/mol · vs wild type · lower is favorable', sub: (n: string) => `${n} binder-chain substitutions scored`, hint: 'Select a mutation to locate it on the structure',
    contact: (d: number, r: number) => `Contacts PD-L1 A:${r} · ${d} Å`, shell: (d: number, r: number) => `Near PD-L1 A:${r} · ${d} Å`, target: 'PD-L1 · A', binder: 'DBL1_03 · B', site: 'Site',
    kinds: { hbond: 'H-bond', hydrophobic: 'Hydrophobic contact', pi: 'π–π stacking', near: 'Closest approach' } as Record<string, string>, wt: 'Wild-type geometry',
  },
} as const;

const STEPS: { label: string; detail: string; chip?: string }[] = [
  { label: 'Thinking', detail: '7XYQ: PD-L1 (A) + DBL1_03 binder (B) → scan binder substitutions, target stays fixed.' },
  { label: 'Read', detail: 'structure-toolkit' },
  { label: 'Shell', detail: `Check structure: ${data.lenA} + ${data.lenB} residues, chains A and B` },
  { label: 'GetMOSQuota', detail: 'Quota available' },
  { label: 'StartMOSTask', detail: 'Binding Affinity Mutation Effect · 7XYQ A,B', chip: 'Affinity' },
];
const UNFOLD: UnfoldStep[][] = STEPS.map(step => [{ text: step.detail, durationMs: 900 }]);

/** Memoised so the rows aren't re-rendered by unrelated state changes (the vendored row restarts its timers on new props). */
const AgentRows = memo(function AgentRows({ shown, finished, jobDone, doneLabel }: { shown: number; finished: number; jobDone: boolean; doneLabel: string }) {
  return <div className="pf-steps">
    {STEPS.slice(0, shown).map((step, i) => {
      const last = i === STEPS.length - 1, complete = last ? jobDone : finished > i;
      const task: TaskRowData = { type: i === 0 ? 'thinking' : 'mostask', icon: i === 0 ? thinkingIcon : taskIcon, mode: complete ? 'completed' : 'processing', label: step.label, chip: step.chip, completedStatus: doneLabel, unfoldSteps: UNFOLD[i] };
      return <div key={step.label}><TaskRow task={task} paused paceScale={0.2} /></div>;
    })}
  </div>;
});

export default function AffinityFlowStage({ locale, onReady, onFail }: { locale: string; onReady: () => void; onFail: () => void }) {
  const t = locale === 'en' ? COPY.en : COPY.zh;
  const root = useRef<HTMLDivElement>(null), host = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), fx = useRef<HTMLCanvasElement>(null);
  const viewer = useRef<ViewerController | null>(null), forge = useRef<ParticleForge | null>(null);
  const run = useRef({ n: 0 }).current, touched = useRef(false), played = useRef(false), manual = useRef(false);
  const callbacks = useRef({ onReady, onFail }); callbacks.current = { onReady, onFail };
  const [ready, setReady] = useState(false), [onScreen, setOnScreen] = useState(false);
  const [typed, setTyped] = useState(''), [stage, setStage] = useState<'compose' | 'work' | 'docked'>('compose');
  const [shown, setShown] = useState(0), [finished, setFinished] = useState(0), [jobDone, setJobDone] = useState(false);
  const [result, setResult] = useState(false), [selected, setSelected] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    let instance: ViewerController | undefined;
    const el = host.current!;
    const intersect = new IntersectionObserver(([entry]) => { instance?.active(entry.isIntersecting); forge.current?.setVisible(entry.isIntersecting); });
    intersect.observe(el);
    const screen = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.4 });
    screen.observe(root.current!);
    const resize = new ResizeObserver(() => { forge.current?.resize(); if (!touched.current) viewer.current?.refit(); });
    resize.observe(el);
    const pointer = () => { touched.current = true; };
    el.addEventListener('pointerdown', pointer); el.addEventListener('wheel', pointer, { passive: true });
    void createViewer(canvas.current!, el, () => {}, () => {}, () => {}, abort.signal, undefined, {
      src: '/demo/dbl1-pdl1-7xyq.cif', label: '7XYQ · PD-L1 (A) / DBL1_03 (B)', showcase: true, startHidden: true,
      chains: [{ auth: 'A', color: COLORS.target }, { auth: 'B', color: COLORS.binder }],
    }).then(value => {
      if (abort.signal.aborted) { value.dispose(); return; }
      instance = value; viewer.current = value;
      forge.current = new ParticleForge(fx.current!, (src, out) => value.project(src, out), !reduced());
      setReady(true); callbacks.current.onReady();
    }).catch(() => { if (!abort.signal.aborted) callbacks.current.onFail(); });
    return () => {
      abort.abort(); run.n++; intersect.disconnect(); screen.disconnect(); resize.disconnect();
      el.removeEventListener('pointerdown', pointer); el.removeEventListener('wheel', pointer);
      forge.current?.dispose(); forge.current = null; viewer.current = null; instance?.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `run` is a stable counter object
  }, []);

  // Lights candidate `i` on the structure: camera to its residue, the residue and the PD-L1 residue it faces coloured, a contact line between them.
  const focus = (i: number) => {
    const v = viewer.current, f = forge.current;
    if (!v || !f) return;
    const c = data.top[i], mine = POS[String(c.pos)], other = POS[`A${c.partner}`];
    touched.current = false;
    v.focusRegion([`B:${c.pos}`, `A:${c.partner}`], 12, undefined, false, 0.55);
    void v.showSites([{ labels: [`B:${c.pos}`], color: COLORS.pick }, { labels: [`A:${c.partner}`], color: COLORS.partner }]);
    const at = mine.side ?? mine.ca, contacts = mine.contacts ?? [];
    f.setSites([{ points: at, color: COLORS.pick, size: 20, pulse: !reduced() }, { points: contacts.length ? contacts.flatMap(k => k.b) : other.ca, color: COLORS.partner, size: 11, pulse: !reduced() }]);
    f.setArcs(reduced() ? null : contacts.length ? contacts.flatMap(k => [...k.a, ...k.b]) : [...at, ...other.ca], '#FFE6A8');
  };
  const choose = (i: number, user = true) => { if (user) manual.current = true; setSelected(i); focus(i); };

  useEffect(() => {
    const v = viewer.current, f = forge.current;
    if (!v || !f || !ready) return;
    const token = ++run.n, alive = () => run.n === token;
    const frame = () => { touched.current = false; v.focusRegion(labelsAll, -10, 90, false, 0.75); };
    const reset = () => { setTyped(''); setStage('compose'); setShown(0); setFinished(0); setJobDone(false); setResult(false); setSelected(0); f.clear(); f.setArcs(null); void v.showSites([]); v.showChains([]); };
    if (!onScreen && !played.current && !reduced()) { reset(); return () => { run.n++; }; }
    if (played.current || reduced()) {
      setStage('docked'); setShown(STEPS.length); setFinished(STEPS.length); setJobDone(true); setResult(true); v.showChains(undefined); frame();
      const index = played.current ? selected : 0;
      if (onScreen) setTimeout(() => alive() && focus(index), 80);
      return () => { run.n++; };
    }

    void (async () => {
      reset(); frame(); manual.current = false;
      await wait(900); if (!alive()) return;
      for (let i = 1; i <= t.prompt.length; i++) { setTyped(t.prompt.slice(0, i)); await wait(22 + (i % 7 === 0 ? 34 : 0)); if (!alive()) return; }
      await wait(500); if (!alive()) return;
      setStage('work'); setTyped('');
      for (let i = 0; i < STEPS.length; i++) {
        await wait(i === 0 ? 450 : 300); if (!alive()) return;
        setShown(i + 1);
        if (i < STEPS.length - 1) { await wait(620); if (!alive()) return; setFinished(i + 1); }
      }
      await wait(1100); if (!alive()) return;
      setJobDone(true); setFinished(STEPS.length);
      await wait(800); if (!alive()) return;
      // The card dissolves in place while the particles condense into the complex, already sitting left of the list.
      setStage('docked');
      await f.form({ chains: trace, dir: 'in', duration: 4600, onReveal: () => v.showChains(undefined) });
      if (!alive()) return;
      setResult(true);
      await wait(900); if (!alive()) return;
      choose(0, false);
      played.current = true;
      // One pass through the candidates on its own, then it rests on the top one; a click takes over at any point.
      for (let i = 1; i <= data.top.length; i++) {
        await wait(3400); if (!alive() || manual.current) return;
        choose(i % data.top.length, false);
      }
    })();
    return () => { run.n++; f.clear(); f.setArcs(null); };
  // `run` is a stable counter used only to cancel superseded scenes; the script is keyed to readiness and visibility.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onScreen, locale]);

  const cur = data.top[selected], near = cur.gap <= 4.5;
  // Floating annotations for the lit residue: its name and score, and one chip per real contact (type, atoms, distance).
  const tags = useMemo(() => {
    const row = data.top[selected], mine = POS[String(row.pos)];
    return [
      { id: 'res', kind: 'pick' as const, at: mine.side ?? mine.ca, head: `${row.wt}${row.pos} → ${row.aa}`, sub: `ΔΔG ${row.ddg.toFixed(2)}` },
      ...Object.entries((mine.contacts ?? []).reduce<Record<string, Contact[]>>((groups, k) => { (groups[k.type] ??= []).push(k); return groups; }, {})).map(([type, list], i) => {
        const first = list[0], lo = Math.min(...list.map(k => k.d)), hi = Math.max(...list.map(k => k.d)), range = lo === hi ? `${lo}` : `${lo}–${hi}`;
        return {
          id: `c${i}`, kind: type as Contact['type'], at: [(first.a[0] + first.b[0]) / 2, (first.a[1] + first.b[1]) / 2, (first.a[2] + first.b[2]) / 2],
          head: list.length > 1 ? `${t.kinds[type]} ×${list.length}` : t.kinds[type],
          sub: list.length > 1 ? `${row.wt}${row.pos} ⋯ ${list.map(k => `${k.partnerRes}${k.partner}`).join(' · ')} · ${range} Å` : `${row.wt}${row.pos} ${first.aAtom} ⋯ ${first.partnerRes}${first.partner} ${first.bAtom} · ${first.d} Å`,
        };
      }),
    ];
  }, [selected, t]);
  const tagEls = useRef<(HTMLDivElement | null)[]>([]), leaderEls = useRef<(SVGLineElement | null)[]>([]);
  // Annotations follow the structure every frame (the camera moves and the molecule spins), pushed away from the residue so they don't pile up.
  useEffect(() => {
    const v = viewer.current;
    if (!result || !onScreen || !v) return;
    let raf = 0;
    const src = new Float32Array(tags.length * 3 + 3), out = new Float32Array(tags.length * 3 + 3);
    tags.forEach((tag, i) => src.set(tag.at, i * 3 + 3));
    src.set(tags[0].at, 0);
    const tick = () => {
      v.project(src, out);
      const w = root.current?.clientWidth ?? 0, limit = w > 640 ? w - 296 : w - 20;
      const ax = out[0], ay = out[1];
      tags.forEach((tag, i) => {
        const el = tagEls.current[i], line = leaderEls.current[i], px = out[i * 3 + 3], py = out[i * 3 + 4];
        if (!el) return;
        let x = px, y = py;
        if (i === 0) y = py - 44;
        else {
          let dx = px - ax, dy = py - ay, len = Math.hypot(dx, dy);
          if (len < 8) { const ang = 0.7 + (i - 1) * 1.6; dx = Math.cos(ang); dy = Math.sin(ang); len = 1; }
          x = px + (dx / len) * 58; y = py + (dy / len) * 58 + 18 * (i - 1);
        }
        x = Math.min(limit - el.offsetWidth / 2, Math.max(el.offsetWidth / 2 + 8, x)); y = Math.min((root.current?.clientHeight ?? 400) - 24, Math.max(22, y));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        el.dataset.live = '1';
        line?.setAttribute('x1', px.toFixed(1)); line?.setAttribute('y1', py.toFixed(1)); line?.setAttribute('x2', x.toFixed(1)); line?.setAttribute('y2', (i === 0 ? y + 12 : y).toFixed(1));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tags, result, onScreen]);
  return <div ref={root} className="ak" data-ready={ready || undefined} data-stage={stage}>
    <div ref={host} className="ak-view" aria-label="PD-L1 · chain A / DBL1_03 · chain B"><canvas ref={canvas} /><canvas ref={fx} className="ak-fx" aria-hidden="true" /></div>

    <svg className="ak-leaders" data-on={result || undefined} aria-hidden="true" key={`l${selected}`}>{tags.map((tag, i) => <line key={tag.id} ref={el => { leaderEls.current[i] = el; }} style={{ stroke: tag.kind === 'pick' ? COLORS.pick : KIND_COLOR[tag.kind as keyof typeof KIND_COLOR] }} />)}</svg>
    <div className="ak-tags" data-on={result || undefined} aria-hidden="true">{tags.map((tag, i) => <div key={`${selected}-${tag.id}`} ref={el => { tagEls.current[i] = el; }} className="ak-tag" data-kind={tag.kind} style={{ ['--tag' as string]: tag.kind === 'pick' ? COLORS.pick : KIND_COLOR[tag.kind as keyof typeof KIND_COLOR], animationDelay: `${i * 90}ms` }}><b>{tag.head}</b><span>{tag.sub}</span></div>)}</div>
    <div className="ak-legend" data-on={result || undefined}><span style={{ color: COLORS.target }}>● {t.target}</span><span style={{ color: COLORS.binder }}>● {t.binder}</span><span style={{ color: COLORS.pick }}>● {cur.mut}</span></div>

    <section className="ak-panel" data-on={result || undefined} aria-hidden={!result}>
      <strong><Check size={13} />{t.title}<code>7XYQ</code></strong>
      <p>{t.sub(data.stats.scored.toLocaleString('en-US'))}</p>
      <div className="ak-list" role="listbox" aria-label={t.title}>
        {data.top.map((row, i) => <button type="button" key={row.mut} role="option" aria-selected={selected === i} tabIndex={result ? 0 : -1} onClick={() => choose(i)}>
          <small>{String(i + 1).padStart(2, '0')}</small><b><span>{row.wt}{row.pos}</span><span className="ak-arrow">→</span><span className="ak-mut">{row.aa}</span></b>
          <span className="ak-score"><i style={{ width: `${Math.abs(row.ddg) / best * 100}%` }} /></span><code>{row.ddg.toFixed(2)}</code>
        </button>)}
      </div>
      <div className="ak-detail" key={cur.mut}><b>{cur.mut}</b><span>{(near ? t.contact : t.shell)(cur.gap, cur.partner).replace('PD-L1 A:', `PD-L1 ${cur.partnerRes}`)} · {t.wt}</span></div>
      <small>{t.note}</small>
    </section>

    <div className="pf-agent mocha-upgrade-root" data-stage={stage}>
      <header><Image src={mochaIcon} alt="" width={16} height={19} style={{ width: 16, height: 19 }} /><strong>Mocha</strong></header>
      {stage !== 'compose' && <div className="pf-user"><ChatBubble variant="user">{t.prompt}</ChatBubble></div>}
      {stage !== 'compose' && <AgentRows shown={shown} finished={finished} jobDone={jobDone} doneLabel={t.done} />}
      {stage === 'compose' && <div className="pf-composer">
        <span className="pf-attach" data-on={typed.length > 0 || undefined}><Paperclip size={11} />{t.attach}</span>
        <p data-empty={!typed || undefined}>{typed || t.placeholder}{typed && <i className="pf-caret" />}</p>
        <button type="button" tabIndex={-1} aria-hidden="true" data-ready={typed.length >= t.prompt.length || undefined}><ArrowUp size={15} /></button>
      </div>}
    </div>
    <p className="ak-hint" data-on={result || undefined}>{t.hint}</p>
  </div>;
}
