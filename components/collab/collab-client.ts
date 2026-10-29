import type { CollabDoc, Entry, Peer, StyleProp, Version } from './collab-types';

export type CollabStatus = 'connecting' | 'online' | 'denied' | 'offline';
type Handlers = {
  onStatus(status: CollabStatus): void;
  onWelcome(me: { id: string; color: string }, doc: CollabDoc): void;
  onEntry(locale: string, key: string, entry: Entry | null, from: string): void;
  onPresence(peers: Peer[]): void;
};

/** WebSocket link to the collab worker; reconnects on its own until `close()` or a rejected password. */
export class CollabClient {
  private ws: WebSocket | null = null;
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private closed = false;

  constructor(private url: string, private name: string, private password: string, private on: Handlers) {
    this.open();
  }

  private open() {
    this.on.onStatus('connecting');
    const ws = new WebSocket(this.url.replace(/^http/, 'ws') + '/ws');
    this.ws = ws;
    ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', name: this.name, password: this.password }));
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.t === 'welcome') { this.retry = 0; this.on.onStatus('online'); this.on.onWelcome({ id: msg.id, color: msg.color }, msg.doc); }
      else if (msg.t === 'denied') { this.closed = true; this.on.onStatus('denied'); }
      else if (msg.t === 'entry') this.on.onEntry(msg.locale, msg.key, msg.entry, msg.from);
      else if (msg.t === 'presence') this.on.onPresence(msg.peers);
    };
    ws.onclose = () => {
      if (this.closed) return;
      this.on.onStatus('offline');
      this.timer = setTimeout(() => this.open(), Math.min(1000 * 2 ** this.retry++, 15000));
    };
  }

  private send(payload: unknown) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(payload)); }
  set(locale: string, key: string, patch: { t?: string | null; o?: string; s?: Partial<Record<StyleProp, string | null>> }) { this.send({ t: 'set', locale, key, patch }); }
  reset(locale: string, key: string) { this.send({ t: 'reset', locale, key }); }
  focus(locale: string, key: string | null) { this.send({ t: 'focus', locale, key }); }
  /** Past versions of one text (or the latest changes anywhere when `key` is omitted), newest first. */
  async history(locale: string, key?: string, limit = 30): Promise<Version[]> {
    const q = new URLSearchParams({ locale, limit: String(limit), ...(key && { key }) });
    const res = await fetch(`${this.url}/history?${q}`, { cache: 'no-store' });
    return res.ok ? (await res.json()).versions ?? [] : [];
  }
  close() { this.closed = true; clearTimeout(this.timer); this.ws?.close(); }
}
