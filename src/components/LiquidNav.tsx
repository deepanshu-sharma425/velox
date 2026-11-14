"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";

export type LiquidItem = { id: string; label: string; icon?: React.ReactNode };

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const SPRING = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.9 };

/**
 * iOS-style "liquid glass" segmented nav.
 * - Tap an item: the pill glides there and stretches with its velocity.
 * - Press & drag anywhere on the bar: the pill lifts into a clear glass lens,
 *   follows the pointer, magnifies the item underneath, and drops onto the
 *   nearest item on release.
 */
export default function LiquidNav({
  items,
  active,
  onSelect,
  className,
  itemClassName,
  label,
  remeasureKey,
}: {
  items: LiquidItem[];
  active: string;
  onSelect: (id: string) => void;
  className?: string;
  itemClassName?: string;
  label: string;
  remeasureKey?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const w = useMotionValue(0);
  const ready = useRef(false);
  const vx = useVelocity(x);
  const sx = useSpring(useTransform(vx, [-2400, 0, 2400], [1.28, 1, 1.28]), { stiffness: 500, damping: 30 });
  const sy = useSpring(useTransform(vx, [-2400, 0, 2400], [0.86, 1, 0.86]), { stiffness: 500, damping: 30 });

  const [lifted, setLifted] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const drag = useRef<{ startX: number; dragging: boolean; target: string } | null>(null);
  const suppress = useRef(false);

  const rects = useCallback(() => {
    const nav = ref.current;
    if (!nav) return [];
    return items
      .map((i) => {
        const el = nav.querySelector<HTMLElement>(`[data-id="${i.id}"]`);
        return el ? { id: i.id, x: el.offsetLeft, w: el.offsetWidth } : null;
      })
      .filter(Boolean) as { id: string; x: number; w: number }[];
  }, [items]);

  const moveTo = useCallback(
    (id: string, instant = false) => {
      const r = rects().find((q) => q.id === id);
      if (!r) return;
      if (instant) {
        x.set(r.x);
        w.set(r.w);
      } else {
        animate(x, r.x, SPRING);
        animate(w, r.w, SPRING);
      }
    },
    [rects, x, w],
  );

  useIso(() => {
    if (drag.current?.dragging) return;
    moveTo(active, !ready.current);
    ready.current = true;
  }, [active, remeasureKey, moveTo]);

  useEffect(() => {
    const re = () => moveTo(active, true);
    window.addEventListener("resize", re);
    document.fonts?.ready.then(re);
    return () => window.removeEventListener("resize", re);
  }, [active, moveTo]);

  const nearest = (cx: number) => {
    let best = rects()[0];
    let d = Infinity;
    for (const r of rects()) {
      const dd = Math.abs(r.x + r.w / 2 - cx);
      if (dd < d) {
        d = dd;
        best = r;
      }
    }
    return best;
  };

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { startX: e.clientX, dragging: false, target: active };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const nav = ref.current;
    if (!d || !nav) return;
    if (!d.dragging) {
      if (Math.abs(e.clientX - d.startX) < 6) return;
      d.dragging = true;
      setLifted(true);
      try {
        nav.setPointerCapture(e.pointerId);
      } catch {}
    }
    const box = nav.getBoundingClientRect();
    const cx = e.clientX - box.left;
    const n = nearest(cx);
    const cw = w.get();
    const pad = rects()[0]?.x ?? 0;
    x.set(Math.max(pad - 6, Math.min(box.width - pad - cw + 6, cx - cw / 2)));
    if (n && n.id !== d.target) {
      d.target = n.id;
      setHover(n.id);
      animate(w, n.w, SPRING);
      if (navigator.vibrate) navigator.vibrate(4);
    }
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.dragging) return;
    suppress.current = true;
    setTimeout(() => (suppress.current = false), 50);
    setLifted(false);
    setHover(null);
    moveTo(d.target);
    onSelect(d.target);
  };

  return (
    <nav
      ref={ref}
      className={`lnav ${lifted ? "is-dragging" : ""} ${className ?? ""}`}
      aria-label={label}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onLostPointerCapture={onUp}
    >
      <motion.span className="lnav-pill-track" style={{ x, width: w, scaleX: sx, scaleY: sy }} aria-hidden>
        <motion.span
          className={`lnav-pill ${lifted ? "is-lifted" : ""}`}
          animate={lifted ? { scale: 1.2, y: -1 } : { scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 26 }}
        >
          <span className="lnav-spec" />
        </motion.span>
      </motion.span>
      {items.map((it) => (
        <button
          key={it.id}
          data-id={it.id}
          className={`${itemClassName ?? "lnav-item"} ${active === it.id && !lifted ? "is-active" : ""} ${hover === it.id ? "is-hover" : ""}`}
          onClick={() => {
            if (suppress.current) return;
            moveTo(it.id);
            onSelect(it.id);
          }}
        >
          {it.icon}
          <span className="lnav-label">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

/** Hidden SVG filter used for the refraction of the lifted lens (Chromium). */
export function LiquidFilter() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <filter id="liquid-refract" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="7" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="1.5" result="soft" />
        <feDisplacementMap in="SourceGraphic" in2="soft" scale="14" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
