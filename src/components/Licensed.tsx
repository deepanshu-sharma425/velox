"use client";

import { Cog, Earth, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { cardReveal, reveal } from "@/lib/motion";
import { useTilt } from "@/lib/useTilt";
import SplitHeading from "./SplitHeading";

const CARDS = [
  {
    key: "certified",
    icon: ShieldCheck,
    title: "Fully Certified",
    text: "We operate under official financial licenses and strict regulatory standards, ensuring 100% legal protection for every transaction and contract.",
  },
  {
    key: "smart",
    icon: Cog,
    title: "Smart Solutions",
    text: "We utilize advanced automated algorithms to process your applications instantly. This eliminates traditional banking stress and guarantees quick funding.",
  },
  {
    key: "scale",
    icon: Earth,
    title: "Proven Scale",
    text: "We have grown into a leading digital credit network over years of market presence. Millions in securely processed loans confirm our top global reputation.",
  },
];

function LicCard({ c, i }: { c: (typeof CARDS)[number]; i: number }) {
  const { t, open } = useStore();
  const tilt = useTilt(6);
  return (
    <motion.article
      {...cardReveal(i)}
      className="lic glass"
      style={tilt.style}
      whileHover={{ y: -6, transition: { duration: 0.35 } }}
      {...tilt.handlers}
    >
      <motion.span className="tilt-glare" style={{ background: tilt.glare }} aria-hidden />
      <h3 className="lic-title">
        <c.icon strokeWidth={1.3} /> {t(c.title)}
      </h3>
      <p className="lic-text">{t(c.text)}</p>
      <button className="inline-link lic-more" onClick={() => open({ type: "info", key: c.key })}>
        {t("Learn more")}
      </button>
    </motion.article>
  );
}

export default function Licensed() {
  const { t, open } = useStore();
  return (
    <section className="licensed section" id="about">
      <div className="licensed-head">
        <motion.div {...reveal()}>
          <SplitHeading className="h-xl" text={t("A licensed financial partner you can trust")} />
          <p className="lead licensed-lead">
            {t("We have spent years building a digital ecosystem where transparency and data security come first")}
          </p>
        </motion.div>
        <motion.button {...reveal(0.2)} className="btn btn-primary d-only" onClick={() => open({ type: "info", key: "about" })}>
          {t("About Us")}
        </motion.button>
      </div>
      <div className="licensed-grid">
        {CARDS.map((c, i) => (
          <LicCard key={c.key} c={c} i={i} />
        ))}
      </div>
      <button className="btn btn-primary m-only licensed-m-btn" onClick={() => open({ type: "info", key: "about" })}>
        {t("About Us")}
      </button>
    </section>
  );
}
