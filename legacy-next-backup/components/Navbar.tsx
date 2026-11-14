"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Menu, 
  X, 
  LayoutDashboard, 
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  Wallet
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useBank, Currency } from "@/lib/bankStore";

interface NavbarProps {
  onOpenDashboard?: () => void;
  onOpenApplyModal?: () => void;
  isDashboardActive?: boolean;
}

const navLinks = [
  { name: "Home", href: "#hero" },
  { name: "About us", href: "#about" },
  { name: "Calculator", href: "#calculator" },
  { name: "Services", href: "#plans" },
  { name: "Card Showcase", href: "#card-unboxing" },
  { name: "FAQ", href: "#education" },
];

export default function Navbar({
  onOpenDashboard,
  onOpenApplyModal,
  isDashboardActive = false,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, formatMoney, availableBalance } = useBank();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 25);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currencies: { code: Currency; label: string; flag: string }[] = [
    { code: "USD", label: "USD ($)", flag: "🇺🇸" },
    { code: "EUR", label: "EUR (€)", flag: "🇪🇺" },
    { code: "GBP", label: "GBP (£)", flag: "🇬🇧" },
    { code: "ESP", label: "EUR/ES (€)", flag: "🇪🇸" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 sm:px-8 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo with Orange Monogram */}
        <Link 
          href="/" 
          className="group flex items-center gap-4 focus:outline-none"
        >
          <div className="relative w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black border border-orange-500/35 group-hover:border-orange-500/80 transition-all duration-300 shadow-[0_0_20px_rgba(255,122,0,0.3)]">
            <svg className="w-7 h-7 text-orange-500" viewBox="0 0 44 44" fill="none">
              <circle cx="22" cy="22" r="21" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1.2" />
              <path d="M12 14L22 32L32 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 10V22L29 26" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round"/>
              <circle cx="22" cy="22" r="2.8" fill="#FFFFFF" />
            </svg>
            <div className="absolute inset-0 rounded-full bg-orange-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
              Velox
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            </span>
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold -mt-0.5">
              Neobank
            </span>
          </div>
        </Link>

        {/* Floating Glass Pill Navigation Bar */}
        <nav className={`hidden lg:flex items-center gap-1.5 p-2 rounded-full transition-all duration-300 ${
          scrolled ? "glass-nav-scrolled" : "glass-nav"
        }`}>
          {navLinks.map((link) => {
            const isActive = activeTab === link.name;
            return (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveTab(link.name)}
                className={`relative px-4.5 py-2.5 text-xs sm:text-sm uppercase tracking-wider font-bold transition-all duration-200 rounded-full z-10 ${
                  isActive 
                    ? "text-neutral-900 dark:text-white" 
                    : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-orange-500/15 dark:bg-gradient-to-r dark:from-orange-500/25 dark:to-orange-600/35 border border-orange-500/40 rounded-full shadow-[0_0_15px_rgba(255,122,0,0.25)] -z-10"
                  />
                )}
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Dynamic Currency Switcher Dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white bg-black/5 dark:bg-neutral-900/70 hover:bg-black/10 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-white/10 transition-all duration-200 backdrop-blur-md shadow-sm"
              title="Change Global Currency"
            >
              <span>{currencies.find(c => c.code === currency)?.flag}</span>
              <span>{currency}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className="absolute right-0 mt-2 w-48 rounded-2xl glass-card-elevated p-2 shadow-2xl z-50 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-white/15"
                >
                  <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-3 py-1 font-bold">
                    Select Active Currency
                  </div>
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-between transition-colors ${
                        currency === c.code 
                          ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 font-extrabold" 
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.label}</span>
                      </span>
                      {currency === c.code && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Switcher Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full text-neutral-700 dark:text-neutral-200 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 border border-neutral-300 dark:border-white/10 backdrop-blur-md transition-all duration-200 shadow-sm"
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? (
              <Sun className="w-4.5 h-4.5 text-amber-400" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-neutral-700" />
            )}
          </button>

          {/* Dedicated Dashboard Button with Live Dynamic Balance */}
          {onOpenDashboard ? (
            <button
              onClick={onOpenDashboard}
              className={`flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 border ${
                isDashboardActive
                  ? "bg-orange-500 text-white border-orange-400 shadow-[0_0_20px_rgba(255,122,0,0.5)]"
                  : "bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.14] text-neutral-900 dark:text-white border-neutral-300 dark:border-white/15 hover:border-orange-500/50 backdrop-blur-lg"
              }`}
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 dark:text-orange-400">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="hidden sm:inline">Alex's</span> Dashboard
              <span className="hidden md:inline font-mono text-[11px] px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-500/20">
                {formatMoney(availableBalance)}
              </span>
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all duration-300 border bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.14] text-neutral-900 dark:text-white border-neutral-300 dark:border-white/15 hover:border-orange-500/50 backdrop-blur-lg"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-orange-500" />
              <span>Dashboard</span>
            </Link>
          )}

          {/* Apply Now Primary CTA */}
          <button
            onClick={onOpenApplyModal}
            className="orange-glow-btn flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full text-xs sm:text-sm font-black text-white tracking-wide shadow-md"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-full bg-black/5 dark:bg-neutral-900/80 border border-neutral-300 dark:border-white/10 text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Glass Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden mt-3 rounded-2xl glass-card-elevated p-6 flex flex-col gap-4 shadow-2xl overflow-hidden bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-white/15"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Currency</span>
              <div className="flex gap-2">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      currency === c.code ? "bg-orange-500 text-white" : "bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-base font-bold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  {link.name}
                  <span className="text-orange-500 text-sm">→</span>
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-white/10 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenDashboard) onOpenDashboard();
                }}
                className="w-full py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-white/10 text-base font-bold text-neutral-800 dark:text-white flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-5 h-5 text-orange-500" />
                Customer Dashboard ({formatMoney(availableBalance)})
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenApplyModal) onOpenApplyModal();
                }}
                className="w-full py-3 rounded-xl orange-glow-btn text-base font-black text-white flex items-center justify-center gap-2"
              >
                Apply for Credit Plan
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
