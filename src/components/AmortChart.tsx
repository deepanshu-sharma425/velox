"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AmortRow, LoanQuote, amortize, convert, ddmmyyyy, toUsd } from "@/lib/finance";
import { useStore } from "@/lib/store";
import LiquidNav from "./LiquidNav";

/**
 * Brand palette: Velox orange for principal, warm silver for the finance charge.
 * The pair separates on lightness (L 0.62 vs 0.80), so it reads under every
 * colour-vision type; legend, tooltip and direct labels carry identity too.
 */
const C_PRINCIPAL = "#ee5f16";
const C_INTEREST = "#c9c0b8";

type View = "bars" | "balance";

const H = 230;
const PAD = { l: 58, r: 74, t: 14, b: 28 };

function niceMax(v: number) {
  if (v <= 0) return 1;
  const e = 10 ** Math.floor(Math.log10(v));
  const f = v / e;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
}

export default function AmortChart({ q }: { q: LoanQuote }) {
  const { t, money, currency } = useStore();
  const rows = useMemo(() => amortize(q), [q]);
  const [view, setView] = useState<View>("bars");
  const [hover, setHover] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(560);

  useEffect(() => {
    const el = wrap.current!;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = rows.length;
  const plotW = w - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const slot = plotW / n;

  // cumulative series for the balance view (same unit, one axis)
  const cum = useMemo(() => {
    let paid = 0;
    return rows.map((r) => (paid += r.interest));
  }, [rows]);

  // round the axis in the currency the visitor sees, then map back to the USD base
  const rawMax = view === "bars" ? Math.max(...rows.map((r) => r.payment)) : Math.max(q.principal, cum[n - 1] ?? 0);
  const max = toUsd(niceMax(convert(rawMax, currency)), currency);
  const yOf = (v: number) => PAD.t + plotH - (v / max) * plotH;
  const xMid = (i: number) => PAD.l + (i + 0.5) * slot;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const xTicks = n <= 12 ? rows.map((_, i) => i) : rows.map((_, i) => i).filter((i) => (i + 1) % Math.ceil(n / 8) === 0 || i === 0);

  const pick = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    const i = Math.floor((clientX - r.left - PAD.l) / slot);
    setHover(i >= 0 && i < n ? i : null);
  };

  // balance view paths: principal balance before each payment → after
  const balPts = [[PAD.l, yOf(q.principal)], ...rows.map((r, i) => [PAD.l + (i + 1) * slot, yOf(r.balance)])];
  const intPts = [[PAD.l, yOf(0)], ...rows.map((_, i) => [PAD.l + (i + 1) * slot, yOf(cum[i])])];
  const line = (pts: number[][]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join("");
  const area = (pts: number[][]) => `${line(pts)}L${pts[pts.length - 1][0].toFixed(1)},${yOf(0)}L${PAD.l},${yOf(0)}Z`;

  const hr: AmortRow | null = hover !== null ? rows[hover] : null;
  const barW = Math.max(1, slot - Math.min(4, slot * 0.3));
  const rad = Math.min(4, barW / 2);

  return (
    <div className="amort">
      <div className="amort-head">
        <div>
          <h4 className="amort-title">{view === "bars" ? t("Principal vs interest, per payment") : t("Balance payoff over time")}</h4>
          <div className="amort-legend">
            <span>
              <i style={{ background: C_PRINCIPAL }} /> {view === "bars" ? t("Principal") : t("Remaining principal")}
            </span>
            <span>
              <i style={{ background: C_INTEREST }} /> {view === "bars" ? t("Interest & fees") : t("Interest & fees paid")}
            </span>
          </div>
        </div>
        <LiquidNav
          label={t("Chart view")}
          className="lseg"
          itemClassName="lseg-item"
          active={view}
          remeasureKey={t("Payments")}
          items={[
            { id: "bars", label: t("Payments") },
            { id: "balance", label: t("Balance") },
          ]}
          onSelect={(id) => setView(id as View)}
        />
      </div>

      <div
        ref={wrap}
        className="amort-plot"
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={() => setHover(null)}
        tabIndex={0}
        role="img"
        aria-label={`${t("Amortization chart")}: ${n} ${t("payments")}, ${t("total interest & fees")} ${money(q.interest + q.fees)}`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
          else if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
          else if (e.key === "Escape") setHover(null);
          else return;
          e.preventDefault();
        }}
        onBlur={() => setHover(null)}
      >
        <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`} aria-hidden>
          {ticks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={w - PAD.r} y1={yOf(v)} y2={yOf(v)} className="amort-grid" />
              <text x={PAD.l - 8} y={yOf(v) + 4} className="amort-axis" textAnchor="end">
                {money(v)}
              </text>
            </g>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={xMid(i)} y={H - 8} className="amort-axis" textAnchor="middle">
              {i + 1}
            </text>
          ))}

          {view === "bars" ? (
            <g>
              {rows.map((r, i) => {
                const x = xMid(i) - barW / 2;
                const yP = yOf(r.principal);
                const yI = yOf(r.principal + r.interest);
                const gap = r.interest > 0 ? Math.min(2, (yP - yI) / 2) : 0;
                const dim = hover !== null && hover !== i;
                const topH = Math.max(0, yP - yI - gap);
                return (
                  <g key={i} opacity={dim ? 0.4 : 1} style={{ transition: "opacity .15s" }}>
                    <motion.rect
                      x={x}
                      width={barW}
                      fill={C_PRINCIPAL}
                      initial={false}
                      animate={{ y: yP, height: Math.max(0, yOf(0) - yP) }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    />
                    {topH > 0 && (
                      <motion.path
                        fill={C_INTEREST}
                        initial={false}
                        animate={{
                          d: `M${x},${yP - gap}V${yI + rad}Q${x},${yI} ${x + rad},${yI}H${x + barW - rad}Q${x + barW},${yI} ${x + barW},${yI + rad}V${yP - gap}Z`,
                        }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                  </g>
                );
              })}
            </g>
          ) : (
            <g>
              <path d={area(balPts)} fill={C_PRINCIPAL} opacity={0.14} />
              <path d={line(balPts)} fill="none" stroke={C_PRINCIPAL} strokeWidth={2} strokeLinejoin="round" />
              <path d={line(intPts)} fill="none" stroke={C_INTEREST} strokeWidth={2} strokeLinejoin="round" />
              {/* direct labels at the line ends */}
              <text x={w - PAD.r + 6} y={yOf(cum[n - 1]) + 4} className="amort-dlabel">
                {money(cum[n - 1])}
              </text>
            </g>
          )}

          {hr && hover !== null && (
            <g pointerEvents="none">
              <line x1={xMid(hover)} x2={xMid(hover)} y1={PAD.t} y2={yOf(0)} className="amort-cross" />
              {view === "balance" && (
                <>
                  <circle cx={PAD.l + (hover + 1) * slot} cy={yOf(hr.balance)} r={4.5} fill={C_PRINCIPAL} className="amort-dot" />
                  <circle cx={PAD.l + (hover + 1) * slot} cy={yOf(cum[hover])} r={4.5} fill={C_INTEREST} className="amort-dot" />
                </>
              )}
            </g>
          )}
        </svg>

        <AnimatePresence>
          {hr && hover !== null && (
            <motion.div
              className="amort-tip glass"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                left: Math.min(Math.max(xMid(hover), 90), w - 90),
              }}
            >
              <b>
                {t("Payment")} {hr.n} · {ddmmyyyy(hr.date)}
              </b>
              <div>
                <span>{t("Payment")}</span>
                <span>{money(hr.payment, true)}</span>
              </div>
              <div>
                <span>
                  <i style={{ background: C_PRINCIPAL }} /> {t("Principal")}
                </span>
                <span>{money(hr.principal, true)}</span>
              </div>
              <div>
                <span>
                  <i style={{ background: C_INTEREST }} /> {t("Interest & fees")}
                </span>
                <span>{money(hr.interest, true)}</span>
              </div>
              <div className="amort-tip-sep">
                <span>{t("Balance after")}</span>
                <span>{money(hr.balance, true)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p className="amort-note">
        {t("Finance charge is fixed at signing and earned by the Rule of 78 — early repayment rebates the unearned part.")}
      </p>
    </div>
  );
}
