"use client";

import { ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import Fluted from "./Fluted";
import { reveal } from "@/lib/motion";
import { IconInstagram, IconThreads, IconTiktok, IconYoutube, Logo } from "./Icons";
import { SubscribeForm } from "./Loyalty";
import { openTag } from "./Calculator";
import { scrollToId, useStore } from "@/lib/store";

type L = { label: string; act: () => void };

export default function Footer() {
  const { t, open } = useStore();
  const info = (key: string) => () => open({ type: "info", key });

  const main: L[] = [
    { label: "My Account", act: () => open({ type: "account" }) },
    { label: "Contacts", act: () => scrollToId("contacts") },
    { label: "About Us", act: info("about") },
  ];
  const cols: { title: string; act: () => void; items: L[] }[] = [
    {
      title: "Services",
      act: () => scrollToId("services"),
      items: [
        { label: "Credit products", act: () => scrollToId("services") },
        { label: "Consultation", act: () => scrollToId("contacts") },
        { label: "Loan calculator", act: () => scrollToId("calculator") },
        { label: "Prolongation", act: info("prolongation") },
        { label: "Early repayment", act: info("early-repayment") },
      ],
    },
    {
      title: "Support",
      act: () => scrollToId("support"),
      items: [
        { label: "FAQ", act: () => openTag("FAQ") },
        { label: "Licenses", act: info("licenses") },
        { label: "Help", act: info("help") },
        { label: "All documents", act: info("documents") },
        { label: "Requirements", act: info("requirements") },
      ],
    },
    {
      title: "Events",
      act: () => scrollToId("events"),
      items: [
        { label: "Referral programs", act: info("referral") },
        { label: "Univeraries", act: info("anniversaries") },
        { label: "Raffles", act: info("raffles") },
        { label: "Promo codes", act: info("promo") },
      ],
    },
  ];

  const socials = [
    { Icon: IconInstagram, href: "https://www.instagram.com/", label: "Instagram" },
    { Icon: IconTiktok, href: "https://www.tiktok.com/", label: "TikTok" },
    { Icon: IconThreads, href: "https://www.threads.net/", label: "Threads" },
    { Icon: IconYoutube, href: "https://www.youtube.com/", label: "YouTube" },
  ];

  return (
    <footer className="footer">
      <div className="footer-bg">
        <Fluted preset="footer" />
      </div>
      <motion.div {...reveal(0, 30)} className="footer-inner">
        <div className="footer-left">
          <button className="footer-logo" onClick={() => scrollToId("home")} aria-label="Back to top">
            <Logo />
          </button>
          <div className="drop">
            <h3 className="h-xs drop-title">{t("Get drop alerts")}</h3>
            <p className="small-muted">{t("Receive monthly updates on new credit products and premium rates.")}</p>
            <SubscribeForm source="drop-alerts" className="drop-form" />
          </div>
        </div>

        <div className="footer-right">
          <div className="footer-cols">
            <div className="fcol fcol-main">
              {main.map((l) => (
                <button key={l.label} onClick={l.act}>
                  {t(l.label)}
                </button>
              ))}
            </div>
            {cols.map((c) => (
              <div className="fcol" key={c.title}>
                <button className="fcol-title" onClick={c.act}>
                  {t(c.title)}
                </button>
                {c.items.map((l) => (
                  <button key={l.label} className="fcol-item" onClick={l.act}>
                    {t(l.label)}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-contacts">
            <a href="mailto:velox@gmail.com">velox@gmail.com</a>
            <a href="tel:+14552945618">+1 (455) 294-56-18</a>
            <div className="socials">
              {socials.map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      <div className="footer-legal m-only">
        {[
          ["Privacy Policy", "privacy"],
          ["Terms of Use", "terms-of-use"],
          ["Licensee Info", "licensee"],
          ["HIPAA & Security", "hipaa"],
        ].map(([l, k]) => (
          <button key={k} className="inline-link" onClick={info(k)}>
            {t(l)}
          </button>
        ))}
      </div>
      <p className="copyright">© 2026 Velox Financial Technologies, Inc. {t("All rights reserved.")}</p>
      <p className="disclaimer m-only">
        {t(
          "Loans offered are subject to qualification criteria, credit reviews, and safe-borrowing guidelines. Services may not be available in all jurisdictions.",
        )}
      </p>
      <button className="to-top m-only" onClick={() => scrollToId("home")}>
        {t("To the Top")} <ChevronUp strokeWidth={1.3} />
      </button>
    </footer>
  );
}
