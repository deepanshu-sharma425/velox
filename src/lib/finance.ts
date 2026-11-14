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
