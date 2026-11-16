"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Building2, Check, Eraser, LoaderCircle, Lock, PenLine, Search, ShieldCheck, Type, Undo2, X } from "lucide-react";
import { EASE } from "@/lib/motion";
import type { Signature } from "@/lib/store";
import LiquidNav from "./LiquidNav";

export function Field({
  label,
  error,
  children,
  className,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  hint?: React.ReactNode;
}) {
  return (
    <label className={`mfield ${error ? "has-error" : ""} ${className ?? ""}`}>
      <span className="mfield-label">
        {label}
        {hint && <span className="mfield-hint">{hint}</span>}
      </span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Shell({
  title,
  children,
  wide,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div data-lenis-prevent className={`modal glass ${wide ? "is-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X strokeWidth={1.3} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/* =========================================================
   Signature pad — draw with mouse / finger / pen, or type.
   Strokes are stored in a 1000 × 300 box so they scale into
   the PDF agreement unchanged.
   ========================================================= */

const BOX_W = 1000;
const BOX_H = 300;
const MAX_POINTS = 2800;

function strokeLength(strokes: number[][]) {
  let len = 0;
  for (const s of strokes) for (let i = 2; i < s.length; i += 2) len += Math.hypot(s[i] - s[i - 2], s[i + 1] - s[i - 1]);
  return len;
}

export const signatureValid = (sig: Signature | null) =>
  !!sig && (sig.kind === "type" ? sig.text.trim().length >= 2 : strokeLength(sig.strokes) > 180);

export function SignaturePad({
  value,
  onChange,
  name,
  labels,
  error,
}: {
  value: Signature | null;
  onChange: (s: Signature | null) => void;
  name: string;
  labels: { draw: string; type: string; here: string; clear: string; undo: string; typed: string; signedAs: string };
  error?: string;
}) {
  const [mode, setMode] = useState<"draw" | "type">(value?.kind ?? "draw");
  const [typed, setTyped] = useState(value?.kind === "type" ? value.text : name);
  const canvas = useRef<HTMLCanvasElement>(null);
  const strokes = useRef<number[][]>(value?.kind === "draw" ? value.strokes.map((s) => [...s]) : []);
  const drawing = useRef<{ id: number } | null>(null);
  const [count, setCount] = useState(strokes.current.length);

  const paint = () => {
    const c = canvas.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const g = c.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const sx = w / BOX_W;
    const sy = h / BOX_H;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = "#fff";
    g.fillStyle = "#fff";
    for (const s of strokes.current) {
      if (s.length === 2) {
        g.beginPath();
        g.arc(s[0] * sx, s[1] * sy, 1.6, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      // quadratic curves through midpoints; width thins out as the pen speeds up
      for (let i = 2; i < s.length; i += 2) {
        const x0 = s[i - 2] * sx, y0 = s[i - 1] * sy;
        const x1 = s[i] * sx, y1 = s[i + 1] * sy;
        const xp = i >= 4 ? s[i - 4] * sx : x0, yp = i >= 4 ? s[i - 3] * sy : y0;
        const v = Math.hypot(x1 - x0, y1 - y0);
        g.lineWidth = Math.max(1.1, 3.2 - v * 0.09);
        g.beginPath();
        g.moveTo((xp + x0) / 2, (yp + y0) / 2);
        g.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
        g.stroke();
      }
    }
  };

  useEffect(() => {
    if (mode !== "draw") return;
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(canvas.current!);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const emit = () => {
    setCount(strokes.current.length);
    onChange(strokes.current.length ? { kind: "draw", strokes: strokes.current.map((s) => s.map((v) => Math.round(v))) } : null);
  };
  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * BOX_W, ((e.clientY - r.top) / r.height) * BOX_H];
  };
  const total = () => strokes.current.reduce((a, s) => a + s.length / 2, 0);

  const switchMode = (m: "draw" | "type") => {
    setMode(m);
    if (m === "type") onChange(typed.trim() ? { kind: "type", text: typed.trim() } : null);
    else emit();
  };

  return (
    <div className={`sig ${error ? "has-error" : ""}`}>
      <div className="sig-head">
        <LiquidNav
          label={labels.draw + " / " + labels.type}
          className="lseg"
          itemClassName="lseg-item"
          active={mode}
          items={[
            { id: "draw", label: labels.draw, icon: <PenLine strokeWidth={1.5} /> },
            { id: "type", label: labels.type, icon: <Type strokeWidth={1.5} /> },
          ]}
          onSelect={(id) => switchMode(id as "draw" | "type")}
        />
        {mode === "draw" && (
          <div className="sig-tools">
            <button
              type="button"
              disabled={!count}
              onClick={() => {
                strokes.current.pop();
                paint();
                emit();
              }}
              aria-label={labels.undo}
              title={labels.undo}
            >
              <Undo2 strokeWidth={1.5} />
            </button>
            <button
              type="button"
              disabled={!count}
              onClick={() => {
                strokes.current = [];
                paint();
                emit();
              }}
            >
              <Eraser strokeWidth={1.5} /> {labels.clear}
            </button>
          </div>
        )}
      </div>

      <div className="sig-box">
        {mode === "draw" ? (
          <>
            <canvas
              ref={canvas}
              className="sig-canvas"
              aria-label={labels.here}
              role="img"
              onPointerDown={(e) => {
                if (total() > MAX_POINTS) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                drawing.current = { id: e.pointerId };
                strokes.current.push(point(e));
                paint();
              }}
              onPointerMove={(e) => {
                const d = drawing.current;
                if (!d || d.id !== e.pointerId) return;
                const s = strokes.current[strokes.current.length - 1];
                const [x, y] = point(e);
                if (Math.hypot(x - s[s.length - 2], y - s[s.length - 1]) < 5 || total() > MAX_POINTS) return;
                s.push(x, y);
                paint();
              }}
              onPointerUp={() => {
                if (!drawing.current) return;
                drawing.current = null;
                emit();
              }}
              onPointerCancel={() => {
                drawing.current = null;
                emit();
              }}
            />
            <AnimatePresence>
              {!count && (
                <motion.span className="sig-ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {labels.here}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        ) : (
          <input
            className="sig-typed"
            value={typed}
            maxLength={40}
            autoFocus
            aria-label={labels.typed}
            placeholder={name || "Jane Doe"}
            onChange={(e) => {
              setTyped(e.target.value);
              onChange(e.target.value.trim() ? { kind: "type", text: e.target.value.trim() } : null);
            }}
          />
        )}
        <span className="sig-x" aria-hidden>
          ×
        </span>
        <span className="sig-line" aria-hidden />
      </div>
      <p className="sig-foot">
        {labels.signedAs} <b>{name || "—"}</b> · {new Date().toLocaleDateString("en-GB")}
      </p>
      {error && <p className="field-error static">{error}</p>}
    </div>
  );
}

/* =========================================================
   Velox Connect — simulated instant bank-account linking.
   Fictional banks; any credentials work.
   ========================================================= */

export type LinkedAccount = { bank: string; type: "Checking" | "Savings"; mask: string; balance: number; color: string };

const BANKS = [
  { name: "Northwind Bank", color: "#2f6fed" },
  { name: "Summit Federal", color: "#0f9d76" },
  { name: "Harbor Trust", color: "#8a5cf6" },
  { name: "Atlas Credit Union", color: "#e0a100" },
  { name: "Meridian Savings", color: "#e2475b" },
  { name: "Pioneer National", color: "#14a3c7" },
  { name: "Redwood Community Bank", color: "#b5542c" },
  { name: "Bluestone Financial", color: "#4a63d6" },
];

const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
};

export function BankLink({
  onLinked,
  onCancel,
  t,
  money,
}: {
  onLinked: (a: LinkedAccount) => void;
  onCancel: () => void;
  t: (s: string) => string;
  money: (n: number, cents?: boolean) => string;
}) {
  const [stage, setStage] = useState<"pick" | "login" | "connect" | "accounts">("pick");
  const [q, setQ] = useState("");
  const [bank, setBank] = useState(BANKS[0]);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);
  const [pick, setPick] = useState(0);
  const self = useRef<HTMLDivElement>(null);
  useEffect(() => {
    self.current?.parentElement?.scrollTo({ top: 0, left: 0 });
  }, []);

  const accounts = useMemo<LinkedAccount[]>(() => {
    const h = hash(bank.name + user.toLowerCase());
    return [
      { bank: bank.name, type: "Checking", mask: String(1000 + (h % 9000)), balance: 1200 + (h % 680000) / 100, color: bank.color },
      { bank: bank.name, type: "Savings", mask: String(1000 + ((h >>> 7) % 9000)), balance: 4000 + ((h >>> 3) % 2400000) / 100, color: bank.color },
    ];
  }, [bank, user]);

  const STEPS = [t("Establishing a secure connection"), t("Verifying your credentials"), t("Retrieving your accounts")];

  useEffect(() => {
    if (stage !== "connect") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gap = reduced ? 120 : 700;
    setTick(0);
    const ids = [1, 2, 3].map((n) => setTimeout(() => setTick(n), gap * n));
    ids.push(setTimeout(() => setStage("accounts"), gap * 3 + 350));
    return () => ids.forEach(clearTimeout);
  }, [stage]);

  const list = BANKS.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  const back = () => (stage === "login" ? setStage("pick") : stage === "accounts" ? setStage("login") : onCancel());

  return (
    <motion.div
      ref={self}
      className="bl"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE }}
      role="dialog"
      aria-label={t("Link your bank")}
    >
      <div className="bl-top">
        {stage !== "connect" ? (
          <button type="button" className="icon-btn" onClick={back} aria-label={t("Back")}>
            <ArrowLeft strokeWidth={1.4} />
          </button>
        ) : (
          <span />
        )}
        <span className="bl-brand">
          <ShieldCheck strokeWidth={1.6} /> Velox Connect
        </span>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label={t("Close")}>
          <X strokeWidth={1.3} />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {stage === "pick" && (
          <motion.div key="pick" className="bl-body" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <h3 className="bl-title">{t("Select your bank")}</h3>
            <label className="bl-search">
              <Search strokeWidth={1.5} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search 8 institutions")} aria-label={t("Search banks")} autoFocus />
            </label>
            <div className="bl-grid">
              {list.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  className="bl-bank"
                  onClick={() => {
                    setBank(b);
                    setErr({});
                    setStage("login");
                  }}
                >
                  <span className="bl-logo">
                    {b.name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                  <span>{b.name}</span>
                </button>
              ))}
              {!list.length && <p className="small-muted bl-none">{t("No banks match your search.")}</p>}
            </div>
            <p className="bl-fine">
              <Lock strokeWidth={1.5} /> {t("Velox never sees or stores your bank login. Read-only access, revoke anytime.")}
            </p>
          </motion.div>
        )}

        {stage === "login" && (
          <motion.form
            key="login"
            className="bl-body"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            onSubmit={(e) => {
              e.preventDefault();
              const er: Record<string, string> = {};
              if (user.trim().length < 3) er.user = t("Enter your online banking username");
              if (pass.length < 4) er.pass = t("Enter your password");
              setErr(er);
              if (!Object.keys(er).length) setStage("connect");
            }}
          >
            <span className="bl-logo is-lg">
              <Building2 strokeWidth={1.3} />
            </span>
            <h3 className="bl-title center">
              {t("Log in to")} {bank.name}
            </h3>
            <p className="small-muted center bl-sub">{t("Demo mode — any username and password will work.")}</p>
            <div className="mgrid one">
              <Field label={t("Username")} error={err.user}>
                <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" autoFocus placeholder="jane.doe" />
              </Field>
              <Field label={t("Password")} error={err.pass}>
                <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete="off" placeholder="••••••••" />
              </Field>
            </div>
            <button className="btn btn-primary bl-cta" type="submit">
              {t("Connect securely")}
            </button>
          </motion.form>
        )}

        {stage === "connect" && (
          <motion.div key="connect" className="bl-body center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} aria-live="polite">
            <div className="bl-handshake" aria-hidden>
              <span className="bl-logo is-lg">
                <Building2 strokeWidth={1.3} />
              </span>
              <span className="bl-wire">
                <i />
              </span>
              <span className="bl-logo is-lg is-velox">V</span>
            </div>
            <h3 className="bl-title">{t("Connecting to")} {bank.name}</h3>
            <ul className="lm-checks bl-checks">
              {STEPS.map((c, i) => (
                <li key={c} className={i < tick ? "is-done" : i === tick ? "is-busy" : ""}>
                  <span className="lm-check-ic">
                    {i < tick ? <Check strokeWidth={2.4} /> : i === tick ? <LoaderCircle className="spin-sm" strokeWidth={1.8} /> : null}
                  </span>
                  {c}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {stage === "accounts" && (
          <motion.div key="acc" className="bl-body" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <h3 className="bl-title">{t("Choose an account")}</h3>
            <p className="small-muted bl-sub">{t("Your loan will be deposited here and repayments can be debited automatically.")}</p>
            <div className="bl-accts" role="radiogroup">
              {accounts.map((a, i) => (
                <button key={a.type} type="button" role="radio" aria-checked={pick === i} className={`bl-acct ${pick === i ? "is-active" : ""}`} onClick={() => setPick(i)}>
                  <span>
                    <b>
                      {t(a.type)} •••• {a.mask}
                    </b>
                    <small>{a.bank}</small>
                  </span>
                  <span className="bl-bal">{money(a.balance, true)}</span>
                  <i className="lm-radio" />
                </button>
              ))}
            </div>
            <button className="btn btn-primary bl-cta" type="button" onClick={() => onLinked(accounts[pick])}>
              {t("Link account")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
