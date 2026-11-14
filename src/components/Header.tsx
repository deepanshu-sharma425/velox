"use client";

import { useEffect, useState } from "react";
import { Calculator, CalendarDays, ChevronDown, House, Layers, Menu, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { IconUser, Logo } from "./Icons";
import LiquidNav, { LiquidFilter } from "./LiquidNav";
import { LANGS, scrollToId, useStore } from "@/lib/store";

export const NAV = [
  { id: "home", label: "Home" },
  { id: "about", label: "About us" },
  { id: "services", label: "Services" },
  { id: "contacts", label: "Contacts" },
  { id: "support", label: "Support" },
  { id: "events", label: "Events" },
];

const TABS = [
  { id: "home", label: "Home", Icon: House },
  { id: "services", label: "Plans", Icon: Layers },
  { id: "calculator", label: "Calculator", Icon: Calculator },
  { id: "events", label: "Events", Icon: CalendarDays },
  { id: "account", label: "Account", Icon: UserRound },
];

let spyLockUntil = 0;
/** Pause scroll-spy while a programmatic smooth scroll is running. */
export function lockSpy(ms = 1700) {
  spyLockUntil = Date.now() + ms;
}

function spy(ids: string[]) {
  const mid = window.innerHeight * 0.35;
  let current = ids[0];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.top <= mid && r.bottom > mid) current = id;
  }
  return window.scrollY < 200 ? ids[0] : current;
}

export function MobileTabBar() {
  const { t, open, user } = useStore();
  const [active, setActive] = useState("home");
  const [show, setShow] = useState(false);
  useEffect(() => {
    const ids = TABS.filter((x) => x.id !== "account").map((x) => x.id);
    const on = () => {
      setShow(window.scrollY > window.innerHeight * 0.7);
      if (Date.now() > spyLockUntil) setActive(spy(ids));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`tabbar m-only ${show ? "is-shown" : ""}`}>
      <LiquidNav
        label="Quick navigation"
        className="tabbar-nav"
        itemClassName="tab-item"
        active={active}
        items={TABS.map((x) => ({ id: x.id, label: t(x.id === "account" && user ? "Me" : x.label), icon: <x.Icon strokeWidth={1.5} /> }))}
        onSelect={(id) => {
          if (id === "account") {
            open({ type: "account" });
            return;
          }
          setActive(id);
          lockSpy();
          scrollToId(id);
        }}
      />
    </div>
  );
}

export default function Header() {
  const { open, t, lang, setLang, loans, user } = useStore();
  const [active, setActive] = useState("home");
  const [floating, setFloating] = useState(false);
  const [shown, setShown] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Scroll spy + reveal-on-scroll-up header
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Date.now() > spyLockUntil) setActive(spy(NAV.map((n) => n.id)));
      setFloating(y > 160);
      if (y < 160) setShown(false);
      else if (y < lastY - 4) setShown(true);
      else if (y > lastY + 4) setShown(false);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [langOpen]);

  const go = (id: string) => {
    setActive(id);
    lockSpy();
    scrollToId(id);
  };

  return (
    <header className={`header ${floating ? "is-floating" : ""} ${floating && shown ? "is-shown" : ""}`}>
      <motion.div
        className="header-inner"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: EASE, delay: 0.1 }}
      >
        <button className="header-burger m-only" aria-label="Open menu" onClick={() => open({ type: "menu" })}>
          <Menu strokeWidth={1.3} />
        </button>

        <a
          href="#home"
          className="header-logo"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <Logo />
        </a>

        <LiquidNav
          label="Main"
          className="nav d-only"
          itemClassName="nav-item"
          active={active}
          remeasureKey={lang}
          items={NAV.map((n) => ({ id: n.id, label: t(n.label) }))}
          onSelect={go}
        />

        <div className="header-right">
          <div className="lang d-only" onClick={(e) => e.stopPropagation()}>
            <button className="lang-btn" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen}>
              {lang} <ChevronDown strokeWidth={1.3} className={langOpen ? "rot" : ""} />
            </button>
            {langOpen && (
              <div className="lang-menu glass" role="menu">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    role="menuitem"
                    className={l.code === lang ? "is-active" : ""}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    {l.name} <span>{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="account-btn" onClick={() => open({ type: "account" })}>
            <span className="d-only">{user ? user.name.split(" ")[0] : t("My Account")}</span>
            <span className="account-icon">
              <IconUser />
              {loans.some((l) => l.status === "active") && <i className="dot" />}
            </span>
          </button>
        </div>
      </motion.div>
      <LiquidFilter />
    </header>
  );
}
