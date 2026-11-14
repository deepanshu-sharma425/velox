"use client";

import { useEffect, useRef } from "react";

type Preset = {
  base: number; // design width the numbers below are measured against
  tip: number; // y of the arch top (design px)
  rx: number;
  ry: number;
  fadeEnd: number; // y where the glow body has faded out
  wash: number; // reddish top wash alpha (0 = none)
  washEnd: number;
  topFade: number; // fade canvas in from the top over this many px
  bottomFade: number; // fade canvas out over the last N px
  flute: number;
  mag: number;
  intensity: number;
};

const PRESETS: Record<string, { desktop: Preset; mobile: Preset }> = {
  hero: {
    desktop: { base: 1600, tip: 104, rx: 800, ry: 520, fadeEnd: 640, wash: 0.8, washEnd: 560, topFade: 0, bottomFade: 160, flute: 23, mag: 5, intensity: 1 },
    mobile: { base: 390, tip: 34, rx: 250, ry: 150, fadeEnd: 190, wash: 0.75, washEnd: 200, topFade: 0, bottomFade: 50, flute: 12, mag: 4.5, intensity: 1 },
  },
  stats: {
    desktop: { base: 1600, tip: 383, rx: 760, ry: 400, fadeEnd: 1050, wash: 0, washEnd: 1100, topFade: 260, bottomFade: 200, flute: 23, mag: 5, intensity: 1 },
    mobile: { base: 390, tip: 170, rx: 250, ry: 180, fadeEnd: 540, wash: 0, washEnd: 560, topFade: 120, bottomFade: 80, flute: 12, mag: 4.5, intensity: 0.95 },
  },
  footer: {
    desktop: { base: 1600, tip: 96, rx: 780, ry: 460, fadeEnd: 800, wash: 0, washEnd: 760, topFade: 90, bottomFade: 0, flute: 23, mag: 5, intensity: 0.92 },
    mobile: { base: 390, tip: 20, rx: 250, ry: 140, fadeEnd: 220, wash: 0.5, washEnd: 200, topFade: 0, bottomFade: 60, flute: 12, mag: 4.5, intensity: 0.95 },
  },
};

function render(canvas: HTMLCanvasElement, preset: keyof typeof PRESETS) {
  const parent = canvas.parentElement;
  if (!parent) return;
  const W = parent.clientWidth;
  const H = parent.clientHeight;
  if (!W || !H) return;
  const mobile = window.innerWidth < 1024;
  const p = mobile ? PRESETS[preset].mobile : PRESETS[preset].desktop;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const s = W / p.base;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";

  const mk = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return [c, c.getContext("2d")!] as const;
  };

  // 1) Light source behind the glass
  const [src, g] = mk();
  g.fillStyle = "#000";
  g.fillRect(0, 0, W, H);

  if (p.wash > 0) {
    const y0 = preset === "hero" ? 0 : Math.max(0, (p.tip - 220) * s);
    const wg = g.createLinearGradient(0, y0, 0, p.washEnd * s);
    if (preset === "hero") {
      wg.addColorStop(0, `rgba(110,36,12,${p.wash})`);
      wg.addColorStop(0.4, `rgba(60,18,6,${p.wash * 0.5})`);
    } else {
      wg.addColorStop(0, "rgba(0,0,0,0)");
      wg.addColorStop(0.35, `rgba(70,22,8,${p.wash})`);
      wg.addColorStop(0.6, `rgba(50,16,5,${p.wash * 0.7})`);
    }
    wg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = wg;
    g.fillRect(0, y0, W, p.washEnd * s - y0);
  }

  const cx = W / 2;
  const top = p.tip * s;
  const ry = p.ry * s;
  const rx = p.rx * s;
  const cy = top + ry;

  const [body, b] = mk();
  const vg = b.createLinearGradient(0, top, 0, p.fadeEnd * s);
  vg.addColorStop(0, "rgba(255,124,44,1)");
  vg.addColorStop(0.04, "rgba(240,96,26,1)");
  vg.addColorStop(0.14, "rgba(172,58,13,1)");
  vg.addColorStop(0.32, "rgba(92,29,7,1)");
  vg.addColorStop(0.58, "rgba(36,11,3,1)");
  vg.addColorStop(1, "rgba(0,0,0,0)");
  b.fillStyle = vg;
  b.beginPath();
  b.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  b.fill();
  b.globalCompositeOperation = "destination-in";
  const hg = b.createLinearGradient(0, 0, W, 0);
  hg.addColorStop(0, "rgba(0,0,0,0.08)");
  hg.addColorStop(0.2, "rgba(0,0,0,0.38)");
  hg.addColorStop(0.36, "rgba(0,0,0,0.85)");
  hg.addColorStop(0.5, "rgba(0,0,0,1)");
  hg.addColorStop(0.64, "rgba(0,0,0,0.85)");
  hg.addColorStop(0.8, "rgba(0,0,0,0.38)");
  hg.addColorStop(1, "rgba(0,0,0,0.08)");
  b.fillStyle = hg;
  b.fillRect(0, 0, W, H);

  g.globalAlpha = p.intensity;
  g.filter = `blur(${Math.max(1.5, 4 * s)}px)`;
  g.drawImage(body, 0, 0);
  g.filter = "none";
  g.globalAlpha = 1;

  // 2) Fluted glass: each flute shows a horizontally compressed slice
  const [fl, f] = mk();
  const fw = Math.max(6, p.flute * s);
  const sw = fw * p.mag;
  for (let x = -fw / 2; x < W; x += fw) {
    const c = x + fw / 2;
    const sx = Math.max(0, Math.min(W - sw, c - sw / 2));
    f.drawImage(src, sx, 0, sw, H, x, 0, fw, H);
  }
  // smooth ridge shading
  const tile = document.createElement("canvas");
  tile.width = Math.max(2, Math.round(fw));
  tile.height = 1;
  const t = tile.getContext("2d")!;
  const sg = t.createLinearGradient(0, 0, tile.width, 0);
  sg.addColorStop(0, "rgba(0,0,0,0.62)");
  sg.addColorStop(0.22, "rgba(0,0,0,0.22)");
  sg.addColorStop(0.45, "rgba(0,0,0,0.02)");
  sg.addColorStop(0.6, "rgba(0,0,0,0)");
  sg.addColorStop(0.84, "rgba(0,0,0,0.2)");
  sg.addColorStop(1, "rgba(0,0,0,0.62)");
  t.fillStyle = sg;
  t.fillRect(0, 0, tile.width, 1);
  f.save();
  f.translate(-fw / 2, 0);
  f.fillStyle = f.createPattern(tile, "repeat")!;
  f.fillRect(0, 0, W + fw, H);
  f.restore();

  // fades
  f.globalCompositeOperation = "destination-out";
  if (p.topFade > 0) {
    const tg = f.createLinearGradient(0, 0, 0, p.topFade * s);
    tg.addColorStop(0, "rgba(0,0,0,1)");
    tg.addColorStop(1, "rgba(0,0,0,0)");
    f.fillStyle = tg;
    f.fillRect(0, 0, W, p.topFade * s);
  }
  if (p.bottomFade > 0) {
    const h = Math.min(H, p.bottomFade * s);
    const bg = f.createLinearGradient(0, H - h, 0, H);
    bg.addColorStop(0, "rgba(0,0,0,0)");
    bg.addColorStop(1, "rgba(0,0,0,1)");
    f.fillStyle = bg;
    f.fillRect(0, H - h, W, h);
  }

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.filter = `blur(${Math.max(0.8, 2 * s)}px)`;
  ctx.drawImage(fl, 0, 0);
  ctx.filter = "none";
}

export default function Fluted({ preset, className }: { preset: "hero" | "stats" | "footer"; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let raf = 0;
    let lastW = 0;
    let lastH = 0;
    const draw = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = c.parentElement;
        if (!el) return;
        // Skip height-only jitter (mobile URL bar) unless significant
        if (el.clientWidth === lastW && Math.abs(el.clientHeight - lastH) < 4) return;
        lastW = el.clientWidth;
        lastH = el.clientHeight;
        render(c, preset);
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    if (c.parentElement) ro.observe(c.parentElement);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [preset]);

  return <canvas ref={ref} className={"fluted " + (className ?? "")} aria-hidden />;
}
