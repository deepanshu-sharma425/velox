"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  Check, 
  CreditCard, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  Send, 
  Plus, 
  Search, 
  CheckCircle2, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Filter,
  DollarSign,
  Activity,
  UserCheck,
  Sun,
  Moon,
  Info
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useBank, LoanItem } from "@/lib/bankStore";

interface DashboardViewProps {
  onBackToHome?: () => void;
  isStandalonePage?: boolean;
}

export default function DashboardView({ 
  onBackToHome, 
  isStandalonePage = false 
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "loans" | "cards" | "transactions" | "credit">("overview");
  const [copiedId, setCopiedId] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionFilter, setTransactionFilter] = useState("all");

  const { theme, toggleTheme } = useTheme();
  const {
    userName,
    userId,
    tier,
    creditScore,
    availableBalance,
    totalDebt,
    monthlyDue,
    nextDueDate,
    loans,
    repayLoan,
    transactions,
    sendMoney,
    downloadStatement,
    formatMoney,
    currency,
    isCardFrozen,
    toggleCardFrozen,
    cardSkin,
    setCardSkin,
    dailyLimit,
    setDailyLimit,
    showCardNumbers,
    setShowCardNumbers,
    chartRange,
    setChartRange,
    chartData,
    selectedDay,
    setSelectedDay,
    calendarEvents,
  } = useBank();

  // Repayment Modal
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || "VLX-LN-99214");
  const [repayAmount, setRepayAmount] = useState<number>(monthlyDue);
  const [repayStatus, setRepayStatus] = useState<string | null>(null);

  // Send Money Modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState(250);
  const [sendNote, setSendNote] = useState("Project Reimbursement");
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  // Chart point hover tooltip
  const [hoveredPoint, setHoveredPoint] = useState<{ val: number; date: string } | null>(null);

  const handleCopyId = () => {
    navigator.clipboard.writeText(userId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleExecuteRepay = (e: React.FormEvent) => {
    e.preventDefault();
    const success = repayLoan(selectedLoanId, Number(repayAmount));
    if (success) {
      setRepayStatus("success");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#22C55E", "#FF7A00", "#FFFFFF"],
      });
      setTimeout(() => {
        setRepayStatus(null);
        setShowRepayModal(false);
      }, 2000);
    } else {
      setRepayStatus("insufficient");
    }
  };

  const handleExecuteSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendRecipient || sendAmount <= 0) return;
    const success = sendMoney(sendRecipient, Number(sendAmount), sendNote);
    if (success) {
      setSendStatus("success");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#FF7A00", "#FFFFFF", "#22C55E"],
      });
      setTimeout(() => {
        setSendStatus(null);
        setShowSendModal(false);
        setSendRecipient("");
      }, 2000);
    } else {
      setSendStatus("insufficient");
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    if (transactionFilter === "all") return matchesSearch;
    if (transactionFilter === "loans") return matchesSearch && t.category === "Loan";
    if (transactionFilter === "income") return matchesSearch && t.type === "income";
    if (transactionFilter === "expense") return matchesSearch && (t.type === "expense" || t.type === "transfer");
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] pt-28 pb-32 px-4 sm:px-8 lg:px-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* ============================================================== */}
        {/* TOP DASHBOARD BAR & WELCOME GREETING                           */}
        {/* ============================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-neutral-200 dark:border-white/10">
          
          <div className="flex items-center gap-5">
            {isStandalonePage ? (
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-neutral-900/80 hover:bg-black/10 dark:hover:bg-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-neutral-300 dark:border-white/10 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Landing Page</span>
              </Link>
            ) : (
              <button
                onClick={onBackToHome}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-neutral-900/80 hover:bg-black/10 dark:hover:bg-neutral-800 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white border border-neutral-300 dark:border-white/10 transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Website</span>
              </button>
            )}

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
                  Welcome back, {userName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-black">
                  <UserCheck className="w-4 h-4" />
                  {tier}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
                <span>Account ID: <strong className="text-neutral-900 dark:text-neutral-200 font-mono">{userId}</strong></span>
                <button 
                  onClick={handleCopyId}
                  className="text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 font-mono font-bold"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId ? "Copied" : "Copy"}</span>
                </button>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Reactive Ledger
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-3 rounded-full bg-black/5 dark:bg-neutral-900/80 hover:bg-black/10 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-200 shadow-sm transition-all"
              title="Toggle Light / Dark Mode"
            >
              {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-700" />}
            </button>

            {/* Quick Send Money CTA */}
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-black/5 dark:bg-neutral-900/80 hover:bg-black/10 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-white/10 text-sm font-bold text-neutral-800 dark:text-neutral-200 transition-all shadow-sm"
            >
              <Send className="w-4 h-4 text-orange-500" />
              <span>Send Money</span>
            </button>

            {/* Download Real Statement Document */}
            <button
              onClick={downloadStatement}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white dark:bg-neutral-900/80 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-white/10 text-sm font-bold text-neutral-800 dark:text-neutral-200 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-orange-500" />
              <span>Export Statement</span>
            </button>

            {/* Make Loan Repayment Modal */}
            <button
              onClick={() => setShowRepayModal(true)}
              className="orange-glow-btn flex items-center gap-2 px-6 py-3 rounded-full text-sm font-black text-white shadow-xl"
            >
              <DollarSign className="w-4 h-4" />
              <span>Make Loan Payment</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DASHBOARD TABS NAVIGATION (Prominent, large)                   */}
        {/* ============================================================== */}
        <div className="flex items-center gap-3 my-8 overflow-x-auto pb-2 border-b border-neutral-200 dark:border-white/5 scrollbar-none">
          {[
            { id: "overview", label: "Overview & Analytics" },
            { id: "loans", label: `My Loans (${loans.filter(l => l.status === "Active").length} Active)` },
            { id: "cards", label: "Card Controls" },
            { id: "transactions", label: `Ledger (${transactions.length} Records)` },
            { id: "credit", label: `Credit Score (${creditScore})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-extrabold whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-[0_0_20px_rgba(255,122,0,0.4)]"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & ANALYTICS                                    */}
        {/* ============================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-10">
            
            {/* Top 4 Key Metric Cards - Full, commanding size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Available Line Card */}
              <div className="glass-card p-7 sm:p-8 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-bold mb-3">
                  <span>Available Credit Line</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-black">
                    +14.2% MoM
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight font-mono">
                  {formatMoney(availableBalance)}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex items-center justify-between font-bold">
                  <span>Total Limit: {formatMoney(50000)}</span>
                  <span className="text-orange-500 font-black">
                    {Math.min(100, Math.round((availableBalance / 50000) * 100))}% Available
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-white/10 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.round((availableBalance / 50000) * 100))}%` }} 
                  />
                </div>
              </div>

              {/* Credit Score Card */}
              <div className="glass-card p-7 sm:p-8 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-bold mb-3">
                  <span>Monthly Credit Score</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-black flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> ▲ 12 pts
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-orange-500 tracking-tight font-glow font-mono">
                  {creditScore} <span className="text-lg font-normal text-neutral-400">/ 850</span>
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex items-center justify-between font-bold">
                  <span>Tier: Prime Plus</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Excellent</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-white/10 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(creditScore / 850) * 100}%` }} 
                  />
                </div>
              </div>

              {/* Total Active Debt */}
              <div className="glass-card p-7 sm:p-8 rounded-3xl relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-bold mb-3">
                  <span>Total Active Debt</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold">
                    ▼ 3.4% down
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight font-mono">
                  {formatMoney(totalDebt)}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex items-center justify-between font-bold">
                  <span>Active Obligations</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{loans.filter(l => l.status === "Active").length} Loans</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-white/10 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-neutral-400 h-full rounded-full" style={{ width: "48%" }} />
                </div>
              </div>

              {/* Upcoming Payment */}
              <div className="glass-card p-7 sm:p-8 rounded-3xl relative overflow-hidden border-orange-500/35">
                <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-bold mb-3">
                  <span>Monthly Payment</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-mono text-xs font-black flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Due Soon
                  </span>
                </div>
                <div className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight font-mono">
                  {formatMoney(monthlyDue)}
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-4 flex items-center justify-between font-bold">
                  <span>Autodeduct: Active</span>
                  <span className="text-orange-500 font-black">{nextDueDate}</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-white/10 h-2.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "70%" }} />
                </div>
              </div>

            </div>

            {/* Split View: Repayment Chart & Interactive Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Dynamic Line Chart Card (2 Cols) */}
              <div className="lg:col-span-2 glass-card p-8 sm:p-10 rounded-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Loan Repayment Dynamics</h3>
                    <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Repayments processed over the active <strong>{chartRange}</strong> timeframe.
                    </p>
                  </div>
                  
                  {/* Dynamic Range Selector */}
                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 rounded-full p-1.5 text-xs sm:text-sm">
                    {(["1M", "3M", "6M", "1Y"] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setChartRange(range)}
                        className={`px-4 py-1.5 rounded-full font-black transition-all ${
                          chartRange === range 
                            ? "bg-orange-500 text-white shadow-md scale-105" 
                            : "text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white"
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount display & point hover info */}
                <div className="flex items-baseline justify-between mb-4">
                  <div className="flex items-baseline gap-4">
                    <div className="text-4xl sm:text-6xl font-black text-neutral-900 dark:text-white font-glow font-mono">
                      {formatMoney(chartData.totalRepaid)}
                    </div>
                    <div className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> +{chartData.growthPercent}% growth
                    </div>
                  </div>

                  {hoveredPoint && (
                    <div className="text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400">
                      {hoveredPoint.date}: {formatMoney(hoveredPoint.val)}
                    </div>
                  )}
                </div>

                {/* Dynamic SVG Line Chart */}
                <div className="relative w-full h-64 mt-2">
                  <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradientDyn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(125,125,125,0.15)" strokeDasharray="4 4" />
                    <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(125,125,125,0.15)" strokeDasharray="4 4" />
                    <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(125,125,125,0.15)" strokeDasharray="4 4" />

                    {/* Gradient Area */}
                    <path
                      d={chartData.areaPath}
                      fill="url(#chartGradientDyn)"
                      className="transition-all duration-500"
                    />

                    {/* Glowing Line */}
                    <path
                      d={chartData.path}
                      fill="none"
                      stroke="#FF7A00"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />

                    {/* Data Points */}
                    {chartData.points.map((pt, idx) => (
                      <g key={idx}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="6"
                          fill="#FF7A00"
                          stroke="#FFF"
                          strokeWidth="2.5"
                          className="cursor-pointer hover:r-8 transition-all"
                          onMouseEnter={() => setHoveredPoint(pt)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      </g>
                    ))}
                  </svg>
                </div>

                {/* X-Axis labels */}
                <div className="flex justify-between text-xs sm:text-sm text-neutral-500 font-mono mt-4 px-2 font-bold">
                  {chartData.labels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>

                {/* Breakdown bottom stats */}
                <div className="grid grid-cols-3 gap-4 pt-8 mt-8 border-t border-neutral-200 dark:border-white/5 text-center">
                  <div>
                    <span className="block text-xs uppercase tracking-wider font-bold text-neutral-500">Principal Paid</span>
                    <span className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-white font-mono">
                      {formatMoney(chartData.principalPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider font-bold text-neutral-500">Interest Paid</span>
                    <span className="text-lg sm:text-2xl font-black text-orange-500 font-mono">
                      {formatMoney(chartData.interestPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider font-bold text-neutral-500">Average Rate</span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      5.8% APR
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Calendar Card (1 Col) */}
              <div className="glass-card p-8 sm:p-9 rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5">
                      <CalendarIcon className="w-5 h-5 text-orange-500" />
                      September 2026
                    </h3>
                    <span className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-mono bg-orange-500/10 px-3 py-1 rounded-full font-black">
                      Day {selectedDay}
                    </span>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs sm:text-sm">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                      <span key={d} className="text-neutral-400 font-mono text-xs pb-1 font-black">{d}</span>
                    ))}
                    {[31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day, idx) => {
                      const isPast = day === 31;
                      const isSelected = day === selectedDay;
                      const hasEvent = calendarEvents[day];
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedDay(day)}
                          className={`h-9 sm:h-10 rounded-xl flex items-center justify-center font-mono text-xs sm:text-sm font-bold transition-all relative ${
                            isSelected
                              ? "bg-orange-500 text-white font-black shadow-[0_0_15px_rgba(255,122,0,0.7)] ring-2 ring-white scale-110 z-10"
                              : hasEvent
                              ? "bg-orange-500/15 text-orange-600 dark:text-orange-400 font-black hover:bg-orange-500/25"
                              : isPast
                              ? "text-neutral-400 opacity-50"
                              : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          {day}
                          {hasEvent && !isSelected && (
                            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-orange-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day Event Detail Box (Dynamic!) */}
                <div className="mt-8 p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30">
                  {calendarEvents[selectedDay] ? (
                    <div>
                      <div className="flex items-center justify-between text-xs sm:text-sm font-black text-orange-600 dark:text-orange-400 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" />
                          {calendarEvents[selectedDay].title}
                        </span>
                        {calendarEvents[selectedDay].amount > 0 && (
                          <span className="font-mono">{formatMoney(calendarEvents[selectedDay].amount)}</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                        {calendarEvents[selectedDay].description}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-neutral-600 dark:text-neutral-400 mb-1">
                        <Info className="w-4 h-4" />
                        No Scheduled Obligations
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                        September {selectedDay}, 2026 has zero payments due. Your account is in good standing.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Recent Ledger Activity Table */}
            <div className="glass-card p-8 sm:p-10 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Latest Activity</h3>
                  <p className="text-sm text-neutral-500">Live ledger automatically recording every payment and transfer.</p>
                </div>
                <button
                  onClick={() => setActiveTab("transactions")}
                  className="text-sm font-black text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  View Full Ledger ({transactions.length}) <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-neutral-200 dark:divide-white/5">
                {transactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="py-4 flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        tx.amount > 0 ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" :
                        tx.type === "repay" ? "bg-orange-500/15 text-orange-500" :
                        "bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300"
                      }`}>
                        {tx.amount > 0 ? <TrendingUp className="w-5 h-5" /> :
                         tx.type === "repay" ? <DollarSign className="w-5 h-5" /> :
                         <CreditCard className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-extrabold text-neutral-900 dark:text-white">{tx.title}</div>
                        <div className="text-xs text-neutral-500 font-medium">{tx.date} • {tx.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-black text-base sm:text-lg ${
                        tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                      }`}>
                        {formatMoney(tx.amount)}
                      </div>
                      <div className="text-xs text-neutral-500 font-bold">{tx.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: MY LOANS (Interactive Repayment & Amortization)         */}
        {/* ============================================================== */}
        {activeTab === "loans" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h2 className="text-3xl font-black text-neutral-900 dark:text-white">Active Loan Portfolios</h2>
                <p className="text-base text-neutral-500 dark:text-neutral-400 mt-1">
                  Manage terms, review remaining principal, or make early repayments penalty-free.
                </p>
              </div>
              <button
                onClick={() => setShowRepayModal(true)}
                className="orange-glow-btn px-6 py-3.5 rounded-full text-sm font-black text-white flex items-center gap-2 self-start shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Make Principal Repayment
              </button>
            </div>

            <div className="space-y-6">
              {loans.map((loan) => {
                const percentPaid = Math.round((loan.paid / loan.principal) * 100);
                return (
                  <div 
                    key={loan.id}
                    className="glass-card p-8 sm:p-10 rounded-3xl border-l-4 border-l-orange-500 space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-neutral-900 dark:text-white">{loan.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-mono font-black ${
                            loan.status === "Paid Off" 
                              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                          }`}>
                            {loan.status}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-500 font-medium">Loan ID: #{loan.id} • Fixed APR: {loan.apr}%</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase font-bold text-neutral-500">Remaining Balance</div>
                        <div className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white font-mono">
                          {formatMoney(loan.remaining)}
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm text-neutral-500 mb-2 font-mono font-bold">
                        <span>Paid: {formatMoney(loan.paid)} ({percentPaid}%)</span>
                        <span>Total Loan: {formatMoney(loan.principal)}</span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-white/10 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percentPaid}%` }} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-5 border-t border-neutral-200 dark:border-white/5 text-sm">
                      <div>
                        <span className="text-neutral-500 block text-xs uppercase font-bold">Monthly Installment</span>
                        <span className="font-black text-neutral-900 dark:text-white font-mono text-base sm:text-lg">
                          {formatMoney(loan.monthlyInstallment)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-xs uppercase font-bold">Tenure Left</span>
                        <span className="font-bold text-neutral-900 dark:text-white text-base">
                          {loan.monthsLeft} of {loan.totalMonths} Months
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-xs uppercase font-bold">Next Due Date</span>
                        <span className="font-black text-orange-500 font-mono text-base">
                          {loan.nextDueDate}
                        </span>
                      </div>
                      <div className="text-right sm:text-left flex items-center">
                        {loan.status === "Active" ? (
                          <button 
                            onClick={() => {
                              setSelectedLoanId(loan.id);
                              setShowRepayModal(true);
                            }}
                            className="orange-glow-btn px-4 py-2 rounded-full text-xs sm:text-sm font-black text-white"
                          >
                            Pay Off Now →
                          </button>
                        ) : (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CARD CONTROLS & MANAGEMENT                              */}
        {/* ============================================================== */}
        {activeTab === "cards" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Card Visual Showcase */}
            <div className="glass-card p-8 sm:p-10 rounded-3xl flex flex-col items-center">
              <div className="w-full max-w-md h-64 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-orange-400/40 text-white">
                {isCardFrozen && (
                  <div className="absolute inset-0 bg-cyan-950/75 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="px-5 py-2 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-200 text-sm font-black uppercase tracking-wider flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Frozen
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="font-black text-2xl text-white">Velox</span>
                  <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-black/35 border border-white/20 font-bold">
                    TITANIUM DEBIT
                  </span>
                </div>

                <div className="font-mono text-xl sm:text-2xl tracking-[0.22em] text-white font-black">
                  {showCardNumbers ? "4810  5920  8391  2049" : "••••  ••••  ••••  2049"}
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                  <div>
                    <span className="text-[9px] text-white/70 block uppercase font-bold">CARDHOLDER</span>
                    <span className="font-black">{userName.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/70 block uppercase font-bold">EXPIRES</span>
                    <span className="font-black">09/29</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/70 block uppercase font-bold">CVV</span>
                    <span className="font-black">{showCardNumbers ? "739" : "•••"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setShowCardNumbers(!showCardNumbers)}
                  className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-black/5 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 hover:border-orange-500/40 text-neutral-800 dark:text-neutral-300 transition-colors shadow-sm"
                >
                  {showCardNumbers ? "Hide Sensitive Info" : "Reveal Numbers & CVV"}
                </button>
              </div>
            </div>

            {/* Card Settings and Toggles */}
            <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-6">
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Security & Spending Limits</h3>

              {/* Freeze Toggle */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                <div>
                  <div className="text-base font-bold text-neutral-900 dark:text-white">Freeze Physical Card</div>
                  <div className="text-xs sm:text-sm text-neutral-500">Instantly block in-store & online card charges.</div>
                </div>
                <button
                  onClick={toggleCardFrozen}
                  className={`px-5 py-2 rounded-full text-xs sm:text-sm font-black transition-all shadow-md ${
                    isCardFrozen
                      ? "bg-cyan-500 text-white"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {isCardFrozen ? "Frozen" : "Active"}
                </button>
              </div>

              {/* Spending Limit Slider */}
              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-neutral-900 dark:text-white">Daily Spending Limit</span>
                  <span className="font-mono text-orange-500 font-black text-base">{formatMoney(dailyLimit)}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="15000"
                  step="250"
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-neutral-500 font-mono font-bold">
                  <span>Min: {formatMoney(500)}</span>
                  <span>Max: {formatMoney(15000)}</span>
                </div>
              </div>

              {/* International & Contactless Toggles */}
              <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white block">Contactless Tap & Pay</span>
                    <span className="text-xs text-neutral-500">NFC payments up to {formatMoney(100)} without PIN</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Enabled</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-3 border-t border-neutral-200 dark:border-white/5">
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-white block">International Zero-FX Transactions</span>
                    <span className="text-xs text-neutral-500">No cross-border conversion markups</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Enabled</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TRANSACTIONS (Live search, filters, and dynamic sums)    */}
        {/* ============================================================== */}
        {activeTab === "transactions" && (
          <div className="glass-card p-8 sm:p-10 rounded-3xl space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Complete Transaction Ledger</h3>
                <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-1">
                  Search, filter, or export your complete real-time transaction ledger.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search ledger..."
                    className="pl-10 pr-4 py-2.5 rounded-full bg-black/5 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 w-52 sm:w-64 font-medium"
                  />
                </div>

                <select
                  value={transactionFilter}
                  onChange={(e) => setTransactionFilter(e.target.value)}
                  className="px-4 py-2.5 rounded-full bg-black/5 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-sm font-bold text-neutral-800 dark:text-neutral-300 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="loans">Loan Payments</option>
                  <option value="income">Income</option>
                  <option value="expense">Card Spend / Transfers</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm sm:text-base">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-white/10 text-neutral-500 font-mono text-xs uppercase">
                    <th className="pb-4 font-bold">Transaction ID</th>
                    <th className="pb-4 font-bold">Description</th>
                    <th className="pb-4 font-bold">Category</th>
                    <th className="pb-4 font-bold">Date</th>
                    <th className="pb-4 font-bold text-right">Amount</th>
                    <th className="pb-4 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 font-mono text-neutral-500 font-bold">{tx.id}</td>
                      <td className="py-4 font-extrabold text-neutral-900 dark:text-white">{tx.title}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 text-xs font-bold">
                          {tx.category}
                        </span>
                      </td>
                      <td className="py-4 text-neutral-500 font-medium">{tx.date}</td>
                      <td className={`py-4 text-right font-mono font-black text-base ${
                        tx.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-neutral-900 dark:text-white"
                      }`}>
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: CREDIT INSIGHTS                                         */}
        {/* ============================================================== */}
        {activeTab === "credit" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 glass-card p-8 sm:p-10 rounded-3xl flex flex-col items-center text-center">
              <span className="text-sm uppercase tracking-wider text-neutral-500 font-extrabold">Experian / FICO 8 Score</span>
              <div className="text-7xl sm:text-8xl font-black text-orange-500 my-5 font-glow font-mono">{creditScore}</div>
              <span className="px-4 py-1.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-black uppercase">
                Prime Credit Tier
              </span>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mt-5 leading-relaxed font-normal">
                You are in the top 18% of borrowers. Your on-time payment track record qualifies you for preferential 4.8% APR credit lines.
              </p>
            </div>

            <div className="lg:col-span-2 glass-card p-8 sm:p-10 rounded-3xl space-y-5">
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white">Score Factors Breakdown</h3>
              
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex items-center justify-between text-sm sm:text-base">
                  <div>
                    <span className="font-black text-neutral-900 dark:text-white block">Payment History (35% weight)</span>
                    <span className="text-neutral-500">100% on-time payments across 36 consecutive months.</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Exceptional</span>
                </div>

                <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex items-center justify-between text-sm sm:text-base">
                  <div>
                    <span className="font-black text-neutral-900 dark:text-white block">Credit Utilization (30% weight)</span>
                    <span className="text-neutral-500">Using 14.8% of available limits (Optimal is below 30%).</span>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black">Good</span>
                </div>

                <div className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 flex items-center justify-between text-sm sm:text-base">
                  <div>
                    <span className="font-black text-neutral-900 dark:text-white block">Credit History Length (15% weight)</span>
                    <span className="text-neutral-500">Average account age: 4.8 years.</span>
                  </div>
                  <span className="text-amber-500 font-black">Moderate</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL 1: EARLY LOAN REPAYMENT (Dynamic calculation & execution)*/}
      {/* ============================================================== */}
      <AnimatePresence>
        {showRepayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl glass-card-elevated p-8 border border-neutral-200 dark:border-white/15 shadow-2xl relative bg-white/95 dark:bg-neutral-900/95"
            >
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Make Principal Loan Repayment</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-medium">
                Available balance to pay from: <strong className="text-emerald-500 font-mono">{formatMoney(availableBalance)}</strong>
              </p>

              {repayStatus === "success" ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white">Payment Confirmed!</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {formatMoney(repayAmount)} has been deducted from your account and applied directly to loan principal.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleExecuteRepay} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase">
                      Select Loan Account
                    </label>
                    <select
                      value={selectedLoanId}
                      onChange={(e) => setSelectedLoanId(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-sm font-bold text-neutral-900 dark:text-white"
                    >
                      {loans.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title} (Remaining: {formatMoney(l.remaining)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-2 uppercase">
                      Repayment Amount ({currency})
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="10"
                        max={availableBalance}
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(Number(e.target.value))}
                        className="w-full pl-5 pr-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-black text-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {repayStatus === "insufficient" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                      Insufficient available balance. Please lower repayment amount.
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRepayAmount(monthlyDue)}
                      className="flex-1 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-neutral-300 dark:border-white/10 text-xs font-bold text-neutral-700 dark:text-neutral-300"
                    >
                      Monthly Due ({formatMoney(monthlyDue)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepayAmount(5000)}
                      className="flex-1 py-2 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-black"
                    >
                      Partial ({formatMoney(5000)})
                    </button>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRepayModal(false)}
                      className="flex-1 py-3.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 rounded-full orange-glow-btn text-white text-sm font-black shadow-lg"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* MODAL 2: SEND MONEY / TRANSFER (Dynamic Balance Deduction)     */}
      {/* ============================================================== */}
      <AnimatePresence>
        {showSendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-3xl glass-card-elevated p-8 border border-neutral-200 dark:border-white/15 shadow-2xl relative bg-white/95 dark:bg-neutral-900/95"
            >
              <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-2">Send Instant Transfer</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 font-medium">
                Transfer funds directly to any external IBAN, email, or Velox account tag.
              </p>

              {sendStatus === "success" ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="text-2xl font-black text-neutral-900 dark:text-white">Transfer Dispatched!</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {formatMoney(sendAmount)} sent to <strong>{sendRecipient}</strong> with 0% wire fee.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleExecuteSend} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                      Recipient (Name, Email or IBAN)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah Connor / sarah@acme.com"
                      value={sendRecipient}
                      onChange={(e) => setSendRecipient(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-bold text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                      Amount ({currency})
                    </label>
                    <input
                      type="number"
                      min="5"
                      max={availableBalance}
                      value={sendAmount}
                      onChange={(e) => setSendAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-black text-lg focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300 block mb-1.5 uppercase">
                      Reference Note
                    </label>
                    <input
                      type="text"
                      value={sendNote}
                      onChange={(e) => setSendNote(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-medium text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {sendStatus === "insufficient" && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold">
                      Insufficient balance for this transfer.
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSendModal(false)}
                      className="flex-1 py-3.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 hover:text-black dark:hover:text-white text-sm font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3.5 rounded-full orange-glow-btn text-white text-sm font-black shadow-lg"
                    >
                      Send {formatMoney(sendAmount)}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
