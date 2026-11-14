"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useScroll, useSpring } from "framer-motion";

/**
 * Global pointer effects:
 *  - custom cursor (dot + lagging ring that morphs over interactive elements)
 *  - soft orange spotlight that trails the pointer
 *  - magnetic buttons (every .btn leans toward the cursor via the CSS `translate` property)
 *  - scroll progress bar
 */
export default function Fx() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 32, mass: 0.3 });

  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const ringX = useSpring(mx, { stiffness: 520, damping: 38, mass: 0.5 });
  const ringY = useSpring(my, { stiffness: 520, damping: 38, mass: 0.5 });
  const glowX = useSpring(mx, { stiffness: 60, damping: 20 });
  const glowY = useSpring(my, { stiffness: 60, damping: 20 });

  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"idle" | "link" | "text">("idle");
  const [down, setDown] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);
    document.documentElement.classList.add("has-cursor");

    let magnet: HTMLElement | null = null;
    const release = () => {
      if (magnet) {
        magnet.style.setProperty("--mx", "0px");
        magnet.style.setProperty("--my", "0px");
        magnet = null;
      }
    };

    const move = (e: PointerEvent) => {
      mx.set(e.clientX);
      my.set(e.clientY);
      setHidden(false);
      const t = e.target as HTMLElement | null;
      const interactive = t?.closest?.("a, button, [role='button'], label.check, .lnav, .cal-day");
      const field = t?.closest?.("input, textarea, select");
      setMode(field ? "text" : interactive ? "link" : "idle");

      const btn = t?.closest?.(".btn") as HTMLElement | null;
      if (btn !== magnet) release();
      if (btn && !btn.closest(".modal, .drawer")) {
        magnet = btn;
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.32;
        btn.style.setProperty("--mx", dx.toFixed(1) + "px");
        btn.style.setProperty("--my", dy.toFixed(1) + "px");
      }
    };
    const leave = () => {
      setHidden(true);
      release();
    };
    const pd = () => setDown(true);
    const pu = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", pd);
    window.addEventListener("pointerup", pu);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointerup", pu);
      document.documentElement.classList.remove("has-cursor");
      release();
    };
  }, [mx, my]);

  return (
    <>
      <motion.div className="scroll-progress" style={{ scaleX: progress }} aria-hidden />
      {enabled && (
        <div className={`cursor ${hidden ? "is-hidden" : ""}`} aria-hidden>
          <motion.div className="cursor-glow" style={{ x: glowX, y: glowY }} />
          <motion.div className={`cursor-ring is-${mode} ${down ? "is-down" : ""}`} style={{ x: ringX, y: ringY }} />
          <motion.div className={`cursor-dot is-${mode}`} style={{ x: mx, y: my }} />
        </div>
      )}
    </>
  );
}
