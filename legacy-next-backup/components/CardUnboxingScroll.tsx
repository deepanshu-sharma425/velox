"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  RotateCw, 
  Copy, 
  Check, 
  Sparkles, 
  CreditCard, 
  Smartphone, 
  Wifi,
  Shield,
  Layers,
  Zap,
  Globe2
} from "lucide-react";
import { useBank } from "@/lib/bankStore";

export default function CardUnboxingScroll() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    userName,
    isCardFrozen,
    toggleCardFrozen,
    cardSkin,
    setCardSkin,
    showCardNumbers,
    setShowCardNumbers,
    dailyLimit,
    formatMoney,
  } = useBank();

  // Track scroll progress within this 320vh scroll track
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Inertial smooth spring physics
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 20,
    restDelta: 0.001,
  });

  // =========================================================================
  // SCROLL-DRIVEN UNBOXING CHOREOGRAPHY
  // 1. [0.00 -> 0.20]: Sleeve rests on stage, top magnetic lid opens back.
  // 2. [0.20 -> 0.52]: Card glides OUT of the sleeve pocket.
  // 3. [0.50 -> 0.78]: Card ZOOMS forward dramatically into center hero view.
  // 4. [0.72 -> 0.95]: Sleeve blurs away, floating feature badges & controls appear.
  // =========================================================================

  const flapRotateX = useTransform(smoothProgress, [0.05, 0.22], [0, -145]);
  const sleeveY = useTransform(smoothProgress, [0.18, 0.65], [60, 140]);
  const sleeveScale = useTransform(smoothProgress, [0.25, 0.72], [1, 0.78]);
  const sleeveOpacity = useTransform(smoothProgress, [0.4, 0.75], [1, 0.2]);
  const sleeveBlur = useTransform(smoothProgress, [0.45, 0.8], ["blur(0px)", "blur(18px)"]);

  // Card translation (glides UP out of the sleeve pocket)
  const cardTranslateY = useTransform(smoothProgress, [0.18, 0.55], [115, -15]);

  // The BIG ZOOM effect (scale expands up to 1.55 on desktop, bringing card into crisp focus)
  const cardScale = useTransform(smoothProgress, [0.48, 0.8], [1.0, 1.48]);

  // Spatial 3D rotation: begins tilted in the sleeve, settles to straight-on hero angle
  const cardRotateX = useTransform(smoothProgress, [0.1, 0.52, 0.82], [32, 14, 0]);
  const cardRotateY = useTransform(smoothProgress, [0.1, 0.52, 0.82], [-22, -8, 0]);
  const cardRotateZ = useTransform(smoothProgress, [0.1, 0.52, 0.82], [8, 3, 0]);

  // Ambient Spotlight Halo
  const haloOpacity = useTransform(smoothProgress, [0.2, 0.75], [0.2, 0.9]);
  const haloScale = useTransform(smoothProgress, [0.25, 0.8], [0.75, 1.35]);

  // Surrounding Floating Badges visibility
  const badgesOpacity = useTransform(smoothProgress, [0.72, 0.9], [0, 1]);
  const badgesTranslateY = useTransform(smoothProgress, [0.72, 0.9], [25, 0]);

  // Bottom interactive controls
  const controlsOpacity = useTransform(smoothProgress, [0.65, 0.88], [0, 1]);
  const scrollHintOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  // Local card state
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);

  // Mouse tilt on the card when hovering
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMouseTilt({
      x: -(y / (rect.height / 2)) * 14,
      y: (x / (rect.width / 2)) * 14,
    });
  };

  const handleMouseLeave = () => {
    setMouseTilt({ x: 0, y: 0 });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText("4810 5920 8391 2049");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToWallet = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF7A00", "#FFA033", "#22C55E", "#FFFFFF"],
    });
  };

  const skinStyles = {
    orange: "from-[#FF7A00] via-[#FF5500] to-[#C93800] border-orange-400/40 text-white shadow-[0_25px_60px_rgba(255,122,0,0.4)]",
    obsidian: "from-[#1C1B1A] via-[#10100F] to-[#050505] border-neutral-700/60 text-neutral-100 shadow-[0_25px_60px_rgba(0,0,0,0.85)]",
    chrome: "from-[#4B5262] via-[#2F343E] to-[#1A1D23] border-neutral-400/40 text-neutral-100 shadow-[0_25px_60px_rgba(100,116,139,0.35)]",
  };

  return (
    <div 
      id="card-unboxing" 
      ref={containerRef} 
      className="relative h-[320vh] w-full transition-colors duration-300"
    >
      {/* Sticky Viewport Stage Frame */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4">
        
        {/* Dynamic Radiant Halo Backdrop */}
        <motion.div 
          style={{ opacity: haloOpacity, scale: haloScale }}
          className="absolute w-[640px] sm:w-[820px] h-[500px] rounded-full bg-gradient-to-r from-orange-600/30 via-orange-500/20 to-amber-500/25 blur-[140px] pointer-events-none -z-10"
        />

        {/* Section Header - Bold, enlarged, stylish */}
        <div className="text-center mb-5 z-20 max-w-3xl px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 backdrop-blur-md">
            <Sparkles className="w-4 h-4" />
            Tactile 3D Unboxing & Zoom Reveal
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight text-neutral-900 dark:text-white">
            Unbox the Velvet Debit Card
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mt-2 max-w-xl mx-auto">
            Scroll down to watch the card slide smoothly out from its titanium sleeve and zoom into center stage.
          </p>
        </div>

        {/* Scroll Instruction Indicator */}
        <motion.div 
          style={{ opacity: scrollHintOpacity }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-xs sm:text-sm font-mono text-orange-500 dark:text-orange-400 pointer-events-none z-30"
        >
          <span className="uppercase tracking-widest text-xs font-bold animate-pulse">
            ↓ Scroll to Unbox Card ↓
          </span>
          <div className="w-6 h-9 rounded-full border-2 border-orange-500/50 flex items-start justify-center p-1">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-orange-500"
            />
          </div>
        </motion.div>

        {/* 3D Perspective Stage Container */}
        <div 
          className="relative w-full max-w-2xl h-[460px] flex items-center justify-center perspective-1200 preserve-3d"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* ============================================================== */}
          {/* FLOATING PERIPHERAL FEATURE BADGES (Lock into place on zoom)   */}
          {/* ============================================================== */}
          <motion.div
            style={{ opacity: badgesOpacity, y: badgesTranslateY }}
            className="hidden lg:block absolute -left-16 top-8 z-30 pointer-events-none"
          >
            <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3.5 border border-orange-500/35 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-500 flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-neutral-900 dark:text-white">Instant Tap & Pay</span>
                <span className="block text-xs text-neutral-500">50ms Contactless NFC</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: badgesOpacity, y: badgesTranslateY }}
            className="hidden lg:block absolute -right-16 top-8 z-30 pointer-events-none"
          >
            <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3.5 border border-emerald-500/35 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-neutral-900 dark:text-white">Zero FX Markup</span>
                <span className="block text-xs text-neutral-500">180+ Global Currencies</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: badgesOpacity, y: badgesTranslateY }}
            className="hidden lg:block absolute -left-16 bottom-10 z-30 pointer-events-none"
          >
            <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3.5 border border-white/25 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-black/10 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-neutral-900 dark:text-white">Biometric Vault</span>
                <span className="block text-xs text-neutral-500">Daily limit: {formatMoney(dailyLimit)}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            style={{ opacity: badgesOpacity, y: badgesTranslateY }}
            className="hidden lg:block absolute -right-16 bottom-10 z-30 pointer-events-none"
          >
            <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3.5 border border-amber-500/35 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-neutral-900 dark:text-white">Solid Hybrid Finish</span>
                <span className="block text-xs text-neutral-500">Laser-cut Brushed Core</span>
              </div>
            </div>
          </motion.div>

          {/* ============================================================== */}
          {/* 1. THE SLEEVE BACK CASING (z-index: 10)                        */}
          {/* ============================================================== */}
          <motion.div
            style={{
              y: sleeveY,
              scale: sleeveScale,
              opacity: sleeveOpacity,
              filter: sleeveBlur,
            }}
            className="absolute w-[380px] sm:w-[440px] h-[265px] sm:h-[285px] rounded-[30px] bg-gradient-to-br from-[#242220] via-[#141312] to-[#0A0A09] border border-white/15 shadow-[0_35px_90px_rgba(0,0,0,0.95)] z-10 pointer-events-none flex flex-col justify-between p-6 overflow-hidden"
          >
            {/* Top Magnetic Lid / Flap that folds back */}
            <motion.div
              style={{ rotateX: flapRotateX }}
              className="absolute -top-8 left-6 right-6 h-11 bg-neutral-900 border-t border-x border-orange-500/40 rounded-t-2xl origin-bottom shadow-2xl flex items-center justify-center text-xs font-mono text-orange-400 uppercase tracking-widest font-bold"
            >
              VELOX LUXURY SLEEVE // PULL TO OPEN
            </motion.div>

            {/* Sleeve Header Monogram */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-xs">
                  V
                </div>
                <span className="text-xs uppercase tracking-widest text-neutral-200 font-bold">
                  VELOX // EXECUTIVE EDITION
                </span>
              </div>
              <span className="text-[10px] font-mono text-orange-400 px-2.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 font-bold">
                LTD 2026
              </span>
            </div>

            {/* Center Foil Stamp */}
            <div className="flex flex-col items-center justify-center relative z-10 opacity-30">
              <CreditCard className="w-14 h-14 text-orange-400" />
              <span className="text-[10px] font-mono tracking-widest text-neutral-400 mt-1 font-bold">EMV CONTACTLESS COMPLIANT</span>
            </div>

            {/* Sleeve Footer Metadata */}
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-t border-white/5 pt-2 relative z-10">
              <span>CARDHOLDER: {userName.toUpperCase()}</span>
              <span>4810 •••• •••• 2049</span>
            </div>
          </motion.div>


          {/* ============================================================== */}
          {/* 2. THE PHYSICAL VELOX DEBIT CARD (z-index: 20)                 */}
          {/* ============================================================== */}
          <motion.div
            style={{
              y: cardTranslateY,
              scale: cardScale,
              rotateX: cardRotateX,
              rotateY: cardRotateY,
              rotateZ: cardRotateZ,
            }}
            animate={{
              rotateX: mouseTilt.x,
              rotateY: mouseTilt.y + (isFlipped ? 180 : 0),
            }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 20,
            }}
            className="relative w-[350px] sm:w-[410px] h-[225px] sm:h-[255px] cursor-grab active:cursor-grabbing preserve-3d z-20 select-none"
          >
            {/* Frozen Card Frosted Ice Glass Overlay */}
            {isCardFrozen && (
              <div className="absolute inset-0 rounded-[24px] bg-cyan-400/25 backdrop-blur-[5px] border-2 border-cyan-300/80 z-50 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.5)] pointer-events-none">
                <div className="px-5 py-2.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-2xl">
                  <Lock className="w-4 h-4" />
                  Card Temporarily Frozen
                </div>
              </div>
            )}

            {/* ---------------- CARD FRONT ---------------- */}
            <div
              className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${skinStyles[cardSkin]} border p-6 sm:p-7 flex flex-col justify-between backface-hidden overflow-hidden`}
            >
              {/* Dynamic light reflection sweep */}
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none"
                style={{
                  transform: `translateX(${mouseTilt.y * 8}px) translateY(${mouseTilt.x * 6}px)`,
                }}
              />

              {/* Card Header: Brand Monogram + Debit Pill */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 44 44" fill="none">
                      <circle cx="22" cy="22" r="21" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M12 14L22 32L32 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      <circle cx="22" cy="22" r="3" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="font-black tracking-tight text-white text-lg sm:text-xl">Velox</span>
                </div>
                <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-black/35 border border-white/20 text-white font-bold">
                  DEBIT
                </span>
              </div>

              {/* Chip & Contactless Wave */}
              <div className="flex items-center gap-4 relative z-10">
                <Wifi className="w-6 h-6 text-white/90 rotate-90" />
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200 shadow-md flex flex-col justify-around p-1">
                  <div className="h-[1px] bg-amber-800/40 w-full" />
                  <div className="h-[1px] bg-amber-800/40 w-full" />
                  <div className="h-[1px] bg-amber-800/40 w-full" />
                </div>
              </div>

              {/* Card Number */}
              <div className="font-mono text-lg sm:text-2xl tracking-[0.22em] text-white/95 font-black drop-shadow-md relative z-10">
                {showCardNumbers ? "4810  5920  8391  2049" : "••••  ••••  ••••  2049"}
              </div>

              {/* Cardholder, Expiration & Network Circles */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono relative z-10 pt-1">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-white/70 font-semibold">Cardholder</span>
                  <span className="text-white font-black tracking-wider text-xs sm:text-sm">{userName.toUpperCase()}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-white/70 font-semibold">Expires</span>
                  <span className="text-white font-black tracking-wider text-xs sm:text-sm">09/29</span>
                </div>
                
                {/* Mastercard Overlapping Circles */}
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-500/90 shadow-sm" />
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400/90 shadow-sm mix-blend-screen" />
                </div>
              </div>
            </div>

            {/* ---------------- CARD BACK ---------------- */}
            <div
              className={`absolute inset-0 rounded-[24px] bg-gradient-to-br ${skinStyles[cardSkin]} border p-6 sm:p-7 flex flex-col justify-between rotate-y-180 backface-hidden overflow-hidden`}
            >
              {/* Magnetic Strip */}
              <div className="absolute top-7 left-0 right-0 h-11 bg-neutral-950 shadow-inner" />

              <div className="mt-14 relative z-10">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 flex-1 bg-neutral-200 rounded text-neutral-800 font-serif italic text-sm flex items-center px-4 tracking-wider font-bold">
                    {userName}
                  </div>
                  <div className="h-9 w-16 bg-white rounded flex items-center justify-center font-mono text-neutral-950 font-black text-sm tracking-widest shadow-inner">
                    {showCardNumbers ? "739" : "•••"}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-white/80 font-mono leading-tight relative z-10">
                Authorized signature not required. Issued under license by Mastercard International.
                Velox 24/7 Global Concierge: +1 (455) 294-56-18
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-white/90 border-t border-white/10 pt-2 relative z-10 font-bold">
                <span>CVV: 739</span>
                <span>CIRRUS / NYCE SYSTEM</span>
              </div>
            </div>
          </motion.div>


          {/* ============================================================== */}
          {/* 3. FRONT POCKET CUT-OUT OF THE SLEEVE (z-index: 25)            */}
          {/* ============================================================== */}
          <motion.div
            style={{
              y: sleeveY,
              scale: sleeveScale,
              opacity: sleeveOpacity,
              filter: sleeveBlur,
            }}
            className="absolute bottom-6 w-[380px] sm:w-[440px] h-[155px] sm:h-[175px] rounded-b-[30px] bg-gradient-to-t from-[#100F0E] via-[#161514] to-[#1F1E1D] border-b border-x border-white/15 shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),0_-4px_16px_rgba(0,0,0,0.6)] z-25 pointer-events-none flex flex-col justify-end p-6"
          >
            {/* Notched center lip where card exits */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-4.5 bg-[#161514] rounded-b-xl border-b border-white/15" />

            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-orange-400" /> VELOX SECURED POCKET
              </span>
              <span>SLEEVE NO. 01</span>
            </div>
          </motion.div>

        </div>


        {/* ============================================================== */}
        {/* INTERACTIVE PLAYGROUND HUD CONTROLS (Enlarged, prominent)     */}
        {/* ============================================================== */}
        <motion.div 
          style={{ opacity: controlsOpacity }}
          className="mt-8 z-30 flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-2xl mx-auto px-4"
        >
          {/* Flip Card Button */}
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold bg-white/80 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-white/10 hover:border-orange-500/50 backdrop-blur-md transition-all shadow-md"
          >
            <RotateCw className="w-4 h-4 text-orange-500" />
            <span>{isFlipped ? "Show Front" : "Flip to Back"}</span>
          </button>

          {/* Show / Hide Numbers */}
          <button
            onClick={() => setShowCardNumbers(!showCardNumbers)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold bg-white/80 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-white/10 hover:border-orange-500/50 backdrop-blur-md transition-all shadow-md"
          >
            {showCardNumbers ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4 text-orange-500" />}
            <span>{showCardNumbers ? "Hide Digits" : "Reveal Digits"}</span>
          </button>

          {/* Copy Card Details */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold bg-white/80 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-white/10 hover:border-orange-500/50 backdrop-blur-md transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-orange-500" />}
            <span>{copied ? "Copied!" : "Copy Number"}</span>
          </button>

          {/* Freeze / Unfreeze (Shared state with dashboard!) */}
          <button
            onClick={toggleCardFrozen}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold border backdrop-blur-md transition-all shadow-md ${
              isCardFrozen 
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-600 dark:text-cyan-300"
                : "bg-white/80 dark:bg-neutral-900/90 hover:bg-white dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-white/10 hover:border-cyan-500/50"
            }`}
          >
            {isCardFrozen ? <Unlock className="w-4 h-4 text-cyan-500" /> : <Lock className="w-4 h-4 text-neutral-500" />}
            <span>{isCardFrozen ? "Unfreeze" : "Freeze Card"}</span>
          </button>

          {/* Skin Switcher */}
          <div className="flex items-center gap-2 bg-white/80 dark:bg-neutral-900/90 border border-neutral-300 dark:border-white/10 rounded-full p-1.5 shadow-md">
            <button
              onClick={() => setCardSkin("orange")}
              className={`w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 border-2 ${
                cardSkin === "orange" ? "border-white ring-2 ring-orange-500" : "border-transparent"
              }`}
              title="Velvet Orange"
            />
            <button
              onClick={() => setCardSkin("obsidian")}
              className={`w-6 h-6 rounded-full bg-neutral-900 border-2 ${
                cardSkin === "obsidian" ? "border-white ring-2 ring-neutral-400" : "border-neutral-700"
              }`}
              title="Obsidian Stealth"
            />
            <button
              onClick={() => setCardSkin("chrome")}
              className={`w-6 h-6 rounded-full bg-gradient-to-br from-neutral-300 to-neutral-600 border-2 ${
                cardSkin === "chrome" ? "border-white ring-2 ring-neutral-400" : "border-transparent"
              }`}
              title="Titanium Frost"
            />
          </div>

          {/* Add to Apple / Google Wallet */}
          <button
            onClick={handleAddToWallet}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-black bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-xl transition-all"
          >
            <Smartphone className="w-4 h-4" />
            <span>Add to Apple Wallet</span>
          </button>
        </motion.div>

      </div>
    </div>
  );
}
