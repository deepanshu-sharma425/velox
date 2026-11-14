"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Mail, Phone, CheckCircle2 } from "lucide-react";
import { useBank } from "@/lib/bankStore";

interface FooterProps {
  onOpenDashboard?: () => void;
}

export default function Footer({ onOpenDashboard }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { userName } = useBank();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 3500);
    }
  };

  const scrollToTop = () => {
    if ((window as any).__lenis) {
      (window as any).__lenis.scrollTo(0);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer id="footer" className="relative border-t border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#060606] pt-24 pb-20 px-4 sm:px-8 z-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14">
          
          {/* Brand & Newsletter (5 Cols) */}
          <div className="lg:col-span-5 space-y-7">
            <Link href="/" className="inline-flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 border border-orange-500/35 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-orange-500" viewBox="0 0 44 44" fill="none">
                  <circle cx="22" cy="22" r="21" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.2" />
                  <path d="M12 14L22 32L32 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 10V22L29 26" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">Velox</span>
            </Link>

            <div className="max-w-md">
              <h4 className="text-xl font-black text-neutral-900 dark:text-white">Get drop alerts</h4>
              <p className="text-base text-neutral-600 dark:text-neutral-400 mt-2 mb-6 leading-relaxed">
                Receive monthly updates on newly released credit limits, exclusive interest rate cuts, and titanium card perks.
              </p>

              {subscribed ? (
                <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>You are registered for monthly rate drops!</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-3.5 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-sm sm:text-base text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 shadow-sm"
                  />
                  <button
                    type="submit"
                    className="orange-glow-btn px-6 py-3.5 rounded-full text-sm sm:text-base font-black text-white tracking-wide shrink-0 shadow-md"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>

            <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-md font-medium">
              © 2026 Velox Financial Technologies, Inc. All rights reserved. Loans are subject to approval. Services may not be available in all jurisdictions.
            </p>
          </div>

          {/* Nav Links Grid (7 Cols) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm sm:text-base">
            <div>
              <h5 className="font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-5 text-xs sm:text-sm font-mono">Account</h5>
              <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 font-semibold">
                <li>
                  {onOpenDashboard ? (
                    <button onClick={onOpenDashboard} className="hover:text-black dark:hover:text-white transition-colors text-orange-600 dark:text-orange-400 font-bold">
                      {userName}'s Dashboard
                    </button>
                  ) : (
                    <Link href="/dashboard" className="hover:text-black dark:hover:text-white transition-colors text-orange-600 dark:text-orange-400 font-bold">
                      {userName}'s Dashboard
                    </Link>
                  )}
                </li>
                <li><a href="#about" className="hover:text-black dark:hover:text-white transition-colors">Contacts</a></li>
                <li><a href="#about" className="hover:text-black dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="#card-unboxing" className="hover:text-black dark:hover:text-white transition-colors">Physical Card</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-5 text-xs sm:text-sm font-mono">Services</h5>
              <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 font-semibold">
                <li><a href="#plans" className="hover:text-black dark:hover:text-white transition-colors">Credit products</a></li>
                <li><a href="#calculator" className="hover:text-black dark:hover:text-white transition-colors">Loan calculator</a></li>
                <li><a href="#plans" className="hover:text-black dark:hover:text-white transition-colors">Prolongation</a></li>
                <li><a href="#plans" className="hover:text-black dark:hover:text-white transition-colors">Early repayment</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-5 text-xs sm:text-sm font-mono">Support</h5>
              <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 font-semibold">
                <li><a href="#education" className="hover:text-black dark:hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#about" className="hover:text-black dark:hover:text-white transition-colors">Licenses</a></li>
                <li><a href="#education" className="hover:text-black dark:hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#education" className="hover:text-black dark:hover:text-white transition-colors">All documents</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-black text-neutral-900 dark:text-white uppercase tracking-wider mb-5 text-xs sm:text-sm font-mono">Events</h5>
              <ul className="space-y-3 text-neutral-600 dark:text-neutral-400 font-semibold">
                <li><a href="#plans" className="hover:text-black dark:hover:text-white transition-colors">Referral programs</a></li>
                <li><a href="#about" className="hover:text-black dark:hover:text-white transition-colors">Universaries</a></li>
                <li><a href="#plans" className="hover:text-black dark:hover:text-white transition-colors">Raffles</a></li>
                <li><a href="#calculator" className="hover:text-black dark:hover:text-white transition-colors">Promo codes</a></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Bottom Contacts & Legal Bar */}
        <div className="pt-10 border-t border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-5 text-sm text-neutral-500 font-medium">
          <div className="flex items-center gap-5">
            <a href="mailto:velox@gmail.com" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors">
              <Mail className="w-4 h-4 text-orange-500" />
              <span>velox@gmail.com</span>
            </a>
            <span>•</span>
            <a href="tel:+14552945618" className="flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors">
              <Phone className="w-4 h-4 text-orange-500" />
              <span>+1 (455) 294-56-18</span>
            </a>
          </div>

          <div className="flex items-center gap-5">
            <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-black dark:hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <button 
              onClick={scrollToTop}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors ml-2 shadow-sm font-bold"
            >
              <span>To the top</span>
              <ArrowUp className="w-4 h-4 text-orange-500" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
