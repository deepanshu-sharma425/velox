"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Zap, Sparkles, TrendingUp, Star } from "lucide-react";
import { useBank } from "@/lib/bankStore";

interface HeroProps {
  onOpenApplyModal?: () => void;
  onOpenDashboard?: () => void;
}

export default function Hero({ onOpenApplyModal, onOpenDashboard }: HeroProps) {
  const { formatMoney, availableBalance } = useBank();

  return (
    <section id="hero" className="relative min-h-[95vh] pt-40 pb-28 flex items-center justify-center overflow-hidden">
      {/* Ambient center spotlight strictly in hero */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[780px] h-[550px] bg-gradient-to-b from-orange-500/15 via-orange-600/5 to-transparent blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
        
        {/* Sub-badge pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-black/5 dark:bg-neutral-900/80 border border-neutral-300 dark:border-orange-500/30 text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200 mb-10 backdrop-blur-xl shadow-sm"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Over 30,000+ borrowers trust Velox across Europe & North America</span>
          <span className="text-orange-500 font-extrabold ml-1">★ 4.9/5</span>
        </motion.div>

        {/* Epic Display Headline - Massive, stylish, sober, and commanding */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="text-6xl sm:text-8xl md:text-9xl lg:text-[7.2rem] font-black tracking-tight text-neutral-900 dark:text-white leading-[1.01] mb-10"
        >
          <span>Choose your comfortable</span>
          <br />
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 bg-clip-text text-transparent font-glow">
            credit plan here.
          </span>
        </motion.h1>

        {/* Subtitle - Bold, generous, and clear */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.16 }}
          className="max-w-4xl mx-auto text-xl sm:text-2xl md:text-3xl text-neutral-600 dark:text-neutral-300 font-normal leading-relaxed mb-14"
        >
          Velox combines algorithmic instant lending with zero unexpected charges. 
          Get instant approval up to <strong className="text-neutral-900 dark:text-white font-black">{formatMoney(50000)}</strong> deposited straight to your velvet debit card in 3 minutes.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.24 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24"
        >
          <button
            onClick={onOpenApplyModal}
            className="w-full sm:w-auto orange-glow-btn flex items-center justify-center gap-3 px-10 py-5 rounded-full text-lg sm:text-xl font-black text-white tracking-wide shadow-2xl"
          >
            <span>Apply for credit</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <a
            href="#calculator"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-5 rounded-full text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white bg-black/5 dark:bg-neutral-900/60 hover:bg-black/10 dark:hover:bg-neutral-800/80 border border-neutral-300 dark:border-white/10 hover:border-orange-500/40 backdrop-blur-xl transition-all duration-300 shadow-sm"
          >
            <span>Loan calculator</span>
            <span className="text-orange-500 font-bold">↓</span>
          </a>

          <button
            onClick={onOpenDashboard}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-9 py-5 rounded-full text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white bg-white/80 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.1] border border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20 backdrop-blur-xl transition-all duration-300 shadow-sm"
          >
            <span>Alex's Dashboard</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-black">
              {formatMoney(availableBalance)}
            </span>
          </button>
        </motion.div>

        {/* Feature Highlights Grid - Full, generous, and substantial */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.32 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          <div className="glass-card glass-card-hover p-8 rounded-3xl flex items-center gap-5 text-left">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-500 shrink-0">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">Instant 180s Approval</h3>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">Automated AI underwriting with zero manual delays.</p>
            </div>
          </div>

          <div className="glass-card glass-card-hover p-8 rounded-3xl flex items-center gap-5 text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">Zero Hidden Charges</h3>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">100% transparent fixed APR with flexible terms.</p>
            </div>
          </div>

          <div className="glass-card glass-card-hover p-8 rounded-3xl flex items-center gap-5 text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">Credit Score Booster</h3>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">Automated bureau reporting to elevate your score.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
