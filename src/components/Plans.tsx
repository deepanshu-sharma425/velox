"use client";

import { useState } from "react";
import { CalendarDays, ChartLine, Clock, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { cardReveal, reveal } from "@/lib/motion";
import { useTilt } from "@/lib/useTilt";
import SplitHeading from "./SplitHeading";
import { PLANS, Plan } from "@/lib/content";
import { usd } from "@/lib/finance";
import { useStore } from "@/lib/store";

function PlanCard({ p, i, active, onPick }: { p: Plan; i: number; active: boolean; onPick: () => void }) {
  const { t, open } = useStore();
  const tilt = useTilt(5);
  const preset = { plan: p.name, amount: Math.round((p.min + p.max) / 2 / 500) * 500, months: p.term };
  return (
    <motion.article
      {...cardReveal(i % 3)}
      className={`plan glass ${active ? "is-active" : ""}`}
      style={tilt.style}
      whileHover={{ y: -8, transition: { duration: 0.35 } }}
      onMouseMove={tilt.handlers.onMouseMove}
      onMouseLeave={tilt.handlers.onMouseLeave}
      onMouseEnter={onPick}
      onFocus={onPick}
      onClick={onPick}
    >
      <motion.span className="tilt-glare" style={{ background: tilt.glare }} aria-hidden />
      <div className="plan-head glass">
        <h3 className="plan-name">{t(p.name)}</h3>
        <p className="plan-desc">
          {t("For everyday expenses, quick cash, groceries, subscriptions.")}{" "}
          <button className="inline-link" onClick={() => open({ type: "info", key: "plan:" + p.id })}>
            {t("Learn more")}
          </button>
        </p>
      </div>
      <dl className="plan-grid">
        <div>
          <dt>
            <Wallet strokeWidth={1.2} /> {t("Loan amount")}
          </dt>
          <dd>
            {usd(p.min)} - {usd(p.max)}
          </dd>
        </div>
        <div>
          <dt>
            <CalendarDays strokeWidth={1.2} /> {t("Loan term")}
          </dt>
          <dd>
            {t("Up to")} {p.term} {t("month")}
          </dd>
        </div>
        <div>
          <dt>
            <ChartLine strokeWidth={1.2} /> {t("First loan")}
          </dt>
          <dd>{t(p.firstLoan)}</dd>
        </div>
        <div>
          <dt>
            <Clock strokeWidth={1.2} /> {t("Payout time")}
          </dt>
          <dd>{t(p.payout)}</dd>
        </div>
      </dl>
      <div className="plan-foot">
        <span className="plan-rate">
          {p.rate}
          <sup>{t("per day")}*</sup>
        </span>
        <button className={`btn ${active ? "btn-primary" : "btn-ghost"}`} onClick={() => open({ type: "apply", preset })}>
          {t("Get a Loan")}
        </button>
      </div>
    </motion.article>
  );
}

export default function Plans() {
  const { t, open } = useStore();
  const [active, setActive] = useState("classic");
  const [all, setAll] = useState(false);
  return (
    <section className="plans section" id="services">
      <SplitHeading className="h-xl center plans-title" text={t("Explore our featured plans of credit products")} />
      <motion.p {...reveal(0.12)} className="lead center plans-lead">
        {t("Before applying, please read our")}{" "}
        <button className="inline-link" onClick={() => open({ type: "info", key: "terms" })}>
          {t("Terms")}
        </button>
        {t(". It takes just a minute but helps you understand the details and avoid hidden fees, ensuring a safe and experience.")}
      </motion.p>
      <div className={`plans-grid ${all ? "show-all" : ""}`}>
        {PLANS.map((p, i) => (
          <PlanCard key={p.id} p={p} i={i} active={active === p.id} onPick={() => setActive(p.id)} />
        ))}
      </div>
      <motion.div {...reveal(0.1)} className="plans-ctas">
        <button className="btn btn-ghost" onClick={() => open({ type: "info", key: "terms" })}>
          {t("Learn Terms")}
        </button>
        <button className="btn btn-primary" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? t("Show Less") : t("All Services")}
        </button>
      </motion.div>
    </section>
  );
}
