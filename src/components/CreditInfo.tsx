"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import { ARTICLES } from "@/lib/content";
import { reveal } from "@/lib/motion";
import SplitHeading from "./SplitHeading";
import { useStore } from "@/lib/store";

export default function CreditInfo() {
  const { t } = useStore();
  const [tag, setTag] = useState("Consequences");
  const [expanded, setExpanded] = useState(false);
  const a = ARTICLES.find((x) => x.tag === tag)!;

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<string>).detail;
      if (ARTICLES.some((x) => x.tag === d)) {
        setTag(d);
        setExpanded(true);
      }
    };
    window.addEventListener("velox:tag", on);
    return () => window.removeEventListener("velox:tag", on);
  }, []);

  return (
    <section className="credit section" id="support">
      <div className="credit-left">
        <motion.div {...reveal(0, 0)}>
          <SplitHeading className="h-xl" text={t("What do you need to know about credit?")} />
          <p className="lead credit-lead">
            {t("We strongly recommend that you familiarize yourself with our rules before purchasing a credit product.")}
          </p>
        </motion.div>
        <motion.div {...reveal(0.15)} className="credit-tags">
          <p className="tags-title">{t("Go to the page for the tag:")}</p>
          <div className="tags">
            {ARTICLES.map((x) => (
              <button
                key={x.tag}
                className={`tag ${x.tag === tag ? "is-active" : ""}`}
                onClick={() => {
                  setTag(x.tag);
                  setExpanded(false);
                }}
              >
                {t(x.tag)}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div {...reveal(0.2)} className="credit-right">
        <article key={tag} className={`article ${expanded ? "is-expanded" : ""}`}>
          <h3 className="h-md">{t(a.title)}</h3>
          {a.paragraphs.map((p, i) => (
            <p key={i} className="article-p">
              {t(p)}
            </p>
          ))}
          <h4 className="h-sm article-sub">{t(a.subtitle)}</h4>
          <ul className="bullets article-list">
            {a.bullets.map((b, i) => (
              <li key={i}>{t(b)}</li>
            ))}
          </ul>
        </article>
        <div className="credit-foot">
          <span className="reading">
            {t("Reading")} <Clock strokeWidth={1.4} /> {a.reading}
          </span>
          <button className="btn btn-primary" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? t("Show Less") : t("Learn More")}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
