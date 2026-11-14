"use client";

import { useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

/** 3D tilt toward the pointer + a glare that follows it. */
export function useTilt(max = 7) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 220, damping: 18 });
  const sry = useSpring(ry, { stiffness: 220, damping: 18 });
  const glare = useMotionTemplate`radial-gradient(32rem circle at ${gx}% ${gy}%, rgba(255,150,80,0.16), rgba(255,150,80,0) 60%)`;

  const onMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * max * 2);
    rx.set(-(py - 0.5) * max * 2);
    gx.set(px * 100);
    gy.set(py * 100);
  };
  const onMouseLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return {
    style: { rotateX: srx, rotateY: sry, transformPerspective: 1000 },
    glare,
    handlers: { onMouseMove, onMouseLeave },
  };
}
