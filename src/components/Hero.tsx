"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Review } from "@/lib/content";
import { useTilt } from "@/lib/useTilt";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EASE, enter } from "@/lib/motion";
import Fluted from "./Fluted";
import Header from "./Header";
import { Stars } from "./Icons";
import { REVIEWS } from "@/lib/content";
import { scrollToId, useStore } from "@/lib/store";

const N = REVIEWS.length;

function ReviewCard({ r, active }: { r: Review; active: boolean }) {
  const { t } = useStore();
  const tilt = useTilt(5);
  return (
    <motion.article className={`review glass ${active ? "is-active" : ""}`} aria-hidden={!active} style={tilt.style} {...tilt.handlers}>
      <motion.span className="tilt-glare" style={{ background: tilt.glare }} aria-hidden />
      <div className="review-head">
        <img src={r.avatar} alt="" className="review-avatar" width={44} height={44} />
        <div className="review-who">
          <div className="review-name">{r.name}</div>
          <div className="review-role">{t("Customer")}</div>
        </div>
        <Stars n={r.stars} />
      </div>
      <p className="review-text">{t(r.text)}</p>
      <div className="review-date">
        <CalendarDays strokeWidth={1.2} />
        {r.date}
      </div>
    </motion.article>
  );
}
const COPIES = 5;

function Testimonials() {
  const { t } = useStore();
  const [idx, setIdx] = useState(N * 2 + 1); // start with Tom (index 1) centered
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  const move = useCallback((d: number) => {
    setAnim(true);
    setIdx((i) => i + d);
  }, []);

  // keep the index inside the middle copies for an endless loop
  const onEnd = () => {
    if (idx < N * 1.5 || idx >= N * 3.5) {
      setAnim(false);
      setIdx(N * 2 + (((idx % N) + N) % N));
    }
  };

  useEffect(() => {
    if (!anim) {
      const r = requestAnimationFrame(() => setAnim(true));
      return () => cancelAnimationFrame(r);
    }
  }, [anim]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => move(1), 6000);
    return () => clearInterval(id);
  }, [paused, move]);

  const items = Array.from({ length: N * COPIES }, (_, i) => REVIEWS[i % N]);

  return (
    <motion.div
      {...enter(1.1, 60)}
      className="reviews"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touch.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touch.current == null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
    >
      <button className="reviews-arrow is-prev" aria-label="Previous review" onClick={() => move(-1)}>
        <ChevronLeft strokeWidth={1.3} />
      </button>
      <div className="reviews-viewport">
        <div
          className="reviews-track"
          style={{
            transform: `translateX(calc(-1 * (${idx} * (var(--rc-w) + var(--rc-gap)) + var(--rc-w) / 2)))`,
            transition: anim ? undefined : "none",
          }}
          onTransitionEnd={onEnd}
        >
          {items.map((r, i) => (
            <ReviewCard key={i} r={r} active={i === idx} />
          ))}
        </div>
      </div>
      <button className="reviews-arrow is-next" aria-label="Next review" onClick={() => move(1)}>
        <ChevronRight strokeWidth={1.3} />
      </button>
    </motion.div>
  );
}

export default function Hero() {
  const { open, t } = useStore();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: hp } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(hp, (s) => s * 260);
  const cY = useTransform(hp, (s) => s * -160);
  const cO = useTransform(hp, [0, 0.55], [1, 0]);
  return (
    <section
      className="hero"
      id="home"
      ref={heroRef}
    >
      <motion.div
        style={{ y: bgY }}
        className="hero-bg"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
      >
        <Fluted preset="hero" />
      </motion.div>
      <Header />
      <motion.div className="hero-content" style={{ y: cY, opacity: cO }}>
        <motion.p {...enter(0.15, 16)} className="hero-kicker">
          {t("Over 30K+ customers chose us.")}
        </motion.p>
        <h1 className="hero-title" aria-label={t("Choose your comfortable credit plan here")}>
          {t("Choose your comfortable credit plan here")
            .split(" ")
            .map((w, i) => (
              <span key={i}>
                <span className="w" aria-hidden>
                  <motion.span
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.1, ease: EASE, delay: 0.25 + i * 0.07 }}
                  >
                    {w}
                  </motion.span>
                </span>{" "}
              </span>
            ))}
        </h1>
        <motion.p {...enter(0.75, 20)} className="hero-sub">
          {t(
            "Explore our customizable lending products below to find an automated schedule that guarantees fixed rates, simple terms, and zero unexpected charges.",
          )}
        </motion.p>
        <motion.div {...enter(0.9, 20)} className="hero-ctas">
          <button className="btn btn-ghost" onClick={() => open({ type: "pay" })}>
            {t("Pay the Loan")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => scrollToId("services")}
          >
            {t("Buy Credit Product")}
          </button>
        </motion.div>
      </motion.div>
      <Testimonials />
    </section>
  );
}
