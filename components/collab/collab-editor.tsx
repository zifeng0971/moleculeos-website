'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CollabClient, type CollabStatus } from './collab-client';
import { useCollab } from './collab-provider';
import { isSafeKey, isSafeStyle, tidyText, type Entry, type Peer, type StyleProp, type Version } from './collab-types';

const SELECT_COLOR = '#3e63dd';
const FIELD = { name: 'collab:name' };
const read = (store: 'localStorage' | 'sessionStorage', key: string) => { try { return window[store].getItem(key) ?? ''; } catch { return ''; } };
const write = (store: 'localStorage' | 'sessionStorage', key: string, value: string) => { try { if (value) window[store].setItem(key, value); else window[store].removeItem(key); } catch { /* storage blocked */ } };

const CSS = `
.collab-ui{position:fixed;bottom:16px;z-index:2147483000;width:316px;max-height:calc(100vh - 32px);display:flex;flex-direction:column;font:13px/1.45 -apple-system,BlinkMacSystemFont,"PingFang SC","Segoe UI",sans-serif;color:#1c2024;background:#fff;border:1px solid #d9d9e0;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.22)}
.collab-ui *{box-sizing:border-box;font:inherit}
.collab-ui header{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #eceef0;font-weight:600}
.collab-ui header .dot{width:8px;height:8px;border-radius:50%;flex:none}
.collab-ui .peers{display:flex;margin-left:auto;gap:4px}
.collab-ui .peer{width:22px;height:22px;border-radius:50%;color:#fff;font-size:11px;display:grid;place-items:center}
.collab-ui .body{padding:12px;overflow:auto;display:grid;gap:10px}
.collab-ui .hint{color:#60646c}
.collab-ui .key{font:11px/1.3 ui-monospace,Menlo,monospace;color:#60646c;word-break:break-all}
.collab-ui textarea,.collab-ui input,.collab-ui select{width:100%;padding:6px 8px;border:1px solid #d0d1d8;border-radius:6px;background:#fff;color:inherit}
.collab-ui textarea{min-height:96px;resize:vertical}
.collab-ui .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.collab-ui label{display:grid;gap:3px;color:#60646c;font-size:12px}
.collab-ui .row{display:flex;gap:6px;align-items:center}
.collab-ui button{padding:6px 10px;border:1px solid #d0d1d8;border-radius:6px;background:#f9f9fb;cursor:pointer;color:#1c2024}
.collab-ui button.on{background:${SELECT_COLOR};border-color:${SELECT_COLOR};color:#fff}
.collab-ui button.primary{background:${SELECT_COLOR};border-color:${SELECT_COLOR};color:#fff}
.collab-ui .warn{color:#b54708;background:#fffaeb;border-radius:6px;padding:6px 8px}
.collab-ui .err{color:#c0262d}
.collab-ui footer{padding:8px 12px;border-top:1px solid #eceef0;color:#8b8d98;font-size:11px}
body[data-collab-edit] [data-ckey]{cursor:pointer}
body[data-collab-edit] [data-ckey]:hover{outline:1px dashed ${SELECT_COLOR};outline-offset:3px}
`;

/** A number box that keeps what is being typed to itself and shares only values that are valid (typing "0.9" must not publish "0"). */
function NumField({ value, unit = '', placeholder, onCommit, ...rest }: { value: string; unit?: string; placeholder: string; onCommit(v: string | null): void; prop: StyleProp; step?: number; min?: number; max?: number }) {
  const [text, setText] = useState(value);
  const typing = useRef(false);
  useEffect(() => { if (!typing.current) setText(value); }, [value]);
  const change = (raw: string) => {
    typing.current = true;
    setText(raw);
    if (!raw.trim()) onCommit(null);
    else if (isSafeStyle(rest.prop, raw + unit) && Number.isFinite(Number(raw)) && (rest.min === undefined || Number(raw) >= rest.min) && (rest.max === undefined || Number(raw) <= rest.max)) onCommit(raw + unit);
  };
  return <input type="number" step={rest.step} min={rest.min} max={rest.max} value={text} placeholder={placeholder} onChange={e => change(e.target.value)} onBlur={() => { typing.current = false; setText(value); }} />;
}

const px = (v: string | undefined) => (v ?? '').replace('px', '');
const initial = (name: string) => (name.trim()[0] ?? '?').toUpperCase();

const EN: Record<string, string> = {"刚刚": "just now","加载中…": "Loading…","还没有历史记录。": "No history yet.","(仅排版)": "(layout only)","(恢复为原文)": "(restored to original)","恢复这一版": "Restore this version","协作编辑": "Collaborative editing","协作编辑中": "Editing together","连接中…": "Connecting…","已断开,重连中…": "Disconnected, reconnecting…","换边": "Switch side","输入名字即可进入(只需一次),之后打开页面即可点击文字修改。": "Enter your name to start (once). After that, open any page and click text to edit it.","名字": "Name","进入编辑": "Start editing","收起": "Hide","浏览中(点此继续编辑)": "Browsing (click to resume editing)","暂停编辑,正常点击": "Pause editing, click normally","收起最近改动": "Hide recent changes","最近改动": "Recent changes","同事": "A teammate","默认": "Default","字号 px": "Font size px","字重": "Weight","行高": "Line height","字距 px": "Letter spacing px","上间距 px": "Space above px","下间距 px": "Space below px","左": "Left","中": "Center","右": "Right","文字颜色": "Text color","清除色": "Clear color","隐藏这段文字": "Hide this text","恢复原文和样式": "Restore original text and style","完成": "Done","收起历史": "Hide history","历史版本": "History","恢复": "Restore","改动实时保存为云端草稿,发布上线由管理员完成。": "Changes are saved live as a cloud draft; an admin publishes them.","页面文字": "Page text","(我)": " (me)","正在改": "is editing","刚刚也改了这段文字;你继续输入会覆盖他的版本。": "just edited this text too; if you keep typing you will overwrite their version.","分钟前": "min ago","小时前": "h ago","天前": "d ago","点击页面上的任意文字来修改内容和排版。灰色虚线框表示可编辑。": "Click any text on the page to change its wording and layout. A dashed outline means it is editable. English and Chinese are edited separately.","已清空的文字": "Emptied texts","页面上已看不到,点\"恢复\"即可找回。": "They are no longer visible on the page; click Restore to bring them back.","同文案另外 N 处也一起改(默认只改这一处)": "Also change the other N places with identical wording (by default only this one changes)"};
/** The panel speaks the language of the page being edited. */
const makeTr = (locale: string) => (zh: string) => (locale === 'zh' ? zh : EN[zh] ?? zh);
type Tr = ReturnType<typeof makeTr>;
const ago = (at: number, tr: Tr, locale: string) => { const m = Math.round((Date.now() - at) / 60000); const n = m < 60 ? m : m < 1440 ? Math.round(m / 60) : Math.round(m / 1440); const unit = tr(m < 60 ? '分钟前' : m < 1440 ? '小时前' : '天前'); return m < 1 ? tr('刚刚') : locale === 'zh' ? `${n} ${unit}` : `${n}${unit}`; }; (at: number) => { const m = Math.round((Date.now() - at) / 60000); return m < 1 ? '刚刚' : m < 60 ? `${m} 分钟前` : m < 1440 ? `${Math.round(m / 60)} 小时前` : `${Math.round(m / 1440)} 天前`; };
function HistoryList({ versions, onRestore, label, tr, locale }: { versions: Version[] | null; onRestore(v: Version): void; label?(key: string): string; tr: Tr; locale: string }) {
  if (!versions) return <p className="hint">{tr('加载中…')}</p>;
  if (!versions.length) return <p className="hint">{tr('还没有历史记录。')}</p>;
  return <div style={{ display: 'grid', gap: 6, maxHeight: 220, overflow: 'auto' }}>{versions.map((v, i) => <div key={i} className="warn" style={{ background: '#f4f5f8', color: 'inherit' }}>
    <div className="key">{v.by} · {ago(v.at, tr, locale)}{label && <> · {label(v.key)}</>}</div>
    <div>{v.next ? (v.next.t ?? tr('(仅排版)')) : tr('(恢复为原文)')}</div>
    {v.next?.s && <div className="key">{Object.entries(v.next.s).map(([k, x]) => `${k}:${x}`).join(' ')}</div>}
    <button style={{ marginTop: 4 }} onClick={() => onRestore(v)}>{tr('恢复这一版')}</button>
  </div>)}</div>;
}

export function CollabEditor() {
  const { url, locale, overrides, currentText, baseText, sameTextKeys, setEntry, replaceAll, exitEdit, rescan } = useCollab();
  const tr = useMemo(() => makeTr(locale), [locale]);
  /** What a person recognizes a text by: its original wording, never the internal key. */
  const labelOf = (key: string) => { const base = (baseText(key) ?? '').replace(/\s+/g, ' ').trim(); const short = base.length > 36 ? base.slice(0, 36) + '…' : base; return short ? `“${short}”` : tr('页面文字'); };
  const [status, setStatus] = useState<CollabStatus | 'login'>(() => (read('localStorage', FIELD.name) ? 'connecting' : 'login'));
  const [name, setName] = useState(() => read('localStorage', FIELD.name));
  const [me, setMe] = useState<{ id: string; color: string } | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [selKey, setSelKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [alsoSame, setAlsoSame] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  const [interactive, setInteractive] = useState(false);
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [error, setError] = useState('');
  const client = useRef<CollabClient | null>(null);
  const dirty = useRef(false);
  const composing = useRef(false);
  // The message paths that share the selected text, fixed when the text is picked so that emptying it cannot change the group.
  const group = useRef<string[]>([]);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | undefined>();
  const live = useRef({ tr, selKey, me, locale, draft, overrides, sameTextKeys, baseText, setEntry, replaceAll });
  live.current = { tr, selKey, me, locale, draft, overrides, sameTextKeys, baseText, setEntry, replaceAll };

  const connect = useCallback((who: string, pw: string) => {
    client.current?.close();
    client.current = new CollabClient(url, who, pw, {
      onStatus: setStatus,
      onWelcome: (self, doc) => { setMe(self); live.current.replaceAll(doc.overrides); },
      onEntry: (loc, key, entry, from) => {
        if (from === live.current.me?.id) return;
        live.current.setEntry(loc, key, entry);
        if (loc === live.current.locale && key === live.current.selKey && dirty.current && entry?.t !== undefined && entry.t !== live.current.draft) setConflict(entry.by ?? live.current.tr('同事'));
        else if (loc === live.current.locale && key === live.current.selKey && !composing.current) setDraft(entry?.t ?? live.current.baseText(key) ?? '');
      },
      onPresence: setPeers,
    });
  }, [url]);

  useEffect(() => {
    const who = read('localStorage', FIELD.name);
    if (who) connect(who, '');
    return () => client.current?.close();
  }, [connect]);

  useEffect(() => {
    document.body.setAttribute('data-collab-edit', '');
    return () => document.body.removeAttribute('data-collab-edit');
  }, []);

  const select = useCallback((key: string | null) => {
    // Leaving a text within the debounce window must not drop the last keystrokes (a deletion in particular).
    if (dirty.current && live.current.selKey) { clearTimeout(commitTimer.current); commitText(live.current.draft); }
    clearTimeout(commitTimer.current);
    dirty.current = false;
    composing.current = false;
    setConflict(null);
    group.current = key ? [key] : [];
    setAlsoSame(false);
    setShowHistory(false);
    setSelKey(key);
    setDraft(key ? currentText(key) ?? '' : '');
    client.current?.focus(live.current.locale, key);
  }, [currentText, sameTextKeys]);

  useEffect(() => {
    if (interactive || status === 'login') return;
    const onClick = (ev: MouseEvent) => {
      const target = ev.target as Element;
      if (target.closest('[data-collab-ui]')) return;
      ev.preventDefault();
      ev.stopPropagation();
      rescan();
      select(target.closest('[data-ckey]')?.getAttribute('data-ckey') ?? null);
    };
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') select(null); };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onClick, true); document.removeEventListener('keydown', onKey); };
  }, [interactive, status, select, rescan]);

  const entry: Entry | undefined = selKey ? overrides[locale]?.[selKey] : undefined;
  const sameKeys = useMemo(() => (selKey ? sameTextKeys(selKey) : []), [selKey, sameTextKeys, overrides]);
  const sharedKeys = alsoSame ? sameKeys : selKey ? [selKey] : [];
  // Texts that were emptied have no element left to click, so they are listed here to bring them back.
  const emptied = Object.entries(overrides[locale] ?? {}).filter(([, e]) => e.t !== undefined && !e.t.trim() && !e.s?.hidden);

  const commitText = (text: string) => {
    const now = live.current;
    for (const key of group.current.length ? group.current : [now.selKey!]) {
      const prev = now.overrides[locale]?.[key];
      const o = key.startsWith('x.') ? now.baseText(key) : undefined;
      const t = tidyText(text, now.baseText(key));
      setEntry(locale, key, { ...prev, t, ...(o !== undefined && { o }), by: name, at: Date.now() });
      client.current?.set(locale, key, { t, ...(o !== undefined && { o }) });
    }
    dirty.current = false;
  };
  const onDraft = (text: string) => {
    setDraft(text);
    setConflict(null);
    dirty.current = true;
    clearTimeout(commitTimer.current);
    // While an input method is composing, the text is not final yet: nothing is shared until it settles.
    if (!composing.current) commitTimer.current = setTimeout(() => commitText(text), 300);
  };
  const setStyle = (prop: StyleProp, value: string | null) => {
    if (!selKey) return;
    const s = { ...entry?.s };
    if (value) s[prop] = value; else delete s[prop];
    const next: Entry = { ...entry, s: Object.keys(s).length ? s : undefined, by: name, at: Date.now() };
    if (!next.s) delete next.s;
    setEntry(locale, selKey, next.t === undefined && !next.s ? null : next);
    client.current?.set(locale, selKey, { s: { [prop]: value } });
  };
  const reset = () => {
    if (!selKey) return;
    clearTimeout(commitTimer.current);
    dirty.current = false;
    for (const key of group.current.length ? group.current : sharedKeys) { setEntry(locale, key, null); client.current?.reset(locale, key); }
    setDraft(baseText(selKey) ?? '');
  };

  const openHistory = async (key: string | undefined) => {
    if (showHistory) { setShowHistory(false); return; }
    setVersions(null);
    setShowHistory(true);
    setVersions(await (client.current?.history(locale, key) ?? Promise.resolve([])).catch(() => []));
  };
  // Bringing back an old version is itself a new edit, so nothing is ever lost from the history.
  const restore = (v: Version) => {
    const key = v.key;
    const target = v.next;
    if (!target) { setEntry(locale, key, null); client.current?.reset(locale, key); }
    else {
      const prev = live.current.overrides[locale]?.[key];
      setEntry(locale, key, { ...target, by: name, at: Date.now() });
      const styles = Object.fromEntries([...new Set([...Object.keys(prev?.s ?? {}), ...Object.keys(target.s ?? {})])].map(p => [p, target.s?.[p as StyleProp] ?? null]));
      client.current?.set(locale, key, { t: target.t ?? null, ...(target.o !== undefined && { o: target.o }), s: styles });
    }
    if (key === selKey) setDraft(target?.t ?? baseText(key) ?? '');
  };

  const login = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!name.trim()) return;
    setError('');
    write('localStorage', FIELD.name, name.trim());
    setStatus('connecting');
    connect(name.trim(), '');
  };

  const others = peers.filter(p => p.id !== me?.id);
  const cssPeers = others.filter(p => p.locale === locale && p.key && isSafeKey(p.key)).map(p => `[data-ckey="${p.key}"]{outline:2px solid ${p.color};outline-offset:3px}`).join('\n');
  const selCss = selKey && isSafeKey(selKey) ? `[data-ckey="${selKey}"]{outline:2px solid ${SELECT_COLOR}!important;outline-offset:3px}` : '';
  const dot = status === 'online' ? '#30a46c' : status === 'connecting' ? '#f5a623' : '#e5484d';
  const s = entry?.s ?? {};
  const edited = entry && (entry.t !== undefined || entry.s);

  return (
    <div data-collab-ui className="collab-ui" style={{ [side]: 16 }}>
      <style>{CSS + cssPeers + selCss}</style>
      <header>
        <span className="dot" style={{ background: dot }} />
        <span>{status === 'login' ? tr('协作编辑') : status === 'online' ? tr('协作编辑中') : status === 'connecting' ? tr('连接中…') : tr('已断开,重连中…')}</span>
        <span className="peers">
          {me && <span className="peer" title={`${name}${tr('(我)')}`} style={{ background: me.color }}>{initial(name)}</span>}
          {others.map(p => <span key={p.id} className="peer" title={p.key ? `${p.name} ${tr('正在改')} ${labelOf(p.key)}` : p.name} style={{ background: p.color }}>{initial(p.name)}</span>)}
        </span>
        <button onClick={() => setSide(side === 'right' ? 'left' : 'right')} title={tr('换边')}>⇆</button>
      </header>
      {status === 'login' ? (
        <form className="body" onSubmit={login}>
          <p className="hint">{tr('输入名字即可进入(只需一次),之后打开页面即可点击文字修改。')}</p>
          <label>{tr('名字')}<input value={name} onChange={e => setName(e.target.value)} autoFocus /></label>
          {error && <span className="err">{error}</span>}
          <button className="primary" type="submit">{tr('进入编辑')}</button>
          <button type="button" onClick={exitEdit}>{tr('收起')}</button>
        </form>
      ) : (
        <div className="body">
          <div className="row">
            <button className={interactive ? 'on' : ''} onClick={() => setInteractive(!interactive)}>{interactive ? tr('浏览中(点此继续编辑)') : tr('暂停编辑,正常点击')}</button>
            <button onClick={exitEdit}>{tr('收起')}</button>
          </div>
          {!selKey ? (
            <>
              <p className="hint">{locale === 'zh' ? '点击页面上的任意文字来修改内容和排版。当前语言:中文(两种语言分别编辑)。灰色虚线框表示可编辑。' : tr('点击页面上的任意文字来修改内容和排版。灰色虚线框表示可编辑。')}</p>
              <button onClick={() => openHistory(undefined)}>{showHistory ? tr('收起最近改动') : tr('最近改动')}</button>
              {showHistory && <HistoryList versions={versions} onRestore={restore} label={labelOf} tr={tr} locale={locale} />}
              {emptied.length > 0 && <div className="warn">
                {tr('已清空的文字')} ({emptied.length}): {tr('页面上已看不到,点"恢复"即可找回。')}
                {emptied.map(([key]) => <div key={key} className="row" style={{ marginTop: 4 }}><span className="key" style={{ flex: 1 }}>{labelOf(key)}</span><button onClick={() => { setEntry(locale, key, null); client.current?.reset(locale, key); }}>{tr('恢复')}</button></div>)}
              </div>}
            </>
          ) : (
            <>
              <div className="key" title={selKey}>{labelOf(selKey)}</div>
              {sameKeys.length > 1 && <label className="row"><input type="checkbox" style={{ width: 'auto' }} checked={alsoSame} onChange={e => { setAlsoSame(e.target.checked); group.current = e.target.checked ? sameKeys : [selKey]; }} />{locale === 'zh' ? `同文案另外 ${sameKeys.length - 1} 处也一起改(默认只改这一处)` : tr('同文案另外 N 处也一起改(默认只改这一处)').replace('N', String(sameKeys.length - 1))}</label>}
              <textarea value={draft} onChange={e => onDraft(e.target.value)} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={e => { composing.current = false; onDraft(e.currentTarget.value); }} />
              {conflict && <div className="warn">{conflict} {tr('刚刚也改了这段文字;你继续输入会覆盖他的版本。')}</div>}
              <div className="grid">
                <label>{tr('字号 px')}<NumField prop="fontSize" unit="px" min={8} max={200} value={px(s.fontSize)} placeholder={tr('默认')} onCommit={v => setStyle('fontSize', v)} /></label>
                <label>{tr('字重')}<select value={s.fontWeight ?? ''} onChange={e => setStyle('fontWeight', e.target.value || null)}>
                  <option value="">{tr('默认')}</option>{[300, 400, 500, 600, 700, 800].map(w => <option key={w} value={w}>{w}</option>)}</select></label>
                <label>{tr('行高')}<NumField prop="lineHeight" step={0.1} min={0.8} max={3} value={s.lineHeight ?? ''} placeholder={tr('默认')} onCommit={v => setStyle('lineHeight', v)} /></label>
                <label>{tr('字距 px')}<NumField prop="letterSpacing" unit="px" step={0.5} value={px(s.letterSpacing)} placeholder={tr('默认')} onCommit={v => setStyle('letterSpacing', v)} /></label>
                <label>{tr('上间距 px')}<NumField prop="marginTop" unit="px" value={px(s.marginTop)} placeholder={tr('默认')} onCommit={v => setStyle('marginTop', v)} /></label>
                <label>{tr('下间距 px')}<NumField prop="marginBottom" unit="px" value={px(s.marginBottom)} placeholder={tr('默认')} onCommit={v => setStyle('marginBottom', v)} /></label>
              </div>
              <div className="row">
                {(['left', 'center', 'right'] as const).map(a => <button key={a} className={s.textAlign === a ? 'on' : ''} onClick={() => setStyle('textAlign', s.textAlign === a ? null : a)}>{{ left: tr('左'), center: tr('中'), right: tr('右') }[a]}</button>)}
                <input type="color" style={{ width: 44, padding: 2 }} value={s.color?.startsWith('#') ? s.color : '#000000'} onChange={e => setStyle('color', e.target.value)} title={tr('文字颜色')} />
                {s.color && <button onClick={() => setStyle('color', null)}>{tr('清除色')}</button>}
              </div>
              <label className="row"><input type="checkbox" style={{ width: 'auto' }} checked={!!s.hidden} onChange={e => setStyle('hidden', e.target.checked ? '1' : null)} />{tr('隐藏这段文字')}</label>
              <div className="row">
                <button disabled={!edited} onClick={reset}>{tr('恢复原文和样式')}</button>
                <button onClick={() => select(null)}>{tr('完成')}</button>
              </div>
              <button onClick={() => openHistory(selKey)}>{showHistory ? tr('收起历史') : tr('历史版本')}</button>
              {showHistory && <HistoryList versions={versions} onRestore={restore} tr={tr} locale={locale} />}
            </>
          )}
        </div>
      )}
      <footer>{tr('改动实时保存为云端草稿,发布上线由管理员完成。')}</footer>
    </div>
  );
}
