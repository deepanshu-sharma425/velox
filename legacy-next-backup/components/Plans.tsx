"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useBank } from "@/lib/bankStore";

interface PlansProps {
  onSelectPlan?: (planName: string) => void;
}

export default function Plans({ onSelectPlan }: PlansProps) {
  const { formatMoney } = useBank();

  const plans = [
    {
      name: "Starter Credit",
      badge: "Fast Liquidity",
      description: "Ideal for urgent short-term cash flow, personal travel, or device upgrades.",
      minAmount: 1000,
      maxAmount: 5000,
      rate: "From 5.4% APR",
      tenure: "3 to 12 months",
      isPopular: false,
      features: [
        "180-second AI underwriting",
        "Virtual debit card issued immediately",
        "Zero early-payment penalty",
        "Monthly credit score updates",
        "Standard mobile app access",
      ],
      buttonText: "Choose Starter",
    },
    {
      name: "Standard Line",
      badge: "Most Popular",
      description: "Our hallmark digital loan for home improvements, refinancing, or growing expenses.",
      minAmount: 5000,
      maxAmount: 25000,
      rate: "From 6.2% APR",
      tenure: "6 to 24 months",
      isPopular: true,
      features: [
        "Physical Velvet Orange Debit Card",
        "Instant disbursal to external bank or card",
        "Flexible repayment rescheduling",
        "Automatic credit bureau score booster",
        "Zero foreign transaction (FX) markup",
        "24/7 Priority phone & chat support",
      ],
      buttonText: "Choose Standard",
    },
    {
      name: "Executive Elite",
      badge: "Exclusive Tier",
      description: "Comprehensive capital financing for high-net-worth individuals and business ventures.",
      minAmount: 25000,
      maxAmount: 50000,
      rate: "From 4.8% APR",
      tenure: "12 to 36 months",
      isPopular: false,
      features: [
        "Laser-engraved Titanium Physical Card",
        "Dedicated Velox Wealth Concierge",
        "Customized amortization schedule",
        "Complimentary airport lounge access",
        "Unlimited zero-fee global wire transfers",
        "Multi-currency wallets (EUR, USD, GBP)",
      ],
      buttonText: "Choose Elite",
    },
  ];

  return (
    <section id="plans" className="py-32 px-4 sm:px-6 relative z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 dark:text-orange-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            Tailored Credit Plans
          </div>
          <h2 className="text-5xl sm:text-7xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight">
            Plans structured for your lifestyle
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 mt-3">
            Clear rates, transparent schedules, and guaranteed zero hidden maintenance charges.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 relative ${
                plan.isPopular
                  ? "bg-gradient-to-b from-white via-orange-50/40 to-white dark:from-[#221F1C] dark:via-[#161413] dark:to-[#0A0A09] border-2 border-orange-500/80 shadow-[0_25px_60px_rgba(255,122,0,0.25)] md:-translate-y-4"
                  : "glass-card glass-card-hover"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-orange-600 dark:text-orange-400 font-extrabold">
                    {plan.badge}
                  </span>
                  <span className="text-xs sm:text-sm text-neutral-500 font-mono font-bold">{plan.tenure}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">{plan.name}</h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-2 mb-8 leading-relaxed">
                  {plan.description}
                </p>

                <div className="py-6 border-y border-neutral-200 dark:border-white/10 mb-8">
                  <div className="text-xs sm:text-sm text-neutral-500 uppercase tracking-widest font-mono font-bold">Limit Capacity</div>
                  <div className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white font-mono mt-1">
                    {formatMoney(plan.minAmount)} – {formatMoney(plan.maxAmount)}
                  </div>
                  <div className="text-sm font-extrabold text-orange-600 dark:text-orange-400 mt-1.5">{plan.rate}</div>
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-10">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 font-medium">
                      <div className="w-5 h-5 rounded-full bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0 mt-0.5 font-black">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA */}
              <button
                onClick={() => onSelectPlan && onSelectPlan(plan.name)}
                className={`w-full py-4.5 rounded-full text-sm sm:text-base font-black tracking-wide transition-all flex items-center justify-center gap-2.5 ${
                  plan.isPopular
                    ? "orange-glow-btn text-white shadow-xl"
                    : "bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 hover:border-orange-500/40"
                }`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
