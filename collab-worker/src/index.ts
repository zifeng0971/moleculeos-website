import { DurableObject } from 'cloudflare:workers';

/**
 * Realtime store for website text/layout edits. One Durable Object ("main") holds the whole document;
 * anyone can read /doc, anyone who says a name may write.
 * Edits are last-write-wins per message path and per field (text / each style property).
 */
interface Env { COLLAB: DurableObjectNamespace<Room> }

type StyleMap = Record<string, string>;
type Entry = { t?: string; o?: string; s?: StyleMap; by?: string; at?: number };
type Version = { at: number; by: string; locale: string; key: string; prev: Entry | null; next: Entry | null };
type Doc = { rev: number; overrides: Record<string, Record<string, Entry>> };
type Session = { id: string; name: string; color: string; authed: boolean; locale: string | null; key: string | null };

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,OPTIONS' };
const STYLE_PROPS = new Set(['fontSize', 'fontWeight', 'color', 'textAlign', 'lineHeight', 'letterSpacing', 'marginTop', 'marginBottom', 'hidden']);
const SAFE_VALUE = /^[\w#%.,() -]{1,40}$/;
const SAFE_KEY = /^[\w.-]{1,200}$/;
const LOCALES = new Set(['zh', 'en']);
const COLORS = ['#e5484d', '#3e63dd', '#30a46c', '#f76b15', '#8e4ec6', '#12a594', '#d6409f', '#978365'];
const MAX_TEXT = 4000;
const MAX_ENTRIES = 5000;
const MAX_HISTORY = 5000;
// Typing "0.9" digit by digit passes through "0": a line height of 0 stacks every line of text on top of the others.
const MIN_STYLE: Record<string, number> = { lineHeight: 0.5, fontSize: 6 };
const styleOk = (prop: string, value: string) => SAFE_VALUE.test(value) && !(prop in MIN_STYLE && !(parseFloat(value) >= MIN_STYLE[prop]));
// Edits by the same person to the same text within this window are one history step (typing makes a stream of them).
const COALESCE_MS = 60_000;
// A dangling separator dot at the end of a text ('设计分子·') is never intended; deleting a text entirely still works.
const tidy = (text: string) => { const cut = text.replace(/\s*[·・•∙][\s·・•∙]*$/, ''); return cut.trim() ? cut : text; };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (pathname === '/doc' || pathname === '/ws' || pathname === '/history') return env.COLLAB.get(env.COLLAB.idFromName('main')).fetch(request);
    return new Response('moleculeos-collab', { headers: CORS });
  },
};

export class Room extends DurableObject<Env> {
  doc: Doc = { rev: 0, overrides: {} };
  history: Version[] = [];

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.doc = (await ctx.storage.get<Doc>('doc')) ?? this.doc;
      this.history = (await ctx.storage.get<Version[]>('history')) ?? this.history;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/doc') return Response.json(this.doc, { headers: { ...CORS, 'cache-control': 'no-store' } });
    if (pathname === '/history') {
      const q = new URL(request.url).searchParams;
      const limit = Math.min(Number(q.get('limit')) || 50, 500);
      const list = this.history.filter(v => (!q.get('locale') || v.locale === q.get('locale')) && (!q.get('key') || v.key === q.get('key'))).slice(-limit).reverse();
      return Response.json({ versions: list }, { headers: { ...CORS, 'cache-control': 'no-store' } });
    }
    if (request.headers.get('upgrade') !== 'websocket') return new Response('expected websocket', { status: 426 });
    const pair = new WebSocketPair();
    const id = crypto.randomUUID().slice(0, 8);
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ id, name: 'guest', color: COLORS[parseInt(id.slice(0, 4), 16) % COLORS.length], authed: false, locale: null, key: null } satisfies Session);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    let msg: any;
    try { msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw)); } catch { return; }
    const me = ws.deserializeAttachment() as Session;

    if (msg.t === 'hello') {
      me.authed = true;
      me.name = String(msg.name ?? '').trim().slice(0, 24) || 'guest';
      ws.serializeAttachment(me);
      ws.send(JSON.stringify({ t: 'welcome', id: me.id, color: me.color, doc: this.doc }));
      this.broadcastPresence();
      return;
    }
    if (!me.authed) return;

    if (msg.t === 'focus') {
      me.locale = LOCALES.has(msg.locale) ? msg.locale : null;
      me.key = typeof msg.key === 'string' && SAFE_KEY.test(msg.key) ? msg.key : null;
      ws.serializeAttachment(me);
      this.broadcastPresence();
    } else if (msg.t === 'set' || msg.t === 'reset') {
      if (!LOCALES.has(msg.locale) || typeof msg.key !== 'string' || !SAFE_KEY.test(msg.key)) return;
      const entries = (this.doc.overrides[msg.locale] ??= {});
      const before: Entry | null = entries[msg.key] ? structuredClone(entries[msg.key]) : null;
      let entry: Entry | null = entries[msg.key] ?? null;
      if (msg.t === 'reset') entry = null;
      else {
        if (!entry && Object.values(this.doc.overrides).reduce((n, e) => n + Object.keys(e).length, 0) >= MAX_ENTRIES) return;
        entry = { ...entry };
        const patch = msg.patch ?? {};
        if (typeof patch.t === 'string' && patch.t.length <= MAX_TEXT) entry.t = tidy(patch.t);
        else if (patch.t === null) delete entry.t;
        if (typeof patch.o === 'string' && patch.o.length <= MAX_TEXT) entry.o = patch.o;
        if (patch.s && typeof patch.s === 'object') {
          const s: StyleMap = { ...entry.s };
          for (const [prop, value] of Object.entries(patch.s)) {
            if (!STYLE_PROPS.has(prop)) continue;
            if (value === null) delete s[prop];
            else if (typeof value === 'string' && styleOk(prop, value)) s[prop] = value;
          }
          if (Object.keys(s).length) entry.s = s; else delete entry.s;
        }
        if (entry.t === undefined && !entry.s) entry = null;
        else { entry.by = me.name; entry.at = Date.now(); }
      }
      if (entry) entries[msg.key] = entry; else delete entries[msg.key];
      this.doc.rev++;
      this.record({ at: Date.now(), by: me.name, locale: msg.locale, key: msg.key, prev: before, next: entry ? structuredClone(entry) : null });
      await this.ctx.storage.put('doc', this.doc);
      await this.ctx.storage.put('history', this.history);
      this.broadcast({ t: 'entry', locale: msg.locale, key: msg.key, entry, rev: this.doc.rev, from: me.id });
    }
  }

  webSocketClose() { this.broadcastPresence(); }
  webSocketError() { this.broadcastPresence(); }

  /** Every change stays in the history, so any earlier wording or style can be brought back. */
  private record(v: Version) {
    const last = this.history[this.history.length - 1];
    if (last && last.by === v.by && last.locale === v.locale && last.key === v.key && v.at - last.at < COALESCE_MS) { last.at = v.at; last.next = v.next; }
    else this.history.push(v);
    if (this.history.length > MAX_HISTORY) this.history.splice(0, this.history.length - MAX_HISTORY);
  }

  private broadcast(payload: unknown) {
    const data = JSON.stringify(payload);
    for (const ws of this.ctx.getWebSockets()) if ((ws.deserializeAttachment() as Session).authed) { try { ws.send(data); } catch { /* socket already gone */ } }
  }

  private broadcastPresence() {
    const peers = this.ctx.getWebSockets().map(ws => ws.deserializeAttachment() as Session).filter(s => s.authed)
      .map(({ id, name, color, locale, key }) => ({ id, name, color, locale, key }));
    this.broadcast({ t: 'presence', peers });
  }
}
