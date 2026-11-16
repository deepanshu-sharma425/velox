export const AMOUNT_MIN = 2000;
export const AMOUNT_MAX = 100000;
export const AMOUNT_STEP = 500;
export const TERM_MIN = 1;
export const TERM_MAX = 84;

/** Interest accrues at 0.0873% of principal per month of term. */
const INTEREST_PER_MONTH = 0.000873;
/** One-off service fees & commissions as a share of principal. */
const FEE_RATE = 0.11973;

export const PROMO_CODES: Record<string, { discount: number; label: string }> = {
  VELOX10: { discount: 0.1, label: "10% off service fees" },
  WELCOME: { discount: 0.25, label: "25% off service fees" },
  LOYALTY: { discount: 0.5, label: "50% off service fees" },
};

export type LoanQuote = {
  principal: number;
  months: number;
  interest: number;
  fees: number;
  total: number;
  monthly: number;
  ratePerMonth: number;
  firstPayment: Date;
  schedule: { date: Date; amount: number }[];
};

export function addMonths(d: Date, m: number) {
  const r = new Date(d);
  const day = r.getDate();
  r.setDate(1);
  r.setMonth(r.getMonth() + m);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(day, last));
  return r;
}

export function quote(principal: number, months: number, feeDiscount = 0, start = new Date()): LoanQuote {
  const interest = Math.round(principal * months * INTEREST_PER_MONTH);
  const fees = Math.round(principal * FEE_RATE * (1 - feeDiscount));
  const total = principal + interest + fees;
  const monthly = Math.round((total / months) * 100) / 100;
  const firstPayment = addMonths(start, 1);
  const schedule = Array.from({ length: months }, (_, i) => {
    const isLast = i === months - 1;
    const amount = isLast ? Math.round((total - monthly * (months - 1)) * 100) / 100 : monthly;
    return { date: addMonths(start, i + 1), amount };
  });
  const ratePerMonth = ((interest + fees) / principal / months) * 100;
  return { principal, months, interest, fees, total, monthly, ratePerMonth, firstPayment, schedule };
}

export const usd = (n: number, cents = false) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

export const ddmmyyyy = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;

export const mmddyyyy = (d: Date) =>
  `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${d.getFullYear()}`;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/* ---------- Multi-currency ---------- */

export type Currency = "USD" | "EUR" | "GBP";
/** Indicative mid-market rates against the US dollar (base currency of every loan). */
export const FX: Record<Currency, { rate: number; symbol: string; name: string; locale: string }> = {
  USD: { rate: 1, symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { rate: 0.92, symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { rate: 0.79, symbol: "£", name: "British Pound", locale: "en-GB" },
};
export const CURRENCIES = Object.keys(FX) as Currency[];
export const isCurrency = (s: unknown): s is Currency => typeof s === "string" && s in FX;

export const convert = (usdAmount: number, cur: Currency) => usdAmount * FX[cur].rate;
/** Converts an amount typed in the display currency back to the USD base. */
export const toUsd = (amount: number, cur: Currency) => amount / FX[cur].rate;

/** Formats a USD-base amount in the chosen currency ("€51,060", "£43,845.00"). */
export function money(usdAmount: number, cur: Currency = "USD", cents = false) {
  const v = convert(usdAmount, cur);
  const digits = cents ? 2 : 0;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (v < 0 ? "-" : "") + FX[cur].symbol + s;
}

/* ---------- Amortization ---------- */

export type AmortRow = {
  n: number;
  date: Date;
  payment: number;
  principal: number;
  interest: number;
  /** principal still owed after this payment */
  balance: number;
};

/**
 * Velox loans are add-on (flat) loans: the finance charge (interest + fees) is
 * fixed up front and every instalment is equal. The finance charge is earned
 * with the Rule of 78 — front-loaded, like any add-on instalment loan — so each
 * payment pays down more principal than the one before.
 */
export function amortize(q: LoanQuote): AmortRow[] {
  const n = q.months;
  const charge = q.interest + q.fees;
  const digits = (n * (n + 1)) / 2;
  let balance = q.principal;
  let chargeLeft = charge;
  return q.schedule.map((s, i) => {
    const last = i === n - 1;
    const interest = last ? Math.round(chargeLeft * 100) / 100 : Math.round(((charge * (n - i)) / digits) * 100) / 100;
    const principal = last ? Math.round(balance * 100) / 100 : Math.round((s.amount - interest) * 100) / 100;
    chargeLeft -= interest;
    balance = Math.max(0, Math.round((balance - principal) * 100) / 100);
    return { n: i + 1, date: s.date, payment: s.amount, principal, interest, balance };
  });
}

/** Recovers the promo fee discount that was applied to an existing loan. */
export function feeDiscountOf(l: { principal: number; months: number; total: number }) {
  const base = quote(l.principal, l.months);
  if (!base.fees) return 0;
  const d = 1 - (l.total - l.principal - base.interest) / base.fees;
  return clamp(Math.round(d * 100) / 100, 0, 1);
}
