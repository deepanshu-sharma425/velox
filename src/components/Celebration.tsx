"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import confetti from "canvas-confetti";
import { Check } from "lucide-react";
import { EASE } from "@/lib/motion";
import { addMonths, ddmmyyyy, usd } from "@/lib/finance";
import type { Loan } from "@/lib/store";
import { useStore } from "@/lib/store";

const BILLS = 7;
const FLYERS = 16;

function Bill({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={"bill " + (className ?? "")} style={style}>
      <span className="bill-corner tl">100</span>
      <span className="bill-corner br">100</span>
      <span className="bill-seal">
        <svg viewBox="0 0 21 26" aria-hidden>
          <path d="M0 0h4.5v18.4L15.7 0H21L5.6 26H0z" fill="currentColor" />
        </svg>
      </span>
      <span className="bill-lines" />
    </div>
  );
}

/** Full-screen "loan approved" moment: a money bundle bursts open. */
export default function Celebration({
  loan,
  onClose,
  onAccount,
}: {
  loan: Loan;
  onClose: () => void;
  onAccount: () => void;
}) {
  const { t } = useStore();
  const firstPayment = addMonths(new Date(loan.createdAt), 1);
  const dest = `${loan.payout === "card" ? t("bank card") : t("Velox card")} •••• ${loan.card4 ?? ""}`;
  const [stage, setStage] = useState(0); // 0 zoom-in, 1 band snaps + fan, 2 burst, 3 text
  const amount = useMotionValue(0);
  const amountText = useTransform(amount, (v) => usd(Math.round(v)));

  const flyers = useMemo(
    () =>
      Array.from({ length: FLYERS }, (_, i) => {
        const a = (i / FLYERS) * Math.PI * 2 + Math.random() * 0.4;
        const d = 38 + Math.random() * 30;
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d * 0.7 - 10,
          r: (Math.random() - 0.5) * 540,
          s: 0.35 + Math.random() * 0.3,
          delay: Math.random() * 0.25,
        };
      }),
    [],
  );

  // the store hands us a fresh `onClose` on every render; keep the intro timers stable
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const skip = () => {
    setStage(3);
    animate(amount, loan.principal, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
  };

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = [
      setTimeout(() => setStage((s) => Math.max(s, 1)), reduced ? 0 : 950),
      setTimeout(() => {
        setStage((s) => Math.max(s, 2));
        if (!reduced) {
          const colors = ["#ff6a14", "#ffb35c", "#ffe0b0", "#ffffff", "#7fe0a4"];
          confetti({ particleCount: 140, spread: 90, startVelocity: 48, origin: { y: 0.55 }, colors, zIndex: 300, scalar: 1.1 });
          setTimeout(() => {
            confetti({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors, zIndex: 300 });
            confetti({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors, zIndex: 300 });
          }, 250);
        }
        if (navigator.vibrate) navigator.vibrate([20, 40, 30]);
      }, reduced ? 0 : 1350),
      setTimeout(() => {
        setStage(3);
        if (amount.get() === loan.principal) return;
        animate(amount, loan.principal, { duration: reduced ? 0 : 1.4, ease: [0.16, 1, 0.3, 1] });
      }, reduced ? 0 : 1700),
    ];
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [amount, loan.principal]);

  return (
    <motion.div
      className="celebrate"
      role="dialog"
      aria-modal="true"
      aria-label={t("Loan approved")}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      onClick={() => stage < 3 && skip()}
    >
      <motion.div
        className="celebrate-burst"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: stage >= 2 ? 1.15 : 0.7, opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <div className="celebrate-rays" />

      <div className="celebrate-stage">
        {/* flying bills */}
        {stage >= 2 &&
          flyers.map((f, i) => (
            <motion.div
              key={i}
              className="flyer"
              initial={{ x: 0, y: 0, rotate: 0, scale: 0.4, opacity: 1 }}
              animate={{ x: `${f.x}rem`, y: [`0rem`, `${f.y - 8}rem`, `${f.y + 26}rem`], rotate: f.r, scale: f.s, opacity: [1, 1, 0] }}
              transition={{ duration: 2.4, ease: "easeOut", delay: f.delay, times: [0, 0.45, 1] }}
            >
              <Bill />
            </motion.div>
          ))}

        {/* the bundle */}
        <motion.div
          className="bundle"
          initial={{ scale: 0.12, rotate: -28, y: 220, opacity: 0 }}
          animate={
            stage >= 3
              ? { scale: 0.62, rotate: 0, y: -150, opacity: 1 }
              : { scale: 1, rotate: -6, y: 0, opacity: 1 }
          }
          transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.9 }}
        >
          {Array.from({ length: BILLS }, (_, i) => {
            const mid = (BILLS - 1) / 2;
            return (
              <motion.div
                key={i}
                className="bundle-bill"
                initial={{ y: -i * 5, rotate: 0, x: 0 }}
                animate={
                  stage >= 1
                    ? { rotate: (i - mid) * 11, x: `${(i - mid) * 2.2}rem`, y: `${Math.abs(i - mid) * 0.9 - i * 0.2}rem` }
                    : { y: -i * 5, rotate: 0, x: 0 }
                }
                transition={{ type: "spring", stiffness: 160, damping: 13, delay: stage >= 1 ? Math.abs(i - mid) * 0.035 : 0 }}
                style={{ zIndex: i, transformOrigin: "50% 120%" }}
              >
                <Bill />
              </motion.div>
            );
          })}
          <motion.div
            className="bundle-band"
            initial={{ scaleY: 1, opacity: 1 }}
            animate={stage >= 1 ? { y: [0, -20, 260], rotate: [0, -8, 40], opacity: [1, 1, 0] } : {}}
            transition={{ duration: 0.9, ease: "easeIn" }}
          >
            VELOX
          </motion.div>
        </motion.div>

        {/* copy */}
        {stage >= 3 && (
          <div className="celebrate-copy">
            <motion.div
              className="celebrate-badge"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              <Check strokeWidth={2.2} />
            </motion.div>
            <h2 className="celebrate-title" aria-label={t("Loan approved")}>
              {t("Loan approved").split(" ").map((w, i) => (
                <span className="w" key={i}>
                  <motion.span
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.08 }}
                  >
                    {w}&nbsp;
                  </motion.span>
                </span>
              ))}
            </h2>
            <motion.div className="celebrate-amount" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8, ease: EASE }}>
              {amountText}
            </motion.div>
            <motion.p className="celebrate-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}>
              {loan.id} · {t("sent to your")} {dest}
            </motion.p>
            <motion.div className="celebrate-chips" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8, ease: EASE }}>
              <div>
                <span>{t("Monthly payment")}</span>
                <b>{usd(loan.monthly, true)}</b>
              </div>
              <div>
                <span>{t("First payment date")}</span>
                <b>{ddmmyyyy(firstPayment)}</b>
              </div>
              <div>
                <span>{t("Term")}</span>
                <b>
                  {loan.months} {t(loan.months === 1 ? "month" : "months")}
                </b>
              </div>
              <div>
                <span>{t("Total to repay")}</span>
                <b>{usd(loan.total)}</b>
              </div>
            </motion.div>
            <motion.div className="celebrate-actions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8, ease: EASE }}>
              <button className="btn btn-ghost" onClick={onClose}>
                {t("Close")}
              </button>
              <button className="btn btn-primary" onClick={onAccount}>
                {t("View my loan")}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
