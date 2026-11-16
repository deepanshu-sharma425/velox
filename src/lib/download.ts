"use client";

import { feeDiscountOf } from "./finance";
import type { Currency } from "./finance";
import { payoutText, type Loan } from "./store";

export type StatementRequest = {
  principal: number;
  months: number;
  discount?: number;
  start?: string;
  currency: Currency;
  id?: string;
  name?: string;
  email?: string;
  purpose?: string;
  payoutTo?: string;
  signature?: Loan["signature"];
  signedAt?: string;
};

/** Asks the server for the PDF statement and saves it. Resolves false on failure. */
export async function downloadStatement(req: StatementRequest) {
  try {
    const r = await fetch("/api/statement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!r.ok) return false;
    const blob = await r.blob();
    const name = /filename="([^"]+)"/.exec(r.headers.get("Content-Disposition") ?? "")?.[1] ?? "velox-statement.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
}

export const loanStatement = (l: Loan, currency: Currency): StatementRequest => ({
  principal: l.principal,
  months: l.months,
  discount: l.feeDiscount ?? feeDiscountOf(l),
  start: l.createdAt,
  currency,
  id: l.id,
  name: l.name,
  email: l.email,
  purpose: l.purpose,
  payoutTo: payoutText(l),
  signature: l.signature,
  signedAt: l.signature ? l.createdAt : undefined,
});
