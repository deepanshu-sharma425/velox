"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronUp, DollarSign, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cardReveal, reveal } from "@/lib/motion";
import SplitHeading from "./SplitHeading";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  AMOUNT_STEP,
  PROMO_CODES,
  TERM_MAX,
  TERM_MIN,
  clamp,
  ddmmyyyy,
  quote,
  usd,
} from "@/lib/finance";
import { scrollToId, useStore } from "@/lib/store";

export function openTag(tag: string) {
  window.dispatchEvent(new CustomEvent("velox:tag", { detail: tag }));
  scrollToId("support");
}

function Slider({
  value,
  min,
  max,
  step,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const p = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      style={{ "--p": `${p}%` } as React.CSSProperties}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export default function Calculator() {
  const { t, open } = useStore();
  const [amount, setAmount] = useState(55500);
  const [months, setMonths] = useState(36);
  const [schedOpen, setSchedOpen] = useState(true);
  const [promo, setPromo] = useState("");
  const code = PROMO_CODES[promo.trim().toUpperCase()];
  const q = useMemo(() => quote(amount, months, code?.discount ?? 0), [amount, months, code]);

  return (
    <section className="calc section" id="calculator">
      <SplitHeading className="h-xl center" text={t("Get your loan fast now!")} />
      <motion.p {...reveal(0.12)} className="lead center calc-lead">
        {t("Check the")}{" "}
        <button className="inline-link" onClick={() => openTag("Support")}>
          {t("Support")}
        </button>{" "}
        {t("page before buying a credit product to learn about consequences and key details.")}
      </motion.p>

      <div className="calc-grid">
        <motion.div {...cardReveal(0)} className="calc-card glass">
          <h3 className="h-md center calc-title">{t("Choose loan amount")}</h3>

          <div className="calc-row">
            <span className="calc-label">
              <DollarSign strokeWidth={1.3} /> {t("Loan amount")}
            </span>
            <span className="stepper">
              <button aria-label="Increase amount" onClick={() => setAmount((a) => clamp(a + AMOUNT_STEP, AMOUNT_MIN, AMOUNT_MAX))}>
                <Plus strokeWidth={1.4} />
              </button>
              <span className="stepper-val">{usd(amount)}</span>
              <button aria-label="Decrease amount" onClick={() => setAmount((a) => clamp(a - AMOUNT_STEP, AMOUNT_MIN, AMOUNT_MAX))}>
                <Minus strokeWidth={1.4} />
              </button>
            </span>
          </div>
          <Slider value={amount} min={AMOUNT_MIN} max={AMOUNT_MAX} step={AMOUNT_STEP} onChange={setAmount} label={t("Loan amount")} />
          <div className="range-limits">
            <span>{usd(AMOUNT_MIN)}</span>
            <span>{usd(AMOUNT_MAX)}</span>
          </div>

          <div className="calc-row calc-row-2">
            <span className="calc-label">
              <CalendarDays strokeWidth={1.2} /> {t("Loan amount")}
            </span>
            <span className="stepper">
              <button aria-label="Increase term" onClick={() => setMonths((m) => clamp(m + 1, TERM_MIN, TERM_MAX))}>
                <Plus strokeWidth={1.4} />
              </button>
              <span className="stepper-val">{months}</span>
              <button aria-label="Decrease term" onClick={() => setMonths((m) => clamp(m - 1, TERM_MIN, TERM_MAX))}>
                <Minus strokeWidth={1.4} />
              </button>
            </span>
          </div>
          <Slider value={months} min={TERM_MIN} max={TERM_MAX} step={1} onChange={setMonths} label={t("Loan term")} />
          <div className="range-limits">
            <span>1 {t("month")}</span>
            <span>84 {t("months")}</span>
          </div>

          <button className={`sched-toggle ${schedOpen ? "is-open" : ""}`} onClick={() => setSchedOpen((v) => !v)} aria-expanded={schedOpen}>
            {t("Payment schedule")} <ChevronUp strokeWidth={1.3} />
          </button>

          <div className={`sched ${schedOpen ? "is-open" : ""}`}>
            <div className="sched-inner">
              <div className="sched-box">
                <div className="sched-line strong">
                  <span>
                    {t("Return in")} {months} {t(months === 1 ? "month" : "months")}
                  </span>
                  <b>{usd(q.total)}</b>
                </div>
                <div className="sched-line muted">
                  <span>{t("First payment date")}</span>
                  <span>{ddmmyyyy(q.firstPayment)}</span>
                </div>
                <hr />
                <div className="sched-line faint">
                  <span>{t("Loan Principal Amount")}</span>
                  <span>{usd(q.principal)}</span>
                </div>
                <div className="sched-line faint">
                  <span>{t("Total Interest Charges")}</span>
                  <span>{usd(q.interest)}</span>
                </div>
                <div className="sched-line strong fees">
                  <span>{t("Service Fees & Commissions")}</span>
                  <b>{usd(q.fees)}</b>
                </div>
                <div className="sched-monthly">
                  <div className="sched-monthly-head">
                    <span>{t("Standard monthly payment")}</span>
                    <span>
                      <b>{usd(q.monthly, true)}</b>{" "}
                      <em>( {q.ratePerMonth.toFixed(2).replace(".", ",")}% {t("per month")} )</em>
                    </span>
                  </div>
                  <div className="sched-list" data-lenis-prevent>
                    {q.schedule.map((r, i) => (
                      <div className="sched-item" key={i}>
                        <span>{ddmmyyyy(r.date)}</span>
                        <span>{usd(r.amount, true)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="total">
            <div className="total-main">
              <span>{t("Total amount")}</span>
              <i />
              <span>{usd(amount)} USD</span>
            </div>
            <div className="total-line">
              <span>{t("Loan repayment amount")}</span>
              <i />
              <span>{usd(q.total)}</span>
            </div>
            <div className="total-line">
              <span>{t("Total Interest")}</span>
              <i />
              <span>{usd(q.interest)}</span>
            </div>
            <div className="total-line">
              <span>{t("Loan term")}</span>
              <i />
              <span>
                {months} {t("month")}
              </span>
            </div>
          </div>

          <div className="calc-actions">
            <button className="inline-link calc-examples" onClick={() => open({ type: "info", key: "examples" })}>
              {t("Calculation examples")}
            </button>
            <div className="promo">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder={t("Enter promocode (optional)")}
                aria-label={t("Promo code")}
              />
              <button
                className="btn btn-primary"
                onClick={() => open({ type: "apply", preset: { amount, months, promo: code ? promo.trim().toUpperCase() : undefined } })}
              >
                {t("Get a Loan")}
              </button>
            </div>
          </div>
          {promo.trim() && (
            <p className={`promo-msg ${code ? "ok" : "bad"}`}>
              {code
                ? `${promo.trim().toUpperCase()} ${t("applied")} — ${t(code.label)}`
                : t("This promo code is not valid")}
            </p>
          )}
        </motion.div>

        <motion.aside {...reveal(0.2)} className="calc-side">
          <div className="side-block">
            <h3 className="h-sm">{t("Borrower Requirements")}</h3>
            <p className="side-sub">{t("Review our simple criteria for applicants.")}</p>
            <ul className="bullets">
              <li>{t("The applicant must be between 18 and 65 years old.")}</li>
              <li>{t("You need to provide a valid ID and a Tax ID number.")}</li>
              <li>{t("You can apply online without providing any proof of income.")}</li>
            </ul>
          </div>
          <div className="side-block">
            <h3 className="h-sm">{t("How it works")}</h3>
            <p className="side-sub">{t("Learn how the application process works.")}</p>
            <ul className="bullets">
              <li>{t("First you choose the desired loan amount and term on the calculator.")}</li>
              <li>{t("Then you fill out a short application form which takes about 5 minutes.")}</li>
              <li>{t("After that our system reviews your request and gives a decision within 2 min.")}</li>
              <li>{t("Finally you receive the money transferred directly to your bank card.")}</li>
            </ul>
          </div>
          <div className="side-questions">
            <p className="tags-title">{t("Any questions? You can visit these pages:")}</p>
            <div className="tags">
              {["Support", "FAQ", "Consequences", "Contract", "Other"].map((x) => (
                <button key={x} className="tag" onClick={() => openTag(x)}>
                  {t(x)}
                </button>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
