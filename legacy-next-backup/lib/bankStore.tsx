"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "EUR" | "GBP" | "ESP";

export interface Transaction {
  id: string;
  title: string;
  category: "Loan" | "Card Spend" | "Income" | "Rewards" | "Transfer";
  date: string;
  amount: number; // positive = credit/income, negative = debit/expense
  status: "Completed" | "Received" | "Credited" | "Pending";
  type: "repay" | "income" | "expense" | "reward" | "transfer";
}

export interface LoanItem {
  id: string;
  title: string;
  principal: number;
  remaining: number;
  paid: number;
  apr: number;
  monthlyInstallment: number;
  monthsLeft: number;
  totalMonths: number;
  status: "Active" | "Paid Off";
  nextDueDate: string;
}

export interface CalendarEvent {
  day: number;
  title: string;
  amount: number;
  type: "due" | "auto" | "salary" | "interest";
  description: string;
}

interface BankContextType {
  // Currency & Formatter
  currency: Currency;
  setCurrency: (c: Currency) => void;
  currencySymbol: string;
  formatMoney: (amountInUSD: number) => string;
  convertAmount: (amountInUSD: number) => number;

  // User Profile
  userName: string;
  setUserName: (n: string) => void;
  userId: string;
  tier: string;
  creditScore: number;
  availableBalance: number;
  totalDebt: number;
  monthlyDue: number;
  nextDueDate: string;

  // Active Loans
  loans: LoanItem[];
  applyNewLoan: (title: string, amount: number, months: number, apr: number) => void;
  repayLoan: (loanId: string, amount: number) => boolean;

  // Transactions
  transactions: Transaction[];
  sendMoney: (recipient: string, amount: number, note?: string) => boolean;
  downloadStatement: () => void;

  // Card Controls
  isCardFrozen: boolean;
  setIsCardFrozen: (frozen: boolean) => void;
  toggleCardFrozen: () => void;
  cardSkin: "orange" | "obsidian" | "chrome";
  setCardSkin: (skin: "orange" | "obsidian" | "chrome") => void;
  dailyLimit: number;
  setDailyLimit: (limit: number) => void;
  showCardNumbers: boolean;
  setShowCardNumbers: (show: boolean) => void;

  // Chart Dynamic Range
  chartRange: "1M" | "3M" | "6M" | "1Y";
  setChartRange: (r: "1M" | "3M" | "6M" | "1Y") => void;
  chartData: {
    labels: string[];
    points: { x: number; y: number; val: number; date: string }[];
    path: string;
    areaPath: string;
    totalRepaid: number;
    principalPaid: number;
    interestPaid: number;
    growthPercent: number;
  };

  // Calendar
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  calendarEvents: Record<number, CalendarEvent>;
}

const rates: Record<Currency, { rate: number; symbol: string }> = {
  USD: { rate: 1.0, symbol: "$" },
  EUR: { rate: 0.92, symbol: "€" },
  GBP: { rate: 0.79, symbol: "£" },
  ESP: { rate: 0.92, symbol: "€" },
};

const initialLoans: LoanItem[] = [
  {
    id: "VLX-LN-99214",
    title: "Velox Personal Expansion Loan",
    principal: 25000,
    remaining: 18200,
    paid: 6800,
    apr: 6.8,
    monthlyInstallment: 820,
    monthsLeft: 24,
    totalMonths: 36,
    status: "Active",
    nextDueDate: "Sep 15, 2026",
  },
  {
    id: "VLX-LN-44102",
    title: "Micro Equipment Credit",
    principal: 10000,
    remaining: 6150,
    paid: 3850,
    apr: 5.2,
    monthlyInstallment: 460,
    monthsLeft: 14,
    totalMonths: 24,
    status: "Active",
    nextDueDate: "Sep 15, 2026",
  },
];

const initialTransactions: Transaction[] = [
  {
    id: "TX-901",
    title: "Monthly Loan Repayment",
    category: "Loan",
    date: "Sep 01, 2026",
    amount: -1280,
    status: "Completed",
    type: "repay",
  },
  {
    id: "TX-902",
    title: "Apple Store Regent St",
    category: "Card Spend",
    date: "Aug 29, 2026",
    amount: -249,
    status: "Completed",
    type: "expense",
  },
  {
    id: "TX-903",
    title: "Salary Deposit - Acme Corp",
    category: "Income",
    date: "Aug 28, 2026",
    amount: 8450,
    status: "Received",
    type: "income",
  },
  {
    id: "TX-904",
    title: "Velox Credit Booster Cashback",
    category: "Rewards",
    date: "Aug 25, 2026",
    amount: 64.2,
    status: "Credited",
    type: "reward",
  },
  {
    id: "TX-905",
    title: "Early Principal Partial Repayment",
    category: "Loan",
    date: "Aug 15, 2026",
    amount: -2000,
    status: "Completed",
    type: "repay",
  },
];

const calendarEventsData: Record<number, CalendarEvent> = {
  1: { day: 1, title: "Previous Month Autodeduct", amount: 1280, type: "auto", description: "Successfully processed with 0% fees." },
  3: { day: 3, title: "Today's Account Review", amount: 0, type: "interest", description: "All active loans in good standing." },
  7: { day: 7, title: "Cashback Reward Payout", amount: 64.20, type: "salary", description: "Velox 2% universal card cashback credited." },
  15: { day: 15, title: "Scheduled Loan Auto-Deduct", amount: 1280, type: "due", description: "Automatic deduction for loans #99214 and #44102." },
  22: { day: 22, title: "Credit Score Bureau Refresh", amount: 0, type: "interest", description: "Experian & TransUnion monthly reporting cycle." },
  28: { day: 28, title: "Upcoming Salary Deposit", amount: 8450, type: "salary", description: "Direct deposit from Acme Corp scheduled." },
};

const BankContext = createContext<BankContextType | null>(null);

export function BankProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [userName, setUserName] = useState("Alex Morgan");
  const [userId] = useState("VLX-481024");
  const [tier] = useState("Titanium Member");
  const [creditScore, setCreditScore] = useState(724);
  const [availableBalance, setAvailableBalance] = useState(42850.2);
  const [totalDebt, setTotalDebt] = useState(24350);
  const [monthlyDue, setMonthlyDue] = useState(1280);
  const [nextDueDate] = useState("Sep 15, 2026");

  const [loans, setLoans] = useState<LoanItem[]>(initialLoans);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  // Card Controls
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [cardSkin, setCardSkin] = useState<"orange" | "obsidian" | "chrome">("orange");
  const [dailyLimit, setDailyLimit] = useState(5000);
  const [showCardNumbers, setShowCardNumbers] = useState(false);

  // Chart Dynamic Range
  const [chartRange, setChartRange] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  // Calendar
  const [selectedDay, setSelectedDay] = useState(15);

  useEffect(() => {
    const savedCur = localStorage.getItem("velox-currency") as Currency | null;
    if (savedCur && rates[savedCur]) {
      setCurrencyState(savedCur);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("velox-currency", c);
  };

  const currencySymbol = rates[currency].symbol;

  const convertAmount = (amountInUSD: number) => {
    return amountInUSD * rates[currency].rate;
  };

  const formatMoney = (amountInUSD: number) => {
    const converted = convertAmount(amountInUSD);
    const isNegative = converted < 0;
    const absVal = Math.abs(converted);
    const formatted = absVal.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${isNegative ? "-" : ""}${currencySymbol}${formatted}`;
  };

  const toggleCardFrozen = () => {
    setIsCardFrozen(!isCardFrozen);
  };

  // Dynamic Loan Repayment
  const repayLoan = (loanId: string, amount: number) => {
    if (amount <= 0 || availableBalance < amount) return false;

    setAvailableBalance((prev) => prev - amount);
    setTotalDebt((prev) => Math.max(0, prev - amount));

    setLoans((prevLoans) =>
      prevLoans.map((l) => {
        if (l.id === loanId) {
          const newRemaining = Math.max(0, l.remaining - amount);
          const newPaid = l.paid + amount;
          return {
            ...l,
            remaining: newRemaining,
            paid: newPaid,
            status: newRemaining === 0 ? "Paid Off" : "Active",
          };
        }
        return l;
      })
    );

    // Boost score slightly on repayment
    setCreditScore((prev) => Math.min(850, prev + 3));

    // Prepend transaction
    const newTx: Transaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Principal Loan Repayment (#${loanId.slice(-5)})`,
      category: "Loan",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      amount: -amount,
      status: "Completed",
      type: "repay",
    };
    setTransactions((prev) => [newTx, ...prev]);

    return true;
  };

  // Dynamic New Loan Application
  const applyNewLoan = (title: string, amount: number, months: number, apr: number) => {
    const monthlyRate = apr / 100 / 12;
    const monthlyPayment = Math.round(
      (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)
    );

    const newLoan: LoanItem = {
      id: `VLX-LN-${Math.floor(10000 + Math.random() * 90000)}`,
      title,
      principal: amount,
      remaining: amount,
      paid: 0,
      apr,
      monthlyInstallment: monthlyPayment,
      monthsLeft: months,
      totalMonths: months,
      status: "Active",
      nextDueDate: "Oct 15, 2026",
    };

    setLoans((prev) => [newLoan, ...prev]);
    setAvailableBalance((prev) => prev + amount);
    setTotalDebt((prev) => prev + amount);
    setMonthlyDue((prev) => prev + monthlyPayment);

    // Add Disbursal transaction
    const newTx: Transaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Instant Credit Disbursal (${title})`,
      category: "Income",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      amount: amount,
      status: "Received",
      type: "income",
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  // Dynamic Send Money
  const sendMoney = (recipient: string, amount: number, note?: string) => {
    if (amount <= 0 || availableBalance < amount) return false;

    setAvailableBalance((prev) => prev - amount);
    const newTx: Transaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      title: `Transfer to ${recipient}${note ? ` (${note})` : ""}`,
      category: "Transfer",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      amount: -amount,
      status: "Completed",
      type: "transfer",
    };
    setTransactions((prev) => [newTx, ...prev]);
    return true;
  };

  // Dynamic Statement Download
  const downloadStatement = () => {
    const lines = [
      "===========================================================",
      "           VELOX NEOBANK — OFFICIAL ACCOUNT STATEMENT       ",
      "===========================================================",
      `Account Holder: ${userName}`,
      `Account ID:     ${userId}`,
      `Generated At:   ${new Date().toUTCString()}`,
      `Currency:       ${currency} (${currencySymbol})`,
      `Available Limit:${formatMoney(availableBalance)}`,
      `Active Debt:    ${formatMoney(totalDebt)}`,
      `Credit Rating:  ${creditScore} / 850 (Prime Plus Tier)`,
      "-----------------------------------------------------------",
      "ACTIVE LOANS:",
      ...loans.map(
        (l) =>
          `* ${l.title} (${l.id}) | Remaining: ${formatMoney(l.remaining)} / ${formatMoney(l.principal)} | APR: ${l.apr}% | Next: ${l.nextDueDate}`
      ),
      "-----------------------------------------------------------",
      "RECENT TRANSACTIONS:",
      ...transactions.map(
        (t) => `* [${t.date}] ${t.id.padEnd(8)} | ${t.title.padEnd(35)} | ${formatMoney(t.amount)} | ${t.status}`
      ),
      "===========================================================",
      "Velox Financial Technologies, Inc. Member FDIC insured.",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Velox-Statement-${userId}-${currency}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dynamic Chart Datasets based on chartRange
  const chartDatasets = {
    "1M": {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      points: [
        { x: 30, y: 130, val: 980, date: "Aug 10" },
        { x: 170, y: 100, val: 1450, date: "Aug 17" },
        { x: 320, y: 65, val: 2100, date: "Aug 24" },
        { x: 470, y: 40, val: 2820, date: "Aug 31" },
      ],
      path: "M30,130 Q100,120 170,100 T320,65 T470,40",
      areaPath: "M30,130 Q100,120 170,100 T320,65 T470,40 L470,175 L30,175 Z",
      totalRepaid: 2820,
      principalPaid: 2100,
      interestPaid: 720,
      growthPercent: 18.4,
    },
    "3M": {
      labels: ["Jun 2026", "Jul 2026", "Aug 2026", "Sep 2026"],
      points: [
        { x: 30, y: 140, val: 1200, date: "Jun 15" },
        { x: 180, y: 110, val: 2600, date: "Jul 15" },
        { x: 330, y: 55, val: 4500, date: "Aug 15" },
        { x: 470, y: 35, val: 6450, date: "Sep 01" },
      ],
      path: "M30,140 Q100,130 180,110 T330,55 T470,35",
      areaPath: "M30,140 Q100,130 180,110 T330,55 T470,35 L470,175 L30,175 Z",
      totalRepaid: 6450,
      principalPaid: 4800,
      interestPaid: 1650,
      growthPercent: 34.3,
    },
    "6M": {
      labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      points: [
        { x: 25, y: 150, val: 1800, date: "Apr 2026" },
        { x: 120, y: 135, val: 3400, date: "May 2026" },
        { x: 210, y: 105, val: 5600, date: "Jun 2026" },
        { x: 300, y: 75, val: 8200, date: "Jul 2026" },
        { x: 390, y: 50, val: 10900, date: "Aug 2026" },
        { x: 475, y: 30, val: 13800, date: "Sep 2026" },
      ],
      path: "M25,150 Q70,145 120,135 T210,105 T300,75 T390,50 T475,30",
      areaPath: "M25,150 Q70,145 120,135 T210,105 T300,75 T390,50 T475,30 L475,175 L25,175 Z",
      totalRepaid: 13800,
      principalPaid: 10400,
      interestPaid: 3400,
      growthPercent: 52.1,
    },
    "1Y": {
      labels: ["Q4 '25", "Q1 '26", "Q2 '26", "Q3 '26"],
      points: [
        { x: 30, y: 155, val: 4200, date: "Q4 2025" },
        { x: 180, y: 115, val: 11500, date: "Q1 2026" },
        { x: 330, y: 65, val: 18900, date: "Q2 2026" },
        { x: 470, y: 25, val: 27400, date: "Q3 2026" },
      ],
      path: "M30,155 Q100,140 180,115 T330,65 T470,25",
      areaPath: "M30,155 Q100,140 180,115 T330,65 T470,25 L470,175 L30,175 Z",
      totalRepaid: 27400,
      principalPaid: 21200,
      interestPaid: 6200,
      growthPercent: 88.5,
    },
  };

  const chartData = chartDatasets[chartRange];

  return (
    <BankContext.Provider
      value={{
        currency,
        setCurrency,
        currencySymbol,
        formatMoney,
        convertAmount,
        userName,
        setUserName,
        userId,
        tier,
        creditScore,
        availableBalance,
        totalDebt,
        monthlyDue,
        nextDueDate,
        loans,
        applyNewLoan,
        repayLoan,
        transactions,
        sendMoney,
        downloadStatement,
        isCardFrozen,
        setIsCardFrozen,
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
        calendarEvents: calendarEventsData,
      }}
    >
      {children}
    </BankContext.Provider>
  );
}

export function useBank() {
  const ctx = useContext(BankContext);
  if (!ctx) {
    throw new Error("useBank must be used within a BankProvider");
  }
  return ctx;
}

