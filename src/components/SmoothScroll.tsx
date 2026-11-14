"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useStore } from "@/lib/store";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function SmoothScroll() {
  const { modal } = useStore();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      anchors: false,
    });
    window.__lenis = lenis;
    let id = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  // Freeze page scrolling while a modal / drawer / menu is open
  useEffect(() => {
    const l = window.__lenis;
    if (!l) return;
    if (modal) l.stop();
    else l.start();
  }, [modal]);

  return null;
}
