"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowLeft, Check, ChevronDown, CreditCard, LoaderCircle, Lock, X } from "lucide-react";
import { PLANS } from "@/lib/content";
import { AMOUNT_MAX, AMOUNT_MIN, AMOUNT_STEP, PROMO_CODES, TERM_MAX, TERM_MIN, addMonths, clamp, ddmmyyyy, quote, usd } from "@/lib/finance";
import { cardBrand, cardDigits, cardPreview, cardValid, expValid, fmtCard, fmtExp } from "@/lib/cards";
import { EASE } from "@/lib/motion";
import { ApplyPreset, Loan, isEmail, scrollToId, useStore, veloxCard } from "@/lib/store";
import { VCardFace } from "./AuthTransition";
import Celebration from "./Celebration";
import { Field } from "./ModalParts";

/* ---------- shared bits ---------- */

const SWAP = {
  initial: { opacity: 0, x: 18, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -18, filter: "blur(4px)" },
  transition: { duration: 0.3, ease: EASE },
};

const ageOf = (iso: string) => {
  const b = new Date(iso);
  if (isNaN(+b)) return -1;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
};

const PURPOSES = ["Everyday expenses", "Travel", "Car repair", "Education", "Home improvement", "Medical", "Other"];

/** Two-column glass panel used by the loan flows — same look as the login / signup shell. */
function LoanShell({
  label,
  visual,
  children,
  onClose,
  busy,
}: {
  label: string;
  visual?: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  return (
    <div className="overlay lm-overlay" onMouseDown={(e) => !busy && e.target === e.currentTarget && onClose()}>
      <motion.div
        data-lenis-prevent
        className={`lm glass ${visual ? "" : "is-single"}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {visual && <aside className="lm-visual">{visual}</aside>}
        <div className="lm-main">
          {!busy && (
            <button className="icon-btn lm-close" onClick={onClose} aria-label="Close">
              <X strokeWidth={1.3} />
            </button>
          )}
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** Pill tabs that double as a progress indicator (matches the auth tabs). */
function StepTabs({ steps, step, onPick }: { steps: string[]; step: number; onPick: (i: number) => void }) {
  return (
    <div className="lm-steps" style={{ "--n": steps.length } as React.CSSProperties} role="tablist">
      <motion.span
        className="lm-steps-pill"
        initial={false}
        animate={{ x: `${step * 100}%` }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
      />
      {steps.map((s, i) => (
        <button
          key={s}
          type="button"
          role="tab"
          aria-selected={i === step}
          disabled={i > step}
          className={i === step ? "is-active" : i < step ? "is-done" : ""}
          onClick={() => i < step && onPick(i)}
        >
          <span className="lm-step-n">{i < step ? <Check strokeWidth={2.4} /> : i + 1}</span>
          <span className="lm-step-l">{s}</span>
        </button>
      ))}
    </div>
  );
}

/** Rolling number used for the big figures on the visual side. */
function Figure({ value, cents }: { value: number; cents?: boolean }) {
  return (
    <span className="lm-fig-val">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "60%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-60%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {usd(value, cents)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Choice between the customer's own Velox card and any other bank card. */
function CardChoice({
  value,
  onChange,
  last4,
  otherLabel,
}: {
  value: "velox" | "card";
  onChange: (v: "velox" | "card") => void;
  last4: string;
  otherLabel: string;
}) {
  const { t } = useStore();
  return (
    <div className="lm-choice" role="radiogroup">
      <button type="button" role="radio" aria-checked={value === "velox"} className={value === "velox" ? "is-active" : ""} onClick={() => onChange("velox")}>
        <span className="lm-mini-card is-velox" aria-hidden />
        <span>
          <b>{t("Velox card")}</b>
          <small>•••• {last4} · {t("instant")}</small>
        </span>
        <i className="lm-radio" />
      </button>
      <button type="button" role="radio" aria-checked={value === "card"} className={value === "card" ? "is-active" : ""} onClick={() => onChange("card")}>
        <span className="lm-mini-card" aria-hidden>
          <CreditCard strokeWidth={1.4} />
        </span>
        <span>
          <b>{otherLabel}</b>
          <small>{t("Visa, Mastercard, Amex…")}</small>
        </span>
        <i className="lm-radio" />
      </button>
    </div>
  );
}

/* ---------- Apply ---------- */

type Phase = "form" | "processing" | "done";

export function ApplyModal({ preset }: { preset: ApplyPreset }) {
  const { t, close, addLoan, open, user } = useStore();
  const vc = veloxCard(user?.id);
  const [step, setStep] = useState(0);
  const [planName, setPlanName] = useState(preset.plan ?? "");
  const plan = PLANS.find((p) => p.name === planName);
  const lim = { min: plan?.min ?? AMOUNT_MIN, max: plan?.max ?? AMOUNT_MAX, term: plan?.term ?? TERM_MAX };
  const [amount, setAmount] = useState(clamp(preset.amount ?? 15000, lim.min, lim.max));
  const [months, setMonths] = useState(clamp(preset.months ?? 12, TERM_MIN, lim.term));
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const promo = preset.promo && PROMO_CODES[preset.promo] ? preset.promo : "";
  const [f, setF] = useState({ name: user?.name ?? "", email: user?.email ?? "", phone: "", dob: "", idn: "", tax: "", card: "" });
  const [payout, setPayout] = useState<"velox" | "card">("velox");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [check, setCheck] = useState(0);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [nameFocus, setNameFocus] = useState(false);

  useEffect(() => {
    setAmount((a) => clamp(a, lim.min, lim.max));
    setMonths((m) => clamp(m, TERM_MIN, lim.term));
  }, [lim.min, lim.max, lim.term]);

  const q = useMemo(() => quote(amount, months, PROMO_CODES[promo]?.discount ?? 0), [amount, months, promo]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const card4 = payout === "velox" ? vc.last4 : cardDigits(f.card).slice(-4);
  const payoutLabel = payout === "velox" ? `${t("Velox card")} •••• ${vc.last4}` : `${t("Bank card")} •••• ${card4}`;

  const CHECKS = [t("Verifying your identity"), t("Running a soft credit check"), `${t("Preparing payout to")} •••• ${card4}`];

  // processing: tick through the checklist, then create the loan
  useEffect(() => {
    if (phase !== "processing") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gap = reduced ? 150 : 850;
    const timers = [
      setTimeout(() => setCheck(1), gap),
      setTimeout(() => setCheck(2), gap * 2),
      setTimeout(() => setCheck(3), gap * 3),
      setTimeout(() => {
        const l = addLoan({
          plan: planName || "Custom",
          principal: amount,
          months,
          monthly: q.monthly,
          total: q.total,
          name: f.name.trim(),
          email: f.email.trim(),
          payout,
          card4,
          purpose,
        });
        setLoan(l);
        setPhase("done");
      }, gap * 3 + 450),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (f.name.trim().split(/\s+/).length < 2) e.name = t("Enter your first and last name");
      if (!isEmail(f.email)) e.email = t("Please enter a valid e-mail");
      if (f.phone.replace(/\D/g, "").length < 7) e.phone = t("Please enter a full phone number");
      const age = ageOf(f.dob);
      if (!f.dob) e.dob = t("Enter your date of birth");
      else if (age < 18 || age > 65) e.dob = t("The applicant must be between 18 and 65 years old.");
      if (f.idn.trim().length < 6) e.idn = t("Enter a valid ID number");
      if (f.tax.replace(/\D/g, "").length < 9) e.tax = t("Tax ID must have at least 9 digits");
    }
    if (step === 2) {
      if (payout === "card" && !cardValid(f.card)) e.card = t("Card number should have 16 digits");
      if (!agree) e.agree = t("Please accept the terms to continue");
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step < 2) return setStep(step + 1);
    setCheck(0);
    setPhase("processing");
  };

  if (phase === "done" && loan)
    return <Celebration loan={loan} onClose={close} onAccount={() => open({ type: "account" })} />;

  const steps = [t("Loan"), t("About you"), t("Payout")];
  const processing = phase === "processing";

  const visual = (
    <>
      <div className="auth-visual-glow" aria-hidden />
      <motion.div
        className="lm-card"
        animate={processing ? { rotate: 0, y: -6, scale: 1.04 } : { rotate: -4, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
      >
        <div className="vcard-shadow" />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={payout}
            className="lm-card-face"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            style={{ transformPerspective: 1000 }}
          >
            {payout === "velox" ? (
              <VCardFace
                holder={f.name}
                caret={nameFocus}
                placeholder={t("YOUR NAME")}
                number={`${vc.first4}  ••••  ••••  ${vc.last4}`}
              />
            ) : (
              <VCardFace holder={f.name} caret={nameFocus} placeholder={t("YOUR NAME")} number={cardPreview(f.card)} tag={cardBrand(f.card) || "card"} variant="ext" />
            )}
          </motion.div>
        </AnimatePresence>
        {processing && <div className="authfx-scan lm-scan" />}
      </motion.div>

      <div className="lm-fig">
        <span className="lm-fig-label">{t("You receive")}</span>
        <Figure value={amount} />
        <span className="lm-fig-sub">
          {months} {t(months === 1 ? "month" : "months")} · {usd(q.monthly, true)} {t("per month")}
        </span>
      </div>

      <dl className="lm-facts">
        <div>
          <dt>{t("Total to repay")}</dt>
          <dd>{usd(q.total)}</dd>
        </div>
        <div>
          <dt>{t("Fees")}</dt>
          <dd>{usd(q.fees)}</dd>
        </div>
        <div>
          <dt>{t("First payment")}</dt>
          <dd>{ddmmyyyy(q.firstPayment)}</dd>
        </div>
      </dl>
    </>
  );

  return (
    <LoanShell label={t("Loan application")} visual={visual} onClose={close} busy={processing}>
      {processing ? (
        <div className="lm-proc" aria-live="polite">
          <p className="lm-kicker">{t("Application submitted")}</p>
          <h2 className="lm-title">{t("Reviewing your request")}</h2>
          <p className="small-muted">{t("Decisions usually take less than 2 minutes.")}</p>
          <ul className="lm-checks">
            {CHECKS.map((c, i) => (
              <motion.li
                key={c}
                className={i < check ? "is-done" : i === check ? "is-busy" : ""}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }}
              >
                <span className="lm-check-ic">
                  {i < check ? <Check strokeWidth={2.4} /> : i === check ? <LoaderCircle className="spin-sm" strokeWidth={1.8} /> : null}
                </span>
                {c}
              </motion.li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <p className="lm-kicker">{t("Loan application")}</p>
          <h2 className="lm-title">
            {step === 0 ? t("Choose your loan") : step === 1 ? t("Tell us about you") : t("Where should we send it?")}
          </h2>
          <StepTabs steps={steps} step={step} onPick={(i) => (setErr({}), setStep(i))} />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={step} {...SWAP} className="lm-body">
              {step === 0 && (
                <div className="mgrid">
                  <Field label={t("Credit plan")} className="span2">
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
                  <Field label={t("Amount")} hint={`${usd(lim.min)} – ${usd(lim.max)}`} className="span2">
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
                  <Field label={t("Term")} hint={`1 – ${lim.term} ${t("months")}`} className="span2">
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
                  <div className="mfield span2">
                    <span className="mfield-label">{t("Purpose")}</span>
                    <div className="lm-chips">
                      {PURPOSES.map((p) => (
                        <button key={p} type="button" className={purpose === p ? "is-active" : ""} onClick={() => setPurpose(p)}>
                          {t(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                  {promo && (
                    <p className="lm-promo span2">
                      <Check strokeWidth={2.2} /> {t("Promo code")} <b>{promo}</b> · {t(PROMO_CODES[promo].label)}
                    </p>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="mgrid">
                  <Field label={t("Full name")} error={err.name}>
                    <input
                      value={f.name}
                      onChange={set("name")}
                      onFocus={() => setNameFocus(true)}
                      onBlur={() => setNameFocus(false)}
                      autoComplete="name"
                      placeholder="John Smith"
                      maxLength={40}
                    />
                  </Field>
                  <Field label={t("E-mail")} error={err.email}>
                    <input value={f.email} onChange={set("email")} type="email" autoComplete="email" placeholder="you@example.com" />
                  </Field>
                  <Field label={t("Phone")} error={err.phone}>
                    <input value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" />
                  </Field>
                  <Field label={t("Date of birth")} error={err.dob}>
                    <input value={f.dob} onChange={set("dob")} type="date" max={new Date().toISOString().slice(0, 10)} />
                  </Field>
                  <Field label={t("ID number")} error={err.idn}>
                    <input value={f.idn} onChange={set("idn")} placeholder="AB1234567" />
                  </Field>
                  <Field label={t("Tax ID number")} error={err.tax}>
                    <input value={f.tax} onChange={set("tax")} inputMode="numeric" placeholder="123-45-6789" />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div>
                  <CardChoice value={payout} onChange={(v) => (setErr({}), setPayout(v))} last4={vc.last4} otherLabel={t("Another bank card")} />
                  <AnimatePresence initial={false}>
                    {payout === "card" && (
                      <motion.div
                        className="lm-collapse"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <Field label={t("Card number")} error={err.card} hint={cardBrand(f.card) && cardBrand(f.card) !== "card" ? cardBrand(f.card).toUpperCase() : undefined}>
                          <input
                            value={f.card}
                            onChange={(e) => setF((x) => ({ ...x, card: fmtCard(e.target.value) }))}
                            inputMode="numeric"
                            autoComplete="cc-number"
                            placeholder="0000 0000 0000 0000"
                            autoFocus
                          />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="lm-review">
                    <div>
                      <span>{t("Plan")}</span>
                      <b>{planName ? t(planName) : t("Custom")}</b>
                    </div>
                    <div>
                      <span>{t("Purpose")}</span>
                      <b>{t(purpose)}</b>
                    </div>
                    <div>
                      <span>{t("Applicant")}</span>
                      <b>{f.name}</b>
                    </div>
                    <div>
                      <span>{t("Payout to")}</span>
                      <b>{payout === "card" && cardDigits(f.card).length < 4 ? "—" : payoutLabel}</b>
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
            </motion.div>
          </AnimatePresence>

          <div className="lm-actions">
            {step > 0 ? (
              <button className="btn btn-ghost" onClick={() => (setErr({}), setStep(step - 1))}>
                <ArrowLeft strokeWidth={1.4} className="btn-ic" /> {t("Back")}
              </button>
            ) : (
              <span className="lm-secure">
                <Lock strokeWidth={1.4} /> {t("No impact on your credit score")}
              </span>
            )}
            <button className="btn btn-primary" onClick={next}>
              {step < 2 ? t("Continue") : `${t("Get")} ${usd(amount)}`}
            </button>
          </div>
        </>
      )}
    </LoanShell>
  );
}

/* ---------- Pay ---------- */

function Ring({ p }: { p: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg className="lm-ring" viewBox="0 0 120 120" aria-hidden>
      <defs>
        <linearGradient id="lmRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb35c" />
          <stop offset="1" stopColor="#ff5a0a" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r={r} className="lm-ring-track" />
      <motion.circle
        cx="60"
        cy="60"
        r={r}
        className="lm-ring-bar"
        stroke="url(#lmRing)"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: c * (1 - Math.min(1, p)) }}
        transition={{ duration: 1.1, ease: EASE }}
      />
    </svg>
  );
}

export function PayModal({ loanId }: { loanId?: string }) {
  const { t, close, loans, pay, open, user } = useStore();
  const vc = veloxCard(user?.id);
  const active = loans.filter((l) => l.status === "active");
  const [id, setId] = useState(loanId && active.some((l) => l.id === loanId) ? loanId : active[0]?.id ?? "");
  const [lookup, setLookup] = useState("");
  const loan = loans.find((l) => l.id === id);
  const left = loan ? Math.round((loan.total - loan.paid) * 100) / 100 : 0;
  const [mode, setMode] = useState<"monthly" | "full" | "custom">("monthly");
  const [custom, setCustom] = useState("");
  const [method, setMethod] = useState<"velox" | "card">("velox");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<{ amount: number; loan: Loan } | null>(null);

  const amount = !loan ? 0 : mode === "full" ? left : mode === "monthly" ? Math.min(loan.monthly, left) : Number(custom.replace(/,/g, "")) || 0;

  // celebrate a fully repaid loan
  useEffect(() => {
    if (phase !== "done" || result?.loan.status !== "closed") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#ff6a14", "#ffb35c", "#ffe0b0", "#ffffff", "#7fe0a4"];
    confetti({ particleCount: 120, spread: 80, startVelocity: 42, origin: { y: 0.6 }, colors, zIndex: 300 });
  }, [phase, result]);

  // nothing to pay
  if (!active.length && phase === "form") {
    const closed = loans.filter((l) => l.status === "closed");
    return (
      <LoanShell label={t("Pay the Loan")} onClose={close}>
        <p className="lm-kicker">{t("Pay the Loan")}</p>
        <h2 className="lm-title">{closed.length ? t("You’re all paid up") : t("Find your loan")}</h2>
        <p className="small-muted lm-lead">
          {closed.length ? t("You have no active loans. Every loan on your account is fully repaid.") : t("Enter your loan ID to find your loan.")}
        </p>
        {!closed.length && (
          <div className="mgrid one">
            <Field label={t("Loan ID")} error={err.lookup}>
              <input value={lookup} onChange={(e) => setLookup(e.target.value.toUpperCase())} placeholder="VLX-000000" />
            </Field>
          </div>
        )}
        <div className="lm-actions">
          <button
            className="btn btn-ghost"
            onClick={() => {
              close();
              scrollToId("calculator");
            }}
          >
            {t("Get a Loan")}
          </button>
          {closed.length ? (
            <button className="btn btn-primary" onClick={() => open({ type: "account" })}>
              {t("My Account")}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setErr({ lookup: t("No active loan found with this ID.") })}>
              {t("Find loan")}
            </button>
          )}
        </div>
      </LoanShell>
    );
  }

  const submit = () => {
    const e: Record<string, string> = {};
    if (!loan) e.loan = t("Choose a loan");
    if (amount < 1 || amount > left + 0.001) e.amount = `${t("Enter an amount between")} $1 ${t("and")} ${usd(left, true)}`;
    if (method === "card") {
      if (!cardValid(card)) e.card = t("Card number should have 16 digits");
      if (!expValid(exp)) e.exp = t("Invalid date");
      if (!/^\d{3,4}$/.test(cvc)) e.cvc = t("Invalid CVC");
    }
    setErr(e);
    if (Object.keys(e).length || !loan) return;
    setPhase("processing");
    const amt = Math.round(Math.min(amount, left) * 100) / 100;
    setTimeout(() => {
      const updated = pay(loan.id, amt);
      if (updated) setResult({ amount: amt, loan: updated });
      setPhase("done");
    }, 1400);
  };

  const shown = result?.loan ?? loan;
  const progress = shown ? shown.paid / shown.total : 0;
  const nextDue = (l: Loan) => addMonths(new Date(l.createdAt), Math.floor(l.paid / l.monthly + 1e-6) + 1);

  const visual = shown && (
    <>
      <div className="auth-visual-glow" aria-hidden />
      <div className="lm-ring-wrap">
        <Ring p={progress} />
        <div className="lm-ring-copy">
          <span>{shown.status === "closed" ? t("Repaid") : t("Remaining")}</span>
          <Figure value={shown.status === "closed" ? shown.total : Math.round((shown.total - shown.paid) * 100) / 100} cents={shown.status !== "closed"} />
          <small>{Math.round(progress * 100)}% {t("paid")}</small>
        </div>
      </div>
      <dl className="lm-facts">
        <div>
          <dt>{t("Loan")}</dt>
          <dd>{shown.id}</dd>
        </div>
        <div>
          <dt>{t("Monthly")}</dt>
          <dd>{usd(shown.monthly, true)}</dd>
        </div>
        <div>
          <dt>{shown.status === "closed" ? t("Closed") : t("Next payment")}</dt>
          <dd>{ddmmyyyy(shown.status === "closed" ? new Date(shown.closedAt ?? Date.now()) : nextDue(shown))}</dd>
        </div>
      </dl>
    </>
  );

  return (
    <LoanShell label={t("Pay the Loan")} visual={visual} onClose={close} busy={phase === "processing"}>
      {phase === "processing" && (
        <div className="lm-proc center">
          <LoaderCircle className="spin" strokeWidth={1.2} />
          <h2 className="lm-title">{t("Processing payment…")}</h2>
          <p className="small-muted">
            {usd(amount, true)} · {method === "velox" ? `${t("Velox card")} •••• ${vc.last4}` : `•••• ${cardDigits(card).slice(-4)}`}
          </p>
        </div>
      )}

      {phase === "done" && result && (
        <div className="lm-proc center">
          <motion.span
            className={`celebrate-badge ${result.loan.status === "closed" ? "is-green" : ""}`}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 14 }}
          >
            <Check strokeWidth={2.2} />
          </motion.span>
          {result.loan.status === "closed" ? (
            <>
              <p className="lm-kicker">{result.loan.id}</p>
              <h2 className="lm-title">{t("Loan fully repaid")}</h2>
              <p className="small-muted lm-lead">
                {t("Congratulations! You paid back")} {usd(result.loan.total, true)} {t("in")} {result.loan.payments.length}{" "}
                {t(result.loan.payments.length === 1 ? "payment" : "payments")}. {t("Your loan is now closed — nothing more to pay.")}
              </p>
              <div className="lm-review one">
                <div>
                  <span>{t("Borrowed")}</span>
                  <b>{usd(result.loan.principal)}</b>
                </div>
                <div>
                  <span>{t("Total repaid")}</span>
                  <b>{usd(result.loan.total, true)}</b>
                </div>
                <div>
                  <span>{t("Closed on")}</span>
                  <b>{ddmmyyyy(new Date(result.loan.closedAt ?? Date.now()))}</b>
                </div>
              </div>
              <div className="lm-actions center">
                <button className="btn btn-ghost" onClick={() => open({ type: "account" })}>
                  {t("My Account")}
                </button>
                <button className="btn btn-primary" onClick={() => open({ type: "apply", preset: {} })}>
                  {t("Get a new loan")}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="lm-title">{t("Payment successful")}</h2>
              <p className="small-muted lm-lead">
                {usd(result.amount, true)} {t("paid toward")} {result.loan.id}. {t("Remaining balance")}:{" "}
                <b className="lm-white">{usd(result.loan.total - result.loan.paid, true)}</b>
              </p>
              <div className="lm-review one">
                <div>
                  <span>{t("Next payment")}</span>
                  <b>
                    {usd(Math.min(result.loan.monthly, result.loan.total - result.loan.paid), true)} · {ddmmyyyy(nextDue(result.loan))}
                  </b>
                </div>
              </div>
              <div className="lm-actions center">
                <button className="btn btn-ghost" onClick={close}>
                  {t("Close")}
                </button>
                <button className="btn btn-primary" onClick={() => open({ type: "account" })}>
                  {t("My Account")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "form" && (
        <>
          <p className="lm-kicker">{t("Pay the Loan")}</p>
          <h2 className="lm-title">{t("Make a payment")}</h2>
          {active.length > 1 && (
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
          )}
          {loan && (
            <>
              <div className="lm-steps lm-seg" style={{ "--n": 3 } as React.CSSProperties}>
                <motion.span
                  className="lm-steps-pill"
                  initial={false}
                  animate={{ x: `${["monthly", "full", "custom"].indexOf(mode) * 100}%` }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
                {(
                  [
                    ["monthly", t("Monthly"), usd(Math.min(loan.monthly, left), true)],
                    ["full", t("Pay off"), usd(left, true)],
                    ["custom", t("Other"), t("amount")],
                  ] as const
                ).map(([k, l, s]) => (
                  <button key={k} type="button" className={mode === k ? "is-active" : ""} onClick={() => setMode(k)}>
                    <span className="lm-seg-l">{l}</span>
                    <span className="lm-seg-s">{s}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence initial={false}>
                {mode === "custom" && (
                  <motion.div className="lm-collapse" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
                    <Field label={t("Amount, USD")} error={err.amount}>
                      <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.,]/g, ""))} inputMode="decimal" placeholder="500" autoFocus />
                    </Field>
                  </motion.div>
                )}
              </AnimatePresence>
              {err.amount && mode !== "custom" && <p className="field-error static">{err.amount}</p>}

              <span className="mfield-label lm-label">{t("Pay with")}</span>
              <CardChoice value={method} onChange={(v) => (setErr({}), setMethod(v))} last4={vc.last4} otherLabel={t("Another card")} />
              <AnimatePresence initial={false}>
                {method === "card" && (
                  <motion.div className="lm-collapse" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                    <div className="mgrid lm-cardgrid">
                      <Field label={t("Card number")} error={err.card} className="span2">
                        <input value={card} onChange={(e) => setCard(fmtCard(e.target.value))} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" />
                      </Field>
                      <Field label={t("Expiry")} error={err.exp}>
                        <input value={exp} onChange={(e) => setExp(fmtExp(e.target.value))} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" />
                      </Field>
                      <Field label="CVC" error={err.cvc}>
                        <input value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="cc-csc" placeholder="123" />
                      </Field>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          <div className="lm-actions">
            <span className="lm-secure">
              <Lock strokeWidth={1.4} /> {t("Early repayment is always free.")}
            </span>
            <button className="btn btn-primary" onClick={submit}>
              {t("Pay")} {amount > 0 ? usd(Math.min(amount, left), true) : ""}
            </button>
          </div>
        </>
      )}
    </LoanShell>
  );
}
