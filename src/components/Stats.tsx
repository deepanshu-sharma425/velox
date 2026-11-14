"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import Fluted from "./Fluted";
import { cardReveal, reveal } from "@/lib/motion";
import SplitHeading from "./SplitHeading";
import { useStore } from "@/lib/store";

const STATS = [
  { value: 96, fmt: (n: number) => `${Math.round(n)}`, label: "Percent of total\nloans approved" },
  { value: 8.1, fmt: (n: number) => `${n.toFixed(1)}K+`, label: "Happy clients\nserved today" },
  { value: 5, fmt: (n: number) => `№${Math.max(1, Math.round(n))}`, label: "Top rated digital\nfinancial platform" },
  { value: 237, fmt: (n: number) => `${Math.round(n)}`, label: "Apps approved\non hour" },
];

export const COUNTRIES = [
  { code: "US", flag: "🇺🇸", dial: "+1", mask: "(___) ___-____" },
  { code: "GB", flag: "🇬🇧", dial: "+44", mask: "____ ______" },
  { code: "DE", flag: "🇩🇪", dial: "+49", mask: "___ ________" },
  { code: "ES", flag: "🇪🇸", dial: "+34", mask: "___ ___ ___" },
  { code: "FR", flag: "🇫🇷", dial: "+33", mask: "_ __ __ __ __" },
  { code: "IN", flag: "🇮🇳", dial: "+91", mask: "_____ _____" },
];

export function applyMask(mask: string, digits: string) {
  let out = "";
  let di = 0;
  for (const ch of mask) {
    if (di >= digits.length) break;
    if (ch === "_") out += digits[di++];
    else out += ch;
  }
  return out;
}
export const maskSlots = (mask: string) => mask.split("").filter((c) => c === "_").length;

function Counter({ value, fmt, run }: { value: number; fmt: (n: number) => string; run: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 1600);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, value]);
  return <>{fmt(run ? n : 0)}</>;
}

function ContactForm() {
  const { t, bookCall, toast } = useStore();
  const [name, setName] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [digits, setDigits] = useState("");
  const [pick, setPick] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!pick) return;
    const c = () => setPick(false);
    window.addEventListener("click", c);
    return () => window.removeEventListener("click", c);
  }, [pick]);

  const slots = maskSlots(country.mask);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    if (name.trim().length < 2) er.name = t("Please enter your name");
    if (digits.length !== slots) er.phone = t("Please enter a full phone number");
    setErrors(er);
    if (Object.keys(er).length) return;
    bookCall({ name: name.trim(), phone: `${country.dial} ${applyMask(country.mask, digits)}` });
    setDone(true);
    toast(t("Thanks! A specialist will call you within 15 minutes."));
  };

  return (
    <motion.form {...reveal(0.1)} className="contact" id="contacts" onSubmit={submit} noValidate>
      <h3 className="h-lg">{t("Lets work together with Us!")}</h3>
      <p className="lead contact-lead">{t("Let us start to build your success today.")}</p>
      {done ? (
        <div className="contact-done">
          <span className="done-check">
            <Check strokeWidth={1.6} />
          </span>
          <p>
            {t("Your call is booked.")} <br />
            <span>{t("We will contact you shortly at")} {country.dial} {applyMask(country.mask, digits)}</span>
          </p>
          <button
            type="button"
            className="link"
            onClick={() => {
              setDone(false);
              setName("");
              setDigits("");
            }}
          >
            {t("Book another call")}
          </button>
        </div>
      ) : (
        <>
          <label className={`field ${errors.name ? "has-error" : ""}`}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Name")}
              autoComplete="name"
              aria-label={t("Name")}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <div className={`field field-phone ${errors.phone ? "has-error" : ""}`}>
            <div className="country" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="country-btn" onClick={() => setPick((v) => !v)} aria-label="Country code">
                <span className="flag">{country.flag}</span>
                <span className="caret" />
              </button>
              {pick && (
                <div className="country-menu glass">
                  {COUNTRIES.map((c) => (
                    <button
                      type="button"
                      key={c.code}
                      onClick={() => {
                        setCountry(c);
                        setDigits((d) => d.slice(0, maskSlots(c.mask)));
                        setPick(false);
                      }}
                    >
                      <span className="flag">{c.flag}</span> {c.code} <span className="dial">{c.dial}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="phone-wrap">
              <span className="phone-mask" aria-hidden>
                <span className="phone-typed">{applyMask(country.mask, digits)}</span>
                {country.mask.slice(applyMask(country.mask, digits).length)}
              </span>
              <input
                inputMode="tel"
                autoComplete="tel-national"
                aria-label={t("Phone number")}
                value={applyMask(country.mask, digits)}
                onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, slots))}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    e.preventDefault();
                    setDigits((d) => d.slice(0, -1));
                  }
                }}
              />
            </div>
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>
          <button className="btn btn-primary btn-sm" type="submit">
            {t("Book a Call")}
          </button>
        </>
      )}
    </motion.form>
  );
}

const PARTNERS = [
  { name: "BLOOM", cls: "p-bloom" },
  { name: "HOCHTIEF", cls: "p-hochtief" },
  { name: "VINCI", cls: "p-vinci" },
  { name: "Klarna.", cls: "p-klarna" },
  { name: "LARSEN & TOUBRO", cls: "p-lt" },
  { name: "Goldman Sachs", cls: "p-gs" },
  { name: "Barclays", cls: "p-barclays" },
];

function Partners() {
  const row = (k: string) =>
    PARTNERS.map((p) => (
      <span key={k + p.name} className={"partner " + p.cls}>
        {p.cls === "p-hochtief" && <span className="p-box" />}
        {p.cls === "p-lt" && <span className="p-ring" />}
        {p.cls === "p-gs" ? (
          <>
            Goldman
            <br />
            Sachs
          </>
        ) : (
          p.name
        )}
        {p.cls === "p-vinci" && <span className="p-vinci-mark" />}
      </span>
    ));
  return (
    <div className="partners" aria-label="Partners">
      <div className="partners-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}

export default function Stats() {
  const { t } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setRun(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="stats">
      <div className="stats-head section">
        <SplitHeading className="h-xl center" text={t("We are often chosen for our fundamental quality")} />
        <motion.p {...reveal(0.15)} className="lead center stats-lead">
          {t(
            "We deliver absolute clarity in every contract by eliminating unexpected expenses, locking fixed interest rates, and ensuring an entirely transparent, predictable experience.",
          )}
        </motion.p>
      </div>
      <div className="stats-glow">
        <div className="stats-bg">
          <Fluted preset="stats" />
        </div>
        <div className="stats-row" ref={ref}>
          {STATS.map((s, i) => (
            <motion.div {...cardReveal(i)} className="stat" key={s.label}>
              <div className="stat-num">
                <Counter value={s.value} fmt={s.fmt} run={run} />
              </div>
              <div className="stat-label">{t(s.label)}</div>
            </motion.div>
          ))}
        </div>
        <ContactForm />
      </div>
      <Partners />
    </section>
  );
}
