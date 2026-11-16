"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  Clapperboard,
  CreditCard,
  FileDown,
  Gauge,
  Landmark,
  LoaderCircle,
  Plane,
  Plus,
  Receipt,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Snowflake,
  UtensilsCrossed,
  Wifi,
  Banknote,
  Globe,
} from "lucide-react";
import Header from "./Header";
import { VCardFace } from "./AuthTransition";
import { CardFlip, VCardBack } from "./CardFx";
import Modals from "./Modals";
import { addMonths, ddmmyyyy } from "@/lib/finance";
import { downloadStatement, loanStatement } from "@/lib/download";
import { Category, Txn, byCategory, cardActivity, creditScore, loanActivity, monthlyTotals } from "@/lib/spending";
import { useStore, veloxCard } from "@/lib/store";
import { EASE } from "@/lib/motion";

const DASH_NAV = [
  { id: "overview", label: "Overview" },
  { id: "card", label: "Card" },
  { id: "analytics", label: "Analytics" },
  { id: "loans", label: "Loans" },
  { id: "activity", label: "Activity" },
];

const CAT_ICON: Record<Category | "Loan", typeof Bus> = {
  Groceries: ShoppingCart,
  Dining: UtensilsCrossed,
  Transport: Bus,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Entertainment: Clapperboard,
  Travel: Plane,
  Loan: Landmark,
};

const fade = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay: 0.08 * i },
});

function Switch({ on, onChange, label, sub, icon, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; sub?: string; icon: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} className={`dsw ${on ? "is-on" : ""}`} onClick={() => onChange(!on)} disabled={disabled}>
      <span className="dsw-ic">{icon}</span>
      <span className="dsw-text">
        <b>{label}</b>
        {sub && <small>{sub}</small>}
      </span>
      <span className="dsw-track">
        <motion.i layout transition={{ type: "spring", stiffness: 500, damping: 32 }} />
      </span>
    </button>
  );
}

function Counter({ value, format }: { value: number; format: (n: number) => string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.2, ease: EASE });
    return () => c.stop();
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

/* ---------- Credit score gauge ---------- */

function ScoreGauge({ score, band }: { score: number; band: string }) {
  const { t } = useStore();
  const R = 92;
  const C = Math.PI * R;
  const f = (score - 300) / 550;
  const mv = useMotionValue(0);
  const angle = useTransform(mv, (v) => Math.PI * (1 - v));
  const cx = useTransform(angle, (a) => 110 + R * Math.cos(a));
  const cy = useTransform(angle, (a) => 108 - R * Math.sin(a));
  const dash = useTransform(mv, (v) => C * (1 - v));
  const num = useTransform(mv, (v) => String(Math.round(300 + v * 550)));
  useEffect(() => {
    const c = animate(mv, f, { duration: 1.6, ease: EASE, delay: 0.3 });
    return () => c.stop();
  }, [f, mv]);
  const ticks = [300, 580, 670, 740, 800, 850];
  return (
    <div className="gauge">
      <svg viewBox="0 0 220 128" role="img" aria-label={`${t("Credit score")} ${score}, ${t(band)}`}>
        <path d={`M${110 - R},108 A${R},${R} 0 0 1 ${110 + R},108`} className="gauge-track" />
        <motion.path d={`M${110 - R},108 A${R},${R} 0 0 1 ${110 + R},108`} className="gauge-bar" strokeDasharray={C} style={{ strokeDashoffset: dash }} />
        {ticks.map((s) => {
          const a = Math.PI * (1 - (s - 300) / 550);
          return <line key={s} x1={110 + (R - 13) * Math.cos(a)} y1={108 - (R - 13) * Math.sin(a)} x2={110 + (R - 19) * Math.cos(a)} y2={108 - (R - 19) * Math.sin(a)} className="gauge-tick" />;
        })}
        <motion.circle r={7.5} cx={cx} cy={cy} className="gauge-dot" />
      </svg>
      <div className="gauge-copy">
        <motion.b>{num}</motion.b>
        <span>{t(band)}</span>
      </div>
      <div className="gauge-scale">
        <span>300</span>
        <span>850</span>
      </div>
    </div>
  );
}

/* ---------- Monthly spending bars ---------- */

function SpendChart({ data }: { data: { month: Date; total: number }[] }) {
  const { t, money } = useStore();
  const [hover, setHover] = useState<number | null>(null);
  const W = 440;
  const H = 200;
  const pad = { l: 8, r: 8, t: 26, b: 28 };
  const max = Math.max(...data.map((d) => d.total), 1) * 1.12;
  const avg = data.slice(0, -1).reduce((s, d) => s + d.total, 0) / Math.max(1, data.length - 1);
  const slot = (W - pad.l - pad.r) / data.length;
  const bw = Math.min(46, slot * 0.56);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const mo = (d: Date) => d.toLocaleString("en-US", { month: "short" });
  const shown = hover ?? data.length - 1;
  return (
    <div className="spend" onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${t("Monthly card spending")}: ${data.map((d) => `${mo(d.month)} ${money(d.total)}`).join(", ")}`}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8a3a" />
            <stop offset="1" stopColor="#d9480a" />
          </linearGradient>
        </defs>
        <line x1={pad.l} x2={W - pad.r} y1={y(0)} y2={y(0)} className="amort-grid" />
        <line x1={pad.l} x2={W - pad.r} y1={y(avg)} y2={y(avg)} className="spend-avg" />
        {data.map((d, i) => {
          const x = pad.l + slot * i + (slot - bw) / 2;
          const top = y(d.total);
          const h = y(0) - top;
          const r = Math.min(4, h / 2);
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)} style={{ cursor: "pointer" }}>
              <rect x={pad.l + slot * i} y={pad.t} width={slot} height={H - pad.t - pad.b} fill="transparent" />
              <motion.path
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: hover === null || hover === i ? 1 : 0.4, scaleY: 1 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.05 * i }}
                style={{ originY: 1, transformBox: "fill-box" }}
                fill="url(#spendGrad)"
                d={`M${x},${y(0)}V${top + r}Q${x},${top} ${x + r},${top}H${x + bw - r}Q${x + bw},${top} ${x + bw},${top + r}V${y(0)}Z`}
              />
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" className={`amort-axis ${i === shown ? "is-strong" : ""}`}>
                {mo(d.month)}
              </text>
              {i === shown && (
                <text x={x + bw / 2} y={top - 8} textAnchor="middle" className="spend-val">
                  {money(d.total)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- Page ---------- */

export default function Dashboard() {
  const store = useStore();
  const { t, money, user, authReady, loans, card, setCard, toast, open, currency, ready, holderName } = store;
  const [flipped, setFlipped] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [pdfFor, setPdfFor] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => setNow(new Date()), []);

  const seed = user?.id ?? "guest";
  const vc = veloxCard(user?.id);
  const spending = useMemo(() => (now ? cardActivity(seed, now) : []), [seed, now]);
  const ledger = useMemo(() => {
    const all: Txn[] = [...spending, ...loanActivity(loans)];
    if (card.frozen && now)
      all.push({ id: "declined", date: new Date(now.getTime() - 6 * 60_000), merchant: "Orbit Store", category: "Shopping", amount: -42.9, status: "declined" });
    return all.sort((a, b) => +b.date - +a.date);
  }, [spending, loans, card.frozen, now]);
  const months = useMemo(() => (now ? monthlyTotals(spending, now) : []), [spending, now]);
  const monthStart = now ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(0);
  const cats = useMemo(() => byCategory(spending, monthStart), [spending, monthStart.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps
  const spentThisMonth = months[months.length - 1]?.total ?? 0;
  const credit = useMemo(() => creditScore(loans, seed), [loans, seed]);

  const active = loans.filter((l) => l.status === "active");
  const owed = active.reduce((s, l) => s + (l.total - l.paid), 0);
  // the card balance moves with the loans: Velox-card payouts in, Velox-card repayments out
  const veloxPayouts = loans.filter((l) => (l.payout ?? "velox") === "velox").reduce((s, l) => s + l.principal, 0);
  const veloxRepaid = loans.reduce((s, l) => s + l.payments.filter((p) => (p.method ?? "velox") === "velox").reduce((a, p) => a + p.amount, 0), 0);
  const balance = Math.max(0, 2480 + ((seed.length * 137) % 900) + veloxPayouts - veloxRepaid - spentThisMonth);
  const limitUse = Math.min(1, spentThisMonth / Math.max(1, card.limit));
  const first = holderName.split(" ")[0];
  const hour = now?.getHours() ?? 12;
  const greet = hour < 12 ? t("Good morning") : hour < 18 ? t("Good afternoon") : t("Good evening");

  const freeze = (v: boolean) => {
    setCard({ frozen: v });
    toast(v ? t("Card frozen — all payments are blocked.") : t("Card unfrozen — you’re good to go."));
  };

  if (!authReady || !ready || !now)
    return (
      <div className="dash-loading">
        <LoaderCircle className="spin" strokeWidth={1.2} />
      </div>
    );

  const catMax = Math.max(1, ...cats.map((c) => c.total));
  const rows = showAll ? ledger.slice(0, 40) : ledger.slice(0, 8);

  return (
    <div className="dash">
      <div className="ambient" aria-hidden />
      <Header nav={DASH_NAV} homeHref="/" />

      <main className="dash-main">
        <motion.section {...fade(0)} className="dash-hello" id="overview">
          <div>
            <p className="dash-kicker">{now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="h-xl dash-h1">
              {greet}
              {first ? `, ${first}` : ""}
            </h1>
            <p className="lead dash-lead">
              {user ? (
                t("Your card, loans and credit in one place.")
              ) : (
                <>
                  {t("You’re viewing a guest account.")}{" "}
                  <Link className="inline-link" href="/login">
                    {t("Log in")}
                  </Link>{" "}
                  {t("to keep your loans and card settings synced.")}
                </>
              )}
            </p>
          </div>
          <div className="dash-hello-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => open({ type: "pay" })}>
              <ArrowUpRight strokeWidth={1.5} className="btn-ic" /> {t("Pay the Loan")}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => open({ type: "apply", preset: {} })}>
              <Plus strokeWidth={1.6} className="btn-ic" /> {t("New loan")}
            </button>
          </div>
        </motion.section>

        <section className="dash-stats">
          {[
            { label: t("Card balance"), value: balance, cents: true, sub: `•••• ${vc.last4}` },
            { label: t("Spent this month"), value: spentThisMonth, cents: true, sub: `${Math.round(limitUse * 100)}% ${t("of limit")}` },
            { label: t("Outstanding loans"), value: owed, cents: true, sub: `${active.length} ${t(active.length === 1 ? "active loan" : "active loans")}` },
          ].map((s, i) => (
            <motion.div key={s.label} {...fade(i + 1)} className="dash-stat glass">
              <span>{s.label}</span>
              <b>
                <Counter value={s.value} format={(v) => money(v, s.cents)} />
              </b>
              <small>{s.sub}</small>
            </motion.div>
          ))}
          <motion.div {...fade(4)} className="dash-stat glass">
            <span>{t("Credit score")}</span>
            <b>
              <Counter value={credit.score} format={(v) => String(Math.round(v))} />
            </b>
            <small>{t(credit.band)}</small>
          </motion.div>
        </section>

        <div className="dash-grid">
          {/* ---- card & controls ---- */}
          <motion.section {...fade(2)} className="dash-panel glass dash-card" id="card">
            <div className="dash-panel-head">
              <h2>
                <CreditCard strokeWidth={1.4} /> {t("Your card")}
              </h2>
              <span className={`badge ${card.frozen ? "frozen" : "active"}`}>{card.frozen ? t("Frozen") : t("Active")}</span>
            </div>
            <div className="dash-card-stage">
              <div className="dash-vcard">
                <div className="vcard-shadow" style={{ opacity: card.frozen ? 0.25 : 0.8 }} />
                <CardFlip
                  flipped={flipped}
                  onToggle={() => setFlipped((v) => !v)}
                  label={t("Flip card")}
                  front={
                    <VCardFace
                      holder={holderName}
                      placeholder={t("YOUR NAME")}
                      number={`${vc.first4}  ••••  ••••  ${vc.last4}`}
                      expiry={vc.expiry}
                      frozen={card.frozen}
                      labels={{ holder: t("Card holder"), valid: t("Valid thru"), frozen: t("Frozen") }}
                    />
                  }
                  back={
                    <VCardBack
                      holder={holderName}
                      first4={vc.first4}
                      mid={vc.mid}
                      last4={vc.last4}
                      cvv={vc.cvv}
                      expiry={vc.expiry}
                      frozen={card.frozen}
                      labels={{
                        reveal: t("Show details"),
                        hide: t("Hide"),
                        frozen: t("Frozen"),
                        authorized: t("Authorized signature"),
                        service: t("Customer service 24/7 · +1 800 835 6900 · velox.bank"),
                      }}
                    />
                  }
                />
              </div>
            </div>
            <div className="dash-card-actions">
              <button className="card-ctl" onClick={() => setFlipped((v) => !v)} aria-pressed={flipped}>
                <RotateCcw strokeWidth={1.5} /> {flipped ? t("Show front") : t("Flip card")}
              </button>
              <button className={`card-ctl ${card.frozen ? "is-ice" : ""}`} onClick={() => freeze(!card.frozen)} aria-pressed={card.frozen}>
                <Snowflake strokeWidth={1.5} /> {card.frozen ? t("Unfreeze") : t("Freeze card")}
              </button>
            </div>
            <AnimatePresence initial={false}>
              {card.frozen && (
                <motion.p className="dash-frozen" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <Snowflake strokeWidth={1.6} /> {t("All card payments and withdrawals are blocked until you unfreeze.")}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="dash-switches">
              <Switch icon={<Globe strokeWidth={1.5} />} label={t("Online payments")} sub={t("Shops, subscriptions, apps")} on={card.online && !card.frozen} disabled={card.frozen} onChange={(v) => setCard({ online: v })} />
              <Switch icon={<Wifi strokeWidth={1.5} />} label={t("Contactless")} sub={t("Tap to pay in store")} on={card.contactless && !card.frozen} disabled={card.frozen} onChange={(v) => setCard({ contactless: v })} />
              <Switch icon={<Banknote strokeWidth={1.5} />} label={t("ATM withdrawals")} sub={t("Free in 40+ countries")} on={card.atm && !card.frozen} disabled={card.frozen} onChange={(v) => setCard({ atm: v })} />
            </div>
            <div className="dash-limit">
              <div className="dash-limit-head">
                <span>{t("Monthly spending limit")}</span>
                <b>{money(card.limit)}</b>
              </div>
              <input
                type="range"
                className="range"
                min={500}
                max={20000}
                step={250}
                value={card.limit}
                aria-label={t("Monthly spending limit")}
                style={{ "--p": `${((card.limit - 500) / 19500) * 100}%` } as React.CSSProperties}
                onChange={(e) => setCard({ limit: Number(e.target.value) })}
              />
              <div className="dash-limit-bar">
                <motion.i initial={false} animate={{ width: `${limitUse * 100}%` }} className={limitUse > 0.9 ? "is-hot" : ""} />
              </div>
              <small>
                {money(spentThisMonth, true)} {t("spent")} · {money(Math.max(0, card.limit - spentThisMonth), true)} {t("left this month")}
              </small>
            </div>
          </motion.section>

          {/* ---- analytics ---- */}
          <motion.section {...fade(3)} className="dash-panel glass dash-analytics" id="analytics">
            <div className="dash-panel-head">
              <h2>
                <ArrowDownLeft strokeWidth={1.4} /> {t("Spending analytics")}
              </h2>
              <span className="small-muted">
                {t("Last 6 months")} · {t("avg")} {money(months.slice(0, -1).reduce((s, m) => s + m.total, 0) / 5)}
                {t("/mo")}
              </span>
            </div>
            <SpendChart data={months} />
            <h3 className="dash-h3">{t("This month by category")}</h3>
            {cats.length ? (
              <ul className="cats">
                {cats.map((c) => {
                  const Icon = CAT_ICON[c.category];
                  return (
                    <li key={c.category}>
                      <span className="cats-ic">
                        <Icon strokeWidth={1.5} />
                      </span>
                      <span className="cats-name">{t(c.category)}</span>
                      <span className="cats-bar">
                        <motion.i initial={{ width: 0 }} animate={{ width: `${(c.total / catMax) * 100}%` }} transition={{ duration: 0.9, ease: EASE }} />
                      </span>
                      <b>{money(c.total, true)}</b>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="small-muted">{t("No card spending yet this month.")}</p>
            )}
          </motion.section>

          {/* ---- credit score ---- */}
          <motion.section {...fade(4)} className="dash-panel glass dash-score">
            <div className="dash-panel-head">
              <h2>
                <Gauge strokeWidth={1.4} /> {t("Credit score")}
              </h2>
              <span className="small-muted">{t("Updated today")}</span>
            </div>
            <ScoreGauge score={credit.score} band={credit.band} />
            <ul className="factors">
              {credit.factors.map((f) => (
                <li key={f.label}>
                  <span>
                    <b>{t(f.label)}</b>
                    <small>{t(f.value)}</small>
                  </span>
                  <em className={`impact is-${f.impact}`}>
                    {f.points > 0 ? "+" : ""}
                    {f.points} {t("pts")}
                  </em>
                </li>
              ))}
            </ul>
            <p className="small-muted dash-note">{t("Simulated score — on-time repayments and closing loans raise it.")}</p>
          </motion.section>

          {/* ---- loans ---- */}
          <motion.section {...fade(5)} className="dash-panel glass dash-loans" id="loans">
            <div className="dash-panel-head">
              <h2>
                <Landmark strokeWidth={1.4} /> {t("Loans")}
              </h2>
              <button className="inline-link" onClick={() => open({ type: "apply", preset: {} })}>
                + {t("New loan")}
              </button>
            </div>
            {loans.length === 0 ? (
              <div className="acc-empty">
                <p>{t("You don’t have any loans yet.")}</p>
                <button className="btn btn-primary btn-sm" onClick={() => open({ type: "apply", preset: {} })}>
                  {t("Get a Loan")}
                </button>
              </div>
            ) : (
              <div className="dash-loan-list">
                {loans.map((l) => {
                  const p = Math.min(1, l.paid / l.total);
                  const next = addMonths(new Date(l.createdAt), Math.floor(l.paid / l.monthly + 1e-6) + 1);
                  return (
                    <div key={l.id} className="dash-loan">
                      <div className="dash-loan-top">
                        <b>{l.id}</b>
                        <span className={`badge ${l.status}`}>{l.status === "active" ? t("Active") : t("Repaid")}</span>
                      </div>
                      <div className="acc-loan-meta">
                        {t(l.plan)} · {money(l.principal)} · {l.months} {t("months")}
                        {l.signature && <> · {t("e-signed")}</>}
                      </div>
                      <div className="bar">
                        <motion.i initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ duration: 1, ease: EASE }} />
                      </div>
                      <div className="dash-loan-foot">
                        <span className="acc-loan-meta">
                          {money(l.paid, true)} / {money(l.total, true)}
                          {l.status === "active" && (
                            <>
                              {" "}
                              · {t("Next")} {ddmmyyyy(next)}
                            </>
                          )}
                        </span>
                        <span className="dash-loan-btns">
                          <button
                            className="icon-btn"
                            title={t("Download PDF statement")}
                            aria-label={`${t("Download PDF statement")} ${l.id}`}
                            disabled={pdfFor === l.id}
                            onClick={async () => {
                              setPdfFor(l.id);
                              const ok = await downloadStatement(loanStatement(l, currency));
                              setPdfFor(null);
                              toast(ok ? t("Statement downloaded.") : t("Couldn’t create the PDF. Please try again."));
                            }}
                          >
                            {pdfFor === l.id ? <LoaderCircle className="spin-sm" strokeWidth={1.6} /> : <FileDown strokeWidth={1.4} />}
                          </button>
                          {l.status === "active" && (
                            <button className="btn btn-ghost btn-xs" onClick={() => open({ type: "pay", loanId: l.id })}>
                              {t("Pay")} {money(Math.min(l.monthly, l.total - l.paid), true)}
                            </button>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.section>

          {/* ---- activity ---- */}
          <motion.section {...fade(6)} className="dash-panel glass dash-activity" id="activity">
            <div className="dash-panel-head">
              <h2>
                <Receipt strokeWidth={1.4} /> {t("Recent activity")}
              </h2>
            </div>
            <ul className="txns">
              {rows.map((x) => {
                const Icon = CAT_ICON[x.category];
                return (
                  <li key={x.id} className={x.status === "declined" ? "is-declined" : ""}>
                    <span className="cats-ic">
                      <Icon strokeWidth={1.5} />
                    </span>
                    <span className="txns-main">
                      <b>{x.merchant}</b>
                      <small>
                        {x.status === "declined" ? t("Declined — card frozen") : t(x.category)} · {ddmmyyyy(x.date)}
                      </small>
                    </span>
                    <span className={`txns-amt ${x.amount > 0 ? "is-in" : ""}`}>
                      {x.amount > 0 ? "+" : "−"}
                      {money(Math.abs(x.amount), true)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {ledger.length > 8 && (
              <button className="inline-link dash-more" onClick={() => setShowAll((v) => !v)}>
                {showAll ? t("Show less") : t("Show more")}
              </button>
            )}
          </motion.section>
        </div>
      </main>
      <Modals />
    </div>
  );
}
