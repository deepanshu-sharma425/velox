"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DICTS } from "./i18n";

export type Loan = {
  id: string;
  plan: string;
  principal: number;
  months: number;
  monthly: number;
  total: number;
  paid: number;
  createdAt: string;
  name: string;
  email: string;
  status: "active" | "closed";
  payments: { date: string; amount: number }[];
};

export type Subscription = { email: string; name?: string; source: string; date: string };
export type CallRequest = { name: string; phone: string; date: string };

type Data = { loans: Loan[]; subscriptions: Subscription[]; calls: CallRequest[] };

export type ApplyPreset = { amount?: number; months?: number; plan?: string; promo?: string };

export type ModalState =
  | { type: "apply"; preset: ApplyPreset }
  | { type: "pay"; loanId?: string }
  | { type: "account" }
  | { type: "info"; key: string }
  | { type: "menu" }
  | null;

export type Lang = "ENG" | "ESP" | "DEU" | "FRA" | "HIN";
export const LANGS: { code: Lang; name: string }[] = [
  { code: "ENG", name: "English" },
  { code: "ESP", name: "Español" },
  { code: "DEU", name: "Deutsch" },
  { code: "FRA", name: "Français" },
  { code: "HIN", name: "हिन्दी" },
];
const HTML_LANG: Record<Lang, string> = { ENG: "en", ESP: "es", DEU: "de", FRA: "fr", HIN: "hi" };

export type User = { id: string; name: string; email: string; createdAt: string };
type AuthResult = { ok: true; user: User } | { ok: false; error: string; field?: string };

type Ctx = Data & {
  ready: boolean;
  modal: ModalState;
  open: (m: ModalState) => void;
  close: () => void;
  toast: (msg: string) => void;
  toasts: { id: number; msg: string }[];
  addLoan: (l: Omit<Loan, "id" | "createdAt" | "paid" | "status" | "payments">) => Loan;
  pay: (loanId: string, amount: number) => Loan | undefined;
  subscribe: (s: Omit<Subscription, "date">) => boolean;
  bookCall: (c: Omit<CallRequest, "date">) => void;
  reset: () => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: string) => string;
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
};

const KEY = "velox:v2";
const EMPTY: Data = { loans: [], subscriptions: [], calls: [] };
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const [lang, setLangState] = useState<Lang>("ENG");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const tid = useRef(0);
  const dataKey = user ? `${KEY}:${user.id}` : KEY;
  const loadedKey = useRef<string | null>(null);

  // who am I? (JWT in httpOnly cookie)
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => setAuthReady(true));
    try {
      const l = localStorage.getItem(KEY + ":lang") as Lang | null;
      if (l && LANGS.some((x) => x.code === l)) {
        setLangState(l);
        document.documentElement.lang = HTML_LANG[l];
      }
    } catch {}
  }, []);

  // load the data bucket of the current user (or guest)
  useEffect(() => {
    if (!authReady) return;
    try {
      const raw = localStorage.getItem(dataKey);
      setData(raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY);
    } catch {
      setData(EMPTY);
    }
    loadedKey.current = dataKey;
    setReady(true);
  }, [dataKey, authReady]);

  useEffect(() => {
    if (!ready || loadedKey.current !== dataKey) return;
    try {
      localStorage.setItem(dataKey, JSON.stringify(data));
    } catch {}
  }, [data, ready, dataKey]);

  useEffect(() => {
    document.documentElement.style.overflow = modal ? "hidden" : "";
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setModal(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal]);

  const toast = useCallback((msg: string) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = HTML_LANG[l];
    try {
      localStorage.setItem(KEY + ":lang", l);
    } catch {}
  }, []);

  const t = useCallback((s: string) => (lang === "ENG" ? s : DICTS[lang]?.[s] ?? s), [lang]);

  const authCall = useCallback(async (url: string, body: object): Promise<AuthResult> => {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, error: d.error ?? "Something went wrong.", field: d.field };
      setUser(d.user);
      return { ok: true, user: d.user };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  }, []);
  const login = useCallback(
    (email: string, password: string, remember = true) => authCall("/api/auth/login", { email, password, remember }),
    [authCall],
  );
  const signup = useCallback(
    (name: string, email: string, password: string) => authCall("/api/auth/signup", { name, email, password }),
    [authCall],
  );
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...data,
      ready,
      modal,
      open: setModal,
      close: () => setModal(null),
      toast,
      toasts,
      lang,
      setLang,
      t,
      user,
      authReady,
      login,
      signup,
      logout,
      addLoan: (l) => {
        const loan: Loan = {
          ...l,
          id: "VLX-" + Math.floor(100000 + Math.random() * 900000),
          createdAt: new Date().toISOString(),
          paid: 0,
          status: "active",
          payments: [],
        };
        setData((d) => ({ ...d, loans: [loan, ...d.loans] }));
        return loan;
      },
      pay: (loanId, amount) => {
        let updated: Loan | undefined;
        setData((d) => ({
          ...d,
          loans: d.loans.map((l) => {
            if (l.id !== loanId) return l;
            const paid = Math.min(l.total, Math.round((l.paid + amount) * 100) / 100);
            updated = {
              ...l,
              paid,
              status: paid >= l.total ? "closed" : "active",
              payments: [{ date: new Date().toISOString(), amount }, ...l.payments],
            };
            return updated;
          }),
        }));
        return updated;
      },
      subscribe: (s) => {
        const exists = data.subscriptions.some(
          (x) => x.email.toLowerCase() === s.email.toLowerCase() && x.source === s.source,
        );
        if (exists) return false;
        setData((d) => ({ ...d, subscriptions: [...d.subscriptions, { ...s, date: new Date().toISOString() }] }));
        return true;
      },
      bookCall: (c) => setData((d) => ({ ...d, calls: [...d.calls, { ...c, date: new Date().toISOString() }] })),
      reset: () => setData(EMPTY),
    }),
    [data, ready, modal, toast, toasts, lang, setLang, t, user, authReady, login, signup, logout],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = id === "home" ? 0 : el.getBoundingClientRect().top + window.scrollY - 20;
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
