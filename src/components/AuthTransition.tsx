"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, MotionValue } from "framer-motion";
import { Logo } from "./Icons";
import { EASE } from "@/lib/motion";
import { useStore } from "@/lib/store";

/** Card-holder line that "prints" letters as they are typed. */
export function CardHolder({ text, placeholder, caret }: { text: string; placeholder: string; caret?: boolean }) {
  const chars = text.toUpperCase().slice(0, 22).split("");
  return (
    <b className="holder" aria-label={text || placeholder}>
      {chars.length === 0 && !caret && <span className="holder-ph">{placeholder}</span>}
      <AnimatePresence initial={false}>
        {chars.map((c, i) => (
          <motion.span
            key={i + c}
            className="holder-ch"
            initial={{ opacity: 0, y: -8, scale: 1.8, filter: "blur(4px)", color: "#ffd2a8" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)", color: "#ffffff" }}
            exit={{ opacity: 0, y: 6, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 600, damping: 26 }}
          >
            {c === " " ? " " : c}
          </motion.span>
        ))}
      </AnimatePresence>
      {caret && <span className="holder-caret" />}
    </b>
  );
}

/** The orange Velox card face, shared by the auth page and the transition. */
export function VCardFace({
  holder,
  sheen,
  caret,
  placeholder = "YOUR NAME",
  number = "4821\u00a0\u00a0••••\u00a0\u00a0••••\u00a0\u00a07390",
  tag = "debit",
  variant,
}: {
  holder: string;
  sheen?: MotionValue<string> | string;
  caret?: boolean;
  placeholder?: string;
  number?: string;
  tag?: string;
  /** "ext" renders a graphite third-party bank card instead of the orange Velox one. */
  variant?: "ext";
}) {
  return (
    <div className={`vcard-face ${variant === "ext" ? "is-ext" : ""}`}>
      <div className="vcard-flutes" />
      {sheen && <motion.div className="vcard-sheen" style={{ background: sheen }} />}
      <div className="vcard-top">
        {variant === "ext" ? <span className="vcard-bank">Bank card</span> : <Logo />}
        <svg viewBox="0 0 24 24" className="vcard-nfc" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
        </svg>
      </div>
      <div className="vcard-chip" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="vcard-num">{number}</div>
      <div className="vcard-bottom">
        <div>
          <span>Card holder</span>
          <CardHolder text={holder} placeholder={placeholder} caret={caret} />
        </div>
        <em>{tag}</em>
      </div>
    </div>
  );
}

/**
 * Global overlay: card flies in from the side → the account name is typed
 * onto it → the card zooms out and dissolves to reveal the page underneath.
 */
export default function AuthTransition() {
  const { authFx, t } = useStore();
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    if (authFx?.phase !== "type") {
      if (authFx?.phase === "fly") setTyped(0);
      return;
    }
    setTyped(0);
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= authFx.name.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 55);
    return () => clearInterval(id);
  }, [authFx?.phase, authFx?.name]);

  const phase = authFx?.phase;
  const first = authFx?.name.split(" ")[0] ?? "";

  return (
    <AnimatePresence>
      {authFx && (
        <motion.div
          className="authfx"
          key="authfx"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "exit" ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: phase === "exit" ? 0.9 : 0.35, ease: EASE }}
          aria-live="polite"
        >
          <motion.div
            className="authfx-glow"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: phase === "type" ? 1.15 : 0.9, opacity: 1 }}
            transition={{ duration: 1.2, ease: EASE }}
          />
          <motion.div
            className="authfx-card"
            initial={{ x: "-120vw", y: "6rem", rotate: -32, rotateY: 55, scale: 0.75 }}
            animate={
              phase === "exit"
                ? { x: 0, y: "-2rem", rotate: 0, rotateY: 0, scale: 2.6, opacity: 0, filter: "blur(14px)" }
                : { x: 0, y: 0, rotate: phase === "type" ? 0 : -5, rotateY: 0, scale: 1, opacity: 1, filter: "blur(0px)" }
            }
            transition={
              phase === "exit"
                ? { duration: 0.9, ease: [0.7, 0, 0.84, 0] }
                : { type: "spring", stiffness: 70, damping: 14, mass: 0.9 }
            }
            style={{ transformPerspective: 1200 }}
          >
            <div className="vcard-shadow" />
            <VCardFace holder={phase === "fly" ? "" : (authFx.name ?? "").slice(0, typed)} caret={phase !== "exit"} placeholder="" />
            {phase === "fly" && <div className="authfx-scan" />}
          </motion.div>
          <div className="authfx-copy">
            <AnimatePresence mode="wait">
              {phase === "fly" ? (
                <motion.p key="v" className="authfx-status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  {authFx.mode === "signup" ? t("Creating your account") : t("Verifying your card")}
                  <span className="dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </motion.p>
              ) : (
                <motion.h2 key="w" className="authfx-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
                  {authFx.mode === "signup" ? t("Welcome to Velox") : t("Welcome back")}, <span>{first}</span>
                </motion.h2>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
