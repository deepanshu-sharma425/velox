import type { Loan } from "./store";

/** Card activity is simulated — but deterministically, so a customer sees the same history on every visit. */

export type Category = "Groceries" | "Dining" | "Transport" | "Shopping" | "Bills" | "Entertainment" | "Travel";

export type Txn = {
  id: string;
  date: Date;
  merchant: string;
  category: Category | "Loan";
  /** USD; negative = money out */
  amount: number;
  status?: "declined";
};

const MERCHANTS: Record<Category, { names: string[]; min: number; max: number; perMonth: number }> = {
  Groceries: { names: ["FreshMart", "Green Basket", "Corner Pantry"], min: 18, max: 140, perMonth: 5 },
  Dining: { names: ["Café Lumen", "Noodle Bar 88", "Ember Grill", "Daily Bagel"], min: 6, max: 72, perMonth: 6 },
  Transport: { names: ["MetroRide", "CityCab", "Fuel & Go"], min: 3, max: 64, perMonth: 4 },
  Shopping: { names: ["Orbit Store", "Threadline", "Hardware Hub"], min: 15, max: 260, perMonth: 2 },
  Bills: { names: ["Volt Energy", "Skyline Mobile", "FiberNet"], min: 35, max: 120, perMonth: 3 },
  Entertainment: { names: ["StreamBox", "Cinema 9", "Arcade Club"], min: 8, max: 45, perMonth: 2 },
  Travel: { names: ["Airlink", "StayWell Hotels", "RailPass"], min: 80, max: 620, perMonth: 0.4 },
};
export const CATEGORIES = Object.keys(MERCHANTS) as Category[];

function seedOf(s: string) {
  let h = 1779033703;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 3432918353) >>> 0;
  return h;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Six months of card spending ending today (newest first). */
export function cardActivity(seed: string, now = new Date()): Txn[] {
  const out: Txn[] = [];
  for (let back = 0; back < 6; back++) {
    const y = now.getFullYear();
    const m = now.getMonth() - back;
    const first = new Date(y, m, 1);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lastDay = back === 0 ? now.getDate() : days;
    const r = rng(seedOf(`${seed}:${first.getFullYear()}-${first.getMonth()}`));
    for (const cat of CATEGORIES) {
      const spec = MERCHANTS[cat];
      const count = Math.floor(spec.perMonth * (0.6 + r() * 0.8) + r());
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(r() * days);
        if (day > lastDay) continue;
        const amt = Math.round((spec.min + (spec.max - spec.min) * r() ** 1.6) * 100) / 100;
        out.push({
          id: `${first.getMonth()}-${cat}-${i}`,
          date: new Date(first.getFullYear(), first.getMonth(), day, 8 + Math.floor(r() * 13), Math.floor(r() * 60)),
          merchant: spec.names[Math.floor(r() * spec.names.length)],
          category: cat,
          amount: -amt,
        });
      }
    }
  }
  return out.sort((a, b) => +b.date - +a.date);
}

/** Loan payouts and repayments as ledger lines. */
export function loanActivity(loans: Loan[]): Txn[] {
  const out: Txn[] = [];
  for (const l of loans) {
    const to = l.payout === "bank" ? ` → ${l.bank ?? "bank"} •••• ${l.card4}` : l.payout === "card" ? ` → card •••• ${l.card4}` : "";
    out.push({ id: l.id + ":out", date: new Date(l.createdAt), merchant: `${l.id} payout${to}`, category: "Loan", amount: l.principal });
    l.payments.forEach((p, i) =>
      out.push({
        id: `${l.id}:p${i}`,
        date: new Date(p.date),
        merchant: `${l.id} repayment${p.method === "card" ? ` · card •••• ${p.card4 ?? ""}` : ""}`,
        category: "Loan",
        amount: -p.amount,
      }),
    );
  }
  return out;
}

export function monthlyTotals(txns: Txn[], now = new Date()) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const total = txns
      .filter((t) => t.category !== "Loan" && t.date.getFullYear() === d.getFullYear() && t.date.getMonth() === d.getMonth())
      .reduce((s, t) => s - t.amount, 0);
    return { month: d, total: Math.round(total * 100) / 100 };
  });
}

export function byCategory(txns: Txn[], since: Date) {
  const map = new Map<Category, number>();
  for (const t of txns) if (t.category !== "Loan" && t.date >= since) map.set(t.category, (map.get(t.category) ?? 0) - t.amount);
  return [...map.entries()].map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 })).sort((a, b) => b.total - a.total);
}

/* ---------- Credit score (simulated, explained) ---------- */

export type ScoreFactor = { label: string; value: string; impact: "positive" | "neutral" | "negative"; points: number };

export function creditScore(loans: Loan[], seed: string) {
  const base = 640 + (seedOf(seed) % 60);
  const payments = loans.reduce((s, l) => s + l.payments.length, 0);
  const closed = loans.filter((l) => l.status === "closed").length;
  const active = loans.filter((l) => l.status === "active");
  const owed = active.reduce((s, l) => s + (l.total - l.paid), 0);
  const borrowed = active.reduce((s, l) => s + l.total, 0);
  const util = borrowed ? owed / borrowed : 0;

  const history = Math.min(70, payments * 9);
  const repaid = Math.min(60, closed * 30);
  const utilPts = active.length ? -Math.round(util * 45) : 0;
  const mix = active.length > 2 ? -(active.length - 2) * 12 : 0;
  const score = Math.max(300, Math.min(850, Math.round(base + history + repaid + utilPts + mix)));

  const factors: ScoreFactor[] = [
    { label: "Payment history", value: payments ? `${payments} on time` : "No payments yet", impact: payments ? "positive" : "neutral", points: history },
    { label: "Loans repaid", value: String(closed), impact: closed ? "positive" : "neutral", points: repaid },
    { label: "Credit utilization", value: `${Math.round(util * 100)}%`, impact: util > 0.6 ? "negative" : util > 0 ? "neutral" : "positive", points: utilPts },
    { label: "Open loans", value: String(active.length), impact: mix < 0 ? "negative" : "neutral", points: mix },
  ];
  const band = score >= 800 ? "Excellent" : score >= 740 ? "Very good" : score >= 670 ? "Good" : score >= 580 ? "Fair" : "Poor";
  return { score, band, factors };
}
