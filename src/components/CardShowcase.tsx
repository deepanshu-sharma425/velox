"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { Logo } from "./Icons";
import { useStore } from "@/lib/store";

/**
 * Scroll story (progress 0 → 1 across a pinned section):
 *  0.00–0.18  sleeve rises in, title visible
 *  0.18–0.50  card slides up and out of the sleeve's pocket
 *  0.50–0.80  card comes forward to centre, sleeve drops away & blurs
 *  0.80–1.00  hold — captions in, card follows the mouse
 */
export default function CardShowcase() {
  const { t, open } = useStore();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.35 });

  // stage
  const stageY = useTransform(p, [0, 0.18, 0.5, 0.8], ["6rem", "6rem", "15rem", "0rem"]);
  const stageScale = useTransform(p, [0, 0.16], [0.9, 1]);
  const stageOpacity = useTransform(p, [0, 0.1], [0.6, 1]);

  // card
  const cardY = useTransform(p, [0.18, 0.5, 0.8], ["0%", "-118%", "0%"]);
  const cardRotate = useTransform(p, [0.18, 0.34, 0.5, 0.8], [0, -3, -6, 0]);
  const cardTiltX = useTransform(p, [0.5, 0.8], [22, 0]);
  const cardScale = useTransform(p, [0.5, 0.8], [1, 1.22]);
  const cardShadow = useTransform(p, [0.4, 0.8], [0, 1]);
  const [front, setFront] = useState(false);
  useMotionValueEvent(p, "change", (v) => setFront(v > 0.5));

  // sleeve
  const sleeveY = useTransform(p, [0.5, 0.8], ["0rem", "46rem"]);
  const sleeveRotate = useTransform(p, [0.5, 0.8], [0, 6]);
  const sleeveOpacity = useTransform(p, [0.55, 0.8], [1, 0]);
  const sleeveBlurV = useTransform(p, [0.5, 0.8], [0, 14]);
  const sleeveBlur = useMotionTemplate`blur(${sleeveBlurV}px)`;
  const glow = useTransform(p, [0.3, 0.8], [0.25, 1]);

  // copy
  const introOpacity = useTransform(p, [0, 0.2, 0.3], [1, 1, 0]);
  const introY = useTransform(p, [0.2, 0.3], ["0rem", "-4rem"]);
  const outroOpacity = useTransform(p, [0.76, 0.9], [0, 1]);
  const outroL = useTransform(p, [0.76, 0.9], ["-4rem", "0rem"]);
  const outroR = useTransform(p, [0.76, 0.9], ["4rem", "0rem"]);
  const hint = useTransform(p, [0, 0.12], [1, 0]);

  // mouse tilt (only once the card is out)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tiltX = useSpring(useTransform(my, [-1, 1], [10, -10]), { stiffness: 180, damping: 18 });
  const tiltY = useSpring(useTransform(mx, [-1, 1], [-14, 14]), { stiffness: 180, damping: 18 });
  const sheenX = useTransform(mx, [-1, 1], ["0%", "100%"]);
  const sheenY = useTransform(my, [-1, 1], ["0%", "100%"]);
  const sheen = useMotionTemplate`radial-gradient(60% 80% at ${sheenX} ${sheenY}, rgba(255,255,255,0.35), rgba(255,255,255,0) 60%)`;

  const onMove = (e: React.PointerEvent) => {
    if (!front) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section className="unbox" ref={ref} aria-label={t("Velox debit card")}>
      <div className="unbox-sticky" onPointerMove={onMove} onPointerLeave={onLeave}>
        <motion.div className="unbox-glow" style={{ opacity: glow }} aria-hidden />

        <motion.div className="unbox-intro" style={{ opacity: introOpacity, y: introY }}>
          <p className="unbox-kicker">{t("Velox debit card")}</p>
          <h2 className="h-xl center">{t("Unbox your card")}</h2>
        </motion.div>

        <div className="unbox-side is-left">
          <motion.div className="unbox-copy" style={{ opacity: outroOpacity, x: outroL }}>
            <h3 className="h-lg">{t("Your money, one tap away")}</h3>
            <p className="lead">{t("Every approved loan lands on your Velox card instantly. Pay anywhere, withdraw worldwide, freeze it in a second.")}</p>
          </motion.div>
        </div>
        <div className="unbox-side is-right">
        <motion.ul className="unbox-copy bullets" style={{ opacity: outroOpacity, x: outroR }}>
          <li>{t("Instant virtual card on approval")}</li>
          <li>{t("Free withdrawals in 40+ countries")}</li>
          <li>{t("Freeze & unfreeze in one tap")}</li>
          <li className="unbox-cta-li">
            <button className="btn btn-primary btn-sm" onClick={() => open({ type: "apply", preset: {} })}>
              {t("Get a Loan")}
            </button>
          </li>
        </motion.ul>
        </div>

        <motion.div className="unbox-stage" style={{ y: stageY, scale: stageScale, opacity: stageOpacity }}>
          {/* back of the sleeve */}
          <motion.div
            className="sleeve sleeve-back"
            style={{ y: sleeveY, rotate: sleeveRotate, opacity: sleeveOpacity, filter: sleeveBlur }}
          />

          {/* the card */}
          <motion.div
            className="vcard-wrap"
            style={{ y: cardY, rotate: cardRotate, rotateX: cardTiltX, scale: cardScale, zIndex: front ? 5 : 2, transformPerspective: 1400 }}
          >
            <motion.div className="vcard" style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}>
              <motion.div className="vcard-shadow" style={{ opacity: cardShadow }} />
              <div className="vcard-face">
                <div className="vcard-flutes" />
                <motion.div className="vcard-sheen" style={{ background: sheen }} />
                <div className="vcard-top">
                  <Logo />
                  <svg viewBox="0 0 24 24" className="vcard-nfc" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
                    <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
                  </svg>
                </div>
                <div className="vcard-chip" aria-hidden>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="vcard-num">4821&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;7390</div>
                <div className="vcard-bottom">
                  <div>
                    <span>{t("Card holder")}</span>
                    <b>ALEX MORGAN</b>
                  </div>
                  <div>
                    <span>{t("Valid thru")}</span>
                    <b>09/29</b>
                  </div>
                  <em>debit</em>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* front pocket of the sleeve — hides the card while it is inside */}
          <motion.div
            className="sleeve sleeve-front"
            style={{ y: sleeveY, rotate: sleeveRotate, opacity: sleeveOpacity, filter: sleeveBlur }}
          >
            <div className="sleeve-flutes" />
            <div className="sleeve-brand">
              <Logo />
              <span>{t("Premium debit card")}</span>
            </div>
            <div className="sleeve-edge" />
          </motion.div>
        </motion.div>

        <motion.div className="unbox-hint" style={{ opacity: hint }}>
          {t("Scroll to unbox")}
          <span />
        </motion.div>
      </div>
    </section>
  );
}
