'use client';
// ThemeProvider renders the `.v3` root and is the ONLY writer of `data-theme` (AMENDMENTS §A.5).
// Preference is stored in localStorage (try/catch; works without it). Root size is decided by the caller.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePref = 'dark' | 'light' | 'system';
type Resolved = 'dark' | 'light';
interface ThemeCtx { theme: ThemePref; resolved: Resolved; setTheme(t: ThemePref): void; cycle(): void }

const KEY = 'v3.theme';
const Ctx = createContext<ThemeCtx>({ theme: 'dark', resolved: 'dark', setTheme() {}, cycle() {} });
export const useTheme = () => useContext(Ctx);

function readPref(): ThemePref {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light' || v === 'system') return v;
  } catch { /* storage unavailable */ }
  return 'dark';
}
function systemTheme(): Resolved {
  try { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; } catch { return 'dark'; }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>('dark');
  const [sys, setSys] = useState<Resolved>('dark');

  useEffect(() => { setThemeState(readPref()); setSys(systemTheme()); }, []);
  useEffect(() => {
    let mq: MediaQueryList | null = null;
    try { mq = window.matchMedia('(prefers-color-scheme: light)'); } catch { return; }
    const on = () => setSys(mq && mq.matches ? 'light' : 'dark');
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => { if (typeof mq!.removeEventListener === "function") mq!.removeEventListener('change', on); else mq!.removeListener(on); };
  }, []);

  const setTheme = useCallback((t: ThemePref) => {
    setThemeState(t);
    try { window.localStorage.setItem(KEY, t); } catch { /* ignore */ }
  }, []);
  const cycle = useCallback(() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'), [theme, setTheme]);

  const resolved: Resolved = theme === 'system' ? sys : theme;
  const value = useMemo(() => ({ theme, resolved, setTheme, cycle }), [theme, resolved, setTheme, cycle]);
  return (
    <Ctx.Provider value={value}>
      <div className="v3" data-theme={resolved} data-theme-pref={theme} suppressHydrationWarning>{children}</div>
    </Ctx.Provider>
  );
}
