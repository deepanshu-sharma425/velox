"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { EVENTS, CalEvent } from "@/lib/content";
import { cardReveal, reveal } from "@/lib/motion";
import SplitHeading from "./SplitHeading";
import { mmddyyyy } from "@/lib/finance";
import { isEmail, useStore } from "@/lib/store";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const same = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayKey = (d: Date) => d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();

const EV = EVENTS.map((e) => ({ ...e, s: parse(e.start), e: parse(e.end) }));
function eventOn(d: Date) {
  const k = dayKey(d);
  return EV.find((e) => k >= dayKey(e.s) && k <= dayKey(e.e));
}

function monthCells(year: number, month: number, rows: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: rows * 7 }, (_, i) => new Date(year, month, 1 - offset + i));
}
function rowsFor(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return Math.ceil((offset + days) / 7);
}

function Month({
  year,
  month,
  rows,
  today,
  selected,
  onSelect,
  nav,
}: {
  year: number;
  month: number;
  rows: number;
  today: Date;
  selected: Date;
  onSelect: (d: Date) => void;
  nav: React.ReactNode;
}) {
  const { t } = useStore();
  const cells = monthCells(year, month, rows);
  return (
    <div className="cal-month">
      <div className="cal-head">
        {nav}
        <span className="cal-title">
          {t(MONTHS[month])}
          {year !== today.getFullYear() && <span className="cal-year"> {year}</span>}
        </span>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => (
          <span key={d} className="cal-dow">
            {t(d)}
          </span>
        ))}
        {cells.map((d, i) => {
          const ev = eventOn(d);
          const out = d.getMonth() !== month;
          const multi = ev && dayKey(ev.s) !== dayKey(ev.e);
          const isStart = ev && same(d, ev.s);
          const isEnd = ev && multi && same(d, ev.e);
          const col = i % 7;
          const prev = new Date(d);
          prev.setDate(d.getDate() - 1);
          const next = new Date(d);
          next.setDate(d.getDate() + 1);
          const barL = multi && (col === 0 || eventOn(prev) !== ev);
          const barR = multi && (col === 6 || eventOn(next) !== ev);
          const cls = [
            "cal-day",
            out && "is-out",
            multi && "in-range",
            barL && "bar-l",
            barR && "bar-r",
            isStart && "ev-start",
            isEnd && "ev-end",
            same(d, today) && "is-today",
            same(d, selected) && "is-selected",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button key={i} className={cls} onClick={() => onSelect(d)} aria-label={d.toDateString() + (ev ? `, ${ev.name}` : "")}>
              <span>{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Calendar() {
  const { t } = useStore();
  const [today, setToday] = useState<Date | null>(null);
  const [base, setBase] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  useEffect(() => {
    const n = new Date();
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    setToday(d);
    setSelected(d);
    setBase({ y: d.getFullYear(), m: d.getMonth() });
  }, []);

  const upcoming = useMemo<CalEvent | undefined>(() => {
    if (!today) return undefined;
    return EV.find((e) => dayKey(e.s) > dayKey(today));
  }, [today]);

  if (!today || !base || !selected) return <div className="cal glass cal-skeleton" />;

  const left = new Date(base.y, base.m, 1);
  const right = new Date(base.y, base.m + 1, 1);
  const rows = Math.max(rowsFor(left.getFullYear(), left.getMonth()), rowsFor(right.getFullYear(), right.getMonth()));
  const shift = (d: number) => setBase((b) => b && { y: new Date(b.y, b.m + d, 1).getFullYear(), m: new Date(b.y, b.m + d, 1).getMonth() });
  const isToday = same(selected, today);
  const ev = eventOn(selected);

  return (
    <motion.div {...cardReveal(1)} className="cal glass">
      <div className="cal-months">
        <Month
          year={left.getFullYear()}
          month={left.getMonth()}
          rows={rows}
          today={today}
          selected={selected}
          onSelect={setSelected}
          nav={
            <button className="cal-nav is-prev" onClick={() => shift(-1)} aria-label="Previous month">
              <ChevronLeft strokeWidth={1.3} />
            </button>
          }
        />
        <Month
          year={right.getFullYear()}
          month={right.getMonth()}
          rows={rows}
          today={today}
          selected={selected}
          onSelect={setSelected}
          nav={
            <button className="cal-nav is-next" onClick={() => shift(1)} aria-label="Next month">
              <ChevronRight strokeWidth={1.3} />
            </button>
          }
        />
      </div>
      <div className="cal-info glass">
        <div className="cal-info-row">
          <span>
            <CalendarDays strokeWidth={1.2} /> {isToday ? t("Today’s date:") : t("Selected date:")} <b>{mmddyyyy(selected)}</b>
          </span>
          <span>
            <Zap strokeWidth={1.2} /> {isToday ? t("Today’s event:") : t("Event:")} <b>{ev ? ev.name : t("None")}</b>
          </span>
        </div>
        <p className="cal-soon">
          {t("Coming up soon:")}{" "}
          {upcoming ? (
            <button
              className="cal-soon-link"
              onClick={() => {
                const s = parse(upcoming.start);
                setSelected(s);
                setBase({ y: s.getFullYear(), m: s.getMonth() });
              }}
            >
              {upcoming.start === upcoming.end
                ? mmddyyyy(parse(upcoming.start))
                : `${mmddyyyy(parse(upcoming.start))} - ${mmddyyyy(parse(upcoming.end))}`}{" "}
              — «{upcoming.name}»
            </button>
          ) : (
            t("No events scheduled")
          )}
        </p>
      </div>
    </motion.div>
  );
}

export function SubscribeForm({ source, withName, className }: { source: string; withName?: boolean; className?: string }) {
  const { t, subscribe, toast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<{ name?: string; email?: string }>({});
  const [done, setDone] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (withName && name.trim().length < 2) er.name = t("Please enter your name");
    if (!isEmail(email)) er.email = t("Please enter a valid e-mail");
    setErr(er);
    if (Object.keys(er).length) return;
    const fresh = subscribe({ email: email.trim(), name: name.trim() || undefined, source });
    setDone(true);
    toast(fresh ? t("You’re subscribed! Check your inbox for a confirmation.") : t("This e-mail is already subscribed."));
  };
  return (
    <form className={"sub-form " + (className ?? "")} onSubmit={submit} noValidate>
      {withName && (
        <label className={`field ${err.name ? "has-error" : ""}`}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Name")} autoComplete="name" aria-label={t("Name")} />
          {err.name && <span className="field-error">{err.name}</span>}
        </label>
      )}
      <label className={`field ${err.email ? "has-error" : ""}`}>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setDone(false);
          }}
          placeholder={t("E-mail")}
          type="email"
          autoComplete="email"
          aria-label={t("E-mail")}
        />
        {err.email && <span className="field-error">{err.email}</span>}
      </label>
      <button className={`btn btn-primary btn-sm ${done ? "is-done" : ""}`} type="submit">
        {done ? t("Subscribed ✓") : t("Notify Me")}
      </button>
    </form>
  );
}

export default function Loyalty() {
  const { t, open } = useStore();
  return (
    <section className="loyalty section" id="events">
      <div className="loyalty-left">
        <SplitHeading className="h-xl" text={t("Join our loyalty events and win big")} />
        <motion.p {...reveal(0.12)} className="lead loyalty-lead">
          {t("Celebrate with us! Enjoy upcoming brand events, exclusive anniversary discounts, and exciting prize draws.")}
        </motion.p>
        <motion.div {...reveal(0.2)} className="notify">
          <h3 className="h-xs">{t("Get notifications!")}</h3>
          <p className="small-muted">{t("Grab exclusive financial promotion codes and gifts.")}</p>
          <SubscribeForm source="events" withName />
        </motion.div>
        <motion.div {...reveal(0.25)} className="loyalty-terms">
          <p className="tags-title sm">{t("About the event terms here:")}</p>
          <div className="tags sm">
            {[
              ["Events", "events"],
              ["Terms", "event-terms"],
              ["Gifts", "gifts"],
              ["Raffles", "raffles"],
              ["Other", "other"],
            ].map(([l, k]) => (
              <button key={k} className="tag" onClick={() => open({ type: "info", key: k })}>
                {t(l)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
      <Calendar />
    </section>
  );
}
