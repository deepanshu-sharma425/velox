"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, LoaderCircle, X } from "lucide-react";
import { IconUser, Logo } from "./Icons";
import { NAV } from "./Header";
import { INFO, PLANS } from "@/lib/content";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_STEP,
  PROMO_CODES,
  TERM_MAX,
  TERM_MIN,
  addMonths,
  clamp,
  ddmmyyyy,
  quote,
  usd,
} from "@/lib/finance";
import { ApplyPreset, LANGS, Loan, isEmail, scrollToId, useStore } from "@/lib/store";
import Celebration from "./Celebration";

/* ---------- helpers ---------- */

const luhn = (num: string) => {
  const d = num.replace(/\D/g, "");
  if (d.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
};
const fmtCard = (s: string) =>
  s
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
const fmtExp = (s: string) => {
  const d = s.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
};
const expValid = (s: string) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(s);
  if (!m) return false;
  const mo = Number(m[1]);
  const yr = 2000 + Number(m[2]);
  if (mo < 1 || mo > 12) return false;
  const end = new Date(yr, mo, 0, 23, 59);
  return end >= new Date();
};
const ageOf = (iso: string) => {
  const b = new Date(iso);
  if (isNaN(+b)) return -1;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`mfield ${error ? "has-error" : ""} ${className ?? ""}`}>
      <span className="mfield-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function Shell({
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

/* ---------- Apply ---------- */

function ApplyModal({ preset }: { preset: ApplyPreset }) {
  const { t, close, addLoan, open, user } = useStore();
  const [step, setStep] = useState(0);
  const [planName, setPlanName] = useState(preset.plan ?? "");
  const plan = PLANS.find((p) => p.name === planName);
  const lim = {
    min: plan?.min ?? AMOUNT_MIN,
    max: plan?.max ?? AMOUNT_MAX,
    term: plan?.term ?? TERM_MAX,
  };
  const [amount, setAmount] = useState(clamp(preset.amount ?? 15000, lim.min, lim.max));
  const [months, setMonths] = useState(clamp(preset.months ?? 12, TERM_MIN, lim.term));
  const [purpose, setPurpose] = useState("Everyday expenses");
  const [promo] = useState(preset.promo ?? "");
  const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "", dob: "", idn: "", tax: "", card: "" });
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"form" | "processing" | "done">("form");
  const [loan, setLoan] = useState<Loan | null>(null);

  useEffect(() => {
    setAmount((a) => clamp(a, lim.min, lim.max));
    setMonths((m) => clamp(m, TERM_MIN, lim.term));
  }, [lim.min, lim.max, lim.term]);

  const q = useMemo(() => quote(amount, months, PROMO_CODES[promo]?.discount ?? 0), [amount, months, promo]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (f.name.trim().split(/\s+/).length < 2) e.name = t("Enter your first and last name");
      if (!isEmail(f.email)) e.email = t("Please enter a valid e-mail");
      if (f.phone.replace(/\D/g, "").length < 7) e.phone = t("Please enter a full phone number");
      const age = ageOf(f.dob);
      if (age < 18 || age > 65) e.dob = t("The applicant must be between 18 and 65 years old.");
      if (f.idn.trim().length < 6) e.idn = t("Enter a valid ID number");
      if (f.tax.replace(/\D/g, "").length < 9) e.tax = t("Tax ID must have at least 9 digits");
      if (!luhn(f.card)) e.card = t("Enter a valid card number");
    }
    if (step === 2 && !agree) e.agree = t("Please accept the terms to continue");
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step < 2) return setStep(step + 1);
    setPhase("processing");
    setTimeout(() => {
      const l = addLoan({
        plan: planName || "Custom",
        principal: amount,
        months,
        monthly: q.monthly,
        total: q.total,
        name: f.name.trim(),
        email: f.email.trim(),
      });
      setLoan(l);
      setPhase("done");
    }, 1800);
  };

  const steps = [t("Loan details"), t("Personal details"), t("Review")];

  if (phase === "done" && loan)
    return (
      <Celebration
        loan={loan}
        card4={f.card.replace(/\D/g, "").slice(-4)}
        onClose={close}
        onAccount={() => open({ type: "account" })}
      />
    );

  return (
    <Shell title={t("Loan application")} onClose={close} wide>
      {phase === "processing" && (
        <div className="state">
          <LoaderCircle className="spin" strokeWidth={1.2} />
          <p className="state-title">{t("Our system is reviewing your request…")}</p>
          <p className="small-muted">{t("Decisions usually take less than 2 minutes.")}</p>
        </div>
      )}
      {phase === "done" && loan && (
        <div className="state">
          <span className="done-check big">
            <Check strokeWidth={1.4} />
          </span>
          <p className="state-title">{t("Approved!")}</p>
          <p className="small-muted">
            {t("Loan")} <b>{loan.id}</b> — {usd(loan.principal)} {t("will be sent to card")} •••• {f.card.replace(/\D/g, "").slice(-4)}.
          </p>
          <div className="summary">
            <div>
              <span>{t("Monthly payment")}</span>
              <b>{usd(loan.monthly, true)}</b>
            </div>
            <div>
              <span>{t("First payment date")}</span>
              <b>{ddmmyyyy(addMonths(new Date(), 1))}</b>
            </div>
            <div>
              <span>{t("Loan repayment amount")}</span>
              <b>{usd(loan.total)}</b>
            </div>
          </div>
          <div className="modal-actions center">
            <button className="btn btn-ghost" onClick={close}>
              {t("Close")}
            </button>
            <button className="btn btn-primary" onClick={() => open({ type: "account" })}>
              {t("My Account")}
            </button>
          </div>
        </div>
      )}
      {phase === "form" && (
        <>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
                <span>{i < step ? <Check strokeWidth={2} /> : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>

          {step === 0 && (
            <div className="mgrid">
              <Field label={t("Credit plan")}>
                <div className="select">
                  <select value={planName} onChange={(e) => setPlanName(e.target.value)}>
                    <option value="">{t("Custom (calculator)")}</option>
                    {PLANS.map((p) => (
                      <option key={p.id} value={p.name}>
                        {t(p.name)} · {usd(p.min)}–{usd(p.max)} · {t("up to")} {p.term} {t("mo")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown strokeWidth={1.3} />
                </div>
              </Field>
              <Field label={t("Purpose")}>
                <div className="select">
                  <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                    {["Everyday expenses", "Travel", "Car repair", "Education", "Home improvement", "Medical", "Other"].map((p) => (
                      <option key={p} value={p}>
                        {t(p)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown strokeWidth={1.3} />
                </div>
              </Field>
              <Field label={`${t("Amount")} · ${usd(lim.min)}–${usd(lim.max)}`} className="span2">
                <div className="mrange">
                  <input
                    type="range"
                    className="range"
                    min={lim.min}
                    max={lim.max}
                    step={AMOUNT_STEP}
                    value={amount}
                    style={{ "--p": `${((amount - lim.min) / (lim.max - lim.min)) * 100}%` } as React.CSSProperties}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                  <b>{usd(amount)}</b>
                </div>
              </Field>
              <Field label={`${t("Term")} · 1–${lim.term} ${t("months")}`} className="span2">
                <div className="mrange">
                  <input
                    type="range"
                    className="range"
                    min={TERM_MIN}
                    max={lim.term}
                    step={1}
                    value={months}
                    disabled={lim.term === 1}
                    style={{ "--p": `${lim.term === 1 ? 100 : ((months - 1) / (lim.term - 1)) * 100}%` } as React.CSSProperties}
                    onChange={(e) => setMonths(Number(e.target.value))}
                  />
                  <b>
                    {months} {t(months === 1 ? "month" : "months")}
                  </b>
                </div>
              </Field>
              <div className="summary span2">
                <div>
                  <span>{t("Monthly payment")}</span>
                  <b>{usd(q.monthly, true)}</b>
                </div>
                <div>
                  <span>{t("Service Fees & Commissions")}</span>
                  <b>{usd(q.fees)}</b>
                </div>
                <div>
                  <span>{t("Loan repayment amount")}</span>
                  <b>{usd(q.total)}</b>
                </div>
                {promo && (
                  <div className="ok">
                    <span>{t("Promo code")}</span>
                    <b>{promo}</b>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="mgrid">
              <Field label={t("Full name")} error={err.name}>
                <input value={f.name} onChange={set("name")} autoComplete="name" placeholder="John Smith" />
              </Field>
              <Field label={t("E-mail")} error={err.email}>
                <input value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="you@example.com" />
              </Field>
              <Field label={t("Phone")} error={err.phone}>
                <input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" />
              </Field>
              <Field label={t("Date of birth")} error={err.dob}>
                <input value={f.dob} onChange={set("dob")} type="date" />
              </Field>
              <Field label={t("ID number")} error={err.idn}>
                <input value={f.idn} onChange={set("idn")} placeholder="AB1234567" />
              </Field>
              <Field label={t("Tax ID number")} error={err.tax}>
                <input value={f.tax} onChange={set("tax")} inputMode="numeric" placeholder="123-45-6789" />
              </Field>
              <Field label={t("Bank card for payout")} error={err.card} className="span2">
                <input
                  value={f.card}
                  onChange={(e) => setF((x) => ({ ...x, card: fmtCard(e.target.value) }))}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="summary review">
                <div>
                  <span>{t("Credit plan")}</span>
                  <b>{planName ? t(planName) : t("Custom")}</b>
                </div>
                <div>
                  <span>{t("Purpose")}</span>
                  <b>{t(purpose)}</b>
                </div>
                <div>
                  <span>{t("Amount")}</span>
                  <b>{usd(amount)}</b>
                </div>
                <div>
                  <span>{t("Term")}</span>
                  <b>
                    {months} {t(months === 1 ? "month" : "months")}
                  </b>
                </div>
                <div>
                  <span>{t("Monthly payment")}</span>
                  <b>{usd(q.monthly, true)}</b>
                </div>
                <div>
                  <span>{t("Loan repayment amount")}</span>
                  <b>{usd(q.total)}</b>
                </div>
                <div>
                  <span>{t("Applicant")}</span>
                  <b>{f.name}</b>
                </div>
                <div>
                  <span>{t("Payout card")}</span>
                  <b>•••• {f.card.replace(/\D/g, "").slice(-4)}</b>
                </div>
              </div>
              <label className={`check ${err.agree ? "has-error" : ""}`}>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span className="check-box">
                  <Check strokeWidth={2.2} />
                </span>
                <span>
                  {t("I have read and accept the")}{" "}
                  <button type="button" className="inline-link" onClick={() => open({ type: "info", key: "terms" })}>
                    {t("Terms")}
                  </button>{" "}
                  {t("and consent to a credit check.")}
                </span>
              </label>
              {err.agree && <p className="field-error static">{err.agree}</p>}
            </div>
          )}

          <div className="modal-actions">
            {step > 0 ? (
              <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
                {t("Back")}
              </button>
            ) : (
              <span />
            )}
            <button className="btn btn-primary" onClick={next}>
              {step < 2 ? t("Continue") : t("Submit application")}
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ---------- Pay ---------- */

function PayModal({ loanId }: { loanId?: string }) {
  const { t, close, loans, pay, open, toast } = useStore();
  const active = loans.filter((l) => l.status === "active");
  const [id, setId] = useState(loanId ?? active[0]?.id ?? "");
  const [lookup, setLookup] = useState("");
  const loan = loans.find((l) => l.id === id);
  const left = loan ? Math.round((loan.total - loan.paid) * 100) / 100 : 0;
  const [mode, setMode] = useState<"monthly" | "full" | "custom">("monthly");
  const [custom, setCustom] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"form" | "processing" | "done">("form");
  const [paidAmt, setPaidAmt] = useState(0);

  const amount = !loan ? 0 : mode === "full" ? left : mode === "monthly" ? Math.min(loan.monthly, left) : Number(custom.replace(/,/g, "")) || 0;

  if (!active.length && phase === "form") {
    return (
      <Shell title={t("Pay the Loan")} onClose={close}>
        <p className="small-muted mb">{t("Enter your loan ID to find your loan.")}</p>
        <div className="mgrid one">
          <Field label={t("Loan ID")} error={err.lookup}>
            <input value={lookup} onChange={(e) => setLookup(e.target.value.toUpperCase())} placeholder="VLX-000000" />
          </Field>
        </div>
        <div className="modal-actions">
          <button
            className="btn btn-ghost"
            onClick={() => {
              close();
              scrollToId("calculator");
            }}
          >
            {t("Get a Loan")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              const f = loans.find((l) => l.id === lookup.trim());
              if (!f) setErr({ lookup: t("No active loan found with this ID.") });
              else setErr({ lookup: t("This loan is already fully repaid.") });
            }}
          >
            {t("Find loan")}
          </button>
        </div>
      </Shell>
    );
  }

  const submit = () => {
    const e: Record<string, string> = {};
    if (!loan) e.loan = t("Choose a loan");
    if (amount <= 0 || amount > left) e.amount = `${t("Enter an amount between")} $1 ${t("and")} ${usd(left, true)}`;
    if (!luhn(card)) e.card = t("Enter a valid card number");
    if (!expValid(exp)) e.exp = t("Invalid date");
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = t("Invalid CVC");
    setErr(e);
    if (Object.keys(e).length || !loan) return;
    setPhase("processing");
    setTimeout(() => {
      pay(loan.id, Math.round(amount * 100) / 100);
      setPaidAmt(amount);
      setPhase("done");
      toast(`${t("Payment of")} ${usd(amount, true)} ${t("received")}`);
    }, 1400);
  };

  return (
    <Shell title={t("Pay the Loan")} onClose={close}>
      {phase === "processing" && (
        <div className="state">
          <LoaderCircle className="spin" strokeWidth={1.2} />
          <p className="state-title">{t("Processing payment…")}</p>
        </div>
      )}
      {phase === "done" && loan && (
        <div className="state">
          <span className="done-check big">
            <Check strokeWidth={1.4} />
          </span>
          <p className="state-title">{t("Payment successful")}</p>
          <p className="small-muted">
            {usd(paidAmt, true)} {t("paid toward")} {loan.id}.{" "}
            {left - paidAmt <= 0.009 ? t("Your loan is fully repaid!") : `${t("Remaining balance")}: ${usd(left - paidAmt, true)}`}
          </p>
          <div className="modal-actions center">
            <button className="btn btn-ghost" onClick={close}>
              {t("Close")}
            </button>
            <button className="btn btn-primary" onClick={() => open({ type: "account" })}>
              {t("My Account")}
            </button>
          </div>
        </div>
      )}
      {phase === "form" && (
        <>
          <div className="loan-pick">
            {active.map((l) => (
              <button key={l.id} className={`loan-opt ${l.id === id ? "is-active" : ""}`} onClick={() => setId(l.id)}>
                <span>
                  <b>{l.id}</b> · {t(l.plan)}
                </span>
                <span>
                  {t("Left")}: {usd(l.total - l.paid, true)}
                </span>
              </button>
            ))}
          </div>
          {loan && (
            <>
              <div className="seg">
                {(
                  [
                    ["monthly", `${t("Monthly")} ${usd(Math.min(loan.monthly, left), true)}`],
                    ["full", `${t("Full balance")} ${usd(left, true)}`],
                    ["custom", t("Other amount")],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} className={mode === k ? "is-active" : ""} onClick={() => setMode(k)}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="mgrid">
                {mode === "custom" && (
                  <Field label={t("Amount, USD")} error={err.amount} className="span2">
                    <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="500" />
                  </Field>
                )}
                <Field label={t("Card number")} error={err.card} className="span2">
                  <input value={card} onChange={(e) => setCard(fmtCard(e.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" />
                </Field>
                <Field label={t("Expiry")} error={err.exp}>
                  <input value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" />
                </Field>
                <Field label="CVC" error={err.cvc}>
                  <input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
                </Field>
              </div>
              {err.amount && mode !== "custom" && <p className="field-error static">{err.amount}</p>}
            </>
          )}
          <div className="modal-actions">
            <span className="small-muted">{t("Early repayment is always free.")}</span>
            <button className="btn btn-primary" onClick={submit}>
              {t("Pay")} {amount > 0 ? usd(amount, true) : ""}
            </button>
          </div>
        </>
      )}
    </Shell>
  );
}

/* ---------- Account ---------- */

function AccountPanel() {
  const { t, close, loans, subscriptions, calls, open, reset, user, logout, toast } = useStore();
  const active = loans.filter((l) => l.status === "active");
  const owed = active.reduce((s, l) => s + (l.total - l.paid), 0);
  return (
    <div className="overlay is-drawer" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside data-lenis-prevent className="drawer glass" role="dialog" aria-modal="true" aria-label={t("My Account")}>
        <div className="modal-head">
          <h2 className="modal-title">
            <IconUser className="title-ic" /> {t("My Account")}
          </h2>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <X strokeWidth={1.3} />
          </button>
        </div>
        {user ? (
          <div className="acc-user">
            <span className="acc-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div>
              <b>{user.name}</b>
              <span>{user.email}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={async () => {
                await logout();
                toast(t("You’ve been logged out."));
              }}
            >
              {t("Log out")}
            </button>
          </div>
        ) : (
          <div className="acc-auth">
            <p>{t("Sign in to keep your loans and payments synced to your profile.")}</p>
            <div>
              <a className="btn btn-ghost btn-xs" href="/login">
                {t("Log in")}
              </a>
              <a className="btn btn-primary btn-xs" href="/signup">
                {t("Sign up")}
              </a>
            </div>
          </div>
        )}
        <div className="acc-stats">
          <div>
            <span>{t("Active loans")}</span>
            <b>{active.length}</b>
          </div>
          <div>
            <span>{t("Outstanding")}</span>
            <b>{usd(owed, true)}</b>
          </div>
        </div>

        <h3 className="acc-h">{t("Loans")}</h3>
        {loans.length === 0 ? (
          <div className="acc-empty">
            <p>{t("You don’t have any loans yet.")}</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                close();
                scrollToId("calculator");
              }}
            >
              {t("Get a Loan")}
            </button>
          </div>
        ) : (
          <div className="acc-loans">
            {loans.map((l) => {
              const p = Math.min(100, (l.paid / l.total) * 100);
              const nextIdx = Math.floor(l.paid / l.monthly + 1e-6);
              return (
                <div key={l.id} className="acc-loan glass">
                  <div className="acc-loan-top">
                    <b>{l.id}</b>
                    <span className={`badge ${l.status}`}>{l.status === "active" ? t("Active") : t("Repaid")}</span>
                  </div>
                  <div className="acc-loan-meta">
                    {t(l.plan)} · {usd(l.principal)} · {l.months} {t("months")}
                  </div>
                  <div className="bar">
                    <i style={{ width: p + "%" }} />
                  </div>
                  <div className="acc-loan-meta">
                    {t("Paid")} {usd(l.paid, true)} {t("of")} {usd(l.total, true)}
                    {l.status === "active" && (
                      <>
                        {" "}
                        · {t("Next payment")} {ddmmyyyy(addMonths(new Date(l.createdAt), nextIdx + 1))}
                      </>
                    )}
                  </div>
                  {l.status === "active" && (
                    <button className="btn btn-ghost btn-sm" onClick={() => open({ type: "pay", loanId: l.id })}>
                      {t("Pay")} {usd(Math.min(l.monthly, l.total - l.paid), true)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <h3 className="acc-h">{t("Subscriptions")}</h3>
        {subscriptions.length ? (
          <ul className="acc-list">
            {subscriptions.map((s, i) => (
              <li key={i}>
                {s.email} <span>{s.source === "events" ? t("Events") : t("Drop alerts")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small-muted">{t("No subscriptions yet.")}</p>
        )}

        <h3 className="acc-h">{t("Call requests")}</h3>
        {calls.length ? (
          <ul className="acc-list">
            {calls.map((c, i) => (
              <li key={i}>
                {c.name} <span>{c.phone}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small-muted">{t("No call requests yet.")}</p>
        )}

        {(loans.length > 0 || subscriptions.length > 0 || calls.length > 0) && (
          <button className="inline-link acc-reset" onClick={reset}>
            {t("Clear demo data")}
          </button>
        )}
      </aside>
    </div>
  );
}

/* ---------- Info ---------- */

function InfoModal({ k }: { k: string }) {
  const { t, close, open } = useStore();
  if (k.startsWith("plan:")) {
    const p = PLANS.find((x) => "plan:" + x.id === k)!;
    const q = quote(Math.round((p.min + p.max) / 2 / 500) * 500, p.term);
    return (
      <Shell title={`${t(p.name)} ${t("plan")}`} onClose={close}>
        <p className="info-p">{t("For everyday expenses, quick cash, groceries, subscriptions.")}</p>
        <div className="summary">
          <div>
            <span>{t("Loan amount")}</span>
            <b>
              {usd(p.min)} - {usd(p.max)}
            </b>
          </div>
          <div>
            <span>{t("Loan term")}</span>
            <b>
              {t("Up to")} {p.term} {t("month")}
            </b>
          </div>
          <div>
            <span>{t("First loan")}</span>
            <b>{t(p.firstLoan)}</b>
          </div>
          <div>
            <span>{t("Payout time")}</span>
            <b>{t(p.payout)}</b>
          </div>
          <div>
            <span>{t("Daily rate")}</span>
            <b>{p.rate}</b>
          </div>
          <div>
            <span>
              {t("Example")}: {usd(q.principal)} / {p.term} {t("mo")}
            </span>
            <b>
              {usd(q.monthly, true)} {t("per month")}
            </b>
          </div>
        </div>
        <div className="modal-actions">
          <span />
          <button
            className="btn btn-primary"
            onClick={() => open({ type: "apply", preset: { plan: p.name, amount: q.principal, months: p.term } })}
          >
            {t("Get a Loan")}
          </button>
        </div>
      </Shell>
    );
  }
  const doc = INFO[k] ?? { title: k, body: [] };
  return (
    <Shell title={t(doc.title)} onClose={close} wide={k === "examples"}>
      {doc.body.map((b, i) => (
        <p key={i} className="info-p">
          {t(b)}
        </p>
      ))}
      {doc.bullets && (
        <ul className="bullets info-list">
          {doc.bullets.map((b) => (
            <li key={b}>{t(b)}</li>
          ))}
        </ul>
      )}
      {k === "examples" && (
        <table className="ex-table">
          <thead>
            <tr>
              <th>{t("Amount")}</th>
              <th>{t("Term")}</th>
              <th>{t("Interest")}</th>
              <th>{t("Fees")}</th>
              <th>{t("Monthly")}</th>
              <th>{t("Total")}</th>
            </tr>
          </thead>
          <tbody>
            {[
              [5000, 6],
              [15000, 12],
              [30000, 24],
              [55500, 36],
              [100000, 84],
            ].map(([a, m]) => {
              const q = quote(a, m);
              return (
                <tr key={a}>
                  <td>{usd(a)}</td>
                  <td>
                    {m} {t("mo")}
                  </td>
                  <td>{usd(q.interest)}</td>
                  <td>{usd(q.fees)}</td>
                  <td>{usd(q.monthly, true)}</td>
                  <td>{usd(q.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="modal-actions">
        <span />
        <button className="btn btn-ghost" onClick={close}>
          {t("Close")}
        </button>
      </div>
    </Shell>
  );
}

/* ---------- Mobile menu ---------- */

function MobileMenu() {
  const { t, close, open, lang, setLang } = useStore();
  return (
    <div className="mmenu">
      <div className="mmenu-head">
        <button className="header-burger" onClick={close} aria-label="Close menu">
          <X strokeWidth={1.3} />
        </button>
        <Logo />
        <button className="account-btn" onClick={() => open({ type: "account" })} aria-label={t("My Account")}>
          <span className="account-icon">
            <IconUser />
          </span>
        </button>
      </div>
      <nav className="mmenu-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              close();
              setTimeout(() => scrollToId(n.id), 30);
            }}
          >
            {t(n.label)}
          </button>
        ))}
      </nav>
      <div className="mmenu-lang">
        {LANGS.map((l) => (
          <button key={l.code} className={l.code === lang ? "is-active" : ""} onClick={() => setLang(l.code)}>
            {l.code}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          close();
          setTimeout(() => scrollToId("calculator"), 30);
        }}
      >
        {t("Get a Loan")}
      </button>
    </div>
  );
}

/* ---------- Root ---------- */

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="toast glass">
          {x.msg}
        </div>
      ))}
    </div>
  );
}

export default function Modals() {
  const { modal } = useStore();
  return (
    <>
      {modal?.type === "apply" && <ApplyModal key={JSON.stringify(modal.preset)} preset={modal.preset} />}
      {modal?.type === "pay" && <PayModal loanId={modal.loanId} />}
      {modal?.type === "account" && <AccountPanel />}
      {modal?.type === "info" && <InfoModal k={modal.key} />}
      {modal?.type === "menu" && <MobileMenu />}
    </>
  );
}
