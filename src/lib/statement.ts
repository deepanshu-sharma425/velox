import { PdfDoc, RGB } from "./pdf";
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  Currency,
  FX,
  TERM_MAX,
  TERM_MIN,
  amortize,
  ddmmyyyy,
  isCurrency,
  money,
  quote,
} from "./finance";

export type StatementInput = {
  principal: number;
  months: number;
  discount: number;
  start: Date;
  currency: Currency;
  id?: string;
  name?: string;
  email?: string;
  purpose?: string;
  payoutTo?: string;
  signature?: { kind: "draw"; strokes: number[][] } | { kind: "type"; text: string };
  signedAt?: Date;
};

const ORANGE: RGB = [238, 95, 22];
const SILVER: RGB = [196, 188, 180];
const INK: RGB = [24, 24, 24];
const MUTED: RGB = [110, 110, 110];
const LINE: RGB = [225, 225, 225];
const SOFT: RGB = [248, 246, 244];

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : undefined);

/** Validates untrusted JSON into a StatementInput (or returns an error message). */
export function parseStatement(body: unknown): StatementInput | string {
  if (!body || typeof body !== "object") return "Invalid request.";
  const b = body as Record<string, unknown>;
  const principal = Number(b.principal);
  const months = Number(b.months);
  if (!Number.isFinite(principal) || principal < AMOUNT_MIN || principal > AMOUNT_MAX) return "Invalid principal.";
  if (!Number.isInteger(months) || months < TERM_MIN || months > TERM_MAX) return "Invalid term.";
  const discount = b.discount === undefined ? 0 : Number(b.discount);
  if (!Number.isFinite(discount) || discount < 0 || discount > 1) return "Invalid discount.";
  const start = b.start ? new Date(String(b.start)) : new Date();
  if (isNaN(+start) || Math.abs(+start - Date.now()) > 20 * 365 * 864e5) return "Invalid start date.";
  const signedAt = b.signedAt ? new Date(String(b.signedAt)) : undefined;
  if (signedAt && isNaN(+signedAt)) return "Invalid signature date.";

  let signature: StatementInput["signature"];
  const sig = b.signature as Record<string, unknown> | undefined;
  if (sig && sig.kind === "type") {
    const text = str(sig.text, 60);
    if (text) signature = { kind: "type", text };
  } else if (sig && sig.kind === "draw" && Array.isArray(sig.strokes)) {
    const strokes = (sig.strokes as unknown[]).slice(0, 60).filter(Array.isArray) as unknown[][];
    let total = 0;
    const clean: number[][] = [];
    for (const s of strokes) {
      const pts = s.slice(0, 1200).map(Number);
      if (pts.length % 2 || pts.some((v) => !Number.isFinite(v) || v < -10 || v > 1010)) return "Invalid signature.";
      total += pts.length;
      if (total > 6000) return "Signature too large.";
      clean.push(pts);
    }
    if (clean.length) signature = { kind: "draw", strokes: clean };
  }

  return {
    principal: Math.round(principal),
    months,
    discount,
    start,
    currency: isCurrency(b.currency) ? b.currency : "USD",
    id: str(b.id, 20),
    name: str(b.name, 60),
    email: str(b.email, 80),
    purpose: str(b.purpose, 40),
    payoutTo: str(b.payoutTo, 60),
    signature,
    signedAt,
  };
}

export function buildStatement(input: StatementInput) {
  const q = quote(input.principal, input.months, input.discount, input.start);
  const rows = amortize(q);
  const cur = input.currency;
  const m = (v: number, cents = true) => money(v, cur, cents);
  const pdf = new PdfDoc();
  const L = 48;
  const R = pdf.width - 48;
  const today = new Date();

  /* ---- header band ---- */
  const header = (sub: string) => {
    pdf.rect(0, 0, pdf.width, 84, [14, 14, 14]);
    pdf.rect(0, 84, pdf.width, 3, ORANGE);
    pdf.text(L, 44, "VELOX", { size: 24, font: "B", color: [255, 255, 255] });
    pdf.text(L, 64, sub, { size: 9.5, color: [190, 190, 190] });
    pdf.text(R, 40, input.id ?? "Quote", { size: 12, font: "B", color: [255, 255, 255], align: "right" });
    pdf.text(R, 58, `Issued ${ddmmyyyy(today)}`, { size: 9, color: [190, 190, 190], align: "right" });
  };
  header("Loan Agreement & Amortization Statement");

  /* ---- parties ---- */
  let y = 120;
  pdf.text(L, y, "BORROWER", { size: 7.5, font: "B", color: MUTED });
  pdf.text(L + 260, y, "LENDER", { size: 7.5, font: "B", color: MUTED });
  y += 16;
  pdf.text(L, y, input.name || "Applicant", { size: 12, font: "B", color: INK, maxWidth: 240 });
  pdf.text(L + 260, y, "Velox Bank, N.A.", { size: 12, font: "B", color: INK });
  y += 14;
  pdf.text(L, y, input.email || "—", { size: 9, color: MUTED, maxWidth: 240 });
  pdf.text(L + 260, y, "Consumer Lending Desk · velox.bank", { size: 9, color: MUTED });
  y += 13;
  if (input.payoutTo) pdf.text(L, y, `Payout: ${input.payoutTo}`, { size: 9, color: MUTED, maxWidth: 240 });
  pdf.text(L + 260, y, `Currency: ${cur} (${FX[cur].name}${cur === "USD" ? "" : `, 1 USD = ${FX[cur].rate} ${cur}`})`, {
    size: 9,
    color: MUTED,
  });

  /* ---- summary grid ---- */
  y += 26;
  const cells: [string, string][] = [
    ["Principal", m(q.principal, false)],
    ["Term", `${q.months} month${q.months === 1 ? "" : "s"}`],
    ["Monthly payment", m(q.monthly)],
    ["First payment", ddmmyyyy(q.firstPayment)],
    ["Total interest", m(q.interest, false)],
    [`Service fees${input.discount ? ` (−${Math.round(input.discount * 100)}%)` : ""}`, m(q.fees, false)],
    ["Total repayable", m(q.total, false)],
    ["Cost per month", `${q.ratePerMonth.toFixed(2)}% of principal`],
  ];
  const cw = (R - L) / 4;
  pdf.rect(L, y, R - L, 92, SOFT);
  cells.forEach(([k, v], i) => {
    const cx = L + 14 + (i % 4) * cw;
    const cy = y + 22 + Math.floor(i / 4) * 42;
    pdf.text(cx, cy, k.toUpperCase(), { size: 6.8, font: "B", color: MUTED, maxWidth: cw - 18 });
    pdf.text(cx, cy + 16, v, { size: 12, font: "B", color: i === 6 ? ORANGE : INK, maxWidth: cw - 18 });
  });
  y += 92 + 30;

  /* ---- payoff chart: stacked principal / interest per payment ---- */
  pdf.text(L, y, "Payoff profile", { size: 11, font: "B", color: INK });
  pdf.rect(R - 168, y - 7, 8, 8, ORANGE);
  pdf.text(R - 156, y, "Principal", { size: 8.5, color: MUTED });
  pdf.rect(R - 96, y - 7, 8, 8, SILVER);
  pdf.text(R - 84, y, "Interest & fees", { size: 8.5, color: MUTED });
  y += 14;
  const ch = 120;
  const plotL = L + 44;
  const maxPay = Math.max(...rows.map((r) => r.payment));
  const step = maxPay / 4;
  for (let i = 0; i <= 4; i++) {
    const gy = y + ch - (ch * i) / 4;
    pdf.line(plotL, gy, R, gy, LINE, 0.4);
    pdf.text(plotL - 6, gy + 3, m(step * i, false), { size: 7, color: MUTED, align: "right" });
  }
  const slot = (R - plotL) / rows.length;
  const gap = Math.min(2, slot * 0.25);
  rows.forEach((r, i) => {
    const x = plotL + i * slot + gap / 2;
    const w = Math.max(0.6, slot - gap);
    const hp = (r.principal / maxPay) * ch;
    const hi = (r.interest / maxPay) * ch;
    pdf.rect(x, y + ch - hp, w, hp, ORANGE);
    if (hi > 0.4) pdf.rect(x, y + ch - hp - hi - 0.6, w, hi, SILVER);
  });
  const ticks = rows.length <= 12 ? rows : rows.filter((r, i) => i === 0 || r.n % Math.ceil(rows.length / 8) === 0);
  ticks.forEach((r) => pdf.text(plotL + (r.n - 0.5) * slot, y + ch + 11, String(r.n), { size: 7, color: MUTED, align: "center" }));
  pdf.text((plotL + R) / 2, y + ch + 23, "Payment number", { size: 7.5, color: MUTED, align: "center" });
  y += ch + 44;

  /* ---- key terms ---- */
  pdf.text(L, y, "Key terms", { size: 11, font: "B", color: INK });
  y += 16;
  const terms = [
    `1. The Lender advances ${m(q.principal, false)} to the Borrower${input.purpose ? ` for ${input.purpose.toLowerCase()}` : ""}. The Borrower repays ${m(q.total, false)} in ${q.months} equal monthly instalments of ${m(q.monthly)}, the first due on ${ddmmyyyy(q.firstPayment)}.`,
    "2. The finance charge (interest and service fees) is fixed at signing and earned under the Rule of 78, so earlier instalments carry more of the charge. Early repayment is always free and unearned charges are rebated.",
    "3. Late payments do not compound. Missing two consecutive instalments may be reported to credit bureaus after a 30-day notice period.",
    "4. The Borrower may cancel this agreement within 14 days of signing by returning the principal without any charge.",
  ];
  for (const tx of terms) y = pdf.para(L, y, tx, R - L, { size: 8.6, color: [60, 60, 60] }) + 3;

  /* ---- signatures ---- */
  y = Math.max(y + 18, 690);
  const sigW = 220;
  const sigH = 54;
  const sig = input.signature;
  if (sig?.kind === "draw") {
    const sx = sigW / 1000;
    const sy = sigH / 300;
    const s = Math.min(sx, sy);
    for (const st of sig.strokes) {
      const pts: [number, number][] = [];
      for (let i = 0; i < st.length; i += 2) pts.push([L + st[i] * s, y - sigH + st[i + 1] * s]);
      pdf.polyline(pts, [20, 30, 80], 1.3);
    }
  } else if (sig?.kind === "type") {
    pdf.text(L + 4, y - 12, sig.text, { size: 20, font: "I", color: [20, 30, 80], maxWidth: sigW });
  } else {
    pdf.text(L + 4, y - 12, "Not signed — quote only", { size: 9, font: "I", color: MUTED });
  }
  pdf.line(L, y, L + sigW, y, [120, 120, 120], 0.6);
  pdf.text(L, y + 12, `Borrower${input.name ? ` · ${input.name}` : ""}`, { size: 8, color: MUTED, maxWidth: sigW });
  if (input.signedAt) pdf.text(L, y + 24, `E-signed ${ddmmyyyy(input.signedAt)} ${input.signedAt.toISOString().slice(11, 16)} UTC`, { size: 7.5, color: MUTED });

  pdf.text(R - sigW + 4, y - 12, "Velox Lending Desk", { size: 16, font: "I", color: [20, 30, 80] });
  pdf.line(R - sigW, y, R, y, [120, 120, 120], 0.6);
  pdf.text(R - sigW, y + 12, "For Velox Bank, N.A.", { size: 8, color: MUTED });

  /* ---- amortization schedule pages ---- */
  const cols = [
    { k: "#", x: L + 18, a: "right" as const },
    { k: "Due date", x: L + 34, a: "left" as const },
    { k: "Payment", x: L + 200, a: "right" as const },
    { k: "Principal", x: L + 290, a: "right" as const },
    { k: "Interest & fees", x: L + 390, a: "right" as const },
    { k: "Balance", x: R - 6, a: "right" as const },
  ];
  const perPage = 44;
  let paidP = 0;
  let paidI = 0;
  for (let start = 0; start < rows.length; start += perPage) {
    pdf.addPage();
    header("Amortization schedule");
    let ty = 118;
    pdf.text(L, ty, `Schedule ${start + 1}–${Math.min(rows.length, start + perPage)} of ${rows.length}`, {
      size: 11,
      font: "B",
      color: INK,
    });
    ty += 20;
    pdf.rect(L, ty - 11, R - L, 17, [20, 20, 20]);
    cols.forEach((c) => pdf.text(c.x, ty, c.k.toUpperCase(), { size: 7, font: "B", color: [255, 255, 255], align: c.a }));
    ty += 16;
    rows.slice(start, start + perPage).forEach((r, i) => {
      if (i % 2) pdf.rect(L, ty - 10, R - L, 13.5, SOFT);
      paidP += r.principal;
      paidI += r.interest;
      const vals = [String(r.n), ddmmyyyy(r.date), m(r.payment), m(r.principal), m(r.interest), m(r.balance)];
      cols.forEach((c, j) => pdf.text(c.x, ty, vals[j], { size: 8.4, color: j === 5 && r.balance === 0 ? ORANGE : INK, align: c.a }));
      ty += 13.5;
    });
    if (start + perPage >= rows.length) {
      ty += 4;
      pdf.line(L, ty - 9, R, ty - 9, [120, 120, 120], 0.6);
      pdf.text(L + 34, ty + 2, "Total", { size: 8.6, font: "B", color: INK });
      pdf.text(cols[2].x, ty + 2, m(q.total), { size: 8.6, font: "B", color: INK, align: "right" });
      pdf.text(cols[3].x, ty + 2, m(paidP), { size: 8.6, font: "B", color: INK, align: "right" });
      pdf.text(cols[4].x, ty + 2, m(paidI), { size: 8.6, font: "B", color: INK, align: "right" });
    }
  }

  /* ---- footers ---- */
  const total = pdf.pageCount;
  for (let i = 0; i < total; i++)
    pdf.onPage(i, () => {
      pdf.line(L, pdf.height - 40, R, pdf.height - 40, LINE, 0.5);
      pdf.text(L, pdf.height - 26, "Velox demo statement — illustrative figures, not an offer of credit.", { size: 7.5, color: MUTED });
      pdf.text(R, pdf.height - 26, `Page ${i + 1} of ${total}`, { size: 7.5, color: MUTED, align: "right" });
    });

  return pdf.build({ title: `Velox loan agreement ${input.id ?? ""}`.trim(), author: "Velox Bank, N.A." });
}
