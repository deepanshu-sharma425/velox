"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { X, CheckCircle2, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { useBank } from "@/lib/bankStore";

interface LoanApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
  initialDuration?: number;
  loanPurpose?: string;
  onSuccessOpenDashboard?: () => void;
}

export default function LoanApplyModal({
  isOpen,
  onClose,
  initialAmount = 15000,
  initialDuration = 18,
  loanPurpose = "Personal Credit Plan",
  onSuccessOpenDashboard,
}: LoanApplyModalProps) {
  const [step, setStep] = useState<"details" | "processing" | "approved">("details");
  const { userName, formatMoney, applyNewLoan } = useBank();
  const [fullName, setFullName] = useState(userName);
  const [email, setEmail] = useState("alex.morgan@velox.com");
  const [income, setIncome] = useState("95,000");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("processing");

    setTimeout(() => {
      // DYNAMIC ACTION: Add loan to live store!
      applyNewLoan(loanPurpose, initialAmount, initialDuration, 5.8);

      setStep("approved");
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.4 },
        colors: ["#FF7A00", "#FFA033", "#22C55E", "#FFFFFF"],
      });
    }, 2400);
  };

  const handleReset = () => {
    setStep("details");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl rounded-3xl glass-card-elevated p-8 sm:p-10 border border-neutral-200 dark:border-white/15 shadow-2xl relative overflow-hidden bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-white"
      >
        <button
          onClick={handleReset}
          className="absolute top-6 right-6 p-2 rounded-full text-neutral-500 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "details" && (
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-black uppercase tracking-wider mb-3">
              <Zap className="w-4 h-4" />
              Instant Pre-Qualification
            </div>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">Apply for Velox Credit</h3>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-1 mb-8 font-medium">
              Complete your verification in under 60 seconds with zero credit score impact.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="text-xs text-neutral-500 font-mono block font-bold">REQUESTED CREDIT</span>
                  <span className="text-2xl sm:text-3xl font-black font-mono text-neutral-900 dark:text-white">
                    {formatMoney(initialAmount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-500 font-mono block font-bold">TERM</span>
                  <span className="text-2xl sm:text-3xl font-black text-orange-500 font-mono">{initialDuration} Months</span>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-sm sm:text-base font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-sm sm:text-base font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">Annual Net Income</label>
                <input
                  type="text"
                  required
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white text-sm sm:text-base font-bold focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full orange-glow-btn py-4.5 rounded-full text-base sm:text-lg font-black text-white flex items-center justify-center gap-2.5 shadow-2xl tracking-wide"
                >
                  <span>Submit for Instant AI Review</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="text-xs text-center text-neutral-500 mt-3 font-mono font-bold">
                  🔒 256-Bit SSL Encrypted • FDIC-insured banking partner
                </div>
              </div>
            </form>
          </div>
        )}

        {step === "processing" && (
          <div className="py-14 text-center space-y-7">
            <div className="relative w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-orange-500">
                <Zap className="w-10 h-10 animate-pulse" />
              </div>
            </div>

            <div>
              <h4 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">Algorithmic Scoring In Progress...</h4>
              <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-2 max-w-md mx-auto">
                Validating banking credentials, anti-fraud telemetry, and calculating personalized interest terms.
              </p>
            </div>

            <div className="w-56 mx-auto bg-neutral-200 dark:bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "10%" }}
                animate={{ width: "95%" }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
                className="bg-orange-500 h-full rounded-full"
              />
            </div>
          </div>
        )}

        {step === "approved" && (
          <div className="py-8 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-500 mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]">
              <CheckCircle2 className="w-11 h-11" />
            </div>

            <div>
              <span className="text-xs sm:text-sm font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-black">
                APPLICATION APPROVED
              </span>
              <h4 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white mt-1">
                {formatMoney(initialAmount)} Credit Disbursed!
              </h4>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2">
                Your funds have been provisioned to your Velox Velvet Debit Card account.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-sm text-left space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Recipient:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Fixed APR:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">5.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">First Installment:</span>
                <span className="text-orange-500 font-black">October 15, 2026</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  handleReset();
                  if (onSuccessOpenDashboard) onSuccessOpenDashboard();
                }}
                className="flex-1 orange-glow-btn py-4 rounded-full text-sm sm:text-base font-black text-white shadow-xl"
              >
                Go to Alex's Dashboard
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-4 rounded-full bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-300"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
