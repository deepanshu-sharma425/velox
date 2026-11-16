"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DICTS } from "./i18n";
import { Currency, isCurrency, money as fmtMoney } from "./finance";

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
  /** `method` says what paid it; older records without one were paid from the Velox card. */
  payments: { date: string; amount: number; method?: "velox" | "card"; card4?: string }[];
  /** Where the money was sent: the Velox card, an external bank card or a linked bank account. */
  payout?: "velox" | "card" | "bank";
  card4?: string;
  /** Linked bank (payout = "bank"). */
  bank?: string;
  /** Promo discount on service fees (0–1). */
  feeDiscount?: number;
  /** Borrower's e-signature on the loan agreement. */
  signature?: Signature;
  purpose?: string;
  closedAt?: string;
};

/** Drawn strokes are point lists in a 0–1000 × 0–300 box; typed signatures keep the text. */
export type Signature = { kind: "draw"; strokes: number[][] } | { kind: "type"; text: string };

export type CardSettings = { frozen: boolean; online: boolean; contactless: boolean; atm: boolean; limit: number };
export const DEFAULT_CARD: CardSettings = { frozen: false, online: true, contactless: true, atm: true, limit: 5000 };

export type Subscription = { email: string; name?: string; source: string; date: string };
export type CallRequest = { name: string; phone: string; date: string };

type Data = { loans: Loan[]; subscriptions: Subscription[]; calls: CallRequest[]; card?: CardSettings };

export type ApplyPreset = { amount?: number; months?: number; plan?: string; promo?: string };

export type ModalState =
  | { type: "apply"; preset: ApplyPreset }
  | { type: "pay"; loanId?: string }
  | { type: "account" }
  | { type: "info"; key: string }
  | { type: "menu"; nav?: { id: string; label: string }[] }
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
/** Cinematic login/signup hand-off rendered above every page. */
export type AuthFx = { phase: "fly" | "type" | "exit"; name: string; mode: "login" | "signup" } | null;
type AuthResult = { ok: true; user: User } | { ok: false; error: string; field?: string };

type Ctx = Data & {
  ready: boolean;
  modal: ModalState;
  open: (m: ModalState) => void;
  close: () => void;
  toast: (msg: string) => void;
  toasts: { id: number; msg: string }[];
  addLoan: (l: Omit<Loan, "id" | "createdAt" | "paid" | "status" | "payments">) => Loan;
  pay: (loanId: string, amount: number, method?: "velox" | "card", card4?: string) => Loan | undefined;
  /** The name printed on the customer's Velox card: the account name, or the latest borrower name for guests. */
  holderName: string;
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
  authFx: AuthFx;
  setAuthFx: (f: AuthFx) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Formats a USD-base amount in the visitor's currency. */
  money: (usdAmount: number, cents?: boolean) => string;
  card: CardSettings;
  setCard: (patch: Partial<CardSettings>) => void;
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
  const [authFx, setAuthFx] = useState<AuthFx>(null);
  const [currency, setCurrencyState] = useState<Currency>("USD");
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
      const c = localStorage.getItem(KEY + ":cur");
      if (isCurrency(c)) setCurrencyState(c);
    } catch {}
  }, []);

  // load the data bucket of the current user (server first) or the guest (local)
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    const local = (k: string): Data | null => {
      try {
        const raw = localStorage.getItem(k);
        return raw ? { ...EMPTY, ...JSON.parse(raw) } : null;
      } catch {
        return null;
      }
    };
    const isEmpty = (d: Data | null) => !d || (!d.loans.length && !d.subscriptions.length && !d.calls.length && !d.card);
    const finish = (d: Data) => {
      if (cancelled) return;
      setData(d);
      loadedKey.current = dataKey;
      setReady(true);
    };
    if (!user) {
      finish(local(dataKey) ?? EMPTY);
      return;
    }
    loadedKey.current = null; // block saves until the server answered
    fetch("/api/data", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { data: null }))
      .catch(() => ({ data: null }))
      .then(({ data: remote }) => {
        if (remote && !isEmpty({ ...EMPTY, ...remote })) return finish({ ...EMPTY, ...remote });
        // first sign-in: keep anything the visitor did as a guest
        const mine = local(dataKey);
        finish(!isEmpty(mine) ? mine! : local(KEY) ?? EMPTY);
      });
    return () => {
      cancelled = true;
    };
  }, [dataKey, authReady, user]);

  // persist: localStorage always, Postgres (debounced) when signed in
  useEffect(() => {
    if (!ready || loadedKey.current !== dataKey) return;
    try {
      localStorage.setItem(dataKey, JSON.stringify(data));
    } catch {}
    if (!user) return;
    const id = setTimeout(() => {
      fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(data),
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(id);
  }, [data, ready, dataKey, user]);

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

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(KEY + ":cur", c);
    } catch {}
  }, []);
  const money = useCallback((n: number, cents = false) => fmtMoney(n, currency, cents), [currency]);
  const card = useMemo(() => ({ ...DEFAULT_CARD, ...data.card }), [data.card]);

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
      authFx,
      setAuthFx,
      currency,
      setCurrency,
      money,
      card,
      setCard: (patch) => setData((d) => ({ ...d, card: { ...DEFAULT_CARD, ...d.card, ...patch } })),
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
      holderName: (user?.name ?? data.loans[0]?.name ?? "").trim(),
      pay: (loanId, amount, method = "velox", card4) => {
        const cur = data.loans.find((l) => l.id === loanId);
        if (!cur || cur.status !== "active") return undefined;
        const paid = Math.min(cur.total, Math.round((cur.paid + amount) * 100) / 100);
        const closed = cur.total - paid < 0.01;
        const now = new Date().toISOString();
        const updated: Loan = {
          ...cur,
          paid: closed ? cur.total : paid,
          status: closed ? "closed" : "active",
          closedAt: closed ? now : undefined,
          payments: [{ date: now, amount, method, ...(method === "card" && card4 ? { card4 } : {}) }, ...cur.payments],
        };
        setData((d) => ({ ...d, loans: d.loans.map((l) => (l.id === loanId ? updated : l)) }));
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
    [data, ready, modal, toast, toasts, lang, setLang, t, user, authReady, login, signup, logout, authFx, currency, setCurrency, money, card],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}

/** Each signed-in customer gets a stable virtual Velox card number. */
export function veloxCard(seed?: string) {
  let h = 7;
  for (const c of seed ?? "guest") h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pick = (n: number, salt: number) => String(Math.floor(((h ^ salt) >>> 0) % 10 ** n)).padStart(n, "0");
  const last4 = seed ? String(1000 + (h % 9000)) : "7390";
  return {
    first4: "4821",
    last4,
    /** the eight hidden middle digits, shown on the back of the card */
    mid: `${pick(4, 0x5bd1e995)} ${pick(4, 0x27d4eb2f)}`,
    cvv: pick(3, 0x165667b1),
    expiry: "09/29",
  };
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

/** One wording for "where did the money go", used by every screen and the PDF. */
export function payoutText(l: Pick<Loan, "payout" | "bank" | "card4">, t: (s: string) => string = (x) => x) {
  const where = l.payout === "bank" ? l.bank ?? t("Bank account") : l.payout === "card" ? t("Bank card") : t("Velox card");
  return l.card4 ? `${where} •••• ${l.card4}` : where;
}
