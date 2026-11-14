"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useBank } from "@/lib/bankStore";

interface LoanCalculatorProps {
  onApplyWithDetails?: (amount: number, months: number, monthly: number, purpose: string) => void;
}

export default function LoanCalculator({ onApplyWithDetails }: LoanCalculatorProps) {
  const [amount, setAmount] = useState<number>(15000);
  const [duration, setDuration] = useState<number>(18);
  const [loanPurpose, setLoanPurpose] = useState<string>("Personal / Travel");
  const [frequency, setFrequency] = useState<"monthly" | "biweekly">("monthly");

  const { formatMoney, convertAmount } = useBank();

  // Dynamic calculations
  const calculations = useMemo(() => {
    const baseRate = 0.054 + (duration / 36) * 0.024;
    const monthlyRate = baseRate / 12;
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, duration)) / 
                           (Math.pow(1 + monthlyRate, duration) - 1);
    const totalRepayment = monthlyPayment * duration;
    const totalInterest = totalRepayment - amount;
    const installment = frequency === "biweekly" ? Math.round(monthlyPayment / 2) : Math.round(monthlyPayment);

    return {
      monthly: Math.round(monthlyPayment),
      installment,
      total: Math.round(totalRepayment),
      interest: Math.round(totalInterest),
      apr: (baseRate * 100).toFixed(1),
    };
  }, [amount, duration, frequency]);

  const quickAmounts = [5000, 10000, 20000, 35000, 50000];

  return (
    <section id="calculator" className="py-32 px-4 sm:px-6 relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
            <Calculator className="w-4 h-4" />
            Transparent Cost Estimator
          </div>
          <h2 className="text-5xl sm:text-7xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
            Calculate your comfortable loan
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mt-3">
            No surprise balloon payments or hidden administration fees. Clear fixed rates calculated dynamically in real-time.
          </p>
        </div>

        {/* Calculator Main Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Controls Column (7 Cols) */}
          <div className="lg:col-span-7 glass-card p-8 sm:p-12 rounded-3xl flex flex-col justify-between space-y-10">
            
            {/* Slider 1: Loan Amount */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm uppercase font-mono tracking-wider text-neutral-500 block font-bold">Credit Amount</span>
                  <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">How much do you need?</span>
                </div>
                <div className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white font-mono bg-black/5 dark:bg-white/[0.04] px-5 py-2 rounded-2xl border border-neutral-300 dark:border-white/10 shadow-sm">
                  {formatMoney(amount)}
                </div>
              </div>

              <input
                type="range"
                min="1000"
                max="50000"
                step="500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-500 font-mono font-bold">
                <span>{formatMoney(1000)}</span>
                <span>{formatMoney(25000)}</span>
                <span>{formatMoney(50000)}</span>
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => setAmount(q)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-mono font-bold transition-all ${
                      amount === q
                        ? "bg-orange-500 text-white shadow-md scale-105"
                        : "bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                  >
                    {formatMoney(q)}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider 2: Duration */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs sm:text-sm uppercase font-mono tracking-wider text-neutral-500 block font-bold">Repayment Period</span>
                  <span className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Choose loan duration</span>
                </div>
                <div className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white font-mono bg-black/5 dark:bg-white/[0.04] px-5 py-2 rounded-2xl border border-neutral-300 dark:border-white/10 shadow-sm">
                  {duration} <span className="text-base sm:text-lg font-normal text-neutral-500">months</span>
                </div>
              </div>

              <input
                type="range"
                min="3"
                max="36"
                step="1"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full"
              />

              <div className="flex items-center justify-between text-xs sm:text-sm text-neutral-500 font-mono font-bold">
                <span>3 Months</span>
                <span>18 Months</span>
                <span>36 Months</span>
              </div>
            </div>

            {/* Frequency Selector */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
              <div>
                <span className="text-sm font-bold text-neutral-900 dark:text-white block">Installment Frequency</span>
                <span className="text-xs text-neutral-500">Choose how often you prefer deductions</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFrequency("monthly")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    frequency === "monthly"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFrequency("biweekly")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    frequency === "biweekly"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-400"
                  }`}
                >
                  Bi-Weekly
                </button>
              </div>
            </div>

            {/* Loan Purpose Selector */}
            <div className="space-y-3">
              <label className="text-xs sm:text-sm uppercase font-mono tracking-wider text-neutral-500 block font-bold">Loan Purpose</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  "Personal / Travel",
                  "Business Expansion",
                  "Debt Refinancing",
                  "Home Renovation",
                  "Tech & Gadgets",
                  "Emergency Fund",
                ].map((purpose) => (
                  <button
                    key={purpose}
                    onClick={() => setLoanPurpose(purpose)}
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all text-left truncate ${
                      loanPurpose === purpose
                        ? "bg-orange-500/20 border border-orange-500/50 text-orange-600 dark:text-orange-300 shadow-sm"
                        : "bg-black/[0.03] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
                    }`}
                  >
                    {purpose}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Summary Column (5 Cols) */}
          <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-[#1C1A18] via-[#141312] to-[#0A0A09] border border-orange-500/35 p-8 sm:p-12 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white">
            
            {/* Ambient accent inside card */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/20 blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-neutral-400 font-bold">Dynamic Quote</span>
                <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Fixed APR: {calculations.apr}%
                </span>
              </div>

              {/* Big Monthly/Biweekly Payment highlight */}
              <div className="my-8">
                <span className="text-xs sm:text-sm text-neutral-400 uppercase tracking-widest font-mono font-bold">
                  {frequency === "biweekly" ? "Bi-Weekly Installment" : "Monthly Installment"}
                </span>
                <div className="text-5xl sm:text-7xl font-black text-white font-glow mt-1">
                  {formatMoney(calculations.installment)}
                  <span className="text-lg sm:text-xl font-normal text-neutral-400 ml-2">
                    / {frequency === "biweekly" ? "2 wks" : "mo"}
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4 text-sm sm:text-base pt-5 border-t border-white/10 font-medium">
                <div className="flex justify-between items-center text-neutral-300">
                  <span>Principal Amount:</span>
                  <span className="font-mono font-black text-white text-lg sm:text-xl">{formatMoney(amount)}</span>
                </div>

                <div className="flex justify-between items-center text-neutral-300">
                  <span>Total Calculated Interest:</span>
                  <span className="font-mono font-black text-orange-400 text-lg sm:text-xl">{formatMoney(calculations.interest)}</span>
                </div>

                <div className="flex justify-between items-center text-neutral-300">
                  <span>Administration & Card Fee:</span>
                  <span className="font-mono font-black text-emerald-400">{formatMoney(0)} (Free)</span>
                </div>

                <div className="flex justify-between items-center text-neutral-300 pt-4 border-t border-white/10">
                  <span className="font-black text-white text-base sm:text-lg">Total Repayment:</span>
                  <span className="font-mono font-black text-white text-xl sm:text-2xl">{formatMoney(calculations.total)}</span>
                </div>
              </div>

              {/* Perks list */}
              <div className="mt-8 space-y-2.5 text-xs sm:text-sm text-neutral-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Early repayment at any time with 0% prepayment penalty.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant disbursal into your Velox physical or virtual debit card.</span>
                </div>
              </div>
            </div>

            {/* Apply CTA */}
            <div className="mt-10">
              <button
                onClick={() => {
                  if (onApplyWithDetails) {
                    onApplyWithDetails(amount, duration, calculations.monthly, loanPurpose);
                  }
                }}
                className="w-full orange-glow-btn py-5 rounded-full text-base sm:text-lg font-black text-white flex items-center justify-center gap-2.5 shadow-2xl tracking-wide"
              >
                <span>Apply for {formatMoney(amount)} Plan</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <div className="text-xs text-center text-neutral-400 mt-3 font-mono font-bold">
                ⚡ Algorithmic decision in 180 seconds • Zero hard pull for quote
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
