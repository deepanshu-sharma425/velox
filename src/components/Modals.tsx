"use client";

import { X } from "lucide-react";
import { IconUser, Logo } from "./Icons";
import { NAV } from "./Header";
import { INFO, PLANS } from "@/lib/content";
import { addMonths, ddmmyyyy, quote, usd } from "@/lib/finance";
import { LANGS, scrollToId, useStore } from "@/lib/store";
import { ApplyModal, PayModal } from "./LoanFlow";
import { Shell } from "./ModalParts";

/* ---------- Account ---------- */

function AccountPanel() {
  const { t, close, loans, subscriptions, calls, open, reset, user, logout, toast } = useStore();
  const active = loans.filter((l) => l.status === "active");
  const owed = active.reduce((s, l) => s + (l.total - l.paid), 0);
  return (
    <div className="overlay is-drawer" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside data-lenis-prevent className="drawer glass" role="dialog" aria-modal="true" aria-label={t("My Account")}>
        <div className="modal-head">
          <h2 className="modal-title">
            <IconUser className="title-ic" /> {t("My Account")}
          </h2>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <X strokeWidth={1.3} />
          </button>
        </div>
        {user ? (
          <div className="acc-user">
            <span className="acc-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <div>
              <b>{user.name}</b>
              <span>{user.email}</span>
            </div>
            <button
              className="btn btn-ghost btn-xs"
              onClick={async () => {
                await logout();
                toast(t("You’ve been logged out."));
              }}
            >
              {t("Log out")}
            </button>
          </div>
        ) : (
          <div className="acc-auth">
            <p>{t("Sign in to keep your loans and payments synced to your profile.")}</p>
            <div>
              <a className="btn btn-ghost btn-xs" href="/login">
                {t("Log in")}
              </a>
              <a className="btn btn-primary btn-xs" href="/signup">
                {t("Sign up")}
              </a>
            </div>
          </div>
        )}
        <div className="acc-stats">
          <div>
            <span>{t("Active loans")}</span>
            <b>{active.length}</b>
          </div>
          <div>
            <span>{t("Outstanding")}</span>
            <b>{usd(owed, true)}</b>
          </div>
        </div>

        <h3 className="acc-h">{t("Loans")}</h3>
        {loans.length === 0 ? (
          <div className="acc-empty">
            <p>{t("You don’t have any loans yet.")}</p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                close();
                scrollToId("calculator");
              }}
            >
              {t("Get a Loan")}
            </button>
          </div>
        ) : (
          <div className="acc-loans">
            {loans.map((l) => {
              const p = Math.min(100, (l.paid / l.total) * 100);
              const nextIdx = Math.floor(l.paid / l.monthly + 1e-6);
              return (
                <div key={l.id} className="acc-loan glass">
                  <div className="acc-loan-top">
                    <b>{l.id}</b>
                    <span className={`badge ${l.status}`}>{l.status === "active" ? t("Active") : t("Repaid")}</span>
                  </div>
                  <div className="acc-loan-meta">
                    {t(l.plan)} · {usd(l.principal)} · {l.months} {t("months")}
                    {l.card4 && (
                      <>
                        {" "}
                        · {l.payout === "card" ? t("Bank card") : t("Velox card")} •••• {l.card4}
                      </>
                    )}
                  </div>
                  <div className="bar">
                    <i style={{ width: p + "%" }} />
                  </div>
                  <div className="acc-loan-meta">
                    {t("Paid")} {usd(l.paid, true)} {t("of")} {usd(l.total, true)}
                    {l.status === "active" ? (
                      <>
                        {" "}
                        · {t("Next payment")} {ddmmyyyy(addMonths(new Date(l.createdAt), nextIdx + 1))}
                      </>
                    ) : (
                      l.closedAt && (
                        <>
                          {" "}
                          · {t("Closed on")} {ddmmyyyy(new Date(l.closedAt))}
                        </>
                      )
                    )}
                  </div>
                  {l.status === "active" && (
                    <button className="btn btn-ghost btn-sm" onClick={() => open({ type: "pay", loanId: l.id })}>
                      {t("Pay")} {usd(Math.min(l.monthly, l.total - l.paid), true)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <h3 className="acc-h">{t("Subscriptions")}</h3>
        {subscriptions.length ? (
          <ul className="acc-list">
            {subscriptions.map((s, i) => (
              <li key={i}>
                {s.email} <span>{s.source === "events" ? t("Events") : t("Drop alerts")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small-muted">{t("No subscriptions yet.")}</p>
        )}

        <h3 className="acc-h">{t("Call requests")}</h3>
        {calls.length ? (
          <ul className="acc-list">
            {calls.map((c, i) => (
              <li key={i}>
                {c.name} <span>{c.phone}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small-muted">{t("No call requests yet.")}</p>
        )}

        {(loans.length > 0 || subscriptions.length > 0 || calls.length > 0) && (
          <button className="inline-link acc-reset" onClick={reset}>
            {t("Clear demo data")}
          </button>
        )}
      </aside>
    </div>
  );
}

/* ---------- Info ---------- */

function InfoModal({ k }: { k: string }) {
  const { t, close, open } = useStore();
  if (k.startsWith("plan:")) {
    const p = PLANS.find((x) => "plan:" + x.id === k)!;
    const q = quote(Math.round((p.min + p.max) / 2 / 500) * 500, p.term);
    return (
      <Shell title={`${t(p.name)} ${t("plan")}`} onClose={close}>
        <p className="info-p">{t("For everyday expenses, quick cash, groceries, subscriptions.")}</p>
        <div className="summary">
          <div>
            <span>{t("Loan amount")}</span>
            <b>
              {usd(p.min)} - {usd(p.max)}
            </b>
          </div>
          <div>
            <span>{t("Loan term")}</span>
            <b>
              {t("Up to")} {p.term} {t("month")}
            </b>
          </div>
          <div>
            <span>{t("First loan")}</span>
            <b>{t(p.firstLoan)}</b>
          </div>
          <div>
            <span>{t("Payout time")}</span>
            <b>{t(p.payout)}</b>
          </div>
          <div>
            <span>{t("Daily rate")}</span>
            <b>{p.rate}</b>
          </div>
          <div>
            <span>
              {t("Example")}: {usd(q.principal)} / {p.term} {t("mo")}
            </span>
            <b>
              {usd(q.monthly, true)} {t("per month")}
            </b>
          </div>
        </div>
        <div className="modal-actions">
          <span />
          <button
            className="btn btn-primary"
            onClick={() => open({ type: "apply", preset: { plan: p.name, amount: q.principal, months: p.term } })}
          >
            {t("Get a Loan")}
          </button>
        </div>
      </Shell>
    );
  }
  const doc = INFO[k] ?? { title: k, body: [] };
  return (
    <Shell title={t(doc.title)} onClose={close} wide={k === "examples"}>
      {doc.body.map((b, i) => (
        <p key={i} className="info-p">
          {t(b)}
        </p>
      ))}
      {doc.bullets && (
        <ul className="bullets info-list">
          {doc.bullets.map((b) => (
            <li key={b}>{t(b)}</li>
          ))}
        </ul>
      )}
      {k === "examples" && (
        <table className="ex-table">
          <thead>
            <tr>
              <th>{t("Amount")}</th>
              <th>{t("Term")}</th>
              <th>{t("Interest")}</th>
              <th>{t("Fees")}</th>
              <th>{t("Monthly")}</th>
              <th>{t("Total")}</th>
            </tr>
          </thead>
          <tbody>
            {[
              [5000, 6],
              [15000, 12],
              [30000, 24],
              [55500, 36],
              [100000, 84],
            ].map(([a, m]) => {
              const q = quote(a, m);
              return (
                <tr key={a}>
                  <td>{usd(a)}</td>
                  <td>
                    {m} {t("mo")}
                  </td>
                  <td>{usd(q.interest)}</td>
                  <td>{usd(q.fees)}</td>
                  <td>{usd(q.monthly, true)}</td>
                  <td>{usd(q.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="modal-actions">
        <span />
        <button className="btn btn-ghost" onClick={close}>
          {t("Close")}
        </button>
      </div>
    </Shell>
  );
}

/* ---------- Mobile menu ---------- */

function MobileMenu() {
  const { t, close, open, lang, setLang } = useStore();
  return (
    <div className="mmenu">
      <div className="mmenu-head">
        <button className="header-burger" onClick={close} aria-label="Close menu">
          <X strokeWidth={1.3} />
        </button>
        <Logo />
        <button className="account-btn" onClick={() => open({ type: "account" })} aria-label={t("My Account")}>
          <span className="account-icon">
            <IconUser />
          </span>
        </button>
      </div>
      <nav className="mmenu-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              close();
              setTimeout(() => scrollToId(n.id), 30);
            }}
          >
            {t(n.label)}
          </button>
        ))}
      </nav>
      <div className="mmenu-lang">
        {LANGS.map((l) => (
          <button key={l.code} className={l.code === lang ? "is-active" : ""} onClick={() => setLang(l.code)}>
            {l.code}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={() => {
          close();
          setTimeout(() => scrollToId("calculator"), 30);
        }}
      >
        {t("Get a Loan")}
      </button>
    </div>
  );
}

/* ---------- Root ---------- */

export function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((x) => (
        <div key={x.id} className="toast glass">
          {x.msg}
        </div>
      ))}
    </div>
  );
}

export default function Modals() {
  const { modal } = useStore();
  return (
    <>
      {modal?.type === "apply" && <ApplyModal key={JSON.stringify(modal.preset)} preset={modal.preset} />}
      {modal?.type === "pay" && <PayModal loanId={modal.loanId} />}
      {modal?.type === "account" && <AccountPanel />}
      {modal?.type === "info" && <InfoModal k={modal.key} />}
      {modal?.type === "menu" && <MobileMenu />}
    </>
  );
}
