"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Award, ChevronDown, CheckCircle } from "lucide-react";
import { useBank } from "@/lib/bankStore";

export default function StatsFeatures() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const { currencySymbol } = useBank();

  const stats = [
    { value: "30K+", label: "Active Borrowers", detail: "Across Europe & North America" },
    { value: `${currencySymbol}180M+`, label: "Capital Disbursed", detail: "Directly into debit accounts" },
    { value: "99.4%", label: "Approval Reliability", detail: "Instant algorithmic scoring" },
    { value: "4.9 / 5", label: "App Store Rating", detail: "Over 12,000 verified reviews" },
  ];

  const features = [
    {
      icon: Shield,
      title: "Fully Certified & Insured",
      desc: "Operating strictly under official banking licenses with tier-1 partner banks and 256-bit AES encryption.",
    },
    {
      icon: Zap,
      title: "180-Second Algorithmic Scoring",
      desc: "No tedious paperwork, queueing in physical branches, or waiting days for credit committees.",
    },
    {
      icon: Award,
      title: "Zero Prepayment Penalties",
      desc: "Pay back early whenever you have extra funds and immediately reduce your interest burden.",
    },
  ];

  const faqs = [
    {
      q: "How fast do funds arrive after approval?",
      a: "Once approved (which takes approximately 180 seconds via our automated engine), your funds are instantly available on your virtual Velox debit card. If you order the physical Velvet card, express delivery takes 2 business days.",
    },
    {
      q: "Does calculating my loan impact my credit score?",
      a: "No! Using the loan calculator or generating your initial pre-qualified offer is completely penalty-free and only performs a soft credit inquiry, leaving your credit score untouched.",
    },
    {
      q: "Can I pay off my loan early without penalties?",
      a: "Absolutely. At Velox, early repayment is 100% free with zero hidden fees. You only pay interest for the days the loan was active, saving you money.",
    },
    {
      q: "How does the Velvet Orange Debit Card work?",
      a: "Your Velox card is a full-featured Mastercard debit card connected directly to your credit line and checking wallet. It supports contactless Apple/Google Pay, zero FX international purchases, and real-time app freezing.",
    },
  ];

  return (
    <div id="about" className="py-32 px-4 sm:px-6 relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-32">
        
        {/* ============================================================== */}
        {/* STATS TICKER ROW (Big, bold, prominent)                       */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, idx) => (
            <div key={idx} className="glass-card p-8 sm:p-10 rounded-3xl text-center">
              <div className="text-4xl sm:text-6xl font-black text-neutral-900 dark:text-white font-glow font-mono">
                {s.value}
              </div>
              <div className="text-base sm:text-lg font-bold text-orange-600 dark:text-orange-400 mt-2.5">
                {s.label}
              </div>
              <div className="text-xs sm:text-sm text-neutral-500 mt-1 font-medium">
                {s.detail}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================== */}
        {/* 3 FROSTED FEATURE CARDS                                        */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="glass-card glass-card-hover p-9 sm:p-10 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-500 flex items-center justify-center mb-7">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mb-3">{f.title}</h3>
                  <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                    {f.desc}
                  </p>
                </div>
                <div className="pt-7 mt-7 border-t border-neutral-200 dark:border-white/5 flex items-center gap-2 text-sm font-bold text-orange-600 dark:text-orange-400">
                  <span>Velox Certified Standard</span>
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* FAQ ACCORDION                                                  */}
        {/* ============================================================== */}
        <div id="education" className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-orange-600 dark:text-orange-400 font-extrabold">Support & Transparency</span>
            <h2 className="text-4xl sm:text-6xl font-black text-neutral-900 dark:text-white mt-1 leading-tight">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className="glass-card rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-6 sm:p-7 text-left flex items-center justify-between text-lg sm:text-xl font-bold text-neutral-900 dark:text-white gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-orange-500 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p className="px-6 sm:px-7 pb-6 sm:pb-7 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed border-t border-neutral-200 dark:border-white/5 pt-4">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
