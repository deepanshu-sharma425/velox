"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "./ThemeProvider";

export default function FlutedCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;
    let time = 0;

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resize);
    resize();

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const isLight = document.documentElement.classList.contains("light");
      const centerX = width * 0.5;
      const centerY = height * 0.16;
      const numRays = 40;
      const baseRadius = Math.max(width, height) * 0.85;

      time += 0.005;

      for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI - Math.PI * 0.5;
        const spread = angle * 0.92 + Math.sin(time + i * 0.14) * 0.015;

        const x1 = centerX + Math.sin(spread) * 70;
        const y1 = centerY - Math.cos(spread) * 70;
        const x2 = centerX + Math.sin(spread) * baseRadius;
        const y2 = centerY - Math.cos(spread) * baseRadius;

        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        const intensity = (0.04 + Math.sin(i * 0.4 + time) * 0.02) * (isLight ? 0.35 : 1.0);

        if (isLight) {
          grad.addColorStop(0, `rgba(255, 140, 40, ${intensity * 1.2})`);
          grad.addColorStop(0.4, `rgba(255, 110, 20, ${intensity * 0.6})`);
          grad.addColorStop(1, "rgba(248, 248, 247, 0)");
        } else {
          grad.addColorStop(0, `rgba(255, 140, 25, ${intensity * 1.6})`);
          grad.addColorStop(0.35, `rgba(255, 95, 0, ${intensity})`);
          grad.addColorStop(0.7, `rgba(180, 45, 0, ${intensity * 0.35})`);
          grad.addColorStop(1, "rgba(8, 8, 8, 0)");
        }

        ctx.beginPath();
        ctx.lineWidth = width > 768 ? 14 : 7;
        ctx.strokeStyle = grad;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="w-full h-full opacity-60 dark:opacity-65" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-b from-orange-500/10 dark:from-orange-500/15 via-orange-600/5 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-orange-600/5 dark:bg-orange-600/10 blur-[140px] pointer-events-none" />
    </div>
  );
}
